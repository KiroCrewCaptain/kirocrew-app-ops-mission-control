"""Every place this app reaches into the Kiro Crew gateway, in one module.

An external app's Python runs inside the gateway process. No other module under
``backend/`` names a ``kiro_crew`` module; what the app takes from the gateway
comes through this file, in three kinds:

1. **App Kit seams**, read off the hook context with ``getattr`` (feature-detected):

   - ``hooks.routes`` records: :class:`Route`, a local frozen dataclass a level-1
     ``RouteRegistry`` accepts structurally;
   - ``ctx.require_owner(request, operation)`` (level 1): the host's own owner
     gate. Without it every dashboard caller is refused, the owner included;
   - ``ctx.audit.record`` (level 0): the security event log, as
     :func:`sel` ``().log_api_access``. Rows read caller ``app:ops-mission-control``
     and operation ``ops-mission-control.<verb>``;
   - ``ctx.scrub.outbound`` (level 0): the outbound redaction pass, as
     :func:`redact_via_context`. With no scrubber every non-empty string is masked;
   - ``ctx.embed`` (level 1): the shared embedder, as :func:`embed_fn`. Without it
     the ledger has no vectors and recall is by fingerprint and keyword only;
   - ``ctx.data_dir``: the app's data directory, as :func:`app_data_dir`;
   - ``ctx.sdk_level``: reported by :func:`sdk_level` and in ``ctx.health``.

   The context is bound once per enable by ``routes.register_routes``
   (:func:`bind`), because the built-in's modules call these from deep inside
   the domain code, far from any handler.

2. **Host functions with no App Kit seam yet** (:data:`HOST_FUNCTIONS`). The
   built-in called them directly; dropping any would weaken the app (the keystone
   secret store, the sandbox every ``git`` / ``gh`` child runs in, the credential
   floor a ledger push is checked against, the webhook governance gate, signed
   plugin admission) or move where an existing user's data lives. They are
   resolved by name from the running gateway, one at a time, each with a stand-in
   for a gateway that lacks it. **Every stand-in refuses**: no secret store means
   no secret is read or written, no sandbox means no subprocess, no credential
   patterns means no push, no governance answer means no webhook, no admission
   means no companion. PORTING.md lists each as the generic seam Kiro Crew needs;
   ``tests/test_no_host_imports.py`` pins this table.

3. **The gateway's dashboard state**, read off ``request.app["state"]`` exactly as
   the built-in did (chat slots, the Slack client and session linker, the local
   notification bus and limiter, the cron service). Each use is feature-detected
   where it is read, in the module that reads it; PORTING.md lists them.

:func:`missing` names what the running gateway did not provide, and
``register_routes`` reports it through ``ctx.health``.
"""

from __future__ import annotations

import importlib
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Awaitable, Callable

from aiohttp import web

#: Must equal ``app.json`` ``name``.
APP_NAME = "ops-mission-control"

#: The App Kit seam level this app is written against.
REQUIRED_SDK_LEVEL = 1

#: What a string becomes when there is no scrubber to clean it.
MASK = "[REDACTED]"

logger = logging.getLogger(f"kirocrew.app.{APP_NAME}")

Handler = Callable[[web.Request, Any], Awaitable[web.StreamResponse]]


@dataclass(frozen=True)
class Route:
    """One ``hooks.routes`` record, accepted structurally by the gateway."""

    method: str
    path: str
    handler: Handler


class HostUnavailable(RuntimeError):
    """The running gateway does not provide a host function this work needs."""


# ── the bound hook context ──

_ctx: Any = None


def bind(ctx: Any) -> None:
    """Make *ctx* the context the domain modules read their seams from."""
    global _ctx
    _ctx = ctx


def context() -> Any:
    """The bound hook context, or ``None`` before the routes hook ran."""
    return _ctx


def sdk_level(ctx: Any = None) -> int:
    """The seam level the gateway reports; 0 for a gateway that predates the field."""
    level = getattr(ctx if ctx is not None else _ctx, "sdk_level", 0)
    return level if isinstance(level, int) and not isinstance(level, bool) else 0


def _owner_denied() -> web.Response:
    return web.json_response(
        {"error": "owner authorization required", "code": "owner_only"}, status=403
    )


async def require_owner(request: web.Request, operation: str) -> web.StreamResponse | None:
    """``None`` when the caller is the dashboard owner, else the refusal to return.

    *operation* is bare (``"put_secret"``): the host prefixes the app's own name
    when it audits a denial. A gateway without the seam refuses everyone.
    """
    gate = getattr(_ctx, "require_owner", None)
    if not callable(gate):
        return _owner_denied()
    return await gate(request, operation)


