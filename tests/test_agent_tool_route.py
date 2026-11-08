"""The ``ops_mission_control_api`` agent tool, declared in ``app.json`` and served here.

The declaration (``agentTools``) is what the gateway lists and checks a call against;
``POST /agent-tools`` (``backend/http_routes/agent_tool.py``) is what decides the call.
Three properties are pinned:

- **Parity with the built-in's tool.** Against a Kiro Crew that still ships the core
  tool of the same name, the declaration carries its description, its argument names,
  enums and bounds, the route carries its allowlist and its query rule, and the channel
  hold is the operation core holds. Against one whose wheel copy serves the tool on the
  same seam, the declaration and the route's rules equal the wheel copy's. An agent sees
  one tool either way.
- **Every refusal lands before any handler runs**, and an allowed call is answered by
  the route's own handler, with the decoded body sanitized and redacted first.
- **The gateway's own path reaches it.** A call validated against the declaration by
  the host's field engine, posted to the host's ``/api/app-tools/call`` handler and
  dispatched by the host's ``RouteRegistry``, arrives at this route unchanged.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from unittest import mock

from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from backend import routes
from backend.http_routes import agent_tool
from backend.http_routes._shared import _json_body

from tests.harness import PREFIX, mount

APP_ROOT = Path(__file__).resolve().parents[1]
URL = f"{PREFIX}/agent-tools"


def _manifest() -> dict:
    return json.loads((APP_ROOT / "app.json").read_text(encoding="utf-8"))


def _declared() -> dict:
    return _manifest()["agentTools"]["tools"][0]


def _call(**arguments: str) -> dict:
    return {"tool": agent_tool.TOOL_NAME, "arguments": arguments}


class TestTheDeclaration(unittest.TestCase):
    def test_the_host_parses_and_validates_the_block(self) -> None:
        from kiro_crew.apps.manifest import AppManifest

        manifest = AppManifest.from_json_file(APP_ROOT / "app.json")
        self.assertEqual(manifest.agentTools.validate(manifest.name), [])
        self.assertEqual(manifest.agentTools.route, "agent-tools")
        self.assertEqual([t.name for t in manifest.agentTools.tools], [agent_tool.TOOL_NAME])

    def test_the_route_is_one_this_app_serves(self) -> None:
        route = "/" + _manifest()["agentTools"]["route"]
        self.assertIn(("POST", route, "_handle_agent_tool"), routes.ROUTE_TABLE)

    def test_the_tool_is_granted_by_the_manifest(self) -> None:
        self.assertIn(agent_tool.TOOL_NAME, _manifest()["permissions"]["mcpTools"])

    def test_the_path_enum_is_the_allowlist(self) -> None:
        props = _declared()["inputSchema"]["properties"]
        self.assertEqual(set(props["path"]["enum"]), {p for _, p in agent_tool.ALLOWED_CALLS})
        self.assertEqual(props["path"]["enum"], sorted(props["path"]["enum"]))
        self.assertEqual(set(props["method"]["enum"]), {m for m, _ in agent_tool.ALLOWED_CALLS})

    def test_the_agent_surface_is_exactly_what_the_sops_use(self) -> None:
        """A new entry must come WITH an SOP that needs it: the review speed bump."""
        self.assertEqual(
            agent_tool.ALLOWED_CALLS,
            frozenset(
                {
                    ("GET", "/state"),
                    ("GET", "/signals"),
                    ("GET", "/incidents"),
                    ("GET", "/handover"),
                    ("GET", "/rotation"),
                    ("GET", "/ledger"),
                    ("GET", "/ledger/contradictions"),
                    ("POST", "/dispatch"),
                    ("POST", "/incident/transition"),
                    ("POST", "/incident/claim"),
                    ("POST", "/incident/action"),
                    ("POST", "/rotation/arm"),
                    ("POST", "/ledger"),
                    ("POST", "/ledger/hygiene"),
                }
            ),
        )
        self.assertEqual(agent_tool.CHANNEL_HELD_OPERATIONS, frozenset({("POST", "/rotation/arm")}))

    def test_the_declared_bounds_are_the_routes(self) -> None:
        props = _declared()["inputSchema"]["properties"]
        self.assertEqual(props["query"]["maxLength"], agent_tool.MAX_QUERY_CHARS)
        self.assertEqual(props["body_json"]["maxLength"], agent_tool.MAX_BODY_CHARS)


class TestParityWithTheBuiltInTool(unittest.TestCase):
    """The tool of the same name as the pinned Kiro Crew ships it for the built-in.

    An older Kiro Crew runs it as a core tool (``mcp_tools/apps.py``, its validation
    schema and the ``channel.py`` hold); a newer one serves it from the wheel copy on
    the same ``agentTools`` seam as here. Either way an agent must see one tool.
    """

    @staticmethod
    def _core() -> dict | None:
        from kiro_crew.mcp_tools.apps import schemas

        return next((s for s in schemas() if s["name"] == agent_tool.TOOL_NAME), None)

    @staticmethod
    def _wheel_declared() -> dict:
        import kiro_crew

        wheel = Path(kiro_crew.__file__).parent / "apps" / "builtins" / "ops_mission_control"
        manifest = json.loads((wheel / "app.json").read_text(encoding="utf-8"))
        (tool,) = manifest["agentTools"]["tools"]
        return tool

    def test_description_arguments_and_enums_match(self) -> None:
        core, mine = self._core(), _declared()
        if core is None:
            self.assertEqual(mine, self._wheel_declared())
            return
        self.assertEqual(mine["description"], core["description"])
        self.assertEqual(mine["inputSchema"]["required"], core["inputSchema"]["required"])
        core_props = core["inputSchema"]["properties"]
        my_props = mine["inputSchema"]["properties"]
        self.assertEqual(set(my_props), set(core_props))
        for arg, prop in core_props.items():
            with self.subTest(arg=arg):
                self.assertEqual(my_props[arg]["type"], prop["type"])
                self.assertEqual(my_props[arg]["description"], prop["description"])
                self.assertEqual(my_props[arg].get("enum"), prop.get("enum"))

    def test_the_allowlist_the_query_rule_and_the_channel_hold_match(self) -> None:
        if self._core() is not None:
            from kiro_crew.channel import CHANNEL_AGENT_BLOCKED_DISPATCH_OPERATION as held
            from kiro_crew.validation_parts import app_schemas

            self.assertEqual(
                agent_tool.ALLOWED_CALLS, app_schemas.OPS_MISSION_CONTROL_ALLOWED_CALLS
            )
            self.assertEqual(agent_tool.QUERY_RE.pattern, app_schemas._OMC_QUERY_RE.pattern)
            self.assertEqual(agent_tool.MAX_BODY_CHARS, app_schemas._OMC_MAX_BODY)
            self.assertEqual(held[0], agent_tool.TOOL_NAME)
            self.assertEqual(agent_tool.CHANNEL_HELD_OPERATIONS, frozenset({(held[1], held[2])}))
            return
        from kiro_crew.apps.builtins.ops_mission_control.backend.http_routes import (
            agent_tool as wheel,
        )

        self.assertEqual(agent_tool.ALLOWED_CALLS, wheel.ALLOWED_CALLS)
        self.assertEqual(agent_tool.QUERY_RE.pattern, wheel.QUERY_RE.pattern)
        self.assertEqual(agent_tool.MAX_QUERY_CHARS, wheel.MAX_QUERY_CHARS)
        self.assertEqual(agent_tool.MAX_BODY_CHARS, wheel.MAX_BODY_CHARS)
        self.assertEqual(agent_tool.CHANNEL_HELD_OPERATIONS, wheel.CHANNEL_HELD_OPERATIONS)
        self.assertEqual(agent_tool.SESSION_KEY_HEADER, wheel.SESSION_KEY_HEADER)

    def test_the_title_is_the_cores(self) -> None:
        import kiro_crew

        titles = json.loads(
            (Path(kiro_crew.__file__).parent / "data" / "mcp_tool_titles.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(_declared()["title"], titles["kirocrew-core"][agent_tool.TOOL_NAME])

    def test_the_result_cap_is_the_built_ins(self) -> None:
        self.assertEqual(_declared()["maxResultChars"], 60_000)
        if self._core() is not None:
            import inspect

            from kiro_crew.mcp_tools import apps

            self.assertIn("_omc_cap = 60_000", inspect.getsource(apps.ops_mission_control_api))
        else:
            self.assertEqual(self._wheel_declared()["maxResultChars"], 60_000)


class TestTheRoute(unittest.IsolatedAsyncioTestCase):
    async def _post(self, body: object, headers: dict | None = None) -> tuple[int, dict]:
        app = web.Application()
        mount(app)
        async with TestClient(TestServer(app)) as client:
            resp = await client.post(URL, json=body, headers=headers or {})
            return resp.status, await resp.json()

    def _recording(self, name: str) -> tuple[mock._patch, list]:
        seen: list = []

        async def handler(request: web.Request) -> web.StreamResponse:
            seen.append(
                {
                    "method": request.method,
                    "path": request.path,
                    "query": dict(request.query),
                    "body": await _json_body(request) if request.method == "POST" else None,
                }
            )
            return web.json_response({"ok": True, "served": name})

        return mock.patch.object(routes, name, handler), seen

    async def test_a_body_that_is_not_one_call_is_refused(self) -> None:
        for body in ([], {"tool": agent_tool.TOOL_NAME}, {"tool": "x", "arguments": {}, "y": 1}):
            with self.subTest(body=body):
                status, payload = await self._post(body)
                self.assertEqual((status, payload["code"]), (400, "invalid_json"))

    async def test_another_tool_name_is_unknown(self) -> None:
        status, payload = await self._post({"tool": "design_tweak_update_thread", "arguments": {}})
        self.assertEqual((status, payload["code"]), (404, "unknown_tool"))

    async def test_arguments_outside_the_declaration_are_refused(self) -> None:
        for args in ({"method": "GET", "path": "/state", "extra": "x"}, {"method": 1, "path": "/"}):
            with self.subTest(args=args):
                status, payload = await self._post({"tool": agent_tool.TOOL_NAME, "arguments": args})
                self.assertEqual((status, payload["code"]), (400, "invalid_arguments"))

    async def test_calls_off_the_surface_are_refused_before_any_handler(self) -> None:
        refused = [
            _call(method="POST", path="/state"),
            _call(method="GET", path="/incident/claim"),
            _call(method="POST", path="/incident/proposal/decide"),
            _call(method="POST", path="/settings"),
            _call(method="POST", path="/webhook"),
            _call(method="GET", path="/incident"),
            _call(method="GET", path="/api/apps/ops-mission-control/state"),
            _call(method="POST", path="/agent-tools"),
            _call(method="POST", path="/ledger", query="a=1"),
            _call(method="GET", path="/state", body_json='{"a": 1}'),
            _call(method="POST", path="/ledger", body_json="x" * (agent_tool.MAX_BODY_CHARS + 1)),
            _call(method="GET", path="/incidents", query="x" * (agent_tool.MAX_QUERY_CHARS + 1)),
        ] + [
            _call(method="GET", path="/incidents", query=bad)
            for bad in ("../incident/propose", "a=1?b=2", "x=1#frag", "a=/etc/passwd")
        ]
        served = [name for _m, _p, name in routes.ROUTE_TABLE if name != "_handle_agent_tool"]
        patches = [mock.patch.object(routes, n, mock.AsyncMock()) for n in served]
        for p in patches:
            p.start()
        try:
            for body in refused:
                with self.subTest(arguments=body["arguments"]):
                    status, payload = await self._post(body)
                    self.assertEqual((status, payload["code"]), (400, "invalid_arguments"))
            for name in served:
                getattr(routes, name).assert_not_awaited()
        finally:
            for p in patches:
                p.stop()

    async def test_a_body_that_is_not_a_json_object_is_refused(self) -> None:
        for raw in ("{not json", "[1, 2]", '"text"'):
            with self.subTest(body_json=raw):
                status, payload = await self._post(_call(method="POST", path="/ledger", body_json=raw))
                self.assertEqual((status, payload["code"]), (400, "invalid_arguments"))

    async def test_a_get_reaches_its_handler_with_its_query(self) -> None:
        patch, seen = self._recording("_handle_incidents")
        with patch:
            status, payload = await self._post(
                _call(method="GET", path="/incidents", query="status=investigating&id=INV-42")
            )
        self.assertEqual((status, payload), (200, {"ok": True, "served": "_handle_incidents"}))
        self.assertEqual(seen[0]["method"], "GET")
        self.assertEqual(seen[0]["path"], f"{PREFIX}/incidents")
        self.assertEqual(seen[0]["query"], {"status": "investigating", "id": "INV-42"})

    async def test_a_post_reaches_its_handler_with_the_decoded_body(self) -> None:
        patch, seen = self._recording("_handle_transition")
        with patch:
            status, _ = await self._post(
                _call(
                    method="POST",
                    path="/incident/transition",
                    body_json='{"id": "INV-42", "status": "resolved", "n": 3, "l": ["a"]}',
                )
            )
        self.assertEqual(status, 200)
        self.assertEqual(seen[0]["method"], "POST")
        self.assertEqual(
            seen[0]["body"], {"id": "INV-42", "status": "resolved", "n": 3, "l": ["a"]}
        )

    async def test_a_post_with_no_body_gets_an_empty_object(self) -> None:
        patch, seen = self._recording("_handle_dispatch")
        with patch:
            status, _ = await self._post(_call(method="POST", path="/dispatch", body_json=""))
        self.assertEqual(status, 200)
        self.assertEqual(seen[0]["body"], {})

    async def test_hidden_characters_and_credentials_are_scrubbed_on_the_way_in(self) -> None:
        """The schema sees ``body_json`` as one string, where ``\\u200b`` is plain ASCII."""
        secret = "AKIA" + "IOSFODNN7EXAMPLE"
        raw = json.dumps({"pat\u200btern": "x", "fix": f"key {secret[:4]}\u200b{secret[4:]}"})
        self.assertNotIn("\u200b", raw)  # escaped: invisible to a string-level sanitizer
        patch, seen = self._recording("_handle_post_ledger")
        with patch:
            status, _ = await self._post(_call(method="POST", path="/ledger", body_json=raw))
        self.assertEqual(status, 200)
        body = seen[0]["body"]
        self.assertIn("pattern", body)
        self.assertNotIn(secret, body["fix"])
        self.assertNotIn("\u200b", json.dumps(body, ensure_ascii=False))

    async def test_a_ledger_post_through_the_tool_writes_no_credential(self) -> None:
        from backend import ledger

        secret = "glpat-IOSFODNN7EXAMPLE"
        body = {"pattern": "assume-role denied", "fix": f"aws sts assume-role --key {secret}"}
        status, payload = await self._post(
            _call(method="POST", path="/ledger", body_json=json.dumps(body))
        )
        self.assertEqual(status, 200, payload)
        self.assertNotIn(secret, ledger.ledger_path().read_text(encoding="utf-8"))

    async def test_a_channel_agent_cannot_arm_the_rotation(self) -> None:
        patch, seen = self._recording("_handle_rotation_arm")
        with patch, mock.patch.object(routes, "_audit") as audit:
            status, payload = await self._post(
                _call(method="POST", path="/rotation/arm"),
                headers={agent_tool.SESSION_KEY_HEADER: "channel:slack:C1:1.2"},
            )
        self.assertEqual((status, payload["code"]), (403, "channel_agent_refused"))
        self.assertIn("channel agents", payload["error"])
        self.assertEqual(seen, [])
        audit.assert_called_once_with(
            "agent_tool", "POST /rotation/arm", "denied", error="channel agent"
        )

    async def test_a_channel_agent_keeps_the_read_surface(self) -> None:
        patch, seen = self._recording("_handle_rotation")
        with patch:
            status, _ = await self._post(
                _call(method="GET", path="/rotation"),
                headers={agent_tool.SESSION_KEY_HEADER: "channel:slack:C1:1.2"},
            )
        self.assertEqual(status, 200)
        self.assertEqual(len(seen), 1)

    async def test_any_other_session_arms_the_rotation(self) -> None:
        for key in ("cron:ops-mission-control-dispatch", "dashboard:abc", None):
            with self.subTest(session=key):
                patch, seen = self._recording("_handle_rotation_arm")
                headers = {agent_tool.SESSION_KEY_HEADER: key} if key else {}
                with patch:
                    status, _ = await self._post(
                        _call(method="POST", path="/rotation/arm"), headers=headers
                    )
                self.assertEqual(status, 200)
                self.assertEqual(len(seen), 1)

    async def test_every_allowed_call_answers_as_the_direct_route_does(self) -> None:
        """The real handlers, through :class:`agent_tool.AgentCall` and directly.

        A handler that reads a request attribute the call view lacks would answer 502
        (the registry's boundary) or 500 here, while its direct route answered.
        """
        app = web.Application()
        mount(app)
        async with TestClient(TestServer(app)) as client:
            for method, path in sorted(agent_tool.ALLOWED_CALLS):
                with self.subTest(call=f"{method} {path}"):
                    if method == "GET":
                        direct = await client.get(PREFIX + path)
                        args = {"method": method, "path": path}
                    else:
                        direct = await client.post(PREFIX + path, json={})
                        args = {"method": method, "path": path, "body_json": "{}"}
                    tool = await client.post(URL, json={"tool": agent_tool.TOOL_NAME, "arguments": args})
                    self.assertNotIn(tool.status, (500, 502), await tool.text())
                    self.assertEqual(tool.status, direct.status, await tool.text())
                    self.assertEqual(tool.content_type, direct.content_type)

    async def test_a_refusing_host_function_is_the_routes_own_503(self) -> None:
        from backend import _host

        async def refused(_request: web.Request) -> web.StreamResponse:
            raise _host.HostUnavailable("this Kiro Crew does not provide x")

        with mock.patch.object(routes, "_handle_state", refused):
            status, payload = await self._post(_call(method="GET", path="/state"))
        self.assertEqual((status, payload["code"]), (503, "host_unsupported"))

    async def test_no_sanitizer_refuses_a_body_rather_than_passing_it_raw(self) -> None:
        from backend import _host

        patch, seen = self._recording("_handle_post_ledger")
        with patch, mock.patch.object(
            _host, "sanitize_json_values", _host._STAND_INS["validation"]["sanitize_json_values"]
        ):
            status, payload = await self._post(
                _call(method="POST", path="/ledger", body_json='{"pattern": "p", "fix": "f"}')
            )
        self.assertEqual((status, payload["code"]), (503, "host_unsupported"))
        self.assertEqual(seen, [])


class TestTheGatewaysOwnPath(unittest.IsolatedAsyncioTestCase):
    """Field engine, ``POST /api/app-tools/call`` and ``RouteRegistry``: the host's own code."""

    async def test_a_validated_call_reaches_the_route_through_the_registry(self) -> None:
        from kiro_crew.apps import app_agent_tools
        from kiro_crew.apps.manifest import AppManifest
        from kiro_crew.apps.route_registry import RouteRegistry
        from kiro_crew.dashboard.handlers import app_agent_tools as handler_mod
        from kiro_crew.validation_parts.field_engine import validate_tool_args

        from tests.harness import make_ctx

        manifest = AppManifest.from_json_file(APP_ROOT / "app.json")
        declared = app_agent_tools.DeclaredTool(
            app=manifest.name, route=manifest.agentTools.route, decl=manifest.agentTools.tools[0]
        )
        arguments = validate_tool_args(
            {"method": "GET", "path": "/rotation"}, app_agent_tools.build_tool_schema(declared)
        )

        @web.middleware
        async def internal(request: web.Request, handler):  # type: ignore[no-untyped-def]
            request["internal_auth"] = True
            return await handler(request)

        from kiro_crew.apps import module_loader

        app = web.Application(middlewares=[internal])
        registry = RouteRegistry(app)
        ctx = make_ctx()
        # Unloading purges every module imported from the app's own files, including this
        # suite's ``backend``; put those back afterwards, as test_manifest_contract does.
        ours = {k: m for k, m in sys.modules.items() if k == "backend" or k.startswith("backend.")}
        # The operator's trust decision is not what this checks; the call path is.
        with mock.patch.object(module_loader, "app_execution_denied", return_value=None):
            await registry.register_app_routes(
                manifest.name, APP_ROOT, _manifest()["backend"]["hooks"]["routes"], ctx  # type: ignore[arg-type]
            )
        app.router.add_post("/api/app-tools/call", handler_mod.api_app_agent_tool_call)
        try:
            with mock.patch.object(
                app_agent_tools, "declared_tool", lambda name: declared if name == declared.name else None
            ), mock.patch.object(handler_mod, "get_app_manifest", lambda _n: manifest), mock.patch.object(
                handler_mod, "is_app_enabled", lambda _n: True
            ), mock.patch(
                "kiro_crew.apps.hooks_integration.get_route_registry", lambda: registry
            ):
                async with TestClient(TestServer(app)) as client:
                    ok = await client.post(
                        "/api/app-tools/call", json={"tool": declared.name, "arguments": arguments}
                    )
                    ok_body = await ok.json()
                    refused = await client.post(
                        "/api/app-tools/call",
                        json={
                            "tool": declared.name,
                            "arguments": {"method": "POST", "path": "/rotation/arm"},
                        },
                        headers={agent_tool.SESSION_KEY_HEADER: "channel:slack:C1:1.2"},
                    )
                    refused_body = await refused.json()
        finally:
            registry.deregister_app_routes(manifest.name)
            sys.modules.update(ours)
        self.assertEqual(ok.status, 200, ok_body)
        self.assertIn("tiers", json.dumps(ok_body))
        self.assertEqual((refused.status, refused_body["code"]), (403, "channel_agent_refused"))


if __name__ == "__main__":
    unittest.main()
