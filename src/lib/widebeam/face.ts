/**
 * The living WIDE BEAM face. Built on a clean 2x capture of the plugin's own face (every moving part hidden), with the
 * plugin's baked filmstrips laid back on their seats, in the plugin's 1536×1024 coordinates (WideBeam Source/ui:
 * index.html, garage.css). The lamps, the road and the beams use app.js's maths: lamp exposure 0.09 + 0.91·e^0.72,
 * halogen lag (rise fast, decay slower), the road shade and beam cones opening with WIDTH. The needle is the meter's
 * mass-spring (k 140, ζ 0.7) about its pivot, drawn at the meter's 0.75 scale.
 */
import type { WbParams } from './audio';
import { PRESETS, presetValues, type Store } from './state';
import { gsap } from '../motion';

export interface FaceArt { base: string; width: string; focus: string; mix: string; toggle: string; power: string; wheel: string; }

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

type Strip = { frames: number; cols: number; rows: number };
const S: Record<string, Strip> = {
  width: { frames: 101, cols: 11, rows: 10 },
  focus: { frames: 129, cols: 12, rows: 11 },
  mix: { frames: 101, cols: 11, rows: 10 },
  toggle: { frames: 29, cols: 6, rows: 5 },
  power: { frames: 16, cols: 4, rows: 4 },
  wheel: { frames: 81, cols: 9, rows: 9 },
};
const stripPos = (m: Strip, f: number) => `${((f % m.cols) / (m.cols - 1)) * 100}% ${(Math.floor(f / m.cols) / (m.rows - 1)) * 100}%`;
const stripStyle = (el: HTMLElement, url: string, m: Strip) => { el.style.backgroundImage = `url(${url})`; el.style.backgroundSize = `${m.cols * 100}% ${m.rows * 100}%`; };

// knobs: value range, the drag law (focus is logarithmic under the finger, linear on the strip like the plugin)
const KNOBS = {
  width: { box: [634, 523, 264], hit: [646, 535, 240], strip: 'width', min: 0, max: 200, unit: '%', label: 'WIDTH', log: false },
  focus: { box: [257, 622, 166], hit: [262, 627, 156], strip: 'focus', min: 20, max: 1000, unit: 'Hz', label: 'FOCUS', log: true },
  mix: { box: [437, 622, 166], hit: [442, 627, 156], strip: 'mix', min: 0, max: 100, unit: '%', label: 'MIX', log: false },
  reach: { box: [1127, 640, 130], hit: [1127, 640, 130], strip: 'mix', min: 0, max: 100, unit: '%', label: 'REACH', log: false },
} as const;
type KnobId = keyof typeof KNOBS;
const toNorm = (k: KnobId, v: number) => { const d = KNOBS[k]; return d.log ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min); };
const fromNorm = (k: KnobId, n: number) => { const d = KNOBS[k]; n = clamp(n, 0, 1); return d.log ? d.min * Math.pow(d.max / d.min, n) : d.min + n * (d.max - d.min); };

const lcdText = (k: KnobId | 'tilt', s: WbParams) => {
  if (!s.power) return '';
  if (s.side) return 'SIDE SOLO';
  if (s.mono) return 'MONO';
  if (k === 'tilt') return `TILT ${fmtTilt(s.tilt)}`;
  const d = KNOBS[k as KnobId];
  return `${d.label} ${Math.round(s[k as KnobId] as number)}${d.unit}`;
};
const fmtTilt = (t: number) => { const db = (t / 100) * 6.02; return `${db > 0.04 ? '+' : db < -0.04 ? '-' : ''}${Math.abs(db).toFixed(1)}dB`; };

export interface Face { root: HTMLElement; setCorrelation(c: number | null): void; loadPreset(i: number): void; ignite(): void; }

