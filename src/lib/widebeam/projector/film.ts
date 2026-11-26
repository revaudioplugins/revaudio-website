/**
 * Section 2 (WbpFilm.astro), the mock-up's s2 (bench/widebeam-projector, P1 + F0 + Intertitle): when the section is
 * well in view (60 % of it, or it covers 60 % of the screen) the lamp strikes (the beam steps 0.6 / 0.1 / 0.9 / 0.35 / 1
 * over 360 ms, the picture flickers up, .lampup) and the film starts 250 ms in; under 30 % it pauses, back in view it
 * runs on; a hidden tab pauses it too. Captions run on the film's clock (the cues are data-cues, from widebeam.ts).
 * At the end the last frame holds, then the F0 cut: it shivers, slips a frame up with the frame line rolling through,
 * a splice flashes, the title card settles. Watch again cuts back and plays from the top.
 *
 * Never a dead section: the card is in the markup, visible; this hides it (visibility + inert + aria-hidden) only while
 * the film is the picture, and every way the film can fail to play shows it at once with the key "Play the film":
 * a refused play() (iOS Low Power Mode), every source failed, a stall (no 'playing' 6 s after the play request, or
 * 'waiting' for 6 s), Save-Data, reduced motion. That key plays it from the top, inside the press.
 *
 * The voice (Dan's picks; critic C3): on by default, but heard only after the visitor's first act on the page itself
 * (.wbp-page): a mouse press, a finger lifted without a scroll, a real click, anywhere but a gate (the ask block, any
 * form control, a link, the Buy key). The header, the strip, the footer, the cookie banner, the cart and the modals
 * sit outside .wbp-page, so they never count. `armed` is our own gate: nothing plays the voice until such an act (or a
 * press of the sound key, Play the film, Watch again) has set it, because the browser's activation is sticky and a
 * cookie-banner or Buy click would otherwise let the film's next 'play' start it. No key press ever arms it, except on
 * those three keys themselves. The first time it is heard with the film past 1 s, both cut back to the top (pick A).
 * It follows the picture within 0.2 s; while it is still being fetched the picture waits for it (at most 1.5 s), so its
 * first words are never skipped. On a touch screen (a phone, either way up) a tap on the picture toggles it; with a
 * mouse a click only turns it on.
 *
 * The frame's size is CSS (s2.css): 16:9 or as tall as the card. layout() reserves the card's status line for its
 * longest message (so a two-line error never pushes the card's last line out of the frame), measures the letterbox
 * bands on a phone, and places the beam. Every media URL is in the markup (assetver's ?v=); this never builds one.
 */
import { lenis } from '../../motion';

const STRIKE: [number, number][] = [[0, 0.6], [90, 0.1], [170, 0.9], [260, 0.35], [360, 1]];
const REWIND_AFTER = 1.0; // s: a first sound later than this restarts the film with it
const STALL = 6000;
const SAME_PRESS = 900; // ms: the click of the press that armed the voice is that same act, not a second one
const HOLD_MAX = 1500; // ms: the longest the picture waits for a voice still on its way
// the longest line the card's status can carry (signup.ts's own), with the error mark: the room it is given
const LONGEST = '✕ Something went wrong. Try again, or email info@revaudio.net.';

type Cue = [number, number, string[]];

