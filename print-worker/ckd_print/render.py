"""Text -> 1-bit bitmap, with correct Khmer.

Why this exists at all: ESC/POS text mode is CP437. Khmer has no representation
there, so a text-mode receipt prints '?' for every Khmer character — verified on
the real RP80. The only way to print Khmer on a thermal printer is to rasterise
it and send the pixels.

Khmer specifically cannot be rendered by walking a string and blitting one glyph
per character. It is a complex script: consonants take subscript forms stacked
BELOW the base (coeng), vowels reorder visually (some are stored after the
consonant but drawn before it), and marks stack above. Getting that right needs a
shaping engine, so text goes through HarfBuzz, which turns a Unicode string into
positioned glyph IDs, and FreeType rasterises those IDs.

Pillow could have done this by itself if it shipped Raqm (its RAQM layout engine
is HarfBuzz under the hood), but the installed Pillow reports raqm: False, so we
drive HarfBuzz directly — the same choice CKD-POS made.
"""
from __future__ import annotations

import functools
import logging
from pathlib import Path

import freetype
import uharfbuzz as hb
from PIL import Image

log = logging.getLogger("ckd_print.render")

FONTS_DIR = Path(__file__).resolve().parent / "fonts"


class FontError(RuntimeError):
    pass


@functools.lru_cache(maxsize=8)
def _hb_font(path: str, px: int) -> hb.Font:
    blob = hb.Blob.from_file_path(path)
    face = hb.Face(blob)
    font = hb.Font(face)
    # 26.6 fixed point: with this scale, HarfBuzz positions come back in 1/64 px,
    # which lines up with FreeType's set_pixel_sizes below.
    font.scale = (px * 64, px * 64)
    return font


@functools.lru_cache(maxsize=8)
def _ft_face(path: str, px: int) -> freetype.Face:
    face = freetype.Face(path)
    face.set_pixel_sizes(0, px)
    return face


def resolve_font(name: str) -> str:
    """Vendored fonts first, then the system.

    Vendored wins deliberately: a receipt must not silently change appearance
    because someone installed or removed a font on the server. If nothing
    resolves we raise — printing hollow .notdef boxes with no error is the worst
    possible outcome, and it is a real failure mode (HarfBuzz maps every Khmer
    cluster to .notdef when handed a Latin-only font, and reports no error).
    """
    candidate = FONTS_DIR / name
    if candidate.is_file():
        return str(candidate)

    system = Path("C:/Windows/Fonts") / name
    if system.is_file():
        return str(system)

    raise FontError(
        f"font {name!r} not found in {FONTS_DIR} or C:/Windows/Fonts — refusing "
        "to render, because a missing Khmer font prints empty boxes rather than failing"
    )


def shape(text: str, font_path: str, px: int) -> tuple[list, list]:
    buf = hb.Buffer()
    buf.add_str(text)
    # Sets script/direction/language from the codepoints. Without it Khmer is
    # treated as undefined script and the Khmer shaper never runs.
    buf.guess_segment_properties()
    hb.shape(_hb_font(font_path, px), buf)
    return buf.glyph_infos, buf.glyph_positions


def text_width(text: str, font_path: str, px: int) -> int:
    _, positions = shape(text, font_path, px)
    return sum(p.x_advance for p in positions) // 64


def render_line(text: str, font_path: str, px: int, width: int, align: str = "left") -> Image.Image:
    """Render one line to a 1-bit image `width` dots wide."""
    infos, positions = shape(text, font_path, px)
    face = _ft_face(font_path, px)

    advance = sum(p.x_advance for p in positions) // 64
    ascender = face.size.ascender // 64
    descender = abs(face.size.descender) // 64
    height = ascender + descender

    img = Image.new("L", (max(width, 1), max(height, 1)), 255)

    if align == "center":
        pen_x = max(0, (width - advance) // 2)
    elif align == "right":
        pen_x = max(0, width - advance)
    else:
        pen_x = 0
    pen_y = ascender

    for info, pos in zip(infos, positions):
        face.load_glyph(info.codepoint, freetype.FT_LOAD_RENDER)
        bitmap = face.glyph.bitmap
        if bitmap.width and bitmap.rows:
            glyph = Image.frombytes("L", (bitmap.width, bitmap.rows), bytes(bitmap.buffer))
            # FreeType gives white-on-black coverage; the page is black-on-white.
            glyph = Image.eval(glyph, lambda v: 255 - v)
            x = pen_x + (pos.x_offset // 64) + face.glyph.bitmap_left
            y = pen_y - (pos.y_offset // 64) - face.glyph.bitmap_top
            img.paste(glyph, (x, y), Image.eval(glyph, lambda v: 255 - v))
        pen_x += pos.x_advance // 64
        pen_y -= pos.y_advance // 64

    return img


def wrap(text: str, font_path: str, px: int, width: int) -> list[str]:
    """Break text to fit `width` dots.

    Khmer does not put spaces between words, so a space-only wrap leaves long
    Khmer runs overflowing the paper. When a single run is too wide we fall back
    to breaking per CLUSTER, never per character: splitting inside a cluster
    detaches a subscript or vowel from its base and renders visibly wrong.
    """
    if not text:
        return [""]
    if text_width(text, font_path, px) <= width:
        return [text]

    lines: list[str] = []
    for word in text.split(" "):
        if not lines:
            lines.append(word)
            continue
        trial = f"{lines[-1]} {word}"
        if text_width(trial, font_path, px) <= width:
            lines[-1] = trial
        else:
            lines.append(word)

    out: list[str] = []
    for line in lines:
        if text_width(line, font_path, px) <= width:
            out.append(line)
            continue
        # Cluster-safe hard break. HarfBuzz reports a cluster index per glyph;
        # boundaries are where that index changes.
        infos, positions = shape(line, font_path, px)
        cur, cur_w, start = "", 0, 0
        boundaries: list[int] = []
        seen = None
        for info in infos:
            if info.cluster != seen:
                boundaries.append(info.cluster)
                seen = info.cluster
        boundaries.append(len(line))
        for i in range(len(boundaries) - 1):
            piece = line[boundaries[i]:boundaries[i + 1]]
            w = text_width(piece, font_path, px)
            if cur and cur_w + w > width:
                out.append(cur)
                cur, cur_w = piece, w
            else:
                cur += piece
                cur_w += w
        if cur:
            out.append(cur)
    return out or [""]
