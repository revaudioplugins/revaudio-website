"""The taxi's layers from its cut-out (taxi/README.md "The art").

In:  car.png (RGBA: the gpt-image-2 taxi lifted out of its frame with Apple Vision), wheel centres + radius below.
Out: body.webp (the car with each visible tyre cut out, so the wheels can turn under the fender), and per wheel
     ring-<w>.webp      the tyre + rim ring with its lighting divided out (it turns),
     ring-<w>-spin.webp the same, blurred round its centre (shown at speed),
     shade-<w>.webp     that lighting, as a multiply layer that stays put (the lamps don't turn with the wheel),
     hub-<w>.webp       the chrome dome, which stays put too (a dome's reflections don't turn).
At rest ring x shade = the painted tyre, so the parked taxi is the generated picture, pixel for pixel.

python3 make-wheels.py car.png <out-dir>
"""
import sys, json
import numpy as np
from PIL import Image

WHEELS = {'r': (512, 727), 'f': (1945, 733)}   # tyre centres in car.png px (fitted to the tyre's outer edge)
R = 171                                          # tyre radius
HUB = 84                                         # chrome dome radius (stays put)

src = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float64)
out = sys.argv[2]
H, W = src.shape[:2]
rgb, al = src[:, :, :3], src[:, :, 3] / 255
lum = rgb @ [0.2126, 0.7152, 0.0722]
sat = (rgb.max(2) - rgb.min(2)) / (rgb.max(2) + 1e-6)


def bilinear(img, x, y):
    x = np.clip(x, 0, img.shape[1] - 1.001); y = np.clip(y, 0, img.shape[0] - 1.001)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int); fx, fy = x - x0, y - y0
    if img.ndim == 3: fx, fy = fx[..., None], fy[..., None]
    return (img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy)
            + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy)


def smooth_circ(a, n, axis):
    """box-smooth a polar array along the (circular) angle axis, n cells wide, 3 passes ~ gaussian"""
    for _ in range(3):
        c = np.cumsum(np.concatenate([np.take(a, range(-n, 0), axis), a], axis), axis)
        a = (np.take(c, range(n, c.shape[axis]), axis) - np.take(c, range(0, c.shape[axis] - n), axis)) / n
    return a


