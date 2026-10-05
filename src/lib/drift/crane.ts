import { lenis } from '../motion';   // the house scroller (null under reduced motion)

/**
 * THE FX CRANE (Dan 10-04, pick A: "when you scroll it pulls down the fx panel exactly like drift, same sizes and
 * everything"). Laptop only (>= 1001 px wide): #drive and #fx go into one sticky stage (.d-crane > .d-crane-stage,
 * drift.css SECTION 3), stacked in ONE grid cell, so the taller panel sets one box for both. Scrolling into the
 * stage pins it under the nav for one window height of scroll:
 *   DWELL  a beat on the #drive panel; the FX panel still up on the hook (hidden, inert);
 *   DROP   the winch: the descent tracks the scroll on the plugin's WINCH curve (pays out, then brakes long);
 *   HOLD   the FX panel sits on the #drive box (the covered #drive panel hidden + inert, its car parked);
 * then both leave together and the keep-it TV follows. Scrolling back up lifts it the same way.
 * The motion is the plugin's FX-bay crane (Drift Source/ui/public/index.html, "H2:BEGIN view-js", 4.30.0), its
 * clock swapped for the scroll: the panel hangs from a hook 480 stage px above its top centre (stage px scale by
 * the panel's width against the plugin's 1725 px stage) and starts just hidden behind the nav (the plugin starts a
 * window height up: on a scroll that out-of-sight travel was dead scroll, ~1 s of a stuck page on a slow trackpad,
 * Dan 10-05 "go"). At scroll u of the drop it holds the plugin's pose at t = 440u ms: the winch height plus the
 * damped pendulum sway (in tilted, swinging back as it brakes). The brake's last ~1% (7-12 px) runs on the plugin's own clock:
 * it touches down and settles (t -> 700 ms) by itself. Scrolling back up rewinds the drop; the hook first takes up
 * the slack (the plugin's OUT ease, 120 ms) out of the landed pose. A jump (the #fx anchor, a restore) is the
 * plugin's cut: no motion.
 * Rest = transform-free: landed = no inline transform at all. Reduced motion: no crane, no pin, #fx simply
 * follows #drive (the keep-it TV after it). <= 1000 px: the page as served, never touched. No JS: the served order.
 */
const LAPTOP = '(min-width: 1001px)';
const REDUCE = '(prefers-reduced-motion: reduce)';

/* the plugin's crane, in its own units (stage px, ms, degrees) */
const STAGE_W = 1725;   // the FX view's stage width
const HOOK = 480;       // the hook, above the rack's top centre
const AIR = 40;         // while up on the hook it hangs this far above the window
const WINCH = bezier(.42, 0, .18, 1);   // pays out from rest, then brakes long
const OUT = bezier(.55, 0, .84, .25);   // the plugin's lift ease
const swayIn = (t: number) => 1.25 * Math.sin(2 * Math.PI * t / 520) * Math.exp(-t / 250) * (1 - clamp01((t - 560) / 140));
/** the plugin's IN pose at its time t: the winch height (y0 = the start, px) + the sway (deg); landed from 440, still at 700 */
const pose = (t: number, y0: number) => ({ ty: t < 440 ? y0 * (1 - WINCH(t / 440)) : 0, rot: t < 700 ? swayIn(t) : 0 });

