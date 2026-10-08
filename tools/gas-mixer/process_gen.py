"""Trim the gpt-image-1 renders in bench/assets/gas-mixer/img/gen/ for the bench: drop the faint alpha haze, crop to
the object (+pad), scale to 2x the display size. Prints the fuel gauge's needle geometry as fractions of the crop."""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GEN = os.path.join(ROOT, 'bench', 'assets', 'gas-mixer', 'img', 'gen')
OUT = os.path.join(ROOT, 'bench', 'assets', 'gas-mixer', 'img')

def trim(im, pad=4, thr=128, haze=40):
    a = np.array(im)
    a[:, :, 3] = np.where(a[:, :, 3] < haze, 0, a[:, :, 3])
    im = Image.fromarray(a)
    ys, xs = np.nonzero(a[:, :, 3] > thr)
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad + 1), min(im.height, ys.max() + pad + 1))
    return im.crop(box), box

for slug, width in [('tag-blank', 320), ('fuel-gauge', 340)]:
    src = os.path.join(GEN, slug + '.png')
    im, box = trim(Image.open(src).convert('RGBA'))
    k = width / im.width
    im.resize((width, round(im.height * k)), Image.LANCZOS).save(os.path.join(OUT, slug + '.png'), optimize=True)
    print(slug, 'crop', box, '->', (width, round(im.height * k)), 'aspect', round(im.width / im.height, 3))
    if slug == 'fuel-gauge':
        # pivot cap + arc ends measured on the 1536x1024 render (dark-brown scale ink on the cream face)
        g = np.array(Image.open(src).convert('RGB')).astype(int)
        ink = (g[:, :, 0] < 120) & (g[:, :, 1] < 80) & (g[:, :, 2] < 60)
        band = ink[330:480, 380:1150]
        ys, xs = np.nonzero(band); xs += 380; ys += 330
        left, right = xs.min(), xs.max()
        top = ys[(xs > 740) & (xs < 790)].min()
        piv = (768, 735)
        fx = lambda x: round((x - box[0]) / (box[2] - box[0]), 4)
        fy = lambda y: round((y - box[1]) / (box[3] - box[1]), 4)
        import math
        aL = math.degrees(math.atan2(left - piv[0], piv[1] - ys[xs == left].min()))
        aR = math.degrees(math.atan2(right - piv[0], piv[1] - ys[xs == right].min()))
        print('  arc x', left, right, 'top y', top, '| pivot frac', fx(piv[0]), fy(piv[1]),
              '| arc-top radius frac of height', round((piv[1] - top) / (box[3] - box[1]), 4), '| end angles', round(aL, 1), round(aR, 1))
