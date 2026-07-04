#!/usr/bin/env python3
# gen-buy-square.py — RevLimiter crane buy-card: gritty hand-painted white "BUY NOW"
# square, stenciled on the weathered red truck door. Deterministic (fixed seed),
# pure Pillow (no numpy). Rerunnable. See notes at bottom for the look brief.
import random
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

SEED = 7
S = 560                    # canvas (square, transparent bg)
OUT = "/Users/danavivi/projects/revaudio/revaudio-website/src/assets/plugins/revlimiter-buy-square.png"
FONT = "/System/Library/Fonts/Supplemental/Impact.ttf"   # heavy condensed uppercase

# aged white paint band (NEVER pure white) + warm-brown stencil ink
C_DARK = (233, 226, 210)   # #e9e2d2
C_LITE = (244, 239, 228)   # #f4efe4
INK    = (36, 19, 16)      # #241310 near-black warm brown

random.seed(SEED)

# ---- noise helpers (pure-PIL, seeded) --------------------------------------
def rnd_img(w, h, seed):
    r = random.Random(seed)
    return Image.frombytes("L", (w, h), bytes(r.getrandbits(8) for _ in range(w * h)))

def cloud(w, h, scale, seed, blur):
    """low-freq blurry noise, 0..255, centered ~128."""
    sw, sh = max(1, w // scale), max(1, h // scale)
    small = rnd_img(sw, sh, seed)
    return small.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(blur))

def signed_add(base, noise, strength):
    """base + (noise-128)*strength, clamped. base,noise are 'L'."""
    pos = noise.point(lambda v: int((v - 128) * strength) if v > 128 else 0)
    neg = noise.point(lambda v: int((128 - v) * strength) if v < 128 else 0)
    return ImageChops.subtract(ImageChops.add(base, pos), neg)

# ---- 1. ragged paint patch mask -------------------------------------------
# solid rounded rect (~92% fill) → soft edge → shove the border with two noise
# octaves (big lobes + small teeth) → threshold = organic roller/brush edge.
m = int(S * 0.042)                       # margin ~4.2% => patch ~92% wide
base = Image.new("L", (S, S), 0)
ImageDraw.Draw(base).rounded_rectangle(
    [m, m, S - m, S - m], radius=int(S * 0.018), fill=255)
soft = base.filter(ImageFilter.GaussianBlur(7))

edge_lo = cloud(S, S, 11, 101, 5)        # big ragged lobes
edge_hi = cloud(S, S, 4, 102, 1.5)       # small teeth / brush chatter
shoved = signed_add(soft, edge_lo, 1.35)
shoved = signed_add(shoved, edge_hi, 0.7)
mask = shoved.point(lambda v: 255 if v >= 132 else 0)
mask = mask.filter(ImageFilter.GaussianBlur(0.6))   # 1px AA

