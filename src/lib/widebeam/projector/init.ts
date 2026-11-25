/**
 * The projector page's boot (src/pages/widebeam.astro): dash-free, nothing from the old page's modules. Section 1's
 * car film, every sign-up gate on the page, and the bottom-edge lift. .wbp-booted takes the CSS failsafes off.
 */
import { initCar } from './car';
import { initSignup } from './signup';
import { initLift } from './lift';

export function initProjector(page: HTMLElement) {
  page.classList.add('wbp-booted');
  const s1 = page.querySelector<HTMLElement>('[data-wbp-s1]');
  if (s1) initCar(s1);
  initSignup(page);
  initLift(matchMedia('(prefers-reduced-motion: reduce)').matches, s1);
}
