"""Round 3 of the taxi art (Dan 2026-10-31: "stop where you don't see the driver", "the window is not transparent, make
it transparent"). In: car.png (the lifted taxi, art facing right). Out: car2.png, the input of make-wheels.py.

1. The roof sign moves back over the rear door (DX px toward the tail, DY down): parked with the driver out of frame,
   the sign's words stay whole. Its tail end rides a few px over the roof's slope there; the gap is filled dark, a mount.
2. The windows see through: each glass becomes tinted, a little reflective at the top, so the page's own scene shows
   behind the cab; what's dark behind the glass (the driver, the pillars) stays solid, bright glints stay.

python3 make-glass.py car.png car2.png
"""
import sys
import numpy as np
from PIL import Image

DX, DY = -100, 8                                     # the sign's move, car.png px
SIGN_X = (786, 1340)                                  # the sign's span; above the roof line it is all sign
GLASS = {                                             # each window: a seed inside the glass + the box it can't leave
    'rear quarter': ((500, 300), (395, 612, 150, 352)),
    'rear door': ((900, 270), (614, 1054, 150, 352)),
    'front door': ((1150, 300), (1078, 1482, 150, 352)),
    'windshield': ((1560, 250), (1440, 1660, 150, 352)),
}
TINT_TOP, TINT_LOW, ALPHA_GLASS = np.array([46, 52, 66.]), np.array([20, 22, 28.]), .36

a = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float64)
H, W = a.shape[:2]
rgb, al = a[..., :3].copy(), a[..., 3].copy() / 255
lum = rgb @ [0.2126, 0.7152, 0.0722]
sat = (rgb.max(2) - rgb.min(2)) / (rgb.max(2) + 1e-6)

# ── 1. the roof sign ──
top = np.array([np.nonzero(al[:, x] > .5)[0].min() if (al[:, x] > .5).any() else H for x in range(W)])
x0, x1 = SIGN_X
# under the sign the roof starts at the first rows of yellow paint below the sign's dark base line (~y 96-100); the
# scan starts under the lit glass, which is warm yellow too
paint = (sat > .3) & (lum > 100) & (al > .9)
roof = top.copy()
for x in range(x0, x1):
    roof[x] = 102
    for y in range(95, 150):
        if paint[y:y + 4, x].all(): roof[x] = max(102, y); break
sign = np.zeros((H, W), bool)
for x in range(x0, x1):
    sign[:roof[x], x] = True
s_rgb, s_al = rgb.copy(), al * sign
rgb_out, al_out = rgb.copy(), al.copy()
al_out[sign] = 0                                      # the old sign goes; the roof under it was never hidden much
for x in range(x0, x1):                               # a soft new top edge on the roof it stood on
    al_out[roof[x], x] *= .55
# paste it back DX / DY over
moved = np.zeros((H, W)); moved_rgb = np.zeros((H, W, 3))
ys, xs_ = np.nonzero(sign)
ny, nx = ys + DY, xs_ + DX
ok = (ny >= 0) & (ny < H) & (nx >= 0) & (nx < W)
moved[ny[ok], nx[ok]] = s_al[ys[ok], xs_[ok]]; moved_rgb[ny[ok], nx[ok]] = s_rgb[ys[ok], xs_[ok]]
# the mount: where the roof drops away under the moved sign's tail, a dark foot fills the gap, feathered at its ends
roof_now = np.where((np.arange(W) >= x0) & (np.arange(W) < x1), roof, top)
cols = [x for x in range(x0 + DX, x1 + DX) if (moved[:, x] > .9).any()]
c0, c1 = min(cols) + 10, max(cols) - 10               # under the sign's body, not its glow
for x in range(c0, c1):
    solid = np.nonzero(moved[:, x] > .9)[0]
    if not len(solid): continue
    base, rt = solid.max() + 1, roof_now[x]
    k = min(1, (x - c0) / 8, (c1 - x) / 8)
    for y in range(base, rt + 2):                     # only the empty rows between the sign and the roof
        if moved[y, x] > .9: continue
        f = k * (1 - .3 * (y - base) / max(1, rt + 1 - base))
        moved_rgb[y, x] = [30, 22, 14]; moved[y, x] = max(moved[y, x], f)
rgb_out = moved_rgb * moved[..., None] + rgb_out * (1 - moved[..., None])
al_out = moved + al_out * (1 - moved)

# ── 2. the glass ──
lum2 = rgb_out @ [0.2126, 0.7152, 0.0722]
for name, ((sx, sy), (bx0, bx1, by0, by1)) in GLASS.items():
    cand = np.zeros((H, W), bool)
    cand[by0:by1, bx0:bx1] = (lum[by0:by1, bx0:bx1] < 128) & (sat[by0:by1, bx0:bx1] < .62) & (al[by0:by1, bx0:bx1] > .8)
    m = np.zeros_like(cand); m[sy, sx] = True
    while True:                                       # flood fill from the seed through the glass
        d = m.copy(); d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]; d &= cand
        if (d == m).all(): break
        m = d
    # fill the holes (glints, the driver's lit edges): whatever the box's border can't reach outside the glass is glass
    out = np.zeros_like(m); out[by0, bx0:bx1] = ~m[by0, bx0:bx1]; out[by1 - 1, bx0:bx1] = ~m[by1 - 1, bx0:bx1]
    out[by0:by1, bx0] = ~m[by0:by1, bx0]; out[by0:by1, bx1 - 1] = ~m[by0:by1, bx1 - 1]
    box = np.zeros_like(m); box[by0:by1, bx0:bx1] = True; free = box & ~m
    while True:
        d = out.copy(); d[1:] |= out[:-1]; d[:-1] |= out[1:]; d[:, 1:] |= out[:, :-1]; d[:, :-1] |= out[:, 1:]; d &= free
        if (d == out).all(): break
        out = d
    g = box & ~out
    g &= al_out > .5                                  # never where the moved sign now sits
    # soften the edge 1 px (the chrome frame)
    gf = g.astype(float); gf = (gf + np.roll(gf, 1, 0) + np.roll(gf, -1, 0) + np.roll(gf, 1, 1) + np.roll(gf, -1, 1)) / 5
    gf = np.minimum(gf, g.astype(float) + .5) * (gf > 0)
    L = lum2[g]; ref = np.percentile(L, 75)
    obj = np.clip((ref - lum2) / (.6 * ref), 0, 1) ** 1.2          # darker than the view behind = something in the cab
    glint = np.clip((lum2 - ref) / (255 - ref), 0, 1)               # brighter = a reflection on the glass
    keep = np.maximum(obj, glint)
    ty = np.clip((np.arange(H)[:, None] - by0) / (by1 - by0), 0, 1)
    tint = TINT_TOP * (1 - ty[..., None]) + TINT_LOW * ty[..., None]
    a_glass = np.maximum(ALPHA_GLASS + .12 * (1 - ty), np.maximum(obj, .85 * glint))
    new_rgb = tint * (1 - keep[..., None]) + rgb_out * keep[..., None]
    rgb_out = rgb_out * (1 - gf[..., None]) + new_rgb * gf[..., None]
    al_out = al_out * (1 - gf) + np.minimum(al_out, a_glass) * gf
    print(f'{name}: {int(g.sum())} px glass, view behind at lum {ref:.0f}, mean alpha {np.mean(a_glass[g]):.2f}')

Image.fromarray(np.dstack([np.clip(rgb_out, 0, 255), np.clip(al_out, 0, 1) * 255]).astype(np.uint8), 'RGBA').save(sys.argv[2])
print('sign moved', DX, DY, '- wrote', sys.argv[2])
