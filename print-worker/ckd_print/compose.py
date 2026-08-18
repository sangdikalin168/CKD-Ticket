"""Turn a ReceiptDoc (JSON from the Node backend) into printable bytes.

The wire format is a list of blocks, not the flat {header_lines, items, totals}
shape CKD-POS uses. CKD-Ticket needs a QR on the ticket receipt — CKD-Check-In
scans it at the door — and a flat schema has nowhere to put one.

Everything is rendered into a SINGLE bitmap and sent as one raster stream rather
than interleaving ESC/POS text with images. Mixing the two makes vertical
spacing depend on the printer's text line-height, which differs between clones;
one bitmap means what is verified on screen is exactly what comes out.
"""
from __future__ import annotations

import logging

from PIL import Image

from . import escpos, qr, render

log = logging.getLogger("ckd_print.compose")

SCHEMA_VERSION = 1

DEFAULT_FONT = "NotoSansKhmer.ttf"
DEFAULT_PX = 24
GAP = 6


def _line_images(doc: dict, width: int) -> list[Image.Image]:
    font = render.resolve_font(doc.get("font", DEFAULT_FONT))
    base_px = int(doc.get("font_px", DEFAULT_PX))
    out: list[Image.Image] = []

    for block in doc.get("blocks", []):
        kind = block.get("type")

        if kind == "text":
            px = int(block.get("px", base_px))
            align = block.get("align", "left")
            text = str(block.get("text", ""))
            for piece in render.wrap(text, font, px, width):
                out.append(render.render_line(piece, font, px, width, align))

        elif kind == "row":
            # label left, value right, on one line — prices, totals, dates.
            px = int(block.get("px", base_px))
            left = str(block.get("left", ""))
            right = str(block.get("right", ""))
            img = Image.new("L", (width, 1), 255)
            limg = render.render_line(left, font, px, width, "left")
            rimg = render.render_line(right, font, px, width, "right")
            h = max(limg.height, rimg.height)
            img = Image.new("L", (width, h), 255)
            img.paste(limg, (0, 0))
            # Multiply so the right-aligned text does not paint white over the left.
            img.paste(Image.eval(rimg, lambda v: v), (0, 0), Image.eval(rimg, lambda v: 255 - v))
            out.append(img)

        elif kind == "rule":
            h = int(block.get("thickness", 2))
            img = Image.new("L", (width, h + GAP), 255)
            for y in range(h):
                for x in range(width):
                    img.putpixel((x, y), 0)
            out.append(img)

        elif kind == "space":
            out.append(Image.new("L", (width, int(block.get("dots", GAP))), 255))

        elif kind == "qr":
            data = str(block.get("data", ""))
            if data:
                code = qr.qr_image(data, module_dots=int(block.get("module_dots", 8)))
                canvas = Image.new("L", (width, code.height), 255)
                canvas.paste(code.convert("L"), (max(0, (width - code.width) // 2), 0))
                out.append(canvas)

        else:
            log.warning("ignoring unknown block type %r", kind)

    return out


def build_bitmap(doc: dict, width: int = escpos.PAPER_WIDTH_DOTS) -> Image.Image:
    images = _line_images(doc, width)
    if not images:
        raise ValueError("document produced no printable content")

    height = sum(i.height for i in images)
    canvas = Image.new("L", (width, height), 255)
    y = 0
    for img in images:
        canvas.paste(img, (0, y))
        y += img.height
    # Threshold late, once, so antialiased glyph edges become crisp dots rather
    # than being rounded per-line.
    return canvas.point(lambda v: 0 if v < 160 else 255, mode="1")


def build_payload(doc: dict, width: int = escpos.PAPER_WIDTH_DOTS) -> bytes:
    bitmap = build_bitmap(doc, width)

    out = bytearray()
    out += escpos.INIT
    out += escpos.LINE_SPACING_ZERO      # butt raster bands together
    out += escpos.ALIGN_LEFT
    out += escpos.raster(bitmap)
    out += escpos.LINE_SPACING_DEFAULT
    out += escpos.feed(int(doc.get("feed_lines", 3)))
    if doc.get("cut", True):
        out += escpos.CUT_FALLBACK if doc.get("cut_fallback") else escpos.FEED_CUT
    return bytes(out)
