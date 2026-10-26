# img/sky.webp + img/ground.webp: the fills for what neither photo saw.
#  sky    = a gpt-image-2 dusk horizon panorama (tools/gen-free.sh), re-graded row by row so its gradient matches the
#           landing frame's own sky at the same elevation (A's clean sky column x 1400-1530, el = atan((525-row)/1500));
#           prints the horizon row + elevation scale that world.js SKY needs.
#  ground = a gpt-image-2 top-down desert texture, matched (mean / std per channel) to the aerial's far desert.
# Usage: python3 -I flight/tools/match-sky-ground.py land.png aerial.png sky-raw.png ground-raw.png <outdir>
import sys
from PIL import Image
import numpy as np
land, aerial, sky_raw, ground_raw, out = sys.argv[1:6]
A = np.asarray(Image.open(land).convert('RGB')).astype(float)
P = np.asarray(Image.open(sky_raw).convert('RGB')).astype(float)
H, W = P.shape[:2]
lum = P.mean(axis=(1, 2)); d = np.diff(np.convolve(lum, np.ones(5) / 5, 'same'))
lo, hi = int(H * .80), int(H * .95); hz = lo + int(np.argmin(d[lo:hi]))
EL_TOP = 35.0; EL_BOT = EL_TOP * (H - hz) / hz
tgt_rows = np.arange(0, 520); tgt_el = np.degrees(np.arctan((525 - tgt_rows) / 1500.0))
tgt = np.median(A[0:520, 1400:1530], axis=1)
prow = np.arange(H); pel = np.where(prow <= hz, (hz - prow) / hz * EL_TOP, -(prow - hz) / (H - hz) * EL_BOT)
pmed = np.median(P, axis=1); gain = np.ones((H, 3))
for r in range(hz + 1):
    if pel[r] <= tgt_el.max():
        t = np.array([np.interp(pel[r], tgt_el[::-1], tgt[::-1, c]) for c in range(3)]); gain[r] = (t + 4) / (pmed[r] + 4)
top = [r for r in range(hz + 1) if pel[r] <= tgt_el.max()][0]; gain[:top] = gain[top]; gain[hz + 1:] = gain[hz]
k = 25; gs = np.stack([np.convolve(np.pad(gain[:, c], k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), 'valid') for c in range(3)], 1)
Image.fromarray(np.clip(P * gs[:, None, :], 0, 255).round().astype('uint8')).save(f'{out}/sky-matched.png')
print('sky: horizon at %.4f of the height, top %.1f deg, bottom -%.2f deg' % (hz / H, EL_TOP, EL_BOT))
B = np.asarray(Image.open(aerial).convert('RGB')).astype(float); ref = B[0:330].reshape(-1, 3)
G = np.asarray(Image.open(ground_raw).convert('RGB')).astype(float); g = G.reshape(-1, 3)
gm = (g - g.mean(0)) / (g.std(0) + 1e-6) * ref.std(0) * 0.9 + ref.mean(0)
Image.fromarray(np.clip(gm.reshape(G.shape), 0, 255).round().astype('uint8')).save(f'{out}/ground-matched.png'); print('ground matched')
