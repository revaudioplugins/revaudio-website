/**
 * /widebeam boot (lane F): one shared state (state.ts), then each section's module in the page's order. It owns
 * nothing else but the scroll reveals and the final ScrollTrigger refresh.
 *   hero.ts      the intro film (intro.ts), the road and its tail lights (night.ts), the wordmark, Skip / Replay
 *   face.ts      the living face and the dash's rise           sound.ts    the engine, the SOUND pill, the mirror
 *   keys.ts      the letter keys                              furniture.ts the fixed layer (the HIGH BEAM flash)
 *   story.ts     the stereo road                              presets.ts  the glove box cards (drive-to.ts)
 *   odometer.ts  the spec numbers                             capture.ts  the two sign-up forms + BUY NOW's note
 */
import { ScrollTrigger, reducedMotion } from '../motion';
import { createStore } from './state';
import { initFace, type FaceArt } from './face';
import { initHero } from './hero';
import { initSound } from './sound';
import { initKeys } from './keys';
import { initFurniture } from './furniture';
import { initStory } from './story';
import { initPresets } from './presets';
import { initOdometer } from './odometer';
import { initCapture } from './capture';

export function initWideBeam(art: FaceArt) {
  const page = document.querySelector<HTMLElement>('[data-wb-page]');
  if (!page) return;
  const store = createStore();
  const reduced = reducedMotion();

  initHero(page, store, reduced);
  const { face, ignite, dash } = initFace(page, art, store, reduced);
  initSound(page, store, face, ignite);
  initKeys(store, face);
  initFurniture(page, store, reduced);

  // ── story ──
  const story = page.querySelector<HTMLElement>('[data-wb-story]');
  if (story) initStory(story);

  initPresets(page, store, face, dash);
  initOdometer(page, reduced);

  // ── reveals ──
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  page.querySelectorAll('[data-wb-reveal]').forEach((el) => io.observe(el));

  initCapture(page);

  ScrollTrigger.refresh();
}
