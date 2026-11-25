/**
 * Section 1's car film (WbpCar.astro), the mock-up's open (bench/widebeam-projector index.html, s1): the name and the
 * glass card rise in over black (CSS, 0.1 / 0.28 s), the film waits on its first frame until the screen has painted
 * (two frames + PAINT_WAIT), then play() is called at once, buffered or not (an iPhone loads nothing before play()),
 * and the picture fades up (.is-in, 1.6 s) when it really plays, on a refused play(), or FADE_FALLBACK after the
 * paint wait at the latest. RATE 1.5, no title hold, no loop: it stops on its last frame.
 *
 * No film, only the end still fading up (the last frame with the car gone, the portrait one on an upright screen):
 * reduced motion, Save-Data, Back / Forward (the visitor has seen it), a link aimed below section 1, a script that
 * lands too late (LATE after navigation: the words have long been up), and a film whose every <source> failed.
 * A background tab waits until it is seen. A slow line (navigator.connection.downlink < 3) drops the data-wbp-tier="hi"
 * sources. Like the old intro.ts these move the markup's <source> nodes and never build a URL (assetver's ?v=).
 * The emailed trial link (#dl=…&p=…) is TrialGateModal's: it reads and scrubs the hash before this runs, and this never
 * reads a hash that starts with dl=.
 * Dev only: ?wbp-crop=16x9 plays the landscape 720 file on a phone too, the mock-up's 16:9 crop, to compare with the
 * portrait cut. A production build ignores it.
 */
const RATE = 1.5;
const PAINT_WAIT = 420; // ms after two frames
const FADE_FALLBACK = 2500; // ms after the paint wait
const LATE = 4500; // ms after navigation (the old intro's TITLE_WALL - FILM_MIN)

export function initCar(section: HTMLElement) {
  const car = section.querySelector<HTMLVideoElement>('[data-wbp-film]');
  if (!car) return;
  const show = () => car.classList.add('is-in');
  const portrait = car.dataset.portrait ?? '';
  const still = () => { const s = portrait && matchMedia(portrait).matches ? car.dataset.endPortrait : car.dataset.end; if (s) car.poster = s; };
  const noFilm = () => { car.querySelectorAll('source').forEach((s) => s.remove()); car.removeAttribute('src'); car.load(); still(); requestAnimationFrame(() => requestAnimationFrame(show)); };

  const conn = (navigator as any).connection;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  let deep = false;
  try {
    const id = decodeURIComponent(location.hash.slice(1));
    const t = id && !id.startsWith('dl=') ? document.getElementById(id) : null;
    deep = !!t && !section.contains(t);
  } catch { /* a malformed hash is no deep link */ }
  if (reduced || conn?.saveData || nav?.type === 'back_forward' || deep || performance.now() > LATE) { noFilm(); return; }

  const sources = [...car.querySelectorAll<HTMLSourceElement>('source')];
  const downlink = typeof conn?.downlink === 'number' ? conn.downlink : 0;
  const drop = sources.filter((s) => (downlink > 0 && downlink < 3 && s.dataset.wbpTier === 'hi')
    || (import.meta.env.DEV && /[?&]wbp-crop=16x9\b/.test(location.search) && s.media.includes('aspect-ratio')));
  drop.forEach((s) => s.remove());
  const kept = [...car.querySelectorAll<HTMLSourceElement>('source')];
  // every source failed: no film to show
  kept[kept.length - 1]?.addEventListener('error', () => { noFilm(); });

  const rate = () => { car.defaultPlaybackRate = RATE; car.playbackRate = RATE; };
  car.addEventListener('loadedmetadata', rate);
  car.addEventListener('play', rate);

  const go = () => {
    // the parser chose among the markup's sources with nothing fetched (preload none): a drop makes it choose again
    // among the kept ones, then the download starts. load() only after a drop: a load() while the parser's pick was
    // already loading fetched the whole file twice (G11, 1440: 3.17 MB)
    if (drop.length) car.load();
    car.preload = 'auto';
    rate();
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
      car.addEventListener('playing', show, { once: true });
      const p = car.play();
      if (p) p.catch(show);
      setTimeout(show, FADE_FALLBACK);
    }, PAINT_WAIT)));
  };
  if (document.visibilityState === 'hidden') {
    // a background tab (cmd-click): Chrome defers the media and Safari pauses it, so wait until it is seen
    const seen = () => { if (document.visibilityState !== 'visible') return; document.removeEventListener('visibilitychange', seen); go(); };
    document.addEventListener('visibilitychange', seen);
  } else go();
}