export function initFilm(s2: HTMLElement, page: HTMLElement) {
  const q = <T extends Element>(s: string) => s2.querySelector<T>(s);
  const frame = q<HTMLElement>('[data-wbp-frame]')!, film = q<HTMLVideoElement>('[data-wbp-manual]')!, still = q<HTMLImageElement>('.wbp-still')!;
  const card = q<HTMLElement>('[data-wbp-card]')!, again = q<HTMLButtonElement>('[data-wbp-again]')!, tap = q<HTMLButtonElement>('[data-wbp-tap]')!;
  const voice = q<HTMLAudioElement>('[data-wbp-voice]')!, cap = q<HTMLElement>('[data-wbp-cap]')!;
  const cv = q<HTMLCanvasElement>('.wbp-beam:not(.wbp-dust)')!, cvd = q<HTMLCanvasElement>('.wbp-dust')!;
  if (!frame || !film || !still || !card || !again || !tap || !voice || !cap || !cv || !cvd) return;
  let cues: Cue[] = [];
  try { cues = JSON.parse(s2.dataset.cues || '[]'); } catch { /* no captions */ }
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  const RM = () => rmq.matches;
  const conn = (navigator as any).connection;

  let filmMode = false, started = false, ended = false, struck = false, inView = false, seen = false, prepared = false;
  let holding = false, holdT = 0; // the picture is paused for a moment, waiting for the voice (syncVoice)
  // a cut that hides the sound key while it holds focus hands focus to the card's film key (never to <body>)
  const keepFocus = (had: boolean) => { if (had) again.focus({ preventScroll: true }); };
  const running = () => filmMode && (!film.paused || holding) && !ended;
  const showCard = (on: boolean) => {
    card.inert = !on;
    if (on) card.removeAttribute('aria-hidden'); else card.setAttribute('aria-hidden', 'true');
  };
  const keyWords = (k: 'play' | 'again') => { again.querySelector('span')!.textContent = again.dataset[k] ?? ''; };
  const syncRM = () => s2.classList.toggle('rm', RM());
  rmq.addEventListener?.('change', syncRM);
  syncRM();
  again.hidden = false; // the card's film key works from here on

  // a slow line drops the hi tier before anything is fetched (preload none); the element re-picks on its first load()
  const downlink = typeof conn?.downlink === 'number' ? conn.downlink : 0;
  const drop = [...film.querySelectorAll<HTMLSourceElement>('source')].filter((s) => downlink > 0 && downlink < 3 && s.dataset.wbpTier === 'hi');
  drop.forEach((s) => s.remove());
  const kept = [...film.querySelectorAll<HTMLSourceElement>('source')];
  // every source failed (or the file broke): the card, and the next press loads the sources again (an element with no
  // source left never retries on play() alone; it would sit blank until the stall watchdog)
  let failed = false;
  const fail = () => { failed = true; noPlay(); };
  kept[kept.length - 1]?.addEventListener('error', fail);
  film.addEventListener('error', fail);

  /* ---------------- the card first: no film, or no film any more ---------------- */
  let anims: Animation[] = [], cutTok = 0, stallT = 0;
  const clearAnims = () => { for (const a of anims) { try { a.cancel(); } catch { /* gone */ } } anims = []; };
  function cardFirst() {
    clearAnims(); cutTok++; unwatch();
    const had = document.activeElement === tap;
    filmMode = false; started = false; holding = false; clearTimeout(holdT);
    s2.classList.remove('is-film', 'carding', 'playing');
    s2.classList.add('carded');
    frame.classList.remove('show-still');
    showCard(true); keyWords('play'); keepFocus(had);
    if (!film.paused) film.pause();
    voice.pause();
  }
  function noPlay() { if (filmMode) cardFirst(); }

  if (RM() || conn?.saveData) cardFirst();
  else { filmMode = true; s2.classList.add('is-film'); showCard(false); keyWords('again'); }

  // the near-script marks the video 3/4 of a screen ahead: the poster (only if the film will show) and the voice's src
  const near = () => {
    if (!voice.getAttribute('src') && voice.dataset.src) voice.src = voice.dataset.src; // preload none: nothing yet
    if (filmMode && !film.getAttribute('poster')) {
      const p = film.dataset.small && matchMedia(film.dataset.small).matches ? film.dataset.posterSm : film.dataset.poster;
      if (p) film.poster = p;
    }
  };
  if (film.hasAttribute('data-wb-near')) near();
  else new MutationObserver((_, mo) => { if (film.hasAttribute('data-wb-near')) { mo.disconnect(); near(); } }).observe(film, { attributes: true, attributeFilter: ['data-wb-near'] });

  /* ---------------- playing, stalls ---------------- */
  function unwatch() { clearTimeout(stallT); stallT = 0; }
  const watch = () => {
    unwatch();
    stallT = window.setTimeout(() => { stallT = 0; if (filmMode && inView && !document.hidden && !ended && !holding && (film.paused || film.readyState < 3)) noPlay(); }, STALL);
  };
  function play() {
    if (!prepared) {
      prepared = true;
      // a load() only after a drop: one while the parser's pick was already loading fetched the file twice (car.ts)
      if (drop.length) film.load();
      film.preload = 'auto';
    } else if (failed) film.load();
    failed = false;
    started = true;
    const p = film.play();
    watch();
    p?.catch((e: unknown) => { if ((e as Error)?.name !== 'AbortError') noPlay(); });
  }
  film.addEventListener('playing', unwatch);
  film.addEventListener('waiting', () => { if (filmMode && !film.paused) watch(); });
  film.addEventListener('play', () => { s2.classList.add('playing'); syncVoice(); capKick(); });
  film.addEventListener('pause', () => { if (holding) return; s2.classList.remove('playing'); voice.pause(); unwatch(); });
  film.addEventListener('seeking', () => { if (!voice.paused) voice.currentTime = film.currentTime; });
  film.addEventListener('loadedmetadata', () => layout());
  for (const ev of ['seeked', 'loadeddata']) film.addEventListener(ev, capKick);
  film.addEventListener('ended', () => {
    if (!filmMode) return;
    s2.classList.remove('playing'); voice.pause(); unwatch();
    ended = true; capKick();
    frame.classList.add('show-still');
    setTimeout(() => { if (ended) cut(false); }, RM() ? 0 : 120);
  });

  /* ---------------- the lamp, the beam, the dust ---------------- */
  const cx = cv.getContext('2d'), dx = cvd.getContext('2d');
  let beamLevel = 0, dustRAF = 0, lastT = 0;
  let geo: { w: number; h: number; fx: number; fy: number; fw: number; fh: number } | null = null;
  const dust = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random() * 0.9, r: 0.4 + Math.random() * 1.4, a: 0.25 + Math.random() * 0.5,
    vx: (Math.random() - 0.5) * 0.00012, vy: (Math.random() - 0.4) * 0.00008, p: Math.random() * 6 }));
  const lerp = (p: number[], r: number[], t: number) => [p[0] + (r[0] - p[0]) * t, p[1] + (r[1] - p[1]) * t];
  function hull(pts: number[][]) { // monotone chain
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo: number[][] = [], up: number[][] = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // the lens is behind the viewer: the shafts enter over our heads, widest at the top edge, and close in on the frame
  function drawBeam(level = 1) {
    if (!cx || !dx || !geo) return;
    const dpr = Math.min(2, devicePixelRatio || 1), { w, h, fx, fy, fw, fh } = geo;
    for (const c of [cv, cvd]) if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h);
    dx.setTransform(dpr, 0, 0, dpr, 0, 0); dx.clearRect(0, 0, w, h);
    if (beamLevel <= 0) return;
    const L = beamLevel * level, a = 0.11, k = Math.max(60, w * 0.2);
    const from = [[fx - k, -20], [fx + fw + k, -20]], qd = [[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]];
    const poly = hull([...from, ...qd]);
    const path = (c: CanvasRenderingContext2D) => { c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
    const s0 = lerp(from[0], from[1], 0.5), sc = lerp(qd[0], qd[2], 0.5);
    const lg = cx.createLinearGradient(s0[0], s0[1], sc[0], sc[1]);
    lg.addColorStop(0, `rgba(255,242,210,${a * 1.7 * L})`); lg.addColorStop(0.6, `rgba(255,236,196,${a * L})`); lg.addColorStop(1, `rgba(255,228,180,${a * 0.55 * L})`);
    cx.save(); path(cx); cx.fillStyle = lg; cx.fill();
    // shafts: thin brighter planes from the lens side to the picture, the way haze catches a projector beam
    cx.clip();
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9 + Math.sin(i * 7.3) * 0.03;
      const a0 = lerp(from[0], from[1], Math.max(0, t - 0.02)), a1 = lerp(from[0], from[1], Math.min(1, t + 0.02));
      const b0 = lerp(qd[3], qd[2], Math.max(0, t - 0.015)), b1 = lerp(qd[0], qd[1], Math.min(1, t + 0.015));
      cx.beginPath(); cx.moveTo(a0[0], a0[1]); cx.lineTo(a1[0], a1[1]); cx.lineTo(b1[0], b1[1]); cx.lineTo(b0[0], b0[1]); cx.closePath();
      cx.fillStyle = `rgba(255,244,218,${(0.018 + 0.02 * ((i * 37) % 5) / 5) * L})`; cx.fill();
    }
    cx.restore();
    dx.save(); path(dx); dx.clip();
    for (const d of dust) { dx.fillStyle = `rgba(255,244,220,${d.a * L * (0.55 + 0.45 * Math.sin(d.p))})`; dx.beginPath(); dx.arc(d.x * w, d.y * h, d.r, 0, 6.283); dx.fill(); }
    dx.restore();
  }
  // the dust drifts and the beam wavers with the film, only while the lamp is lit, the section on screen, the tab seen
  function dustLoop(t: number) {
    dustRAF = 0;
    if (!s2.classList.contains('is-on') || !seen || document.hidden) return;
    const dt = Math.min(50, t - (lastT || t)); lastT = t;
    if (!RM()) for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.p += dt * 0.004; if (d.x < 0) d.x += 1; if (d.x > 1) d.x -= 1; if (d.y < 0) d.y += 0.9; if (d.y > 0.9) d.y -= 0.9; }
    drawBeam(RM() || !s2.classList.contains('playing') ? 1 : 0.9 + Math.random() * 0.14);
    if (!RM()) dustRAF = requestAnimationFrame(dustLoop);
  }
  const kickBeam = () => { if (!dustRAF) dustRAF = requestAnimationFrame(dustLoop); };
  // now and then one frame (42 ms) carries a speck or two, on the film and the card alike, as a real print does
  const fxDust = q<HTMLElement>('.wbp-fx-dust');
  let speckT = 0;
  function speck() {
    speckT = 0;
    if (!seen || RM() || document.hidden || !fxDust) return;
    if (s2.classList.contains('carded') || s2.classList.contains('playing')) {
      const n = 1 + (Math.random() < 0.35 ? 1 : 0);
      fxDust.style.background = Array.from({ length: n }, () => {
        const x = (6 + Math.random() * 88).toFixed(1), y = (6 + Math.random() * 88).toFixed(1), r = (0.7 + Math.random() * 1.1).toFixed(2);
        return `radial-gradient(circle at ${x}% ${y}%, rgba(238, 232, 216, .8) 0 ${r}px, transparent ${(+r + 0.7).toFixed(2)}px)`;
      }).join(', ');
      fxDust.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 42 });
    }
    speckT = window.setTimeout(speck, 350 + Math.random() * 1400);
  }
  const kickSpeck = () => { if (!speckT) speckT = window.setTimeout(speck, 350 + Math.random() * 1400); };

  function lampOn() {
    if (s2.classList.contains('is-on')) return;
    s2.classList.add('is-on');
    if (RM()) { beamLevel = 1; struck = true; drawBeam(); return; }
    for (const [ms, lv] of STRIKE) setTimeout(() => { beamLevel = lv; drawBeam(); }, ms);
    s2.classList.remove('lampup'); void s2.offsetWidth; s2.classList.add('lampup');
    setTimeout(() => s2.classList.remove('lampup'), 950);
    setTimeout(kickBeam, 380);
    setTimeout(() => { struck = true; if (filmMode && !started && inView && !document.hidden) play(); }, 250);
  }

  const io = new IntersectionObserver((es) => {
    const e = es[es.length - 1];
    const rb = e.rootBounds, cover = rb && rb.height ? e.intersectionRect.height / rb.height : 0;
    // on screen = at least 5 % of it (a listed threshold): at the top of a laptop page a 3 px sliver of it touches the
    // fold, and that must not keep the beam, the dust and the grain running
    seen = e.isIntersecting && e.intersectionRatio >= 0.05;
    s2.classList.toggle('is-seen', seen);
    if (e.isIntersecting && (e.intersectionRatio >= 0.6 || cover >= 0.6)) {
      inView = true;
      lampOn();
      if (filmMode && struck && !ended && film.paused && !holding && !document.hidden) play();
    } else if (!e.isIntersecting || (e.intersectionRatio < 0.3 && cover < 0.3)) {
      inView = false;
      if (!film.paused) film.pause();
      voice.pause();
    }
    if (seen) { kickBeam(); kickSpeck(); }
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
  io.observe(s2);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (!film.paused) film.pause(); voice.pause(); return; }
    if (inView && filmMode && struck && !ended && film.paused && !holding) play();
    kickBeam(); if (seen) kickSpeck();
  });

  /* ---------------- the F0 cut ---------------- */
  // forward: the last frame shivers, slips one frame up in the gate (the frame line rolls through), a splice flashes,
  // the card shivers and its exposure settles. Back (Watch again): the card slips up and away, the film's first frame
  // rolls in. Reduced motion: a plain cut. The animations are built paused and started two frames later, so the
  // expensive first frame lands while nothing moves.
  const sample = (fn: (t: number) => Keyframe, dur: number) => { const k: Keyframe[] = []; const N = Math.round(dur / 18); for (let i = 0; i <= N; i++) k.push({ offset: i / N, ...fn(dur * i / N) }); return k; };
  const anim = (el: Element, frames: Keyframe[], duration: number) => { const a = el.animate(frames, { duration, fill: 'both', easing: 'linear' }); anims.push(a); return a; };
  function cut(reverse: boolean) {
    clearAnims();
    const tok = ++cutTok;
    s2.classList.remove('carded');
    if (reverse) { s2.classList.add('is-film'); showCard(false); frame.classList.remove('show-still'); }
    else { const had = document.activeElement === tap; s2.classList.remove('is-film'); showCard(true); keyWords('again'); keepFocus(had); }
    const settle = () => { clearAnims(); s2.classList.remove('carding'); if (!reverse) s2.classList.add('carded'); };
    if (RM()) { settle(); return; }
    s2.classList.add('carding');
    const splice = q<HTMLElement>('.wbp-fx-splice'), scr = q<HTMLElement>('.wbp-fx-scratch');
    const step3 = (t: number, a: number, b: number) => (t < a ? 0 : t >= b ? 1 : Math.min(1, Math.floor((t - a) / ((b - a) / 3)) / 3 + 1 / 3)); // a frame-by-frame slip in 3 steps
    const outEl = reverse ? card : still, inEl = reverse ? film : card;
    const D0 = reverse ? 720 : 900, A = reverse ? 70 : 200, B = A + 130; // the slip runs A..B
    const shiver = (t: number) => (t < A - 110 || t >= A ? 0 : t < A - 55 ? -0.8 : 0.5); // a small shiver before it slips
    anim(outEl, sample((t) => ({ transform: `translateY(${(shiver(t) - 100 * step3(t, A, B)).toFixed(2)}%)` }), D0), D0);
    const settleY = (t: number) => (t < B ? 0 : t < B + 50 ? 0.7 : t < B + 100 ? -0.3 : 0);
    const expo = (t: number) => (t >= B && t < B + 42 ? 0.93 : 1); // one denser frame at the splice, as a new shot has
    const done = anim(inEl, sample((t) => ({ transform: `translateY(${(t < B ? 105 - 105 * step3(t, A, B) : settleY(t)).toFixed(2)}%)`, filter: `brightness(${expo(t)})` }), D0), D0);
    if (splice) anim(splice, sample((t) => ({ opacity: t >= B - 42 && t < B ? 0.12 : 0 }), D0), D0); // the splice: one faint frame
    if (scr) anim(scr, sample((t) => ({ opacity: t >= A - 42 && t < B + 84 ? (Math.floor(t / 42) % 2 ? 0.8 : 0.4) : 0,
      backgroundPosition: `${(Math.floor(t / 45) * 37) % 100}% 0, ${(Math.floor(t / 45) * 61) % 100}% 0, ${(Math.floor(t / 45) * 23) % 100}% 0` }), D0), D0);
    done.onfinish = () => { if (tok === cutTok) settle(); };
    for (const a of anims) a.pause();
    requestAnimationFrame(() => requestAnimationFrame(() => { if (tok === cutTok) for (const a of anims) a.play(); }));
  }
  // Watch again / Play the film: a deliberate act on the film, so it arms the voice; played inside the press (a phone in
  // Low Power Mode plays nothing outside one). Focus in the card goes to the sound key, never to <body>.
  again.addEventListener('click', () => {
    if (filmMode && !ended) return; // the film is the picture: the card is hidden and inert anyway
    arm(true);
    const inside = card.contains(document.activeElement);
    filmMode = true; ended = false;
    s2.classList.add('is-film');
    if (inside) tap.focus({ preventScroll: true });
    cut(true);
    try { film.currentTime = 0; } catch { /* no metadata yet: it starts at 0 */ }
    play();
    syncVoice();
  });

  /* ---------------- the voice ---------------- */
  let armed = false, soundOn = true, unlocked = false, blocked = false, rewound = false, starting = false, live = false, armedAt = -1e9;
  const audible = () => soundOn && armed && unlocked && !blocked;
  const tapWords = tap.querySelector('span');
  const paintTap = () => { const on = audible(); tap.setAttribute('aria-pressed', String(on)); if (tapWords) tapWords.textContent = (on ? tap.dataset.on : tap.dataset.off) ?? ''; };
  const voiceSrc = () => { if (!voice.getAttribute('src') && voice.dataset.src) voice.src = voice.dataset.src; };
  function syncVoice() {
    if (!armed || !soundOn || !running() || starting) return;
    voiceSrc();
    // the first start with the film past 1 s takes both back to the top, before the voice plays: nothing chases (one try)
    if (!rewound && film.currentTime > REWIND_AFTER) film.currentTime = 0;
    rewound = true;
    if (voice.duration && film.currentTime >= voice.duration) return;
    if (!voice.paused && voice.readyState >= 2 && Math.abs(voice.currentTime - film.currentTime) < 0.2) return; // with the picture
    // the voice's first start, with nothing to play yet (fetched only now, 0.2-0.5 s): the picture waits for it, or the
    // caption tick would pull it past its first words
    if (!unlocked && voice.readyState < 2 && !film.paused) { holding = true; film.pause(); holdT = window.setTimeout(release, HOLD_MAX); }
    voice.currentTime = film.currentTime;
    starting = true;
    voice.play().then(() => {
      starting = false;
      if (!running()) { voice.pause(); return; }
      unlocked = true; blocked = false; paintTap();
      release();
    }, (e: unknown) => { starting = false; release(); if ((e as Error)?.name === 'NotAllowedError') { blocked = true; paintTap(); } });
  }
  // the picture runs on (if it still may): the voice is playing, failed, was stopped, or is too slow to wait for
  function release() {
    clearTimeout(holdT);
    if (!holding) return;
    holding = false;
    if (filmMode && inView && !ended && !document.hidden) play();
    else { s2.classList.remove('playing'); voice.pause(); }
  }
  // the voice really sounding (not loading or seeking yet): only then does the caption tick pull it back to the picture
  voice.addEventListener('playing', () => { live = true; });
  for (const ev of ['pause', 'waiting', 'emptied']) voice.addEventListener(ev, () => { live = false; });
  // inside the arming act: the voice for real if the film runs, else played and stopped at once (its first 0.15 s is
  // silence), which is what lets a phone play it later without another touch
  function unlock() {
    if (running()) { syncVoice(); return; }
    voiceSrc();
    voice.currentTime = 0;
    voice.play().then(() => {
      if (!running() || !soundOn) { voice.pause(); voice.currentTime = 0; }
      unlocked = true; blocked = false; paintTap();
      if (running()) syncVoice();
    }, () => { /* refused: the key still says Tap for sound */ });
  }
  function arm(quiet = false) {
    if (armed) return;
    armed = true; armedAt = performance.now();
    if (soundOn && !quiet) unlock();
  }
  // the qualifying acts, on the page only; never a key press, never inside a gate or on a link or the Buy key
  const GATE = '[data-wbp-ask], form, input, select, textarea, label, a, [data-add-to-cart]';
  let touchAt: [number, number] | null = null, touchMoved = false;
  page.addEventListener('touchstart', (e) => { const t = e.touches[0]; touchAt = t ? [t.clientX, t.clientY] : null; touchMoved = false; }, { capture: true, passive: true });
  page.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (touchAt && t && Math.hypot(t.clientX - touchAt[0], t.clientY - touchAt[1]) > 10) touchMoved = true; }, { capture: true, passive: true });
  const onAct = (e: Event) => {
    if (armed) return;
    const t = e.target as Element | null;
    if (!t || typeof t.closest !== 'function' || t.closest(GATE)) return;
    if (e.type === 'pointerdown' && (e as PointerEvent).pointerType !== 'mouse') return;
    if (e.type === 'pointerup' && (e as PointerEvent).pointerType === 'mouse') return;
    if (e.type === 'click' && (e as MouseEvent).detail === 0) return; // a click from a key (Enter, Space) or a script
    if (e.type === 'touchend' && touchMoved) return; // the end of a scroll
    arm();
  };
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click']) page.addEventListener(ev, onAct, { capture: true, passive: true });

  tap.addEventListener('click', () => {
    // the press of this same key already armed and started the voice (its click comes a moment later): keep it on
    if (audible() && performance.now() - armedAt < SAME_PRESS) return;
    if (audible()) { soundOn = false; voice.pause(); paintTap(); return; }
    soundOn = true; blocked = false;
    if (!armed) arm();
    else unlock();
    paintTap();
  });
  // a click on the picture turns the sound on; on a touch screen (a phone, upright or on its side) a second tap turns it
  // off again, as on any phone video. Not a width test: a phone on its side is 844 px wide.
  const touch = matchMedia('(hover: none) and (pointer: coarse)');
  frame.addEventListener('click', (e) => {
    if (!filmMode || s2.classList.contains('carding')) return;
    if ((e.target as Element).closest('button, a, input, form, [data-wbp-card]')) return;
    if (audible() && !touch.matches) return;
    tap.click();
  });
  paintTap();

  /* ---------------- captions; the same tick keeps the voice within 0.2 s of the picture ---------------- */
  let capIdx = -2, capRAF = 0;
  function capTick() {
    capRAF = 0;
    const t = film.currentTime, i = ended || !filmMode ? -1 : cues.findIndex((c) => t >= c[0] && t < c[1]);
    if (i !== capIdx) {
      capIdx = i;
      if (i >= 0) { cap.replaceChildren(...cues[i][2].flatMap((line, k) => (k ? [document.createElement('br'), line] : [line]))); cap.classList.add('on'); }
      else cap.classList.remove('on');
    }
    if (live && !voice.seeking && armed && soundOn && !film.paused && !voice.paused && voice.duration && t < voice.duration - 0.15 && Math.abs(voice.currentTime - t) > 0.2) voice.currentTime = t;
    if (!film.paused && !capRAF) capRAF = requestAnimationFrame(capTick);
  }
  function capKick() { if (!capRAF) capTick(); }

  /* ---------------- layout ---------------- */
  let ctx: CanvasRenderingContext2D | null = null;
  function layout() {
    // the card's own height at this width, plus the room its status line needs for the longest message
    const st = card.querySelector<HTMLElement>('[data-wbp-status]');
    frame.style.minHeight = '';
    card.style.alignSelf = 'start';
    let need = card.offsetHeight;
    card.style.alignSelf = '';
    if (st && st.clientWidth) {
      const cs = getComputedStyle(st), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.35;
      ctx ??= document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.font = `italic ${cs.fontSize} ${cs.fontFamily}`;
        const lines = Math.ceil(ctx.measureText(LONGEST).width / st.clientWidth);
        need += Math.max(0, lines - Math.round(st.offsetHeight / lh)) * lh;
      }
    }
    frame.style.minHeight = Math.ceil(need) + 'px';
    // a phone: the bands above and below the 16:9 picture in a frame as tall as the card
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const va = film.videoWidth && film.videoHeight ? film.videoHeight / film.videoWidth : 9 / 16;
    const pich = Math.min(fh, fw * va), band = (fh - pich) / 2;
    s2.classList.toggle('lbox', band >= 56);
    s2.style.setProperty('--wbp-pich', Math.round(pich) + 'px');
    s2.style.setProperty('--wbp-band', Math.round(band) + 'px');
    s2.style.setProperty('--wbp-ftop', frame.offsetTop + 'px');
    s2.style.setProperty('--wbp-fside', frame.offsetLeft + 'px');
    const sr = s2.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    geo = { w: s2.clientWidth, h: s2.clientHeight, fx: fr.left - sr.left, fy: fr.top - sr.top, fw: fr.width, fh: fr.height };
    drawBeam();
    mark();
  }
  let resizeRAF = 0;
  const relayout = () => { if (!resizeRAF) resizeRAF = requestAnimationFrame(() => { resizeRAF = 0; layout(); }); };
  addEventListener('resize', relayout);
  // the card grows on its own (the done box): the frame grows with it, the beam and the bands follow
  new ResizeObserver(relayout).observe(card);

  /* ---------------- the cookie banner's lift keeps the visitor's place ---------------- */
  // On a phone the lift (lift.ts, --wbp-lift on <html>) pads section 1's foot and this section's: when the banner goes,
  // the page above the film gets 130 px shorter and the film slid up under the nav (the browser's scroll anchoring,
  // on section 1's bottom-anchored film, even made it 200 px). The frame stays where it was on the screen; a smooth
  // scroll on its way (the cue, a #manual link: Lenis) is sent again to where its target is now.
  const html = document.documentElement;
  let liftV = html.style.getPropertyValue('--wbp-lift'), frameDoc = 0, lastY = scrollY;
  let aimed: HTMLElement | null = null, aimedAt = -1e9;
  let vw = innerWidth, vh = innerHeight;
  function mark() { lastY = scrollY; frameDoc = frame.getBoundingClientRect().top + lastY; vw = innerWidth; vh = innerHeight; }
  addEventListener('scroll', () => { lastY = scrollY; }, { passive: true });
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
    if (a && a.hash.length > 1) { aimed = document.getElementById(decodeURIComponent(a.hash.slice(1))); aimedAt = performance.now(); }
  }, true);
  function keepPlace() {
    const v = html.style.getPropertyValue('--wbp-lift');
    if (v === liftV) return;
    liftV = v;
    const was = frameDoc - lastY, doc0 = frameDoc; // the frame's top on the screen, and on the page, before the change
    const turned = innerWidth !== vw || innerHeight !== vh; // a resize or a turn moved it too: not the banner's doing
    mark();
    if (turned) return;
    if (Math.abs(frameDoc - doc0) < 1) return; // a laptop: the lift moves nothing above the film
    if (lenis?.isSmooth) {
      // from the real scroll: the browser's anchoring may just have moved it under Lenis (which would aim from its own)
      if (aimed && performance.now() - aimedAt < 2000) {
        const px = (v: string) => parseFloat(v) || 0;
        const to = aimed.getBoundingClientRect().top + scrollY - px(getComputedStyle(aimed).scrollMarginTop) - px(getComputedStyle(html).scrollPaddingTop);
        lenis.scrollTo(Math.round(to), typeof lenis.options.anchors === 'object' ? lenis.options.anchors : undefined);
      }
    } else if (was < innerHeight) {
      window.scrollTo(0, frameDoc - was);
      mark();
    }
  }
  // the lift also moves the stage on a phone with no resize: the beam follows
  new MutationObserver(() => { keepPlace(); relayout(); }).observe(html, { attributes: true, attributeFilter: ['style'] });
  document.fonts?.ready.then(layout);
  layout();
}