body_alpha = al.copy()
meta = {'R': R, 'hub': HUB, 'car': [W, H], 'wheels': {}}
NA, NR = 1440, R + 3                                   # polar grid: 0.25 deg x 1 px
ang = np.radians(np.arange(NA) * 360 / NA)              # 0 = right, counter-clockwise, y up
for w, (cx, cy) in WHEELS.items():
    # the fender lip: per column, the lowest yellow-paint pixel in the disc's top half = where the tyre starts to show
    lip = np.full(W, -1.0)
    for x in range(cx - R, cx + R + 1):
        col = slice(cy - R - 30, cy)
        paint = (sat[col, x] > 0.42) & (lum[col, x] > 45)
        if paint.any(): lip[x] = cy - R - 30 + np.nonzero(paint)[0].max()
    yy, xx = np.mgrid[0:H, 0:W]
    dx, dy = xx - cx, yy - cy
    r = np.hypot(dx, dy)
    disc = r <= R + 0.5
    below = yy > lip[np.clip(xx, 0, W - 1)] + 1
    visible = disc & below & (al > 0.9)                 # painted tyre we can trust
    shown = disc & below                                # where the wheel layer shows through the body
    # polar view of the trusted tyre
    pr = np.arange(NR)[:, None]; pa = ang[None, :]
    px, py = cx + pr * np.cos(pa), cy - pr * np.sin(pa)
    P = bilinear(rgb, px, py); PL = bilinear(lum, px, py)
    PV = bilinear(visible.astype(float), px, py) > 0.99
    # lighting = the luminance smoothed round the ring (40 deg), from trusted cells only
    num = smooth_circ(np.where(PV, PL, 0), 160, 1); den = smooth_circ(PV.astype(float), 160, 1)
    S = np.where(den > 0.05, num / np.maximum(den, 1e-6), np.nan)
    for i in range(NR):                                  # rings with no trusted cell take the ring inside
        if np.isnan(S[i]).all(): S[i] = S[i - 1] if i else 1
        else: S[i] = np.where(np.isnan(S[i]), np.nanmean(S[i]), S[i])
    Smax = np.percentile(S, 95, axis=1, keepdims=True)
    # flattened tyre in polar, with the hidden cells (under the fender, the ground cut) taken from half a turn away
    F = P * (Smax / np.maximum(S, 1))[..., None]
    for i in range(NR):
        bad = ~PV[i]
        if bad.any():
            src_j = (np.arange(NA) + NA // 2) % NA
            ok = PV[i][src_j]
            F[i][bad & ok] = F[i][src_j][bad & ok]
            still = bad & ~ok
            if still.any(): F[i][still] = np.nanmean(F[i][PV[i]], 0) if PV[i].any() else F[i - 1][still]
    # back to a square disc image: trusted pixels stay exact (orig x Smax/S), the rest from the polar fill
    size = 2 * R + 6; o = R + 3
    ly, lx = np.mgrid[0:size, 0:size]
    gx, gy = lx - o + cx, ly - o + cy
    rr = np.hypot(lx - o, ly - o); th = np.mod(np.arctan2(-(ly - o), lx - o), 2 * np.pi)
    Sx = bilinear(S, th / (2 * np.pi) * NA, rr); Smx = bilinear(Smax[:, 0][:, None].repeat(2, 1), np.zeros_like(rr), rr)
    gxi, gyi = np.clip(gx, 0, W - 1).astype(int), np.clip(gy, 0, H - 1).astype(int)
    exact = visible[gyi, gxi] & (gx >= 0) & (gx < W) & (gy >= 0) & (gy < H)
    ring = bilinear(F, th / (2 * np.pi) * NA, rr)
    ring[exact] = rgb[gyi, gxi][exact] * (Smx / np.maximum(Sx, 1))[exact][:, None]
    edge = np.clip(R + 0.5 - rr, 0, 1)                   # anti-aliased tyre edge
    a_ring = edge * np.clip(rr - (HUB - 3), 0, 1)        # the ring stops under the dome's edge
    shade = np.clip(Sx / np.maximum(Smx, 1), 0, 1)
    # the spin blur: the ring averaged over +-14 deg about its own centre
    acc = np.zeros_like(ring); n = 0
    for d in np.linspace(-14, 14, 29):
        t = np.radians(d); c, s = np.cos(t), np.sin(t)
        sx = o + (lx - o) * c - (ly - o) * s; sy = o + (lx - o) * s + (ly - o) * c
        acc += bilinear(ring, sx, sy); n += 1
    spin = acc / n
    hub = rgb[gyi, gxi]; a_hub = np.clip(HUB + 0.5 - rr, 0, 1)
    def save(name, c, a):
        img = np.dstack([np.clip(c, 0, 255), np.clip(a, 0, 1) * 255]).astype(np.uint8)
        Image.fromarray(img, 'RGBA').save(f'{out}/{name}.webp', quality=92, method=6)
    save(f'ring-{w}', ring, a_ring); save(f'ring-{w}-spin', spin, a_ring)
    save(f'shade-{w}', np.repeat(shade[..., None] * 255, 3, 2), edge)
    save(f'hub-{w}', hub, a_hub)
    body_alpha[shown] = 0
    clip = np.mean(ring[a_ring > 0.5] >= 254.5)
    meta['wheels'][w] = {'cx': cx, 'cy': cy, 'clipped': round(float(clip), 4)}
    print(w, 'lip rows', int(lip[cx]), 'shown px', int(shown.sum()), 'clipped', f'{clip:.2%}')

body = np.dstack([rgb, body_alpha * 255]).astype(np.uint8)
Image.fromarray(body, 'RGBA').save(f'{out}/body.webp', quality=90, method=6)
json.dump(meta, open(f'{out}/wheels.json', 'w'), indent=1)
