/**
 * The hero's opening (Higgsfield, 2026-11-17): a GT coupe blooms in from the right, sweeps across the lens with its
 * headlights and drives off down the road. The title comes up as it leaves (5 s); on the last frame the video dissolves
 * into the live road and the canvas carries the tail lights on to the horizon while our own lamps cough on.
 *
 * Played once per browser session (a sessionStorage flag); REPLAY brings it back. Never with reduced motion or Save-Data.
 * Every failure (autoplay refused, an error, no start within 6 s, a stall over 3 s) goes straight to the road.
 */
const REVEAL_AT = 5.0;
const KEY = 'wb-intro-seen';

export interface IntroHooks {
  reveal(instant: boolean): void; // the hero title comes up
  handoff(): void; // the road takes over (lamps, tail lights)
}

export function initIntro(hero: HTMLElement, hooks: IntroHooks) {
  const video = hero.querySelector<HTMLVideoElement>('[data-wb-intro]');
  const skip = hero.querySelector<HTMLButtonElement>('[data-wb-skip]');
  const replay = hero.querySelector<HTMLButtonElement>('[data-wb-replay]');
  let revealed = false;
  const reveal = (instant: boolean) => { if (!revealed) { revealed = true; hooks.reveal(instant); } };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator as any).connection?.saveData;
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch {}

  if (!video || reduced || saveData) {
    video?.remove(); skip?.remove(); replay?.remove();
    reveal(true);
    return;
  }

  let running = false, done = true, watchdog = 0, stall = 0;
  const clear = () => { clearTimeout(watchdog); clearTimeout(stall); };

  function finish(fast: boolean) {
    if (done) return;
    done = true; running = false; clear();
    reveal(false);
    hooks.handoff();
    hero.classList.remove('is-intro', 'is-hush');
    hero.classList.toggle('is-intro-fast', fast);
    video!.classList.add('is-gone');
    window.setTimeout(() => { if (!running) video!.pause(); }, fast ? 450 : 1000);
    if (replay) replay.hidden = false;
  }

  function start() {
    done = false; running = true;
    hero.classList.add('is-intro');
    if (revealed) hero.classList.add('is-hush'); // a replay: the title steps back until the car leaves
    if (replay) replay.hidden = true;
    video!.classList.remove('is-gone');
    try { video!.currentTime = 0; } catch {}
    watchdog = window.setTimeout(() => { if (video!.currentTime < 0.05) finish(true); }, 6000);
    video!.play().catch(() => finish(true));
    try { sessionStorage.setItem(KEY, '1'); } catch {}
  }

  video.addEventListener('timeupdate', () => { if (running && video.currentTime >= REVEAL_AT) { reveal(false); hero.classList.remove('is-hush'); } });
  video.addEventListener('ended', () => finish(false));
  video.addEventListener('error', () => finish(true));
  video.addEventListener('waiting', () => { clearTimeout(stall); stall = window.setTimeout(() => finish(true), 3000); });
  video.addEventListener('playing', () => { clearTimeout(stall); clearTimeout(watchdog); });
  skip?.addEventListener('click', () => finish(true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && running) finish(true); });
  replay?.addEventListener('click', start);

  if (seen) {
    video.classList.add('is-gone');
    reveal(true);
    if (replay) replay.hidden = false;
  } else {
    start();
  }
}
