import { getPan, handBusy, setPan } from './bus';
import { PanSpring, outlineAt, outlinePath, shapeAt, simplePeriod, swingWidth } from './tracks';

/**
 * #drive (LET IT DRIVE): the car laps the selected SIMPLE shape on the mini
 * GPS by itself while the GPS OR the hero wheel is in view (motion = the
 * product's own engine looping, silently), so the hero wheel steers whatever
 * track is picked (Dan 10-01: "connect the wheel to what is on the track"). The dot is the car; its position is the pan (the plugin
 * tooltip: "the dot is the car driving your pan"), run through the same
 * spring as the DSP. It writes the page's pan bus, so the wheel, the rails and
 * the meters follow: the WHOLE sound moves (D2/H1).
 * Caps: PLAY runs, PAUSE holds and latches (WCAG 2.2.2: the loop can be
 * stopped and stays stopped), STOP eases the pan back to centre. Leaving both
 * views takes the STOP path. A hand on the wheel overrides the car: the car
 * waits while the wheel is held or coasting, plus HAND_HOLD, then the spring
 * glides the pan from where the hand left it back onto the line.
 * A parked car sits at the shape's rest point (where its pan crosses 0), so
 * the car and the C readout agree. Reduced motion: no autoplay, PAUSE starts
 * latched, the car sits parked; an explicit PLAY still runs (user-initiated).
 */
const INTENSITY = 0.6;          // TRK_WIDTH default
const LAP_DEFAULT = 0.488084;   // TRK_LAP default
const HAND_HOLD = 1500;         // ms the car keeps waiting after the hand lets go (or its last key)

export function initTracks(root: HTMLElement): void {
  const sec = root.querySelector<HTMLElement>('[data-tracks]');
  if (!sec) return;
  const chips = Array.from(sec.querySelectorAll<HTMLButtonElement>('[data-track]'));
  const path = sec.querySelector<SVGPathElement>('[data-gps-path]')!;
  const car = sec.querySelector<SVGCircleElement>('[data-gps-car]')!;
  const lcdName = sec.querySelector<HTMLElement>('[data-gps-name]');
  const lcdTime = sec.querySelector<HTMLElement>('[data-gps-time]');
  const playBtn = sec.querySelector<HTMLButtonElement>('[data-gps="play"]');
  const pauseBtn = sec.querySelector<HTMLButtonElement>('[data-gps="pause"]');
  const gps = sec.querySelector<HTMLElement>('.d-gps');
  const vb = path.ownerSVGElement!.viewBox.baseVal;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let track = Number(chips.find((c) => c.getAttribute('aria-pressed') === 'true')?.dataset.track ?? 41);
  // latched = PAUSE is the cap that stopped the car (it stays lit through a scroll-away STOP)
  let running = false, paused = false, userPaused = reduce, latched = reduce, phase = 0, lapT = 0, raf = 0, last = 0;
  const spring = new PanSpring();
  const period = () => simplePeriod(LAP_DEFAULT);
  // the rest point: the first phase where the shape's pan is (closest to) 0
  const restPhase = (id: number) => {
    let best = 0, bv = Infinity;
    for (let k = 0; k < 256; k++) { const v = Math.abs(shapeAt(id, k / 256)); if (v < bv) { bv = v; best = k / 256; } }
    return best;
  };
  const park = () => { phase = restPhase(track); lapT = 0; };

  const placeCar = () => {
    const [x, y] = outlineAt(track, phase);
    car.setAttribute('cx', ((x * 0.5 + 0.5) * vb.width).toFixed(1));
    car.setAttribute('cy', ((y * 0.5 + 0.5) * vb.height).toFixed(1));
  };
  const readouts = () => {
    const name = chips.find((c) => Number(c.dataset.track) === track)?.dataset.name ?? '';
    if (lcdName) lcdName.textContent = running && !paused ? `▶ ${name}` : name;
    if (lcdTime) lcdTime.textContent = `LAP ${lapT.toFixed(1).padStart(4, '0')}s`;
    playBtn?.setAttribute('aria-pressed', String(running && !paused));
    pauseBtn?.setAttribute('aria-pressed', String(paused || (latched && !running)));
  };
  const select = (id: number) => {
    track = id;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.track) === id)));
    path.setAttribute('d', outlinePath(id, vb.width, vb.height, 256));
    park();
    placeCar(); readouts();
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (handBusy(HAND_HOLD)) {
      // the hand has the wheel: the car holds its place and the pan is the hand's
      spring.pan = getPan(); spring.vel = 0;
      raf = running && !paused ? requestAnimationFrame(frame) : 0;
      return;
    }
    if (running && !paused) { phase += dt / period(); lapT = (lapT + dt) % period(); }
    const target = running ? shapeAt(track, phase) * swingWidth(INTENSITY) : 0;
    const p = spring.step(target, dt, INTENSITY, period());
    setPan(p, 'tracks');
    placeCar(); readouts();
    // a held (PAUSE) or parked (STOP) car rests the loop once the spring settles
    const settled = Math.abs(target - p) < 0.002 && Math.abs(spring.vel) < 0.002;
    raf = (running && !paused) || !settled ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } readouts(); };

  // autoplay only while the cabinet or the hero wheel is really on screen
  const watched = [gps, root.querySelector<HTMLElement>('.d-cockpit')].filter((el): el is HTMLElement => !!el);
  if (watched.length && 'IntersectionObserver' in window) {
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? seen.add(e.target) : seen.delete(e.target);
      if (seen.size) {
        if (!running && !userPaused && !reduce) { running = true; paused = false; spring.pan = getPan(); spring.vel = 0; kick(); }
      } else if (running) {
        running = false; paused = false; park(); kick();   // the STOP path: the spring parks the pan at C
      }
    }, { threshold: 0.35 });
    watched.forEach((el) => io.observe(el));
  }

  const play = () => { userPaused = false; latched = false; running = true; paused = false; kick(); };
  chips.forEach((c) => c.addEventListener('click', () => {
    select(Number(c.dataset.track));
    if (!reduce) play();   // under reduced motion a chip only redraws the outline
  }));
  playBtn?.addEventListener('click', play);
  pauseBtn?.addEventListener('click', () => { userPaused = true; latched = true; paused = true; readouts(); });
  sec.querySelector('[data-gps="stop"]')?.addEventListener('click', () => {
    userPaused = true; latched = false; running = false; paused = false; park(); kick();
  });
  select(track);
}
