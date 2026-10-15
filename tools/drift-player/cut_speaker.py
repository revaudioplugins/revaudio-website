"""#hear speakers: cut the chosen gpt-image-1 render to a clean round speaker for the web.

  python tools/drift-player/cut_speaker.py speaker-2

gpt-image-1's "transparent" leaves a haze, so alpha is not trusted: the speaker is round, so its rim is found as the
strongest circle (OpenCV Hough on the luminance), cropped square round it and masked to that circle (1.2 px feather).
Out: public/drift/speaker.webp (360 x 360: ~124 css px at DPR 2 with room).
"""
import os, sys
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
name = sys.argv[1] if len(sys.argv) > 1 else 'speaker-1'
src = os.path.join(ROOT, 'bench', 'assets', 'drift-player', 'gen', name + '.png')
out = os.path.join(ROOT, 'public', 'drift', 'speaker.webp')

im = np.array(Image.open(src).convert('RGBA'))
rgb = im[:, :, :3]
g = cv2.GaussianBlur(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY), (0, 0), 2)
h, w = g.shape
cs = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.5, minDist=w, param1=80, param2=40, minRadius=int(w * .3), maxRadius=int(w * .5))
assert cs is not None, 'no circle found'
x, y, r = cs[0][0]
print(f'rim: centre {x:.0f},{y:.0f} radius {r:.0f}')
r = int(r) + 2
x0, y0 = int(x) - r, int(y) - r
crop = rgb[max(0, y0):y0 + 2 * r, max(0, x0):x0 + 2 * r]
yy, xx = np.mgrid[0:crop.shape[0], 0:crop.shape[1]]
d = np.hypot(xx + .5 - (x - max(0, x0)), yy + .5 - (y - max(0, y0)))
a = np.clip((r - 1 - d) / 1.2 + .5, 0, 1) * 255
res = Image.fromarray(np.dstack([crop, a.astype(np.uint8)])).resize((360, 360), Image.LANCZOS)
res.save(out, 'WEBP', quality=88, method=6, exact=True)
res.save(os.path.join(ROOT, 'bench', 'assets', 'drift-player', name + '-cut.png'))
print(f'{out}: {os.path.getsize(out) / 1e3:.0f} kB')
