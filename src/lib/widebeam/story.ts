/**
 * #wb-story: "the stereo road". A mix laid out on a road seen from the driver's seat: pan runs across, frequency runs
 * away from you (bass at the bumper, air at the horizon). Scrolling the six steps moves one control each, on the
 * story's own copy of the parameters (it never touches the face the visitor set):
 * WIDTH · LOW FOCUS · HIGH BEAM · TILT · MONO / CORRELATION · CRUISE.
 *
 * The road is the plugin's own window (parts.css .wb-part-road): the canvas draws over its night-road photo, matched to
 * the photo's perspective (vanishing point measured on road.webp: x .498, y .408 of the glass; the road's half width
 * reaches .51 of the glass at its bottom edge). The needle is the panel meter's (--wb-needle = correlation x 50deg).
 *
 * One line lights a step: the step whose box holds it is the lit one. On a laptop (two columns) the line is the middle of
 * the screen under the nav; on an upright phone it is the middle of the free area under the sticky stage, and every step
 * is exactly that area's height (--wb-story-free), so a lit step's text is whole on screen for most of its scroll
 * (mobile-02). Each step carries a [data-step-mark], placed so that driveTo(mark, { align: 'top' }) lands the page on the
 * middle of that step's lit range: the Owner's Manual chapters use it (manual.ts).
 *
 * Reduced motion: no loop at all. Each step is one still (its end state), drawn on a step change, a resize and once the
 * fonts are in (motion-08, a11y-09). Otherwise the drawn values ease across step edges like the sources do (motion-16).
 */
import { ScrollTrigger, reducedMotion } from '../motion';
import { beamAmount, cruise, widthGain, DEFAULTS, type WbParams } from './audio';
// the live nav height (--site-nav-h: 58 px on an upright phone, 41 on a laptop), the one driveTo lands a mark under:
// the static --nav-h (44) put every chapter landing 14 px off its step's middle on a phone
import { navH } from './drive-to';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

// pan -1..1, frequency (Hz), size, mono = a source with no side of its own
const SRC = [
  { n: 'KICK', pan: 0, f: 55, r: 26, c: '#f2c879', mono: true },
  { n: 'BASS', pan: -0.22, f: 80, r: 18, c: '#e6a85a', mono: false },
  { n: 'BASS', pan: 0.22, f: 80, r: 18, c: '#e6a85a', mono: false },
  { n: 'SNARE', pan: 0, f: 260, r: 16, c: '#efe1c0', mono: true },
  { n: 'VOCAL', pan: 0, f: 900, r: 22, c: '#fff1cb', mono: true },
  { n: 'GTR L', pan: -0.42, f: 600, r: 15, c: '#c9a35c', mono: false },
  { n: 'GTR R', pan: 0.42, f: 600, r: 15, c: '#c9a35c', mono: false },
  { n: 'PAD', pan: -0.55, f: 1800, r: 13, c: '#b9e8ff', mono: false },
  { n: 'PAD', pan: 0.55, f: 1800, r: 13, c: '#b9e8ff', mono: false },
  { n: 'HATS', pan: 0.3, f: 8000, r: 9, c: '#e8e2d4', mono: false },
  { n: 'RIDE', pan: -0.36, f: 6000, r: 10, c: '#e8e2d4', mono: false },
];

// the source labels printed first where two would meet
const PRINT_FIRST = ['KICK', 'VOCAL', 'BASS', 'GTR L', 'GTR R'];

type P = WbParams & { label: string; read: string };

function stepParams(i: number, t: number): P {
  const b: WbParams = { ...DEFAULTS, width: 100, focus: 20, mix: 100 };
  const e = smooth(clamp(t, 0, 1));
  switch (i) {
    case 0: { const w = Math.round(lerp(30, 190, e)); return { ...b, width: w, label: 'WIDTH', read: `WIDTH ${w}%` }; }
    case 1: { const f = Math.round(20 * Math.pow(15, e)); return { ...b, width: 180, focus: f, label: 'LOW FOCUS', read: `FOCUS ${f}Hz` }; }
    case 2: { const r = Math.round(lerp(0, 100, e)); return { ...b, width: 150, focus: 160, high: true, reach: r, label: 'HIGH BEAM', read: `REACH ${r}%` }; }
    case 3: { const tl = Math.round(lerp(-100, 100, e)); const db = (tl / 100) * 6.02; return { ...b, width: 160, focus: 160, tilt: tl, label: 'TILT', read: `TILT ${db > 0 ? '+' : ''}${db.toFixed(1)}dB` }; }
    case 4: { const mono = t > 0.5; return { ...b, width: 170, focus: 160, mono, label: mono ? 'MONO' : 'CORRELATION', read: mono ? 'MONO' : 'WIDTH 170%' }; }
    default: { const w = Math.round(lerp(100, 200, e)); return { ...b, width: w, focus: 160, label: 'CRUISE', read: `WIDTH ${w}%` }; }
  }
}

