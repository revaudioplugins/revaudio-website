"""Trim + downsize the gpt-image-1 renders in bench/assets/station-mixer/img/gen/ for the bench.
Emblems / start button: crop to the alpha bbox (+pad), scale to a 2x display size. Chrome texture: 512 px tile."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GEN = os.path.join(ROOT, 'bench', 'assets', 'station-mixer', 'img', 'gen')
OUT = os.path.join(ROOT, 'bench', 'assets', 'station-mixer', 'img')

def trim(im, pad=6, thr=10):
    a = im.getchannel('A').point(lambda v: 255 if v > thr else 0)
    l, t, r, b = a.getbbox()
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))

for slug, width in [('emblem-drums', 280), ('emblem-bass', 280), ('emblem-keys', 280), ('emblem-guitar', 280),
                    ('emblem-master', 280), ('start-button', 200)]:
    src = os.path.join(GEN, slug + '.png')
    if not os.path.exists(src):
        print(slug, 'missing'); continue
    im = trim(Image.open(src).convert('RGBA'))
    h = round(im.height * width / im.width)
    im.resize((width, h), Image.LANCZOS).save(os.path.join(OUT, slug + '.png'), optimize=True)
    print(slug, im.size, '->', (width, h))

src = os.path.join(GEN, 'chrome-rust.png')
if os.path.exists(src):
    Image.open(src).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'chrome-rust.jpg'), quality=88)
    print('chrome-rust -> 512')
