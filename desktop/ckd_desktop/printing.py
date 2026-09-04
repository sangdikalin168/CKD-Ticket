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
from datetime import datetime
from pathlib import Path

log = logging.getLogger("ckd-desktop.printing")

# Where a SumatraPDF fetched from the Ticket server is kept (per Windows user).
TOOLS_DIR = Path(os.environ.get("LOCALAPPDATA") or tempfile.gettempdir()) / "CKD-Ticket" / "tools"
# Served by the backend's /desktop static mount (shared\desktop\tools\SumatraPDF.exe).
SUMATRA_URL_PATH = "/desktop/tools/SumatraPDF.exe"


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
    str(TOOLS_DIR / "SumatraPDF.exe"),
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


# ─── printer selection & SumatraPDF provisioning ─────────────────────────────

def list_printers() -> "list[str]":
    """Every printer Windows knows on this PC (local + network connections)."""
    import win32print  # type: ignore

    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    return sorted({p[2] for p in win32print.EnumPrinters(flags)})


def default_printer() -> "str | None":
    try:
        import win32print  # type: ignore

        return win32print.GetDefaultPrinter() or None
    except Exception:
        return None


def resolve_printer(explicit: "str | None" = None) -> "str | None":
    """Explicit name > config.json "printer" > Windows default printer."""
    from . import settings

    return explicit or settings.get("printer") or default_printer()


def ensure_sumatra(base_url: "str | None") -> "str | None":
    """SumatraPDF if installed; otherwise fetch the copy the Ticket server
    publishes at /desktop/tools/SumatraPDF.exe into TOOLS_DIR. Returns the
    path, or None when neither is available (the shell-print fallback is used)."""
    found = find_sumatra()
    if found:
        return found
    if not base_url or not base_url.startswith("http"):
        return None
    import urllib.request

    url = base_url.rstrip("/") + SUMATRA_URL_PATH
    local = TOOLS_DIR / "SumatraPDF.exe"
    tmp = local.with_suffix(".part")
    try:
        TOOLS_DIR.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=60) as resp, tmp.open("wb") as fh:
            shutil.copyfileobj(resp, fh)
        if tmp.stat().st_size < 1_000_000:
            raise PrintError("downloaded SumatraPDF is too small to be real")
        tmp.replace(local)
        log.info("SumatraPDF fetched from %s", url)
        return str(local)
    except Exception as exc:
        log.warning("could not fetch SumatraPDF from %s: %s", url, exc)
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass
        return None


TEST_SLIP = """<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: 80mm auto; margin: 4mm; }}
body {{ font-family: 'Khmer OS Battambang', 'Khmer UI', sans-serif; font-size: 12pt; width: 72mm; margin: 0; }}
h2 {{ text-align: center; margin: 0 0 6px; }}
p {{ margin: 2px 0; }}
</style></head><body>
<h2>CKD Ticket</h2>
<p>Printer test / សាកល្បងបោះពុម្ព</p>
<p>{when}</p>
<p>Printer: {printer}</p>
<p style="text-align:center">------------------------</p>
</body></html>"""


def print_test(printer: "str | None" = None, base_url: "str | None" = None) -> dict:
    """A short slip so staff can see which printer they picked actually prints."""
    target = resolve_printer(printer)
    if not target:
        raise PrintError("No printer selected. Choose one under Printer in the menu.")
    html = TEST_SLIP.format(when=datetime.now().strftime("%Y-%m-%d %H:%M"), printer=target)
    return print_html(html, copies=1, printer=target, base_url=base_url)


def print_html(
    html: str,
    copies: int = 1,
    printer: "str | None" = None,
    base_url: "str | None" = None,
) -> dict:
    if not html or not html.strip():
        raise PrintError("nothing to print (empty document)")
    target = resolve_printer(printer)
    if not target:
        raise PrintError(
            "No printer selected and Windows has no default printer. "
            "Choose one under Printer in the menu."
        )
    ensure_sumatra(base_url)

    tmpdir = Path(tempfile.mkdtemp(prefix="ckd-print-"))
    pdf_path = tmpdir / "receipt.pdf"
    try:
        html_to_pdf(html, pdf_path)
        route = spool_pdf(pdf_path, copies=copies, printer=target)
        return {"ok": True, "route": route, "copies": copies, "printer": target}
    finally:
        if os.environ.get("CKD_KEEP_PRINT_TEMP") != "1":
            shutil.rmtree(tmpdir, ignore_errors=True)

def render_pdf_only(html: str) -> dict:
    """previewComponent's replacement: render, don't spool, hand back a path."""
    tmpdir = Path(tempfile.mkdtemp(prefix="ckd-preview-"))
    pdf_path = tmpdir / "preview.pdf"
    html_to_pdf(html, pdf_path)
    return {"ok": True, "path": str(pdf_path)}
