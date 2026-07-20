/* enginebg — "Idle → Redline" ambient background. A fixed layer behind all
   content that behaves like an engine: haze drifts, embers hang, a waveform
   breathes, a giant tach arc glows brass. Scroll depth = heat (arc hue slides
   toward the redline, peaking at ~78% of the document); scroll velocity =
   throttle blip (everything kicks, then settles); pointer = micro-parallax +
   shimmer wake. One render path, three lerped signals — no competing tweens.
   Design brief: workspace revaudio/stages/04_website/output/
   2026-07-20-enginebg-motion-background.md. Tuned on /enginelab. */
import { gsap, reducedMotion } from './motion';

const IDLE_AMP = 6; // waveform idle amplitude, px
const BLIP_GAIN = 1.2; // scroll-velocity → throttle sensitivity
const EMBER_COUNT = 80;

/* Heat curve: rises with depth, peaks at store/CTA territory, eases off. */
const heatAt = (p: number) => (p <= 0.78 ? p / 0.78 : 1 - ((p - 0.78) / 0.22) * 0.3);

type Ember = { x: number; y: number; vx: number; vy: number; r: number; tw: number };
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function initEngineBg(): void {
  const root = document.querySelector<HTMLElement>('[data-ebg]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-ebg-canvas]');
  const haze1 = root?.querySelector<HTMLElement>('[data-ebg-haze1]');
  const haze2 = root?.querySelector<HTMLElement>('[data-ebg-haze2]');
  if (!root || !canvas || !haze1 || !haze2) return;

  /* Mobile: haze + arc only — no canvas, no pointer signal (design brief). */
  const mobile = window.matchMedia('(max-width: 900px)').matches;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const state = { heat: 0, blip: 0, px: 0.5, py: 0.5, lastY: window.scrollY };

  /* Haze drift phases — integrated incrementally (phase += dt·rate·drift) so a
     blip changes drift SPEED smoothly. Multiplying t by a varying rate inside
     sin() rescales all accumulated time and teleports the smoke on fast
     scroll. Random offsets desync the two plates. */
  const ph = {
    x1: rand(0, Math.PI * 2),
    y1: rand(0, Math.PI * 2),
    x2: rand(0, Math.PI * 2),
    y2: rand(0, Math.PI * 2),
  };
  let lastHeatOut = -1;
  let lastBlipOut = -1;

  const embers: Ember[] = Array.from({ length: mobile ? 0 : EMBER_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: rand(-0.006, 0.006),
    vy: rand(-0.014, -0.002),
    r: rand(0.6, 1.8),
    tw: Math.random() * Math.PI * 2,
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function drawFrame(t: number, dt = 0) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // embers — brass→red with heat; cursor wake pushes + brightens
    const warm = state.heat;
    for (const e of embers) {
      e.tw += dt * rand(0.5, 1.5);
      const kick = 1 + state.blip * 6;
      e.x += e.vx * dt * kick;
      e.y += e.vy * dt * kick;
      if (e.y < -0.02) { e.y = 1.02; e.x = Math.random(); }
      if (e.x < -0.02) e.x = 1.02;
      if (e.x > 1.02) e.x = -0.02;

      const dx = e.x - state.px;
      const dy = e.y - state.py;
      const near = Math.max(0, 1 - (dx * dx + dy * dy) / 0.02);
      if (near > 0) { e.x += dx * near * 0.15 * dt; e.y += dy * near * 0.15 * dt; }

      const twinkle = 0.55 + Math.sin(e.tw) * 0.45;
      const a = (0.10 + warm * 0.22 + state.blip * 0.25 + near * 0.3) * twinkle;
      ctx.fillStyle = `rgba(${Math.round(201 + warm * 30)}, ${Math.round(163 - warm * 90)}, ${Math.round(92 - warm * 55)}, ${Math.min(a, 0.7)})`;
      ctx.beginPath();
      ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // waveform horizon — idles low, revs with blip, ripples near cursor
    if (!mobile) {
      const baseY = h * 0.84;
      const amp = IDLE_AMP + state.blip * 34;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const u = x / w;
        const cursorBoost = 1 + Math.max(0, 1 - Math.abs(u - state.px) * 6) * 1.6;
        const y =
          baseY +
          (Math.sin(u * 11 + t * 1.7) * 0.55 + Math.sin(u * 23 - t * 2.3) * 0.3 + Math.sin(u * 5 + t * 0.9) * 0.5) *
            amp * cursorBoost;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(201, 163, 92, ${0.16 + state.blip * 0.25})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  if (reducedMotion()) {
    drawFrame(0); // static idle frame, no animation
    return;
  }

  if (!mobile) {
    window.addEventListener('pointermove', (e) => {
      state.px = e.clientX / window.innerWidth;
      state.py = e.clientY / window.innerHeight;
    });
  }

  let t = 0;
  gsap.ticker.add((_time, deltaMS) => {
    const dt = Math.min(deltaMS / 1000, 0.05);
    t += dt;

    // signal: scroll position → heat (lerped)
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const targetHeat = heatAt(max > 0 ? window.scrollY / max : 0);
    state.heat += (targetHeat - state.heat) * 0.06;

    // signal: scroll velocity → throttle blip (attack fast, decay slow).
    // First frames excluded — load-time layout shifts read as a fake flick.
    const v = t < 0.5 ? 0 : Math.abs(window.scrollY - state.lastY) / Math.max(dt, 1e-4);
    state.lastY = window.scrollY;
    const targetBlip = Math.min((v / 2500) * BLIP_GAIN, 1);
    state.blip += targetBlip > state.blip
      ? (targetBlip - state.blip) * 0.35
      : (targetBlip - state.blip) * 0.04;

    // outputs — CSS vars drive the arc's filter on a huge element, so only
    // write when the value moved enough to matter (cuts style-recalc churn)
    const heatOut = Math.round(state.heat * 200) / 200;
    if (heatOut !== lastHeatOut) { root.style.setProperty('--heat', String(heatOut)); lastHeatOut = heatOut; }
    const blipOut = Math.round(state.blip * 100) / 100;
    if (blipOut !== lastBlipOut) { root.style.setProperty('--blip', String(blipOut)); lastBlipOut = blipOut; }

    const drift = 1 + state.blip * 2.5;
    ph.x1 += dt * 0.05 * drift;
    ph.y1 += dt * 0.04 * drift;
    ph.x2 += dt * 0.035 * drift;
    ph.y2 += dt * 0.045 * drift;
    const par = mobile ? { x: 0, y: 0 } : { x: (state.px - 0.5) * 14, y: (state.py - 0.5) * 10 };
    gsap.set(haze1, {
      x: Math.sin(ph.x1) * 40 + par.x,
      y: Math.cos(ph.y1) * 25 + par.y * 0.6,
    });
    gsap.set(haze2, {
      x: Math.cos(ph.x2) * 55 - par.x * 0.5,
      y: Math.sin(ph.y2) * 30 - par.y * 0.4,
    });

    drawFrame(t, dt);
  });
}
