/**
 * WIDE BEAM in the browser: a Web Audio mid/side chain after the plugin's own laws (WideBeam README "Audio"), fed by a
 * synthesized night-drive loop or the visitor's own file (decoded locally, never uploaded).
 *
 *   in ─┬─ M = (L+R)/2 ─────────────────────────────────────────────────────────┬─▶ L = M + S, R = M − S ─ wet (× CRUISE × MIX)
 *       │            └─ HP@focus (LR4) ─ velvet decorrelator ─ −6 dB < 1.2 kHz ─ REACH ─┐│
 *       └─ S = (L−R)/2 ─ HP@focus (LR4) ─ TILT shelves ─ WIDTH ──────────────────────────┴┘
 *       └───────────────────────────────────────────────────────────────────────────────── dry (× 1−MIX, or all of it with POWER off)
 *   wet + dry ─ MONO / SIDE (on the blend) ─ master ─ limiter ─ −0.3 dBFS ceiling ─┬─ (the meter tap: CORR, the mirror) ─ VOLUME ─ out
 *
 * The limiter and the ceiling sit after the A/B, so ORIGINAL (POWER off) and WIDE BEAM go through the same output, and no
 * setting clips (demo-d02). The beam is the plugin's: its amount (0.5 at REACH 100) and halved below 1.2 kHz, which keeps
 * HIGH BEAM's lean inside the plugin's own 1-2 dB (demo-14). VOLUME is the page's monitor level: the plugin has no fader.
 *
 * It is a demo of what the controls do, not the plugin's DSP: no allpass-aligned dry, no attack ducking on HIGH BEAM.
 */
export interface WbParams {
  width: number; // 0-200, 100 = unchanged
  focus: number; // 20-1000 Hz
  mix: number; // 0-100
  tilt: number; // -100..100
  reach: number; // 0-100
  high: boolean;
  mono: boolean;
  side: boolean;
  power: boolean;
}

export const DEFAULTS: WbParams = { width: 136, focus: 120, mix: 100, tilt: 0, reach: 50, high: false, mono: false, side: false, power: true };

// WIDTH: linear to 100, then dB-linear to +6 dB at 200 (README table)
export const widthGain = (w: number) => (w <= 100 ? w / 100 : Math.pow(10, ((w - 100) / 100) * 6 / 20));
// CRUISE: a static law, never above 1, exactly 1 at WIDTH ≤ 100 with HIGH BEAM off. Its reach term is the beam's own
// amount, as in the plugin (PluginProcessor.cpp: 0.5 at REACH 100, so -0.8 dB there, -2 dB at WIDTH 200)
export const beamAmount = (p: WbParams) => (p.high ? 0.5 * p.reach / 100 : 0);
export const cruise = (p: WbParams) => {
  const w = Math.max(1, widthGain(p.width)), r = beamAmount(p);
  return Math.min(1, Math.sqrt(1.25 / (1.25 + 0.25 * (w * w - 1) + r * r)));
};

const T = 0.02; // the 20 ms glide every switch uses
/** The Night Drive loop's level at the output with POWER off (measured offline, 48 kHz): a visitor's own file is brought
 *  to the same RMS, so picking a file never jumps ~14 dB (demo-d02). */
export const LOOP_RMS_DB = -21.4;
const CEILING = 0.966; // -0.3 dBFS

/** What the engine plays: the synthesized loop, or a decoded file / clip, looped. A visitor's file is RMS-matched to the
 *  loop (matchGain); a demo clip comes loudness-matched already (`gain` 1) and loops its own window `loop` [start, end] s,
 *  inside the padding its file carries on both sides (the AAC priming never lands on the seam). */
export type WbSource = { kind: 'demo'; name?: string } | { kind: 'buffer'; buffer: AudioBuffer; name: string; loop?: [number, number]; gain?: number };

export class WideBeamEngine {
  ctx: AudioContext;
  input: GainNode;
  analyserL: AnalyserNode;
  analyserR: AnalyserNode;
  /** the very end of the chain (after VOLUME); connected to the context's destination */
  output: GainNode;
  private master: GainNode;
  private nodes: Record<string, any> = {};
  private p: WbParams = { ...DEFAULTS };
  private source: { stop(): void } | null = null;
  private current: WbSource = { kind: 'demo' };
  private bufL = new Float32Array(2048);
  private bufR = new Float32Array(2048);
  private lastMeasure = 0;
  corr = 1;

