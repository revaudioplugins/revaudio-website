#!/usr/bin/env python3
"""A recorded plugin cut out of its frame with a rounded-rectangle matte (DRIFT's loop comes from the site's video, so
its panel sits on the page's black: Dan 2026-11-11, every plugin hovering, nothing that is not the plugin). The matte is
drawn 4x and drawn down, so its edge is smooth.
  python3 tools/tv-anim/matte.py <framesDir> <outDir> <x0> <y0> <x1> <y1> <radius>
DRIFT (the site's 1440 x 762 video frames): 2 4 1438 758 21 (its outer bevel, measured off the brightest of the frames)"""
import sys, os, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
x0, y0, x1, y1, r = (float(v) for v in sys.argv[3:8])
files = sorted(glob.glob(os.path.join(src, 'f_*.png')))
W, H = Image.open(files[0]).size
K = 4
big = Image.new('L', (W * K, H * K), 0)
ImageDraw.Draw(big).rounded_rectangle([x0 * K, y0 * K, x1 * K - 1, y1 * K - 1], radius=r * K, fill=255)
matte = big.resize((W, H), Image.LANCZOS)
os.makedirs(out, exist_ok=True)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB')
    im.putalpha(matte)
    im.save(os.path.join(out, f'f_{i:04d}.png'))
print(f'{len(files)} frames {W}x{H} cut to ({x0:g},{y0:g})-({x1:g},{y1:g}) r {r:g} -> {out}')
