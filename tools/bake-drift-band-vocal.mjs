/**
 * bake-drift-band-vocal.mjs — the /drift #band vocal: a real lead vocal turned into the two things DRIFT's left cabinet
 * draws, so the page shows a vocal without shipping its audio (Dan 2026-10-09: "show a spectrum of a vocal on the band
 * selection"; his pick: Splice OS_VV_80_Em_Naturewalk_Vocal_Lead.wav).
 *
 *   node tools/bake-drift-band-vocal.mjs [path/to/vocal.wav]
 *
 * 1. SPECTRUM: 30 frames a second (the editor's timer), each = DRIFT's own fold (Drift Source/PluginEditor.cpp
 *    timerCallback): the last 2048 samples, Hann window, magnitude FFT, 112 log bins 20 Hz-20 kHz each taking its
 *    loudest FFT bin, dB against N/4 (a full-scale sine), floor -72 dB, normalised 0..1 -> uint8.
 * 2. IMAGER STEMS: the vocal split into 12 log-spaced stems by LR4 crossovers (two cascaded Butterworth biquads, the
 *    slope of DRIFT's band split), 15 frames a second, 96 evenly spaced samples per stem per frame -> int8. The page
 *    sums the stems outside the band centred (they stay as they were) and true-pans the ones inside it.
 * The loop = the loudest 8 s of the take (RMS), peak-normalised to -3 dBFS, mono (the take is a mono vocal on 2 ch).
 * Writes public/drift/band-vocal.bin:
 *   'DBV1' | u16 specFps, specFrames, bins, scopeFps, scopeFrames, stems, pts, 0 | f32 x 13 stem edges (Hz) |
 *   u8 spec[specFrames][bins] | i8 stems[scopeFrames][stems][pts]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const src = process.argv[2] ?? join(homedir(), 'Documents/MUSIC /TEST RUN Project/Samples/Splice/OS_VV_80_Em_Naturewalk_Vocal_Lead.wav');
const out = join(dirname(fileURLToPath(import.meta.url)), '../public/drift/band-vocal.bin');
const LOOP_S = 8, SPEC_FPS = 30, SCOPE_FPS = 15, N = 2048, BINS = 112, STEMS = 12, PTS = 96;

/* ---- wav (PCM 16/24/32 or float 32) -> mono Float32 ---- */
const buf = readFileSync(src);
let p = 12, fmt = null, data = null;
while (p < buf.length - 8) {
  const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4);
  if (id === 'fmt ') fmt = { tag: buf.readUInt16LE(p + 8), ch: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
  if (id === 'data') data = buf.subarray(p + 8, p + 8 + size);
  p += 8 + size + (size & 1);
}
if (!fmt || !data) throw new Error('not a wav');
const bps = fmt.bits / 8, frames = Math.floor(data.length / (bps * fmt.ch)), sr = fmt.sr;
const read = (o) => (fmt.tag === 3 ? data.readFloatLE(o) : fmt.bits === 16 ? data.readInt16LE(o) / 32768 : fmt.bits === 24 ? data.readIntLE(o, 3) / 8388608 : data.readInt32LE(o) / 2147483648);
const mono = new Float32Array(frames);
for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < fmt.ch; c++) s += read((i * fmt.ch + c) * bps); mono[i] = s / fmt.ch; }

/* ---- the loudest LOOP_S window, peak -3 dBFS ---- */
const L = Math.min(frames, LOOP_S * sr), hop = Math.floor(sr / 10);
let best = 0, bestE = -1;
for (let s = 0; s + L <= frames; s += hop) { let e = 0; for (let i = s; i < s + L; i += 4) e += mono[i] * mono[i]; if (e > bestE) { bestE = e; best = s; } }
const x = mono.slice(best, best + L);
let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v));
const g = 10 ** (-3 / 20) / (pk || 1); for (let i = 0; i < x.length; i++) x[i] *= g;