export function createFace(root: HTMLElement, art: FaceArt, store: Store): Face {
  const rig = document.createElement('div');
  rig.className = 'wb-rig';
  root.appendChild(rig);

  // ── the art: plate, road effects, lamps (exposure on clipped copies of the plate), needle ──
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1536 1024');
  svg.setAttribute('class', 'wb-art');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs>
<image id="wbPhoto" href="${art.base}" width="1536" height="1024" preserveAspectRatio="none"/>
<linearGradient id="wbRoadFade" gradientUnits="userSpaceOnUse" x1="0" y1="221" x2="0" y2="271"><stop stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
<mask id="wbRoadMask" maskUnits="userSpaceOnUse" x="399" y="221" width="736" height="219"><rect x="399" y="221" width="736" height="219" rx="5" fill="url(#wbRoadFade)"/></mask>
<clipPath id="wbLensL"><rect x="82" y="180" width="264" height="229" rx="25"/></clipPath>
<clipPath id="wbLensR"><rect x="1198" y="180" width="247" height="229" rx="24"/></clipPath>
<filter id="wbLampExp" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR data-exp="lamp" type="linear" slope="1"/><feFuncG data-exp="lamp" type="linear" slope="1"/><feFuncB data-exp="lamp" type="linear" slope="1"/></feComponentTransfer></filter>
<filter id="wbRoadExp" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR data-exp="road" type="linear" slope="1"/><feFuncG data-exp="road" type="linear" slope="1"/><feFuncB data-exp="road" type="linear" slope="1"/></feComponentTransfer></filter>
<filter id="wbGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="wbSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="wbNeedleBlur"><feGaussianBlur stdDeviation="1.4"/></filter>
<linearGradient id="wbBeamGrad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff1cb" stop-opacity=".75"/><stop offset="1" stop-color="#eadcc0" stop-opacity=".05"/></linearGradient>
<linearGradient id="wbHighGrad" gradientUnits="userSpaceOnUse" x1="0" y1="440" x2="0" y2="276"><stop stop-color="#fff1cb" stop-opacity=".0"/><stop offset=".35" stop-color="#fff1cb" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe9" stop-opacity=".95"/></linearGradient>
<radialGradient id="wbBloom"><stop stop-color="#fff1cb" stop-opacity=".85"/><stop offset=".35" stop-color="#ffe2a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<radialGradient id="wbTell"><stop stop-color="#cfe6ff"/><stop offset=".35" stop-color="#4f9dff" stop-opacity=".9"/><stop offset="1" stop-color="#1d5cff" stop-opacity="0"/></radialGradient>
</defs>
<use href="#wbPhoto"/>
<g mask="url(#wbRoadMask)"><use href="#wbPhoto" filter="url(#wbRoadExp)"/></g>
<g mask="url(#wbRoadMask)">
 <path data-el="shade" fill="#081019" fill-rule="evenodd"/>
 <g filter="url(#wbGlow)" fill="url(#wbBeamGrad)"><path data-el="beamL"/><path data-el="beamR"/></g>
 <path data-el="anchor" d="M766 296L766 435" stroke="#ecdfbd" stroke-width="3" opacity="0"/>
 <g data-el="high" opacity="0"><path d="M700 440L758 278H774L832 440Z" fill="url(#wbHighGrad)" filter="url(#wbGlow)"/><ellipse cx="766" cy="279" rx="70" ry="10" fill="#fff4d8" opacity=".55" filter="url(#wbSoft)"/></g>
</g>
<g data-el="lamps"><g clip-path="url(#wbLensL)"><use href="#wbPhoto" filter="url(#wbLampExp)"/></g><g clip-path="url(#wbLensR)"><use href="#wbPhoto" filter="url(#wbLampExp)"/></g></g>
<g data-el="bloom" opacity="0" style="pointer-events:none"><circle cx="212" cy="290" r="150" fill="url(#wbBloom)"/><circle cx="1320" cy="290" r="150" fill="url(#wbBloom)"/></g>
<g transform="translate(1102 620.5) scale(.75)">
 <g transform="translate(2.6 3.8)"><path data-el="nshadow" d="M-1.7 -54L-.55 -146L.55 -146L1.7 -54Z" fill="#2b1f10" opacity=".38" filter="url(#wbNeedleBlur)"/></g>
 <path data-el="needle" d="M-1.8 -54L-.55 -146L.55 -146L1.8 -54Z" fill="#1b1510"/>
</g>
<circle data-el="tell" cx="1212" cy="584" r="13" fill="url(#wbTell)" opacity="0"/>`;
  rig.appendChild(svg);
  const q = (n: string) => svg.querySelector(`[data-el="${n}"]`) as SVGElement;
  const E = { shade: q('shade'), beamL: q('beamL'), beamR: q('beamR'), anchor: q('anchor'), high: q('high'), bloom: q('bloom'), needle: q('needle'), nshadow: q('nshadow'), tell: q('tell') };
  const lampFns = [...svg.querySelectorAll('[data-exp="lamp"]')], roadFns = [...svg.querySelectorAll('[data-exp="road"]')];
  const put = (el: Element, k: string, v: string | number) => { const s = String(v); if (el.getAttribute(k) !== s) el.setAttribute(k, s); };

  const box = (cls: string, [x, y, w, h = w]: number[] | readonly number[], tag = 'div') => {
    const el = document.createElement(tag);
    el.className = cls;
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    rig.appendChild(el);
    return el;
  };
  const announce = root.querySelector<HTMLElement>('[data-wb-announce]');

  // ── knobs ──
  const knobs = {} as Record<KnobId, { strip: HTMLElement; hit: HTMLElement }>;
  for (const id of Object.keys(KNOBS) as KnobId[]) {
    const d = KNOBS[id];
    const body = box('wb-knob', d.box);
    const strip = document.createElement('span'); strip.className = 'wb-strip'; body.appendChild(strip);
    stripStyle(strip, (art as any)[d.strip], S[d.strip]);
    const hit = box('wb-hit wb-hit--knob', d.hit);
    hit.setAttribute('role', 'slider'); hit.tabIndex = 0;
    hit.setAttribute('aria-label', d.label === 'FOCUS' ? 'Low focus' : d.label[0] + d.label.slice(1).toLowerCase());
    hit.setAttribute('aria-valuemin', String(d.min)); hit.setAttribute('aria-valuemax', String(d.max));
    knobs[id] = { strip, hit };
    bindDrag(hit, (dy, fine, start) => store.set({ [id]: Math.round(fromNorm(id, start + dy * (fine ? 0.0012 : 0.0055))) } as any, 'face'), () => toNorm(id, store.get()[id] as number), id);
    hit.addEventListener('dblclick', () => store.set({ [id]: (presetValues(PRESETS[0]) as any)[id] }, 'face'));
    hit.addEventListener('keydown', (e) => {
      const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 8, PageDown: -8 }[e.key];
      if (!step) return;
      e.preventDefault();
      store.set({ [id]: Math.round(fromNorm(id, toNorm(id, store.get()[id] as number) + step * 0.02)) } as any, 'face');
    });
  }

  // ── TILT wheel ──
  const wheel = box('wb-wheel', [105, 516, 109.9, 270]);
  const wheelStrip = document.createElement('span'); wheelStrip.className = 'wb-strip'; wheel.appendChild(wheelStrip);
  stripStyle(wheelStrip, art.wheel, S.wheel);
  wheel.setAttribute('role', 'slider'); wheel.tabIndex = 0; wheel.setAttribute('aria-label', 'Tilt');
  wheel.setAttribute('aria-valuemin', '-100'); wheel.setAttribute('aria-valuemax', '100');
  bindDrag(wheel, (dy, fine, start) => store.set({ tilt: Math.round(clamp((start + dy * (fine ? 0.001 : 0.006)) * 200 - 100, -100, 100) / 2) * 2 }, 'face'), () => (store.get().tilt + 100) / 200, 'tilt');
  wheel.addEventListener('dblclick', () => store.set({ tilt: 0 }, 'face'));
  wheel.addEventListener('keydown', (e) => { const s = { ArrowUp: 10, ArrowDown: -10 }[e.key]; if (s) { e.preventDefault(); store.set({ tilt: clamp(store.get().tilt + s, -100, 100) }, 'face'); } });

  // ── bat toggles: HIGH BEAM and SIDE (over-centre spring, one bounce off the stop: garage.js swStep) ──
  const toggle = (key: 'high' | 'side', b: number[], hitB: number[], label: string) => {
    const el = box('wb-toggle', b);
    const strip = document.createElement('span'); strip.className = 'wb-strip'; el.appendChild(strip);
    stripStyle(strip, art.toggle, S.toggle);
    const hit = box('wb-hit wb-hit--tog', hitB, 'button');
    hit.setAttribute('role', 'switch'); hit.setAttribute('aria-label', label);
    let ang = -35, vel = 0, raf = 0, T = 0;
    const paint = () => { strip.style.backgroundPosition = stripPos(S.toggle, Math.round(((ang + 35) / 70) * 28)); };
    const step = (now: number) => {
      raf = 0; const dt = Math.min(0.02, (now - T) / 1000); T = now;
      const on = store.get()[key], stop = on ? 35 : -35, dir = Math.sign(stop - ang) || (on ? 1 : -1);
      vel += dir * 9000 * dt; ang += vel * dt;
      if (on ? ang >= 35 : ang <= -35) { ang = stop; vel = -vel * 0.22; if (Math.abs(vel) < 40) vel = 0; }
      paint();
      if (vel !== 0 || ang !== stop) raf = requestAnimationFrame(step);
    };
    const kick = () => { if (reduced()) { ang = store.get()[key] ? 35 : -35; paint(); return; } if (!raf) { T = performance.now(); raf = requestAnimationFrame(step); } };
    hit.addEventListener('click', () => store.set({ [key]: !store.get()[key], ...(key === 'side' ? {} : {}) } as any, 'face'));
    paint();
    return { kick, hit };
  };
  const high = toggle('high', [929.5, 637, 165, 165], [951.5, 628, 121, 154], 'High beam');
  const side = toggle('side', [1332, 482, 80, 80], [1332, 477.5, 80, 75], 'Side solo');

  // ── MONO: the cap cut from the plate sinks 3 px inside its bezel ──
  const monoCap = box('wb-monocap', [1298, 631, 148, 148]);
  monoCap.style.backgroundImage = `url(${art.base})`;
  const monoHit = box('wb-hit wb-hit--round', [1302, 635, 140, 140], 'button');
  monoHit.setAttribute('aria-label', 'Mono');
  monoHit.addEventListener('click', () => store.set({ mono: !store.get().mono }, 'face'));

  // ── POWER rocker (frames 0..14 the throw, 15 the lit jewel) ──
  const pw = box('wb-power', [1356, 47, 80, 100]);
  const pwS = document.createElement('span'), pwL = document.createElement('span');
  pwS.className = 'wb-strip'; pwL.className = 'wb-strip wb-power-lit';
  pw.append(pwS, pwL);
  for (const n of [pwS, pwL]) stripStyle(n, art.power, S.power);
  pwL.style.backgroundPosition = stripPos(S.power, 15);
  const pwHit = box('wb-hit wb-hit--power', [1367, 61, 58, 72], 'button');
  pwHit.setAttribute('aria-label', 'Power');
  pwHit.addEventListener('click', () => store.set({ power: !store.get().power }, 'face'));
  let pAng = 14, pVel = 0, pRaf = 0, pT = 0, pLamp = 1;
  const pStep = (now: number) => {
    pRaf = 0; const dt = Math.min(0.02, (now - pT) / 1000); pT = now;
    const on = store.get().power, stop = on ? 14 : -14, dir = Math.sign(stop - pAng) || (on ? 1 : -1);
    pVel += dir * 5200 * dt; pAng += pVel * dt;
    if (on ? pAng >= 14 : pAng <= -14) { pAng = stop; pVel = -pVel * 0.22; if (Math.abs(pVel) < 30) pVel = 0; }
    const settled = pVel === 0 && pAng === stop, goal = on && settled ? 1 : 0;
    pLamp += (goal - pLamp) * (1 - Math.exp(-dt * (goal > pLamp ? 14 : 9))); if (Math.abs(goal - pLamp) < 0.003) pLamp = goal;
    pwS.style.backgroundPosition = stripPos(S.power, Math.round(((pAng + 14) / 28) * 14)); pwL.style.opacity = pLamp.toFixed(3);
    if (!settled || pLamp !== goal) pRaf = requestAnimationFrame(pStep);
  };
  const pKick = () => { if (!pRaf) { pT = performance.now(); pRaf = requestAnimationFrame(pStep); } };
  pwS.style.backgroundPosition = stripPos(S.power, 14);

  // ── LCDs + preset box ──
  const trip = box('wb-lcd wb-lcd--trip', [654, 176, 226, 38]);
  const tiltLcd = box('wb-lcd wb-lcd--tilt', [90, 477, 140, 38]);
  const pName = box('wb-lcd wb-lcd--preset', [94, 73, 142, 48]);
  const prev = box('wb-hit wb-hit--pb', [70, 73, 24, 48], 'button'); prev.setAttribute('aria-label', 'Previous preset');
  const next = box('wb-hit wb-hit--pb', [237, 73, 22, 48], 'button'); next.setAttribute('aria-label', 'Next preset');
  prev.addEventListener('click', () => loadPreset((store.preset + PRESETS.length - 1) % PRESETS.length));
  next.addEventListener('click', () => loadPreset((store.preset + 1) % PRESETS.length));
  let lastKnob: KnobId | 'tilt' = 'width', tripTimer = 0;

  // ── drag helper: vertical travel, Shift / Alt for fine ──
  function bindDrag(el: HTMLElement, apply: (dy: number, fine: boolean, start: number) => void, read: () => number, id: KnobId | 'tilt') {
    let y0 = 0, n0 = 0, dragging = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); el.focus({ preventScroll: true });
      el.setPointerCapture(e.pointerId); dragging = true; y0 = e.clientY; n0 = read(); lastKnob = id;
      root.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const scale = rig.getBoundingClientRect().width / 1536 || 1;
      apply((y0 - e.clientY) / Math.max(0.5, scale), e.shiftKey || e.altKey, n0);
    });
    const end = () => { dragging = false; root.classList.remove('is-dragging'); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    // the wheel turns a control only once the visitor has picked it (click or Tab): scrolling the page past the dash
    // must never turn a knob. While it has focus, Lenis leaves the wheel to it (data-lenis-prevent-wheel).
    el.addEventListener('wheel', (e) => { if (document.activeElement !== el) return; e.preventDefault(); lastKnob = id; apply(-e.deltaY * 0.6, e.shiftKey, read()); }, { passive: false });
    el.addEventListener('focus', () => { lastKnob = id; el.setAttribute('data-lenis-prevent-wheel', ''); });
    el.addEventListener('blur', () => el.removeAttribute('data-lenis-prevent-wheel'));
  }

  // ── presets: the knobs glide to the new values (house overshoot), MONO + SIDE off, POWER untouched ──
  let glide = 0;
  function loadPreset(i: number) {
    store.preset = i;
    const from = store.get(), to = presetValues(PRESETS[i]);
    cancelAnimationFrame(glide);
    store.set({ mono: false, side: false, high: to.high }, 'preset');
    const keys = ['width', 'focus', 'mix', 'tilt', 'reach'] as const, t0 = performance.now(), dur = reduced() ? 1 : 520;
    const ease = (t: number) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const run = (now: number) => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t), v: Partial<WbParams> = {};
      for (const k of keys) (v as any)[k] = Math.round(from[k] + (to[k] - from[k]) * e);
      store.set(v, 'preset');
      if (t < 1) glide = requestAnimationFrame(run); else { store.edited = false; paintStatic(); }
    };
    glide = requestAnimationFrame(run);
    store.edited = false;
    lastKnob = 'width';
    paintStatic();
  }

  // ── live paint ──
  let shown = 0, dark = 1, corrIn: number | null = null, nPos = 0, nVel = 0, raf = 0, last = 0, hbShown = 0, igniting = false;
  const effective = () => { const s = store.get(); return s.power && !s.mono ? s.width : 0; };

  function paintStatic() {
    const s = store.get();
    for (const id of Object.keys(KNOBS) as KnobId[]) {
      const d = KNOBS[id], v = s[id] as number, m = S[d.strip];
      knobs[id].strip.style.backgroundPosition = stripPos(m, Math.round(((v - d.min) / (d.max - d.min)) * (m.frames - 1)));
      knobs[id].hit.setAttribute('aria-valuenow', String(Math.round(v)));
      knobs[id].hit.setAttribute('aria-valuetext', `${Math.round(v)} ${d.unit === '%' ? 'percent' : 'hertz'}`);
    }
    wheelStrip.style.backgroundPosition = stripPos(S.wheel, Math.round(((s.tilt + 100) / 200) * 80));
    wheel.setAttribute('aria-valuenow', String(s.tilt)); wheel.setAttribute('aria-valuetext', fmtTilt(s.tilt));
    trip.textContent = lcdText(lastKnob, s);
    tiltLcd.textContent = s.power ? fmtTilt(s.tilt) : '';
    pName.textContent = s.power ? PRESETS[store.preset].name.toUpperCase() + (store.edited ? '*' : '') : '';
    monoCap.classList.toggle('is-down', s.mono);
    monoHit.setAttribute('aria-pressed', String(s.mono));
    high.hit.setAttribute('aria-checked', String(s.high));
    side.hit.setAttribute('aria-checked', String(s.side));
    pwHit.setAttribute('aria-pressed', String(s.power));
    root.classList.toggle('is-off', !s.power);
  }

  function frame(now: number) {
    raf = 0;
    const dt = last ? clamp((now - last) / 1000, 0, 0.1) : 1 / 60; last = now;
    const s = store.get(), snap = reduced();
    const goal = igniting ? shown : effective(), dg = s.power ? 0 : 1;
    if (!igniting) shown = snap ? goal : shown + (goal - shown) * (1 - Math.exp(-dt * (goal > shown ? 9 : 6)));
    if (Math.abs(shown - goal) < 0.1) shown = goal;
    dark = snap ? dg : dark + (dg - dark) * (1 - Math.exp(-dt * (dg > dark ? 6 : 9))); if (Math.abs(dark - dg) < 0.002) dark = dg;
    const hbGoal = s.high && s.power ? 0.35 + 0.65 * (s.reach / 100) : 0;
    hbShown = snap ? hbGoal : hbShown + (hbGoal - hbShown) * (1 - Math.exp(-dt * (hbGoal > hbShown ? 9 : 6)));

    const w = shown / 2, energy = clamp(w / 100, 0, 1);
    const exposure = 0.09 + 0.91 * Math.pow(energy, 0.72), road = 0.08 + 0.92 * Math.pow(energy, 0.72);
    lampFns.forEach((f) => put(f, 'slope', (exposure + hbShown * 0.18).toFixed(4)));
    roadFns.forEach((f) => put(f, 'slope', (road + hbShown * 0.12).toFixed(4)));
    const on = 1 - dark, spread = (24 + w * 4.7) * on, left = 766 - spread, right = 766 + spread;
    put(E.shade, 'd', `M399 226H1135V440H399Z M${754 + 12 * dark} 276L${left} 440H${right}L${780 - 14 * dark} 276Z`);
    put(E.shade, 'opacity', (clamp(((68 - w) / 68) * 0.65, 0, 0.65) * on + 0.65 * dark).toFixed(3));
    put(E.beamL, 'd', `M754 277L${left} 438L${Math.min(755, left + 80)} 438Z`);
    put(E.beamR, 'd', `M780 277L${right} 438L${Math.max(779, right - 80)} 438Z`);
    (E.beamL as SVGElement).style.opacity = (E.beamR as SVGElement).style.opacity = String(energy * 0.16);
    put(E.anchor, 'opacity', ((s.focus - 20) / 980 * 0.55 * on).toFixed(3));
    put(E.high, 'opacity', hbShown.toFixed(3));
    put(E.bloom, 'opacity', (hbShown * 0.55 * on).toFixed(3));
    put(E.tell, 'opacity', (hbShown > 0.01 ? 0.4 + hbShown * 0.6 : 0).toFixed(3));
    root.style.setProperty('--wb-energy', (energy * on).toFixed(3));
    root.style.setProperty('--wb-high', hbShown.toFixed(3));

    // the needle: the measured correlation when audio plays, otherwise the plugin's browser simulation
    let target = corrIn ?? (s.mono ? 1 : clamp(1 - (w / 100) * (s.mix / 100) * 0.27, 0, 1));
    if (corrIn === null && s.high) target = Math.max(-1, target - 0.45 * s.reach / 100);
    if (corrIn === null && s.side) target = -0.85;
    if (!s.power) target = 0;
    if (snap) { nPos = target; nVel = 0; } else { const k = 140, c = 2 * Math.sqrt(k) * 0.7; nVel += (k * (target - nPos) - c * nVel) * Math.min(dt, 0.033); nPos += nVel * Math.min(dt, 0.033); }
    const rot = `rotate(${(nPos * 50).toFixed(2)})`;
    put(E.needle, 'transform', rot); put(E.nshadow, 'transform', rot);

    const busy = shown !== goal || dark !== dg || Math.abs(hbShown - hbGoal) > 0.002 || Math.abs(target - nPos) > 0.0005 || Math.abs(nVel) > 0.0005 || corrIn !== null || igniting;
    if (busy) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  store.on((s, ch, src) => {
    if ('high' in ch) high.kick();
    if ('side' in ch) side.kick();
    if ('power' in ch) pKick();
    for (const k of ['width', 'focus', 'mix', 'reach'] as KnobId[]) if (k in ch && src !== 'preset') lastKnob = k;
    if ('tilt' in ch && src !== 'preset') lastKnob = 'tilt';
    paintStatic();
    kick();
    if (announce && src === 'face') {
      clearTimeout(tripTimer);
      tripTimer = window.setTimeout(() => { announce.textContent = trip.textContent || (s.power ? '' : 'Power off'); }, 250);
    }
  });

  // scale the 1536-wide rig to the face's box
  const fit = () => { rig.style.transform = `scale(${root.clientWidth / 1536})`; };
  new ResizeObserver(fit).observe(root);
  fit();

  paintStatic();
  kick();

  return {
    root,
    setCorrelation(c) { corrIn = c; kick(); },
    loadPreset,
    // the opening: the lamps cough twice, then settle onto WIDTH with the halogen lag
    ignite() {
      if (reduced()) { shown = effective(); dark = 0; kick(); return; }
      igniting = true; shown = 0; dark = 1; kick();
      const seq: [number, number][] = [[120, 70], [220, 6], [330, 110], [430, 18], [560, -1]];
      seq.forEach(([t, v]) => setTimeout(() => { if (v < 0) { igniting = false; } else { shown = v * 2; dark = 0; } kick(); }, t));
    },
  };
}

/** The page's dash: builds the face, lights it the first time it is a third on screen, and raises it as it scrolls in. */
export function initFace(page: HTMLElement, art: FaceArt, store: Store, reducedMotion: boolean) {
  // ── the face ──
  const faceEl = page.querySelector<HTMLElement>('[data-wb-face]')!;
  const face = createFace(faceEl, art, store);
  let ignited = false;
  const ignite = () => { if (!ignited) { ignited = true; face.ignite(); } };
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { ignite(); io.disconnect(); } }, { threshold: 0.35 }).observe(faceEl);
  const dash = page.querySelector<HTMLElement>('[data-wb-dash]');
  if (dash && !reducedMotion) {
    // the dash rises into the windscreen as it scrolls in
    gsap.fromTo(dash, { rotateX: 28, y: 80, scale: 0.9, opacity: 0.4 }, {
      rotateX: 0, y: 0, scale: 1, opacity: 1, ease: 'none',
      // the trigger is the still wrapper: measured on the moving dash itself (80 px down, scaled .9 at refresh), the rise
      // finished ~135 px late and a dash centred on screen still sat low and small
      scrollTrigger: { trigger: dash.parentElement ?? dash, start: 'top 95%', end: 'top 30%', scrub: 0.6 },
    });
  }
  return { face, ignite, dash };
}
