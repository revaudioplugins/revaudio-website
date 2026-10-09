/* Verbatim copy of DRIFT 5.2.4 Source/ui/public/assets/fxv/screen-glue.js (Drift main b2b187b) for the /drift #fx live
 * rack (src/lib/drift/rack.ts hosts it like the plugin's FXV runtime). Re-copy when the plugin screen changes; never edit here. */
/* screen-glue.js - GLUE COMP mini-screen (DRIFT 5.0) for the FX rack, column 0.
 * FXV screen-module contract: classic script, no globals except window.FXV,
 * draws only into its own canvas, allocation-free per frame.
 *
 * The object: the gain-reduction meter of a console bus compressor - a needle that
 * rests on 0 at the right end of the arc and swings LEFT as the comp squeezes
 * (0 .. 20 dB, linear). Under the arc: the ratio stamp (left) and the peak GR
 * readout (right, held 0.8 s so a short squeeze can be read).
 *
 * Reads (P.get, normalised 0..1): GLUE_RATIO (choice 2:1 / 4:1 / 10:1).
 * Power comes from P.on (BYP_GLUE, inverted).
 * Live feed: P.gluegr if the frame supplies it, else window.__gluegr = GR in dB (>= 0),
 * the largest reduction since the editor's last 30 Hz read (PluginProcessor liveGlueGr).
 * No backend natives (bench: the juce lib stub has __JUCE__ but zero native functions) = a slow demo
 * squeeze so the needle can be judged in motion. The plugin never shows the demo.
 *
 * Needle ballistics (feedback, not decoration): rises fast (tau 12 ms) like the comp
 * grabbing, falls back slower (tau 160 ms) like a real meter movement.
 * Layout is authored in the house 195x78 screen (every FX strip; was 195x105 under the old tall CRT) and
 * scaled from P.w/P.h. The pivot sits below the glass like a real VU movement: only the needle shows.
 * Colour: P.ink glass base, P.phosphor light, P.hot past 10 dB of squeeze only.
 */
window.FXV = window.FXV || { screens: {}, register: function (id, impl) { this.screens[id] = impl; } };

