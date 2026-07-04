#!/usr/bin/env python3
# gen-buy-patch.py — RevLimiter crane buy-card: TEXT-LESS aged-cream patch.
# Identical weathered-cream stamp to gen-buy-now-row.py (same seed, same 620×237
# canvas auto-fit around a "BUY NOW" run) but the ink-text stencil is SKIPPED —
# "BUY NOW" is now rendered as LIVE text on top in the bench/component, so its
# spacing + colour can be tuned. Sections 1–3 (patch) are byte-identical to the
# old stamp; only the glyph composite (old section 4) + ink layer are removed.
# The font is still measured to fix the SAME canvas size/aspect, so existing
# positions & sizes carry over unchanged. Deterministic (fixed seed), pure
# Pillow (no numpy). Rerunnable.
import random
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

SEED = 7
FSZ = 300                  # working glyph size (drives canvas auto-fit only)
PAD = 140                  # uniform stamp margin (working px)
OUT = "/Users/danavivi/projects/revaudio/revaudio-website/src/assets/plugins/revlimiter-buy-patch.png"
FONT = "/System/Library/Fonts/Supplemental/Impact.ttf"

C_DARK = (233, 226, 210)   # #e9e2d2
C_LITE = (244, 239, 228)   # #f4efe4

random.seed(SEED)

# canvas auto-fit: measure the one-row run at FSZ, wrap it in uniform padding
# (keeps the SAME 620×237 canvas as the old baked stamp so positions carry over)
font = ImageFont.truetype(FONT, FSZ)
WORD = "BUY NOW"
bb = font.getbbox(WORD)
tw, th = bb[2] - bb[0], bb[3] - bb[1]
W, H = tw + 2 * PAD, th + 2 * PAD

def rnd_img(w, h, seed):
    r = random.Random(seed)
    return Image.frombytes("L", (w, h), bytes(r.getrandbits(8) for _ in range(w * h)))

def cloud(w, h, scale, seed, blur):
    sw, sh = max(1, w // scale), max(1, h // scale)
    small = rnd_img(sw, sh, seed)
    return small.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(blur))

def signed_add(base, noise, strength):
    pos = noise.point(lambda v: int((v - 128) * strength) if v > 128 else 0)
    neg = noise.point(lambda v: int((128 - v) * strength) if v < 128 else 0)
    return ImageChops.subtract(ImageChops.add(base, pos), neg)

# ---- 1. ragged paint patch mask -------------------------------------------
m = int(min(W, H) * 0.05)
base = Image.new("L", (W, H), 0)
ImageDraw.Draw(base).rounded_rectangle(
    [m, m, W - m, H - m], radius=int(H * 0.07), fill=255)
soft = base.filter(ImageFilter.GaussianBlur(7))
edge_lo = cloud(W, H, 11, 101, 5)
edge_hi = cloud(W, H, 4, 102, 1.5)
shoved = signed_add(soft, edge_lo, 1.35)
shoved = signed_add(shoved, edge_hi, 0.7)
mask = shoved.point(lambda v: 255 if v >= 132 else 0)
mask = mask.filter(ImageFilter.GaussianBlur(0.6))

# ---- 2. body alpha: grain + ghost spots + chips ---------------------------
grain = cloud(W, H, 5, 201, 1.4)
body = grain.point(lambda v: 235 + v * 20 // 255)
body = ImageChops.multiply(mask, body)

ghost = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(ghost)
gr = random.Random(301)
for _ in range(5):
    gx = gr.randint(int(0.2 * W), int(0.8 * W))
    gy = gr.randint(int(0.28 * H), int(0.72 * H))
    rr = gr.randint(int(0.06 * H), int(0.13 * H))
    gd.ellipse([gx - rr, gy - rr, gx + rr, gy + rr], fill=gr.randint(70, 120))
ghost = ImageChops.multiply(ghost, mask).filter(ImageFilter.GaussianBlur(14))
body = ImageChops.subtract(body, ghost)

# chip bleach-blobs removed 2026-07-04 — the two clusters (0.13,0.62 & 0.87,0.4)
# punched white "dots" that landed on the live B (BUY) and W (NOW). Every other
# layer uses a locally-seeded RNG, so dropping this changes nothing else.

drip = Image.new("L", (W, H), 0)
dd = ImageDraw.Draw(drip)
dx = int(0.62 * W)
dd.rounded_rectangle([dx - 7, H - m - 6, dx + 7, H - m + 30], radius=7, fill=235)
dd.ellipse([dx - 9, H - m + 20, dx + 9, H - m + 38], fill=235)
drip = drip.filter(ImageFilter.GaussianBlur(1.4))
body = ImageChops.lighter(body, drip)

# ---- 3. paint colour: banded cream (fast per-pixel via composite) ----------
blotch = cloud(W, H, 6, 401, 8)
streak = rnd_img(W // 6, 7, 402).resize((W, H), Image.BILINEAR).filter(
    ImageFilter.GaussianBlur(4))
lum = ImageChops.add(blotch.point(lambda v: v * 60 // 100),
                     streak.point(lambda v: v * 40 // 100))
fg = cloud(W, H, 5, 403, 1.2)
lum = signed_add(lum, fg, 0.22)
paint = Image.composite(Image.new("RGB", (W, H), C_LITE),
                        Image.new("RGB", (W, H), C_DARK), lum)

# ---- 4. composite: paint(body) only — NO ink text -------------------------
canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
canvas = Image.alpha_composite(canvas, Image.merge("RGBA", (*paint.split(), body)))

# downscale to a retina-crisp final (target width ~620, same as old stamp)
FW = 620
f = FW / W
FH = round(H * f)
canvas = canvas.resize((FW, FH), Image.LANCZOS)
canvas.save(OUT)
print("saved", OUT, canvas.size, "  CSS aspect-ratio:", FW, "/", FH,
      "=", round(FW / FH, 3))
print("geom(working): W", W, "H", H, "tw", tw, "th", th,
      "  text-width frac", round(tw / W, 4), "  text-height frac", round(th / H, 4))
# then: pngquant --force --nofs 64 --output OUT OUT
