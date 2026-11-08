"""The ``ops_mission_control_api`` declaration as the host's field engine reads it.

The declaration (``app.json`` ``agentTools``) is what the gateway validates a call's
arguments against before it posts the call to ``POST /agent-tools``. Two planes are
pinned here, on any Kiro Crew this app supports, with or without a core tool of the
same name:

- the **declared schema**, run through the host's own ``build_tool_schema`` and field
  engine: an off-surface path, an unknown method or argument, and an oversized string
  are refused before the app is called. The pair, query and body rules the schema
  subset cannot say are the route's (``test_agent_tool_route.py``);
- the **gateway's internal-secret path sets** never admit the routes an agent must not
  reach: the configuration, secret, webhook-ingest and human-decision routes.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path
from typing import Any

from kiro_crew.apps.app_agent_tools import DeclaredTool, build_tool_schema
from kiro_crew.apps.manifest import AppManifest
from kiro_crew.dashboard.server import _MIXED_INTERNAL_API_PATHS, _STRICT_INTERNAL_API_PATHS
from kiro_crew.dashboard.token_auth import internal_path_matches
from kiro_crew.validation import ValidationError, validate_tool_args

_APP_JSON = Path(__file__).resolve().parents[1] / "app.json"


def _declared() -> DeclaredTool:
    manifest = AppManifest.from_json_file(_APP_JSON)
    (decl,) = manifest.agentTools.tools
    return DeclaredTool(app=manifest.name, route=manifest.agentTools.route, decl=decl)


class TestTheDeclaredSchema(unittest.TestCase):
    def _validate(self, **kwargs: Any) -> dict[str, Any]:
        return validate_tool_args(kwargs, build_tool_schema(_declared()))

    def test_a_valid_get_and_post_pass(self) -> None:
        self.assertEqual(self._validate(method="GET", path="/state")["path"], "/state")
        cleaned = self._validate(
            method="POST", path="/incident/transition", body_json='{"id": "INV-7"}'
        )
        self.assertEqual(cleaned["body_json"], '{"id": "INV-7"}')

    def test_off_surface_paths_and_full_urls_are_refused(self) -> None:
        for path in (
            "/incident/proposal/decide",
            "/settings",
            "/webhook",
            "/incident",
            "/api/apps/ops-mission-control/state",
        ):
            with self.subTest(path=path), self.assertRaises(ValidationError):
                self._validate(method="POST", path=path)

    def test_an_unknown_method_or_argument_is_refused(self) -> None:
        with self.assertRaises(ValidationError):
            self._validate(method="DELETE", path="/ledger")
        with self.assertRaises(ValidationError):
            self._validate(method="GET", path="/state", headers="x")

    def test_each_string_is_bounded(self) -> None:
        with self.assertRaises(ValidationError):
            self._validate(method="GET", path="/incidents", query="x" * 513)
        with self.assertRaises(ValidationError):
            self._validate(method="POST", path="/ledger", body_json="x" * 32_769)

    def test_the_declaration_is_json_the_host_parses(self) -> None:
        raw = json.loads(_APP_JSON.read_text(encoding="utf-8"))
        self.assertEqual(raw["agentTools"]["tools"][0]["name"], _declared().name)


class TestGatewayAdmission(unittest.TestCase):
    """The routes that stay dashboard-only (cookie or token), whatever the host version."""

    def test_sensitive_routes_are_not_admitted(self) -> None:
        for path in (
            "/api/apps/ops-mission-control",
            "/api/apps/ops-mission-control/agent-tools",
            "/api/apps/ops-mission-control/incident",
            "/api/apps/ops-mission-control/incident/propose",
            "/api/apps/ops-mission-control/incident/proposal/decide",
            "/api/apps/ops-mission-control/proposals",
            "/api/apps/ops-mission-control/providers",
            "/api/apps/ops-mission-control/providers/aws/secret",
            "/api/apps/ops-mission-control/providers/aws/config",
            "/api/apps/ops-mission-control/settings",
            "/api/apps/ops-mission-control/webhook",
            "/api/apps/ops-mission-control/config",
        ):
            with self.subTest(path=path):
                self.assertFalse(internal_path_matches(path, _MIXED_INTERNAL_API_PATHS))
                self.assertFalse(internal_path_matches(path, _STRICT_INTERNAL_API_PATHS))


if __name__ == "__main__":
    unittest.main()
