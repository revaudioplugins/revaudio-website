/* The DRIFT panel of the homepage word wall (WordWall.astro): what moves, and why.

   Looks come from the panel's data-ww-look ('current' | 'neon' | 'steer' | 'both'), read live on every gesture so
   the dev bench (/__wwbench) can switch them. Tunables are the panel's --ww-* custom properties, read with
   getComputedStyle when a gesture or entrance starts (defaults live in WordWall.astro's style block).

   Motion is feedback only (design-language §3):
   - NEON power-on: the lit tube stutters on (CSS keyframes, 600 ms) the first time the panel is shown, i.e. it
     answers "the sign just came on". Only JS ever arms the unlit state, so no JS / reduced motion = lit at rest.
   - STEER, mouse: pointer X over the wall is the wheel. Each word is its own damped spring (semi-implicit Euler,
     240 Hz substeps); the lower the word, the heavier (low bands lag the highs). SLIDING travels furthest, leans
     with its speed and leaves a skid smear that fades in ~1.2 s. rAF runs only while something moves.
   - STEER, touch (no hover): one drift-in entrance when the panel is first shown.
   - The window video plays only while the DRIFT panel is the active one AND on screen AND the tab is visible.
   Reduced motion: none of it (lit, still, poster). html.hc: plain words (CSS) and no physics.

   The reveal lib owns the <li> (opacity/transform); everything here writes to the inner spans only.
   Bench hooks (both harmless in production): a 'ww:replay' event on the panel replays the power-on (+ the touch
   entrance), and data-ww-input="touch" | "pointer" on the panel overrides the input-mode media query. */

type Look = 'current' | 'neon' | 'steer' | 'both';

