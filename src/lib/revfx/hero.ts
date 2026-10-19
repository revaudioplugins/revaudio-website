/**
 * /revfx hero: the pedalboard comes alive (the stomp-in is CSS, keyed off [data-live]); once the last pedal has
 * landed the two patch cords light and a pulse starts riding them. On a mouse the board leans toward the pointer
 * (damped, rAF only while it moves). Reduced motion: [data-live="still"], no pulse, no lean.
 */
const STOMP_STEP = 150, STOMP_MS = 620;

export function initHero(onGoto: (i: number) => void): void {
  const wrap = document.querySelector<HTMLElement>('[data-rfx-board-wrap]');
  const board = wrap?.querySelector<HTMLElement>('[data-rfx-board]');
  if (!wrap || !board) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = board.querySelectorAll('.rfx-peds > li').length;

  if (reduce) board.dataset.live = 'still';
  else {
    // one frame at rest first, so the drop is animated even when the board is in view on load
    requestAnimationFrame(() => requestAnimationFrame(() => { board.dataset.live = 'on'; }));
    setTimeout(() => { board.dataset.cable = 'on'; }, 350 + n * STOMP_STEP + STOMP_MS);
  }

  board.querySelectorAll<HTMLAnchorElement>('[data-rfx-goto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    onGoto(Number(a.dataset.rfxGoto));
  }));

  if (reduce || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const step = () => {
    x += (tx - x) * 0.09; y += (ty - y) * 0.09;
    board.style.setProperty('--lean-x', x.toFixed(3));
    board.style.setProperty('--lean-y', y.toFixed(3));
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
  };
  const hero = wrap.closest('section') ?? wrap;
  hero.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, ((e as PointerEvent).clientX - (r.left + r.width / 2)) / (r.width / 2)));
    ty = Math.max(-1, Math.min(1, ((e as PointerEvent).clientY - (r.top + r.height / 2)) / (r.height / 2)));
    if (!raf) raf = requestAnimationFrame(step);
  });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
}
