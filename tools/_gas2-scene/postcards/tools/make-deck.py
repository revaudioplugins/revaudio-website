"""GAS 2 postcards - HEAR IT's back as one photo of a turntable seen from above (Dan, round 3: "less like a post card more
like a hole picture real vinyl animation"): the deck's body, drawn here from noise (no AI spend).

  python3 make-deck.py <scene dir>

Writes postcards/img/deck.webp, the card's whole back at 9 px a card unit (the card is 100 x 155 units, 1 unit = 1cqw):
a walnut frame mitred at the corners round a brushed-aluminium top plate under a lamp at the top left, the platter's well
and shadow, the arm's boss, scratches, dust and grime. What moves (platter, record, arm) and the controls are drawn over it
by postcards.html in the same units: keep C, R_PLATTER and P in step with its deck script.
"""
import sys, os, subprocess, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SCENE = sys.argv[1]
OUT = os.path.join(SCENE, "postcards", "img")
SC = 9                                        # px a card unit
W, H = 100 * SC, 155 * SC
FRAME = 3.6                                   # the walnut, all round
C, R_PLATTER, R_WELL = (50, 48), 42, 42.7     # the platter: centre, radius; the gap round it
P, R_BOSS = (77.25, 95.2), 7.1                # the arm's pivot, its boss
LAMP = math.atan2(-.8, -.6)                   # the way to the lamp (top left), in the plate's plane
rng = np.random.default_rng(31)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
ux, uy = (xx + .5) / SC, (yy + .5) / SC       # card units
rgb = lambda *c: np.array(c, np.float32) / 255


def box(a, r, axis, mode="reflect"):
    """Box blur along one axis; three passes come close to a gaussian. Brushed metal = noise smeared one way."""
    pad = [(0, 0), (0, 0)]
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode=mode), axis=axis, dtype=np.float64)
    n = a.shape[axis]
    if axis == 1:
        return (c[:, 2 * r + 1:2 * r + 1 + n] - c[:, :n]).astype(np.float32) / (2 * r + 1)
    return (c[2 * r + 1:2 * r + 1 + n] - c[:n]).astype(np.float32) / (2 * r + 1)


def stretched(sx, sy, octaves=3):
    """Value noise 0-1 in cells sx by sy px: long one way (the wood's fibres and figure)."""
    out, amp, tot = np.zeros((H, W), np.float32), 1.0, 0.0
    for o in range(octaves):
        cx, cy = max(1, sx / 2 ** o), max(1, sy / 2 ** o)
        g = rng.random((int(H / cy) + 2, int(W / cx) + 2)).astype(np.float32)
        out += np.asarray(Image.fromarray(g, "F").resize((W, H), Image.BICUBIC)) * amp
        tot, amp = tot + amp, amp * .5
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


def mask(draw, blur=0.0):
    """A shape drawn at SC px a unit, blurred by blur units, 0-1."""
    im = Image.new("L", (W, H), 0)
    draw(ImageDraw.Draw(im))
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur * SC))
    return np.asarray(im, np.float32) / 255


def disc(cx, cy, r):
    return lambda d: d.ellipse([(cx - r) * SC, (cy - r) * SC, (cx + r) * SC, (cy + r) * SC], fill=255)


def facing(cx, cy):
    """0-1: how much a surface tilted away from (cx, cy) faces the lamp."""
    return .5 + .5 * np.cos(np.arctan2(uy - cy, ux - cx) - LAMP)


dist = lambda cx, cy: np.hypot(ux - cx, uy - cy)

# ── the top plate: aluminium brushed side to side; the lamp falls off to the bottom right, and the brushing throws the
#    light back as a soft upright band under it ──
g1 = rng.standard_normal((H, W)).astype(np.float32)
g2 = rng.standard_normal((H, W)).astype(np.float32)
for _ in range(3):
    g1, g2 = box(g1, 46, 1), box(g2, 8, 1)
brush = .026 * g1 / g1.std() + .012 * g2 / g2.std()
for _ in range(260):                                          # long hairlines in the brushing
    y, x0, n = rng.integers(0, H), rng.integers(-300, W), rng.integers(90, 760)
    a, b = max(0, x0), min(W, x0 + n)
    if b - a > 8:
        brush[y, a:b] += rng.choice([-1, 1]) * rng.uniform(.012, .04) * np.sin(np.linspace(0, np.pi, b - a)) ** .6
