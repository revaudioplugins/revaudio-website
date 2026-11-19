/**
 * The hero's opening (Higgsfield, 2026-11-17): a GT coupe blooms in from the right, sweeps across the lens with its
 * headlights and drives off down the road. The title comes up as it leaves; on the last frame the video dissolves
 * into the live road and the canvas carries the tail lights on to the horizon (night.ts).
 *
 * Plays on every load, a reload included (Dan, 2026-11-18); only a visitor who comes back with Back / Forward has
 * seen it. REPLAY brings it back. Never with reduced motion or Save-Data.
 *
 * THE INTRO RULE (plan 2026-11-18 H.1; hero-04/12/13, perf-03/06/08, video-12):
 *  - not playing 2.5 s after start() -> straight to the road and the title (a bail);
 *  - playing -> the title at video 5 s or 6.5 s after play(), whichever comes first; a stall over 3 s is a bail;
 *  - a hidden tab waits for visibilitychange before it starts;
 *  - an error on the last <source> means no film at all: a bail, and no Replay;
 *  - a bail drops the sources and calls load(), so nothing keeps downloading; Replay puts them back;
 *  - a link aimed below the hero (/widebeam/#manual) skips the intro and its download;
 *  - a slow line (navigator.connection.downlink < 3) drops the data-wb-tier="hi" sources (the lighter file plays).
 * The file names live only in WbHero.astro's <source>s: this module moves those nodes and never builds a URL, so the
 * build's ?v= stamp on them holds (tools/assetver). The CSS failsafe (hero.css) shows the title at 8.5 s if this
 * module never runs; `is-run` stands it down once the module is in charge.
 */
const REVEAL_AT = 5.0; // video seconds
const TITLE_WALL = 6500; // ms after play()
const PLAY_DEADLINE = 2500; // ms after start()
const STALL = 3000; // ms

/** the part of the 1920x1080 master the playing file shows: x, y, w, h (WbHero.astro data-wb-frame) */
export type Frame = [number, number, number, number];
const FULL: Frame = [0, 0, 1920, 1080];

export interface IntroHooks {
  reveal(instant: boolean): void; // the hero title comes up
  handoff(frame: Frame): void; // the film reached its last frame: the road takes over (tail lights)
}

