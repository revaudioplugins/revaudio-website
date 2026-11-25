/**
 * OBDTUNE page engine: one shared state (the plugin's parameters, OBDTune repo docs/CONTRACT.md ids in the
 * comments) and the correction law, ported from OBDTune Source/dsp/AtCorrector.h so the page's demo moves the
 * way the plugin does:
 *   - target = the nearest legal note (KEY + SCALE + the 12 NOTE switches);
 *   - FLEX   = soft knee: w = smoothstep(|err| / (2 * flex)); err *= w (small intonation stays, far notes pull);
 *   - SPEED  = retune time constant in ms; HUMANIZE grows it with note age: tau = speed * (1 + 8 * H * age/300 ms);
 *   - unvoiced: hold, then ease home.
 * The hero scanner, the scroll story and the bench all read and write this one state, so a key turned on one
 * shows on the others.
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** AT_SCALE, in the plugin's order (0-12). */
export const SCALES: [string, number[]][] = [
  ['CHROMATIC', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
  ['MAJOR', [0, 2, 4, 5, 7, 9, 11]],
  ['MINOR', [0, 2, 3, 5, 7, 8, 10]],
  ['HARM MINOR', [0, 2, 3, 5, 7, 8, 11]],
  ['PENT MAJ', [0, 2, 4, 7, 9]],
  ['PENT MIN', [0, 3, 5, 7, 10]],
  ['DORIAN', [0, 2, 3, 5, 7, 9, 10]],
  ['PHRYGIAN', [0, 1, 3, 5, 7, 8, 10]],
  ['LYDIAN', [0, 2, 4, 6, 7, 9, 11]],
  ['MIXOLYDIAN', [0, 2, 4, 5, 7, 9, 10]],
  ['MEL MINOR', [0, 2, 3, 5, 7, 9, 11]],
  ['BLUES', [0, 3, 5, 6, 7, 10]],
  ['WHOLE TONE', [0, 2, 4, 6, 8, 10]],
];

/** AT_VOICE: the range the detector listens to (VoiceRanges.h, provisional values rounded). */
export const VOICES = [
  { name: 'SOPRANO', lo: 180, hi: 1100 },
  { name: 'ALTO', lo: 120, hi: 800 },
  { name: 'TENOR', lo: 80, hi: 550 },
];

/** HM_n_INTERVAL, the plugin's list (obdtune.js INTERVALS): an octave is 12 semitones, the rest are scale steps. */
export const HARM_INTERVALS: { name: string; steps?: number; st?: number }[] = [
  { name: 'OCT DN', st: -12 }, { name: '6TH DN', steps: -5 }, { name: '5TH DN', steps: -4 }, { name: '4TH DN', steps: -3 },
  { name: '3RD DN', steps: -2 }, { name: '2ND DN', steps: -1 }, { name: '2ND UP', steps: 1 }, { name: '3RD UP', steps: 2 },
  { name: '4TH UP', steps: 3 }, { name: '5TH UP', steps: 4 }, { name: '6TH UP', steps: 5 }, { name: 'OCT UP', st: 12 },
];

export interface ObdState {
  on: boolean;          // AT_ON (POWER, the whole plugin: tuner, harmony and FX)
  tune: boolean;        // AT_TUNE (AUTOTUNE: off = the voice goes through untuned, HARMONY keeps working)
  key: number;          // AT_KEY 0-11
  scale: number;        // AT_SCALE 0-12
  speed: number;        // AT_RETUNE 1-200 ms
  human: number;        // AT_HUMANIZE 0-1
  flex: number;         // AT_FLEX 0-100 cents
  voice: number;        // AT_VOICE 0-2
  notes: boolean[];     // AT_NOTE_0..11, absolute pitch class
  // HM_ON, HM_MIX (0-100: lead x min(1, 2(1-m)), voices x min(1, 2m)), per voice HM_n_ON / _INTERVAL / _LEVEL (linear)
  harm: { on: boolean; mix: number; v: { on: boolean; int: number; level: number }[] };
  bg: 'FLOATING' | 'ROOM';
}

export const state: ObdState = {
  on: true,
  tune: true,
  key: 0,
  scale: 1,
  speed: 25,
  human: 0,
  flex: 0,
  voice: 1,
  notes: Array(12).fill(true),
  harm: { on: false, mix: 50, v: [{ on: true, int: 7, level: 0.5 }, { on: false, int: 9, level: 0.5 }] },
  bg: 'FLOATING',
};

type Listener = (why: string) => void;
const listeners = new Set<Listener>();
export const onChange = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };
export function set<K extends keyof ObdState>(k: K, v: ObdState[K], why: string = k) {
  state[k] = v;
  listeners.forEach((fn) => fn(why));
}
export const touch = (why: string) => listeners.forEach((fn) => fn(why));

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const keyName = (s = state) => `${NOTE_NAMES[s.key]} ${SCALES[s.scale][0]}`;
export const midiName = (m: number) => NOTE_NAMES[((Math.round(m) % 12) + 12) % 12] + (Math.floor(Math.round(m) / 12) - 1);
export const hzToMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440);
export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** The pitch classes a note may land on: KEY + SCALE, minus the NOTE switches that are off. */
export function legal(s: ObdState = state): boolean[] {
  const out = Array(12).fill(false);
  for (const d of SCALES[s.scale][1]) out[(s.key + d) % 12] = true;
  const kept = out.map((v, i) => v && s.notes[i]);
  return kept.some(Boolean) ? kept : out; // every NOTE off = the scale, as in the plugin (legalAbs)
}

