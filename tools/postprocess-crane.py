#!/usr/bin/env python3
"""Post-process crane-buycard asset candidates from tools/_crane-candidates/.

  python3 tools/postprocess-crane.py master                 verify + measure all master-*.png
  python3 tools/postprocess-crane.py chain                  verify + extract tile from all chain-*.png
  python3 tools/postprocess-crane.py install master-2 chain-1   crop/compress/install the winners
  python3 tools/postprocess-crane.py wear                   derive the paint-wear alpha mask
  python3 tools/postprocess-crane.py pill                   extract the CTA pill + patch the door
  python3 tools/postprocess-crane.py split                  split crane (chain+hook) from door (+ring)

master: alpha-verify (bbox >=8px inside every edge, else REJECT), defringe bright
halos, tight-crop, measure geometry (chain centerline, hook/door transitions,
red CTA-pill bbox) and emit <name>-measure.png with a 5% grid for eyeballing
the CSS vars (--seam-y, --chain-x, stamp top).

chain: alpha-verify, defringe, horizontal trim, find the link period by
autocorrelating the per-row alpha profile, pick the cleanest seam row, RMS-check
the cut, save <name>-tile.png + a x3 stacked <name>-stack.png preview.

install: master -> src/assets/plugins/revlimiter-crane-master.png (budget 900KB),
chain tile -> resized to 128px wide -> src/assets/plugins/revlimiter-chain.png
(budget 50KB). Uses pngquant/oxipng when available, else PIL optimize.

wear: derive src/assets/plugins/revlimiter-wear.png from the INSTALLED master —
an alpha-channel mask (RGB white, wear in A) for the /cranelab worn-paint copy.
Wear = HIGH-PASS luminance (scratches/chips are high-frequency deviation; raw
darkness would conflate dark paint with damage), floored so letters fade but
never vanish, with the baked enamel CTA pill forced near-opaque (enamel = clean
print) and the price zone kept readable (money info). Alpha (not luminance)
because the -webkit-mask- fallback family is alpha-only.
"""
import json
import math
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

CAND = os.path.join(os.path.dirname(__file__), "_crane-candidates")
PLUGINS = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "plugins")
EDGE_MARGIN = 8          # px the alpha bbox must keep from every canvas edge
FRINGE_LUMA = 190        # mean luma above this in semi-alpha pixels => defringe
MASTER_BUDGET = 900_000  # bytes
CHAIN_BUDGET = 50_000


def alpha_verify(im, name, required="ltrb"):
    """required: which edges must keep EDGE_MARGIN clearance. gpt-image-1 leaves a
    faint sub-16 alpha haze over the whole canvas, so the bbox is taken on a
    thresholded alpha and the haze is zeroed out of the image."""
    if im.mode != "RGBA":
        return None, f"{name}: REJECT — mode {im.mode}, no alpha"
    a = im.getchannel("A")
    im.putalpha(a.point(lambda v: 0 if v < 8 else v))   # dehaze
    bbox = a.point(lambda v: 255 if v >= 16 else 0).getbbox()
    if bbox is None:
        return None, f"{name}: REJECT — fully transparent"
    l, t, r, b = bbox
    margins = dict(l=l, t=t, r=im.width - r, b=im.height - b)
    bad = {e: v for e, v in margins.items() if e in required and v < EDGE_MARGIN}
    if bad:
        return None, (f"{name}: REJECT — edge bleed on {bad} "
                      f"(margins {margins}, need >={EDGE_MARGIN}px on '{required}')")
    return bbox, f"{name}: alpha OK, margins {margins}"


def defringe(im, name):
    px = im.load()
    tot = n = 0
    for y in range(0, im.height, 3):          # sample grid — fringe stats only
        for x in range(0, im.width, 3):
            r, g, b, a = px[x, y]
            if 0 < a < 48:
                tot += 0.299 * r + 0.587 * g + 0.114 * b
                n += 1
    if n and tot / n > FRINGE_LUMA:
        a = im.getchannel("A").filter(ImageFilter.MinFilter(3))
        im.putalpha(a)
        print(f"{name}: bright fringe (luma {tot/n:.0f} over {n} samples) — eroded alpha 1px")
    return im


def row_profile(im):
    a = im.getchannel("A")
    w, h = a.size
    data = list(a.getdata())
    return [sum(data[y * w:(y + 1) * w]) / (255 * w) for y in range(h)]


