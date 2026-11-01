import { lenis } from '../motion';   // the house scroller (null under reduced motion)

/**
 * THE FX CRANE (Dan 10-04, pick A: "when you scroll it pulls down the fx panel exactly like drift"; softened on Yoni's
 * word 10-19: "a bit intrusive and aggressive - make it more gentle and elegant"). Laptop only (>= 1001 px wide):
 * #drive and #fx go into one sticky stage (.d-crane > .d-crane-stage, drift.css SECTION 3), stacked in ONE grid cell,
 * so the taller panel sets one box for both. Scrolling into the stage pins it under the nav for one window height:
 *   DWELL  a beat on the #drive panel; the FX panel hidden (inert);
 *   GLIDE  the FX panel eases down a short way onto the #drive box (~100 px, not its whole height), fading in and
 *          settling from a hair under full size while the #drive panel dissolves out; scrubbed by the scroll on a
 *          sine ease, no swing, no brake;
 *   HOLD   the FX panel sits on the #drive box (the covered #drive panel hidden + inert, its car parked);
 * then both leave together and the keep-it TV follows. Scrolling back up rewinds the glide. A jump (the #fx anchor, a
 * restore) is a cut: no motion. (The 10-04 winch drop + pendulum sway: git history before 10-19.)
 * Rest = transform-free: landed = no inline transform or opacity. Reduced motion: no crane, no pin, #fx simply
 * follows #drive (the keep-it TV after it). <= 1000 px: the page as served, never touched. No JS: the served order.
 */
const LAPTOP = '(min-width: 1001px)';
const REDUCE = '(prefers-reduced-motion: reduce)';

/* the glide */
const TRAVEL = .16, TRAVEL_MIN = 56, TRAVEL_MAX = 132;   // the descent: a sixth of the panel's height, 56-132 px
const SCALE0 = .985;                                     // it settles from 98.5 % to full size
const OUT0 = 0, OUT1 = .45, IN0 = .2, IN1 = .65;          // #drive dissolves out over 0-45 % of the glide, FX in over 20-65 %
const glide = (u: number) => (1 - Math.cos(Math.PI * u)) / 2;            // easeInOutSine: no lurch, no brake
const fade = (u: number, a: number, b: number) => { const k = clamp01((u - a) / (b - a)); return k * k * (3 - 2 * k); };   // smoothstep

/* the scroll map: fractions of the pin, which is PIN window heights of scroll */
const PIN = 1;
const DWELL = .06, DROP = .7;   // a beat on #drive; the rest (.24) holds the landed FX panel before both leave
const AIR = 40;                 // while hidden it hangs this far above the window
const GAP = 8;                  // min air between the nav and the pinned panel
const FAR = 600;                // hang air while the stage is over a screen away: outside init.ts's 500 px image look-ahead

type Mode = 'page' | 'flow' | 'crane';

