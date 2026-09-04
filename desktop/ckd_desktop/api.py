"""The object pywebview exposes to JavaScript.

Public methods here become window.pywebview.api.<name> in the page. bridge.js
then wraps them back into the window.electronAPI surface the React app already
calls, so the frontend needs no changes.

Fingerprint enrollment keeps the exact arrangement Electron used: fp_enroll.py
runs as a child process speaking newline-delimited JSON. It stays a subprocess
rather than an in-process import because a crash in the ZKFinger DLL then takes
down a child instead of the window the cashier is standing in front of.
"""
from __future__ import annotations

import json
import logging
import subprocess
import sys
import threading
from pathlib import Path

from . import printing, settings, updater

log = logging.getLogger("ckd-desktop.api")

_HERE = Path(__file__).resolve().parent


def _ok(**data) -> dict:
    return {"ok": True, **data}


def _err(message: str) -> dict:
    return {"ok": False, "error": message}


class JsApi:
    def __init__(self) -> None:
        self._window = None
        self._fp: "subprocess.Popen | None" = None
        self._pump: "threading.Thread | None" = None
        # Origin the SPA is served from; set by main.py. printing.py fetches
        # SumatraPDF from there when it is not installed on this PC.
        self.base_url = ""

    # ── lifecycle (called by main.py, not exposed to JS) ──────────────────
    def attach(self, window) -> None:
        self._window = window
        # On every document load, not just this first one: a reload or a full
        # navigation would otherwise drop the shim and the SPA would decide it
        # is running in a plain browser. bridge.js is idempotent, so the direct
        # call below and the event firing for the same load do no harm.
        window.events.loaded += self._inject_bridge
        self._inject_bridge()
        # Belt and braces: pywebview does not report every way a document can
        # be replaced (an <a href> in the SPA, F5, location.reload()). A cheap
        # probe every few seconds catches whatever the loaded event missed.
        self._watchdog_stop = threading.Event()
        threading.Thread(
            target=self._bridge_watchdog, name="bridge-watchdog", daemon=True
        ).start()

    def detach(self) -> None:
        stop = getattr(self, "_watchdog_stop", None)
        if stop is not None:
            stop.set()
        self._stop_fp()

    _BRIDGE_PROBE = "!!(window.electronAPI && window.electronAPI.__ckdPywebview)"

    def _bridge_present(self) -> bool:
        try:
            return bool(self._window.evaluate_js(self._BRIDGE_PROBE))
        except Exception as exc:
            log.debug("bridge probe failed: %s", exc)
            return False

    def _bridge_watchdog(self) -> None:
        lost = False
        while not self._watchdog_stop.wait(3.0):
            if self._window is None:
                continue
            if self._bridge_present():
                lost = False
                continue
            if self._watchdog_stop.is_set():
                break
            if not lost:
                log.warning("electronAPI bridge missing from the page — re-injecting")
                lost = True
            self._inject_bridge()

    def _inject_bridge(self) -> None:
        """Install the electronAPI shim.

        pywebview's own window.pywebview.api is not ready the instant the DOM
        is, so the shim is injected here (evaluate_js waits for the document)
        and again from the window's `loaded` event for later document loads.
        A SPA route change never reloads the document, but a refresh does.
        """
        try:
            js = (_HERE / "bridge.js").read_text(encoding="utf-8")
            self._window.evaluate_js(js)
            try:
                url = self._window.get_current_url()
            except Exception:
                url = "?"
            log.info("electronAPI bridge injected (present=%s) at %s", self._bridge_present(), url)
        except Exception:
            log.exception("failed to inject the electronAPI bridge")

    # ── JS API: printing ──────────────────────────────────────────────────
    def print_html(self, html: str, copies: int = 1) -> dict:
        try:
            return printing.print_html(html, copies=int(copies or 1), base_url=self.base_url)
        except Exception as exc:
            log.exception("print failed")
            return _err(str(exc))

    def preview_html(self, html: str) -> dict:
        try:
            return printing.render_pdf_only(html)
        except Exception as exc:
            log.exception("preview failed")
            return _err(str(exc))

    # ── JS API: printer settings (Printer page in the SPA) ────────────────
    def list_printers(self) -> dict:
        try:
            return _ok(
                printers=printing.list_printers(),
                default=printing.default_printer(),
                configured=settings.get("printer"),
            )
        except Exception as exc:
            log.exception("list printers failed")
            return _err(str(exc))

    def get_print_settings(self) -> dict:
        return _ok(
            printer=settings.get("printer"),
            default=printing.default_printer(),
            sumatra=printing.find_sumatra(),
        )

    def set_print_settings(self, printer: "str | None" = None) -> dict:
        try:
            settings.save(printer=(printer or None))
            return _ok(printer=settings.get("printer"))
        except Exception as exc:
            log.exception("saving print settings failed")
            return _err(str(exc))

    def print_test(self, printer: "str | None" = None) -> dict:
        try:
            return printing.print_test(printer, base_url=self.base_url)
        except Exception as exc:
            log.exception("test print failed")
            return _err(str(exc))

    # ── JS API: version / update ──────────────────────────────────────────
    def app_info(self) -> dict:
        """Version and whether an update is waiting to be applied on exit.

        Lets the SPA show "restart to update" without the host having to push
        anything at it.
        """
        return _ok(**updater.status())

    # ── JS API: fingerprint enrollment ────────────────────────────────────
    def fp_begin(self, customer_id: int) -> dict:
        try:
            customer_id = int(customer_id)
        except (TypeError, ValueError):
            return _err("invalid customer id")
        if customer_id <= 0:
            return _err("invalid customer id")

        try:
            self._ensure_fp()
            self._send({"cmd": "begin", "customer_id": customer_id})
            return _ok()
        except Exception as exc:
            log.exception("fp_begin failed")
            return _err(str(exc))

    def fp_cancel(self) -> dict:
        if self._fp is None:
            return _ok()
        try:
            self._send({"cmd": "cancel"})
            return _ok()
        except Exception as exc:
            return _err(str(exc))

    # ── fingerprint plumbing ──────────────────────────────────────────────
    def _ensure_fp(self) -> None:
        if self._fp is not None and self._fp.poll() is None:
            return

        script = _HERE / "fp_enroll.py"
        if not script.is_file():
            raise RuntimeError(f"fingerprint sidecar missing at {script}")

        # Frozen builds have no python.exe to re-invoke, so the sidecar is run
        # through this same executable with a marker argv the entry point
        # understands (see main.py / the spec's hiddenimports).
        if getattr(sys, "frozen", False):
            cmd = [sys.executable, "--fp-sidecar"]
        else:
            cmd = [sys.executable, str(script)]

        self._fp = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            bufsize=1,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        self._pump = threading.Thread(target=self._pump_loop, daemon=True)
        self._pump.start()

    def _send(self, payload: dict) -> None:
        if self._fp is None or self._fp.stdin is None:
            raise RuntimeError("fingerprint sidecar is not running")
        self._fp.stdin.write(json.dumps(payload) + "\n")
        self._fp.stdin.flush()

    def _pump_loop(self) -> None:
        proc = self._fp
        if proc is None or proc.stdout is None:
            return
        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                self._emit(json.loads(line))
            except json.JSONDecodeError:
                log.debug("non-JSON from sidecar: %s", line[:200])

    def _emit(self, payload: dict) -> None:
        """Push a fingerprint event to JS.

        Same channel CKD-Check-In uses (a 'ckd-fp' CustomEvent); bridge.js
        forwards it to whatever onFpEvent subscribers exist.
        """
        if self._window is None:
            return
        try:
            self._window.evaluate_js(
                "window.dispatchEvent(new CustomEvent('ckd-fp', {detail: "
                f"{json.dumps(payload, ensure_ascii=False)}}}))"
            )
        except Exception:
            log.exception("failed to dispatch fp event to JS")

    def _stop_fp(self) -> None:
        if self._fp is None:
            return
        try:
            self._send({"cmd": "quit"})
            self._fp.wait(timeout=5)
        except Exception:
            try:
                self._fp.kill()
            except Exception:
                pass
        finally:
            self._fp = None