class _Audit:
    """``sel().log_api_access(...)`` over ``ctx.audit.record``.

    The built-in's call sites keep their shape. ``caller`` is dropped: the host
    attributes the row to this app itself, so an app cannot write a row as anyone
    else. Never raises, like the SEL write it replaces.
    """

    def log_api_access(
        self,
        *,
        operation: str,
        outcome: str,
        resources: str = "",
        error: str = "",
        caller: str = "",
        **_extra: Any,
    ) -> None:
        audit = getattr(_ctx, "audit", None)
        record = getattr(audit, "record", None)
        if not callable(record):
            logger.warning("ops-mission-control: no audit seam; an audit row was not written")
            return
        try:
            record(operation, outcome, resources=resources, error=error)
        except Exception:  # noqa: BLE001 - auditing must not break the operation
            logger.debug("ops-mission-control: audit record failed", exc_info=True)


_AUDIT = _Audit()


def sel() -> _Audit:
    """The audit writer (the name the built-in's call sites use)."""
    return _AUDIT


def redact_via_context(text: str) -> str:
    """``ctx.scrub.outbound(text).text``; every non-empty string masked without it.

    A host whose policy companion failed to compose raises from the scrubber;
    that propagates, so the caller publishes nothing, as the built-in's
    ``platform.context.redact_via_context`` did.
    """
    if not text:
        return text
    scrub = getattr(_ctx, "scrub", None)
    outbound = getattr(scrub, "outbound", None)
    if not callable(outbound):
        return MASK
    result = outbound(text)
    cleaned = getattr(result, "text", None)
    return cleaned if isinstance(cleaned, str) else MASK


def embed_fn() -> Callable[[str], list[float] | None] | None:
    """The shared embedder's blocking call (``ctx.embed.embed_sync``), or ``None``."""
    embed = getattr(_ctx, "embed", None)
    call = getattr(embed, "embed_sync", None)
    return call if callable(call) else None


def app_data_dir(name: str = APP_NAME) -> Path:
    """This app's data directory: ``ctx.data_dir``, created owner-only if absent.

    Before a context is bound (a unit test, an import-time read) it is the same
    ``<data home>/apps/<name>/data`` the host computes, through the host's own
    helper. Neither: refused, so nothing is written to a guessed location.
    """
    if name != APP_NAME:
        raise HostUnavailable(f"{APP_NAME} has no data directory for {name!r}")
    data_dir = getattr(_ctx, "data_dir", None)
    if isinstance(data_dir, Path):
        ensure_directory(data_dir)
        return data_dir
    host = _attr("kiro_crew.apps.manager", "app_data_dir")
    if host is None:
        raise HostUnavailable("this Kiro Crew does not provide the app data directory")
    return Path(host(name))


def app_root() -> Path:
    """This app's root directory (the parent of ``backend/``)."""
    return Path(__file__).resolve().parents[1]


def own_manifest() -> dict[str, Any] | None:
    """This app's own ``app.json``, read from the app's tree; ``None`` if unreadable."""
    try:
        raw = json.loads((app_root() / "app.json").read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError):
        return None
    return raw if isinstance(raw, dict) else None


# ── host functions with no App Kit seam yet ──
#
# surface -> (module the built-in imported it from, the names this app uses).
HOST_FUNCTIONS: dict[str, tuple[str, tuple[str, ...]]] = {
    "platform_compat": (
        "kiro_crew.platform_compat",
        (
            "acquire_lock",
            "release_lock",
            "file_lock",
            "open_create_or_existing",
            "chmod_safe",
            "kill_and_reap",
        ),
    ),
    "atomic_write": ("kiro_crew.atomic_write", ("atomic_write",)),
    "owner_only_files": (
        "kiro_crew.owner_only_files",
        ("ensure_directory", "owner_only_opener_for"),
    ),
    "config": ("kiro_crew.config.loader", ("config_dir",)),
    "hidden_leaf_staging": (
        "kiro_crew.hidden_leaf_staging",
        ("publish_through_auth_store_staging",),
    ),
    "sandbox": (
        "kiro_crew.sandbox",
        (
            "SandboxUnavailableError",
            "create_subprocess_limited",
            "sandboxed_spawn_argv",
            "sandboxed_spawn_argv_async",
            "run_limited",
        ),
    ),
    "security": ("kiro_crew.security", ("iter_credential_matches",)),
    "validation": ("kiro_crew.validation", ("sanitize_json_values",)),
    "webhook_sources": ("kiro_crew.webhook_sources", ("source_refusal",)),
    "admission": (
        "kiro_crew.platform.admission",
        ("evaluate_admission", "load_admission_policy", "seed_default_policy"),
    ),
    "app_manager": ("kiro_crew.apps.manager", ("is_app_enabled",)),
    "notifications": (
        "kiro_crew.notifications.bus",
        ("NotificationPayload", "NotificationValidationError"),
    ),
    "cron": ("kiro_crew.cron", ("CronStoreUnreadable",)),
    "vector_memory": (
        "kiro_crew.vector_memory",
        ("VectorMemoryStore",),
    ),
    "memory_config": (
        "kiro_crew.config.loader",
        ("KiroCrewConfig",),
    ),
    "memory_sections": ("kiro_crew.config.memory_sections", ("memory_writes_off_key",)),
    "embeddings": (
        "kiro_crew.embeddings",
        ("PRIORITY_INTERACTIVE", "EmbeddingWork", "embedding_work"),
    ),
}

