/**
 * /widebeam console (lane D, D.2): the column beside the face (WbConsole.astro, Dan's pick D5 A).
 *   ORIGINAL | WIDE BEAM: the plugin's bat switch strip, bound to POWER (up = WIDE BEAM, down = the original: the plugin's
 *     bypass); its two printed words are its two keys, each a 44 px+ half (demo-03).
 *   MONO CHECK: the MONO cap cut from the plate, bound to MONO.
 *   PRESET ‹ name ›: 44 px keys stepping through the 16 factory presets without leaving the dash (demo-d01).
 *   VOLUME: the page's own monitor level, a fader (DESIGN.md §9; the plugin has no fader; demo-d02).
 *   The coach: on a first visit the trip LCD on the face says what to try next, DRAG WIDTH UP, NOW PRESS MONO,
 *     POWER OFF = ORIGINAL, while that control's own light breathes (static under reduced motion and the site's high
 *     contrast) and a polite live region says it once (demo-05). It ends when the three are done, remembered per browser.
 * The mirror, CORR and the engine key are sound.ts's.
 */
import { PRESETS, type Store } from './state';
import type { Face, CueTarget } from './face';

const TOGGLE = { frames: 29, cols: 6, rows: 5 };
const pos = (f: number) => `${((f % TOGGLE.cols) / (TOGGLE.cols - 1)) * 100}% ${(Math.floor(f / TOGGLE.cols) / (TOGGLE.rows - 1)) * 100}%`;
const COACH_KEY = 'wb-coach-v1';

