import { getPan, handBusy, setPan } from './bus';
import { PanSpring, swingWidth } from './tracks';
import { carR, circuitPeriod, lapOf, lapPos, lapTarget, restPhase } from './circuits';
import { initFader } from './faders';

/**
 * #drive (LET IT DRIVE): the car laps the selected circuit on the mini
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
 * The car rides the plugin's own lap (circuits.ts): it brakes into corners,
 * the pan follows each corner (right-hander = right) with the flick and the
 * spring. A parked car sits on a straight, so the car and the C readout agree. Reduced motion: no autoplay, PAUSE starts
 * latched, the car sits parked; an explicit PLAY still runs (user-initiated).
 * INTENSITY / SPEED faders (Dan 10-02, layout B) set the car page-wide, live:
 * INTENSITY = swing width + braking (calm<->rally) + spring looseness + flick,
 * SPEED = lap time 45 s .. 3 s. Moving one starts the car like a chip does
 * (under reduced motion only the readouts change).
 */
const INT_DEFAULT = 0.6;        // TRK_WIDTH default
const LAP_DEFAULT = 0.488084;   // TRK_LAP default
const HAND_HOLD = 1500;         // ms the car keeps waiting after the hand lets go (or its last key)

export function initTracks(root: HTMLElement): void {
  const sec = root.querySelector<HTMLElement>('[data-tracks]');
  if (!sec) return;
  const chips = Array.from(sec.querySelectorAll<HTMLButtonElement>('[data-track]'));
  const path = sec.querySelector<SVGPathElement>('[data-gps-path]')!;
  const car = sec.querySelector<SVGCircleElement>('[data-gps-car]')!;
  const carSvg = car.ownerSVGElement!;   // the track svg's twin, laid over it (DriftTracks.astro)
  const lcdName = sec.querySelector<HTMLElement>('[data-gps-name]');
  const lcdTime = sec.querySelector<HTMLElement>('[data-gps-time]');
  const playBtn = sec.querySelector<HTMLButtonElement>('[data-gps="play"]');
  const pauseBtn = sec.querySelector<HTMLButtonElement>('[data-gps="pause"]');
  const gps = sec.querySelector<HTMLElement>('.d-gps');
  const glass = path.ownerSVGElement!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let track = Number(chips.find((c) => c.getAttribute('aria-pressed') === 'true')?.dataset.track ?? chips[0]?.dataset.track);
  let lap = lapOf(track), len = 1, inten = INT_DEFAULT, lap01 = LAP_DEFAULT;
  // latched = PAUSE is the cap that stopped the car (it stays lit through a scroll-away STOP)
  let running = false, paused = false, userPaused = reduce, latched = reduce, phase = 0, lapT = 0, raf = 0, last = 0;
  const spring = new PanSpring();
  const period = () => circuitPeriod(lap01);
  const park = () => { phase = restPhase(lap, inten); lapT = 0; };

  // While the car laps, its svg is a layer moved by a transform from the point it set off from: a lap frame is compositor
  // work, never a repaint of the glowing track, the plate and the panel under it (scroll bench 10-05: Chrome #drive
  // 37 -> 60 fps; a repainting layer only got 46). At rest the circle sits on its point with no transform or layer,
  // painting exactly as it did inside the track svg (crane.ts's rule).
  let moving = false, x0 = 0, y0 = 0, lx = 0, ly = 0, s = 1, tf0 = '';
  // the svg's css box (fractional), kept by a ResizeObserver on its HTML wrapper (.d-gps-trk, same box): Safari before 17
  // reports an observed <svg>'s bbox, not its box
  const trk = carSvg.parentElement!;
  let box: { width: number; height: number } = trk.getBoundingClientRect();
  const scale = () => { const vb = carSvg.viewBox.baseVal; s = vb.width && vb.height ? Math.min(box.width / vb.width, box.height / vb.height) : 1; };
  const placeCar = () => {
    const pt = path.getPointAtLength(lapPos(lap, phase, inten) * len);
    lx = pt.x; ly = pt.y;
    if (!moving) { car.setAttribute('cx', lx.toFixed(4)); car.setAttribute('cy', ly.toFixed(4)); return; }
    const tf = `translate(${((lx - x0) * s).toFixed(2)}px, ${((ly - y0) * s).toFixed(2)}px)`;   // meet scale: no offset in a delta
    if (tf !== tf0) { carSvg.style.transform = tf; tf0 = tf; }
  };
  // landing puts the circle where the layer last drew it, so the dot never jumps
  const carLayer = (on: boolean) => {
    if (on === moving) return;
    moving = on;
    if (on) { x0 = car.cx.baseVal.value; y0 = car.cy.baseVal.value; scale(); carSvg.style.willChange = 'transform'; return; }
    carSvg.style.transform = carSvg.style.willChange = ''; tf0 = '';
    car.setAttribute('cx', lx.toFixed(4)); car.setAttribute('cy', ly.toFixed(4));
  };
  if ('ResizeObserver' in window) new ResizeObserver(([e]) => { box = e.contentRect; scale(); placeCar(); }).observe(trk);
  // write on change only (D3, 10-02): this runs every frame while the car laps,
  // and the LCD strings / cap states change a few times a second at most
  let lastName: string | null = null, lastTime: string | null = null, lastPlay: string | null = null, lastPause: string | null = null;
  const readouts = () => {
    const name = chips.find((c) => Number(c.dataset.track) === track)?.dataset.name ?? '';
    const n = running && !paused ? `▶ ${name}` : name;
    const t = `LAP ${lapT.toFixed(1).padStart(4, '0')}s`;
    const pl = String(running && !paused);
    const pa = String(paused || (latched && !running));
    if (lcdName && n !== lastName) { lcdName.textContent = n; lastName = n; }
    if (lcdTime && t !== lastTime) { lcdTime.textContent = t; lastTime = t; }
    if (playBtn && pl !== lastPlay) { playBtn.setAttribute('aria-pressed', pl); lastPlay = pl; }
    if (pauseBtn && pa !== lastPause) { pauseBtn.setAttribute('aria-pressed', pa); lastPause = pa; }
  };
  // the GPS glass shows the chip's own outline (same point space, its own viewBox)
  const select = (id: number) => {
    carLayer(false);   // back on its point before the viewBox changes under it; the next lap frame lifts it again
    track = id; lap = lapOf(id);
    chips.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.track) === id)));
    const src = chips.find((c) => Number(c.dataset.track) === id)?.querySelector('svg');
    const vb = src?.getAttribute('viewBox');
    if (src && vb) {
      glass.setAttribute('viewBox', vb);
      carSvg.setAttribute('viewBox', vb);
      path.setAttribute('d', src.querySelector('path')!.getAttribute('d')!);
      car.setAttribute('r', carR(vb));
    }
    len = path.getTotalLength();
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
      if (!raf) carLayer(false);   // PAUSE / STOP while the hand holds: the loop ends here, so the layer goes too
      return;
    }
    if (running && !paused) { phase += dt / period(); lapT = (lapT + dt) % period(); }
    const target = running ? lapTarget(lap, phase, swingWidth(inten), inten, period()) : 0;
    const p = spring.step(target, dt, inten, period());
    setPan(p, 'tracks');
    placeCar(); readouts();
    // a held (PAUSE) or parked (STOP) car rests the loop once the spring settles
    const settled = Math.abs(target - p) < 0.002 && Math.abs(spring.vel) < 0.002;
    raf = (running && !paused) || !settled ? requestAnimationFrame(frame) : 0;
    carLayer(running && !paused);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } readouts(); };

  // autoplay only while the cabinet or the hero wheel is really on screen, and the FX crane (crane.ts, laptop)
  // hasn't landed the FX panel over this one: the dash rests under the FX view, as in the plugin
  const watched = [gps, root.querySelector<HTMLElement>('.d-cockpit')].filter((el): el is HTMLElement => !!el);
  const seen = new Set<Element>();
  let covered = false;
  const autoplay = () => {
    if (seen.size && !covered) {
      if (!running && !userPaused && !reduce) { running = true; paused = false; spring.pan = getPan(); spring.vel = 0; kick(); }
    } else if (running) {
      running = false; paused = false; park(); kick();   // the STOP path: the spring parks the pan at C
    }
  };
  sec.addEventListener('drift:covered', (e) => { covered = (e as CustomEvent<boolean>).detail; autoplay(); });
  if (watched.length && 'IntersectionObserver' in window) {
    // phone (A5, 10-04): the hero wheel is 2.15x the screen, so a full screen of it is only ~30% of its box
    const phoneMq = matchMedia('(max-width: 600px)');
    const need = (el: Element) => (phoneMq.matches && el.classList.contains('d-cockpit') ? 0.2 : 0.35);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.intersectionRatio >= need(e.target) ? seen.add(e.target) : seen.delete(e.target);
      autoplay();
    }, { threshold: [0.2, 0.35] });
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

  // INTENSITY / SPEED: the value screens mirror the plugin's (big value, INTENSITY's 12-bar meter)
  const intVal = sec.querySelector<HTMLElement>('[data-vs="int"] [data-vs-val]');
  const intBars = Array.from(sec.querySelectorAll<HTMLElement>('[data-vs="int"] [data-vs-bars] i'));
  const spdVal = sec.querySelector<HTMLElement>('[data-vs="spd"] [data-vs-val]');
  const showInt = () => {
    if (intVal) intVal.textContent = String(Math.round(inten * 100));
    intBars.forEach((b, i) => b.classList.toggle('on', i < Math.round(inten * intBars.length)));
  };
  const showSpd = () => { if (spdVal) spdVal.textContent = period().toFixed(1); };
  const moved = () => (reduce ? kick() : play());
  const intSlot = sec.querySelector<HTMLElement>('[data-fader="int"]');
  const spdSlot = sec.querySelector<HTMLElement>('[data-fader="spd"]');
  if (intSlot) initFader(intSlot, INT_DEFAULT, (v) => `${Math.round(v * 100)} percent`, (v) => { inten = v; showInt(); moved(); });
  if (spdSlot) initFader(spdSlot, LAP_DEFAULT, (v) => `${circuitPeriod(v).toFixed(1)} seconds a lap`, (v) => { lap01 = v; showSpd(); moved(); });
  showInt(); showSpd();
  select(track);
}
