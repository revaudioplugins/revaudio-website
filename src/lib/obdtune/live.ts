/**
 * The page's one live signal. A source gives the sung pitch each frame:
 *   'demo'  the demo singer, silent (the hero runs on it from load);
 *   'synth' the same singer, heard: a sawtooth through vowel formants, a stand-in for a voice, not the plugin's audio;
 *   'mic'   the visitor's voice (autocorrelation pitch, read only: the mic is never played back).
 * The master Corrector turns it into a Reading; every view subscribes with onFrame().
 * DETECT listens to the voiced frames, then sets KEY + SCALE (major / minor, as the plugin answers) and switches
 * the 12 NOTEs back on; for 8 s after, it offers UNDO (the plugin's 10-5a-15 behaviour).
 */
import {
  Corrector, demoPitch, detectKey, hzToMidi, legal, midiToHz, set, state, touch, VOICES,
  harmNote, type Reading,
} from './engine';

export type Source = 'demo' | 'synth' | 'mic';
export interface Frame { t: number; r: Reading; harm: (number | null)[]; source: Source }

const subs = new Set<(f: Frame) => void>();
export const onFrame = (fn: (f: Frame) => void) => { subs.add(fn); return () => subs.delete(fn); };
const srcSubs = new Set<(s: Source) => void>();
export const onSource = (fn: (s: Source) => void) => { srcSubs.add(fn); return () => srcSubs.delete(fn); };

let source: Source = 'demo';
export const currentSource = () => source;
const corrector = new Corrector();
let last = performance.now();
let clock = 0;

// ---------- audio ----------
let ac: AudioContext | null = null;
let master: GainNode | null = null;
interface Voice { osc: OscillatorNode; amp: GainNode }
let voices: Voice[] = [];

function makeVoice(ctx: AudioContext, out: AudioNode): Voice {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const amp = ctx.createGain(); amp.gain.value = 0;
  const sum = ctx.createGain(); sum.gain.value = 1;
  // an "ah": three formant bands over a soft low-pass
  for (const [f, q, g] of [[730, 7, 1], [1090, 9, 0.55], [2440, 11, 0.28]] as const) {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const gg = ctx.createGain(); gg.gain.value = g;
    osc.connect(bp).connect(gg).connect(sum);
  }
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
  sum.connect(lp).connect(amp).connect(out);
  osc.start();
  return { osc, amp };
}

function ensureAudio() {
  if (ac) return ac;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ac = new Ctx();
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3;
  master = ac.createGain(); master.gain.value = 0.9;
  // a short room so the synth doesn't sound like a test tone
  const dly = ac.createDelay(); dly.delayTime.value = 0.083;
  const fb = ac.createGain(); fb.gain.value = 0.28;
  const wet = ac.createGain(); wet.gain.value = 0.22;
  const damp = ac.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 2400;
  master.connect(comp); master.connect(dly); dly.connect(damp).connect(fb).connect(dly); damp.connect(wet).connect(comp);
  comp.connect(ac.destination);
  voices = [makeVoice(ac, master), makeVoice(ac, master), makeVoice(ac, master)];
  return ac;
}

// ---------- mic ----------
let micStream: MediaStream | null = null;
let analyser: AnalyserNode | null = null;
let micBuf: Float32Array | null = null;

function micPitch(): number | null {
  if (!analyser || !micBuf || !ac) return null;
  analyser.getFloatTimeDomainData(micBuf as Float32Array<ArrayBuffer>);
  const n = micBuf.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += micBuf[i] * micBuf[i];
  if (Math.sqrt(rms / n) < 0.012) return null;
  const v = VOICES[state.voice];
  const minLag = Math.floor(ac.sampleRate / v.hi), maxLag = Math.min(n >> 1, Math.ceil(ac.sampleRate / v.lo));
  // normalised square difference (the plugin's detector family), first strong peak
  let best = -1, bestLag = -1;
  const nsdf: number[] = [];
  for (let lag = minLag; lag <= maxLag; lag++) {
    let ac0 = 0, m = 0;
    for (let i = 0; i < n - lag; i++) { ac0 += micBuf[i] * micBuf[i + lag]; m += micBuf[i] ** 2 + micBuf[i + lag] ** 2; }
    const val = m > 0 ? (2 * ac0) / m : 0;
    nsdf.push(val);
    if (val > best) { best = val; bestLag = lag; }
  }
  if (best < 0.6) return null;
  for (let k = 1; k < nsdf.length - 1; k++) {
    if (nsdf[k] > 0.9 * best && nsdf[k] >= nsdf[k - 1] && nsdf[k] >= nsdf[k + 1]) { bestLag = k + minLag; break; }
  }
  const k = bestLag - minLag;
  let lag = bestLag;
  if (k > 0 && k < nsdf.length - 1) {
    const a = nsdf[k - 1], b = nsdf[k], c = nsdf[k + 1];
    const d = a - 2 * b + c;
    if (d !== 0) lag += (0.5 * (a - c)) / d;
  }
  return hzToMidi(ac.sampleRate / lag);
}

