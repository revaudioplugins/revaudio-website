# texture prep for the studio desks: python3 -I prep_tex.py <scout dir>
# walnut_veneer (Poly Haven, CC0) darkened to walnut-dark; wood_table_worn (Poly Haven, CC0) and Metal046B (ambientCG, CC0)
# recompressed; Metal046B's roughness + metalness packed as an ARM map (R = 1, G = roughness, B = metalness). All 1k JPEG.
import sys, os
import numpy as np
from PIL import Image
sc = sys.argv[1]; dl = os.path.join(sc, 'dl'); out = os.path.join(sc, 'work', 'desk_tex'); os.makedirs(out, exist_ok=True)
def save(im, name, q): p = os.path.join(out, name); im.save(p, quality=q); print(name, im.size, os.path.getsize(p))
w = np.array(Image.open(os.path.join(dl, 'walnut_veneer', 'walnut_veneer_diff_1k.jpg')).convert('RGB'), np.float32)
dark = w * np.array([0.27, 0.235, 0.21], np.float32)  # walnut-dark, a touch warm (0.40 read as light tan under the desk lamp)
save(Image.fromarray(dark.clip(0, 255).astype(np.uint8)), 'walnut_dark_col.jpg', 86)
save(Image.open(os.path.join(dl, 'walnut_veneer', 'walnut_veneer_nor_gl_1k.jpg')).convert('RGB'), 'walnut_nrm.jpg', 82)
save(Image.open(os.path.join(dl, 'walnut_veneer', 'walnut_veneer_arm_1k.jpg')).convert('RGB'), 'walnut_arm.jpg', 82)
for k, n in (('diff', 'planks_col.jpg'), ('nor_gl', 'planks_nrm.jpg'), ('arm', 'planks_arm.jpg')):
    im = Image.open(os.path.join(dl, 'wood_table_worn', f'wood_table_worn_{k}_1k.jpg')).convert('RGB')
    if k == 'diff': im = Image.fromarray((np.array(im, np.float32) * 0.7).clip(0, 255).astype(np.uint8))  # older, darker boards
    save(im, n, 80)
m = os.path.join(dl, 'Metal046B', 'x')
save(Image.open(os.path.join(m, 'Metal046B_1K-JPG_Color.jpg')).convert('RGB'), 'steel_col.jpg', 80)
save(Image.open(os.path.join(m, 'Metal046B_1K-JPG_NormalGL.jpg')).convert('RGB'), 'steel_nrm.jpg', 80)
r = Image.open(os.path.join(m, 'Metal046B_1K-JPG_Roughness.jpg')).convert('L'); mt = Image.open(os.path.join(m, 'Metal046B_1K-JPG_Metalness.jpg')).convert('L')
save(Image.merge('RGB', (Image.new('L', r.size, 255), r, mt)), 'steel_arm.jpg', 82)
