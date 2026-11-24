/**
 * /widebeam soft snap (lane D, D.5; motion-17): a WIDE BEAM copy of DRIFT's (src/lib/drift/snap.ts), for the dash only.
 *
 * When the visitor's own scroll comes to rest with the face near the spot a drive lands it (driveDestination: centred
 * under the nav; on an upright phone at the top, the deck under it), the page glides the rest of the way (0.55 s,
 * easeOutCubic, through the page's Lenis), so the knobs never park half under the nav. Proximity only, never a trap, and
 * never against the visitor (tasks/lessons.md 2026-10-14):
 *  - armed only by the visitor's own scrolling (a wheel, a finger that moved, the scroll keys): never a script's scroll,
 *    a drive (driveTo owns the page while it runs), an anchor jump (quiet for 1.5 s after one);
 *  - it lands only when this gesture brought the face closer to its spot (|off| < |off + moved|), so one small step away
 *    is never pulled back, and only from near: within max(90 px, 40 % of the band) and with most of the face in view;
 *  - the face must fit the band: under the site nav, above the bottom stack (lane A's --wb-lift, the phone bar);
 *  - never while a finger or a button is down, a field has focus or a dialog (the cart) is open, and never once the
 *    visitor takes hold of something after the scroll (a press, a key on a control, the focus on a control): a glide
 *    on its way stops there. Off under reduced motion (no Lenis: native scroll, nothing moves by itself).
 */
import { lenis, reducedMotion } from '../motion';
import { driveDestination, isDriving } from './drive-to';

const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End']);

export function initSnap(face: HTMLElement, tries = 0): void {
  if (reducedMotion()) return;
  const l = lenis;
  // the page script can run before BaseLayout starts Lenis: wait for it (up to ~3 s), as DRIFT's does
  if (!l) { if (tries < 180) requestAnimationFrame(() => initSnap(face, tries + 1)); return; }

  const html = document.documentElement;
  const header = document.querySelector<HTMLElement>('[data-site-nav]');
  const band = () => {
    const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 44;
    // the bottom stack (the cookie banner or the phone bar, furniture.ts) and the bar's own room even while it is away:
    // a face centred while the bar is away would have its bottom covered when it comes back (DRIFT's rule)
    let lift = parseFloat(getComputedStyle(html).getPropertyValue('--wb-lift')) || 0;
    const bar = document.querySelector<HTMLElement>('[data-wb-bar]');
    if (bar && getComputedStyle(bar).display !== 'none') lift = Math.max(lift, bar.offsetHeight);
    return { top, h: innerHeight - lift - top };
  };

  let armed = false, mouseDown = false, fingers = 0, snapping = false, startY = 0, timer = 0, quietUntil = 0;
  const later = () => { clearTimeout(timer); timer = window.setTimeout(settle, 170); }; // the scroll has come to rest
  const begin = () => { if (!armed && !snapping) { armed = true; startY = scrollY; } };
  const arm = () => { begin(); later(); };

  function settle() {
    timer = 0;
    if (!armed || mouseDown || fingers || snapping) return; // a finger still on the glass: wait for it to lift
    if ((l as any).isScrolling === 'smooth') { later(); return; } // a smooth wheel or a flick is still gliding
    armed = false;
    if (isDriving() || performance.now() < quietUntil || document.querySelector('dialog[open]')) return;
    const a = document.activeElement as HTMLElement | null;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    const moved = scrollY - startY;
    if (Math.abs(moved) < 1) return; // the page did not move: a sideways swipe, a knob turned, Space on a button
    const { top, h } = band(), r = face.getBoundingClientRect();
    if (!r.height || r.height > h + 8) return; // only a face that fits the band
    const seen = Math.max(0, Math.min(r.bottom, top + h) - Math.max(r.top, top)) / r.height;
    if (seen < 0.55) return;
    const { y: dest } = driveDestination(face, 'face');
    const off = dest - scrollY; // how far the page still has to go
    if (Math.abs(off) < 3 || Math.abs(off) > Math.max(90, h * 0.4)) return; // already there, or not near enough to pull
    if (Math.abs(off) >= Math.abs(off + moved)) return; // this gesture took the face away from its spot: leave it
    snapping = true;
    l!.scrollTo(dest, { duration: 0.55, easing: (t: number) => 1 - Math.pow(1 - t, 3), onComplete: () => { snapping = false; } });
    window.setTimeout(() => { snapping = false; }, 900);
  }

  // held: a mouse button down, or a finger on the glass. A touch counts by its fingers, not by its pointer: the browser
  // cancels a finger's pointer the moment it starts scrolling, while the finger is still down
  const release = () => { if (!mouseDown && !fingers && armed) later(); };
  const down = (e: PointerEvent) => { if (e.pointerType !== 'touch') mouseDown = true; };
  const up = (e: PointerEvent) => { if (e.pointerType !== 'touch') { mouseDown = false; release(); } };
  const touches = (e: TouchEvent) => { fingers = e.touches.length; release(); };
  addEventListener('pointerdown', down, { passive: true });
  addEventListener('pointerup', up, { passive: true });
  addEventListener('pointercancel', up, { passive: true });
  addEventListener('touchstart', touches, { passive: true });
  addEventListener('touchend', touches, { passive: true });
  addEventListener('touchcancel', touches, { passive: true });
  // the visitor takes hold of something (a press, a key on a control, the focus landing on one): the gesture is over,
  // nothing lands after it, and a glide already on its way stops where it is (the knob never slides under the hand)
  const CONTROL = 'input, textarea, select, [contenteditable], [role="slider"], button, a[href]';
  const yieldTo = () => {
    armed = false; clearTimeout(timer);
    if (snapping) { snapping = false; l!.scrollTo(window.scrollY, { immediate: true, force: true }); }
  };
  addEventListener('pointerdown', yieldTo, { passive: true });
  addEventListener('focusin', (e) => { if ((e.target as HTMLElement)?.closest?.(CONTROL)) yieldTo(); });
  addEventListener('wheel', (e) => {
    // a wheel a control keeps for itself (a picked knob: data-lenis-prevent-wheel) is not a scroll
    if ((e.target as HTMLElement)?.closest?.('[data-lenis-prevent-wheel], [data-lenis-prevent]')) return;
    arm();
  }, { passive: true });
  addEventListener('touchmove', begin, { passive: true }); // a tap alone never snaps
  addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (SCROLL_KEYS.has(e.key) && !t?.closest(CONTROL)) arm();
    else yieldTo();
  });
  // an in-page link jump: Lenis glides there itself; don't pull it somewhere else afterwards
  document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest?.('a[href^="#"]')) { quietUntil = performance.now() + 1500; armed = false; } }, true);
  // a drive is not the visitor's gesture: whatever armed before it, it ends there
  addEventListener('wb:drive', () => { armed = false; clearTimeout(timer); });
  addEventListener('scroll', () => { if (armed && !snapping) later(); }, { passive: true });
}
