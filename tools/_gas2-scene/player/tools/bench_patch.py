"""GAS 2 radio: a lower bench (Yoni 2026-10-23: "make the stool a bit lower"), made from the scene frame's OWN pixels
(frames/f6-v17.png stays untouched: it is Dan's). The patch is laid over the frame under the radio:
  rows NEW_TOP..FLOOR  = the frame's bench rows OLD_TOP..FLOOR squashed into the shorter height (top + shorter legs)
  rows OLD_TOP..NEW_TOP = the wall above, copied from 48 rows higher (the radio covers most of it; its corners don't)
Frame px (1536 x 1024). radio.css places img/bench-low.webp at X0, OLD_TOP in scene % and stands the radio on NEW_TOP.
Usage: python player/tools/bench_patch.py"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SCENE = os.path.dirname(os.path.dirname(HERE))
X0, X1 = 58, 342            # the bench's width (frame x 63..337) + a little
OLD_TOP, FLOOR = 688, 792   # the radio stood on 688; the feet end ~790
NEW_TOP = 710               # the bench top now


def main():
    f = np.asarray(Image.open(os.path.join(SCENE, 'frames', 'f6-v17.png')).convert('RGB')).astype(np.float32)
    H = FLOOR - OLD_TOP
    out = np.zeros((H, X1 - X0, 3), np.float32)
    out[:NEW_TOP - OLD_TOP] = f[OLD_TOP - 48:NEW_TOP - 48, X0:X1]                    # wall
    src = Image.fromarray(f[OLD_TOP:FLOOR, X0:X1].astype(np.uint8))
    out[NEW_TOP - OLD_TOP:] = np.asarray(src.resize((X1 - X0, FLOOR - NEW_TOP), Image.LANCZOS)).astype(np.float32)
    # feather the left / right edges and the bottom into the frame (2 px), so the patch has no seam
    a = np.ones((H, X1 - X0), np.float32)
    for i in range(3):
        a[:, i] *= (i + 1) / 4; a[:, -1 - i] *= (i + 1) / 4; a[-1 - i, :] *= (i + 1) / 4
    im = Image.fromarray(np.clip(out, 3, 252).astype(np.uint8)).convert('RGBA')
    im.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    dst = os.path.join(os.path.dirname(HERE), 'img', 'bench-low.webp')
    im.save(dst, quality=90, method=6)
    print(dst, im.size, os.path.getsize(dst), 'bytes')
    print(f'css: left {X0 / 15.36:.4f}%  top {OLD_TOP / 10.24:.4f}%  width {(X1 - X0) / 15.36:.4f}%  height {H / 10.24:.4f}%  '
          f'radio bottom {NEW_TOP / 1024 * 200 / 3:.4f}cqw')


if __name__ == '__main__':
    main()
