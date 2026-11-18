/**
 * /widebeam furniture (lane A): what stays fixed on screen. The SOUND pill has no placement script today (its click is
 * in sound.ts); the page-wide HIGH BEAM flash (.wb-flash, position: fixed) is driven here.
 */
import type { Store } from './state';

export function initFurniture(page: HTMLElement, store: Store, reduced: boolean) {
  // HIGH BEAM on: a warm flash across the whole page, like flashing the lights at a crossing
  const flash = page.querySelector<HTMLElement>('[data-wb-flash]');
  store.on((s, ch) => {
    if (flash && 'high' in ch && s.high && s.power && !reduced) {
      flash.classList.remove('is-on'); void flash.offsetWidth; flash.classList.add('is-on');
    }
  });
}
