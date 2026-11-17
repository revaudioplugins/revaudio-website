/**
 * #wb-story: "the stereo road". A mix laid out on a road seen from the driver's seat: pan runs across, frequency runs
 * away from you (bass at the bumper, air at the horizon). Scrolling the six steps moves one control each, on the
 * story's own copy of the parameters (it never touches the face the visitor set):
 * WIDTH · LOW FOCUS · HIGH BEAM · TILT · MONO / CORRELATION · CRUISE.
 */
import { ScrollTrigger } from '../motion';
import { cruise, widthGain, DEFAULTS, type WbParams } from './audio';

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

export function initStory(section: HTMLElement) {
  const canvas = section.querySelector<HTMLCanvasElement>('[data-story-canvas]')!;
  const lcd = section.querySelector<HTMLElement>('[data-story-lcd]')!;
  const lab = section.querySelector<HTMLElement>('[data-story-label]')!;
  const needle = section.querySelector<HTMLElement>('[data-story-needle]')!;
  const lvl = section.querySelector<HTMLElement>('[data-story-level]')!;
  const lvlRead = section.querySelector<HTMLElement>('[data-story-level-read]')!;
  const steps = [...section.querySelectorAll<HTMLElement>('[data-step]')];
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, cur: P = stepParams(0, 0), raf = 0, t = 0, visible = false;
  let nPos = 1, nVel = 0, last = 0;

  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; };
  new ResizeObserver(resize).observe(canvas); resize();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) go(); }).observe(canvas);

  // which step is active: the one whose card crosses the middle of the screen; t = how far through it
  steps.forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 65%', end: 'bottom 35%',
      onUpdate: (st) => { cur = stepParams(i, st.progress); paintHud(); },
      onToggle: (st) => { if (st.isActive) { steps.forEach((s, j) => s.classList.toggle('is-on', j === i)); cur = stepParams(i, st.progress); paintHud(); } },
    });
  });

  // the source's on-screen pan for the story's parameters
  const panOf = (s: (typeof SRC)[number], p: P, mirror = 1) => {
    if (p.mono) return 0;
    const below = s.f < p.focus ? 1 - clamp(Math.log(p.focus / s.f) / Math.log(2), 0, 1) : 1;
    const tiltK = Math.pow(2, (p.tilt / 100) * (s.f > 1500 ? 1 : -1) * Math.min(1, Math.abs(Math.log2(s.f / 1500)) / 2));
    const base = s.pan * widthGain(p.width) * tiltK * below;
    return clamp(base * mirror, -1.15, 1.15);
  };
  const corrOf = (p: P) => {
    if (p.mono) return 1;
    let c = 1 - Math.max(0, widthGain(p.width) - 0.3) * 0.32 - (p.tilt ? Math.abs(p.tilt) / 100 * 0.1 : 0);
    if (p.high) c -= 0.5 * p.reach / 100;
    return clamp(c, -1, 1);
  };

  function paintHud() {
    lcd.textContent = cur.read;
    lab.textContent = cur.label;
    const g = cruise(cur), raw = 20 * Math.log10(Math.max(1, widthGain(cur.width)) * 0.55 + 0.45);
    const withCruise = raw + 20 * Math.log10(g);
    const db = cur.label === 'CRUISE' ? withCruise : raw;
    lvl.style.setProperty('--lv', String(clamp(0.62 + db / 12, 0, 1)));
    lvl.style.setProperty('--raw', String(clamp(0.62 + raw / 12, 0, 1)));
    lvlRead.textContent = `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
    section.dataset.step = cur.label;
    go();
  }

  function draw(dt: number) {
    t += dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const hz = H * 0.12, cx = W / 2;
    const half = (y: number) => lerp(W * 0.05, W * 0.48, (y - hz) / (H - hz));
    const yOf = (f: number) => lerp(H * 0.96, hz + 8, Math.log(f / 20) / Math.log(1000));

    // the road
    const rg = ctx.createLinearGradient(0, hz, 0, H);
    rg.addColorStop(0, '#0e1013'); rg.addColorStop(1, '#17191b');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.moveTo(cx - half(hz), hz); ctx.lineTo(cx + half(hz), hz); ctx.lineTo(cx + half(H), H); ctx.lineTo(cx - half(H), H); ctx.closePath(); ctx.fill();
    // frequency marks across the road
    ctx.font = '600 10px ui-monospace, monospace'; ctx.textAlign = 'right';
    for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
      const y = yOf(f);
      ctx.strokeStyle = 'rgba(201,163,92,.10)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - half(y), y); ctx.lineTo(cx + half(y), y); ctx.stroke();
      ctx.fillStyle = 'rgba(201,163,92,.45)';
      ctx.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), cx - half(y) - 8, y + 3);
    }
    // edges + centre line (dashes roll toward you)
    ctx.strokeStyle = 'rgba(230,222,205,.35)'; ctx.lineWidth = 2;
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sg * half(hz), hz); ctx.lineTo(cx + sg * half(H), H); ctx.stroke(); }
    const dashes = 18, off = (t * 0.35) % (1 / dashes);
    for (let i = 0; i < dashes; i++) {
      const a = i / dashes + off, z0 = a * a, z1 = Math.min(1, (a + 0.022) * (a + 0.022));
      ctx.strokeStyle = 'rgba(236,223,189,.55)'; ctx.lineWidth = 1 + 4 * a;
      ctx.beginPath(); ctx.moveTo(cx, lerp(hz, H, z0)); ctx.lineTo(cx, lerp(hz, H, z1)); ctx.stroke();
    }

    // the beams: how wide the mix is, as the light on the road
    const spread = cur.mono ? 0.03 : clamp(widthGain(cur.width) * 0.55, 0.03, 1.1);
    const bg = ctx.createLinearGradient(0, H, 0, hz);
    bg.addColorStop(0, 'rgba(255,236,196,.20)'); bg.addColorStop(1, `rgba(255,236,196,${cur.high ? 0.12 + cur.reach / 100 * 0.15 : 0.02})`);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(cx - half(H) * spread, H); ctx.lineTo(cx - half(hz) * spread * 0.4, hz); ctx.lineTo(cx + half(hz) * spread * 0.4, hz); ctx.lineTo(cx + half(H) * spread, H); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // LOW FOCUS: everything nearer than this line is kept on the centre line
    if (cur.focus > 25) {
      const y = yOf(cur.focus);
      ctx.strokeStyle = 'rgba(232,200,120,.9)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(cx - half(y), y); ctx.lineTo(cx + half(y), y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(232,200,120,.08)';
      ctx.beginPath(); ctx.moveTo(cx - half(y), y); ctx.lineTo(cx + half(y), y); ctx.lineTo(cx + half(H), H); ctx.lineTo(cx - half(H), H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8c878'; ctx.textAlign = 'left'; ctx.fillText(`LOW FOCUS ${Math.round(cur.focus)} Hz`, cx + half(y) + 8, y + 3);
    }

    // the sources (eased toward their target pans)
    ctx.textAlign = 'center';
    const draws: [number, number, (typeof SRC)[number], number][] = [];
    SRC.forEach((s, i) => {
      const target = panOf(s, cur);
      (s as any).cur = (s as any).cur ?? target;
      (s as any).cur += (target - (s as any).cur) * (1 - Math.exp(-dt * 8));
      const y = yOf(s.f);
      draws.push([cx + (s as any).cur * half(y) * 0.92, y, s, i]);
      // HIGH BEAM: the mono vocal throws a wide twin pair
      if (s.n === 'VOCAL' && cur.high && !cur.mono) {
        const sp = (cur.reach / 100) * 0.85 * widthGain(cur.width) * 0.8;
        for (const m of [-1, 1]) draws.push([cx + m * sp * half(y) * 0.92, y, { ...s, r: s.r * 0.7, n: '' }, -1]);
      }
    });
    for (const [x, y, s] of draws) {
      const pulse = 1 + 0.06 * Math.sin(t * 4 + x * 0.05);
      const r = s.r * pulse * (0.6 + 0.5 * (y - hz) / (H - hz));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
      g.addColorStop(0, s.c); g.addColorStop(0.35, s.c + '88'); g.addColorStop(1, s.c + '00');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      if (s.n) { ctx.fillStyle = 'rgba(20,16,12,.85)'; ctx.font = '700 9px ui-monospace, monospace'; ctx.fillText(s.n, x, y + 3); }
    }

    // the correlation needle (mass-spring like the face's)
    const k = 140, c = 2 * Math.sqrt(k) * 0.7, goal = corrOf(cur);
    nVel += (k * (goal - nPos) - c * nVel) * Math.min(dt, 0.033); nPos += nVel * Math.min(dt, 0.033);
    needle.style.transform = `rotate(${(nPos * 50).toFixed(2)}deg)`;
  }

  function loop(now: number) {
    raf = 0;
    if (!visible) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  function go() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(loop); } }
  paintHud();
}
