import { setPan } from './bus';
import { PanSpring, outlineAt, outlinePath, shapeAt, simplePeriod, swingWidth } from './tracks';

/**
 * TRACKS section: pick a SIMPLE card, then drive it on the mini GPS with the
 * plugin's own PLAY / PAUSE / STOP caps. The dot is the car; its position is
 * the pan (the plugin tooltip: "the dot is the car driving your pan"), run
 * through the same spring as the DSP. It writes the page's pan bus, so the
 * wheel, the rails — and the deck's audio, if it is playing AFTER — follow.
 * STOP eases the pan back to centre; PAUSE parks it where it stands.
 */
const INTENSITY = 0.6;          // TRK_WIDTH default
const LAP_DEFAULT = 0.488084;   // TRK_LAP default
const SYNC_BARS_120 = 2;        // SYNC shown against a fixed 120 BPM (no host on a web page)

export function initTracks(root: HTMLElement): void {
  const sec = root.querySelector<HTMLElement>('[data-tracks]');
  if (!sec) return;
  const cards = Array.from(sec.querySelectorAll<HTMLButtonElement>('[data-track]'));
  const path = sec.querySelector<SVGPathElement>('[data-gps-path]')!;
  const car = sec.querySelector<SVGCircleElement>('[data-gps-car]')!;
  const lcdName = sec.querySelector<HTMLElement>('[data-gps-name]');
  const lcdTime = sec.querySelector<HTMLElement>('[data-gps-time]');
  const speedRead = sec.querySelector<HTMLElement>('[data-speed-read]');
  const syncBtns = Array.from(sec.querySelectorAll<HTMLButtonElement>('[data-sync]'));
  const playBtn = sec.querySelector<HTMLButtonElement>('[data-gps="play"]');
  const vb = path.ownerSVGElement!.viewBox.baseVal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let track = Number(cards.find((c) => c.getAttribute('aria-pressed') === 'true')?.dataset.track ?? 41);
  let sync = false, running = false, paused = false, phase = 0, lapT = 0, raf = 0, last = 0;
  const spring = new PanSpring();
  const period = () => (sync ? SYNC_BARS_120 * 2 : simplePeriod(LAP_DEFAULT));   // 1 bar @ 120 = 2 s

  const placeCar = () => {
    const [x, y] = outlineAt(track, phase);
    car.setAttribute('cx', ((x * 0.5 + 0.5) * vb.width).toFixed(1));
    car.setAttribute('cy', ((y * 0.5 + 0.5) * vb.height).toFixed(1));
  };
  const readouts = () => {
    const name = cards.find((c) => Number(c.dataset.track) === track)?.dataset.name ?? '';
    if (lcdName) lcdName.textContent = running ? `▶ ${name}` : name;
    if (lcdTime) lcdTime.textContent = `LAP ${lapT.toFixed(1).padStart(4, '0')}s`;
    if (speedRead) speedRead.textContent = sync ? `${SYNC_BARS_120 / 2} bar @ 120` : `${period().toFixed(1)} s`;
    playBtn?.setAttribute('aria-pressed', String(running && !paused));
  };
  const select = (id: number) => {
    track = id;
    cards.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.track) === id)));
    path.setAttribute('d', outlinePath(id, vb.width, vb.height, 256));
    phase = 0; lapT = 0;
    placeCar(); readouts();
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (running && !paused) { phase += dt / period(); lapT = (lapT + dt) % period(); }
    const target = running ? shapeAt(track, phase) * swingWidth(INTENSITY) : 0;
    const p = spring.step(target, dt, INTENSITY, period());
    setPan(p, 'tracks');
    placeCar(); readouts();
    raf = running || Math.abs(spring.pan) > 0.002 ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  cards.forEach((c) => c.addEventListener('click', () => { select(Number(c.dataset.track)); if (!running) { running = true; paused = false; spring.reset(); } kick(); }));
  sec.querySelector('[data-gps="play"]')?.addEventListener('click', () => { if (reduce) return; running = true; paused = false; kick(); readouts(); });
  sec.querySelector('[data-gps="pause"]')?.addEventListener('click', () => { if (running) { paused = !paused; readouts(); } });
  sec.querySelector('[data-gps="stop"]')?.addEventListener('click', () => { running = false; paused = false; phase = 0; lapT = 0; kick(); readouts(); });
  syncBtns.forEach((b) => b.addEventListener('click', () => {
    sync = b.dataset.sync === 'sync';
    syncBtns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    readouts();
  }));
  select(track);
}
