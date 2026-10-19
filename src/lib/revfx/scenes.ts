/**
 * #scenes: the arrange window's playhead on an 8-second loop. Crossing a lane block lights its snapshot slot and
 * the five lamps of that example scene. rAF only while the window is on screen. Reduced motion: parked on B.
 */
const LOOP_MS = 8000;

export function initScenes(): void {
  const daw = document.querySelector<HTMLElement>('[data-rfx-daw]');
  if (!daw) return;
  const lane = JSON.parse(daw.dataset.lane!) as [string, number, number][];
  const scenes = JSON.parse(daw.dataset.scenes!) as Record<string, { name: string; on: string[] }>;
  const head = daw.querySelector<HTMLElement>('[data-rfx-head]')!;
  const now = daw.querySelector<HTMLElement>('[data-rfx-now]');
  const slots = Array.from(daw.querySelectorAll<HTMLElement>('[data-slot]'));
  const lamps = Array.from(daw.querySelectorAll<HTMLElement>('[data-lamp]'));
  const blocks = Array.from(daw.querySelectorAll<HTMLElement>('.blk'));
  let last = -1, raf = 0, vis = false;

  const paint = (f: number) => {
    head.style.left = `${(f * 100).toFixed(3)}%`;
    const k = lane.findIndex(([, a, b]) => f >= a && f < b);
    if (k === last || k < 0) return;
    last = k;
    const L = lane[k][0];
    slots.forEach((s) => s.classList.toggle('is-on', s.dataset.slot === L));
    blocks.forEach((b, i) => b.classList.toggle('is-on', i === k));
    lamps.forEach((l) => l.classList.toggle('is-on', scenes[L].on.includes(l.dataset.lamp!)));
    if (now) now.textContent = `SCENE ${L} · ${scenes[L].name.toUpperCase()}`;
    daw.classList.remove('is-cut'); void daw.offsetWidth; daw.classList.add('is-cut');
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { paint(0.375); return; }
  const t0 = performance.now();
  const frame = (t: number) => { raf = 0; if (!vis || document.hidden) return; paint(((t - t0) % LOOP_MS) / LOOP_MS); raf = requestAnimationFrame(frame); };
  paint(0);
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); }).observe(daw);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && vis && !raf) raf = requestAnimationFrame(frame); });
}
