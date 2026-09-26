import { onPan, setPan } from './bus';
import { PanSpring, shapeAt, swingWidth } from './tracks';

/**
 * The head-unit deck — STRUCTURE TEST (drift.demoMode 'test', Dan 2026-09-26:
 * "lay down the structure just to see for test").
 *
 * The sound is synthesised here, in the browser, and the screen says TEST
 * SIGNAL. What IS real is the routing, built like DRIFT's own (fact sheet §1):
 * a 3-way Linkwitz-Riley-4 split at LOW CUT / HIGH CUT, ONLY the middle band
 * goes through the panner, below/above pass untouched. AFTER drives that
 * panner from a SIMPLE track through the plugin's own spring (tracks.ts);
 * BEFORE bypasses it. AUTO DRIFT scales the lap speed by the band's level
 * (AutoDriftDetector.h: -30 dB threshold, 6 dB knee over a 15 dB span,
 * 10 ms attack / 400 ms release, parks to centre at silence).
 * When Dan's bounces land (demoMode 'real'), the voices below are replaced by
 * <audio> sources + a precomputed pan curve; the graph and UI stay.
 */
export type Slot = 'vocal' | 'keys' | 'drums';
const SLOTS: Record<Slot, { track: number; period: number; label: string }> = {
  vocal: { track: 40, period: 6.0, label: 'VOCAL' },   // BREEZE
  keys: { track: 41, period: 4.8, label: 'KEYS' },     // SWAY, 2 bars @ 100 BPM
  drums: { track: 45, period: 2.4, label: 'DRUMS' },   // PING-PONG, 1 bar @ 100 BPM
};
const INTENSITY = 0.6;          // TRK_WIDTH default
const BPM = 100;
const BEAT = 60 / BPM;

interface Graph {
  ctx: AudioContext;
  input: GainNode;
  master: GainNode;
  panner: StereoPannerNode;
  lowFilters: BiquadFilterNode[];
  highFilters: BiquadFilterNode[];
  anL: AnalyserNode;
  anR: AnalyserNode;
  anMix: AnalyserNode;
  anBand: AnalyserNode;
  noise: AudioBuffer;
}

export const deck = {
  playing: false,
  paused: false,
  slot: 'keys' as Slot,
  after: true,
  auto: false,
  low: 250,
  high: 5000,
  graph: null as Graph | null,
};

const listeners = new Set<() => void>();
export const onDeck = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((f) => f());

function lr4(ctx: AudioContext, type: BiquadFilterType, f: number): BiquadFilterNode[] {
  return [0, 1].map(() => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = Math.SQRT1_2; return b; });
}
function chain(nodes: AudioNode[]): void { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); }

function build(): Graph {
  const ctx = new AudioContext();
  const input = ctx.createGain();
  const out = ctx.createGain();
  const master = ctx.createGain();
  master.gain.value = 0.75;
  // 3-way LR4 crossover: below | band | above — only the band is panned
  const lpLow = lr4(ctx, 'lowpass', deck.low);
  const hpLow = lr4(ctx, 'highpass', deck.low);
  const lpHigh = lr4(ctx, 'lowpass', deck.high);
  const hpHigh = lr4(ctx, 'highpass', deck.high);
  const panner = ctx.createStereoPanner();
  const bandTap = ctx.createGain();
  chain([input, lpLow[0], lpLow[1], out]);
  chain([input, hpLow[0], hpLow[1], lpHigh[0], lpHigh[1], bandTap, panner, out]);
  chain([hpLow[1], hpHigh[0], hpHigh[1], out]);
  out.connect(master).connect(ctx.destination);
  const split = ctx.createChannelSplitter(2);
  const anL = ctx.createAnalyser(), anR = ctx.createAnalyser(), anMix = ctx.createAnalyser(), anBand = ctx.createAnalyser();
  [anL, anR, anBand].forEach((a) => { a.fftSize = 1024; });
  anMix.fftSize = 2048;
  anMix.smoothingTimeConstant = 0.8;
  master.connect(split); split.connect(anL, 0); split.connect(anR, 1);
  master.connect(anMix);
  bandTap.connect(anBand);
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return { ctx, input, master, panner, lowFilters: [...lpLow, ...hpLow], highFilters: [...lpHigh, ...hpHigh], anL, anR, anMix, anBand, noise };
}

