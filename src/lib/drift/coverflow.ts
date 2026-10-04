/**
 * The phone coverflow carousels (Dan 2026-10-04): #fx's pedals and #creators' step cards. PluginShowcase.astro's
 * logic, trimmed: every slide is classed by its signed circular distance from the current one (0 = is-current,
 * ±1 = is-peek-next / is-peek-prev, the rest parked hidden); dots, a tap on a peeking slide, a 40 px swipe and the
 * arrow keys move it; an aria-live line says the new slide. The look lives in drift.css (.d-fxc*).
 */
export function initCoverflow(fc: HTMLElement): void {
  const slides = Array.from(fc.querySelectorAll<HTMLElement>('[data-fxc-slide]'));
  const dots = Array.from(fc.querySelectorAll<HTMLElement>('[data-fxc-dot]'));
  const say = fc.querySelector<HTMLElement>('[data-fxc-say]');
  const vp = fc.querySelector<HTMLElement>('.d-fxc-vp');
  const n = slides.length;
  if (!vp || n < 2) return;
  let idx = 0;
  const dist = (k: number) => { let d = (k - idx) % n; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d; };
  const go = (t: number) => {
    const next = ((t % n) + n) % n;
    if (next === idx) return;
    idx = next;
    slides.forEach((s, k) => {
      s.classList.remove('is-current', 'is-peek-prev', 'is-peek-next');
      const d = dist(k);
      if (d === 0) s.classList.add('is-current'); else if (d === 1) s.classList.add('is-peek-next'); else if (d === -1) s.classList.add('is-peek-prev');
    });
    dots.forEach((d, k) => d.classList.toggle('active', k === idx));
    if (say) say.textContent = slides[idx].getAttribute('aria-label') ?? '';
  };
  dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
  slides.forEach((s, k) => s.addEventListener('click', () => { if (!s.classList.contains('is-current')) go(k); }));
  fc.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { go(idx - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { go(idx + 1); e.preventDefault(); }
  });
  // swipe; a real drag never also counts as a tap on a peeking slide
  let x0: number | null = null, moved = false;
  vp.addEventListener('pointerdown', (e) => { x0 = e.clientX; moved = false; });
  vp.addEventListener('pointermove', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 10) moved = true; });
  vp.addEventListener('pointerup', (e) => { if (x0 !== null) { const dx = e.clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1); } x0 = null; });
  vp.addEventListener('pointercancel', () => { x0 = null; });
  vp.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
}
