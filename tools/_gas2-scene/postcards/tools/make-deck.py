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


def box(a, r, axis):
    """Box blur along one axis; three passes come close to a gaussian. Brushed metal = noise smeared one way."""
    pad = [(0, 0), (0, 0)]
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode="reflect"), axis=axis, dtype=np.float64)
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
