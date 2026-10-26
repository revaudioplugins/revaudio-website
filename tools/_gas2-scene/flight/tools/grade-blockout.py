# Blue-hour grade of the flight lab's blockout render, the real shop front (mask = where the landing photo paints) untouched.
# gpt-image-2 keeps the exposure and colours of what it is given, so the dusk has to be in the input. Usage:
#   python3 -I flight/tools/grade-blockout.py blockout.png blockout-mask.png blockout-dusk.png [blue|last|lamp]
import sys
from PIL import Image, ImageFilter
import numpy as np
src_p, mask_p, out_p = sys.argv[1:4]
MOOD = sys.argv[4] if len(sys.argv) > 4 else 'blue'   # blue = blue hour · last = the last light · lamp = night, lamps only
src = np.asarray(Image.open(src_p).convert('RGB')).astype(float) / 255
m = np.asarray(Image.open(mask_p).convert('L')).astype(float) / 255
H, W = m.shape
ys, xs = np.nonzero(m > 0.5)
yy, xx = np.mgrid[0:H, 0:W].astype(float)
g = src * {'blue': np.array([0.46, 0.49, 0.60]), 'last': np.array([0.62, 0.53, 0.50]), 'lamp': np.array([0.30, 0.33, 0.45])}[MOOD]
lum = g.mean(axis=2, keepdims=True); g = lum + (g - lum) * 0.75
haze = np.clip(1 - yy / (H * 0.55), 0, 1)[..., None] ** 1.6
g = g * (1 - 0.3 * haze) + np.array([0.20, 0.22, 0.32]) * 0.3 * haze
glow = (np.clip(xx / W, 0, 1) * np.clip(1 - yy / H, 0, 1))[..., None] ** 2
g = g + np.array([0.20, 0.09, 0.03]) * {'blue': 0.5, 'last': 1.6, 'lamp': 0.15}[MOOD] * glow
cx, cy = (xs.min() + xs.max()) / 2, ys.max() + 4
r = np.sqrt(((xx - cx) / 240) ** 2 + ((yy - cy) / 120) ** 2)
pool = np.exp(-r ** 2 * 1.5)[..., None] * (yy >= ys.min())[..., None]
g = g + np.array([1.0, 0.62, 0.30]) * {'blue': 0.40, 'last': 0.30, 'lamp': 0.62}[MOOD] * pool
mm = np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2))).astype(float)[..., None] / 255
out = g * (1 - mm) + src * (0.92 * mm)
Image.fromarray((np.clip(out, 0, 1) * 255).round().astype('uint8')).save(out_p); print('graded', out_p, 'shop bbox', xs.min(), xs.max(), ys.min(), ys.max())
