/**
 * The living WIDE BEAM face. Built on a clean 2x capture of the plugin's own face (every moving part hidden), with the
 * plugin's baked filmstrips laid back on their seats, in the plugin's 1536×1024 coordinates (WideBeam Source/ui:
 * index.html, garage.css, garage.js, cards.css). The lamps, the road and the beams use app.js's maths: lamp exposure
 * 0.09 + 0.91·e^0.72, halogen lag (rise fast, decay slower), the road shade and beam cones opening with WIDTH. The needle
 * is the meter's mass-spring (k 140, ζ 0.7) about its pivot, drawn at the meter's 0.75 scale.
 *
 * The arrival is one sequence (plan D.1):
 *  - the art loads late, through one loader: the first of the dash within 1.5 screens, an act on the demo, a drive, or
 *    the page at rest once its first view is over (12 s + idle; was 8 s / the hand-off, which put the art in G11's
 *    first view) (perf-01, hero-05, guidelines-15). Each part comes in the size tier its rendered size x DPR
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
 * On a phone held upright (D.4, DECK_MQ) the face is the live display and deck.ts holds the controls: the face goes inert
 * (its announcer lives beside it, in .wb-dash), the art loads once the face is within two screens (not on the at-rest
 * clock), and each strip's tier covers the larger of its face and deck sizes (one file for both). The soft snap on
 * the dash (D.5, motion-17): snap.ts.
 *
 * /widebeam/?wb-cold keeps the face dark forever: the switch that captures face-still.webp (see WbDrive.astro).
 */
import type { WbParams } from './audio';
import { PRESETS, presetValues, type Store, type Source } from './state';
import { gsap, ScrollTrigger } from '../motion';
import { driveTo, isDriving, deckOn, navH } from './drive-to';
import { initSnap } from './snap';

export interface FaceArt { base: string; width: string; focus: string; mix: string; toggle: string; power: string; wheel: string; }
export type Part = keyof FaceArt;
type Tiers = Partial<Record<Part, [number, string][]>>;
export type CueTarget = 'width' | 'mono' | 'power' | 'high' | null;

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const reducedNow = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// the strips' grids and the knobs' laws are shared with the phone deck (deck.ts)
export type Strip = { frames: number; cols: number; rows: number };
export const S: Record<Exclude<Part, 'base'>, Strip> = {
  width: { frames: 101, cols: 11, rows: 10 },
  focus: { frames: 129, cols: 12, rows: 11 },
  mix: { frames: 101, cols: 11, rows: 10 },
  toggle: { frames: 29, cols: 6, rows: 5 },
  power: { frames: 16, cols: 4, rows: 4 },
  wheel: { frames: 81, cols: 9, rows: 9 },
};
export const stripPos = (m: Strip, f: number) => `${((f % m.cols) / (m.cols - 1)) * 100}% ${(Math.floor(f / m.cols) / (m.rows - 1)) * 100}%`;
export const stripGrid = (el: HTMLElement, m: Strip) => { el.style.backgroundSize = `${m.cols * 100}% ${m.rows * 100}%`; };
// the widest box (plugin units) each file is drawn at on the face; the tier is the smallest whose frame covers it x scale x DPR
const NEED: Record<Part, number> = { base: 1536, width: 264, focus: 166, mix: 166, toggle: 165, power: 80, wheel: 110 };

