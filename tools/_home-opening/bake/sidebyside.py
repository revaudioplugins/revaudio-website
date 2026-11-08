# Assemble compare.py's panels into one labelled image (system python3 with Pillow).
#   python3 sidebyside.py <compare out dir>   -> <dir>/side-by-side.png (all configs, half size) + bake_all-full.png
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

d = sys.argv[1]
res = json.load(open(os.path.join(d, 'parity.json')))
rows = [k for k in ('bake_G1_lamp', 'bake_G2_neon', 'bake_all', 'bake_dial', 'live_G1_lamp_direct', 'bake_all_blender_agx') if k in res]
TITLE = {'bake_G1_lamp': 'G1 amber lamp alone (baked)', 'bake_G2_neon': 'G2 violet tube alone (baked)',
         'bake_all': 'both groups (baked, one PNG)', 'bake_dial': 'dial g1=0.5 g2=1 vs 0.5 x Blender G1 + G2',
         'live_G1_lamp_direct': 'G1 as a LIVE three.js PointLight vs Blender direct-only',
         'bake_all_blender_agx': 'both groups, finish = Blender AgX LUT (?finish=blender)'}
pw, ph, bar = 570, 318, 26
font = ImageFont.load_default(size=14)
out = Image.new('RGB', (pw * 3 + 8, (ph + bar) * len(rows) + 30), (16, 15, 14))
dr = ImageDraw.Draw(out)
for c, t in enumerate(('Blender Cycles, AgX', 'three.js test.html, AgX finish', 'linear ratio three/Blender - 1 (red +10 %, blue -10 %)')):
    dr.text((c * (pw + 4) + 6, 7), t, fill=(239, 233, 223), font=font)
for r, k in enumerate(rows):
    y = 30 + r * (ph + bar)
    lin = res[k]['linear']
    dr.text((6, y + 5), f"{TITLE[k]}  |  linear mean ratio: white wall {lin['white_wall']['ratio_mean']:.3f}, grey card {lin['grey_card']['ratio_mean']:.3f}"
            f"  |  display: wall {res[k]['display']['white_wall']['ratio_mean']:.3f}, card {res[k]['display']['grey_card']['ratio_mean']:.3f}",
            fill=(246, 200, 93), font=font)
    for c, nm in enumerate(('blender', 'three', 'heat')):
        im = Image.open(os.path.join(d, f'{k}.{nm}.png')).convert('RGB').resize((pw, ph), Image.LANCZOS)
        out.paste(im, (c * (pw + 4), y + bar))
out.save(os.path.join(d, 'side-by-side.png'))
if 'bake_all' in res:
    a = Image.open(os.path.join(d, 'bake_all.blender.png')).convert('RGB')
    b = Image.open(os.path.join(d, 'bake_all.three.png')).convert('RGB')
    full = Image.new('RGB', (a.width * 2 + 6, a.height), (16, 15, 14))
    full.paste(a, (0, 0)); full.paste(b, (a.width + 6, 0))
    full.save(os.path.join(d, 'bake_all-full.png'))
print('WROTE', os.path.join(d, 'side-by-side.png'))
