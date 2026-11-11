# our own rack-gear atlas (no text, no logos): python3 -I rack_atlas.py <out dir>
# writes rack_atlas_col.jpg (sRGB colour) and rack_atlas_mr.jpg (R = 1, G = roughness, B = metalness), 1024 x 1024.
# Regions (pixels, y down) are mirrored in studio_desk.py (REG).
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out = sys.argv[1]; os.makedirs(out, exist_ok=True)
N = 1024
rng = np.random.default_rng(11)
col = np.zeros((N, N, 3), np.float32)
mr = np.zeros((N, N, 3), np.float32); mr[..., 0] = 255

REG = {
    'silver': (0, 0, 1024, 128), 'black': (0, 128, 1024, 256), 'cream': (0, 256, 1024, 384),
    'vent': (0, 384, 1024, 480), 'patch': (0, 480, 1024, 576), 'vu': (0, 576, 384, 824),
    'ledbar': (400, 576, 1024, 640), 'grey': (400, 656, 700, 944), 'dark': (720, 656, 1024, 944),
    'rail': (0, 960, 1024, 1024), 'needle': (400, 700, 420, 940),
}
def fill(r, rgb, rough, metal, noise=0.0, streak=False):
    x0, y0, x1, y1 = r; h, w = y1 - y0, x1 - x0
    base = np.array(rgb, np.float32)[None, None, :].repeat(h, 0).repeat(w, 1)
    if noise:
        n = rng.normal(0, noise, (h, w)).astype(np.float32)
        if streak:  # brushed: long horizontal streaks (coarse along x, fine along y) plus a little grain
            coarse = rng.normal(0, 1, (h, max(2, w // 60))).astype(np.float32)
            n = np.array(Image.fromarray(coarse).resize((w, h), Image.BILINEAR), np.float32) * noise + rng.normal(0, noise * 0.35, (h, w))
        base += n[..., None]
    col[y0:y1, x0:x1] = base
    mr[y0:y1, x0:x1, 1] = rough * 255; mr[y0:y1, x0:x1, 2] = metal * 255

fill(REG['silver'], (176, 178, 181), 0.34, 0.9, 7, streak=True)
fill(REG['black'], (30, 30, 32), 0.42, 0.35, 2.5)
fill(REG['cream'], (206, 193, 162), 0.5, 0.0, 4)
fill(REG['vent'], (28, 28, 30), 0.48, 0.3, 2)
fill(REG['patch'], (26, 26, 28), 0.45, 0.3, 2)
fill(REG['vu'], (240, 224, 178), 0.3, 0.0, 2)
fill(REG['ledbar'], (14, 16, 14), 0.3, 0.0, 1)
fill(REG['grey'], (40, 40, 42), 0.75, 0.0, 3)
fill(REG['dark'], (16, 16, 17), 0.6, 0.0, 1.5)
fill(REG['rail'], (178, 178, 172), 0.36, 0.85, 6, streak=True)
fill(REG['needle'], (12, 12, 12), 0.5, 0.0, 0)
img = Image.fromarray(col.clip(0, 255).astype(np.uint8)); d = ImageDraw.Draw(img)
mimg = Image.fromarray(mr.clip(0, 255).astype(np.uint8)); md = ImageDraw.Draw(mimg)

# vent panel (1U, 482.6 x 44.45 mm -> 1024 x 96 px): three rows of rounded slots
x0, y0, x1, y1 = REG['vent']
for row in range(3):
    cy = y0 + 22 + row * 26
    for k in range(34):
        cx = 70 + k * 26
        d.rounded_rectangle((cx - 9, cy - 5, cx + 9, cy + 5), radius=5, fill=(5, 5, 6))
        d.line((cx - 7, cy + 6, cx + 7, cy + 6), fill=(54, 54, 58))  # the slot's lower lip catches the light
        md.rounded_rectangle((cx - 9, cy - 5, cx + 9, cy + 5), radius=5, fill=(255, 255, 0))
# patch bay (1U): two blank, off-white label strips (no writing) above the two jack rows (the jacks are geometry)
x0, y0, x1, y1 = REG['patch']
for sy in (y0 + 5, y0 + 50):
    d.rectangle((40, sy, 984, sy + 9), fill=(222, 218, 204)); md.rectangle((40, sy, 984, sy + 9), fill=(255, 200, 0))
# VU face: warm cream, tick arc, a red zone at the top end, the needle's pivot housing; no numbers, no words
x0, y0, x1, y1 = REG['vu']; w, h = x1 - x0, y1 - y0
cx, cy, R = x0 + w / 2, y0 + h * 0.98, h * 0.78
for i in range(21):
    a = math.radians(-50 + i * 5)
    r0 = R * (0.86 if i % 5 else 0.80); r1 = R * 0.93
    p0 = (cx + r0 * math.sin(a), cy - r0 * math.cos(a)); p1 = (cx + r1 * math.sin(a), cy - r1 * math.cos(a))
    d.line((p0, p1), fill=(200, 30, 24) if i >= 15 else (24, 22, 20), width=3 if i % 5 == 0 else 2)
d.arc((cx - R * 0.95, cy - R * 0.95, cx + R * 0.95, cy + R * 0.95), start=-140, end=-55, fill=(24, 22, 20), width=3)
d.arc((cx - R * 0.95, cy - R * 0.95, cx + R * 0.95, cy + R * 0.95), start=-55, end=-40, fill=(200, 30, 24), width=7)
d.pieslice((cx - 46, cy - 46, cx + 46, cy + 46), start=180, end=360, fill=(26, 24, 22))
d.rectangle((x0, y0, x1 - 1, y1 - 1), outline=(150, 132, 96), width=3)
# LED ladder (1U meter): two rows of 20 segments, lit part green -> amber -> red, the rest dark
x0, y0, x1, y1 = REG['ledbar']
for row, lit in ((0, 14), (1, 11)):
    for k in range(20):
        sx = x0 + 12 + k * 30; sy = y0 + 6 + row * 30
        on = k < lit
        c = ((70, 255, 110) if k < 13 else (255, 186, 40) if k < 17 else (255, 52, 30)) if on else (24, 30, 24)
        d.rectangle((sx, sy, sx + 22, sy + 20), fill=c)
# rack rail (16U along x, 64 px per U): EIA holes at 6.35 / 22.225 / 38.1 mm in each U, 9.5 mm square (cage-nut) holes
x0, y0, x1, y1 = REG['rail']; ppu = 64
for u in range(16):
    for mm in (6.35, 22.225, 38.1):
        hx = x0 + u * ppu + mm / 44.45 * ppu; hy = (y0 + y1) / 2; s = 9.5 / 44.45 * ppu / 2
        d.rectangle((hx - s, hy - s, hx + s, hy + s), fill=(8, 8, 8)); md.rectangle((hx - s, hy - s, hx + s, hy + s), fill=(255, 255, 0))
        d.line((hx - s, hy + s + 1, hx + s, hy + s + 1), fill=(220, 220, 214))
img.save(os.path.join(out, 'rack_atlas_col.jpg'), quality=90)
mimg.save(os.path.join(out, 'rack_atlas_mr.jpg'), quality=90)
print('ok', os.path.getsize(os.path.join(out, 'rack_atlas_col.jpg')), os.path.getsize(os.path.join(out, 'rack_atlas_mr.jpg')))
