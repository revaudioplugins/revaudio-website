# the film with the set's CRT monitors pasted in where the set has them: the pixels where the walk with and without the
# monitors differ, kept only around each monitor (the neon hum differs between the two renders everywhere else)
import json, numpy as np, sys
from PIL import Image, ImageFilter
D = './'
Q = json.load(open(D + 'quads.json'))
for i in range(240):
    a = np.asarray(Image.open(D + 'src/%03d.png' % i).convert('RGB'), dtype=np.int16)
    b = np.asarray(Image.open(D + 'nomon/%03d.png' % i).convert('RGB'), dtype=np.int16)
    diff = np.abs(a - b).sum(2) > 24
    keep = np.zeros_like(diff)
    for k, q in Q[i].items():
        if not k.startswith('M') or any(p is None for p in q): continue
        xs, ys = [p[0] for p in q], [p[1] for p in q]; cx, cy, w, h = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs), max(ys) - min(ys)
        x0, x1, y0, y1 = int(cx - w * 0.85) - 6, int(cx + w * 0.85) + 6, int(cy - h * 0.95) - 6, int(cy + h * 0.95) + 6
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(1920, x1), min(1080, y1)
        if x1 > x0 and y1 > y0: keep[y0:y1, x0:x1] = True
    m = ((diff & keep) * 255).astype(np.uint8)
    M = Image.fromarray(m).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5)); M.save(D + 'mask/%03d.png' % i)
    k = np.asarray(M, dtype=np.float32)[..., None] / 255
    o = np.asarray(Image.open(D + 'out-k1/%03d.png' % (i + 1)).convert('RGB'), dtype=np.float32)
    Image.fromarray(np.clip(o * (1 - k) + a * k, 0, 255).astype(np.uint8)).save(D + 'comp/%03d.png' % i)
    if i % 40 == 0: print(i, int((m > 0).sum()), flush=True)
print('done')
