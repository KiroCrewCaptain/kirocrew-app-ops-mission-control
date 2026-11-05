"""Every way this app reaches the gateway fails CLOSED when the gateway lacks it.

``backend/_host.py`` feature-detects the App Kit seams on the hook context and
resolves the gateway functions that have no seam yet, each with a stand-in. These
tests take each one away and check the app refuses rather than weakening: no owner
gate refuses the owner too, no scrubber masks the text, no secret store holds no
secret, no sandbox starts no child, no governance answer admits no webhook, no
admission loads no companion, and a route that needs a missing function answers a
coded 503 instead of running without it.
"""

from __future__ import annotations

import inspect
import json
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from backend import _host, routes
from tests.harness import make_ctx, mount


def _request() -> web.Request:
    return mock.MagicMock(spec=web.Request)


class TestTheContextSeams(unittest.IsolatedAsyncioTestCase):
    async def test_no_owner_seam_refuses_everyone(self) -> None:
        _host.bind(SimpleNamespace())
        refusal = await _host.require_owner(_request(), "put_secret")
        assert refusal is not None
        self.assertEqual(refusal.status, 403)
        self.assertEqual(json.loads(refusal.text or "{}")["code"], "owner_only")

    async def test_the_owner_seam_gets_the_bare_operation(self) -> None:
        seen: list[str] = []

        async def gate(_request: web.Request, operation: str) -> None:
            seen.append(operation)

        _host.bind(SimpleNamespace(require_owner=gate))
        self.assertIsNone(await _host.require_owner(_request(), "put_secret"))
        self.assertEqual(seen, ["put_secret"])

    async def test_the_hosts_refusal_is_returned_unchanged(self) -> None:
        refusal = web.json_response({"code": "owner_only"}, status=403)

        async def gate(_request: web.Request, _operation: str) -> web.Response:
            return refusal

        _host.bind(SimpleNamespace(require_owner=gate))
        self.assertIs(await _host.require_owner(_request(), "put_settings"), refusal)

    def test_no_scrubber_masks_every_string(self) -> None:
        _host.bind(SimpleNamespace())
        self.assertEqual(_host.redact_via_context("disk full on db-1"), _host.MASK)
        self.assertEqual(_host.redact_via_context(""), "")

    def test_a_scrubber_that_returns_no_text_masks(self) -> None:
        scrub = SimpleNamespace(outbound=lambda _t: SimpleNamespace(text=None))
        _host.bind(SimpleNamespace(scrub=scrub))
        self.assertEqual(_host.redact_via_context("x"), _host.MASK)

    def test_a_scrubber_that_raises_publishes_nothing(self) -> None:
        def broken(_text: str) -> None:
            raise RuntimeError("companion did not compose")

        _host.bind(SimpleNamespace(scrub=SimpleNamespace(outbound=broken)))
        with self.assertRaises(RuntimeError):
            _host.redact_via_context("x")

    def test_the_hosts_scrubber_removes_a_credential(self) -> None:
        _host.bind(make_ctx())
        text = "token AKIAIOSFODNN7EXAMPLE leaked"
        self.assertNotIn("AKIAIOSFODNN7EXAMPLE", _host.redact_via_context(text))

    def test_the_audit_row_goes_to_the_seam_with_the_apps_verb(self) -> None:
        record = mock.MagicMock()
        _host.bind(SimpleNamespace(audit=SimpleNamespace(record=record)))
        _host.sel().log_api_access(
            caller="core:ops-mission-control",
            operation="incident.action",
            outcome="denied",
            resources="inc-1",
            error="no rule",
        )
        record.assert_called_once_with("incident.action", "denied", resources="inc-1", error="no rule")

    def test_no_audit_seam_never_raises(self) -> None:
        _host.bind(SimpleNamespace())
        with self.assertLogs(_host.logger, level="WARNING"):
            _host.sel().log_api_access(operation="x", outcome="allowed")

    def test_an_audit_seam_that_raises_never_breaks_the_operation(self) -> None:
        def boom(*_a: object, **_k: object) -> None:
            raise RuntimeError("sel down")

        _host.bind(SimpleNamespace(audit=SimpleNamespace(record=boom)))
        _host.sel().log_api_access(operation="x", outcome="allowed")

    def test_no_embed_seam_means_no_vectors(self) -> None:
        _host.bind(SimpleNamespace())
        self.assertIsNone(_host.embed_fn())
        embed = SimpleNamespace(embed_sync=lambda _t: [0.0])
        _host.bind(SimpleNamespace(embed=embed))
        self.assertIs(_host.embed_fn(), embed.embed_sync)

    def test_the_data_dir_is_the_contexts_and_only_this_apps(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp) / "apps" / "ops-mission-control" / "data"
            _host.bind(make_ctx(fixed_data_dir=data))
            self.assertEqual(_host.app_data_dir(), data)
            self.assertTrue(data.is_dir())
            with self.assertRaises(_host.HostUnavailable):
                _host.app_data_dir("another-app")

    def test_sdk_level_reads_only_an_int(self) -> None:
        self.assertEqual(_host.sdk_level(SimpleNamespace()), 0)
        self.assertEqual(_host.sdk_level(SimpleNamespace(sdk_level=True)), 0)
        self.assertEqual(_host.sdk_level(SimpleNamespace(sdk_level="1")), 0)
        self.assertEqual(_host.sdk_level(SimpleNamespace(sdk_level=1)), 1)


