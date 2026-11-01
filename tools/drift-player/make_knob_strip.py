"""#hear VOLUME knob: DRIFT's own house knob, cut light for the web.

  python tools/drift-player/make_knob_strip.py [path to knob3d_drift_x115_128_129.png]

Source: the plugin's filmstrip (Drift Source/ui/public/assets/jdm/knob3d_drift_x115_128_129.png, 5.2.x): 129 frames of
the real 3D knob from -135 to +135 degrees, 128 px each, 12 x 11 atlas, light baked fixed (it never rotates). The
page needs ~64 css px, so 128 px frames stay (DPR 2); every second frame is kept (65 frames, 4.2 degrees a step) in a
13 x 5 atlas, saved as WebP with alpha. Runtime: frame = round((angle + 135) / 270 * 64), plugin inset -29 %.
Out: public/drift/knob3d-drift-65.webp
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1] if len(sys.argv) > 1 else 'C:/RevAudio/Plugins/Drift/Source/ui/public/assets/jdm/knob3d_drift_x115_128_129.png'
OUT = os.path.join(ROOT, 'public', 'drift', 'knob3d-drift-65.webp')
F, COLS, ROWS = 128, 12, 11
NCOLS, NROWS = 13, 5

src = Image.open(SRC).convert('RGBA')
assert src.size == (F * COLS, F * ROWS), src.size
out = Image.new('RGBA', (F * NCOLS, F * NROWS), (0, 0, 0, 0))
for k in range(65):
    i = k * 2                                   # 0, 2, ... 128
    fr = src.crop(((i % COLS) * F, (i // COLS) * F, (i % COLS + 1) * F, (i // COLS + 1) * F))
    out.paste(fr, ((k % NCOLS) * F, (k // NCOLS) * F))
out.save(OUT, 'WEBP', quality=88, method=6, exact=True)
print(f'{OUT}: {out.size[0]} x {out.size[1]}, {os.path.getsize(OUT) / 1e3:.0f} kB')