export type KnobId = 'width' | 'focus' | 'mix' | 'reach' | 'tilt';
export const KNOBS: Record<KnobId, { min: number; max: number; unit: string; label: string; name: string; log: boolean }> = {
  width: { min: 0, max: 200, unit: '%', label: 'WIDTH', name: 'Width', log: false },
  focus: { min: 20, max: 1000, unit: 'Hz', label: 'FOCUS', name: 'Low focus', log: true },
  mix: { min: 0, max: 100, unit: '%', label: 'MIX', name: 'Mix', log: false },
  reach: { min: 0, max: 100, unit: '%', label: 'REACH', name: 'Reach', log: false },
  tilt: { min: -100, max: 100, unit: 'dB', label: 'TILT', name: 'Tilt', log: false },
};
export const toNorm = (k: KnobId, v: number) => { const d = KNOBS[k]; return d.log ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min); };
export const fromNorm = (k: KnobId, n: number) => { const d = KNOBS[k]; n = clamp(n, 0, 1); return d.log ? d.min * Math.pow(d.max / d.min, n) : d.min + n * (d.max - d.min); };
/** the value a knob takes at travel n (0-1): what the face's own drag writes (FOCUS in whole Hz, TILT in steps of 2) */
export const knobValue = (k: KnobId, n: number) => (k === 'focus' ? Math.round(fromNorm(k, n)) : Math.round(fromNorm(k, n) / (k === 'tilt' ? 2 : 1)) * (k === 'tilt' ? 2 : 1));
const fmtTilt = (t: number) => { const db = (t / 100) * 6.02; return `${db > 0.04 ? '+' : db < -0.04 ? '-' : ''}${Math.abs(db).toFixed(1)}dB`; };
const reading = (k: KnobId, s: WbParams) => (k === 'tilt' ? `TILT ${fmtTilt(s.tilt)}` : `${KNOBS[k].label} ${Math.round(s[k])}${KNOBS[k].unit}`);
export const valueText = (k: KnobId, v: number) => (k === 'tilt' ? fmtTilt(v).replace('dB', ' dB') : `${Math.round(v)} ${KNOBS[k].unit === '%' ? 'percent' : 'hertz'}`);

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
export const KEYSTEP: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 8, PageDown: -8 };
/** what the trip LCD can be showing the reading of: a knob, a switch, or SAVE's note */
export type TouchId = KnobId | 'high' | 'side' | 'mono' | 'save';

export interface Face {
  root: HTMLElement;
  setCorrelation(c: number | null): void;
  /** Glides the knobs to preset i (wraps). The glide waits for a drive on its way to arrive, so the visitor
   *  sees it (with the art not in yet it lands at once); `afterArrive` asks for exactly that (it is the default now; kept for lane S's calls). */
  loadPreset(i: number, opts?: { afterArrive?: boolean }): void;
  /** steps d presets from the one asked for last (a press still waiting on a drive counts: three quick presses = three) */
  stepPreset(d: number): void;
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
  /** the phone deck (deck.ts): its control's reading shows on the trip LCD for `ms`, as a touch on the face does */
  touch(id: TouchId, ms?: number): void;
  /** the phone deck: a drag on one of its knobs keeps that reading on the trip LCD until null */
  drag(id: TouchId | null): void;
  /** hears the trip LCD's text whenever it changes ('' = dark glass); the deck's readout prints the same */
  onTrip(fn: (text: string) => void): void;
}

/** A knob picked by a tap (it then takes vertical drags, touch-action none) keeps the pick only while the visitor is
 *  with it: a touch anywhere else, or the knob leaving the screen, drops it (blur; keyboard focus is never touched, a
 *  knob only carries is-picked from a tap). A swipe-scroll moves no focus, so without this a stale pick trapped the next
 *  scroll swipe that began on the knob and slammed it to its stop (demo-02, r-dash-pickstick). */
export function releasePick(box: HTMLElement, focusEl: HTMLElement = box) {
  const drop = () => {
    if (!box.classList.contains('is-picked')) return;
    box.classList.remove('is-picked');
    if (document.activeElement === focusEl) focusEl.blur();
  };
  document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' && !box.contains(e.target as Node)) drop(); }, true);
  new IntersectionObserver(([en]) => { if (!en.isIntersecting) drop(); }).observe(box);
}

/** Shrinks one LCD line to fit its window (from `base`, '' = its CSS size). The windows are fixed glass; a visitor's own
 *  text spacing (WCAG 1.4.12: letter-spacing .12em and up) made the long names overflow them, cut with no other way to
 *  read them (r-dash-spacing). At default spacing every name fits, and nothing changes. Measured on the text's own box
 *  (a Range), so a centred flex line and the rig's scale count right. */
