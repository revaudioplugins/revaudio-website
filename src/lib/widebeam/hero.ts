/**
 * /widebeam hero (lane H): the intro video (intro.ts), its last frame as the road with the departing tail lights
 * (night.ts), the wordmark that opens with WIDTH, the reveal of the title, and the lift as the page scrolls away.
 * Skip / Replay are wired inside intro.ts.
 */
import { gsap } from '../motion';
import type { Store } from './state';
import { startNight } from './night';
import { initIntro } from './intro';

export function initHero(page: HTMLElement, store: Store, reduced: boolean) {
  // ── hero: the intro video, its last frame as the road, the wordmark that opens with WIDTH ──
  const hero = page.querySelector<HTMLElement>('.wb-hero')!;
  const nightEl = page.querySelector<HTMLCanvasElement>('[data-wb-night]');
  const night = nightEl ? startNight(nightEl) : null;
  const mark = page.querySelector<HTMLElement>('[data-wb-mark]');
  const setMark = () => { const s = store.get(); page.style.setProperty('--wb-w', String(s.power ? (s.mono ? 0 : s.width / 200) : 0)); };
  store.on(setMark); setMark();
  initIntro(hero, {
    reveal(instant) {
      hero.classList.add('is-shown');
      if (!mark || reduced) return;
      // the letters come out of the dark one by one, as if the beams found them
      const d = instant ? 0.35 : 0;
      gsap.fromTo(mark.querySelectorAll('i'), { opacity: 0, filter: 'blur(10px)', y: 18 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: d });
      gsap.fromTo(page.querySelectorAll('[data-wb-hero-in]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: d + 0.65 });
    },
    handoff() {
      // the video's last frame: the coupe's tail lights at (969, 697), 54 px apart, on a 1920×1080 frame
      night?.tailLights(969, 697, 54);
    },
  });
  if (!reduced) {
    // scrolling away lifts the title off the road
    gsap.to(page.querySelector('[data-wb-hero-inner]'), { scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }, y: 120, opacity: 0.1, ease: 'none' });
  }
}
