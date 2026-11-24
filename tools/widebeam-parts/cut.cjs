#!/usr/bin/env node
// WIDE BEAM parts kit: cuts every plate part from the plugin's own photo, src/assets/widebeam/face-base.webp
// (a 2x capture, 3072x2048 px). All boxes below are in the plugin's own units (1536x1024; 1 unit = 2 source px).
// Output: src/assets/widebeam/parts/*.webp (WebP q80) + needle.svg. Deterministic: same source + same sharp = same bytes.
// Run from the repo root:  node tools/widebeam-parts/cut.cjs        (README.md next to this file has the part list)
//
// How a part is made: crop the box, resize to `s` px per unit (2x the largest size the part is shown at), then
//  - runs and the field tile are made seamless by a wrap cross-fade (the low frequencies blend linearly, the grain
//    blends power-preserving, so the overlap keeps its texture and shows no soft band);
//  - every border piece cuts the steel out by a signed-distance mask of the plate's inner rounded rectangle (steel ->
//    transparent + a soft inner shadow), so the field tile shows through and the corners, runs and strap never seam
//    against steel cut from elsewhere;
//  - every object (lamp, road window, meter, cap, badge, screw) keeps the inside of its outline and gets a synthetic
//    contact shadow outside it (never the photo's steel, which would be a grey halo on the page).
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src/assets/widebeam/face-base.webp');
const OUT = path.join(ROOT, 'src/assets/widebeam/parts');
const Q = { quality: 80, alphaQuality: 80, effort: 6, smartSubsample: true };
sharp.cache(false);
sharp.concurrency(1); // deterministic encodes

// The plate's inner steel edge (the inside of the brass trim, its dark groove kept with the trim). r = corner radius.
const PLATE = { L: 46, T: 51, R: 1489.5, B: 842, r: 16 };
const SHADOW = [8, 6, 4]; // warm near-black, never #000 (house law)

// ---------- pixel helpers (RGB float images: { w, h, c: 3, d: Float32Array }) ----------
async function crop(x, y, w, h, s) {
  const W = Math.round(w * s), H = Math.round(h * s);
  let p = sharp(SRC).extract({ left: Math.round(x * 2), top: Math.round(y * 2), width: Math.round(w * 2), height: Math.round(h * 2) });
  if (W !== Math.round(w * 2) || H !== Math.round(h * 2)) p = p.resize(W, H, { kernel: 'lanczos3', fit: 'fill' });
  const buf = await p.removeAlpha().raw().toBuffer();
  return { w: W, h: H, d: Float32Array.from(buf) };
}
async function blur(img, sigma) {
  const u8 = Buffer.from(Uint8ClampedArray.from(img.d));
  const buf = await sharp(u8, { raw: { width: img.w, height: img.h, channels: 3 } }).blur(sigma).raw().toBuffer();
  return { w: img.w, h: img.h, d: Float32Array.from(buf) };
}
function stackRows(a, b) { // a on top of b, same width
  const d = new Float32Array((a.h + b.h) * a.w * 3); d.set(a.d, 0); d.set(b.d, a.d.length);
  return { w: a.w, h: a.h + b.h, d };
}
const smooth = (t) => t * t * (3 - 2 * t);

// Wrap cross-fade along x (axis 'x') or y: input is the run plus `o` px of overlap; output is `len` px long and tiles
// with no seam (its last column continues into its first).
// A 1D box blur (3 passes ~ gaussian) along the run only: shading ACROSS the run (the trim's bevel, the groove) must
// stay in the low part, or the power-preserving blend would boost it where both ends agree (a dark blot per tile).
function blurAlong(img, axis, r) {
  let d = Float32Array.from(img.d);
  const n = axis === 'x' ? img.w : img.h, lines = axis === 'x' ? img.h : img.w;
  const idx = (line, k) => (axis === 'x' ? line * img.w + k : k * img.w + line) * 3;
  for (let pass = 0; pass < 3; pass++) {
    const o = new Float32Array(d.length);
    for (let line = 0; line < lines; line++) for (let c = 0; c < 3; c++) for (let k = 0; k < n; k++) {
      let a = 0, m = 0;
      for (let q = Math.max(0, k - r); q <= Math.min(n - 1, k + r); q++) { a += d[idx(line, q) + c]; m++; }
      o[idx(line, k) + c] = a / m;
    }
    d = o;
  }
  return { w: img.w, h: img.h, d };
}

