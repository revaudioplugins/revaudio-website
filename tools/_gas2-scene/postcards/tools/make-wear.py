"""GAS 2 postcards - the age on the cards (Dan 2026-10-29: "each card has it own character, I want it to feel worn out and
vintage, a little coffee stain on one card"), drawn here from noise (no AI spend).

  python3 make-wear.py <scene dir>

Writes postcards/img/: wear-1..6.webp (each card's own wear: browned edges, rubbed corners, foxing,
scuffs, sun-fade; the mail card's fold), coffee.webp (a cup set down twice: Regular), ringwear.webp (the record rubbing
through the card: HEAR IT), thumb.webp (a greasy thumb: Race), tape.webp (a strip of old tape, torn at both ends: card 1),
ink.webp (a rubber stamp's uneven ink, used as a mask).
"""
import sys, os, subprocess, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SCENE = sys.argv[1]
OUT = os.path.join(SCENE, "postcards", "img")


def webp(rgba, name, q=72):
    im = Image.fromarray(np.clip(rgba * 255 + .5, 0, 255).astype(np.uint8), "RGBA")
    tmp = os.path.join(OUT, "_tmp.png")
    im.save(tmp)
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-alpha_q", "70", "-m", "6", tmp, "-o", os.path.join(OUT, name)], check=True)
    os.remove(tmp)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)) // 1024, "KB")


def noise(w, h, cell, octaves, rng, gain=.5):
    """Value noise, 0-1: random grids cell px apart, bicubic up, octaves summed."""
    out, amp, tot = np.zeros((h, w), np.float32), 1.0, 0.0
    for o in range(octaves):
        c = cell / 2 ** o
        g = rng.random((max(2, int(h / c) + 2), max(2, int(w / c) + 2))).astype(np.float32)
        out += np.asarray(Image.fromarray(g, "F").resize((w, h), Image.BICUBIC)) * amp
        tot, amp = tot + amp, amp * gain
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


class Layer:
    """Straight colours composited 'over', premultiplied in float."""
    def __init__(s, w, h):
        s.rgb, s.a = np.zeros((h, w, 3), np.float32), np.zeros((h, w), np.float32)

    def over(s, color, a):
        a = np.clip(a, 0, 1).astype(np.float32)
        s.rgb = np.array(color, np.float32) / 255 * a[..., None] + s.rgb * (1 - a[..., None])
        s.a = a + s.a * (1 - a)

    def rgba(s):
        return np.dstack([s.rgb / np.maximum(s.a, 1e-6)[..., None], s.a])