/* ---- spectrum: DRIFT's fold ---- */
const hann = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
function fftMag(re) {   // in-place radix-2 on (re, im), returns |X[k]| for k < N/2
  const im = new Float64Array(N);
  for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; } }
  for (let len = 2; len <= N; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < N; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const u = i + k, v = u + len / 2, tr = re[v] * cr - im[v] * ci, ti = re[v] * ci + im[v] * cr;
        re[v] = re[u] - tr; im[v] = im[u] - ti; re[u] += tr; im[u] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  return Float64Array.from({ length: N / 2 }, (_, k) => Math.hypot(re[k], im[k]));
}
const specFrames = Math.floor(LOOP_S * SPEC_FPS), spec = new Uint8Array(specFrames * BINS);
const binHz = sr / N, lo = Math.log10(20), hi = Math.log10(20000), ref = N * 0.25;
for (let f = 0; f < specFrames; f++) {
  const end = Math.round(((f + 1) / SPEC_FPS) * sr), re = new Float64Array(N);
  for (let i = 0; i < N; i++) { const k = (end - N + i + L) % L; re[i] = x[k] * hann[i]; }   // the loop wraps: a seamless ring
  const mag = fftMag(re);
  for (let b = 0; b < BINS; b++) {
    const f0 = 10 ** (lo + ((hi - lo) * b) / BINS), f1 = 10 ** (lo + ((hi - lo) * (b + 1)) / BINS);
    const i0 = Math.min(N / 2 - 1, Math.max(1, Math.floor(f0 / binHz)));
    const i1 = Math.max(i0, Math.min(N / 2 - 1, Math.max(1, Math.ceil(f1 / binHz))));
    let m = 0; for (let i = i0; i <= i1; i++) m = Math.max(m, mag[i]);
    const db = m > 0 ? Math.max(-72, 20 * Math.log10(m / ref)) : -72;
    spec[f * BINS + b] = Math.round(Math.min(1, Math.max(0, (db + 72) / 72)) * 255);
  }
}

/* ---- stems: LR4 crossovers at 11 log-spaced edges ---- */
const edges = Array.from({ length: STEMS + 1 }, (_, i) => 20 * 1000 ** (i / STEMS));
function biquad(type, f) {   // RBJ, Q = 1/sqrt(2) (Butterworth); cascaded twice = LR4
  const w = (2 * Math.PI * f) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2), a0 = 1 + al;
  const b = type === 'lp' ? [(1 - c) / 2, 1 - c, (1 - c) / 2] : [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  return { b0: b[0] / a0, b1: b[1] / a0, b2: b[2] / a0, a1: (-2 * c) / a0, a2: (1 - al) / a0 };
}
function run(sig, q) {   // two passes over the loop twice (the second pass is warm: no start-up click at the wrap)
  let y = sig;
  for (const k of [q, q]) {
    const o = new Float32Array(y.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < y.length; i++) {
      const v = k.b0 * y[i] + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
      x2 = x1; x1 = y[i]; y2 = y1; y1 = v; if (pass) o[i] = v;
    }
    y = o;
  }
  return y;
}
const stems = []; let rest = x;
for (let s = 0; s < STEMS - 1; s++) { const f = edges[s + 1]; stems.push(run(rest, biquad('lp', f))); rest = run(rest, biquad('hp', f)); }
stems.push(rest);
const scopeFrames = Math.floor(LOOP_S * SCOPE_FPS), scope = new Int8Array(scopeFrames * STEMS * PTS);
let smax = 0; for (const st of stems) for (const v of st) smax = Math.max(smax, Math.abs(v));
const span = sr / SCOPE_FPS;
for (let f = 0; f < scopeFrames; f++) for (let s = 0; s < STEMS; s++) for (let i = 0; i < PTS; i++) {
  const k = Math.floor(f * span + (i * span) / PTS) % L;
  scope[(f * STEMS + s) * PTS + i] = Math.round((stems[s][k] / smax) * 127);
}

/* ---- write ---- */
const head = Buffer.alloc(4 + 16 + 4 * (STEMS + 1));
head.write('DBV1', 0, 'ascii');
[SPEC_FPS, specFrames, BINS, SCOPE_FPS, scopeFrames, STEMS, PTS, 0].forEach((v, i) => head.writeUInt16LE(v, 4 + i * 2));
edges.forEach((e, i) => head.writeFloatLE(e, 20 + i * 4));
writeFileSync(out, Buffer.concat([head, Buffer.from(spec.buffer), Buffer.from(scope.buffer)]));
console.log(`${out}: ${sr} Hz, loop ${(best / sr).toFixed(1)}-${((best + L) / sr).toFixed(1)} s, spec ${specFrames}x${BINS}, stems ${scopeFrames}x${STEMS}x${PTS}, scale ${smax.toFixed(3)}`);
