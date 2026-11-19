/**
 * The living WIDE BEAM face. Built on a clean 2x capture of the plugin's own face (every moving part hidden), with the
 * plugin's baked filmstrips laid back on their seats, in the plugin's 1536×1024 coordinates (WideBeam Source/ui:
 * index.html, garage.css, garage.js, cards.css). The lamps, the road and the beams use app.js's maths: lamp exposure
 * 0.09 + 0.91·e^0.72, halogen lag (rise fast, decay slower), the road shade and beam cones opening with WIDTH. The needle
 * is the meter's mass-spring (k 140, ζ 0.7) about its pivot, drawn at the meter's 0.75 scale.
 *
 * The arrival is one sequence (plan D.1):
 *  - the art loads late, through one loader: the first of the intro's hand-off + idle, the dash within 1.5 screens, an
 *    act on the demo, or 8 s (perf-01, hero-05, guidelines-15). Each part comes in the size tier its rendered size x DPR
 *    needs (perf-02, art-d01; the tiers are built in WbDrive.astro), every file is decode()d, then all of them are swapped
 *    in one frame over face-still.webp, the dark face in its default state (perf-04);
 *  - the face stays dark (is-cold) until the ignition: the lamps cough only once the art is in and the face has landed
 *    (mostly on screen with the page at rest, or a driveTo arrival), the LCDs light with the second cough (motion-03);
 *  - the dash rises once, solid (rotateX + y, no scale, no fade), never as a scrub; a drive to the face finishes it
 *    while it is off screen, so nothing moves after the arrival (motion-10, motion-d02, motion-d01).
 * Input (plan D.1): every value is clamped (state.ts) and a preset glides with no overshoot (motion-01); one key map for
 * the five sliders (arrows ±1 step, PageUp / PageDown ±8, Home / End: a11y-06, demo-11); the wheel only on a picked
 * control, 3 % of the travel per notch (demo-10); 200 CSS px for the whole travel at every size (demo-13); on touch a
 * direction lock: an unpicked knob lets a vertical swipe scroll the page, a sideways drag turns it, a tapped knob takes
 * both (demo-02, mobile-05, mobile-d03); every hit is at least 44 CSS px where its neighbours leave room, the preset LCD's
 * halves step (demo-09, a11y-14); the focus ring is an outline counter-scaled to 3 CSS px, so forced colours paint it
 * (a11y-13, a11y-d01); the announcer says what changed (a11y-07); the paint loop runs only on screen (a11y-17).
 *
 * /widebeam/?wb-cold keeps the face dark forever: the switch that captures face-still.webp (see WbDrive.astro).
 */
import type { WbParams } from './audio';
import { PRESETS, presetValues, type Store, type Source } from './state';
import { gsap, ScrollTrigger } from '../motion';
import { driveTo, isDriving } from './drive-to';

export interface FaceArt { base: string; width: string; focus: string; mix: string; toggle: string; power: string; wheel: string; }
type Part = keyof FaceArt;
type Tiers = Partial<Record<Part, [number, string][]>>;
export type CueTarget = 'width' | 'mono' | 'power' | null;

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const reducedNow = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

type Strip = { frames: number; cols: number; rows: number };
const S: Record<Exclude<Part, 'base'>, Strip> = {
  width: { frames: 101, cols: 11, rows: 10 },
  focus: { frames: 129, cols: 12, rows: 11 },
  mix: { frames: 101, cols: 11, rows: 10 },
  toggle: { frames: 29, cols: 6, rows: 5 },
  power: { frames: 16, cols: 4, rows: 4 },
  wheel: { frames: 81, cols: 9, rows: 9 },
};
const stripPos = (m: Strip, f: number) => `${((f % m.cols) / (m.cols - 1)) * 100}% ${(Math.floor(f / m.cols) / (m.rows - 1)) * 100}%`;
const stripGrid = (el: HTMLElement, m: Strip) => { el.style.backgroundSize = `${m.cols * 100}% ${m.rows * 100}%`; };
// the widest box (plugin units) each file is drawn at on the face; the tier is the smallest whose frame covers it x scale x DPR
const NEED: Record<Part, number> = { base: 1536, width: 264, focus: 166, mix: 166, toggle: 165, power: 80, wheel: 110 };

type KnobId = 'width' | 'focus' | 'mix' | 'reach' | 'tilt';
const KNOBS: Record<KnobId, { min: number; max: number; unit: string; label: string; name: string; log: boolean }> = {
  width: { min: 0, max: 200, unit: '%', label: 'WIDTH', name: 'Width', log: false },
  focus: { min: 20, max: 1000, unit: 'Hz', label: 'FOCUS', name: 'Low focus', log: true },
  mix: { min: 0, max: 100, unit: '%', label: 'MIX', name: 'Mix', log: false },
  reach: { min: 0, max: 100, unit: '%', label: 'REACH', name: 'Reach', log: false },
  tilt: { min: -100, max: 100, unit: 'dB', label: 'TILT', name: 'Tilt', log: false },
};
const toNorm = (k: KnobId, v: number) => { const d = KNOBS[k]; return d.log ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min); };
const fromNorm = (k: KnobId, n: number) => { const d = KNOBS[k]; n = clamp(n, 0, 1); return d.log ? d.min * Math.pow(d.max / d.min, n) : d.min + n * (d.max - d.min); };
const fmtTilt = (t: number) => { const db = (t / 100) * 6.02; return `${db > 0.04 ? '+' : db < -0.04 ? '-' : ''}${Math.abs(db).toFixed(1)}dB`; };
const reading = (k: KnobId, s: WbParams) => (k === 'tilt' ? `TILT ${fmtTilt(s.tilt)}` : `${KNOBS[k].label} ${Math.round(s[k])}${KNOBS[k].unit}`);
const valueText = (k: KnobId, v: number) => (k === 'tilt' ? fmtTilt(v).replace('dB', ' dB') : `${Math.round(v)} ${KNOBS[k].unit === '%' ? 'percent' : 'hertz'}`);

