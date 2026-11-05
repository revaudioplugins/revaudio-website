"""Cut the gearbox's web assets from the raw OpenAI art (tools/gearbox/raw, made by gen.ps1).

  console-a.png (3072x1024)  -> src/assets/gearbox/console.jpg   the one photograph (plate, gate, tach, card)
                                src/assets/gearbox/hub.png       the tach's hub cap, so the needle sits UNDER it
  knob-a.png  (green screen) -> src/assets/gearbox/knob.png      the shift knob, keyed, seen from above
  needle-a.png (green screen)-> src/assets/gearbox/needle.png    the needle, keyed, pointing up, pivot = PIVOT_FRAC
  obdtune-a.png              -> src/assets/plugins/obdtune-mock.jpg   OBDTune's mock window (mock catalog only)

The console geometry the page uses (in the photo's 3072 x 1024 pixels) lives in src/data/bundle.ts (GEO);
measured off console-a.png with a 50 px grid.

Run from the repo root:  python -I tools/gearbox/process_art.py
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'tools' / 'gearbox' / 'raw'
OUT = ROOT / 'src' / 'assets' / 'gearbox'
PLUG = ROOT / 'src' / 'assets' / 'plugins'

HUB_C = (1530, 525)  # the hub cap's centre in console-a.png
HUB_R = 50           # its radius incl. the chrome edge (the cap is ~46)
PIVOT_FRAC = 0.80    # where the needle turns, from its top (the tail is the last fifth)


def key_green(im: Image.Image) -> Image.Image:
    """Alpha from how much greener than red/blue a pixel is; despill what is left."""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gn = g - np.maximum(r, b)
    alpha = 1.0 - np.clip((gn - 18.0) / (60.0 - 18.0), 0.0, 1.0)
    g2 = np.minimum(g, np.maximum(r, b) + 4.0)  # despill: no green cast on the edges or the chrome
    rgb = np.stack([r, g2, b], -1)
    out = np.dstack([rgb, alpha * 255.0]).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    # tighten the edge a touch: the green fringe lives in the outermost pixel
    al = img.getchannel('A').filter(ImageFilter.MinFilter(3))
    img.putalpha(al)
    return img


def crop_alpha(img: Image.Image, pad: int = 6) -> Image.Image:
    bbox = img.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    x0, y0, x1, y1 = bbox
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)

    con = Image.open(RAW / 'console-a.png').convert('RGB')
    con.save(OUT / 'console.jpg', quality=90, optimize=True, progressive=True)

    # the hub cap with a soft round edge (it covers the needle's pivot)
    x, y = HUB_C
    hub = con.crop((x - HUB_R, y - HUB_R, x + HUB_R, y + HUB_R)).convert('RGBA')
    yy, xx = np.mgrid[0:2 * HUB_R, 0:2 * HUB_R]
    d = np.hypot(xx - HUB_R + 0.5, yy - HUB_R + 0.5)
    m = np.clip((HUB_R - 1.5 - d) / 2.0, 0, 1) * 255
    hub.putalpha(Image.fromarray(m.astype(np.uint8)))
    hub.save(OUT / 'hub.png', optimize=True)

    knob = crop_alpha(key_green(Image.open(RAW / 'knob-a.png')))
    knob.thumbnail((440, 440), Image.LANCZOS)
    knob.save(OUT / 'knob.png', optimize=True)

    needle = crop_alpha(key_green(Image.open(RAW / 'needle-a.png')), pad=4)
    needle.thumbnail((200, 600), Image.LANCZOS)
    needle.save(OUT / 'needle.png', optimize=True)

    obd = Image.open(RAW / 'obdtune-a.png').convert('RGB')
    obd.save(PLUG / 'obdtune-mock.jpg', quality=88, optimize=True, progressive=True)

    for p in [OUT / 'console.jpg', OUT / 'hub.png', OUT / 'knob.png', OUT / 'needle.png', PLUG / 'obdtune-mock.jpg']:
        im = Image.open(p)
        print(f'{p.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {im.mode}  {p.stat().st_size // 1024} KB')
    return 0


if __name__ == '__main__':
    sys.exit(main())
