# img/land-chalk.png = the chalkboard's own silhouette in the landing frame (white = the board, its frame and legs, as the
# landing photo has them): page-b rendered at touchdown with the chalkboard bare (no drop shadow) and without it, the
# difference thresholded, its holes filled, then shrunk 1 px so an anti-aliased edge never counts. world.js uses it for the landing photo's
# line of sight: what lies behind the board's plane under a white pixel is hidden from it (no board, frame or legs
# painted onto the floor behind, and exact at touchdown, since it is the photo's own board).
#   CHALK=bare node flight/tools/render-landing.cjs bare@2x.png && CHALK=off node flight/tools/render-landing.cjs off@2x.png
#   python3 -I flight/tools/make-chalkmask.py bare@2x.png off@2x.png flight/img/land-chalk.png
import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
bare_p, off_p, out_p = sys.argv[1:4]
load = lambda p: np.asarray(Image.open(p).convert('RGB').resize((1536, 1024), Image.LANCZOS)).astype(float)
d = np.abs(load(bare_p) - load(off_p)).max(axis=2)
m = Image.fromarray(((d > 14) * 255).astype('uint8')).filter(ImageFilter.MedianFilter(3))
bg = m.point(lambda v: 255 - v); ImageDraw.floodfill(bg, (0, 0), 128)            # fill the holes where the dark board
m = Image.fromarray(np.where(np.asarray(bg) == 128, 0, 255).astype('uint8'))      # met the dark desert behind it
m = m.filter(ImageFilter.MinFilter(3))
m.save(out_p, optimize=True)
a = np.asarray(m) > 127; ys, xs = np.nonzero(a)
print('saved', out_p, 'px', int(a.sum()), 'bbox', (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())))
