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
import re
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

# ─── page geometry ────────────────────────────────────────────────────────────
# Electron handed the HTML to Chromium's print stack, which laid it out on the
# receipt printer's own paper (80 mm roll) and shrank over-wide content to fit.
# Headless Chrome knows nothing about the printer: without a page size it
# renders Letter, and SumatraPDF then shrinks a whole Letter sheet onto the roll
# — a tiny receipt in one corner, rotated. So the PDF page is made the size of
# the paper: as wide as the roll, as tall as the content (measured first).
MM_PER_PX = 25.4 / 96.0
DEFAULT_PAPER_WIDTH_MM = 80.0      # config.json "paper_width_mm" overrides (58 for narrow rolls)
MIN_PAGE_HEIGHT_MM = 100.0         # shorter than wide and SumatraPDF would rotate it
MAX_PAGE_HEIGHT_MM = 3000.0
FALLBACK_PAGE_HEIGHT_MM = 250.0    # when measuring fails; still portrait, still roll-width
PAGE_BOTTOM_MARGIN_MM = 3.0

# Runs at the end of <body> and again on load: records the ink extent of the
# document (bounding boxes, not scrollHeight — new headless enforces a minimum
# window size, so scrollHeight/scrollWidth just report the viewport).
_MEASURE_JS = """<script>(function () {
  function measure() {
    var body = document.body, root = document.documentElement;
    if (!body) return;
    var maxBottom = 0, maxRight = 0;
    var all = body.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      if (!r.width && !r.height) continue;
      if (r.bottom > maxBottom) maxBottom = r.bottom;
      if (r.right > maxRight) maxRight = r.right;
    }
    var b = body.getBoundingClientRect();
    var mb = parseFloat(getComputedStyle(body).marginBottom) || 0;
    maxBottom = Math.max(maxBottom, b.bottom) + mb + window.scrollY;
    maxRight = Math.max(maxRight, b.right) + window.scrollX;
    root.setAttribute('data-ckd-height', String(Math.ceil(maxBottom)));
    root.setAttribute('data-ckd-width', String(Math.ceil(maxRight)));
  }
  measure();
  window.addEventListener('load', measure);
})();</script>"""


def paper_width_mm() -> float:
    from . import settings

    try:
        value = float(settings.get("paper_width_mm") or DEFAULT_PAPER_WIDTH_MM)
    except (TypeError, ValueError):
        value = DEFAULT_PAPER_WIDTH_MM
    return value if 30.0 <= value <= 300.0 else DEFAULT_PAPER_WIDTH_MM


def _inject(html: str, head_first: str = "", head_last: str = "", body_last: str = "") -> str:
    """Insert fragments into a full HTML document without touching its content."""
    out = html
    if head_first or head_last:
        m = re.search(r"<head[^>]*>", out, re.I)
        if m:
            out = out[: m.end()] + head_first + out[m.end():]
        else:
            m = re.search(r"<html[^>]*>", out, re.I)
            pos = m.end() if m else 0
            out = out[:pos] + "<head>" + head_first + "</head>" + out[pos:]
        if head_last:
            m = re.search(r"</head\s*>", out, re.I)
            out = out[: m.start()] + head_last + out[m.start():]
    if body_last:
        m = re.search(r"</body\s*>", out, re.I)
        out = out[: m.start()] + body_last + out[m.start():] if m else out + body_last
    return out


def _base_tag(html: str, base_url: "str | None") -> str:
    """<base href> so the receipt's /assets fonts and /uploads images resolve
    against the server instead of file://. Must be the first thing in <head>."""
    if not base_url or not base_url.startswith("http"):
        return ""
    if re.search(r"<base\s", html, re.I):
        return ""
    origin = base_url.rstrip("/").replace('"', "%22")
    return f'<base href="{origin}/">'


def _measure(browser: str, html_path: Path) -> "tuple[int, int] | None":
    cmd = [
        browser,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--virtual-time-budget=2000",
        "--dump-dom",
        html_path.as_uri(),
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, timeout=60)
    except Exception as exc:
        log.warning("receipt measurement failed to run: %s", exc)
        return None
    h = re.search(rb'data-ckd-height="(\d+)"', proc.stdout)
    w = re.search(rb'data-ckd-width="(\d+)"', proc.stdout)
    if not (h and w):
        log.warning("receipt measurement returned nothing (exit %s)", proc.returncode)
        return None
    return int(h.group(1)), int(w.group(1))


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


