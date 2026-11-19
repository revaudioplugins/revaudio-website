/**
 * /widebeam hero (lane H): the intro film (intro.ts), its last frame as the road with the departing tail lights
 * (night.ts), the wordmark that opens with WIDTH, the reveal of the readings, and the fade as the page scrolls away.
 * Skip / Replay are wired inside intro.ts. The hero key ("Take it for a drive", or the small link beside the trial key
 * once the trial opens) drives the page to the dash with lane D's driveTo, the only mover: Lenis's own anchor jump is
 * stopped at the key, and lane D's sound.ts still hears the click on the key itself ([data-wb-start]).
 */
import { gsap } from '../motion';
import type { Store } from './state';
import { startNight } from './night';
import { initIntro } from './intro';
import { driveTo } from './drive-to';

// the master's last frame: the coupe's two tail-light bars centred at x 969, y 699, 52 px apart (1920x1080; measured
// on the frame and checked on screen against the film, lampalign.cjs in the lane H report)
const TAIL = { x: 969, y: 699, sep: 52 };

export function initHero(page: HTMLElement, store: Store, reduced: boolean) {
  const hero = page.querySelector<HTMLElement>('.wb-hero')!;
  const nightEl = page.querySelector<HTMLCanvasElement>('[data-wb-night]');
  const night = nightEl ? startNight(nightEl) : null;
  const mark = page.querySelector<HTMLElement>('[data-wb-mark]');
  const setMark = () => { const s = store.get(); page.style.setProperty('--wb-w', String(s.power ? (s.mono ? 0 : s.width / 200) : 0)); };
  store.on(setMark); setMark();

  const hooks = {
    reveal(instant: boolean) {
      hero.classList.add('is-shown');
      if (!mark || reduced) return;
      // the letters come out of the dark one by one, as if the beams found them. The plate shadow and the WIDTH glow
      // live on the row (hero.css), so the letters' own filter is cleared when they land (hero-01).
      const d = instant ? 0.35 : 0;
      gsap.fromTo(mark.querySelectorAll('i'), { opacity: 0, filter: 'blur(10px)', y: 18 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: d, clearProps: 'filter,transform,opacity' });
      gsap.fromTo(page.querySelectorAll('[data-wb-hero-in]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: d + 0.65, clearProps: 'transform,opacity' });
    },
    handoff(frame: [number, number, number, number]) {
      night?.tailLights(TAIL.x, TAIL.y, TAIL.sep, frame);
    },
  };
  try {
    initIntro(hero, hooks);
  } catch (err) {
    // the intro must never keep the name away: show it as it is and let the error surface
    hero.classList.add('is-shown');
    hero.querySelector('[data-wb-intro]')?.classList.add('is-gone');
    console.error(err);
  }

  // the hero key: one mover to the dash (lane D's driveTo lands the face). A modified click keeps the browser's own.
  hero.querySelectorAll<HTMLAnchorElement>('[data-wb-drive-key]').forEach((key) => key.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const dash = document.getElementById('wb-drive');
    if (!dash) return;
    e.preventDefault();
    e.stopPropagation(); // Lenis's anchor jump listens on window: one mover
    driveTo(dash, { align: 'face' });
  }));

  if (!reduced) {
    // scrolling away dims the readings; text never moves with the scroll (motion-14)
    gsap.to(page.querySelector('[data-wb-hero-inner]'), { scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }, opacity: 0.1, ease: 'none' });
  }
}
