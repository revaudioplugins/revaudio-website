// The night outside the roll-up door: the station across the road (Dan, bench round 4: "lets open creat less detled
// scen more dark grade like its near a gas station"; of three compositions he picked "Station across the road").
// Ours, from code, every word ours (GAS 2 + digits). Across a dark two-lane road a small gas station: its canopy lit from
// below, the brightest thing outside, its light pooled on the forecourt; two GAS 2 pumps with lit globes; a tall price
// sign (GAS 2 in its header lockup, LED digits). The kiosk, a few buildings and the poles near-black against a deep night
// sky (a gradient dome: no flat blocks). Built by the car builder's street pass (11-10, scratchpad step5/street, optG.js).
// Low detail by design: 3 draw calls + 1 additive haze, no live lights (the canopy's and the garage's light are baked
// into vertex colours). The signs are one picture, assets/pics/street-atlas.webp, drawn by drawStreetAtlas() below
// (street-atlas.html renders it: GAS 2's Oswald 700 ships as pixels, like every lettered texture in the room).
// Everything sits in one group round the door's centre; room.html's arrange() moves it with the door, like R.backdrop.
//   buildStreet(THREE, { R, S, scene, grade: 'G1' | 'G2', atlas })  ->  the group (also R.street); its userData.sync()
//   shows it in the look and puts back today's night in the skeleton, the wireframe and the painted room.

export const GRADES = {
  // pool: the forecourt's peak light; panel: the canopy's lamps (under the look's bloom threshold, 1.6: the room's wide
  // bloom greyed the whole night); lit: the fascia's GAS 2, its stripe and the globes (x their exact colours); sign: the
  // price sign's (dimmer: the canopy leads); warm: the garage's own light on the apron; haze: the lit air under the canopy;
  // win: the kiosk's and four far windows; sky: linear, before AgX (top, the navy at the horizon, the warm low glow);
  // door: the light that falls in, spot + floor pool (x today's luminance); air: the door's own glow card (x today's: at
  // full strength its veil flattened the dark night into one brown field, option B's flaw); amb: the night ambient on
  // every solid (the blocks' silhouettes, the road, the kerbs)
  // G2 (review fix): the room's AgX squashes the dark end, so half the linear light read as ~70 % on screen and G2 sat
  // on top of G1. G2 takes the forecourt and the underside to ~a third of G1's linear light (= half on screen), the
  // lamps off pure white, the globes, fascia and signs to about half, the sky and the ambient to ~55 %.
  G1: { pool: 0.8, panel: 1.5, lit: 0.85, sign: 0.62, warm: 1.0, haze: 0.55, win: 0.3, door: 1.0, air: 0.2, amb: 1.0,
    sky: { top: [0.0034, 0.0037, 0.0068], navy: [0.0078, 0.0080, 0.0205], glow: [0.0080, 0.0048, 0.0022] } },
  G2: { pool: 0.24, panel: 0.8, lit: 0.45, sign: 0.34, warm: 0.5, haze: 0.22, win: 0.12, door: 0.5, air: 0.06, amb: 0.5,
    sky: { top: [0.0020, 0.0022, 0.0041], navy: [0.0047, 0.0048, 0.0123], glow: [0.0048, 0.0029, 0.0013] } },
};

// the signs' picture: 1024 x 512, its regions (x, y, w, h in px from the top left)
export const AT = { w: 1024, h: 512 };
const RG = { band: [0, 0, 512, 160], sign: [512, 0, 424, 512], white: [0, 448, 64, 64], dark: [64, 448, 64, 64] };
const BG = '#121014', LED = '#ff4a20', LED_OFF = '#2a0e0a';

