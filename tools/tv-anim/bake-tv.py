#!/usr/bin/env python3
"""The TV's baked plugins (Dan 2026-11-11: "bake", with his COPY SETTINGS from /__wwdepth: the look he decided,
"perfect lets commit to it"). The bench grades every plugin live with SVG filters; the site gets the grade baked in:
  public/tv/<slug>-x4.mp4 / -x2.mp4  the loop at 4 / 2 video px a picture pixel (laptop / phone), H.264, 27 fps (15 x
                                     the bench's Speed 1.8), straight colour on black: the page cuts it out with the
                                     still's alpha (no plugin's outline moves in its loop: checked, 0 of 255)
  public/tv/<slug>-still.webp        frame 0 baked, 4 px a pixel, with its alpha (exact; colour q90): the poster, the cut-out's mask, the
                                     light round it (a CSS drop-shadow on a still: drawn once) and reduced motion's picture
  public/tv/<slug>-halo.webp         the light round the plugin, as a mask: frame 0's outline (alpha) padded HALO_PAD picture
                                     px a side and blurred as the bench's drop-shadow(0 0 Glow size): sigma = half its px,
                                     2 CSS px a picture pixel. The page paints the channel's colour through it (the colour
                                     stays live); a drop-shadow on the playing video would redraw its blur every frame
  public/tv/<slug>-thumb.webp        the list's thumbnail (A, smooth): the cut-out's sharp still.png, contain-fitted in a
                                     16:10 box at 2 x the laptop's slot, its own grade (the bloom's reach x Glow size)
                                     and its darkening towards its edges
  src/data/tv-bake.json              what the page needs to know of them: each loop's size in picture pixels, its frames,
                                     the frame rate, the halo's padding
The grade, as the bench's filter chain (tools/wwbench/wwdepth.html filterMarkup + lookOf; Mix 0 and Blacks 0 = each
plugin's own colours, so only the bloom acts): each channel's brightest part (the 11-step knee from Bloom starts at)
blurred (Bloom reach, in CSS px: two per picture pixel) and added x Bloom, kept inside the outline; then brightness x
Brightness and Contrast (CSS filter order, straight colour). Flicker, the pixel grid, the darkening, the halo and the
scanlines stay CSS (WordWall.astro).
  python3 tools/tv-anim/bake-tv.py <settings.json> [--stills] [slug ...]
  --stills: frame 0's files only (still, halo, thumbnail, the manifest); the videos stay as they are"""
import glob, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'tools/wwbench/anim/v2')
OUT = os.path.join(ROOT, 'public/tv')
MANIFEST = os.path.join(ROOT, 'src/data/tv-bake.json')
S = json.load(open(sys.argv[1]))['values']
V = lambda k: float(str(S[k]).rstrip('px%'))
STILLS = '--stills' in sys.argv[2:]
SLUGS = [a for a in sys.argv[2:] if a != '--stills'] or ['revlimiter', 'gas', 'gas2', 'radio-roulette', 'drift']
FPS = 15 * V('speed')                       # the bench steps its 15 fps loops x Speed
THUMB = (320, 200)                          # 16:10, 2 x the laptop's widest slot (9.8rem)
HALO_PAD = 16                               # picture px a side: 4 sigmas of the halo's blur


def knee_of(bfrom):
    xs = np.linspace(0, 1, 11)
    return xs, np.array([0 if x <= bfrom else ((x - bfrom) / (1 - bfrom)) ** 1.5 for x in xs])


def box(arr, r, axis):  # running mean of width 2r+1 along an axis, zeros outside
    if r <= 0: return arr
    c = np.cumsum(np.pad(arr, [(r + 1, r) if i == axis else (0, 0) for i in range(arr.ndim)]), axis=axis)
    return (np.take(c, range(2 * r + 1, c.shape[axis]), axis=axis) - np.take(c, range(0, c.shape[axis] - 2 * r - 1), axis=axis)) / (2 * r + 1)


def gauss(arr, sigma):  # three box blurs = a Gaussian (the boxes from the standard formula), transparent outside
    if sigma <= 0: return arr
    pad = int(np.ceil(sigma * 3)) + 1
    arr = np.pad(arr, ((pad, pad), (pad, pad), (0, 0)))
    n = 3
    wl = int(np.floor(np.sqrt(12 * sigma * sigma / n + 1))); wl -= 1 - wl % 2
    m = round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4))
    for s in [wl if i < m else wl + 2 for i in range(n)]:
        r = (s - 1) // 2
        arr = box(box(arr, r, 0), r, 1)
    return arr[pad:-pad, pad:-pad]


def grade(rgba, sigma):
    """rgba: straight float RGBA. Returns straight colour + alpha, graded as the bench does."""
    rgb, al = rgba[..., :3], rgba[..., 3:4]
    out, oa = rgb * al, al.copy()
    if V('bloom') > 0:
        xs, knee = knee_of(V('bloomFrom'))
        g = gauss(np.concatenate([np.interp(rgb, xs, knee) * al, al], axis=2), sigma)
        out = np.clip(V('bloom') * g[..., :3] + out, 0, 1)
        oa = np.clip(V('bloom') * g[..., 3:4] + oa, 0, 1)
    out, oa = out * al, oa * al                                   # kept inside the outline
    col = np.where(oa > 1e-6, out / np.maximum(oa, 1e-6), 0)
    col = np.clip(np.clip(col * V('lift'), 0, 1) - 0.5, -0.5, 0.5) * V('con') + 0.5
    return np.clip(col, 0, 1), oa