class TestEveryStandInRefuses(unittest.IsolatedAsyncioTestCase):
    async def test_each_callable_stand_in_raises_host_unavailable(self) -> None:
        for surface, names in _host._STAND_INS.items():
            for name, value in names.items():
                if not callable(value) or isinstance(value, type):
                    continue
                if surface in {"webhook_sources", "app_manager"}:
                    continue
                with self.subTest(name=f"{surface}.{name}"):
                    with self.assertRaises(_host.HostUnavailable):
                        result = value("x")
                        if inspect.isawaitable(result):
                            await result

    def test_the_sandbox_stand_ins_raise_the_class_the_app_catches(self) -> None:
        self.assertTrue(issubclass(_host._STAND_INS["sandbox"]["SandboxUnavailableError"], _host.HostUnavailable))
        with self.assertRaises(_host._STAND_INS["sandbox"]["SandboxUnavailableError"]):
            _host._STAND_INS["sandbox"]["sandboxed_spawn_argv"](["git", "status"])

    def test_no_governance_answer_admits_no_webhook(self) -> None:
        self.assertTrue(_host._STAND_INS["webhook_sources"]["source_refusal"]("ops-mission-control"))

    def test_no_enable_answer_is_disabled(self) -> None:
        self.assertFalse(_host._STAND_INS["app_manager"]["is_app_enabled"]("ops-mission-control"))

    def test_the_optional_features_are_absent_not_faked(self) -> None:
        for surface in ("vector_memory", "memory_config", "memory_sections", "embeddings"):
            with self.subTest(surface=surface):
                self.assertTrue(all(v is None for v in _host._STAND_INS[surface].values()))
        self.assertIsNone(_host._STAND_INS["notifications"]["NotificationPayload"])

    def test_host_name_refuses_a_missing_name(self) -> None:
        with mock.patch.object(_host, "_attr", return_value=None):
            with self.assertRaises(_host.HostUnavailable):
                _host.host_name("vector_memory", "VectorMemoryStore")


class TestAppBehaviourWithoutTheHostFunctions(unittest.IsolatedAsyncioTestCase):
    async def test_a_secret_write_without_the_store_is_a_coded_503_and_writes_nothing(self) -> None:
        from backend import secrets

        async def owner(_request: web.Request, _operation: str) -> None:
            return None

        ctx = make_ctx()
        ctx.require_owner = owner  # type: ignore[method-assign]
        _host.bind(ctx)
        app = web.Application()
        mount(app, ctx)
        client = TestClient(TestServer(app))
        await client.start_server()
        self.addAsyncCleanup(client.close)
        registry = SimpleNamespace(catalog=lambda: [SimpleNamespace(id="pagerduty", secret_fields=("api_token",))])
        with (
            mock.patch.object(routes, "get_registry", return_value=registry),
            mock.patch.object(secrets, "config_dir", _host._STAND_INS["config"]["config_dir"]),
            mock.patch.object(
                secrets,
                "publish_through_auth_store_staging",
                _host._STAND_INS["hidden_leaf_staging"]["publish_through_auth_store_staging"],
            ),
        ):
            resp = await client.put(
                "/api/apps/ops-mission-control/providers/pagerduty/secret",
                json={"field": "api_token", "value": "pd-token-value"},
            )
        self.assertEqual(resp.status, 503)
        self.assertEqual((await resp.json())["code"], "host_unsupported")
        # Nothing reached the real store: the data home holds no secret file.
        self.assertFalse(secrets.secrets_path().exists())

    def test_a_webhook_without_governance_is_refused(self) -> None:
        from backend.providers import webhook

        with mock.patch.object(webhook, "source_refusal", _host._STAND_INS["webhook_sources"]["source_refusal"]):
            ok, reason = webhook.enqueue(b'{"title": "disk full"}', "sig")
        self.assertFalse(ok)
        self.assertIn("fail-closed", reason)
        self.assertEqual(webhook.queue_depth(), 0)

    def test_a_companion_without_admission_is_never_loaded(self) -> None:
        from backend import companion

        ep = SimpleNamespace(name="acme", value="acme_ops:register", dist=None)
        with (
            mock.patch.object(companion, "seed_default_policy", _host._STAND_INS["admission"]["seed_default_policy"]),
            mock.patch.object(companion, "evaluate_admission", _host._STAND_INS["admission"]["evaluate_admission"]),
        ):
            allowed, _reason = companion._admitted(ep)  # type: ignore[arg-type]
        self.assertFalse(allowed)

    def test_without_the_shared_vector_store_dispatch_keeps_fingerprint_recall(self) -> None:
        from backend import dispatch

        claimed = SimpleNamespace(similar=[], matches=[])
        with mock.patch.object(_host, "_attr", return_value=None):
            dispatch._attach_similar_safely(claimed)  # must not raise
        self.assertEqual(claimed.similar, [])


if __name__ == "__main__":
    unittest.main()
