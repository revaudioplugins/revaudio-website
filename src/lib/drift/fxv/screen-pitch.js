/* Verbatim copy of DRIFT 5.2.4 Source/ui/public/assets/fxv/screen-pitch.js (Drift main b2b187b) for the /drift #fx live
 * rack (src/lib/drift/rack.ts hosts it like the plugin's FXV runtime). Re-copy when the plugin screen changes; never edit here. */
window.FXV = window.FXV || { screens: {}, register: function (id, impl) { this.screens[id] = impl; } };

/* PITCH mini-screen - "chrome ice gearbox" tachometer.
   Spec box 195x88 CSS px. Arc centred (97,80) r=62, 200deg..340deg, 25 rungs
   (one per semitone -12..+12), amber needle (P.hot) eased 0.15/frame, formant
   triangle outside the arc, interval name readout, F%+d formant readout.
   Colour law: glass = P.ink, light = P.phosphor / P.hot with alpha only.
   Params read: PITCH_ST, FORMANT_ST, PITCH_MIX (all normalised 0..1).
   Power comes from P.on (frame derives it from BYP_PITCH, inverted). */
FXV.register("pitch", {
  DEG: Math.PI / 180,
  A0: 200,          // arc start (deg, canvas angle: 0 = +x, clockwise)
  SWEEP: 140,       // arc sweep (deg)
  NAMES: ["UNI", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "OCT"],

  init: function (canvas, P) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);

    // rung unit vectors (25 rungs, -12..+12)
    this.rc = new Float64Array(25);
    this.rs = new Float64Array(25);
    for (var i = 0; i < 25; i++) {
      var a = (this.A0 + this.SWEEP * i / 24) * this.DEG;
      this.rc[i] = Math.cos(a);
      this.rs[i] = Math.sin(a);
    }

    // readout string tables (no per-frame string building)
    this.ivl = new Array(25);
    this.fmt = new Array(25);
    for (var st = -12; st <= 12; st++) {
      var nm = this.NAMES[st < 0 ? -st : st];
      this.ivl[st + 12] = st > 0 ? "+" + nm : (st < 0 ? "-" + nm : nm);
      this.fmt[st + 12] = "F" + (st >= 0 ? "+" : "") + st;
    }

    this.needle = this.A0;   // parked at -12
    this.lastT = 0;
    this.w = -1; this.h = -1;
    this.wasOn = false;
    this._size(P);
  },

  // rebuild scale-dependent values only when the box size changes
  _size: function (P) {
    if (P.w === this.w && P.h === this.h) return;
    this.w = P.w; this.h = P.h;
    var sx = P.w / 195, sy = P.h / 88;
    var s = sx < sy ? sx : sy;
    this.sx = sx; this.sy = sy; this.s = s;
    this.cx = 97 * sx; this.cy = 80 * sy; this.r = 62 * s;
    this.fBig = Math.round(Math.max(16, 19 * s)) + "px VT323, monospace";
    this.fSmall = Math.round(Math.max(9, 11 * s)) + "px VT323, monospace";
    this.grid = Math.max(6, Math.round(8 * s));
  },

  draw: function (t, P) {
    this._size(P);
    var c = this.ctx, w = this.w, h = this.h, s = this.s, sx = this.sx, sy = this.sy;
    var cx = this.cx, cy = this.cy, r = this.r, DEG = this.DEG;
    var on = P.on !== false;
    var dt = t - this.lastT; this.lastT = t;
    if (dt < 0) dt = 0; if (dt > 0.1) dt = 0.1;

    // ---- params -> real units
    var st = Math.round(-12 + 24 * P.get("PITCH_ST"));
    var fst = Math.round(-12 + 24 * P.get("FORMANT_ST"));
    var mix = P.get("PITCH_MIX");
    if (st < -12) st = -12; if (st > 12) st = 12;
    if (fst < -12) fst = -12; if (fst > 12) fst = 12;
    if (mix < 0) mix = 0; if (mix > 1) mix = 1;

    // ---- needle easing (0.15 lerp per frame @60fps, frame-rate normalised)
    var target = on ? this.A0 + this.SWEEP * (st + 12) / 24 : this.A0;
    if (!on) {
      this.needle = target;                       // idle: static, parked at -12
    } else {
      if (!this.wasOn) this.needle = this.A0;     // power-on: rev up from -12
      var k = 1 - Math.pow(0.85, dt * 60);
      this.needle += (target - this.needle) * k;
      if (Math.abs(target - this.needle) < 0.02) this.needle = target;
    }
    this.wasOn = on;
    // analogue flutter: ~0.4deg meter wobble while lit (still frame only when idle)
    var wob = on ? (Math.sin(t * 7.3) * 0.28 + Math.sin(t * 2.9) * 0.18) : 0;
    var an = (this.needle + wob) * DEG;
    var ncos = Math.cos(an), nsin = Math.sin(an);

    // ---- glass base
    c.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
    c.fillStyle = P.ink;
    c.fillRect(0, 0, w, h);

    // ---- faint dot grid (LCD texture; the idle standby texture)
    var g = this.grid, d = Math.max(1, Math.round(s));
    c.fillStyle = P.phosphor;
    c.globalAlpha = on ? 0.06 : 0.22;
    for (var y = g; y < h; y += g)
      for (var x = g; x < w; x += g) c.fillRect(x, y, d, d);

    var dim = on ? 1 : 0.28;   // idle = everything ~25%

    // ---- sweep band 0st -> needle (hot, low alpha) : direction/amount at a glance
    if (on && Math.abs(this.needle - 270) > 0.5) {
      var a270 = 270 * DEG;
      c.beginPath();
      c.lineWidth = 6 * s;
      c.lineCap = "butt";
      c.strokeStyle = P.hot;
      c.globalAlpha = 0.10 + 0.22 * mix;
      c.arc(cx, cy, r - 14 * s, Math.min(a270, an), Math.max(a270, an));
      c.stroke();
    }

    // ---- arc
    c.beginPath();
    c.lineWidth = 1.5 * s;
    c.strokeStyle = P.phosphor;
    c.globalAlpha = 0.85 * dim;
    c.arc(cx, cy, r, this.A0 * DEG, (this.A0 + this.SWEEP) * DEG);
    c.stroke();

    // ---- rungs (25), every 12th longer
    c.lineCap = "butt";
    for (var i = 0; i < 25; i++) {
      var major = (i % 12) === 0;
      var len = (major ? 10 : (i % 6 === 0 ? 8 : 6)) * s;
      c.beginPath();
      c.lineWidth = (major ? 1.8 : 1) * s;
      c.globalAlpha = (major ? 0.95 : 0.55) * dim;
      c.moveTo(cx + this.rc[i] * (r - len), cy + this.rs[i] * (r - len));
      c.lineTo(cx + this.rc[i] * r, cy + this.rs[i] * r);
      c.stroke();
    }

    // ---- formant marker: small triangle just outside the arc ("accent" = phosphor .7)
    if (on) {
      var af = (this.A0 + this.SWEEP * (fst + 12) / 24) * DEG;
      c.save();
      c.translate(cx, cy);
      c.rotate(af);
      c.beginPath();
      c.moveTo(r + 2.5 * s, 0);
      c.lineTo(r + 9 * s, -3.6 * s);
      c.lineTo(r + 9 * s, 3.6 * s);
      c.closePath();
      c.fillStyle = P.phosphor;
      c.globalAlpha = 0.72;
      c.fill();
      c.restore();
    }

    // ---- needle (hot). glow + alpha scale with mix; idle = dim, parked
    c.beginPath();
    c.lineCap = "round";
    c.lineWidth = 2 * s;
    c.strokeStyle = P.hot;
    if (on) {
      c.globalAlpha = 0.5 + 0.5 * mix;
      c.shadowColor = P.hot;
      c.shadowBlur = 6 * s * mix;
    } else {
      c.globalAlpha = 0.35;
      c.shadowBlur = 0;
    }
    c.moveTo(cx - ncos * 9 * s, cy - nsin * 9 * s);            // short counterweight tail
    c.lineTo(cx + ncos * (r - 3 * s), cy + nsin * (r - 3 * s));
    c.stroke();
    c.shadowBlur = 0;

    // ---- rung labels -12 / 0 / +12 (inside the arc, ink halo so the needle never eats them)
    c.font = this.fSmall;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineJoin = "round";
    c.lineWidth = 3 * s;
    c.strokeStyle = P.ink;
    c.globalAlpha = 0.85;
    var rl = r - 21 * s;
    var lx0 = cx + this.rc[0] * rl, ly0 = cy + this.rs[0] * rl;
    var lx1 = cx + this.rc[12] * rl, ly1 = cy + this.rs[12] * rl;
    var lx2 = cx + this.rc[24] * rl, ly2 = cy + this.rs[24] * rl;
    c.strokeText("-12", lx0, ly0); c.strokeText("0", lx1, ly1); c.strokeText("+12", lx2, ly2);
    c.fillStyle = P.phosphor;
    c.globalAlpha = 0.9 * dim;
    if (on) { c.shadowColor = P.phosphor; c.shadowBlur = 4 * s; }
    c.fillText("-12", lx0, ly0); c.fillText("0", lx1, ly1); c.fillText("+12", lx2, ly2);
    c.shadowBlur = 0;

    // ---- hub disc r=6 ("accent") with ink centre
    c.beginPath();
    c.fillStyle = P.phosphor;
    c.globalAlpha = 0.75 * dim;
    c.arc(cx, cy, 6 * s, 0, 6.2832);
    c.fill();
    c.beginPath();
    c.fillStyle = P.ink;
    c.globalAlpha = 1;
    c.arc(cx, cy, 2 * s, 0, 6.2832);
    c.fill();

    // ---- interval name readout (ink halo so it stays legible over the needle)
    var txt = on ? this.ivl[st + 12] : "--";
    var ty = 60 * sy;
    c.font = this.fBig;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineJoin = "round";
    c.lineWidth = 4 * s;
    c.strokeStyle = P.ink;
    c.globalAlpha = 0.9;
    c.strokeText(txt, cx, ty);
    c.fillStyle = P.phosphor;
    c.globalAlpha = on ? 1 : 0.35;
    if (on) { c.shadowColor = P.phosphor; c.shadowBlur = 6 * s; }
    c.fillText(txt, cx, ty);
    c.shadowBlur = 0;

    // ---- formant readout bottom-right ("accent" = phosphor .7)
    c.font = this.fSmall;
    c.textAlign = "right";
    c.textBaseline = "alphabetic";
    c.fillStyle = P.phosphor;
    c.globalAlpha = on ? 0.72 : 0.25;
    if (on) { c.shadowColor = P.phosphor; c.shadowBlur = 3 * s; }
    c.fillText(on ? this.fmt[fst + 12] : "F--", w - 4 * sx, h - 4 * sy);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  }
});
