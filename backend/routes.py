"""Ops Mission Control — backend routes.

App Kit contract: ``app.json`` names ``backend.routes:register_routes`` as the
``hooks.routes`` entry. ``register_routes(ctx)`` binds the hook context
(``_host.bind``) and returns one ``_host.Route`` record per route; the gateway's
route registry serves each path under ``/api/apps/ops-mission-control``, the
built-in's URLs, and takes them down when the app is disabled.

Secrets are **write-only** over this surface. ``PUT /providers/<id>/secret`` accepts
a token; nothing ever returns one. The read endpoints report only whether a field
is set.

This module is the surface's composition root; the handler bodies live in
``http_routes`` (its package docstring maps them). What stays HERE is what has to stay
addressable as ``routes``: the registration table, the audit writer,
the redaction floor (this module is the registered redaction sink for the ledger write
and for the agent tool's inbound body), the ledger indexer, a handler for each route whose projection calls a seam — it hands the
projection this module's CURRENT binding of each one — and three adapters that keep
``_schedule_verification``, ``_execute_stored_proposal`` and ``_settings_write_or_refuse``
callable with their historic signatures. The six routes whose projection calls no seam
register that projection directly.

The patchable seams are exactly ``get_registry``, ``_audit``,
``_safe_outbound``, ``put_secret``, ``delete_secret``, ``merge_provider_config``,
``_index_ledger_safely``, ``_scrub_inbound`` and ``_served_call`` (the last two are the
agent tool's: its inbound scrub, and the served handler an allowed call is answered by): ``mock.patch.object(routes, <seam>)`` reaches every call site that
reads one. Every other name it offers (``_authorize``, ``_sink_refuses``, ``_slot_state``, the
constants, the domain module objects, ...) is a re-export of the object its owner defines, or
one of the three adapters. Patching it here changes what ``routes.<name>`` returns, not what a
projection calls, so patch it on its owner — or, for a module object, THROUGH it
(``routes.rotation.is_primary`` patches the rotation module itself).
"""

from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable

from aiohttp import web

# Every domain module `routes` held stays an attribute of it, as the same module object: the
# suite patches THROUGH several (`routes.rotation.is_primary`, `routes.store.claim`, ...).
from . import (  # noqa: F401 -- historical module export
    companion,
    dispatch,
    handover,
    ledger,
    notify_out,
    policy_store,
    rotation,
    slack_out,
    slot_watch,
    store,
)
from .http_routes import (
    actions as actions_routes,
)
from .http_routes import board as board_routes
from .http_routes import (
    configuration as configuration_routes,
)
from .http_routes import ledger as ledger_routes
from .http_routes import (
    lifecycle as lifecycle_routes,
)
from .http_routes import (
    webhook as webhook_routes,
)
from .http_routes import agent_tool as agent_tool_routes
from .http_routes._shared import (  # noqa: F401 -- historical module export
    APP_NAME,
    _json_body,
    _NotABool,
    _require_bool,
    _slack_client,
    _store_read_refusal,
)
from .http_routes.actions import (  # noqa: F401 -- historical module export
    _MAX_NOTE_LEN,
    _authorize,
    _Authorized,
    _execute_authorized,
    _handle_proposals,
    _sink_refuses,
)
from .http_routes.board import (  # noqa: F401 -- historical module export
    MAX_INCIDENTS_RESPONSE,
    _handle_incident,
    _handle_incidents,
    _ledger_sync_status,
    _provider_dict,
    _slot_state,
    canonical_slot_key,
)
from .http_routes.configuration import (  # noqa: F401 -- historical module export
    _MAX_PROVIDER_ID_LEN,
    _MAX_REMOTE_LEN,
    _MAX_SECRET_LEN,
    _SAFE_BRANCH_RE,
    _SAFE_LOGIN_RE,
    _url_has_userinfo,
)
from .http_routes.ledger import (  # noqa: F401 -- served by name from ROUTE_TABLE
    _handle_get_ledger,
    _handle_ledger_contradictions,
)
from .http_routes.lifecycle import (  # noqa: F401 -- served by name from ROUTE_TABLE
    _handle_dispatch,
)
from .http_routes.webhook import (  # noqa: F401 -- historical module export
    _SPOOL_RETRY_AFTER_SECS,
    _WEBHOOK_AUTH_REJECTIONS,
    _WEBHOOK_PAYLOAD_REJECTIONS,
    _read_capped,
    _webhook_reject_status,
)
from .models import (  # noqa: F401 -- historical module export
    CLAIMED_BY_OPERATOR,
    DEFAULT_VERIFY_AFTER_SECS,
    EXPIRING_ACTIONS,
    MODE_ORDER,
    STATE_FIRING,
    STATE_OK,
    STATE_SUPPRESSED,
    STATUS_NEEDS_HUMAN,
    VALID_ACTIONS,
    VERIFIABLE_ACTIONS,
    VERIFY_NOT_CHECKABLE,
    VERIFY_PENDING,
    LedgerEntry,
    Signal,
    UnknownFieldError,
    resolve_silence_secs,
    utc_now_iso,
)
from .providers import (  # noqa: F401 -- historical module export
    merge_provider_config,
    provider_config,
    set_top_level,
)
from .providers import (  # noqa: F401 -- historical module export
    webhook as webhook_mod,
)
from .registry import get_registry
from .secrets import (  # noqa: F401 -- historical module export
    delete_secret,
    describe_secrets,
    put_secret,
    redact_tokens,
)
from . import _host
from ._host import CronStoreUnreadable  # noqa: F401 -- historical module export
from ._host import redact_via_context, sel

