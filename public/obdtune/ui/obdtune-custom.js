/* OBDTUNE CUSTOM (todo 10-2q C-1..C-4; Yoni 2026-11-12: "create a new feature there called Custom - this feature will
 * allow the user to edit the autotune (first he needs to play back then he sees the graph of the correction), and he
 * should be able to redraw the line easily and smoothly, the ui will snap his movements to the notes"; "keep" = a drawn
 * note keeps the singer's natural movement around it). Part of the OBJECT (synced to the plugin page like obdtune.js).
 * ES5 (the Safari-14 floor); no canvas filter.
 *
 * The page (layout A, tile CUSTOM on the home screen, where SETUP was): a timeline graph on the in-scale note lanes -
 * what was sung (dim), what the tune does (ink), YOUR line (accent, wide) - a playhead, and five LCD soft keys:
 * ON (the drawn line is applied), the TOOL (NOTE / DRAW / ERASE), SNAP SCALE / CHROM, UNDO, CLEAR. 2026-11-12 round 2
 * (Yoni: "the workflow of the drawing is not simple enough ... the text of the notes not clear enough ... while clicking
 * to draw I'll hear the sound of the note"): NOTE (the default) shows every sung note as a block - drag it up / down
 * and it moves in whole notes of the scale, double-click puts it back, a drag on empty space moves the view; DRAW =
 * freehand, the pointer's height snapped to the nearest legal note, 60 ms glides; ERASE = back to the auto tune. The
 * pressed note sounds (native `audition`); the first edit switches CUSTOM ON. 11 note lanes in view, their names big in their own column, the lane under
 * the pointer lit with its name beside the pointer. Wheel = time, Shift+wheel = zoom, the wheel over the names (or
 * Alt+wheel) and D-pad up-down = the lanes, D-pad left-right = time. Only what has been PLAYED shows; the marker = the
 * DAW's position, stopped too ("sync the daw marker"); the view follows it unless the hand used the graph in 2.5 s.
 * A click on the time ruler, or on empty space with NOTE, moves the DAW's marker there (native `locate`; ARA hosts only:
 * a plain VST3 / AU / AAX host cannot be moved, the graph then says LOCATE NEEDS ARA).
 *
 * Data (OBD.custom): a timeline at C.hz = 60 frames per second; cap[i] = played; T[i] = the drawn note (MIDI, NaN =
 * none); Tg = T with the glides (what is drawn + what the bench applies). ON = the host parameter CM_ON.
 * BENCH: the timeline = the feed (frame i = RT_FEED.frames[i]); feed.js RT_CUSTOM is the stand-in correction.
 * PLUGIN (D-1 / D-2, docs/CONTRACT.md): frame i = host time i / 60 s; the binder (index.html) feeds the engine's
 * capture in (C.feed: the `curve` event + getCustomCapture at open), sends T out on every change (C.onLine ->
 * native setCustomCurve; the engine builds the same glides + edge blends, CustomTune.h) and loads the session's saved
 * line at open (C.loadLine <- getCustomCurve). */