FXV.register("glue", {
  BASE_W: 195, BASE_H: 78,
  MAX_DB: 20,
  /* arc: pivot below the scale, 100 degrees of travel (-140 .. -40 deg from +x) */
  A0: -140 * Math.PI / 180, A1: -40 * Math.PI / 180,
  RATIOS: ["2:1", "4:1", "10:1"],
  LABELS: [20, 16, 12, 8, 4, 0],

  init: function (canvas, P) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    /* pre-built strings: nothing is concatenated in draw() */
    this.grStr = new Array(201);                       /* "0.0" .. "20.0" in 0.1 dB */
    for (var i = 0; i <= 200; i++) this.grStr[i] = (i === 0 ? "0.0" : "-" + (i / 10).toFixed(1));
    this.offStr = "--";
    this.capStr = "GR dB";
    this.lblStr = new Array(this.LABELS.length);
    for (var k = 0; k < this.LABELS.length; k++) this.lblStr[k] = String(this.LABELS[k]);
    this.tickA = new Float32Array(21);                 /* one tick per dB */
    this.needle = 0;                                   /* displayed GR, dB */
    this.peak = 0; this.peakT = 0;                     /* readout peak hold */
    this.lastT = 0;
    var jd = window.__JUCE__ && window.__JUCE__.initialisationData;
    this.bench = !(jd && jd.__juce__functions && jd.__juce__functions.length);
    this.w = -1; this.h = -1; this.dpr = -1; this.phos = "";
    this.baseCv = document.createElement("canvas");
    this.baseCtx = this.baseCv.getContext("2d");
    this._layout(P);
  },

  _layout: function (P) {
    var w = P.w, h = P.h, sx = w / this.BASE_W, sy = h / this.BASE_H, s = Math.min(sx, sy);
    this.w = w; this.h = h; this.dpr = P.dpr; this.phos = P.phosphor;
    this.ctx.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
    this.s = s;
    this.cx = 97.5 * sx; this.cy = 88 * sy;            /* needle pivot: 10 px under the glass */
    this.rArc = 60 * s;                                /* scale line */
    this.rLbl = 70 * s;                                /* numbers */
    this.rN0 = 24 * s; this.rN1 = 64 * s;              /* needle from .. to */
    this.lw = Math.max(1, Math.round(s));
    this.nW = Math.max(1.5, 2 * s);
    this.glow = 10 * s;
    this.fLbl = Math.max(12, Math.round(14 * s)) + "px VT323, monospace";
    this.fCap = Math.max(12, Math.round(14 * s)) + "px VT323, monospace";
    this.fVal = Math.max(16, Math.round(21 * s)) + "px VT323, monospace";
    this.pad = 5 * s;
    this.yRow = h - this.pad;                          /* bottom caption baseline */
    for (var i = 0; i <= 20; i++) this.tickA[i] = this._ang(i);
    /* glass base + phosphor bloom, rendered once into the offscreen buffer */
    var r = parseInt(P.phosphor.substr(1, 2), 16), g = parseInt(P.phosphor.substr(3, 2), 16),
        b = parseInt(P.phosphor.substr(5, 2), 16);
    if (!(r >= 0)) r = 111; if (!(g >= 0)) g = 232; if (!(b >= 0)) b = 255;
    var bc = this.baseCtx;
    this.baseCv.width = Math.max(1, Math.round(w * P.dpr));
    this.baseCv.height = Math.max(1, Math.round(h * P.dpr));
    bc.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
    bc.globalAlpha = 1;
    bc.fillStyle = P.ink; bc.fillRect(0, 0, w, h);
    var gr = bc.createRadialGradient(this.cx, this.cy - 30 * s, 0, this.cx, this.cy - 30 * s, w * 0.62);
    gr.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.10)");
    gr.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
    bc.fillStyle = gr; bc.fillRect(0, 0, w, h);
  },

  /* GR dB -> needle angle: 0 dB at the right end (A1), MAX_DB at the left end (A0) */
  _ang: function (db) {
    if (db < 0) db = 0; else if (db > this.MAX_DB) db = this.MAX_DB;
    return this.A1 + (this.A0 - this.A1) * (db / this.MAX_DB);
  },

  draw: function (t, P) {
    var ctx = this.ctx;
    if (P.w !== this.w || P.h !== this.h || P.dpr !== this.dpr || P.phosphor !== this.phos) this._layout(P);
    var dt = t - this.lastT; this.lastT = t;
    if (!(dt > 0) || dt > 0.1) dt = 1 / 30;

    var on = !!P.on;
    var A = on ? 1 : 0.2;                              /* idle = everything at .2, static */

    /* live feed (or the bench demo) */
    var target = 0;
    if (on) {
      var fv = (typeof P.gluegr === "number") ? P.gluegr : window.__gluegr;
      if (typeof fv === "number") target = fv;
      else if (this.bench) {                           /* bench only: a slow pumping squeeze */
        var d = 5 + 4.5 * Math.sin(t * 1.3) + 2.5 * Math.sin(t * 4.1);
        target = d > 0 ? d : 0;
      }
      if (!(target > 0)) target = 0; else if (target > this.MAX_DB) target = this.MAX_DB;
    }
    var tau = target > this.needle ? 0.012 : 0.160;
    this.needle += (target - this.needle) * (1 - Math.exp(-dt / tau));
    if (this.needle < 0.005) this.needle = 0;
    if (!on) this.needle = 0;
    if (target >= this.peak || t - this.peakT > 0.8) { this.peak = target; this.peakT = t; }
    var n = this.needle, hot = n > 10;
    var w = this.w, h = this.h, s = this.s, cx = this.cx, cy = this.cy, i, a, c, sn;

    /* glass base: lit = pre-rendered ink+bloom blit, idle = flat ink */
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (on) ctx.drawImage(this.baseCv, 0, 0, w, h);
    else { ctx.fillStyle = P.ink; ctx.fillRect(0, 0, w, h); }

    /* scale arc + ticks (long every 4 dB) */
    ctx.strokeStyle = P.phosphor; ctx.lineWidth = this.lw;
    ctx.globalAlpha = 0.35 * A;
    ctx.beginPath(); ctx.arc(cx, cy, this.rArc, this.A0, this.A1, false); ctx.stroke();
    ctx.globalAlpha = 0.8 * A;
    ctx.beginPath();
    for (i = 0; i <= 20; i++) {
      a = this.tickA[i]; c = Math.cos(a); sn = Math.sin(a);
      var L = (i % 4 === 0 ? 8 : 4) * s;
      ctx.moveTo(cx + c * this.rArc, cy + sn * this.rArc);
      ctx.lineTo(cx + c * (this.rArc - L), cy + sn * (this.rArc - L));
    }
    ctx.stroke();
    /* the red zone of a real GR meter, here in the strip's hot ink: 10..20 dB, inside the arc */
    ctx.strokeStyle = P.hot; ctx.lineWidth = 2 * s; ctx.globalAlpha = 0.28 * A;
    ctx.beginPath(); ctx.arc(cx, cy, this.rArc - 2.5 * s, this.A0, this._ang(10), false); ctx.stroke();

    /* numbers 20 16 12 8 4 0 */
    ctx.font = this.fLbl; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = P.phosphor; ctx.globalAlpha = 0.75 * A;
    for (i = 0; i < this.LABELS.length; i++) {
      a = this._ang(this.LABELS[i]);
      ctx.fillText(this.lblStr[i], cx + Math.cos(a) * this.rLbl, cy + Math.sin(a) * this.rLbl);
    }

    /* bottom row: ratio stamp left, peak GR readout right */
    var ri = Math.round(P.get("GLUE_RATIO") * 2); if (!(ri >= 0)) ri = 0; else if (ri > 2) ri = 2;
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.font = this.fCap; ctx.globalAlpha = 0.6 * A;
    ctx.fillText(this.RATIOS[ri], this.pad, this.yRow);
    ctx.textAlign = "right"; ctx.font = this.fVal;
    ctx.fillStyle = (on && this.peak > 10) ? P.hot : P.phosphor; ctx.globalAlpha = A;
    if (on) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = this.glow; }
    ctx.fillText(on ? this.grStr[Math.round(this.peak * 10)] : this.offStr, w - this.pad, this.yRow);
    ctx.shadowBlur = 0;
    ctx.font = this.fCap; ctx.fillStyle = P.phosphor; ctx.globalAlpha = 0.45 * A;
    ctx.fillText(this.capStr, w - this.pad, this.yRow - 19 * s);

    /* needle: halo + core from the pivot hub, hot past 10 dB */
    a = this._ang(n); c = Math.cos(a); sn = Math.sin(a);
    ctx.strokeStyle = hot ? P.hot : P.phosphor;
    ctx.lineWidth = this.nW * 3; ctx.globalAlpha = 0.22 * A;
    ctx.beginPath(); ctx.moveTo(cx + c * this.rN0, cy + sn * this.rN0); ctx.lineTo(cx + c * this.rN1, cy + sn * this.rN1); ctx.stroke();
    ctx.lineWidth = this.nW; ctx.globalAlpha = A;
    ctx.beginPath(); ctx.moveTo(cx + c * this.rN0, cy + sn * this.rN0); ctx.lineTo(cx + c * this.rN1, cy + sn * this.rN1); ctx.stroke();
    /* pivot hub */
    ctx.fillStyle = P.phosphor; ctx.globalAlpha = 0.5 * A;
    ctx.beginPath(); ctx.arc(cx, cy, 4 * s, Math.PI, 2 * Math.PI, false); ctx.fill();
    ctx.globalAlpha = 1;
  }
});
