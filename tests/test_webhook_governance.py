"""The signal webhook asks the core governance gate for its own source id first.

The ``webhooks`` scope (``kiro_crew.webhook_sources``) names the inbound sources a
policy permits. ``app.json`` declares ``permissions.webhookSource``, so the id is this
app's name, ``ops-mission-control``. The webhook provider asks the gateway's
``ctx.webhook_source`` seam when it has one, and ``source_refusal`` by name on an
older gateway, before its own switch, token or signature checks, so a policy that
does not name the source refuses it, and an enterprise build refuses it with no
policy at all (RFC crew-enterprise-edition, appendix Red "Webhooks by source").
"""

from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from backend import _host
from backend.providers import webhook
from kiro_crew.platform.governance import parse_policy

EDITIONS = ("oss", "enterprise")


def _set_edition(monkeypatch: pytest.MonkeyPatch, value: str) -> bool:
    monkeypatch.setattr("kiro_crew.edition.EDITION", value)
    return value == "enterprise"


def _install_policy(monkeypatch: pytest.MonkeyPatch, *allowed: str) -> None:
    from kiro_crew.platform import context as pc
    from kiro_crew.platform import governance_profiles

    doc = {
        "version": 1,
        "boot": {"fail_closed": True},
        "webhooks": {"mode": "allow", "allow": list(allowed)},
    }
    ctx = SimpleNamespace(governance=parse_policy(doc))
    monkeypatch.setattr(pc, "current_context", lambda: ctx)
    monkeypatch.setattr(governance_profiles, "resolve_active_scope", lambda *a, **k: None)


@pytest.mark.parametrize("edition", EDITIONS)
def test_the_webhook_source_is_off_in_enterprise(monkeypatch, edition) -> None:
    enterprise = _set_edition(monkeypatch, edition)
    monkeypatch.setattr(webhook, "provider_enabled", lambda _id: False)

    accepted, detail = webhook.enqueue(b"{}", "sha256=x")

    assert accepted is False
    assert ("enterprise edition" in detail) is enterprise


@pytest.mark.parametrize("edition", EDITIONS)
def test_the_webhook_asks_its_own_source(monkeypatch, edition) -> None:
    _set_edition(monkeypatch, edition)
    monkeypatch.setattr(webhook, "provider_enabled", lambda _id: False)
    _install_policy(monkeypatch, "agent")
    accepted, detail = webhook.enqueue(b"{}", "sha256=x")
    assert accepted is False
    assert "refused by the security policy" in detail
    # Named: the app's own checks answer next.
    _install_policy(monkeypatch, "ops-mission-control")
    assert webhook.enqueue(b"{}", "sha256=x") == (False, "webhook source is not enabled")


class _Seam:
    def __init__(self, answer: str) -> None:
        self.answer = answer
        self.calls = 0

    def refusal(self) -> str:
        self.calls += 1
        return self.answer


def test_the_manifest_declares_the_webhook_source() -> None:
    manifest = json.loads((Path(__file__).parents[1] / "app.json").read_text(encoding="utf-8"))
    assert manifest["permissions"]["webhookSource"] is True
    assert manifest["name"] == _host.APP_NAME


def test_the_gateway_seam_answers_when_it_is_there(monkeypatch) -> None:
    monkeypatch.setattr(webhook, "provider_enabled", lambda _id: False)
    monkeypatch.setattr(webhook, "source_refusal", lambda _s: pytest.fail("asked by name"))
    refusing = _Seam("webhook source 'ops-mission-control' refused by the security policy")
    monkeypatch.setattr(_host, "_ctx", SimpleNamespace(webhook_source=refusing))
    assert webhook.enqueue(b"{}", "sha256=x") == (False, refusing.answer)
    permitting = _Seam("")
    monkeypatch.setattr(_host, "_ctx", SimpleNamespace(webhook_source=permitting))
    assert webhook.enqueue(b"{}", "sha256=x") == (False, "webhook source is not enabled")
    assert (refusing.calls, permitting.calls) == (1, 1)


def test_an_older_gateway_is_asked_by_name(monkeypatch) -> None:
    monkeypatch.setattr(webhook, "provider_enabled", lambda _id: False)
    asked: list[str] = []
    monkeypatch.setattr(webhook, "source_refusal", lambda s: asked.append(s) or "")
    for ctx in (None, SimpleNamespace(), SimpleNamespace(webhook_source=None)):
        monkeypatch.setattr(_host, "_ctx", ctx)
        assert _host.webhook_source() is None
        assert webhook.enqueue(b"{}", "sha256=x") == (False, "webhook source is not enabled")
    assert asked == [_host.APP_NAME] * 3
