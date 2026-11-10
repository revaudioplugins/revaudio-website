#!/usr/bin/env python3
"""The TV's cut of a recorded plugin loop: every frame down to the pixel size (194 wide = 2 x 2 pixels on the
laptop's TV, Dan's pick 2026-11-10), LANCZOS + a light unsharp so the readouts stay crisp, then one animated WebP.
  python3 tools/tv-anim/cut-webp.py <framesDir> <out.webp> [width=194] [fps=15] [quality=80] [pngDir]
pngDir (optional) also keeps the small frames as PNGs (the bench sets them one by one on the real page)."""
import sys, os, glob
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
W = int(sys.argv[3]) if len(sys.argv) > 3 else 194
FPS = float(sys.argv[4]) if len(sys.argv) > 4 else 15
Q = int(sys.argv[5]) if len(sys.argv) > 5 else 80
png = sys.argv[6] if len(sys.argv) > 6 else None
files = sorted(glob.glob(os.path.join(src, 'f_*.png')))
frames = []
for f in files:
    im = Image.open(f).convert('RGB')
    h = round(W * im.height / im.width)
    frames.append(im.resize((W, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1, 60, 2)))
if png:
    os.makedirs(png, exist_ok=True)
    for i, im in enumerate(frames): im.save(os.path.join(png, f'f_{i:03d}.png'))
# 15 fps = 66.67 ms: alternate 67/67/66 so the loop keeps its real length
dur = [round((i + 1) * 1000 / FPS) - round(i * 1000 / FPS) for i in range(len(frames))]
frames[0].save(out, save_all=True, append_images=frames[1:], duration=dur, loop=0, quality=Q, method=6)
print(f'{len(frames)} frames {frames[0].size[0]}x{frames[0].size[1]} {sum(dur)} ms -> {out} {os.path.getsize(out) // 1024} KB')