def wear(seed, edge=1.0, fox=60, scuffs=10, fade=0.0, fade_deg=0, crease=None, w=480, h=744):
    rng = np.random.default_rng(seed)
    L = Layer(w, h)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))          # px to the nearest edge
    if fade:                                                                         # sun on one side: yellowed
        a = math.radians(fade_deg)
        t = np.clip((xx / w - .5) * math.cos(a) + (yy / h - .5) * math.sin(a) + .5, 0, 1)
        L.over((232, 198, 128), fade * t ** 1.6 * (.6 + .7 * noise(w, h, 150, 3, rng)))
    L.over((160, 116, 60), np.clip((noise(w, h, 170, 4, rng) - .5) * .22, 0, .05))     # uneven browning
    e = np.clip(1 - d / (w * .06), 0, 1) ** 1.7 * (.15 + 1.1 * noise(w, h, 90, 3, rng))
    L.over((108, 74, 38), e * .4 * edge)                                             # browned edges
    cd = np.min([np.hypot(xx - cx, yy - cy) for cx, cy in ((0, 0), (w, 0), (0, h), (w, h))], axis=0)
    rub = np.clip(1 - d / (w * .008), 0, 1) * np.clip((noise(w, h, 7, 2, rng) - .5) * 4, 0, 1)
    rub = np.maximum(rub, np.clip(1 - cd / (w * .06), 0, 1) ** 1.3 * np.clip((noise(w, h, 6, 2, rng) - .45) * 4, 0, 1))
    L.over((251, 245, 230), rub * .62 * edge)                                        # rubbed edge + corners
    fx = Image.new("L", (w, h), 0)
    dr = ImageDraw.Draw(fx)
    for _ in range(fox):                                                             # foxing, more near the edges
        x, y = rng.random() * w, rng.random() * h
        if rng.random() > .3 + .7 * (1 - min(x, w - x, y, h - y) / (w * .5)) ** 2:
            continue
        k = rng.random()
        r = rng.uniform(.8, 2.2) if k < .62 else rng.uniform(2, 4.2) if k < .92 else rng.uniform(5, 10)
        v = int(rng.uniform(50, 130) if r < 5 else rng.uniform(16, 36))
        dr.ellipse([x - r, y - r * rng.uniform(.7, 1.3), x + r, y + r * rng.uniform(.7, 1.3)], fill=v)
    fx = np.asarray(fx.filter(ImageFilter.GaussianBlur(.8)), np.float32) / 255 * (.55 + .9 * noise(w, h, 5, 2, rng))
    L.over((146, 92, 38), np.clip(fx, 0, .42))
    sc = Image.new("L", (w, h), 0)
    dr = ImageDraw.Draw(sc)
    for _ in range(scuffs):                                                          # light scuffs: the print rubbed
        x, y, a, ln = rng.random() * w, rng.random() * h, rng.uniform(0, math.pi), rng.uniform(18, 130)
        bend = rng.uniform(-3, 3)
        pts = [(x + math.cos(a) * t * ln - math.sin(a) * bend * math.sin(t * 3), y + math.sin(a) * t * ln + math.cos(a) * bend * math.sin(t * 3))
               for t in np.linspace(0, 1, 10)]
        dr.line(pts, fill=int(rng.uniform(30, 80)), width=1)
    L.over((248, 240, 222), np.asarray(sc.filter(ImageFilter.GaussianBlur(.45)), np.float32) / 255)
    if crease:                                                                       # a fold: a dark side, a lit side, grime
        (x0, y0), (x1, y1) = [(p[0] * w, p[1] * h) for p in crease]
        tl = math.hypot(x1 - x0, y1 - y0)
        nx, ny = (y1 - y0) / tl, -(x1 - x0) / tl
        sd = (xx - x0) * nx + (yy - y0) * ny
        t = ((xx - x0) * (x1 - x0) + (yy - y0) * (y1 - y0)) / tl ** 2
        ends = np.clip(np.minimum(t, 1 - t) * 7, 0, 1)
        brk = np.clip(.45 + .8 * noise(w, h, 16, 2, rng), 0, 1)
        L.over((150, 110, 64), np.exp(-sd ** 2 / 70) * .08 * ends)
        L.over((86, 62, 38), np.exp(-(sd - .9) ** 2 / .8) * .34 * ends * brk)
        L.over((255, 251, 238), np.exp(-(sd + 1.3) ** 2 / 1.1) * .5 * ends * brk)
    return L.rgba()


def coffee(seed, s=440):
    rng = np.random.default_rng(seed)
    L = Layer(s, s)
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    def ring(cx, cy, R, wid, strength):
        r, ang = np.hypot(xx - cx, yy - cy), np.arctan2(yy - cy, xx - cx)
        R = R * (1 + .014 * np.sin(ang * 3 + rng.uniform(0, 6)) + .008 * np.sin(ang * 7 + rng.uniform(0, 6)))
        nn = noise(s, s, 22, 3, rng)
        lift = np.clip(.3 + .7 * np.cos((ang - rng.uniform(-3, 3)) / 2) ** 2 + .4 * (nn - .5), 0, 1)  # thinner where the cup tipped
        L.over((156, 104, 52), np.where(r < R, np.exp(-(R - r) / (s * .07)), 0) * .13 * (.5 + nn))   # the wash, darker to the rim
        L.over((104, 58, 22), np.exp(-((r - R) / (wid * (.55 + .9 * nn))) ** 2) * strength * lift)     # the rim (coffee-ring effect)
    c = s / 2
    ring(c, c, s * .4, 3.4, .62)
    ring(c + rng.uniform(-16, 16), c + rng.uniform(-16, 16), s * .4, 2.3, .34)                       # set down twice
    for _ in range(4):                                                                               # drips off the rim
        a, rr = rng.uniform(0, 2 * math.pi), s * rng.uniform(.43, .48)
        x, y, rd = c + math.cos(a) * rr, c + math.sin(a) * rr, rng.uniform(2.5, 6)
        r = np.hypot(xx - x, yy - y)
        L.over((150, 98, 48), (r < rd) * .12)
        L.over((104, 58, 22), np.exp(-((r - rd) / 1.1) ** 2) * .4)
    return L.rgba()


def ringwear(seed, s=600):
    rng = np.random.default_rng(seed)
    L = Layer(s, s)
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    r, R = np.hypot(xx - s / 2, yy - s / 2), s * .47
    rubbed = np.clip((noise(s, s, 7, 3, rng) - .38) * 2.2, 0, 1) * (.5 + .8 * noise(s, s, 60, 2, rng))
    band = np.clip(1 - np.abs(r - R * .965) / (s * .03), 0, 1)
    L.over((253, 249, 238), (band * .75 + (r < R) * .07) * rubbed * .7)          # the ink rubbed off, most at the rim
    L.over((78, 64, 50), np.exp(-((r - R) / 1.5) ** 2) * .16 * (.4 + .8 * noise(s, s, 30, 2, rng)))
    L.over((250, 246, 234), np.exp(-(r / (s * .05)) ** 2) * .25 * rubbed)       # the spindle's bump
    return L.rgba()


