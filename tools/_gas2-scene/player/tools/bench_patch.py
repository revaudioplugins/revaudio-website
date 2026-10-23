"""GAS 2 radio: a lower bench (Yoni 2026-10-23: "make the stool a bit lower"), made from the scene frame's OWN pixels
(frames/f6-v17.png stays untouched: it is Dan's). The patch is laid over the frame under the radio:
  rows NEW_TOP..FLOOR  = the frame's bench rows OLD_TOP..FLOOR squashed into the shorter height (top + shorter legs)
  rows OLD_TOP..NEW_TOP = the wall above, copied from 48 rows higher (the radio covers most of it; its corners don't)
  + shifted DX px left with the radio (Yoni 2026-10-23: a little space from the pump); the strip it leaves on the right
    takes the stucco + floor between the old right leg and the pump (x 323..346)
Frame px (1536 x 1024). radio.css places img/bench-low.webp at X0 - DX, OLD_TOP in scene % and stands the radio on NEW_TOP.
Usage: python player/tools/bench_patch.py"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SCENE = os.path.dirname(os.path.dirname(HERE))
X0, X1 = 58, 342            # the bench's width (frame x 63..337) + a little
OLD_TOP, FLOOR = 688, 792   # the radio stood on 688; the feet end ~790
NEW_TOP = 710               # the bench top now
DX = 0                      # the bench shift left, frame px (was 23 with the 1.3x radio; the 1.04x radio sits on the bench's own centre)
NR = (52, 515, 348, 796)    # the photo radio + its shadow + the old bench, from img/gen/scene-noradio.png (gen_noradio.py)
L = X0 - DX                 # the patch's left edge


def main():
    f = np.asarray(Image.open(os.path.join(SCENE, 'frames', 'f6-v17.png')).convert('RGB')).astype(np.float32)
    nr = np.asarray(Image.open(os.path.join(os.path.dirname(HERE), 'img', 'gen', 'scene-noradio.png')).convert('RGB')).astype(np.float32)
    noradio(nr)
    H, W = FLOOR - OLD_TOP, X1 - L
    out = f[OLD_TOP:FLOOR, L:X1].copy()
    # the strip the bench leaves: the stucco + floor between the old right leg and the pump (x 323..346), which is clean
    # under the bench top; the top's own rows take the same columns from higher up the wall
    out[:NEW_TOP - OLD_TOP] = nr[OLD_TOP:NEW_TOP, L:X1]                              # clean stucco (the no-radio frame) above the bench
    if DX:
        out[:, W - DX:] = f[OLD_TOP:FLOOR, 323:323 + DX]
        out[:NEW_TOP - OLD_TOP, W - DX:] = f[OLD_TOP - 48:NEW_TOP - 48, 323:323 + DX]
    src = Image.fromarray(f[OLD_TOP:FLOOR, X0:X1].astype(np.uint8))
    out[NEW_TOP - OLD_TOP:, :W - DX or None] = np.asarray(src.resize((X1 - X0, FLOOR - NEW_TOP), Image.LANCZOS)).astype(np.float32)
    # feather the left / right edges and the bottom into the frame (2 px), so the patch has no seam
    a = np.ones((H, W), np.float32)
    for i in range(3):
        a[:, i] *= (i + 1) / 4; a[:, -1 - i] *= (i + 1) / 4; a[-1 - i, :] *= (i + 1) / 4
    im = Image.fromarray(np.clip(out, 3, 252).astype(np.uint8)).convert('RGBA')
    im.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    dst = os.path.join(os.path.dirname(HERE), 'img', 'bench-low.webp')
    im.save(dst, quality=90, method=6)
    print(dst, im.size, os.path.getsize(dst), 'bytes')
    print(f'css: left {L / 15.36:.4f}%  top {OLD_TOP / 10.24:.4f}%  width {W / 15.36:.4f}%  height {H / 10.24:.4f}%  '
          f'radio bottom {NEW_TOP / 1024 * 200 / 3:.4f}cqw  radio centre {(192 - DX) / 15.36:.4f}cqw')


def noradio(nr):
    # the photo radio's spot from the no-radio edit, feathered 8 px into the frame (left, top, bottom; 2 px at the pump)
    x0, y0, x1, y1 = NR
    im = Image.fromarray(np.clip(nr[y0:y1, x0:x1], 3, 252).astype(np.uint8)).convert('RGBA')
    h, w = y1 - y0, x1 - x0
    a = np.ones((h, w), np.float32)
    for i in range(8):
        k = (i + 1) / 9
        a[:, i] *= k; a[i, :] *= k; a[-1 - i, :] *= k
    for i in range(2):
        a[:, -1 - i] *= (i + 1) / 3   # the right edge meets the pump: a short feather only
    im.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    dst = os.path.join(os.path.dirname(HERE), 'img', 'noradio.webp')
    im.save(dst, quality=90, method=6)
    print(dst, im.size, os.path.getsize(dst), 'bytes')
    print(f'css noradio: left {x0 / 15.36:.4f}%  top {y0 / 10.24:.4f}%  width {w / 15.36:.4f}%  height {h / 10.24:.4f}%')


if __name__ == '__main__':
    main()
