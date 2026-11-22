/**
 * The hero's opening (Higgsfield, 2026-11-17): a GT coupe blooms in from the right, sweeps across the lens with its
 * headlights and drives off down the road. The title comes up as it leaves; on the last frame the video dissolves
 * into the live road and the canvas carries the tail lights on to the horizon (night.ts).
 *
 * It plays at RATE x (Dan, 2026-11-22: "make the car scene go faster"): the 8.04 s files run about 5.4 s on screen,
 * the title (video 5 s) comes up about 3.4 s after play(), and night.ts's tail lights travel at the same speed-up.
 * The files themselves are untouched; a different speed is the one line below.
 *
 * Plays on every load, a reload included (Dan, 2026-11-18); only a visitor who comes back with Back / Forward has
 * seen it. REPLAY brings it back. Never with reduced motion or Save-Data.
 *
 * THE INTRO RULE (plan 2026-11-18 H.1; hero-04/12/13, perf-03/06/08, video-12):
 *  - not playing 2.5 s after start() -> straight to the road and the title (a bail);
 *  - playing -> the title at video 5 s (about 3.4 s of wall time at RATE 1.5) or 6.5 s after play(), whichever comes
 *    first; a stall over 3 s is a bail;
 *  - the first run counts that 6.5 s from NAVIGATION (Part 1 §1: on a slow line the name is up by about 6.5 s at the
 *    latest): a page script that lands late has only what is left of it, a film not yet playing when it runs out is a
 *    bail, and a script that lands with under 2 s of it left plays no film at all (the road, the title, Replay);
 *  - a hidden tab waits for visibilitychange before it starts;
 *  - an error on the last <source> means no film at all: a bail, and no Replay;
 *  - a bail drops the sources and calls load(), so nothing keeps downloading; Replay puts them back;
 *  - a link aimed below the hero (/widebeam/#manual) skips the intro and its download;
 *  - a slow line (navigator.connection.downlink < 3) drops the data-wb-tier="hi" sources (the lighter file plays).
 * The file names live only in WbHero.astro's <source>s: this module moves those nodes and never builds a URL, so the
 * build's ?v= stamp on them holds (tools/assetver). The CSS failsafe (hero.css) shows the title at 8.5 s if this
 * module never runs; `is-run` stands it down once the module is in charge.
 */
/** the film's speed (Dan, 2026-11-22: "make the car scene go faster"; 8.0 s -> 5.4 s). 1.75 or 2 = this line alone:
 *  night.ts scales the tail lights' travel by it */
export const RATE = 1.5;
const REVEAL_AT = 5.0; // video seconds (the playback rate moves it in wall time, not in the film)
const TITLE_WALL = 6500; // ms after play(); on the first run, after navigation start
const FILM_MIN = 2000; // ms: the first run needs this much of the wall left to play the film (the headlights at film ~1.2 s, ~0.8 s on screen at RATE 1.5)
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
  // the first start counts from navigation (performance.now() = ms since it began); a tab opened in the background
  // counts from the moment it is seen, and Replay always has the full wall
  let fromNav = document.visibilityState !== 'hidden';
  let watchdog = 0, stall = 0, wall = 0, pauseT = 0;
  const clear = () => { clearTimeout(watchdog); clearTimeout(stall); clearTimeout(wall); clearTimeout(pauseT); };
  // a replay's hush: the column is out of reach as well as out of sight (no click, no Tab, no reader) until the title
  // comes back; hero.css hides it after its .3 s fade
  const hush = (on: boolean) => { hero.classList.toggle('is-hush', on); if (inner) inner.inert = on; };
  const titleNow = () => { reveal(false); hush(false); };
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
    hero.classList.remove('is-intro'); hush(false); // before the focus below: an inert title can't take it
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
    if (revealed) hush(true); // a replay: the title steps back until the car leaves
    if (replay) replay.hidden = true;
    video!.classList.remove('is-gone');
    try { video!.currentTime = 0; } catch {}
    // every start: restore()/drop() call load(), which puts playbackRate back to defaultPlaybackRate; set both, so a
    // Replay (after a Skip's drop() too) keeps the speed
    video!.defaultPlaybackRate = RATE; video!.playbackRate = RATE;
    watchdog = window.setTimeout(() => { if (!playing) finish(true); }, PLAY_DEADLINE);
    const left = fromNav ? Math.max(0, TITLE_WALL - performance.now()) : TITLE_WALL;
    fromNav = false;
    // the wall: the title comes now; a film that has not started by then never will (no car after the name)
    wall = window.setTimeout(() => { if (!running) return; if (playing) titleNow(); else finish(true); }, left);
    video!.play().catch(() => finish(true));
  }

  video.addEventListener('timeupdate', () => { if (running && video.currentTime >= REVEAL_AT) titleNow(); });
  video.addEventListener('ended', () => finish(false));
  video.addEventListener('error', () => finish(true));
  video.addEventListener('waiting', () => { if (!running) return; clearTimeout(stall); stall = window.setTimeout(() => finish(true), STALL); });
  video.addEventListener('playing', () => { playing = true; clearTimeout(stall); clearTimeout(watchdog); });
  // the selection reached the last <source> and it failed too: there is no film to show or to replay
  last?.addEventListener('error', () => { if (dropped) return; noFilm = true; if (replay) replay.hidden = true; finish(true); });
  // a <source media> is read once, when the file is picked: a phone turned during the film kept playing the portrait
  // cut in the landscape hero (5.6x upscaled, r-hero-rotate), or the reverse. A TURN that changes the cut the page
  // would pick now ends the film as a skip does, and Replay loads the right one. Other resizes play on: a desktop
  // window across 900 px (720 vs 1080, the same frame), or a phone's toolbar folding away on a scroll (375x553 ->
  // 375x635 would cross the portrait cut's 3/5 line without a turn).
  const upright = () => matchMedia('(orientation: portrait)').matches;
  let wasUpright = upright();
  window.addEventListener('resize', () => {
    const turned = upright() !== wasUpright;
    wasUpright = upright();
    if (!running || !turned) return;
    const cur = [...video.querySelectorAll('source')].find((s) => s.src === video.currentSrc);
    const now = [...video.querySelectorAll('source')].find((s) => !s.media || matchMedia(s.media).matches);
    if (cur && now && cur.dataset.wbFrame !== now.dataset.wbFrame) finish(true);
  });
  skip?.addEventListener('click', () => { finish(true); title?.focus({ preventScroll: true }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && running) finish(true); });
  replay?.addEventListener('click', () => { start(); if (running) skip?.focus({ preventScroll: true }); });

  // the page script landed too late for the film to play before the name is due (a slow line): no film, no download
  const tooLate = fromNav && performance.now() > TITLE_WALL - FILM_MIN;
  if (seen || deep || late || tooLate) {
    fromNav = false; // a Replay from here gets the full wall
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