def thumb(seed, w=240, h=300):
    rng = np.random.default_rng(seed)
    L = Layer(w, h)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w * .5, h * .56
    wx, wy = noise(w, h, 70, 2, rng) - .5, noise(w, h, 70, 2, rng) - .5
    X, Y = xx - cx + wx * 34, (yy - cy + wy * 34) / 1.3
    ridges = .5 + .5 * np.sin(np.sqrt(X ** 2 + Y ** 2) * 2 * math.pi / 5.2 + 2.2 * np.arctan2(Y, X) / (2 * math.pi))
    ridges = np.clip((ridges - .42) * 3, 0, 1)
    blob = np.exp(-((xx - cx) / (w * .34)) ** 2 - ((yy - cy) / (h * .37)) ** 2) * (.35 + .9 * noise(w, h, 18, 3, rng))
    a = Image.fromarray(np.clip((ridges * blob * .5 + blob * .07) * 255, 0, 255).astype(np.uint8), "L")
    L.over((44, 37, 30), np.asarray(a.filter(ImageFilter.GaussianBlur(.6)), np.float32) / 255)
    return L.rgba()


def tape(seed, w=360, h=100):
    """A strip of old tape: the roll's clean cut along the long edges, both ends torn (each row stops at its own x)."""
    rng = np.random.default_rng(seed)
    L = Layer(w, h)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    rag = lambda: np.interp(np.arange(h), np.linspace(0, h - 1, 8), rng.uniform(0, 16, 8)) + rng.uniform(0, 6, h)
    left, right = rag(), w - 1 - rag()
    inside = Image.fromarray((((xx >= left[:, None]) & (xx <= right[:, None])) * 255).astype(np.uint8), "L")
    inside = np.asarray(inside.filter(ImageFilter.GaussianBlur(.7)), np.float32) / 255
    L.over((230, 212, 152), inside * (.5 + .14 * (noise(w, h, 36, 3, rng) - .5)))           # the yellowed film, crinkled
    L.over((255, 251, 234), inside * np.clip(1 - yy / (h * .4), 0, 1) * .2)                 # light on its top half
    L.over((140, 112, 64), inside * (np.exp(-(yy / 2.5) ** 2) + np.exp(-((h - 1 - yy) / 2.5) ** 2)) * .28)   # grime on the edges
    return L.rgba()


def ink(seed, w=640, h=260):
    rng = np.random.default_rng(seed)
    dens = .72 + .4 * noise(w, h, 80, 3, rng)                                      # pressed harder here than there
    holes = np.clip((noise(w, h, 4, 2, rng) - .2) * 4, 0, 1)                       # the paper's tooth
    voids = np.clip((noise(w, h, 26, 3, rng) - .16) * 3.2, 0, 1)                   # dry patches
    a = np.clip(dens * holes * voids, 0, 1)
    return np.dstack([np.ones((h, w, 3), np.float32), a])


SPEC = {  # card: seed, wear
    "wear-1.webp": dict(seed=11, edge=1.0, fox=50, scuffs=26),                                  # the photo card: scuffed
    "wear-2.webp": dict(seed=22, edge=.9, fox=70, scuffs=8, fade=.16, fade_deg=-60),             # Regular: sun-faded
    "wear-3.webp": dict(seed=33, edge=.55, fox=24, scuffs=4),                                   # Premium: kept well
    "wear-4.webp": dict(seed=44, edge=1.25, fox=60, scuffs=22, fade=.06, fade_deg=120),          # Race: knocked about
    "wear-5.webp": dict(seed=55, edge=.9, fox=50, scuffs=10, fade=.08, fade_deg=30),             # HEAR IT front
    "wear-6.webp": dict(seed=66, edge=1.0, fox=110, scuffs=8, fade=.14, fade_deg=200,            # the mail card: folded
                        crease=((-.05, .27), (1.05, .35))),
}
for name, kw in SPEC.items():
    webp(wear(**kw), name)
webp(coffee(7), "coffee.webp")
webp(ringwear(8), "ringwear.webp")
webp(thumb(9), "thumb.webp")
webp(tape(12), "tape.webp", q=80)
webp(ink(10), "ink.webp", q=80)
