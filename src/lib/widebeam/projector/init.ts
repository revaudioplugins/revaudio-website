/**
 * The projector page's boot (src/pages/widebeam.astro): dash-free, nothing from the old page's modules. Section 1's
 * car film, section 2's projector film and its title card, every sign-up gate on the page (the card's too), and the
 * bottom-edge lift. .wbp-booted takes the CSS failsafes off.
 */
import { initCar } from './car';
import { initFilm } from './film';
import { initSignup } from './signup';
import { initLift } from './lift';

export function initProjector(page: HTMLElement) {
  page.classList.add('wbp-booted');
  const s1 = page.querySelector<HTMLElement>('[data-wbp-s1]');
  if (s1) initCar(s1);
  const s2 = page.querySelector<HTMLElement>('[data-wbp-s2]');
  if (s2) initFilm(s2, page);
  initSignup(page);
  initLift(matchMedia('(prefers-reduced-motion: reduce)').matches, s1);
}