export function setBandCuts(low: number, high: number): void {
  deck.low = low; deck.high = high;
  const g = deck.graph;
  if (!g) return;
  const t = g.ctx.currentTime;
  g.lowFilters.forEach((f) => f.frequency.setTargetAtTime(low, t, 0.02));
  g.highFilters.forEach((f) => f.frequency.setTargetAtTime(high, t, 0.02));
}

// ---------------------------------------------------------------- voices --
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
function env(g: GainNode, t: number, a: number, peak: number, hold: number, rel: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
}
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
function keysAt(g: Graph, t: number, step: number): void {
  const notes = CHORDS[step % 4];
  for (const n of notes) for (const det of [-7, 7]) {
    const o = g.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
    const lp = g.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    const v = g.ctx.createGain(); env(v, t, 0.03, 0.05, BEAT * 3.4, 0.5);
    chain([o, lp, v, g.input]); o.start(t); o.stop(t + BEAT * 4 + 0.1);
  }
}
function drumsAt(g: Graph, t: number, step: number): void {
  const e = step % 8;
  if (e === 0 || e === 4 || e === 5) {           // kick
    const o = g.ctx.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    const v = g.ctx.createGain(); env(v, t, 0.002, 0.9, 0.02, 0.32); chain([o, v, g.input]); o.start(t); o.stop(t + 0.4);
  }
  if (e === 2 || e === 6) {                      // snare
    const s = g.ctx.createBufferSource(); s.buffer = g.noise;
    const bp = g.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.8;
    const v = g.ctx.createGain(); env(v, t, 0.002, 0.5, 0.01, 0.18); chain([s, bp, v, g.input]); s.start(t); s.stop(t + 0.25);
  }
  const h = g.ctx.createBufferSource(); h.buffer = g.noise;   // hats on every 8th
  const hp = g.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
  const hv = g.ctx.createGain(); env(hv, t, 0.001, e % 2 ? 0.12 : 0.2, 0.005, 0.05); chain([h, hp, hv, g.input]); h.start(t); h.stop(t + 0.1);
}
const MELODY = [57, 60, 62, 60, 64, 62, 60, -1];   // -1 = a rest, so AUTO DRIFT can park
function vocalAt(g: Graph, t: number, step: number): void {
  const n = MELODY[step % MELODY.length];
  if (n < 0) return;
  const o = g.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n - 12);
  const vib = g.ctx.createOscillator(); vib.frequency.value = 5.5;
  const vd = g.ctx.createGain(); vd.gain.value = 18; vib.connect(vd).connect(o.detune);
  const f1 = g.ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 730; f1.Q.value = 6;
  const f2 = g.ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1090; f2.Q.value = 8;
  const v = g.ctx.createGain(); env(v, t, 0.06, 0.55, BEAT * 1.5, 0.25);
  o.connect(f1).connect(v); o.connect(f2).connect(v); v.connect(g.input);
  o.start(t); vib.start(t); o.stop(t + BEAT * 2 + 0.1); vib.stop(t + BEAT * 2 + 0.1);
}
const VOICE: Record<Slot, { every: number; play: (g: Graph, t: number, s: number) => void }> = {
  keys: { every: BEAT * 4, play: keysAt },
  drums: { every: BEAT / 2, play: drumsAt },
  vocal: { every: BEAT * 2, play: vocalAt },
};

// ------------------------------------------------------------- transport --
let timer = 0, raf = 0, nextT = 0, step = 0, phase = 0, lastFrame = 0, elapsed = 0;
let drive = 0, peakHold = 0, park = 0, lastWheel = -1e9;
const spring = new PanSpring();
const buf = new Float32Array(1024);

function scheduler(): void {
  const g = deck.graph!;
  while (nextT < g.ctx.currentTime + 0.12) { VOICE[deck.slot].play(g, nextT, step++); nextT += VOICE[deck.slot].every; }
}