export function initConsole(page: HTMLElement, store: Store, face: Face, audio: { setVolume(db: number): void }) {
  const root = page.querySelector<HTMLElement>('[data-wb-console]');
  if (!root) return;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── ORIGINAL | WIDE BEAM: the bat strip on an over-centre spring (the face's own swStep), bound to POWER ──
  const bat = root.querySelector<HTMLElement>('[data-wb-bat] span');
  const keyOn = root.querySelector<HTMLButtonElement>('[data-wb-ab="on"]');
  const keyOff = root.querySelector<HTMLButtonElement>('[data-wb-ab="off"]');
  let ang = store.get().power ? 35 : -35, vel = 0, raf = 0, T = 0;
  const paintBat = () => { if (bat) bat.style.backgroundPosition = pos(Math.round(((ang + 35) / 70) * 28)); };
  const step = (now: number) => {
    raf = 0; const dt = Math.min(0.02, (now - T) / 1000); T = now;
    const on = store.get().power, stop = on ? 35 : -35, dir = Math.sign(stop - ang) || (on ? 1 : -1);
    vel += dir * 9000 * dt; ang += vel * dt;
    if (on ? ang >= 35 : ang <= -35) { ang = stop; vel = -vel * 0.22; if (Math.abs(vel) < 40) vel = 0; }
    paintBat();
    if (vel !== 0 || ang !== stop) raf = requestAnimationFrame(step);
  };
  const kickBat = () => { if (reduced()) { ang = store.get().power ? 35 : -35; paintBat(); return; } if (!raf) { T = performance.now(); raf = requestAnimationFrame(step); } };
  if (bat) { bat.style.backgroundSize = `${TOGGLE.cols * 100}% ${TOGGLE.rows * 100}%`; paintBat(); }
  // the bat is the face's own strip, in the same tier, swapped in with the face's art
  const setBatArt = () => { const u = face.artUrl('toggle'); if (bat && u) bat.style.backgroundImage = `url(${u})`; };
  addEventListener('wb:art', setBatArt);
  setBatArt();
  keyOn?.addEventListener('click', () => store.set({ power: true }, 'console'));
  keyOff?.addEventListener('click', () => store.set({ power: false }, 'console'));

  // ── MONO CHECK ──
  const mono = root.querySelector<HTMLButtonElement>('[data-wb-mono-check]');
  mono?.addEventListener('click', () => store.set({ mono: !store.get().mono }, 'console'));

  // ── PRESET ‹ name › ──
  const name = root.querySelector<HTMLElement>('[data-wb-preset-name]');
  root.querySelectorAll<HTMLButtonElement>('[data-wb-step]').forEach((b) => b.addEventListener('click', () => face.loadPreset(store.preset + Number(b.dataset.wbStep))));

  // ── VOLUME: 0-100 on a fader taper (40 dB a decade), 0 = silent ──
  const fader = root.querySelector<HTMLInputElement>('[data-wb-volume]');
  const toDb = (v: number) => (v <= 0 ? -Infinity : 40 * Math.log10(v / 100));
  const setVol = () => {
    if (!fader) return;
    const v = Number(fader.value), db = toDb(v);
    fader.style.setProperty('--wb-vol', `${v}%`);
    fader.setAttribute('aria-valuetext', v <= 0 ? 'Silent' : `${db.toFixed(1)} dB`);
    audio.setVolume(Number.isFinite(db) ? db : -100);
  };
  fader?.addEventListener('input', setVol);
  setVol();

  const paint = () => {
    const s = store.get();
    keyOn?.setAttribute('aria-pressed', String(s.power));
    keyOff?.setAttribute('aria-pressed', String(!s.power));
    root.classList.toggle('is-original', !s.power);
    mono?.setAttribute('aria-pressed', String(s.mono));
    if (name) name.textContent = PRESETS[store.preset].name.toUpperCase() + (store.edited ? '*' : '');
  };
  store.on((s, ch) => { if ('power' in ch) kickBat(); paint(); });
  paint();

  // ── the coach (first visit): the trip LCD names the next thing to try, its control's light breathes ──
  type Step = { text: string; say: string; cue: CueTarget; con?: string; done(s: ReturnType<Store['get']>, ch: Record<string, unknown>, src: string): boolean };
  const STEPS: Step[] = [
    { text: 'DRAG WIDTH UP', say: 'Try this: drag WIDTH up.', cue: 'width', done: (s, ch, src) => 'width' in ch && src !== 'preset' && s.width >= 160 },
    { text: 'NOW PRESS MONO', say: 'Now press MONO.', cue: 'mono', con: '[data-wb-mono-check]', done: (s, ch) => 'mono' in ch && s.mono },
    { text: 'POWER OFF = ORIGINAL', say: 'Now switch POWER off: that is the original.', cue: 'power', con: '[data-wb-ab="off"]', done: (s, ch) => 'power' in ch && !s.power },
  ];
  const live = root.querySelector<HTMLElement>('[data-wb-coach]');
  let doneMask = 0;
  try { doneMask = Number(localStorage.getItem(COACH_KEY)) || 0; } catch {}
  const all = (1 << STEPS.length) - 1;
  let shown = -1, lit = false;
  const coach = () => {
    const s = store.get();
    const i = lit && doneMask !== all ? STEPS.findIndex((_, n) => !(doneMask & (1 << n))) : -1;
    // the line and the lamp only while the face is lit (POWER off leaves dark glass: the step that is next waits)
    const showing = i >= 0 && s.power;
    face.say(showing ? STEPS[i].text : null);
    face.cue(showing ? STEPS[i].cue : null);
    root.querySelectorAll('.is-cue').forEach((n) => n.classList.remove('is-cue'));
    if (showing && STEPS[i].con) root.querySelector(STEPS[i].con!)?.classList.add('is-cue');
    if (i !== shown) { shown = i; if (live) live.textContent = i >= 0 ? STEPS[i].say : ''; }
  };
  store.on((s, ch, src) => {
    if (src === 'init' || src === 'story') return;
    let changed = false;
    STEPS.forEach((st, n) => { if (!(doneMask & (1 << n)) && st.done(s, ch as Record<string, unknown>, src)) { doneMask |= 1 << n; changed = true; } });
    if (changed) { try { localStorage.setItem(COACH_KEY, String(doneMask)); } catch {} }
    coach();
  });
  face.onIgnite(() => { lit = true; coach(); });
}