export async function setSource(next: Source): Promise<boolean> {
  if (next === source) return true;
  if (next === 'mic') {
    try {
      const ctx = ensureAudio();
      await ctx.resume();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
      micBuf = new Float32Array(analyser.fftSize);
      ctx.createMediaStreamSource(micStream).connect(analyser);
    } catch {
      return false;
    }
  } else if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null; analyser = null;
  }
  if (next === 'synth') { const ctx = ensureAudio(); await ctx.resume(); clock = 0; }
  if (next !== 'synth') voices.forEach((v) => ac && v.amp.gain.setTargetAtTime(0, ac.currentTime, 0.03));
  source = next;
  corrector.step(null, 1000);
  srcSubs.forEach((fn) => fn(source));
  return true;
}

// ---------- DETECT ----------
export interface DetectState { phase: 'idle' | 'listening' | 'answer' | 'none'; progress: number; undoUntil: number; answer: string }
export const detect: DetectState = { phase: 'idle', progress: 0, undoUntil: 0, answer: '' };
const LISTEN_S = 6;
let hist = Array(12).fill(0);
let undo: { key: number; scale: number; notes: boolean[] } | null = null;
let listenedFor = 0;

export function pressDetect() {
  const now = performance.now();
  if (detect.phase === 'answer' && now < detect.undoUntil && undo) {
    // UNDO: KEY + SCALE + the NOTEs back together
    state.key = undo.key; state.scale = undo.scale; state.notes = undo.notes;
    undo = null; detect.phase = 'idle'; detect.answer = '';
    touch('detect');
    return;
  }
  if (detect.phase === 'listening') { detect.phase = 'idle'; detect.progress = 0; touch('detect'); return; }
  hist = Array(12).fill(0); listenedFor = 0;
  detect.phase = 'listening'; detect.progress = 0;
  touch('detect');
}

function feedDetect(raw: number | null, dt: number) {
  if (detect.phase === 'answer' && performance.now() > detect.undoUntil) { detect.phase = 'idle'; touch('detect'); }
  if (detect.phase !== 'listening') return;
  if (raw == null) return;
  hist[((Math.round(raw) % 12) + 12) % 12] += dt;
  listenedFor += dt;
  detect.progress = Math.min(1, listenedFor / LISTEN_S);
  if (listenedFor >= LISTEN_S) {
    const k = detectKey(hist);
    if (!k || k.score < 0.5) { detect.phase = 'none'; detect.answer = 'NO KEY'; touch('detect'); return; }
    undo = { key: state.key, scale: state.scale, notes: state.notes.slice() };
    state.key = k.key; state.scale = k.scale; state.notes = Array(12).fill(true);
    detect.phase = 'answer'; detect.undoUntil = performance.now() + 8000;
    detect.answer = `${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][k.key]} ${k.scale === 1 ? 'MAJOR' : 'MINOR'}`;
    touch('detect');
  }
}

// ---------- the loop ----------
let running = false;
let visible = true;
function tick(now: number) {
  if (!running) return;
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!visible && source === 'demo') return;
  clock += dt;
  const raw = source === 'mic' ? micPitch() : demoPitch(clock);
  const r = corrector.step(raw, dt * 1000);
  const ok = legal();
  const harm = state.harm.v.map((v) => {
    if (!state.on || !state.harm.on || !v.on || r.target == null || r.out == null) return null;
    return harmNote(r.target, v.int, ok) + (r.out - r.target);
  });
  feedDetect(raw, dt);
  if (source === 'synth' && ac) {
    const t = ac.currentTime;
    const lead = r.out ?? r.raw;
    if (lead != null) voices[0].osc.frequency.setTargetAtTime(midiToHz(lead - 12), t, 0.004);
    // HARMONY MIX: lead x min(1, 2(1-m)), voices x min(1, 2m) (revtune::HarmonyParams::mix)
    const m = state.harm.on ? state.harm.mix / 100 : 0.5;
    const leadK = Math.min(1, 2 * (1 - m)), harmK = Math.min(1, 2 * m);
    voices[0].amp.gain.setTargetAtTime(r.voiced ? 0.32 * leadK : 0, t, r.voiced ? 0.02 : 0.04);
    harm.forEach((hm, i) => {
      const v = voices[i + 1];
      if (hm != null) v.osc.frequency.setTargetAtTime(midiToHz(hm - 12), t, 0.004);
      v.amp.gain.setTargetAtTime(hm != null && r.voiced ? 0.32 * harmK * state.harm.v[i].level : 0, t, 0.03);
    });
  }
  const f: Frame = { t: clock, r, harm, source };
  subs.forEach((fn) => fn(f));
}

export function startLive() {
  if (running) return;
  running = true;
  last = performance.now();
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  requestAnimationFrame(tick);
}

export { set };
