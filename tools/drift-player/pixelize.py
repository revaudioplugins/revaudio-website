"""DRIFT Turbo Dash player, 8-bit pass: resample the photo parts onto the toy's pixel grid.

  python tools/drift-player/pixelize.py

Yoni 2026-10-14: "make all of this 8 bit vibe, but reduce the intensity of the 8 bit by 20%". One grid for the whole
toy: 1 art pixel = 3.2 css px at the desktop size (the first pixel parts used 4 px; 20 % finer). Each part is
box-downsampled to (its desktop css size / 3.2), its colours cut to a small adaptive palette (no dither) and its alpha
made hard (8-bit sprites have no soft edges). The page shows them with image-rendering: pixelated.
Out: public/drift-player/px/<name>.png (tiny files).
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'drift-player', 'px')
PX = 3.2
SEASON = os.path.join(ROOT, 'src', 'assets', 'seasons', 'drift')
PARTS = {  # name: (source, desktop css width, palette colours)
    'shell':   (os.path.join(ROOT, 'tools', 'drift-player', 'src', 'shell.webp'), 1100, 48),   # the cut AI shell (process_assets.py)
    'tvframe': (os.path.join(SEASON, 'tv-frame-3.png'), 490 * .82, 24),
    'cap-play': (os.path.join(SEASON, 'mm_cap_green.png'), 56, 16),
    'cap-stop': (os.path.join(SEASON, 'mm_cap_red.png'), 56, 16),
}

def pixelize(src, css_w, colours):
    im = Image.open(src).convert('RGBA')
    w = max(8, round(css_w / PX)); h = max(8, round(im.height * w / im.width))
    small = im.resize((w, h), Image.BOX)
    a = small.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
    rgb = small.convert('RGB').quantize(colors=colours, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = rgb.convert('RGBA'); out.putalpha(a)
    return out

os.makedirs(OUT, exist_ok=True)
for name, (src, css_w, colours) in PARTS.items():
    im = pixelize(src, css_w, colours)
    path = os.path.join(OUT, name + '.png')
    im.save(path, optimize=True)
    print(f'{name:9s} {im.size[0]:4d} x {im.size[1]:<4d} {colours:2d} colours  {os.path.getsize(path) / 1e3:.1f} kB')