(function () {
  'use strict';
  var O = window.OBD;
  var GLIDE_S = 0.06, FOLLOW_IDLE_MS = 2500, W_MIN = 2, W_MAX = 16;
  var C = O.custom = {
    tool: 'note', snap: 'scale', hz: 60, n: 0, capN: 0, head: -1, headT: 0, playing: false, hover: null, hoverBlob: null, vSet: false,
    cap: null, T: null, Tg: null, F0: null, AU: null, RS: null, VO: null,
    undo: [], view: { t0: 0, W: 6 }, touched: 0, lastI: -1, edits: 0, onLine: null
  };
  function bench() { return !window.RT_FEED || window.RT_FEED.source !== 'engine'; }
  function alloc(n) {   // (re)allocate every per-frame array to n, keeping what is there
    function grow(A, T, fill) { var b = new T(n); if (fill !== undefined) b.fill(fill); if (A) b.set(A.subarray(0, Math.min(A.length, n))); return b; }
    C.cap = grow(C.cap, Uint8Array); C.T = grow(C.T, Float32Array, NaN); C.Tg = grow(C.Tg, Float32Array, NaN);
    C.F0 = grow(C.F0, Float32Array); C.AU = grow(C.AU, Float32Array); C.RS = grow(C.RS, Float32Array); C.VO = grow(C.VO, Uint8Array);
    C.n = n;
  }
  function ensure(need) {
    if (bench()) {   // the bench's timeline is the feed: fixed length
      var n = window.RT_FEED.frames.length; C.hz = window.RT_FEED.hz;
      if (!C.cap || C.n !== n) { C.cap = C.T = null; alloc(n); C.undo = []; C.edits = 0; C.capN = 0; }
      return;
    }
    need = Math.max(need || 0, 3600);   // the plugin's grows with the song, a minute at a time
    if (!C.cap || need > C.n) alloc(Math.max(need + 3600, Math.round(C.n * 1.5)));
  }
  // what one frame of the timeline holds: the sung f0, the auto tune's corr, the applied corr (with the line)
  C.source = function (i) {
    if (!bench()) return { f0: C.F0[i], voiced: !!C.VO[i], auto: C.AU[i], res: C.RS[i], resV: !!C.VO[i] };
    var a = O.framesAuto || O.frames, r = O.frames;
    return { f0: a[i] ? a[i].f0 : 0, voiced: !!(a[i] && a[i].voiced), auto: a[i] ? a[i].corr : 0, res: r[i] ? r[i].corr : 0, resV: !!(r[i] && r[i].voiced) };
  };
  // the marker = the DAW's position: the engine sends it ~30 times a second; in between it glides on at 60 frames / s
  function playhead() {
    if (bench()) return O.frameIndex();
    if (!C.playing || C.head < 0) return C.head;
    return C.head + Math.min(0.2, (Date.now() - C.headT) / 1000) * C.hz;
  }
  function isPlaying() { return bench() ? !O.paused : C.playing; }
  // PLUGIN: the engine's capture (`curve` event / getCustomCapture): {i, f, a, r, v: arrays, playing, head}
  C.feed = function (d) {
    if (!d || !d.i) return;
    var I = d.i, m = -1, k;
    for (k = 0; k < I.length; k++) if (I[k] > m) m = I[k];
    ensure(m + 1);
    for (k = 0; k < I.length; k++) {
      var i = I[k]; if (i < 0) continue;
      if (!C.cap[i]) C.capN++;
      C.cap[i] = 1; C.F0[i] = d.f[k]; C.AU[i] = d.a[k]; C.RS[i] = d.r[k]; C.VO[i] = d.v[k] ? 1 : 0;
    }
    if (d.head !== undefined && d.head !== C.head) { C.head = d.head; C.headT = Date.now(); }   // the DAW's position (stopped too)
    if (d.playing !== undefined) C.playing = !!d.playing;
    if (d.an !== undefined) C.an = +d.an;   // ARA: the offline analysis of the clips, 0..1 (-1 = none)
    O.dirty = true;   // the next animation frame draws it (10-12)
  };
  // PLUGIN: the session's saved line (getCustomCurve at open): {first, notes: [MIDI | null]}
  C.loadLine = function (first, notes) {
    if (!notes || !notes.length) return;
    ensure(first + notes.length);
    for (var k = 0; k < notes.length; k++) C.T[first + k] = notes[k] === null || notes[k] === undefined ? NaN : +notes[k];
    glide(); O.render();
  };
  // the line out to the engine: T from its first to its last drawn frame (null = none), 120 ms after the last change
  var sendT = 0;
  function sendLine() {
    if (!C.onLine) return;
    clearTimeout(sendT);
    sendT = setTimeout(function () {
      var a = -1, b = -1, i, out = [];
      for (i = 0; i < C.n; i++) if (isFinite(C.T[i])) { if (a < 0) a = i; b = i; }
      if (a >= 0) for (i = a; i <= b; i++) out.push(isFinite(C.T[i]) ? C.T[i] : null);
      C.onLine(Math.max(0, a), out);
    }, 120);
  }
  function midi(f0) { return 69 + 12 * Math.log2(f0 / 440); }
  function noteName(m) { return O.KEY_NAMES[(m % 12 + 12) % 12] + (Math.floor(m / 12) - 1); }

  /* ---- the glides: a note change inside the line ramps over GLIDE_S, centred on the change ---- */
  function glide() {
    var T = C.T, Tg = C.Tg, n = C.n, G = Math.max(1, Math.round(GLIDE_S * C.hz)), h = G >> 1, i, k, spans = 0;
    for (i = 0; i < n; i++) Tg[i] = T[i];
    for (i = 1; i < n; i++) {
      if (isFinite(T[i]) && !isFinite(T[i - 1])) spans++;
      if (isFinite(T[i]) && isFinite(T[i - 1]) && T[i] !== T[i - 1]) {
        var a = T[i - 1], b = T[i];
        for (k = -h; k < G - h; k++) { var j = i + k; if (j >= 0 && j < n && isFinite(T[j])) Tg[j] = a + (b - a) * (k + h + 0.5) / G; }
      }
    }
    if (n && isFinite(T[0])) spans++;
    C.edits = spans;
  }
  // the first edit switches CUSTOM on (an edit with CUSTOM off would change nothing you hear)
  function changed() {
    glide();
    if (C.edits && !O.P.CM_ON) O.write('CM_ON', true); else O.recorrect();
    sendLine();
  }

  /* ---- snapping: the pointer's height -> the nearest legal note (SCALE = the key's scale + the NOTES switches) ---- */
  function snapNote(m) {
    if (C.snap === 'chrom') return Math.round(m);
    var legal = O.legalAbs(), best = Math.round(m), bd = 1e9;
    for (var k = Math.floor(m) - 6; k <= Math.ceil(m) + 6; k++) {
      if (!((legal >> ((k % 12 + 12) % 12)) & 1)) continue;
      var d = Math.abs(m - k); if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  /* ---- the page markup (layout A's html calls this) ---- */
  O.customPage = function () {
    function k(part, nav, label) {
      return '<div class="opt cm-k" data-part="' + part + '" data-kind="nav" data-nav="' + nav + '"><span class="cm-kl">' + label + '</span></div>';
    }
    return '<div class="page pg-custom" data-page="custom"><div class="cm-graph" data-part="cm-graph"><canvas class="cm-cv"></canvas></div>' +
      // ON = the host parameter CM_ON (a toggle like HARMONY's)
      '<div class="cm-keys"><div class="opt cm-k" data-part="cm-on" data-kind="tog" data-param="CM_ON"><span class="cm-kl">OFF</span></div>' +
      k('cm-tool', 'cm-tool', 'NOTE') + k('cm-snap', 'cm-snap', 'SCALE') +
      k('cm-undo', 'cm-undo', 'UNDO') + k('cm-clear', 'cm-clear', 'CLEAR') + '</div></div>';
  };
  O.customTile = function () { return '<span class="cm-tv"></span><br><span class="t-s cm-ts"></span>'; };

  /* ---- the soft keys (OBD.NAV: wired by the object's build like every nav key) ---- */
  function pushUndo() { C.undo.push(new Float32Array(C.T)); if (C.undo.length > 40) C.undo.shift(); }
  // the tools (Yoni 2026-11-12: "the workflow of the drawing is not simple enough"): NOTE = drag a sung note up / down
  // (the default), DRAW = freehand, ERASE = back to the auto tune
  var TOOLS = ['note', 'draw', 'erase'], TOOL_LABEL = { note: 'NOTE', draw: 'DRAW', erase: 'ERASE' };
  O.NAV['cm-tool'] = function () { C.tool = TOOLS[(TOOLS.indexOf(C.tool) + 1) % TOOLS.length]; };
  O.NAV['cm-snap'] = function () { C.snap = C.snap === 'scale' ? 'chrom' : 'scale'; };
  O.NAV['cm-undo'] = function () {
    ensure(); if (!C.undo.length) return;
    var u = C.undo.pop();
    if (u.length !== C.n) { var b = new Float32Array(C.n); b.fill(NaN); b.set(u.subarray(0, Math.min(u.length, C.n))); u = b; }   // the timeline grew since
    C.T = u; changed();
  };
  O.NAV['cm-clear'] = function () { ensure(); var any = false; for (var i = 0; i < C.n; i++) if (isFinite(C.T[i])) { any = true; break; }
    if (!any) return; pushUndo(); for (i = 0; i < C.n; i++) C.T[i] = NaN; changed(); };
  // D-pad on the CUSTOM page: left / right scroll the time (1/4 of the view), up / down move the note lanes one note
  O.customDpad = function (dir) {
    var v = C.view; C.touched = Date.now();
    if (dir === 'left' || dir === 'right') v.t0 += (dir === 'right' ? 1 : -1) * v.W / 4;
    else C.vlo += dir === 'up' ? 1 : -1;
    clampView(); return true;
  };
  function dur() { return C.n / C.hz; }
  function clampView() {
    var v = C.view; v.W = O.clamp(v.W, W_MIN, Math.max(W_MIN, Math.min(W_MAX, dur()))); v.t0 = O.clamp(v.t0, 0, Math.max(0, dur() - v.W));
    if (C.vlo !== null) C.vlo = O.clamp(C.vlo, 24, 108 - V_SPAN);
  }
  function zoom(f, tc) { var v = C.view, W = O.clamp(v.W * f, W_MIN, W_MAX); v.t0 = tc - (tc - v.t0) * W / v.W; v.W = W; clampView(); }

  /* ---- the note lanes in view: V_SPAN + 1 lanes from C.vlo (big enough to read and to hit), centred on the take ---- */
  var V_SPAN = 10;   // 11 lanes: ~20 px each on A's screen, so a semitone pair (D / Eb) never overlaps its names
  C.vlo = null;
  function initLanes() {
    if (C.vlo !== null && C.vSet) return;
    var ms = [], i;
    for (i = 0; i < C.n; i += 3) if (C.cap[i]) { var f = C.source(i); if (f.f0 > 0 && f.voiced) ms.push(midi(f.f0)); }
    if (ms.length > 20) { ms.sort(function (a, b) { return a - b; }); C.vlo = Math.round(ms[ms.length >> 1]) - (V_SPAN >> 1); C.vSet = true; }
    else if (C.vlo === null) { var L = O.lanes(); C.vlo = Math.round((L[0] + L[1]) / 2) - (V_SPAN >> 1); }
    clampView();
  }

  /* ---- the sung notes as blocks (the NOTE tool's objects): played + voiced frames on the same auto-tuned note, a flip of
     up to 2 frames does not split one, 4 frames (67 ms) at least ---- */
  function noteAt(i) { var f = C.source(i); return f.f0 > 0 && f.voiced ? Math.round(midi(f.f0) + f.auto) : null; }
  function blobsIn(i0, i1) {
    // from 10 s before the view, and on past it until the last block ends (a long held note moves whole)
    var out = [], cur = null, miss = 0, a = Math.max(0, i0 - 600), b = Math.min(C.n - 1, i1 + 3600);
    function close() { if (cur && cur.i1 - cur.i0 >= 3) out.push(cur); cur = null; miss = 0; }
    for (var i = a; i <= b; i++) {
      if (i > i1 + 1 && !cur) break;
      var nt = C.cap[i] ? noteAt(i) : null;
      if (cur && nt === cur.auto) { cur.i1 = i; miss = 0; continue; }
      if (cur && miss < 2) { miss++; continue; }
      close();
      if (nt !== null) cur = { i0: i, i1: i, auto: nt };
    }
    close();
    return out;
  }
  function shown(b) {   // the note a block sits on: the line's, where it covers the block, else the auto tune's
    var t = C.T[(b.i0 + b.i1) >> 1];
    return isFinite(t) ? t : b.auto;
  }
  function moved(b) { for (var i = b.i0; i <= b.i1; i++) if (isFinite(C.T[i])) return true; return false; }
  function setBlob(b, note) { for (var i = b.i0; i <= b.i1; i++) C.T[i] = note === b.auto ? NaN : note; }   // back on its own note = the auto tune
  function blobAt(p) {
    if (!G) return null;
    var best = null, bd = 1e9, list = blobsIn(Math.floor(C.view.t0 * C.hz), Math.ceil((C.view.t0 + C.view.W) * C.hz));
    for (var k = 0; k < list.length; k++) {
      var b = list[k], s = shown(b), d = Math.abs(p.m - s);
      if (p.i >= b.i0 - 2 && p.i <= b.i1 + 2 && d <= 0.9 && d < bd) { bd = d; best = b; }
    }
    return best;
  }

  /* ---- the pressed note sounds (Yoni 2026-11-12: "while clicking to draw I'll hear the sound of the note selected"):
     native `audition` (the plugin adds a soft tone to its output; the bench plays it with WebAudio), resent every 0.8 s
     while held (the plugin silences a note nobody refreshes after 2.5 s) ---- */
  var aud = { note: -1, t: 0 };
  function auditionOn(n) {
    if (aud.note === n) return;
    aud.note = n; O.NATIVE('audition', [n]);
    clearInterval(aud.t); aud.t = setInterval(function () { if (aud.note >= 0) O.NATIVE('audition', [aud.note]); }, 800);
  }
  function auditionOff() { clearInterval(aud.t); if (aud.note < 0) return; aud.note = -1; O.NATIVE('audition', [-1]); }

  /* ---- locate: move the DAW's marker to frame i (native `locate`, seconds of song time). The marker jumps at once;
     the host confirms it through the `curve` event. A host that cannot be moved (no ARA) says so on the graph. ---- */
  function locate(i) {
    if (i < 0) return;
    C.head = i; C.headT = Date.now();
    O.NATIVE('locate', [i / C.hz]);
  }
  C.hint = function (text) { C.hintText = text; C.hintUntil = Date.now() + 1800; O.render(); };

  /* ---- the graph: geometry, the tools, the wheel, the hover ---- */
  var G = null;   // the last drawn geometry: {rect (client px), cw, ch, x, y, w, h (canvas css px), lo, hi, lh}
  function toTM(ev) {   // a pointer event -> (frame index, MIDI) on the graph
    var r = G.rect, x = (ev.clientX - r.left) / r.width * G.cw, y = (ev.clientY - r.top) / r.height * G.ch;
    var t = C.view.t0 + (x - G.x) / G.w * C.view.W, m = G.lo + (G.y + G.h - y) / G.lh - 0.5;
    return { i: O.clamp(Math.round(t * C.hz), 0, C.n - 1), m: m, x: x, y: y };
  }
  function paint(a, b) {   // from point a to b: every frame between gets the snapped note (or NaN when erasing)
    var i0 = a.i, i1 = b.i, s = i1 >= i0 ? 1 : -1;
    for (var i = i0; ; i += s) {
      var f = i1 === i0 ? 1 : (i - i0) / (i1 - i0), m = a.m + (b.m - a.m) * f;
      C.T[i] = C.tool === 'erase' ? NaN : snapNote(m);
      if (i === i1) break;
    }
  }
  function wireGraph(root) {
    var g = root.querySelector('[data-part="cm-graph"]'); if (!g) return;
    var d = null;   // the gesture in progress
    // the wheel over the note names, or with Alt: the lanes up / down (before the house wheel: it scrolls the time)
    g.addEventListener('wheel', function (e) {
      if (!G) return;
      var r = G.rect, x = (e.clientX - r.left) / r.width * G.cw;
      if (!e.altKey && x >= G.x) return;
      e.preventDefault(); e.stopImmediatePropagation();
      ensure(); C.touched = Date.now(); C.vlo += (e.deltaY || e.deltaX) < 0 ? 1 : -1; clampView(); O.render();
    }, { passive: false });
    // the hover: the lane under the pointer lights up with its name, the cursor says what a drag does
    g.addEventListener('pointermove', function (e) {
      if (!G || d) return;
      C.hover = toTM(e);
      var b = C.tool === 'note' ? blobAt(C.hover) : null;
      g.style.cursor = C.tool === 'note' ? (b ? 'ns-resize' : 'grab') : C.tool === 'erase' ? 'cell' : 'crosshair';
      C.hoverBlob = b; O.dirty = true;
    });
    g.addEventListener('pointerleave', function () { if (!d) { C.hover = null; C.hoverBlob = null; O.dirty = true; } });
    // NOTE: a double-click on a block puts it back on the auto tune
    g.addEventListener('dblclick', function (e) {
      if (C.tool !== 'note' || !G) return;
      var b = blobAt(toTM(e)); if (!b || !moved(b)) return;
      pushUndo(); setBlob(b, b.auto); changed(); O.render();
    });
    O.gesture(g, {
      start: function (e) {
        ensure(); C.touched = Date.now(); if (!G) return;
        var p = toTM(e);
        if (p.y < G.y) { d = { ruler: true, p: p }; C.hover = p; return; }   // the time ruler: a click there = locate
        if (C.tool === 'note') {
          var b = blobAt(p);
          if (b) { pushUndo(); var s = shown(b); d = { blob: b, from: s, cur: s, off: s - p.m, pushed: true }; C.sel = b; auditionOn(s); }
          else d = { pan: true, cx: e.clientX, cy: e.clientY, t0: C.view.t0, vlo: C.vlo, p: p };
        } else { pushUndo(); d = { last: p, pushed: true }; if (C.tool === 'draw') auditionOn(snapNote(p.m)); }
        C.hover = p;
      },
      drag: function (dx, dy, ev) {
        if (!G || !d || d.ruler) return; C.touched = Date.now();
        var p = toTM(ev); C.hover = p;
        if (d.pan) {   // drag on empty space = move the view (time and lanes)
          var r = G.rect, px = (ev.clientX - d.cx) / r.width * G.cw, py = (ev.clientY - d.cy) / r.height * G.ch;
          C.view.t0 = d.t0 - px / G.w * C.view.W; C.vlo = d.vlo + Math.round(py / G.lh); clampView(); return;
        }
        if (d.blob) {   // drag a note: it moves in whole notes of the scale, the new note sounds
          var note = snapNote(p.m + d.off);
          if (note !== d.cur) { d.cur = note; setBlob(d.blob, note); auditionOn(note); changed(); }
          return;
        }
        paint(d.last, p); d.last = p; changed();
        if (C.tool === 'draw') auditionOn(snapNote(p.m));
      },
      // a tap changes nothing (a tap on a note only plays it); a tap on the ruler, or on empty space with NOTE, moves the
      // DAW's marker there (ARA: Yoni 2026-11-12 "pressing on the timeline in the plugin will move the daw marker")
      press: function () {
        if (d && d.pushed && !d.blob) C.undo.pop();
        if (d && (d.ruler || d.pan)) locate(d.p.i);
      },
      end: function () {
        auditionOff();
        if (d && d.blob && d.cur === d.from && C.undo.length) C.undo.pop();   // dropped where it was: no undo step
        d = null;
      },
      wheel: function (dir, fine) {
        ensure(); C.touched = Date.now();
        if (fine) zoom(dir > 0 ? 1 / 1.25 : 1.25, C.view.t0 + C.view.W / 2); else { C.view.t0 -= dir * C.view.W / 8; clampView(); }
      }
    });
  }

  function drawCustom() {
    var R = O.root, cv = R && R.querySelector('.pg-custom.on .cm-cv'); if (!cv || !cv.offsetWidth) return;
    ensure(); initLanes();
    var rect = cv.getBoundingClientRect(), w = cv.offsetWidth, h = cv.offsetHeight;
    var k = rect.width / w * (window.devicePixelRatio || 1), Wp = Math.round(w * k), Hp = Math.round(h * k);
    if (cv.width !== Wp || cv.height !== Hp) { cv.width = Wp; cv.height = Hp; }
    var ctx = cv.getContext('2d'), COL = O.COL, pad = 52, lo = C.vlo, hi = C.vlo + V_SPAN;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, w, h);
    var gx = pad, gy = 22, gw = w - pad - 6, gh = h - gy - 6, lh = gh / (hi - lo + 1);
    G = { rect: rect, cw: w, ch: h, x: gx, y: gy, w: gw, h: gh, lo: lo, hi: hi, lh: lh };
    function Y(m) { return gy + gh - (m - lo + 0.5) * lh; }
    var v = C.view, pps = gw / v.W, i0 = Math.max(0, Math.floor(v.t0 * C.hz)), i1 = Math.min(C.n - 1, Math.ceil((v.t0 + v.W) * C.hz));
    function X(i) { return gx + (i / C.hz - v.t0) * pps; }
    var hov = C.hover ? snapNote(C.hover.m) : null;
    // the note names, big, in their own column (Yoni 2026-11-12: "the size of text of the notes not clear enough");
    // in-scale lanes only (SCALE), the key's own lane in the accent, the lane under the pointer lit
    var sAbs = O.scaleAbs(), legal = O.legalAbs();
    ctx.fillStyle = 'rgba(8, 16, 22, .35)'; ctx.fillRect(0, gy, pad - 4, gh);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (var m = lo; m <= hi; m++) {
      var pc = (m % 12 + 12) % 12, inS = (sAbs >> pc) & 1, on = (legal >> pc) & 1, key = pc === O.P.AT_KEY;
      if (C.snap === 'scale' && !inS) { ctx.strokeStyle = COL.grid; ctx.globalAlpha = 0.12; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, Y(m)); ctx.lineTo(gx + gw, Y(m)); ctx.stroke(); continue; }
      if (m === hov) { ctx.globalAlpha = 0.16; ctx.fillStyle = COL.acc; ctx.fillRect(gx, Y(m) - lh / 2, gw, lh); }
      ctx.strokeStyle = on && key ? COL.acc : on ? COL.dim : COL.grid; ctx.globalAlpha = on ? 0.55 : 0.25; ctx.lineWidth = on ? 1.2 : 1;
      ctx.beginPath(); ctx.moveTo(gx, Y(m)); ctx.lineTo(gx + gw, Y(m)); ctx.stroke();
      ctx.globalAlpha = m === hov ? 1 : on ? (key ? 1 : 0.85) : 0.45;
      ctx.fillStyle = m === hov ? COL.ink : key ? COL.acc : COL.dim;
      ctx.font = (m === hov ? '22px' : '18px') + ' VT323, Consolas, monospace';
      ctx.fillText(noteName(m), pad - 9, Y(m) + 1);
    }
    ctx.globalAlpha = 1;
    // the time ruler (1 s ticks) along the top
    ctx.textAlign = 'center'; ctx.fillStyle = COL.dim; ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.font = '15px VT323, Consolas, monospace';
    for (var s = Math.ceil(v.t0); s <= v.t0 + v.W; s++) { var xs = gx + (s - v.t0) * pps; ctx.beginPath(); ctx.moveTo(xs, gy - 4); ctx.lineTo(xs, gy); ctx.stroke(); ctx.fillText(s + 's', xs, 10); }
    ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
    // the sung notes as blocks: on their own note (outline), or moved (filled accent); the one under the hand lit
    var blocks = blobsIn(i0, i1), any = false;
    blocks.forEach(function (b) {
      var sh = shown(b), mv = moved(b), x0 = X(b.i0), x1 = X(b.i1 + 1), y = Y(sh), bh = Math.max(8, lh * 0.66);
      var hot = C.hoverBlob && C.hoverBlob.i0 === b.i0 && C.hoverBlob.i1 === b.i1;
      ctx.globalAlpha = mv ? 0.45 : 0.16; ctx.fillStyle = mv ? COL.acc : COL.dim;
      rr(ctx, x0, y - bh / 2, Math.max(3, x1 - x0), bh, Math.min(5, bh / 2)); ctx.fill();
      ctx.globalAlpha = hot ? 1 : mv ? 0.9 : 0.5; ctx.strokeStyle = hot ? COL.ink : mv ? COL.acc : COL.dim; ctx.lineWidth = hot ? 2 : 1.2;
      ctx.stroke(); ctx.globalAlpha = 1;
    });
    function trace(col, wid, alpha, val) {
      ctx.strokeStyle = col; ctx.lineWidth = wid; ctx.globalAlpha = alpha; ctx.beginPath();
      var pen = false, py = 0;
      for (var i = i0; i <= i1; i++) {
        if (!C.cap[i]) { pen = false; continue; }
        var y = val(i); if (y === null) { pen = false; continue; }
        any = true;
        if (pen && Math.abs(y - py) < 5 * lh) ctx.lineTo(X(i), y); else ctx.moveTo(X(i), y);
        pen = true; py = y;
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    // YOUR line (the glided target): a thin accent line over the blocks
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = COL.acc; ctx.lineWidth = Math.max(3, lh * 0.2); ctx.globalAlpha = O.P.CM_ON ? 0.95 : 0.4; ctx.beginPath();
    var pen2 = false;
    for (var j = i0; j <= i1; j++) { var t = C.Tg[j]; if (!isFinite(t)) { pen2 = false; continue; } if (pen2) ctx.lineTo(X(j), Y(t)); else ctx.moveTo(X(j), Y(t)); pen2 = true; }
    ctx.stroke(); ctx.globalAlpha = 1;
    trace(COL.dim, 1.4, 0.75, function (i) { var f = C.source(i); return f.f0 > 0 ? Y(midi(f.f0)) : null; });
    trace(COL.ink, 2, 1, function (i) { var f = C.source(i); return f.f0 > 0 && f.resV ? Y(midi(f.f0) + f.res) : null; });
    // the marker = the DAW's position (Yoni 2026-11-12: "sync the daw marker and the obdtune marker")
    var ph = playhead(), xp = ph >= 0 ? gx + (ph / C.hz - v.t0) * pps : -1;
    if (xp >= gx && xp <= gx + gw) {
      ctx.strokeStyle = COL.acc; ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xp, gy); ctx.lineTo(xp, gy + gh); ctx.stroke();
      ctx.fillStyle = COL.acc; ctx.beginPath(); ctx.moveTo(xp - 6, gy); ctx.lineTo(xp + 6, gy); ctx.lineTo(xp, gy + 8); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
    // the note under the pointer, big, beside it
    if (C.hover && hov !== null && C.hover.x >= gx) {
      var label = noteName(hov), lx = Math.min(gx + gw - 46, C.hover.x + 14), ly = Math.max(gy + 14, Math.min(gy + gh - 14, Y(hov) - 18));
      ctx.font = '24px VT323, Consolas, monospace'; ctx.textAlign = 'left';
      ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(8, 16, 22, .9)'; rr(ctx, lx - 4, ly - 13, ctx.measureText(label).width + 8, 26, 4); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = COL.ink; ctx.fillText(label, lx, ly + 1);
    }
    if (C.an >= 0 && C.an < 1) {   // ARA: the clips are being analysed (the graph fills without playing)
      ctx.textAlign = 'left'; ctx.font = '17px VT323, Consolas, monospace'; ctx.fillStyle = COL.acc;
      ctx.fillText('ANALYSING ' + Math.round(C.an * 100) + ' %', gx + 6, gy + 12);
    }
    if (C.hintText && Date.now() < C.hintUntil) {   // a one-line note from the plugin (e.g. LOCATE NEEDS ARA)
      ctx.textAlign = 'center'; ctx.font = '20px VT323, Consolas, monospace'; var hw = ctx.measureText(C.hintText).width + 16;
      ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(8, 16, 22, .92)'; rr(ctx, gx + gw / 2 - hw / 2, gy + 6, hw, 24, 4); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = COL.acc; ctx.fillText(C.hintText, gx + gw / 2, gy + 18);
    }
    if (!any) {   // nothing played in view yet
      ctx.textAlign = 'center'; ctx.fillStyle = COL.acc; ctx.font = '22px VT323, Consolas, monospace';
      ctx.fillText(C.capN > 0 ? 'NOTHING PLAYED HERE YET' : 'PLAY THE TRACK TO CAPTURE', gx + gw / 2, gy + gh / 2);
    }
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /* ---- the capture (BENCH: the frames the playhead passes; PLUGIN: C.feed) + the view follow ---- */
  function capture() {
    if (!bench()) return;
    if (O.paused) { C.lastI = O.frameIndex(); return; }
    ensure();
    var i = O.frameIndex();
    if (C.lastI < 0) C.lastI = i;
    var steps = (i - C.lastI + C.n) % C.n; if (steps > C.hz) steps = 1;   // a seek / a jump: no smear across it
    for (var s = 0; s <= steps; s++) { var j = (C.lastI + s) % C.n; if (!C.cap[j]) C.capN++; C.cap[j] = 1; }
    C.lastI = i;
  }
  // follow the marker (page flip) while it plays, unless the hand used the graph in the last 2.5 s
  function follow() {
    var ph = playhead(); if (ph < 0 || !isPlaying() || Date.now() - C.touched < FOLLOW_IDLE_MS) return;
    var v = C.view, tp = ph / C.hz;
    if (tp < v.t0 || tp > v.t0 + v.W * 0.92) { v.t0 = tp - v.W * 0.08; clampView(); }
  }

  /* ---- hooks into the object: draw, render, build ---- */
  var draw0 = O.draw;
  O.draw = function () { draw0(); capture(); if (O.ui.page === 'custom') { follow(); drawCustom(); } };
  // 10-12 (L4-05): the page moves on its own while the marker glides between the engine's 30 Hz positions (playing) and
  // while a hint is up (it leaves at its time): then the draw runs every frame, as it always did
  var anim0 = O.animating;
  O.animating = function () { return anim0() || (O.ui.page === 'custom' && (isPlaying() || (!!C.hintText && Date.now() < C.hintUntil))); };
  var render0 = O.render;
  O.render = function () {
    render0(); var R = O.root; if (!R) return; ensure();
    function set(sel, f) { var l = R.querySelectorAll(sel); for (var i = 0; i < l.length; i++) f(l[i]); }
    var txt = O.setText;   // compare first (10-12)
    set('[data-part="cm-on"]', function (el) { el.classList.toggle('sel', !!O.P.CM_ON); txt(el.querySelector('.cm-kl'), O.P.CM_ON ? 'ON' : 'OFF'); });
    set('[data-part="cm-tool"]', function (el) { el.classList.toggle('sel', C.tool !== 'note'); txt(el.querySelector('.cm-kl'), TOOL_LABEL[C.tool]); });
    set('[data-part="cm-snap"]', function (el) { txt(el.querySelector('.cm-kl'), C.snap === 'scale' ? 'SCALE' : 'CHROM'); });
    set('[data-part="cm-undo"]', function (el) { el.classList.toggle('dim', !C.undo.length); });
    set('.cm-tv', function (el) { txt(el, O.P.CM_ON ? 'ON' : 'OFF'); });
    set('.cm-ts', function (el) { txt(el, C.edits ? C.edits + (C.edits === 1 ? ' EDIT' : ' EDITS') : C.capN <= 0 ? 'PLAY TO CAPTURE' : 'NO EDITS'); });
    if (O.ui.page === 'custom') drawCustom();
  };
  O.ext = O.ext || [];
  O.ext.push(function (root, L) { if (L === 'A') { ensure(); wireGraph(root); } });
})();
