/* Verbatim copy of DRIFT 5.2.4 Source/ui/public/assets/fxv/screen-verb.js (Drift main b2b187b) for the /drift #fx live
 * rack (src/lib/drift/rack.ts hosts it like the plugin's FXV runtime). Re-copy when the plugin screen changes; never edit here. */
/* screen-verb.js - REVERB mini-screen visualiser for the Drift FX popup (FXV module).
 *
 * TUNNEL: concentric rounded-rect hoops receding into black around a source dot.
 *   DECAY     -> how many hoops are lit (3..9)            = tunnel depth
 *   BRIGHT    -> how slowly far hoops fade (+ hot tint)   = far hoops stay lit
 *   PREDELAY  -> size of the empty "mouth" ring around the source dot
 *   SHIMMER   -> hot sparkles riding random hoops
 *   MIX       -> whole tunnel brightness (.35 + .65*mix); the dry dot stays full
 *   TYPE/SYNC -> caption text (ROOM|PLATE|HALL + decay, PRE line)
 * Idle (P.on === false): frozen hoops at .25, faint dot grid, caption "BYP", no motion.
 *
 * Contract: classic script, no globals except window.FXV, draws in CSS px via
 * ctx.setTransform(P.dpr,...), allocates nothing per frame (strings/metrics only
 * rebuilt when their inputs change), uses only P.phosphor / P.hot / P.ink (+alpha)
 * and near-white #f4e9ff for text. All geometry derives from P.w / P.h.
 */
window.FXV = window.FXV || { screens: {}, register: function (id, impl) { this.screens[id] = impl; } };