lamp = (1 - .14 * np.clip(.42 * ux / 100 + .58 * uy / 155, 0, 1)
        + .07 * np.exp(-((ux - 23) / 15) ** 2) + .025 * np.exp(-((ux - 67) / 24) ** 2))
plate = rgb(201, 197, 189) * (lamp * (1 + brush))[..., None]

across = np.minimum(np.minimum(ux, 100 - ux), np.minimum(uy, 155 - uy))   # to the card's edge
inner = across - FRAME                                                    # into the plate from the walnut
grime = stretched(60, 60, 3)
plate *= (1 - .09 * np.clip(1 - inner / 2.2, 0, 1) * (.4 + .6 * grime))[..., None]   # dirt in the seams

scr = Image.new("L", (W, H), 0)                               # scratches, dings, dust: a well-used deck
d = ImageDraw.Draw(scr)
for _ in range(70):
    x, y, L = rng.uniform(FRAME, 100 - FRAME), rng.uniform(FRAME, 155 - FRAME), rng.uniform(.6, 7) * SC
    t = rng.uniform(-.5, .5) if rng.random() < .6 else rng.uniform(0, math.pi)
    pts = [(x * SC + math.cos(t) * L * k / 6 + rng.normal(0, .35), y * SC + math.sin(t) * L * k / 6 + rng.normal(0, .35)) for k in range(7)]
    d.line(pts, fill=int(rng.uniform(70, 200)), width=1)
for _ in range(160):
    x, y, r = rng.uniform(FRAME, 100 - FRAME) * SC, rng.uniform(FRAME, 155 - FRAME) * SC, rng.uniform(.4, 1.1)
    d.ellipse([x - r, y - r, x + r, y + r], fill=int(rng.uniform(90, 230)))
scr = np.asarray(scr.filter(ImageFilter.GaussianBlur(.35)), np.float32) / 255
plate += (.16 * scr)[..., None]
dents = np.zeros((H, W), np.float32)
for _ in range(7):
    cx, cy, r = rng.uniform(8, 92), rng.uniform(100, 150), rng.uniform(.25, .55)
    dd = dist(cx, cy)
    dents += np.clip(1 - dd / r, 0, 1) * (facing(cx, cy) - .5) * 2
plate *= (1 - .18 * dents)[..., None]
for cx, cy, rx, ry in ((30, 128, 5, 3), (70, 131, 4, 2.6), (18, 112, 3, 2)):   # finger smudges by the keys
    sm = np.exp(-(((ux - cx) / rx) ** 2 + ((uy - cy) / ry) ** 2))
    plate = plate * (1 - .035 * sm)[..., None] + (rgb(150, 146, 138) * (.25 * sm)[..., None] - plate * (.25 * sm)[..., None]) * .3

# ── what stands on the plate casts toward the bottom right; the walnut casts onto it along its top and left ──
shade = .5 * mask(disc(C[0] + 1.1, C[1] + 1.5, R_PLATTER), 1.3)
shade = np.maximum(shade, .42 * mask(disc(P[0] + .55, P[1] + .75, R_BOSS), .55))
shade = np.maximum(shade, .34 * np.exp(-np.clip(uy - FRAME, 0, None) / .45) * (uy >= FRAME))
shade = np.maximum(shade, .26 * np.exp(-np.clip(ux - FRAME, 0, None) / .45) * (ux >= FRAME))
img = plate * (1 - shade)[..., None]

# ── the platter's well: a dark gap; its outer wall catches the lamp on the far side ──
dc = dist(*C)
wall = rgb(28, 27, 25) + (34 * (1 - facing(*C)) ** 2 / 255)[..., None]
inwell = np.clip((R_WELL - dc) * SC, 0, 1)[..., None]
img = img * (1 - inwell) + wall * inwell
under = np.clip((R_PLATTER - .4 - dc) * SC, 0, 1)[..., None]       # the platter covers it: dark, so no halo at its edge
img = img * (1 - under) + rgb(22, 21, 20) * under

