/**
 * DRIFT's 8 SIMPLE tracks (TRK_ID 40-47), verbatim from the plugin's own JS
 * mirror of SimpleTrackEngine::rawShape (Drift/Source/ui/public/index.html
 * 2460-2481, fact sheet 2026-09-26 §2.5). Used twice: at build time for the
 * card outlines (pure SVG, zero JS) and in the browser to drive the car.
 *
 * fx(ph) = the pan shape (peak-normalised = the DSP's shapeAt), fy(ph) = the
 * outline's vertical companion (drawing only, never part of the pan).
 * The race circuits are deliberately NOT here: all 40 are real F1 circuit
 * identities (review Decision 19, Dan 2026-09-26: plugin-only, never on site).
 */
const TAU = Math.PI * 2;

type Fn = (ph: number) => number;
export interface SimpleTrack { id: number; name: string; desc: string; fx: Fn; fy: Fn }

export const SIMPLE: SimpleTrack[] = [
  { id: 40, name: 'BREEZE', desc: 'soft sine + 2nd harmonic', fx: (ph) => { const t = TAU * ph; return Math.sin(t) + 0.3 * Math.sin(2 * t + 0.7); }, fy: (ph) => { const t = TAU * ph; return -0.5 * Math.cos(t) + 0.15 * Math.sin(3 * t); } },
  { id: 41, name: 'SWAY', desc: 'rounded triangle', fx: (ph) => Math.sin((Math.PI / 2) * (1 - 4 * Math.abs(ph - 0.5))), fy: (ph) => 0.35 * Math.sin(TAU * ph) },
  { id: 42, name: 'PENDULUM', desc: 'pure sine', fx: (ph) => Math.sin(TAU * ph), fy: (ph) => { const x = Math.sin(TAU * ph); return 0.45 * x * x - 0.2; } },
  { id: 43, name: 'ORBIT', desc: 'near / far lobe', fx: (ph) => { const t = TAU * ph; return Math.sin(t) / (1.4 - 0.6 * Math.cos(t)); }, fy: (ph) => -0.6 * Math.cos(TAU * ph) },
  { id: 44, name: 'FIGURE-8', desc: 'lemniscate', fx: (ph) => { const t = TAU * ph, st = Math.sin(t); return Math.cos(t) / (1 + st * st); }, fy: (ph) => { const t = TAU * ph, st = Math.sin(t); return (Math.sin(t) * Math.cos(t)) / (1 + st * st); } },
  { id: 45, name: 'PING-PONG', desc: 'hard L / R', fx: (ph) => Math.tanh(6 * Math.sin(TAU * ph)), fy: (ph) => -0.4 * Math.cos(TAU * ph) },
  { id: 46, name: 'SPIN', desc: 'two cycles per lap', fx: (ph) => Math.sin(2 * TAU * ph), fy: (ph) => -0.6 * Math.cos(TAU * ph) },
  { id: 47, name: 'TORNADO', desc: 'three cycles, growing', fx: (ph) => Math.sin(3 * TAU * ph) * (0.25 + 0.75 * ph), fy: (ph) => -0.6 * Math.cos(3 * TAU * ph) * (0.25 + 0.75 * ph) },
];

// peak-normalise each shape over a 1024-sample scan, like SimpleTrackEngine::buildNorm()
const NORM = SIMPLE.map((t) => {
  let pk = 1e-6, pky = 1e-6;
  for (let i = 0; i < 1024; i++) { pk = Math.max(pk, Math.abs(t.fx(i / 1024))); pky = Math.max(pky, Math.abs(t.fy(i / 1024))); }
  return { pk, pky };
});

const idx = (id: number) => Math.max(0, SIMPLE.findIndex((t) => t.id === id));

/** The DSP's shapeAt(shape, phase): where the pan is headed, -1..1. */
export const shapeAt = (id: number, ph: number) => { const i = idx(id); return SIMPLE[i].fx(ph - Math.floor(ph)) / NORM[i].pk; };
/** Outline point (x = pan, y = drawing companion), both -0.9..0.9 like the card canvas. */
export const outlineAt = (id: number, ph: number): [number, number] => {
  const i = idx(id), p = ph - Math.floor(ph);
  return [(SIMPLE[i].fx(p) / NORM[i].pk) * 0.9, (SIMPLE[i].fy(p) / NORM[i].pky) * 0.9];
};

/** SVG path of the outline in a w x h box (build time, and the GPS glass). */
export function outlinePath(id: number, w: number, h: number, n = 256): string {
  let d = '';
  for (let k = 0; k <= n; k++) {
    const [x, y] = outlineAt(id, k / n);
    d += `${k ? 'L' : 'M'}${((x * 0.5 + 0.5) * w).toFixed(1)} ${((y * 0.5 + 0.5) * h).toFixed(1)}`;
  }
  return d + 'Z';
}

/** INTENSITY (TRK_WIDTH, default .60) -> swing width. */
export const swingWidth = (intensity: number) => 0.12 + 0.8 * intensity;
/** SPEED (TRK_LAP, default .488084) -> FREE period of a SIMPLE track, 16 s .. 0.25 s. */
export const simplePeriod = (lap01: number) => 16 * Math.pow(64, -lap01);

/**
 * The per-sample pan spring both track engines use (SimpleTrackEngine.h
 * 159-177): mass-spring-damper toward the target; higher INTENSITY = looser
 * spring = the audible tail-swing on reversals. Sub-stepped so a 60 fps frame
 * stays stable when fHz hits its 20 Hz ceiling.
 */
export class PanSpring {
  pan = 0;
  vel = 0;
  step(target: number, dt: number, intensity: number, periodSec: number): number {
    const zeta = 1 - 0.62 * intensity;
    const fHz = Math.min(20, Math.max(0.15, 1.8 * (8 / periodSec)));
    const wn = TAU * fHz;
    const n = Math.max(1, Math.ceil((wn * dt) / 0.25));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const acc = wn * wn * (target - this.pan) - 2 * zeta * wn * this.vel;
      this.vel += acc * h;
      this.pan = Math.max(-1, Math.min(1, this.pan + this.vel * h));
    }
    return this.pan;
  }
  reset() { this.pan = 0; this.vel = 0; }
}
