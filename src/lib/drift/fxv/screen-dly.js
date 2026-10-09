/* Verbatim copy of DRIFT 5.2.4 Source/ui/public/assets/fxv/screen-dly.js (Drift main b2b187b) for the /drift #fx live
 * rack (src/lib/drift/rack.ts hosts it like the plugin's FXV runtime). Re-copy when the plugin screen changes; never edit here. */
window.FXV = window.FXV || { screens: {}, register: function (id, impl) { this.screens[id] = impl; } };
/* screen-dly.js - DELAY mini-screen visualiser (FXV contract).
   Magenta tape deck: two reels, tape path across the top, a hot source blip
   at the record head that fires every T ms and spawns ghost echoes that ride
   the tape right and fade; feedback return loop underneath.
   Design space = 195 x 88 (spec canvas box); everything scales via P.w / P.h.
   Reads: DLY_MODE DLY_DIV DLY_TIME_MS DLY_FEEDBACK DLY_CHAR DLY_MIX DLY_PINGPONG
   (BYP_DLY arrives as P.on === false -> static standby). */
(function () {
  "use strict";

  var DW = 195, DH = 88;                       /* design units */
  var TAPE_Y = 26, PATH_X0 = 48, PATH_LEN = 110;
  var REEL_LX = 34, REEL_RX = 161, REEL_Y = 44, REEL_R = 16;
  var LOOP_Y = 62;                             /* feedback return path (reel bottoms) */
  var PP_DY = 8;                               /* ping-pong lane offset */
  var TXT = "#f4e9ff";
  var TWO_PI = Math.PI * 2;

  var DIV_LBL = ["1/1","1/1.","1/1t","1/2","1/2.","1/2t","1/4","1/4.","1/4t",
                 "1/8","1/8.","1/8t","1/16","1/16.","1/16t","1/32","1/32.","1/32t"];
  var DIV_BEATS = new Float64Array(18);
  (function () {
    var den = [1,1,1,2,2,2,4,4,4,8,8,8,16,16,16,32,32,32];
    for (var i = 0; i < 18; i++) {
      var m = i % 3;                            /* 0 straight, 1 dotted, 2 triplet */
      DIV_BEATS[i] = (4 / den[i]) * (m === 1 ? 1.5 : (m === 2 ? 2 / 3 : 1));
    }
  })();
  var POW85 = new Float64Array(10);
  for (var k = 0; k < 10; k++) POW85[k] = Math.pow(0.85, k);

  function hexRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  FXV.register("dly", {

    init: function (canvas, P) {
      var ctx = canvas.getContext("2d");
      this.ctx = ctx;
      this.dpr = P.dpr || 1;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      this.phos = P.phosphor || "#f24cf0";
      this.hot  = P.hot      || "#ffd1f8";
      this.ink  = P.ink      || "#0f0418";
      var rp = hexRgb(this.phos);

      /* pre-built gradients (design space) - vignette + phosphor bloom behind the reels */
      var vig = ctx.createRadialGradient(DW * 0.5, DH * 0.5, DH * 0.25, DW * 0.5, DH * 0.5, DW * 0.62);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.55)");
      this.vig = vig;
      var haze = ctx.createLinearGradient(0, 0, 0, DH);
      haze.addColorStop(0, rgba(rp, 0.10));
      haze.addColorStop(0.5, rgba(rp, 0.02));
      haze.addColorStop(1, rgba(rp, 0.06));
      this.haze = haze;

      /* motion state */
      this.angle = 0;         /* reel angle (rad) */
      this.phase = 0;         /* 0..1 position inside the current delay period */
      this.chev  = 0;         /* feedback chevron travel (design px) */
      this.tLast = 0;

      /* cached caption strings (rebuilt only when the value changes) */
      this.capKey  = -1;
      this.capText = "";
      this.fontCap = "13px VT323, monospace";
      this.fontTag = "11px VT323, monospace";
      this.fontLR  = "12px VT323, monospace";
    },

    /* ---- helpers (no allocation) ---- */

    _timeMs: function (P) {
      var bpm = (P.tempoBpm > 0) ? P.tempoBpm : 120;
      var beat = 60000 / bpm;
      var free = P.get("DLY_MODE") >= 0.5;
      var idx = Math.round(clamp01(P.get("DLY_DIV")) * 17);
      var ms;
      if (free) {
        ms = 20 + 1980 * Math.pow(clamp01(P.get("DLY_TIME_MS")), 1 / 0.35);
      } else {
        ms = beat * DIV_BEATS[idx];
      }
      /* caption cache */
      var key = free ? (1000000 + Math.round(ms)) : (idx * 10000 + Math.round(bpm));
      if (key !== this.capKey) {
        this.capKey = key;
        this.capText = free ? (Math.round(ms) + "ms") : (DIV_LBL[idx] + " @" + Math.round(bpm));
      }
      this.beatMs = beat;
      return ms;
    },

    _reel: function (ctx, cx, cy, ang, alpha) {
      var i;
      /* wound tape pancake */
      ctx.globalAlpha = alpha * 0.14;
      ctx.fillStyle = this.phos;
      ctx.beginPath(); ctx.arc(cx, cy, REEL_R - 3, 0, TWO_PI); ctx.fill();
      /* flange ring */
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.phos;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, REEL_R, 0, TWO_PI); ctx.stroke();
      /* spokes */
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (i = 0; i < 3; i++) {
        var a = ang + i * (TWO_PI / 3);
        var c = Math.cos(a), s = Math.sin(a);
        ctx.moveTo(cx + c * 4, cy + s * 4);
        ctx.lineTo(cx + c * (REEL_R - 2), cy + s * (REEL_R - 2));
      }
      ctx.stroke();
      /* hub */
      ctx.fillStyle = this.hot;
      ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = this.ink;
      ctx.beginPath(); ctx.arc(cx, cy, 1.3, 0, TWO_PI); ctx.fill();
      ctx.lineCap = "butt";
    },

    _base: function (ctx) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.ink;
      ctx.fillRect(0, 0, DW, DH);
      ctx.fillStyle = this.haze;
      ctx.fillRect(0, 0, DW, DH);
      ctx.fillStyle = this.vig;
      ctx.fillRect(0, 0, DW, DH);
    },

    /* ---- idle: static dim standby, no motion ---- */
    _idle: function (ctx) {
      var x, y;
      /* faint dot grid */
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = this.phos;
      for (y = 8; y < DH; y += 12) {
        for (x = 9; x < DW; x += 12) ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
      /* tape path + reels, frozen */
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = this.phos;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(REEL_LX, TAPE_Y); ctx.lineTo(REEL_RX, TAPE_Y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(REEL_LX, LOOP_Y); ctx.lineTo(REEL_RX, LOOP_Y); ctx.stroke();
      this._reel(ctx, REEL_LX, REEL_Y, this.angle, 0.26);
      this._reel(ctx, REEL_RX, REEL_Y, this.angle, 0.26);
      /* caption */
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = this.phos;
      ctx.font = this.fontCap;
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("BYP", DW - 6, 14);
      ctx.textAlign = "left";
    },

    draw: function (t, P) {
      var ctx = this.ctx;
      var dpr = P.dpr || this.dpr;
      var sx = P.w / DW, sy = P.h / DH;
      ctx.setTransform(dpr * sx, 0, 0, dpr * sy, 0, 0);
      ctx.shadowBlur = 0;

      this._base(ctx);

      var dt = t - this.tLast;
      this.tLast = t;
      if (dt < 0 || dt > 0.1) dt = 0.016;

      if (P.on === false) { this._idle(ctx); return; }

      /* ---- params ---- */
      var Tms      = this._timeMs(P);
      var fb       = clamp01(P.get("DLY_FEEDBACK"));
      var vintage  = P.get("DLY_CHAR") < 0.5;
      var mix      = clamp01(P.get("DLY_MIX"));
      var pingpong = P.get("DLY_PINGPONG") >= 0.5;
      var count    = Math.round(1 + fb * 7);
      var spacing  = 110 * Tms / 2000; if (spacing < 6) spacing = 6;
      var vel      = spacing / Tms;                 /* design px per ms */
      var beatPx   = vel * this.beatMs;
      var A        = 0.35 + 0.65 * mix;             /* scene alpha */

      /* ---- motion ---- */
      var rps = vintage ? 0.8 : 2.4;
      this.angle += dt * TWO_PI * rps;
      if (this.angle > TWO_PI) this.angle -= TWO_PI;
      this.phase += (dt * 1000) / Tms;
      if (this.phase >= 1) this.phase -= Math.floor(this.phase);
      this.chev += dt * (18 + 70 * fb);
      if (this.chev > 1000) this.chev -= 1000;
      var ph = this.phase;

      var i, x, y, a;
      ctx.strokeStyle = this.phos;
      ctx.fillStyle = this.phos;

      /* beat ruler under the tape (time axis: x = PATH_X0 + beats * beatPx) */
      if (beatPx >= 7) {
        ctx.globalAlpha = 0.42 * A;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (i = 0; ; i++) {
          x = PATH_X0 + i * beatPx;
          if (x > PATH_X0 + PATH_LEN + 0.5) break;
          var th = (i % 4 === 0) ? 6 : 3.5;
          ctx.moveTo(x, TAPE_Y + 2); ctx.lineTo(x, TAPE_Y + 2 + th);
        }
        ctx.stroke();
      }

      /* tape path */
      ctx.globalAlpha = 0.55 * A;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(REEL_LX, TAPE_Y); ctx.lineTo(REEL_RX, TAPE_Y); ctx.stroke();

      /* feedback return loop + chevrons flowing back to the supply reel */
      var la = (0.12 + 0.6 * fb) * A;
      ctx.globalAlpha = la;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(REEL_LX, LOOP_Y); ctx.lineTo(REEL_RX, LOOP_Y); ctx.stroke();
      if (fb > 0.02) {
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (i = 0; i < 3; i++) {
          var cx = REEL_RX - 8 - ((this.chev + i * 37) % (PATH_LEN + 6));
          ctx.moveTo(cx + 3, LOOP_Y - 3); ctx.lineTo(cx, LOOP_Y); ctx.lineTo(cx + 3, LOOP_Y + 3);
        }
        ctx.stroke();
      }

      /* reels */
      this._reel(ctx, REEL_LX, REEL_Y, this.angle, 0.92 * A);
      this._reel(ctx, REEL_RX, REEL_Y, -this.angle * 0.9, 0.92 * A);

      /* record head marker above the source */
      ctx.globalAlpha = 0.8 * A;
      ctx.fillStyle = this.hot;
      ctx.beginPath();
      ctx.moveTo(PATH_X0 - 3.5, TAPE_Y - 9); ctx.lineTo(PATH_X0 + 3.5, TAPE_Y - 9); ctx.lineTo(PATH_X0, TAPE_Y - 5);
      ctx.closePath(); ctx.fill();

      /* ---- echo blips riding the tape ---- */
      var blur = vintage ? 2 * dpr * Math.min(sx, sy) : 0;
      var powPh = Math.pow(0.85, ph);
      var wob = vintage ? Math.sin(t * 3) : 0;
      ctx.fillStyle = this.phos;
      if (blur > 0) { ctx.shadowColor = this.phos; ctx.shadowBlur = blur; }
      var tail = spacing * 0.45; if (tail > 9) tail = 9; if (tail < 3) tail = 3;
      for (i = 0; i < count; i++) {
        x = PATH_X0 + (i + ph) * spacing;
        if (x > PATH_X0 + PATH_LEN) break;
        a = POW85[i + 1] * powPh;
        if (i === count - 1) a *= (1 - ph);                 /* last echo dies over its period */
        var edge = PATH_X0 + PATH_LEN - x; if (edge < 10) a *= edge / 10;   /* winds onto the reel */
        if (a < 0.02) continue;
        y = TAPE_Y;
        if (pingpong) y += (i % 2 === 0) ? -PP_DY : PP_DY;
        if (vintage) y += Math.sin(t * 3 + i * 1.3) * 1;
        var r = 2.6 + 1.8 * a;
        /* comet tail (motion direction) */
        ctx.globalAlpha = a * A * 0.35;
        ctx.fillRect(x - tail, y - 0.75, tail, 1.5);
        /* phosphor body */
        ctx.globalAlpha = a * A;
        ctx.fillStyle = this.phos;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
        /* hot core */
        ctx.globalAlpha = a * A * 0.9;
        ctx.fillStyle = this.hot;
        ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, TWO_PI); ctx.fill();
        ctx.fillStyle = this.phos;
        if (pingpong) {                                       /* stem tying the lane blip to the tape */
          ctx.globalAlpha = a * A * 0.5;
          ctx.fillRect(x - 0.5, y < TAPE_Y ? y + r : TAPE_Y, 1, PP_DY - r);
        }
      }
      ctx.shadowBlur = 0;

      /* ---- source blip (hot) + fire flash ---- */
      var flash = (Tms < 80) ? 0.35 : Math.exp(-ph * 7);
      ctx.fillStyle = this.hot;
      ctx.globalAlpha = (0.55 + 0.45 * flash) * A;
      ctx.beginPath(); ctx.arc(PATH_X0, TAPE_Y + wob * 0.6, 3 + flash * 1.2, 0, TWO_PI); ctx.fill();
      if (flash > 0.04 && Tms >= 80) {
        ctx.strokeStyle = this.hot;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = flash * 0.7 * A;
        ctx.beginPath(); ctx.arc(PATH_X0, TAPE_Y, 4 + (1 - flash) * 9, 0, TWO_PI); ctx.stroke();
      }

      /* ---- lane markers + tags ---- */
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = this.phos;
      ctx.shadowBlur = 3 * dpr * Math.min(sx, sy);
      if (pingpong) {
        ctx.fillStyle = TXT;
        ctx.font = this.fontLR;
        ctx.textAlign = "left";
        ctx.globalAlpha = 0.85;
        ctx.fillText("L", REEL_RX + REEL_R + 4, TAPE_Y - PP_DY + 4);
        ctx.fillText("R", REEL_RX + REEL_R + 4, TAPE_Y + PP_DY + 4);
      }
      ctx.font = this.fontTag;
      ctx.fillStyle = this.phos;
      ctx.globalAlpha = 0.75;
      ctx.textAlign = "left";
      if (pingpong) ctx.fillText("PING-PONG", 6, DH - 6);
      ctx.textAlign = "right";
      if (vintage) ctx.fillText("TAPE", DW - 6, DH - 6);

      /* ---- caption: time value, top-right ---- */
      ctx.font = this.fontCap;
      ctx.fillStyle = this.phos;
      ctx.globalAlpha = 0.95;
      ctx.textAlign = "right";
      ctx.fillText(this.capText, DW - 6, 14);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }
  });
})();
