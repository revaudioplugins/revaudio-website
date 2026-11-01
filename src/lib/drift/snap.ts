import { lenis, reducedMotion } from '../motion';

/**
 * /drift soft snap (Yoni 2026-10-15: "when I reach a section and it's all showing, fitting the screen - a small gesture
 * that snaps it - and the user can move down by swiping again").
 *
 * Proximity only, never a trap: when the scroll comes to rest with most of a section that fits the visible band (under the
 * site header, above the phone's sticky GET IT bar) in view, the page glides it to the band's centre (~0.55 s, easeOutCubic,
 * through the page's own Lenis). A section taller than the band is never snapped; far from any section nothing moves;
 * the next wheel / swipe carries on as normal. Off under reduced motion (no Lenis), while a finger or button is down,
 * while a form field has focus, and for a moment after an anchor jump (Lenis animates those itself).
 */
export function initSnap(root: HTMLElement, tries = 0): void {
  if (reducedMotion()) return;                                 // reduced motion: native scroll, no automatic movement
  if (document.documentElement.classList.contains('bench-on')) return;   // ?bench (dev): never move the page under a drag
  const l = lenis;
  // the page script can run before BaseLayout starts Lenis: wait for it (up to ~3 s)
  if (!l) { if (tries < 180) requestAnimationFrame(() => initSnap(root, tries + 1)); return; }
  // what has to fit is what you see: a section's own panel when it has one (not its top padding), else the section
  const sections = Array.from(root.querySelectorAll<HTMLElement>(':scope section, :scope .d-hero'))
    .filter((s, i, a) => a.indexOf(s) === i && !s.closest('[hidden]'))
    .map((s) => s.querySelector<HTMLElement>(':scope > .d-wrap > .d-panel') ?? s);
  if (!sections.length) return;

  const header = document.querySelector<HTMLElement>('[data-site-nav]');
  const sticky = root.querySelector<HTMLElement>('[data-drift-sticky]');
  const band = () => {
    const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    // the phone's sticky GET IT bar slides in and out as you scroll: always keep its room, or a section centred while
    // the bar is away gets its bottom covered when the bar comes back
    let bottom = window.innerHeight;
    if (sticky && getComputedStyle(sticky).display !== 'none') bottom -= sticky.offsetHeight;
    return { top, h: bottom - top };
  };

  let held = false, quietUntil = 0, timer = 0, snapping = false;
  const hold = (on: boolean) => () => { held = on; if (!on) arm(); };
  addEventListener('pointerdown', hold(true), { passive: true });
  addEventListener('pointerup', hold(false), { passive: true });
  addEventListener('pointercancel', hold(false), { passive: true });
  addEventListener('touchstart', hold(true), { passive: true });
  addEventListener('touchend', hold(false), { passive: true });
  // an in-page link jump: Lenis glides there itself, don't pull it somewhere else afterwards
  document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a[href^="#"]')) quietUntil = performance.now() + 1500; });

  function settle(): void {
    timer = 0;
    if (held || snapping || performance.now() < quietUntil) return;
    const a = document.activeElement as HTMLElement | null;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    const { top, h } = band(), y = window.scrollY;
    // the section you are mostly looking at wins (the largest share of it inside the band), not the nearest edge
    let best: number | null = null, seen = .55;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (!r.height || r.height > h + 8) continue;               // only a section that fits snaps
      const vis = Math.max(0, Math.min(r.bottom, top + h) - Math.max(r.top, top)) / r.height;
      if (vis > seen) { seen = vis; best = Math.round(y + r.top - top - (h - r.height) / 2); }   // centred in the band
    }
    if (best === null) return;
    const bd = Math.abs(best - y);
    if (bd < 3 || bd > Math.max(90, h * .4)) return;             // already there, or not close enough to pull
    snapping = true;
    l!.scrollTo(best, { duration: .55, easing: (t: number) => 1 - Math.pow(1 - t, 3), onComplete: () => { snapping = false; } });
    window.setTimeout(() => { snapping = false; }, 900);
  }
  function arm(): void {
    clearTimeout(timer);
    timer = window.setTimeout(settle, 170);                     // the scroll has come to rest
  }
  l.on('scroll', () => { if (!snapping) arm(); });
}
