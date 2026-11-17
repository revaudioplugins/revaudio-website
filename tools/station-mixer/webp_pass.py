"""Station Mixer images as WebP: the last step of export_component.py, and runnable alone on the exported folder.

Every PNG in public/station-mixer/img/ becomes a WebP of the same pixel size (quality 88, method 6: the GAS mixer's
setting; the alpha channel stays lossless), the PNG is removed, and station-mixer.js points at the .webp names.
The JPGs stay: WebP gains nothing on them.
Why: the PNGs were 4.9 MB of the Radio Roulette page's 6 MB first visit (asset audit 2026-11-11).
Usage: python tools/station-mixer/webp_pass.py"""
import os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'station-mixer')
URL = '/station-mixer/img/'


def run(out=OUT):
    img = os.path.join(out, 'img')
    before = after = n = 0
    for f in sorted(os.listdir(img)):
        if not f.lower().endswith('.png'):
            continue
        src, dst = os.path.join(img, f), os.path.join(img, f[:-4] + '.webp')
        im = Image.open(src)
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGBA')
        im.save(dst, 'WEBP', quality=88, method=6)
        before += os.path.getsize(src); after += os.path.getsize(dst); n += 1
        os.remove(src)

    js = os.path.join(out, 'station-mixer.js')
    s = open(js, encoding='utf-8').read()
    # every image URL, the runtime-built one too (emblem-${...}.png)
    s = re.sub(r"(%s[^\"'\s]+?)\.png" % re.escape(URL), r'\1.webp', s)
    assert not re.search(re.escape(URL) + r"[^\"'\s]+?\.png", s), 'a .png image URL survived'
    missing = {f for f in re.findall(re.escape(URL) + r'([\w.-]+\.\w+)', s) if not os.path.exists(os.path.join(img, f))}
    assert not missing, f'images referenced but not in img/: {missing}'
    open(js, 'w', encoding='utf-8', newline='\n').write(s)
    print(f'webp pass: {n} PNG -> WebP, {before/1e6:.2f} MB -> {after/1e6:.2f} MB')


if __name__ == '__main__':
    run()