#: The surfaces without which this app holds no provider secret and no policy.
REQUIRED_FOR_SECRETS: tuple[tuple[str, str], ...] = (
    ("config", "config_dir"),
    ("hidden_leaf_staging", "publish_through_auth_store_staging"),
    ("platform_compat", "file_lock"),
    ("platform_compat", "open_create_or_existing"),
)


def _attr(module_name: str, name: str) -> Any:
    try:
        module = importlib.import_module(module_name)
    except ImportError:
        return None
    return getattr(module, name, None)


def _refuse(name: str) -> Callable[..., Any]:
    def refused(*_args: Any, **_kwargs: Any) -> Any:
        raise HostUnavailable(f"this Kiro Crew does not provide {name}")

    refused.__name__ = f"refused_{name}"
    return refused


def _refuse_async(name: str) -> Callable[..., Awaitable[Any]]:
    async def refused(*_args: Any, **_kwargs: Any) -> Any:
        raise HostUnavailable(f"this Kiro Crew does not provide {name}")

    refused.__name__ = f"refused_{name}"
    return refused


class SandboxUnavailableStandIn(HostUnavailable):
    """Raised by the sandbox stand-ins: the gateway has no sandboxed spawn."""


class _CronStoreUnreadableStandIn(Exception):
    """Never raised: without the host's cron service there is no store to read."""


class _NotificationValidationStandIn(ValueError):
    """Never raised: without the host's bus no payload is built."""


def _sandbox_refused(name: str, *, is_async: bool) -> Callable[..., Any]:
    message = f"this Kiro Crew does not provide {name}"
    if is_async:

        async def refused_async(*_args: Any, **_kwargs: Any) -> Any:
            raise SandboxUnavailableStandIn(message)

        refused_async.__name__ = f"refused_{name}"
        return refused_async

    def refused(*_args: Any, **_kwargs: Any) -> Any:
        raise SandboxUnavailableStandIn(message)

    refused.__name__ = f"refused_{name}"
    return refused


def _no_webhooks(_source: str) -> str:
    return "webhooks governance unavailable on this Kiro Crew (fail-closed)"


def _never_enabled(_name: str) -> bool:
    return False


#: What each name is when the gateway lacks it. Every stand-in refuses.
_STAND_INS: dict[str, dict[str, Any]] = {
    "platform_compat": {
        "acquire_lock": _refuse("platform_compat.acquire_lock"),
        "release_lock": _refuse("platform_compat.release_lock"),
        "file_lock": _refuse("platform_compat.file_lock"),
        "open_create_or_existing": _refuse("platform_compat.open_create_or_existing"),
        "chmod_safe": _refuse("platform_compat.chmod_safe"),
        "kill_and_reap": _refuse_async("platform_compat.kill_and_reap"),
    },
    "atomic_write": {"atomic_write": _refuse("atomic_write")},
    "owner_only_files": {
        "ensure_directory": _refuse("owner_only_files.ensure_directory"),
        "owner_only_opener_for": _refuse("owner_only_files.owner_only_opener_for"),
    },
    "config": {"config_dir": _refuse("config_dir")},
    "hidden_leaf_staging": {
        "publish_through_auth_store_staging": _refuse("publish_through_auth_store_staging"),
    },
    "sandbox": {
        "SandboxUnavailableError": SandboxUnavailableStandIn,
        "create_subprocess_limited": _sandbox_refused("create_subprocess_limited", is_async=True),
        "sandboxed_spawn_argv": _sandbox_refused("sandboxed_spawn_argv", is_async=False),
        "sandboxed_spawn_argv_async": _sandbox_refused(
            "sandboxed_spawn_argv_async", is_async=True
        ),
        "run_limited": _sandbox_refused("run_limited", is_async=False),
    },
    "security": {"iter_credential_matches": _refuse("iter_credential_matches")},
    "validation": {"sanitize_json_values": _refuse("sanitize_json_values")},
    "webhook_sources": {"source_refusal": _no_webhooks},
    "admission": {
        "evaluate_admission": _refuse("evaluate_admission"),
        "load_admission_policy": _refuse("load_admission_policy"),
        "seed_default_policy": _refuse("seed_default_policy"),
    },
    "app_manager": {"is_app_enabled": _never_enabled},
    "notifications": {
        "NotificationPayload": None,
        "NotificationValidationError": _NotificationValidationStandIn,
    },
    "cron": {"CronStoreUnreadable": _CronStoreUnreadableStandIn},
    "vector_memory": {"VectorMemoryStore": None},
    "memory_config": {"KiroCrewConfig": None},
    "memory_sections": {"memory_writes_off_key": None},
    "embeddings": {"PRIORITY_INTERACTIVE": None, "EmbeddingWork": None, "embedding_work": None},
}


