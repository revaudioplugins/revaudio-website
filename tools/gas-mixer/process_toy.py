"""Trim + size the toy-redesign renders (plan tasks/player-toy-redesign-plan.md) for both site players.
Sources: bench/assets/{gas-mixer,station-mixer}/img/gen/<slug>.png (gpt-image-1, gitignored).
Output:  bench/assets/{gas-mixer,station-mixer}/img/<slug>.png at 2x the display size (+ floor-rubber.jpg tile).
The hood latch is generated once (tools/gas-mixer/gen_assets.py) and used by both players.
Usage: python tools/gas-mixer/process_toy.py"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, 'bench', 'assets')

def trim(im, pad=4, thr=128, haze=40):
    a = np.array(im)
    a[:, :, 3] = np.where(a[:, :, 3] < haze, 0, a[:, :, 3])
    im = Image.fromarray(a)
    ys, xs = np.nonzero(a[:, :, 3] > thr)
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad + 1), min(im.height, ys.max() + pad + 1))
    return im.crop(box)

JOBS = [  # (source player, slug, width px, destination players)
    ('gas-mixer', 'accel-pedal-a', 360, ['gas-mixer']),
    ('gas-mixer', 'accel-pedal-b', 360, ['gas-mixer']),
    ('gas-mixer', 'bat-toggle', 200, ['gas-mixer']),
    ('gas-mixer', 'porcelain-sign', 680, ['gas-mixer']),
    ('gas-mixer', 'fuel-gauge', 640, ['gas-mixer']),          # saved as fuel-gauge-xl.png (the hood keeps fuel-gauge.png)
    ('gas-mixer', 'hood-latch', 320, ['gas-mixer', 'station-mixer']),
    ('station-mixer', 'onair-lamp', 420, ['station-mixer']),
    ('station-mixer', 'rr-plate-cta', 680, ['station-mixer']),
]
for src, slug, width, dests in JOBS:
    path = os.path.join(A, src, 'img', 'gen', slug + '.png')
    if not os.path.exists(path):
        print(slug, 'MISSING'); continue
    im = trim(Image.open(path).convert('RGBA'))
    out = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    name = 'fuel-gauge-xl.png' if slug == 'fuel-gauge' else slug + '.png'
    for d in dests:
        out.save(os.path.join(A, d, 'img', name), optimize=True)
    print(slug, '->', out.size, 'aspect', round(im.width / im.height, 3), dests)

tile = Image.open(os.path.join(A, 'gas-mixer', 'img', 'gen', 'floor-rubber.png')).convert('RGB').resize((512, 512), Image.LANCZOS)
tile.save(os.path.join(A, 'gas-mixer', 'img', 'floor-rubber.jpg'), quality=82)
print('floor-rubber.jpg 512x512')