def measure_master(im, name):
    w, h = im.size
    prof = row_profile(im)
    peak = max(prof)
    # width-coverage transitions: chain (narrow) -> hook (mid) -> door (wide)
    hook_top = next((y for y, v in enumerate(prof) if v > 0.06 * peak), 0)
    door_top = next((y for y, v in enumerate(prof) if v > 0.55 * peak), 0)
    # chain centerline: alpha centroid of the strip above the hook
    a = im.getchannel("A")
    adata = list(a.getdata())
    sx = sa = 0
    for y in range(0, max(hook_top, 1)):
        for x in range(w):
            v = adata[y * w + x]
            sx += x * v
            sa += v
    chain_x = (sx / sa) if sa else w / 2
    # red CTA pill: strong-red opaque pixels in the lower 60%
    px = im.load()
    minx = miny = 10**9
    maxx = maxy = -1
    for y in range(int(h * 0.4), h, 2):
        for x in range(0, w, 2):
            r, g, b, alpha = px[x, y]
            # glossy pill enamel is #9e1b1b..#e83a3a (R>=158); faded door paint
            # crowns top out near #8a2a1e (R=138) — gate at 150 to split them
            if alpha > 200 and r > 150 and r > 1.5 * g and r > 1.5 * b:
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    pill = None
    if maxx > 0 and (maxx - minx) * (maxy - miny) > 0.005 * w * h:
        pill = dict(x_pct=round((minx + maxx) / 2 / w * 100, 1),
                    y_pct=round((miny + maxy) / 2 / h * 100, 1),
                    w_pct=round((maxx - minx) / w * 100, 1),
                    h_pct=round((maxy - miny) / h * 100, 1))
    meas = dict(w=w, h=h, aspect=f"{w} / {h}",
                chain_top_y_pct=0.0,
                hook_top_y_pct=round(hook_top / h * 100, 1),
                door_top_y_pct=round(door_top / h * 100, 1),
                chain_x_pct=round(chain_x / w * 100, 1),
                pill=pill)
    # grid overlay for eyeballing --seam-y / stamp top
    over = Image.new("RGBA", (w, h), (110, 106, 100, 255))
    over.alpha_composite(im)
    d = ImageDraw.Draw(over)
    for pct in range(5, 100, 5):
        y = int(h * pct / 100)
        d.line([(0, y), (w, y)], fill=(255, 244, 208, 120), width=1)
        d.text((6, y + 2), f"{pct}%", fill=(255, 244, 208, 200))
    if pill:
        d.rectangle([minx, miny, maxx, maxy], outline=(80, 255, 120, 255), width=3)
    out = os.path.join(CAND, f"{name}-measure.png")
    over.convert("RGB").save(out)
    print(f"{name}: {json.dumps(meas)}\n{name}: grid overlay -> {out}")
    return meas


