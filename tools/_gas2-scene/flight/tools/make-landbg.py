# img/land-bg.webp = the landing frame's BACKGROUND (sky + far desert) carried on behind the station: every row's
# open background span is mirror-tiled leftward over the building, the canopy and the chalkboard. The flight paints
# it only where the camera, a little off the landing spot, looks past the wall corner at what A never saw (the
# disoccluded sliver), so that sliver continues A's own sky and desert instead of a different picture.
# Usage: python3 -I tools/make-landbg.py <landing.png> <out.png>   (then cwebp)
import sys
from PIL import Image
import numpy as np
src, out = sys.argv[1:3]
A = np.asarray(Image.open(src).convert('RGB'))
H, W = A.shape[:2]
assert (W, H) == (1536, 1024), (W, H)
def start(r):                       # first background column of row r (measured on f6-v17 + the page's chalkboard)
    if r <= 525: return int(max(1310 - 1.34 * r, 968)) + (24 if r < 250 else 6)   # the canopy's diagonal edge (its dark lip), then the wall corner
    if r < 573: return 976
    if r < 730: return 1046                                          # the chalkboard (DOM rect 863-1038, rows 573-811)
    if r < 870: return int(1290 + (r - 730) * 0.5) + 8               # the sidewalk's far right end
    return None                                                      # below: the near ground, nothing to carry
B = A.copy()
for r in range(H):
    s = start(r)
    if s is None: continue
    span = A[r, s:]; n = len(span)
    for x in range(s):
        k = (s - 1 - x) % (2 * n)
        B[r, x] = span[k] if k < n else span[2 * n - 1 - k]
Image.fromarray(B).save(out); print('saved', out)