// GAS 2's header lockup (GAS2/bench/pump-render.js texGlobeLens, the website's rule): Oswald 700 set tight, GAS in
// parchment, the 2 and the rule oxide, the rule 0.13 em under the letters; centred on (cx, cy), em px
// (a lit sign's halo laid by hand in faint wide strokes under the letters, like the room's REVAUDIO neon: no shadowBlur)
function lockup(g, cx, cy, em, halo = 0) {
  const k = em / 37; g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${em}px Oswald`; g.letterSpacing = `${1.5 * k}px`;
  const mG = g.measureText('GAS'), m2 = g.measureText('2'), asc = Math.max(mG.actualBoundingBoxAscent, m2.actualBoundingBoxAscent), dsc = Math.max(mG.actualBoundingBoxDescent, m2.actualBoundingBoxDescent);
  const h = asc + dsc + 0.13 * em + 2.2 * k, y = cy - h / 2 + asc;   // the whole lockup, letters + rule, centred on cy
  const ry = y + dsc + 0.13 * em, rule = [cx - 34 * k, ry, 68 * k, 2.2 * k];
  g.lineJoin = 'round';
  for (let i = 6; i >= 1 && halo; i--) {
    g.lineWidth = halo * i; g.strokeStyle = `rgba(239,227,198,${0.035})`; g.strokeText('GAS', cx - 9 * k, y);
    g.strokeStyle = `rgba(184,52,30,${0.05})`; g.strokeText('2', cx + 30 * k, y); g.strokeRect(...rule);
  }
  g.fillStyle = '#efe3c6'; g.fillText('GAS', cx - 9 * k, y); g.fillStyle = '#b8341e'; g.fillText('2', cx + 30 * k, y); g.fillRect(...rule);
  g.restore();
}
function seg7(g, x, y, w, h, t, ch) {   // a 7-segment LED digit, top-left (x, y), slanted a little; its dark segments show faintly
  const on = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' }[ch] || '';
  const m = h / 2, q = t / 2, bar = (x0, y0, x1, y1, stroke) => { g.beginPath();
    if (y0 === y1) { g.moveTo(x0, y0); g.lineTo(x0 + q, y0 - q); g.lineTo(x1 - q, y0 - q); g.lineTo(x1, y0); g.lineTo(x1 - q, y0 + q); g.lineTo(x0 + q, y0 + q); }
    else { g.moveTo(x0, y0); g.lineTo(x0 + q, y0 + q); g.lineTo(x0 + q, y1 - q); g.lineTo(x0, y1); g.lineTo(x0 - q, y1 - q); g.lineTo(x0 - q, y0 + q); }
    g.closePath(); if (stroke) g.stroke(); else g.fill(); };
  const P = { a: [x + 2, y, x + w - 2, y], g: [x + 2, y + m, x + w - 2, y + m], d: [x + 2, y + h, x + w - 2, y + h],
    f: [x, y + 2, x, y + m - 2], b: [x + w, y + 2, x + w, y + m - 2], e: [x, y + m + 2, x, y + h - 2], c: [x + w, y + m + 2, x + w, y + h - 2] };
  g.save(); g.transform(1, 0, -0.1, 1, 0.1 * (y + h), 0); g.lineJoin = 'round';
  for (const s of 'abcdefg') if (on.includes(s)) for (let i = 4; i >= 1; i--) { g.lineWidth = t * 0.45 * i; g.strokeStyle = 'rgba(255,74,32,0.06)'; bar(...P[s], true); }
  for (const s of 'abcdefg') { g.fillStyle = on.includes(s) ? LED : LED_OFF; bar(...P[s]); }
  g.restore();
}
// draws the whole picture into a 1024 x 512 2D context (Oswald 700 must be loaded: street-atlas.html)
export function drawStreetAtlas(g) {
  g.fillStyle = BG; g.fillRect(0, 0, AT.w, AT.h);
  g.fillStyle = '#ffffff'; g.fillRect(...RG.white);
  lockup(g, 256, 80, 112, 5);   // the fascia's middle: GAS 2 on the dark band (its own stripe glows below it, in geometry)
  // the price sign: a dark face in a thin warm frame, GAS 2 on top, two prices in LED digits
  const [sx, sy, sw, sh] = RG.sign;
  g.fillStyle = '#0d0b0e'; g.fillRect(sx, sy, sw, sh);
  g.strokeStyle = '#3a2a20'; g.lineWidth = 6; g.strokeRect(sx + 9, sy + 9, sw - 18, sh - 18);
  lockup(g, sx + sw / 2, sy + 112, 140, 6);
  g.fillStyle = '#3a2a20'; g.fillRect(sx + 38, sy + 212, sw - 76, 4);
  for (const [row, price] of [[0, '349'], [1, '379']]) {
    const dw = 62, dh = 100, t = 14, gap = 24, dot = 22, x0 = sx + (sw - (3 * dw + 2 * gap + dot)) / 2 + 8, y0 = sy + 246 + row * 126;
    seg7(g, x0, y0, dw, dh, t, price[0]);
    g.fillStyle = LED; g.fillRect(x0 + dw + gap / 2 + 2, y0 + dh - 12, 14, 14);
    seg7(g, x0 + dw + gap + dot, y0, dw, dh, t, price[1]); seg7(g, x0 + 2 * dw + 2 * gap + dot, y0, dw, dh, t, price[2]);
  }
}

export function buildStreet(THREE, { R, S, scene, grade, atlas }) {
  const GD = GRADES[GRADES[grade] ? grade : 'G1'];

  // ---- the plan, in metres from the door: x out from the wall, z along the street from the door's centre ----
  const ROAD = [4.0, 11.5], RY = -0.12;                    // the road between its kerbs, 0.12 below them
  const CAN = { x0: 15.8, x1: 23.2, z0: -11.4, z1: 0.6, y0: 4.6, y1: 5.6 };   // the canopy: 7.4 x 12 m, its fascia 1 m
  const CZ = (CAN.z0 + CAN.z1) / 2;
  const ISLAND = { x0: 19.0, x1: 20.0, z0: -9.2, z1: -1.8 }, COLS = [-8.6, -2.4], PUMPS = [-6.6, -4.4];
  const KIOSK = { x0: 27, x1: 33, z0: -15, z1: -5, h: 3.4 };
  const SIGN = { x0: 10.8, x1: 13.2, y0: 4.5, y1: 7.4, z: -17.8, posts: [11.4, 12.6] };   // its face 2.4 x 2.9 m
  const LC = [1.0, 0.86, 0.64];            // the canopy's light: a warm white, GAS 2's parchment glow
  const WARM = [1.0, 0.52, 0.26];          // the garage's own light, out through the door
  const AMB = [0.0045, 0.005, 0.0095];     // the night sky's, on everything
  // the lamps: 3 x 4 panels under the canopy, and a small one over the kiosk's door (w: its share)
  const LAMPS = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) LAMPS.push({ p: [CAN.x0 + (CAN.x1 - CAN.x0) * (i + 0.5) / 3, CAN.y0 - 0.04, CAN.z0 + (CAN.z1 - CAN.z0) * (j + 0.5) / 4], w: 1 });
  LAMPS.push({ p: [KIOSK.x0 - 0.35, 2.9, -6.7], w: 0.22 });
  function irr(x, y, z, n) {   // a downward lamp's light on a surface (Lambert both ends, softened up close)
    let e = 0;
    for (const L of LAMPS) {
      const lx = L.p[0] - x, ly = L.p[1] - y, lz = L.p[2] - z; if (ly <= 0.01) continue;
      const d2 = lx * lx + ly * ly + lz * lz, d = Math.sqrt(d2), cr = Math.max(0, (lx * n[0] + ly * n[1] + lz * n[2]) / d);
      e += L.w * cr * (ly / d) / (d2 + 0.8);
    }
    return e;
  }
  function spill(x, y, z, n) {  // the garage's light, out through the door (a source just inside it, cut by the opening)
    const sx = -1.4, sy = 1.7, lx = sx - x, ly = sy - y, lz = -z, d2 = lx * lx + ly * ly + lz * lz, d = Math.sqrt(d2);
    const zw = Math.abs(z * (-sx) / (x - sx)), cut = 1 - Math.min(1, Math.max(0, (zw - 1.5) / 0.6));   // where the line crosses the wall
    return Math.max(0, (lx * n[0] + ly * n[1] + lz * n[2]) / d) * Math.max(0, -lx / d) * cut / (d2 + 1.5);
  }
  const POOL = 1 / irr((CAN.x0 + CAN.x1) / 2, 0, CZ, [0, 1, 0]);   // the forecourt's peak = GD.pool
  function shade(a, x, y, z, n) {
    const e = GD.pool * POOL * irr(x, y, z, n), w = 1.9 * GD.warm * spill(x, y, z, n), s = (0.6 + 0.4 * n[1]) * GD.amb;
    return [0, 1, 2].map((i) => a[i] * (LC[i] * e + WARM[i] * w + AMB[i] * s));
  }

  // ---- a mesh builder: positions, normals, uvs, colours (the light, baked per vertex), triangles ----
  class Mesher {
    constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; }
    v(x, y, z, n, u, v, c) { this.p.push(x, y, z); this.n.push(...n); this.u.push(u, v); this.c.push(...c); return this.p.length / 3 - 1; }
    quad(P, n, col, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) {   // P: 4 corners, counter-clockwise seen from the front
      const b = P.map((p, k) => this.v(p[0], p[1], p[2], n, uv[k][0], uv[k][1], typeof col === 'function' ? col(p) : col));
      this.i.push(b[0], b[1], b[2], b[0], b[2], b[3]);
    }
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.setIndex(this.i); g.computeBoundingSphere(); return g;
    }
  }
  const SM = new Mesher(), E = new Mesher();   // SM: the lit set (ground and solids), E: what glows (exact pixels)
  const UV0 = Array(4).fill([3 / 128, 1 - 3 / 128]);   // the grain's plain white corner: solids take no grain
  const lit = (a, n) => (p) => shade(a, p[0], p[1], p[2], n);
  // the ground: a grid at height y over xs x zs (the lines dense where the light changes); uv in metres / 2.5 (the grain)
  function ground(xs, zs, y, alb) {
    const n = [0, 1, 0], b = SM.p.length / 3, W = xs.length;
    for (const z of zs) for (const x of xs) SM.v(x, y, z, n, x / 2.5, z / 2.5, shade(alb(x, z), x, y, z, n));
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < W - 1; i++) { const a = b + j * W + i, c = a + W; SM.i.push(a, c, a + 1, a + 1, c, c + 1); }
  }
  const span = (a, b, step) => { const r = []; for (let v = a; v < b - 1e-6; v += step) r.push(+v.toFixed(3)); r.push(b); return r; };
  const uniq = (arr) => [...new Set(arr.map((v) => +v.toFixed(3)))].sort((a, b) => a - b);
  // a vertical strip facing +x or -x (sx), from z0 to z1, y0 to y1, split along z (the light changes along it)
  function wallX(x, z0, z1, y0, y1, sx, alb, zs) {
    zs = zs || span(z0, z1, 2);
    for (let k = 0; k < zs.length - 1; k++) {
      const a = zs[k], b = zs[k + 1], n = [sx, 0, 0];
      SM.quad(sx > 0 ? [[x, y0, b], [x, y0, a], [x, y1, a], [x, y1, b]] : [[x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a]], n, lit(alb, n));
    }
  }
  // a box, lit (its bottom left out); grain-free (UV0)
  function box(x0, x1, y0, y1, z0, z1, alb) {
    const F = [
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]], [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]], [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]],
    ];
    for (const [n, P] of F) SM.quad(P, n, lit(alb, n), UV0);
  }
  const A = { asphalt: [0.05, 0.05, 0.055], walk: [0.2, 0.19, 0.18], kerb: [0.26, 0.25, 0.24], court: [0.3, 0.29, 0.27], paint: [0.5, 0.48, 0.42],
    island: [0.42, 0.4, 0.36], black: [0.02, 0.02, 0.025], steel: [0.09, 0.09, 0.1], oxide: [0.2, 0.022, 0.01], cream: [0.69, 0.57, 0.34], dial: [0.83, 0.74, 0.54] };

  // ---- the ground: apron + near walk, kerb, road (+ its centre dashes), far kerb, forecourt and the lots behind ----
  const ZS = uniq([-65, -50, -38, -30, -25, -21, ...span(-19, 5, 1), 7, 10, 14, 20, 30]);
  ground([0, 0.5, 1, 1.5, 2, 3, ROAD[0]], uniq([-65, -40, -20, -10, -6, -4, -3, ...span(-2.5, 2.5, 0.5), 3, 4, 6, 10, 20, 30]), 0, () => A.walk);
  wallX(ROAD[0], -65, 30, RY, 0, 1, A.kerb, ZS);
  ground(span(ROAD[0], ROAD[1], 1.5), ZS, RY, () => A.asphalt);
  for (let z = -65; z < 30; z += 8) { const n = [0, 1, 0], x = (ROAD[0] + ROAD[1]) / 2; SM.quad([[x - 0.09, RY + 0.004, z + 3], [x + 0.09, RY + 0.004, z + 3], [x + 0.09, RY + 0.004, z], [x - 0.09, RY + 0.004, z]], n, lit(A.paint, n)); }
  wallX(ROAD[1], -65, 30, RY, 0, -1, A.kerb, ZS);
  ground(uniq([ROAD[1], ...span(12.5, 34, 1), 40, 52, 66, 80]), ZS, 0, (x) => (x < 13.2 ? A.walk : A.court));
  box(ISLAND.x0, ISLAND.x1, 0, 0.15, ISLAND.z0, ISLAND.z1, A.island);

  // ---- the station: the canopy (its underside lit by the forecourt, its fascia drawn below), columns, pumps, kiosk, sign ----
  { const n = [0, -1, 0], k = 0.42 * GD.pool;   // the underside: light bounced up off the forecourt
    SM.quad([[CAN.x0, CAN.y0, CAN.z0], [CAN.x1, CAN.y0, CAN.z0], [CAN.x1, CAN.y0, CAN.z1], [CAN.x0, CAN.y0, CAN.z1]], n, LC.map((c) => c * k), UV0); }
  for (const z of COLS) box(19.33, 19.67, 0.15, CAN.y0, z - 0.17, z + 0.17, A.steel);
  for (const z of PUMPS) {
    const x = (ISLAND.x0 + ISLAND.x1) / 2;
    box(x - 0.26, x + 0.26, 0.15, 0.27, z - 0.31, z + 0.31, A.black);                // the plinth
    box(x - 0.2, x + 0.2, 0.27, 1.72, z - 0.25, z + 0.25, A.oxide);                  // the cabinet, GAS 2's oxide livery
    box(x - 0.23, x + 0.23, 1.72, 1.9, z - 0.28, z + 0.28, A.cream);                 // the crown
    const n = [-1, 0, 0], xd = x - 0.205; SM.quad([[xd, 1.1, z - 0.16], [xd, 1.1, z + 0.16], [xd, 1.46, z + 0.16], [xd, 1.46, z - 0.16]], n, lit(A.dial, n), UV0); // its dial
  }
  box(KIOSK.x0, KIOSK.x1, 0, KIOSK.h, KIOSK.z0, KIOSK.z1, [0.022, 0.021, 0.02]);
  box(KIOSK.x0 - 0.5, KIOSK.x1 + 0.2, KIOSK.h, KIOSK.h + 0.35, KIOSK.z0 - 0.3, KIOSK.z1 + 0.3, A.black);   // its flat roof's lip
  for (const x of SIGN.posts) box(x - 0.11, x + 0.11, 0, SIGN.y0, SIGN.z - 0.11, SIGN.z + 0.11, A.black);
  { const z0 = SIGN.z - 0.16, z1 = SIGN.z + 0.16, x0 = SIGN.x0, x1 = SIGN.x1, y0 = SIGN.y0, y1 = SIGN.y1;   // the sign's case (its faces glow, in E)
    for (const [n, P] of [[[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]], [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]], [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]]]) SM.quad(P, n, lit(A.black, n), UV0); }

  // ---- the rest: near-black buildings (a rooftop box or two), utility poles; the light reaches the nearest a little ----
  // (low down the road, where the first screen looks, so the sign stands against the sky; low behind the canopy; two
  // taller blocks and two trees between the sign and the canopy, where the close view looks)
  for (const [x0, x1, z0, z1, h] of [[40, 62, -26, 2, 7], [64, 80, -24, -6, 10], [14, 26, -38, -25, 5.5], [13.5, 24, -62, -44, 7], [13.5, 22, -92, -66, 9],
    [30, 42, -40, -28, 11], [46, 58, -52, -38, 17]]) box(x0, x1, 0, h, z0, z1, A.black);
  for (const [x0, x1, z0, z1, y0, y1] of [[49, 51.5, -13, -10.5, 7, 8.4], [17, 19.4, -33, -31, 5.5, 6.6], [34, 36.5, -36, -33.5, 11, 12.3], [50, 53, -46, -43, 17, 18.8]]) box(x0, x1, y0, y1, z0, z1, A.black);
  { const q = new THREE.IcosahedronGeometry(1, 1).attributes.position;   // (non-indexed: 3 vertices a face)   // two trees: a trunk, a round crown
    for (const [x, z, r, h] of [[22, -27, 2.3, 6.4], [30.5, -24.5, 2.8, 7.6]]) {
      box(x - 0.13, x + 0.13, 0, h - r, z - 0.13, z + 0.13, A.black);
      for (let i = 0; i < q.count; i += 3) { const P = [0, 1, 2].map((k) => [x + q.getX(i + k) * r, h + q.getY(i + k) * r * 1.1, z + q.getZ(i + k) * r]);
        const b = SM.p.length / 3; for (const p of P) SM.v(p[0], p[1], p[2], [0, 1, 0], ...UV0[0], shade(A.black, p[0], p[1], p[2], [0, 1, 0])); SM.i.push(b, b + 1, b + 2); } } }
  for (const z of [-31, -58]) { const x = 11.85; box(x - 0.12, x + 0.12, 0, 9.2, z - 0.12, z + 0.12, A.black); box(x - 0.9, x + 0.9, 8.6, 8.72, z - 0.06, z + 0.06, A.black); }

  // ---- what glows: the signs' picture (exact pixels, like the screens) ----
  const uvOf = (r) => { const [x, y, w, h] = r, u0 = x / AT.w, u1 = (x + w) / AT.w, v0 = 1 - (y + h) / AT.h, v1 = 1 - y / AT.h; return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; };
  const mid = (r) => { const [x, y, w, h] = r, u = (x + w / 2) / AT.w, v = 1 - (y + h / 2) / AT.h; return [[u, v], [u, v], [u, v], [u, v]]; };
  const K = (c, k) => c.map((v) => v * k);
  // the fascia: dark on every side, GAS 2 in the middle of the side that faces the road, a lit stripe along its foot
  {
    const { x0, x1, y0, y1, z0, z1 } = CAN, pw = 3.2, a = CZ - pw / 2, b = CZ + pw / 2, one = [1, 1, 1];
    E.quad([[x0, y0, z0], [x0, y0, a], [x0, y1, a], [x0, y1, z0]], [-1, 0, 0], one, mid(RG.dark));
    E.quad([[x0, y0, a], [x0, y0, b], [x0, y1, b], [x0, y1, a]], [-1, 0, 0], K(one, GD.lit), uvOf(RG.band));
    E.quad([[x0, y0, b], [x0, y0, z1], [x0, y1, z1], [x0, y1, b]], [-1, 0, 0], one, mid(RG.dark));
    E.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], one, mid(RG.dark));
    E.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], one, mid(RG.dark));
    E.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], one, mid(RG.dark));
    E.quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], one, mid(RG.dark));
    const s = K(LC, 1.4 * GD.lit), t = 0.07, o = 0.012;   // the stripe, proud of the band
    E.quad([[x0 - o, y0, z0], [x0 - o, y0, z1], [x0 - o, y0 + t, z1], [x0 - o, y0 + t, z0]], [-1, 0, 0], s, mid(RG.white));
    E.quad([[x0, y0, z1 + o], [x1, y0, z1 + o], [x1, y0 + t, z1 + o], [x0, y0 + t, z1 + o]], [0, 0, 1], s, mid(RG.white));
    E.quad([[x1, y0, z0 - o], [x0, y0, z0 - o], [x0, y0 + t, z0 - o], [x1, y0 + t, z0 - o]], [0, 0, -1], s, mid(RG.white));
    // the lamps: 3 x 4 panels just under the underside (white on screen; kept under the bloom's threshold)
    for (const L of LAMPS.slice(0, 12)) { const [x, , z] = L.p, h = 0.48, y = CAN.y0 - 0.02;
      E.quad([[x - h, y, z - h], [x + h, y, z - h], [x + h, y, z + h], [x - h, y, z + h]], [0, -1, 0], K([1.0, 0.93, 0.8], GD.panel), mid(RG.white)); }
  }
  // the price sign's two faces (the street's side sees +z), the pumps' globes, the kiosk's window and door, a few far windows
  {
    const { x0, x1, y0, y1 } = SIGN, z = SIGN.z, one = K([1, 1, 1], GD.sign);
    E.quad([[x0, y0, z + 0.17], [x1, y0, z + 0.17], [x1, y1, z + 0.17], [x0, y1, z + 0.17]], [0, 0, 1], one, uvOf(RG.sign));
    E.quad([[x1, y0, z - 0.17], [x0, y0, z - 0.17], [x0, y1, z - 0.17], [x1, y1, z - 0.17]], [0, 0, -1], one, uvOf(RG.sign));
    const gp = new THREE.IcosahedronGeometry(0.17, 1).attributes.position, gc = K([1.0, 0.88, 0.66], GD.lit);
    for (const zp of PUMPS) { const x = (ISLAND.x0 + ISLAND.x1) / 2;
      for (let i = 0; i < gp.count; i += 3) { const b = E.p.length / 3;
        for (let k = 0; k < 3; k++) E.v(gp.getX(i + k) + x, gp.getY(i + k) + 2.07, gp.getZ(i + k) + zp, [0, 1, 0], ...mid(RG.white)[0], gc);
        E.i.push(b, b + 1, b + 2); } }
    const xw = KIOSK.x0 - 0.02, w = K([0.13, 0.095, 0.06], GD.win), dr = K([0.2, 0.15, 0.1], GD.win);
    E.quad([[xw, 1.0, -9.4], [xw, 1.0, -12.2], [xw, 2.2, -12.2], [xw, 2.2, -9.4]], [-1, 0, 0], w, mid(RG.white));
    E.quad([[xw, 0.05, -6.2], [xw, 0.05, -7.2], [xw, 2.2, -7.2], [xw, 2.2, -6.2]], [-1, 0, 0], dr, mid(RG.white));
    for (const [x, y, z, sx] of [[40, 4.2, -6, -1], [14, 2.2, -29.5, -1], [13.5, 4.2, -50, -1], [30, 7.0, -36, -1]]) {   // four dim windows, far apart
      const c = K([0.05, 0.036, 0.022], GD.win); E.quad([[x - 0.02, y, z + 0.6], [x - 0.02, y, z - 0.6], [x - 0.02, y + 1.1, z - 0.6], [x - 0.02, y + 1.1, z + 0.6]], [sx, 0, 0], c, mid(RG.white)); }
  }

  // ---- the grain: one small canvas of noise and stains, tiled over the ground (uv 0 elsewhere: a plain texel) ----
  const grain = document.createElement('canvas'); grain.width = grain.height = 128;
  {
    const g = grain.getContext('2d'), im = g.createImageData(128, 128); let s = 9;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 128 * 128; i++) { const v = 214 + r() * 41; im.data.set([v, v, v, 255], i * 4); }
    g.putImageData(im, 0, 0);
    for (let i = 0; i < 26; i++) { const x = r() * 128, y = r() * 128, rr = 4 + r() * 18, gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(120,116,110,${0.08 + r() * 0.12})`); gr.addColorStop(1, 'rgba(120,116,110,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 6, 6);   // the plain corner the solids read (UV0)
  }
  const grainTex = new THREE.CanvasTexture(grain); grainTex.colorSpace = THREE.SRGBColorSpace; grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.anisotropy = 8;

  // ---- the sky: a dome, a smooth gradient (the navy falls off over ~18 degrees, a warm glow hugs the horizon) ----
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { cTop: { value: new THREE.Vector3(...GD.sky.top) }, cNavy: { value: new THREE.Vector3(...GD.sky.navy) }, cGlow: { value: new THREE.Vector3(...GD.sky.glow) } },
    vertexShader: 'varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 cTop, cNavy, cGlow; varying vec3 vD;
      void main() {
        float e = degrees(asin(clamp(normalize(vD).y, -1.0, 1.0))), u = max(e, 0.0);
        vec3 c = cTop + (cNavy - cTop) * exp(-u / 18.0) + cGlow * exp(-u / 4.0);
        gl_FragColor = vec4(c * (e < 0.0 ? 1.0 - 0.45 * smoothstep(0.0, 6.0, -e) : 1.0), 1.0);
      }`,
  });
  // drawn after the room's solid things, behind them all (r 120 holds every building): it fills only what the door shows
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 12), skyMat); sky.position.y = 1.7; sky.renderOrder = 10;   // (per pixel: few faces do)

  // ---- the haze: the lit air under the canopy, one soft additive card on its road side (kept out of the frame's alpha) ----
  const hazeTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
    const gv = g.createLinearGradient(0, 0, 0, 128); gv.addColorStop(0, '#fff'); gv.addColorStop(0.55, '#5a5a5a'); gv.addColorStop(1, '#000'); g.fillStyle = gv; g.fillRect(0, 0, 64, 128);
    const gh = g.createLinearGradient(0, 0, 64, 0); gh.addColorStop(0, 'rgba(0,0,0,1)'); gh.addColorStop(0.2, 'rgba(0,0,0,0)'); gh.addColorStop(0.8, 'rgba(0,0,0,0)'); gh.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gh; g.fillRect(0, 0, 64, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
  const hazeMat = new THREE.MeshBasicMaterial({ map: hazeTex, color: new THREE.Color(...K(LC, 0.12 * GD.haze)), transparent: true, depthWrite: false, fog: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(CAN.z1 - CAN.z0 + 2, 3.2), hazeMat);   // from the lamps 3.2 m down
  haze.rotation.y = -Math.PI / 2; haze.position.set(CAN.x0 + 0.6, CAN.y0 - 1.6, CZ);

  // ---- the meshes: the lit set (fog, AgX like the room), what glows (exact pixels, no fog), the sky, the haze ----
  const setMat = new THREE.MeshBasicMaterial({ vertexColors: true, map: grainTex, side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, map: atlas, fog: false, side: THREE.DoubleSide });
  glowMat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n\tgl_FragColor.a = 0.0;'); }; // the room's liveScreen
  const set = new THREE.Mesh(SM.geometry(), setMat), glow = new THREE.Mesh(E.geometry(), glowMat);
  const street = new THREE.Group(); street.name = 'street'; set.name = 'street-set'; glow.name = 'street-glow'; sky.name = 'street-sky'; haze.name = 'street-haze';
  street.add(sky, set, glow, haze);
  // the look shows the station and the light that falls in through the door takes the canopy's colour (the spot and the
  // floor's pool at today's luminance, its blue 0x5c6ab4's 0.16, x door; the door's glow card x air); the skeleton, the
  // wireframe and the painted room keep today's night, its ground and its blue. (room.html: applyFlags, after setPaint.)
  const fall = new THREE.Color(...LC), BLUE = new THREE.Color(0x5c6ab4), own = (o) => o.userData.mat0 || o.material;
  { const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; fall.multiplyScalar(lum(BLUE) / lum(fall)); }
  street.userData.sync = () => {
    const on = !!S.look && !S.wire && !R.paintOn;
    street.visible = on; R.backdrop.visible = R.outGround.visible = !on;
    R.outLight.color.copy(on ? fall : BLUE).multiplyScalar(on ? GD.door : 1); own(R.pool).color.copy(on ? fall : BLUE).multiplyScalar(on ? GD.door : 1);
    own(R.doorAir).color.copy(on ? fall : BLUE).multiplyScalar(on ? GD.air : 1);
  };
  const triOf = (o) => (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  street.userData.info = { grade: GRADES[grade] ? grade : 'G1', drawCalls: 4, tris: [set, glow, sky, haze].reduce((s, o) => s + triOf(o), 0) };
  scene.add(street); R.street = street;   // (everything above built first: a throw leaves today's night)
  return street;
}
