"""DRIFT Turbo Dash player: cut the gpt-image-1 renders out clean and size them for the toy.

  python tools/drift-player/process_assets.py

gpt-image-1's "transparent" background leaves a near-opaque haze around the object (alpha 224-254) and noisy alpha
inside it, so alpha can't be trusted: every part is cut out again with OpenCV GrabCut (seeded: haze-free corners =
background, the eroded object blob = probably object), feathered 1.5 px, trimmed to the object and resized.
In:  bench/assets/drift-player/gen/<pick>.png      Out: public/drift-player/img/<name>.webp (+ .png preview in bench)
"""
import os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GEN = os.path.join(ROOT, 'bench', 'assets', 'drift-player', 'gen')
OUT = os.path.join(ROOT, 'public', 'drift-player', 'img')
PICKS = {  # name: (source render, output width px = 2x its CSS size[, GrabCut rect x0,y0,x1,y1 for a haze background])
    'shell': ('shell-3', 2200, (170, 110, 1360, 940)),
    'plate': ('plate-1', 520),
    # 'knob' (knob-2) retired 2026-10-14: the shift knob is an 8-bit pixel sprite drawn in the page now
    'horn': ('horn-1', 280),
    'volknob': ('volknob-1', 200),
}

def cutout_rect(path, rect):
    """Big render on a dark haze: GrabCut from a hand-set box, then close + smooth the outline (no ragged edges)."""
    rgb = np.array(Image.open(path).convert('RGB'))
    x0, y0, x1, y1 = rect
    mask = np.zeros(rgb.shape[:2], np.uint8); bg, fg = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, (x0, y0, x1 - x0, y1 - y0), bg, fg, 8, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    return finish(rgb, m, close=31, smooth=5)

def finish(rgb, m, close=0, smooth=0):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1: m = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
    if close: m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close)))
    ff = m.copy(); cv2.floodFill(ff, np.zeros((m.shape[0] + 2, m.shape[1] + 2), np.uint8), (0, 0), 255)
    m = m | cv2.bitwise_not(ff)
    if smooth: m = np.where(cv2.GaussianBlur(m, (0, 0), smooth) > 127, 255, 0).astype(np.uint8)
    m = cv2.GaussianBlur(m, (0, 0), 1.2)
    out = np.dstack([rgb, m])
    ys, xs = np.where(m > 8)
    return Image.fromarray(out[ys.min():ys.max() + 1, xs.min():xs.max() + 1])

def cutout(path, erode_frac=.06):
    im = np.array(Image.open(path).convert('RGBA'))
    rgb, a = im[:, :, :3], im[:, :, 3]
    h, w = a.shape
    s = 768 / max(h, w)
    small = cv2.resize(rgb, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    blob = cv2.resize((a > 200).astype(np.uint8), (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
    k = max(3, int(min(small.shape[:2]) * erode_frac))
    inner = cv2.erode(blob, np.ones((k, k), np.uint8))
    mask = np.full(blob.shape, cv2.GC_BGD, np.uint8)
    mask[blob > 0] = cv2.GC_PR_BGD
    mask[cv2.erode(blob, np.ones((k // 3 + 1, k // 3 + 1), np.uint8)) > 0] = cv2.GC_PR_FGD
    mask[inner > 0] = cv2.GC_FGD
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), mask, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep the biggest piece, fill holes, back to full size with a soft edge
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1: m = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
    ff = m.copy(); cv2.floodFill(ff, np.zeros((m.shape[0] + 2, m.shape[1] + 2), np.uint8), (0, 0), 255)
    m = m | cv2.bitwise_not(ff)
    m = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
    m = cv2.GaussianBlur(m, (0, 0), 1.5)
    m = np.clip((m.astype(np.float32) - 64) * 255 / 128, 0, 255).astype(np.uint8)
    out = np.dstack([rgb, m])
    ys, xs = np.where(m > 8)
    return Image.fromarray(out[ys.min():ys.max() + 1, xs.min():xs.max() + 1])

os.makedirs(OUT, exist_ok=True)
for name, (src, width, *rect) in PICKS.items():
    path = os.path.join(GEN, src + '.png')
    im = cutout_rect(path, rect[0]) if rect else cutout(path)
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), quality=90, method=6)
    im.save(os.path.join(GEN, '..', name + '-cut.png'))
    print(f'{name:8s} {src} -> {im.size}  {os.path.getsize(os.path.join(OUT, name + ".webp")) / 1e3:.0f} kB')
