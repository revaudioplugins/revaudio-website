/* Verbatim copy of DRIFT 5.2.4 Source/ui/public/assets/fxv/screen-halo.js (Drift main b2b187b) for the /drift #fx live
 * rack (src/lib/drift/rack.ts hosts it like the plugin's FXV runtime). Re-copy when the plugin screen changes; never edit here. */
/* screen-halo.js - HALO ensemble mini-screen (DRIFT 5.1) for the FX rack, chain slot 3 (TREMOLO's column).
 * FXV screen-module contract: classic script, no globals except window.FXV,
 * draws only into its own canvas, allocation-free per frame.
 *
 * The object: a halo of light around a voice. The voice (centre dot) never moves - HALO never touches the dry.
 * Two flat rings around it are HALO's two delay lines, A inside B. Their radii are the line centres
 * (SIZE: A 4 -> 12 ms, B = A + 5 -> 10 ms) and they breathe in ANTIPHASE by the real sweep
 *   s(t) = a1 sin(2 pi f1 t) + a2 sin(2 pi f2 t)      (A reads cA + s, B reads cB - s: A grows while B shrinks)
 * with Source/Halo.h's numbers: MODE 1..4 = 0.20 / 0.27 / 0.36 / 0.48 Hz at 3.5 / 5.5 / 8 / 11 cents,
 * f2 = 2.65 f1, pitch-budget shares 75 / 25, ak = share_k * r / (2 pi fk), r = 1 - 2^(-cents / 1200).
 * A mode change switches the rates at once and glides the amplitudes over 250 ms; the phases never jump
 * (the DSP's Lfo::setMode). Lights ride each ring at the main LFO phase (B's half a turn after A's), so the
 * rings turn at the mode's real rate: MODE 4 turns 2.4x as fast as MODE 1.
 * The sweep is drawn at EXAG x its true size against the ring radii (a 1.8 ms swing on a 22 ms line would not
 * read on a 195 px glass); one gain for every mode, so the modes still compare honestly.
 * MIX = how bright the halo is (MIX 0 leaves faint rings: armed, silent); TONE = the wet low-pass: dark =
 * thick soft rings, bright = thin crisp rings with more lights.
 *
 * Reads (P.get, normalised 0..1): HALO_MIX, HALO_MODE (choice, idx/3), HALO_SIZE, HALO_TONE.
 * Power comes from P.on (BYP_HALO, inverted). Idle = everything at .2, static.
 * Layout authored in the house 195x78 screen, scaled from P.w/P.h.
 * Colour: P.ink glass base, P.phosphor rings and captions, P.hot for the voice and the lights.
 */
window.FXV = window.FXV || { screens: {}, register: function (id, impl) { this.screens[id] = impl; } };

