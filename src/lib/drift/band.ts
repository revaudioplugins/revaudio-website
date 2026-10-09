/**
 * #band (DriftBand.astro): drag the LOW / HIGH CUT on the log strip, or step them with the arrow keys (Shift = bigger
 * steps); a factory-preset chip glides both cuts to its band. Ranges = the plugin's (LOW CUT 20 Hz..19.95 kHz, HIGH CUT
 * 70 Hz..20 kHz); the page keeps the band at least a third of an octave wide so the slice never collapses.
 */
const LO_MIN = 20, LO_MAX = 19950, HI_MIN = 70, HI_MAX = 20000, GAP = 2 ** (1 / 3);
const pos = (f: number) => (Math.log(f / 20) / Math.log(1000)) * 100;
const freq = (p: number) => 20 * 1000 ** (Math.min(100, Math.max(0, p)) / 100);
const hz = (f: number) => (f >= 1000 ? `${+(f / 1000).toFixed(f >= 10000 || f % 1000 < 50 ? 0 : 1)} kHz` : `${Math.round(f / 10) * 10} Hz`);

export function initBand(glass: HTMLElement, root: HTMLElement): void {
  const track = glass.querySelector<HTMLElement>('[data-bs-track]');
  const read = glass.querySelector<HTMLElement>('[data-bs-read]');
  const cuts = { lo: glass.querySelector<HTMLButtonElement>('[data-cut="lo"]'), hi: glass.querySelector<HTMLButtonElement>('[data-cut="hi"]') };
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.d-bs-chip'));
  if (!track || !read || !cuts.lo || !cuts.hi) return;
  const band = { lo: +cuts.lo.getAttribute('aria-valuenow')!, hi: +cuts.hi.getAttribute('aria-valuenow')! };

  const paint = (glide = false) => {
    glass.toggleAttribute('data-glide', glide);
    glass.style.setProperty('--lo', `${pos(band.lo)}%`);
    glass.style.setProperty('--hi', `${pos(band.hi)}%`);
    read.textContent = `${hz(band.lo)} – ${hz(band.hi)}`;
    for (const k of ['lo', 'hi'] as const) {
      cuts[k]!.setAttribute('aria-valuenow', String(Math.round(band[k])));
      cuts[k]!.setAttribute('aria-valuetext', hz(band[k]));
    }
  };
  const set = (k: 'lo' | 'hi', f: number) => {
    band[k] = k === 'lo' ? Math.min(Math.max(f, LO_MIN), LO_MAX, band.hi / GAP) : Math.max(Math.min(f, HI_MAX), HI_MIN, band.lo * GAP);
    chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    paint();
  };

  // drag: the press picks the nearer cut and that cut follows the pointer
  let drag: 'lo' | 'hi' | null = null;
  const at = (e: PointerEvent) => { const r = track.getBoundingClientRect(); return freq(((e.clientX - r.left) / r.width) * 100); };
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const f = at(e);
    drag = Math.abs(Math.log(f / band.lo)) <= Math.abs(Math.log(f / band.hi)) ? 'lo' : 'hi';
    track.setPointerCapture(e.pointerId);
    glass.dataset.drag = drag;
    set(drag, f);
    cuts[drag]!.focus({ preventScroll: true });
  });
  track.addEventListener('pointermove', (e) => { if (drag) set(drag, at(e)); });
  const end = () => { drag = null; delete glass.dataset.drag; };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  track.addEventListener('lostpointercapture', end);

  for (const k of ['lo', 'hi'] as const) {
    cuts[k]!.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 2 ** (1 / 2) : 2 ** (1 / 12);
      const by = { ArrowRight: step, ArrowUp: step, ArrowLeft: 1 / step, ArrowDown: 1 / step } as Record<string, number>;
      if (e.key in by) { e.preventDefault(); set(k, band[k] * by[e.key]); }
      else if (e.key === 'Home') { e.preventDefault(); set(k, k === 'lo' ? LO_MIN : band.lo * GAP); }
      else if (e.key === 'End') { e.preventDefault(); set(k, k === 'hi' ? HI_MAX : band.hi / GAP); }
    });
  }

  chips.forEach((c) => c.addEventListener('click', () => {
    band.lo = +c.dataset.lo!; band.hi = +c.dataset.hi!;
    paint(true);
    chips.forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
  }));
}
