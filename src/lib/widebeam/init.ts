/**
 * /widebeam boot (lane F, final): one shared state (state.ts), then one init per module, in the page's order.
 *
 * THIS FILE DOESN'T CHANGE AFTER LANE F. A lane that needs a new module calls it from a module it already owns (its
 * own init), never from here. Scroll reveals are the house's (data-reveal="fade", src/lib/reveal.ts, booted by
 * BaseLayout), so nothing here hides or shows content.
 *   hero.ts      the intro film (intro.ts), the road and its tail lights (night.ts), the wordmark, Skip / Replay (H)
 *   face.ts      the living face and the dash's rise (D)        sound.ts     the engine, the SOUND pill, the mirror (D)
 *   keys.ts      the letter keys + the HIGH BEAM flash (D)      furniture.ts the fixed layer: SOUND key, phone bar (A)
 *   presets.ts   the glove box cards (drive-to.ts) (S)          story.ts     the stereo road (S)
 *   manual.ts    the Owner's Manual (S)                         odometer.ts  the spec numbers (A)
 *   capture.ts   the one ask: the plate + the closer (A)
 * Stage 4 (base fixer) added one boot step here: nearArt(), the parts kit's below-the-fold art on approach.
 */
import { ScrollTrigger, reducedMotion } from '../motion';
import { createStore } from './state';
import { initFace, showDeferred, type FaceArt } from './face';
import { initHero } from './hero';
import { initSound } from './sound';
import { initKeys } from './keys';
import { initFurniture } from './furniture';
import { initStory } from './story';
import { initPresets } from './presets';
import { initManual } from './manual';
import { initOdometer } from './odometer';
import { initCapture } from './capture';

export function initWideBeam(art: FaceArt) {
  const page = document.querySelector<HTMLElement>('[data-wb-page]');
  if (!page) return;
  nearArt();
  const store = createStore();
  const reduced = reducedMotion();

  initHero(page, store, reduced);
  const { face, ignite, dash } = initFace(page, art, store, reduced);
  initSound(page, store, face, ignite);
  initKeys(page, store, face, reduced);
  initFurniture(page, store, reduced);
  initPresets(page, store, face, dash);
  const story = page.querySelector<HTMLElement>('[data-wb-story]');
  if (story) initStory(story);
  initManual(page);
  initOdometer(page, reduced);
  initCapture(page);

  ScrollTrigger.refresh();
}

/** The parts kit's below-the-fold art (parts.css, r-base-foldart) loads 3/4 of a screen ahead of the reader, not on first
 *  view: each part (and any [data-wb-defer] element) gets [data-wb-near] once it comes within 3/4 of a screen. First, so an
 *  error in a later module can't leave the parts bare. A deferred <img> gets its data-src / data-srcset at the same moment
 *  (face.ts showDeferred; the face's art loader also calls it first, which can come sooner).
 *  3/4, not a full screen: at 1440x900 and 1728x1000 a full screen reached the face-still and the dash's road at load
 *  (1742 / 1767 px down at 1440), which put the first view at 1.95 MB over G11's 1.9 MB bar. */
function nearArt() {
  const els = document.querySelectorAll('.wb-part-lamp-l, .wb-part-lamp-r, .wb-part-road, .wb-part-meter, .wb-part-cap, [data-wb-defer]');
  const near = (el: Element) => {
    el.setAttribute('data-wb-near', '');
    showDeferred(el); // a deferred <img> (the dash's face-still) carries its sources as data-srcset / data-src until now
  };
  if (!('IntersectionObserver' in window)) { els.forEach(near); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { near(e.target); io.unobserve(e.target); } }), { rootMargin: '75% 0px' });
  els.forEach((el) => io.observe(el));
}
