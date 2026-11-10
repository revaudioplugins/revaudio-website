/**
 * #pedals sound: a quiet bed per pedal that follows its knob, so the scroll is heard as well as seen (Yoni 2026-11-10:
 * "subtle sound effects ... just to give the atmosphere, that go according to the knob position"). Nothing here is a
 * recording: every voice is Web Audio oscillators and noise, so it weighs nothing and stays clean at any setting.
 * One clock (120 bpm = the glue screen's two hits a second) and one key (D major), so moving between pedals stays
 * musical. The knob's value is mapped through the same from / to as the readout (src/data/revfx.ts pedals).
 *
 *   HALO   SIZE       a soft pad chord through a two-line stereo ensemble: narrow and still at 0, wide and moving at 100 %
 *   PITCH  ±12 st     a keys arpeggio (or one held pad note) moved by the readout's semitone, -12 .. +12
 *   ECHO   FEEDBACK   one keys note a bar into a dark ping-pong dotted 8th; the knob is the loop gain (8 .. 92 %)
 *   REVERB DECAY      a keys chord a bar into three generated rooms (short / mid / long), crossfaded by the knob
 *   GLUE   THRESHOLD  a soft four-on-the-floor into a compressor whose threshold is the knob (0 .. -32 dB), auto makeup
 *
 * Bench stage: tools/rfxsound drives it (/__rfxsound, dev only); the page does not import it yet. Audio can only start
 * from a user gesture, so start() must be called from a click / key handler.
 */
import { pedals, type PedalId } from '../../data/revfx';

export interface SoundSettings {
  master: number;   // dB, the whole bed
  tone: number;     // Hz, master low-pass
  idle: number;     // 0..1, level while the scroll rests (1 = always on while the stage is on screen, 0 = only while scrolling)
  hold: number;     // s at full level after the last scroll
  xfade: number;    // s, pedal to pedal
  bpm: number;
  level: Record<PedalId, number>;   // dB trim per voice
  halo: { depth: number; wet: number };                       // ms of delay sweep at 100 %, ensemble level at 100 %
  pitch: { voice: 'keys' | 'pad'; glide: number };            // pad = one held note that glides (s)
  echo: { fbMax: number; dark: number; wet: number };         // loop gain at 92 % (safety cap), loop low-pass Hz, repeats level
  reverb: { long: number; wet: number; bright: number };      // long room's decay s, wet at 100 %, room brightness Hz
  glue: { ratio: number; makeup: number; hats: number };      // makeup 0..1 of the gain reduction, hats level 0..1
}

export const SOUND_DEFAULTS: SoundSettings = {
  master: -27, tone: 6500, idle: 0.55, hold: 1.2, xfade: 0.7, bpm: 120,
  level: { halo: -3, pitch: 2, echo: 4, reverb: 5, glue: -6 },   // evens the five out (bench check 2026-11-10)
  halo: { depth: 3.5, wet: 0.9 },
  pitch: { voice: 'keys', glide: 0.08 },
  echo: { fbMax: 0.85, dark: 2600, wet: 0.7 },
  reverb: { long: 4.5, wet: 1, bright: 5200 },
  glue: { ratio: 4, makeup: 0.7, hats: 0.35 },
};

const ROOT = 146.83;                                   // D3
const hz = (semi: number) => ROOT * Math.pow(2, semi / 12);
const dbToGain = (db: number) => Math.pow(10, db / 20);
// D · Bm · G · A, two bars each (semitones from D3); every voice plays over the same changes
const CHORDS = [[0, 7, 11, 16], [-3, 4, 7, 12], [-7, 4, 9, 14], [-5, 2, 7, 11]];
const ARP = [0, 1, 2, 3, 2, 1, -1, -1];                // per 8th, chord-tone index, -1 = rest
const RANGE = Object.fromEntries(pedals.map((p) => [p.id, { from: p.knob.from as number, to: p.knob.to as number }])) as Record<PedalId, { from: number; to: number }>;

type Voice = {
  input: GainNode;           // what the notes play into
  out: GainNode;             // pedal crossfade
  trim: GainNode;            // per-voice level
  knob(t: number): void;     // t 0..1 (the scroll), mapped to the readout's value inside
  step(s: number, at: number, first: boolean): void;  // s = 8th-note index, at = its time
  apply(): void;             // settings changed
  leave?(at: number): void;
};

export type ScrollSound = ReturnType<typeof createScrollSound>;