logger = logging.getLogger(__name__)

Handler = Callable[[web.Request], Awaitable[web.StreamResponse]]


# ---------------------------------------------------------------------------
# The audit writer and the redaction floor
# ---------------------------------------------------------------------------


def _audit(op: str, target: str, outcome: str, *, error: str = "") -> None:
    sel().log_api_access(
        caller=f"core:{APP_NAME}",
        operation=op,
        outcome=outcome,
        resources=target,
        error=error,
    )


def _safe_outbound(text: str) -> str:
    """The redaction floor for text this app publishes where it cannot take it back.

    An action note is agent- or operator-authored free text that becomes an
    acknowledgement comment, a resolve reason or a mute note **on someone else's system**,
    where we cannot unpublish it. It reached the sink verbatim: an agent that pasted a
    provider token into its diagnosis published that token into the provider's own comment
    thread. Found in review — the same shape as the Slack sink and the ledger write path,
    which were already covered while this one was not.

    The same floor covers the agent-authored ``diagnosis``/``resolution`` an incident
    persists and renders, and a learned pattern/fix before its content-addressed id is
    computed — ``ledger.jsonl`` is what ``ledger_sync`` pushes to the team's shared remote.
    This module is the registered redaction sink for that ledger write, which is why the
    floor is defined here and handed to the projections that call it.

    Both passes, and `redact_via_context` rather than `security.redact` directly, for the
    same reasons the ledger write path documents: the two redactors cover different token
    families, and the context shim makes a loaded companion's declared patterns apply while
    an enterprise host that fails to compose its companion fails CLOSED.
    """
    return redact_tokens(redact_via_context(text))


