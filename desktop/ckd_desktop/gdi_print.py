"""Receipt printing the way Electron did it, minus Electron.

webContents.print({silent: true}) had Chromium lay the HTML out on the receipt
printer's own paper and rasterise it for the driver. Here headless Chrome does
the rasterising (--screenshot at the printer's DPI) and GDI hands the bitmap to
the driver, top-aligned, on the printer's default paper. For the till's RP80
that paper is "80(72.1) x 99999 mm": a continuous roll the driver cuts after
the last printed row, so the receipt comes out exactly as long as its content.

Why the PDF route (printing.py) is only the fallback: SumatraPDF centres each
page on the paper, and on a 99999 mm "page" that is most of a metre of blank
feed before the receipt, then the same again after it — the strip of empty
paper in the photo from the counter.

Over-wide content: the invoices are laid out 405 px wide, more than a 72 mm
roll (272 px). Blink's print path shrinks such content to fit, and so does
this: the bitmap is scaled down to the printable width. Text stays crisp
because rendering happens at the printer's resolution.
"""
from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

log = logging.getLogger("ckd-desktop.gdi")

CSS_DPI = 96.0
MAX_RENDER_DPI = 300      # thermal printers are 203; a 600 dpi PDF printer gets 300
VIEWPORT_CSS_PX = 700     # wider than any roll, so over-wide content is captured whole
MAX_CANVAS_CSS_PX = 3000  # ~790 mm of receipt; anything longer is cut off
INK_THRESHOLD = 246       # grey levels above this count as blank paper
BOTTOM_PAD_CSS_PX = 6


class RasterError(RuntimeError):
    """Anything that goes wrong before the driver is involved. printing.py
    falls back to the PDF route on this — and only on this, so nothing can
    ever print twice."""


def _printer_dc(printer: str):
    """A GDI device context on the printer's default DEVMODE (its default
    paper, orientation and quality — exactly what Electron's silent print
    used). win32ui wraps StartDoc/StartPage/EndPage/EndDoc; win32gui has none
    of them."""
    import win32ui  # type: ignore

    dc = win32ui.CreateDC()
    dc.CreatePrinterDC(printer)
    return dc


def printer_geometry(printer: str) -> dict:
    """Printable area in device pixels and the DPI, straight from the driver."""
    import win32con  # type: ignore

    dc = _printer_dc(printer)
    try:
        return {
            "dpi_x": dc.GetDeviceCaps(win32con.LOGPIXELSX) or 203,
            "dpi_y": dc.GetDeviceCaps(win32con.LOGPIXELSY) or 203,
            "width_px": dc.GetDeviceCaps(win32con.HORZRES),
            "height_px": dc.GetDeviceCaps(win32con.VERTRES),
        }
    finally:
        dc.DeleteDC()


def render(html: str, png_path: Path, base_url: "str | None", page_css_px: int, dsf: float, browser: str):
    """HTML -> greyscale PIL image of the receipt's ink extent, at `dsf` device
    pixels per CSS pixel, laid out `page_css_px` wide."""
    from PIL import Image

    from . import printing

    doc = printing._inject(
        html,
        head_first=printing._base_tag(html, base_url),
        # Fluid content lays out at the roll width; fixed-width content (the
        # 405 px invoices) overflows to the right and is scaled down after.
        head_last=f"<style>html {{ width: {page_css_px}px !important; background: #fff; }}</style>",
    )
    html_path = png_path.with_suffix(".html")
    html_path.write_text(doc, encoding="utf-8")

    cmd = [
        browser,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--virtual-time-budget=2000",
        f"--force-device-scale-factor={dsf:.4f}",
        f"--window-size={VIEWPORT_CSS_PX},{MAX_CANVAS_CSS_PX}",
        f"--screenshot={png_path}",
        html_path.as_uri(),
    ]
    proc = subprocess.run(cmd, capture_output=True, timeout=90)
    if not png_path.is_file():
        raise RasterError(
            f"headless screenshot produced no image (exit {proc.returncode}): "
            f"{proc.stderr.decode('utf-8', 'replace')[:300]}"
        )

    with Image.open(png_path) as src:
        img = src.convert("L")
    bbox = img.point(lambda v: 255 if v < INK_THRESHOLD else 0).getbbox()
    if not bbox:
        raise RasterError("the receipt rendered completely blank")
    _left, _top, right, bottom = bbox
    pad = int(round(BOTTOM_PAD_CSS_PX * dsf))
    # Keep the document's own left/top margins (crop from 0,0); trim the
    # unused canvas on the right and below the last ink.
    return img.crop((0, 0, min(img.width, right + pad), min(img.height, bottom + pad)))