def extract_tile(im, name):
    bbox = im.getchannel("A").getbbox()
    l, _, r, _ = bbox
    l, r = max(0, l - 4), min(im.width, r + 4)
    strip = im.crop((l, 0, r, im.height))
    prof = row_profile(strip)
    h = len(prof)
    # autocorrelate the alpha profile for the link period; a full cycle is TWO
    # links (front-facing + edge-on), which at gpt-image scale runs 400-600px
    best_lag, best_score = None, 1e18
    for lag in range(120, h // 2):
        num = h - lag
        score = sum((prof[y] - prof[y + lag]) ** 2 for y in range(0, num, 2)) / num
        if score < best_score:
            best_lag, best_score = lag, score
    P = best_lag
    # cleanest seam row: minimal RMS between full RGBA rows y0 and y0+P
    w = strip.width
    data = list(strip.getdata())

    def row_rms(y0):
        s = 0
        for x in range(w):
            p1, p2 = data[y0 * w + x], data[(y0 + P) * w + x]
            s += sum((c1 - c2) ** 2 for c1, c2 in zip(p1, p2))
        return math.sqrt(s / (w * 4))

    lo, hi = int(h * 0.08), int(h * 0.25)
    y0 = min(range(lo, hi), key=row_rms)
    rms = row_rms(y0)
    tile = strip.crop((0, y0, w, y0 + P))
    tile_path = os.path.join(CAND, f"{name}-tile.png")
    tile.save(tile_path)
    stack = Image.new("RGBA", (w, P * 3), (110, 106, 100, 255))
    for i in range(3):
        stack.alpha_composite(tile, (0, i * P))
    stack_path = os.path.join(CAND, f"{name}-stack.png")
    stack.convert("RGB").save(stack_path)
    verdict = "seam OK" if rms < 8 else f"seam ROUGH (rms {rms:.1f} >= 8) — eyeball the stack"
    print(f"{name}: period={P}px linkW={strip.width}px seam@y={y0} rms={rms:.1f} — {verdict}")
    print(f"{name}: tile -> {tile_path}\n{name}: x3 stack -> {stack_path}")
    return tile_path


def compress(path, budget):
    size = os.path.getsize(path)
    if shutil.which("pngquant"):
        q = path + ".q.png"
        subprocess.run(["pngquant", "--speed", "1", "--quality", "78-95",
                        "--force", "--output", q, path], check=False)
        if os.path.exists(q) and os.path.getsize(q) < size:
            os.replace(q, path)
            size = os.path.getsize(path)
    if shutil.which("oxipng"):
        subprocess.run(["oxipng", "-o4", "--quiet", path], check=False)
        size = os.path.getsize(path)
    flag = "OK" if size <= budget else f"OVER BUDGET ({budget})"
    print(f"{os.path.basename(path)}: {size} bytes — {flag}")


def run_batch(kind):
    names = sorted(f for f in os.listdir(CAND)
                   if f.startswith(kind + "-") and f.endswith(".png")
                   and "-tile" not in f and "-stack" not in f and "-measure" not in f)
    if not names:
        sys.exit(f"no {kind}-*.png candidates in {CAND}")
    for f in names:
        name = f[:-4]
        im = Image.open(os.path.join(CAND, f)).convert("RGBA")
        # chain candidates span full height by design; a master's chain may be
        # top-cut too (the tile strip takes over above --seam-y)
        bbox, msg = alpha_verify(im, name, required="lrb" if kind == "master" else "lr")
        print(msg)
        if bbox is None:
            continue
        im = defringe(im, name)
        if kind == "master":
            measure_master(im.crop(bbox), name)
        else:
            extract_tile(im, name)


def install(master_name, chain_name):
    m = Image.open(os.path.join(CAND, master_name + ".png")).convert("RGBA")
    bbox, msg = alpha_verify(m, master_name, required="lrb")
    print(msg)
    if bbox is None:
        sys.exit(1)
    m = defringe(m, master_name).crop(bbox)
    master_out = os.path.join(PLUGINS, "revlimiter-crane-master.png")
    m.save(master_out, optimize=True)
    print(f"installed {master_out} ({m.width}x{m.height} — CSS aspect-ratio {m.width} / {m.height})")
    compress(master_out, MASTER_BUDGET)

    tile_path = os.path.join(CAND, chain_name + "-tile.png")
    if not os.path.exists(tile_path):
        sys.exit(f"{tile_path} missing — run `chain` mode first")
    t = Image.open(tile_path).convert("RGBA")
    scale = 128 / t.width
    t = t.resize((128, max(1, round(t.height * scale))), Image.LANCZOS)
    chain_out = os.path.join(PLUGINS, "revlimiter-chain.png")
    t.save(chain_out, optimize=True)
    print(f"installed {chain_out} ({t.width}x{t.height})")
    compress(chain_out, CHAIN_BUDGET)


WEAR_BUDGET = 80_000
WEAR_FLOOR = 120         # letters fade to 47% at the deepest chips, never vanish
WEAR_STRENGTH = 0.9      # high-pass -> alpha attenuation gain
# regions in fractions of the master box (== the .revcrane-door element box):
# price block per the approved ?edit=1 reference (33.7% x / 78.6% y, -4.3deg).
# (The old CTA-pill force is gone: since the `pill` surgery the CTA text rides
# the .rc-pill asset OUTSIDE the wear-masked .rc-copy.)
WEAR_PRICE = (0.337, 0.786, 0.15, 0.052, 160)


def wear():
    src = os.path.join(PLUGINS, "revlimiter-crane-master.png")
    m = Image.open(src).convert("RGBA")
    lum = m.convert("L")
    # high-pass: scratches, chips and seams pop; broad shading cancels out
    hp = ImageChops.difference(lum, lum.filter(ImageFilter.GaussianBlur(8)))
    hp = ImageOps.autocontrast(hp)
    mask = hp.point(lambda v: max(WEAR_FLOOR, 255 - int(v * WEAR_STRENGTH)))

    # force minimum opacity over the price (money info stays readable)
    floors = Image.new("L", mask.size, 0)
    d = ImageDraw.Draw(floors)
    for cx, cy, rx, ry, lo in (WEAR_PRICE,):
        d.ellipse([(cx - rx) * m.width, (cy - ry) * m.height,
                   (cx + rx) * m.width, (cy + ry) * m.height], fill=lo)
    mask = ImageChops.lighter(mask, floors)

    mask = mask.filter(ImageFilter.GaussianBlur(1.5))     # de-alias chip edges
    half = (m.width // 2, m.height // 2)                  # 404x724 is plenty
    mask = mask.resize(half, Image.LANCZOS)

    out = Image.new("RGBA", half, (255, 255, 255, 255))
    out.putalpha(mask)
    dest = os.path.join(PLUGINS, "revlimiter-wear.png")
    out.save(dest, optimize=True)
    lo, hi = mask.getextrema()
    stat = sum(mask.histogram()[i] * i for i in range(256)) / (half[0] * half[1])
    print(f"wear mask: alpha min {lo} / max {hi} / mean {stat:.0f} (255=paint intact)")
    print(f"installed {dest} ({out.width}x{out.height})")
    compress(dest, WEAR_BUDGET)


# ── pill: un-bake the enamel CTA pill into its own movable asset ──────────
# Reads the pristine backup (master-installed-orig.png), never the installed
# file, so the surgery is idempotent. Outputs:
#   revlimiter-cta-pill.png   dome+rim+baked contact shadow, feathered ellipse
#   revlimiter-crane-master.png   pill region diffusion-filled with door paint
# and prints the CSS numbers (.rc-pill left/top/width/aspect-ratio).
ORIG = os.path.join(CAND, "master-installed-orig.png")
PILL_WINDOW = (380, 1040, 700, 1290)   # generous search box around the pill
PILL_BUDGET = 30_000


def _diffusion_fill(region, hole):
    """Fill `hole` (L, 255=fill me) by iterative blur-and-reimpose diffusion."""
    keep = hole.point(lambda v: 255 - v)
    base = region.copy()
    # seed the hole with the mean of the surrounding kept pixels
    stat_src = Image.composite(Image.new("RGBA", region.size, (0, 0, 0, 0)), region, hole)
    px = stat_src.load()
    rs = gs = bs = n = 0
    for y in range(region.height):
        for x in range(region.width):
            r, g, b, a = px[x, y]
            if a > 0:
                rs += r; gs += g; bs += b; n += 1
    mean = (rs // max(n, 1), gs // max(n, 1), bs // max(n, 1), 255)
    base.paste(Image.new("RGBA", region.size, mean), (0, 0), hole)
    for _ in range(10):
        blurred = base.filter(ImageFilter.GaussianBlur(10))
        base = Image.composite(region, blurred, keep)
    return base


def pill():
    m = Image.open(ORIG).convert("RGBA")
    W, H = m.size
    px = m.load()
    wx0, wy0, wx1, wy1 = PILL_WINDOW
    # chrome rim gate: high green vs. the maroon paint AND deep-red enamel
    minx = miny = 10**9
    maxx = maxy = -1
    for y in range(wy0, wy1):
        for x in range(wx0, wx1):
            r, g, b, a = px[x, y]
            if a > 200 and r > 120 and g > 60:
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    if maxx < 0:
        sys.exit("pill: rim not found in window")
    cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
    rx, ry = (maxx - minx) / 2, (maxy - miny) / 2
    print(f"pill rim bbox ({minx},{miny})-({maxx},{maxy})  centre ({cx:.0f},{cy:.0f}) "
          f"= {cx/W*100:.2f}% x / {cy/H*100:.2f}% y   radii {rx:.0f}x{ry:.0f}")

    # ── extract the pill asset: rim + a feather of paint + the baked lower
    # contact shadow (rides along so the pill stays 'seated' wherever it lands)
    # crop SYMMETRIC about the rim centre: the element is placed by its box
    # centre (translate -50%), so an asymmetric crop renders the pill offset
    ex_pad_x, ex_pad_top, ex_pad_bot = 4, 4, 8
    crop_pad = 14
    cb = (int(cx - rx) - crop_pad, int(cy - ry) - crop_pad,
          int(cx + rx) + crop_pad, int(cy + ry) + crop_pad)
    pill_im = m.crop(cb)
    pw, ph = pill_im.size
    pcx, pcy = cx - cb[0], cy - cb[1]
    am = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(am).ellipse(
        [pcx - rx - ex_pad_x, pcy - ry - ex_pad_top,
         pcx + rx + ex_pad_x, pcy + ry + ex_pad_bot], fill=255)
    am = am.filter(ImageFilter.GaussianBlur(3))
    pill_im.putalpha(ImageChops.multiply(pill_im.getchannel("A"), am))
    pill_out = os.path.join(PLUGINS, "revlimiter-cta-pill.png")
    pill_im.save(pill_out, optimize=True)
    print(f"installed {pill_out} ({pw}x{ph})")
    compress(pill_out, PILL_BUDGET)

    # ── patch the master: diffusion-fill a slightly larger hole (swallows the
    # rim's contact shadow), then re-grain from the clean paint strip on the left
    # pads must swallow the rim's dark outer edge + the baked contact shadow
    # (extends ~15px below-left) or the diffusion fill inherits a ghost ring
    hole_pad_x, hole_pad_top, hole_pad_bot = 20, 16, 26
    rb = (int(cx - rx) - hole_pad_x - 20, int(cy - ry) - hole_pad_top - 20,
          int(cx + rx) + hole_pad_x + 20, int(cy + ry) + hole_pad_bot + 20)
    region = m.crop(rb)
    hole = Image.new("L", region.size, 0)
    ImageDraw.Draw(hole).ellipse(
        [cx - rx - hole_pad_x - rb[0], cy - ry - hole_pad_top - rb[1],
         cx + rx + hole_pad_x - rb[0], cy + ry + hole_pad_bot - rb[1]], fill=255)
    filled = _diffusion_fill(region, hole)
    # re-grain: SIGNED high-pass (centred on 128) of the clean paint band left
    # of the pill, tiled with alternating mirror so the tiling never bands
    band = m.crop((wx0, int(cy - ry), int(cx - rx) - 24, int(cy + ry))).convert("L")
    hp = ImageChops.subtract(band, band.filter(ImageFilter.GaussianBlur(4)), 1.0, 128)
    tile = Image.new("L", region.size, 128)
    for ty in range(0, region.height, hp.height):
        for tx in range(0, region.width, hp.width):
            t = hp.transpose(Image.FLIP_LEFT_RIGHT) if (tx // hp.width) % 2 else hp
            if (ty // hp.height) % 2:
                t = t.transpose(Image.FLIP_TOP_BOTTOM)
            tile.paste(t, (tx, ty))
    bands = list(filled.split())
    for ch in range(3):
        bands[ch] = ImageChops.add(bands[ch], tile, 1.0, -128)
    grained = Image.merge("RGBA", bands)
    soft_hole = hole.filter(ImageFilter.GaussianBlur(3))
    m.paste(grained, rb[:2], soft_hole)

    master_out = os.path.join(PLUGINS, "revlimiter-crane-master.png")
    m.save(master_out, optimize=True)
    # intermediate for the `split` step (uncompressed, pill-patched)
    m.save(os.path.join(CAND, "master-pill-patched.png"), optimize=True)
    print(f"patched master -> {master_out}")
    compress(master_out, MASTER_BUDGET)

    ow, oh = pw, ph
    print("\nCSS for cranelab.astro (.rc-pill — box == the full master box):")
    print(f"  left: {cx/W*100:.1f}%; top: {cy/H*100:.1f}%;")
    print(f"  width: {ow/W*100:.1f}%; aspect-ratio: {ow} / {oh};")


# ── split: separate the crane (chain strip + swivel + hook) from the door ──
# so the release choreography can drop the door while the crane recoils.
# Reads master-pill-patched.png (run `pill` first). Outputs three layers that
# composite back to the original at rest (browser z-order: door < hook < ring):
#   revlimiter-crane-hook.png   rows 0..STRIP_H: chain+swivel+hook, ring
#                               removed, bowl cloned back where the ring crossed
#   revlimiter-door-ring.png    the door's lifting ring alone (falls WITH door)
#   revlimiter-crane-master.png door only: hook zone cleared, rail rebuilt
#                               across the covered span by mirror-cloning
# Geometry measured 2026-07-02 on the installed 808x1448 master (grid crops).
STRIP_H = 456            # hook strip height: full bowl (~row 445) + margin
RAIL_SPAN = (328, 562)   # strip keep-range: the crane footprint columns
REBUILD_SPAN = (318, 528)    # rail rebuild stops BEFORE the corner roll proper —
                             # a translated straight clone on the rolling tube
                             # reads as a kink
RAIL_MODEL_END = 520     # bowl (+ its edge tail) hides the rail top up to here —
                         # use the measured silhouette top beyond (a model there
                         # steals the rail's own top-edge pixels into the strip)
RAIL_FLAT_UNTIL = 474    # rail top is level (~t0) up to here, then rolls down
RAIL_BAND = (383, 494)   # rows of the rail band incl. AA + under-edge shadow
# NB the hook's cast shadow on the corner roll is KEPT on the door on purpose:
# in the dropped state the crane still hovers overhead, so a soft shadow reads
# fine — while removing it needs structural edits on the rolling tube (kinks,
# seams). Rebuild covers only what the bowl/ring physically occlude.
# the lifting ring is nearly perfectly edge-on: ONE solid near-vertical tube
# (no see-through opening — subtracting an "inner hole" cuts the tube) with a
# bottom flare. Traced on the 6x fine grid 2026-07-02.
RING_OUTER = [(409, 360), (420, 358), (426, 366), (427, 380), (426, 395),
              (425, 420), (425, 440), (427, 455), (433, 462), (434, 474),
              (428, 484), (416, 487), (409, 478), (407, 462), (406, 440),
              (406, 410), (406, 385), (406, 370)]
# hook-bowl ownership below the rail top (bowl renders IN FRONT of the rail);
# underside traced off split-debug.png — hugs the steel edge (a looser trace
# drags the baked under-bowl shadow into the strip as a black smear)
BOWL_KEEP = [(330, 340), (508, 340), (508, 400), (486, 424), (452, 437),
             (425, 437), (396, 422), (365, 414), (345, 407), (330, 394)]
# the bowl's dark right-edge tail hovers over the rail past the BOWL_KEEP
# polygon — capture it into the strip (it must fly with the crane, and left on
# the door it reads as dark stubs above the rail). Bottom hugs the rail top.
STUB_POLY = [(504, 356), (526, 356), (526, 404), (516, 403), (504, 396)]
RAIL_SRC = (240, 324)    # clean rail stretch: rebuild clones ping-pong from here
RING_BBOX = (400, 352, 440, 492)   # crop box for the ring asset (pad incl.)
HOOK_BUDGET = 160_000
RING_BUDGET = 12_000


def _poly_mask(size, pts, blur=1.5):
    msk = Image.new("L", size, 0)
    ImageDraw.Draw(msk).polygon(pts, fill=255)
    return msk.filter(ImageFilter.GaussianBlur(blur)) if blur else msk


def _rail_top(px, x, y_from=340, y_to=530):
    """First OPAQUE row = the rail's true silhouette top. A red-gate misfires
    under the hook's shadow (dark red fails the gate several rows deep) and
    that misalignment is what smears the rebuild."""
    for y in range(y_from, y_to):
        if px[x, y][3] > 140:
            return y
    return None


def split(debug=False):
    src_path = os.path.join(CAND, "master-pill-patched.png")
    if not os.path.exists(src_path):
        sys.exit("split: run `pill` first (needs master-pill-patched.png)")
    m = Image.open(src_path).convert("RGBA")
    W, H = m.size
    px = m.load()
    s0, s1 = RAIL_SPAN

    # per-column rail top; across the covered span the true edge is hidden —
    # model it: level at t0 up to RAIL_FLAT_UNTIL, then linear into the
    # measured corner roll at s1 (linear all the way would cut the flat part).
    # t0 comes from a stretch well clear of the bowl's shadow.
    m_end = RAIL_MODEL_END
    tops = {}
    for x in range(0, W):
        if s0 <= x < m_end:
            continue
        tops[x] = _rail_top(px, x)
    clean = sorted(tops[x] for x in range(240, 302) if tops.get(x))
    t0 = clean[len(clean) // 2] if clean else 393
    rights = sorted(tops[x] for x in range(m_end + 4, m_end + 16) if tops.get(x))
    t1 = rights[len(rights) // 2] if rights else 408
    for x in range(s0, m_end):
        if x <= RAIL_FLAT_UNTIL:
            tops[x] = t0
        else:
            tops[x] = round(t0 + (t1 - t0) * (x - RAIL_FLAT_UNTIL) / (m_end - RAIL_FLAT_UNTIL))
    print(f"rail top: t0={t0} (flat to {RAIL_FLAT_UNTIL}), t1={t1} @ x={m_end}")

    ring_m = _poly_mask((W, H), RING_OUTER)
    bowl_m = _poly_mask((W, H), BOWL_KEEP, blur=1.0)

    if debug:
        over = m.copy()
        d = ImageDraw.Draw(over)
        d.polygon(RING_OUTER, outline=(0, 255, 255, 255))
        d.polygon(BOWL_KEEP, outline=(255, 255, 0, 255))
        for x in range(0, W, 2):
            t = tops.get(x)
            if t and 300 < t < 530:
                d.point((x, t), fill=(0, 255, 0, 255))
        dbg = over.crop((290, 320, 750, 540))
        dbg = dbg.resize((dbg.width * 2, dbg.height * 2), Image.LANCZOS)
        out = os.path.join(CAND, "split-debug.png")
        bg = Image.new("RGBA", dbg.size, (40, 120, 40, 255))
        bg.alpha_composite(dbg)
        bg.convert("RGB").save(out)
        print(f"debug overlay -> {out}")
        return

    def steelish(x, y):
        """Below the rail top only steel may join the strip. A negative
        'not red' gate is not enough: the DARK shadow reds (r 40-60, g 20)
        sneak through and fly off with the crane as a red smear."""
        r, g, b, a = px[x, y]
        return a > 100 and r <= 1.35 * g + 6

    # ── 1. hook strip: chain + swivel + hook, nothing of the door ──────────
    # keep = above the rail top, or inside the bowl footprint (the bowl renders
    # in FRONT of the rail) as long as the pixel isn't rail-red. The polygon is
    # the authority for the bowl's dark underside edge — a luma gate would eat it.
    keep = Image.new("L", (W, STRIP_H), 0)
    kp = keep.load()
    bm = _poly_mask((W, H), BOWL_KEEP, blur=0).load()
    stub = _poly_mask((W, H), STUB_POLY, blur=0).load()
    rm = ring_m.load()
    for y in range(STRIP_H):
        for x in range(s0 - 6, s1):     # crane footprint only — outside it the
            t = tops.get(x)             # "above the rail" test would steal the
            if (t is None or y < t - 1  # rail's own top-highlight pixels
                    or ((bm[x, y] > 128 or stub[x, y] > 128) and steelish(x, y))):
                kp[x, y] = 255
    keep = keep.filter(ImageFilter.GaussianBlur(1.0))
    strip = m.crop((0, 0, W, STRIP_H)).copy()
    strip.putalpha(ImageChops.multiply(strip.getchannel("A"), keep))
    # clone the bowl back where the ring crossed it (ring is the door's layer)
    sp = strip.load()
    for y in range(358, 446):
        for x in range(396, 446):
            if rm[x, y] > 10:
                t = tops.get(x)
                if y < (t or 999) - 1 or bm[x, y] > 128:
                    if y >= 415 and not steelish(x + 42, y):
                        continue        # low rows: never clone shadow-red in
                    r2, g2, b2, a2 = px[x + 42, y]
                    r1, g1, b1, a1 = sp[x, y]
                    f = rm[x, y] / 255
                    sp[x, y] = (round(r1 + (r2 - r1) * f), round(g1 + (g2 - g1) * f),
                                round(b1 + (b2 - b1) * f), round(a1 + (a2 - a1) * f))
    hook_out = os.path.join(PLUGINS, "revlimiter-crane-hook.png")
    strip.save(hook_out, optimize=True)
    print(f"installed {hook_out} ({W}x{STRIP_H} — CSS aspect-ratio {W} / {STRIP_H})")
    compress(hook_out, HOOK_BUDGET)

    # ── 2. ring asset: the lifting ring alone, feathered mask ──────────────
    ring_im = m.copy()
    ring_im.putalpha(ImageChops.multiply(ring_im.getchannel("A"), ring_m))
    ring_im = ring_im.crop(RING_BBOX)
    ring_out = os.path.join(PLUGINS, "revlimiter-door-ring.png")
    ring_im.save(ring_out, optimize=True)
    rcx = (RING_BBOX[0] + RING_BBOX[2]) / 2
    rcy = (RING_BBOX[1] + RING_BBOX[3]) / 2
    print(f"installed {ring_out} ({ring_im.width}x{ring_im.height})")
    compress(ring_out, RING_BUDGET)

    # ── 3. door master ──────────────────────────────────────────────────────
    # The strip's own alpha IS the deletion mask (never a global row clear —
    # that shaves the rail's soft top edge). Rail rebuilt only where the crane
    # or its shadow covered it, mirror-cloned column-wise, feather-blended.
    door = m.copy()
    strip_a = strip.getchannel("A")
    del_m = Image.new("L", (W, H), 0)
    del_m.paste(strip_a.point(lambda v: 255 if v > 12 else 0), (0, 0))
    del_m = ImageChops.lighter(del_m, ring_m.point(lambda v: 255 if v > 12 else 0))
    del_m = del_m.filter(ImageFilter.MaxFilter(5))            # +2px into the AA
    door.putalpha(ImageChops.multiply(
        door.getchannel("A"), del_m.point(lambda v: 255 - v)))

    b0, b1 = RAIL_BAND
    r0, r1 = REBUILD_SPAN
    band_m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(band_m).rectangle([r0, b0, r1, b1], fill=255)
    core = ImageChops.multiply(del_m, band_m)
    core = core.filter(ImageFilter.MaxFilter(9))              # cover suppressed px
    # blur feathers the blend, but clamp back to the band: a mask that bleeds
    # above it would paste `rebuilt` pixels OUTSIDE the rows we actually wrote
    rebuild_m = ImageChops.multiply(core.filter(ImageFilter.GaussianBlur(2)), band_m)

    # clone columns ping-pong from the clean stretch just left of the crossing
    # (a far mirror source carries a different sheen and reads as a dull patch)
    c0, c1 = RAIL_SRC
    period = c1 - c0
    rebuilt = Image.new("RGBA", (W, H), (0, 0, 0, 0))   # written rows only —
    rp = rebuilt.load()                                  # never original crane px
    # fractional drift + bilinear vertical sampling: integer drift staircases
    # column-to-column and puts a wobble on the rail's twin ridge lines
    for x in range(r0, r1):
        cyc = (x - r0) % (2 * period)
        sx = (c1 - cyc) if cyc < period else (c0 + cyc - period)
        if x <= RAIL_FLAT_UNTIL:
            target = float(t0)
        elif x < m_end:
            target = t0 + (t1 - t0) * (x - RAIL_FLAT_UNTIL) / (m_end - RAIL_FLAT_UNTIL)
        else:
            target = float(tops[x])
        drift = target - (tops.get(sx) or t0)
        fl = math.floor(drift)
        fr = drift - fl
        for y in range(b0, b1):
            sy = y - fl
            if 0 <= sy - 1 and sy < H:
                p1 = px[sx, sy]
                p2 = px[sx, sy - 1]
                rp[x, y] = tuple(round(p1[i] * (1 - fr) + p2[i] * fr) for i in range(4))
    door.paste(rebuilt, (0, 0), rebuild_m)
    # soften the span seams: a hair of blur where clone meets original
    for seam_x in (r0, r1):
        box = (seam_x - 7, b0, seam_x + 7, b1)
        soft = door.crop(box).filter(ImageFilter.GaussianBlur(1.1))
        sm = Image.new("L", (14, b1 - b0), 0)
        ImageDraw.Draw(sm).rectangle([4, 0, 9, b1 - b0], fill=255)
        sm = sm.filter(ImageFilter.GaussianBlur(2.5))
        door.paste(soft, box[:2], sm)

    master_out = os.path.join(PLUGINS, "revlimiter-crane-master.png")
    door.save(master_out, optimize=True)
    door.save(os.path.join(CAND, "master-door-split.png"), optimize=True)
    print(f"door-only master -> {master_out}")
    compress(master_out, MASTER_BUDGET)

    print("\nCSS for cranelab.astro:")
    print(f"  .revcrane-hookpart{{ aspect-ratio: {W} / {STRIP_H}; }}  (top:0; width:100%)")
    print(f"  .rc-ring{{ left: {rcx/W*100:.2f}%; top: {rcy/H*100:.2f}%; "
          f"width: {ring_im.width/W*100:.2f}%; aspect-ratio: {ring_im.width} / {ring_im.height}; }}")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] in ("master", "chain"):
        run_batch(sys.argv[1])
    elif len(sys.argv) == 4 and sys.argv[1] == "install":
        install(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 2 and sys.argv[1] == "wear":
        wear()
    elif len(sys.argv) == 2 and sys.argv[1] == "pill":
        pill()
    elif len(sys.argv) >= 2 and sys.argv[1] == "split":
        split(debug="--debug" in sys.argv)
    else:
        sys.exit(__doc__)