export function initCrane(root: HTMLElement): void {
  const drive = root.querySelector<HTMLElement>('#drive');
  const fx = root.querySelector<HTMLElement>('#fx');
  if (!drive || !fx) return;
  const laptop = matchMedia(LAPTOP), reduce = matchMedia(REDUCE);
  let home: Comment | null = null;   // #fx's served place (after the keep-it TV): phones never get this marker
  let mode: Mode = 'page';
  let scene: ReturnType<typeof crane> | null = null;

  const apply = () => {
    const next: Mode = !laptop.matches ? 'page' : reduce.matches ? 'flow' : 'crane';
    if (next === mode) return;
    scene?.destroy(); scene = null;
    if (!home) { home = document.createComment(' #fx: served place '); fx.before(home); }
    if (next === 'page') home.after(fx);
    else if (next === 'flow') drive.after(fx);   // in the drive zone, as the crane: the rails' tail still falls on the keep-it TV
    else scene = crane(drive, fx);
    mode = next;
  };
  laptop.addEventListener('change', apply);
  reduce.addEventListener('change', apply);
  apply();

  // /drift/#fx: the served page put #fx after the keep-it TV, so the browser's own jump (now, or again at load) is off
  const toFx = () => {
    if (location.hash !== '#fx') return;
    if (scene) scene.land();
    else if (mode === 'flow') fx.scrollIntoView({ block: 'start' });
  };
  addEventListener('hashchange', toFx);
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (location.hash === '#fx' && mode !== 'page' && nav?.type !== 'reload' && nav?.type !== 'back_forward') {
    let touched = false;
    const touch = () => { touched = true; };
    for (const t of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(t, touch, { once: true, passive: true, capture: true });
    const again = () => { if (!touched) toFx(); };
    toFx();
    requestAnimationFrame(again);
    if (document.readyState !== 'complete') addEventListener('load', () => requestAnimationFrame(again), { once: true });
  }
}

function crane(drive: HTMLElement, fx: HTMLElement) {
  const panel = fx.querySelector<HTMLElement>('.d-fx-panel')!;
  const drivePanel = drive.querySelector<HTMLElement>(':scope > .d-wrap > .d-panel') ?? drive;
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  const box = document.createElement('div');
  const stage = document.createElement('div');
  box.className = 'd-crane';
  stage.className = 'd-crane-stage';
  box.append(stage);
  drive.before(box);
  stage.append(drive, fx);

  // px: the box's document top, its top pad, the pinned panel's top under the nav, the pin, the stage (= panel) box
  let top0 = 0, pad = 0, T = 0, P = 1, H = 0, navB = 0;   // navB = the nav's bottom edge
  const measure = () => {
    navB = nav ? nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0) : 0;
    const vh = innerHeight;
    H = stage.offsetHeight;
    pad = parseFloat(getComputedStyle(box).paddingTop) || 0;
    T = Math.round(navB + Math.max(GAP, (vh - navB - H) / 2));   // centred in the room under the nav
    P = Math.round(vh * PIN);
    box.style.setProperty('--crane-top', `${T}px`);
    box.style.setProperty('--crane-pin', `${P}px`);
    panel.style.transformOrigin = '50% 0';
    top0 = box.getBoundingClientRect().top + scrollY;
  };

  let raf = 0, state = '', tf0: string | null = null, op0: string | null = null, dop0: string | null = null, wc0: string | null = null;
  const frame = () => {
    raf = 0;
    const x = scrollY - (top0 + pad - T);                     // px scrolled into the pin
    const u = clamp01((clamp01(x / P) - DWELL) / DROP);       // the glide: 0 hidden .. 1 landed
    const st = u >= 1 ? 'down' : u > 0 ? 'drop' : 'up';
    if (st !== state) {
      fx.toggleAttribute('inert', st !== 'down');
      drive.toggleAttribute('inert', st === 'down');
      fx.style.visibility = st === 'up' ? 'hidden' : '';
      drive.style.visibility = st === 'down' ? 'hidden' : '';   // covered: no double shadow, no paint under the FX panel
      if ((st === 'down') !== (state === 'down')) drive.dispatchEvent(new CustomEvent<boolean>('drift:covered', { detail: st === 'down' }));
      state = st;
    }
    let tf = '', op = '', dop = '';
    if (st === 'drop') {
      const e = glide(u), travel = Math.min(TRAVEL_MAX, Math.max(TRAVEL_MIN, H * TRAVEL));
      tf = `translate(0px, ${(-travel * (1 - e)).toFixed(2)}px) scale(${(SCALE0 + (1 - SCALE0) * e).toFixed(4)})`;
      op = fade(u, IN0, IN1).toFixed(3);
      dop = (1 - fade(u, OUT0, OUT1)).toFixed(3);   // staggered: the two panels never read at full strength together
    } else if (st === 'up') {
      // hidden: it hangs just above the window (the stage's top is its pinned top once stuck), far up while the stage is far
      tf = `translate(0px, ${(-(Math.max(T, top0 + pad - scrollY) + H + (x < -innerHeight ? FAR : AIR))).toFixed(2)}px)`;
    }
    if (tf !== tf0) { panel.style.transform = tf; tf0 = tf; }
    if (op !== op0) { panel.style.opacity = op; op0 = op; }
    if (dop !== dop0) { drivePanel.style.opacity = dop; dop0 = dop; }
    const wc = st === 'drop' ? 'transform, opacity' : '';   // a layer only while it moves: at rest the text rasterises crisp
    if (wc !== wc0) { panel.style.willChange = wc; wc0 = wc; }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const onResize = () => { measure(); kick(); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(stage);
  ro.observe(document.body);   // anything above the crane changing height moves its pin
  measure();
  frame();

  return {
    /** /drift/#fx: the middle of the hold, landed (a cut) */
    land() {
      measure();
      const y = Math.round(top0 + pad - T + (DWELL + DROP + (1 - DWELL - DROP) / 2) * P);
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else scrollTo(0, y);
      frame();
    },
    destroy() {
      removeEventListener('scroll', kick);
      removeEventListener('resize', onResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      panel.style.transform = panel.style.opacity = panel.style.willChange = panel.style.transformOrigin = drivePanel.style.opacity = '';
      fx.removeAttribute('inert'); drive.removeAttribute('inert');
      fx.style.visibility = drive.style.visibility = '';
      if (state === 'down') drive.dispatchEvent(new CustomEvent<boolean>('drift:covered', { detail: false }));
      box.replaceWith(drive);   // #drive back in the drive zone; initCrane places #fx
    },
  };
}

function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x; }