def fit_width(img, max_width: int):
    if img.width <= max_width:
        return img
    from PIL import Image

    new_height = max(1, round(img.height * max_width / img.width))
    return img.resize((max_width, new_height), Image.LANCZOS)


def print_image(img, printer: str, copies: int = 1, box=None, output_file: "str | None" = None) -> None:
    """Draw the bitmap top-left on a page and spool it. `box` is the target
    rectangle in device pixels (defaults to the image's own size). `output_file`
    is for drivers like Microsoft Print to PDF that otherwise ask for a name."""
    from PIL import ImageWin

    rgb = img.convert("RGB")
    dib = ImageWin.Dib(rgb)
    box = box or (0, 0, rgb.width, rgb.height)
    dc = _printer_dc(printer)
    try:
        for _ in range(max(1, copies)):
            if output_file:
                dc.StartDoc("CKD Ticket", output_file)
            else:
                dc.StartDoc("CKD Ticket")
            try:
                dc.StartPage()
                dib.draw(dc.GetHandleOutput(), box)
                dc.EndPage()
            finally:
                dc.EndDoc()
    finally:
        dc.DeleteDC()


def print_receipt(
    html: str,
    printer: str,
    copies: int = 1,
    base_url: "str | None" = None,
    output_file: "str | None" = None,
) -> dict:
    from . import printing

    try:
        browser = printing.find_browser()
        if not browser:
            raise RasterError("no Chrome or Edge to rasterise the receipt")
        geo = printer_geometry(printer)
        dpi = int(geo["dpi_x"])
        render_dpi = min(dpi, MAX_RENDER_DPI)
        dsf = render_dpi / CSS_DPI
        # Printable width in CSS pixels: what the HTML is laid out against.
        page_css_px = max(1, int(geo["width_px"] * CSS_DPI / dpi))
        tmpdir = Path(tempfile.mkdtemp(prefix="ckd-raster-"))
        try:
            img = render(html, tmpdir / "receipt.png", base_url, page_css_px, dsf, browser)
        finally:
            if os.environ.get("CKD_KEEP_PRINT_TEMP") != "1":
                shutil.rmtree(tmpdir, ignore_errors=True)
        # Everything is in render pixels (render_dpi); the driver wants device
        # pixels (dpi). Same thing for a 203 dpi thermal printer.
        max_render_w = max(1, int(geo["width_px"] * render_dpi / dpi))
        img = fit_width(img, max_render_w)
        ratio = dpi / render_dpi
        box = (0, 0, int(round(img.width * ratio)), int(round(img.height * ratio)))
    except RasterError:
        raise
    except Exception as exc:  # driver/DC/PIL problems: still safe to fall back
        raise RasterError(f"{type(exc).__name__}: {exc}") from exc

    if box[3] > geo["height_px"] > 0:
        log.warning(
            "receipt is %d px tall but the paper is %d px: the driver will cut it",
            box[3], geo["height_px"],
        )
    log.info(
        "receipt raster %dx%d px @ %d dpi -> %s (printable %dx%d, %d cop%s)",
        img.width, img.height, render_dpi, printer, geo["width_px"], geo["height_px"],
        copies, "y" if copies == 1 else "ies",
    )
    print_image(img, printer, copies=copies, box=box, output_file=output_file)
    return {
        "ok": True,
        "route": "gdi-raster",
        "copies": copies,
        "printer": printer,
        "width_px": box[2],
        "height_px": box[3],
        "dpi": dpi,
    }