/* the scroll map: fractions of the pin, which is PIN window heights of scroll */
const PIN = 1;
const DWELL = .04, DROP = .65;  // a short beat on #drive; the rest (.31) holds the landed FX panel before both leave
const LAND_AT = .85;            // the touchdown: the rest of the brake (7-12 px) plays on the plugin's clock
const LIFT_AT = .8;             // a landed panel stays down until the scroll backs this far (no flutter at the line)
const SLACK = 120;              // ms: the lift out of the landed pose (the plugin's OUT takes ~120 ms to raise it 22 px)
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
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  const box = document.createElement('div');
  const stage = document.createElement('div');
  box.className = 'd-crane';
  stage.className = 'd-crane-stage';
  box.append(stage);
  drive.before(box);
  stage.append(drive, fx);

  // px: the box's document top, its top pad, the pinned panel's top under the nav, the pin, the stage (= panel) box
  let top0 = 0, pad = 0, T = 0, P = 1, H = 0, W = 0, navB = 0;   // navB = the nav's bottom edge
  const measure = () => {
    navB = nav ? nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0) : 0;
    const vh = innerHeight;
    H = stage.offsetHeight; W = panel.offsetWidth;
    pad = parseFloat(getComputedStyle(box).paddingTop) || 0;
    T = Math.round(navB + Math.max(GAP, (vh - navB - H) / 2));   // centred in the room under the nav
    P = Math.round(vh * PIN);
    box.style.setProperty('--crane-top', `${T}px`);
    box.style.setProperty('--crane-pin', `${P}px`);
    panel.style.transformOrigin = `50% ${(-HOOK * W / STAGE_W).toFixed(1)}px`;   // the hook
    top0 = box.getBoundingClientRect().top + scrollY;
  };

  let raf = 0, u0 = -1, down = false, state = '', tf0: string | null = null, wc0: string | null = null;
  let land0 = -1, landT = 0;                    // the touchdown: when (ms), from which plugin time
  let slack0 = -1, slackTy = 0, slackRot = 0;   // the lift: when (ms), the offset it eases out of
  let ty = 0, rot = 0;                          // the pose on screen
  const frame = (now = performance.now()) => {
    raf = 0;
    const x = scrollY - (top0 + pad - T);                     // px scrolled into the pin
    const u = clamp01((clamp01(x / P) - DWELL) / DROP);       // the drop: 0 up on the hook .. 1 down
    const cut = u0 < 0 || Math.abs(u - u0) >= .5;
    const y0 = navB - T - H;                                  // the drop starts with the panel's bottom edge at the nav's
    const scrub = pose(440 * u, y0);
    if (!down && u >= LAND_AT) { down = true; land0 = cut ? -1 : now; landT = 440 * u; }
    else if (down && u < LIFT_AT) {
      down = false; land0 = -1;
      if (!cut) { slack0 = now; slackTy = ty - scrub.ty; slackRot = rot - scrub.rot; }
    }
    if (cut) slack0 = -1;
    u0 = u;

    let live = false;   // a part of the motion still runs on its own clock
    let base = { ty: 0, rot: 0 };
    if (down) {
      if (land0 >= 0 && landT + now - land0 < 700) { base = pose(landT + now - land0, y0); live = true; }
    } else if (u > 0) base = scrub;
    // up: it hangs just above the window (the stage's top is its pinned top once stuck), far up while the stage is far
    else base.ty = Math.min(y0, -(Math.max(T, top0 + pad - scrollY) + H + (x < -innerHeight ? FAR : AIR * W / STAGE_W)));
    ty = base.ty; rot = base.rot;
    if (slack0 >= 0) {
      const k = (now - slack0) / SLACK;
      if (k < 1) { const e = 1 - OUT(k); ty += slackTy * e; rot += slackRot * e; live = true; }
      else slack0 = -1;
    }

    const st = down ? 'down' : u > 0 ? 'drop' : 'up';
    if (st !== state) {
      fx.toggleAttribute('inert', st !== 'down');
      drive.toggleAttribute('inert', st === 'down');
      fx.style.visibility = st === 'up' ? 'hidden' : '';
      drive.style.visibility = st === 'down' ? 'hidden' : '';   // covered: no double shadow, no paint under the FX panel
      if ((st === 'down') !== (state === 'down')) drive.dispatchEvent(new CustomEvent<boolean>('drift:covered', { detail: st === 'down' }));
      state = st;
    }
    const rest = !live && (down || u === 0);
    const tf = down && !live ? '' : `translate(0px, ${ty.toFixed(2)}px) rotate(${rot.toFixed(4)}deg)`;
    if (tf !== tf0) { panel.style.transform = tf; tf0 = tf; }
    const wc = rest ? '' : 'transform';   // a layer only while it moves: at rest the text rasterises crisp
    if (wc !== wc0) { panel.style.willChange = wc; wc0 = wc; }
    if (live) raf = requestAnimationFrame(frame);
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
    /** /drift/#fx: the middle of the hold, landed, with no swing (the plugin's cut) */
    land() {
      measure();
      const y = Math.round(top0 + pad - T + (DWELL + DROP + (1 - DWELL - DROP) / 2) * P);
      u0 = -1;
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else scrollTo(0, y);
      frame();
    },
    destroy() {
      removeEventListener('scroll', kick);
      removeEventListener('resize', onResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      panel.style.transform = panel.style.willChange = panel.style.transformOrigin = '';
      fx.removeAttribute('inert'); drive.removeAttribute('inert');
      fx.style.visibility = drive.style.visibility = '';
      if (state === 'down') drive.dispatchEvent(new CustomEvent<boolean>('drift:covered', { detail: false }));
      box.replaceWith(drive);   // #drive back in the drive zone; initCrane places #fx
    },
  };
}

function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x; }

/** CSS cubic-bezier as a function of x (the plugin's own solver: Newton on x(t)) */
function bezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const cx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t - x;
      const dx = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(cx) < 1e-6 || dx === 0) break;
      t = Math.min(1, Math.max(0, t - cx / dx));
    }
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  };
}