def _resolve(surface: str) -> SimpleNamespace:
    module_name, names = HOST_FUNCTIONS[surface]
    try:
        module: Any = importlib.import_module(module_name)
    except ImportError:
        module = None
    values: dict[str, Any] = {}
    provided: set[str] = set()
    for name in names:
        value = getattr(module, name, None) if module is not None else None
        if value is None:
            values[name] = _STAND_INS[surface][name]
        else:
            values[name] = value
            provided.add(name)
    return SimpleNamespace(**values, provided=frozenset(provided))


#: Resolved once, when the gateway loads this hook module.
SURFACES: dict[str, SimpleNamespace] = {name: _resolve(name) for name in HOST_FUNCTIONS}


def host_name(surface: str, name: str) -> Any:
    """*name* of *surface*, read from the gateway at call time; else :class:`HostUnavailable`.

    For the optional features (the shared vector store) whose callers already
    treat a missing store as a supported state. Read per call, as the built-in's
    deferred imports were, so the binding is the host's current one.
    """
    module_name, names = HOST_FUNCTIONS[surface]
    value = _attr(module_name, name) if name in names else None
    if value is None:
        raise HostUnavailable(f"this Kiro Crew does not provide {surface}.{name}")
    return value


def missing() -> list[str]:
    """``surface.name`` for every host function the gateway did not provide."""
    return [
        f"{surface}.{name}"
        for surface, (_module, names) in HOST_FUNCTIONS.items()
        for name in names
        if name not in SURFACES[surface].provided
    ]


def missing_for_secrets() -> list[str]:
    """The :data:`REQUIRED_FOR_SECRETS` names the gateway did not provide."""
    return [
        f"{surface}.{name}"
        for surface, name in REQUIRED_FOR_SECRETS
        if name not in SURFACES[surface].provided
    ]


# The names the domain modules import from here, each the gateway's own object
# or its refusing stand-in. A module binds them at its own import, so a test that
# patches ``<module>.<name>`` reaches that module's call sites, as it did in the
# built-in.
platform_compat = SURFACES["platform_compat"]
atomic_write = SURFACES["atomic_write"].atomic_write
ensure_directory = SURFACES["owner_only_files"].ensure_directory
owner_only_opener_for = SURFACES["owner_only_files"].owner_only_opener_for
config_dir = SURFACES["config"].config_dir
publish_through_auth_store_staging = SURFACES[
    "hidden_leaf_staging"
].publish_through_auth_store_staging
SandboxUnavailableError = SURFACES["sandbox"].SandboxUnavailableError
create_subprocess_limited = SURFACES["sandbox"].create_subprocess_limited
sandboxed_spawn_argv = SURFACES["sandbox"].sandboxed_spawn_argv
sandboxed_spawn_argv_async = SURFACES["sandbox"].sandboxed_spawn_argv_async
run_limited = SURFACES["sandbox"].run_limited
kill_and_reap = SURFACES["platform_compat"].kill_and_reap
iter_credential_matches = SURFACES["security"].iter_credential_matches
sanitize_json_values = SURFACES["validation"].sanitize_json_values
source_refusal = SURFACES["webhook_sources"].source_refusal
evaluate_admission = SURFACES["admission"].evaluate_admission
load_admission_policy = SURFACES["admission"].load_admission_policy
seed_default_policy = SURFACES["admission"].seed_default_policy
is_app_enabled = SURFACES["app_manager"].is_app_enabled
NotificationPayload = SURFACES["notifications"].NotificationPayload
NotificationValidationError = SURFACES["notifications"].NotificationValidationError
CronStoreUnreadable = SURFACES["cron"].CronStoreUnreadable
