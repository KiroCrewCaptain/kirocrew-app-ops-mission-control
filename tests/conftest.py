"""Test floor: the app root on ``sys.path``, an isolated host, a bound context.

* The gateway loads hook files into a synthetic package named after the app, so
  the backend never needs to be on ``sys.path`` there. A plain pytest run has no
  such loader, so the app root is put on the path and ``backend`` imports as a
  package.
* Kiro Crew (a pinned test dependency, ``tests/requirements.txt``) is the host the
  backend resolves through ``backend/_host.py``. Its data home and workspace are
  pinned to a throwaway directory BEFORE anything imports it, and again per test,
  so no test reads or writes the operator's real ``~/.kiro/crew``. Git runs with a
  session-owned global config with auto-maintenance off and without inherited
  repository variables, so a fixture repository never touches the operator's.
* Every test runs with a context bound the way ``register_routes`` binds the
  gateway's: the host's own scrubber, audit sink and embedder, and a data directory
  that follows ``KIROCREW_HOME``. A test that models a gateway without one of them
  replaces it.
"""

from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path

import pytest

APP_ROOT = Path(__file__).resolve().parent.parent
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

_SESSION_HOME = Path(tempfile.mkdtemp(prefix="kca-ops-mission-control-"))
os.environ["KIROCREW_HOME"] = str(_SESSION_HOME / "crew")
os.environ["KIROCREW_WORKSPACE"] = str(_SESSION_HOME / "workspace")
os.environ["XDG_CONFIG_HOME"] = str(_SESSION_HOME / "xdg")
_GIT_CONFIG = _SESSION_HOME / "gitconfig"
_GIT_CONFIG.write_text("[maintenance]\n\tauto = false\n[gc]\n\tauto = 0\n", encoding="utf-8")
os.environ["GIT_CONFIG_GLOBAL"] = str(_GIT_CONFIG)
os.environ["GIT_CONFIG_NOSYSTEM"] = "1"
for _name in (
    "GIT_DIR",
    "GIT_INDEX_FILE",
    "GIT_WORK_TREE",
    "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES",
    "GIT_COMMON_DIR",
):
    os.environ.pop(_name, None)


def pytest_unconfigure(config: pytest.Config) -> None:
    shutil.rmtree(_SESSION_HOME, ignore_errors=True)


@pytest.fixture(autouse=True)
def _isolated_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    home = tmp_path / "kirocrew-home"
    monkeypatch.setenv("KIROCREW_HOME", str(home))
    monkeypatch.setenv("KIROCREW_WORKSPACE", str(tmp_path / "kirocrew-workspace"))
    return home


@pytest.fixture(autouse=True)
def bound_ctx(_isolated_home: Path):
    """The context ``register_routes`` would bind, for every test."""
    from tests.harness import make_ctx

    from backend import _host

    ctx = make_ctx()
    previous = _host.context()
    _host.bind(ctx)
    yield ctx
    _host.bind(previous)