export function createScrollSound(init?: Partial<SoundSettings>) {
  const S: SoundSettings = structuredClone({ ...SOUND_DEFAULTS, ...init });
  let ctx: AudioContext | null = null;
  let voices = {} as Record<PedalId, Voice>;
  let bus: GainNode, tone: BiquadFilterNode, safety: DynamicsCompressorNode, master: GainNode, scene: GainNode, analyser: AnalyserNode;
  let noise: AudioBuffer;
  let active: PedalId | null = null;
  let fresh = true;                      // the active voice has not played yet (a pad starts mid-phrase at once)
  const knobT = { halo: 0, pitch: 0, echo: 0, reverb: 0, glue: 0 } as Record<PedalId, number>;
  let visible = 0, lastPoke = -1e9, sceneLevel = -1;
  let timer = 0, nextStep = 0, stepIdx = 0;

  const eighth = () => 30 / S.bpm;
  const chordAt = (s: number) => CHORDS[Math.floor(s / 16) % CHORDS.length];

  // ── instruments ─────────────────────────────────────────────────────────────────────────────────────────────────
  /** a soft tine: sine carrier, one sine modulator whose index falls fast (the attack's bell), a quiet octave */
  function keys(dest: AudioNode, at: number, f: number, vel: number, dur = 1.4) {
    const c = ctx!;
    const car = c.createOscillator(), mod = c.createOscillator(), oct = c.createOscillator();
    const idx = c.createGain(), env = c.createGain(), og = c.createGain();
    car.frequency.value = f; mod.frequency.value = f; oct.frequency.value = f * 2;
    idx.gain.setValueAtTime(f * 1.1, at);
    idx.gain.setTargetAtTime(f * 0.12, at, 0.09);
    mod.connect(idx).connect(car.frequency);
    og.gain.value = 0.07;
    oct.connect(og).connect(env);
    car.connect(env).connect(dest);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(vel, at + 0.006);
    env.gain.setTargetAtTime(0, at + 0.006, dur / 4);
    const end = at + dur + 0.2;
    [car, mod, oct].forEach((o) => { o.start(at); o.stop(end); });
  }
  /** a pad note: two triangles a few cents apart, low-passed, slow in and out */
  function pad(dest: AudioNode, at: number, f: number, vel: number, dur: number, attack = 1.1) {
    const c = ctx!;
    const env = c.createGain(), lp = c.createBiquadFilter();
    lp.frequency.value = Math.min(2400, f * 6); lp.Q.value = 0.3;
    lp.connect(env).connect(dest);
    [-6, 6].forEach((cents) => {
      const o = c.createOscillator();
      o.type = 'triangle'; o.frequency.value = f; o.detune.value = cents;
      o.connect(lp); o.start(at); o.stop(at + dur + 2);
    });
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(vel, at + attack);
    env.gain.setValueAtTime(vel, at + dur);
    env.gain.setTargetAtTime(0, at + dur, 0.45);
  }
  function kick(dest: AudioNode, at: number, vel: number) {
    const c = ctx!, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(120, at);
    o.frequency.exponentialRampToValueAtTime(48, at + 0.09);
    g.gain.setValueAtTime(vel, at);
    g.gain.setTargetAtTime(0, at + 0.01, 0.07);
    o.connect(g).connect(dest); o.start(at); o.stop(at + 0.5);
  }
  function hiss(dest: AudioNode, at: number, vel: number, type: BiquadFilterType, f: number, q: number, decay: number, pan = 0) {
    const c = ctx!, src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(), p = c.createStereoPanner();
    src.buffer = noise; bp.type = type; bp.frequency.value = f; bp.Q.value = q; p.pan.value = pan;
    g.gain.setValueAtTime(vel, at);
    g.gain.setTargetAtTime(0, at + 0.002, decay);
    src.connect(bp).connect(g).connect(p).connect(dest);
    src.start(at, Math.random() * 0.5); src.stop(at + decay * 8);
  }
  function bass(dest: AudioNode, at: number, f: number, vel: number, dur: number) {
    const c = ctx!, o = c.createOscillator(), g = c.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vel, at + 0.01);
    g.gain.setTargetAtTime(0, at + dur * 0.6, dur / 4);
    o.connect(g).connect(dest); o.start(at); o.stop(at + dur * 2);
  }

  // ── the five voices ─────────────────────────────────────────────────────────────────────────────────────────────
  function shell(): Pick<Voice, 'input' | 'out' | 'trim'> {
    const c = ctx!, input = c.createGain(), trim = c.createGain(), out = c.createGain();
    out.gain.value = 0;
    trim.connect(out).connect(bus);
    return { input, trim, out };
  }
  const smooth = (p: AudioParam, v: number, tc = 0.05) => p.setTargetAtTime(v, ctx!.currentTime, tc);

  function haloVoice(): Voice {
    const c = ctx!, v = shell();
    const dry = c.createGain(); v.input.connect(dry).connect(v.trim);
    const lines = [{ base: 0.014, rate: 0.31, pan: -1 }, { base: 0.021, rate: 0.47, pan: 1 }].map((l) => {
      const d = c.createDelay(0.05), lfo = c.createOscillator(), depth = c.createGain(), wet = c.createGain(), p = c.createStereoPanner();
      d.delayTime.value = l.base; lfo.frequency.value = l.rate; p.pan.value = l.pan;
      lfo.connect(depth).connect(d.delayTime); lfo.start();
      v.input.connect(d).connect(wet).connect(p).connect(v.trim);
      return { depth, wet };
    });
    let size = 0;
    const set = () => {
      smooth(dry.gain, 1 - 0.3 * size);
      lines.forEach((l) => { smooth(l.depth.gain, (0.15 + size * S.halo.depth) / 1000); smooth(l.wet.gain, size * S.halo.wet); });
    };
    return {
      ...v,
      knob(t) { size = RANGE.halo.from + (RANGE.halo.to - RANGE.halo.from) * t; set(); },
      apply: set,
      step(s, at, first) {
        if (s % 16 && !first) return;
        const left = 16 - (s % 16);                     // 8ths to the next chord
        chordAt(s).forEach((n) => pad(v.input, at, hz(n), 0.11, left * eighth() + 0.3, first ? 0.5 : 1.1));
      },
    };
  }

  function pitchVoice(): Voice {
    const c = ctx!, v = shell();
    v.input.connect(v.trim);
    let st = 0, held: { o: OscillatorNode[]; env: GainNode } | null = null;
    const semi = () => st;
    const startHeld = (at: number) => {
      const env = c.createGain(), lp = c.createBiquadFilter();
      lp.frequency.value = 1800; lp.Q.value = 0.3; lp.connect(env).connect(v.input);
      const o = [-5, 5].map((cents) => {
        const x = c.createOscillator(); x.type = 'triangle'; x.detune.value = cents; x.frequency.value = hz(12 + semi());
        x.connect(lp); x.start(at); return x;
      });
      env.gain.setValueAtTime(0, at); env.gain.linearRampToValueAtTime(0.16, at + 0.4);
      held = { o, env };
    };
    const stopHeld = (at: number) => {
      if (!held) return;
      held.env.gain.setTargetAtTime(0, at, 0.3);
      held.o.forEach((x) => x.stop(at + 2));
      held = null;
    };
    const retune = () => held?.o.forEach((x) => x.frequency.setTargetAtTime(hz(12 + semi()), c.currentTime, Math.max(0.005, S.pitch.glide / 3)));
    return {
      ...v,
      knob(t) {
        const val = RANGE.pitch.from + (RANGE.pitch.to - RANGE.pitch.from) * t;
        const next = Math.round(val * 24 - 12);          // the readout's semitone (revfx.ts PITCH fmt)
        if (next !== st) { st = next; retune(); }
      },
      apply() { if (S.pitch.voice === 'keys') stopHeld(c.currentTime); },
      leave(at) { stopHeld(at + S.xfade); },
      step(s, at) {
        if (S.pitch.voice === 'pad') {
          if (!held) startHeld(at);
          return;
        }
        const k = ARP[s % 8];
        if (k < 0) return;
        const n = chordAt(s)[k] + 12;
        keys(v.input, at, hz(n + semi()), 0.16 - (s % 8) * 0.012, 0.9);
      },
    };
  }

  function echoVoice(): Voice {
    const c = ctx!, v = shell();
    const dry = c.createGain(); dry.gain.value = 0.8; v.input.connect(dry).connect(v.trim);
    const wet = c.createGain();
    const mk = (pan: number) => {
      const d = c.createDelay(2), lp = c.createBiquadFilter(), hp = c.createBiquadFilter(), fb = c.createGain(), p = c.createStereoPanner();
      hp.type = 'highpass'; hp.frequency.value = 220; p.pan.value = pan;
      d.connect(lp).connect(hp).connect(fb);
      d.connect(p).connect(wet);
      return { d, lp, fb };
    };
    const L = mk(-0.75), R = mk(0.75);
    L.fb.connect(R.d); R.fb.connect(L.d);               // ping-pong: each side feeds the other
    v.input.connect(L.d);
    wet.connect(v.trim);
    const wob = c.createOscillator(), wobG = c.createGain();
    wob.frequency.value = 0.5; wobG.gain.value = 0.0006; wob.connect(wobG); wobG.connect(L.d.delayTime); wobG.connect(R.d.delayTime); wob.start();
    let fb = 0;
    const set = () => {
      const time = eighth() * 1.5;                       // dotted 8th
      [L, R].forEach((x) => { smooth(x.d.delayTime, time, 0.2); smooth(x.lp.frequency, S.echo.dark); smooth(x.fb.gain, Math.min(fb, 0.95) * (S.echo.fbMax / 0.92)); });
      smooth(wet.gain, S.echo.wet);
    };
    return {
      ...v,
      knob(t) { fb = RANGE.echo.from + (RANGE.echo.to - RANGE.echo.from) * t; set(); },
      apply: set,
      step(s, at, first) {
        if (s % 8 && !first) return;                      // a bar line, or at once on arrival
        const ch = chordAt(s);
        keys(v.input, at, hz(ch[3] + 12), 0.2, 0.7);
      },
    };
  }

  function reverbVoice(): Voice {
    const c = ctx!, v = shell();
    const dry = c.createGain(); dry.gain.value = 0.7; v.input.connect(dry).connect(v.trim);
    const wet = c.createGain(); wet.connect(v.trim);
    const rooms = [0.45, 1.6, S.reverb.long].map(() => {
      const cv = c.createConvolver(), g = c.createGain();
      cv.normalize = false; v.input.connect(cv).connect(g).connect(wet); g.gain.value = 0;
      return { cv, g };
    });
    const build = () => { [0.45, 1.6, S.reverb.long].forEach((rt, i) => { rooms[i].cv.buffer = impulse(c, rt, S.reverb.bright); }); };
    build();
    let decay = 0, builtWith = `${S.reverb.long}|${S.reverb.bright}`;
    const set = () => {
      const x = Math.max(0, Math.min(1, (decay - RANGE.reverb.from) / (RANGE.reverb.to - RANGE.reverb.from))) * 2;
      rooms.forEach((r, i) => { const d = Math.abs(x - i); smooth(r.g.gain, d >= 1 ? 0 : Math.cos(d * Math.PI / 2), 0.08); });
      smooth(wet.gain, S.reverb.wet * (0.45 + 0.55 * x / 2));
    };
    return {
      ...v,
      knob(t) { decay = RANGE.reverb.from + (RANGE.reverb.to - RANGE.reverb.from) * t; set(); },
      apply() {
        const key = `${S.reverb.long}|${S.reverb.bright}`;
        if (key !== builtWith) { builtWith = key; build(); }
        set();
      },
      step(s, at, first) {
        if (s % 8 && !first) return;                      // a bar line, or at once on arrival
        chordAt(s).slice(1).forEach((n, i) => keys(v.input, at + i * 0.012, hz(n + 12), 0.1, 0.45));
      },
    };
  }

  function glueVoice(): Voice {
    const c = ctx!, v = shell();
    const comp = c.createDynamicsCompressor(), makeup = c.createGain();
    comp.knee.value = 4; comp.attack.value = 0.008; comp.release.value = 0.14;
    v.input.connect(comp).connect(makeup).connect(v.trim);
    let thr = 0;
    const set = () => {
      smooth(comp.threshold, thr);
      smooth(comp.ratio, S.glue.ratio);
      smooth(makeup.gain, dbToGain(-thr * (1 - 1 / S.glue.ratio) * 0.5 * S.glue.makeup));
    };
    return {
      ...v,
      knob(t) { const val = RANGE.glue.from + (RANGE.glue.to - RANGE.glue.from) * t; thr = val * 40 - 40; set(); },  // the readout's dB
      apply: set,
      step(s, at) {
        const b = s % 8, ch = chordAt(s);
        if (b % 2 === 0) kick(v.input, at, 0.9);
        if (b === 2 || b === 6) hiss(v.input, at, 0.22, 'bandpass', 1700, 0.9, 0.05);
        if (b % 2 === 1) hiss(v.input, at, 0.12 * S.glue.hats, 'highpass', 7500, 0.7, 0.018, b === 3 || b === 7 ? 0.3 : -0.3);
        if (b === 0 || b === 3) bass(v.input, at, hz(ch[0] - 12), 0.3, eighth() * (b ? 1 : 2.5));
        if (b === 0) ch.slice(1).forEach((n) => keys(v.input, at, hz(n + 12), 0.06, 0.6));
      },
    };
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
        const f = bright * Math.exp(-t * 2.2 / rt) + 300;            // cutoff falls with the tail
        const a = 1 - Math.exp(-2 * Math.PI * f / sr);
        y += a * ((Math.random() * 2 - 1) - y);
        d[i] = y * Math.exp(-6.91 * t / rt);
        e += d[i] * d[i];
      }
      const k = 0.35 / Math.sqrt(e || 1);
      for (let i = pre; i < len; i++) d[i] *= k;
    }
    return buf;
  }

  // ── clock + scene ───────────────────────────────────────────────────────────────────────────────────────────────
  function tick() {
    if (!ctx) return;
    const now = ctx.currentTime;
    while (nextStep < now + 0.12) {
      if (active) { voices[active].step(stepIdx, Math.max(nextStep, now + 0.005), fresh); fresh = false; }
      nextStep += eighth(); stepIdx++;
    }
    const scrolling = performance.now() - lastPoke < S.hold * 1000;
    const lvl = visible * (scrolling ? 1 : S.idle);
    if (Math.abs(lvl - sceneLevel) > 0.005) { sceneLevel = lvl; scene.gain.setTargetAtTime(lvl, now, scrolling ? 0.12 : 0.6); }
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
        ctx = new AudioContext({ latencyHint: 'playback' });
        const c = ctx;
        noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        bus = c.createGain(); tone = c.createBiquadFilter(); safety = c.createDynamicsCompressor();
        master = c.createGain(); scene = c.createGain(); analyser = c.createAnalyser();
        tone.frequency.value = S.tone; tone.Q.value = 0.4;
        safety.threshold.value = -10; safety.ratio.value = 12; safety.knee.value = 3; safety.attack.value = 0.003; safety.release.value = 0.2;
        scene.gain.value = 0; master.gain.value = dbToGain(S.master);
        analyser.fftSize = 2048;
        bus.connect(tone).connect(safety).connect(master).connect(scene).connect(analyser).connect(c.destination);
        voices = { halo: haloVoice(), pitch: pitchVoice(), echo: echoVoice(), reverb: reverbVoice(), glue: glueVoice() };
        (Object.keys(voices) as PedalId[]).forEach((id) => voices[id].knob(knobT[id]));
        applyAll();
        if (active) voices[active].out.gain.value = 1;
        nextStep = c.currentTime + 0.05;
      }
      await ctx.resume();
      if (!timer) timer = window.setInterval(tick, 25);
    },
    /** fade out and suspend (start() again resumes where the clock is) */
    async stop() {
      if (!ctx) return;
      scene.gain.setTargetAtTime(0, ctx.currentTime, 0.08); sceneLevel = 0;
      await new Promise((r) => setTimeout(r, 350));
      clearInterval(timer); timer = 0;
      await ctx.suspend();
    },
    /** the pedal on stage (null = none) */
    setActive(id: PedalId | null) {
      if (id === active) return;
      const prev = active; active = id; fresh = true;
      if (!ctx) return;
      const at = ctx.currentTime, tc = Math.max(0.02, S.xfade / 3);
      if (prev) { voices[prev].out.gain.setTargetAtTime(0, at, tc); voices[prev].leave?.(at); }
      if (id) voices[id].out.gain.setTargetAtTime(1, at, tc);
    },
    /** the knob's place, 0..1 (pedals.ts setKnob's t) */
    setKnob(id: PedalId, t: number) {
      knobT[id] = Math.max(0, Math.min(1, t));
      if (ctx) voices[id].knob(knobT[id]);
    },
    /** how much of the stage is on screen, 0..1 */
    setVisible(v: number) { visible = Math.max(0, Math.min(1, v)); },
    /** the visitor scrolled */
    poke() { lastPoke = performance.now(); },
    /** merge new settings in (top-level keys replace) and apply them live */
    set(next: Partial<SoundSettings>) { Object.assign(S, structuredClone(next)); applyAll(); },
  };
}
