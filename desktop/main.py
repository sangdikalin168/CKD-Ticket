"""CKD Ticket desktop entry point — pywebview host, replacing the Electron shell.

Same shape as CKD-Check-In/main.py, which has been running this way for a while:
a native window wrapping the React SPA, with a Python object exposed to JS for
the things a browser cannot do (fingerprint reader, silent receipt printing).

Where the UI comes from, in priority order:
  1. $CKD_URL                       explicit override
  2. http://localhost:5173          when CKD_DEV=1 (Vite dev server)
  3. "url" in config.json           normal production setting
  4. bundled frontend/dist          only if a bundle was shipped with the exe

Loading the SPA over http:// from the backend (which already serves
frontend/dist via express.static on :4000) is deliberate and is the one real
improvement over the Electron build. Electron packaged the bundle and loaded it
with loadFile(), making the renderer origin file:// — which is why its main.ts
had to set webSecurity:false and disable OutOfBlinkCors just to let GraphQL
calls reach :4000. Pointing at the server instead keeps everything same-origin,
so none of that is needed, and the desktop client can never drift from the
deployed UI.
"""
from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("ckd-desktop")

DEFAULT_URL = "http://localhost:4000"


def _base_dir() -> Path:
    """Directory to resolve bundled resources from (PyInstaller-aware)."""
    return Path(getattr(sys, "_MEIPASS", Path(__file__).parent))


def _config() -> dict:
    """config.json sits next to the exe so a counter PC can be repointed
    without a rebuild. Missing or malformed file is not fatal.

    Recognised keys: url, title, width, height, maximized, fullscreen.
    A till that should never be minimised can set {"fullscreen": true}.
    """
    for candidate in (Path(sys.executable).parent / "config.json",
                      _base_dir() / "config.json",
                      Path(__file__).parent / "config.json"):
        try:
            if candidate.is_file():
                # utf-8-sig, not utf-8: Notepad and PowerShell's `-Encoding utf8`
                # both write a UTF-8 BOM on Windows, and json.loads rejects it
                # ("Unexpected UTF-8 BOM"). Reading as utf-8 meant a hand-edited
                # config was silently ignored and every default applied instead.
                cfg = json.loads(candidate.read_text(encoding="utf-8-sig"))
                log.info("config loaded from %s", candidate)
                return cfg
        except Exception:
            # Loud, because the failure mode is otherwise invisible: the app
            # starts fine, just pointed at the wrong URL with the wrong geometry.
            log.error("IGNORING malformed config at %s", candidate, exc_info=True)
    return {}


def _resolve_url(cfg: dict) -> str:
    if os.environ.get("CKD_URL"):
        return os.environ["CKD_URL"]
    if os.environ.get("CKD_DEV") == "1":
        return os.environ.get("CKD_DEV_URL", "http://localhost:5173")
    if cfg.get("url"):
        return str(cfg["url"])

    bundled = _base_dir() / "frontend" / "dist" / "index.html"
    if bundled.is_file():
        log.info("no url configured — falling back to the bundled SPA at %s", bundled)
        return str(bundled)

    log.info("no url configured and no bundle present — defaulting to %s", DEFAULT_URL)
    return DEFAULT_URL


def _allow_camera_on_plain_http(url: str) -> None:
    """Let the webcam work when the SPA is loaded over plain http from the LAN.

    Chromium only exposes getUserMedia on secure contexts (https or localhost),
    so a till pointed at http://192.168.1.20:4000 can show photos but not take
    them. The Electron shell dodged this with webSecurity off. WebView2 reads
    extra Chromium switches from this environment variable, so mark just that
    one origin as secure. No-op for https and localhost URLs.
    """
    from urllib.parse import urlsplit

    parts = urlsplit(url)
    if parts.scheme != "http" or parts.hostname in (None, "localhost", "127.0.0.1"):
        return
    flag = f"--unsafely-treat-insecure-origin-as-secure=http://{parts.netloc}"
    existing = os.environ.get("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "")
    if flag not in existing:
        os.environ["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = f"{existing} {flag}".strip()
    log.info("camera allowed on plain-http origin http://%s", parts.netloc)


def main() -> None:
    # A frozen build has no python.exe to spawn, so the fingerprint sidecar is
    # re-entered through this same exe. Must be the first thing checked: the
    # child speaks newline-JSON on stdout and must not print anything else.
    if "--fp-sidecar" in sys.argv:
        from ckd_desktop import fp_enroll

        fp_enroll.main()
        return

    import webview

    from ckd_desktop.api import JsApi
    from ckd_desktop import updater
    from ckd_desktop.version import __version__

    cfg = _config()
    url = _resolve_url(cfg)
    dev = os.environ.get("CKD_DEV") == "1"

    log.info("CKD Ticket %s — loading %s", __version__, url)
    _allow_camera_on_plain_http(url)

    # Update check runs in the background against the same server the UI comes
    # from, so a till needs no extra configuration. It only ever STAGES a new
    # exe; the swap happens on exit (see the end of this function), never while
    # a cashier is mid-sale. Disable per machine with CKD_NO_UPDATE=1.
    if os.environ.get("CKD_NO_UPDATE") != "1" and url.startswith("http"):
        updater.start_background_check(url)

    api = JsApi()
    window = webview.create_window(
        title=cfg.get("title", "CKD Ticket"),
        url=url,
        js_api=api,
        # The tills are 1366x768. These match what Electron used, but they are
        # only the restored-down size: the window starts maximized, so on a
        # 1366x768 screen it fills the work area rather than standing 768px tall
        # plus a title bar and running off the bottom of the display.
        width=int(cfg.get("width", 1366)),
        height=int(cfg.get("height", 768)),
        maximized=bool(cfg.get("maximized", True)),
        # Must stay under 1366x768 or the window cannot be restored down on the
        # tills at all.
        min_size=(1024, 600),
        fullscreen=bool(cfg.get("fullscreen", False)),
        text_select=False,
    )
    webview.start(api.attach, window, debug=dev)
    api.detach()

    # Last thing before the process ends: if a verified newer exe is staged,
    # hand off to a batch file that waits for us to exit, swaps it in and
    # relaunches. Returns False (and does nothing) when there is no update.
    if os.environ.get("CKD_NO_UPDATE") != "1":
        updater.apply_if_staged()


if __name__ == "__main__":
    main()