def _redact_json_strings(value: Any) -> Any:
    """Every string of decoded JSON, keys included, through ``redact_via_context``."""
    if isinstance(value, str):
        return redact_via_context(value)
    if isinstance(value, dict):
        return {_redact_json_strings(k): _redact_json_strings(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_redact_json_strings(item) for item in value]
    return value


def _scrub_inbound(value: Any) -> Any:
    """An agent tool call's decoded JSON body, scrubbed before any handler reads it.

    The declared schema saw ``body_json`` as one opaque string, where an escape like
    ``\\u200b`` is plain ASCII: the hidden character only materializes when the body is
    decoded. So the decoded body is walked through the host's hidden-character sanitizer
    first, then every string through the redaction pass, the built-in tool's two passes
    in the built-in's order. Ledger entries persist and sync to a team remote, so a
    credential quoted into a body is removed before it is written, not only on the way
    out. Raises :class:`_host.HostUnavailable` on a host without the sanitizer.
    """
    return _redact_json_strings(_host.sanitize_json_values(value))


def _served_call(method: str, path: str) -> _host.Handler:
    """The served handler (:func:`_served`) of the ``(method, path)`` row of :data:`ROUTE_TABLE`."""
    name = next(n for m, p, n in ROUTE_TABLE if (m, p) == (method, path))
    return _served(name)


def _index_ledger_safely() -> dict[str, int]:
    """Project new ledger entries into the vector store. Never raises.

    Resolves the store here rather than holding one open: an install with no vector
    store (model still downloading, or a deliberately minimal setup) must complete
    hygiene exactly as before. Mirrors ``dispatch._attach_similar_safely``.
    """
    from . import ledger_index

    store_obj = None
    try:
        KiroCrewConfig = _host.host_name("memory_config", "KiroCrewConfig")
        memory_writes_off_key = _host.host_name("memory_sections", "memory_writes_off_key")
        VectorMemoryStore = _host.host_name("vector_memory", "VectorMemoryStore")

        cfg = KiroCrewConfig.load()
        # This helper is the automatic writer's service boundary. Keep the gate
        # ahead of store construction: init creates or migrates memory.db, so a
        # disabled persistence switch must leave no write-side effect behind.
        # memory.writes_enabled stops it the same way as memory.persistence_enabled.
        if memory_writes_off_key(cfg.memory) is not None:
            return {"scanned": 0, "written": 0, "skipped": 0}
        store_obj = VectorMemoryStore(embedding_dim=cfg.memory.embedding_dim, config=cfg)
        store_obj.init()
        return ledger_index.import_pending(store_obj)
    except Exception:  # noqa: BLE001 — no store, or a broken one, is a supported state
        logger.debug(
            "ops-mission-control: ledger indexing unavailable; hygiene still ran",
            exc_info=True,
        )
        return {"scanned": 0, "written": 0, "skipped": 0}
    finally:
        if store_obj is not None:
            try:
                store_obj.close()
            except Exception:  # noqa: BLE001
                logger.debug("ops-mission-control: vector store close failed", exc_info=True)


# ---------------------------------------------------------------------------
# Handlers. A projection that calls a seam receives this module's binding of it on every
# call, which is what keeps `mock.patch.object(routes, <seam>)` reaching that call site.
# The projections that call no seam are re-exported above and registered as they are.
# ---------------------------------------------------------------------------


async def _handle_state(request: web.Request) -> web.StreamResponse:
    return await board_routes._handle_state(request, get_registry=get_registry)


async def _handle_handover(request: web.Request) -> web.StreamResponse:
    return await board_routes._handle_handover(request, get_registry=get_registry)


async def _handle_signals(request: web.Request) -> web.StreamResponse:
    return await board_routes._handle_signals(request, get_registry=get_registry)


async def _handle_providers(request: web.Request) -> web.StreamResponse:
    return await board_routes._handle_providers(request, get_registry=get_registry)


async def _handle_rotation(request: web.Request) -> web.StreamResponse:
    return await board_routes._handle_rotation(request, get_registry=get_registry)


async def _handle_transition(request: web.Request) -> web.StreamResponse:
    return await lifecycle_routes._handle_transition(
        request, _audit=_audit, _safe_outbound=_safe_outbound
    )


async def _handle_claim(request: web.Request) -> web.StreamResponse:
    return await lifecycle_routes._handle_claim(request, get_registry=get_registry, _audit=_audit)


async def _handle_action(request: web.Request) -> web.StreamResponse:
    return await actions_routes._handle_action(
        request, get_registry=get_registry, _audit=_audit, _safe_outbound=_safe_outbound
    )


async def _handle_propose(request: web.Request) -> web.StreamResponse:
    return await actions_routes._handle_propose(
        request, _audit=_audit, _safe_outbound=_safe_outbound
    )


async def _handle_decide_proposal(request: web.Request) -> web.StreamResponse:
    return await actions_routes._handle_decide_proposal(
        request, get_registry=get_registry, _audit=_audit, _safe_outbound=_safe_outbound
    )


async def _handle_put_provider_config(request: web.Request) -> web.StreamResponse:
    return await configuration_routes._handle_put_provider_config(
        request,
        get_registry=get_registry,
        merge_provider_config=merge_provider_config,
        _audit=_audit,
    )


async def _handle_put_settings(request: web.Request) -> web.StreamResponse:
    return await configuration_routes._handle_put_settings(request, _audit=_audit)


async def _handle_put_secret(request: web.Request) -> web.StreamResponse:
    return await configuration_routes._handle_put_secret(
        request, get_registry=get_registry, put_secret=put_secret
    )


async def _handle_delete_secret(request: web.Request) -> web.StreamResponse:
    return await configuration_routes._handle_delete_secret(request, delete_secret=delete_secret)


async def _handle_rotation_arm(request: web.Request) -> web.StreamResponse:
    return await configuration_routes._handle_rotation_arm(request, get_registry=get_registry)


async def _handle_post_ledger(request: web.Request) -> web.StreamResponse:
    return await ledger_routes._handle_post_ledger(
        request, _audit=_audit, _safe_outbound=_safe_outbound
    )


async def _handle_ledger_hygiene(request: web.Request) -> web.StreamResponse:
    return await ledger_routes._handle_ledger_hygiene(
        request, _audit=_audit, _index_ledger_safely=_index_ledger_safely
    )


async def _handle_delete_ledger(request: web.Request) -> web.StreamResponse:
    return await ledger_routes._handle_delete_ledger(request, _audit=_audit)


async def _handle_webhook(request: web.Request) -> web.StreamResponse:
    return await webhook_routes._handle_webhook(request, _audit=_audit)


async def _handle_agent_tool(request: web.Request) -> web.StreamResponse:
    return await agent_tool_routes._handle_agent_tool(
        request, _audit=_audit, _scrub_inbound=_scrub_inbound, _served_call=_served_call
    )


# ---------------------------------------------------------------------------
# Helpers that take seams, callable here with their historic signatures
# ---------------------------------------------------------------------------


def _schedule_verification(incident_id: str, action: str, duration_secs: Any) -> tuple[str, str]:
    return actions_routes._schedule_verification(incident_id, action, duration_secs, _audit=_audit)


async def _execute_stored_proposal(
    incident: Any, proposal: dict[str, Any], permit: _Authorized
) -> dict[str, Any]:
    return await actions_routes._execute_stored_proposal(
        incident,
        proposal,
        permit,
        get_registry=get_registry,
        _audit=_audit,
        _safe_outbound=_safe_outbound,
    )


async def _settings_write_or_refuse(
    fn: Any,
    *args: Any,
    code: str,
    applied: dict[str, Any],
    **kwargs: Any,
) -> web.Response | None:
    return await configuration_routes._settings_write_or_refuse(
        fn, *args, code=code, applied=applied, _audit=_audit, **kwargs
    )


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

#: ``(method, path below /api/apps/ops-mission-control, handler name in this module)``.
#: The registry serves each path under the app's own prefix, the built-in's URLs.
ROUTE_TABLE: tuple[tuple[str, str, str], ...] = (
    ("GET", "/state", "_handle_state"),
    ("GET", "/incidents", "_handle_incidents"),
    ("GET", "/incident", "_handle_incident"),
    ("POST", "/incident/transition", "_handle_transition"),
    ("POST", "/incident/claim", "_handle_claim"),
    ("POST", "/incident/action", "_handle_action"),
    # The propose loop: draft -> queue -> decide. Separate routes because they have
    # different authority: proposing changes nothing, deciding may write.
    ("POST", "/incident/propose", "_handle_propose"),
    ("POST", "/incident/proposal/decide", "_handle_decide_proposal"),
    ("GET", "/proposals", "_handle_proposals"),
    ("POST", "/dispatch", "_handle_dispatch"),
    ("GET", "/signals", "_handle_signals"),
    ("GET", "/handover", "_handle_handover"),
    ("GET", "/providers", "_handle_providers"),
    ("PUT", "/providers/{provider_id}/config", "_handle_put_provider_config"),
    ("PUT", "/providers/{provider_id}/secret", "_handle_put_secret"),
    ("DELETE", "/providers/{provider_id}/secret", "_handle_delete_secret"),
    ("PUT", "/settings", "_handle_put_settings"),
    ("GET", "/rotation", "_handle_rotation"),
    ("POST", "/rotation/arm", "_handle_rotation_arm"),
    ("GET", "/ledger", "_handle_get_ledger"),
    ("GET", "/ledger/contradictions", "_handle_ledger_contradictions"),
    ("POST", "/ledger", "_handle_post_ledger"),
    ("POST", "/ledger/hygiene", "_handle_ledger_hygiene"),
    ("DELETE", "/ledger", "_handle_delete_ledger"),
    ("POST", "/webhook", "_handle_webhook"),
    # The agent tool app.json declares (`agentTools`): the gateway posts each call here.
    ("POST", "/agent-tools", "_handle_agent_tool"),
)


def _served(name: str) -> _host.Handler:
    """The registry's ``(request, ctx)`` call, onto ``routes.<name>`` looked up per call.

    Looked up by name at call time so ``mock.patch.object(routes, "_handle_x")`` still
    reaches the served route, as it did when the built-in registered the function itself.
    A :class:`_host.HostUnavailable` from a refusing stand-in is answered as a 503
    ``host_unsupported``.
    """

    async def handler(request: web.Request, _ctx: Any) -> web.StreamResponse:
        try:
            return await globals()[name](request)
        except _host.HostUnavailable as exc:
            # A host function this route needs is missing, and its stand-in refused
            # before any write. Said so, rather than surfacing as a bare 500.
            logger.warning("ops-mission-control: %s refused: %s", name, exc)
            return web.json_response(
                {"ok": False, "error": str(exc), "code": "host_unsupported"}, status=503
            )

    handler.__name__ = name
    handler.__qualname__ = name
    return handler


def _report_health(ctx: Any) -> None:
    health = getattr(ctx, "health", None)
    mark = getattr(health, "mark_degraded", None)
    if not callable(mark):
        return
    level = _host.sdk_level(ctx)
    if level < _host.REQUIRED_SDK_LEVEL:
        mark(
            f"App Kit level {level} < {_host.REQUIRED_SDK_LEVEL}: the owner gate is missing, "
            "so every settings and secret write is refused"
        )
    absent = _host.missing()
    if absent:
        mark("host functions missing (each refuses): " + ", ".join(absent))


def register_routes(ctx: Any) -> list[_host.Route]:
    """The ``hooks.routes`` entry: bind *ctx* and return this app's route records.

    Disable takes the records down, so a disabled app answers 404 rather than the
    built-in's ``app_disabled`` 403.
    """
    _host.bind(ctx)
    _report_health(ctx)

    # Warm the provider registry HERE, before the first request, not on it.
    # `get_registry()` populates lazily: entry-point enumeration, signed-plugin admission
    # I/O and companion import all run on the first call. Every producer of that first call
    # is a request handler (`_handle_signals`, `_handle_claim`, …), so the discovery cost
    # landed on the event loop. The routes hook runs before the registry serves this app,
    # so paying it here keeps it off every request.
    #
    # Fail-open: a discovery fault must not fail the enable (`get_registry` already
    # swallows companion errors; this guards the enumeration around it).
    try:
        get_registry()
    except Exception:  # noqa: BLE001 — a discovery fault must not fail registration
        logger.exception("ops-mission-control: registry warm-up failed; will retry lazily")

    logger.info("ops-mission-control: routes registered")
    return [_host.Route(method, path, _served(name)) for method, path, name in ROUTE_TABLE]
