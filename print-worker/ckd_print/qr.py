"""QR codes as bitmaps.

Rendered as pixels rather than with the printer's native GS ( k command. The
receipt is already a bitmap, so this costs nothing extra, and it removes a
dependency on what this particular RP80 clone's firmware implements — native QR
support varies, and a printer that ignores GS ( k prints nothing at all with no
error.

The QR matters here: CKD-Check-In scans it at the door, so an unreadable code is
a member who cannot get in.
"""
from __future__ import annotations

import segno
from PIL import Image


def qr_image(data: str, module_dots: int = 8, border: int = 2) -> Image.Image:
    """Render `data` as a 1-bit QR bitmap.

    module_dots is how many printer dots make up one QR module. At 203dpi, 8
    dots is roughly 1mm per module — a version-2 code lands near 25mm square,
    which scans reliably off thermal paper. Smaller saves paper and starts
    failing as the roll ages and contrast drops.
    """
    qr = segno.make(data, error="m")
    matrix = [list(row) for row in qr.matrix]
    size = len(matrix)

    side = (size + border * 2) * module_dots
    img = Image.new("1", (side, side), 1)  # 1 = white
    px = img.load()

    for y, row in enumerate(matrix):
        for x, on in enumerate(row):
            if not on:
                continue
            x0 = (x + border) * module_dots
            y0 = (y + border) * module_dots
            for dy in range(module_dots):
                for dx in range(module_dots):
                    px[x0 + dx, y0 + dy] = 0  # 0 = black
    return img