export function initIntro(hero: HTMLElement, hooks: IntroHooks) {
  const video = hero.querySelector<HTMLVideoElement>('[data-wb-intro]');
  const skip = hero.querySelector<HTMLButtonElement>('[data-wb-skip]');
  const replay = hero.querySelector<HTMLButtonElement>('[data-wb-replay]');
  const title = hero.querySelector<HTMLElement>('h1');
  const inner = hero.querySelector<HTMLElement>('[data-wb-hero-inner]');
  let revealed = false;
  const reveal = (instant: boolean) => { if (!revealed) { revealed = true; hooks.reveal(instant); } };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = (navigator as any).connection;
  const saveData = !!conn?.saveData;
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  const seen = nav?.type === 'back_forward';
  // a deep link below the hero (the plugin's MANUAL button opens /widebeam/#manual): no intro, no download
  let deep = false;
  try { const id = decodeURIComponent(location.hash.slice(1)); const t = id ? document.getElementById(id) : null; deep = !!t && !hero.contains(t); } catch {}
  // the CSS failsafe already showed the title (this module booted after 8.5 s): don't hide it again for a film
  const late = !!inner && !hero.classList.contains('is-shown') && getComputedStyle(inner).visibility === 'visible';

  if (!video || reduced || saveData) {
    video?.remove(); skip?.remove(); replay?.remove();
    reveal(true);
    return;
  }

  // the slow-line choice: the lighter files stay. Made on the first start only, since load() can fetch on its own
  // (Chrome), and a visitor who never plays the film (a deep link, Back) must download nothing.
  const downlink = typeof conn?.downlink === 'number' ? conn.downlink : 0;
  const slow = downlink > 0 && downlink < 3;
  const sources = [...video.querySelectorAll<HTMLSourceElement>('source')].filter((s) => !(slow && s.dataset.wbTier === 'hi'));
  const last = sources[sources.length - 1];

  let running = false, done = true, playing = false, noFilm = false, dropped = slow;
  let watchdog = 0, stall = 0, wall = 0, pauseT = 0;
  const clear = () => { clearTimeout(watchdog); clearTimeout(stall); clearTimeout(wall); clearTimeout(pauseT); };
  const titleNow = () => { reveal(false); hero.classList.remove('is-hush'); };
  const frameNow = (): Frame => {
    const s = sources.find((x) => x.src === video.currentSrc);
    const f = s?.dataset.wbFrame?.split(' ').map(Number);
    return f && f.length === 4 && f.every((n) => Number.isFinite(n)) ? (f as Frame) : FULL;
  };
  // a bail stops the download: no sources, load(). Replay puts the same nodes back.
  const drop = () => { if (dropped) return; dropped = true; sources.forEach((s) => s.remove()); video.removeAttribute('src'); video.load(); };
  // (on a slow line the first start lands here too: the parser chose among all sources, load() picks among these)
  const restore = () => { if (!dropped) return; dropped = false; video.querySelectorAll('source').forEach((s) => s.remove()); sources.forEach((s) => video.appendChild(s)); video.load(); };

  function finish(fast: boolean) {
    if (done) return;
    done = true; running = false; clear();
    const hadFocus = document.activeElement === skip;
    reveal(false);
    if (!fast) hooks.handoff(frameNow()); // a skip or a bail has no car on the last frame: no tail lights
    hero.classList.remove('is-intro', 'is-hush');
    hero.classList.toggle('is-intro-fast', fast);
    video!.classList.add('is-gone');
    if (fast) pauseT = window.setTimeout(() => { if (!running) { video!.pause(); drop(); } }, 450);
    if (replay) replay.hidden = noFilm;
    // Skip hides itself: keep the keyboard on the page (hero-10), the title is the next thing to read
    if (hadFocus) title?.focus({ preventScroll: true });
  }

  function start() {
    if (noFilm) return;
    restore();
    done = false; running = true; playing = false;
    hero.classList.add('is-intro');
    if (revealed) hero.classList.add('is-hush'); // a replay: the title steps back until the car leaves
    if (replay) replay.hidden = true;
    video!.classList.remove('is-gone');
    try { video!.currentTime = 0; } catch {}
    watchdog = window.setTimeout(() => { if (!playing) finish(true); }, PLAY_DEADLINE);
    wall = window.setTimeout(() => { if (running) titleNow(); }, TITLE_WALL);
    video!.play().catch(() => finish(true));
  }

  video.addEventListener('timeupdate', () => { if (running && video.currentTime >= REVEAL_AT) titleNow(); });
  video.addEventListener('ended', () => finish(false));
  video.addEventListener('error', () => finish(true));
  video.addEventListener('waiting', () => { if (!running) return; clearTimeout(stall); stall = window.setTimeout(() => finish(true), STALL); });
  video.addEventListener('playing', () => { playing = true; clearTimeout(stall); clearTimeout(watchdog); });
  // the selection reached the last <source> and it failed too: there is no film to show or to replay
  last?.addEventListener('error', () => { if (dropped) return; noFilm = true; if (replay) replay.hidden = true; finish(true); });
  skip?.addEventListener('click', () => { finish(true); title?.focus({ preventScroll: true }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && running) finish(true); });
  replay?.addEventListener('click', () => { start(); if (running) skip?.focus({ preventScroll: true }); });

  if (seen || deep || late) {
    video.classList.add('is-gone');
    reveal(true);
    if (replay) replay.hidden = false;
    return;
  }
  hero.classList.add('is-run'); // the module is in charge: the CSS failsafe stands down
  if (document.visibilityState === 'hidden') {
    // a background tab (cmd-click): Chrome defers the media and Safari pauses it, so wait until it is seen
    const go = () => { if (document.visibilityState !== 'visible') return; document.removeEventListener('visibilitychange', go); start(); };
    document.addEventListener('visibilitychange', go);
  } else {
    start();
  }
}
