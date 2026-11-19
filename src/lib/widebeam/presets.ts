/**
 * /widebeam glove box (lane S): a card drives the page up to the dash (driveTo, align 'face') and loads its preset on
 * arrival, so the visitor sees the knobs glide (motion-09; lane D owns when onArrive fires and the glide itself). Then
 * focus moves to the face's preset control without a scroll, so Tab carries on at the dash (a11y-08). The cards'
 * is-on / aria-pressed mirror the store, so the console's PRESET ‹ › and the face's own ‹ › keep them right too.
 * The lane drags sideways with a mouse; touch scrolls it natively.
 */
import type { Store } from './state';
import type { Face } from './face';
import { driveTo } from './drive-to';

// after a preset load, the face's preset control takes focus (the face's glide runs ~0.5 s; focus after it, so a screen
// reader hears the new name in its place). [data-wb-preset-focus] is the hook asked of lane D; "Next preset" today.
const GLIDE_MS = 600;

export function initPresets(page: HTMLElement, store: Store, face: Face, dash: HTMLElement | null) {
  const cards = [...page.querySelectorAll<HTMLButtonElement>('[data-preset]')];
  const sync = () => cards.forEach((x) => {
    const on = Number(x.dataset.preset) === store.preset && !store.edited;
    x.classList.toggle('is-on', on);
    x.setAttribute('aria-pressed', String(on));
  });
  store.on(sync);
  sync();
  // a preset whose values equal the current ones (Default -> Factory Cruise) changes no knob, so the store says nothing;
  // the face repaints its preset LCD on every load, so that repaint also re-syncs the cards (lane D: an emit on a preset
  // change would make this unneeded)
  const lcd = face.root.querySelector('.wb-lcd--preset');
  if (lcd) new MutationObserver(sync).observe(lcd, { childList: true, characterData: true, subtree: true });

  const presetControl = () =>
    page.querySelector<HTMLElement>('[data-wb-preset-focus]') ?? face.root.querySelector<HTMLElement>('[aria-label="Next preset"]');

  // one pick at a time: the last click wins; if the arrival never comes (a visitor wheels mid-glide and Lenis drops its
  // onComplete), the preset still loads after the longest drive (1.2 s) and a margin
  let want = -1, fallback = 0;
  const load = (i: number) => {
    if (want !== i) return;
    want = -1; clearTimeout(fallback);
    face.loadPreset(i);
    setTimeout(() => presetControl()?.focus({ preventScroll: true }), GLIDE_MS);
  };
  cards.forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.preset);
    want = i;
    clearTimeout(fallback);
    if (!dash) { load(i); return; }
    fallback = window.setTimeout(() => load(i), 1600);
    driveTo(dash, { align: 'face', onArrive: () => load(i) });
  }));

  const lane = page.querySelector<HTMLElement>('[data-wb-lane]');
  if (lane) {
    // drag the lane sideways with a mouse; touch scrolls natively
    let x0 = 0, s0 = 0, down = false, moved = false;
    lane.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = lane.scrollLeft; });
    window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; lane.classList.add('is-grab'); } lane.scrollLeft = s0 - dx; });
    window.addEventListener('pointerup', () => { down = false; lane.classList.remove('is-grab'); });
    lane.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }
}
