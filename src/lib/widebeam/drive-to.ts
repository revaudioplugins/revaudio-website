/**
 * /widebeam drive-to (lane D): scroll the page to a target as a number for Lenis. A native smooth scrollIntoView
 * fights Lenis (stopped ~70 px short), and Lenis given the element adds the page's scroll-padding and reads its own
 * scroll, which runs ahead of the page while a wheel glide is still going.
 *   align 'face' (today's preset-card maths): the whole target lands centred under the nav.
 *   align 'top': the target's top lands under the nav (no caller yet).
 */
import { lenis, DUR_ANCHOR, reducedMotion } from '../motion';

export function driveTo(target: HTMLElement, opts: { align?: 'face' | 'top'; onArrive?: () => void } = {}) {
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
  const centre = opts.align === 'top' ? 0 : Math.max(0, (innerHeight - nav - target.offsetHeight) / 2);
  const top = target.getBoundingClientRect().top + scrollY - nav - centre;
  if (lenis) lenis.scrollTo(top, opts.onArrive ? { duration: DUR_ANCHOR, onComplete: opts.onArrive } : { duration: DUR_ANCHOR });
  else { window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' }); opts.onArrive?.(); }
}
