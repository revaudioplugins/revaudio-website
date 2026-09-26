import { initPanDisplays } from './bus';
import { initWheel } from './wheel';
import { initBand } from './band';
import { initTracks } from './trackui';
import { deck, elapsedSec, levelBars, onDeck, pause, play, setAfter, setAuto, setSlot, slotLabel, stop, type Slot } from './demo';

/** /drift page entry: one pan bus, then every section that reads or writes it. */
export function initDrift(): void {
  const root = document.querySelector<HTMLElement>('[data-drift-page]');
  if (!root) return;
  initPanDisplays(root);
  initWheel(root);
  initBand(root);
  initTracks(root);
  initDeckUi(root);
  initAutoDrift(root);
  initSat(root);
}

function initDeckUi(root: HTMLElement): void {
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

function initAutoDrift(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-autodrift]');
  btn?.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    setAuto(on);
  });
}

function initSat(root: HTMLElement): void {
  const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sattype]'));
  const desc = root.querySelector<HTMLElement>('[data-satdesc]');
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    if (desc) desc.textContent = b.dataset.desc ?? '';
  }));
}