FXV.register("verb", {
  /* ---- constants ---- */
  K: 0.82,            // perspective ratio per hoop
  DRIFT: 0.6,         // hoops per second, inward
  SPARK_MAX: 12,
  TEXT: "#f4e9ff",
  TYPES: ["ROOM", "PLATE", "HALL"],
  BEATS: ["1/4", "1/2", "1", "2", "3", "4", "6", "8"],           // VERB_DEC_DIV labels
  BEATS_N: [0.25, 0.5, 1, 2, 3, 4, 6, 8],                        // beats
  DIVS: ["1/1", "1/1.", "1/1t", "1/2", "1/2.", "1/2t", "1/4", "1/4.", "1/4t",
         "1/8", "1/8.", "1/8t", "1/16", "1/16.", "1/16t", "1/32", "1/32.", "1/32t"],
  DIVS_BEATS: [4, 6, 2.6667, 2, 3, 1.3333, 1, 1.5, 0.6667,
               0.5, 0.75, 0.3333, 0.25, 0.375, 0.16667, 0.125, 0.1875, 0.083333],

  /* ---- lifecycle ---- */
  init: function (canvas, P) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.phos = P.phosphor || "#d98bff";
    this.hot = P.hot || "#f2c8ff";
    this.ink = P.ink || "#0f0418";
    this.glow = this._rgba(this.phos, 0.75);
    this.lastT = 0;
    this.spark = new Float32Array(this.SPARK_MAX * 3);   // [hoopIdx, angle, life] x 12
    for (var i = 0; i < this.SPARK_MAX; i++) this.spark[i * 3 + 2] = -1;
    this.capKey = -9; this.cap = ""; this.capW = 0;
    this.preKey = -9; this.pre = ""; this.preW = 0;
    this.measuredAt = -10;
    this.w = -1; this.h = -1; this.dpr = -1;
    this._layout(P);
  },

  _layout: function (P) {
    this.w = P.w; this.h = P.h; this.dpr = P.dpr || 1;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    var s = Math.min(this.w / 195, this.h / 88);
    this.s = s;
    this.cx = this.w * 0.5;
    this.cy = this.h * 0.55;
    this.hw = this.w * 0.49;            // hoop e=0 half-width  (spawns just inside the glass, fades in)
    this.hh = this.h * 0.43;            // hoop e=0 half-height
    this.fontPx = Math.max(14, Math.round(16 * s));
    this.font = this.fontPx + "px \"VT323\", monospace";
    this.pad = Math.round(4 * s);
    this.capKey = -9; this.preKey = -9;  // force caption re-measure at new font size
  },

  _rgba: function (hex, a) {
    var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  },

  /* rounded-rect path (no allocation) */
  _rr: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  /* ---- per frame ---- */
  draw: function (t, P) {
    if (P.w !== this.w || P.h !== this.h || (P.dpr || 1) !== this.dpr) this._layout(P);
    var ctx = this.ctx, w = this.w, h = this.h, s = this.s, cx = this.cx, cy = this.cy;
    var on = P.on !== false;
    var dt = t - this.lastT; if (dt < 0 || dt > 0.1) dt = 0.1; this.lastT = t;

    /* ---- params (normalised 0..1 -> real units) ---- */
    var typeIdx = Math.round(P.get("VERB_TYPE") * 2); if (typeIdx < 0) typeIdx = 0; if (typeIdx > 2) typeIdx = 2;
    var sync = Math.round(P.get("VERB_SYNC")) === 0;            // choices [Sync, Free]
    var di = 0, pi = 0, decNorm, decS, preMs;
    var bpm = P.tempoBpm > 0 ? P.tempoBpm : 120;
    var bpmQ = Math.max(1, Math.floor(bpm * 10 + 0.5) * 0.1);     // DSP: jmax(1.0, floor(bpm*10+0.5)*0.1)
    if (sync) {
      di = Math.round(P.get("VERB_DEC_DIV") * 7); if (di < 0) di = 0; if (di > 7) di = 7;
      decNorm = di / 7;
      decS = Math.min(7, Math.max(0.4, 60 / bpmQ * this.BEATS_N[di]));  // 60/bpm * beats, DSP clamp
      pi = Math.round(P.get("VERB_PRE_DIV") * 17); if (pi < 0) pi = 0; if (pi > 17) pi = 17;
      preMs = Math.min(1000, Math.max(0, 60000 / bpmQ * this.DIVS_BEATS[pi]));  // one division period at the host tempo
    } else {
      decNorm = P.get("VERB_DECAY");
      decS = 0.4 + Math.pow(decNorm, 1.8) * 6.6;
      preMs = P.get("VERB_PREDELAY") * 200;
    }
    var bright = P.get("VERB_BRIGHT");
    var shimmer = P.get("SHIMMER");
    var mix = P.get("VERB_MIX");

    var N = Math.round(3 + 6 * decNorm); if (N < 3) N = 3; if (N > 9) N = 9;
    var preX = preMs / 200; if (preX > 1) preX = 1; if (preX < 0) preX = 0;
    var g = ((6 + 40 * preX) * s) / this.hw;                            // mouth ring scale (gap)
    var pw = 1.2 - 0.6 * bright;                                        // alpha falloff exponent
    var G = on ? 0.35 + 0.65 * mix : 0.25;                              // tunnel master alpha
    var phase = on ? (t * this.DRIFT) % 1 : 0;
    var K = this.K, i, e, a, r, rw, rh, rad;

    /* ---- glass base ---- */
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.ink;
    ctx.fillRect(0, 0, w, h);

    /* ---- idle: faint static dot grid ---- */
    if (!on) {
      var step = Math.max(6, Math.round(8 * s)), d = Math.max(1, Math.round(s));
      ctx.fillStyle = this.phos; ctx.globalAlpha = 0.12;
      for (var gy = step * 0.5; gy < h; gy += step)
        for (var gx = step * 0.5; gx < w; gx += step) ctx.fillRect(gx - d * 0.5, gy - d * 0.5, d, d);
    }

    /* ---- hoops (outer e=0 -> inner e=N, drifting inward) ---- */
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    for (i = 0; i < N; i++) {
      e = i + phase;
      a = Math.pow(1 - e / N, pw) * Math.min(1, e / 0.7);   // falloff * entry fade
      if (a <= 0.01) continue;
      r = g + (1 - g) * Math.pow(K, e);
      rw = this.hw * r; rh = this.hh * r; rad = Math.min(rw, rh) * 0.38;
      this._rr(ctx, cx - rw, cy - rh, rw * 2, rh * 2, rad);
      ctx.strokeStyle = this.phos;
      ctx.lineWidth = (2 + 3 * r) * s;     ctx.globalAlpha = a * G * 0.22; ctx.stroke();   // soft glow
      ctx.lineWidth = (0.7 + 1.1 * r) * s; ctx.globalAlpha = a * G * 0.95; ctx.stroke();   // core
      if (on && bright > 0.02) {                                                            // BRIGHT = hot core
        ctx.strokeStyle = this.hot;
        ctx.lineWidth = (0.4 + 0.6 * r) * s; ctx.globalAlpha = a * G * 0.7 * bright; ctx.stroke();
      }
    }

    /* ---- mouth ring = predelay gap (static, sized by PREDELAY) ---- */
    rw = this.hw * g; rh = this.hh * g; rad = Math.min(rw, rh) * 0.38;
    this._rr(ctx, cx - rw, cy - rh, rw * 2, rh * 2, rad);
    ctx.strokeStyle = this.phos; ctx.lineWidth = Math.max(1, s); ctx.globalAlpha = 0.45 * G; ctx.stroke();

    /* ---- source dot = dry hit (always full when on) ---- */
    ctx.fillStyle = this.hot;
    ctx.globalAlpha = on ? 0.3 : 0.12;
    ctx.beginPath(); ctx.arc(cx, cy, 5 * s, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = on ? 1 : 0.45;
    ctx.beginPath(); ctx.arc(cx, cy, 2 * s, 0, 6.2832); ctx.fill();

    /* ---- shimmer sparkles ---- */
    if (on && shimmer > 0.005) {
      var cnt = Math.round(shimmer * this.SPARK_MAX), sp = this.spark, sz = Math.max(1, 1.5 * s);
      ctx.fillStyle = this.hot;
      for (i = 0; i < cnt; i++) {
        var j = i * 3;
        sp[j + 2] -= dt;
        if (sp[j + 2] <= 0 || sp[j] >= N) {
          sp[j] = Math.floor(Math.random() * N);
          sp[j + 1] = Math.random() * 6.2832;
          sp[j + 2] = 0.06 + 0.3 * Math.random();
        }
        e = sp[j] + phase;
        r = g + (1 - g) * Math.pow(K, e);
        var dx = Math.cos(sp[j + 1]), dy = Math.sin(sp[j + 1]);
        var tx = (this.hw * r) / Math.max(1e-6, Math.abs(dx)), ty = (this.hh * r) / Math.max(1e-6, Math.abs(dy));
        var tm = tx < ty ? tx : ty;
        var px = cx + tm * dx, py = cy + tm * dy;
        ctx.globalAlpha = shimmer * G * 0.35;          ctx.fillRect(px - 1.5 * sz, py - 1.5 * sz, 3 * sz, 3 * sz);
        ctx.globalAlpha = Math.min(1, shimmer * 1.5);  ctx.fillRect(px - 0.5 * sz, py - 0.5 * sz, sz, sz);
      }
    }

    /* ---- captions (strings only rebuilt when inputs change) ---- */
    var capKey, preKey;
    if (!on) { capKey = -1; preKey = -1; }
    else {
      capKey = typeIdx * 1e8 + (sync ? 1e7 + di * 1e5 + Math.round(bpmQ * 10) : Math.round(decS * 10));
      preKey = sync ? 10000 + pi : Math.round(preMs);
    }
    ctx.font = this.font;
    var remeasure = (t - this.measuredAt) > 1;          // font may arrive late: re-measure 1/s
    if (capKey !== this.capKey || remeasure) {
      if (capKey !== this.capKey)
        this.cap = !on ? "BYP" : this.TYPES[typeIdx] + " " + (sync ? this.BEATS[di] + "bt @" + Math.round(bpmQ) : decS.toFixed(1) + "s");
      this.capKey = capKey; this.capW = ctx.measureText(this.cap).width;
    }
    if (preKey !== this.preKey || remeasure) {
      if (preKey !== this.preKey)
        this.pre = !on ? "" : "PRE " + (sync ? this.DIVS[pi] : Math.round(preMs) + "ms");
      this.preKey = preKey; this.preW = this.pre ? ctx.measureText(this.pre).width : 0;
    }
    if (remeasure) this.measuredAt = t;

    var pad = this.pad, fp = this.fontPx, bx = Math.round(3 * s);
    ctx.textBaseline = "top";
    ctx.fillStyle = this.ink; ctx.globalAlpha = 0.6;
    ctx.fillRect(pad - bx, pad - 1, this.capW + bx * 2, fp);
    if (this.pre) ctx.fillRect(pad - bx, h - pad - fp, this.preW + bx * 2, fp + 1);
    ctx.fillStyle = this.TEXT;
    ctx.shadowColor = this.glow; ctx.shadowBlur = 6 * s;
    ctx.globalAlpha = on ? 1 : 0.6;
    ctx.fillText(this.cap, pad, pad);
    if (this.pre) { ctx.globalAlpha = 0.85; ctx.fillText(this.pre, pad, h - pad - fp); }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
});