# ── the arm's boss: satin black with a chrome bevel, three screws ──
dp = dist(*P)
fb = facing(*P)
satin = rgb(31, 30, 29) + (22 * np.exp(-(dist(P[0] - 2.4, P[1] - 2.6) / 3.2) ** 2) / 255)[..., None]
chrome = rgb(84, 82, 78) + (rgb(238, 235, 228) - rgb(84, 82, 78)) * (fb ** 1.6)[..., None]
bevel = np.clip((dp - (R_BOSS - .55)) * SC, 0, 1)[..., None]
boss = satin * (1 - bevel) + chrome * bevel
for a in (math.radians(60), math.radians(150), math.radians(300)):
    sx, sy = P[0] + 5.3 * math.cos(a), P[1] + 5.3 * math.sin(a)
    ds = dist(sx, sy)
    head = np.clip((.62 - ds) * SC, 0, 1)[..., None]
    boss = boss * (1 - head) + (rgb(70, 69, 66) + (rgb(196, 193, 186) - rgb(70, 69, 66)) * (facing(sx, sy) ** 2)[..., None]) * head
    slot = (np.abs((ux - sx) * math.cos(a + .7) + (uy - sy) * math.sin(a + .7)) < .09) & (ds < .5)
    boss[slot] = rgb(24, 23, 22)
inboss = np.clip((R_BOSS - dp) * SC, 0, 1)[..., None]
img = img * (1 - inboss) + boss * inboss

# ── the walnut frame: four boards mitred at the corners, the grain along each, a roll-over on the outer edge ──
dt, db, dl, dr = uy, 155 - uy, ux, 100 - ux
side = np.argmin(np.stack([dt, db, dl, dr]), 0)               # 0 top 1 bottom 2 left 3 right
horiz = side < 2
fib = np.where(horiz, stretched(80, 1.4, 3), stretched(1.4, 80, 3))
fig = np.where(horiz, stretched(300, 26, 2), stretched(26, 300, 2))
rings = .5 + .5 * np.sin(2 * np.pi * (np.where(horiz, uy, ux) * 1.3 + 2.8 * fig))
t = np.clip(.12 + .4 * rings ** 1.6 + .5 * fib ** 1.2, 0, 1)
dark, mid, light = rgb(36, 21, 12), rgb(84, 52, 29), rgb(140, 97, 58)
wood = np.where((t < .5)[..., None], dark + (mid - dark) * (t / .5)[..., None], mid + (light - mid) * ((t - .5) / .5)[..., None])
pores = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(pores)
for _ in range(2600):
    x, y, L = rng.uniform(0, 100), rng.uniform(0, 155), rng.uniform(.25, 1.1)
    if min(x, 100 - x, y, 155 - y) > FRAME:
        continue
    h = min(y, 155 - y) <= min(x, 100 - x)
    d.line([(x * SC, y * SC), ((x + L * h) * SC, (y + L * (not h)) * SC)], fill=int(rng.uniform(80, 200)), width=1)
wood *= (1 - .45 * np.asarray(pores, np.float32)[..., None] / 255)
dot = np.choose(side, [.8, -.8, .6, -.6])                     # each board's outer edge against the lamp
outer = np.clip(1 - across / 1.1, 0, 1) ** 1.6
bev = np.clip(1 - (FRAME - across) / .45, 0, 1) ** 1.2
wood *= (1 + .42 * dot * outer - .32 * dot * bev + .05 * dot)[..., None]
rub = np.clip(1 - across / .9, 0, 1) * np.clip((stretched(14, 14, 2) - .52) * 3.2, 0, 1)
corner = np.min([dist(x, y) for x, y in ((0, 0), (100, 0), (0, 155), (100, 155))], axis=0)
rub = np.maximum(rub, np.clip(1 - corner / 4.5, 0, 1) ** 1.4 * np.clip((stretched(10, 10, 2) - .4) * 2.6, 0, 1))
wood = wood * (1 - .42 * rub[..., None]) + rgb(158, 124, 88) * (.42 * rub[..., None])   # lacquer worn through
ds_ = np.sort(np.stack([dt, db, dl, dr]), 0)
wood[(ds_[1] - ds_[0] < .06) & (across < FRAME)] *= .45      # the mitres
inframe = np.clip((FRAME - across) * SC + .5, 0, 1)[..., None]
img = img * (1 - inframe) + wood * inframe
seam = (inner >= 0) & (inner < .14)
img[seam] *= .3                                               # where the plate meets the wood

