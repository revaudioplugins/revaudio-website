"""Cut the broken-TV frames (tools/gen-drift-tv-frame-broken.sh) for the word wall's DRIFT screen.

Per roll: crop to the frame's alpha edges, punch the screen opening out to alpha 0 (flood from the centre over
the flat near-black glass, then a fitted rounded-rectangle edge, ~1 px feather) so the page's live screen shows through, 2x Lanczos + a light unsharp
(the /drift plates' recipe), and measure the 9-slice: the bezel per side and corner patches big enough to hold
every bit of damage (the long runs between them get tiled by the page, so they must stay plain).

Usage: python tools/cut-drift-tv-frame-broken.py <rollsDir> <outDir>
  -> <outDir>/tv-broken-<n>.png + <outDir>/tv-broken.json  {"<n>": {w, h, bezel:[t,r,b,l], slice:[t,r,b,l]}}
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.optimize import least_squares

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
DARK_MARGIN = 8    # the glass = up to its own centre p95 + this (rolls differ: near-black to dark grey)
CUT = 11           # erode before the flood: a crack or a dark speckled bezel must not bridge the glass to the edge
INSET = 2          # cut the fitted opening this many px inside the lip: a dark glass hairline beats a bitten lip
SLICE_X = 0.25     # corner patch width, of the frame width (roll 2's tape reaches 22 % in)
SLICE_Y = 0.27     # corner patch height, of the frame height
PAINT_HUE = 312    # the worn checker paint, moved from the model's red to DRIFT magenta (#e040c8 = 312 deg)
meta = {}

for name in sorted(os.listdir(SRC)):
    if not (name.startswith('roll-') and name.endswith('.png')):
        continue
    n = name[5:-4]
    im = Image.open(os.path.join(SRC, name)).convert('RGBA')
    a = im.getchannel('A')
    box = a.point(lambda v: 255 if v > 16 else 0).getbbox()
    im = im.crop(box)
    w, h = im.size
    px = im.load()

    # the opening: flood from the centre over dark, opaque glass (threshold from this roll's own glass)
    glass = sorted(max(px[x, y][:3]) for x in range(w // 2 - 200, w // 2 + 200, 10) for y in range(h // 2 - 150, h // 2 + 150, 10))
    DARK = glass[int(len(glass) * 0.95)] + DARK_MARGIN
    mask = Image.new('L', (w, h), 0)
    m = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, al = px[x, y]
            m[x, y] = 255 if (al > 200 and max(r, g, b) < DARK) else 0
    mask = mask.filter(ImageFilter.MinFilter(CUT))
    ImageDraw.floodfill(mask, (w // 2, h // 2), 128)
    hole = mask.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(CUT))
    # the flood's edge strays where the glass catches the lip's highlight (a step inward) or where the lip's
    # shadow is as dark as the glass (a step outward); the real opening is one rounded CRT rectangle, so fit
    # one (a superellipse, own half-axis per side) to the flood's edge with a robust loss and cut THAT
    hole = hole.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    hn = np.asarray(hole) > 128
    edge = hn & ~np.asarray(hole.filter(ImageFilter.MinFilter(3)), dtype=bool)
    ey, ex = np.nonzero(edge)
    ys, xs = np.nonzero(hn)
    cx0, cy0 = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    def sdist(p, x, y):
        al_, ar_, bt_, bb_, n = p
        dx = (x - cx0) / np.where(x > cx0, ar_, al_)
        dy = (y - cy0) / np.where(y > cy0, bb_, bt_)
        return ((np.abs(dx) ** n + np.abs(dy) ** n) ** (1 / n) - 1) * min(al_, bt_)
    p0 = [cx0 - xs.min(), xs.max() - cx0, cy0 - ys.min(), ys.max() - cy0, 6.0]
    fit = least_squares(sdist, p0, args=(ex.astype(float), ey.astype(float)), loss='soft_l1', f_scale=3.0)
    gy, gx = np.mgrid[0:h, 0:w]
    d = sdist(fit.x, gx.astype(float), gy.astype(float)) + INSET
    hole = Image.fromarray((np.clip(0.5 - d, 0, 1) * 255).astype(np.uint8))  # 1 px anti-aliased edge
    print(name, 'fit', [round(v, 1) for v in fit.x])
    hole = hole.filter(ImageFilter.GaussianBlur(1.0))
    al = im.getchannel('A')
    al = Image.composite(Image.new('L', (w, h), 0), al, hole)
    im.putalpha(al)

    # the checker paint: the model paints it red whatever the prompt says; DRIFT's is magenta (one red on the
    # site, and it is not this). Saturated red-to-pink pixels move to PAINT_HUE, value and saturation kept,
    # so the wear and the grime stay exactly as painted
    hsv = np.asarray(im.convert('RGB').convert('HSV')).copy()
    hue = hsv[..., 0].astype(int) * 360 // 255
    paint = ((hue >= 330) | (hue <= 20)) & (hsv[..., 1] > 90) & (hsv[..., 2] > 50)
    hsv[..., 0] = np.where(paint, PAINT_HUE * 255 // 360, hsv[..., 0])
    rgb = Image.fromarray(hsv, 'HSV').convert('RGB')
    rgb.putalpha(im.getchannel('A'))
    im = rgb
    print(name, 'paint px', int(paint.sum()))

    # bezel per side along the centre lines (outer alpha edge -> opening edge)
    hp = hole.load()
    cx, cy = w // 2, h // 2
    t = next(y for y in range(h) if hp[cx, y] > 128)
    b = h - 1 - next(y for y in range(h - 1, -1, -1) if hp[cx, y] > 128)
    l = next(x for x in range(w) if hp[x, cy] > 128)
    r = w - 1 - next(x for x in range(w - 1, -1, -1) if hp[x, cy] > 128)

    big = im.resize((w * 2, h * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    big.save(os.path.join(OUT, f'tv-broken-{n}.png'), optimize=True)
    sx, sy = round(w * 2 * SLICE_X), round(h * 2 * SLICE_Y)
    meta[n] = {'w': w * 2, 'h': h * 2, 'bezel': [t * 2, r * 2, b * 2, l * 2], 'slice': [sy, sx, sy, sx]}
    print(n, meta[n])

json.dump(meta, open(os.path.join(OUT, 'tv-broken.json'), 'w'), indent=1)
