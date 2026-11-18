/** /widebeam glove box (lane S): a preset card loads into the face and the page drives back up to it; the lane drags. */
import type { Store } from './state';
import type { Face } from './face';
import { driveTo } from './drive-to';

export function initPresets(page: HTMLElement, store: Store, face: Face, dash: HTMLElement | null) {
  // ── presets: cards load into the face, the page drives back up to it ──
  page.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    face.loadPreset(Number(b.dataset.preset));
    page.querySelectorAll('[data-preset]').forEach((x) => x.classList.toggle('is-on', x === b));
    if (!dash) return;
    // the whole face lands centred under the nav, so the visitor sees the knobs glide
    driveTo(dash, { align: 'face' });
  }));
  store.on(() => { page.querySelectorAll('[data-preset]').forEach((x) => x.classList.toggle('is-on', Number((x as HTMLElement).dataset.preset) === store.preset && !store.edited)); });
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
