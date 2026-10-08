#!/usr/bin/env node
/**
 * gen-drift-circuits.mjs — writes src/lib/drift/circuits.data.ts from the DRIFT
 * plugin's own circuit file (Drift/Source/ui/public/f1-tracks-data.js), so the
 * /drift chips and the mini-GPS car run the plugin's real circuits.
 *
 *   node tools/gen-drift-circuits.mjs [path/to/f1-tracks-data.js]
 *
 * Dan 2026-10-02: iconic circuits on /drift, real shapes, COUNTRY names only
 * (no circuit or F1 names on the site). Dan 2026-10-04 reversed that: the chips
 * carry the circuits' own iconic names (each a word of the plugin's circuit
 * name; still no F1 / series names). The 8 picks + labels live in PICK below.
 *
 * Per circuit it emits
 *  - SHAPES (build time only, DriftTracks.astro): the outline as an SVG path in
 *    the plugin's own point space (y down, the plugin draws it the right way
 *    up), simplified with Ramer-Douglas-Peucker, plus a padded viewBox.
 *  - LAPS (shipped to the browser, circuits.ts): everything the page needs to
 *    run the plugin's lap at ANY INTENSITY (Dan 2026-10-02: the INTENSITY
 *    fader brakes live). Per circuit, all delta-coded integers:
 *      c   = corner curvature x100 at G evenly spaced points (= the pan before
 *            width, flick and spring; right-hand corner > 0)
 *      a   = arc-length steps x1e4 between those points (lap position for
 *            getPointAtLength)
 *      fc / fr = S time-uniform samples of the point index (x4, in G units) on
 *            the calm lap (shipping spd[] profile) and the rally lap (the
 *            quasi-static lap solver). TrackEngine.h morphs them by INTENSITY:
 *            index = fc + (fr - fc) * I.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PICK = [
  ['suzuka-international-racing-course', 'SUZUKA'],
  ['circuit-de-monaco', 'MONACO'],
  ['circuit-de-spa-francorchamps', 'SPA'],
  ['autodromo-nazionale-monza', 'MONZA'],
  ['silverstone-circuit', 'SILVERSTONE'],
  ['aut-dromo-jos-carlos-pace-interlagos', 'INTERLAGOS'],
  ['circuit-of-the-americas', 'COTA'],
  ['marina-bay-street-circuit', 'MARINA BAY'],
];
const S = 256;           // time samples per lap shipped to the browser
const G = 256;           // geometry samples per lap (every 2nd plugin point)
const RDP_EPS = 0.0025;  // outline simplification, plugin point units (the long side spans 2.0)

const here = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] ?? join(homedir(), 'projects/revaudio/Drift/Source/ui/public/f1-tracks-data.js');
const out = join(here, '../src/lib/drift/circuits.data.ts');

const line = readFileSync(src, 'utf8').split('\n')[1];
const ALL = JSON.parse(line.slice(line.indexOf('['), line.lastIndexOf(']') + 1));

// ── TrackEngine.h, verbatim math ──────────────────────────────────────────
const kM = 2048, kN = 512;
const kContrast = 4.5, kAccel = 3.5, kBite = 4.0;

function makeLut(spd) {
  let total = 0;
  for (let i = 0; i < kN; i++) total += 1 / spd[i];
  const T = new Float64Array(kN + 1);
  for (let i = 0; i < kN; i++) T[i + 1] = T[i] + 1 / spd[i] / total;
  const out = new Float64Array(kM + 1);
  let j = 0;
  for (let m = 0; m <= kM; m++) {
    const u = m / kM;
    while (j < kN - 1 && T[j + 1] < u) j++;
    const d = T[j + 1] - T[j];
    out[m] = j + (u - T[j]) / (d > 0 ? d : 1);
  }
  return out;
}
function solveLap(crv) {
  const ds = 1 / kN, grip = 1 / (kContrast * kContrast), aMax = kAccel, bMax = kAccel * kBite;
  const v = new Float64Array(kN);
  for (let i = 0; i < kN; i++) { const c = Math.abs(crv[i]); v[i] = c > 1e-4 ? Math.min(1, Math.sqrt(grip / c)) : 1; }
  for (let p = 0; p < 2; p++) for (let i = 0; i < kN; i++) { const j = (i + 1) % kN; v[j] = Math.min(v[j], Math.sqrt(v[i] * v[i] + 2 * aMax * ds)); }
  for (let p = 0; p < 2; p++) for (let i = kN - 1; i >= 0; i--) { const j = (i - 1 + kN) % kN; v[j] = Math.min(v[j], Math.sqrt(v[i] * v[i] + 2 * bMax * ds)); }
  return v;
}
const idxAt = (lut, ph) => { const u = ph * kM; const m = Math.min(kM - 1, Math.max(0, Math.floor(u))); return lut[m] + (lut[m + 1] - lut[m]) * (u - m); };
const sampleWrapped = (arr, fi) => { const ff = Math.floor(fi); const i0 = ((ff % kN) + kN) % kN, i1 = (i0 + 1) % kN, f = fi - ff; return arr[i0] * (1 - f) + arr[i1] * f; };

// ── outline ───────────────────────────────────────────────────────────────
function rdp(pts, eps) {
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-12;
    let best = -1, bd = eps;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len;
      if (d > bd) { bd = d; best = i; }
    }
    if (best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const f3 = (v) => (Math.round(v * 1000) / 1000).toString().replace(/^(-?)0\./, '$1.');

const shapes = [], laps = [];
for (const [slug, label] of PICK) {
  const id = ALL.findIndex((t) => t.id === slug);   // index = the plugin's TRK_ID (order frozen)
  if (id < 0) throw new Error(`circuit not in plugin data: ${slug}`);
  const t = ALL[id];
  if (t.pts.length !== kN || t.spd.length !== kN || t.crv.length !== kN) throw new Error(`${slug}: expected ${kN} points`);

  // outline: a closed loop has no chord to measure against, so split it at the
  // point farthest from the start and simplify the two halves
  const [sx, sy] = t.pts[0];
  let far = 1;
  t.pts.forEach(([x, y], i) => { if (Math.hypot(x - sx, y - sy) > Math.hypot(t.pts[far][0] - sx, t.pts[far][1] - sy)) far = i; });
  const simple = [...rdp(t.pts.slice(0, far + 1), RDP_EPS), ...rdp([...t.pts.slice(far), t.pts[0]], RDP_EPS).slice(1, -1)];
  const d = simple.map(([x, y], i) => `${i ? 'L' : 'M'}${f3(x)} ${f3(y)}`).join('') + 'Z';
  const xs = t.pts.map((p) => p[0]), ys = t.pts.map((p) => p[1]);
  const pad = 0.06;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const vb = [x0, y0, Math.max(...xs) + pad - x0, Math.max(...ys) + pad - y0].map(f3).join(' ');
  shapes.push({ id, label, vb, d });

  // arc length along the 512 plugin points (closed), as a lap fraction per point index
  const cum = new Float64Array(kN + 1);
  for (let i = 0; i < kN; i++) { const [ax, ay] = t.pts[i], [bx, by] = t.pts[(i + 1) % kN]; cum[i + 1] = cum[i] + Math.hypot(bx - ax, by - ay); }
  const step = kN / G;
  const delta = (vals) => { let p = 0; return vals.map((v) => { const d = v - p; p = v; return d; }); };
  const c = [], arc = [];
  for (let g = 0; g < G; g++) { c.push(Math.round(t.crv[g * step] * 100)); arc.push(Math.round((cum[g * step] / cum[kN]) * 1e4)); }

  // the two time warps, as point indices in G units (x4) at S uniform times
  const inv = makeLut(t.spd), invR = makeLut(solveLap(t.crv));
  const fc = [], fr = [];
  for (let k = 0; k < S; k++) { fc.push(Math.round((idxAt(inv, k / S) / step) * 4)); fr.push(Math.round((idxAt(invR, k / S) / step) * 4)); }
  laps.push({ id, c: delta(c), a: delta(arc), fc: delta(fc), fr: delta(fr) });
}

const body = `/*! Circuit traces: bacinger/f1-circuits, MIT License, (c) 2019-2025 Tomislav Bacinger */
// GENERATED by tools/gen-drift-circuits.mjs from the DRIFT plugin's f1-tracks-data.js. Do not edit.
// SHAPES = build time only (DriftTracks.astro). LAPS = the browser (trackui.ts).

/** id = the plugin's TRK_ID · vb/d = outline in plugin point space (y down). */
export const CIRCUIT_SHAPES: { id: number; label: string; vb: string; d: string }[] = ${JSON.stringify(shapes, null, 1)};

/** Delta-coded. c = curvature x100 and a = arc steps x1e4 at ${G} points; fc / fr = calm / rally point index x4 at ${S} uniform times. */
export const CIRCUIT_LAPS: { id: number; c: number[]; a: number[]; fc: number[]; fr: number[] }[] = ${JSON.stringify(laps)};
`;
writeFileSync(out, body);
console.log(`wrote ${out} (${(body.length / 1024).toFixed(1)} KB)`);
for (const s of shapes) console.log(`  ${String(s.id).padStart(2)} ${s.label.padEnd(10)} ${String(s.d.split(/[ML]/).length - 1).padStart(3)} pts  vb ${s.vb}`);
