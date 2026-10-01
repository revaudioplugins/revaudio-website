/**
 * /drift pan bus. ONE pan value (-1 hard left .. +1 hard right) feeds every
 * display on the page: the two neon rails (the stereo field), the dash PAN
 * socket, each car-stereo balance screen and the steering wheel itself.
 *
 * Writers: the wheel (drag / keys), the demo deck (its pan curve), the TRACKS
 * mini GPS (the car's position). The last writer wins, except that the car
 * yields to a hand on the wheel (setHand). Displays only: nothing
 * here makes a sound (demo.ts owns the audio and follows the same value).
 */
export type PanSource = 'wheel' | 'demo' | 'tracks' | 'reset';
type Listener = (pan: number, source: PanSource) => void;

let pan = 0;
const listeners = new Set<Listener>();

export const getPan = () => pan;

/** A hand on the wheel (held, or its flick still coasting) and the time it
 *  last moved or let go: the TRACKS car waits while handBusy(hold) is true,
 *  then takes the pan back. */
let hand = false;
let handT = -Infinity;
export const setHand = (on: boolean) => { hand = on; handT = performance.now(); };
export const handBusy = (holdMs: number) => hand || performance.now() - handT < holdMs;

export function setPan(value: number, source: PanSource): void {
  const next = Math.max(-1, Math.min(1, value));
  if (next === pan && source !== 'reset') return;
  pan = next;
  if (source === 'wheel') handT = performance.now();
  for (const l of listeners) l(pan, source);
}

export function onPan(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Plugin readout format (index.html wheel draw): C | L20 | R20. */
export function panShort(p: number): string {
  if (Math.abs(p) < 0.02) return 'C';
  return p < 0 ? `L ${Math.round(-p * 100)}` : `R ${Math.round(p * 100)}`;
}

export function panWords(p: number): string {
  if (Math.abs(p) < 0.02) return 'Center';
  return p < 0 ? `Left ${Math.round(-p * 100)}` : `Right ${Math.round(p * 100)}`;
}

const BARS = 24;
const HALF = BARS / 2;

/** Build the 24 stepped bars once: bar i height = .42 + .58 * |i + .5 - 12| / 12. */
function buildBalance(el: HTMLElement): HTMLElement[] {
  if (!el.children.length) {
    for (let i = 0; i < BARS; i++) {
      const b = document.createElement('i');
      const t = Math.abs(i + 0.5 - HALF) / HALF;
      b.style.height = `${(42 + 58 * t).toFixed(1)}%`;
      el.appendChild(b);
    }
  }
  return Array.from(el.children) as HTMLElement[];
}

/** Car-stereo BALANCE SCREEN law (Drift 4.22.8): lit from the centre toward
 *  the pan side, outermost lit bar = white tip, |pan| < 1/24 lights nothing. */
function paintBalance(bars: HTMLElement[], p: number): void {
  const n = Math.abs(p) < 1 / (BARS) ? 0 : Math.min(HALF, Math.round(Math.abs(p) * HALF));
  for (let i = 0; i < BARS; i++) {
    let on = false;
    let tip = false;
    if (n > 0 && p < 0 && i < HALF && i >= HALF - n) { on = true; tip = i === HALF - n; }
    if (n > 0 && p > 0 && i >= HALF && i < HALF + n) { on = true; tip = i === HALF + n - 1; }
    bars[i].classList.toggle('on', on && !tip);
    bars[i].classList.toggle('tip', tip);
  }
}

/** Wire every display under `root` to the bus. Paints at most once per frame. */
export function initPanDisplays(root: HTMLElement): void {
  const readouts = Array.from(root.querySelectorAll<HTMLElement>('[data-pan-readout]'));
  const balances = Array.from(root.querySelectorAll<HTMLElement>('[data-balance]')).map(buildBalance);
  let raf = 0;
  const paint = () => {
    raf = 0;
    const p = pan;
    root.style.setProperty('--pan', p.toFixed(3));
    root.style.setProperty('--lit-l', (0.3 + 0.7 * Math.max(0, -p)).toFixed(3));
    root.style.setProperty('--lit-r', (0.3 + 0.7 * Math.max(0, p)).toFixed(3));
    const txt = panShort(p);
    for (const r of readouts) r.textContent = r.dataset.panReadout === 'bare' ? txt : `PAN ${txt}`;
    for (const bars of balances) paintBalance(bars, p);
  };
  onPan(() => { if (!raf) raf = requestAnimationFrame(paint); });
  paint();
}