export function nearestLegal(p: number, ok: boolean[]): number {
  const c = Math.round(p);
  let best = c, bd = Infinity;
  for (let m = c - 12; m <= c + 12; m++) {
    if (!ok[((m % 12) + 12) % 12]) continue;
    const d = Math.abs(m - p);
    if (d < bd) { bd = d; best = m; }
  }
  return bd === Infinity ? c : best;
}

/** One scale step from a legal note (for the harmony voices). */
export function scaleStep(m: number, steps: number, ok: boolean[]): number {
  let n = m, left = Math.abs(steps);
  const dir = Math.sign(steps);
  while (left > 0) {
    n += dir;
    if (ok[((n % 12) + 12) % 12]) left--;
    if (Math.abs(n - m) > 24) break;
  }
  return n;
}

/** Where a harmony voice sits for a lead target (an octave in semitones, the rest in scale steps). */
export const harmNote = (target: number, int: number, ok: boolean[]) => {
  const iv = HARM_INTERVALS[int];
  return iv.st != null ? target + iv.st : scaleStep(target, iv.steps!, ok);
};

const smoothstep = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

export interface Reading { raw: number | null; out: number | null; target: number | null; voiced: boolean }

/** AtCorrector, per frame (dt in ms). Each view owns one, so the story's sweeps never touch the bench's slew. */
export class Corrector {
  private corr = 0;
  private age = 0;
  private lastTarget: number | null = null;
  private unvoicedMs = 0;

  step(p: number | null, dtMs: number, s: ObdState = state): Reading {
    if (p == null) {
      this.unvoicedMs += dtMs;
      if (this.unvoicedMs > 300) this.corr *= Math.exp(-dtMs / 100);
      return { raw: null, out: null, target: null, voiced: false };
    }
    this.unvoicedMs = 0;
    if (!s.on || !s.tune) { this.corr = 0; return { raw: p, out: p, target: null, voiced: true }; }
    const target = nearestLegal(p, legal(s));
    if (target !== this.lastTarget) { this.age = 0; this.lastTarget = target; }
    this.age += dtMs;
    let err = target - p;
    if (s.flex > 0) err *= smoothstep(Math.abs(err) / (2 * s.flex * 0.01));
    const tau = Math.max(0.001, s.speed * (1 + 8 * s.human * Math.min(1, this.age / 300)));
    this.corr += (err - this.corr) * (1 - Math.exp(-dtMs / tau));
    return { raw: p, out: p + this.corr, target, voiced: true };
  }
}

/**
 * The demo singer: a phrase in E minor, sung a little loose (each note off by its own few cents, a scoop into it,
 * vibrato once it settles). With the default C MAJOR the F# lands wrong, which is what DETECT is for.
 * Returns MIDI (float) or null in the breaths. Loops every DEMO_LEN seconds.
 */
const PHRASE: [number | null, number, number][] = [
  // [midi, beats, detune semitones]
  [64, 0.5, 0.32], [67, 0.5, -0.38], [69, 0.75, 0.27], [71, 1.25, -0.22], [null, 0.5, 0],
  [74, 0.5, 0.41], [71, 0.5, -0.3], [69, 0.5, 0.36], [67, 0.75, -0.28], [66, 1, 0.24], [64, 1.75, -0.33], [null, 1, 0],
];
const BEAT = 0.42;
const starts: number[] = [];
let acc = 0;
for (const [, b] of PHRASE) { starts.push(acc); acc += b * BEAT; }
export const DEMO_LEN = acc;
export const DEMO_KEY = { key: 4, scale: 2 }; // E MINOR, what DETECT answers on the demo

export function demoPitch(t: number, transpose = 0): number | null {
  const tt = ((t % DEMO_LEN) + DEMO_LEN) % DEMO_LEN;
  let i = starts.length - 1;
  while (i > 0 && starts[i] > tt) i--;
  const [m, beats, det] = PHRASE[i];
  if (m == null) return null;
  const local = tt - starts[i];
  const dur = beats * BEAT;
  if (local > dur - 0.035) return null; // the tiny gap between syllables
  let prev = m;
  for (let j = i - 1; j >= 0; j--) if (PHRASE[j][0] != null) { prev = PHRASE[j][0] as number; break; }
  const from = PHRASE[i - 1]?.[0] == null ? m - 0.8 : prev;
  const scoop = Math.exp(-local / 0.06);
  const vib = local > 0.28 ? Math.sin(local * 2 * Math.PI * 5.4) * 0.22 * Math.min(1, (local - 0.28) / 0.25) : 0;
  const wander = Math.sin(local * 3.1 + m) * 0.06;
  return transpose + m + det + (from - m) * scoop + vib + wander;
}

/** DETECT on a pitch-class histogram (Krumhansl-Kessler profiles; major or minor only, as the plugin answers). */
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
export function detectKey(hist: number[]): { key: number; scale: number; score: number } | null {
  const sum = hist.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  const corr = (prof: number[], k: number) => {
    const x = hist, y = Array.from({ length: 12 }, (_, i) => prof[(i - k + 12) % 12]);
    const mx = x.reduce((a, b) => a + b) / 12, my = y.reduce((a, b) => a + b) / 12;
    let n = 0, dx = 0, dy = 0;
    for (let i = 0; i < 12; i++) { n += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
    return n / Math.sqrt(dx * dy || 1);
  };
  let best = { key: 0, scale: 1, score: -2 };
  for (let k = 0; k < 12; k++) {
    const a = corr(MAJ, k), b = corr(MIN, k);
    if (a > best.score) best = { key: k, scale: 1, score: a };
    if (b > best.score) best = { key: k, scale: 2, score: b };
  }
  return best;
}
