import { getPan, onPan, panWords, setHand, setPan } from './bus';

/**
 * The hero steering wheel = PAN. Ported from Drift/Source/ui/public/index.html
 * (the "steering wheel (PAN)" block), v2.16.0 SPORTS feel, constants verbatim:
 *   - rotary atan2 drag, 1:1 — 270 deg of wheel = hard L .. hard R (Shift = fine)
 *   - release with motion -> coasts under Coulomb 260 deg/s^2 + viscous 2.2/s,
 *     rails at +/-135 deg with a 0.15 bounce, then STAYS (no self-centering)
 *   - double-click snaps to centre
 * Plus what a web page needs: arrow keys / Home (it is a real ARIA slider),
 * touch-action pan-y so a vertical swipe still scrolls the page, and an
 * alpha hit test so the empty space between the spokes never grabs.
 * The light never rotates: .d-wlight rides the art (its mask is the wheel),
 * .d-wlfix counter-rotates so the key stays upper-left.
 */
const FR_C = 260;
const FR_K = 2.2;
const FLICK = 1.0;
const BOUNCE = 0.15;

export function initWheel(root: HTMLElement): void {
  const w = root.querySelector<HTMLElement>('[data-drift-wheel]');
  if (!w) return;
  const ind = w.querySelector<HTMLElement>('.d-wheel-ind')!;
  const wl = w.querySelector<HTMLElement>('.d-wlight');
  const wlf = wl?.firstElementChild as HTMLElement | null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Phone (A5, Dan 10-04): the wheel is 2.15x the screen with the offer in its window. It is display
  // only (no drag, the page always scrolls) and the art sways at 20/135 of the angle, so the car still
  // drives it but the spokes never sweep the form; capped at ±10° so the price printed on the rim
  // never leaves the screen (the car's usual sway is ~±8°, untouched). The value (pan, ARIA) is unchanged.
  const phoneMq = matchMedia('(max-width: 600px)');   // one list, .matches read at event time (this runs every frame)
  const phone = () => phoneMq.matches;
  const SWAY = 20 / 135, SWAY_MAX = 10;
  const spin = (deg: number) => {
    if (phone()) deg = Math.max(-SWAY_MAX, Math.min(SWAY_MAX, deg * SWAY));
    ind.style.transform = `rotate(${deg}deg)`;
    if (wl && wlf) {
      wl.style.transform = `rotate(${deg}deg)`;
      wlf.style.transform = `rotate(${-deg}deg)`;
    }
  };

  let v = 0.5; // normalised 0..1, like the plugin's slider state
  const aria = () => {
    const p = v * 2 - 1;
    w.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    w.setAttribute('aria-valuetext', panWords(p));
  };
  // Phone (H6, 10-02): the TRACKS car turns the wheel every frame; VoiceOver
  // only needs its value about twice a second (plus once on focus). The art
  // still turns every frame; a hand or a key writes the value at once.
  const ARIA_EVERY = 500;
  let ariaT = -Infinity, ariaTimer = 0;
  const ariaSoon = () => {
    const now = performance.now();
    if (now - ariaT >= ARIA_EVERY) { ariaT = now; aria(); return; }
    if (!ariaTimer) ariaTimer = window.setTimeout(() => { ariaTimer = 0; ariaT = performance.now(); aria(); }, ARIA_EVERY - (now - ariaT));
  };
  const draw = (n: number, throttled = false) => {
    v = Math.max(0, Math.min(1, n));
    spin(-135 + 270 * v);
    if (throttled) ariaSoon(); else aria();
  };
  w.addEventListener('focus', aria);
  const commit = (n: number) => { draw(n); setPan(v * 2 - 1, 'wheel'); };

  // --- alpha-aware hit test (the sprite is round with big transparent gaps) --
  const N = 160;
  let alpha: Uint8ClampedArray | null = null;
  const img = w.querySelector<HTMLImageElement>('.d-wheel-img');
  const grab = () => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = N;
      const g = c.getContext('2d', { willReadFrequently: true })!;
      g.drawImage(img!, 0, 0, N, N);
      alpha = g.getImageData(0, 0, N, N).data;
    } catch { alpha = null; }
  };
  if (img) { if (img.complete && img.naturalWidth) grab(); else img.addEventListener('load', grab, { once: true }); }
  const onArt = (e: PointerEvent | MouseEvent) => {
    if (!alpha) return true;
    const r = w.getBoundingClientRect();
    const rad = (-(v - 0.5) * 270 * Math.PI) / 180;
    const cs = Math.cos(rad), sn = Math.sin(rad);
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    const ux = dx * cs - dy * sn + 0.5, uy = dx * sn + dy * cs + 0.5;
    const gx = Math.floor(ux * N), gy = Math.floor(uy * N);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const x = gx + ox, y = gy + oy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      if (alpha[((y * N + x) << 2) + 3] > 40) return true;
    }
    return false;
  };

  // --- SPORTS coast ----------------------------------------------------------
  let omega = 0, raf = 0, coastT = 0, coasting = false, dragging = false;
  let lastAng: number | null = null;
  const trail: [number, number][] = [];
  const stopCoast = () => { if (raf) cancelAnimationFrame(raf); raf = 0; omega = 0; coasting = false; };
  const coastStep = (t: number) => {
    const dt = Math.min(0.05, (t - coastT) / 1000);
    coastT = t;
    const dec = (FR_C * Math.sign(omega) + FR_K * omega) * dt;
    if (Math.abs(dec) >= Math.abs(omega)) omega = 0; else omega -= dec;
    let deg = (v - 0.5) * 270 + omega * dt;
    if (deg > 135) { deg = 135; omega = Math.abs(omega) > 60 ? -omega * BOUNCE : 0; }
    else if (deg < -135) { deg = -135; omega = Math.abs(omega) > 60 ? -omega * BOUNCE : 0; }
    commit(deg / 270 + 0.5);
    if (Math.abs(omega) < 6) { omega = 0; raf = 0; coasting = false; setHand(false); }
    else raf = requestAnimationFrame(coastStep);
  };

  const angOf = (e: PointerEvent) => {
    const r = w.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    return dx * dx + dy * dy < 64 ? null : (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    const a = angOf(e);
    if (a === null) return;
    if (lastAng !== null) {
      let d = a - lastAng;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      commit(v + d / (e.shiftKey ? 2700 : 270));
      const now = performance.now();
      trail.push([now, (v - 0.5) * 270]);
      while (trail.length && now - trail[0][0] > 90) trail.shift();
    }
    lastAng = a;
  };
  const end = () => {
    if (!dragging) return;
    dragging = false;
    w.classList.remove('is-held');
    const now = performance.now();
    while (trail.length && now - trail[0][0] > 90) trail.shift();
    omega = 0;
    if (trail.length >= 2) {
      const t0 = trail[0], t1 = trail[trail.length - 1], dt = (t1[0] - t0[0]) / 1000;
      if (dt > 0.008) {
        omega = Math.max(-1600, Math.min(1600, ((t1[1] - t0[1]) / dt) * FLICK));
        if (Math.abs(omega) < 30) omega = 0;
      }
    }
    if (!reduce && Math.abs(omega) >= 30) { coasting = true; coastT = performance.now(); raf = requestAnimationFrame(coastStep); }
    else setHand(false);
  };
  w.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || phone() || !onArt(e)) return;
    stopCoast();
    trail.length = 0;
    lastAng = angOf(e);
    dragging = true;
    setHand(true);
    w.classList.add('is-held');
    w.setPointerCapture(e.pointerId);
  });
  w.addEventListener('pointermove', move);
  w.addEventListener('pointerup', end);
  // Phone (H1, 10-02): a cancel is the browser taking the gesture for a page
  // scroll (touch-action pan-y), not a flick: drop the trail so end() finds
  // omega 0, no coast, and lets go of the hand. pointerup is unchanged.
  w.addEventListener('pointercancel', () => { if (phone()) trail.length = 0; end(); });
  w.addEventListener('dblclick', (e) => { if (phone() || !onArt(e)) return; stopCoast(); commit(0.5); });
  w.addEventListener('keydown', (e) => {
    const step = (e.shiftKey ? 0.01 : 0.05) / 2;   // pan units -> normalised
    let n: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = v - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = v + step;
    else if (e.key === 'PageDown') n = v - 0.1;
    else if (e.key === 'PageUp') n = v + 0.1;
    else if (e.key === 'Home') n = 0.5;
    else if (e.key === 'End') n = v < 0.5 ? 0 : 1;
    if (n === null) return;
    e.preventDefault();
    stopCoast();
    commit(n);
  });

  // other writers (demo deck, TRACKS) turn the art; the hand always wins, and
  // the TRACKS car waits while it holds (bus.setHand)
  onPan((p, source) => { if (source === 'wheel' || dragging || coasting) return; draw((p + 1) / 2, phone()); });
  draw((getPan() + 1) / 2);

  initNeedles(root);
}

