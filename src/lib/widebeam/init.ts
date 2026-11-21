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
 * Stage 4 (base fixer): the boot marks the page .wb-booted first, which takes off the CSS failsafe that shows the house
 * reveal's blocks at 9 s when this script never runs (base.css, r-cross-revealstuck). The parts kit's below-the-fold art
 * on approach (nearArt) moved out of this chunk into an inline script at the end of the page (widebeam.astro,
 * r-base-artbare), so a late or failed chunk can't leave the dash bare.
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
import { initManual } from './manual';
import { initOdometer } from './odometer';
import { initCapture } from './capture';

export function initWideBeam(art: FaceArt) {
  const page = document.querySelector<HTMLElement>('[data-wb-page]');
  if (!page) return;
  // first: the house reveal is in this same chunk, so from here on it, not the 9 s failsafe, shows the blocks
  page.classList.add('wb-booted');
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