  /** `context` lets a test render the chain offline (an OfflineAudioContext); the page passes nothing. */
  constructor(context?: BaseAudioContext) {
    const ctx = (this.ctx = (context ?? new (window.AudioContext || (window as any).webkitAudioContext)()) as AudioContext);
    const mono = (g: AudioNode) => { g.channelCount = 1; g.channelCountMode = 'explicit'; g.channelInterpretation = 'speakers'; return g; };
    const gain = (v = 1, m = true) => { const g = ctx.createGain(); g.gain.value = v; return m ? mono(g) as GainNode : g; };
    const hp = () => { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.Q.value = Math.SQRT1_2; return mono(f) as BiquadFilterNode; };

    // the input is always stereo, by the speaker rules: a 1-channel file (a voice memo, a mono bounce) plays as dual mono,
    // centred, as a DAW plays it on a stereo track (a 'max' input would hand the splitter one channel, which it up-mixes
    // discretely: L = the signal, R = silence, the whole wet path leaning left: r-dash-monofile); a 5.1 file folds down to
    // L / R (its centre at -3 dB in both, checked offline)
    this.input = gain(1, false);
    this.input.channelCount = 2; this.input.channelCountMode = 'explicit'; this.input.channelInterpretation = 'speakers';
    const split = ctx.createChannelSplitter(2);
    this.input.connect(split);

    const mid = gain(0.5), side = gain(0.5), sideInv = gain(-1); // sideInv feeds side, so R arrives at −0.5
    split.connect(mid, 0); split.connect(mid, 1);
    split.connect(side, 0); split.connect(sideInv, 1); sideInv.connect(side);

    // side: LR4 high-pass at LOW FOCUS (two Butterworth sections), TILT shelves at 1.5 kHz, WIDTH
    const sHp1 = hp(), sHp2 = hp();
    const lo = ctx.createBiquadFilter(); lo.type = 'lowshelf'; lo.frequency.value = 1500;
    const hi = ctx.createBiquadFilter(); hi.type = 'highshelf'; hi.frequency.value = 1500;
    const widthG = gain(widthGain(this.p.width));
    side.connect(sHp1).connect(sHp2).connect(lo).connect(hi).connect(widthG);

    // HIGH BEAM: the mono content above LOW FOCUS through a 25 ms velvet-noise decorrelator, halved below 1.2 kHz like the
    // plugin's beam (README: "halved below 1.2 kHz"), into the side at the plugin's amount (0.5 at REACH 100)
    const bHp1 = hp(), bHp2 = hp();
    const conv = ctx.createConvolver(); conv.normalize = false; conv.buffer = this.velvet(0.025);
    const beamShelf = ctx.createBiquadFilter(); beamShelf.type = 'lowshelf'; beamShelf.frequency.value = 1200; beamShelf.gain.value = -6;
    const beamG = gain(0);
    mid.connect(bHp1).connect(bHp2).connect(conv).connect(beamShelf).connect(beamG);

    const sideBus = gain(1);
    widthG.connect(sideBus); beamG.connect(sideBus);

    // mid + side back to L / R: L = M + S, R = M − S
    const toLR = (m: AudioNode, s: AudioNode) => {
      const L = gain(1), R = gain(1), sNeg = gain(-1), merge = ctx.createChannelMerger(2);
      m.connect(L); m.connect(R); s.connect(L); s.connect(sNeg).connect(R);
      L.connect(merge, 0, 0); R.connect(merge, 0, 1);
      return merge;
    };
    const wet = gain(1, false), dry = gain(0, false);
    toLR(mid, sideBus).connect(wet);
    this.input.connect(dry);
    const out = gain(1, false);
    wet.connect(out); dry.connect(out);

    // MONO / SIDE act on the whole blend, after MIX, as in the plugin (PluginProcessor.cpp: out = dry + (wet − dry) × mix,
    // then MONO sums it and SIDE solos its (L − R) / 2): at MIX 35 the dry share is mono or side-only too. Both open = the
    // blend unchanged (M + S = L, M − S = R).
    const oSplit = ctx.createChannelSplitter(2);
    out.connect(oSplit);
    const oMid = gain(0.5), oSide = gain(0.5), oSideInv = gain(-1), midOut = gain(1), sideOut = gain(1);
    oSplit.connect(oMid, 0); oSplit.connect(oMid, 1);
    oSplit.connect(oSide, 0); oSplit.connect(oSideInv, 1); oSideInv.connect(oSide);
    oMid.connect(midOut); oSide.connect(sideOut);
    const monitored = toLR(midOut, sideOut);

    // the output stage, the same for ORIGINAL and WIDE BEAM: master, a fast limiter, then a hard ceiling at -0.3 dBFS
    // (a soft knee from -6 dBFS; the limiter keeps the signal out of it almost always)
    this.master = gain(0.9, false);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6; limiter.knee.value = 4; limiter.ratio.value = 12; limiter.attack.value = 0.002; limiter.release.value = 0.12;
    const pre = gain(0.5, false), post = gain(2, false);
    const shaper = ctx.createWaveShaper(); shaper.curve = ceilingCurve(); shaper.oversample = 'none';
    this.output = gain(1, false);
    monitored.connect(this.master).connect(limiter).connect(pre).connect(shaper).connect(post).connect(this.output).connect(ctx.destination);

    // the meter tap: after the ceiling, before VOLUME (the mirror and CORR read the sound, not the monitor level)
    const meterSplit = ctx.createChannelSplitter(2);
    post.connect(meterSplit);
    this.analyserL = ctx.createAnalyser(); this.analyserR = ctx.createAnalyser();
    this.analyserL.fftSize = this.analyserR.fftSize = 2048;
    meterSplit.connect(this.analyserL, 0); meterSplit.connect(this.analyserR, 1);

    Object.assign(this.nodes, { sHp1, sHp2, bHp1, bHp2, lo, hi, widthG, beamG, sideOut, midOut, wet, dry });
    this.set(this.p);
  }

