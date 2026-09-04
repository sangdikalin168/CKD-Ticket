"""Build assets/icon.ico for the CKD-Ticket desktop exe from the club logo.

    python make_icon.py                       # reads assets/logo.png, writes assets/icon.ico
    python make_icon.py path/to/logo.jpg      # any Pillow-readable source
    python make_icon.py --keep-background     # don't cut the disc out

PyInstaller embeds assets/icon.ico as the exe's icon (see release.py), which is
what Windows shows in the taskbar, title bar and Explorer. Needs Pillow
(pip install pillow); the source should be square, ideally 512 px or larger.

The club logo is a red disc on a white background (the source is a JPEG, so it
has no transparency). By default the disc is cut out onto a transparent canvas:
the non-white bounding box gives its centre and radius, and an anti-aliased
circle mask removes everything outside it, so the icon does not sit in a white
square on a dark taskbar.
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
SIZES = [16, 24, 32, 48, 64, 128, 256]
WHITE_THRESHOLD = 235  # channel value above which a pixel counts as background


def cut_out_disc(img):
    """Return the logo's disc on a transparent square canvas."""
    from PIL import Image, ImageChops, ImageDraw

    # A pixel is background only if all three channels are near white, so the
    # per-pixel minimum channel below the threshold marks the foreground; its
    # bounding box is the disc.
    r, g, b = img.convert("RGB").split()
    darkest = ImageChops.darker(ImageChops.darker(r, g), b)
    fg = darkest.point(lambda v: 255 if v <= WHITE_THRESHOLD else 0)
    bbox = fg.getbbox()
    if not bbox:
        return img.convert("RGBA")
    left, top, right, bottom = bbox
    diameter = max(right - left, bottom - top)
    cx, cy = (left + right) / 2, (top + bottom) / 2
    radius = diameter / 2

    # Crop a square around the disc with a small margin so the circle fills
    # the icon without touching its edge.
    margin = int(round(diameter * 0.02))
    side = diameter + 2 * margin
    box = (int(round(cx - side / 2)), int(round(cy - side / 2)))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img.convert("RGBA"), (-box[0], -box[1]))

    # Anti-aliased circular alpha: draw at 4x and downsample.
    ss = 4
    big = Image.new("L", (side * ss, side * ss), 0)
    c = (side / 2) * ss
    rr = (radius - 0.5) * ss  # pull in half a pixel to hide the JPEG halo
    ImageDraw.Draw(big).ellipse((c - rr, c - rr, c + rr, c + rr), fill=255)
    alpha = big.resize((side, side), Image.LANCZOS)
    canvas.putalpha(alpha)
    return canvas


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    keep_bg = "--keep-background" in sys.argv[1:]
    src = Path(args[0]) if args else ASSETS / "logo.png"
    if not src.is_file():
        print(f"logo not found: {src}\nSave the club logo as {ASSETS / 'logo.png'} and re-run.")
        return 2
    try:
        from PIL import Image
    except ImportError:
        print("Pillow is required: pip install pillow")
        return 2

    ASSETS.mkdir(exist_ok=True)
    img = Image.open(src).convert("RGBA")
    if keep_bg:
        side = max(img.size)
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    else:
        canvas = cut_out_disc(img)

    out = ASSETS / "icon.ico"
    canvas.save(out, format="ICO", sizes=[(s, s) for s in SIZES])
    # A 256 px PNG alongside, for anything that wants a plain image (docs, web).
    canvas.resize((256, 256), Image.LANCZOS).save(ASSETS / "icon-256.png")
    print(f"wrote {out} ({', '.join(str(s) for s in SIZES)} px) from {src}"
          f"{' (background kept)' if keep_bg else ' (disc cut out, transparent corners)'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
