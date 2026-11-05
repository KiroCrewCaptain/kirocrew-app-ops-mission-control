"""Only the host shim reaches Kiro Crew, only through ``importlib``, and only by its table.

The gateway's public surface for an app is the ``AppContext`` its hooks get and the
structural route records the registry accepts. Ops Mission Control also calls gateway
functions no App Kit seam provides yet (the keystone secret store, the sandbox, the
credential floor, webhook governance, signed plugin admission, the shared vector store;
PORTING.md lists each). Those are resolved from the running gateway in
``backend/_host.py`` alone, by name through ``importlib``, each with a refusing
stand-in, so a missing one refuses the work instead of breaking the module load. No
other backend module may import ``kiro_crew`` in any form or name one of its modules,
and the shim has no ``kiro_crew`` import statement. The table is pinned here, so a new
reach into the host cannot be added without this test (and PORTING.md) changing.
"""

from __future__ import annotations

import ast
import re
import tempfile
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
_SHIM = "_host.py"

#: surface -> (module, names). Each row is a gap PORTING.md names with the seam it needs.
PINNED_HOST_FUNCTIONS: dict[str, tuple[str, tuple[str, ...]]] = {
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
    "security": ("kiro_crew.security", ("get_credential_patterns",)),
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
    "vector_memory": ("kiro_crew.vector_memory", ("VectorMemoryStore",)),
    "memory_config": ("kiro_crew.config.loader", ("KiroCrewConfig",)),
    "memory_sections": ("kiro_crew.config.memory_sections", ("memory_writes_off_key",)),
    "embeddings": (
        "kiro_crew.embeddings",
        ("PRIORITY_INTERACTIVE", "EmbeddingWork", "embedding_work"),
    ),
}


def _host_imports(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    found: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found += [a.name for a in node.names if a.name.split(".")[0] == "kiro_crew"]
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            if node.module.split(".")[0] == "kiro_crew":
                found.append(node.module)
        elif isinstance(node, ast.Call):
            name = getattr(node.func, "attr", None) or getattr(node.func, "id", None)
            if name in {"import_module", "__import__"} and node.args:
                arg = node.args[0]
                if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                    if arg.value.split(".")[0] == "kiro_crew":
                        found.append(arg.value)
    return found


def _host_strings(path: Path) -> list[str]:
    """String literals naming a ``kiro_crew`` module (what the resolver is handed)."""
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    return [
        node.value
        for node in ast.walk(tree)
        if isinstance(node, ast.Constant)
        and isinstance(node.value, str)
        and re.fullmatch(r"kiro_crew(\.[a-z_]+)*", node.value)
    ]


class TestNoHostImports(unittest.TestCase):
    def test_no_backend_module_but_the_host_shim_reaches_kiro_crew(self) -> None:
        files = sorted(BACKEND.rglob("*.py"))
        self.assertTrue(files, "no backend modules found")
        for path in files:
            if path.name == _SHIM and path.parent == BACKEND:
                continue
            with self.subTest(module=path.relative_to(BACKEND.parent).as_posix()):
                self.assertEqual(_host_imports(path), [])
                self.assertEqual(_host_strings(path), [])

    def test_the_host_shim_has_no_import_statement_for_kiro_crew(self) -> None:
        self.assertEqual(_host_imports(BACKEND / _SHIM), [])

    def test_the_host_table_is_pinned(self) -> None:
        from backend import _host

        self.assertEqual(_host.HOST_FUNCTIONS, PINNED_HOST_FUNCTIONS)
        self.assertEqual(set(_host._STAND_INS), set(PINNED_HOST_FUNCTIONS))
        for surface, (_module, names) in PINNED_HOST_FUNCTIONS.items():
            with self.subTest(surface=surface):
                self.assertEqual(set(_host._STAND_INS[surface]), set(names))

    def test_the_shim_names_only_modules_in_its_table(self) -> None:
        named = set(_host_strings(BACKEND / _SHIM))
        self.assertEqual(named, {module for module, _names in PINNED_HOST_FUNCTIONS.values()})

    def test_every_pinned_name_exists_on_the_pinned_kiro_crew(self) -> None:
        """A rename in Kiro Crew shows up here, not as a quiet stand-in in production."""
        from backend import _host

        self.assertEqual(_host.missing(), [])

    def test_the_scan_sees_each_import_form(self) -> None:
        """The detector itself: every spelling it must catch is caught."""
        source = (
            "import kiro_crew\n"
            "import kiro_crew.apps as a\n"
            "from kiro_crew.executors import run_in_embed_pool\n"
            "import importlib\n"
            "importlib.import_module('kiro_crew.embeddings')\n"
            "__import__('kiro_crew')\n"
            "from . import kiro_crew_like\n"
            "import kiro_crewish\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "probe.py"
            path.write_text(source, encoding="utf-8")
            self.assertEqual(
                _host_imports(path),
                [
                    "kiro_crew",
                    "kiro_crew.apps",
                    "kiro_crew.executors",
                    "kiro_crew.embeddings",
                    "kiro_crew",
                ],
            )


if __name__ == "__main__":
    unittest.main()