  // a 25 ms velvet-noise impulse: sparse ±1 taps, one per ~1 ms slot, decaying, scaled to unity energy
  private velvet(sec: number) {
    const sr = this.ctx.sampleRate, n = Math.round(sr * sec), b = this.ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    const slot = Math.round(sr / 1000); let seed = 7, e = 0;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i += slot) { const k = Math.min(n - 1, i + Math.floor(rnd() * slot)); d[k] = (rnd() < 0.5 ? -1 : 1) * Math.exp(-3 * k / n); e += d[k] * d[k]; }
    const s = 1 / Math.sqrt(e); for (let i = 0; i < n; i++) d[i] *= s;
    return b;
  }

  set(next: Partial<WbParams>) {
    const p = (this.p = { ...this.p, ...next }), n = this.nodes, t = this.ctx.currentTime;
    const to = (a: AudioParam, v: number) => a.setTargetAtTime(v, t, T);
    for (const f of [n.sHp1, n.sHp2, n.bHp1, n.bHp2]) to(f.frequency, p.focus);
    const db = (p.tilt / 100) * 6.02;
    to(n.lo.gain, -db); to(n.hi.gain, db);
    to(n.widthG.gain, widthGain(p.width));
    to(n.beamG.gain, beamAmount(p));
    // listening switches, on the blend: SIDE wins over MONO (README); with POWER off the output is the dry whatever they
    // say (the plugin's POWER fade comes after them)
    to(n.midOut.gain, p.power && p.side ? 0 : 1);
    to(n.sideOut.gain, p.power && p.mono && !p.side ? 0 : 1);
    const mix = p.mix / 100;
    to(n.wet.gain, p.power ? mix * cruise(p) : 0);
    to(n.dry.gain, p.power ? 1 - mix : 1);
  }

  get params() { return this.p; }

  /** VOLUME, the page's own monitor level, in dB (-60 and below = silent; never above 0). */
  setVolume(db: number) {
    const g = db <= -60 ? 0 : Math.pow(10, Math.min(0, db) / 20);
    this.output.gain.setTargetAtTime(g, this.ctx.currentTime, T);
  }

  /** The measured correlation, smoothed with a 300 ms time constant like the plugin's meter (demo-18); 0 with no
   *  signal. `level` is the RMS of the analysers' window. */
  measure(): { corr: number; level: number } {
    this.analyserL.getFloatTimeDomainData(this.bufL);
    this.analyserR.getFloatTimeDomainData(this.bufR);
    let lr = 0, ll = 0, rr = 0;
    for (let i = 0; i < this.bufL.length; i++) { const l = this.bufL[i], r = this.bufR[i]; lr += l * r; ll += l * l; rr += r * r; }
    const level = Math.sqrt((ll + rr) / (2 * this.bufL.length));
    const c = ll * rr > 1e-9 ? lr / Math.sqrt(ll * rr) : 0;
    const now = performance.now(), dt = this.lastMeasure ? Math.min(0.25, (now - this.lastMeasure) / 1000) : 1 / 60;
    this.lastMeasure = now;
    this.corr += (c - this.corr) * (1 - Math.exp(-dt / 0.3));
    return { corr: level > 1e-4 ? this.corr : 0, level };
  }

  scope(): [Float32Array, Float32Array] { return [this.bufL, this.bufR]; }

  stop() { this.source?.stop(); this.source = null; }
  get playing() { return !!this.source; }
  /** what plays (or would play on start): the loop or the last file / clip */
  get sourceName() { return this.current.kind === 'demo' ? (this.current.name ?? 'Synth loop') : this.current.name; }
  get sourceKind() { return this.current.kind; }

  /** Pick what plays; if something is playing it switches at once. */
  setSource(src: WbSource) {
    this.current = src;
    if (this.source) this.start();
  }

  /** Play the current source from the top (the loop, or the last file the visitor picked: demo-16). */
  start() {
    this.stop();
    const src = this.current;
    if (src.kind === 'demo') { this.source = nightDrive(this.ctx, this.input); return; }
    const s = this.ctx.createBufferSource(); s.buffer = src.buffer; s.loop = true;
    if (src.loop) { s.loopStart = src.loop[0]; s.loopEnd = src.loop[1]; }
    // in and out over a few ms, so a switch between tracks never clicks
    const g = this.ctx.createGain(), t = this.ctx.currentTime, level = src.gain ?? matchGain(src.buffer);
    g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(level, t, 0.004);
    s.connect(g).connect(this.input); s.start(t, src.loop ? src.loop[0] : 0);
    this.source = { stop: () => {
      const now = this.ctx.currentTime;
      g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(0, now, 0.008);
      try { s.stop(now + 0.05); } catch {}
      s.onended = () => { s.disconnect(); g.disconnect(); };
    } };
  }

  async playFile(file: File) {
    const buffer = await this.ctx.decodeAudioData(await file.arrayBuffer());
    this.current = { kind: 'buffer', buffer, name: file.name };
    this.start();
  }

  playDemo() {
    this.current = { kind: 'demo' };
    this.start();
  }
}