// the drawn values, eased toward the step's (or snapped, under reduced motion): one number per thing the road shows
type Shown = { width: number; focusLn: number; reach: number; tilt: number; mono: number; high: number };
const shownOf = (p: P): Shown => ({ width: p.width, focusLn: Math.log(p.focus), reach: p.reach, tilt: p.tilt, mono: p.mono ? 1 : 0, high: p.high ? 1 : 0 });

export function initStory(section: HTMLElement) {
  const canvas = section.querySelector<HTMLCanvasElement>('[data-story-canvas]')!;
  const lcd = section.querySelector<HTMLElement>('[data-story-lcd]')!;
  const needle = section.querySelector<HTMLElement>('[data-story-needle]')!;
  const lvl = section.querySelector<HTMLElement>('[data-story-level]')!;
  const lvlRead = section.querySelector<HTMLElement>('[data-story-level-read]')!;
  const stage = section.querySelector<HTMLElement>('[data-story-stage]')!;
  const steps = [...section.querySelectorAll<HTMLElement>('[data-step]')];
  const ctx = canvas.getContext('2d')!;
  const still = reducedMotion();
  let W = 0, H = 0, dpr = 1, raf = 0, t = 0, visible = false, active = 0;
  let cur: P = stepParams(0, still ? 1 : 0), shown: Shown = shownOf(cur);
  let nPos = 1, nVel = 0, last = 0;
  const pans = SRC.map(() => NaN);
  section.classList.add('is-live'); // the dim / lit look exists only with the script (no-JS: every step full strength)

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); // this clears the canvas: draw again
    if (still) drawStill(); else go();
  };
  new ResizeObserver(resize).observe(canvas); resize();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) (still ? drawStill() : go()); }).observe(canvas);
  document.fonts?.ready.then(() => { if (still) drawStill(); });

  // ── the line that lights a step, and each step's landing mark ──
  let line = 0;
  const measure = () => {
    const top = parseFloat(getComputedStyle(stage).top) || navH();
    const stacked = getComputedStyle(stage).position === 'sticky' && stage.offsetWidth > section.offsetWidth * 0.8;
    if (stacked) {
      // upright phone: the stage sits on top; each step gets the free height under it, and the line is its middle
      const below = top + stage.offsetHeight, free = Math.max(160, innerHeight - below);
      section.style.setProperty('--wb-story-free', `${Math.round(free)}px`);
      line = below + free / 2;
    } else {
      section.style.removeProperty('--wb-story-free');
      line = top + (innerHeight - top) / 2;
    }
  };
  ScrollTrigger.addEventListener('refreshInit', measure);
  measure();

  const triggers = steps.map((el, i) => ScrollTrigger.create({
    trigger: el, start: () => `top ${line}px`, end: () => `bottom ${line}px`, invalidateOnRefresh: true,
    onUpdate: (st) => { if (!still && active === i) { cur = stepParams(i, st.progress); paintHud(); } },
    onToggle: (st) => { if (st.isActive) light(i, st.progress); },
  }));
  // the chapters' landing marks: driveTo(mark, { align: 'top' }) puts mark's top under the nav (drive-to.ts), so the mark
  // sits that far above the scroll position at the middle of the step's lit range
  const placeMarks = () => triggers.forEach((st, i) => {
    const mark = steps[i].querySelector<HTMLElement>('[data-step-mark]');
    if (!mark) return;
    const liTop = steps[i].getBoundingClientRect().top + scrollY;
    mark.style.top = `${Math.round((st.start + st.end) / 2 + navH() - liTop)}px`;
  });
  ScrollTrigger.addEventListener('refresh', placeMarks);
  placeMarks();

  function light(i: number, progress: number) {
    active = i;
    steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
    cur = stepParams(i, still ? 1 : progress);
    paintHud();
    if (still) drawStill();
  }

  // the source's on-screen pan for the drawn values
  function panOf(s: (typeof SRC)[number], v: Shown) {
    const focus = Math.exp(v.focusLn);
    const below = s.f < focus ? 1 - clamp(Math.log(focus / s.f) / Math.log(2), 0, 1) : 1;
    const tiltK = Math.pow(2, (v.tilt / 100) * (s.f > 1500 ? 1 : -1) * Math.min(1, Math.abs(Math.log2(s.f / 1500)) / 2));
    return clamp(s.pan * widthGain(v.width) * tiltK * below * (1 - v.mono), -1.15, 1.15);
  }
  function corrOf(p: P) {
    if (p.mono) return 1;
    let c = 1 - Math.max(0, widthGain(p.width) - 0.3) * 0.32 - (p.tilt ? Math.abs(p.tilt) / 100 * 0.1 : 0);
    if (p.high) c -= 0.5 * p.reach / 100;
    return clamp(c, -1, 1);
  }

  // LEVEL against the original, on the plugin's own typical mix (side ~ -6 dB under mid: energy 1 + 0.25, the law CRUISE
  // is built on, PluginProcessor.cpp AUTO GAIN): the side scales with WIDTH, HIGH BEAM adds its amount squared, MONO keeps
  // the mid only. CRUISE is on from the first load (widebeam.ts step 06), so the number is always the trimmed one; the
  // bar's red part is the level without it. TILT is left out: what it does to the level depends on the mix's spectrum,
  // which this law does not model (and CRUISE does not follow TILT, widebeam.ts limits).
  function paintHud() {
    lcd.textContent = cur.read;
    const w = widthGain(cur.width), r = beamAmount(cur);
    const raw = 10 * Math.log10((cur.mono ? 1 : 1 + 0.25 * w * w + r * r) / 1.25);
    let db = raw + 20 * Math.log10(cruise(cur));
    if (Math.abs(db) < 0.05) db = 0;
    lvl.style.setProperty('--lv', String(clamp(0.62 + db / 12, 0, 1)));
    lvl.style.setProperty('--raw', String(clamp(0.62 + raw / 12, 0, 1)));
    lvlRead.textContent = `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
    section.dataset.step = cur.label;
    if (!still) go();
  }

  function draw(dt: number) {
    // ease the drawn values toward the step's (one exp curve, 8/s, like the sources); a still snaps them
    const goal = shownOf(cur), k = still ? 1 : 1 - Math.exp(-dt * 8);
    for (const key of Object.keys(goal) as (keyof Shown)[]) shown[key] += (goal[key] - shown[key]) * k;
    if (!still) t += dt;
    const v = shown, focus = Math.exp(v.focusLn);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const hz = H * 0.408, cx = W * 0.498;
    const half = (y: number) => W * 0.51 * Math.max(0, (y - hz) / (H - hz));
    const yOf = (f: number) => lerp(H * 0.97, hz + 6, Math.log(f / 20) / Math.log(1000));
    const font = (w: number) => `${w} 13px Oswald, sans-serif`; // the 13 px floor for print (mobile-10)

    // the road's light follows the width (the plugin's own law: a narrow mix dims the road, app.js roadShade)
    const energy = clamp(widthGain(v.width) * (1 - v.mono), 0, 1.6);
    ctx.fillStyle = `rgba(8,16,25,${clamp(0.55 - energy * 0.42, 0, 0.55).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);

    // the beams: how wide the mix is, as light thrown on the road
    const spread = clamp(widthGain(v.width) * 0.55 * (1 - v.mono) + 0.03 * v.mono, 0.03, 1.1);
    const bg = ctx.createLinearGradient(0, H, 0, hz);
    bg.addColorStop(0, 'rgba(255,236,196,.16)'); bg.addColorStop(1, `rgba(255,236,196,${(0.02 + v.high * (0.1 + v.reach / 100 * 0.14)).toFixed(3)})`);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(cx - half(H) * spread, H); ctx.lineTo(cx - W * 0.03 * spread, hz + 2); ctx.lineTo(cx + W * 0.03 * spread, hz + 2); ctx.lineTo(cx + half(H) * spread, H); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // frequency marks across the road (their numbers go on the verge later, over the glows)
    const marks: [number, number][] = [];
    for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
      const y = yOf(f);
      ctx.strokeStyle = 'rgba(232,200,120,.16)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - half(y), y); ctx.lineTo(cx + half(y), y); ctx.stroke();
      marks.push([f, y]);
    }

    // LOW FOCUS: everything nearer than this line is kept on the centre line
    const focusY = focus > 25 ? yOf(focus) : NaN;
    if (!Number.isNaN(focusY)) {
      const y = focusY;
      ctx.strokeStyle = 'rgba(232,200,120,.9)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(cx - half(y), y); ctx.lineTo(cx + half(y), y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(232,200,120,.1)';
      ctx.beginPath(); ctx.moveTo(cx - half(y), y); ctx.lineTo(cx + half(y), y); ctx.lineTo(cx + half(H), H); ctx.lineTo(cx - half(H), H); ctx.closePath(); ctx.fill();
    }

    // the sources (eased toward their target pans; a still snaps them)
    const scale = clamp(H / 260, 0.5, 1.2);
    const draws: [number, number, (typeof SRC)[number]][] = [];
    SRC.forEach((s, i) => {
      const target = panOf(s, v);
      pans[i] = Number.isNaN(pans[i]) || still ? target : pans[i] + (target - pans[i]) * (1 - Math.exp(-dt * 8));
      const y = yOf(s.f);
      draws.push([cx + pans[i] * half(y) * 0.92, y, s]);
      // HIGH BEAM: the mono vocal throws a wide twin pair
      if (s.n === 'VOCAL' && v.high > 0.02) {
        const sp = (v.reach / 100) * 0.85 * widthGain(v.width) * 0.8 * v.high * (1 - v.mono);
        for (const m of [-1, 1]) draws.push([cx + m * sp * half(y) * 0.92, y, { ...s, r: s.r * 0.7, n: '' }]);
      }
    });
    // every glow first, so no later glow ('lighter') washes out a label printed before it
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, s] of draws) {
      const pulse = still ? 1 : 1 + 0.06 * Math.sin(t * 4 + x * 0.05);
      const r = s.r * scale * pulse * (0.6 + 0.5 * (y - hz) / (H - hz));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
      g.addColorStop(0, s.c); g.addColorStop(0.35, s.c + '88'); g.addColorStop(1, s.c + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // then the print, over every glow, each with a dark keyline (it reads on a bright source and on the dark road alike).
    // One list of the boxes already printed: the LOW FOCUS label first (step 02 is about it, so it always shows), then
    // the sources (twins that meet share one), then the axis numbers wherever they are clear of both.
    const boxes: [number, number, number, number][] = []; // left, top, right, bottom
    const print = (s: string, x: number, y: number, fill: string, weight: number, align: CanvasTextAlign, always = false) => {
      ctx.font = font(weight); ctx.textAlign = align;
      const w = ctx.measureText(s).width, l = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, top = y - 11, bot = y + 3;
      if (!always && boxes.some(([L, T, R, B]) => l < R + 6 && l + w > L - 6 && top < B && bot > T)) return false;
      boxes.push([l, top, l + w, bot]);
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(10,8,6,.88)'; ctx.strokeText(s, x, y);
      ctx.fillStyle = fill; ctx.fillText(s, x, y);
      return true;
    };
    if (!Number.isNaN(focusY)) {
      // under the dashed line, on the right verge (or flush with the window's right edge when the verge is off it): what
      // is nearer than LOW FOCUS sits on the centre line, so that side is clear (above the line it ran into GTR R)
      const s = `LOW FOCUS ${Math.round(focus)} Hz`;
      ctx.font = font(500);
      print(s, Math.min(cx + half(focusY) + 6, W - 4 - ctx.measureText(s).width), Math.min(focusY + 16, H - 4), '#f3dca0', 500, 'left', true);
    }
    // where labels meet (a mono pile, a 360 px window), the ones the steps talk about win: KICK and VOCAL first
    const rank = (n: string) => { const i = PRINT_FIRST.indexOf(n); return i < 0 ? PRINT_FIRST.length : i; };
    for (const [x, y, s] of draws.filter((d) => d[2].n).sort((a, b) => rank(a[2].n) - rank(b[2].n))) print(s.n, x, y + 4, '#efe6d2', 600, 'center');
    let lastY = Infinity;
    for (const [f, y] of marks) {
      if (lastY - y < 15) continue; // axis numbers at least 15 px apart
      if (print(f >= 1000 ? f / 1000 + 'k' : String(f), cx - half(y) - 6, y + 4, 'rgba(232,200,120,.85)', 500, 'right')) lastY = y;
    }

    // the correlation needle (mass-spring like the face's; a still snaps it)
    const ng = corrOf(cur);
    if (still) { nPos = ng; nVel = 0; }
    else { const kk = 140, c = 2 * Math.sqrt(kk) * 0.7, d = Math.min(dt, 0.033); nVel += (kk * (ng - nPos) - c * nVel) * d; nPos += nVel * d; }
    needle.style.setProperty('--wb-needle', `${(nPos * 50).toFixed(2)}deg`);
  }

  function drawStill() { if (W && H) draw(0); }
  function loop(now: number) {
    raf = 0;
    if (!visible) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  function go() { if (!still && !raf && visible) { last = 0; raf = requestAnimationFrame(loop); } }
  paintHud();
  if (still) drawStill();
}