function frame(now: number): void {
  const g = deck.graph!;
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (deck.playing && !deck.paused) elapsed += dt;
  const s = SLOTS[deck.slot];

  // AUTO DRIFT detector on the band (pre-pan), AutoDriftDetector.h shape
  g.anBand.getFloatTimeDomainData(buf);
  let pk = 0; for (let i = 0; i < buf.length; i++) pk = Math.max(pk, Math.abs(buf[i]));
  const x = 20 * Math.log10(pk + 1e-9) + 30;               // dB over the -30 dB threshold
  const raw = x <= -3 ? 0 : x < 3 ? ((x + 3) ** 2) / 12 / 15 : Math.min(1, x / 15);
  peakHold = Math.max(raw, peakHold * Math.exp(-dt / 0.4));
  drive += (peakHold - drive) * (1 - Math.exp(-dt / 0.01));
  const parkTarget = drive > 1e-4 ? 1 : 0;
  park += (parkTarget - park) * (1 - Math.exp(-dt / (parkTarget > park ? 0.01 : 0.4)));

  const running = deck.playing && !deck.paused;
  if (running) phase += (dt / s.period) * (deck.auto ? drive : 1);
  const target = running || deck.paused ? shapeAt(s.track, phase) * swingWidth(INTENSITY) : 0;
  let p = spring.step(target, dt, INTENSITY, s.period);
  if (deck.auto) p *= park;

  const handOnWheel = now - lastWheel < 700;
  if (deck.after && !handOnWheel) {
    g.panner.pan.setTargetAtTime(p, g.ctx.currentTime, 0.012);
    setPan(p, 'demo');
  }
  if (!deck.after) g.panner.pan.setTargetAtTime(0, g.ctx.currentTime, 0.012);
  emit();
  const settling = !deck.playing && Math.abs(spring.pan) > 0.002;
  raf = deck.playing || settling ? requestAnimationFrame(frame) : 0;
  if (!raf) setPan(0, 'demo');
}

export async function play(): Promise<void> {
  if (!deck.graph) {
    deck.graph = build();
    onPan((p, source) => {
      // the hand on the wheel, or the TRACKS car, wins over the deck's own curve
      if ((source !== 'wheel' && source !== 'tracks') || !deck.graph || !deck.after) return;
      lastWheel = performance.now();
      deck.graph.panner.pan.setTargetAtTime(p, deck.graph.ctx.currentTime, 0.012);
    });
  }
  const g = deck.graph;
  await g.ctx.resume();
  if (!deck.playing) {
    deck.playing = true; step = 0; phase = 0; elapsed = 0; spring.reset();
    g.master.gain.cancelScheduledValues(g.ctx.currentTime);
    g.master.gain.setTargetAtTime(0.75, g.ctx.currentTime, 0.02);
    nextT = g.ctx.currentTime + 0.05;
    timer = window.setInterval(scheduler, 25);
  }
  deck.paused = false;
  if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
  emit();
}

export function pause(): void {
  if (!deck.playing || !deck.graph) return;
  deck.paused = !deck.paused;                // Pause: the car freezes mid-lap, the pan parks where it stands
  if (deck.paused) void deck.graph.ctx.suspend(); else void deck.graph.ctx.resume();
  emit();
}

export function stop(): void {
  if (!deck.playing || !deck.graph) return;
  const g = deck.graph;
  deck.playing = false; deck.paused = false;
  window.clearInterval(timer);
  void g.ctx.resume();
  g.master.gain.setTargetAtTime(0, g.ctx.currentTime, 0.05);  // Stop: the pan eases back to centre
  if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
  emit();
}

export function setSlot(slot: Slot): void {
  deck.slot = slot; step = 0; phase = 0;
  if (deck.graph) nextT = deck.graph.ctx.currentTime + 0.05;
  emit();
}
export function setAfter(after: boolean): void { deck.after = after; if (!after) setPan(0, 'demo'); emit(); }
export function setAuto(on: boolean): void { deck.auto = on; emit(); }

export const slotLabel = () => SLOTS[deck.slot].label;
export const elapsedSec = () => elapsed;
/** 0..5 bars from the mix RMS (the NOW PLAYING 5-bar meter). */
export function levelBars(): number {
  const g = deck.graph;
  if (!g || !deck.playing || deck.paused) return 0;
  g.anMix.getFloatTimeDomainData(buf);
  let ss = 0; for (let i = 0; i < 1024; i++) ss += buf[i] * buf[i];
  const db = 10 * Math.log10(ss / 1024 + 1e-12);
  return Math.max(0, Math.min(5, Math.round(((db + 48) / 42) * 5)));
}