/** The gain that brings a buffer to the loop's RMS (LOOP_RMS_DB), boosting a quiet file by 12 dB at most. */
export function matchGain(buf: AudioBuffer) {
  let s = 0, n = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i += 4) { s += d[i] * d[i]; n++; } }
  const rms = Math.sqrt(s / Math.max(1, n));
  if (!(rms > 1e-5)) return 1;
  return Math.min(Math.pow(10, 12 / 20), Math.pow(10, LOOP_RMS_DB / 20) / rms);
}

// the ceiling's transfer curve, on an input pre-scaled by 0.5 (so the curve's -1..1 spans ±6 dBFS) and post-scaled by 2:
// straight to -6 dBFS, then a tanh knee that never passes -0.3 dBFS, whatever goes in
function ceilingCurve() {
  const N = 4097, c = new Float32Array(N), knee = 0.25, top = CEILING / 2 - knee;
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 2 - 1, a = Math.abs(x);
    c[i] = Math.sign(x) * (a <= knee ? a : knee + top * Math.tanh((a - knee) / top));
  }
  return c;
}

/**
 * "Night Drive": 96 BPM, Am – F – C – G. Each part sits where a real mix puts it, so the controls have something to
 * move: kick + bass dead centre (LOW FOCUS keeps them there), a mono lead (HIGH BEAM's food), a wide detuned pad and
 * a ping-ponging arp (WIDTH's), hats a little off-centre (TILT's highs). Lifted ~6 dB (demo-d02): the output limiter
 * holds its peaks.
 */