async function wrap(img, axis, len, o) {
  const low = blurAlong(img, axis, Math.max(1, Math.round(o / 8)));
  const W = axis === 'x' ? len : img.w, H = axis === 'x' ? img.h : len;
  const d = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = axis === 'x' ? x : y;
    const di = (y * W + x) * 3;
    const ib = (y * img.w + x) * 3; // the pixel itself
    if (k >= o) { for (let c = 0; c < 3; c++) d[di + c] = img.d[ib + c]; continue; }
    const ia = axis === 'x' ? (y * img.w + x + len) * 3 : ((y + len) * img.w + x) * 3; // the run's continuation
    const t = smooth((k + 0.5) / o), wa = 1 - t, wb = t, n = Math.hypot(wa, wb);
    for (let c = 0; c < 3; c++) {
      const la = low.d[ia + c], lb = low.d[ib + c];
      d[di + c] = la * wa + lb * wb + ((img.d[ia + c] - la) * wa + (img.d[ib + c] - lb) * wb) / n;
    }
  }
  return { w: W, h: H, d };
}

// Flatten a run along its length: per row (axis 'x') or column (axis 'y'), swap the moving average (window `win` px)
// for that line's mean. The grain stays; any blot or glint wider than a few units goes, so nothing repeats per tile.
function flatten(img, axis, win) {
  const d = Float32Array.from(img.d), n = axis === 'x' ? img.w : img.h, lines = axis === 'x' ? img.h : img.w, hw = win >> 1;
  const idx = (line, k) => (axis === 'x' ? line * img.w + k : k * img.w + line) * 3;
  for (let line = 0; line < lines; line++) for (let c = 0; c < 3; c++) {
    const v = new Float64Array(n); for (let k = 0; k < n; k++) v[k] = img.d[idx(line, k) + c];
    const mean = v.reduce((a, x) => a + x, 0) / n;
    const pre = new Float64Array(n + 1); for (let k = 0; k < n; k++) pre[k + 1] = pre[k] + v[k];
    for (let k = 0; k < n; k++) { const lo = Math.max(0, k - hw), hi = Math.min(n, k + hw + 1); d[idx(line, k) + c] = v[k] - (pre[hi] - pre[lo]) / (hi - lo) + mean; }
  }
  return { w: img.w, h: img.h, d };
}