# ---- 2. body alpha: 0.92..1.0 grain + thin ghost spots + chips -------------
grain = cloud(S, S, 5, 201, 1.4)                     # tooth (coarse = compresses)
# map grain 0..255 -> ~235..255 (0.92..1.0)
body = grain.point(lambda v: 235 + v * 20 // 255)
body = ImageChops.multiply(mask, body)               # clip to patch + porosity

# thin-alpha ghost spots: a few soft blobs pull alpha down to ~0.45 (red shows)
ghost = Image.new("L", (S, S), 0)
gd = ImageDraw.Draw(ghost)
gr = random.Random(301)
for _ in range(5):
    gx, gy = gr.randint(120, 440), gr.randint(120, 440)
    rr = gr.randint(28, 60)
    gd.ellipse([gx - rr, gy - rr, gx + rr, gy + rr], fill=gr.randint(70, 120))
ghost = ImageChops.multiply(ghost, mask).filter(ImageFilter.GaussianBlur(14))
body = ImageChops.subtract(body, ghost)

# 1-2 flake chips (near edges): small ragged fully-transparent bites
chip = Image.new("L", (S, S), 0)
cd = ImageDraw.Draw(chip)
for cx, cy, cr in [(96, 300, 20), (470, 150, 15)]:
    for _ in range(9):
        ox, oy = random.randint(-cr, cr), random.randint(-cr, cr)
        pr = random.randint(cr // 2, cr)
        cd.ellipse([cx + ox - pr, cy + oy - pr, cx + ox + pr, cy + oy + pr], fill=255)
chip = chip.filter(ImageFilter.GaussianBlur(1.2))
body = ImageChops.subtract(body, chip)

# one short subtle drip off the bottom edge
drip = Image.new("L", (S, S), 0)
dd = ImageDraw.Draw(drip)
dx = 330
dd.rounded_rectangle([dx - 7, S - m - 6, dx + 7, S - m + 34], radius=7, fill=235)
dd.ellipse([dx - 9, S - m + 24, dx + 9, S - m + 42], fill=235)
drip = drip.filter(ImageFilter.GaussianBlur(1.4))
body = ImageChops.lighter(body, drip)

# ---- 3. paint color: banded cream + vertical roller streaks + fine grain ----
# luminance field from a cloud (blotches) + vertical streaks, lerp DARK..LITE
blotch = cloud(S, S, 6, 401, 8)
streak = rnd_img(S // 6, 7, 402).resize((S, S), Image.BILINEAR).filter(
    ImageFilter.GaussianBlur(4))                     # vertical roller pull
lum = ImageChops.add(blotch.point(lambda v: v * 60 // 100),
                     streak.point(lambda v: v * 40 // 100))
fg = cloud(S, S, 5, 403, 1.2)                        # tooth (coarse = compresses)
lum = signed_add(lum, fg, 0.22)
paint = Image.new("RGB", (S, S))
pl = paint.load()
lm = lum.load()
for y in range(S):
    for x in range(S):
        t = lm[x, y] / 255.0
        pl[x, y] = tuple(int(C_DARK[i] + (C_LITE[i] - C_DARK[i]) * t) for i in range(3))

# ---- 4. stencil BUY / NOW: heavy condensed, spray-eroded, uneven density ----
def fit_font(word, target_w):
    sz = 10
    f = ImageFont.truetype(FONT, sz)
    while True:
        w = f.getbbox(word)[2] - f.getbbox(word)[0]
        if w >= target_w or sz > 520:
            return f, sz
        sz += 4
        f = ImageFont.truetype(FONT, sz)

txt = Image.new("L", (S, S), 0)
td = ImageDraw.Draw(txt)
target_w = int(S * 0.66)                              # glyph run width
lines = ["BUY", "NOW"]
font, fsz = fit_font(max(lines, key=len), target_w)
# vertical layout
line_h = fsz * 0.86
total_h = line_h * len(lines)
y0 = (S - total_h) / 2 - fsz * 0.12
for i, word in enumerate(lines):
    bb = font.getbbox(word)
    w = bb[2] - bb[0]
    x = (S - w) / 2 - bb[0]
    y = y0 + i * line_h - bb[1]
    td.text((x, y), word, fill=255, font=font)

# spray-stencil feel: SOLID glyphs, erosion only at the rim + a few pinholes.
# 1) gentle interior mottle (never below ~0.80 density)
dens = cloud(S, S, 3, 501, 1.4).point(lambda v: 206 + v * 49 // 255)
solid = ImageChops.multiply(txt, dens)
# 2) break the outer rim with speckle (rim = glyph minus its eroded core)
core = txt.filter(ImageFilter.MinFilter(9))
rim = ImageChops.subtract(txt, core)
bite = ImageChops.multiply(rim, cloud(S, S, 3, 502, 0.9).point(
    lambda v: 255 if v > 112 else 0))
txt_final = ImageChops.subtract(solid, bite)
# 3) a few sparse interior pinholes (overspray gaps), light and rare
pin = ImageChops.multiply(core, cloud(S, S, 2, 503, 0.4).point(
    lambda v: 255 if v < 10 else 0))
txt_final = ImageChops.subtract(txt_final, pin)
txt_final = txt_final.filter(ImageFilter.GaussianBlur(0.45))            # spray soft
txt_final = ImageChops.multiply(txt_final, mask)                         # clip to patch

# ---- 5. composite: paint(body) then ink -----------------------------------
canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
canvas = Image.alpha_composite(canvas, Image.merge("RGBA", (*paint.split(), body)))
ink_rgb = Image.new("RGB", (S, S), INK)
canvas = Image.alpha_composite(canvas, Image.merge("RGBA", (*ink_rgb.split(), txt_final)))

# downscale the 560 working canvas to 400 (still ~3x the ~125px CSS display →
# retina-crisp) — cuts pixel count ~2x so pngquant lands under 60KB.
FINAL = 400
canvas = canvas.resize((FINAL, FINAL), Image.LANCZOS)
canvas.save(OUT)
print("saved", OUT, canvas.size, "font=Impact", "fsz=", fsz)
# then: pngquant --force --nofs 64 --output OUT OUT  (deterministic, ~56KB)