function nightDrive(ctx: AudioContext, dest: AudioNode) {
  const bus = ctx.createGain(); bus.gain.value = 1.1; bus.connect(dest);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.connect(bus);
  const spb = 60 / 96, bar = spb * 4;
  const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const bassN = [45, 41, 36, 43];
  const lead = [76, null, 74, 72, null, 69, 72, null, 71, null, 67, null, 69, null, null, null];
  const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
  const pan = (v: number) => { const p = ctx.createStereoPanner(); p.pan.value = v; p.connect(comp); return p; };
  const noise = (() => { const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  const env = (g: GainNode, t: number, a: number, peak: number, dec: number) => {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  };
  const live = new Set<AudioScheduledSourceNode>();
  const track = (s: AudioScheduledSourceNode) => { live.add(s); s.onended = () => live.delete(s); };

  function voice(type: OscillatorType, f: number, t: number, len: number, to: AudioNode, peak: number, a = 0.01, cut = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
    let tail: AudioNode = g;
    if (cut) { const lp = ctx.createBiquadFilter(); lp.frequency.value = cut; g.connect(lp); tail = lp; }
    o.connect(g); tail.connect(to); env(g, t, a, peak, len); o.start(t); o.stop(t + a + len + 0.05); track(o);
    return o;
  }

  const padL = pan(-0.75), padR = pan(0.75), arpL = pan(-0.5), arpR = pan(0.5), mid = pan(0), hatL = pan(-0.35), hatR = pan(0.4);
  // the lead gets a slow vibrato and a touch of delay, still mono
  const leadBus = ctx.createGain(); leadBus.connect(mid);
  const dl = ctx.createDelay(1); dl.delayTime.value = spb * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.25;
  leadBus.connect(dl).connect(fb).connect(dl); fb.connect(mid);

  function schedBar(t: number, i: number) {
    const c = chords[i % 4];
    for (const n of c) {
      voice('sawtooth', hz(n) * 0.997, t, bar * 0.95, padL, 0.05, 0.4, 1600);
      voice('sawtooth', hz(n) * 1.004, t, bar * 0.95, padR, 0.05, 0.4, 1600);
    }
    for (let s = 0; s < 16; s++) {
      const st = t + s * spb / 4;
      // arp: chord tones up an octave, left / right in turn
      const an = c[s % 3] + 12 + (s % 8 > 5 ? 12 : 0);
      voice('square', hz(an), st, 0.16, s % 2 ? arpR : arpL, 0.035, 0.004, 2600);
      if (s % 4 === 0) { // kick
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, st); o.frequency.exponentialRampToValueAtTime(42, st + 0.12);
        o.connect(g).connect(mid); env(g, st, 0.002, 0.9, 0.28); o.start(st); o.stop(st + 0.35); track(o);
      }
      if (s % 2 === 1) { // hats
        const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = noise; f.type = 'highpass'; f.frequency.value = 7000;
        n.connect(f).connect(g).connect(s % 4 === 1 ? hatL : hatR); env(g, st, 0.001, s % 4 === 3 ? 0.12 : 0.07, 0.05); n.start(st); n.stop(st + 0.1); track(n);
      }
      if (s === 4 || s === 12) { // snare: centred noise + body
        const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = noise; f.type = 'bandpass'; f.frequency.value = 1800;
        n.connect(f).connect(g).connect(mid); env(g, st, 0.001, 0.35, 0.16); n.start(st); n.stop(st + 0.25); track(n);
        voice('triangle', 190, st, 0.08, mid, 0.25, 0.001);
      }
      if (s % 2 === 0) voice('sawtooth', hz(bassN[i % 4]), st, spb / 2 * 0.8, mid, 0.22, 0.005, 420);
      const ln = lead[s];
      if (ln && i % 2 === 1) {
        const o = voice('triangle', hz(ln), st, spb * 0.9, leadBus, 0.14, 0.02);
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 4; lfo.connect(lg).connect(o.frequency); lfo.start(st); lfo.stop(st + spb); track(lfo);
      }
    }
  }

  // an OfflineAudioContext (a test render) has no clock to tick on: schedule its whole length up front
  const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
  let next = ctx.currentTime + 0.08, i = 0;
  // a timer held back past the look-ahead (a stalled main thread, a clamped background timer) never books the bars it
  // missed into the past, where they all fire at once: the loop picks up at the next bar after now (r-dash-scheduler)
  const tick = () => {
    if (!offline && next < ctx.currentTime) { const miss = Math.ceil((ctx.currentTime - next) / bar); next += miss * bar; i += miss; }
    const until = offline ? (ctx as unknown as OfflineAudioContext).length / ctx.sampleRate : ctx.currentTime + 0.6;
    while (next < until) { schedBar(next, i++); next += bar; }
  };
  tick();
  const timer = offline ? 0 : window.setInterval(tick, 150);
  return {
    stop() {
      clearInterval(timer);
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      const all = [...live];
      setTimeout(() => { all.forEach((s) => { try { s.stop(); } catch {} }); bus.disconnect(); }, 200);
    },
  };
}