const SUBSTEP = 1 / 240; // physics step, s
const MAX_DT = 0.1; // s per frame at most: real time down to 10 fps, no explosion after a hidden tab
const SKID_TAU = 0.4; // skid fade time constant, s (~1.2 s to 5 %)
const SKID_MIN_SPEED = 40; // px/s before rubber marks
const SKID_PX = 60; // px of fast slide that lays a full-strength mark
const MAX_LEAN = 6; // deg
const EDGE = 4; // px kept clear of the wall's own edge
const GAP = 14; // px kept clear of the window and the kana tube
const STAGGER_MS = 70; // = the reveal group's data-stagger

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function initDriftWall(panel: HTMLElement): void {
  const wall = panel.closest<HTMLElement>('.ww') ?? panel; // the steering range: the wall's content box
  const section = panel.closest<HTMLElement>('section') ?? wall;
  const list = panel.querySelector<HTMLElement>('.ww-list');
  const words = Array.from(panel.querySelectorAll<HTMLElement>('.ww-word'));
  if (!list || !words.length) return;
  const items = words.map((w) => w.parentElement as HTMLElement);
  const spills = items.map((li) => li.querySelector<HTMLElement>('.ww-spill'));
  const hot = Math.max(0, words.findIndex((w) => w.classList.contains('is-hot')));
  const skid = items[hot].querySelector<HTMLElement>('.ww-skid');
  const ui = panel.querySelector<HTMLElement>('.ww-ui');
  const kana = panel.querySelector<HTMLElement>('.ww-kana');
  // the screen wall's broken-TV frame (WordWall DRIFT_FRAME): its opening is the steering range's edge
  const frameGlass = wall.querySelector<HTMLElement>('.ww-frame-glass');
  const framed = () =>
    panel.dataset.wwBg === 'screen' && !!panel.dataset.wwFrame && panel.dataset.wwFrame !== 'rails' && look() !== 'current';
  const video = panel.querySelector<HTMLVideoElement>('video[data-ww-run]');

  const mq = (q: string) => window.matchMedia(q).matches;
  const reduced = () => mq('(prefers-reduced-motion: reduce)');
  const hc = () => document.documentElement.classList.contains('hc');
  const look = () => (panel.dataset.wwLook ?? 'current') as Look;
  const steerLook = () => look() === 'steer' || look() === 'both';
  const neonLook = () => look() === 'neon' || look() === 'both';
  const active = () => panel.classList.contains('is-active');
  const mouseMode = () =>
    panel.dataset.wwInput ? panel.dataset.wwInput === 'pointer' : mq('(hover: hover) and (pointer: fine)');
  const physicsOk = () => steerLook() && !reduced() && !hc();

  /* ── NEON power-on ─────────────────────────────────────────────────────── */
  let powerTimer = 0;
  if (!reduced()) panel.dataset.wwPower = 'armed'; // the sign starts off; first sight turns it on
  const powerOn = (delay: number) => {
    window.clearTimeout(powerTimer);
    if (reduced()) {
      panel.dataset.wwPower = 'on';
      return;
    }
    powerTimer = window.setTimeout(() => {
      panel.dataset.wwPower = 'armed';
      void panel.offsetWidth; // restart the keyframes on a replay
      panel.dataset.wwPower = 'powering';
      powerTimer = window.setTimeout(() => (panel.dataset.wwPower = 'on'), 650);
    }, delay);
  };

  /* ── STEER springs ─────────────────────────────────────────────────────── */
  const n = words.length;
  const x = new Float64Array(n); // offset from home, px
  const v = new Float64Array(n); // px/s
  const tgt = new Float64Array(n);
  const lo = new Float64Array(n); // travel limits (lo <= 0 <= hi)
  const hi = new Float64Array(n);
  const startAt = new Float64Array(n);
  // SLIDING (the hot word) travels furthest, the outer words least
  const reach = words.map((_, i) => Math.max(0.25, 1 - 0.29 * Math.abs(i - hot)));
  // -1 top (lightest, quickest) ... +1 bottom (heaviest, laziest)
  const heft = words.map((_, i) => (n > 1 ? (2 * i) / (n - 1) - 1 : 0));

  type Params = { travel: number; k: number; damp: number; spread: number; skew: number; skid: number; entry: number };
  const params = (): Params => {
    const cs = getComputedStyle(panel);
    const num = (name: string, d: number) => {
      const f = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(f) ? f : d;
    };
    return {
      travel: Math.max(0, num('--ww-steer-travel', 56)),
      k: Math.max(1, num('--ww-steer-k', 140)),
      damp: clamp(num('--ww-steer-damp', 0.6), 0.05, 3),
      spread: clamp(num('--ww-steer-spread', 0.6), 0, 1.5),
      skew: num('--ww-steer-skew', 0.8),
      skid: clamp(num('--ww-skid', 0.6), 0, 1),
      entry: Math.max(0, num('--ww-steer-entry', 140)),
    };
  };
  let P = params();

  /* Travel limits from the boxes the reveal isn't moving: a word stays inside the wall, and never reaches the
     window or the kana tube when they sit beside it (desktop two-column; on the phone the window is below). */
  const measure = () => {
    const box = wall.getBoundingClientRect();
    let minLeft = Math.max(box.left, 0) + EDGE;
    let maxRight = Math.min(box.right, document.documentElement.clientWidth) - EDGE;
    const g = framed() && frameGlass ? frameGlass.getBoundingClientRect() : null;
    if (g && g.width > 0) { // a word never slides under the TV's bezel
      minLeft = Math.max(minLeft, g.left + EDGE);
      maxRight = Math.min(maxRight, g.right - EDGE);
    }
    const blocks = [ui, neonLook() ? kana : null]
      .filter((el): el is HTMLElement => !!el)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
    items.forEach((li, i) => {
      const r = li.getBoundingClientRect(); // the item hugs its word: = the word's home box
      let right = maxRight;
      for (const b of blocks) {
        if (b.bottom > r.top && b.top < r.bottom && b.left >= r.right - 1) right = Math.min(right, b.left - GAP);
      }
      lo[i] = -Math.max(0, r.left - minLeft);
      hi[i] = Math.max(0, right - r.right);
      if (i === hot) skidW = Math.max(1, r.width);
    });
    // one travel per side, cut to the tightest word, so every word keeps its share (SLIDING still slides furthest)
    travelL = travelR = P.travel;
    for (let i = 0; i < n; i++) {
      travelL = Math.min(travelL, -lo[i] / reach[i]);
      travelR = Math.min(travelR, hi[i] / reach[i]);
    }
  };

  let travelL = 0;
  let travelR = 0;
  let raf = 0;
  let last = 0;
  let entering = false;
  let skidE = 0; // rubber laid down, 0..1
  let skidTail = 0; // where the mark starts (chases the word slowly) ...
  let skidHead = 0; // ... and where it ends (the word, while it slides)
  let skidW = 1; // SLIDING's width, px
  let measured = false;

  const lean = () => clamp((v[hot] / 100) * P.skew, -MAX_LEAN, MAX_LEAN);
  const render = () => {
    for (let i = 0; i < n; i++) {
      const sk = i === hot ? lean() : 0;
      const still = Math.abs(x[i]) < 0.01 && Math.abs(sk) < 0.01;
      words[i].style.transform = still
        ? ''
        : `translate3d(${x[i].toFixed(2)}px,0,0)${sk ? ` skewX(${sk.toFixed(2)}deg)` : ''}`;
      const sp = spills[i];
      if (sp) sp.style.transform = Math.abs(x[i]) < 0.01 ? '' : `translate3d(${x[i].toFixed(2)}px,0,0)`;
    }
    if (skid) {
      // the ghost of SLIDING stretched over the stretch of wall it slid along
      const on = skidE > 0.004;
      const from = Math.min(skidTail, skidHead);
      const stretch = 1 + Math.abs(skidHead - skidTail) / skidW;
      skid.style.opacity = on ? (skidE * P.skid).toFixed(3) : '';
      skid.style.transform = on ? `translate3d(${from.toFixed(2)}px,0,0) scaleX(${stretch.toFixed(4)})` : '';
    }
  };
  const setWillChange = (on: boolean) => {
    words.forEach((w) => (w.style.willChange = on ? 'transform' : ''));
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    entering = false;
    setWillChange(false);
  };
  const reset = () => {
    stop();
    x.fill(0);
    v.fill(0);
    tgt.fill(0);
    skidE = 0;
    measured = false;
    render();
  };

  const step = (now: number) => {
    raf = 0;
    if (!physicsOk() || !active()) {
      reset();
      return;
    }
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    const subs = Math.max(1, Math.ceil(dt / SUBSTEP));
    const h = dt / subs;
    let busy = false;
    for (let i = 0; i < n; i++) {
      if (entering && now < startAt[i]) {
        busy = true;
        continue;
      }
      const m = Math.max(0.2, 1 + P.spread * 0.6 * heft[i]);
      const c = 2 * P.damp * Math.sqrt(P.k * m);
      for (let s = 0; s < subs; s++) {
        const a = (P.k * (tgt[i] - x[i]) - c * v[i]) / m;
        v[i] += a * h;
        x[i] += v[i] * h;
      }
      // hard stops: a word never crosses its limit (on the touch entrance it may still arrive from off the side)
      if (x[i] > hi[i]) {
        x[i] = hi[i];
        if (v[i] > 0) v[i] = 0;
      }
      if (!entering && x[i] < lo[i]) {
        x[i] = lo[i];
        if (v[i] < 0) v[i] = 0;
      }
      if (Math.abs(x[i] - tgt[i]) > 0.05 || Math.abs(v[i]) > 0.5) busy = true;
      else {
        x[i] = tgt[i]; // settled: land exactly (home = no transform at all)
        v[i] = 0;
      }
    }
    // burnt rubber: builds while SLIDING slides fast, stays where it slid, fades
    const speed = Math.abs(v[hot]);
    if (speed > SKID_MIN_SPEED && P.skid > 0) {
      if (skidE < 0.02) skidTail = x[hot]; // a fresh mark starts under the word
      skidHead = x[hot];
      skidTail += (skidHead - skidTail) * Math.min(1, dt * 2.5); // the mark is the last ~0.4 s of the slide
      skidE = Math.min(1, skidE + (speed * dt) / SKID_PX);
    }
    skidE *= Math.exp(-dt / SKID_TAU);
    if (skidE > 0.004) busy = true;
    else skidE = 0;
    render();
    if (busy) raf = requestAnimationFrame(step);
    else stop();
  };
  const kick = () => {
    if (raf) return;
    last = performance.now();
    setWillChange(true);
    raf = requestAnimationFrame(step);
  };

  // mouse: the hand is the wheel
  section.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || !mouseMode() || !physicsOk() || !active()) return;
    if (!measured) {
      P = params(); // gesture start: the bench may have changed the numbers
      measure();
      measured = true;
    }
    const r = wall.getBoundingClientRect();
    const u = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
    const travel = u < 0 ? travelL : travelR;
    for (let i = 0; i < n; i++) tgt[i] = clamp(u * travel * reach[i], lo[i], hi[i]);
    entering = false;
    kick();
  });
  section.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    measured = false;
    tgt.fill(0);
    if (x.some((xi) => xi !== 0) || raf) kick();
  });
  window.addEventListener('resize', () => {
    measured = false;
    if (!raf && x.some((xi) => xi !== 0)) reset();
  });

  // touch: one drift-in from the side, over-shooting and settling
  const entrance = () => {
    if (!physicsOk() || !active()) return;
    stop();
    P = params();
    measure();
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      x[i] = -P.entry * (0.7 + 0.3 * reach[i]);
      v[i] = 0;
      tgt[i] = 0;
      startAt[i] = now + i * STAGGER_MS;
    }
    skidE = 0;
    entering = true;
    render();
    kick();
  };

  /* ── first sight ───────────────────────────────────────────────────────── */
  let shown = false;
  let wordsInView = false;
  const firstShow = (viaSwap: boolean) => {
    if (shown || !wordsInView || !active()) return;
    shown = true;
    powerOn(viaSwap ? 260 : 380); // after the panel's crossfade / the SLIDING item's reveal has landed
    if (!mouseMode()) entrance();
  };
  // same line as the reveal lib's trigger (top 80%), so the entrance rides the item reveal
  new IntersectionObserver(
    ([e]) => {
      wordsInView = e.isIntersecting;
      firstShow(false);
    },
    { rootMargin: '0px 0px -20% 0px' },
  ).observe(list);

  panel.addEventListener('ww:replay', () => {
    powerOn(0);
    if (!mouseMode()) entrance();
  });

  /* ── the live window ───────────────────────────────────────────────────── */
  let videoInView = false;
  const syncVideo = () => {
    if (!video || reduced()) return; // reduced motion: the poster, never the run
    const live = videoInView && active() && !document.hidden;
    if (live) video.play().catch(() => {}); // autoplay refused = the poster stays, nothing breaks
    else if (!video.paused) video.pause();
  };
  if (video) {
    new IntersectionObserver(
      ([e]) => {
        videoInView = e.isIntersecting;
        syncVideo();
      },
      { threshold: 0.25 },
    ).observe(video);
    document.addEventListener('visibilitychange', syncVideo);
  }

  // the carousel (or the bench) swaps panels / looks: follow it
  new MutationObserver(() => {
    if (active()) firstShow(true);
    else reset();
    if (!physicsOk()) reset();
    syncVideo();
  }).observe(panel, { attributes: true, attributeFilter: ['class', 'data-ww-look'] });
}
