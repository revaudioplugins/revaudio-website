#!/usr/bin/env python3
"""The TV's cut of a recorded plugin loop: every frame down to the pixel size (194 wide = 2 x 2 pixels on the
laptop's TV, Dan's pick 2026-11-10), LANCZOS + a light unsharp so the readouts stay crisp, then one animated WebP.
  python3 tools/tv-anim/cut-webp.py <framesDir> <out.webp> [width=194] [fps=15] [quality=80] [pngDir] [flat|alpha]
                                    [crop=x0,y0,x1,y1] [still=<still.png>@<width>]
pngDir (optional) also keeps the small frames as PNGs (the bench sets them one by one on the real page).
flat (default) lays transparent corners on black (the plates' own ground); alpha keeps the cut-out (every plugin
hovers, Dan 2026-11-11) and trims every frame to the outline of all of them, or to crop= (GAS 2 keeps its old box,
so its pump keeps its size and its 2 x 2 pixels). still= keeps the first frame, cut to its own outline, at that width
(the list's thumbnail, drawn from the same cut-out)."""
import sys, os, glob
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
W = int(sys.argv[3]) if len(sys.argv) > 3 else 194
FPS = float(sys.argv[4]) if len(sys.argv) > 4 else 15
Q = int(sys.argv[5]) if len(sys.argv) > 5 else 80
png = sys.argv[6] if len(sys.argv) > 6 and sys.argv[6] != '-' else None
ALPHA = len(sys.argv) > 7 and sys.argv[7] == 'alpha'
opts = dict(a.split('=', 1) for a in sys.argv[8:] if '=' in a)
files = sorted(glob.glob(os.path.join(src, 'f_*.png')))
ims = [Image.open(f).convert('RGBA') for f in files]
if ALPHA:  # one crop for every frame: the outline of all of them
    boxes = [im.getchannel('A').getbbox() for im in ims]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    if 'crop' in opts: box = tuple(int(v) for v in opts['crop'].split(','))
    ims = [im.crop(box) for im in ims]
if 'still' in opts:
    path, sw = opts['still'].rsplit('@', 1)
    im0 = ims[0].crop(ims[0].getchannel('A').getbbox())
    still = im0.convert('RGBa').resize((int(sw), round(int(sw) * im0.height / im0.width)), Image.LANCZOS).convert('RGBA')
    still.save(path)
    print(f'still {still.size[0]}x{still.size[1]} -> {path}')
frames = []
for im in ims:
    h = round(W * im.height / im.width)
    if ALPHA:  # premultiplied, or the edges go dark
        small = im.convert('RGBa').resize((W, h), Image.LANCZOS).convert('RGBA')
        rgb = small.convert('RGB').filter(ImageFilter.UnsharpMask(1, 60, 2))
        rgb.putalpha(small.getchannel('A'))
        frames.append(rgb)
    else:
        flat = Image.new('RGB', im.size, (0, 0, 0))
        flat.paste(im, (0, 0), im)
        frames.append(flat.resize((W, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1, 60, 2)))
if png:
    os.makedirs(png, exist_ok=True)
    for i, im in enumerate(frames): im.save(os.path.join(png, f'f_{i:03d}.png'))
# 15 fps = 66.67 ms: alternate 67/67/66 so the loop keeps its real length
dur = [round((i + 1) * 1000 / FPS) - round(i * 1000 / FPS) for i in range(len(frames))]
frames[0].save(out, save_all=True, append_images=frames[1:], duration=dur, loop=0, quality=Q, method=6)
print(f'{len(frames)} frames {frames[0].size[0]}x{frames[0].size[1]} {sum(dur)} ms -> {out} {os.path.getsize(out) // 1024} KB')