def load(path):
    return np.asarray(Image.open(path).convert('RGBA'), dtype=np.float32) / 255


def to_img(col, oa):
    return Image.fromarray(np.round(np.concatenate([col, oa], axis=2) * 255).astype(np.uint8), 'RGBA')


def vignette(h, w):  # the bench's radial-gradient(farthest-corner, transparent vigIn, rgba(0,0,0,vig) 100%)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot((x + 0.5 - w / 2) / (w / 2), (y + 0.5 - h / 2) / (h / 2)) / np.sqrt(2)  # 0 centre, 1 corner
    t = np.clip((d - V('vigIn') / 100) / (1 - V('vigIn') / 100), 0, 1)
    return (t * V('vig'))[..., None]


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


os.makedirs(OUT, exist_ok=True)
manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {'plugins': {}}
for slug in SLUGS:
    files = sorted(glob.glob(os.path.join(SRC, slug, 'f_*.png')))
    with tempfile.TemporaryDirectory() as tmp:
        sigma = V('blur')  # baked at 2 px a picture pixel = the laptop's CSS px: the bench's px as they are
        for i, f in enumerate(files[:1] if STILLS else files):
            src = load(f).repeat(2, 0).repeat(2, 1)
            col, oa = grade(src, sigma)
            if i == 0:
                to_img(col, oa).resize((col.shape[1] * 2, col.shape[0] * 2), Image.NEAREST).save(os.path.join(tmp, 'still.png'))
                # the halo: the outline at 1 px a picture pixel (each 2 x 2 block's mean), padded, blurred at half the
                # Glow size's CSS px (2 a picture pixel: a quarter of them here), as an alpha mask on black
                m, n = oa.shape[0] // 2, oa.shape[1] // 2
                a1 = oa[:m * 2, :n * 2, 0].reshape(m, 2, n, 2).mean(axis=(1, 3))[..., None]
                halo = gauss(np.pad(a1, ((HALO_PAD, HALO_PAD), (HALO_PAD, HALO_PAD), (0, 0))), V('haloPx') / 2 / 2)
                hz = np.zeros(halo.shape[:2] + (4,), dtype=np.uint8)
                hz[..., 3] = np.round(np.clip(halo[..., 0], 0, 1) * 255).astype(np.uint8)
                Image.fromarray(hz, 'RGBA').save(os.path.join(OUT, f'{slug}-halo.webp'), 'WEBP', lossless=True, method=6, exact=False)
                manifest['plugins'][slug] = {'n': n, 'm': m, 'frames': len(files)}
            if STILLS:
                continue
            # the video: straight colour wherever the plugin is (the page's mask brings its alpha), black elsewhere
            Image.fromarray(np.round(np.where(oa > 0, col, 0) * 255).astype(np.uint8), 'RGB').save(os.path.join(tmp, f'v_{i:04d}.png'))
        for k, crf in () if STILLS else ((2, 18), (4, 20)):
            o = os.path.join(OUT, f'{slug}-x{k}.mp4')
            run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{FPS:g}', '-i', os.path.join(tmp, 'v_%04d.png'),
                 '-vf', f'scale=iw*{k // 2}:ih*{k // 2}:flags=neighbor,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow',
                 '-crf', str(crf), '-tune', 'animation', '-movflags', '+faststart', '-an', o])
        # lossy colour, exact alpha: 4 px a picture pixel sits on VP8's own 4 x 4 blocks (no smear across a pixel)
        run(['cwebp', '-q', '90', '-alpha_q', '100', '-m', '6', '-exact', os.path.join(tmp, 'still.png'), '-o', os.path.join(OUT, f'{slug}-still.webp')])
    # the thumbnail, from the sharp cut-out still (the bench's A): contain-fitted, its own bloom reach, its darkening
    st = Image.open(os.path.join(SRC, slug, 'still.png')).convert('RGBA')
    a = st.width / st.height
    fw, fh = (THUMB[0], round(THUMB[0] / a)) if a >= THUMB[0] / THUMB[1] else (round(THUMB[1] * a), THUMB[1])
    pic = np.asarray(st.convert('RGBa').resize((fw, fh), Image.LANCZOS).convert('RGBA'), dtype=np.float32) / 255
    col, oa = grade(pic, V('blur') * V('thumbReach') * 2)  # the bench's reach in the thumb's CSS px: 2 box px each
    col = col * (1 - vignette(fh, fw))
    canvas = Image.new('RGBA', THUMB, (0, 0, 0, 0))
    canvas.paste(to_img(col, oa), ((THUMB[0] - fw) // 2, (THUMB[1] - fh) // 2))
    tp = os.path.join(OUT, f'{slug}-thumb.webp')
    canvas.save(tp, 'WEBP', quality=85, alpha_quality=100, method=6, exact=True)
    sizes = {n: os.path.getsize(os.path.join(OUT, f'{slug}-{n}')) / 1024 for n in ('x4.mp4', 'x2.mp4', 'still.webp', 'halo.webp', 'thumb.webp')}
    print(slug, len(files), 'frames', {n: f'{v:.1f} KB' for n, v in sizes.items()})
manifest.update({'fps': FPS, 'haloPad': HALO_PAD, 'settings': os.path.relpath(os.path.abspath(sys.argv[1]), ROOT)})
manifest['plugins'] = dict(sorted(manifest['plugins'].items()))
with open(MANIFEST, 'w') as fh:
    json.dump(manifest, fh, indent=2)
    fh.write('\n')
