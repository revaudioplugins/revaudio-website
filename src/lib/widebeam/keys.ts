/**
 * /widebeam letter keys (lane D): H high beam, M mono, S side, P power, [ ] presets, and the HIGH BEAM page flash
 * (WbFlash.astro, CSS at the end of drive.css).
 *
 * The keys act only while focus is inside the dash (#wb-drive: the face and the console), never from the hero, the story
 * or a form (WCAG 2.1.4, demo-01, a11y-03): a field, an iframe, a video and the Owner's Manual keep their own keys
 * (video-04), a held key does not repeat, and every change is announced by the face (face.ts, from what changed).
 * The flash fires at most once a second (WCAG 2.3.1, motion-02, a11y-04), never under reduced motion or the site's high
 * contrast, and sits on its own layer from load (will-change, motion-15).
 */
import type { Store } from './state';
import type { Face } from './face';

export function initKeys(page: HTMLElement, store: Store, face: Face, reduced: boolean) {
  const drive = page.querySelector<HTMLElement>('#wb-drive');
  drive?.addEventListener('keydown', (e) => {
    if (e.repeat || e.metaKey || e.defaultPrevented) return;
    // [ and ] need Option (a German, French, Nordic or Swiss Mac) or AltGr (= Ctrl + Alt on Windows) on many layouts: those
    // still step the presets; a plain Ctrl or Alt chord is the browser's or the system's (r-dash-altkeys)
    const bracket = e.key === '[' || e.key === ']';
    if (bracket ? e.ctrlKey && !e.altKey : e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    // (a range takes no letters: the phone deck's knobs and VOLUME are dash controls like the face's)
    if (t.closest('input:not([type=range]), textarea, select, [contenteditable], iframe, video, [data-wb-manual]')) return;
    const s = store.get();
    const act: Record<string, () => void> = {
      h: () => store.set({ high: !s.high }, 'key'), m: () => store.set({ mono: !s.mono }, 'key'),
      s: () => store.set({ side: !s.side }, 'key'), p: () => store.set({ power: !s.power }, 'key'),
      ']': () => face.stepPreset(1), '[': () => face.stepPreset(-1),
    };
    const f = act[e.key.toLowerCase()];
    if (f) { e.preventDefault(); f(); }
  });

  // HIGH BEAM on: a warm flash across the whole page, like flashing the lights at a crossing. Once a second at most.
  const flash = page.querySelector<HTMLElement>('[data-wb-flash]');
  let last = -1e9;
  store.on((s, ch) => {
    if (!flash || !('high' in ch) || !s.high || !s.power) return;
    if (reduced || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('hc')) return;
    const now = performance.now();
    if (now - last < 1000) return;
    last = now;
    flash.classList.remove('is-on'); void flash.offsetWidth; flash.classList.add('is-on');
  });
}