FXV.register("halo", {
  BASE_W: 195, BASE_H: 78,
  /* Source/Halo.h kModes / kRate2 / kShare1 / kCentreAMs* / kGapMs* - keep in step */
  RATE: [0.20, 0.27, 0.36, 0.48], CENTS: [3.5, 5.5, 8.0, 11.0],
  RATE2: 2.65, SHARE1: 0.75,
  CA0: 4, CA1: 12, GAP0: 5, GAP1: 10,          /* ms */
  GLIDE: 0.25,                                  /* s, MODE amplitude glide (kModeGlideMs) */
  R0: 12, PX_MS: 3.0, FLAT: 0.30, EXAG: 2.2,    /* ring rx = R0 + PX_MS * ms (base px), ry = FLAT * rx */
  TWO_PI: Math.PI * 2,

  init: function (canvas, P) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    /* pre-built strings: nothing is concatenated in draw() */
    this.modeStr = ["MODE 1", "MODE 2", "MODE 3", "MODE 4"];
    this.mixStr = new Array(101);
    for (var i = 0; i <= 100; i++) this.mixStr[i] = "MIX " + i + "%";
    this.offStr = "BYP";
    /* per-mode sweep amplitudes in ms (Halo.h sweepFor) */
    this.A1 = new Float64Array(4); this.A2 = new Float64Array(4);
    for (var m = 0; m < 4; m++) {
      var r = 1 - Math.pow(2, -this.CENTS[m] / 1200);
      this.A1[m] = 1000 * this.SHARE1 * r / (this.TWO_PI * this.RATE[m]);
      this.A2[m] = 1000 * (1 - this.SHARE1) * r / (this.TWO_PI * this.RATE[m] * this.RATE2);
    }
    this.mode = -1; this.a1 = 0; this.a2 = 0; this.g1 = 0; this.g2 = 0; this.gLeft = 0;
    this.ph1 = 0; this.ph2 = 0;
    this.cA = -1; this.cB = -1;                 /* drawn line centres, ms (eased, like the DSP's SIZE slew) */
    this.lastT = 0;
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
    this.cx = 97.5 * sx; this.cy = 40 * sy;           /* the voice */
    this.fCap = Math.max(12, Math.round(14 * s)) + "px VT323, monospace";
    this.fVal = Math.max(14, Math.round(17 * s)) + "px VT323, monospace";
    this.pad = 5 * s;
    this.yTop = 13 * sy; this.yBot = h - this.pad;
    /* glass base + a soft bloom around the voice, rendered once into the offscreen buffer */
    var r = parseInt(P.phosphor.substr(1, 2), 16), g = parseInt(P.phosphor.substr(3, 2), 16),
        b = parseInt(P.phosphor.substr(5, 2), 16);
    if (!(r >= 0)) r = 125; if (!(g >= 0)) g = 255; if (!(b >= 0)) b = 138;
    var bc = this.baseCtx;
    this.baseCv.width = Math.max(1, Math.round(w * P.dpr));
    this.baseCv.height = Math.max(1, Math.round(h * P.dpr));
    bc.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
    bc.globalAlpha = 1;
    bc.fillStyle = P.ink; bc.fillRect(0, 0, w, h);
    var gr = bc.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, w * 0.55);
    gr.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.12)");
    gr.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
    bc.fillStyle = gr; bc.fillRect(0, 0, w, h);
  },

  _c01: function (v) { return v > 0 ? (v < 1 ? v : 1) : 0; },

  /* one ring: an ellipse around the voice; lights on it at angle th0 + k * 2pi / n, the far half dimmer */
  _ring: function (ctx, rx, alpha, lw, blur, P) {
    ctx.strokeStyle = P.phosphor; ctx.lineWidth = lw; ctx.globalAlpha = alpha;
    ctx.shadowColor = P.phosphor; ctx.shadowBlur = blur;
    ctx.beginPath(); ctx.ellipse(this.cx, this.cy, rx, rx * this.FLAT, 0, 0, this.TWO_PI); ctx.stroke();
  },
  _lights: function (ctx, rx, th0, n, rad, alpha, blur, P) {
    var ry = rx * this.FLAT, step = this.TWO_PI / n;
    ctx.fillStyle = P.hot; ctx.shadowColor = P.hot; ctx.shadowBlur = blur;
    for (var k = 0; k < n; k++) {
      var th = th0 + k * step, sn = Math.sin(th);
      ctx.globalAlpha = alpha * (sn < 0 ? 0.45 : 1);    /* sin < 0 = the far half of the halo (top of the ellipse) */
      ctx.beginPath(); ctx.arc(this.cx + Math.cos(th) * rx, this.cy + sn * ry, rad, 0, this.TWO_PI); ctx.fill();
    }
  },

  draw: function (t, P) {
    var ctx = this.ctx;
    if (P.w !== this.w || P.h !== this.h || P.dpr !== this.dpr || P.phosphor !== this.phos) this._layout(P);
    var dt = t - this.lastT; this.lastT = t;
    if (!(dt > 0) || dt > 0.1) dt = 1 / 30;

    var on = !!P.on, A = on ? 1 : 0.2;
    var mix = this._c01(P.get("HALO_MIX")), size = this._c01(P.get("HALO_SIZE")), tone = this._c01(P.get("HALO_TONE"));
    var mi = Math.round(this._c01(P.get("HALO_MODE")) * 3);

    /* MODE: the rates switch at once, the amplitudes glide 250 ms, the phases never jump */
    if (mi !== this.mode) {
      if (this.mode < 0) { this.a1 = this.A1[mi]; this.a2 = this.A2[mi]; this.gLeft = 0; }
      else { this.g1 = (this.A1[mi] - this.a1) / this.GLIDE; this.g2 = (this.A2[mi] - this.a2) / this.GLIDE; this.gLeft = this.GLIDE; }
      this.mode = mi;
    }
    if (on) {
      if (this.gLeft > 0) {
        var st = dt < this.gLeft ? dt : this.gLeft;
        this.a1 += this.g1 * st; this.a2 += this.g2 * st; this.gLeft -= st;
        if (this.gLeft <= 0) { this.a1 = this.A1[mi]; this.a2 = this.A2[mi]; this.gLeft = 0; }
      }
      this.ph1 += this.RATE[mi] * dt; this.ph1 -= Math.floor(this.ph1);
      this.ph2 += this.RATE[mi] * this.RATE2 * dt; this.ph2 -= Math.floor(this.ph2);
    }
    /* SIZE: the line centres in ms, eased over ~120 ms like the DSP's slew-limited glide */
    var tA = this.CA0 + (this.CA1 - this.CA0) * size, tB = tA + this.GAP0 + (this.GAP1 - this.GAP0) * size;
    if (this.cA < 0) { this.cA = tA; this.cB = tB; }
    else { var e = 1 - Math.exp(-dt / 0.12); this.cA += (tA - this.cA) * e; this.cB += (tB - this.cB) * e; }

    var sw = on ? this.EXAG * (this.a1 * Math.sin(this.TWO_PI * this.ph1) + this.a2 * Math.sin(this.TWO_PI * this.ph2)) : 0;
    var s = this.s, w = this.w;
    var rA = (this.R0 + this.PX_MS * (this.cA + sw)) * s, rB = (this.R0 + this.PX_MS * (this.cB - sw)) * s;

    /* glass base: lit = pre-rendered ink + bloom blit, idle = flat ink */
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (on) ctx.drawImage(this.baseCv, 0, 0, w, this.h);
    else { ctx.fillStyle = P.ink; ctx.fillRect(0, 0, w, this.h); }

    /* rings: MIX = brightness, TONE = dark soft .. bright crisp */
    var ringA = A * (0.22 + 0.78 * mix);
    var lw = (2.6 - 1.4 * tone) * s, blur = on ? (2 + 10 * mix) * (1.25 - 0.6 * tone) * s : 0;
    this._ring(ctx, rB, ringA * 0.8, lw, blur, P);
    this._ring(ctx, rA, ringA, lw, blur, P);

    /* lights: 1 + 3 x TONE per ring, turning at the mode's main LFO rate; B half a turn after A */
    var n = 1 + Math.round(3 * tone), th0 = this.TWO_PI * this.ph1;
    var lr = (1.2 + 1.0 * tone) * s, la = A * (0.35 + 0.65 * mix), lb = on ? (3 + 6 * mix) * s : 0;
    this._lights(ctx, rB, th0 + Math.PI, n, lr, la * 0.85, lb, P);
    this._lights(ctx, rA, th0, n, lr, la, lb, P);

    /* the voice: still, in the middle */
    ctx.fillStyle = P.hot; ctx.shadowColor = P.hot; ctx.shadowBlur = on ? 8 * s : 0; ctx.globalAlpha = A;
    ctx.beginPath(); ctx.arc(this.cx, this.cy, 2.6 * s, 0, this.TWO_PI); ctx.fill();
    ctx.shadowBlur = 0;

    /* captions: MODE top-left, MIX bottom-right (BYP when off) */
    ctx.font = this.fCap; ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left"; ctx.fillStyle = P.phosphor; ctx.globalAlpha = 0.6 * A;
    ctx.fillText(this.modeStr[mi], this.pad, this.yTop);
    ctx.textAlign = "right"; ctx.font = this.fVal; ctx.globalAlpha = A;
    if (on) { ctx.shadowColor = P.phosphor; ctx.shadowBlur = 6 * s; }
    ctx.fillText(on ? this.mixStr[Math.round(mix * 100)] : this.offStr, w - this.pad, this.yBot);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
});
