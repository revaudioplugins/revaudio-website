# textures for the studio corner: python3 -I corner_tex.py <scout dir>
# cymbal_col / cymbal_mr: ours (lathed bronze: tonal grooves, hammer marks, a smoother bell; no logo, no text)
# walnut_nat_*: Poly Haven walnut_veneer (CC0), natural colour x (0.5, 0.45, 0.42): a mid walnut (the room's lamps lift it; x 0.85 read as pale maple) (monitor sides, stand tops, the K2 shells)
import sys, os, math
import numpy as np
from PIL import Image
sc = sys.argv[1]; out = os.path.join(sc, 'work', 'corner_tex'); os.makedirs(out, exist_ok=True)
N = 1024; y, x = np.mgrid[0:N, 0:N].astype(np.float32); r = np.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5) / (N / 2)
rng = np.random.default_rng(5)
groove = 0.5 + 0.5 * np.sin(r * 2 * math.pi * 95) * (0.6 + 0.4 * np.sin(r * 2 * math.pi * 7.3))
bell = np.clip((0.2 - r) / 0.04, 0, 1)
base = np.array([196, 146, 78], np.float32)
col = base[None, None, :] * (0.82 + 0.22 * groove[..., None]) * (1 - 0.12 * np.clip((r - 0.9) / 0.1, 0, 1)[..., None])
col = col * (1 - bell[..., None]) + base * 1.08 * bell[..., None]
# hammer marks: soft dark dimples on the bow
for _ in range(450):
    rr = rng.uniform(0.25, 0.95); a = rng.uniform(0, 6.283); cx, cy = N / 2 + rr * N / 2 * math.cos(a), N / 2 + rr * N / 2 * math.sin(a)
    s = rng.uniform(4, 9); x0, x1, y0, y1 = int(max(0, cx - 3 * s)), int(min(N, cx + 3 * s)), int(max(0, cy - 3 * s)), int(min(N, cy + 3 * s))
    d = np.exp(-(((x[y0:y1, x0:x1] - cx) ** 2 + (y[y0:y1, x0:x1] - cy) ** 2) / (2 * s * s)))
    col[y0:y1, x0:x1] *= (1 - 0.035 * d)[..., None]
col[r > 1.0] = base * 0.5
Image.fromarray(col.clip(0, 255).astype(np.uint8)).save(os.path.join(out, 'cymbal_col.jpg'), quality=86)
mr = np.zeros((N, N, 3), np.float32); mr[..., 0] = 255; mr[..., 1] = (0.26 + 0.1 * groove * (1 - bell)) * 255; mr[..., 2] = 255
Image.fromarray(mr.clip(0, 255).astype(np.uint8)).save(os.path.join(out, 'cymbal_mr.jpg'), quality=86)
w = np.array(Image.open(os.path.join(sc, 'dl', 'walnut_veneer', 'walnut_veneer_diff_1k.jpg')).convert('RGB'), np.float32) * np.array([0.5, 0.45, 0.42], np.float32)
Image.fromarray(w.clip(0, 255).astype(np.uint8)).save(os.path.join(out, 'walnut_nat_col.jpg'), quality=85)
for k in ('nrm', 'arm'):
    Image.open(os.path.join(sc, 'work', 'desk_tex', f'walnut_{k}.jpg')).save(os.path.join(out, f'walnut_nat_{k}.jpg'), quality=85)
for f in sorted(os.listdir(out)): print(f, os.path.getsize(os.path.join(out, f)))
