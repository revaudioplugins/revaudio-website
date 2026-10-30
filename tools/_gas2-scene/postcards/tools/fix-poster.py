"""GAS 2 postcards - HEAR IT's poster without the gauge's thin red level line (Dan, round 6: "there is a red line over
there, unnecessary"). The desktop page keeps the original (props/poster-level.webp, read only here): this writes the
card's own copy, postcards/img/poster-level.webp.

  python3 fix-poster.py <scene dir>

The line runs left of the needle's hub at the fuel level; its band is wiped with the face mirrored in from either side
(the cream above, the halftone below), so the level edge stays where the line was. Pixel numbers are the 960 x 640
original's.
"""
import os, sys, subprocess
import numpy as np
from PIL import Image

SCENE = sys.argv[1]
a = np.asarray(Image.open(os.path.join(SCENE, "props", "poster-level.webp")).convert("RGB")).copy()
Y0, Y1, X0, X1 = 353, 367, 586, 696          # the line's band; the hub's red ring starts at x 696
mid = (Y0 + Y1) // 2
src = a.copy()
for y in range(Y0, mid + 1):
    a[y, X0:X1] = src[Y0 - 1 - (y - Y0), X0:X1]
for y in range(mid + 1, Y1 + 1):
    a[y, X0:X1] = src[Y1 + 1 + (Y1 - y), X0:X1]
out = os.path.join(SCENE, "postcards", "img", "poster-level.webp")
tmp = out + ".png"
Image.fromarray(a).save(tmp)
subprocess.run(["cwebp", "-quiet", "-q", "86", "-m", "6", tmp, "-o", out], check=True)
os.remove(tmp)
print("poster-level.webp", os.path.getsize(out) // 1024, "KB")
