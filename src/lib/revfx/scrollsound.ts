/**
 * #pedals sound: the knobs ring as they turn. Every detent the scroll moves a knob across rings one small bell, and
 * that bell goes through the pedal's own kind of effect at the knob's value, so turning the knob is heard as the
 * effect changing (Yoni 2026-11-10: "sound effects that initiate when the knobs move, not musical parts ... like
 * bells with high freq but not too high, dynamic and fun"). Quiet by design; nothing plays while the scroll rests,
 * only the tails ring out.
 *
 *   HALO   SIZE       12 detents up a D pentatonic ladder (A4 .. B6), the bell through a two-line stereo ensemble:
 *                      narrow and still at 0, wide and shimmering at 100 %
 *   PITCH  ±12 st     one detent per semitone of the readout: the bell is played at A5 moved by that semitone
 *                      (synthesized at the pitch, not shifted)
 *   ECHO   FEEDBACK   the ladder into a dark ping-pong delay; the knob is the loop gain (8 .. 92 %)
 *   REVERB DECAY      the ladder into three generated rooms (short / mid / long), crossfaded by the knob
 *   GLUE   THRESHOLD  the ladder into a compressor at the readout's dB (0 .. -32) with auto makeup: lower = the
 *                      ring squeezed flatter and longer
 * A fast scroll rings a short run (up to 3 bells) a little louder and brighter; a new pedal swinging in gets a soft
 * two-note chime. Nothing is a recording: Web Audio oscillators only.
 *
 * Bench stage: tools/rfxsound drives it (/__rfxsound, dev only); the page does not import it yet. Audio can only start
 * from a user gesture, so start() must be called from a click / key handler.
 */
import { pedals, type PedalId } from '../../data/revfx';

export interface SoundSettings {
  master: number;   // dB, everything
  tone: number;     // Hz, master low-pass
  bell: { decay: number; bright: number; ratio: number };   // ring length s, FM brightness, modulator ratio (3.5 = bell)
  speed: number;    // 0..1, how much a fast scroll adds (louder + brighter)
  arrive: number;   // 0..1, the chime when a pedal swings in (0 = off)
  level: Record<PedalId, number>;   // dB trim per pedal
  halo: { depth: number; wet: number };                     // ms of delay sweep at 100 %, ensemble level at 100 %
  echo: { time: number; fbMax: number; dark: number; wet: number };   // delay s, loop gain at 92 %, loop low-pass Hz, repeats level
  reverb: { long: number; wet: number; bright: number };    // longest room's decay s, wet at 100 %, room brightness Hz
  glue: { ratio: number; makeup: number };                  // makeup 0..1 of the gain reduction
}

export const SOUND_DEFAULTS: SoundSettings = {
  master: -40, tone: 7500,
  bell: { decay: 0.9, bright: 1, ratio: 3.5 },
  speed: 0.6, arrive: 0.5,
  level: { halo: 0, pitch: 0, echo: 0, reverb: 0, glue: 0 },
  halo: { depth: 3.5, wet: 0.9 },
  echo: { time: 0.17, fbMax: 0.85, dark: 3400, wet: 0.7 },
  reverb: { long: 4, wet: 0.9, bright: 6500 },
  glue: { ratio: 4, makeup: 0.7 },
};

// D major pentatonic, A4 .. B6: one note per detent, so turning up climbs and turning down falls
const LADDER = [440, 493.88, 587.33, 659.26, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98, 1760, 1975.53];
const PITCH_BASE = 880;                                // A5 = 0 st
const dbToGain = (db: number) => Math.pow(10, db / 20);
const RANGE = Object.fromEntries(pedals.map((p) => [p.id, { from: p.knob.from as number, to: p.knob.to as number }])) as Record<PedalId, { from: number; to: number }>;
const value = (id: PedalId, t: number) => RANGE[id].from + (RANGE[id].to - RANGE[id].from) * t;
/** the readout's semitone, -12 .. +12 (revfx.ts PITCH fmt) */
const semitone = (t: number) => Math.round(value('pitch', t) * 24 - 12);
const detent = (id: PedalId, t: number) => (id === 'pitch' ? semitone(t) + 12 : Math.min(LADDER.length - 1, Math.floor(t * LADDER.length)));
const noteOf = (id: PedalId, d: number) => (id === 'pitch' ? PITCH_BASE * Math.pow(2, (d - 12) / 12) : LADDER[d]);

type Voice = { input: GainNode; trim: GainNode; knob(t: number): void; apply(): void };

