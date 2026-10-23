"""GAS 2 radio player: the close-up plate from the picked generation (round 2: img/gen/radio-e.png = an edit of
radio-c, the gpt-image-2 edit of the scene's own radio, with 3 keys + a red jewel + a magic-eye window). States are made FROM this one photo (design-language Law 2), never from a second generation:
  img/radio-lit.webp  the photo, dial lamp on, baked pointer erased (the pointer is live)
  img/radio-off.webp  the same plate with the dial lamp and its warm spill masked down, pushed to brown, not grey,
                      and the red jewel dark (the page lights the jewel and the magic eye live)
Crop (gen px): x 110..1478, y 110..930 = 1368 x 820. Every coordinate in radio.css = gen px minus (110, 110).
Usage: python player/tools/process_art.py"""
import os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(os.path.dirname(HERE), 'img')
X0, Y0, X1, Y1 = 110, 110, 1478, 930
SRC = 'radio-e'
GLASS = (569, 580, 1044, 660)          # the dial glass, gen px (measured on a 2x grid)
JEWEL = (538.5, 630, 15)               # the red pilot jewel: centre + glass radius, gen px
PTR = None                              # radio-e has no baked pointer (radio-c: (566, 624))
PTR_C = (566, 624)                        # the baked red pointer's columns


def main():
    a = np.asarray(Image.open(os.path.join(IMG, 'gen', SRC + '.png')).convert('RGB')).astype(np.float32)
    H, W, _ = a.shape

    # 1. erase the baked pointer: split the glass into light (a 12 px blur) + grain; across the pointer the light is a
    #    straight ramp between its two sides and the grain is borrowed from 44 px to the right (no band, no seam)
    gx0, gy0, gx1, gy1 = GLASS
    p0, p1 = PTR or (0, 0)
    ys = slice(gy0 - 1, gy1 + 1)
    low = np.asarray(Image.fromarray(a.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(12))).astype(np.float32)
    grain = a - low
    for x in range(p0, p1):
        t = (x - p0) / (p1 - p0)
        a[ys, x] = (1 - t) * low[ys, p0 - 14] + t * low[ys, p1 + 14] + grain[ys, x + 44]

    # 2. the off plate: glass mask (hard, slightly feathered) + spill mask (a wide soft ellipse round the glass)
    yy, xx = np.mgrid[0:H, 0:W]
    glass = Image.new('L', (W, H), 0)
    glass.paste(255, (gx0 + 2, gy0 + 2, gx1 - 2, gy1 - 2))
    glass = np.asarray(glass.filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
    cx, cy = (gx0 + gx1) / 2, (gy0 + gy1) / 2
    d = ((xx - cx) / ((gx1 - gx0) * .78)) ** 2 + ((yy - cy) / ((gy1 - gy0) * 1.9)) ** 2
    spill = np.clip(1 - d, 0, 1) ** 1.6
    off = a.copy()
    # unlit glass = dull tea-brown celluloid (keeps its texture, loses the lamp)
    off = off * (1 - glass[..., None]) + (a * np.array([.40, .33, .25]))[...] * glass[..., None]
    # the spill on the brass and wood round it goes down by up to 38 %, warm tint kept (age/dark takes colour out)
    k = (spill * (1 - glass))[..., None] * .38
    off = off * (1 - k * np.array([1.0, 1.05, 1.1]))
    # the jewel unlit: deep oxblood glass, its lamp gone (a soft disc so the bezel keeps its own light)
    jx, jy, jr = JEWEL
    jd = np.clip(1.2 - np.hypot(xx - jx, yy - jy) / jr, 0, 1)[..., None]
    off = off * (1 - jd * np.array([.72, .62, .55]))

    for name, arr in (('radio-lit', a), ('radio-off', off)):
        im = Image.fromarray(np.clip(arr, 3, 252).astype(np.uint8)).crop((X0, Y0, X1, Y1))   # no pure #000 / #fff
        im.save(os.path.join(IMG, name + '.webp'), quality=86, method=6)
        print(name, im.size, os.path.getsize(os.path.join(IMG, name + '.webp')), 'bytes')


if __name__ == '__main__':
    main()
