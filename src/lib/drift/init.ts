import { initPanDisplays } from './bus';
import { initWheel } from './wheel';
import { initTracks } from './trackui';
import { initCaptures } from './capture';
import { lenis } from '../motion';    // the house scroller (null under reduced motion)
import type { Slot } from './demo';   // type-only: erased, demo.ts stays out of the bundle

/** /drift page entry: one pan bus, then every section that reads or writes it. */
export function initDrift(): void {
  const root = document.querySelector<HTMLElement>('[data-drift-page]');
  if (!root) return;
  initPanDisplays(root);
  initWheel(root);
  initTracks(root);
  initJump();
  initCaptures();
  initDeferredImages(root);
  initLap(root);
  // #hear renders only when drift.demoMode === 'real'; demo.ts never loads otherwise
  if (root.querySelector('[data-demo-screen]')) void initDeckUi(root);
}

/**
 * Every [data-drift-jump] CTA (hero keycap, phone sticky bar): scroll the
 * target's TOP into view, so #try's compat line is read first, then focus the
 * email field without a second scroll. No JS = a native anchor jump.
 * With Lenis up, its own window click handler already animates the same hash
 * (it ignores preventDefault and honours scroll-padding-top), so only the
 * reduced-motion path scrolls here: one engine per click, never two.
 */
function initJump(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-drift-jump]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = a.hash ? document.querySelector<HTMLElement>(a.hash) : null;
      if (!t) return;
      e.preventDefault();
      if (!lenis) t.scrollIntoView({ behavior: 'auto', block: 'start' });
      // pointer: fine only: on touch the visitor reads the compat rows first, then taps the field (no keyboard pop)
      if (matchMedia('(pointer: fine)').matches) t.querySelector<HTMLInputElement>('input[type=email]')?.focus({ preventScroll: true });
      history.replaceState(null, '', a.hash);
    });
  });
}

/**
 * img[data-src] (the #fx photos and the GPS plate, 1-3 screens down) and
 * [data-bg] (the GPS caps, background sprites): native loading="lazy" fetched
 * them before any scroll on a fast connection, so they wait here for a 500 px
 * approach instead. srcset goes on before src so the pick is right the first
 * time. No IntersectionObserver = load them all.
 */
function initDeferredImages(root: HTMLElement): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('img[data-src], [data-bg]'));
  const load = (el: HTMLElement) => {
    if (el instanceof HTMLImageElement) {
      if (el.dataset.srcset) el.srcset = el.dataset.srcset;
      el.src = el.dataset.src!;
      delete el.dataset.src; delete el.dataset.srcset;
    } else {
      el.style.backgroundImage = `url(${el.dataset.bg})`;
      delete el.dataset.bg;
    }
  };
  if (!('IntersectionObserver' in window)) { els.forEach(load); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { load(e.target as HTMLElement); io.unobserve(e.target); }
  }, { rootMargin: '500px 0px' });
  els.forEach((el) => io.observe(el));
}

/**
 * The keep-it TV's lap (Dan 10-03, A3): the car drives and the dates light only while the lap is on
 * screen, like the #drive GPS car. CSS holds the animations paused; [data-run] lets them go.
 */
function initLap(root: HTMLElement): void {
  const lap = root.querySelector<HTMLElement>('[data-lap]');
  if (!lap) return;
  if (!('IntersectionObserver' in window)) { lap.dataset.run = ''; return; }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) lap.dataset.run = '';
    else delete lap.dataset.run;
  }).observe(lap);
}

async function initDeckUi(root: HTMLElement): Promise<void> {
  const { deck, elapsedSec, levelBars, onDeck, pause, play, setAfter, setSlot, slotLabel, stop } = await import('./demo');
  const title = root.querySelector<HTMLElement>('[data-demo-title]');
  const mode = root.querySelector<HTMLElement>('[data-demo-mode]');
  const time = root.querySelector<HTMLElement>('[data-demo-time]');
  const playBtn = root.querySelector<HTMLButtonElement>('[data-demo="play"]');
  const slots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-slot]'));
  const abs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-ab]'));
  if (!playBtn) return;

  playBtn.addEventListener('click', () => { void play(); });
  root.querySelector('[data-demo="pause"]')?.addEventListener('click', pause);
  root.querySelector('[data-demo="stop"]')?.addEventListener('click', stop);
  slots.forEach((b) => b.addEventListener('click', () => {
    setSlot(b.dataset.slot as Slot);
    slots.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));
  abs.forEach((b) => b.addEventListener('click', () => {
    setAfter(b.dataset.ab === 'after');
    abs.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));

  let lastTitle = '';
  const paint = () => {
    const t = `${slotLabel()} · ${deck.after ? 'AFTER' : 'BEFORE'}`;
    if (title && t !== lastTitle) { title.textContent = t; lastTitle = t; }
    if (mode) {
      const bars = levelBars();
      mode.textContent = !deck.playing ? 'STOPPED' : deck.paused ? 'PAUSED' : `PLAYING ${'▮'.repeat(bars)}${'▯'.repeat(5 - bars)}`;
    }
    if (time) {
      const s = Math.floor(elapsedSec());
      time.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
    playBtn.setAttribute('aria-pressed', String(deck.playing && !deck.paused));
  };
  onDeck(paint);
  paint();
}
