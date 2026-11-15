"""Where the provider tokens live, and how the built-in's store is carried over.

The built-in kept the tokens at ``<data home>/ops_mission_control_secrets.json``, a leaf
Kiro Crew's own tables mask. This copy keeps them in ``<data dir>/secrets/secrets.json``
and declares ``secrets/`` in ``credentialMasks``, so the sandbox hides the whole
directory. A record adopted from the built-in must keep every token, and the built-in's
file stays on disk as the backup a downgrade reads, kept equal to the store, so a
revoked token leaves no copy behind.
"""

from __future__ import annotations

import json
import os
import shutil
import stat
import unittest
from pathlib import Path
from unittest import mock

import pytest

from backend import _host, secrets
from kiro_crew.testing.synthetic_credentials import github_classic

APP_ROOT = Path(__file__).resolve().parent.parent


def _home() -> Path:
    return Path(os.environ["KIROCREW_HOME"])


def _seed_legacy(doc: object) -> Path:
    legacy = secrets.legacy_secrets_path()
    legacy.parent.mkdir(parents=True, exist_ok=True)
    legacy.write_text(json.dumps(doc), encoding="utf-8")
    return legacy


class TestWhereTheStoreLives(unittest.TestCase):
    def test_the_store_is_in_the_declared_mask_directory_of_the_data_dir(self) -> None:
        manifest = json.loads((APP_ROOT / "app.json").read_text(encoding="utf-8"))
        self.assertIn(f"{secrets.SECRETS_DIRNAME}/", manifest["credentialMasks"])
        path = secrets.secrets_path()
        self.assertEqual(path.name, secrets.SECRETS_FILENAME)
        self.assertEqual(path.parent.name, secrets.SECRETS_DIRNAME)
        self.assertEqual(path.parent.parent, _host.app_data_dir())

    def test_the_host_masks_the_directory_of_an_installed_copy(self) -> None:
        """The host's own grammar and reader take the declaration as a directory leaf."""
        from kiro_crew.apps import credential_masks

        installed = _home() / "apps" / _host.APP_NAME
        installed.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(APP_ROOT / "app.json", installed / "app.json")
        credential_masks.clear_cache()
        try:
            leaves = credential_masks.declared_crew_dir_leaves()
        finally:
            credential_masks.clear_cache()
        self.assertIn(f"apps/{_host.APP_NAME}/data/{secrets.SECRETS_DIRNAME}", leaves)

    def test_the_backup_name_is_still_on_the_hosts_secret_floor(self) -> None:
        from kiro_crew import security

        self.assertIn(secrets.LEGACY_SECRETS_FILENAME, security._CREW_SECRET_LEAVES)
        self.assertTrue(security.is_sensitive_path(str(secrets.legacy_secrets_path())))

    @unittest.skipIf(os.name == "nt", reason="POSIX modes; Windows gets an owner-only DACL")
    def test_the_directory_and_the_store_are_owner_only(self) -> None:
        secrets.KeystoneFileBackend().put("pagerduty", "token", "pd-value")
        path = secrets.secrets_path()
        self.assertEqual(stat.S_IMODE(path.parent.stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)


class TestTheBuiltInsStoreIsCarriedOver(unittest.TestCase):
    def setUp(self) -> None:
        self.token = github_classic(seed=11)
        self.doc = {"pagerduty": {"token": self.token}, "datadog": {"api_key": "dd-value"}}

    def test_every_token_is_carried_and_the_backup_is_left_as_it_was(self) -> None:
        legacy = _seed_legacy(self.doc)
        before = legacy.read_bytes()

        self.assertEqual(secrets.get_secret("pagerduty", "token"), self.token)

        self.assertEqual(secrets.secrets_path().read_bytes(), before)
        self.assertEqual(legacy.read_bytes(), before)
        self.assertTrue(secrets.has_secrets("datadog", ("api_key",)))

    def test_a_fresh_install_creates_no_backup(self) -> None:
        secrets.KeystoneFileBackend().put("pagerduty", "token", self.token)
        self.assertFalse(os.path.lexists(secrets.legacy_secrets_path()))
        self.assertEqual(secrets.get_secret("pagerduty", "token"), self.token)

    def test_the_carry_over_runs_once(self) -> None:
        """Once the data-directory store exists the backup is never read again."""
        legacy = _seed_legacy(self.doc)
        secrets.get_secret("pagerduty", "token")
        legacy.write_text(json.dumps({"pagerduty": {"token": "other"}}), encoding="utf-8")
        self.assertEqual(secrets.get_secret("pagerduty", "token"), self.token)

    def test_a_revoked_token_is_gone_from_both_copies_and_never_comes_back(self) -> None:
        legacy = _seed_legacy(self.doc)
        with mock.patch.object(secrets, "sel"):
            self.assertTrue(secrets.delete_secret("pagerduty"))
        self.assertEqual(secrets.get_secret("pagerduty", "token"), "")
        for path in (secrets.secrets_path(), legacy):
            with self.subTest(path=path.name):
                text = path.read_text(encoding="utf-8")
                self.assertNotIn(self.token, text)
                self.assertIn("dd-value", text)

    def test_a_save_keeps_the_backup_equal_to_the_store(self) -> None:
        legacy = _seed_legacy(self.doc)
        rotated = github_classic(seed=12)
        with mock.patch.object(secrets, "sel"):
            secrets.put_secret("pagerduty", "token", rotated)
        self.assertEqual(legacy.read_bytes(), secrets.secrets_path().read_bytes())
        self.assertNotIn(self.token, legacy.read_text(encoding="utf-8"))

    def test_a_first_save_carries_the_store_before_it_writes(self) -> None:
        """A save before any lookup must not publish a store without the built-in's tokens."""
        _seed_legacy(self.doc)
        secrets.KeystoneFileBackend().put("incidentio", "api_key", "io-value")
        stored = json.loads(secrets.secrets_path().read_text(encoding="utf-8"))
        self.assertEqual(stored["pagerduty"], {"token": self.token})
        self.assertEqual(stored["incidentio"], {"api_key": "io-value"})

    def test_an_unreadable_backup_is_carried_verbatim_and_never_overwritten(self) -> None:
        legacy = secrets.legacy_secrets_path()
        legacy.parent.mkdir(parents=True, exist_ok=True)
        legacy.write_text('{"pagerduty": {"token": "trunc', encoding="utf-8")
        before = legacy.read_bytes()

        self.assertEqual(secrets.get_secret("pagerduty", "token"), "")
        self.assertTrue(secrets.store_unreadable())
        with self.assertRaises(secrets.CorruptDocumentError):
            secrets.KeystoneFileBackend().put("datadog", "api_key", "dd-value")

        self.assertEqual(secrets.secrets_path().read_bytes(), before)
        self.assertEqual(legacy.read_bytes(), before)

    def test_a_failed_carry_over_reads_the_backup_in_place_and_retries(self) -> None:
        _seed_legacy(self.doc)
        with mock.patch.object(secrets, "atomic_write", side_effect=OSError(28, "full")):
            self.assertEqual(secrets.get_secret("pagerduty", "token"), self.token)
        self.assertFalse(os.path.lexists(secrets.secrets_path()))
        self.assertEqual(secrets.get_secret("pagerduty", "token"), self.token)
        self.assertTrue(secrets.secrets_path().is_file())

    def test_a_failed_carry_over_abandons_a_save(self) -> None:
        legacy = _seed_legacy(self.doc)
        before = legacy.read_bytes()
        with mock.patch.object(secrets, "atomic_write", side_effect=OSError(13, "denied")):
            with self.assertRaises(OSError):
                secrets.KeystoneFileBackend().put("datadog", "api_key", "new")
        self.assertFalse(os.path.lexists(secrets.secrets_path()))
        self.assertEqual(legacy.read_bytes(), before)

    def test_a_revoke_retried_after_a_failed_backup_rewrite_clears_the_backup(self) -> None:
        legacy = _seed_legacy(self.doc)
        backend = secrets.KeystoneFileBackend()
        backend.get("pagerduty", "token")
        with mock.patch.object(
            secrets, "publish_through_auth_store_staging", side_effect=OSError(5, "io")
        ):
            with self.assertRaises(OSError):
                backend.delete("pagerduty")
        self.assertIn(self.token, legacy.read_text(encoding="utf-8"))

        self.assertTrue(backend.delete("pagerduty"))
        self.assertNotIn(self.token, legacy.read_text(encoding="utf-8"))
        self.assertFalse(backend.delete("pagerduty"))


@pytest.mark.parametrize("seeded", [True, False])
def test_a_pinned_store_never_reads_the_live_home(tmp_path: Path, seeded: bool) -> None:
    if seeded:
        _seed_legacy({"pagerduty": {"token": "live"}})
    backend = secrets.KeystoneFileBackend(tmp_path / "pinned" / "s.json")
    assert backend.get("pagerduty", "token") == ""
    assert not (tmp_path / "pinned" / "s.json").exists()
