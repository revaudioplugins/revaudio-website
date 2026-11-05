"""Retint the burnt-titanium plates into the RevFX pedal lamp colours (Yoni 2026-11-05: "make the shades of the colors
of the titanium panels like the shades of color of the pedals themselves").

  python -I tools/revfx-player/retint.py <src dir with plate-w.png, plate-s.png, plate-t.png>

Burnt titanium tints in a fixed order as it heats: straw gold -> bronze -> magenta -> blue (hue 50 -> 25 -> -50 -> -135,
falling). That order is mapped onto the pedals' own spectrum, rising: HALO green #6dff9a (140) -> GLUE cyan #6fe8ff
(188) -> PITCH ice blue #cfe0ff (218) -> REVERB violet #c79bff (265) -> ECHO pink #ff5fd9 (315): each colour a
plateau band of equal area (cut at the tint's own quantiles) with a soft blend into the next, the way real heat tint
runs from band to band. Only tinted pixels move (blended in by saturation 0.1 -> 0.3):
grey metal, the worn silver edges, grime and the screws keep their own colour.
Out: src/assets/seasons/revfx/hear/plate-w.jpg (1600x800), plate-s.jpg (800x800), plate-t.jpg (800x1600).
"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'src', 'assets', 'seasons', 'revfx', 'hear')
SRC = sys.argv[1]
JOBS = [('plate-w', (1600, 800)), ('plate-s', (800, 800)), ('plate-t', (800, 1600))]


STOPS = [140, 188, 218, 265, 320]   # HALO green, GLUE cyan, PITCH ice blue, REVERB violet, ECHO pink


def retint(im):
    rgb = np.array(im.convert('RGB')).astype(np.float32)
    hsv = np.array(im.convert('HSV')).astype(np.float32)
    h = hsv[..., 0] * 360 / 255; s = hsv[..., 1] / 255
    hu = np.where(h <= 140, h, h - 360)                 # unwrap: gold 50 ... blue -135 on one falling line
    t = np.clip((50 - hu) / 185, 0, 1)                  # 0 = straw gold, 1 = deep blue
    tinted = s > .2
    # equal area per pedal colour: each colour holds a plateau band of the tint's own quantiles (10 % of the coloured
    # area flat, then a 10 % blend into the next), so the end colours (green, pink) get as much room as the middle ones
    edges = np.linspace(0, 1, 2 * len(STOPS))                       # 0, .11, .22 ... 1
    q = np.quantile(t[tinted], edges) if tinted.any() else edges
    q = np.maximum.accumulate(q + np.arange(len(q)) * 1e-6)
    nh = np.interp(t, q, np.repeat(STOPS, 2))
    out = hsv.copy()
    out[..., 0] = (nh % 360) * 255 / 360
    out[..., 1] = np.clip(s * 1.12, 0, 1) * 255
    # ECHO's hot pink is a bright neon: a deep pink on dark metal reads violet, so the pink band gets light + colour
    pink = np.clip(1 - np.abs(nh - 318) / 30, 0, 1)
    out[..., 1] = np.clip(out[..., 1] * (1 + .35 * pink), 0, 255)
    out[..., 2] = np.clip(out[..., 2] * (1 + .32 * pink), 0, 255)
    new = np.array(Image.fromarray(out.astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32)
    # grey metal, the worn silver edges, grime and the screws keep their own colour: blend in by saturation
    w = np.clip((s - .1) / .2, 0, 1)[..., None]; w = w * w * (3 - 2 * w)
    return Image.fromarray(np.clip(rgb * (1 - w) + new * w, 0, 255).astype(np.uint8), 'RGB')


for name, size in JOBS:
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGB')
    retint(im).resize(size, Image.LANCZOS).save(os.path.join(OUT, name + '.jpg'), quality=86)
    print('wrote', name, size)
