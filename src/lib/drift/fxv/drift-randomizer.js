/* Verbatim copy of DRIFT 5.2.4 Source/ui/public/js/drift-randomizer.js (Drift main b2b187b): the plugin's own seeded
 * RANDOMIZE engine, run by the /drift #fx rack (src/lib/drift/rack.ts). Re-copy when the plugin engine changes; never edit here. */
/* ═══ DRIFT SMART FX RANDOMIZER — engine ═══════════════════════════════════════════════════════
 * One pure, seeded function: roll(opts) -> a complete FX-panel state for PITCH / ECHO / REVERB /
 * HALO (+ sometimes the chain order). No DOM, no globals, no Math.random: the same seed and the
 * same context always give the same values. The same file runs in node (tests, render QA), in the
 * bench and in the plugin page (window.DriftRandomizer).
 *
 * Pipeline per roll:  mode (MUSICAL ~88% / EXTREME ~12%) -> personality (a curated scene) ->
 *   which strips play -> per-strip recipe (weighted zones, not flat random) -> relationship rules
 *   -> wet budget -> predicted level vs the plugin at defaults -> fix or re-roll -> output.
 *
 * Never written: AUTOTUNE (AT_*), FX_MIX / BYP_FX (they scale the autotune wet), saturation, OS,
 * band, pan, tracks, auto-drift, the retired TREM_* ids (5.1: TREMOLO left DRIFT, HALO took its
 * strip + chain slot ORD_TREM). With AUTOTUNE on, the PITCH strip is frozen too: PITCH_ST / FORMANT_ST /
 * PITCH_MIX / BYP_PITCH all feed the autotuned voice (measured +3.7 / +2.0 / +1.2 dB).
 * The C++ native re-checks all of this; the engine is not the only guard.
 * ════════════════════════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DriftRandomizer = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '1.3.0';   // 1.3.0 (DRIFT 5.1): the TREM strip is now HALO - every seed rolls a new scene
  const STRIPS = ['PITCH', 'ECHO', 'REVERB', 'HALO'];
  const DEFAULT_ORDER = ['PITCH', 'ECHO', 'REVERB', 'HALO'];       // = ORD_* defaults 0/1/2/3
  const ORD_ID = { PITCH: 'ORD_PITCH', ECHO: 'ORD_ECHO', REVERB: 'ORD_VERB', HALO: 'ORD_TREM' };   // ORD_TREM = HALO's slot (id kept)
  const BYP_ID = { PITCH: 'BYP_PITCH', ECHO: 'BYP_DLY', REVERB: 'BYP_VERB', HALO: 'BYP_HALO' };

  // ── parameter table: APVTS id -> range, host (pedalboard) name, strip ─────────────────────────
  const DIVS = ['1/1', '1/1.', '1/1t', '1/2', '1/2.', '1/2t', '1/4', '1/4.', '1/4t',
                '1/8', '1/8.', '1/8t', '1/16', '1/16.', '1/16t', '1/32', '1/32.', '1/32t'];
  const VERB_BEATS = ['1/4', '1/2', '1', '2', '3', '4', '6', '8'];
  const HALO_MODES = ['1', '2', '3', '4'];                          // = HALO_MODE choices (index = drift_halo::kModes)

  const f01 = (pb, strip) => ({ kind: 'float', min: 0, max: 1, pb, strip });
  const PARAMS = {
    PITCH_ST:      { kind: 'float', min: -12, max: 12, step: 1, pb: 'pitch', strip: 'PITCH' },
    FORMANT_ST:    { kind: 'float', min: -12, max: 12, step: 1, pb: 'formant', strip: 'PITCH' },
    PITCH_MIX:     f01('pitch_mix', 'PITCH'),
    BYP_PITCH:     { kind: 'bool', pb: 'bypass_pitch', strip: 'PITCH' },
    DLY_MODE:      { kind: 'choice', choices: ['Sync', 'Free'], pb: 'echo_time_mode', strip: 'ECHO' },
    DLY_TIME_MS:   { kind: 'float', min: 20, max: 2000, skew: 0.35, step: 0.1, pb: 'echo_time', strip: 'ECHO' },
    DLY_DIV:       { kind: 'choice', choices: DIVS, pb: 'echo_time_division', strip: 'ECHO' },
    DLY_FEEDBACK:  f01('echo_feedback', 'ECHO'),
    DLY_MIX:       f01('echo_mix', 'ECHO'),
    DLY_PINGPONG:  { kind: 'bool', pb: 'echo_ping_pong', strip: 'ECHO' },
    BYP_DLY:       { kind: 'bool', pb: 'bypass_echo', strip: 'ECHO' },
    DLY_CHAR:      f01('echo_character', 'ECHO'),
    DLY_WIDTH:     f01('echo_width', 'ECHO'),
    DLY_MOD:       f01('echo_wobble', 'ECHO'),
    DLY_DUCK:      f01('echo_duck', 'ECHO'),
    VERB_TYPE:     { kind: 'choice', choices: ['Room', 'Plate', 'Hall'], pb: 'reverb_type', strip: 'REVERB' },
    VERB_MIX:      f01('reverb_mix', 'REVERB'),
    VERB_DECAY:    f01('reverb_decay', 'REVERB'),
    VERB_BRIGHT:   f01('reverb_brightness', 'REVERB'),
    VERB_PREDELAY: { kind: 'float', min: 0, max: 200, step: 0.2, pb: 'reverb_predelay', strip: 'REVERB' },
    BYP_VERB:      { kind: 'bool', pb: 'bypass_reverb', strip: 'REVERB' },
    SHIMMER:       f01('shimmer', 'REVERB'),
    VERB_SYNC:     { kind: 'choice', choices: ['Sync', 'Free'], pb: 'reverb_sync', strip: 'REVERB' },
    VERB_PRE_DIV:  { kind: 'choice', choices: DIVS, pb: 'reverb_predelay_division', strip: 'REVERB' },
    VERB_DEC_DIV:  { kind: 'choice', choices: VERB_BEATS, pb: 'reverb_decay_beats', strip: 'REVERB' },
    VERB_DUCK:     f01('reverb_duck', 'REVERB'),
    BYP_HALO:      { kind: 'bool', pb: 'bypass_halo', strip: 'HALO' },          // 5.1 HALO (replaces the TREM_* rows)
    HALO_MIX:      f01('halo_mix', 'HALO'),
    HALO_MODE:     { kind: 'choice', choices: HALO_MODES, pb: 'halo_mode', strip: 'HALO' },
    HALO_SIZE:     f01('halo_size', 'HALO'),
    HALO_TONE:     f01('halo_tone', 'HALO'),
    ORD_PITCH:     { kind: 'int', min: 0, max: 3, pb: 'chain_slot_pitch', strip: 'ORDER' },
    ORD_ECHO:      { kind: 'int', min: 0, max: 3, pb: 'chain_slot_echo', strip: 'ORDER' },
    ORD_VERB:      { kind: 'int', min: 0, max: 3, pb: 'chain_slot_reverb', strip: 'ORDER' },
    ORD_TREM:      { kind: 'int', min: 0, max: 3, pb: 'chain_slot_halo', strip: 'ORDER' },   // 5.1: HALO's slot
  };
  const ALLOWLIST = Object.keys(PARAMS);                                  // the C++ native mirrors this
  const PITCH_IDS = ['PITCH_ST', 'FORMANT_ST', 'PITCH_MIX', 'BYP_PITCH'];
  const NEVER = ['AT_ON', 'AT_KEY', 'AT_SCALE', 'AT_RETUNE', 'AT_HUMANIZE', 'AT_FLEX', 'AT_BAND',
                 // QA30-AT: autotune notes lane appends below this line (append-only law)
                 'AT_NOTE_0', 'AT_NOTE_1', 'AT_NOTE_2', 'AT_NOTE_3', 'AT_NOTE_4', 'AT_NOTE_5',
                 'AT_NOTE_6', 'AT_NOTE_7', 'AT_NOTE_8', 'AT_NOTE_9', 'AT_NOTE_10', 'AT_NOTE_11',   // AT-NOTES 4.30.0: per-note switches are never rolled

                 // QA30-OS: oversampling lane appends below this line (append-only law)

                 // QA31-LFO: FX LFO lane appends below this line (append-only law)

                 // 4.35.0 FX SCENE lane appends below this line (append-only law)
                 'SCENE',   // the live FX snapshot: a roll never switches scenes

                 'FX_MIX', 'BYP_FX',
                 // 5.1: TREMOLO retired - every TREM_* id is inert in the DSP and never written
                 'TREM_MODE', 'TREM_DEPTH', 'TREM_FREE_HZ', 'TREM_DIV', 'BYP_TREM', 'TREM_MIX', 'TREM_WAVE'];

  // ── normalisation (JUCE NormalisableRange semantics: proportion ^ skew) ───────────────────────
  function snap(id, v) {
    const p = PARAMS[id];
    if (p.kind === 'bool') return !!v;
    if (p.kind === 'choice') return typeof v === 'number' ? p.choices[v] : v;
    if (p.kind === 'int') return Math.max(p.min, Math.min(p.max, Math.round(v)));
    let x = Math.max(p.min, Math.min(p.max, v));
    x = p.step ? Math.round(x / p.step) * p.step : Math.round(x * 1000) / 1000;
    return +x.toFixed(p.step && p.step < 1 ? 1 : 3);
  }
  function toNorm(id, v) {
    const p = PARAMS[id];
    if (p.kind === 'bool') return v ? 1 : 0;
    if (p.kind === 'choice') {
      const i = typeof v === 'number' ? v : p.choices.indexOf(v);
      if (i < 0) throw new Error(id + ': unknown choice ' + v);
      return i / (p.choices.length - 1);
    }
    const prop = (v - p.min) / (p.max - p.min);
    const n = p.skew ? Math.pow(Math.max(0, prop), p.skew) : prop;
    return Math.max(0, Math.min(1, n));
  }
  function fromNorm(id, n) {
    const p = PARAMS[id];
    if (p.kind === 'bool') return n >= 0.5;
    if (p.kind === 'choice') return p.choices[Math.round(n * (p.choices.length - 1))];
    const prop = p.skew ? Math.pow(n, 1 / p.skew) : n;
    return snap(id, p.min + prop * (p.max - p.min));
  }

  // tempo helpers (the host tempo is unknown to the page: stay on divisions that never clamp)
  function divBeats(div) {                        // beats per cycle; DIV_HZ in the DSP is 1/this
    const base = { '1/1': 4, '1/2': 2, '1/4': 1, '1/8': 0.5, '1/16': 0.25, '1/32': 0.125 }[div.replace(/[.t]$/, '')];
    if (div.endsWith('.')) return base * 1.5;
    if (div.endsWith('t')) return base * 2 / 3;
    return base;
  }
  const divMs = (div, bpm) => divBeats(div) * 60000 / (bpm || 120);

  // ── seeded RNG (mulberry32) + weighted helpers ────────────────────────────────────────────────
  function makeRng(seed) {
    let a = seed >>> 0;
    const r = () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.chance = (p) => r() < p;
    // weighted pick: [[weight, value], ...]
    r.pick = (items) => {
      let tot = 0; for (const it of items) tot += it[0];
      let x = r() * tot;
      for (const it of items) { x -= it[0]; if (x < 0) return it[1]; }
      return items[items.length - 1][1];
    };
    // weighted zones: [[weight, lo, hi], ...] -> uniform inside the chosen zone. The zone table IS
    // the per-parameter musical distribution: sweet spot heavy, stronger zone lighter, edges rare.
    r.zone = (zones) => { const z = r.pick(zones.map((q) => [q[0], q])); return r.range(z[1], z[2]); };
    return r;
  }

  // ── recipes: one strip each, returns plain-unit values ───────────────────────────────────────
  // Every recipe writes EVERY owned id of its strip, so a roll fully defines the panel.
  const ECHO_BASE = (r, o) => {
    const div = o.div;
    return {
      DLY_MODE: o.free ? 'Free' : 'Sync',
      DLY_DIV: div,
      // Free-mode time mirrors the division at 120 BPM so flipping SYNC->FREE keeps the feel.
      DLY_TIME_MS: o.free ? o.ms : divMs(div, 120),
      DLY_FEEDBACK: o.fb, DLY_MIX: o.mix, DLY_PINGPONG: !!o.pp,
      DLY_CHAR: o.char, DLY_WIDTH: o.width == null ? 1 : o.width, DLY_MOD: o.mod, DLY_DUCK: o.duck,
    };
  };
  const ECHO = {
    slap: (r) => ECHO_BASE(r, { free: true, ms: r.zone([[.6, 75, 120], [.3, 120, 160], [.1, 55, 75]]), div: '1/16',
      fb: r.zone([[.7, .05, .2], [.3, .2, .3]]), mix: r.zone([[.6, .18, .27], [.3, .27, .32], [.1, .13, .18]]),
      char: r.range(.25, .8), width: r.range(.5, .9), mod: r.zone([[.6, 0, .15], [.4, .15, .3]]), duck: r.range(0, .25) }),
    dotted: (r) => ECHO_BASE(r, { div: r.pick([[.8, '1/8.'], [.2, '1/4.']]),
      fb: r.zone([[.6, .3, .45], [.3, .45, .55], [.1, .2, .3]]), mix: r.zone([[.6, .16, .24], [.3, .24, .29], [.1, .12, .16]]),
      pp: r.chance(.45), char: r.range(.45, 1), width: r.range(.8, 1), mod: r.range(0, .2), duck: r.zone([[.5, .2, .45], [.5, 0, .2]]) }),
    dub: (r) => ECHO_BASE(r, { div: r.pick([[.5, '1/4'], [.35, '1/4.'], [.15, '1/8.']]),
      fb: r.zone([[.6, .42, .55], [.3, .55, .62], [.1, .3, .42]]), mix: r.zone([[.6, .14, .21], [.3, .21, .26], [.1, .11, .14]]),
      pp: r.chance(.3), char: r.zone([[.7, 0, .35], [.3, .35, .6]]), width: r.range(.7, 1),
      mod: r.zone([[.5, .2, .45], [.3, .45, .65], [.2, 0, .2]]), duck: r.zone([[.6, .3, .6], [.4, .1, .3]]) }),
    ping: (r) => ECHO_BASE(r, { div: r.pick([[.4, '1/8'], [.35, '1/8.'], [.25, '1/4']]), pp: true,
      fb: r.zone([[.6, .3, .45], [.3, .45, .55], [.1, .2, .3]]), mix: r.zone([[.6, .18, .25], [.3, .25, .3], [.1, .14, .18]]),
      char: r.range(.5, 1), width: r.range(.85, 1), mod: r.range(0, .25), duck: r.range(.1, .4) }),
    triplet: (r) => ECHO_BASE(r, { div: r.pick([[.6, '1/8t'], [.4, '1/4t']]),
      fb: r.range(.25, .45), mix: r.zone([[.7, .15, .23], [.3, .23, .27]]), pp: r.chance(.35),
      char: r.range(.5, 1), width: r.range(.8, 1), mod: r.range(0, .2), duck: r.range(.1, .4) }),
    ambient: (r) => ECHO_BASE(r, { div: r.pick([[.5, '1/4'], [.3, '1/4.'], [.2, '1/2t']]),
      fb: r.range(.48, .6), mix: r.zone([[.7, .11, .17], [.3, .17, .2]]), pp: r.chance(.5),
      char: r.range(.2, .6), width: r.range(.8, 1), mod: r.range(.2, .45), duck: r.range(.3, .6) }),
    tape: (r) => {
      const free = r.chance(.25);
      return ECHO_BASE(r, { free, ms: r.range(180, 420), div: r.pick([[.5, '1/8.'], [.3, '1/4'], [.2, '1/8']]),
        fb: r.zone([[.6, .3, .45], [.4, .45, .52]]), mix: r.zone([[.7, .16, .24], [.3, .24, .28]]), pp: r.chance(.2),
        char: r.range(0, .25), width: r.range(.6, .9), mod: r.zone([[.6, .45, .75], [.4, .75, .9]]), duck: r.range(.15, .4) });
    },
    short16: (r) => ECHO_BASE(r, { div: r.pick([[.6, '1/16'], [.4, '1/8t']]),
      fb: r.range(.2, .4), mix: r.zone([[.7, .12, .19], [.3, .19, .23]]), pp: r.chance(.5),
      char: r.range(.4, 1), width: r.range(.8, 1), mod: r.range(0, .15), duck: r.range(0, .3) }),
    // extreme
    xFlutter: (r) => ECHO_BASE(r, { div: r.pick([[.4, '1/32'], [.3, '1/32t'], [.3, '1/16t']]),
      fb: r.range(.6, .74), mix: r.range(.24, .33), pp: r.chance(.5),
      char: r.range(0, .3), width: r.range(.7, 1), mod: r.range(.6, 1), duck: r.range(0, .3) }),
    xInfinite: (r) => ECHO_BASE(r, { free: true, ms: r.range(280, 900), div: '1/4',
      fb: r.range(.7, .78), mix: r.range(.22, .3), pp: r.chance(.6),
      char: r.range(0, .15), width: r.range(.7, 1), mod: r.range(.6, 1), duck: r.range(.5, .8) }),
    xPingWide: (r) => ECHO_BASE(r, { div: r.pick([[.6, '1/4.'], [.4, '1/8.']]), pp: true,
      fb: r.range(.6, .72), mix: r.range(.2, .28), char: r.range(.4, 1), width: 1,
      mod: r.range(.2, .5), duck: r.range(.3, .6) }),
  };

  const VERB_BASE = (r, o) => ({
    VERB_TYPE: o.type, VERB_MIX: o.mix, VERB_DECAY: o.decay, VERB_BRIGHT: o.bright,
    VERB_PREDELAY: o.pre, SHIMMER: o.shim || 0, VERB_SYNC: o.sync ? 'Sync' : 'Free',
    VERB_PRE_DIV: o.preDiv || r.pick([[.5, '1/32'], [.35, '1/16'], [.15, '1/16.']]),
    VERB_DEC_DIV: o.decDiv || r.pick([[.4, '2'], [.3, '1'], [.2, '3'], [.1, '4']]),
    VERB_DUCK: o.duck,
  });
  const REVERB = {
    room: (r) => VERB_BASE(r, { type: 'Room', decay: r.zone([[.6, .12, .25], [.3, .25, .33], [.1, .05, .12]]),
      mix: r.zone([[.6, .15, .24], [.3, .24, .29], [.1, .11, .15]]), bright: r.range(.35, .6), pre: r.range(0, 18), duck: r.range(0, .3) }),
    plate: (r) => VERB_BASE(r, { type: 'Plate', decay: r.zone([[.6, .28, .45], [.3, .45, .55], [.1, .18, .28]]),
      mix: r.zone([[.6, .15, .24], [.3, .24, .3], [.1, .11, .15]]), bright: r.range(.45, .7), pre: r.range(8, 40),
      shim: r.chance(.1) ? r.range(.1, .2) : 0, duck: r.range(0, .35) }),
    plateDark: (r) => VERB_BASE(r, { type: 'Plate', decay: r.range(.3, .55), mix: r.zone([[.7, .15, .23], [.3, .23, .28]]),
      bright: r.range(.15, .4), pre: r.range(10, 50), duck: r.range(.05, .35) }),
    hall: (r) => VERB_BASE(r, { type: 'Hall', decay: r.zone([[.6, .42, .58], [.3, .58, .66], [.1, .35, .42]]),
      mix: r.zone([[.6, .16, .25], [.3, .25, .31], [.1, .12, .16]]), bright: r.range(.3, .6), pre: r.range(20, 70), duck: r.range(.1, .4) }),
    shimmer: (r) => VERB_BASE(r, { type: r.pick([[.7, 'Hall'], [.3, 'Plate']]), decay: r.range(.5, .68),
      mix: r.zone([[.7, .2, .28], [.3, .28, .32]]), shim: r.zone([[.6, .25, .42], [.3, .42, .55], [.1, .15, .25]]),
      bright: r.range(.5, .75), pre: r.range(20, 60), duck: r.range(.1, .35) }),
    syncVerb: (r) => VERB_BASE(r, { sync: true, type: r.pick([[.4, 'Plate'], [.35, 'Hall'], [.25, 'Room']]),
      decay: r.range(.3, .55), mix: r.zone([[.7, .15, .24], [.3, .24, .28]]), bright: r.range(.35, .65), pre: r.range(10, 40),
      preDiv: r.pick([[.35, '1/32'], [.35, '1/16'], [.15, '1/16.'], [.15, '1/8t']]),
      decDiv: r.pick([[.4, '2'], [.25, '1'], [.2, '3'], [.15, '4']]), duck: r.range(.1, .4) }),
    // extreme
    xCathedral: (r) => VERB_BASE(r, { type: 'Hall', decay: r.range(.78, .9), mix: r.range(.45, .58),
      shim: r.chance(.6) ? r.range(.5, .85) : 0, bright: r.range(.6, .88), pre: r.range(30, 120), duck: r.range(.2, .5) }),
    xDrown: (r) => VERB_BASE(r, { type: r.pick([[.8, 'Hall'], [.2, 'Plate']]), decay: r.range(.8, .92), mix: r.range(.6, .72),
      bright: r.range(.08, .3), pre: r.range(0, 30), duck: r.range(0, .2) }),
    xGate: (r) => VERB_BASE(r, { type: 'Hall', decay: r.range(.7, .85), mix: r.range(.45, .58),
      bright: r.range(.5, .8), pre: r.range(0, 20), duck: r.range(0, .15) }),
  };

  // HALO (5.1, replaces TREMOLO): the Dimension-style ensemble. No tempo, no tail; its pitch movement is bounded in
  // the DSP (3.5 / 5.5 / 8 / 11 cents for MODE 1-4), so even an EXTREME recipe stays a wide shine, never a warble.
  // Zones are a first voicing (Dan's ear check on the renders is owed): MIX .3-.55 = polish, .6+ = an effect.
  const HALO_BASE = (o) => ({ HALO_MODE: o.mode, HALO_MIX: o.mix, HALO_SIZE: o.size, HALO_TONE: o.tone });
  const HALO = {
    touch: (r) => HALO_BASE({ mode: r.pick([[.6, '1'], [.4, '2']]),                       // the calm companion
      mix: r.zone([[.7, .22, .32], [.3, .32, .4]]), size: r.range(.2, .45), tone: r.range(.5, .75) }),
    sheen: (r) => HALO_BASE({ mode: r.pick([[.55, '2'], [.3, '1'], [.15, '3']]),
      mix: r.zone([[.6, .3, .45], [.3, .45, .55], [.1, .22, .3]]), size: r.range(.25, .5), tone: r.range(.55, .8) }),
    wide: (r) => HALO_BASE({ mode: r.pick([[.5, '3'], [.3, '2'], [.2, '4']]),
      mix: r.zone([[.6, .4, .55], [.3, .55, .62], [.1, .3, .4]]), size: r.range(.45, .75), tone: r.range(.45, .7) }),
    lush: (r) => HALO_BASE({ mode: r.pick([[.6, '4'], [.4, '3']]),                         // big + darker = velvet
      mix: r.zone([[.6, .4, .52], [.4, .52, .62]]), size: r.range(.6, .9), tone: r.range(.3, .55) }),
    // extreme
    xWash: (r) => HALO_BASE({ mode: '4', mix: r.range(.8, 1), size: r.range(.8, 1), tone: r.range(.6, .9) }),
    xMurk: (r) => HALO_BASE({ mode: r.pick([[.6, '4'], [.4, '3']]), mix: r.range(.75, .95), size: r.range(.7, 1), tone: r.range(0, .2) }),
  };

  // Manual PITCH (AUTOTUNE off only). Integer semitones only; formant is NOT compensated in manual
  // mode, so a pitch-up blend carries a little chipmunk colour at low mix (reads as octave air).
  const PB = (st, formant, mix) => ({ PITCH_ST: st, FORMANT_ST: formant, PITCH_MIX: mix });
  const PITCH = {
    octUp: (r) => PB(12, r.pick([[.7, 0], [.3, r.int(-3, -1)]]), r.zone([[.6, .15, .27], [.3, .27, .36], [.1, .1, .15]])),
    octDown: (r) => PB(-12, r.pick([[.5, 0], [.5, r.int(2, 4)]]), r.zone([[.6, .2, .34], [.3, .34, .45], [.1, .13, .2]])),
    subBlend: (r) => PB(-12, 0, r.zone([[.7, .15, .26], [.3, .26, .32]])),
    fifthUp: (r) => PB(7, 0, r.zone([[.7, .14, .24], [.3, .24, .3]])),
    fourthDown: (r) => PB(r.pick([[.5, -5], [.5, -7]]), r.pick([[.6, 0], [.4, r.int(1, 3)]]), r.zone([[.7, .18, .3], [.3, .3, .38]])),
    formantOnly: (r) => PB(0, r.pick([[.5, r.int(2, 5)], [.5, r.int(-5, -2)]]), r.zone([[.6, .7, 1], [.4, .45, .7]])),
    // extreme
    xMonster: (r) => PB(r.pick([[.7, -12], [.3, -7]]), r.int(3, 6), r.range(.75, .9)),        // .97+ = +5 dB peak on a master (L2)
    xChipmunk: (r) => PB(12, r.pick([[.5, 0], [.5, r.int(-4, -2)]]), r.range(.7, .85)),       // >= .85 = +6.3 dB peak on a master (L2)
    xAlien: (r) => PB(r.pick([[.6, 0], [.2, 6], [.2, -6]]), r.pick([[.5, r.int(8, 12)], [.5, r.int(-12, -8)]]), r.range(.85, 1)),
  };
  const RECIPES = { ECHO, REVERB, HALO, PITCH };
  // Calm fallback per strip when a personality says nothing about a (bypassed) strip.
  const CALM = { ECHO: 'dotted', REVERB: 'plate', HALO: 'touch', PITCH: 'octUp' };

  // ── personalities: curated scenes. fx = probability the strip PLAYS (1 = core of the scene) ─────
  // gen = recipe name or weighted list. order = optional weighted chain orders (strip lists).
  const PERSONALITIES = [
    // MUSICAL — "nice, I wouldn't have dialled that myself"
    // 5.1: the TREM strip became HALO. The scenes built on the tremolo chop (PULSE, PUMP, STUTTER) left with it;
    // SHEEN, DOUBLE and VELVET are HALO's own scenes (proposed defaults, Dan to confirm). Elsewhere HALO takes
    // tremolo's place as the optional extra.
    { id: 'SPACE', name: 'SPACE', w: 12, blurb: 'a room you can hear around the source',
      fx: { REVERB: 1, ECHO: .35, HALO: .3, PITCH: .1 },
      gen: { REVERB: [[.5, 'hall'], [.3, 'plate'], [.2, 'syncVerb']], ECHO: 'ambient', HALO: 'sheen', PITCH: 'octUp' } },
    { id: 'SLAPBACK', name: 'SLAPBACK', w: 9, blurb: 'short garage slap, a little tape',
      fx: { ECHO: 1, REVERB: .45, HALO: .15, PITCH: 0 },
      gen: { ECHO: 'slap', REVERB: [[.6, 'room'], [.4, 'plate']], HALO: 'touch' } },
    { id: 'NIGHT_DRIVE', name: 'NIGHT DRIVE', w: 10, blurb: 'dark dub echo into a plate',
      fx: { ECHO: 1, REVERB: .5, HALO: .2, PITCH: .06 },
      gen: { ECHO: [[.6, 'dub'], [.4, 'dotted']], REVERB: [[.6, 'plateDark'], [.4, 'hall']], HALO: 'lush', PITCH: 'subBlend' } },
    { id: 'WIDE_PING', name: 'WIDE PING', w: 9, blurb: 'ping-pong repeats across the stereo field',
      fx: { ECHO: 1, REVERB: .4, HALO: .3, PITCH: .05 },
      gen: { ECHO: 'ping', REVERB: 'plate', HALO: 'wide', PITCH: 'fifthUp' } },
    { id: 'DREAM', name: 'DREAM', w: 8, blurb: 'shimmer hall, octave air on top',
      fx: { REVERB: 1, PITCH: .35, ECHO: .3, HALO: .45 },
      gen: { REVERB: 'shimmer', PITCH: 'octUp', ECHO: 'ambient', HALO: 'lush' } },
    { id: 'SHEEN', name: 'SHEEN', w: 9, blurb: 'an ensemble shine around the voice, a short plate',
      fx: { HALO: 1, REVERB: .5, ECHO: .25, PITCH: 0 },
      gen: { HALO: 'sheen', REVERB: [[.5, 'plate'], [.5, 'room']], ECHO: 'short16' },
      order: [[.7, null], [.3, ['PITCH', 'ECHO', 'HALO', 'REVERB']]] },
    { id: 'DOUBLE', name: 'DOUBLE', w: 6, blurb: 'a wide double-tracked feel with a dotted echo',
      fx: { HALO: 1, ECHO: .45, REVERB: .3, PITCH: 0 },
      gen: { HALO: 'wide', ECHO: 'dotted', REVERB: 'plate' } },
    { id: 'OCTAVE', name: 'OCTAVE', w: 7, blurb: 'a harmony layer under or over the source', needsPitch: true,
      fx: { PITCH: 1, REVERB: .55, ECHO: .3, HALO: .1 },
      gen: { PITCH: [[.3, 'octUp'], [.3, 'octDown'], [.2, 'fifthUp'], [.2, 'fourthDown']], REVERB: [[.5, 'plate'], [.5, 'hall']], ECHO: 'dotted', HALO: 'touch' } },
    { id: 'LOFI_TAPE', name: 'LO-FI TAPE', w: 8, blurb: 'worn tape echo, wobble and a dark room',
      fx: { ECHO: 1, HALO: .2, REVERB: .4, PITCH: .06 },
      gen: { ECHO: 'tape', HALO: 'touch', REVERB: [[.6, 'room'], [.4, 'plateDark']], PITCH: 'formantOnly' } },
    { id: 'BIG_ROOM', name: 'BIG ROOM', w: 6, blurb: 'punchy short room',
      fx: { REVERB: 1, ECHO: .2, HALO: 0, PITCH: 0 },
      gen: { REVERB: 'room', ECHO: 'slap' } },
    { id: 'HAUNTED', name: 'HAUNTED', w: 4, blurb: 'formant-shifted voice in a dark hall', needsPitch: true,
      fx: { PITCH: 1, REVERB: .6, ECHO: .3, HALO: .1 },
      gen: { PITCH: [[.6, 'formantOnly'], [.4, 'fourthDown']], REVERB: [[.6, 'hall'], [.4, 'plateDark']], ECHO: 'dub', HALO: 'lush' } },
    { id: 'VELVET', name: 'VELVET', w: 5, blurb: 'a dark, lush ensemble in a hall',
      fx: { HALO: 1, REVERB: .6, ECHO: .2, PITCH: 0 },
      gen: { HALO: 'lush', REVERB: [[.6, 'hall'], [.4, 'plateDark']], ECHO: 'ambient' } },
    { id: 'TRIPLET', name: 'TRIPLET GROOVE', w: 5, blurb: 'triplet echo swing',
      fx: { ECHO: 1, HALO: .2, REVERB: .35, PITCH: 0 },
      gen: { ECHO: 'triplet', HALO: 'sheen', REVERB: 'plate' } },

    // EXTREME — "what the hell was that? keep it." Still inside hard caps, still level-checked.
    // 5.1: GATED CATHEDRAL left with the tremolo gate (ANGEL WINGS takes its place); BROKEN MACHINE and CHIPMUNK
    // RAVE keep their names and trade the gate for a full-width HALO.
    { id: 'BROKEN_MACHINE', name: 'BROKEN MACHINE', w: 10, extreme: true, blurb: 'flutter echo and a murky ensemble',
      fx: { ECHO: 1, HALO: 1, PITCH: .5, REVERB: .2 },
      gen: { ECHO: 'xFlutter', HALO: 'xMurk', PITCH: 'octDown', REVERB: 'room' },
      order: [[.5, ['HALO', 'PITCH', 'ECHO', 'REVERB']], [.5, null]] },
    { id: 'SPACE_WARP', name: 'SPACE WARP', w: 10, extreme: true, blurb: 'cathedral shimmer feeding a wide ping-pong',
      fx: { REVERB: 1, ECHO: 1, PITCH: .3, HALO: .3 },
      gen: { REVERB: 'xCathedral', ECHO: 'xPingWide', PITCH: 'octUp', HALO: 'wide' },
      order: [[.7, ['PITCH', 'REVERB', 'ECHO', 'HALO']], [.3, null]] },
    { id: 'MONSTER', name: 'MONSTER', w: 8, extreme: true, needsPitch: true, blurb: 'down-pitched giant with a slap',
      fx: { PITCH: 1, ECHO: .6, HALO: .3, REVERB: .4 },
      gen: { PITCH: 'xMonster', ECHO: 'slap', HALO: 'wide', REVERB: 'room' } },
    { id: 'CHIPMUNK_RAVE', name: 'CHIPMUNK RAVE', w: 6, extreme: true, needsPitch: true, blurb: 'octave-up voice, full-width ensemble, ping-ponged',
      fx: { PITCH: 1, HALO: 1, ECHO: .7, REVERB: .2 },
      gen: { PITCH: 'xChipmunk', HALO: 'xWash', ECHO: 'ping', REVERB: 'room' } },
    { id: 'DROWNED', name: 'DROWNED', w: 9, extreme: true, blurb: 'underwater: dark endless reverb, a murky ensemble',
      fx: { REVERB: 1, HALO: .7, ECHO: .5, PITCH: .2 },
      gen: { REVERB: 'xDrown', HALO: 'xMurk', ECHO: 'tape', PITCH: 'subBlend' } },
    { id: 'INFINITE_TAPE', name: 'INFINITE TAPE', w: 9, extreme: true, blurb: 'runaway-sounding (but bounded) tape loop',
      fx: { ECHO: 1, REVERB: .4, HALO: .3, PITCH: .2 },
      gen: { ECHO: 'xInfinite', REVERB: 'room', HALO: 'lush', PITCH: 'formantOnly' } },
    { id: 'ANGEL_WINGS', name: 'ANGEL WINGS', w: 8, extreme: true, blurb: 'a full-width ensemble feeding a cathedral shimmer',
      fx: { REVERB: 1, HALO: 1, ECHO: .3, PITCH: .3 },
      gen: { REVERB: 'xCathedral', HALO: 'xWash', ECHO: 'dotted', PITCH: 'octUp' },
      order: [[1, ['PITCH', 'ECHO', 'HALO', 'REVERB']]] },
    { id: 'ALIEN_RADIO', name: 'ALIEN RADIO', w: 6, extreme: true, needsPitch: true, blurb: 'formant-warped voice through flutter',
      fx: { PITCH: 1, ECHO: .6, REVERB: .5, HALO: .4 },
      gen: { PITCH: 'xAlien', ECHO: 'xFlutter', REVERB: 'plate', HALO: 'xMurk' } },
  ];

  // Musical-mode chain orders when a roll decides to re-route (rare). Default first.
  const MUSICAL_ORDERS = [
    [.35, ['PITCH', 'ECHO', 'REVERB', 'HALO']],   // default
    [.25, ['PITCH', 'REVERB', 'ECHO', 'HALO']],   // echoes of the space
    [.2,  ['PITCH', 'ECHO', 'HALO', 'REVERB']],   // the ensemble feeds the room
    [.2,  ['HALO', 'PITCH', 'ECHO', 'REVERB']],   // width first, every tail inherits it
  ];

  // ── hard caps + relationship rules ────────────────────────────────────────────────────────────
  const CAPS = {
    MUSICAL: { fb: .62, echoMix: .34, verbMix: .34, decay: .72, shimMix: .2, haloMix: .65, formant: 5,
               wet: 1.0, gain: [-3.5, 2.5], echoDivs: ['1/4', '1/4.', '1/4t', '1/8', '1/8.', '1/8t', '1/16', '1/2t'],
               decDivs: ['1/2', '1', '2', '3', '4'] },
    EXTREME: { fb: .78, echoMix: .36, verbMix: .75, decay: .92, shimMix: .45, haloMix: 1, formant: 12,
               wet: 1.6, gain: [-7, 4], echoDivs: ['1/4', '1/4.', '1/4t', '1/8', '1/8.', '1/8t', '1/16', '1/16t', '1/32', '1/32t', '1/2t'],
               decDivs: ['1/2', '1', '2', '3', '4', '6', '8'] },
  };
  // A playing strip must be audible: "not boring".
  const FLOOR = { DLY_MIX: .12, VERB_MIX: .11, HALO_MIX: .2, PITCH_MIX: .1 };

  // ── level model: predicted LUFS change vs the plugin at DEFAULTS, per playing strip ────────────
  // Starting constants from the DSP formulas; calibrate() replaces them from real renders.
  // Calibrated 2026-09-27 against the real DRIFT 4.26.0 (L2 render QA, tasks/evidence/randomizer/
  // REPORT.md: 7,700 renders, drums + vocal + master, fit on odd seeds / tested on even seeds).
  // Total prediction MAE 0.91 -> 0.18 dB (MUSICAL). Empirical constants for THIS formula shape.
  const GAIN = {
    echoK: 0.3,          // fit says 0 on program material; kept small ON PURPOSE: repeats add up to +2.3 LUFS
                         // on held tempo-locked notes, and the fit under-reads sustained material by ~0.5 dB
    echoVintage: .25,    // vintage character lowers loop gain (band-pass in the loop)
    echoDuck: .5,
    verbBase: { Room: -8.681, Plate: -13.116, Hall: -17.118 },  // wet power dB at decay .3, bright .5
    verbDecay: 19.298,   // dB per unit decay above .3
    verbBright: -0.5,    // dB per unit bright above .5
    verbShim: 0,         // shimmer adds no measurable program level
    verbDuck: .95,
    verbDry: .82,        // dry power = 1 - .82 * mix (measured burst law, not 1 - mix)
    // HALO (5.1): the mono sum is the dry exactly, so HALO only ADDS level: dB(1 + (haloK + haloTone*TONE) * MIX^2).
    // Fit 2026-10-07 on tools/halo_render (the Halo.h the plugin runs) over the same corpus + meter as the 4.26
    // calibration (drums / vocal / master, 8 s, pyloudnorm), 384 renders (MODE 1-4 x SIZE x TONE x MIX .5 / 1):
    // least squares k = .176 + .063 * TONE, MAE 0.30 dB, max 0.77 dB. MODE moves k < .002, SIZE < .02; the MIX^2 law
    // holds (k(.5) / k(1) = 1.04). Material dominates: k = .385 vocal, .125 drums, .089 master at MIX 1 (a centred
    // vocal is all mid, so all of it widens) - the fit under-reads a dry vocal by 0.4 dB on average. Not yet re-fit on
    // plugin renders (L2 QA owed with the 5.1 build).
    haloK: .176, haloTone: .063,
    // PITCH (candidate B): only a band core is pitched, so the blend is not two uncorrelated signals
    pitchA: .599, pitchUp: 2.409, pitchDn: 1.379, pitchFmt: .314,
    // F4 (engine 1.2.0): LUFS change at PITCH_MIX 1 from dropping the dry edge, vs the 4.28.0 prediction.
    // Measured 2026-10-01 by the DSP tester (criterion T8) on the shipped 4.30.0 DLL F6F91A9C: class mean of
    // LUFS(4.30.0) - LUFS(4.28.0), drums + vocal + master, default band, mix 1 (qa-lab/logs/2026-10-01_4.30.0_dsp/t8).
    pitchWetOnlyDb: { up: -2.66, dn: -3.46, fmt: -0.87 },
  };
  const dB = (p) => 10 * Math.log10(Math.max(p, 1e-9));
  // F4: dry law, JS twin of dryHoldGain() in Source/PluginProcessor.cpp - change both together.
  function dryHold(m) { if (!(m > 0.5)) return 1; if (m >= 1) return 0; return Math.sin(Math.PI * (1 - m)); }
  function predictLevel(v, active, model) {
    const g = model || GAIN;
    const parts = {};
    if (active.PITCH) {
      const m = v.PITCH_MIX;
      let part = v.PITCH_ST === 0 ? g.pitchFmt * m
        : g.pitchA * dB((1 - m) * (1 - m) + m * m) + m * (v.PITCH_ST > 0 ? g.pitchUp : g.pitchDn);
      if (m > 0.5) {                                   // F4: dry edge fades above .5
        const t = g.pitchWetOnlyDb || GAIN.pitchWetOnlyDb;
        const d = t[v.PITCH_ST === 0 ? 'fmt' : v.PITCH_ST > 0 ? 'up' : 'dn'];
        const h = dryHold(m);
        part += dB(1 - (1 - h * h) * (1 - Math.pow(10, d / 10)));
      }
      parts.PITCH = part;
    }
    if (active.ECHO) {
      const loop = 0.95 * v.DLY_FEEDBACK * (1 - g.echoVintage * (1 - v.DLY_CHAR));
      const wet = g.echoK * v.DLY_MIX * v.DLY_MIX / (1 - loop * loop) * (1 - g.echoDuck * v.DLY_DUCK);
      const dry = dryHold(v.DLY_MIX);                  // F4: dry held to .5, faded above (echoK was fit on mixes <= .36)
      parts.ECHO = dB(dry * dry + wet);
    }
    if (active.REVERB) {
      const vm = v.VERB_MIX;
      const wetDb = g.verbBase[v.VERB_TYPE] + g.verbDecay * (v.VERB_DECAY - .3) + g.verbBright * (v.VERB_BRIGHT - .5);
      const wet = Math.pow(10, wetDb / 10) * (1 + g.verbShim * v.SHIMMER) * (1 - g.verbDuck * v.VERB_DUCK);
      parts.REVERB = dB((1 - g.verbDry * vm) + vm * wet);     // equal-power fold (measured dry law)
    }
    if (active.HALO) {
      // a calibrated model saved before 5.1 has no HALO terms -> fall back to the fit above
      const k = (g.haloK != null ? g.haloK : GAIN.haloK) + (g.haloTone != null ? g.haloTone : GAIN.haloTone) * v.HALO_TONE;
      parts.HALO = dB(1 + k * v.HALO_MIX * v.HALO_MIX);
    }
    let total = 0; for (const k in parts) total += parts[k];
    return { gainDb: +total.toFixed(2), parts };
  }
  function tailSeconds(v, active) {
    let t = 0;
    if (active.ECHO && v.DLY_FEEDBACK > .02) {
      const loop = 0.95 * v.DLY_FEEDBACK;
      const periodS = (v.DLY_MODE === 'Free' ? v.DLY_TIME_MS : divMs(v.DLY_DIV, 120)) / 1000 * (v.DLY_PINGPONG ? 2 : 1);
      t = Math.max(t, Math.log(0.001) / Math.log(loop) * periodS);
    }
    if (active.REVERB) t = Math.max(t, 0.4 + Math.pow(v.VERB_DECAY, 1.8) * 6.6);
    return +t.toFixed(2);
  }

  // Relationship rules. Mutates v, logs every change. Runs on every strip (bypassed ones too), so
  // a strip the user powers up later is already sane.
  function applyRules(v, active, mode, log, frozenPitch) {
    const c = CAPS[mode];
    const set = (id, x, why) => { const y = snap(id, x); if (y !== v[id]) { log.push(id + ' ' + fmt(v[id]) + ' -> ' + fmt(y) + ' (' + why + ')'); v[id] = y; } };
    // ECHO
    if (v.DLY_FEEDBACK > c.fb) set('DLY_FEEDBACK', c.fb, 'feedback cap');
    const fast = ['1/16', '1/16t', '1/32', '1/32t', '1/8t'].indexOf(v.DLY_DIV) >= 0 && v.DLY_MODE === 'Sync';
    if (mode === 'MUSICAL' && fast && v.DLY_FEEDBACK > .45) set('DLY_FEEDBACK', .45, 'dense repeats pile up');
    const longRep = (v.DLY_MODE === 'Free' ? v.DLY_TIME_MS : divMs(v.DLY_DIV, 120)) >= 700;
    if (mode === 'MUSICAL' && longRep && v.DLY_FEEDBACK > .55) set('DLY_FEEDBACK', .55, 'long repeats ring too long');
    const mixCap = Math.min(c.echoMix, (mode === 'MUSICAL' ? .42 : .5) - (mode === 'MUSICAL' ? .32 : .3) * v.DLY_FEEDBACK);
    if (v.DLY_MIX > mixCap) set('DLY_MIX', mixCap, 'more feedback, less echo level');
    if (mode === 'MUSICAL' && v.DLY_PINGPONG && v.DLY_FEEDBACK > .5 && v.DLY_MIX > .26) set('DLY_MIX', .26, 'ping-pong at high feedback');
    if (mode === 'MUSICAL' && v.DLY_MODE === 'Sync' && v.DLY_CHAR > .85 && ['1/8', '1/8t', '1/4'].indexOf(v.DLY_DIV) >= 0 && v.DLY_FEEDBACK > .38)
      set('DLY_FEEDBACK', .38, 'clean on-beat repeats stack up on held notes');
    if (CAPS[mode].echoDivs.indexOf(v.DLY_DIV) < 0) set('DLY_DIV', '1/8.', 'division outside the safe set');
    // REVERB
    if (v.VERB_DECAY > c.decay) set('VERB_DECAY', c.decay, 'decay cap');
    if (mode === 'MUSICAL' && v.VERB_TYPE === 'Room' && v.VERB_DECAY > .45) set('VERB_DECAY', .45, 'long Room rings (comb resonance)');
    if (v.VERB_TYPE === 'Plate' && v.VERB_DECAY > .85) set('VERB_DECAY', .85, 'very long Plate resonates on sustained notes');
    if (v.VERB_TYPE === 'Room' && v.VERB_DECAY > .35 && v.VERB_BRIGHT > .6) set('VERB_BRIGHT', .6, 'bright long Room is harsh');
    const vCap = mode === 'MUSICAL' ? Math.min(c.verbMix, .42 - .3 * Math.max(0, v.VERB_DECAY - .35)) : c.verbMix;
    if (v.VERB_MIX > vCap) set('VERB_MIX', vCap, 'longer decay, less reverb level');
    if (mode === 'MUSICAL' && v.VERB_TYPE === 'Room' && v.SHIMMER > 0) set('SHIMMER', 0, 'no shimmer in a Room');
    if (v.SHIMMER * v.VERB_MIX > c.shimMix) set('SHIMMER', c.shimMix / Math.max(v.VERB_MIX, .01), 'shimmer level cap');
    if (CAPS[mode].decDivs.indexOf(v.VERB_DEC_DIV) < 0) set('VERB_DEC_DIV', '2', 'decay beats outside the safe set');
    // HALO (5.1): a mix cap; MUSICAL keeps the ensemble a polish, not the effect
    if (v.HALO_MIX > c.haloMix) set('HALO_MIX', c.haloMix, 'ensemble mix cap');
    // PITCH
    if (!frozenPitch) {
      if (Math.abs(v.FORMANT_ST) > c.formant) set('FORMANT_ST', Math.sign(v.FORMANT_ST) * c.formant, 'formant cap');
      if (mode === 'MUSICAL' && Math.abs(v.PITCH_ST) >= 12 && v.PITCH_MIX > .45) set('PITCH_MIX', .45, 'octave blend, not replace');
    }
    // Several modulators at once: only one of them gets to be aggressive.
    if (mode === 'MUSICAL') {
      if (active.HALO && v.HALO_MIX > .45 && active.ECHO && v.DLY_MOD > .45) set('DLY_MOD', .3, 'ensemble already moving');
      if (active.PITCH && active.ECHO && v.DLY_MOD > .5) set('DLY_MOD', .35, 'pitch + wobble = seasick');
    }
  }

  // Wet budget: the playing strips together may not bury the source. HALO is not in it (5.1): its mono sum is
  // the dry, so it widens the source instead of burying it (its MIX has its own cap above).
  function wetness(v, active) {
    let w = 0;
    if (active.ECHO) w += v.DLY_MIX * (1 + v.DLY_FEEDBACK);
    if (active.REVERB) w += v.VERB_MIX * (1 + v.VERB_DECAY) * (1 + .5 * v.SHIMMER);
    if (active.PITCH) w += v.PITCH_MIX * (v.PITCH_ST !== 0 ? .5 : .2);
    return w;
  }
  function applyBudget(v, active, mode, log, frozenPitch) {
    const cap = CAPS[mode].wet;
    for (let i = 0; i < 12 && wetness(v, active) > cap; i++) {
      const cands = [];
      if (active.ECHO && v.DLY_MIX > FLOOR.DLY_MIX) cands.push(['DLY_MIX', v.DLY_MIX * (1 + v.DLY_FEEDBACK)]);
      if (active.REVERB && v.VERB_MIX > FLOOR.VERB_MIX) cands.push(['VERB_MIX', v.VERB_MIX * (1 + v.VERB_DECAY)]);
      if (active.PITCH && !frozenPitch && v.PITCH_MIX > FLOOR.PITCH_MIX) cands.push(['PITCH_MIX', v.PITCH_MIX * .5]);
      if (!cands.length) break;
      cands.sort((a, b) => b[1] - a[1]);
      const id = cands[0][0];
      const y = snap(id, Math.max(FLOOR[id], v[id] * .88));
      log.push(id + ' ' + fmt(v[id]) + ' -> ' + fmt(y) + ' (wet budget)');
      v[id] = y;
    }
  }
  // Level fix: nudge the wet that moves the prediction most, inside the floors.
  function fixLevel(v, active, mode, log, frozenPitch, model) {
    const [lo, hi] = CAPS[mode].gain;
    for (let i = 0; i < 16; i++) {
      const g = predictLevel(v, active, model).gainDb;
      if (g >= lo && g <= hi) return true;
      let id = null, x = null;
      if (g > hi) {
        const e = active.ECHO && v.DLY_MIX > FLOOR.DLY_MIX, r = active.REVERB && v.VERB_MIX > FLOOR.VERB_MIX;
        if (e && (!r || i % 2 === 0)) { id = 'DLY_MIX'; x = Math.max(FLOOR.DLY_MIX, v.DLY_MIX * .88); }
        else if (r) { id = 'VERB_MIX'; x = Math.max(FLOOR.VERB_MIX, v.VERB_MIX * .88); }
        else if (active.HALO && v.HALO_MIX > FLOOR.HALO_MIX) { id = 'HALO_MIX'; x = Math.max(FLOOR.HALO_MIX, v.HALO_MIX * .88); }
        else if (active.ECHO && v.DLY_FEEDBACK > .1) { id = 'DLY_FEEDBACK'; x = v.DLY_FEEDBACK * .88; }
      } else {
        // too quiet: back off the strip that pulls the level down the most (reverb mix = less dry
        // lost, pitch blend), never below its audible floor. HALO only adds level, so it is never here.
        const parts = predictLevel(v, active, model).parts;
        const knob = { REVERB: 'VERB_MIX', PITCH: 'PITCH_MIX' };
        const cands = Object.keys(knob).filter((s) => active[s] && parts[s] < 0 && !(s === 'PITCH' && frozenPitch) && v[knob[s]] > FLOOR[knob[s]])
          .sort((a, b) => parts[a] - parts[b]);
        if (cands.length) { id = knob[cands[0]]; x = Math.max(FLOOR[id], v[id] * .88); }
      }
      if (!id) return false;
      const y = snap(id, x);
      if (y === v[id]) return false;
      log.push(id + ' ' + fmt(v[id]) + ' -> ' + fmt(y) + ' (level ' + g.toFixed(1) + ' dB outside ' + lo + '..' + hi + ')');
      v[id] = y;
    }
    const g = predictLevel(v, active, model).gainDb;
    return g >= lo && g <= hi;
  }

  function fmt(x) { return typeof x === 'number' ? (+x.toFixed(3)).toString() : String(x); }

  // ── the roll ──────────────────────────────────────────────────────────────────────────────────
  // opts: { seed, context: { atOn, ord:{PITCH,ECHO,REVERB,HALO}, sinceExtreme, lastPersonality },
  //         forceMode: 'MUSICAL'|'EXTREME', forcePersonality: id, extremeRate, model }
  // 5.0: AUTOTUNE left DRIFT, so the plugin page never sets context.atOn - the frozen-PITCH path below is dead in
  // the plugin (kept for the old benches that still pass it; with atOn false it draws the same RNG = same rolls).
  function extremeChance(ctx, base) {
    const since = ctx.sinceExtreme;
    if (since == null) return base;
    if (since < 3) return base * .3;          // no extreme streaks
    if (since >= 14) return Math.min(.5, base * 2.5);   // "every now and then" really happens
    return base;
  }

  function roll(opts) {
    opts = opts || {};
    const seed = (opts.seed == null ? 1 : opts.seed) >>> 0;
    const ctx = opts.context || {};
    const atOn = !!ctx.atOn;
    const r = makeRng(seed);

    const mode = opts.forceMode || (r.chance(extremeChance(ctx, opts.extremeRate == null ? .12 : opts.extremeRate)) ? 'EXTREME' : 'MUSICAL');
    let rejections = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const out = tryRoll(r, seed, mode, ctx, atOn, opts, attempt);
      if (out) { out.rejections = rejections; return out; }
      rejections++;
    }
    // Guaranteed-safe fallback: a clean plate. Never fails the level band.
    const out = tryRoll(makeRng(seed ^ 0x5eed), seed, 'MUSICAL', ctx, atOn, Object.assign({}, opts, { forcePersonality: 'SPACE', fallback: true }), 0);
    out.rejections = rejections; out.fallback = true;
    return out;
  }

  function tryRoll(r, seed, mode, ctx, atOn, opts, attempt) {
    const pool = PERSONALITIES.filter((p) => !!p.extreme === (mode === 'EXTREME') && !(atOn && p.needsPitch));
    let pers = opts.forcePersonality ? PERSONALITIES.find((p) => p.id === opts.forcePersonality) : null;
    if (!pers) pers = r.pick(pool.map((p) => [p.id === ctx.lastPersonality ? p.w * .2 : p.w, p]));

    // which strips play
    const active = {};
    for (const s of STRIPS) {
      const p = pers.fx[s] || 0;
      active[s] = s === 'PITCH' && atOn ? false : (p >= 1 || r.chance(p));
    }
    // musical rolls stay lean: at most 3 playing strips unless a scene's core needs 4
    const playing = STRIPS.filter((s) => active[s]);
    if (mode === 'MUSICAL' && playing.length > 3) {
      const optional = playing.filter((s) => (pers.fx[s] || 0) < 1);
      active[optional[Math.floor(r() * optional.length)]] = false;
    }
    // ...but a lone strip is often plain: half the time it gets one companion from the scene
    if (mode === 'MUSICAL' && STRIPS.filter((s) => active[s]).length === 1 && r.chance(.5)) {
      const opt = STRIPS.filter((s) => !active[s] && !(s === 'PITCH' && atOn) && (pers.fx[s] || 0) > 0);
      if (opt.length) active[r.pick(opt.map((s) => [pers.fx[s], s]))] = true;
    }

    // per-strip recipes (bypassed strips get sane values too)
    const v = {};
    for (const s of STRIPS) {
      if (s === 'PITCH' && atOn) continue;          // frozen: feeds the autotuned voice
      let g = pers.gen[s] || CALM[s];
      if (Array.isArray(g)) g = r.pick(g);
      if (!active[s] && /^x/.test(g)) g = CALM[s];   // a bypassed strip never parks an extreme recipe
      Object.assign(v, RECIPES[s][g](r));
      v[BYP_ID[s]] = !active[s];
    }
    // snap every value to the parameter grid before rules
    for (const id in v) v[id] = snap(id, v[id]);

    const log = [];
    applyRules(v, active, mode, log, atOn);
    // floors on playing strips
    const floorSet = (id) => { if (v[id] < FLOOR[id]) { log.push(id + ' ' + fmt(v[id]) + ' -> ' + FLOOR[id] + ' (audible floor)'); v[id] = FLOOR[id]; } };
    if (active.ECHO) floorSet('DLY_MIX');
    if (active.REVERB) floorSet('VERB_MIX');
    if (active.HALO) floorSet('HALO_MIX');
    if (active.PITCH) floorSet('PITCH_MIX');
    if (active.PITCH && v.PITCH_ST === 0 && v.FORMANT_ST === 0) { v.PITCH_ST = 12; log.push('PITCH_ST 0 -> 12 (a playing pitch strip must shift)'); }
    applyBudget(v, active, mode, log, atOn);
    const levelOk = fixLevel(v, active, mode, log, atOn, opts.model);
    if (!levelOk && !opts.fallback) return null;   // re-roll

    // Chain order: ALWAYS written as a full permutation, so a roll is a pure function of its seed
    // (the same seed sounds the same whatever the previous roll left behind). Default order most
    // of the time; a re-route is rare in musical rolls. Never moves a frozen PITCH strip.
    let want = null;
    if (pers.order) want = r.pick(pers.order);
    else if (mode === 'MUSICAL' ? r.chance(.15) : r.chance(.5)) {
      want = mode === 'MUSICAL' ? r.pick(MUSICAL_ORDERS) : shuffle(r, DEFAULT_ORDER.slice());
    }
    let order = (want || DEFAULT_ORDER).slice();
    if (atOn) {                                     // keep PITCH where it is, route the rest around it
      const cur = ctx.ord && ctx.ord.PITCH != null ? ctx.ord.PITCH : 0;
      order = order.filter((s) => s !== 'PITCH');
      order.splice(Math.max(0, Math.min(3, cur)), 0, 'PITCH');
    }
    order.forEach((s, slot) => { v[ORD_ID[s]] = slot; });
    const rerouted = !!want && want.join() !== DEFAULT_ORDER.join();   // chosen by the roll (not the frozen-PITCH shift)

    // audibility: the roll must actually do something
    const loud = (active.ECHO && v.DLY_MIX >= .14) || (active.REVERB && v.VERB_MIX >= .14) ||
                 (active.HALO && v.HALO_MIX >= .25) || (active.PITCH && v.PITCH_MIX >= .15);
    if (!loud && !opts.fallback) return null;

    const norm = {};
    for (const id in v) norm[id] = +toNorm(id, v[id]).toFixed(6);
    const pred = predictLevel(v, active, opts.model);
    return {
      engine: 'drift-randomizer@' + VERSION,
      seed, mode, personality: pers.id, name: pers.name, blurb: pers.blurb,
      active: STRIPS.filter((s) => active[s]),
      order, rerouted, values: v, norm,
      frozen: atOn ? PITCH_IDS.slice() : [],
      corrections: log,
      predicted: { gainDb: pred.gainDb, parts: pred.parts, tailSec: tailSeconds(v, active), wet: +wetness(v, active).toFixed(3) },
    };
  }

  function shuffle(r, a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ── validation: hard invariants any roll must satisfy (tests + the page call this) ────────────
  function validate(roll, ctx) {
    const errors = [];
    const v = roll.values, mode = roll.mode, c = CAPS[mode];
    const atOn = !!(ctx && ctx.atOn);
    for (const id in v) {
      if (ALLOWLIST.indexOf(id) < 0) errors.push('not allowlisted: ' + id);
      if (NEVER.indexOf(id) >= 0) errors.push('never-write id: ' + id);
      const p = PARAMS[id]; if (!p) continue;
      const x = v[id];
      if (p.kind === 'float' || p.kind === 'int') {
        if (typeof x !== 'number' || !isFinite(x)) errors.push(id + ' not finite: ' + x);
        else if (x < p.min - 1e-9 || x > p.max + 1e-9) errors.push(id + ' out of range: ' + x);
      }
      if (p.kind === 'choice' && p.choices.indexOf(x) < 0) errors.push(id + ' bad choice: ' + x);
      if (p.kind === 'bool' && typeof x !== 'boolean') errors.push(id + ' not bool');
      const n = roll.norm[id];
      if (!(n >= 0 && n <= 1)) errors.push(id + ' norm out of 0..1: ' + n);
    }
    if (atOn) for (const id of PITCH_IDS) if (id in v) errors.push('pitch strip written while AUTOTUNE is on: ' + id);
    const ords = ['ORD_PITCH', 'ORD_ECHO', 'ORD_VERB', 'ORD_TREM'].filter((id) => id in v);
    if (ords.length !== 4 || new Set(ords.map((id) => v[id])).size !== 4) errors.push('ORD not a full permutation');
    const owned = ALLOWLIST.filter((id) => !(atOn && PITCH_IDS.indexOf(id) >= 0));
    for (const id of owned) if (!(id in v)) errors.push('owned id not written: ' + id);
    if (c.echoDivs.indexOf(v.DLY_DIV) < 0) errors.push('DLY_DIV outside safe set: ' + v.DLY_DIV);
    if (c.decDivs.indexOf(v.VERB_DEC_DIV) < 0) errors.push('VERB_DEC_DIV outside safe set: ' + v.VERB_DEC_DIV);
    if (v.DLY_FEEDBACK > c.fb + 1e-9) errors.push('feedback over cap');
    if (v.DLY_MIX > c.echoMix + 1e-9) errors.push('echo mix over cap');
    if (v.VERB_MIX > c.verbMix + 1e-9) errors.push('reverb mix over cap');
    if (v.VERB_DECAY > c.decay + 1e-9) errors.push('decay over cap');
    if (v.HALO_MIX > c.haloMix + 1e-9) errors.push('ensemble mix over cap');
    if (!atOn && Math.abs(v.FORMANT_ST) > c.formant) errors.push('formant over cap');
    if (!roll.active.length) errors.push('no strip playing');
    for (const s of roll.active) if (v[BYP_ID[s]] === true) errors.push(s + ' playing but bypassed');
    if (!roll.fallback) {
      const [lo, hi] = c.gain;
      if (roll.predicted.gainDb < lo - 1e-6 || roll.predicted.gainDb > hi + 1e-6) errors.push('predicted level ' + roll.predicted.gainDb + ' outside ' + lo + '..' + hi);
    }
    return { ok: errors.length === 0, errors };
  }

  // Host-name map for offline renders (pedalboard): { pedalboardName: value }.
  function toHost(values) {
    const o = {};
    for (const id in values) o[PARAMS[id].pb] = values[id];
    return o;
  }

  // One line for a debug panel / tooltip.
  function describe(roll) {
    const v = roll.values, bits = [];
    for (const s of roll.active) {
      if (s === 'ECHO') bits.push('ECHO ' + (v.DLY_MODE === 'Free' ? Math.round(v.DLY_TIME_MS) + 'ms' : v.DLY_DIV) + (v.DLY_PINGPONG ? ' ping-pong' : '') + ' fb ' + Math.round(v.DLY_FEEDBACK * 100) + '%');
      if (s === 'REVERB') bits.push(v.VERB_TYPE.toUpperCase() + ' ' + (0.4 + Math.pow(v.VERB_DECAY, 1.8) * 6.6).toFixed(1) + 's' + (v.SHIMMER > .05 ? ' +shimmer' : ''));
      if (s === 'HALO') bits.push('HALO ' + v.HALO_MODE + ' ' + Math.round(v.HALO_MIX * 100) + '%' + (v.HALO_SIZE > .7 ? ' big' : ''));
      if (s === 'PITCH') bits.push('PITCH ' + (v.PITCH_ST > 0 ? '+' : '') + v.PITCH_ST + 'st' + (v.FORMANT_ST ? ' fmt ' + v.FORMANT_ST : '') + ' ' + Math.round(v.PITCH_MIX * 100) + '%');
    }
    return roll.name + ' — ' + bits.join(' · ');
  }

  return {
    VERSION, PARAMS, ALLOWLIST, NEVER, PITCH_IDS, STRIPS, DEFAULT_ORDER, PERSONALITIES, CAPS, GAIN,
    roll, validate, predictLevel, dryHold, toNorm, fromNorm, snap, toHost, describe, divMs, makeRng,
  };
});