export type ScrollSound = ReturnType<typeof createScrollSound>;

export function createScrollSound(init?: Partial<SoundSettings>) {
  const S: SoundSettings = structuredClone({ ...SOUND_DEFAULTS, ...init });
  let ctx: AudioContext | null = null;
  let voices = {} as Record<PedalId, Voice>;
  let bus: GainNode, tone: BiquadFilterNode, safety: DynamicsCompressorNode, master: GainNode, scene: GainNode, analyser: AnalyserNode;
  let active: PedalId | null = null;
  const knobT = { halo: 0, pitch: 0, echo: 0, reverb: 0, glue: 0 } as Record<PedalId, number>;
  const det = {} as Partial<Record<PedalId, number>>;
  const lastHit = {} as Partial<Record<PedalId, number>>;   // performance.now() of the last detent, per pedal
  let nextFree = 0;                                          // ctx time the next bell may start (runs stay spaced)
  let vis = -1;

  const smooth = (p: AudioParam, v: number, tc = 0.05) => p.setTargetAtTime(v, ctx!.currentTime, tc);

  // ── the bell ────────────────────────────────────────────────────────────────────────────────────────────────────
  /** FM bell: sine carrier, a sine modulator at an inharmonic ratio whose index falls fast (the strike), and a faint
   *  glassy partial. High notes ring shorter and strike softer, so the top of the ladder never gets sharp. */
  function bell(dest: AudioNode, at: number, f: number, vel: number, pan: number) {
    const c = ctx!;
    const car = c.createOscillator(), mod = c.createOscillator(), glass = c.createOscillator();
    const idx = c.createGain(), env = c.createGain(), gg = c.createGain(), p = c.createStereoPanner();
    const tame = Math.min(1, 1100 / f);
    const index = (0.7 + 0.9 * vel) * S.bell.bright * tame;
    car.frequency.value = f; mod.frequency.value = f * S.bell.ratio; glass.frequency.value = f * 2.76;
    idx.gain.setValueAtTime(index * f * S.bell.ratio, at);
    idx.gain.setTargetAtTime(index * 0.08 * f * S.bell.ratio, at, 0.07);
    mod.connect(idx).connect(car.frequency);
    gg.gain.setValueAtTime(0.06 * vel * tame, at);
    gg.gain.setTargetAtTime(0, at, 0.05);
    glass.connect(gg).connect(env);
    car.connect(env).connect(p).connect(dest);
    p.pan.value = Math.max(-1, Math.min(1, pan));
    const ringS = S.bell.decay * Math.pow(880 / f, 0.35);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.32 * vel, at + 0.002);
    env.gain.setTargetAtTime(0, at + 0.002, ringS / 3);
    const end = at + ringS * 2.5 + 0.1;
    [car, mod, glass].forEach((o) => { o.start(at); o.stop(end); });
  }

  // ── the five effects (each pedal's bells go through its own) ────────────────────────────────────────────────────
  function shell() {
    const c = ctx!, input = c.createGain(), trim = c.createGain();
    trim.connect(bus);
    return { input, trim };
  }

  function haloVoice(): Voice {
    const c = ctx!, v = shell();
    const dry = c.createGain(); v.input.connect(dry).connect(v.trim);
    const lines = [{ base: 0.012, rate: 0.9, pan: -1 }, { base: 0.019, rate: 1.31, pan: 1 }].map((l) => {
      const d = c.createDelay(0.05), lfo = c.createOscillator(), depth = c.createGain(), wet = c.createGain(), p = c.createStereoPanner();
      d.delayTime.value = l.base; lfo.frequency.value = l.rate; p.pan.value = l.pan;
      lfo.connect(depth).connect(d.delayTime); lfo.start();
      v.input.connect(d).connect(wet).connect(p).connect(v.trim);
      return { depth, wet };
    });
    let size = 0;
    const set = () => {
      smooth(dry.gain, 1 - 0.35 * size);
      lines.forEach((l) => { smooth(l.depth.gain, (0.1 + size * S.halo.depth) / 1000); smooth(l.wet.gain, size * S.halo.wet); });
    };
    return { ...v, knob(t) { size = value('halo', t); set(); }, apply: set };
  }

  function pitchVoice(): Voice {
    const v = shell();
    v.input.connect(v.trim);
    return { ...v, knob() {}, apply() {} };
  }

  function echoVoice(): Voice {
    const c = ctx!, v = shell();
    v.input.connect(v.trim);
    const wet = c.createGain();
    const mk = (pan: number) => {
      const d = c.createDelay(2), lp = c.createBiquadFilter(), hp = c.createBiquadFilter(), fb = c.createGain(), p = c.createStereoPanner();
      hp.type = 'highpass'; hp.frequency.value = 300; p.pan.value = pan;
      d.connect(lp).connect(hp).connect(fb);
      d.connect(p).connect(wet);
      return { d, lp, fb };
    };
    const L = mk(-0.8), R = mk(0.8);
    L.fb.connect(R.d); R.fb.connect(L.d);               // ping-pong: each side feeds the other
    v.input.connect(L.d);
    wet.connect(v.trim);
    let fb = 0;
    const set = () => {
      [L, R].forEach((x) => { smooth(x.d.delayTime, S.echo.time, 0.1); smooth(x.lp.frequency, S.echo.dark); smooth(x.fb.gain, Math.min(fb, 0.95) * (S.echo.fbMax / 0.92)); });
      smooth(wet.gain, S.echo.wet);
    };
    return { ...v, knob(t) { fb = value('echo', t); set(); }, apply: set };
  }

  function reverbVoice(): Voice {
    const c = ctx!, v = shell();
    const dry = c.createGain(); dry.gain.value = 0.8; v.input.connect(dry).connect(v.trim);
    const wet = c.createGain(); wet.connect(v.trim);
    const rts = () => [0.5, 1.6, S.reverb.long];
    const rooms = rts().map(() => {
      const cv = c.createConvolver(), g = c.createGain();
      cv.normalize = false; v.input.connect(cv).connect(g).connect(wet); g.gain.value = 0;
      return { cv, g };
    });
    const build = () => rts().forEach((rt, i) => { rooms[i].cv.buffer = impulse(c, rt, S.reverb.bright); });
    build();
    let x = 0, builtWith = `${S.reverb.long}|${S.reverb.bright}`;
    const set = () => {
      rooms.forEach((r, i) => { const d = Math.abs(x - i); smooth(r.g.gain, d >= 1 ? 0 : Math.cos(d * Math.PI / 2), 0.08); });
      smooth(wet.gain, S.reverb.wet * (0.4 + 0.3 * x));
    };
    return {
      ...v,
      knob(t) { x = t * 2; set(); },    // DECAY 5 % .. 100 % = short room .. longest room
      apply() {
        const key = `${S.reverb.long}|${S.reverb.bright}`;
        if (key !== builtWith) { builtWith = key; build(); }
        set();
      },
    };
  }

  function glueVoice(): Voice {
    const c = ctx!, v = shell();
    const comp = c.createDynamicsCompressor(), makeup = c.createGain();
    comp.knee.value = 3; comp.attack.value = 0.001; comp.release.value = 0.25;
    v.input.connect(comp).connect(makeup).connect(v.trim);
    let thr = 0;
    const set = () => {
      smooth(comp.threshold, thr);
      smooth(comp.ratio, S.glue.ratio);
      smooth(makeup.gain, dbToGain(-thr * (1 - 1 / S.glue.ratio) * 0.5 * S.glue.makeup));
    };
    return { ...v, knob(t) { thr = value('glue', t) * 40 - 40; set(); }, apply: set };   // the readout's dB
  }

  /** a stereo room: decorrelated noise under an exponential decay that also darkens as it dies, 12 ms predelay,
   *  scaled to a common energy so the three rooms crossfade at one loudness */
  function impulse(c: BaseAudioContext, rt: number, bright: number): AudioBuffer {
    const sr = c.sampleRate, pre = Math.round(0.012 * sr), len = pre + Math.round(rt * 1.3 * sr);
    const buf = c.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let y = 0, e = 0;
      for (let i = pre; i < len; i++) {
        const t = (i - pre) / sr;
        const a = 1 - Math.exp(-2 * Math.PI * (bright * Math.exp(-t * 2.2 / rt) + 300) / sr);   // cutoff falls with the tail
        y += a * ((Math.random() * 2 - 1) - y);
        d[i] = y * Math.exp(-6.91 * t / rt);
        e += d[i] * d[i];
      }
      const k = 0.35 / Math.sqrt(e || 1);
      for (let i = pre; i < len; i++) d[i] *= k;
    }
    return buf;
  }

  // ── ringing ─────────────────────────────────────────────────────────────────────────────────────────────────────
  /** detents from -> to were crossed: ring the last few as a quick run, louder + brighter the faster the scroll */
  function ring(id: PedalId, from: number, to: number) {
    const c = ctx!, now = performance.now();
    const steps = Math.abs(to - from), dir = Math.sign(to - from);
    const perSec = steps / (Math.max(16, now - (lastHit[id] ?? now - 500)) / 1000);
    lastHit[id] = now;
    const vel = Math.min(1, 0.55 + S.speed * 0.45 * Math.min(1, perSec / 14));
    const run = Math.min(3, steps);
    let at = Math.max(c.currentTime + 0.005, nextFree);
    if (at > c.currentTime + 0.15) return;               // a backlog: drop, the next detent rings fresh
    const top = id === 'pitch' ? 24 : LADDER.length - 1;
    for (let k = run - 1; k >= 0; k--) {
      const d = to - dir * k;
      const pan = (d / top - 0.5) * 0.6 + (Math.random() - 0.5) * 0.2;   // low notes a little left, high a little right
      bell(voices[id].input, at, noteOf(id, d), vel * (k ? 0.8 : 1), pan);
      at += 0.028;
    }
    nextFree = at;
  }

  function applyAll() {
    if (!ctx) return;
    smooth(master.gain, dbToGain(S.master), 0.1);
    smooth(tone.frequency, S.tone, 0.1);
    (Object.keys(voices) as PedalId[]).forEach((id) => { smooth(voices[id].trim.gain, dbToGain(S.level[id]), 0.1); voices[id].apply(); });
  }

  return {
    settings: S,
    get running() { return !!ctx && ctx.state === 'running'; },
    get analyser() { return analyser; },
    get context() { return ctx; },
    /** call from a click / key handler (autoplay rules) */
    async start() {
      if (!ctx) {
        ctx = new AudioContext({ latencyHint: 'interactive' });
        const c = ctx;
        bus = c.createGain(); tone = c.createBiquadFilter(); safety = c.createDynamicsCompressor();
        master = c.createGain(); scene = c.createGain(); analyser = c.createAnalyser();
        tone.frequency.value = S.tone; tone.Q.value = 0.4;
        safety.threshold.value = -10; safety.ratio.value = 12; safety.knee.value = 3; safety.attack.value = 0.002; safety.release.value = 0.2;
        scene.gain.value = 0; master.gain.value = dbToGain(S.master);
        analyser.fftSize = 2048;
        bus.connect(tone).connect(safety).connect(master).connect(scene).connect(analyser).connect(c.destination);
        voices = { halo: haloVoice(), pitch: pitchVoice(), echo: echoVoice(), reverb: reverbVoice(), glue: glueVoice() };
        (Object.keys(voices) as PedalId[]).forEach((id) => voices[id].knob(knobT[id]));
        applyAll();
      }
      await ctx.resume();
    },
    /** fade out and suspend */
    async stop() {
      if (!ctx) return;
      scene.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      await new Promise((r) => setTimeout(r, 350));
      await ctx.suspend();
    },
    /** the pedal on stage (null = none); a new one swinging in gets a soft chime */
    setActive(id: PedalId | null) {
      if (id === active) return;
      active = id;
      if (!id || !ctx || ctx.state !== 'running' || S.arrive <= 0) return;
      const d = detent(id, knobT[id]), at = Math.max(ctx.currentTime + 0.01, nextFree);
      const top = id === 'pitch' ? 24 : LADDER.length - 1;
      const up = Math.min(top, d + (id === 'pitch' ? 7 : 2));   // a fifth above (2 ladder steps = a fifth or so)
      bell(voices[id].input, at, noteOf(id, d), 0.5 * S.arrive, -0.15);
      bell(voices[id].input, at + 0.09, noteOf(id, up), 0.42 * S.arrive, 0.15);
      nextFree = at + 0.12;
    },
    /** the knob's place, 0..1 (pedals.ts setKnob's t): crossing a detent on the pedal on stage rings it */
    setKnob(id: PedalId, t: number) {
      t = Math.max(0, Math.min(1, t));
      knobT[id] = t;
      if (ctx) voices[id].knob(t);
      const d = detent(id, t), was = det[id];
      det[id] = d;
      if (was === undefined || d === was || id !== active || !ctx || ctx.state !== 'running') return;
      ring(id, was, d);
    },
    /** how much of the stage is on screen, 0..1 */
    setVisible(v: number) {
      v = Math.max(0, Math.min(1, v));
      if (ctx && Math.abs(v - vis) > 0.01) { vis = v; smooth(scene.gain, v, 0.15); }
    },
    /** merge new settings in (top-level keys replace) and apply them live */
    set(next: Partial<SoundSettings>) { Object.assign(S, structuredClone(next)); applyAll(); },
  };
}
