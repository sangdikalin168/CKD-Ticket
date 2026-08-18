"""Silent receipt printing for the pywebview host.

Electron got this for free: webContents.print({silent:true}) handed the HTML to
Chromium's own print stack. A Python host has no renderer to ask, so printing
has to be done explicitly. Two routes are implemented, tried in order:

  1. ESC/POS via the backend  (preferred, not wired up yet — see below)
  2. HTML -> PDF -> silent spool  (implemented here, keeps the existing receipts)

Route 1 is what the sibling CKD-POS project does and is the right destination:
CKD-POS/backend/src/app/services/receipt_printer.py formats receipts into
ESC/POS bytes and writes them RAW to the Windows spooler with pywin32 — no
driver, no dialog, plus paper cut and cash-drawer kick. Critically it also
solves Khmer: ESC/POS text mode is CP437 and would print '?' for every Khmer
character, so it shapes text with uharfbuzz and rasterises with freetype-py,
sending the receipt as a GS v 0 bitmap. Getting there requires the ~10 call
sites to send structured receipt data instead of an HTML blob, which is a
frontend change and therefore its own step.

Route 2 is the bridge until then. It preserves the existing HTML receipts
exactly as designed, at the cost of depending on a headless browser to
rasterise and a PDF printer to spool.
"""
from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

log = logging.getLogger("ckd-desktop.printing")


class PrintError(RuntimeError):
    pass


_CHROME_CANDIDATES = (
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
)

_SUMATRA_CANDIDATES = (
    r"C:\Program Files\SumatraPDF\SumatraPDF.exe",
    r"C:\Program Files (x86)\SumatraPDF\SumatraPDF.exe",
)


def _find(candidates: "tuple[str, ...]", *names: str) -> "str | None":
    for name in names:
        found = shutil.which(name)
        if found:
            return found
    for path in candidates:
        if Path(path).is_file():
            return path
    return None


def find_browser() -> "str | None":
    return _find(_CHROME_CANDIDATES, "chrome", "msedge")


def find_sumatra() -> "str | None":
    return _find(_SUMATRA_CANDIDATES, "SumatraPDF")


def html_to_pdf(html: str, pdf_path: Path) -> None:
    """Render HTML to PDF with headless Chrome/Edge.

    --no-pdf-header-footer keeps the page URL and timestamp off the receipt;
    without it every ticket prints with 'blob:http://...' across the top.
    """
    browser = find_browser()
    if not browser:
        raise PrintError(
            "No Chrome or Edge found to render the receipt. Install one, or "
            "switch to the backend ESC/POS route."
        )

    html_path = pdf_path.with_suffix(".html")
    html_path.write_text(html, encoding="utf-8")

    cmd = [
        browser,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path.as_uri(),
    ]
    proc = subprocess.run(cmd, capture_output=True, timeout=60)
    if not pdf_path.is_file():
        raise PrintError(
            f"headless render produced no PDF (exit {proc.returncode}): "
            f"{proc.stderr.decode('utf-8', 'replace')[:400]}"
        )


def spool_pdf(pdf_path: Path, copies: int = 1, printer: "str | None" = None) -> str:
    """Send a PDF to the printer with no dialog. Returns the route used."""
    sumatra = find_sumatra()
    if sumatra:
        target = ["-print-to", printer] if printer else ["-print-to-default"]
        for _ in range(max(1, copies)):
            subprocess.run(
                [sumatra, "-silent", *target, str(pdf_path)],
                capture_output=True,
                timeout=120,
            )
        return "sumatrapdf"

    # Fallback: hand the PDF to whatever the OS has registered for the "print"
    # verb. Honest caveat — this is only as silent as that handler chooses to
    # be, and it ignores the copy count. SumatraPDF (a 10 MB portable exe) is
    # the reliable path; this exists so a counter without it still prints.
    try:
        import win32api  # type: ignore
    except ImportError as exc:  # pragma: no cover - windows only
        raise PrintError(
            "Neither SumatraPDF nor pywin32 is available to spool the PDF."
        ) from exc

    for _ in range(max(1, copies)):
        win32api.ShellExecute(0, "print", str(pdf_path), None, ".", 0)
    log.warning(
        "printed via the shell 'print' verb — install SumatraPDF for a truly "
        "silent path with working copy counts"
    )
    return "shell-print-verb"


def print_html(html: str, copies: int = 1, printer: "str | None" = None) -> dict:
    if not html or not html.strip():
        raise PrintError("nothing to print (empty document)")

    tmpdir = Path(tempfile.mkdtemp(prefix="ckd-print-"))
    pdf_path = tmpdir / "receipt.pdf"
    try:
        html_to_pdf(html, pdf_path)
        route = spool_pdf(pdf_path, copies=copies, printer=printer)
        return {"ok": True, "route": route, "copies": copies}
    finally:
        if os.environ.get("CKD_KEEP_PRINT_TEMP") != "1":
            shutil.rmtree(tmpdir, ignore_errors=True)


def render_pdf_only(html: str) -> dict:
    """previewComponent's replacement: render, don't spool, hand back a path."""
    tmpdir = Path(tempfile.mkdtemp(prefix="ckd-preview-"))
    pdf_path = tmpdir / "preview.pdf"
    html_to_pdf(html, pdf_path)
    return {"ok": True, "path": str(pdf_path)}
