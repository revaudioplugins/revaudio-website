"""GAS 2 postcards - every image the phone page needs, from art we already own (no AI spend).

  python3 make-art.py <scene dir> <pump-full.png from bake-pump.cjs>

Writes postcards/img/: pump.webp (the plugin's own render, hose run on along the ground), station.webp (card 1's
backdrop: the station photo with its painted pump filled out, then softened = a lens focused on the real pump),
dusk.webp + scene.webp (the page behind the stack, out of focus, and the end page sharp: the same frame), linen.webp (the linen stock), stamp.webp (the keys from
the MAIL ME THE KEYS poster). DESIGN.md 7 (phones): the station is only ever a soft backdrop, never a crop as the page.
"""
import sys, os, subprocess
import numpy as np
from PIL import Image, ImageFilter

SCENE, PUMP = sys.argv[1], sys.argv[2]
OUT = os.path.join(SCENE, "postcards", "img")


def webp(im, name, q, alpha=False):
    tmp = os.path.join(OUT, "_tmp.png")
    im.save(tmp)
    args = ["cwebp", "-quiet", "-q", str(q), "-m", "6", "-sharp_yuv"]
    if alpha:
        args += ["-exact", "-alpha_q", "100"]
    subprocess.run(args + [tmp, "-o", os.path.join(OUT, name)], check=True)
    os.remove(tmp)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)) // 1024, "KB")


def fill(rgb, hole):
    """Push-pull fill: masked pixels take the colour of their surroundings, coarse to fine (the result is blurred anyway)."""
    lv = [(rgb * (~hole)[..., None], (~hole).astype(np.float32))]
    while min(lv[-1][1].shape) > 4:
        c, w = lv[-1]
        h2, w2 = (c.shape[0] // 2) * 2, (c.shape[1] // 2) * 2
        c, w = c[:h2, :w2], w[:h2, :w2]
        cs = c.reshape(h2 // 2, 2, w2 // 2, 2, 3).sum((1, 3))
        ws = w.reshape(h2 // 2, 2, w2 // 2, 2).sum((1, 3))
        lv.append((cs, ws))
    col = lv[-1][0] / np.maximum(lv[-1][1], 1e-6)[..., None]
    for c, w in reversed(lv[:-1]):
        up = np.kron(col, np.ones((2, 2, 1)))
        up = np.pad(up, ((0, c.shape[0] - up.shape[0]), (0, c.shape[1] - up.shape[1]), (0, 0)), mode="edge")
        own = c / np.maximum(w, 1e-6)[..., None]
        k = np.clip(w, 0, 1)[..., None]
        col = own * k + up * (1 - k)
    return col


# ---- the pump: trim, then the hose (it leaves the frame lying on the ground, rows 1540-1569 at 2x) runs on 640 px ----
p = Image.open(PUMP).convert("RGBA")
a = np.array(p)
x0, y0 = np.where(a[..., 3].max(0) > 2)[0][0], np.where(a[..., 3].max(1) > 2)[0][0]
y1 = np.where(a[..., 3].max(1) > 2)[0][-1] + 1
ext = 640
edge = a[:, -1:, :]
a = np.concatenate([a, np.repeat(edge, ext, axis=1)], axis=1)[y0:y1, x0:]
pump = Image.fromarray(a)
webp(pump, "pump.webp", 90, alpha=True)
print("pump anchors (px in pump.webp):", {"bodyLeft": 0, "bodyRight": 719 - x0, "top": 0, "base": 1566 - y0,
      "hoseRow": [1540 - y0, 1569 - y0], "frameRight": 880 - x0})

# ---- card 1's backdrop: the frame, the painted pump filled out, a portrait window around it, softened ----
f = np.array(Image.open(os.path.join(SCENE, "frames", "f6-v17.png")).convert("RGB")).astype(np.float32)
cut = Image.open(os.path.join(SCENE, "props", "pump-cut.png")).split()[3]          # page-b .pumpCut: 327, 207, 1:1
hole = np.zeros(f.shape[:2], bool)
hole[207:207 + cut.height, 327:327 + cut.width] = np.array(cut.filter(ImageFilter.MaxFilter(13))) > 10
f2 = f.copy()
f2[hole] = fill(f, hole)[hole]
win = Image.fromarray(f2.clip(0, 255).astype(np.uint8)).crop((118, 0, 118 + 652, 1024))  # 0.637 = the card's picture
win = win.filter(ImageFilter.GaussianBlur(7))
w = np.array(win).astype(np.float32) / 255
yy, xx = np.mgrid[0:w.shape[0], 0:w.shape[1]]
v = 1 - 0.32 * (((xx / w.shape[1] - 0.5) * 1.6) ** 2 + ((yy / w.shape[0] - 0.45) * 1.2) ** 2)   # a soft lens vignette
w = (w * 0.86 * v[..., None]) ** 1.06
station = Image.fromarray((w.clip(0, 1) * 255).astype(np.uint8)).resize((436, 685), Image.LANCZOS)
webp(station, "station.webp", 72)

# ---- the page behind the stack + the end page: the whole frame, so both line up (cover, right-aligned = the open sky
#      right of the canopy on a phone). dusk = out of focus and dim behind the cards; scene = the same frame sharp, the
#      end page (the right side of the desktop page; DESIGN.md 7's readings stand in its sky) ----
frame = Image.open(os.path.join(SCENE, "frames", "f6-v17.png")).convert("RGB")
d = frame.resize((576, 384), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6.8))
webp(Image.fromarray(((np.array(d).astype(np.float32) / 255 * 0.62).clip(0, 1) * 255).astype(np.uint8)), "dusk.webp", 70)
webp(frame, "scene.webp", 84)

# ---- the linen stock: a plain weave embossed from a height map, threads of uneven width (seamless at 96 css px, 3x) ----
rng = np.random.default_rng(7)
N, K = 288, 26                                          # 26 threads per tile each way


def threads():
    w = rng.uniform(.7, 1.3, K); w *= N / w.sum()       # uneven widths that still close the tile
    e = np.concatenate([[0], np.cumsum(w)])
    t = np.arange(N) + .5
    i = np.clip(np.searchsorted(e, t, side="right") - 1, 0, K - 1)
    return np.sin((t - e[i]) / (e[i + 1] - e[i]) * np.pi), i


py, iy = threads()
px, ix = threads()
over = ((ix[None, :] + iy[:, None]) % 2) == 0            # which thread lies on top at each crossing
hgt = np.where(over, py[:, None] * (.8 + .4 * rng.random(K)[iy][:, None]), px[None, :] * (.8 + .4 * rng.random(K)[ix][None, :]))
hgt += rng.normal(0, .05, (N, N))
gy, gx = np.gradient(np.pad(hgt, 2, mode="wrap"))
gy, gx = gy[2:-2, 2:-2], gx[2:-2, 2:-2]
shade = (-gx * .7 - gy * .7) * 1.6                        # light from the upper left (DESIGN.md 5)
lin = 214 + shade * 26 + (hgt - hgt.mean()) * 10
lin = np.array(Image.fromarray(lin.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6)))
webp(Image.fromarray(lin).convert("L"), "linen.webp", 82)

# ---- the stamp: the keys from the MAIL ME THE KEYS poster (poster-mail-1, Dan's default) ----
st = Image.open(os.path.join(SCENE, "props", "poster-mail-1.webp")).convert("RGB").crop((148, 432, 468, 800))
webp(st.resize((240, 276), Image.LANCZOS), "stamp.webp", 82)
