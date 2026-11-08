# The bake-off sheet: A (live lights) | B (baked) per walk spot, and the change B / A as display light (system python3 + Pillow).
#   python3 room-sheet.py <shots dir> [--cols A,B] [--at 0,0.3,0.6,0.8,0.97] [--half]  -> <dir>/sheet.png (+ sheet-half.png)
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]
opt = {a.split('=')[0]: a.split('=')[1] if '=' in a else '1' for a in sys.argv[2:]}
cols = opt.get('--cols', 'A,B').split(','); at = opt.get('--at', '0,0.3,0.6,0.8,0.97').split(',')
NAME = {'A': 'A · live lights (room.html today)', 'B': 'B · baked (?light=baked)', 'Bfast': 'B fast (?light=baked&spec=0)', 'Bktx': 'B, UASTC KTX2 packs', 'Bmix': 'B mix (?light=baked&spec=mix)'}
font = ImageFont.load_default(size=18); small = ImageFont.load_default(size=15)
dec = lambda v: np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
first = Image.open(os.path.join(d, f'{cols[0]}-{at[0]}.png')); W, H = first.size
heat = len(cols) >= 2
ncol = len(cols) + (1 if heat else 0)
bar = 30
sheet = Image.new('RGB', (ncol * W + (ncol - 1) * 6, 34 + len(at) * (H + bar)), (16, 15, 14))
dr = ImageDraw.Draw(sheet)
for c, k in enumerate(cols + ([f'{cols[1]} / {cols[0]}, display light (blue darker, red brighter, +-50 %)'] if heat else [])):
    dr.text((c * (W + 6) + 8, 8), NAME.get(k, k), fill=(239, 233, 223), font=font)
for r, p in enumerate(at):
    y = 34 + r * (H + bar)
    ims = [Image.open(os.path.join(d, f'{k}-{p}.png')).convert('RGB') for k in cols]
    a, b = [dec(np.asarray(im) / 255.0) @ [0.2126, 0.7152, 0.0722] for im in ims[:2]]
    dr.text((8, y + 6), f'walk {p}:  mean display light {cols[0]} {a.mean():.4f}, {cols[1]} {b.mean():.4f} ({cols[1]} / {cols[0]} {b.mean() / a.mean():.3f})', fill=(246, 200, 93), font=small)
    for c, im in enumerate(ims): sheet.paste(im, (c * (W + 6), y + bar))
    if heat:
        rr = np.clip(np.log2(np.maximum(b, 1e-4) / np.maximum(a, 1e-4)) / np.log2(1.5), -1, 1)
        rr[(a < 2e-3) & (b < 2e-3)] = 0
        hm = np.zeros((H, W, 3)); hm[..., 0] = np.maximum(rr, 0); hm[..., 2] = np.maximum(-rr, 0); hm += (1 - np.abs(rr))[..., None] * 0.25 * np.sqrt(np.clip(a, 0, 1))[..., None]
        sheet.paste(Image.fromarray((np.clip(hm, 0, 1) * 255).astype(np.uint8)), (len(cols) * (W + 6), y + bar))
sheet.save(os.path.join(d, 'sheet.png'))
sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(os.path.join(d, 'sheet-half.png'))
print('WROTE', os.path.join(d, 'sheet.png'))
