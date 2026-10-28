"""GAS 2 radio: the scene pieces under the live radio, cut from Dan's frame (frames/f6-v17.png stays untouched).
  img/noradio.webp  the photo radio + its shadow + the old bench, painted out: from img/gen/scene-noradio.png (a masked
                    gpt-image-1 edit, gen_noradio.py), feathered into the frame
  img/stool.webp    the frame's own bench as a CUT-OUT (traced polygons: slab, 4 legs + feet, crossbar, brace; drawn 3x,
                    smoothed down), so the page can place + size it freely (Yoni 2026-10-23: "a bench where I can control
                    size + position of radio and stool, each separate")
Frame px (1536 x 1024). radio.css: .rp-noradio fixed; .rp-stool driven by --st-x / --st-y / --st-w / --st-h.
Usage: python player/tools/bench_patch.py"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SCENE = os.path.dirname(os.path.dirname(HERE))
IMG = os.path.join(os.path.dirname(HERE), 'img')
NR = (52, 515, 348, 796)        # the painted-out spot
ST = (52, 684, 349, 796)        # the stool's box in the frame (slab top ~697, feet ~791)
# the stool traced on a 3x zoom of ST (x = 52 + X / 3, y = 684 + Y / 3)
STOOL3X = [
    [(35, 34), (858, 34), (858, 70), (35, 70)],                                  # the slab (top + front edge)
    [(92, 62), (830, 62), (830, 80), (92, 80)],                                  # the apron under it
    [(95, 70), (137, 70), (133, 306), (100, 306)], [(78, 304), (138, 304), (138, 322), (78, 322)],    # left front leg + foot
    [(140, 70), (176, 70), (172, 266), (146, 266)], [(142, 264), (200, 264), (200, 282), (142, 282)], # left back leg + foot
    [(760, 70), (806, 70), (802, 302), (764, 302)], [(755, 300), (812, 300), (812, 320), (755, 320)], # right front leg + foot
    [(806, 70), (832, 70), (828, 268), (808, 268)],                              # right back leg (behind)
    [(135, 184), (792, 184), (792, 206), (135, 206)],                            # the crossbar
    [(128, 238), (178, 190), (184, 204), (136, 252)],                            # the brace
]


def noradio(nr):
    x0, y0, x1, y1 = NR
    im = Image.fromarray(np.clip(nr[y0:y1, x0:x1], 3, 252).astype(np.uint8)).convert('RGBA')
    h, w = y1 - y0, x1 - x0
    a = np.ones((h, w), np.float32)
    for i in range(8):
        k = (i + 1) / 9
        a[:, i] *= k; a[i, :] *= k; a[-1 - i, :] *= k
    for i in range(2):
        a[:, -1 - i] *= (i + 1) / 3   # the right edge meets the pump: a short feather only
    im.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    im.save(os.path.join(IMG, 'noradio.webp'), quality=90, method=6)
    print('noradio', im.size, f'css: left {x0 / 15.36:.4f}%  top {y0 / 10.24:.4f}%  width {w / 15.36:.4f}%  height {h / 10.24:.4f}%')


def stool(f):
    x0, y0, x1, y1 = ST
    w, h = x1 - x0, y1 - y0
    m = Image.new('L', (w * 3, h * 3), 0)
    d = ImageDraw.Draw(m)
    for poly in STOOL3X:
        d.polygon(poly, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(1.2)).resize((w, h), Image.LANCZOS)
    im = Image.fromarray(np.clip(f[y0:y1, x0:x1], 3, 252).astype(np.uint8)).convert('RGBA')
    im.putalpha(m)
    im.save(os.path.join(IMG, 'stool.webp'), quality=92, method=6)
    print('stool', im.size, f'natural: w {w / 15.36:.4f}cqw  h {h / 1024 * 200 / 3:.4f}cqw  centre {(x0 + x1) / 2 / 15.36:.4f}cqw  '
          f'bottom {y1 / 1024 * 200 / 3:.4f}cqw')


def main():
    f = np.asarray(Image.open(os.path.join(SCENE, 'frames', 'f6-v17.png')).convert('RGB')).astype(np.float32)
    nr = np.asarray(Image.open(os.path.join(IMG, 'gen', 'scene-noradio.png')).convert('RGB')).astype(np.float32)
    noradio(nr)
    stool(f)


if __name__ == '__main__':
    main()
