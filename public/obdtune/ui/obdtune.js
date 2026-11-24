/* OBDTUNE object code (10-1c). This file becomes the plugin page's JS in 10-3a; the bench-only parts live in shell.js.
 * ES5 only (the Safari 14 floor: var and function, no newer syntax); no canvas filter property.
 * window.OBD = the object: the state P keyed by the real parameter ids (docs/CONTRACT.md + the PROVISIONAL HM_* block),
 * the one writer, the natives stub hook, the stand-in correction on the feed, the house gestures and the counter,
 * the screen and the three layout builders. */
(function () {
  'use strict';
  var VERSION = '0.1.2'; // REVTUNE_VERSION in the plugin; CMakeLists project()
  var KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']; // DESIGN.md v3 spelling, index 3 = Eb
  var SCALE_NAMES = ['CHROMATIC', 'MAJOR', 'MINOR', 'HARM MINOR', 'PENT MAJ', 'PENT MIN', 'DORIAN', 'PHRYGIAN', 'LYDIAN',
                     'MIXOLYDIAN', 'MEL MINOR', 'BLUES', 'WHOLE TONE'];                           // CONTRACT order
  var VOICE_NAMES = ['SOPRANO', 'ALTO', 'TENOR'];
  // PROVISIONAL (DESIGN.md section 10 Q2 A + Q3 A): named intervals = -12 st, -5..-1 and +1..+5 scale steps, +12 st
  var INTERVALS = ['OCT DN', '6TH DN', '5TH DN', '4TH DN', '3RD DN', '2ND DN', '2ND UP', '3RD UP', '4TH UP', '5TH UP',
                   '6TH UP', 'OCT UP'];
  var MASKS = [0x0FFF, 0x0AB5, 0x05AD, 0x09AD, 0x0295, 0x04A9, 0x06AD, 0x05AB, 0x0AD5, 0x06B5, 0x0AAD, 0x04E9, 0x0555];

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function msFmt(v) { return (v < 10 ? v.toFixed(1) : String(Math.round(v))) + ' ms'; }
  function signed(v, d) { var s = v.toFixed(d); return (v > 0 ? '+' : '') + (s === '-0' || s === '-0.0' ? s.slice(1) : s); }
  function panFmt(v) { var p = Math.round(Math.abs(v) * 100); return p === 0 ? 'C' : (v < 0 ? 'L' : 'R') + p; }

  /* ---- the parameter table: kind, range, default, norm rule (CONTRACT: a choice = index/(N-1), RETUNE skew 0.4) ---- */
  var SPEC = {
    AT_ON:       { kind: 'bool', def: true, name: 'POWER', fmt: function (v) { return v ? 'ON' : 'OFF'; } },
    AT_KEY:      { kind: 'choice', list: KEY_NAMES, def: 0, name: 'KEY' },
    AT_SCALE:    { kind: 'choice', list: SCALE_NAMES, def: 0, name: 'SCALE' },
    AT_RETUNE:   { kind: 'float', min: 1, max: 200, skew: 0.4, snap: 0.1, def: 25, name: 'SPEED', fmt: msFmt },
    AT_HUMANIZE: { kind: 'float', min: 0, max: 1, skew: 1, def: 0, name: 'HUMAN',
                   fmt: function (v) { return String(Math.round(v * 100)); } }, // 0-100, bare (DESIGN section 8: HUMAN 0)
    AT_FLEX:     { kind: 'float', min: 0, max: 100, skew: 1, def: 0, name: 'FLEX',
                   fmt: function (v) { return v < 0.5 ? 'OFF' : '±' + Math.round(v) + ' c'; } },
    AT_VOICE:    { kind: 'choice', list: VOICE_NAMES, def: 1, name: 'VOICE' }
  };
  var IDS = ['AT_ON', 'AT_KEY', 'AT_SCALE', 'AT_RETUNE', 'AT_HUMANIZE', 'AT_FLEX', 'AT_VOICE'];
  for (var n = 0; n < 12; n++) {
    SPEC['AT_NOTE_' + n] = { kind: 'bool', def: true, name: KEY_NAMES[n], fmt: function (v) { return v ? 'ON' : 'OFF'; } };
    IDS.push('AT_NOTE_' + n);
  }
  /* ---- PROVISIONAL: the whole HM_* block (10-Q 3; ids final at 10-3b / 10-3c; units per docs/briefs/9-1d.md;
   *      ranges DESIGN.md section 10 Q2 A; named intervals Q3 A) ---- */
  SPEC.HM_ON = { kind: 'bool', def: false, name: 'HARMONY', fmt: function (v) { return v ? 'ON' : 'OFF'; } };
  IDS.push('HM_ON');
  // HARMONY MIX (Yoni 2026-11-11, dev 0.3.4): the lead <-> harmony blend, 0-100 %; 50 = both full = the sound before MIX
  // (C++ revtune::HarmonyParams::mix: lead x min(1, 2(1-m)), voices x min(1, 2m)). Next to HARMONY on the A page.
  SPEC.HM_MIX = { kind: 'float', min: 0, max: 100, skew: 1, def: 50, step: 1, name: 'MIX',
                  fmt: function (x) { return Math.round(x) + ' %'; } };
  IDS.push('HM_MIX');
  [1, 2].forEach(function (v) {
    var p = 'HM_' + v + '_';
    // each voice's own switch (C++ HM_1_ON / HM_2_ON; defaults = revtune::HarmonyParams, V1 on, V2 off and ready). It was
    // missing from the scanner page, so V2 could never sound (Yoni 2026-11-17: "the 2nd harmony is not working")
    SPEC[p + 'ON'] = { kind: 'bool', def: v === 1, name: 'V' + v, aOnly: true, fmt: function (x) { return x ? 'ON' : 'OFF'; } };
    IDS.push(p + 'ON');
    SPEC[p + 'INTERVAL'] = { kind: 'choice', list: INTERVALS, def: v === 1 ? 7 : 9, name: 'V' + v + ' INT' }; // 3RD UP / 5TH UP
    SPEC[p + 'LEVEL'] = { kind: 'float', min: -24, max: 0, skew: 1, def: -6, step: 0.5, name: 'V' + v + ' LVL',
                          fmt: function (x) { return x.toFixed(1) + ' dB'; } };
    SPEC[p + 'PAN'] = { kind: 'float', min: -1, max: 1, skew: 1, def: v === 1 ? -0.5 : 0.5, step: 0.05, name: 'V' + v + ' PAN',
                        fmt: panFmt };
    SPEC[p + 'FORMANT'] = { kind: 'float', min: -12, max: 12, skew: 1, def: 0, step: 0.5, name: 'V' + v + ' FMT',
                            fmt: function (x) { return signed(x, 1) + ' st'; } };
    IDS.push(p + 'INTERVAL', p + 'LEVEL', p + 'PAN', p + 'FORMANT');
  });
  /* ---- end of the PROVISIONAL block ---- */
  // CUSTOM (todo 10-2q, Yoni 2026-11-12, 0.3.8): the drawn tune line is applied. Layout A only (its CUSTOM page).
  SPEC.CM_ON = { kind: 'bool', def: false, name: 'CUSTOM', aOnly: true, fmt: function (v) { return v ? 'ON' : 'OFF'; } };
  IDS.push('CM_ON');
  // AUTOTUNE (Yoni 2026-11-17, dev 0.5.2: "add an auto tune enable disable toggle in the tune and key selection section,
  // and make the main power total bypass of the plugin"): off = the voice goes through untuned, HARMONY + FX keep working;
  // the left POWER key (AT_ON) = the whole plugin. Layout A only (its TUNE page).
  SPEC.AT_TUNE = { kind: 'bool', def: true, name: 'AUTOTUNE', aOnly: true, fmt: function (v) { return v ? 'ON' : 'OFF'; } };
  IDS.push('AT_TUNE');
  // FX (todo 10-7, Yoni 2026-11-16, dev 0.5.0: "instead of the voice main menu - change it to FX inside the fx use the dsp
  // from revfx"): RevFX's ECHO / REVERB / HALO / GLUE + FX POWER / MIX. Ids, ranges, defaults, choice order = the C++
  // layout (= RevFX's createParameters). Layout A only (its FX pages). BYP_* = a power: the screen says ON when NOT bypassed.
  var DIVS = ['1/1', '1/1.', '1/1T', '1/2', '1/2.', '1/2T', '1/4', '1/4.', '1/4T', '1/8', '1/8.', '1/8T', '1/16', '1/16.',
              '1/16T', '1/32', '1/32.', '1/32T'];
  function pct(v) { return Math.round(v * 100) + ' %'; }
  function bypFmt(v) { return v ? 'OFF' : 'ON'; }
  function onFmt(v) { return v ? 'ON' : 'OFF'; }
  // depth = the presses from home the coverage allows (smoke): the FX page 1, a unit page 2 (Yoni's plan 2026-11-16: FX
  // -> a unit -> its values; 36 values do not fit one 438 x 312 screen), a cell behind its unit's SYNC 3
  function fx(id, s) { s.aOnly = true; s.depth = s.depth || 2; SPEC[id] = s; IDS.push(id); }
  function fxPct(id, def, name) { fx(id, { kind: 'float', min: 0, max: 1, skew: 1, def: def, step: 0.01, name: name, fmt: pct }); }
  fx('BYP_FX', { kind: 'bool', def: false, name: 'FX POWER', fmt: bypFmt, depth: 1 });
  fx('FX_MIX', { kind: 'float', min: 0, max: 1, skew: 1, def: 1, step: 0.01, name: 'FX MIX', fmt: pct, depth: 1 });
  fx('BYP_DLY', { kind: 'bool', def: false, name: 'ECHO', fmt: bypFmt });
  fxPct('DLY_MIX', 0, 'ECHO MIX');
  fx('DLY_MODE', { kind: 'choice', list: ['SYNC', 'FREE'], def: 0, name: 'ECHO SYNC' });
  fx('DLY_TIME_MS', { kind: 'float', min: 20, max: 2000, skew: 0.35, snap: 0.1, def: 350, name: 'ECHO TIME', depth: 3,
                      fmt: function (v) { return v < 1000 ? Math.round(v) + ' ms' : (v / 1000).toFixed(2) + ' s'; } });
  fx('DLY_DIV', { kind: 'choice', list: DIVS, def: 6, name: 'ECHO TIME' });
  fxPct('DLY_FEEDBACK', 0.35, 'FEEDBACK');
  fx('DLY_PINGPONG', { kind: 'bool', def: false, name: 'PING-PONG', fmt: onFmt });
  fxPct('DLY_CHAR', 1, 'CHARACTER'); fxPct('DLY_WIDTH', 1, 'WIDTH'); fxPct('DLY_MOD', 0, 'WOBBLE'); fxPct('DLY_DUCK', 0, 'ECHO DUCK');
  fx('BYP_VERB', { kind: 'bool', def: false, name: 'REVERB', fmt: bypFmt });
  fxPct('VERB_MIX', 0, 'REVERB MIX');
  fx('VERB_TYPE', { kind: 'choice', list: ['ROOM', 'PLATE', 'HALL'], def: 1, name: 'TYPE' });
  // DECAY: RevFX's free law, 0.4 + d^1.8 x 6.6 s (FxRack.h)
  fx('VERB_DECAY', { kind: 'float', min: 0, max: 1, skew: 1, def: 0.3, step: 0.01, name: 'DECAY',
                     fmt: function (v) { return (0.4 + Math.pow(v, 1.8) * 6.6).toFixed(1) + ' s'; } });
  fxPct('VERB_BRIGHT', 0.5, 'BRIGHT');
  fx('VERB_PREDELAY', { kind: 'float', min: 0, max: 200, skew: 1, snap: 0.1, def: 0, step: 1, name: 'PREDELAY',
                        fmt: function (v) { return Math.round(v) + ' ms'; } });
  fxPct('SHIMMER', 0, 'SHIMMER');
  fx('VERB_SYNC', { kind: 'choice', list: ['SYNC', 'FREE'], def: 1, name: 'REVERB SYNC' });
  fx('VERB_PRE_DIV', { kind: 'choice', list: DIVS, def: 12, name: 'PREDELAY', depth: 3 });
  fx('VERB_DEC_DIV', { kind: 'choice', list: ['1/4 BT', '1/2 BT', '1 BT', '2 BT', '3 BT', '4 BT', '6 BT', '8 BT'], def: 3, name: 'DECAY', depth: 3 });
  fxPct('VERB_DUCK', 0, 'REVERB DUCK');
  // 10-11 (Yoni 2026-11-18): HALO and GLUE left the page (their C++ params stay, inert, for old sessions); in their places:
  // EQ (Yoni: "a simple graphic eq that we can cut lows - highs, and be able to make like 2 bells"; C++ VoxEq.h): LOW CUT +
  // HIGH CUT (12 dB/oct; a cut at the end of its range = OFF) + 2 BELLS, dragged on the EQ page's curve. Frequencies and
  // widths on a log law (C++ the same lambdas).
  function logLaw(lo, hi) {
    return { toN: function (v) { return Math.log(clamp(v, lo, hi) / lo) / Math.log(hi / lo); },
             fromN: function (n) { return lo * Math.pow(hi / lo, clamp(n, 0, 1)); } };
  }
  function law(s, l) { s.toN = l.toN; s.fromN = l.fromN; return s; }
  function hzFmt(v) { return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' kHz' : Math.round(v) + ' Hz'; }
  var EQ_LC_OFF = 20, EQ_HC_OFF = 20000;   // a cut parked here is off (C++ kEqLcOff / kEqHcOff)
  function lcOff(v) { return v <= EQ_LC_OFF + 0.5; }
  function hcOff(v) { return v >= EQ_HC_OFF - 5; }
  fx('BYP_EQ', { kind: 'bool', def: false, name: 'EQ', fmt: bypFmt });
  fx('EQ_LC_HZ', law({ kind: 'float', min: 20, max: 1000, snap: 1, def: 20, name: 'LOW CUT',
                       fmt: function (v) { return lcOff(v) ? 'OFF' : hzFmt(v); } }, logLaw(20, 1000)));
  fx('EQ_HC_HZ', law({ kind: 'float', min: 1000, max: 20000, snap: 10, def: 20000, name: 'HIGH CUT',
                       fmt: function (v) { return hcOff(v) ? 'OFF' : hzFmt(v); } }, logLaw(1000, 20000)));
  [1, 2].forEach(function (b) {
    var p = 'EQ_B' + b + '_';
    fx(p + 'HZ', law({ kind: 'float', min: 40, max: 18000, snap: 1, def: b === 1 ? 250 : 3000, name: 'BELL ' + b, fmt: hzFmt }, logLaw(40, 18000)));
    fx(p + 'DB', { kind: 'float', min: -18, max: 18, skew: 1, snap: 0.1, def: 0, step: 0.5, name: 'BELL ' + b + ' GAIN', depth: b === 2 ? 3 : 2,
                   fmt: function (v) { return signed(v, 1) + ' dB'; } });
    fx(p + 'Q', law({ kind: 'float', min: 0.3, max: 8, snap: 0.01, def: 1, name: 'BELL ' + b + ' WIDTH', depth: b === 2 ? 3 : 2,
                      fmt: function (v) { return 'Q ' + v.toFixed(v < 1 ? 2 : 1); } }, logLaw(0.3, 8)));
  });
  // SQUEEZE (Yoni 2026-11-18: "a parralel comp ... fast and sexy sounding - to add that stableness and sheen to the vocals";
  // the name is his; C++ FetComp.h): a FET-style comp blended in parallel. IN drives a fixed threshold (the squeezed path is
  // level-compensated, so IN = how hard it squeezes), OUT = the squeezed path's level, ATTACK / RELEASE = the classic FET
  // spans (log law), RATIO 4 / 8 / 12 / 20 / ALL, MIX = the parallel blend (x FX MIX). Off by default, as GLUE was.
  fx('BYP_SQZ', { kind: 'bool', def: true, name: 'SQUEEZE', fmt: bypFmt });
  fx('SQZ_IN', { kind: 'float', min: 0, max: 30, skew: 1, snap: 0.1, def: 10, step: 0.5, name: 'IN',
                 fmt: function (v) { return '+' + v.toFixed(1) + ' dB'; } });
  fx('SQZ_OUT', { kind: 'float', min: -12, max: 12, skew: 1, snap: 0.1, def: 2, step: 0.5, name: 'OUT',
                  fmt: function (v) { return signed(v, 1) + ' dB'; } });
  fx('SQZ_ATTACK', law({ kind: 'float', min: 0.02, max: 0.8, snap: 0.01, def: 0.2, name: 'ATTACK',
                         fmt: function (v) { return v.toFixed(2) + ' ms'; } }, logLaw(0.02, 0.8)));
  fx('SQZ_RELEASE', law({ kind: 'float', min: 50, max: 1100, snap: 1, def: 200, name: 'RELEASE',
                          fmt: function (v) { return v >= 1000 ? (v / 1000).toFixed(2) + ' s' : Math.round(v) + ' ms'; } }, logLaw(50, 1100)));
  fx('SQZ_RATIO', { kind: 'choice', list: ['4:1', '8:1', '12:1', '20:1', 'ALL'], def: 0, name: 'RATIO' });
  fxPct('SQZ_MIX', 0.5, 'SQUEEZE MIX');
  // POSITION (todo 10-10, Yoni 2026-11-18: "move the harmonies (1st and 2nd) with ms plus and minus ... delay (positive
  // and negative) of each harmony in relation to the main vox ... free or synced to bpm"): a voice EARLY (-) or LATE (+) of
  // the lead. Early needs the future, so POSITION ON adds a fixed 250 ms LOOKAHEAD (Yoni's pick) to the plugin's latency.
  // FREE = ms on a two-sided square law, 0 at a quarter of the travel (C++ revtune::posMsFromNorm / posNormFromMs):
  // -250 .. 0 on 0 .. .25, 0 .. +2000 on .25 .. 1, so +-20 ms sit ~.07 either side of 0. SYNC = POS_DIVS: ECHO's note
  // values in length order, early up to a beat, late up to 1/1. (C++ kPosDivs). A value past the reach at this tempo
  // (early > 250 ms, late > 2 s) stops there and the lane says LIMIT. FREE / SYNC per voice (Yoni).
  var POS_LA = 250, POS_MAX = 2000, POS_N0 = 0.25, POS_ZERO = 11;
  var POS_LEN = ['1/32T', '1/32', '1/16T', '1/32.', '1/16', '1/8T', '1/16.', '1/8', '1/4T', '1/8.', '1/4', '1/2T', '1/4.', '1/2',
                 '1/1T', '1/2.', '1/1', '1/1.'];
  var POS_DIVS = (function () {
    var l = [], i;
    for (i = 10; i >= 0; i--) l.push('-' + POS_LEN[i]);   // -1/4 .. -1/32T
    l.push('0');
    for (i = 0; i < POS_LEN.length; i++) l.push('+' + POS_LEN[i]);
    return l;
  })();
  function posFromNorm(n) {
    n = clamp(n, 0, 1);
    return n < POS_N0 ? -POS_LA * Math.pow((POS_N0 - n) / POS_N0, 2) : POS_MAX * Math.pow((n - POS_N0) / (1 - POS_N0), 2);
  }
  function posToNorm(v) {
    v = clamp(v, -POS_LA, POS_MAX);
    return v < 0 ? POS_N0 - POS_N0 * Math.sqrt(-v / POS_LA) : POS_N0 + (1 - POS_N0) * Math.sqrt(v / POS_MAX);
  }
  function posMsFmt(v) {
    var a = Math.abs(v), sg = v > 0 ? '+' : '-';
    return a < 0.05 ? '0 ms' : sg + (a < 100 ? a.toFixed(1) + ' ms' : a < 1000 ? Math.round(a) + ' ms' : (a / 1000).toFixed(2) + ' s');   // 0.1 ms under 100 (Shift moves that fine)
  }
  // a note value's length in beats (ECHO: 60 / (bpm x DIV_HZ): 1/1 = 4 beats, '.' x 1.5, 'T' x 2/3), signed
  function posBeats(label) {
    var m = /^([+-])1\/(\d+)([.T]?)$/.exec(label);
    if (!m) return 0;
    var b = 4 / +m[2] * (m[3] === '.' ? 1.5 : m[3] === 'T' ? 2 / 3 : 1);
    return m[1] === '-' ? -b : b;
  }
  // voice v's offset now: {ms (inside the reach), limit: -1 = past the early reach | 0 | 1 = past the late reach}
  function posVoice(v) {
    var P = OBD.P, p = 'HM_' + v + '_';
    var ms = P[p + 'POS_SYNC'] === 0 ? posBeats(POS_DIVS[P[p + 'POS_DIV']]) * 60000 / (+OBD.ui.bpm || 120) : P[p + 'POS_MS'];
    return { ms: clamp(ms, -POS_LA, POS_MAX), limit: ms < -POS_LA - 0.05 ? -1 : ms > POS_MAX + 0.05 ? 1 : 0 };
  }
  SPEC.HM_POS_ON = { kind: 'bool', def: false, name: 'POSITION', aOnly: true, depth: 2, fmt: function (v) { return v ? 'ON' : 'OFF'; } };
  IDS.push('HM_POS_ON');
  [1, 2].forEach(function (v) {
    var p = 'HM_' + v + '_';
    SPEC[p + 'POS_SYNC'] = { kind: 'choice', list: ['SYNC', 'FREE'], def: 1, name: 'V' + v + ' SYNC', aOnly: true, depth: 2 };
    SPEC[p + 'POS_MS'] = { kind: 'float', min: -POS_LA, max: POS_MAX, snap: 0.1, def: 0, name: 'V' + v + ' POS', aOnly: true, depth: 2,
                           fmt: posMsFmt, toN: posToNorm, fromN: posFromNorm };
    SPEC[p + 'POS_DIV'] = { kind: 'choice', list: POS_DIVS, def: POS_ZERO, name: 'V' + v + ' POS', aOnly: true, depth: 3 };
    IDS.push(p + 'POS_SYNC', p + 'POS_MS', p + 'POS_DIV');
  });
  // a unit sounds when FX POWER and its own power are on and its mix (x FX MIX) is above 0; the EQ (an insert, no mix)
  // when it is not flat
  var FX_UNITS = { sqz: ['BYP_SQZ', 'SQZ_MIX'], echo: ['BYP_DLY', 'DLY_MIX'], verb: ['BYP_VERB', 'VERB_MIX'] };
  function eqFlat() { var P = OBD.P; return lcOff(P.EQ_LC_HZ) && hcOff(P.EQ_HC_HZ) && P.EQ_B1_DB === 0 && P.EQ_B2_DB === 0; }
  function fxOn(u) {
    var P = OBD.P;
    if (u === 'eq') return !P.BYP_FX && !P.BYP_EQ && !eqFlat();
    var x = FX_UNITS[u]; return !P.BYP_FX && P.FX_MIX > 0 && !P[x[0]] && P[x[1]] > 0;
  }

  function defaults() { var P = {}; IDS.forEach(function (id) { P[id] = SPEC[id].def; }); return P; }
  function openState() { var P = defaults(); P.AT_KEY = 3; P.AT_SCALE = 1; return P; } // Eb Major (decision 10-0c)

  function toNorm(id, v) {
    var s = SPEC[id];
    if (s.kind === 'bool') return v ? 1 : 0;
    if (s.kind === 'choice') return v / (s.list.length - 1);
    if (s.toN) return s.toN(v);   // a law of its own (POSITION's two-sided ms, 10-10)
    return Math.pow((v - s.min) / (s.max - s.min), s.skew);
  }
  function fromNorm(id, nv) {
    var s = SPEC[id]; nv = clamp(nv, 0, 1);
    if (s.kind === 'bool') return nv >= 0.5;
    if (s.kind === 'choice') return Math.round(nv * (s.list.length - 1));
    var v = s.fromN ? s.fromN(nv) : s.min + (s.max - s.min) * Math.pow(nv, 1 / s.skew);
    return s.snap ? Math.round(v / s.snap) * s.snap : v;
  }
  function fmt(id, v) {
    var s = SPEC[id]; if (v === undefined) v = OBD.P[id];
    return s.list ? s.list[v] : s.fmt(v);
  }

  /* ---- the object state + logs ---- */
  var OBD = window.OBD = {
    VERSION: VERSION, KEY_NAMES: KEY_NAMES, SCALE_NAMES: SCALE_NAMES, VOICE_NAMES: VOICE_NAMES, INTERVALS: INTERVALS,
    POS_DIVS: POS_DIVS, posToNorm: posToNorm, posFromNorm: posFromNorm, posBeats: posBeats,
    MASKS: MASKS, SPEC: SPEC, IDS: IDS,
    P: openState(),
    defaults: defaults, openState: openState, toNorm: toNorm, fromNorm: fromNorm, fmt: fmt, clamp: clamp,
    writes: [],     // [id, value] per write (T5 reads "two writes seen")
    natives: [],    // {name, args} per native call (the stub hook)
    log: [],        // [part, kind] per counted action
    actions: 0,     // THE action counter
    onNative: null, // the host side (shell.js in the bench) listens here
    frames: [],     // the corrected feed (RT_CORRECT output): the only thing the screen draws
    source: window.RT_FEED ? window.RT_FEED.source : 'none'
  };

  /* ---- natives go through ONE stub hook ---- */
  OBD.NATIVE = function (name, args) {
    OBD.natives.push({ name: name, args: args || [] });
    if (OBD.onNative) OBD.onNative(name, args || []);
  };

  /* ---- the stand-in correction: re-run on every state change (1200 frames, cheap) ---- */
  // CUSTOM (2026-11-12): framesAuto = the auto tune alone; frames = with the drawn line when CUSTOM is ON (bench stand-in
  // feed.js RT_CUSTOM; in the plugin the engine applies the line and RT_CUSTOM does not exist)
  OBD.recorrect = function () {
    OBD.framesAuto = window.RT_CORRECT(window.RT_FEED.frames, OBD.P);
    OBD.frames = window.RT_CUSTOM && OBD.custom && OBD.P.CM_ON ? window.RT_CUSTOM(OBD.framesAuto, OBD.custom) : OBD.framesAuto;
    OBD.dirty = true;   // new frames: the next animation frame draws them (10-12)
  };

  /* ---- the ONE writer: every gesture ends here ---- */
  OBD.write = function (id, v) {
    var s = SPEC[id];
    if (s.kind === 'bool') v = !!v;
    else if (s.kind === 'choice') v = clamp(Math.round(v), 0, s.list.length - 1);
    else v = clamp(s.snap ? Math.round(v / s.snap) * s.snap : v, s.min, s.max);
    var old = OBD.P[id];
    OBD.P[id] = v;
    OBD.writes.push([id, v]);
    if (old !== v) {
      OBD.recorrect();
      if (OBD.changed) OBD.changed(id, old);
    }
  };
  OBD.setNorm = function (id, nv) { OBD.write(id, fromNorm(id, nv)); };
  OBD.norm = function (id) { return toNorm(id, OBD.P[id]); };

  /* load a whole state (bench reset / open state): not a gesture, not a write */
  OBD.load = function (P) { IDS.forEach(function (id) { OBD.P[id] = P[id]; }); OBD.recorrect(); };

  /* ---- 0.1.2 legality: scale mask rotated to the key, user mask on absolute pitch classes, empty = the scale ---- */
  OBD.scaleAbs = function () { var m = MASKS[OBD.P.AT_SCALE], k = OBD.P.AT_KEY; return ((m << k) | (m >> (12 - k))) & 0xFFF; };
  OBD.userMask = function () { var m = 0; for (var i = 0; i < 12; i++) if (OBD.P['AT_NOTE_' + i]) m |= 1 << i; return m; };
  OBD.legalAbs = function () { var s = OBD.scaleAbs(); return (s & OBD.userMask()) || s; };
  OBD.inScale = function (pc) { return !!((OBD.scaleAbs() >> pc) & 1); };

  /* ---- playback: the feed's 60 Hz on requestAnimationFrame; seek pins the playhead ---- */
  var clock = 0, last = 0;
  OBD.paused = false;
  OBD.frameIndex = function () {
    var n = OBD.frames.length; if (!n) return 0;
    return ((Math.floor(clock / 1000 * window.RT_FEED.hz)) % n + n) % n;
  };
  OBD.seek = function (sec) { OBD.paused = true; clock = sec * 1000; if (OBD.draw) OBD.draw(); };
  OBD.play = function () { OBD.paused = false; };
  // 10-12 (L4-05): a frame draws only when what the screen shows can have moved: a new feed frame (the plugin: a new
  // atinfo, 30 a second, not the display's 60-240), a canvas's size, the page / layout, a render (OBD.dirty) or an
  // extension's own animation (OBD.animating: CUSTOM's marker glide), plus the frame after that animation stops. A hidden
  // page runs no chain (visibilitychange starts it again).
  var raf = 0, drawn = '', wasAnim = false;
  OBD.dirty = true;
  OBD.animating = function () { return false; };
  function drawKey() {
    var s = OBD.frameIndex() + '|' + OBD.ui.layout + '|' + OBD.ui.page + '|' + (window.devicePixelRatio || 1);
    var c = OBD.root ? OBD.root.querySelectorAll('canvas') : [];
    for (var i = 0; i < c.length; i++) s += '|' + c[i].offsetWidth + 'x' + c[i].offsetHeight + '@' + c[i].getBoundingClientRect().width;
    return s;
  }
  function tick(now) {
    raf = 0;
    if (document.hidden) return;
    if (!OBD.paused) clock += Math.min(100, now - (last || now));
    last = now;
    if (OBD.draw) {
      var k = drawKey(), anim = !!OBD.animating();
      if (OBD.dirty || anim || wasAnim || k !== drawn) { OBD.dirty = false; drawn = k; OBD.draw(); }
      wasAnim = anim;
    }
    raf = window.requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (raf) window.cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) { OBD.dirty = true; raf = window.requestAnimationFrame(tick); }
  });

  /* =================================================================================================================
   * UI state, modes, LISTEN, KEY ARMED, the step modes
   * ================================================================================================================= */
  var PAGE_LABEL = { home: 'HOME', tune: 'TUNE', notes: 'NOTES', voice: 'VOICE', harm: 'HARMONY', live: 'LIVE DATA',
                     setup: 'SETUP', service: 'SERVICE', custom: 'CUSTOM',
                     fx: 'FX', 'fx-echo': 'ECHO', 'fx-verb': 'REVERB', 'fx-eq': 'EQ', 'fx-sqz': 'SQUEEZE',
                     'harm-pos': 'POSITION', codes: 'CODES', licence: 'LICENCE' };
  var ROWS = ['AT_RETUNE', 'AT_HUMANIZE', 'AT_FLEX', 'AT_VOICE']; // B / C: the screen list the D-pad picks from
  var MODE_MS = 3000, TONE_MS = 450;
  var T = { arm: 0, step: 0, tone: 0, detect: 0, scan: 0, unplug: 0 };
  OBD.ui = { layout: 'A', page: 'home', hl: 0, listen: false, armed: false, step: null, pick: 0, setup: false,
             bg: 'FLOATING', detect: false,
             eqSel: 1,   // the EQ node in hand: 0 LOW CUT, 1 BELL 1, 2 BELL 2, 3 HIGH CUT (10-11)
             bpm: 120,   // the host tempo (the plugin sends it; 120 without one, as ECHO): POSITION's SYNC lane + LIMIT
             // the TUNE page's KEY / SCALE combos (Yoni 2026-11-16): the open one ('AT_KEY' | 'AT_SCALE' | null) + its
             // D-pad highlight
             combo: null, chl: 0,
             // CHECK ENGINE (10-13): kbd = the D-pad is in use (its outline shows; a press on the screen hides it again),
             // codesFrom = the page the CODES page was opened from (its BACK), msg = the code the LIVE strip shows now
             kbd: false, codesFrom: 'home', msg: null,
             // the NOTES page view (Yoni 2026-11-12): 'grid' (the 4 x 3 cells) or 'kb' (a piano octave); remembered
             notesView: (function () { try { return window.localStorage.getItem('revtune.notesview') === 'kb' ? 'kb' : 'grid'; } catch (e) { return 'grid'; } })() };
  OBD.PAGE_LABEL = PAGE_LABEL;

  // every active mode, by label; the header's [data-mode] element holds exactly these
  OBD.modes = function () {
    var u = OBD.ui, m = [];
    if (u.layout === 'A') { m.push(PAGE_LABEL[u.page]); if (u.combo) m.push(SPEC[u.combo].name); }
    else {
      m.push(u.setup ? 'SETUP' : 'LIVE');
      if (u.armed) m.push('KEY ARMED');
      if (u.step) m.push(u.step === 'AT_SCALE' ? 'SCALE STEP' : 'VOICE STEP');
    }
    if (u.listen) m.push('LISTEN');
    // DETECT lives on the OBD connector (Yoni 2026-11-11): LISTENING while it listens (the plugin sets plugListen),
    // then the answer (or the plugin's detectTag, e.g. UNDO)
    if (u.plugListen) m.push('LISTENING');
    else if (u.detect) m.push(u.detectTag || 'DETECTED');
    return m;
  };

  OBD.resetUi = function () {
    clearTimeout(T.arm); clearTimeout(T.step); clearTimeout(T.tone); clearTimeout(T.detect); clearInterval(T.scan);
    var u = OBD.ui;
    u.page = 'home'; u.hl = 0; u.listen = false; u.armed = false; u.step = null; u.pick = 0; u.setup = false; u.detect = false; u.plugListen = false; u.detectProgress = 0;
    u.kbd = false; u.codesFrom = 'home'; u.msg = null; clearTimeout(T.msg);
  };

  /* =================================================================================================================
   * CHECK ENGINE (10-13, Yoni 2026-11-23: "it is not really intuitive with the menues and the back button ... indications
   * where needed - maybe things that are important to flash"). The scanner's own job, reading fault codes, is the
   * indication layer: BACK goes one level up and the LCD names where; four telltale lamps (T H F C) in the header; a
   * CODES page; a flash only when a change MAKES a fault (never at open, never repeating).
   * ================================================================================================================= */
  // BACK = one level up (an FX unit -> FX, POSITION -> HARMONY, CODES -> where it was opened, a page -> HOME); an open
  // KEY / SCALE list closes first (the page stays). The header's crumb shows backTo() before BACK is pressed.
  function parentOf(p) {
    if (p === 'home') return null;
    if (p.indexOf('fx-') === 0) return 'fx';
    if (p === 'harm-pos') return 'harm';
    if (p === 'licence') return OBD.licLocked && OBD.licLocked() ? null : 'service';   // 10-16 (obdtune-licence.js)
    if (p === 'codes') return OBD.ui.codesFrom && OBD.ui.codesFrom !== 'codes' ? OBD.ui.codesFrom : 'home';
    return 'home';
  }
  function backTo() { var u = OBD.ui; return u.combo ? u.page : parentOf(u.page); }
  OBD.backTo = backTo;
  // The codes. FAULT = a part you switched on that cannot sound (its lamp turns amber and flashes when it appears);
  // INFO = a state that changes what you hear and is easy to forget (listed, steady). sys = its telltale; go / cell =
  // where the fix is (a press on the code jumps there, the cell flashes). Faults first: the page lists in this order.
  var CODES = [
    { id: 'H01', sys: 'H', fault: true, txt: 'HARM: NO VOICE', go: 'harm', cell: ['tog-HM_1_ON', 'tog-HM_2_ON'],
      on: function (P) { return P.HM_ON && !P.HM_1_ON && !P.HM_2_ON; } },
    { id: 'H02', sys: 'H', fault: true, txt: 'HARM MIX 0 %', go: 'harm', cell: ['val-HM_MIX'],          // MIX 0 = the voices silent (HarmonyVoices.h)
      on: function (P) { return P.HM_ON && (P.HM_1_ON || P.HM_2_ON) && P.HM_MIX <= 0; } },
    { id: 'F01', sys: 'F', fault: true, txt: 'FX MIX 0 %', go: 'fx', cell: ['val-FX_MIX'],
      on: function (P) { return !P.BYP_FX && P.FX_MIX <= 0; } },
    { id: 'P01', sys: 'P', txt: 'PLUGIN BYPASSED', go: 'home', cell: ['.h-on'], on: function (P) { return !P.AT_ON; } },   // the header's OFF word flashes
    { id: 'T01', sys: 'T', txt: 'AUTOTUNE OFF', go: 'tune', cell: ['tog-AT_TUNE'], on: function (P) { return !P.AT_TUNE; } },
    { id: 'N01', sys: 'T', txt: 'NOTES EDITED', go: 'notes', on: function () { return OBD.legalAbs() !== OBD.scaleAbs(); } },
    { id: 'H03', sys: 'H', txt: 'POSITION +' + POS_LA + ' ms', go: 'harm-pos', cell: ['tog-HM_POS_ON'],   // its lookahead = latency
      on: function (P) { return P.HM_POS_ON; } },
    { id: 'C01', sys: 'C', txt: 'CUSTOM LINE ON', go: 'custom', on: function (P) { return P.CM_ON && !!(OBD.custom && OBD.custom.edits); } }
  ];
  OBD.CODES = CODES;
  OBD.codes = function () { var P = OBD.P, a = []; CODES.forEach(function (c) { if (c.on(P)) a.push(c); }); return a; };
  // a telltale: 'warn' = it has a fault, 'lit' = it sounds, 'off' = ghost
  function sysState(s, P, warn) {
    if (warn[s]) return 'warn';
    if (!P.AT_ON) return 'off';
    if (s === 'T') return P.AT_TUNE ? 'lit' : 'off';
    if (s === 'H') return P.HM_ON && (P.HM_1_ON || P.HM_2_ON) && P.HM_MIX > 0 ? 'lit' : 'off';
    if (s === 'F') return fxOn('eq') || fxOn('sqz') || fxOn('echo') || fxOn('verb') ? 'lit' : 'off';
    return P.CM_ON && OBD.custom && OBD.custom.edits ? 'lit' : 'off';
  }
  OBD.sysState = function (s) { var w = {}; OBD.codes().forEach(function (c) { if (c.fault) w[c.sys] = true; }); return sysState(s, OBD.P, w); };
  // THE flash (DESIGN §6, 10-13): 3 pulses at 2 Hz (under the 3 Hz limit), amber lit from inside, then the part's steady
  // state. Only for a change the hand or the engine made: render() starts it for a NEW fault, and never in the first
  // OPEN_QUIET_MS after a build (a reopen, the session's values arriving from the host).
  var FLAG_MS = 1500, MSG_MS = 3000, OPEN_QUIET_MS = 1500, CE = { seen: null, built: 0, ans: false, bl: {} };
  // the MAIN switches (round 3): [part, its parameter]; backlit while ON
  var MASTERS = [['tog-AT_TUNE', 'AT_TUNE'], ['tog-HM_ON', 'HM_ON'], ['tog-HM_1_ON', 'HM_1_ON'], ['tog-HM_2_ON', 'HM_2_ON'],
                 ['tog-BYP_FX', 'BYP_FX'], ['cm-on', 'CM_ON']];
  var STRIKE_MS = 420;
  function strike(el) {   // the backlight comes on: one bright flicker, then steady (feedback of the press, never repeating)
    el.classList.remove('strike'); void el.offsetWidth; el.classList.add('strike');
    clearTimeout(el.strikeT); el.strikeT = setTimeout(function () { el.classList.remove('strike'); }, STRIKE_MS);
  }
  // ok = a GOOD change (DETECT's answer): the same 3 pulses in the screen's own ink, never the warning amber
  function flag(el, ok) {
    if (!el) return;
    var c = ok ? 'flag-ok' : 'flag';
    el.classList.remove('flag', 'flag-ok'); void el.offsetWidth;   // restart the animation
    el.classList.add(c);
    clearTimeout(el.flagT); el.flagT = setTimeout(function () { el.classList.remove(c); }, FLAG_MS);
  }
  function flagParts(names, ok) {   // the shown page's cells by data-part ('.x' = a selector: a header word)
    (names || []).forEach(function (n) {
      each(n.charAt(0) === '.' ? n : '[data-part="' + n + '"]', function (el) { var pg = el.closest('.page'); if (!pg || pg.classList.contains('on')) flag(el, ok); });
    });
  }
  OBD.flagParts = flagParts;
  function announce(c) {   // a NEW fault: its lamp flashes, the LIVE strip says it, the fix flashes when it is on this page
    var u = OBD.ui;
    each('[data-tt="' + c.sys + '"]', flag);
    u.msg = c; clearTimeout(T.msg);
    T.msg = setTimeout(function () { u.msg = null; OBD.render(); }, MSG_MS);
    if (c.go === u.page) flagParts(c.cell);
  }
  function watchCodes(codes) {
    var ids = codes.map(function (c) { return c.id; });
    if (CE.seen && Date.now() - CE.built > OPEN_QUIET_MS)
      codes.forEach(function (c) { if (c.fault && CE.seen.indexOf(c.id) < 0) announce(c); });
    CE.seen = ids;
    if (OBD.ui.msg && ids.indexOf(OBD.ui.msg.id) < 0) { OBD.ui.msg = null; clearTimeout(T.msg); }   // fixed: the strip is LIVE again
  }
  // a code pressed on the CODES page: its page, the fix in the D-pad's hand (outline shown) and flashing
  function jump(id) {
    var c = null; CODES.forEach(function (x) { if (x.id === id) c = x; });
    if (!c) return;
    go(c.go);
    var u = OBD.ui, first = c.cell && c.cell[0];
    if (first) {
      OBD.render();   // the page is shown: its D-pad list is the right one
      var list = items();
      for (var i = 0; i < list.length; i++) if (list[i].getAttribute('data-part') === first) u.hl = i;
      u.kbd = true;
      flagParts(c.cell);
    }
  }
  OBD.jump = jump;
  // U7: a press that switches a part ON while something else keeps it silent flashes the cell that fixes it, right
  // there (not a code: ECHO / REVERB at MIX 0 is the open state). Faults (HARM with no voice, FX MIX 0) do it through
  // announce().
  var NUDGE_MIX = { BYP_DLY: 'DLY_MIX', BYP_VERB: 'VERB_MIX', BYP_SQZ: 'SQZ_MIX' };
  function nudgeAfter(id) {
    var P = OBD.P;
    if (NUDGE_MIX[id] && !P[id] && P[NUDGE_MIX[id]] <= 0) flagParts(['val-' + NUDGE_MIX[id]]);
    if ((id === 'HM_1_ON' || id === 'HM_2_ON') && P[id] && !P.HM_ON) flagParts(['tog-HM_ON']);
  }

  // DETECT (Dan 2026-11-05, replaces LISTEN on A): finds the vocal's key + scale and sets them. BENCH STAND-IN: a
  // pitch-class histogram of the feed's voiced frames against the Krumhansl-Kessler major / minor profiles; the real
  // detector (DSP + tests) is its own session (tasks/handoff.md).
  var KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
      KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  function corr(h, prof, k) { // Pearson r between the histogram and the profile rotated to key k
    var mh = 0, mp = 0, sxy = 0, sxx = 0, syy = 0, i;
    for (i = 0; i < 12; i++) { mh += h[i] / 12; mp += prof[i] / 12; }
    for (i = 0; i < 12; i++) { var x = h[i] - mh, y = prof[(i - k + 12) % 12] - mp; sxy += x * y; sxx += x * x; syy += y * y; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : -2;
  }
  OBD.detectKey = function () {
    var h = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], F = window.RT_FEED.frames, best = { r: -2, key: 0, scale: 1 }, k;
    for (var i = 0; i < F.length; i++)
      if (F[i].f0 > 0 && F[i].voiced) h[(Math.round(69 + 12 * Math.log2(F[i].f0 / 440)) % 12 + 12) % 12]++;
    for (k = 0; k < 12; k++) {
      var rM = corr(h, KK_MAJ, k), rm = corr(h, KK_MIN, k);
      if (rM > best.r) best = { r: rM, key: k, scale: 1 };
      if (rm > best.r) best = { r: rm, key: k, scale: 2 };
    }
    return best;
  };
  // BENCH PREVIEW of a scan (PLUG LAB's button): the plugin's real DETECT listens for a while and reports its progress
  // (the binder sets ui.plugListen + ui.detectProgress); the bench's stand-in answers at once (the smoke's T6 relies on
  // it), so this plays the listening part first: ms of progress, then the stand-in's answer.
  OBD.previewScan = function (ms) {
    var t0 = Date.now(), u = OBD.ui; ms = ms || 3000;
    clearInterval(T.scan); u.detect = false; u.plugListen = true; u.detectProgress = 0; OBD.render();
    T.scan = setInterval(function () {
      // the engine's bar (KeyDetect::progress, 2026-11-12): 90 % fast, then the last 10 % while it confirms
      var f = (Date.now() - t0) / ms;
      u.detectProgress = f >= 1 ? 1 : f < 0.6 ? 0.9 * f / 0.6 : 0.9 + 0.09 * (f - 0.6) / 0.4; OBD.render();
      if (f >= 1) { clearInterval(T.scan); u.plugListen = false; u.detectProgress = 0; detect(); OBD.render(); }
    }, 50);
  };
  function detect() {
    var d = OBD.detectKey();
    OBD.write('AT_KEY', d.key); OBD.write('AT_SCALE', d.scale);
    clearTimeout(T.detect); OBD.ui.detect = true;
    T.detect = setTimeout(function () { OBD.ui.detect = false; OBD.render(); }, MODE_MS);
  }
  // VOICE and SETUP on A: one tile, each click steps to the next value (Dan 2026-11-05: no page of their own)
  function cycle(id) {
    if (id === 'BACKGROUND') setBackground(OBD.ui.bg === 'FLOATING' ? 'ROOM' : 'FLOATING');
    else stepChoice(id, 1);
  }

  // LISTEN (0.1.2): a latch; arming auditions the root, every KEY change and any clicked scale note sound again while
  // armed, each audition stops after 450 ms, disarm sends -1
  function audition(note) {
    OBD.NATIVE('setTestTone', [note]);
    clearTimeout(T.tone);
    T.tone = setTimeout(function () { OBD.NATIVE('setTestTone', [-1]); }, TONE_MS);
  }
  function listenToggle() {
    OBD.ui.listen = !OBD.ui.listen;
    if (OBD.ui.listen) audition(60 + OBD.P.AT_KEY);
    else { clearTimeout(T.tone); OBD.NATIVE('setTestTone', [-1]); }
  }
  function arm(on) {
    clearTimeout(T.arm); OBD.ui.armed = on;
    if (on) T.arm = setTimeout(function () { OBD.ui.armed = false; OBD.render(); }, MODE_MS);
  }
  function stepMode(id) {
    clearTimeout(T.step); OBD.ui.step = id;
    if (id) T.step = setTimeout(function () { OBD.ui.step = null; OBD.render(); }, MODE_MS);
  }
  function stepChoice(id, dir) { // wraps, as a step key does
    var N = SPEC[id].list.length;
    OBD.write(id, ((OBD.P[id] + dir) % N + N) % N);
  }
  function nudge(id, dir, fine) {
    var s = SPEC[id];
    if (s.kind === 'choice') OBD.write(id, OBD.P[id] + dir);
    else if (s.kind === 'float') {
      if (s.step) OBD.write(id, OBD.P[id] + dir * (fine ? s.step / 10 : s.step));
      else OBD.setNorm(id, OBD.norm(id) + dir * (fine ? 0.001 : 0.01));
    }
  }
  OBD.changed = function (id) {
    if (id === 'AT_KEY' && OBD.ui.listen) audition(60 + OBD.P.AT_KEY);
  };
  function setBackground(v) { OBD.ui.bg = v; OBD.NATIVE('setUiPref', ['BACKGROUND', v]); }
  function setNotesView(v) {   // the plugin's prefs bridge keeps it in RevTune_ui.json; the bench in localStorage
    OBD.ui.notesView = v;
    try { if (window.REV_PREFS) window.REV_PREFS.set('revtune.notesview', v); else window.localStorage.setItem('revtune.notesview', v); } catch (e) { /* fine */ }
  }

  /* =================================================================================================================
   * The house gestures + THE action counter (one helper; humans and scripts are counted the same way)
   *   drag = vertical, 180 px per full norm range, Shift 10x finer; wheel = one step per notch, Shift finer;
   *   dblclick = default; press = pointerdown + pointerup under 5 px of travel; hold = repeat, faster after ~400 ms.
   *   Count: 1 per pointerdown (a press, a whole drag or a whole hold), 1 per wheel notch; a dblclick = its 2 presses.
   * ================================================================================================================= */
  function count(el, kind) {
    if (!OBD.root || !OBD.root.contains(el)) return null; // only parts inside the object count
    var e = [el.getAttribute('data-part'), kind];
    OBD.log.push(e); OBD.actions++;
    return e;
  }
  OBD.gesture = function (el, o) {
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.preventDefault();
      var entry = count(el, 'press'), pid = e.pointerId, x0 = e.clientX, y0 = e.clientY, lx = x0, ly = y0;
      var moved = false, held = false, holdT = 0, rate = 110;
      try { el.setPointerCapture(pid); } catch (err) { /* synthetic pointers have no capture */ }
      el.classList.add('down');
      if (o.start) o.start(e);
      if (o.hold) {
        o.hold();
        holdT = setTimeout(function rep() {
          held = true; if (entry) entry[1] = 'hold';
          o.hold(); OBD.render();
          rate = Math.max(30, rate * 0.82);
          holdT = setTimeout(rep, rate);
        }, 400);
      }
      function move(ev) {
        if (ev.pointerId !== pid) return;
        if (!moved && Math.abs(ev.clientX - x0) < 5 && Math.abs(ev.clientY - y0) < 5) return;
        if (!moved) { moved = true; lx = x0; ly = y0; if (entry && !held) entry[1] = 'drag'; }
        if (o.drag) { o.drag(ev.clientX - lx, ev.clientY - ly, ev); OBD.render(); }
        lx = ev.clientX; ly = ev.clientY;
      }
      function up(ev) {
        if (ev.pointerId !== pid) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        clearTimeout(holdT);
        el.classList.remove('down');
        if (ev.type === 'pointerup' && !moved && !o.hold && o.press) o.press(ev);
        if (o.end) o.end(moved);
        OBD.render();
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
    if (o.wheel) el.addEventListener('wheel', function (e) {
      e.preventDefault();
      var d = e.deltaY || e.deltaX; // Shift + wheel arrives as deltaX on Windows
      if (!d) return;
      count(el, 'wheel');
      o.wheel(d < 0 ? 1 : -1, e.shiftKey);
      OBD.render();
    }, { passive: false });
    if (o.dbl) el.addEventListener('dblclick', function () { o.dbl(); OBD.render(); });
  };

  // a value control: drag / wheel / dblclick on its id; a press selects it (a choice also steps on, wrapping)
  // 10-11: a value cell whose id follows the state (the EQ readouts): the same gestures, the id read at each one
  function wireValDyn(el) {
    var acc = 0;
    function id() { return el.getAttribute('data-param'); }
    OBD.gesture(el, {
      start: function () { acc = OBD.norm(id()); },
      drag: function (dx, dy, ev) { acc = clamp(acc - dy / (ev.shiftKey ? 1800 : 180), 0, 1); OBD.setNorm(id(), acc); },
      wheel: function (dir, fine) { nudge(id(), dir, fine); },
      dbl: function () { OBD.write(id(), SPEC[id()].def); },
      press: function () { select(el); }
    });
  }
  // an EQ dot: press = it is the node in hand, drag = it follows (x = frequency on the graph's log law, y = a bell's gain),
  // Shift = fine (a tenth, from where it is), wheel = a bell's width / a cut's frequency, double-click = a cut OFF / a bell
  // flat at Q 1
  function wireEqNode(el) {
    var i = +el.getAttribute('data-node'), m = EQ_NODES[i], fx0 = 0, gy0 = 0, x0 = 0, y0 = 0;
    function geo() { var g = OBD.root.querySelector('.eq-graph'), r = g.getBoundingClientRect(), k = r.width / g.clientWidth; return { r: r, k: k, w: (g.clientWidth - 2 * EQ_PAD) * k, h: g.clientHeight * k }; }
    function setFromNorm(nx, gy) {
      var s = SPEC[m.hz], f = 20 * Math.pow(1000, clamp(nx, 0, 1));
      OBD.write(m.hz, clamp(f, s.min, s.max));
      if (m.db) OBD.write(m.db, clamp(gy, -EQ_DBR, EQ_DBR));
    }
    function at(ev) { var G = geo(); return { nx: (ev.clientX - G.r.left - EQ_PAD * G.k) / G.w, gy: (G.h / 2 - (ev.clientY - G.r.top)) / (G.h / 2 - EQ_PAD * G.k) * EQ_DBR }; }
    OBD.gesture(el, {
      start: function (e) {
        OBD.ui.eqSel = i; select(el);
        fx0 = +eqX(OBD.P[m.hz]) / 100; gy0 = m.db ? OBD.P[m.db] : 0; x0 = e.clientX; y0 = e.clientY;
        OBD.render();
      },
      drag: function (dx, dy, ev) {
        if (ev.shiftKey) { var G = geo(); setFromNorm(fx0 + (ev.clientX - x0) / G.w / 10, gy0 - (ev.clientY - y0) / (G.h / 2 - EQ_PAD * G.k) * EQ_DBR / 10); }
        else { var a = at(ev); setFromNorm(a.nx, a.gy); fx0 = a.nx; gy0 = a.gy; x0 = ev.clientX; y0 = ev.clientY; }
      },
      wheel: function (dir, fine) { OBD.ui.eqSel = i; nudge(m.q || m.hz, dir, fine); },
      dbl: function () {
        if (m.db) { OBD.write(m.db, 0); OBD.write(m.q, 1); }
        else OBD.write(m.hz, m.k === 'lc' ? EQ_LC_OFF : EQ_HC_OFF);
      }
    });
  }
  function wireVal(el, id) {
    var acc = 0;
    OBD.gesture(el, {
      start: function () { acc = OBD.norm(id); },
      drag: function (dx, dy, ev) { acc = clamp(acc - dy / (ev.shiftKey ? 1800 : 180), 0, 1); OBD.setNorm(id, acc); },
      wheel: function (dir, fine) { nudge(id, dir, fine); },
      dbl: function () { OBD.write(id, SPEC[id].def); },
      press: function () { select(el); if (COMBO[id]) openCombo(id); else if (SPEC[id].kind === 'choice') stepChoice(id, 1); }
    });
  }
  // KEY + SCALE combos (Yoni 2026-11-16: "you need to swipe to see and theres no option to see all and select"): a press
  // opens the whole list over the TUNE page (KEY = 12 cells, 4 x 3; SCALE = 13, 3 columns x 5 rows), a press on a cell picks
  // it and closes; the D-pad moves inside the list, OK picks, BACK closes; leaving the page closes it.
  var COMBO = { AT_KEY: 4, AT_SCALE: 3 };   // the list's columns (SCALE: 2 columns ran past the page)
  function openCombo(id) { OBD.ui.combo = id; OBD.ui.chl = OBD.P[id]; }
  function closeCombo() { OBD.ui.combo = null; }
  function pickCombo(id, v) { OBD.write(id, v); closeCombo(); }
  function wireCpo(el) {
    OBD.gesture(el, { press: function () { pickCombo(el.getAttribute('data-param'), +el.getAttribute('data-v')); } });
  }
  function comboList(id) {
    var list = SPEC[id].list, h = '<div class="cpick cp-' + COMBO[id] + 'c" data-combo="' + id + '"><div class="cp-list">';
    for (var i = 0; i < list.length; i++)
      h += '<div class="opt cpo"' + attrs({ 'data-part': 'cpo-' + id + '-' + i, 'data-param': id, 'data-v': i, 'data-kind': 'cpo' }) +
        '><span>' + list[i] + '</span></div>';
    return h + '</div></div>';
  }
  // 0.1.2: a press flips the key you SEE (lit -> off, off -> lit); out-of-scale keys are inert; the last lit key refuses.
  // Fallback (no scale note is ON, so the whole scale shows lit): the other lit notes switch ON and this one OFF.
  // LISTEN armed: every press on a scale key sounds that note.
  function noteToggle(pc) {
    if (OBD.ui.armed) { arm(false); OBD.write('AT_KEY', pc); return; } // KEY + note = the key (B / C)
    if (!OBD.inScale(pc)) return;
    if (OBD.ui.listen) audition(60 + pc);
    var b = 1 << pc, L = OBD.legalAbs();
    if (!(L & b)) { OBD.write('AT_NOTE_' + pc, true); return; }
    if (L === b) return;
    OBD.write('AT_NOTE_' + pc, false);
    for (var i = 0; i < 12; i++) if (i !== pc && (L & (1 << i)) && !OBD.P['AT_NOTE_' + i]) OBD.write('AT_NOTE_' + i, true);
  }
  function wireTog(el, id) {
    OBD.gesture(el, { press: function () {
      select(el);
      if (id.indexOf('AT_NOTE_') === 0) noteToggle(+id.slice(8));
      else { OBD.write(id, !OBD.P[id]); nudgeAfter(id); }
    } });
  }
  function wireOpt(el, id, v) {
    OBD.gesture(el, { press: function () {
      select(el);
      if (id === 'BACKGROUND') setBackground(v); else OBD.write(id, +v);
    } });
  }

  /* ---- D-pad / OK / ESC / the body keys ---- */
  function items() { return OBD.root.querySelectorAll('.page.on [data-item]'); }
  function select(el) {
    if (OBD.ui.layout !== 'A') { var r = ROWS.indexOf(el.getAttribute('data-row')); if (r >= 0) OBD.ui.pick = r; return; }
    var list = items();
    for (var i = 0; i < list.length; i++) if (list[i] === el) OBD.ui.hl = i;
  }
  function go(page) {
    if (OBD.licLocked && OBD.licLocked()) page = 'licence';   // 10-16: a trial that is over holds the screen on LICENCE
    OBD.ui.page = page; OBD.ui.hl = 0; OBD.ui.combo = null;
  }
  OBD.go = go;   // obdtune-licence.js
  function activate(el) { // OK on an A item
    var k = el.getAttribute('data-kind'), id = el.getAttribute('data-param');
    if (k === 'tile') go(el.getAttribute('data-go'));
    else if (k === 'tog') { if (id.indexOf('AT_NOTE_') === 0) noteToggle(+id.slice(8)); else { OBD.write(id, !OBD.P[id]); nudgeAfter(id); } }
    else if (k === 'code') jump(el.getAttribute('data-code'));
    else if (k === 'opt') { if (id === 'BACKGROUND') setBackground(el.getAttribute('data-v')); else OBD.write(id, +el.getAttribute('data-v')); }
    else if (k === 'cyc') cycle(id);
    else if (k === 'val' && COMBO[id]) openCombo(id);
    else if (k === 'val' && SPEC[id].kind === 'choice') stepChoice(id, 1);
  }
  function dpadA(dir) {
    if (OBD.ui.page === 'custom' && OBD.customDpad) { OBD.customDpad(dir); return; }   // CUSTOM: scroll / zoom the graph
    if (OBD.ui.combo) {   // an open KEY / SCALE list: up / down by a row, left / right by a cell
      var c = COMBO[OBD.ui.combo], n = SPEC[OBD.ui.combo].list.length;
      OBD.ui.chl = clamp(OBD.ui.chl + (dir === 'up' ? -c : dir === 'down' ? c : dir === 'left' ? -1 : 1), 0, n - 1);
      return;
    }
    var list = items(), u = OBD.ui, cols = u.page === 'home' ? 3 : u.page === 'notes' ? (u.notesView === 'kb' ? 12 : 4) : 1;
    if (!list.length) return;
    var cur = list[Math.min(u.hl, list.length - 1)], id = cur.getAttribute('data-param');
    if (dir === 'up') u.hl = Math.max(0, u.hl - cols);
    else if (dir === 'down') u.hl = Math.min(list.length - 1, u.hl + cols);
    else if (cols > 1) u.hl = clamp(u.hl + (dir === 'right' ? 1 : -1), 0, list.length - 1);
    else if (/^(val|lane|eqnode)$/.test(cur.getAttribute('data-kind'))) nudge(id, dir === 'right' ? 1 : -1, false);
    else u.hl = clamp(u.hl + (dir === 'right' ? 1 : -1), 0, list.length - 1);
  }
  function dpadBC(dir) {
    var u = OBD.ui, d = dir === 'right' || dir === 'up' ? 1 : -1;
    if (u.setup) { if (dir === 'left' || dir === 'right') setBackground(u.bg === 'FLOATING' ? 'ROOM' : 'FLOATING'); return; }
    if (dir === 'up' || dir === 'down') { u.pick = clamp(u.pick + (dir === 'down' ? 1 : -1), 0, ROWS.length - 1); return; }
    if (u.step) { stepChoice(u.step, d); stepMode(u.step); return; } // left / right reverse / advance while lit
    nudge(ROWS[u.pick], d, false);
  }
  var NAV = {
    esc: function () {
      var u = OBD.ui;
      if (u.layout === 'A' && u.combo) { closeCombo(); return; }   // BACK first closes an open KEY / SCALE list
      if (u.layout === 'A' && u.page === 'custom' && OBD.custom && OBD.custom.mark) { OBD.custom.mark = null; return; }   // ... and lets a marked note go (10-14)
      if (u.layout === 'A') { var t = parentOf(u.page); if (t) go(t); return; }   // 10-13: ONE level up (the crumb names it)
      if (u.armed) arm(false); else if (u.step) stepMode(null); else u.setup = false;
    },
    ok: function () {
      var u = OBD.ui;
      if (u.layout === 'A' && u.combo) { pickCombo(u.combo, u.chl); return; }
      if (u.layout === 'A') { var list = items(); if (list.length) activate(list[Math.min(u.hl, list.length - 1)]); return; }
      if (u.armed) arm(false); else if (u.step) stepMode(null); else if (u.setup) u.setup = false;
    },
    listen: listenToggle,
    detect: detect,
    arm: function () { arm(!OBD.ui.armed); },
    scale: function () { stepChoice('AT_SCALE', 1); stepMode('AT_SCALE'); },
    voice: function () { stepChoice('AT_VOICE', 1); stepMode('AT_VOICE'); },
    setup: function () { OBD.ui.setup = !OBD.ui.setup; },
    // the side-wall screw (A, Yoni 2026-11-11: "indicate that's for the info like all our other plugins"): the SERVICE page
    info: function () { go(OBD.ui.page === 'service' ? 'home' : 'service'); },
    // the telltale lamps (10-13) = the CODES page; pressed again it goes back to where it was opened
    codes: function () {
      var u = OBD.ui;
      if (u.page === 'codes') { go(parentOf('codes')); return; }
      u.codesFrom = u.page; go('codes');
    },
    'nv-grid': function () { setNotesView('grid'); },
    eqsel: function () { OBD.ui.eqSel = (OBD.ui.eqSel + 1) % 4; },   // 10-11: the next EQ node
    'nv-kb': function () { setNotesView('kb'); }
  };
  OBD.NAV = NAV;   // the CUSTOM page adds its soft keys here (obdtune-custom.js)
  var HOLD_HOME_MS = 600;
  function wireNav(el, what) {
    if (what === 'up' || what === 'down' || what === 'left' || what === 'right')
      OBD.gesture(el, { hold: function () { if (OBD.ui.layout === 'A') { OBD.ui.kbd = true; dpadA(what); } else dpadBC(what); } });
    else if (what === 'ok') OBD.gesture(el, { press: function () { OBD.ui.kbd = true; NAV.ok(); } });
    // A's BACK (10-13): a press = one level up; HELD 0.6 s = HOME at once (the press on release is then skipped)
    else if (what === 'esc' && OBD.ui.layout === 'A') {
      var holdT = 0, homed = false;
      OBD.gesture(el, {
        start: function () {
          homed = false; clearTimeout(holdT);
          holdT = setTimeout(function () { homed = true; go('home'); OBD.render(); }, HOLD_HOME_MS);
        },
        press: function () { clearTimeout(holdT); if (!homed) NAV.esc(); },
        end: function () { clearTimeout(holdT); }
      });
    }
    // SERVICE page: a link opens the browser (native openUrl); SIZE steps the window (native uiSize, the plugin maps it)
    else if (what === 'url') OBD.gesture(el, { press: function () { OBD.NATIVE('openUrl', [el.getAttribute('data-url')]); } });
    else if (what === 'sizedn' || what === 'sizeup') OBD.gesture(el, { press: function () { OBD.NATIVE('uiSize', [what === 'sizeup' ? 1 : -1]); } });
    else OBD.gesture(el, { press: NAV[what] });
  }

  /* =================================================================================================================
   * Render: every [data-read], the key lamps, the pages, the header mode text
   * ================================================================================================================= */
  function each(sel, f) { var l = OBD.root.querySelectorAll(sel); for (var i = 0; i < l.length; i++) f(l[i]); }
  // 10-12 (L4-05): every DOM write compares first, so a render that changes nothing changes no DOM (no style, no layout)
  function setText(el, s) { if (el && el.textContent !== s) el.textContent = s; }
  function setStyle(el, k, v) { if (el && el.style[k] !== v) el.style[k] = v; }
  function setAttr(el, k, v) { if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); }
  OBD.setText = setText;
  OBD.render = function () {
    var R = OBD.root; if (!R) return;
    if (OBD.renderLicence) OBD.renderLicence();   // 10-16 (obdtune-licence.js): first, so a held screen is on LICENCE
    var P = OBD.P, u = OBD.ui, legal = OBD.legalAbs(), sAbs = OBD.scaleAbs();
    OBD.dirty = true;   // the screen's canvas draws on the next animation frame (tick)
    eqSync();
    each('[data-read]', function (el) {
      var id = el.getAttribute('data-read'), how = el.getAttribute('data-show') || 'txt';
      if (id === 'LISTEN') { el.classList.toggle('lit', u.listen); return; }
      if (id === 'DETECT') { el.classList.toggle('lit', u.detect); return; }
      if (id === 'BACKGROUND') { setText(el, u.bg); return; }
      if (id === 'info') { setText(el, (el.closest('.tile') ? 'v' : 'OBDTUNE v') + OBD.VERSION); return; }   // the plugin sets OBD.VERSION
      if (how === 'txt') setText(el, fmt(id));
      else if (how === 'hm') { var nv = (P.HM_1_ON ? 1 : 0) + (P.HM_2_ON ? 1 : 0); setText(el, !P.HM_ON ? 'HARM OFF' : nv === 2 ? '2 VOICES' : nv === 1 ? '1 VOICE' : 'NO VOICE'); }
      else if (how === 'hv') { var hv = id.charAt(3); setText(el, P['HM_' + hv + '_ON'] ? fmt(id) : 'V' + hv + ' OFF'); }
      else if (how === 'fxp') setText(el, P.BYP_FX ? 'OFF' : 'ON');
      else if (how === 'eqflat') setText(el, eqFlat() ? ' FLAT' : '');
      else if (how === 'poslat') setText(el, P.HM_POS_ON ? '+' + POS_LA + ' ms' : '+0 ms');
      else if (how === 'posms') setText(el, posMsFmt(posVoice(+id.charAt(3)).ms));   // the offset now (SYNC: at the tempo)
      else if (how === 'posnote') setText(el, P['HM_' + id.charAt(3) + '_POS_SYNC'] === 0 ? fmt(id) : 'POS');
      else if (how === 'ptr') setStyle(el, 'transform', 'rotate(' + (-135 + 270 * OBD.norm(id)) + 'deg)');
      else if (how === 'led') each2(el, '[data-led]', function (l) { l.classList.toggle('lit', +l.getAttribute('data-led') === P[id]); });
      else if (how === 'lamp') {
        if (id.indexOf('AT_NOTE_') === 0) {
          var pc = +id.slice(8), b = 1 << pc;
          el.classList.toggle('lit', !!(legal & b));
          el.classList.toggle('root', !!(legal & b) && pc === P.AT_KEY);
        } else el.classList.toggle('lit', !!P[id]);
      }
    });
    each('[data-kind="opt"]', function (el) {
      var id = el.getAttribute('data-param'), v = el.getAttribute('data-v');
      el.classList.toggle('sel', id === 'BACKGROUND' ? v === u.bg : +v === P[id]);
    });
    each('[data-param^="AT_NOTE_"]', function (el) { // out of the scale = inert + faded; in scale but off = struck
      var pc = +el.getAttribute('data-param').slice(8), b = 1 << pc;
      el.classList.toggle('fade', !(sAbs & b));
      el.classList.toggle('off', !!(sAbs & b) && !(legal & b));
    });
    each('[data-part="power"]', function (el) { el.classList.toggle('lit', P.AT_ON); });
    each('[data-part="listen"]', function (el) { el.classList.toggle('lit', u.listen); });
    each('[data-part="detect"]', function (el) { el.classList.toggle('lit', u.detect); });
    // the connector's pins (Yoni 2026-11-11: "lights on the obd connector" while scanning): while it listens the pins FILL
    // with the scan's progress (16 pins = 100 %), the rest chase, a warm glow leaks from the pin recess; after, the found
    // scale's notes stay lit (12 of the 16 pins carry a note). The screen's scan bar follows the same progress.
    each('.plug', function (el) {
      // the adapter leaves in two moves (pop out of the slot, slide off past the window edge): .unplugging for its 760 ms
      if (el.classList.contains('listening') && !u.plugListen) {
        el.classList.add('unplugging'); clearTimeout(T.unplug);
        T.unplug = setTimeout(function () { el.classList.remove('unplugging'); }, 780);
      }
      if (u.plugListen) el.classList.toggle('unplugging', false);
      el.classList.toggle('listening', !!u.plugListen);
      var m = u.detect && !u.plugListen ? OBD.scaleAbs() : 0, b = el.querySelectorAll('.plug-glow b');
      for (var i = 0; i < b.length; i++) {
        var pc = b[i].getAttribute('data-pc');
        b[i].classList.toggle('ans', pc !== null && !!(m & (1 << +pc)));
      }
    });
    each('.glass', function (el) { el.classList.toggle('scanning', !!u.plugListen); });
    OBD.renderScan();
    each('.sv-size', function (el) { setText(el, Math.round(+u.uiSize || 100) + ' %'); });   // the plugin sets ui.uiSize
    each('[data-part="harm"]', function (el) { el.classList.toggle('lit', P.HM_ON); });
    each('[data-part="tile-tune"]', function (el) { el.classList.toggle('toff', !P.AT_TUNE); });
    // POSITION (10-10): each lane's voice block at its offset on the knob's own law (the lead = the VOX line at 0); the
    // reach's end says LIMIT while a SYNC value is past it at this tempo; the page dims while POSITION is off
    each('.pg-pos', function (el) { el.classList.toggle('poff', !P.HM_POS_ON); });
    each('.pos-lane', function (el) {
      var v = el.getAttribute('data-lane'), r = posVoice(+v);
      setAttr(el, 'data-param', 'HM_' + v + (P['HM_' + v + '_POS_SYNC'] === 0 ? '_POS_DIV' : '_POS_MS'));
      setStyle(el.querySelector('.pl-v'), 'left', (posToNorm(r.ms) * 100).toFixed(2) + '%');
      var e = el.querySelector('.pl-e'), l = el.querySelector('.pl-l');
      setText(e, r.limit < 0 ? 'LIMIT' : 'EARLY'); e.classList.toggle('lim', r.limit < 0);
      setText(l, r.limit > 0 ? 'LIMIT' : 'LATE'); l.classList.toggle('lim', r.limit > 0);
    });
    each('[data-voice]', function (el) { el.classList.toggle('voff', !P['HM_' + el.getAttribute('data-voice') + '_ON']); });
    each('[data-part="key-arm"]', function (el) { el.classList.toggle('lit', u.armed); el.classList.toggle('blink', u.armed); });
    each('[data-part="scale"]', function (el) { el.classList.toggle('lit', u.step === 'AT_SCALE'); });
    each('[data-part="voice"]', function (el) { el.classList.toggle('lit', u.step === 'AT_VOICE'); });
    // FX (10-7): a unit's lamp / tile lit while it sounds; TIME / DECAY / PREDELAY swap with their SYNC (the hidden one
    // leaves the D-pad list too); GLUE's gain reduction (the plugin sets ui.fxGr in dB, 30 Hz)
    each('[data-fxu]', function (el) { el.classList.toggle('lit', fxOn(el.getAttribute('data-fxu'))); });
    each('[data-when]', function (el) {
      var w = el.getAttribute('data-when').split('='), on = String(P[w[0]]) === w[1];
      el.classList.toggle('gone', !on);
      if (on) setAttr(el, 'data-item', ''); else el.removeAttribute('data-item');
    });
    OBD.renderGr();
    each('[data-part="setup"]', function (el) { el.classList.toggle('lit', u.setup); });
    each('.page', function (el) {
      var on = u.layout === 'A' ? el.getAttribute('data-page') === u.page : el.getAttribute('data-page') === (u.setup ? 'setup' : 'live');
      el.classList.toggle('on', on);
    });
    if (u.page === 'fx-eq') { eqPlace(); eqDraw(); }   // after the page is shown: the graph has its size now
    each('.pg-notes', function (el) { el.classList.toggle('kb', u.notesView === 'kb'); });
    each('[data-part="nv-grid"]', function (el) { el.classList.toggle('sel', u.notesView !== 'kb'); });
    each('[data-part="nv-kb"]', function (el) { el.classList.toggle('sel', u.notesView === 'kb'); });
    each('.cpick', function (el) { el.classList.toggle('open', el.getAttribute('data-combo') === u.combo); });
    each('.cpo', function (el) {
      var id = el.getAttribute('data-param'), v = +el.getAttribute('data-v');
      el.classList.toggle('sel', v === P[id]);
      el.classList.toggle('hl', id === u.combo && v === u.chl && (u.layout !== 'A' || u.kbd));
    });
    each('.val.combo', function (el) { el.classList.toggle('open', el.getAttribute('data-param') === u.combo); });
    // CHECK ENGINE (10-13): the crumb (where BACK goes), the telltales, the CODES page, the LIVE strip's message, the
    // honest dims (a part that cannot sound reads dim, never bright)
    if (u.layout === 'A') {
      var codes = OBD.codes(), warn = {}, on = {};
      codes.forEach(function (c) { on[c.id] = true; if (c.fault) warn[c.sys] = true; });
      watchCodes(codes);
      var bt = backTo();
      each('.h-back', function (el) { setText(el, bt ? '◂ ' + PAGE_LABEL[bt] : '▸'); el.classList.toggle('up', !!bt); });
      each('[data-tt]', function (el) {
        var st = sysState(el.getAttribute('data-tt'), P, warn);
        el.classList.toggle('lit', st === 'lit'); el.classList.toggle('warn', st === 'warn');
      });
      each('.cd', function (el) {
        var a = !!on[el.getAttribute('data-code')];
        el.classList.toggle('gone', !a);
        if (a) setAttr(el, 'data-item', ''); else el.removeAttribute('data-item');
      });
      each('.cd-none', function (el) { el.classList.toggle('gone', codes.length > 0); });
      each('.msgbar .mb-t', function (el) { if (u.msg) setText(el, 'CODE ' + u.msg.id + '  ' + u.msg.txt); });
      each('.glass', function (el) { el.classList.toggle('msg', !!u.msg); });
      each('[data-part="tile-harm"]', function (el) { el.classList.toggle('toff', !P.HM_ON); });
      each('[data-part="tile-custom"]', function (el) { el.classList.toggle('toff', !(P.CM_ON && OBD.custom && OBD.custom.edits)); });
      // round 2 (Yoni 2026-11-23: "go also on the existing items"): the BACK key's lamp = BACK has a level to go up to;
      // a home tile lit (frame + dot) while its part sounds = its telltale; an ON switch is lit like a backlit key
      each('[data-part="back"]', function (el) { el.classList.toggle('lit', !!bt); });
      each('.kl-back', function (el) { el.classList.toggle('on', !!bt); });
      each('.kl-power', function (el) { el.classList.toggle('on', !!P.AT_ON); });
      [['tune', 'T'], ['harm', 'H'], ['fx', 'F'], ['custom', 'C']].forEach(function (t) {
        each('[data-part="tile-' + t[0] + '"]', function (el) { el.classList.toggle('lit', sysState(t[1], P, warn) === 'lit'); });
      });
      each('.val.tog[data-param]', function (el) {
        var id = el.getAttribute('data-param');
        el.classList.toggle('on', id.indexOf('BYP_') === 0 ? !P[id] : !!P[id]);
      });
      // round 3 (Yoni 2026-11-23: HARM "needs to be way more clear when its on and off - like really bold move", V1 / V2
      // "more flashiness", then AUTOTUNE / FX POWER / CUSTOM "same", the light "like old casio digital watches"): the
      // MAIN switches are backlit panels - ON = the whole cell glows, the letters dark on the light (a watch's display
      // with its light on), OFF = dark. Switched ON by the hand: the light STRIKES (a short bright flicker, then steady).
      var quiet = Date.now() - CE.built < OPEN_QUIET_MS;
      MASTERS.forEach(function (m) {
        var on = m[1].indexOf('BYP_') === 0 ? !P[m[1]] : !!P[m[1]];
        each('[data-part="' + m[0] + '"]', function (el) {
          el.classList.add('master'); el.classList.toggle('bl', on);
          if (on && CE.bl[m[0]] === false && !quiet) strike(el);
        });
        CE.bl[m[0]] = on;
      });
      // DETECT's answer (the bench: detect(); the plugin: the engine's answer, shown 3 s): KEY + SCALE flash in the
      // screen's own ink on TUNE, the TUNE tile on HOME (a NO KEY / UNDO answer changes nothing: no flash)
      var ans = !!u.detect && !u.plugListen && u.detectTag !== 'NO KEY' && u.detectTag !== 'UNDO?';
      if (ans && !CE.ans) flagParts(['val-AT_KEY', 'val-AT_SCALE', 'tile-tune'], true);
      CE.ans = ans;
      each('[data-part="tile-fx"]', function (el) { el.classList.toggle('toff', !(fxOn('eq') || fxOn('sqz') || fxOn('echo') || fxOn('verb'))); });
      each('.fxt', function (el) { el.classList.toggle('toff', !fxOn(el.getAttribute('data-fxu'))); });
      each('.pg-harm', function (el) { el.classList.toggle('hoff', !P.HM_ON); });
      each('.pg-fx', function (el) { el.classList.toggle('fxoff', !!P.BYP_FX); });
      each('.pg-fxu', function (el) {   // a unit page dims below its switch while the unit (or FX POWER) is off
        var t = el.querySelector('.tog'), id = t && t.getAttribute('data-param');
        el.classList.toggle('uoff', !!(P.BYP_FX || (id && P[id])));
      });
    }
    // the highlight: A's D-pad item (10-13: drawn only while the D-pad is in use), B / C's row; one write each (a
    // [data-row] cell takes the row rule, as it always did)
    var hl = null;
    if (u.layout === 'A') { var list = items(); if (list.length && u.kbd) hl = list[Math.min(u.hl, list.length - 1)]; }
    each('[data-item]', function (el) { if (!el.hasAttribute('data-row')) el.classList.toggle('hl', el === hl); });
    each('[data-row]', function (el) { el.classList.toggle('hl', u.layout !== 'A' && !u.setup && el.getAttribute('data-row') === ROWS[u.pick]); });
    R.classList.toggle('armed', u.armed); // the header's mode text blinks while KEY is armed
    R.classList.toggle('on-live', u.layout === 'A' && u.page === 'live');
    each('[data-mode]', function (el) { setText(el, OBD.modes().join(' · ')); });
    R.classList.toggle('pwr-off', !P.AT_ON);
    R.classList.toggle('room', u.bg === 'ROOM');
  };
  // the scan's progress: the connector's pins FILL with it (16 pins = 100 %), the screen's bar follows. render calls it;
  // the plugin's binder calls it alone while only the progress moves (30 Hz), not a whole render (10-12)
  OBD.renderScan = function () {
    if (!OBD.root) return;
    var u = OBD.ui, prog = Math.max(0, Math.min(1, +u.detectProgress || 0));
    each('.plug', function (el) {
      var b = el.querySelectorAll('.plug-glow b'), nf = u.plugListen ? Math.floor(prog * b.length) : 0;
      for (var i = 0; i < b.length; i++) b[i].classList.toggle('fill', i < nf);
    });
    each('.scanbar .sb-fill', function (el) { setStyle(el, 'width', (prog * 100).toFixed(1) + '%'); });
    each('.scanbar .sb-p', function (el) { setText(el, Math.round(prog * 100) + '%'); });
  };
  // SQUEEZE's GR cell (the plugin sets ui.fxGr in dB). render calls it; the binder calls it alone on each fxgr (10-12)
  OBD.renderGr = function () {
    if (!OBD.root) return;
    var P = OBD.P, g = P.BYP_SQZ || P.BYP_FX || !P.AT_ON ? 0 : Math.max(0, +OBD.ui.fxGr || 0);   // POWER off = the FX bypassed too (0.5.2); SQUEEZE's GR (10-11)
    each('.fx-gr', function (el) {
      setText(el.querySelector('b'), '-' + g.toFixed(1) + ' dB');
      setStyle(el.querySelector('i'), 'width', Math.min(100, g / 12 * 100).toFixed(1) + '%');
    });
  };
  function each2(root, sel, f) { var l = root.querySelectorAll(sel); for (var i = 0; i < l.length; i++) f(l[i]); }

  /* =================================================================================================================
   * The screen: DOM text + ONE canvas (pointer-events:none) for the cents gauge and the graph strip.
   * Needle + traces ported from bench/bench-v2-concepts.html @ de4dc06 (9-1c NEEDLE). Draws only OBD.frames
   * (the RT_CORRECT output), never the recorded corr / note.
   * ================================================================================================================= */
  var COL = {}, LANES = [48, 62];
  OBD.COL = COL; OBD.lanes = function () { return LANES; };   // the CUSTOM graph draws on the same lanes + colours
  OBD.readColors = function () { // the canvas follows the skin: CSS variables on the object
    var cs = window.getComputedStyle(OBD.root);
    ['ink', 'acc', 'dim', 'grid'].forEach(function (k) { COL[k] = cs.getPropertyValue('--lcd-' + k).replace(/\s/g, '') || 'rgb(200,190,170)'; });
  };
  function laneRange() { // from the feed's sung frames (3rd..97th percentile: detector octave slips stay off-strip)
    var ms = [], F = window.RT_FEED.frames;
    for (var i = 0; i < F.length; i++) if (F[i].f0 > 0 && F[i].voiced) ms.push(69 + 12 * Math.log2(F[i].f0 / 440));
    if (!ms.length) return [55, 66];
    ms.sort(function (a, b) { return a - b; });
    var lo = Math.floor(ms[Math.floor(ms.length * 0.03)]) - 1, hi = Math.ceil(ms[Math.floor(ms.length * 0.97)]) + 1;
    while (hi - lo < 11) { lo--; hi++; }
    return [lo, hi];
  }
  function midi(f0) { return 69 + 12 * Math.log2(f0 / 440); }
  function noteName(m) { return KEY_NAMES[(m % 12 + 12) % 12] + (Math.floor(m / 12) - 1); }
  function fr(i) { var F = OBD.frames, n = F.length; return F[(i % n + n) % n]; }
  function box(el, cv) { return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; }

  function drawGauge(ctx, g, f) {
    var cx = g.x + g.w / 2, cy = g.y + g.h * 0.92, R = Math.min(g.w * 0.46, g.h * 0.84), A = Math.PI / 3;
    ctx.lineWidth = 2; ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2 - A, -Math.PI / 2 + A); ctx.stroke();
    for (var c = -50; c <= 50; c += 10) {
      var a = -Math.PI / 2 + c / 50 * A, l = c % 50 ? 0.07 : 0.14;
      ctx.strokeStyle = c ? COL.dim : COL.acc; ctx.lineWidth = c ? 1.5 : 2.5;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.lineTo(cx + Math.cos(a) * R * (1 - l), cy + Math.sin(a) * R * (1 - l)); ctx.stroke();
    }
    function needle(cents, col, wid, alpha) { // outer band only: never crosses the note name
      var a = -Math.PI / 2 + clamp(cents, -55, 55) / 50 * A;
      ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = wid; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.58, cy + Math.sin(a) * R * 0.58);
      ctx.lineTo(cx + Math.cos(a) * R * 0.96, cy + Math.sin(a) * R * 0.96); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (f.voiced) { var dm = midi(f.f0); needle((dm + f.corr - f.note) * 100, COL.acc, 3, 0.45); needle((dm - f.note) * 100, COL.ink, 3, 1); }
  }
  function drawGraph(ctx, g, i) {
    var lo = LANES[0], hi = LANES[1], lh = g.h / (hi - lo + 1), secs = 4, hz = window.RT_FEED.hz;
    var sAbs = OBD.scaleAbs(), legal = OBD.legalAbs();
    function y(m) { return g.y + g.h - (m - lo + 0.5) * lh; }
    for (var m = lo; m <= hi; m++) { // in-scale lanes only; user-on brighter, the key's own lane in the accent
      var pc = (m % 12 + 12) % 12; if (!((sAbs >> pc) & 1)) continue;
      var on = (legal >> pc) & 1;
      ctx.strokeStyle = on && pc === OBD.P.AT_KEY ? COL.acc : on ? COL.dim : COL.grid;
      ctx.globalAlpha = on ? 0.85 : 0.4; ctx.lineWidth = on ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(g.x, y(m)); ctx.lineTo(g.x + g.w, y(m)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var n = Math.round(secs * hz), pps = g.w / secs, x1 = g.x + g.w;
    ctx.save(); ctx.beginPath(); ctx.rect(g.x, g.y, g.w, g.h); ctx.clip();
    [[COL.dim, 1.4, 0, 0.75], [COL.ink, 2.4, 1, 1]].forEach(function (L) {
      ctx.strokeStyle = L[0]; ctx.lineWidth = L[1]; ctx.globalAlpha = L[3]; ctx.beginPath();
      var pen = false, py = 0;
      for (var k = n; k >= 0; k--) {
        var f = fr(i - k);
        if (!(f.f0 > 0) || (L[2] && !f.voiced)) { pen = false; continue; }
        var x = x1 - k / hz * pps, yy = y(midi(f.f0) + (L[2] ? f.corr : 0));
        if (pen && Math.abs(yy - py) < 5 * lh) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); // a detector jump is a gap, not a wall
        pen = true; py = yy;
      }
      ctx.stroke();
    });
    ctx.restore(); ctx.globalAlpha = 1;
  }
  var lastLive = {};
  OBD.draw = function () {
    var R = OBD.root; if (!R || !OBD.frames.length) return;
    var i = OBD.frameIndex(), f = fr(i), live = f.voiced, cents = live ? Math.round((midi(f.f0) - f.note) * 100) : 0;
    var noteS = live ? noteName(f.note) : '--', centsS = live ? (cents > 0 ? '+' : '') + cents + ' c' : '';
    each('.lv-note', function (el) { setText(el, noteS); });
    each('.lv-cents', function (el) { setText(el, centsS); });
    each('.lv-voiced', function (el) { setText(el, live ? 'VOICED' : '--'); el.classList.toggle('on', live); });
    each('.m-in', function (el) { setStyle(el, 'left', (50 + clamp(cents, -50, 50)) + '%'); setStyle(el, 'opacity', live ? '1' : '0.25'); });
    var cv = R.querySelector('canvas.cv');
    if (!cv || !cv.offsetWidth) return;
    var rect = cv.getBoundingClientRect(), w = cv.offsetWidth, h = cv.offsetHeight;
    if (!rect.width) return;
    var k = rect.width / w * (window.devicePixelRatio || 1), W = Math.round(w * k), H = Math.round(h * k);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, w, h);
    var hero = cv.parentNode, gEl = hero.querySelector('.g-gauge'), pEl = hero.querySelector('.g-graph');
    if (gEl) drawGauge(ctx, box(gEl), f);
    if (pEl) drawGraph(ctx, box(pEl), i);
    lastLive.i = i;
  };

  /* =================================================================================================================
   * Markup helpers + the three layout builders. Positions live in obdtune.css (.L-A / .L-B / .L-C, the p-<part> class).
   * ================================================================================================================= */
  function attrs(a) { var s = ''; for (var k in a) if (a.hasOwnProperty(k)) s += ' ' + k + '="' + a[k] + '"'; return s; }
  function key(part, legend, a, lamp) { // hit zone (data-part) > slot + cap (the drawn key); lamp glows from the base
    a = a || {}; a['data-part'] = part; a['class'] = 'key p-' + part + (a['class'] ? ' ' + a['class'] : '');
    return '<div' + attrs(a) + '><i class="well"></i><div class="cap surf"><span class="lg">' + legend + '</span>' +
      (lamp ? '<i class="lamp"' + (lamp === true ? '' : ' data-read="' + lamp + '" data-show="lamp"') + '></i>' : '') + '</div></div>';
  }
  function val(id, label, cls) {
    return '<div class="val ' + (cls || '') + '"' + attrs({ 'data-part': 'val-' + id, 'data-param': id, 'data-kind': 'val',
      'data-item': '', 'data-row': id }) + '><span class="v-n">' + label + '</span><span class="v-v" data-read="' + id + '"></span></div>';
  }
  function tog(id, label, cls) {
    return '<div class="val tog ' + (cls || '') + '"' + attrs({ 'data-part': 'tog-' + id, 'data-param': id, 'data-kind': 'tog',
      'data-item': '' }) + '><span class="v-n">' + label + '</span><span class="v-v" data-read="' + id + '"></span></div>';
  }
  function opt(part, id, v, label) {
    return '<div class="opt"' + attrs({ 'data-part': part, 'data-param': id, 'data-kind': 'opt', 'data-v': v, 'data-item': '' }) +
      '><span>' + label + '</span></div>';
  }
  function noteCell(pc) {   // w / b = a white or a black key in the NOTES page's KEYBOARD view
    return '<div class="note ' + ([1, 3, 6, 8, 10].indexOf(pc) >= 0 ? 'b' : 'w') + '"' + attrs({ 'data-part': 'note-' + pc, 'data-param': 'AT_NOTE_' + pc, 'data-kind': 'tog', 'data-item': '' }) +
      '><span>' + KEY_NAMES[pc] + '</span><i class="lamp" data-read="AT_NOTE_' + pc + '" data-show="lamp"></i></div>';
  }
  function noteKey(pc) {
    return key('note-' + pc, KEY_NAMES[pc], { 'data-param': 'AT_NOTE_' + pc, 'data-kind': 'tog', 'class': 'nk' }, 'AT_NOTE_' + pc);
  }
  function knob(id, label, size) {
    return '<div class="kwrap kw-' + id + ' ' + size + '"><div' + attrs({ 'class': 'knob', 'data-part': 'knob-' + id, 'data-param': id,
      'data-kind': 'val', 'data-row': id }) + '><i class="k-skirt surf"></i><i class="k-face surf"></i>' +
      '<i class="k-ptr" data-read="' + id + '" data-show="ptr"><b></b></i><i class="k-light"></i></div>' +
      '<span class="k-lg">' + label + '</span><span class="k-v" data-read="' + id + '"></span></div>';
  }
  function hero() {
    return '<div class="hero"><canvas class="cv"></canvas><div class="g-gauge"><div class="lv-note">--</div>' +
      '<div class="lv-cents"></div></div><div class="g-graph"></div></div>';
  }
  // a = layout A (10-13): row 2 = the crumb (◂ where BACK goes, dim) + the page (lit); HARM's word -> the TELLTALES, a
  // 2 x 2 lamp block over both rows on the right (one press zone, >= 50 design px tall: the CODES page)
  function header(a) {
    return '<div class="hdr"><div class="h1"><span class="h-on" data-read="AT_ON"></span><span class="h-ks">' +
      '<span data-read="AT_KEY"></span> <span data-read="AT_SCALE"></span></span><span class="lv-voiced"></span>' +
      (a ? '' : '<span class="h-hm" data-read="HM_ON" data-show="hm"></span>') + '</div><div class="h2">' +
      (a ? '<span class="h-back">▸</span>' : '<span class="h-arrow">▸</span>') + '<span class="h-mode" data-mode></span></div>' +
      (a ? '<div class="tt" data-part="codes" data-kind="nav" data-nav="codes"><i data-tt="T">T</i><i data-tt="H">H</i>' +
        '<i data-tt="F">F</i><i data-tt="C">C</i></div>' : '') + '</div>';
  }
  // the CODES page (10-13, the scanner's READ CODES): one cell per code, shown while it is on; a press = its fix
  function codesPage() {
    var h = '<div class="page pg-codes" data-page="codes"><div class="cd-none">NO CODES<span>ALL SYSTEMS OK</span></div><div class="cd-list">';
    CODES.forEach(function (c) {
      h += '<div class="val cd' + (c.fault ? ' cd-f' : '') + '"' + attrs({ 'data-part': 'code-' + c.id, 'data-kind': 'code',
        'data-code': c.id, 'data-item': '' }) + '><span class="v-n">' + c.id + '</span><span class="v-v">' + c.txt + '</span></div>';
    });
    return h + '</div></div>';
  }
  function setupPage() {
    return '<div class="page pg-setup" data-page="setup"><div class="s-t">BACKGROUND <span data-read="BACKGROUND"></span></div>' +
      '<div class="s-opts">' + opt('opt-bg-0', 'BACKGROUND', 'FLOATING', 'FLOATING') + opt('opt-bg-1', 'BACKGROUND', 'ROOM', 'ROOM') +
      '</div><div class="s-v" data-read="info"></div></div>';
  }
  // FX (10-7): a cell shown only while another parameter has a value (cond = 'ID=value'); a unit tile; a unit page
  function when(cond, html) { return html.replace('<div class="val', '<div data-when="' + cond + '" class="val'); }
  function fxTile(u, name, byp, mix, last) {   // mix null = an insert (the EQ): says FLAT while flat
    return '<div class="tile fxt' + (last ? ' r' : '') + '"' + attrs({ 'data-part': 'tile-fx-' + u, 'data-kind': 'tile', 'data-go': 'fx-' + u,
      'data-item': '', 'data-fxu': u }) + '><span class="t-n">' + name + '</span><span class="t-v"><span data-read="' + byp + '"></span>' +
      (mix ? '<span class="t-s"> MIX </span><span data-read="' + mix + '"></span>' : '<span class="t-s" data-read="' + byp + '" data-show="eqflat"></span>') +
      '</span></div>';
  }
  // EQ (10-11): EQ ON + the node in hand (a press steps LOW CUT -> BELL 1 -> BELL 2 -> HIGH CUT), the curve on the LCD with
  // its 4 dots (drag = the frequency, a bell's height = its gain; Shift = fine; wheel = a bell's width, a cut's frequency;
  // double-click = a cut OFF, a bell flat at Q 1), then the node's FREQ / GAIN / WIDTH (bound to the node in hand: eqSync).
  var EQ_NODES = [{ k: 'lc', name: 'LOW CUT', hz: 'EQ_LC_HZ' }, { k: 'b1', name: 'BELL 1', hz: 'EQ_B1_HZ', db: 'EQ_B1_DB', q: 'EQ_B1_Q' },
                  { k: 'b2', name: 'BELL 2', hz: 'EQ_B2_HZ', db: 'EQ_B2_DB', q: 'EQ_B2_Q' }, { k: 'hc', name: 'HIGH CUT', hz: 'EQ_HC_HZ' }];
  var EQ_PAD = 26, EQ_DBR = 18;   // the graph's inner margin (a dot's hit zone stays inside), its +-dB span
  function eqPage() {
    var dots = EQ_NODES.map(function (n, i) {
      var a = { 'class': 'eq-node', 'data-part': 'eq-node-' + n.k, 'data-kind': 'eqnode', 'data-node': i, 'data-param': n.hz, 'data-item': '' };
      if (n.db) a['data-param2'] = n.db;
      return '<i' + attrs(a) + '><b>' + (n.db ? i : n.k === 'lc' ? 'L' : 'H') + '</b></i>';
    }).join('');
    return '<div class="page pg-fxu pg-fx-eq" data-page="fx-eq">' + tog('BYP_EQ', 'EQ') +
      '<div class="val eq-sel"' + attrs({ 'data-part': 'eq-sel', 'data-kind': 'nav', 'data-nav': 'eqsel', 'data-item': '' }) +
        '><span class="v-n">NODE</span><span class="v-v eq-sel-n"></span></div>' +
      '<div class="eq-graph"><canvas class="eq-cv"></canvas>' + [[100, '100'], [1000, '1k'], [10000, '10k']].map(function (l) {
        return '<b class="eq-fl" style="left:calc(' + EQ_PAD + 'px + (100% - ' + 2 * EQ_PAD + 'px) * ' + (eqX(l[0]) / 100).toFixed(4) + ')">' + l[1] + '</b>';
      }).join('') + dots + '</div>' +
      '<div class="eq-read">' + val('EQ_B1_HZ', 'FREQ', 'eq-f').replace('<div class="val', '<div data-dyn="hz" class="val') +
        val('EQ_B1_DB', 'GAIN', 'eq-d').replace('<div class="val', '<div data-dyn="db" class="val') +
        val('EQ_B1_Q', 'WIDTH', 'eq-q').replace('<div class="val', '<div data-dyn="q" class="val') + '</div></div>';
  }
  // the graph's law: x = log frequency 20 Hz .. 20 kHz across the inner width (in % of the graph, for the labels)
  function eqX(f) { return (100 * Math.log(clamp(f, 20, 20000) / 20) / Math.log(1000)).toFixed(3); }
  // the drawn curve = the analog target the C++ matches (12 dB/oct Butterworth cuts, the cookbook bell prototype), in dB
  function eqDb(f) {
    var P = OBD.P, d = 0, r;
    if (!lcOff(P.EQ_LC_HZ)) { r = Math.pow(f / P.EQ_LC_HZ, 4); d += 10 * Math.log(r / (1 + r)) / Math.LN10; }
    if (!hcOff(P.EQ_HC_HZ)) { r = Math.pow(f / P.EQ_HC_HZ, 4); d -= 10 * Math.log(1 + r) / Math.LN10; }
    [1, 2].forEach(function (b) {
      var g = P['EQ_B' + b + '_DB']; if (!g) return;
      var A = Math.pow(10, g / 40), Q = P['EQ_B' + b + '_Q'], O = f / P['EQ_B' + b + '_HZ'], w = (1 - O * O) * (1 - O * O);
      d += 10 * Math.log((w + Math.pow(A * O / Q, 2)) / (w + Math.pow(O / (A * Q), 2))) / Math.LN10;
    });
    return d;
  }
  // the readout cells + the dots follow the state (render calls this first, so the [data-read] fill sees the new ids)
  function eqSync() {
    var R = OBD.root; if (!R) return;
    var n = EQ_NODES[OBD.ui.eqSel] || EQ_NODES[1];
    each('.eq-read [data-dyn]', function (el) {
      var id = n[el.getAttribute('data-dyn')];
      el.classList.toggle('gone', !id);
      if (!id) { el.removeAttribute('data-item'); return; }
      setAttr(el, 'data-item', ''); setAttr(el, 'data-param', id); setAttr(el, 'data-part', 'val-' + id); setAttr(el, 'data-row', id);
      setAttr(el.querySelector('.v-v'), 'data-read', id);
    });
    each('.eq-sel-n', function (el) { setText(el, n.name); });
  }
  function eqPlace() {   // the dots on the graph (it must be shown: its size places them)
    var R = OBD.root;
    each('.eq-node', function (el) {
      var i = +el.getAttribute('data-node'), m = EQ_NODES[i], P = OBD.P, g = R.querySelector('.eq-graph');
      if (!g) return;
      var w = g.clientWidth - 2 * EQ_PAD, h = g.clientHeight, f = P[m.hz];
      var off = m.k === 'lc' ? lcOff(f) : m.k === 'hc' ? hcOff(f) : false;
      setStyle(el, 'left', (EQ_PAD + w * eqX(f) / 100).toFixed(1) + 'px');
      setStyle(el, 'top', (h / 2 - (m.db ? P[m.db] : 0) / EQ_DBR * (h / 2 - EQ_PAD)).toFixed(1) + 'px');
      el.classList.toggle('off', off);
      el.classList.toggle('sel', i === OBD.ui.eqSel);
    });
  }
  function eqDraw() {
    var R = OBD.root, cv = R && R.querySelector('.eq-cv'); if (!cv || !cv.offsetWidth) return;
    var g = cv.parentNode, cw = g.clientWidth, ch = g.clientHeight, k = Math.max(1, g.getBoundingClientRect().width / cw) * (window.devicePixelRatio || 1);
    if (cv.width !== Math.round(cw * k) || cv.height !== Math.round(ch * k)) { cv.width = Math.round(cw * k); cv.height = Math.round(ch * k); }
    var c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, cw, ch);
    var w = cw - 2 * EQ_PAD, mid = ch / 2, sy = (ch / 2 - EQ_PAD) / EQ_DBR;
    c.lineWidth = 1; c.strokeStyle = COL.grid;
    [100, 1000, 10000].forEach(function (f) { var x = EQ_PAD + w * eqX(f) / 100; c.beginPath(); c.moveTo(x, 6); c.lineTo(x, ch - 6); c.stroke(); });
    [-12, 12].forEach(function (d) { c.beginPath(); c.moveTo(EQ_PAD, mid - d * sy); c.lineTo(cw - EQ_PAD, mid - d * sy); c.stroke(); });
    c.strokeStyle = COL.dim; c.beginPath(); c.moveTo(EQ_PAD, mid); c.lineTo(cw - EQ_PAD, mid); c.stroke();
    var pts = [];
    for (var i = 0; i <= 200; i++) { var f = 20 * Math.pow(1000, i / 200); pts.push([EQ_PAD + w * i / 200, mid - clamp(eqDb(f), -EQ_DBR - 6, EQ_DBR + 6) * sy]); }
    c.save(); c.beginPath(); c.rect(0, 2, cw, ch - 4); c.clip();
    c.globalAlpha = 0.14; c.fillStyle = COL.acc; c.beginPath(); c.moveTo(pts[0][0], mid);
    pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(pts[pts.length - 1][0], mid); c.closePath(); c.fill();
    c.globalAlpha = 1; c.strokeStyle = COL.acc; c.lineWidth = 2; c.beginPath();
    pts.forEach(function (p, j) { if (j) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); c.restore();
  }
  function fxPage(u, byp, name, mix, cards) {
    var h = '<div class="page pg-fxu pg-fx-' + u + '" data-page="fx-' + u + '">' + tog(byp, name) + val(mix, 'MIX');
    cards.forEach(function (c) { h += '<div class="card"><span class="c-n">' + c[0] + '</span>' + c.slice(1).join('') + '</div>'; });
    return h + '</div>';
  }
  function fxPages() {
    // 10-11: the tiles in the chain's order (EQ -> SQUEEZE -> ECHO -> REVERB, Yoni 2026-11-18)
    return '<div class="page pg-fx" data-page="fx">' + tog('BYP_FX', 'FX POWER') + val('FX_MIX', 'MIX') +
        fxTile('eq', 'EQ', 'BYP_EQ', null) + fxTile('sqz', 'SQUEEZE', 'BYP_SQZ', 'SQZ_MIX', true) +
        fxTile('echo', 'ECHO', 'BYP_DLY', 'DLY_MIX') + fxTile('verb', 'REVERB', 'BYP_VERB', 'VERB_MIX', true) + '</div>' + eqPage() +
      fxPage('sqz', 'BYP_SQZ', 'SQUEEZE', 'SQZ_MIX', [
        ['COMP', val('SQZ_IN', 'IN'), val('SQZ_RATIO', 'RATIO'), val('SQZ_ATTACK', 'ATTACK'), val('SQZ_RELEASE', 'RELEASE')],
        ['OUT', val('SQZ_OUT', 'OUT'), '<div class="val fx-gr"><span class="v-n">GR</span><b class="v-v"></b><i></i></div>']]) +
      fxPage('echo', 'BYP_DLY', 'ECHO', 'DLY_MIX', [
        ['TIME', val('DLY_MODE', 'SYNC'), when('DLY_MODE=0', val('DLY_DIV', 'TIME')), when('DLY_MODE=1', val('DLY_TIME_MS', 'TIME')),
          val('DLY_FEEDBACK', 'FDBK'), tog('DLY_PINGPONG', 'PING')],
        ['TONE', val('DLY_CHAR', 'CHAR'), val('DLY_WIDTH', 'WIDTH'), val('DLY_MOD', 'WOBBLE'), val('DLY_DUCK', 'DUCK')]]) +
      fxPage('verb', 'BYP_VERB', 'REVERB', 'VERB_MIX', [
        ['SPACE', val('VERB_TYPE', 'TYPE'), val('VERB_SYNC', 'SYNC'),
          when('VERB_SYNC=1', val('VERB_DECAY', 'DECAY')), when('VERB_SYNC=0', val('VERB_DEC_DIV', 'DECAY')),
          when('VERB_SYNC=1', val('VERB_PREDELAY', 'PRE')), when('VERB_SYNC=0', val('VERB_PRE_DIV', 'PRE'))],
        ['TONE', val('VERB_BRIGHT', 'BRIGHT'), val('SHIMMER', 'SHIMMER'), val('VERB_DUCK', 'DUCK')]]) +
      '';
  }
  // a cell that opens a page (10-10: HARMONY's POS); its value = that page's switch
  function opener(go, label, id) {
    return '<div class="val tog go"' + attrs({ 'data-part': 'tile-' + go, 'data-kind': 'tile', 'data-go': go, 'data-item': '' }) +
      '><span class="v-n">' + label + '</span><span class="v-v" data-read="' + id + '"></span></div>';
  }
  // POSITION (10-10): POSITION ON + the LATENCY it adds, then per voice its MODE, the LANE and a readout. The lane IS the
  // control (Yoni 2026-11-18: "the moving of the timing to be by pressing the bar and draging - not from a button next to
  // it ... display the ms amount next to the bar"): the VOX line = the lead, the block = the voice, early left / late
  // right; a press puts the voice there, a drag moves it (wireLane). Its data-param follows MODE (POS_MS | POS_DIV).
  // The readout = the offset in ms (+ the note value in SYNC); data-fit = the state BENCH.fit sweeps that text in.
  function posPage() {
    var h = '<div class="page pg-pos" data-page="harm-pos">' + tog('HM_POS_ON', 'POSITION') +
      '<div class="val pos-lat"><span class="v-n">LATENCY</span><span class="v-v" data-read="HM_POS_ON" data-show="poslat"></span></div>';
    [1, 2].forEach(function (v) {
      var p = 'HM_' + v + '_';
      h += '<div class="card" data-voice="' + v + '"><span class="c-n">V' + v + '<span class="c-iv" data-read="' + p + 'INTERVAL"></span></span>' +
        val(p + 'POS_SYNC', 'MODE') +
        '<div class="pos-lane"' + attrs({ 'data-lane': v, 'data-part': 'lane-' + v, 'data-kind': 'lane', 'data-param': p + 'POS_MS', 'data-item': '' }) + '>' +
        '<b class="pl-vt">VOX</b><b class="pl-e">EARLY</b><b class="pl-l">LATE</b>' +
        '<i class="pl-in"><i class="pl-track"></i><i class="pl-vox"></i><i class="pl-v"></i></i></div>' +
        '<div class="pos-read"><span class="pr-n" data-read="' + p + 'POS_DIV" data-show="posnote" data-fit="' + p + 'POS_SYNC=0"></span>' +
        '<span class="pr-v" data-read="' + p + 'POS_MS" data-show="posms"></span></div></div>';
    });
    return h + '</div>';
  }
  function voiceCards(cls) {
    var s = '';
    [1, 2].forEach(function (v) {
      var p = 'HM_' + v + '_';
      s += '<div class="card ' + (cls || '') + '" data-voice="' + v + '"><span class="c-n">V' + v + '</span>' + val(p + 'INTERVAL', 'INT') + val(p + 'LEVEL', 'LVL') +
        val(p + 'PAN', 'PAN') + val(p + 'FORMANT', 'FMT') + '</div>';
    });
    return s;
  }
  function dpad() {
    return '<div class="dpad p-dpad"><i class="d-ring surf"></i>' +
      key('up', '▲', { 'data-kind': 'nav', 'data-nav': 'up', 'class': 'dk' }) +
      key('left', '◀', { 'data-kind': 'nav', 'data-nav': 'left', 'class': 'dk' }) +
      key('ok', 'OK', { 'data-kind': 'nav', 'data-nav': 'ok', 'class': 'dk' }) +
      key('right', '▶', { 'data-kind': 'nav', 'data-nav': 'right', 'class': 'dk' }) +
      key('down', '▼', { 'data-kind': 'nav', 'data-nav': 'down', 'class': 'dk' }) + '</div>';
  }
  function frame(legend) { // the parts every layout shares: cable, bumper (grab), body, logo, model text, screw, grip
    return '<i class="photo"></i>' + // the PHOTO skin's plate (obdtune.css); hidden in every other skin
      '<div class="cable"><i class="c-wire"></i><i class="c-boot surf"></i></div>' +
      '<div class="bumper surf" data-part="grab" data-param="GRAB"></div><div class="body surf"><i class="seam"></i></div>' +
      '<div class="logo">RevAudio</div><div class="model">OBDTUNE</div><div class="legend">' + legend + '</div>';
  }
  function frameTop(a) {
    var grip = '<div class="grip" data-part="grip" data-param="GRIP"><i class="g-ribs"></i></div>';
    // A (Yoni 2026-11-11): CLOSE = a rubber side key standing proud of the RIGHT edge, a bit up (like a phone's side
    // key); the screw moved to the LEFT side wall, screwed in from the side, with an "i" on its head: INFO (the SERVICE
    // page). B / C keep the screw = close. 0.3.7 (Yoni 2026-11-12, BUTTON LAB): INFO = a lit brass lamp button, CLOSE =
    // the slim side key (obdtune.css).
    if (a) return '<div class="sidekey" data-part="close" data-param="CLOSE"><i class="sk-well"></i><i class="sk-cap"><b>CLOSE</b></i></div>' +
      '<div class="wallscrew" data-part="info" data-param="INFO" data-kind="nav" data-nav="info"><i class="ws-head"><b>i</b></i>' +
      '</div>' + grip;   // 0.3.7: the INFO text under it is gone (Yoni 2026-11-12); the lit brass i says it
    return '<div class="screw" data-part="close" data-param="CLOSE"><i class="s-head surf"><b></b></i></div>' + grip;
  }
  // the SERVICE page (A; the house service card, GAS 2's: BACKGROUND, SIZE, FOLLOW + the five socials, version, site)
  var SOCIALS = [
    ['ig', 'Instagram', 'https://www.instagram.com/revaudioplugins', 'M12 2.2c3.2 0 3.6 0 4.85.06 3.25.15 4.77 1.69 4.92 4.92.06 1.26.07 1.63.07 4.82s-.01 3.56-.07 4.82c-.15 3.23-1.66 4.77-4.92 4.92-1.25.06-1.62.07-4.85.07s-3.6-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.93C2.17 15.56 2.16 15.19 2.16 12s.01-3.56.07-4.82C2.38 3.95 3.9 2.41 7.15 2.26 8.4 2.21 8.8 2.2 12 2.2zm0 3.3a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 2.3a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zm6.7-2.6a1.52 1.52 0 1 0 0 3.04 1.52 1.52 0 0 0 0-3.04z'],
    ['yt', 'YouTube', 'https://www.youtube.com/@RevAudioPlugins', 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z'],
    ['tt', 'TikTok', 'https://www.tiktok.com/@revaudioplugins', 'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'],
    ['x', 'X', 'https://x.com/revaudioplugins', 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z'],
    ['fb', 'Facebook', 'https://www.facebook.com/profile.php?id=61591226475818', 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z']
  ];
  function servicePage() {
    function k(part, label, nav, url) {
      return '<div class="opt sv-k"' + attrs({ 'data-part': part, 'data-kind': 'nav', 'data-nav': nav, 'data-url': url || '', 'data-item': '' }) +
        '><span>' + label + '</span></div>';
    }
    var soc = SOCIALS.map(function (s) {
      return '<div class="opt sv-soc-k"' + attrs({ 'data-part': 'soc-' + s[0], 'data-kind': 'nav', 'data-nav': 'url', 'data-url': s[2],
        'data-item': '', 'title': s[1] }) + '><svg viewBox="0 0 24 24"><path d="' + s[3] + '"/></svg></div>';
    }).join('');
    return '<div class="page pg-service" data-page="service">' +
      '<div class="sv-row"><span class="sv-n">BACKGROUND</span>' + opt('sv-bg-0', 'BACKGROUND', 'FLOATING', 'FLOATING') +
        opt('sv-bg-1', 'BACKGROUND', 'ROOM', 'ROOM') + '</div>' +
      '<div class="sv-row"><span class="sv-n">SIZE</span>' + k('sv-size-dn', '−', 'sizedn') + '<span class="sv-size"></span>' +
        k('sv-size-up', '+', 'sizeup') + '</div>' +
      (OBD.licencePage ? '<div class="sv-row"><span class="sv-n">LICENCE</span>' + k('sv-lic', '--', 'licence') + '</div>' : '') +   // 10-16
      '<div class="sv-row sv-follow"><span class="sv-n">FOLLOW</span><span class="sv-at">@revaudioplugins</span></div>' +
      '<div class="sv-soc">' + soc + '</div>' +
      '<div class="sv-row sv-foot"><span class="sv-ver" data-read="info"></span>' + k('sv-site', 'revaudio.net', 'url', 'https://revaudio.net') + '</div>' +
      '</div>';
  }
  var POWER = function () { return key('power', 'POWER', { 'data-param': 'AT_ON', 'data-kind': 'tog' }, 'AT_ON'); };
  var LISTEN = function () { return key('listen', 'LISTEN', { 'data-param': 'LISTEN', 'data-kind': 'nav', 'data-nav': 'listen' }, 'LISTEN'); };
  var ESC = function () { return key('esc', 'ESC', { 'data-kind': 'nav', 'data-nav': 'esc' }); };
  // A: ESC renamed; 10-13: the whole key BACKLIT while BACK has a level to go up to (round 3, Yoni: "not the line
  // indication like in power - i want the button itself to feel backlit"; obdtune.css)
  var BACK = function () { return key('back', '← BACK', { 'data-kind': 'nav', 'data-nav': 'esc' }); };

  /* A in 3D (Yoni 2026-11-11: "a bit 3d like revamp", then "instead of up and down, go left and right"): RevAmp's recipe
   * (its DESIGN 26) - a one-point camera, here off to the LEFT at the device's middle height; the FRONT face (every
   * part, the photo, the screen) stays flat at z = 0, so it is pixel-exact and every hit test holds; the depth is a stack
   * of bumper-shaped strips BEHIND it (.ex = the device's left side wall, lit from the upper-left lamp; only the side
   * that faces the camera peeks out). The device sits DEV_LEFT px in from the box's left edge, beside the OBD connector. */
  var DEV_LEFT = 215, EX_DEPTH = 56, EX_N = 28;   // 56: a wider side wall carries the INFO screw readably (0.3.6)
  function extrude() { // far strips first: painted first, so behind the near ones (no preserve-3d sorting needed)
    var s = '';
    for (var i = EX_N; i >= 1; i--) {
      // darker toward the back; the first strips = the bumper's rolled front edge catching the lamp
      var k = 1 - 0.45 * i / EX_N + (i <= 3 ? 0.3 - 0.075 * i : 0), c = function (r, g, b) { return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')'; },
        z = (-EX_DEPTH * i / EX_N).toFixed(2);
      s += '<i class="ex" style="-webkit-transform:translateZ(' + z + 'px);transform:translateZ(' + z + 'px);background:linear-gradient(180deg,' +
        c(74, 69, 63) + ' 0%,' + c(50, 46, 42) + ' 45%,' + c(28, 26, 24) + ' 100%)"></i>';
    }
    return s;
  }
  /* The OBD connector + cable (Yoni 2026-11-11: realistic, "all the way to the left of the device - almost next to the
   * device itself", with places to touch for actions): ONE photo (assets/photo/plug-A.png, Higgsfield gpt_image_2_6, a
   * transparent cutout), its cable tucked under the device's side wall. Three touch zones over it (.hot, data-part
   * plug-*): what each does is tried on the PLUG LAB bench (plug-lab.js); the object only carries the zones, the
   * lit-pin overlay and the "pulled out" state. PLUG = the photo's box in design px, ZONES = its parts (pixel scan). */
  // pixel scan of plug-1.png (768 x 1536 -> 210 x 420): shell 7..139 x 42..145, latch ~60..87 x 64..82, pins 31..117 x
  // 105 / 126, the cable leaves the box's right edge at y 317..342 (behind the side wall). Zones >= 46 design px (28 css
  // px at the laptop size); each centre lands on its own zone (smoke traps), all left of the device front (x < 215).
  // The plug paints OVER the device: its cable hangs in front of the side wall and ends inside it (x 210), the device's
  // side entry. Two layers of the one photo: .con = the connector (it lifts when pulled), .cab = the cable (fixed to the
  // device).
  // DETECT = the connector itself (Yoni 2026-11-11: "change the detect button to the obd connector"): the zone over its
  // shell is the part `detect` (data-param DETECT, nav detect), so the bench stand-in, the smoke's T6 and the plugin's
  // real DETECT native all find it where the key was. LATCH and CABLE stay PLUG LAB zones (plug-lab.js). The zones come
  // FIRST in the box and the photo layers (pointer-events none) paint over them, so a pressed zone can push its own
  // layer (CSS ~). PLUG / ZONES / PINS = the pixel scan of the current photo (assets/photo/PROMPTS.md).
  // 2026-11-11 later (Yoni: "the cable to go out from the bottom, then going down left and coming up to around the middle
  // of the device"): a new photo (assets/photo/cab2-1.png -> plug-A.png, 768 x 1344 -> 295 x 516, scale .3841): the
  // connector at the device's middle height, the cable down, a U under the device, up into its bottom (hidden by the
  // device: the plug paints UNDER it now). Scan: shell 3.5..135.6 x 38.8..142.5, pins at y 102.9 / 126.1, the left
  // strand x 37..58, the rising strand x 269..289 (box x 294..314, inside the device's bottom).
  var PLUG = { x: 25, y: 365, w: 295, h: 516 };
  var ZONES = { cable: [22, 200, 52, 200], detect: [8, 56, 124, 88], latch: [44, 2, 52, 52] };   // >= 50 design px (28 css at .566)
  var PINS = [[26.5, 102.9], [38.8, 102.9], [51.4, 102.9], [63.8, 102.9], [76.8, 102.9], [88.7, 102.9], [101.1, 102.9], [113.8, 102.9],
    [26.3, 126.1], [39.0, 126.1], [51.5, 126.1], [64.1, 126.1], [76.5, 126.1], [89.0, 126.1], [101.5, 126.1], [113.3, 126.1]];
  var PIN_PC = [-1, 0, 1, 2, 3, 4, 5, -1, -1, 6, 7, 8, 9, 10, 11, -1]; // the six middle pins of each row carry C .. B
  OBD.PLUG_PINS = PINS;
  function plug() {
    var z = '', g = '';
    PINS.forEach(function (p, i) {
      g += '<b' + (PIN_PC[i] >= 0 ? ' data-pc="' + PIN_PC[i] + '"' : '') + ' style="left:' + p[0] + 'px;top:' + p[1] + 'px;--i:' + i + '"></b>';
    });
    ['cable', 'detect', 'latch'].forEach(function (k) {
      var r = ZONES[k], a = k === 'detect' ? 'data-part="detect" data-param="DETECT" data-kind="nav" data-nav="detect"'
                                         : 'data-part="plug-' + k + '" data-kind="plug"';
      z += '<div class="hot hot-' + k + '" ' + a + ' style="left:' + r[0] + 'px;top:' + r[1] +
        'px;width:' + r[2] + 'px;height:' + r[3] + 'px"></div>';
    });
    return '<div class="plug" style="left:' + PLUG.x + 'px;top:' + PLUG.y + 'px;width:' + PLUG.w + 'px;height:' + PLUG.h + 'px">' +
      // .det-red = the engraved DETECT lit red from inside (Dan 2026-11-24: "make the detect reading blink with red so user
      // can see it"; assets/photo/make-detect-red.py); obdtune.css blinks it
      z + '<i class="plug-img cab"></i><i class="plug-img con"></i><i class="det-red"></i><i class="plug-glow">' + g + '</i>' +
      // the measurement mic on its OBD adapter (Yoni 2026-11-11: plugs onto the connector while DETECT listens, glides
      // away after; assets/photo/mic-A.png): CSS shows it on .plug.listening
      // 0.3.8 (Yoni 2026-11-12): it waits below the window's bottom edge and RISES into the slot; .mic-head = its
      // capsule drawn again 30 % bigger ("needs to understand it's a mic")
      '<i class="mic-lane"><i class="mic"><i class="mic-head"></i></i></i></div>';
  }
  var LAYOUTS = {
    // A (Dan's pick, 2026-11-05): 520 x 810, opens at the house maximum (open: 0.9 x fit), screen text about x1.5;
    // 2026-11-11 (Yoni): in 3D beside the OBD connector, so the box is DEV_LEFT wider (the device box stays 520 x 810);
    // + 20 on the right for the CLOSE side key, + 90 below for the cable's U under the device
    // + 32 right of the device: the CLOSE side key, 34 px wide since 0.4.0 (was + 25)
    A: { W: 520 + DEV_LEFT + 32, H: 900, open: 0.9, views: ['home', 'tune', 'notes', 'harm', 'harm-pos', 'live', 'custom', 'service',
                                                          'fx', 'fx-eq', 'fx-sqz', 'fx-echo', 'fx-verb', 'codes', 'licence'], html: function () {
      // the NOTES tile = the NOTES page's KEYBOARD, one octave (Dan 2026-11-24: "change to the piano we have in the section,
      // i want to see the piano layout over here"): the page's key spacing in %, a key lit = the note sounds, the root ringed
      var KX = [0, 9.96, 14.43, 24.41, 28.87, 43.3, 53.27, 57.74, 67.69, 72.17, 82.12, 86.6];
      var lamps = ''; for (var i = 0; i < 12; i++) lamps += '<i class="pk ' + ([1, 3, 6, 8, 10].indexOf(i) >= 0 ? 'b' : 'w') +
        '" data-read="AT_NOTE_' + i + '" data-show="lamp" style="left:' + KX[i] + '%"></i>';
      var notes = ''; for (var j = 0; j < 12; j++) notes += noteCell(j);
      function tile(go, name, inner, cyc, st) { // cyc = the id one click steps (VOICE, SETUP); otherwise the tile opens a page
        var a = cyc ? { 'data-part': 'tile-' + go, 'data-kind': 'cyc', 'data-param': cyc, 'data-item': '' }
                    : { 'data-part': 'tile-' + go, 'data-kind': 'tile', 'data-go': go, 'data-item': '' };
        // st = a switch shown in the title row (a fixed 3-cell slot, right), so the value lines stay three
        return '<div class="tile' + (cyc ? ' cyc' : '') + '"' + attrs(a) + '><span class="t-n">' + name + '</span>' +
          (st ? '<span class="t-st" data-read="' + st + '"></span>' : '') + '<span class="t-v">' + inner + '</span></div>';
      }
      return plug() + '<div class="dev">' + extrude() + frame('BACK · OK ENTER · DRAG A VALUE') +
        '<div class="bezel surf"><div class="glass surf">' + header(true) + '<div class="content">' +
        '<div class="page pg-home" data-page="home">' +
          // 10-10 (Yoni 2026-11-18: "the scale of the place for the texts is messed up"): 0.5.2's ON / OFF line + "KEY SCALE"
          // wrapping on 8 of 13 scales made 4-5 lines that climbed into the title. AUTOTUNE now sits in the title row; the
          // values are three lines that never wrap: KEY / SCALE / SPEED (AUTOTUNE off dims them, as a voice card that is off)
          tile('tune', 'TUNE', '<span class="t-l" data-read="AT_KEY"></span><span class="t-l t-sc" data-read="AT_SCALE"></span>' +
            '<span class="t-l" data-read="AT_RETUNE"></span>', null, 'AT_TUNE') +
          tile('notes', 'NOTES', '<span class="tpiano">' + lamps + '</span>') +
          // FX (Yoni 2026-11-16) where VOICE was (VOICE is a TUNE row now): FX POWER + a lamp per unit (lit = it sounds)
          // 10-11: the lamps in the chain's order: EQ, SQUEEZE, ECHO, REVERB
          tile('fx', 'FX', '<span data-read="BYP_FX" data-show="fxp"></span><br><span class="fxl"><i data-fxu="eq">Q</i>' +
            '<i data-fxu="sqz">S</i><i data-fxu="echo">E</i><i data-fxu="verb">R</i></span>') +
          tile('harm', 'HARMONY', '<span data-read="HM_ON"></span><br><span data-read="HM_1_INTERVAL" data-show="hv"></span><br><span data-read="HM_2_INTERVAL" data-show="hv"></span>') +
          tile('live', 'LIVE DATA', '<span class="lv-note">--</span>') +
          // CUSTOM (Yoni 2026-11-12) where SETUP was: BACKGROUND + the version live on the INFO screw's SERVICE page
          // 2026-11-24 (Dan: "on custom i want to see the live view of what happening inside the section"): the body = a
          // live mini graph + one line, ON / OFF and the edit count (obdtune-custom.js)
          tile('custom', 'CUSTOM', OBD.customTile ? OBD.customTile() : '') + '</div>' +
        // TUNE (Yoni 2026-11-16: "the voice selection screen, move it to 1 parameter in the tune section menu"): VOICE = a
        // row (a press steps SOPRANO / ALTO / TENOR); HUMAN + FLEX share a row so the five rows still fit. 0.5.2 (Yoni
        // 2026-11-17): the page's own switch AUTOTUNE leads, like FX POWER / HARM on theirs; it shares the top row with VOICE
        '<div class="page pg-tune" data-page="tune">' + tog('AT_TUNE', 'AUTOTUNE', 'half') + val('AT_VOICE', 'VOICE', 'half r') +
          val('AT_KEY', 'KEY', 'combo') + val('AT_SCALE', 'SCALE', 'combo') + val('AT_RETUNE', 'SPEED') +
          val('AT_HUMANIZE', 'HUMAN', 'half') + val('AT_FLEX', 'FLEX', 'half r') +
          comboList('AT_KEY') + comboList('AT_SCALE') + '</div>' +
        // NOTES: the same 12 note cells, laid out as a grid or as a piano octave (the toggle row under them)
        '<div class="page pg-notes" data-page="notes"><div class="nt-keys">' + notes + '</div><div class="nv-row">' +
          '<div class="opt" data-part="nv-grid" data-kind="nav" data-nav="nv-grid"><span>NOTES</span></div>' +
          '<div class="opt" data-part="nv-kb" data-kind="nav" data-nav="nv-kb"><span>KEYBOARD</span></div></div></div>' +
        // 10-10 (Yoni 2026-11-18): + POS, a fifth cell that opens the POSITION page (BACK returns here)
        '<div class="page pg-harm" data-page="harm">' + tog('HM_ON', 'HARM') + tog('HM_1_ON', 'V1') + tog('HM_2_ON', 'V2') + val('HM_MIX', 'MIX') +
          opener('harm-pos', 'POS ▸', 'HM_POS_ON') + voiceCards() + '</div>' + posPage() +
        '<div class="page pg-live" data-page="live">' + hero() + '</div>' + (OBD.customPage ? OBD.customPage() : '') + servicePage() + (OBD.licencePage ? OBD.licencePage() : '') +
        fxPages() + codesPage() + '</div>' +
        '<div class="mini"><span class="m-l">LIVE</span><span class="lv-note"></span><span class="lv-cents"></span>' +
        '<span class="m-bar"><i class="m-0"></i><i class="m-in"></i></span></div>' +
        // DETECT's scan bar (Yoni 2026-11-11): takes the LIVE strip's place while the connector listens
        '<div class="scanbar"><span class="sb-l">SCANNING KEY</span><span class="sb-bar"><i class="sb-fill"></i></span>' +
        '<span class="sb-p"></span></div>' +
        // a NEW fault (10-13): the strip says it for 3 s, the scan bar's idiom
        '<div class="msgbar"><span class="mb-t"></span></div></div></div>' +
        // 10-13 round 7: the photographed light around BACK + POWER (assets/photo/make-keylight.py), under the keys
        '<i class="keylight kl-back"></i><i class="keylight kl-power"></i>' +
        BACK() + POWER() + dpad() + frameTop(true) + '</div>'; // DETECT = the OBD connector (plug(), under the device)
    } },
    B: { W: 500, H: 920, views: ['rest', 'setup'], html: function () {
      var pad = ''; for (var i = 0; i < 12; i++) pad += noteKey(i);
      return frame('KEY + NOTE = KEY · D-PAD PICKS + NUDGES') +
        '<div class="bezel surf"><div class="glass surf">' + header() + '<div class="content">' +
        '<div class="page pg-live" data-page="live">' + hero() + '<div class="list">' + val('AT_RETUNE', 'SPEED') + val('AT_HUMANIZE', 'HUMAN') +
          val('AT_FLEX', 'FLEX') + val('AT_VOICE', 'VOICE') + val('HM_MIX', 'MIX') + '</div>' + voiceCards() + '</div>' + setupPage() + '</div></div></div>' +
        POWER() + LISTEN() + key('key-arm', 'KEY', { 'data-param': 'AT_KEY', 'data-kind': 'nav', 'data-nav': 'arm' }, true) +
        key('scale', 'SCALE', { 'data-param': 'AT_SCALE', 'data-kind': 'nav', 'data-nav': 'scale' }, true) +
        key('voice', 'VOICE', { 'data-param': 'AT_VOICE', 'data-kind': 'nav', 'data-nav': 'voice' }, true) +
        key('harm', 'HARM', { 'data-param': 'HM_ON', 'data-kind': 'tog' }, 'HM_ON') +
        '<div class="pad p-pad">' + pad + '</div>' + dpad() + ESC() +
        key('setup', 'SETUP', { 'data-kind': 'nav', 'data-nav': 'setup' }) + frameTop();
    } },
    C: { W: 1140, H: 600, views: ['rest', 'setup'], html: function () {
      var pad = ''; for (var i = 0; i < 12; i++) pad += noteKey(i);
      var strips = '';
      [1, 2].forEach(function (v) {
        var p = 'HM_' + v + '_';
        strips += key('int-' + v, 'V' + v + ' INT<b class="iv" data-read="' + p + 'INTERVAL"></b>',
          { 'data-param': p + 'INTERVAL', 'data-kind': 'val', 'class': 'intk' }) +
          '<div class="strip st-' + v + '">' + knob(p + 'LEVEL', 'LVL', 'ks') + knob(p + 'PAN', 'PAN', 'ks') + knob(p + 'FORMANT', 'FMT', 'ks') + '</div>';
      });
      return frame('KEY + NOTE = KEY · TURN A KNOB · TAP A VALUE') +
        '<div class="bezel surf"><div class="glass surf">' + header() + '<div class="content">' +
        '<div class="page pg-live" data-page="live">' + hero() + '<div class="list">' + val('AT_RETUNE', 'SPEED') + val('AT_HUMANIZE', 'HUMAN') +
          val('AT_FLEX', 'FLEX') + val('AT_VOICE', 'VOICE') + val('HM_MIX', 'MIX') + '</div></div>' + setupPage() + '</div></div></div>' +
        knob('AT_HUMANIZE', 'HUMAN', 'km') + knob('AT_RETUNE', 'SPEED', 'kl') + knob('AT_FLEX', 'FLEX', 'km') +
        key('harm', 'HARM', { 'data-param': 'HM_ON', 'data-kind': 'tog' }, 'HM_ON') + strips +
        key('key-arm', 'KEY', { 'data-param': 'AT_KEY', 'data-kind': 'nav', 'data-nav': 'arm' }, true) +
        key('scale', 'SCALE', { 'data-param': 'AT_SCALE', 'data-kind': 'nav', 'data-nav': 'scale' }, true) +
        key('voice', 'VOICE', { 'data-param': 'AT_VOICE', 'data-kind': 'nav', 'data-nav': 'voice' }) +
        '<div class="leds" data-read="AT_VOICE" data-show="led"><i data-led="0"></i><b>S</b><i data-led="1"></i><b>A</b>' +
        '<i data-led="2"></i><b>T</b></div>' +
        '<div class="pad p-pad">' + pad + '</div>' + POWER() + LISTEN() + ESC() +
        key('setup', 'SETUP', { 'data-kind': 'nav', 'data-nav': 'setup' }) + dpad() + frameTop();
    } }
  };
  // the ONE page part each layout declares for an id that is not on the face at rest (coverage depth 1)
  (function () {
    var A = {};
    ['AT_KEY', 'AT_SCALE', 'AT_RETUNE', 'AT_HUMANIZE', 'AT_FLEX'].forEach(function (id) { A[id] = 'tile-tune'; });
    for (var i = 0; i < 12; i++) A['AT_NOTE_' + i] = 'tile-notes';
    IDS.forEach(function (id) { if (id.indexOf('HM_') === 0) A[id] = 'tile-harm'; });
    A.BACKGROUND = 'info'; A.info = 'info'; A.CM_ON = 'tile-custom';   // since CUSTOM took the SETUP tile (2026-11-12): the INFO screw's SERVICE page
    A.AT_VOICE = 'tile-tune';   // 2026-11-16: a TUNE row (was its own home tile)
    A.AT_TUNE = 'tile-tune';    // 0.5.2: AUTOTUNE, the TUNE page's top row
    // FX (10-7): a list = the presses in order (the coverage depth = its length)
    A.BYP_FX = A.FX_MIX = 'tile-fx';
    var FXP = { echo: ['BYP_DLY', 'DLY_MIX', 'DLY_MODE', 'DLY_DIV', 'DLY_FEEDBACK', 'DLY_PINGPONG', 'DLY_CHAR', 'DLY_WIDTH', 'DLY_MOD', 'DLY_DUCK'],
                verb: ['BYP_VERB', 'VERB_MIX', 'VERB_TYPE', 'VERB_SYNC', 'VERB_DECAY', 'VERB_PREDELAY', 'VERB_BRIGHT', 'SHIMMER', 'VERB_DUCK'],
                eq: ['BYP_EQ', 'EQ_LC_HZ', 'EQ_HC_HZ', 'EQ_B1_HZ', 'EQ_B1_DB', 'EQ_B1_Q', 'EQ_B2_HZ'],
                sqz: ['BYP_SQZ', 'SQZ_MIX', 'SQZ_IN', 'SQZ_OUT', 'SQZ_ATTACK', 'SQZ_RELEASE', 'SQZ_RATIO'] };
    Object.keys(FXP).forEach(function (u) { FXP[u].forEach(function (id) { A[id] = ['tile-fx', 'tile-fx-' + u]; }); });
    A.DLY_TIME_MS = ['tile-fx', 'tile-fx-echo', 'val-DLY_MODE'];                 // behind ECHO's SYNC (default SYNC)
    A.VERB_DEC_DIV = A.VERB_PRE_DIV = ['tile-fx', 'tile-fx-verb', 'val-VERB_SYNC']; // behind REVERB's SYNC (default FREE)
    A.EQ_B2_DB = A.EQ_B2_Q = ['tile-fx', 'tile-fx-eq', 'eq-node-b2'];          // the readouts show BELL 2 once its dot is pressed
    // POSITION (10-10): HARMONY -> POS; a voice's note value sits behind its SYNC (default FREE)
    ['HM_POS_ON', 'HM_1_POS_SYNC', 'HM_1_POS_MS', 'HM_2_POS_SYNC', 'HM_2_POS_MS'].forEach(function (id) { A[id] = ['tile-harm', 'tile-harm-pos']; });
    A.HM_1_POS_DIV = ['tile-harm', 'tile-harm-pos', 'val-HM_1_POS_SYNC'];   // the lane carries it once MODE = SYNC
    A.HM_2_POS_DIV = ['tile-harm', 'tile-harm-pos', 'val-HM_2_POS_SYNC'];
    LAYOUTS.A.cover = A;
    LAYOUTS.B.cover = LAYOUTS.C.cover = { BACKGROUND: 'setup', info: 'setup' };
  })();
  OBD.LAYOUTS = LAYOUTS;

  // set a page / mode for a measurement (bench only; not a gesture, not counted)
  // POSITION's lane (10-10): press = the voice goes where the press is, drag = it follows (both on the lane's own law, so
  // the block sits under the finger), Shift + drag = fine (a tenth of the travel, from where it is), wheel / D-pad =
  // a nudge, double-click = 0. SYNC snaps to the nearest note value (the shortest when several share a pinned end).
  function laneN(el, x) { var r = el.querySelector('.pl-in').getBoundingClientRect(); return r.width > 0 ? clamp((x - r.left) / r.width, 0, 1) : 0.25; }
  function posNearestDiv(n) {
    var bpm = +OBD.ui.bpm || 120, best = POS_ZERO, bd = 1e9;
    for (var k = 0; k < POS_DIVS.length; k++) {
      [POS_ZERO + k, POS_ZERO - k].forEach(function (i) {
        if (i < 0 || i >= POS_DIVS.length) return;
        var d = Math.abs(posToNorm(clamp(posBeats(POS_DIVS[i]) * 60000 / bpm, -POS_LA, POS_MAX)) - n);
        if (d < bd - 1e-9) { bd = d; best = i; }
      });
    }
    return best;
  }
  function wireLane(el) {
    var n = 0.25;
    function id() { return el.getAttribute('data-param'); }
    function set(x) { n = clamp(x, 0, 1); if (SPEC[id()].kind === 'float') OBD.setNorm(id(), n); else OBD.write(id(), posNearestDiv(n)); }
    OBD.gesture(el, {
      start: function (e) {
        select(el);
        n = posToNorm(posVoice(+el.getAttribute('data-lane')).ms);
        if (!e.shiftKey) set(laneN(el, e.clientX));
        OBD.render();
      },
      drag: function (dx, dy, ev) {
        if (ev.shiftKey) set(n + dx / (10 * Math.max(1, el.querySelector('.pl-in').getBoundingClientRect().width)));
        else set(laneN(el, ev.clientX));
      },
      wheel: function (dir, fine) { nudge(id(), dir, fine); },
      dbl: function () { OBD.write(id(), SPEC[id()].def); }
    });
  }
  OBD.view = function (name) {
    if (OBD.ui.layout === 'A') go(name); else OBD.ui.setup = name === 'setup';
    OBD.render();
  };

  OBD.build = function (root, L) {
    OBD.root = root;
    OBD.resetUi();
    OBD.ui.layout = L;
    root.innerHTML = LAYOUTS[L].html();
    root.className = root.className.replace(/\bL-[ABC]\b/g, '').replace(/\s+/g, ' ') + ' L-' + L;
    each('[data-kind]', function (el) {
      var k = el.getAttribute('data-kind'), id = el.getAttribute('data-param');
      if (k === 'val' && el.hasAttribute('data-dyn')) wireValDyn(el);
      else if (k === 'val') wireVal(el, id);
      else if (k === 'eqnode') wireEqNode(el);
      else if (k === 'lane') wireLane(el);
      else if (k === 'tog') wireTog(el, id);
      else if (k === 'opt') wireOpt(el, id, el.getAttribute('data-v'));
      else if (k === 'tile') OBD.gesture(el, { press: function () { go(el.getAttribute('data-go')); } });
      else if (k === 'cyc') OBD.gesture(el, { press: function () { select(el); cycle(id); } });
      else if (k === 'nav') wireNav(el, el.getAttribute('data-nav'));
      else if (k === 'cpo') wireCpo(el);
      else if (k === 'code') OBD.gesture(el, { press: function () { jump(el.getAttribute('data-code')); } });
    });
    // 10-13: a press on the screen = the pointer is the hand again; the D-pad's outline goes until the D-pad is used
    each('.glass', function (el) { el.addEventListener('pointerdown', function () { OBD.ui.kbd = false; }, true); });
    CE.seen = null; CE.built = Date.now(); CE.bl = {};   // the first render after a build sets the codes + lights without a flash
    (OBD.ext || []).forEach(function (f) { f(root, L); });   // object extensions (obdtune-custom.js)
    LANES = laneRange();
    OBD.readColors();
    OBD.render();
    if (OBD.onBuild) OBD.onBuild(root, LAYOUTS[L]);
    return LAYOUTS[L];
  };

  OBD.recorrect();
  raf = window.requestAnimationFrame(tick);
})();