// the hits, in reading order (a11y-15): [x, y, w, h] at the art's own size, and the room each may grow into for a
// 44 CSS px target, [x0, y0, x1, y1], so a hit never covers its neighbour (demo-09)
type HitId = 'prev' | 'next' | 'save' | 'power' | 'tilt' | 'focus' | 'mix' | 'width' | 'high' | 'reach' | 'side' | 'mono';
// (the rooms reach into art that is no control: the lamps, the title, the labels, the leather edge)
const HITS: [HitId, number[], number[], boolean][] = [
  ['prev', [92, 73, 123, 48], [0, 0, 215, 195], false],
  ['next', [215, 73, 123, 48], [215, 0, 338, 195], false],
  ['save', [338, 73, 54, 48], [338, 0, 560, 195], false],
  ['power', [1367, 61, 58, 72], [1300, 0, 1536, 200], false],
  ['tilt', [105, 516, 109.9, 270], [30, 516, 236, 830], false],
  ['focus', [262, 627, 156, 156], [236, 600, 430, 830], true],
  ['mix', [442, 627, 156, 156], [430, 600, 625, 830], true],
  ['width', [646, 535, 240, 240], [625, 500, 910, 830], true],
  ['high', [951.5, 628, 121, 154], [910, 600, 1100, 830], true],
  ['reach', [1127, 640, 130, 130], [1100, 600, 1290, 830], true],
  ['side', [1332, 477.5, 80, 75], [1290, 435, 1536, 628], true],
  ['mono', [1302, 635, 140, 140], [1290, 628, 1536, 830], true],
];
const KEYSTEP: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 8, PageDown: -8 };

export interface Face {
  root: HTMLElement;
  setCorrelation(c: number | null): void;
  /** Glides the knobs to preset i (wraps). The glide waits for the art and for a drive on its way to arrive, so the
   *  visitor sees it; `afterArrive` asks for exactly that (it is the default now; kept for lane S's calls). */
  loadPreset(i: number, opts?: { afterArrive?: boolean }): void;
  presetName(): string;
  /** resolves once the art is decoded and on the face; starts the loader if it has not started */
  whenArtReady(): Promise<void>;
  /** lights the face (the cough), as soon as the art is in */
  ignite(): void;
  /** the coach's line on the trip LCD while no control is in hand (null: the readout) */
  say(text: string | null): void;
  /** the breathing lamp on the next control (null: none) */
  cue(target: CueTarget): void;
  onIgnite(fn: () => void): void;
  isLit(): boolean;
  artUrl(part: Part): string | null;
}

let current: Face | null = null;
/** for other lanes (presets.ts, the deck): the same as face.loadPreset / presetName / whenArtReady on the page's face */
export const loadPreset = (i: number, opts?: { afterArrive?: boolean }) => current?.loadPreset(i, opts);
export const presetName = () => current?.presetName() ?? PRESETS[0].name;
export const whenArtReady = () => current?.whenArtReady() ?? Promise.resolve();