def html_to_pdf(
    html: str,
    pdf_path: Path,
    base_url: "str | None" = None,
    width_mm: "float | None" = None,
) -> None:
    """Render HTML to a PDF whose single page is the size of the receipt.

    Two headless passes: the first lays the document out at the roll width and
    reports its ink extent; the second prints with a matching CSS @page size.
    Content wider than the roll (the invoices are 405 px) is shrunk to fit by
    Blink exactly as Electron's print did, so the measured height is scaled
    by the same factor.

    --no-pdf-header-footer keeps the page URL and timestamp off the receipt;
    without it every ticket prints with 'blob:http://...' across the top.
    """
    browser = find_browser()
    if not browser:
        raise PrintError(
            "No Chrome or Edge found to render the receipt. Install one, or "
            "switch to the backend ESC/POS route."
        )

    width_mm = float(width_mm or paper_width_mm())
    page_px = max(1, round(width_mm / MM_PER_PX))
    base = _base_tag(html, base_url)

    measure_path = pdf_path.with_name(pdf_path.stem + ".measure.html")
    measure_path.write_text(
        _inject(
            html,
            head_first=base,
            head_last=f"<style>html {{ width: {page_px}px !important; }}</style>",
            body_last=_MEASURE_JS,
        ),
        encoding="utf-8",
    )
    dims = _measure(browser, measure_path)
    if dims:
        content_h_px, content_w_px = dims
        scale = min(1.0, page_px / content_w_px) if content_w_px > 0 else 1.0
        height_mm = content_h_px * scale * MM_PER_PX + PAGE_BOTTOM_MARGIN_MM
    else:
        content_h_px = content_w_px = 0
        scale = 1.0
        height_mm = FALLBACK_PAGE_HEIGHT_MM
    height_mm = min(MAX_PAGE_HEIGHT_MM, max(MIN_PAGE_HEIGHT_MM, height_mm))
    log.info(
        "receipt page %.0fx%.0f mm (content %dx%d px, shrink %.2f)",
        width_mm, height_mm, content_w_px, content_h_px, scale,
    )

    html_path = pdf_path.with_suffix(".html")
    html_path.write_text(
        _inject(
            html,
            head_first=base,
            head_last=(
                f"<style>@page {{ size: {width_mm:.2f}mm {height_mm:.2f}mm; margin: 0; }}</style>"
            ),
        ),
        encoding="utf-8",
    )

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
        # "portrait": SumatraPDF turns the page to match the paper, and the
        # RP80 driver's default paper came up landscape — that is the second
        # half of why receipts printed sideways. The page itself is portrait
        # (never shorter than it is wide), so nothing else gets rotated.
        for _ in range(max(1, copies)):
            subprocess.run(
                [sumatra, "-silent", "-print-settings", "portrait", *target, str(pdf_path)],
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
@page {{ margin: 4mm; }}
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
    # Route 1: Chromium rasterises, GDI hands the bitmap to the driver
    # top-aligned on its default paper (see gdi_print.py). Route 2, PDF via
    # SumatraPDF, only when route 1 fails BEFORE spooling — a RasterError —
    # so a receipt can never print twice.
    from . import gdi_print

    try:
        return gdi_print.print_receipt(html, target, copies=copies, base_url=base_url)
    except gdi_print.RasterError as exc:
        log.warning("raster route unavailable (%s) — falling back to PDF", exc)

    ensure_sumatra(base_url)

    tmpdir = Path(tempfile.mkdtemp(prefix="ckd-print-"))
    pdf_path = tmpdir / "receipt.pdf"
    try:
        html_to_pdf(html, pdf_path, base_url=base_url)
        route = spool_pdf(pdf_path, copies=copies, printer=target)
        return {"ok": True, "route": route, "copies": copies, "printer": target}
    finally:
        if os.environ.get("CKD_KEEP_PRINT_TEMP") != "1":
            shutil.rmtree(tmpdir, ignore_errors=True)

def render_pdf_only(html: str, base_url: "str | None" = None) -> dict:
    """previewComponent's replacement: render, don't spool, hand back a path."""
    tmpdir = Path(tempfile.mkdtemp(prefix="ckd-preview-"))
    pdf_path = tmpdir / "preview.pdf"
    html_to_pdf(html, pdf_path, base_url=base_url)
    return {"ok": True, "path": str(pdf_path)}
