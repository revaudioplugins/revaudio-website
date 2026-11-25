/**
 * /widebeam drive-to (lane D): the one in-page mover. It scrolls the page to a target as a number for Lenis (a native
 * smooth scrollIntoView fights Lenis, and Lenis given the element adds the page's scroll-padding and reads its own scroll,
 * which runs ahead of the page while a wheel glide is still going). Callers: the hero key (lane H: driveTo('#wb-drive',
 * { align: 'face' })), the glove box cards (lane S: driveTo(dash, { align: 'face', onArrive: () => face.loadPreset(i) })).
 *
 *   align 'face': whatever the target (the #wb-drive section, the dash, the face), the FACE lands centred in the screen
 *     under the nav, measured on its layout box (the dash's rise transform never skews the maths). On a phone held
 *     upright (the deck, DECK_MQ) it lands at the top instead, 12 px under the nav, so the deck's controls show under it.
 *   align 'top': the target's top lands under the nav.
 *   duration .7 s + .1 s per 1000 px of travel, capped at 1.2 s (motion-09); instant under reduced motion.
 *   onArrive fires once, after the scroll has settled (Lenis done and the page still for 3 frames), also when the visitor
 *     takes over mid-way (the click's intent still lands where they stopped). A newer drive supersedes an older one: only
 *     the last one's onArrive fires (the last pick wins).
 * It announces itself on window as 'wb:drive' ({ phase: 'start' | 'arrive', face: boolean }), so the dash can finish its
 * rise while it is still off screen and treat the arrival as the landing (face.ts).
 */
import { lenis, reducedMotion } from '../motion';

/** The phone deck's screens (D.4, Dan's pick D7 B): under 901 px held upright the face is the live display (inert) and
 *  the deck under it holds the controls. There a drive to the face lands it at the top, so the deck shows under it. */
export const DECK_MQ = '(max-width: 900px) and (orientation: portrait)';
export const deckOn = () => !!document.querySelector('[data-wb-deck]') && matchMedia(DECK_MQ).matches;

export type DriveAlign = 'face' | 'top';
export interface DriveOptions { align?: DriveAlign; onArrive?: () => void }

let seq = 0;
let active = 0;
/** true while a drive is on its way (face.ts holds a preset glide until it arrives) */
export const isDriving = () => active !== 0;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
/** the site nav's real height: --site-nav-h (Header.astro sets it live: 58 px on an upright phone, 41 on a laptop), then
 *  the static --nav-h (44) where the header script has not run (r-dash-navh) */
export const navH = () => { const cs = getComputedStyle(document.documentElement); return parseFloat(cs.getPropertyValue('--site-nav-h')) || parseFloat(cs.getPropertyValue('--nav-h')) || 44; };
// the layout position (offsets ignore transforms; the dash rises with one)
const docTop = (el: HTMLElement) => { let y = 0; for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop; return y; };
const faceOf = (t: HTMLElement) => (t.matches('[data-wb-face]') ? t : t.querySelector<HTMLElement>('[data-wb-face]') ?? t.closest('#wb-drive')?.querySelector<HTMLElement>('[data-wb-face]') ?? null);

/** Where a drive to `target` would put the page (scrollY), and whether it shows the face. */
export function driveDestination(target: HTMLElement, align: DriveAlign = 'face') {
  const nav = navH(), face = align === 'face' ? faceOf(target) : null;
  let y: number;
  if (face && deckOn()) y = docTop(face) - nav - 12; // the face on top, the deck's readout and knobs under it
  else if (face) { const room = innerHeight - nav, h = face.offsetHeight; y = docTop(face) - nav - Math.max(0, (room - h) / 2); }
  else y = docTop(target) - nav;
  const max = document.documentElement.scrollHeight - innerHeight;
  return { y: Math.round(Math.max(0, Math.min(max, y))), face: !!face };
}

export function driveTo(target: HTMLElement | string, opts: DriveOptions = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) { opts.onArrive?.(); return; }
  const { y: dest, face } = driveDestination(el, opts.align ?? 'face');
  const id = (active = ++seq);
  const emit = (phase: 'start' | 'arrive') => window.dispatchEvent(new CustomEvent('wb:drive', { detail: { phase, face, dest } }));
  emit('start');

  const dist = Math.abs(dest - scrollY), dur = Math.min(1.2, 0.7 + 0.1 * dist / 1000);
  let completed = false;
  const instant = reducedMotion() || !lenis;
  if (instant) {
    window.scrollTo({ top: dest, behavior: 'instant' as ScrollBehavior });
    completed = true;
  } else {
    lenis!.scrollTo(dest, { duration: dur, easing: easeOutQuart, userData: { wbDrive: id }, onComplete: () => { completed = true; } });
  }

  // arrival: Lenis is done (or the visitor took over and stopped), and the page has been still for 3 frames
  const t0 = performance.now();
  let lastY = scrollY, still = 0;
  const check = () => {
    if (active !== id) return; // a newer drive owns the arrival
    const y = scrollY;
    still = Math.abs(y - lastY) < 0.5 ? still + 1 : 0;
    lastY = y;
    const ours = !instant && (lenis as any)?.userData?.wbDrive === id;
    const idle = instant || !lenis!.isScrolling;
    if (((completed || !ours) && idle && still >= 3) || performance.now() - t0 > (dur + 2.5) * 1000) {
      active = 0;
      emit('arrive');
      opts.onArrive?.();
      return;
    }
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}
