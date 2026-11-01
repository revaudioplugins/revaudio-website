/**
 * /revfx: hosts the plugin's own strip screens (src/lib/drift/fxv/screen-*.js, verbatim DRIFT = RevFX code) on any
 * canvas, at any size. Each canvas gets its OWN instance (Object.create of the registered module): the modules keep
 * their state on `this`, so a second canvas never fights the live rack's. One rAF loop for every hosted screen,
 * running only while at least one is on screen and the tab is visible. Reduced motion: one still frame per change.
 */
import geo from '../../assets/seasons/drift/rack/rack.json';

export type ScreenId = 'pitch' | 'echo' | 'reverb' | 'halo' | 'glue';
type Norm = Record<string, number>;
interface Impl { init?(cv: HTMLCanvasElement, P: P): void; draw?(t: number, P: P): void }
interface P { get(pid: string): number; on: boolean; dpr: number; w: number; h: number; phosphor: string; accent: string; ink: string; hot: string; tempoBpm: number; gluegr?: number }

const SID: Record<ScreenId, string> = { pitch: 'pitch', echo: 'dly', reverb: 'verb', halo: 'halo', glue: 'glue' };
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** what every screen shows before a page sets anything: a musical starting point (the rack's START scene) */
export const BASE: Norm = {
  PITCH_ST: 19 / 24, FORMANT_ST: 0.5, PITCH_MIX: 0.5,
  DLY_MODE: 0, DLY_DIV: 6 / 17, DLY_TIME_MS: 0.53413, DLY_FEEDBACK: 0.4, DLY_MIX: 0.4, DLY_CHAR: 0.6, DLY_PINGPONG: 1,
  VERB_TYPE: 0.5, VERB_SYNC: 1, VERB_DECAY: 0.5, VERB_BRIGHT: 0.55, VERB_PREDELAY: 0.12, SHIMMER: 0.3, VERB_MIX: 0.45,
  VERB_PRE_DIV: 12 / 17, VERB_DEC_DIV: 3 / 7,
  HALO_MODE: 1 / 3, HALO_SIZE: 0.6, HALO_TONE: 0.55, HALO_MIX: 0.6,
  GLUE_RATIO: 0, GLUE_THRESH: 0.75,
};

interface Hosted { cv: HTMLCanvasElement; id: ScreenId; P: P; impl: Impl | null; visible: boolean; norm: Norm; extra?: (t: number, P: P) => void }
const hosted: Hosted[] = [];
let modules: Promise<void> | null = null, raf = 0, io: IntersectionObserver | null = null;

const load = () => (modules ??= Promise.all([
  import('../drift/fxv/screen-pitch.js'), import('../drift/fxv/screen-dly.js'), import('../drift/fxv/screen-verb.js'),
  import('../drift/fxv/screen-halo.js'), import('../drift/fxv/screen-glue.js'),
]).then(() => undefined));

const registry = () => (window as unknown as { FXV?: { screens: Record<string, Impl> } }).FXV?.screens ?? {};

function size(h: Hosted): boolean {
  const r = h.cv.getBoundingClientRect();
  if (!r.width) return false;
  const dpr = Math.min(3, (window.devicePixelRatio || 1) * (r.width / h.P.w));
  const W = Math.round(h.P.w * dpr), H = Math.round(h.P.h * dpr);
  if (h.cv.width !== W || h.cv.height !== H || h.P.dpr !== dpr) { h.cv.width = W; h.cv.height = H; h.P.dpr = dpr; h.impl = null; }
  return true;
}

function drawOne(h: Hosted, t: number): void {
  const base = registry()[SID[h.id]];
  if (!base || !size(h)) return;
  try {
    if (!h.impl) { h.impl = Object.create(base) as Impl; h.impl.init?.(h.cv, h.P); }
    h.extra?.(t, h.P);
    h.cv.getContext('2d')!.setTransform(h.P.dpr, 0, 0, h.P.dpr, 0, 0);
    h.impl.draw?.(t, h.P);
  } catch { /* one bad frame never stops the others */ }
}

const frame = (ts: number) => {
  raf = 0;
  if (document.hidden) return;
  let any = false;
  for (const h of hosted) if (h.visible) { drawOne(h, ts / 1000); any = true; }
  if (any && !reduce()) raf = requestAnimationFrame(frame);
};
const run = () => { if (!raf) raf = requestAnimationFrame(frame); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });

export interface ScreenHandle { set(pid: string, v: number): void; setOn(on: boolean): void; norm: Norm }

/** Host a screen on `cv`. `extra` runs before each draw (e.g. to feed the GLUE needle). */
export function hostScreen(cv: HTMLCanvasElement, id: ScreenId, extra?: Hosted['extra']): ScreenHandle {
  const g = geo.strips[id];
  const norm: Norm = { ...BASE };
  const P: P = { get: (pid) => norm[pid] ?? 0, on: true, dpr: 1, w: g.screen.w, h: g.screen.h,
    phosphor: g.phos, accent: g.accent, ink: g.ink, hot: g.hot, tempoBpm: 120 };
  const h: Hosted = { cv, id, P, impl: null, visible: false, norm, extra };
  hosted.push(h);
  io ??= new IntersectionObserver((es) => {
    for (const e of es) { const x = hosted.find((k) => k.cv === e.target); if (x) x.visible = e.isIntersecting; }
    void load().then(() => { run(); if (reduce()) hosted.forEach((k) => k.visible && drawOne(k, performance.now() / 1000)); });
  }, { rootMargin: '150px 0px' });
  io.observe(cv);
  const still = () => { if (reduce() && h.visible && modules) void modules.then(() => drawOne(h, performance.now() / 1000)); };
  return {
    norm,
    set: (pid, v) => { norm[pid] = v; still(); },
    setOn: (on) => { P.on = on; still(); },
  };
}
