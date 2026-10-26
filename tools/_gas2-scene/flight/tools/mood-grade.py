# Usage: python3 -I flight/tools/mood-grade.py aerial-painted.png blockout-mask.png <outdir>  -> aerial-blue/last/lamp.png (then cwebp -q 92)
# Three light versions of the hover photo without new AI: a local grade of aerial-G2 (the shop front, where the
# landing photo paints, stays as it is). blue = as painted · last = the last light, warm afterglow from the right ·
# lamp = night fallen, the shop's light pool the only warm thing.
import sys
from PIL import Image, ImageFilter
import numpy as np
src_p, mask_p, outdir = sys.argv[1:4]   # the painted aerial, its blockout mask (lab ?mask=1), where to write
src = np.asarray(Image.open(src_p).convert('RGB')).astype(float) / 255
m = np.asarray(Image.open(mask_p).convert('L').filter(ImageFilter.GaussianBlur(2))).astype(float)[..., None] / 255
H, W = src.shape[:2]; yy, xx = np.mgrid[0:H, 0:W].astype(float)
ys, xs = np.nonzero(m[..., 0] > .5); cx, cy = (xs.min() + xs.max()) / 2, ys.max() + 4
r = np.sqrt(((xx - cx) / 260) ** 2 + ((yy - cy) / 130) ** 2); pool = np.exp(-r ** 2 * 1.4)[..., None]
lum = src.mean(axis=2, keepdims=True)
def save(name, g):
    out = np.clip(g * (1 - m) + src * m, 0, 1); Image.fromarray((out * 255).round().astype('uint8')).save(f'{outdir}/aerial-{name}.png')
save('blue', src)
# last light: lift + warm the ground and roof, an afterglow sweeping in from the upper right, violet in the shadows
glow = (np.clip(xx / W, 0, 1) ** 1.2 * np.clip(1 - yy / H, 0, 1) ** .8)[..., None]
g = src * np.array([1.18, 1.02, .92]) + np.array([.05, .02, .03]) * (1 - lum * 3).clip(0, 1)
g = g + np.array([.30, .14, .07]) * glow * (.35 + .65 * (1 - pool))
save('last', g)
# lamp-lit night: down a stop and bluer everywhere but the shop's own light, which spreads further and warmer
night = src * np.array([.55, .6, .78]); night = night.mean(axis=2, keepdims=True) * .35 + night * .65
g = night * (1 - .55 * pool) + src * np.array([1.12, 1.0, .82]) * .55 * pool + np.array([.18, .1, .04]) * pool * .6
save('lamp', g)
print('saved aerial-blue/last/lamp.png')
