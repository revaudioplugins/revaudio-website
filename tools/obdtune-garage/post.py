# python3 post.py in.png out.jpg  — the render's own pixels only: focus falls off away from the tool, the column's side
# (right of the tool) drops into calm shadow, a light vignette. Box: left 672, top 336, 560 tall (0.852 wide).
import sys, numpy as np
from PIL import Image, ImageFilter
src = Image.open(sys.argv[1]).convert('RGB'); W, H = src.size
L, T, Tp = 672, 336, 560; Bw = 0.852 * Tp
sig = [0, 1.2, 2.5, 4.5, 7, 10, 14]
layers = [np.asarray(src if s == 0 else src.filter(ImageFilter.GaussianBlur(s)), dtype=np.float32) for s in sig]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx = np.maximum(np.maximum(L - xx, xx - (L + Bw)), 0); dy = np.maximum(np.maximum(T - yy, yy - (T + Tp)), 0)
d = np.sqrt(dx * dx + dy * dy) / Tp                                   # distance to the tool's box, in tool heights
ss = lambda a, b, x: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))
colk = ss(L + 0.88 * Tp, L + 1.04 * Tp, xx)                          # 0 left of the column, 1 behind it and beyond
s = 0.4 + 6.0 * ss(0.08, 1.4, d) + 5.0 * colk                       # the blur this pixel asks for
s = np.clip(s, 0, sig[-1])
out = np.zeros_like(layers[0])
for i in range(len(sig) - 1):                                         # blend the two layers around s
    a, b = sig[i], sig[i + 1]; w = np.clip((s - a) / (b - a), 0, 1)
    m = ((s >= a) & (s <= b))[..., None]
    out = np.where(m, layers[i] * (1 - w[..., None]) + layers[i + 1] * w[..., None], out)
lum = (out * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
out = lum + (out - lum) * (1 - 0.45 * colk[..., None])               # calmer colour behind the column
dark = 1 - 0.55 * colk                                                # down to 40 % behind the column
cx, cy = L + 0.5 * Bw, T + 0.55 * Tp
vig = 1 - 0.2 * ss(0.7, 2.0, np.sqrt(((xx - cx) / (1.3 * Tp)) ** 2 + ((yy - cy) / Tp) ** 2))
out = out * (dark * vig)[..., None]
l2 = (out * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
out = out / (1 + colk[..., None] * l2 / 70)                         # behind the column the highlights roll off (a lit dome, LEDs)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(sys.argv[2], quality=94, subsampling=0)
print(sys.argv[2], W, H)
