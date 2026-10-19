/** /revfx page entry. */
import { initCaptures } from '../drift/capture';
import { lenis } from '../motion';
import { initHero } from './hero';
import { initPedals } from './pedals';
import { initRackPlay } from './rackplay';
import { initScenes } from './scenes';

export function initRevfx(): void {
  if (!document.querySelector('[data-rfx-page]')) return;
  initCaptures();
  const pedals = initPedals();
  initHero((i) => pedals?.goTo(i));
  initRackPlay();
  initScenes();
  initJumps();
  initSticky();
  initSep();
}

/** The seam under the hero lights once when it scrolls in (revfx.css [data-on]). */
function initSep(): void {
  const sep = document.querySelector<HTMLElement>('[data-rfx-sep]');
  if (!sep) return;
  if (!('IntersectionObserver' in window)) { sep.dataset.on = ''; return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { sep.dataset.on = ''; io.disconnect(); } }, { threshold: 1 });
  io.observe(sep);
}

/** [data-rfx-jump] links to #try: land the console, then focus its field on a mouse (no keyboard pop on touch). */
function initJumps(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-rfx-jump]').forEach((a) => a.addEventListener('click', (e) => {
    const t = a.hash ? document.querySelector<HTMLElement>(a.hash) : null;
    if (!t) return;
    e.preventDefault();
    const nav = document.querySelector<HTMLElement>('[data-site-nav]')?.offsetHeight ?? 0;
    const y = t.getBoundingClientRect().top + scrollY - nav - 16;
    if (lenis) lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo({ top: y });
    if (matchMedia('(pointer: fine)').matches) t.querySelector<HTMLInputElement>('input[type=email]')?.focus({ preventScroll: true });
  }));
}

/** Phones: the bottom bar shows once the hero form has scrolled away, and hides while #try is on screen. */
function initSticky(): void {
  const bar = document.querySelector<HTMLElement>('[data-rfx-sticky]');
  const hero = document.getElementById('rfx-trial');
  const get = document.getElementById('try');
  if (!bar || !hero || !get || !('IntersectionObserver' in window)) return;
  const seen = new Map<Element, boolean>();
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => seen.set(e.target, e.isIntersecting));
    const heroGone = !seen.get(hero) && hero.getBoundingClientRect().bottom < 0;
    const show = heroGone && !seen.get(get);
    bar.classList.toggle('is-on', show);
    bar.setAttribute('aria-hidden', String(!show));
    bar.querySelector('a')?.setAttribute('tabindex', show ? '0' : '-1');
  });
  io.observe(hero); io.observe(get);
}
