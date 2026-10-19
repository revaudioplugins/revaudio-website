/**
 * #pedals: MEET THE FIVE. Laptop (>= 901 px): the track is n screens tall and the stage is sticky; the scroll's
 * place in the track picks the slide (is-on) and its place inside that slide's share turns the slide's knob.
 * Phones: the slides stack, each knob turns as its slide crosses the screen. The knob writes the real parameter
 * into the plugin's screen (screens.ts), the dial and the readout (real units, from src/data/revfx.ts).
 * GLUE COMP's screen is a gain-reduction meter: it is fed here from the THRESHOLD knob over a steady test beat
 * (two hits a second, each with a tail), so lowering the threshold visibly squeezes harder.
 */
import { hostScreen, type ScreenId, type ScreenHandle } from './screens';
import { pedals } from '../../data/revfx';
import { lenis } from '../motion';

interface Knob { id: ScreenId; label: string; from: number; to: number; param: string }
const SWEEP = 270;   // the dial's travel, degrees (-135 .. +135)

export interface PedalsApi { goTo(i: number): void }

export function initPedals(): PedalsApi | undefined {
  const track = document.querySelector<HTMLElement>('[data-rfx-pd]');
  if (!track) return;
  const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-rfx-slide]'));
  const rail = Array.from(track.querySelectorAll<HTMLButtonElement>('[data-rfx-pd-go]'));
  const room = track.querySelector<HTMLElement>('.rfx-pd-room');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = slides.length;

  const parts = slides.map((el) => {
    const kEl = el.querySelector<HTMLElement>('[data-rfx-knob]')!;
    const k = JSON.parse(kEl.dataset.rfxKnob!) as Knob;
    const cv = el.querySelector<HTMLCanvasElement>('[data-rfx-screen]')!;
    const fmt = pedals.find((p) => p.id === k.id)!.knob.fmt as (v: number) => string;
    let scr: ScreenHandle;
    if (k.id === 'glue') {
      scr = hostScreen(cv, 'glue', (t, P) => {
        const thr = scr.norm.GLUE_THRESH * 40 - 40;                    // dB
        const ph = (t * 2) % 1;                                        // two hits a second
        const level = -6 - 14 * ph + 2 * Math.sin(t * 0.9);            // each hit, then its tail, dBFS
        P.gluegr = Math.min(20, Math.max(0, (level - thr) * 0.5));     // 2:1, the ratio on the strip's photo
      });
    } else scr = hostScreen(cv, k.id);
    return { el, k, fmt, scr, val: kEl.querySelector<HTMLElement>('[data-k-val]')!, kEl, last: -1 };
  });

  const setKnob = (i: number, t: number) => {
    const p = parts[i];
    t = Math.max(0, Math.min(1, t));
    if (Math.abs(t - p.last) < 0.002) return;
    p.last = t;
    const v = p.k.from + (p.k.to - p.k.from) * t;
    p.scr.set(p.k.param, v);
    p.kEl.style.setProperty('--t', t.toFixed(4));
    p.kEl.style.setProperty('--a', `${(-SWEEP / 2 + SWEEP * t).toFixed(1)}deg`);
    p.val.textContent = p.fmt(v);
  };
  let cur = -1;
  const activate = (i: number) => {
    if (i === cur) return;
    cur = i;
    slides.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-past', k < i); });
    rail.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'step' : 'false'));
    room?.style.setProperty('--rgb', pedals[i].rgb);
  };
  activate(0);

  let raf = 0;
  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    // one pinned stage at every width (phones too, Gil 2026-10-18)
    const r = track.getBoundingClientRect();
    const span = Math.max(1, r.height - vh);
    const p = Math.max(0, Math.min(0.99999, -r.top / span));
    const i = Math.floor(p * n);
    activate(i);
    // the knob turns over the middle 80 % of a slide's share, so it rests at each end while the next swings in
    setKnob(i, (p * n - i - 0.1) / 0.8);
    for (let k = 0; k < n; k++) if (k !== i) setKnob(k, k < i ? 1 : 0);
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
  if (reduce) parts.forEach((_, k) => setKnob(k, 0.6));

  const goTo = (i: number) => {
    const top = track.getBoundingClientRect().top + scrollY;
    const y = top + ((i + 0.5) / n) * (track.offsetHeight - innerHeight);
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };
  rail.forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.rfxPdGo))));
  return { goTo };
}