# ── the photo: the lamp's warmth, a soft vignette, a little grain ──
vig = 1 - .22 * np.clip((np.hypot((ux - 50) / 50, (uy - 77.5) / 77.5) - .5) / .8, 0, 1) ** 1.5
img = img * vig[..., None] * rgb(263, 255, 243)
img += rng.normal(0, 1.6 / 255, (H, W)).astype(np.float32)[..., None]
im = Image.fromarray(np.clip(img * 255 + .5, 0, 255).astype(np.uint8), "RGB")
tmp = os.path.join(OUT, "_tmp.png")
im.save(tmp)
subprocess.run(["cwebp", "-quiet", "-q", "80", "-m", "6", tmp, "-o", os.path.join(OUT, "deck.webp")], check=True)
os.remove(tmp)
print("deck.webp", im.size, os.path.getsize(os.path.join(OUT, "deck.webp")) // 1024, "KB")

# ── the switch bank (round 3, Dan: "I want the buttons to feel real"; then "i really like the buttons"): a graphite
#    escutcheon with two openings and two jewel-lamp sockets, an ivory key in each opening (a dished top, rounded edges),
#    lit like the deck (the lamp at the top left, 40° up): a height field, shaded, with its shadows, drawn at 2x and halved.
#    Three pictures: the bank with both keys latched in (deck-bank.webp) and one key's opening with a margin of bezel, up
#    and latched (deck-key-up / -down.webp). The page lays a key picture over each opening; the bank repeats every 43
#    units, so one pair serves A and B ──
BX0, BY0, BX1, BY1 = 4.5, 124.5, 95.5, 151.4      # the picture, card units
BEZ = (6.5, 126, 93.5, 149.5)                      # the escutcheon
OPEN = [(9, 132, 48, 147), (52, 132, 91, 147)]     # the openings; each key sits .55 in
LAMPS = [(28.5, 129.2), (71.5, 129.2)]
REGION = (7, 130, 50, 149)                         # key A's picture (B's is 43 to the right)
UP, DOWN = 4, -.6                                  # the key tops: out of the bezel (face at 1.0) / latched in below it
KEY, BEZEL = rgb(222, 212, 188), .16               # ivory keys (their shading reads), a graphite escutcheon
S2, EL = 20, math.radians(40)                      # px a unit while drawing; the lamp's height (the deck's shadows)
LV = np.array([-.6 * math.cos(EL), -.8 * math.cos(EL), math.sin(EL)], np.float32)


def sd_rrect(x, y, x0, y0, x1, y1, r):
    """Signed distance to a rounded rectangle, card units (negative inside)."""
    cx, cy, hx, hy = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    qx, qy = np.abs(x - cx) - hx, np.abs(y - cy) - hy
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r


def soft(a, r):
    """Three box blurs each way: close to a gaussian (PIL won't blur float pictures)."""
    for _ in range(3):
        a = box(box(a, r, 1), r, 0)
    return a


def bank(top):
    w, h = round((BX1 - BX0) * S2), round((BY1 - BY0) * S2)
    gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
    x, y = BX0 + (gx + .5) / S2, BY0 + (gy + .5) / S2
    Z, M = np.zeros((h, w), np.float32), np.zeros((h, w), np.int8)   # M: 0 plate 1 bezel 2 chrome 3 hole 4 floor 5 key
    db = sd_rrect(x, y, *BEZ, 1.6)
    inb = db < 0
    Z[inb], M[inb] = np.clip(.35 + .65 * -db[inb] / .5, .35, 1), 1   # a chamfered rim
    for x0, y0, x1, y1 in OPEN:
        do = sd_rrect(x, y, x0, y0, x1, y1, 1.2)
        ch = (do >= 0) & (do < .22) & inb
        Z[ch] = np.minimum(Z[ch], .75 + .25 * do[ch] / .22)            # the opening's lip
        Z[do < 0], M[do < 0] = -3, 4                                      # its floor, deep down
        k = (x0 + .55, y0 + .55, x1 - .55, y1 - .55)
        e, cy, hh, fr = -sd_rrect(x, y, *k, .8), (k[1] + k[3]) / 2, (k[3] - k[1]) / 2, .9
        t = top - .45 * (1 - ((y - cy) / hh) ** 2)                        # dished across, like a piano key
        z = np.where(e < fr, t - fr + np.sqrt(np.clip(fr * fr - (fr - e) ** 2, 0, None)), t)
        Z[e > 0], M[e > 0] = z[e > 0], 5
    for lx, ly in LAMPS:
        rr = np.hypot(x - lx, y - ly)
        ring = (rr >= .85) & (rr < 1.35)
        Z[ring], M[ring] = 1 + .35 * np.sin(np.pi * (rr[ring] - .85) / .5), 2
        Z[rr < .85], M[rr < .85] = .45, 3
    gzx = np.clip(np.gradient(Z, axis=1) * S2, -3, 3)
    gzy = np.clip(np.gradient(Z, axis=0) * S2, -3, 3)
    nl = np.sqrt(gzx ** 2 + gzy ** 2 + 1)
    nx, ny, nz = -gzx / nl, -gzy / nl, 1 / nl
    ndl = np.clip(nx * LV[0] + ny * LV[1] + nz * LV[2], 0, 1)
    rx, ry, rz = 2 * nz * nx, 2 * nz * ny, 2 * nz * nz - 1                # the mirror direction, seen from straight above
    occ = np.zeros((h, w), bool)                                           # shadows: march toward the lamp
    tan = math.tan(EL)
    for k in range(1, 172):
        a, b = round(.8 * k), round(.6 * k)
        src = np.zeros_like(Z)
        src[a:, b:] = Z[:h - a, :w - b]
        occ |= src > Z + k / S2 * tan + 1e-3
    sh = 1 - soft(occ.astype(np.float32), 2)
    zb = soft(Z, 7)
    ao = np.clip(1 - .45 * np.clip(zb - Z, 0, None), .28, 1)
    P43 = round(43 * S2)                                                   # brushed side to side, repeating every 43 units
    g = rng.standard_normal((h, P43)).astype(np.float32)
    for _ in range(3):
        g = box(g, 30, 1, "wrap")
    brush = np.tile(g / g.std(), (1, w // P43 + 1))[:, :w]
    lamp = np.clip(rx * LV[0] + ry * LV[1] + rz * LV[2], 0, 1)             # how straight the lamp mirrors in
    sky = .14 + .26 * np.clip(rz, 0, 1) ** 2
    lit = (.3 + .8 * ndl * sh) * ao
    alu = (BEZEL * (1 + .025 * brush) * lit + .55 * lamp ** 10 * sh + .1 * sky)[..., None] * rgb(255, 250, 242)
    chrome = np.clip(.05 + .85 * sky + 2.2 * lamp ** 10 * sh, 0, 1.2)[..., None] * rgb(250, 248, 244)
    F = .05 + .95 * (1 - nz) ** 5                                          # glossy plastic: the lamp shows on its edges
    key = KEY * lit[..., None] + (F * (sky + 4 * lamp ** 4 + 24 * lamp ** 24 * sh) * ao)[..., None] * rgb(255, 252, 248)
    col = np.select([(M == 1)[..., None], (M == 2)[..., None], (M == 3)[..., None], (M == 4)[..., None], (M == 5)[..., None]],
                    [alu, chrome, rgb(10, 8, 6) * np.ones_like(alu), (.012 * ao)[..., None] * np.ones_like(alu), key], 0)
    al = np.where(M > 0, 1, np.clip(.55 * (1 - sh) + .25 * (1 - ao), 0, .75)).astype(np.float32)   # off the bank: its shadow
    col = np.clip(col * rgb(263, 255, 243), 0, 1)
    im = Image.fromarray(np.dstack([col * al[..., None], al]).astype(np.float32).__mul__(255).round().astype(np.uint8), "RGBA")
    return im.reduce(2)                                                    # premultiplied, halved: 10 px a unit


def save(im, name, q=82):
    a = np.asarray(im, np.float32) / 255                                   # un-premultiply before encoding
    rgba = np.dstack([a[..., :3] / np.maximum(a[..., 3:], 1e-6), a[..., 3]])
    im = Image.fromarray(np.clip(rgba * 255 + .5, 0, 255).astype(np.uint8), "RGBA")
    tmp = os.path.join(OUT, "_tmp.png")
    im.save(tmp)
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-alpha_q", "90", "-m", "6", tmp, "-o", os.path.join(OUT, name)], check=True)
    os.remove(tmp)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)) // 1024, "KB")


down, up = bank(DOWN), bank(UP)
save(down, "deck-bank.webp")
box_ = tuple(round((v - o) * 10) for v, o in zip(REGION, (BX0, BY0, BX0, BY0)))
for im, name in ((up, "deck-key-up.webp"), (down, "deck-key-down.webp")):
    c = np.asarray(im.crop(box_), np.float32).copy()
    hh_, ww_ = c.shape[:2]
    yy_, xx_ = np.mgrid[0:hh_, 0:ww_]
    edge = np.minimum(np.minimum(xx_, ww_ - 1 - xx_), np.minimum(yy_, hh_ - 1 - yy_)) / 8   # fade over the outer .8 unit
    c *= np.clip(edge, 0, 1)[..., None]                                    # premultiplied: fade all four channels
    save(Image.fromarray(c.round().astype(np.uint8), "RGBA"), name)