export function fitLine(el: HTMLElement, base = '') {
  el.style.fontSize = base;
  const r = el.getBoundingClientRect();
  if (!r.width || !el.offsetWidth || !el.textContent) return;
  const cs = getComputedStyle(el), k = r.width / el.offsetWidth;
  const room = r.width - (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) * k;
  const rg = document.createRange(); rg.selectNodeContents(el);
  const t = rg.getBoundingClientRect().width;
  if (t > room + 0.5) el.style.fontSize = `${((parseFloat(cs.fontSize) * room) / t * 0.98).toFixed(2)}px`;
}
const refits = new Set<() => void>();
/** runs fn again whenever the page's styles may have changed under the LCDs: a stylesheet added (a text-spacing tool, a
 *  user style), the fonts arriving */
export function onRefit(fn: () => void) {
  if (!refits.size) {
    const run = () => requestAnimationFrame(() => refits.forEach((f) => f()));
    new MutationObserver(run).observe(document.head, { childList: true });
    document.fonts?.ready.then(run);
  }
  refits.add(fn);
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
  // the announcer sits beside the face, not in it: on an upright phone the face is inert (the deck holds the controls),
  // and an inert subtree is out of the accessibility tree, live region and all
  const announce = root.querySelector<HTMLElement>('[data-wb-announce]') ?? root.closest('[data-wb-dash]')?.querySelector<HTMLElement>('[data-wb-announce]') ?? null;

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
  let touchId: TouchId | null = null, touchUntil = 0, dragId: TouchId | null = null, sayText: string | null = null, tripT = 0, reachHint = -1e9;
  const tripFns: ((t: string) => void)[] = [];
  let cold = !!root.classList.contains('is-cold'), lcdCold = cold, igniting = false, artFailed = false;
  function tripText() {
    const s = store.get();
    if (artFailed) return 'RELOAD THE PAGE'; // the art did not load (initFace loadArt; the status line says why)
    if (!s.power || lcdCold) return '';
    const now = performance.now();
    if (touchId && (dragId === touchId || now < touchUntil)) {
      if (touchId === 'save') return 'SAVE: IN THE PLUGIN';
      // the switch reads SPREAD ON / OFF (the plugin's trip table since round 13, garage.js; the plate keeps HIGH BEAM),
      // and a hand on REACH with the beam down says SPREAD OFF for 600 ms first, as the plugin does
      if (touchId === 'high') return `SPREAD ${s.high ? 'ON' : 'OFF'}`;
      if (touchId === 'reach' && !s.high && now - reachHint < 600) return 'SPREAD OFF';
      if (touchId === 'side') return `SIDE ${s.side ? 'ON' : 'OFF'}`;
      if (touchId === 'mono') return `MONO ${s.mono ? 'ON' : 'OFF'}`;
      return reading(touchId, s);
    }
    if (sayText) return sayText;
    return s.mono ? 'MONO' : s.side ? 'SIDE ONLY' : reading('width', s);
  }
  // (refitted when the line's length changes, not on every reading: the LCD face is monospace, and a glide or a drag
  // repaints the trip every frame)
  let tripLen = -1;
  const fitTrip = (force = false) => { const t = trip.textContent || ''; if (!force && t.length === tripLen) return; tripLen = t.length; fitLine(trip, t.length > 13 ? `${clamp(((237 - 12) / t.length - 1) / 0.6, 18, 27).toFixed(1)}px` : ''); };
  onRefit(() => { fitTrip(true); fitLine(pName); });
  function paintTrip() {
    const t = tripText();
    if (trip.textContent !== t) {
      trip.textContent = t;
      // Courier New is 0.6 em a glyph (+1 unit tracking): the plugin's 27 px, down to its preset window's 18 px for a long line
      fitTrip();
      tripFns.forEach((f) => f(t));
    }
  }
  const touch = (id: TouchId, ms = 1400) => { touchId = id; touchUntil = performance.now() + ms; clearTimeout(tripT); tripT = window.setTimeout(paintTrip, ms + 30); paintTrip(); };
  // a hand on REACH (a press or the wheel, as in garage.js; not a key) with the beam down, after 1.4 s away from it
  let reachHand = -1e9;
  const reachHintOn = () => { const now = performance.now(); if (!store.get().high && now - reachHand > 1400) { reachHint = now; window.setTimeout(paintTrip, 630); } reachHand = now; };

  // ── sliders: drag, keys, wheel ──
  const getV = (k: KnobId) => store.get()[k] as number;
  const setN = (k: KnobId, n: number) => store.set({ [k]: k === 'focus' ? Math.round(fromNorm(k, n)) : Math.round(fromNorm(k, n) / (k === 'tilt' ? 2 : 1)) * (k === 'tilt' ? 2 : 1) } as Partial<WbParams>, 'face');
  // a pick is a tap (is-picked), never focus alone: a script's focus (the hero's hand-off) or a Tab is no pick, so the
  // next swipe that starts on the knob scrolls the page and leaves the value alone (r-dash-focuspick)
  const picked = (el: HTMLElement) => el.classList.contains('is-picked');
  function bindSlider(el: HTMLElement, k: KnobId) {
    if (k === 'reach') { el.addEventListener('pointerdown', reachHintOn, true); el.addEventListener('wheel', reachHintOn, { capture: true, passive: true }); }
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
    releasePick(el);
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
  hits.prev.addEventListener('click', () => stepPreset(-1));
  hits.next.addEventListener('click', () => stepPreset(1));
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
    const min = 44 / k, at = {} as Record<HitId, number[]>;
    for (const [id, [x, y, w, h], [x0, y0, x1, y1]] of HITS) {
      const W = Math.max(w, Math.min(min, x1 - x0)), H = Math.max(h, Math.min(min, y1 - y0));
      at[id] = [clamp(x + w / 2 - W / 2, x0, x1 - W), clamp(y + h / 2 - H / 2, y0, y1 - H), W, H];
    }
    // the preset row: NEXT's room is only its own LCD half (123 units), PREV and SAVE have room to spare on their outer
    // sides. Where 44 CSS px needs more (a small face: 844x390), NEXT grows about its centre and the two give way, so all
    // three keep 44 and never overlap (r-dash-next44). A face big enough for 123 units leaves the row untouched.
    const nx = at.next, pv = at.prev, sv = at.save, g = Math.min(min - nx[2], 2 * 60) / 2;
    if (g > 0) {
      nx[0] -= g; nx[2] += 2 * g;
      const pr = Math.min(pv[0] + pv[2], nx[0]); pv[0] = Math.max(0, Math.min(pv[0], pr - min)); pv[2] = pr - pv[0];
      const sl = Math.max(sv[0], nx[0] + nx[2]); sv[2] = Math.min(Math.max(sv[0] + sv[2] - sl, min), 560 - sl); sv[0] = sl;
    }
    for (const id of Object.keys(at) as HitId[]) {
      const [X, Y, W, H] = at[id];
      Object.assign(hits[id].style, { left: X + 'px', top: Y + 'px', width: W + 'px', height: H + 'px' });
    }
  }

  // ── presets: the knobs glide (no overshoot, every value clamped: motion-01), MONO + SIDE off, POWER untouched ──
  let glide = 0, pending: number | null = null, artReady = false, holdCheck = 0;
  // the knobs a glide still moves: a knob the visitor takes during it (a drag, a key, the console, the deck) leaves the
  // glide at once and stays where the hand put it, with the '*' its edit earned (the other knobs glide on)
  let gliding = new Set<KnobId>();
  store.on((_s, ch, src) => { if (gliding.size && src !== 'preset' && src !== 'init') for (const k of Object.keys(ch)) gliding.delete(k as KnobId); });
  function loadPreset(i: number, _opts?: { afterArrive?: boolean }) {
    const n = PRESETS.length;
    pending = ((Math.round(i) % n) + n) % n;
    whenArtReady();
    // one frame later: a drive started by the same click (driveTo after loadPreset) then owns the timing
    cancelAnimationFrame(holdCheck);
    holdCheck = requestAnimationFrame(tryGlide);
  }
  const stepPreset = (d: number) => loadPreset((pending ?? store.preset) + d);
  function tryGlide() {
    if (pending === null) return;
    if (isDriving()) return; // resumed on the drive's arrival
    const i = pending; pending = null;
    store.preset = i;
    store.edited = false; // before the first write, so the store's preset news carries the clean name
    const from = store.get(), to = presetValues(PRESETS[i]);
    cancelAnimationFrame(glide);
    store.set({ mono: false, side: false, high: to.high }, 'preset');
    speak(`Preset ${String(i + 1).padStart(2, '0')}, ${PRESETS[i].name}`, true);
    // the art not in yet (a slow line): the preset lands at once, name, sound and deck with it, and the face shows it when
    // its art arrives (a glide on the dark still would be invisible; waiting for the art lost presses: r-dash-artpending)
    const keys: KnobId[] = ['width', 'focus', 'mix', 'tilt', 'reach'], t0 = performance.now(), dur = reducedNow() || !artReady ? 0 : 520;
    const n0 = Object.fromEntries(keys.map((k) => [k, toNorm(k, from[k] as number)])), n1 = Object.fromEntries(keys.map((k) => [k, toNorm(k, to[k] as number)]));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // a motor settling on its stop: no overshoot
    const run = (now: number) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1, e = ease(t), v: Partial<WbParams> = {};
      for (const k of gliding) (v as any)[k] = t >= 1 ? to[k] : Math.round(fromNorm(k, n0[k] + (n1[k] - n0[k]) * e));
      store.set(v, 'preset');
      if (t < 1 && gliding.size) glide = requestAnimationFrame(run); else { gliding.clear(); paintStatic(); }
    };
    gliding = new Set(keys);
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
    const pn = lcdCold ? '' : PRESETS[store.preset].name.toUpperCase() + (store.edited ? '*' : '');
    if (pName.textContent !== pn) { pName.textContent = pn; fitLine(pName); }
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
    stepPreset,
    presetName: () => PRESETS[store.preset].name,
    whenArtReady,
    ignite,
    say(text) { sayText = text; paintTrip(); },
    cue(target) {
      const b = target === 'width' ? [626, 515, 280, 280] : target === 'mono' ? [1294, 627, 156, 156] : target === 'power' ? [1340, 41, 112, 112] : target === 'high' ? [922, 630, 180, 180] : null;
      cueEl.classList.toggle('is-on', !!b);
      if (b) root.setAttribute('data-wb-cue', target!); else root.removeAttribute('data-wb-cue'); // (drive.css: the ring steps off the lamp)
      if (b) Object.assign(cueEl.style, { left: b[0] + 'px', top: b[1] + 'px', width: b[2] + 'px', height: b[3] + 'px' });
    },
    onIgnite(fn) { if (!cold && !igniting) fn(); else igniteFns.push(fn); },
    isLit: () => !cold && !igniting,
    artUrl: (part) => urls[part] ?? null,
    touch: (id, ms) => touch(id, ms),
    drag(id) { dragId = id; if (id) touch(id); else if (touchId) touch(touchId, 1200); },
    onTrip(fn) { tripFns.push(fn); fn(trip.textContent || ''); },
  };
  // internal hooks for initFace (not part of the Face API)
  (face as any)._art = { applyArt, setLoader: (fn: () => void) => { wantLoad = fn; }, wantIgnite: () => wantIgnite, isCold: () => cold, scale: () => k, tryGlide,
    failArt(on: boolean) { artFailed = on; root.classList.toggle('is-artfail', on); paintTrip(); } };
  current = face;
  return face;
}