// Signed distance to a rounded rectangle (negative inside).
function sdRR(px, py, L, T, R, B, r) {
  const cx = (L + R) / 2, cy = (T + B) / 2, hx = (R - L) / 2 - r, hy = (B - T) / 2 - r;
  const qx = Math.abs(px - cx) - hx, qy = Math.abs(py - cy) - hy;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Alpha from a rounded-rect mask. map(i, j) -> [ux, uy] gives the photo unit coordinate of output pixel (i, j).
//  mode 'hole'  : keep what is outside the rect (the frame); inside -> soft inner shadow, else transparent.
//  mode 'object': keep what is inside the rect; outside -> soft contact shadow (offset down-right, light upper-left).
function mask(img, s, map, { mode, rect: [L, T, R, B, r], sh = 0.55, sw = 4, dx = 0, dy = 0 }) {
  const out = Buffer.alloc(img.w * img.h * 4);
  for (let j = 0; j < img.h; j++) for (let i = 0; i < img.w; i++) {
    const [ux, uy] = map(i, j);
    const dist = sdRR(ux, uy, L, T, R, B, r);
    let ao, as;
    if (mode === 'hole') {
      ao = clamp01(dist * s + 0.5);
      as = sh * Math.pow(clamp01(1 + dist / sw), 2);
    } else {
      ao = clamp01(-dist * s + 0.5);
      const ds = sdRR(ux - dx, uy - dy, L, T, R, B, r);
      as = sh * Math.pow(clamp01(1 - ds / sw), 2);
    }
    const A = ao + as * (1 - ao);
    const si = (j * img.w + i) * 3, oi = (j * img.w + i) * 4;
    for (let c = 0; c < 3; c++) {
      const v = A > 0 ? (img.d[si + c] * ao + SHADOW[c] * as * (1 - ao)) / A : 0;
      out[oi + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
    out[oi + 3] = Math.round(A * 255);
  }
  return { w: img.w, h: img.h, rgba: out };
}
const at = (x, y, s) => (i, j) => [x + (i + 0.5) / s, y + (j + 0.5) / s]; // plain crop -> unit coords
const hole = (extra = {}) => ({ mode: 'hole', rect: [PLATE.L, PLATE.T, PLATE.R, PLATE.B, PLATE.r], sh: 0.6, sw: 4, ...extra });
const object = (rect, extra = {}) => ({ mode: 'object', rect, sh: 0.6, sw: 3, dx: 0.6, dy: 1.2, ...extra });

const made = [];
async function save(name, part, note, box, s, q = Q) {
  const file = path.join(OUT, name);
  if (part.rgba) await sharp(part.rgba, { raw: { width: part.w, height: part.h, channels: 4 } }).webp(q).toFile(file);
  else await sharp(Buffer.from(Uint8ClampedArray.from(part.d)), { raw: { width: part.w, height: part.h, channels: 3 } }).webp(q).toFile(file);
  made.push({ name, w: part.w, h: part.h, bytes: fs.statSync(file).size, s, box, note });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // ===== THE PLATE: one border-image sprite (corners + 4 seamless runs, centre empty), 1 px per unit =====
  // Slices: top 68, right 62, bottom 68, left 62 units. They hold the whole rounded trim corner (outer radius ~22),
  // so the trim never breaks where a corner meets a run. The steel inside the trim is cut out (the field shows).
  const S = 1, RL = 320, RH = 240, OV = 60; // run lengths (top/bottom, left/right) and the wrap overlap
  const SW = 62 + RL + 62, SH = 68 + RH + 68;
  const sprite = Buffer.alloc(SW * SH * 4);
  const put = (p, X, Y) => { for (let j = 0; j < p.h; j++) p.rgba.copy(sprite, ((Y + j) * SW + X) * 4, j * p.w * 4, (j + 1) * p.w * 4); };
  // the plain bottom band (no strap) is two cuts stacked: steel + groove + bottom trim (rows 825-850) over the clean
  // leather under the strap (rows 981-1024); the strap is left out
  const bottomBand = async (x, w) => stackRows(await crop(x, 825, w, 25, S), await crop(x, 981, w, 43, S));
  const bandMap = (x0) => (i, j) => [x0 + (i + 0.5), j < 25 ? 825 + j + 0.5 : 981 + (j - 25) + 0.5];

  // tl: top-left corner, leather + brass trim curve (its screw sits on the steel, so the mask takes it out)
  put(mask(await crop(0, 0, 62, 68, S), S, at(0, 0, S), hole()), 0, 0);
  // tr: top-right corner
  put(mask(await crop(1474, 0, 62, 68, S), S, at(1474, 0, S), hole()), SW - 62, 0);
  // bl: bottom-left corner of the plain plate (trim curve rows 825-850 + leather rows 981-1024)
  put(mask(await bottomBand(0, 62), S, bandMap(0), hole()), 0, SH - 68);
  // br: bottom-right corner of the plain plate
  put(mask(await bottomBand(1474, 62), S, bandMap(1474), hole()), SW - 62, SH - 68);
  // top run: x 540-920, rows 0-68 (leather + trim; the title starts below row 62, inside the masked steel). Windows for
  // all runs were picked by measuring the photo: the one with the smallest local dip in the leather / trim-groove
  // brightness, so no dark blot repeats once per tile (x 120 had a groove blot that showed every 144 px).
  put(mask(await wrap(flatten(await crop(540, 0, RL + OV, 68, S), 'x', 24 * S), 'x', RL, OV), S, (i, j) => [700, j + 0.5], hole()), 62, 0);
  // bottom run (plain): x 1005-1385, the same two-cut band as the bottom corners
  put(mask(await wrap(flatten(await bottomBand(1005, RL + OV), 'x', 24 * S), 'x', RL, OV), S, (i, j) => [700, j < 25 ? 825 + j + 0.5 : 981 + (j - 25) + 0.5], hole()), 62, SH - 68);
  // left run: cols 0-62, rows 512-812 (leather + trim; anything at x>=46 lies in the masked steel)
  put(mask(await wrap(flatten(await crop(0, 512, 62, RH + OV, S), 'y', 24 * S), 'y', RH, OV), S, (i, j) => [i + 0.5, 400], hole()), 0, 68);
  // right run: cols 1474-1536, rows 422-722
  put(mask(await wrap(flatten(await crop(1474, 422, 62, RH + OV, S), 'y', 24 * S), 'y', RH, OV), S, (i, j) => [1474 + i + 0.5, 400], hole()), SW - 62, 68);
  await save('plate.webp', { w: SW, h: SH, rgba: sprite }, '9-slice sprite: 68 62 68 62', 'tl [0,0,62,68] · tr [1474,0,62,68] · runs: top [540,0,380,68] bottom [1005,825|981,380,25+43] left [0,512,62,300] right [1474,422,62,300]', S);

  // field: brushed charcoal steel, x 914-1118, y 624-776 (between the WIDTH knob, the meter and REACH; the HIGH BEAM
  // toggle is not drawn in the photo). The photo's lighting is taken out (high-pass) so the tile repeats flat; the
  // plate's one upper-left light is a CSS gradient on top.
  {
    const TW = 180, TH = 128, O = 24;
    const raw = await crop(914, 624, TW + O, TH + O, S);
    const lo = await blur(raw, 18);
    const mean = [0, 0, 0];
    for (let k = 0; k < raw.d.length; k++) mean[k % 3] += raw.d[k] / (raw.d.length / 3);
    for (let k = 0; k < raw.d.length; k++) raw.d[k] = raw.d[k] - lo.d[k] + mean[k % 3];
    const tile = await wrap(await wrap(raw, 'x', TW, O), 'y', TH, O);
    // q95, not q80: the brushing is only ~2 levels of contrast and q80 flattens it into blocks (332 B, grain stdev
    // 1.64 vs 2.17 in the photo); q95 keeps it (2.13) at ~1.5 KB
    await save('field.webp', tile, `${TW}x${TH} seamless tile, mean rgb(${mean.map(Math.round).join(',')})`, '[914,624,204,152]', S, { ...Q, quality: 95 });
  }

  // screws, each turned its own way (2 px per unit: they are tiny and sit at the plate's corners)
  for (const [name, cx, cy, what] of [
    ['screw-tl.webp', 66, 74, 'top-left screw on the steel'],
    ['screw-tr.webp', 1470, 74, 'top-right screw'],
    ['screw-bl.webp', 66, 818, 'bottom-left screw (above the strap)'],
    ['screw-br.webp', 1470, 818, 'bottom-right screw'],
  ]) {
    const s = 2, r = 13.8;
    await save(name, mask(await crop(cx - 18, cy - 18, 36, 36, s), s, at(cx - 18, cy - 18, s), object([cx - r, cy - r, cx + r, cy + r, r])), what, `[${cx - 18},${cy - 18},36,36]`, s);
  }

  // ===== THE STRAP (.wb-plate--strap): rows 825-1024 = steel edge + trim + oxblood strap + the leather under it =====
  // strap-l: left end, the strap's rounded end + its own screw + the leather border
  await save('strap-l.webp', mask(await crop(0, 825, 100, 199, S), S, at(0, 825, S), hole()), 'strap left end', '[0,825,100,199]', S);
  // strap-r: right end
  await save('strap-r.webp', mask(await crop(1436, 825, 100, 199, S), S, at(1436, 825, S), hole()), 'strap right end', '[1436,825,100,199]', S);
  // strap-run: x 170-630, the most even stitched stretch left of the badge, wrapped seamless (400 units)
  await save('strap-run.webp', mask(await wrap(flatten(await crop(170, 825, 460, 199, S), 'x', 24 * S), 'x', 400, 60), S, (i, j) => [700, 825 + j + 0.5], hole()),
    '400-unit seamless run', '[170,825,460,199]', S);
  // badge: the RevAudio nameplate on the strap, its outline only (it can sit anywhere on the strap)
  {
    const s = 1.25;
    await save('badge.webp', mask(await crop(641, 868, 250, 84, s), s, at(641, 868, s), object([645.5, 871.8, 886, 946.5, 3], { sh: 0.7, dy: 1.6 })), 'RevAudio nameplate', '[641,868,250,84]', s);
  }

  // ===== OBJECTS =====
  // lamp-l / lamp-r: the two halogen headlamps in their brass bezels (shown up to ~250 CSS px wide -> 1.5 px/unit)
  {
    const s = 1.5;
    await save('lamp-l.webp', mask(await crop(49, 142, 335, 304, s), s, at(49, 142, s), object([53, 146, 380, 441.5, 16])), 'left headlamp', '[49,142,335,304]', s);
    await save('lamp-r.webp', mask(await crop(1153, 142, 335, 304, s), s, at(1153, 142, s), object([1157, 146, 1483.5, 441.5, 16])), 'right headlamp', '[1153,142,335,304]', s);
  }
  // road: the road window, chrome + brass bezel, the night-road glass and the trip LCD (shown up to ~620 CSS px)
  {
    const s = 1.6;
    await save('road.webp', mask(await crop(379, 141, 778, 319, s), s, at(379, 141, s), object([383, 144.5, 1152.5, 456, 20])), 'road window', '[379,141,778,319]', s);
  }
  // meter: the panel correlation meter in its brass bezel, no needle (shown up to ~190 CSS px)
  {
    const s = 1.4;
    await save('meter.webp', mask(await crop(962, 476, 279, 136, s), s, at(962, 476, s), object([965.8, 479.3, 1237.6, 608.3, 7])), 'correlation meter', '[962,476,279,136]', s);
  }
  // cap: the MONO push cap in its brass ring (shown up to ~110 CSS px)
  {
    const s = 1.6, cx = 1371.75, cy = 706.25, r = 65;
    await save('cap.webp', mask(await crop(1302, 637, 140, 140, s), s, at(1302, 637, s), object([cx - r, cy - r, cx + r, cy + r, r], { sw: 5, dy: 2 })), 'MONO push cap', '[1302,637,140,140]', s);
  }

  // needle: the face's own needle (src/lib/widebeam/face.ts, drawn at the meter's 0.75 scale) with its soft shadow.
  // viewBox origin = the pivot, so the image's bottom centre is the pivot (CSS: transform-origin 50% 100%).
  const needle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -112 12 112"><filter id="b" x="-1" y="-.1" width="3" height="1.2"><feGaussianBlur stdDeviation="1.05"/></filter><path d="M-1.28 -37.65L-.41 -106.65L.41 -106.65L1.28 -37.65Z" transform="translate(1.95 0)" fill="#2b1f10" opacity=".38" filter="url(#b)"/><path d="M-1.35 -40.5L-.41 -109.5L.41 -109.5L1.35 -40.5Z" fill="#1b1510"/></svg>\n`;
  fs.writeFileSync(path.join(OUT, 'needle.svg'), needle);
  made.push({ name: 'needle.svg', w: 12, h: 112, bytes: Buffer.byteLength(needle), s: '-', box: 'face.ts needle path', note: 'meter needle' });

  // ---- report ----
  const kb = (b) => (b / 1024).toFixed(1);
  const sum = (re) => made.filter((m) => re.test(m.name)).reduce((a, m) => a + m.bytes, 0);
  for (const m of made) console.log(`${m.name.padEnd(16)} ${String(m.w + 'x' + m.h).padEnd(9)} ${String(m.s).padEnd(5)} ${kb(m.bytes).padStart(6)} KB  ${m.box}`);
  console.log(`plate set (plate, field, screws, strap, badge): ${kb(sum(/^(plate|field|screw|strap|badge)/))} KB`);
  console.log(`lamps: ${kb(sum(/^lamp/))} KB · road: ${kb(sum(/^road/))} KB · meter + needle: ${kb(sum(/^(meter|needle)/))} KB · cap: ${kb(sum(/^cap/))} KB`);
})().catch((e) => { console.error(e); process.exit(1); });
