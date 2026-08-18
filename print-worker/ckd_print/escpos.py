"""ESC/POS command bytes and the raster encoder.

Ported from CKD-POS's receipt_printer.py. CKD-Ticket is a separate system on a
separate machine, so this is a copy by hand, once — nothing here imports from or
talks to CKD-POS at runtime.

Not carried over: the cash-drawer kick and the kitchen-ticket/station layout.
CKD-Ticket has no drawer wired to the printer and no kitchen.
"""
from __future__ import annotations

ESC = b"\x1b"
GS = b"\x1d"

INIT = ESC + b"@"
ALIGN_LEFT = ESC + b"a\x00"
ALIGN_CENTER = ESC + b"a\x01"
ALIGN_RIGHT = ESC + b"a\x02"
BOLD_ON = ESC + b"E\x01"
BOLD_OFF = ESC + b"E\x00"
SIZE_NORMAL = GS + b"!\x00"
SIZE_2X = GS + b"!\x11"

# Feed to the cut position, then partial cut. RP80 reports as an 80mm clone; if
# it ignores m=66 the paper never separates and receipts print onto one strip,
# so CUT_FALLBACK exists to switch without a code change.
FEED_CUT = GS + b"V\x42\x03"
CUT_FALLBACK = GS + b"V\x01"

# Line spacing. The default (ESC 2, ~30 dots) inserts a gap BETWEEN raster
# bands, which shows up as pale horizontal stripes across an image-mode
# receipt. ESC 3 0 sets the feed to zero so consecutive bands butt together;
# LINE_SPACING_DEFAULT restores normal behaviour before any text is printed.
LINE_SPACING_ZERO = ESC + b"3\x00"
LINE_SPACING_DEFAULT = ESC + b"2"

# 80mm paper at 203dpi = 576 addressable dots.
PAPER_WIDTH_DOTS = 576

# Rows per GS v 0 block. Kept small deliberately: many cheap clones mis-handle a
# yH byte greater than 0 (i.e. more than 255 rows in one block), and a smaller
# block also survives a thin serial buffer. 128 keeps yH at 0 always.
RASTER_BAND_ROWS = 128


def feed(lines: int = 1) -> bytes:
    return b"\n" * max(0, lines)


def raster(image, band_rows: int = RASTER_BAND_ROWS) -> bytes:
    """Encode a Pillow image as GS v 0 raster bit-image blocks.

    Expects a 1-bit ("1") image, black = printed. Width is padded to a byte
    boundary; anything wider than the paper is cropped rather than scaled,
    because silently shrinking a receipt is worse than clipping a margin.
    """
    if image.mode != "1":
        image = image.convert("1")

    width = min(image.width, PAPER_WIDTH_DOTS)
    width_bytes = (width + 7) // 8
    pixels = image.load()

    out = bytearray()
    for top in range(0, image.height, band_rows):
        rows = min(band_rows, image.height - top)

        # GS v 0 m xL xH yL yH  — m=0 is normal density.
        out += GS + b"v0" + b"\x00"
        out += bytes([width_bytes & 0xFF, (width_bytes >> 8) & 0xFF])
        out += bytes([rows & 0xFF, (rows >> 8) & 0xFF])

        for y in range(top, top + rows):
            for xb in range(width_bytes):
                byte = 0
                for bit in range(8):
                    x = xb * 8 + bit
                    # A 1 bit means "fire the head". Pillow gives 0 for black.
                    if x < width and pixels[x, y] == 0:
                        byte |= 0x80 >> bit
                out.append(byte)
    return bytes(out)
