"""The drone intro's AI art -> the files world.js loads (revaudio-59, 2026-10-28).
  python -I drone/tools/post-art.py <aerial.png> <near.png> <car.png> <out img dir>
aerial.png = gpt-image-2 over ortho.cjs's guide of AER (prompt-aerial.txt); near.png = gpt-image-2 over the aerial's crop
of RN, blown up (prompt-near.txt); car.png = gpt-image-2, top-down on flat magenta. Both ground images keep the guide's
straight edge between the pale lane and the dark lane (z -0.5); here it is softened into a ~1 m fade."""
import sys
import numpy as np, cv2
from PIL import Image

AER = (-23.5, -19, 39, 26)          # x0, z0, w, h metres; must match world.js
RN = (-6, -6.6, 12, 8)
LANE_Z = -0.5


def soften_lane_edge(img, rect):
    f = img.astype(np.float32) + 1
    ppm = img.shape[1] / rect[2]
    y0 = (LANE_Z - rect[1]) * ppm
    lum = f.mean(axis=2).mean(axis=1)                            # find the edge near where the guide had it
    win = int(.6 * ppm); lo, hi = int(y0) - win, int(y0) + win
    g = np.abs(np.diff(cv2.GaussianBlur(lum[lo:hi].reshape(-1, 1), (1, 0), sigmaX=0, sigmaY=3).ravel()))
    y0 = lo + int(np.argmax(g)) + .5
    L = cv2.GaussianBlur(f, (0, 0), sigmaX=.4 * ppm, sigmaY=1.5)  # tone along the edge, row by row: it keeps the step, so f / L (the detail) has none
    sy = .5 * ppm
    Ls = cv2.GaussianBlur(L, (1, int(6 * sy) | 1), sigmaX=0, sigmaY=sy)
    w = np.exp(-((np.arange(f.shape[0]) - y0) / (.4 * ppm)) ** 2)[:, None, None]
    out = f * (1 + w * (Ls / L - 1)) - 1
    print(f'lane edge at row {y0:.0f} (z {rect[1] + y0 / ppm:.2f} m)')
    return np.clip(out, 0, 255).astype(np.uint8)


def key_car(img):
    a = img.astype(np.float32)
    m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]             # magenta strength (the car has none: its G >= min(R, B))
    alpha = 1 - np.clip((m - 30) / 90, 0, 1)
    alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8))          # no magenta fringe
    spill = np.clip(m, 0, None)
    a[..., 0] -= spill; a[..., 2] -= spill                       # despill the soft edges
    rgba = np.dstack([np.clip(a, 0, 255), alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(alpha > .5)
    pad = 4
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad + 1, img.shape[1]), min(ys.max() + pad + 1, img.shape[0]))
    print('car box', box, 'aspect', round((box[2] - box[0]) / (box[3] - box[1]), 3))
    return Image.fromarray(rgba).crop(box)


aerial, near, car, out = sys.argv[1:5]
def tone_from(detail, tone_src, sigma):
    # detail's fine texture under tone_src's light and colour (blurred at sigma px): the close-up then meets the aerial
    # round it without a lighter patch (the hover sees both at once)
    d = detail.astype(np.float32) + 1; t = cv2.resize(tone_src, detail.shape[1::-1], interpolation=cv2.INTER_CUBIC).astype(np.float32) + 1
    return np.clip(d * cv2.GaussianBlur(t, (0, 0), sigma) / cv2.GaussianBlur(d, (0, 0), sigma) - 1, 0, 255).astype(np.uint8)


def tame_lamp_pool(img, rect, target):
    # The AI lit the road in front of the curb with a strong orange lamp pool; the page photo's road there (its bottom
    # rows, where the 3D ground meets it at touchdown) is a pale beige. Darken only, toward the photo's colour, on the
    # road from the curb (z -4.8) fading out by z -1; the same world-space field on both images keeps them equal.
    f = img.astype(np.float32) + 1
    ppm = img.shape[1] / rect[2]
    z = rect[1] + (np.arange(f.shape[0]) + .5) / ppm; x = rect[0] + (np.arange(f.shape[1]) + .5) / ppm
    wz = np.clip((z + 4.9) / .1, 0, 1) * np.clip((-1 - z) / 2, 0, 1); wx = np.clip((9 - np.abs(x)) / 3, 0, 1)
    w = (wz[:, None] * wx[None, :])[..., None]
    if not w.any(): return img
    T = cv2.GaussianBlur(f, (0, 0), .4 * ppm)
    g = cv2.GaussianBlur(np.minimum(1, (np.array(target, np.float32) + 1) / T), (0, 0), .4 * ppm)
    return np.clip(f * (1 + w * (g - 1)) - 1, 0, 255).astype(np.uint8)


land = np.asarray(Image.open(f'{out}/land.webp').convert('RGB')).astype(np.float32)
road = land[-38:, land.shape[1] // 2 - 640:land.shape[1] // 2 + 640].reshape(-1, 3).mean(0)   # the page photo's bottom rows: the road ~3.9 m out
print('photo road colour', road.round(1))
A = soften_lane_edge(np.asarray(Image.open(aerial).convert('RGB')), AER)
N = soften_lane_edge(np.asarray(Image.open(near).convert('RGB')), RN)
k = A.shape[1] / AER[2]
crop = A[round((RN[1] - AER[1]) * k):round((RN[1] + RN[3] - AER[1]) * k), round((RN[0] - AER[0]) * k):round((RN[0] + RN[2] - AER[0]) * k)]
N = tone_from(N, crop, .4 * N.shape[1] / RN[2])
A, N = tame_lamp_pool(A, AER, road), tame_lamp_pool(N, RN, road)
for img, name in ((A, 'aerial'), (N, 'near')):     # 2560 x 1707, q75: ~0.55 MB + ~1.1 MB (the near one loads after the hover shows)
    Image.fromarray(img).resize((2560, 1707), Image.LANCZOS).save(f'{out}/{name}.webp', quality=75, method=6)
key_car(np.asarray(Image.open(car).convert('RGB'))).save(f'{out}/car.webp', quality=88, method=6)
