"""Per-PC settings the UI can change, stored in config.json next to the exe.

main.py reads the same file for url / width / height at start-up; this module
only rewrites the keys the app changes at runtime (currently "printer") and
keeps everything else in the file as it was.
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

log = logging.getLogger("ckd-desktop.settings")


def config_path() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent / "config.json"
    return Path(__file__).resolve().parent.parent / "config.json"


def load() -> dict:
    path = config_path()
    try:
        if path.is_file():
            # utf-8-sig: tolerate the BOM Notepad / PowerShell write.
            return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception:
        log.exception("ignoring malformed %s", path)
    return {}


def get(key: str, default=None):
    return load().get(key, default)


def save(**patch) -> dict:
    """Merge the given keys into config.json (created if missing). Writes UTF-8
    without a BOM so main.py's reader and hand edits stay compatible."""
    cfg = load()
    for key, value in patch.items():
        if value is None:
            cfg.pop(key, None)
        else:
            cfg[key] = value
    path = config_path()
    path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    log.info("settings saved to %s: %s", path, list(patch))
    return cfg