/**
 * Display-only gauges, like the plugin's gauge engine (never writes the pan):
 * the tacho revs with how fast the car is being steered, SPEED follows it
 * slower, TEMP holds. One rAF loop that stops as soon as the needles settle.
 */
function initNeedles(root: HTMLElement): void {
  const needles = Array.from(root.querySelectorAll<HTMLElement>('[data-needle]')).map((el) => ({
    el,
    kind: el.dataset.needle!,
    a0: Number(el.dataset.a0 ?? -120),
    a1: Number(el.dataset.a1 ?? 120),
    val: Number(el.dataset.rest ?? 0.1),
    rest: Number(el.dataset.rest ?? 0.1),
  }));
  if (!needles.length || matchMedia('(max-width: 600px)').matches) return;   // phone (A5): no gauges
  const put = (n: (typeof needles)[number]) => { n.el.style.transform = `rotate(${n.a0 + (n.a1 - n.a0) * n.val}deg)`; };
  needles.forEach(put);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let lastP = getPan(), lastT = performance.now(), drive = 0, raf = 0, prev = performance.now();
  onPan((p) => {
    const now = performance.now();
    const dt = Math.max(0.008, (now - lastT) / 1000);
    const speed = Math.abs(p - lastP) / dt;            // pan units per second
    drive = Math.max(drive, Math.min(1, speed / 2.2));
    lastP = p; lastT = now;
    if (!raf) { prev = now; raf = requestAnimationFrame(tick); }
  });
  function tick(t: number) {
    const dt = Math.min(0.05, (t - prev) / 1000);
    prev = t;
    drive *= Math.exp(-dt / 0.6);                      // throttle released: RPM falls back to idle
    let moving = drive > 0.004;
    for (const n of needles) {
      const target = n.kind === 'temp' ? n.rest : n.rest + (n.kind === 'tacho' ? 0.75 : 0.55) * drive;
      const tau = target > n.val ? 0.08 : 0.35;          // fast attack, slow release
      n.val += (target - n.val) * (1 - Math.exp(-dt / tau));
      if (Math.abs(target - n.val) > 0.002) moving = true;
      put(n);
    }
    raf = moving ? requestAnimationFrame(tick) : 0;
  }
}
