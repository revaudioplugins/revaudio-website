"""#hear speakers, round 2: cut the two photographed pods + their cones for the web.

  python tools/drift-player/cut_speaker.py

Pods (tools/drift-player/gen_speaker.py, Yoni 2026-10-15 "make it more realistic"): pod-right-1 faces down-right =
the LEFT speaker, pod-left-1 faces down-left = the RIGHT speaker (a matched pair, both lit upper-left).
For each pod:
  - the pod is cut from gpt-image-1's hazy "transparent" background with GrabCut (box = the solid alpha, shrunk),
  - the cone (violet weave + the dust cap inside it) is found by colour, filled, fitted with an ellipse and saved as
    its own layer: the page pumps only that layer,
  - the pump direction = from the pod's centre to the cone's centre (the way the face points), so the cone moves out
    along the speaker's own axis.
Out: public/drift/pod-l.webp, pod-l-cone.webp, pod-r.webp, pod-r-cone.webp (400 px wide) + src/data/drift-pods.json
(cone centre in % of the picture, the pump direction).
"""
import json, os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GEN = os.path.join(ROOT, 'bench', 'assets', 'drift-player', 'gen')
OUT = os.path.join(ROOT, 'public', 'drift')
PODS = {'l': 'pod-right-1', 'r': 'pod-left-1'}
W = 400

def cut(rgba):
    rgb, a = rgba[:, :, :3], rgba[:, :, 3]
    ys, xs = np.where(a > 250)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    mask = np.zeros(a.shape, np.uint8); bg, fg = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, (int(x0) - 6, int(y0) - 6, int(x1 - x0) + 12, int(y1 - y0) + 12), bg, fg, 6, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1: m = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    m = cv2.GaussianBlur(m, (0, 0), 1.0)
    return m

meta = {}
for side, name in PODS.items():
    rgba = np.array(Image.open(os.path.join(GEN, name + '.png')).convert('RGBA'))
    rgb = rgba[:, :, :3].astype(int)
    m = cut(rgba)
    # the cone: violet weave (blue well over green), filled so the dust cap inside it is part of it
    purple = ((rgb[:, :, 2] - rgb[:, :, 1] > 28) & (rgb[:, :, 2] > 55) & (m > 128)).astype(np.uint8) * 255
    purple = cv2.morphologyEx(purple, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    cs, _ = cv2.findContours(purple, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    (ex, ey), (ea, eb), ang = cv2.fitEllipse(cv2.convexHull(c))
    cone = np.zeros(m.shape, np.uint8)
    cv2.ellipse(cone, ((ex, ey), (ea * 1.02, eb * 1.02), ang), 255, -1)
    cone = cv2.GaussianBlur(cone, (0, 0), 1.2)
    # crop both to the pod's box, same box
    ys, xs = np.where(m > 8); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    pod = np.dstack([rgba[:, :, :3], m])[y0:y1, x0:x1]
    con = np.dstack([rgba[:, :, :3], np.minimum(cone, m)])[y0:y1, x0:x1]
    w, h = x1 - x0, y1 - y0; H = round(h * W / w)
    for arr, fn in ((pod, f'pod-{side}.webp'), (con, f'pod-{side}-cone.webp')):
        Image.fromarray(arr).resize((W, H), Image.LANCZOS).save(os.path.join(OUT, fn), 'WEBP', quality=88, method=6, exact=True)
    # the pump axis: pod centre (its solid body) -> cone centre
    bys, bxs = np.where(m > 128); bx, by = bxs.mean(), bys.mean()
    vx, vy = ex - bx, ey - by; L = (vx * vx + vy * vy) ** .5 or 1
    meta[side] = {'w': W, 'h': H, 'cx': round((ex - x0) / w * 100, 2), 'cy': round((ey - y0) / h * 100, 2),
                  'dx': round(vx / L, 3), 'dy': round(vy / L, 3), 'coneW': round(max(ea, eb) / w * 100, 1)}
    print(side, name, meta[side])

json.dump(meta, open(os.path.join(ROOT, 'src', 'data', 'drift-pods.json'), 'w'), indent=2)
for f in sorted(os.listdir(OUT)):
    if f.startswith('pod-'): print(f, os.path.getsize(os.path.join(OUT, f)) // 1000, 'kB')
