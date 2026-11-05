"""Serve the backend the way the gateway's RouteRegistry does, and build its context.

The registry mounts one catch-all at ``/api/apps/{app_name}/{path}``, matches the
remainder against each route record, injects path params into ``match_info`` and
calls ``handler(request, ctx)``. :func:`mount` does the same on a test's own
``web.Application``, with aiohttp's router doing the matching under the same
prefix, so a test request uses the URL a dashboard request uses.

:func:`make_ctx` builds the context at App Kit level 1 with the host's real
``ScrubSDK``, ``AuditSDK`` and ``EmbedSDK`` (Kiro Crew is a pinned test
dependency) and the host's own owner gate.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from aiohttp import web

APP_NAME = "ops-mission-control"
PREFIX = f"/api/apps/{APP_NAME}"


class FakeHealth:
    def __init__(self) -> None:
        self.status = "healthy"
        self.issues: list[str] = []

    def mark_degraded(self, issue: str) -> None:
        self.status = "degraded"
        self.issues.append(issue)


@dataclass
class FakeCtx:
    """The hook context, as ``AppContext`` shapes it, for one test."""

    name: str = APP_NAME
    sdk_level: int = 1
    scrub: Any = None
    audit: Any = None
    embed: Any = None
    http_app: Any = None
    health: FakeHealth = field(default_factory=FakeHealth)
    fixed_data_dir: Path | None = None

    async def require_owner(self, request: web.Request, operation: str) -> Any:
        """The host's own level-1 owner gate (``AppContext.require_owner``), unchanged."""
        from kiro_crew.apps.context import AppContext

        return await AppContext.require_owner(self, request, operation)  # type: ignore[arg-type]

    @property
    def data_dir(self) -> Path:
        """``<KIROCREW_HOME>/apps/ops-mission-control/data``, read on every access.

        The built-in's suite moves ``KIROCREW_HOME`` per test (often in ``setUp``),
        and the gateway's ``ctx.data_dir`` is that same directory, so the context
        follows the variable rather than freezing the first value.
        """
        if self.fixed_data_dir is not None:
            return self.fixed_data_dir
        return Path(os.environ["KIROCREW_HOME"]) / "apps" / APP_NAME / "data"


def make_ctx(**overrides: Any) -> FakeCtx:
    from kiro_crew.apps.audit_sdk import AuditSDK
    from kiro_crew.apps.embed_sdk import EmbedSDK
    from kiro_crew.apps.scrub_sdk import ScrubSDK

    values: dict[str, Any] = {
        "scrub": ScrubSDK(),
        "audit": AuditSDK(APP_NAME),
        "embed": EmbedSDK(),
    }
    values.update(overrides)
    return FakeCtx(**values)


def mount(app: web.Application, ctx: Any = None) -> Any:
    """Register the app's routes on *app* under its prefix, as the gateway does.

    Returns the context. With no *ctx*, the bound one (the autouse fixture's) is
    reused, so a test's own patches on it stay in force.
    """
    from backend import _host, routes

    if ctx is None:
        ctx = _host.context() or make_ctx()
    ctx.http_app = app
    for route in routes.register_routes(ctx):

        async def _dispatch(request: web.Request, _route=route) -> web.StreamResponse:
            return await _route.handler(request, ctx)

        app.router.add_route(route.method, PREFIX + route.path, _dispatch)
    return ctx
