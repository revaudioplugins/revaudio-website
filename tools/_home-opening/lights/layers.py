# The loading screen's layers from the room's renders (lights/render.mjs): base.webp = the dark room (render 0), and
# bank-k.webp = render k minus render k-1 per channel, never below 0, so the page's plus-lighter sum gives back render k
# at every step. Prints each file's size and how far the encoded sum lands from the full room (the hand-off's picture).
#   python3 -I layers.py <renders dir> <out dir> <banks> <quality>
#   python3 -I layers.py --diff a.png b.png [top right bottom [gate]]   (two pictures of the same room, an edge band left
#       out; also blurred 4 px: light and place, not edge resampling. With "gate": does the loading screen match the room?
#       PASS / FAIL on the blurred picture, whole and area by area (a changed prop is small in the whole and loud in its
#       own area), exit 1 on FAIL. Dan 2026-11-11: "lets always chack it if the loeading screen matches the finel page")
import os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)

def report(a, b, what):
    d = np.abs(a - b).max(axis=2)
    print(f'  {what}: mean {d.mean():.2f} levels, p99 {np.percentile(d, 99):.0f}, {100 * (d > 8).mean():.2f} % of pixels off by more than 8')

if sys.argv[1] == '--diff':
    a, b = load(sys.argv[2]), load(sys.argv[3])
    t, r, btm = (int(x) for x in (sys.argv[4:7] if len(sys.argv) > 6 else (0, 0, 0)))
    a, b = a[t:a.shape[0] - btm, :a.shape[1] - r], b[t:b.shape[0] - btm, :b.shape[1] - r]
    report(a, b, 'apart')
    from PIL import ImageFilter
    blur = lambda x: np.asarray(Image.fromarray(x.astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.int16)
    report(blur(a), blur(b), 'apart, blurred 4 px')
    if 'gate' in sys.argv[7:]:
        # limits: a fresh render reads mean 3.3, p99 14-15, worst area 12.4 (the wet floor's moving shine; 2026-11-10 /
        # 11-11); pictures one round old (the car's new look, moved mess, a plate) read 4.5, 43 and 26.9
        MEAN, P99, AREA, NY, NX = 3.8, 20, 17, 9, 16
        d = np.abs(blur(a) - blur(b)).max(axis=2); h, w = d.shape
        area, ay, ax = max((d[y * h // NY:(y + 1) * h // NY, x * w // NX:(x + 1) * w // NX].mean(), y, x) for y in range(NY) for x in range(NX))
        ok = d.mean() <= MEAN and np.percentile(d, 99) <= P99 and area <= AREA
        print(f'  worst area ({NX} x {NY} grid): mean {area:.1f} levels, column {ax + 1} from the left, row {ay + 1} from the top')
        print(f"  {'PASS: the loading screen matches the room' if ok else 'FAIL: the loading screen does NOT match the room: re-render (lights/render.mjs), then check again'} (limits: mean {MEAN}, p99 {P99}, worst area {AREA})")
        sys.exit(0 if ok else 1)
    sys.exit()

import json
src, out, n, q = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
caps = {int(k): v for k, v in json.loads(sys.argv[5] if len(sys.argv) > 5 else '{}').items()} # bank -> its screen-width variants (bank-k@<tag>.webp)
S = [load(os.path.join(src, f'room-{k}.png')) for k in range(n + 1)]
tmp = tempfile.mkdtemp()
def encode(arr, name):
    png, webp = os.path.join(tmp, name + '.png'), os.path.join(out, name + '.webp')
    Image.fromarray(arr.astype(np.uint8)).save(png)
    subprocess.run(['cwebp', '-quiet', '-q', q, '-m', '6', '-sharp_yuv', png, '-o', webp], check=True)
    back = os.path.join(tmp, name + '.back.png')
    subprocess.run(['dwebp', '-quiet', webp, '-o', back], check=True)
    return os.path.getsize(webp), load(back)

# each bank is taken against the sum so far AS ENCODED (what the page will show), so a layer's encoding error is made
# good by the next one instead of piling up; only the last layer's own error reaches the hand-off
total, (size, acc) = 0, encode(S[0], 'base')
total += size
print(f'  base.webp {size / 1024:.0f} KB (the dark room: mean level {S[0].mean():.1f})')
for k in range(1, n + 1):
    neg = ((S[k] - S[k - 1]) < -2).any(axis=2).mean() * 100
    d = np.clip(S[k] - acc, 0, 255)
    if k in caps: # the chain goes on with the room's own pick; each width gets its own file, the same pick under its tag
        before, sizes = acc, []
        for tag in caps[k]:
            dt = np.clip(load(os.path.join(src, f'room-{k}@{tag}.png')) - before, 0, 255)
            sz, bk = encode(dt, f'bank-{k}@{tag}'); sizes.append(sz)
            if np.array_equal(load(os.path.join(src, f'room-{k}@{tag}.png')), S[k]): size, back = sz, bk
        total += sum(sizes) - size # (the one used in the chain is counted below)
        print(f'  bank-{k}@<{"|".join(caps[k])}>.webp {" / ".join(f"{x / 1024:.0f}" for x in sizes)} KB')
    else:
        size, back = encode(d, f'bank-{k}')
    total += size
    acc = np.minimum(acc + back, 255)
    name = f'bank-{k}' + (f'@{caps[k][-1]}..' if k in caps else '')
    print(f'  {name}.webp {size / 1024:.0f} KB (adds mean {d.mean():.1f} levels; {neg:.2f} % of pixels lose light)')
print(f'  total {total / 1024:.0f} KB')
report(acc, S[n], 'the sum of the encoded layers vs the full room')