export function createFace(root: HTMLElement, art: FaceArt, store: Store): Face {
  const rig = document.createElement('div');
  rig.className = 'wb-rig';
  root.appendChild(rig);

  // ── the art: plate, road effects, lamps (exposure on clipped copies of the plate), needle. No href until the loader. ──
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1536 1024');
  svg.setAttribute('class', 'wb-art');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs>
<linearGradient id="wbRoadFade" gradientUnits="userSpaceOnUse" x1="0" y1="221" x2="0" y2="271"><stop stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
<mask id="wbRoadMask" maskUnits="userSpaceOnUse" x="399" y="221" width="736" height="219"><rect x="399" y="221" width="736" height="219" rx="5" fill="url(#wbRoadFade)"/></mask>
<clipPath id="wbLensL"><rect x="82" y="180" width="264" height="229" rx="25"/></clipPath>
<clipPath id="wbLensR"><rect x="1198" y="180" width="247" height="229" rx="24"/></clipPath>
<filter id="wbLampExp" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR data-exp="lamp" type="linear" slope="0.09"/><feFuncG data-exp="lamp" type="linear" slope="0.09"/><feFuncB data-exp="lamp" type="linear" slope="0.09"/></feComponentTransfer></filter>
<filter id="wbRoadExp" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR data-exp="road" type="linear" slope="0.08"/><feFuncG data-exp="road" type="linear" slope="0.08"/><feFuncB data-exp="road" type="linear" slope="0.08"/></feComponentTransfer></filter>
<filter id="wbGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="wbSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="wbNeedleBlur"><feGaussianBlur stdDeviation="1.4"/></filter>
<linearGradient id="wbBeamGrad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff1cb" stop-opacity=".75"/><stop offset="1" stop-color="#eadcc0" stop-opacity=".05"/></linearGradient>
<linearGradient id="wbHighGrad" gradientUnits="userSpaceOnUse" x1="0" y1="440" x2="0" y2="276"><stop stop-color="#fff1cb" stop-opacity=".0"/><stop offset=".35" stop-color="#fff1cb" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe9" stop-opacity=".95"/></linearGradient>
<radialGradient id="wbBloom"><stop stop-color="#fff1cb" stop-opacity=".85"/><stop offset=".35" stop-color="#ffe2a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<radialGradient id="wbTell"><stop stop-color="#cfe6ff"/><stop offset=".35" stop-color="#4f9dff" stop-opacity=".9"/><stop offset="1" stop-color="#1d5cff" stop-opacity="0"/></radialGradient>
</defs>
<image data-photo width="1536" height="1024" preserveAspectRatio="none"/>
<g mask="url(#wbRoadMask)"><image data-photo width="1536" height="1024" preserveAspectRatio="none" filter="url(#wbRoadExp)"/></g>
<g mask="url(#wbRoadMask)">
 <path data-el="shade" fill="#081019" fill-rule="evenodd"/>
 <g filter="url(#wbGlow)" fill="url(#wbBeamGrad)"><path data-el="beamL"/><path data-el="beamR"/></g>
 <path data-el="anchor" d="M766 296L766 435" stroke="#ecdfbd" stroke-width="3" opacity="0"/>
 <g data-el="high" opacity="0"><path d="M700 440L758 278H774L832 440Z" fill="url(#wbHighGrad)" filter="url(#wbGlow)"/><ellipse cx="766" cy="279" rx="70" ry="10" fill="#fff4d8" opacity=".55" filter="url(#wbSoft)"/></g>
</g>
<g data-el="lamps"><g clip-path="url(#wbLensL)"><image data-photo width="1536" height="1024" preserveAspectRatio="none" filter="url(#wbLampExp)"/></g><g clip-path="url(#wbLensR)"><image data-photo width="1536" height="1024" preserveAspectRatio="none" filter="url(#wbLampExp)"/></g></g>
<g data-el="bloom" opacity="0" style="pointer-events:none"><circle cx="212" cy="290" r="150" fill="url(#wbBloom)"/><circle cx="1320" cy="290" r="150" fill="url(#wbBloom)"/></g>
<g transform="translate(1102 620.5) scale(.75)">
 <g transform="translate(2.6 3.8)"><path data-el="nshadow" d="M-1.7 -54L-.55 -146L.55 -146L1.7 -54Z" fill="#2b1f10" opacity=".38" filter="url(#wbNeedleBlur)"/></g>
 <path data-el="needle" d="M-1.8 -54L-.55 -146L.55 -146L1.8 -54Z" fill="#1b1510"/>
</g>
<circle data-el="tell" cx="1212" cy="584" r="13" fill="url(#wbTell)" opacity="0"/>`;
  rig.appendChild(svg);
  // the plate photo, drawn four times (the face, the road's exposure, the two lenses' exposure): plain <image>s, one URL,
  // one decode. A <use> of one <image> whose href arrives later stays empty in WebKit, so each layer gets the href itself.
  const photos = [...svg.querySelectorAll<SVGImageElement>('image[data-photo]')];
  const q = (n: string) => svg.querySelector(`[data-el="${n}"]`) as SVGElement;
  const E = { shade: q('shade'), beamL: q('beamL'), beamR: q('beamR'), anchor: q('anchor'), high: q('high'), bloom: q('bloom'), needle: q('needle'), nshadow: q('nshadow'), tell: q('tell') };
  const lampFns = [...svg.querySelectorAll('[data-exp="lamp"]')], roadFns = [...svg.querySelectorAll('[data-exp="road"]')];
  const put = (el: Element, k: string, v: string | number) => { const s = String(v); if (el.getAttribute(k) !== s) el.setAttribute(k, s); };

  const box = (cls: string, [x, y, w, h = w]: number[], parent: HTMLElement = rig, tag = 'div') => {
    const el = document.createElement(tag);
    el.className = cls;
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    parent.appendChild(el);
    return el;
  };
  const strip = (parent: HTMLElement, part: Exclude<Part, 'base'>, cls = 'wb-strip') => {
    const s = document.createElement('span'); s.className = cls; parent.appendChild(s); stripGrid(s, S[part]); stripEls.push([s, part]); return s;
  };
  const stripEls: [HTMLElement, Part][] = [];
  const announce = root.querySelector<HTMLElement>('[data-wb-announce]');

  // ── the parts (art only; the hits come after, in reading order) ──
  const knobStrips = {} as Record<Exclude<KnobId, 'tilt'>, HTMLElement>;
  const KNOB_ART: [Exclude<KnobId, 'tilt'>, number[], 'width' | 'focus' | 'mix'][] = [['width', [634, 523, 264], 'width'], ['focus', [257, 622, 166], 'focus'], ['mix', [437, 622, 166], 'mix'], ['reach', [1127, 640, 130], 'mix']];
  for (const [id, b, part] of KNOB_ART) knobStrips[id] = strip(box('wb-knob', b), part);
  const wheelStrip = strip(box('wb-wheel-art', [105, 516, 109.9, 270]), 'wheel');
  const togArt = (b: number[]) => strip(box('wb-toggle', b), 'toggle');
  const highStrip = togArt([929.5, 637, 165, 165]), sideStrip = togArt([1332, 482, 80, 80]);
  // MONO: the cap cut from the plate sinks 3 px inside its bezel
  const monoCap = box('wb-monocap', [1298, 631, 148, 148]);
  // POWER rocker (frames 0..14 the throw, 15 the lit jewel)
  const pw = box('wb-power', [1356, 47, 80, 100]);
  const pwS = strip(pw, 'power'), pwL = strip(pw, 'power', 'wb-strip wb-power-lit');
  pwL.style.backgroundPosition = stripPos(S.power, 15);
  // the LCDs: dark glass first (shown cold and with POWER off: Law 4, a dead screen is dark glass), then the ink
  for (const [cls, b] of [['wb-lcd-glass wb-lcd-glass--trip', [649, 171, 237, 45]], ['wb-lcd-glass wb-lcd-glass--tilt', [86, 472, 148, 46]], ['wb-lcd-glass wb-lcd-glass--preset', [92, 73, 300, 48]]] as [string, number[]][]) box(cls, b);
  const trip = box('wb-lcd wb-lcd--trip', [649, 171, 237, 45]);
  const tiltLcd = box('wb-lcd wb-lcd--tilt', [86, 472, 148, 46]);
  const pName = box('wb-lcd wb-lcd--preset', [120, 73, 190, 48]);
  // the coach's breathing lamp (console.ts says which control)
  const cueEl = box('wb-face-cue', [0, 0, 10, 10]);

  // ── the hits: one group, in reading order ──
  const group = document.createElement('div');
  group.className = 'wb-rig-hits';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'WIDE BEAM controls');
  rig.appendChild(group);
  const hits = {} as Record<HitId, HTMLElement>;
  for (const [id, b, , round] of HITS) {
    const slider = id === 'tilt' || id === 'focus' || id === 'mix' || id === 'width' || id === 'reach';
    const el = box(id === 'tilt' ? 'wb-hit wb-wheel' : `wb-hit ${slider ? 'wb-hit--knob' : id === 'high' || id === 'side' ? 'wb-hit--tog' : id === 'mono' ? 'wb-hit--round' : 'wb-hit--pb'}`, b, group, slider ? 'div' : 'button');
    if (!round) el.classList.add('wb-hit--rect');
    el.setAttribute('data-wb-demo', '');
    if (slider) {
      const k = id as KnobId, d = KNOBS[k];
      el.setAttribute('role', 'slider'); el.tabIndex = 0;
      el.setAttribute('aria-label', d.name);
      el.setAttribute('aria-valuemin', String(d.min)); el.setAttribute('aria-valuemax', String(d.max));
    } else {
      (el as HTMLButtonElement).type = 'button';
      el.setAttribute('aria-label', { prev: 'Previous preset', next: 'Next preset', save: 'Save preset', power: 'Power', high: 'High beam', side: 'Side solo', mono: 'Mono' }[id as string]!);
      if (id === 'high' || id === 'side') el.setAttribute('role', 'switch');
      if (id === 'save') el.setAttribute('data-wb-save', '');
    }
    hits[id] = el;
  }

  // ── the trip LCD: the readout, the hand's control while it is on it, the coach's line in between (garage.js trip) ──
  type TouchId = KnobId | 'high' | 'side' | 'mono' | 'save';
  let touchId: TouchId | null = null, touchUntil = 0, dragId: TouchId | null = null, sayText: string | null = null, tripT = 0;
  let cold = !!root.classList.contains('is-cold'), lcdCold = cold, igniting = false;
  function tripText() {
    const s = store.get();
    if (!s.power || lcdCold) return '';
    const now = performance.now();
    if (touchId && (dragId === touchId || now < touchUntil)) {
      if (touchId === 'save') return 'SAVE: IN THE PLUGIN';
      if (touchId === 'high') return `HIGH BEAM ${s.high ? 'ON' : 'OFF'}`;
      if (touchId === 'side') return `SIDE ${s.side ? 'ON' : 'OFF'}`;
      if (touchId === 'mono') return `MONO ${s.mono ? 'ON' : 'OFF'}`;
      return reading(touchId, s);
    }
    if (sayText) return sayText;
    return s.mono ? 'MONO' : s.side ? 'SIDE ONLY' : reading('width', s);
  }
  function paintTrip() {
    const t = tripText();
    if (trip.textContent !== t) {
      trip.textContent = t;
      // Courier New is 0.6 em a glyph (+1 unit tracking): the plugin's 27 px, down to its preset window's 18 px for a long line
      trip.style.fontSize = t.length > 13 ? `${clamp(((237 - 12) / t.length - 1) / 0.6, 18, 27).toFixed(1)}px` : '';
    }
  }
  const touch = (id: TouchId, ms = 1400) => { touchId = id; touchUntil = performance.now() + ms; clearTimeout(tripT); tripT = window.setTimeout(paintTrip, ms + 30); paintTrip(); };

  // ── sliders: drag, keys, wheel ──
  const getV = (k: KnobId) => store.get()[k] as number;
  const setN = (k: KnobId, n: number) => store.set({ [k]: k === 'focus' ? Math.round(fromNorm(k, n)) : Math.round(fromNorm(k, n) / (k === 'tilt' ? 2 : 1)) * (k === 'tilt' ? 2 : 1) } as Partial<WbParams>, 'face');
  const picked = (el: HTMLElement) => el.classList.contains('is-picked') || document.activeElement === el;
  function bindSlider(el: HTMLElement, k: KnobId) {
    let p: { id: number; touch: boolean; x: number; y: number; n: number; mode: 'pending' | 'turn' | 'off'; axis: 'x' | 'y' | 'any'; wasPicked: boolean; sx: number; sy: number } | null = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const touchy = e.pointerType !== 'mouse';
      p = { id: e.pointerId, touch: touchy, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, n: toNorm(k, getV(k)), mode: touchy ? 'pending' : 'turn', axis: touchy ? 'y' : 'any', wasPicked: picked(el) };
      if (!touchy) { e.preventDefault(); el.focus({ preventScroll: true }); startTurn(e); }
    });
    const startTurn = (e: PointerEvent) => {
      try { el.setPointerCapture(e.pointerId); } catch {}
      root.classList.add('is-dragging'); dragId = k; touch(k);
    };
    el.addEventListener('pointermove', (e) => {
      if (!p || e.pointerId !== p.id) return;
      if (p.mode === 'pending') {
        const dx = e.clientX - p.sx, dy = e.clientY - p.sy;
        if (Math.hypot(dx, dy) < 8) return; // hold until the finger has said which way (mobile-d03)
        if (Math.abs(dx) > Math.abs(dy)) p.axis = 'x';
        else if (p.wasPicked) p.axis = 'y';
        else { p.mode = 'off'; return; } // a vertical swipe on an unpicked knob is the page's scroll (pan-y)
        p.mode = 'turn'; p.x = e.clientX; p.y = e.clientY; p.n = toNorm(k, getV(k));
        startTurn(e);
        return;
      }
      if (p.mode !== 'turn') return;
      const mx = e.clientX - p.x, my = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      const d = p.axis === 'x' ? mx : p.axis === 'y' ? -my : Math.abs(mx) > Math.abs(my) ? mx : -my;
      p.n = clamp(p.n + (d / 200) * (e.shiftKey || e.altKey ? 0.2 : 1), 0, 1); // 200 CSS px = the whole travel (demo-13)
      setN(k, p.n);
    });
    const end = (e: PointerEvent) => {
      if (!p || e.pointerId !== p.id) return;
      const tap = p.touch && p.mode === 'pending' && e.type === 'pointerup';
      if (p.mode === 'turn') { dragId = null; touch(k, 1200); }
      p = null;
      root.classList.remove('is-dragging');
      if (tap) { el.classList.add('is-picked'); el.focus({ preventScroll: true }); touch(k); } // a tap picks the knob: it now takes vertical drags too
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', () => { if (dragId === k) { dragId = null; root.classList.remove('is-dragging'); } });
    // the wheel turns a control only once the visitor has picked it (click, tap or Tab): scrolling past the dash never turns
    // a knob. While it has focus, Lenis leaves the wheel to it (data-lenis-prevent-wheel). ~3 % of the travel a notch.
    el.addEventListener('wheel', (e) => {
      if (document.activeElement !== el) return;
      e.preventDefault();
      const notches = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaMode === 2 ? e.deltaY : e.deltaY / 100;
      setN(k, toNorm(k, getV(k)) - notches * 0.03 * (e.shiftKey ? 0.2 : 1));
      touch(k);
    }, { passive: false });
    el.addEventListener('keydown', (e) => {
      let n: number | null = null;
      if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 1;
      else if (KEYSTEP[e.key]) n = toNorm(k, getV(k)) + KEYSTEP[e.key] * 0.01;
      if (n === null) return;
      e.preventDefault(); // only these keys: Tab, letters and Space keep their own jobs
      setN(k, n);
      touch(k);
    });
    el.addEventListener('dblclick', () => store.set({ [k]: (presetValues(PRESETS[0]) as any)[k] } as Partial<WbParams>, 'face'));
    el.addEventListener('focus', () => { el.setAttribute('data-lenis-prevent-wheel', ''); touch(k); });
    el.addEventListener('blur', () => { el.removeAttribute('data-lenis-prevent-wheel'); el.classList.remove('is-picked'); });
  }
  for (const k of ['tilt', 'focus', 'mix', 'width', 'reach'] as KnobId[]) bindSlider(hits[k], k);

  // ── bat toggles HIGH BEAM and SIDE (over-centre spring, one bounce off the stop: garage.js swStep) ──
  const spring = (strip: HTMLElement, key: 'high' | 'side') => {
    let ang = store.get()[key] ? 35 : -35, vel = 0, raf = 0, T = 0;
    const paint = () => { strip.style.backgroundPosition = stripPos(S.toggle, Math.round(((ang + 35) / 70) * 28)); };
    const step = (now: number) => {
      raf = 0; const dt = Math.min(0.02, (now - T) / 1000); T = now;
      const on = store.get()[key], stop = on ? 35 : -35, dir = Math.sign(stop - ang) || (on ? 1 : -1);
      vel += dir * 9000 * dt; ang += vel * dt;
      if (on ? ang >= 35 : ang <= -35) { ang = stop; vel = -vel * 0.22; if (Math.abs(vel) < 40) vel = 0; }
      paint();
      if (vel !== 0 || ang !== stop) raf = requestAnimationFrame(step);
    };
    paint();
    return () => { if (reducedNow()) { ang = store.get()[key] ? 35 : -35; paint(); return; } if (!raf) { T = performance.now(); raf = requestAnimationFrame(step); } };
  };
  const highKick = spring(highStrip, 'high'), sideKick = spring(sideStrip, 'side');
  hits.high.addEventListener('click', () => { store.set({ high: !store.get().high }, 'face'); touch('high'); });
  hits.side.addEventListener('click', () => { store.set({ side: !store.get().side }, 'face'); touch('side'); });
  hits.mono.addEventListener('click', () => { store.set({ mono: !store.get().mono }, 'face'); touch('mono'); });
  hits.power.addEventListener('click', () => store.set({ power: !store.get().power }, 'face'));
  hits.prev.addEventListener('click', () => loadPreset(store.preset - 1));
  hits.next.addEventListener('click', () => loadPreset(store.preset + 1));
  hits.save.addEventListener('click', () => { touch('save', 2400); speak('Saving your own presets happens in the plugin itself, as files.'); });

  // POWER rocker: the paddle throws, the jewel fades in like a bulb once the paddle has settled ON (garage.js)
  let pAng = store.get().power ? 14 : -14, pVel = 0, pRaf = 0, pT = 0, pLamp = 0;
  const pStep = (now: number) => {
    pRaf = 0; const dt = Math.min(0.02, (now - pT) / 1000); pT = now;
    const on = store.get().power, stop = on ? 14 : -14, dir = Math.sign(stop - pAng) || (on ? 1 : -1);
    if (reducedNow()) { pAng = stop; pVel = 0; } else { pVel += dir * 5200 * dt; pAng += pVel * dt; }
    if (on ? pAng >= 14 : pAng <= -14) { pAng = stop; pVel = -pVel * 0.22; if (Math.abs(pVel) < 30) pVel = 0; }
    const settled = pVel === 0 && pAng === stop, goal = on && settled && !cold ? 1 : 0;
    if (reducedNow()) pLamp = goal; else { pLamp += (goal - pLamp) * (1 - Math.exp(-dt * (goal > pLamp ? 14 : 9))); if (Math.abs(goal - pLamp) < 0.003) pLamp = goal; }
    pwS.style.backgroundPosition = stripPos(S.power, Math.round(((pAng + 14) / 28) * 14)); pwL.style.opacity = pLamp.toFixed(3);
    if (!settled || pLamp !== goal) pRaf = requestAnimationFrame(pStep);
  };
  const pKick = () => { if (!pRaf) { pT = performance.now(); pRaf = requestAnimationFrame(pStep); } };
  pwS.style.backgroundPosition = stripPos(S.power, Math.round(((pAng + 14) / 28) * 14)); pwL.style.opacity = '0';

  // ── 44 CSS px hits wherever the neighbours leave room (demo-09), and the ring's 3 CSS px (a11y-13) ──
  function fitHits(k: number) {
    const min = 44 / k;
    for (const [id, [x, y, w, h], [x0, y0, x1, y1]] of HITS) {
      const W = Math.max(w, Math.min(min, x1 - x0)), H = Math.max(h, Math.min(min, y1 - y0));
      const X = clamp(x + w / 2 - W / 2, x0, x1 - W), Y = clamp(y + h / 2 - H / 2, y0, y1 - H);
      Object.assign(hits[id].style, { left: X + 'px', top: Y + 'px', width: W + 'px', height: H + 'px' });
    }
  }

  // ── presets: the knobs glide (no overshoot, every value clamped: motion-01), MONO + SIDE off, POWER untouched ──
  let glide = 0, pending: number | null = null, artReady = false, holdCheck = 0;
  function loadPreset(i: number, _opts?: { afterArrive?: boolean }) {
    const n = PRESETS.length;
    pending = ((Math.round(i) % n) + n) % n;
    whenArtReady();
    // one frame later: a drive started by the same click (driveTo after loadPreset) then owns the timing
    cancelAnimationFrame(holdCheck);
    holdCheck = requestAnimationFrame(tryGlide);
  }
  function tryGlide() {
    if (pending === null) return;
    if (isDriving() || !artReady) return; // resumed on the drive's arrival / when the art is in
    const i = pending; pending = null;
    store.preset = i;
    const from = store.get(), to = presetValues(PRESETS[i]);
    cancelAnimationFrame(glide);
    store.set({ mono: false, side: false, high: to.high }, 'preset');
    speak(`Preset ${String(i + 1).padStart(2, '0')}, ${PRESETS[i].name}`, true);
    const keys: KnobId[] = ['width', 'focus', 'mix', 'tilt', 'reach'], t0 = performance.now(), dur = reducedNow() ? 0 : 520;
    const n0 = Object.fromEntries(keys.map((k) => [k, toNorm(k, from[k] as number)])), n1 = Object.fromEntries(keys.map((k) => [k, toNorm(k, to[k] as number)]));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // a motor settling on its stop: no overshoot
    const run = (now: number) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1, e = ease(t), v: Partial<WbParams> = {};
      for (const k of keys) (v as any)[k] = t >= 1 ? to[k] : Math.round(fromNorm(k, n0[k] + (n1[k] - n0[k]) * e));
      store.set(v, 'preset');
      if (t < 1) glide = requestAnimationFrame(run); else { store.edited = false; paintStatic(); }
    };
    store.edited = false;
    glide = requestAnimationFrame(run);
  }

  // ── what the announcer says: built from what changed (a11y-07) ──
  let sayT = 0;
  function speak(text: string, now = false) {
    if (!announce) return;
    clearTimeout(sayT);
    const put = () => { announce.textContent = ''; requestAnimationFrame(() => { announce.textContent = text; }); };
    if (now) put(); else sayT = window.setTimeout(put, 120);
  }
  const ONOFF: [keyof WbParams, string][] = [['power', 'Power'], ['high', 'High beam'], ['mono', 'Mono'], ['side', 'Side solo']];
  function message(ch: Partial<WbParams>, src: Source) {
    const parts: string[] = [];
    for (const [k, label] of ONOFF) if (k in ch) parts.push(k === 'power' && src === 'console' ? (ch.power ? 'WIDE BEAM on' : 'Original, WIDE BEAM bypassed') : `${label} ${ch[k] ? 'on' : 'off'}`);
    return parts.join('. ');
  }

  // ── live paint ──
  let shown = 0, dark = 1, corrIn: number | null = null, nPos = 0, nVel = 0, raf = 0, last = 0, hbShown = 0, onScreen = true;
  const effective = () => { const s = store.get(); return s.power && !s.mono ? s.width : 0; };

  function paintStatic() {
    const s = store.get();
    for (const k of ['width', 'focus', 'mix', 'reach'] as const) {
      const d = KNOBS[k], v = s[k], m = S[k === 'reach' ? 'mix' : k];
      knobStrips[k].style.backgroundPosition = stripPos(m, Math.round(((v - d.min) / (d.max - d.min)) * (m.frames - 1)));
      hits[k].setAttribute('aria-valuenow', String(Math.round(v)));
      hits[k].setAttribute('aria-valuetext', valueText(k, v));
    }
    wheelStrip.style.backgroundPosition = stripPos(S.wheel, Math.round(((s.tilt + 100) / 200) * 80));
    hits.tilt.setAttribute('aria-valuenow', String(s.tilt)); hits.tilt.setAttribute('aria-valuetext', valueText('tilt', s.tilt));
    paintTrip();
    tiltLcd.textContent = s.power && !lcdCold ? fmtTilt(s.tilt) : '';
    // the preset window is on the accessory circuit: lit with POWER off (cards.css), dark only before the ignition
    pName.textContent = lcdCold ? '' : PRESETS[store.preset].name.toUpperCase() + (store.edited ? '*' : '');
    monoCap.classList.toggle('is-down', s.mono);
    hits.mono.setAttribute('aria-pressed', String(s.mono));
    hits.high.setAttribute('aria-checked', String(s.high));
    hits.side.setAttribute('aria-checked', String(s.side));
    hits.power.setAttribute('aria-pressed', String(s.power));
    root.classList.toggle('is-off', !s.power);
  }

  function frame(now: number) {
    raf = 0;
    const dt = last ? clamp((now - last) / 1000, 0, 0.1) : 1 / 60; last = now;
    const s = store.get(), snap = reducedNow();
    const goal = igniting ? shown : cold ? 0 : effective(), dg = s.power && !cold ? 0 : 1;
    if (!igniting) shown = snap ? goal : shown + (goal - shown) * (1 - Math.exp(-dt * (goal > shown ? 9 : 6)));
    if (Math.abs(shown - goal) < 0.1) shown = goal;
    if (!igniting) { dark = snap ? dg : dark + (dg - dark) * (1 - Math.exp(-dt * (dg > dark ? 6 : 9))); if (Math.abs(dark - dg) < 0.002) dark = dg; }
    const hbGoal = s.high && s.power && !cold ? 0.35 + 0.65 * (s.reach / 100) : 0;
    hbShown = snap ? hbGoal : hbShown + (hbGoal - hbShown) * (1 - Math.exp(-dt * (hbGoal > hbShown ? 9 : 6)));
    if (Math.abs(hbShown - hbGoal) < 0.002) hbShown = hbGoal;

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

    // the needle: the measured correlation when audio plays, otherwise the plugin's browser simulation; at rest when cold
    let target = corrIn ?? (s.mono ? 1 : clamp(1 - (w / 100) * (s.mix / 100) * 0.27, 0, 1));
    if (corrIn === null && s.high) target = Math.max(-1, target - 0.45 * s.reach / 100);
    if (corrIn === null && s.side) target = -0.85;
    if (!s.power || cold) target = 0;
    if (snap) { nPos = target; nVel = 0; } else { const k = 140, c = 2 * Math.sqrt(k) * 0.7; nVel += (k * (target - nPos) - c * nVel) * Math.min(dt, 0.033); nPos += nVel * Math.min(dt, 0.033); }
    if (Math.abs(target - nPos) < 0.0005 && Math.abs(nVel) < 0.0005) { nPos = target; nVel = 0; }
    const rot = `rotate(${(nPos * 50).toFixed(2)})`;
    put(E.needle, 'transform', rot); put(E.nshadow, 'transform', rot);

    const busy = shown !== goal || dark !== dg || hbShown !== hbGoal || nPos !== target || nVel !== 0 || corrIn !== null || igniting;
    if (busy && onScreen) raf = requestAnimationFrame(frame); // off screen the loop sleeps (a11y-17); the observer wakes it
  }
  const kick = () => { if (!raf && onScreen) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) kick(); }).observe(root);

  store.on((s, ch, src) => {
    if ('high' in ch) highKick();
    if ('side' in ch) sideKick();
    if ('power' in ch) pKick();
    paintStatic();
    kick();
    if (src === 'face' || src === 'key' || src === 'console' || src === 'deck') { const m = message(ch, src); if (m) speak(m); }
  });

  // scale the 1536-wide rig to the face's box
  let k = 1;
  const fit = () => { k = (root.clientWidth || 1536) / 1536; rig.style.transform = `scale(${k})`; root.style.setProperty('--wb-k', k.toFixed(4)); fitHits(k); };
  new ResizeObserver(fit).observe(root);
  fit();
  paintStatic();
  kick();

  // ── the art: set by the loader in one frame ──
  const urls: Partial<Record<Part, string>> = {};
  let artResolve: () => void = () => {};
  const artReadyP = new Promise<void>((r) => { artResolve = r; });
  let wantLoad: (() => void) | null = null;
  function whenArtReady() { wantLoad?.(); return artReadyP; }
  function applyArt(next: Partial<Record<Part, string>>) {
    Object.assign(urls, next);
    if (next.base) { photos.forEach((im) => im.setAttribute('href', next.base!)); monoCap.style.backgroundImage = `url(${next.base})`; }
    for (const [el, part] of stripEls) if (next[part]) el.style.backgroundImage = `url(${next[part]})`;
    if (!artReady) {
      artReady = true;
      root.classList.add('is-art');
      artResolve();
      tryGlide();
    }
  }

  // ── the ignition: the jewel, two coughs, the LCDs with the second, then the halogen lag onto WIDTH ──
  const igniteFns: (() => void)[] = [];
  let wantIgnite = false;
  const lightLcds = () => { lcdCold = false; root.classList.remove('is-cold'); paintStatic(); };
  function ignite() {
    if (!cold || igniting) return;
    if (!artReady) { wantIgnite = true; return; }
    wantIgnite = false;
    cold = false;
    pKick();
    const done = () => { igniting = false; kick(); igniteFns.forEach((f) => f()); };
    if (reducedNow() || !store.get().power) { lightLcds(); shown = effective(); dark = store.get().power ? 0 : 1; done(); return; }
    igniting = true; shown = 0; dark = 1; kick();
    const seq: [number, number][] = [[120, 70], [220, 6], [330, 110], [430, 18], [560, -1]];
    seq.forEach(([t, v], i) => setTimeout(() => {
      if (v < 0) { done(); return; }
      shown = v * 2; dark = 0;
      if (i === 2) lightLcds(); // the LCDs flicker on with the second cough
      kick();
    }, t));
  }

  const face: Face = {
    root,
    setCorrelation(c) { corrIn = c; kick(); },
    loadPreset,
    presetName: () => PRESETS[store.preset].name,
    whenArtReady,
    ignite,
    say(text) { sayText = text; paintTrip(); },
    cue(target) {
      const b = target === 'width' ? [626, 515, 280, 280] : target === 'mono' ? [1294, 627, 156, 156] : target === 'power' ? [1340, 41, 112, 112] : null;
      cueEl.classList.toggle('is-on', !!b);
      if (b) Object.assign(cueEl.style, { left: b[0] + 'px', top: b[1] + 'px', width: b[2] + 'px', height: b[3] + 'px' });
    },
    onIgnite(fn) { if (!cold && !igniting) fn(); else igniteFns.push(fn); },
    isLit: () => !cold && !igniting,
    artUrl: (part) => urls[part] ?? null,
  };
  // internal hooks for initFace (not part of the Face API)
  (face as any)._art = { applyArt, setLoader: (fn: () => void) => { wantLoad = fn; }, wantIgnite: () => wantIgnite, isCold: () => cold, scale: () => k, tryGlide };
  current = face;
  return face;
}

/** The page's dash: builds the face, loads its art late, lights it when it lands, raises it once as it comes in. */
export function initFace(page: HTMLElement, art: FaceArt, store: Store, reducedMotion: boolean) {
  const faceEl = page.querySelector<HTMLElement>('[data-wb-face]')!;
  const face = createFace(faceEl, art, store);
  const hooks = (face as any)._art as { applyArt(u: Partial<Record<Part, string>>): void; setLoader(fn: () => void): void; wantIgnite(): boolean; isCold(): boolean; scale(): number; tryGlide(): void };
  const section = page.querySelector<HTMLElement>('#wb-drive') ?? faceEl;
  const holdCold = new URLSearchParams(location.search).has('wb-cold');

  // ── the tiers (WbDrive.astro); the page's own full-size art is the fallback ──
  let tiers: Tiers = {};
  try { tiers = JSON.parse(faceEl.dataset.wbArt || '{}'); } catch {}
  for (const p of Object.keys(NEED) as Part[]) if (!tiers[p]?.length && art?.[p]) tiers[p] = [[p === 'base' ? 3072 : 1e6, art[p]]];
  const loaded: Partial<Record<Part, number>> = {};
  // a tier the page's head already preloads costs nothing more: it wins (widebeam.astro's plate preload, until it goes)
  const preloaded = new Set([...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]')].map((l) => l.href));
  // the smallest tier whose frame covers the part's widest box at its rendered size x DPR (a tier's number is its frame
  // width in px; the plate's is its width for the 1536 units). Dan's 1141 laptop at 115 % (DPR ~2.3) gets the full knobs.
  const pick = (p: Part) => {
    const list = (tiers[p] ?? []).slice().sort((a, b) => a[0] - b[0]);
    if (!list.length) return null;
    const pre = list.find(([, u]) => preloaded.has(new URL(u, location.href).href));
    if (pre) return pre;
    const dpr = window.devicePixelRatio || 1;
    let need = NEED[p] * hooks.scale() * dpr;
    if (p === 'toggle') { const bat = document.querySelector<HTMLElement>('[data-wb-bat]'); if (bat) need = Math.max(need, bat.getBoundingClientRect().width * dpr); }
    return list.find(([t]) => t >= need) ?? list[list.length - 1];
  };

  let loading: Promise<void> | null = null;
  const decode = (u: string) => { const im = new Image(); im.decoding = 'async'; im.src = u; return im.decode().catch(() => {}); };
  function loadArt() {
    if (loading) return loading;
    loading = (async () => {
      const want: Partial<Record<Part, string>> = {};
      for (const p of Object.keys(NEED) as Part[]) { const t = pick(p); if (t) { want[p] = t[1]; loaded[p] = t[0]; } }
      await Promise.all(Object.values(want).map((u) => decode(u!)));
      await new Promise((r) => requestAnimationFrame(r));
      hooks.applyArt(want); // every part in the same frame (perf-04)
      window.dispatchEvent(new CustomEvent('wb:art'));
      if (hooks.wantIgnite() || landedNow()) face.ignite();
    })();
    return loading;
  }
  hooks.setLoader(() => { loadArt(); });
  // a bigger screen (a rotated phone, a zoom) can need a sharper tier later: upgrade only
  let upT = 0;
  new ResizeObserver(() => {
    if (!loading) return;
    clearTimeout(upT);
    upT = window.setTimeout(async () => {
      const up: Partial<Record<Part, string>> = {};
      for (const p of Object.keys(NEED) as Part[]) { const t = pick(p); if (t && t[0] > (loaded[p] ?? 0)) { up[p] = t[1]; loaded[p] = t[0]; } }
      if (!Object.keys(up).length) return;
      await Promise.all(Object.values(up).map((u) => decode(u!)));
      requestAnimationFrame(() => { hooks.applyArt(up); window.dispatchEvent(new CustomEvent('wb:art')); });
    }, 500);
  }).observe(faceEl);

  // the loader's triggers: the first of the intro's hand-off + idle, the dash within 1.5 screens, an act on the demo, 8 s.
  // "Within 1.5 screens" counts on the visitor's own scroll: on a laptop the dash already sits that close under the hero
  // at load, and the art must not race the intro's first seconds (perf-01).
  const introRunning = () => {
    const hero = page.querySelector('.wb-hero'), v = page.querySelector<HTMLVideoElement>('video[data-wb-intro]');
    return !!hero?.classList.contains('is-intro') || (!!v && !v.paused && !v.ended && !v.classList.contains('is-gone'));
  };
  const near = () => section.getBoundingClientRect().top < innerHeight * 2.5;
  const onScroll = () => { if (loading) removeEventListener('scroll', onScroll); else if (near() && (scrollY > 2 || !introRunning())) loadArt(); };
  addEventListener('scroll', onScroll, { passive: true });
  if (scrollY > 2) onScroll(); // a reload that restored the scroll, a link to #wb-drive
  const intent = (e: Event) => { if ((e.target as Element)?.closest?.('[data-wb-demo]')) loadArt(); };
  page.addEventListener('pointerdown', intent, true);
  page.addEventListener('keydown', intent, true);
  page.addEventListener('click', intent, true);
  window.setTimeout(loadArt, 8000);
  const idle = (fn: () => void) => ((window as any).requestIdleCallback ? (window as any).requestIdleCallback(fn, { timeout: 2000 }) : window.setTimeout(fn, 600));
  const handoff = window.setInterval(() => { if (loading) { clearInterval(handoff); return; } if (!introRunning()) { clearInterval(handoff); idle(() => loadArt()); } }, 400);

  // ── landing: the face mostly on screen and the page at rest (or a drive's arrival) lights it ──
  const nav = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
  const visible = () => { const r = faceEl.getBoundingClientRect(); const top = nav(); return r.height ? Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(top, r.top)) / r.height : 0; };
  const needVis = () => Math.min(0.7, ((innerHeight - nav()) / Math.max(1, faceEl.getBoundingClientRect().height)) * 0.9);
  let lastScroll = performance.now(), visSince = 0, landT = 0;
  addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  const landedNow = () => !holdCold && visible() >= needVis();
  const watch = () => {
    clearInterval(landT);
    landT = window.setInterval(() => {
      if (holdCold || !hooks.isCold()) { clearInterval(landT); return; }
      const now = performance.now();
      if (visible() >= needVis()) { if (!visSince) visSince = now; } else { visSince = 0; return; }
      if (now - lastScroll >= 150 || now - visSince >= 600) { face.ignite(); if (!hooks.isCold()) clearInterval(landT); }
    }, 100);
  };
  new IntersectionObserver(([e]) => { if (e.isIntersecting) watch(); else { clearInterval(landT); visSince = 0; } }, { threshold: [0, 0.35] }).observe(faceEl);

  // ── the rise: once, solid (rotateX + y), when the dash comes in; finished off screen by a drive to the face ──
  const dash = page.querySelector<HTMLElement>('[data-wb-dash]');
  const wrap = dash?.parentElement;
  let riseArmed = false, riseST: ScrollTrigger | null = null;
  const rise = (instant: boolean) => {
    if (!riseArmed || !dash) return;
    riseArmed = false; riseST?.kill();
    if (instant || reducedMotion) { gsap.killTweensOf(dash); gsap.set(dash, { clearProps: 'transform,willChange' }); return; }
    dash.style.willChange = 'transform';
    gsap.to(dash, { rotateX: 0, y: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform,willChange' });
  };
  if (dash && wrap && !reducedMotion && wrap.getBoundingClientRect().top > innerHeight * 0.88) {
    gsap.set(dash, { rotateX: 14, y: 46, transformOrigin: '50% 100%' });
    riseArmed = true;
    riseST = ScrollTrigger.create({ trigger: wrap, start: 'top 88%', once: true, onEnter: () => rise(false) });
  }
  addEventListener('wb:drive', (e: Event) => {
    const d = (e as CustomEvent).detail || {};
    if (d.phase === 'start') { if (d.face) rise(true); loadArt(); }
    if (d.phase === 'arrive') {
      requestAnimationFrame(() => {
        hooks.tryGlide();
        if (d.face && landedNow()) face.ignite();
      });
    }
  });

  // "Take it for a drive" (the hero's <a href="#wb-drive" data-wb-start>, lane H's): the face lands centred (motion-d01).
  // Lenis's own anchor jump (its click listener on window) would put the section's top under the nav and the face half
  // off screen, and would replace any drive. Until the hero drives it itself (lane H: driveTo('#wb-drive', { align:
  // 'face' }) with preventDefault and stopPropagation), the dash does; a handler that ran first and prevented the default
  // owns the drive. Without JS the link is a plain jump to the dash.
  page.querySelectorAll<HTMLAnchorElement>('a[data-wb-start][href="#wb-drive"]').forEach((a) => a.addEventListener('click', (e) => {
    e.stopPropagation(); // first: Lenis never sees this click, whoever drives
    if (e.defaultPrevented) return;
    e.preventDefault();
    driveTo('#wb-drive', { align: 'face' });
  }));

  // the engine key turns the key in the dash: it lights the face (once the art is in)
  const ignite = () => { if (!holdCold) face.ignite(); };
  return { face, ignite, dash };
}
