# contact sheet: python3 -I sheet.py <out.png> <cols> <cellW> <cellH> <img1> [<img2> ...]  (label = file stem, or "label=path")
import sys, os
from PIL import Image, ImageDraw, ImageFont

out, cols, cw, ch = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
items = []
for a in sys.argv[5:]:
    if '=' in a:
        lab, p = a.split('=', 1)
    else:
        p = a; lab = os.path.splitext(os.path.basename(a))[0]
    items.append((lab, p))
rows = (len(items) + cols - 1) // cols
lh = 26
sheet = Image.new('RGB', (cols * cw, rows * (ch + lh)), (24, 24, 26))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 17)
except Exception:
    font = ImageFont.load_default()
for i, (lab, p) in enumerate(items):
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (60, 60, 64, 255)); bg.alpha_composite(im); im = bg.convert('RGB')
    im.thumbnail((cw, ch))
    x, y = (i % cols) * cw, (i // cols) * (ch + lh)
    sheet.paste(im, (x + (cw - im.width) // 2, y + lh + (ch - im.height) // 2))
    d.text((x + 6, y + 4), lab, fill=(235, 225, 200), font=font)
sheet.save(out)
print(out, sheet.size)
