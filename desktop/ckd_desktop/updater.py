"""Self-update for the packaged desktop host.

The SPA already updates itself — it is served from the backend, so a deploy
reaches every till on next page load. This module updates the thing a deploy
cannot touch: the exe around it (printing, fingerprint, the JS bridge).

Shape of it:

  1. On startup a background thread fetches <base>/desktop/latest.json.
  2. If it advertises a HIGHER version, the exe is downloaded to a temp file
     and its SHA-256 checked against the manifest. A mismatch is discarded.
  3. Nothing is swapped while the app runs — Windows will not let you replace
     a running exe. The verified file is left staged next to the current one.
  4. On exit, a throwaway .bat waits for this process to die, swaps the files,
     relaunches, and deletes itself.

So an update lands on the NEXT start, never mid-shift. That is deliberate: a
cashier should never have the window vanish with a queue at the counter.

Everything here is best-effort. No network, a broken manifest, a truncated
download or a locked file must all leave the till running the version it has.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import subprocess
import sys
import tempfile
import threading
import urllib.request
from pathlib import Path

from .version import __version__

log = logging.getLogger("ckd-desktop.updater")

MANIFEST_PATH = "/desktop/latest.json"
TIMEOUT = 20
CHUNK = 64 * 1024


def _parse(version: str) -> tuple:
    """'1.2.10' -> (1, 2, 10). Unparsable input sorts lowest so it never wins."""
    try:
        return tuple(int(p) for p in str(version).strip().split("."))
    except (TypeError, ValueError):
        return (-1,)


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def current_exe() -> Path:
    return Path(sys.executable).resolve()


def staged_path() -> Path:
    exe = current_exe()
    return exe.with_name(exe.stem + ".update" + exe.suffix)


def _fetch_manifest(base_url: str) -> dict | None:
    url = base_url.rstrip("/") + MANIFEST_PATH
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001 - offline is normal, not an error
        log.info("update check skipped (%s)", exc)
        return None


def _download(url: str, dest: Path, expected_sha256: str) -> bool:
    """Download to a temp file, verify, then move into place. Returns success."""
    # mkstemp hands back an OPEN descriptor. Leaving it open keeps a Windows
    # lock on the file, so the later replace() fails with WinError 32 and the
    # update silently never lands. Close it immediately and reopen by path.
    fd, tmp_name = tempfile.mkstemp(prefix="ckd-update-", suffix=".part")
    os.close(fd)
    tmp = Path(tmp_name)
    digest = hashlib.sha256()
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT) as resp, tmp.open("wb") as fh:
            while True:
                chunk = resp.read(CHUNK)
                if not chunk:
                    break
                digest.update(chunk)
                fh.write(chunk)

        actual = digest.hexdigest()
        if actual.lower() != expected_sha256.strip().lower():
            # A truncated or tampered download must never be staged.
            log.error("update rejected: sha256 %s != manifest %s", actual, expected_sha256)
            return False

        dest.unlink(missing_ok=True)
        tmp.replace(dest)
        log.info("update staged at %s", dest)
        return True
    except Exception:
        log.exception("update download failed")
        return False
    finally:
        # Never let cleanup raise: this whole path is best-effort, and a locked
        # temp file must not take down the app that called it.
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            log.debug("could not remove temp file %s", tmp)


def check_and_stage(base_url: str) -> None:
    """Fetch the manifest and stage a newer build. Safe to call in a thread."""
    if not is_frozen():
        log.info("not a frozen build — skipping update check")
        return

    manifest = _fetch_manifest(base_url)
    if not manifest:
        return

    latest = str(manifest.get("version", ""))
    if _parse(latest) <= _parse(__version__):
        log.info("up to date (running %s, published %s)", __version__, latest or "?")
        return

    sha = manifest.get("sha256")
    url = manifest.get("url")
    if not sha or not url:
        log.error("manifest missing url/sha256 — ignoring")
        return

    # Relative urls resolve against the app's own server.
    if url.startswith("/"):
        url = base_url.rstrip("/") + url

    log.info("update available: %s -> %s", __version__, latest)
    _download(url, staged_path(), sha)


def start_background_check(base_url: str) -> None:
    threading.Thread(
        target=check_and_stage, args=(base_url,), name="ckd-update", daemon=True
    ).start()


def apply_if_staged() -> bool:
    """Swap in a staged update and relaunch. Call last, as the app exits.

    Returns True if a swap was launched, in which case the caller should exit
    promptly so the batch file can replace the exe.
    """
    if not is_frozen():
        return False

    staged = staged_path()
    exe = current_exe()
    if not staged.is_file():
        return False

    # PowerShell would need an execution policy; cmd always runs.
    #
    # The loop matters: this process still holds a lock on its own exe for a
    # moment after main() returns, and PyInstaller's onefile bootloader also
    # has a temp dir to tear down. `del` retries until the handle is released
    # rather than racing it once and corrupting the install.
    script = f"""@echo off
setlocal
set "EXE={exe}"
set "NEW={staged}"
set /a tries=0
:wait
ping -n 2 127.0.0.1 >nul
del "%EXE%" >nul 2>&1
if exist "%EXE%" (
  set /a tries+=1
  if %tries% lss 30 goto wait
  echo could not replace %EXE% - leaving update staged
  goto done
)
move /y "%NEW%" "%EXE%" >nul 2>&1
if errorlevel 1 goto done
start "" "%EXE%"
:done
del "%~f0" >nul 2>&1
"""
    bat = Path(tempfile.gettempdir()) / "ckd-ticket-apply-update.bat"
    try:
        bat.write_text(script, encoding="ascii")
        subprocess.Popen(
            ["cmd", "/c", str(bat)],
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
            | getattr(subprocess, "DETACHED_PROCESS", 0),
            close_fds=True,
        )
        log.info("update will be applied on exit")
        return True
    except Exception:
        log.exception("could not launch the update swapper")
        return False


def status() -> dict:
    """Small summary the UI can display."""
    return {
        "version": __version__,
        "frozen": is_frozen(),
        "update_staged": is_frozen() and staged_path().is_file(),
    }