/** The page's dash: builds the face, loads its art late, lights it when it lands, raises it once as it comes in. */
/** A deferred <img> (the dash's face-still, WbDrive.astro) takes its data-srcset / data-src now, at high priority: it is
 *  what the face shows until the art is in. The inline script at the end of widebeam.astro does the same 3/4 of a screen
 *  ahead (r-base-artbare); loadArt() below calls this
 *  before the art requests, so the still is never queued behind the strips (r-base-foldart). */
export function showDeferred(img: Element | null) {
  if (!(img instanceof HTMLImageElement) || !img.dataset.src || img.getAttribute('src')) return;
  img.fetchPriority = 'high';
  if (img.dataset.srcset) img.srcset = img.dataset.srcset;
  img.src = img.dataset.src;
}

export function initFace(page: HTMLElement, art: FaceArt, store: Store, reducedMotion: boolean) {
  const faceEl = page.querySelector<HTMLElement>('[data-wb-face]')!;
  const face = createFace(faceEl, art, store);
  const hooks = (face as any)._art as { applyArt(u: Partial<Record<Part, string>>): void; setLoader(fn: () => void): void; wantIgnite(): boolean; isCold(): boolean; scale(): number; tryGlide(): void; failArt(on: boolean): void };
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
    // -1 % on the face: at 1280-1440 x 900 @2 the WIDTH knob is drawn 290 px wide, 2 px past the 75 % tier's 288 px frame,
    // and the next tier (384 px, 420 KB) would add 54 KB to the full visit (G11's 3.3 MB bar) for a 0.7 % stretch no eye
    // sees. In-between WIDTH tiers come out heavier than the full file (0.8 = 458 KB), so the ladder stays as it is.
    const SLACK = 0.99;
    let need = NEED[p] * hooks.scale() * dpr * SLACK;
    // the console's bat switch draws the same strip: its layout width (offsetWidth), not its rect, which the dash's rise
    // (rotateX 14 in perspective, below) still swells to 97.3 px for the 96 px bat as the art is picked at 1100 px and up:
    // 0.65 px over the 192 px frame, and the 256 px file put 48 KB on the full visit (G11's 3.3 MB bar) for a bat at 1:1
    if (p === 'toggle') { const bat = document.querySelector<HTMLElement>('[data-wb-bat]'); if (bat) need = Math.max(need, bat.offsetWidth * dpr * SLACK); }
    // the phone deck draws the same strips bigger: one file per strip serves both (its frame is the deck's box, at 2x
    // at most: a 3x phone gets 2x art, -5 % so the 75 % WIDTH tier's 288 px frame covers a 150 px knob)
    if (deckOn()) page.querySelectorAll<HTMLElement>(`[data-wb-deck-art="${p}"]`).forEach((el) => { need = Math.max(need, el.getBoundingClientRect().width * Math.min(dpr, 2) * 0.95); });
    return list.find(([t]) => t >= need) ?? list[list.length - 1];
  };

  let loading: Promise<void> | null = null;
  // true once the file has loaded (its load event, then a decode: a decode() that rejects on a loaded image is not a
  // missing image), false on its error event (a 404, a dropped line)
  const decode = (u: string) => new Promise<boolean>((res) => {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { im.decode().catch(() => {}).then(() => res(true)); };
    im.onerror = () => res(false);
    im.src = u;
  });
  const msg = page.querySelector<HTMLElement>('[data-wb-msg]');
  const ART_MSG = "The dash's pictures didn't load. Its controls still work; reload the page to see them.";
  let failedAt = 0; // a failed load: only an act on the demo tries again, at most every 3 s (never the scroll)
  function loadArt() {
    if (loading) return loading;
    if (failedAt && performance.now() - failedAt < 3000) return Promise.resolve();
    const still = faceEl.querySelector<HTMLImageElement>('img.wb-dash-still');
    showDeferred(still); // first: the still shows while the strips come in
    loading = (async () => {
      // and the strips wait for it (at most 1.2 s): started together they shared the line and the still landed 0.8 s
      // after a drive's arrival at 4 Mbit/s, a bare face; alone it takes ~0.15 s
      if (still && !still.complete) await new Promise((r) => { still.addEventListener('load', r, { once: true }); still.addEventListener('error', r, { once: true }); setTimeout(r, 1200); });
      const want: Partial<Record<Part, string>> = {};
      for (const p of Object.keys(NEED) as Part[]) { const t = pick(p); if (t) { want[p] = t[1]; loaded[p] = t[0]; } }
      // a part that fails gets one more try: the page's own full-size file when the tier was another, else the same file.
      // Still missing, the face stays on its dark still (no empty knob sockets under a coach saying DRAG WIDTH UP), the
      // status line says so, and the next act on the demo tries again (r-dash-art404)
      const parts = Object.keys(want) as Part[];
      const ok = await Promise.all(parts.map((p) => decode(want[p]!)));
      const again = parts.filter((_, i) => !ok[i]);
      if (again.length) {
        const ok2 = await Promise.all(again.map((p) => { const full = art?.[p]; if (full && full !== want[p]) { want[p] = full; loaded[p] = 1e6; } return decode(want[p]!); }));
        if (ok2.some((v) => !v)) {
          loading = null; failedAt = performance.now();
          if (msg) msg.textContent = ART_MSG;
          // and on the trip LCD, where the drive lands (the status line sits under the fold there: r-dash-art404msg)
          hooks.failArt(true);
          return;
        }
      }
      hooks.failArt(false);
      if (msg?.textContent === ART_MSG) msg.textContent = ''; // a retry that worked: the line is no longer true
      await new Promise((r) => requestAnimationFrame(r));
      hooks.applyArt(want); // every part in the same frame (perf-04)
      window.dispatchEvent(new CustomEvent('wb:art'));
      // (a drive on its way lands the face itself, on its arrival: never mid-glide)
      if (hooks.wantIgnite() || (landedNow() && !isDriving())) face.ignite();
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
      const ok = await Promise.all(Object.values(up).map((u) => decode(u!)));
      if (ok.some((v) => !v)) return; // a sharper tier that fails: the face keeps the one it has
      requestAnimationFrame(() => { hooks.applyArt(up); window.dispatchEvent(new CustomEvent('wb:art')); });
    }, 500);
  }).observe(faceEl);

  // the loader's triggers: the first of the dash within 1.5 screens, an act on the demo, a drive, or the page at rest
  // after its first view (12 s + idle).
  // "Within 1.5 screens" counts on the visitor's own scroll: on a laptop the dash already sits that close under the hero
  // at load, and the art must not race the intro's first seconds (perf-01).
  const introRunning = () => {
    const hero = page.querySelector('.wb-hero'), v = page.querySelector<HTMLVideoElement>('video[data-wb-intro]');
    return !!hero?.classList.contains('is-intro') || (!!v && !v.paused && !v.ended && !v.classList.contains('is-gone'));
  };
  // (the deck: once the face, right above it, is within one screen)
  const near = () => (deckOn() ? faceEl.getBoundingClientRect().top < innerHeight * 2 : section.getBoundingClientRect().top < innerHeight * 2.5);
  const onScroll = () => { if (loading || failedAt) removeEventListener('scroll', onScroll); else if (near() && (scrollY > 2 || !introRunning())) loadArt(); };
  addEventListener('scroll', onScroll, { passive: true });
  if (scrollY > 2) onScroll(); // a reload that restored the scroll, a link to #wb-drive
  const intent = (e: Event) => { if ((e.target as Element)?.closest?.('[data-wb-demo]')) loadArt(); };
  page.addEventListener('pointerdown', intent, true);
  page.addEventListener('keydown', intent, true);
  page.addEventListener('click', intent, true);
  // the page at rest: a visitor who has not scrolled or touched the demo gets the art once the first view is over (the
  // plan's first 10 s, G11 / team/perf/measure.cjs; 12 s for margin) and the browser is idle. The intro ran 8 s then
  // (about 5.4 s at 1.5x since 2026-11-22), so the old triggers (8 s, or the hand-off + idle) put 1.47 MB of
  // below-the-fold art into the first view (2.69 MB against its 1.9 MB bar); keyed to the page clock, not the hand-off,
  // so a skipped or absent intro, or a faster one, waits the same.
  // On an upright phone the strips are the deck's (D.4: they load only when the deck nears): the dash coming near, or an
  // act on the demo, never the clock alone
  const idle = (fn: () => void) => ((window as any).requestIdleCallback ? (window as any).requestIdleCallback(fn, { timeout: 2000 }) : window.setTimeout(fn, 600));
  window.setTimeout(() => { if (!loading && !failedAt && !deckOn()) idle(() => loadArt()); }, Math.max(0, 12000 - performance.now()));

  // ── landing: the face mostly on screen and the page at rest (or a drive's arrival) lights it ──
  const nav = navH;
  const visible = () => { const r = faceEl.getBoundingClientRect(); const top = nav(); return r.height ? Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(top, r.top)) / r.height : 0; };
  const needVis = () => Math.min(0.7, ((innerHeight - nav()) / Math.max(1, faceEl.getBoundingClientRect().height)) * 0.9);
  let lastScroll = performance.now(), visSince = 0, landT = 0;
  addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  // on an upright phone the deck holds the controls (D7 B): a visitor who scrolls past the inert face and stops on the deck
  // has landed too, once the deck's readout (the trip LCD, printed big) is whole on screen under the nav, or the deck is
  // mostly on screen (the face's own rule) (r-dash-deckcold)
  const deckEl = page.querySelector<HTMLElement>('[data-wb-deck]');
  const deckRead = deckEl?.querySelector<HTMLElement>('[data-wb-deck-read]') ?? null;
  const deckShown = () => {
    if (!deckEl || !deckRead || !deckOn()) return false;
    const r = deckRead.getBoundingClientRect(), d = deckEl.getBoundingClientRect(), top = nav();
    if (r.height > 0 && r.top >= top - 1 && r.bottom <= innerHeight + 1) return true;
    const vis = d.height ? Math.max(0, Math.min(innerHeight, d.bottom) - Math.max(top, d.top)) / d.height : 0;
    return vis >= Math.min(0.7, ((innerHeight - top) / Math.max(1, d.height)) * 0.9);
  };
  const landedNow = () => !holdCold && (visible() >= needVis() || deckShown());
  const watch = () => {
    clearInterval(landT);
    landT = window.setInterval(() => {
      if (holdCold || !hooks.isCold()) { clearInterval(landT); return; }
      // a drive on its way lands the face itself ('wb:drive' arrive, below): on an upright phone the face is whole on
      // screen long before the glide ends, and its slow tail read as rest (stage 4: lamps at 560 ms, landing at 760 ms)
      if (isDriving()) { visSince = 0; return; }
      const now = performance.now();
      if (landedNow()) { if (!visSince) visSince = now; } else { visSince = 0; return; }
      if (now - lastScroll >= 150 || now - visSince >= 600) { face.ignite(); if (!hooks.isCold()) clearInterval(landT); }
    }, 100);
  };
  const inView = new Set<Element>();
  const landIO = new IntersectionObserver((entries) => {
    for (const e of entries) { if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target); }
    if (inView.size) watch(); else { clearInterval(landT); visSince = 0; }
  }, { threshold: [0, 0.35] });
  landIO.observe(faceEl);
  if (deckEl) landIO.observe(deckEl);
  // and an act on the deck is a landing (a tap, a turn, a key, a screen reader's adjust): the visitor is at the controls
  const deckAct = () => { if (!deckOn() || holdCold || !hooks.isCold()) return; loadArt(); face.ignite(); };
  if (deckEl) for (const t of ['pointerup', 'click', 'keydown', 'input']) deckEl.addEventListener(t, deckAct, true);

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
    // focus arriving in the dash first (the Tab key) finishes it at once and scrolls the control in again: the browser's
    // own focus scroll ran before focusin, on the risen-from place, and the rise then carried the console's 'Previous
    // preset' 93-97 px up, above the screen at desktop-zoom sizes (285x159: top 66 -> -27, 380x212: 58 -> -39)
    dash.addEventListener('focusin', (e) => {
      if (!riseArmed) return;
      rise(true);
      (e.target as HTMLElement).scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
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
    // a modified click (a new tab or window, Ctrl's menu on a Mac) keeps the browser's own, as the hero's does (hero.ts)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    driveTo('#wb-drive', { align: 'face' });
  }));

  // the soft snap (D.5): a scroll that comes to rest near the dash settles it where a drive lands it (snap.ts)
  initSnap(faceEl);

  // any start of the sound turns the key in the dash (sound.ts start): it lights the face (once the art is in)
  const ignite = () => { if (!holdCold) face.ignite(); };
  return { face, ignite, dash };
}
