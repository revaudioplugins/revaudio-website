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
 *     On the phone deck (deck.ts) the same lamp breathes on the deck's control; on a touch screen the first line says the
 *     finger's gesture, SLIDE WIDTH RIGHT (a vertical swipe on a knob not picked yet scrolls the page, on the deck and the face).
 * The mirror, CORR and the engine key are sound.ts's.
 */
import { PRESETS, type Store } from './state';
import { fitLine, onRefit, type Face, type CueTarget } from './face';
import { deckOn, DECK_MQ } from './drive-to';

const TOGGLE = { frames: 29, cols: 6, rows: 5 };
const pos = (f: number) => `${((f % TOGGLE.cols) / (TOGGLE.cols - 1)) * 100}% ${(Math.floor(f / TOGGLE.cols) / (TOGGLE.rows - 1)) * 100}%`;
const COACH_KEY = 'wb-coach-v1';

export function initConsole(page: HTMLElement, store: Store, face: Face, audio: { setVolume(db: number): void; monoSource(): boolean }) {
  const root = page.querySelector<HTMLElement>('[data-wb-console]');
  if (!root) return () => {};
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
  // the pair is one choice of two, so it is a radio group (WbConsole.astro): one Tab stop, the arrows move the choice
  // (two aria-pressed toggles announced a toggle that did nothing when pressed again: r-dash-abrole)
  [keyOn, keyOff].forEach((k) => k?.addEventListener('keydown', (e) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    const to = k === keyOn ? keyOff : keyOn;
    store.set({ power: to === keyOn }, 'console');
    to?.focus();
  }));

  // ── MONO CHECK ──
  const mono = root.querySelector<HTMLButtonElement>('[data-wb-mono-check]');
  mono?.addEventListener('click', () => store.set({ mono: !store.get().mono }, 'console'));

  // ── PRESET ‹ name › ──
  const name = root.querySelector<HTMLElement>('[data-wb-preset-name]');
  root.querySelectorAll<HTMLButtonElement>('[data-wb-step]').forEach((b) => b.addEventListener('click', () => face.stepPreset(Number(b.dataset.wbStep))));

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
  // a finger on the fader follows the knobs' touch law: it waits until the finger has said which way (8 px). Sideways
  // sets the level; a vertical swipe is the page's scroll and leaves the level alone; a tap sets it where it lands. A
  // touch screen's native slider jumps to the finger on touchstart, before any move (r-dash-volswipe: a swipe that began
  // a quarter across dropped -3.9 dB to -26.3 dB), so the value it proposes is held back until the gesture decides.
  let tp: { id: number; sx: number; sy: number; v: string; mode: 'pending' | 'turn' | 'off'; want: string | null } | null = null;
  fader?.addEventListener('pointerdown', (e) => { tp = e.pointerType === 'mouse' ? null : { id: e.pointerId, sx: e.clientX, sy: e.clientY, v: fader.value, mode: 'pending', want: null }; });
  fader?.addEventListener('pointermove', (e) => {
    if (!tp || e.pointerId !== tp.id || tp.mode !== 'pending') return;
    const dx = e.clientX - tp.sx, dy = e.clientY - tp.sy;
    if (Math.hypot(dx, dy) < 8) return;
    tp.mode = Math.abs(dx) > Math.abs(dy) ? 'turn' : 'off';
    if (tp.mode === 'turn' && tp.want !== null) { fader.value = tp.want; setVol(); }
  });
  fader?.addEventListener('pointerup', (e) => {
    if (tp && e.pointerId === tp.id && tp.mode === 'pending' && tp.want !== null) { fader.value = tp.want; setVol(); }
    tp = null;
  });
  // the page took the swipe: the value the slider jumped to goes back (a sideways drag already applied keeps its level)
  fader?.addEventListener('pointercancel', () => { if (tp && tp.mode !== 'turn') fader.value = tp.v; tp = null; });
  fader?.addEventListener('input', () => {
    if (tp && tp.mode !== 'turn') { tp.want = fader.value; fader.value = tp.v; return; }
    setVol();
  });
  setVol();

  const paint = () => {
    const s = store.get();
    keyOn?.setAttribute('aria-checked', String(s.power));
    keyOff?.setAttribute('aria-checked', String(!s.power));
    if (keyOn) keyOn.tabIndex = s.power ? 0 : -1;
    if (keyOff) keyOff.tabIndex = s.power ? -1 : 0;
    root.classList.toggle('is-original', !s.power);
    mono?.setAttribute('aria-pressed', String(s.mono));
    const nm = PRESETS[store.preset].name.toUpperCase() + (store.edited ? '*' : '');
    if (name && name.textContent !== nm) { name.textContent = nm; fitLine(name); }
  };
  if (name) { onRefit(() => fitLine(name)); new ResizeObserver(() => fitLine(name)).observe(name); }
  store.on((s, ch) => { if ('power' in ch) kickBat(); paint(); });
  paint();

  // ── the coach (first visit): the trip LCD names the next thing to try, its control's light breathes ──
  // con / deck: the console's and the phone deck's own control for that step; touchText / touchSay: a finger's gesture
  // wait(s): the step has nothing to ask for now, and the coach goes on to the next one (the step stays owed)
  type Step = { text: string; say: string; touchText?: string; touchSay?: string; cue: CueTarget; con?: string; deck: string; done(s: ReturnType<Store['get']>, ch: Record<string, unknown>, src: string): boolean; wait?(s: ReturnType<Store['get']>): boolean };
  const STEPS: Step[] = [
    // (WIDTH already at 160 or past it, a preset's doing: no "drag it up" to a visitor who has it there or at the top, 200:
    // r-dash-coachmax; on a mono track WIDTH has nothing to widen: HIGH BEAM is the move, r-dash-monocoach)
    { text: 'DRAG WIDTH UP', say: 'Try this: drag WIDTH up.', touchText: 'SLIDE WIDTH RIGHT', touchSay: 'Try this: slide a finger right across WIDTH.', cue: 'width', deck: '[data-wb-deck-ctl="width"]', done: (s, ch, src) => 'width' in ch && src !== 'preset' && s.width >= 160, wait: (s) => s.width >= 160 || audio.monoSource() },
    { text: 'NOW PRESS MONO', say: 'Now press MONO.', cue: 'mono', con: '[data-wb-mono-check]', deck: '[data-wb-deck-sw="mono"]', done: (s, ch) => 'mono' in ch && s.mono },
    { text: 'POWER OFF = ORIGINAL', say: 'Now switch POWER off: that is the original.', cue: 'power', con: '[data-wb-ab="off"]', deck: '[data-wb-deck-sw="power"]', done: (s, ch) => 'power' in ch && !s.power },
  ];
  const deck = page.querySelector<HTMLElement>('[data-wb-deck]');
  const live = root.querySelector<HTMLElement>('[data-wb-coach]');
  let doneMask = 0;
  try { doneMask = Number(localStorage.getItem(COACH_KEY)) || 0; } catch {}
  const all = (1 << STEPS.length) - 1;
  // on a mono track, while WIDTH's step is owed: the beam first (shown only, never stored: the track decides it)
  const BEAM: Step = { text: 'FLIP HIGH BEAM', say: 'This track is mono, so WIDTH has nothing to widen: flip HIGH BEAM.', cue: 'high', deck: '[data-wb-deck-sw="high"]', done: () => false };
  let shown: Step | null = null, lit = false;
  const coach = () => {
    const s = store.get();
    let st: Step | null = null;
    if (lit && doneMask !== all) {
      if (!(doneMask & 1) && audio.monoSource() && !s.high) st = BEAM;
      else st = STEPS.find((x, n) => !(doneMask & (1 << n)) && !x.wait?.(s)) ?? null;
    }
    // the line and the lamp only while the face is lit (POWER off leaves dark glass: the step that is next waits)
    const showing = !!st && s.power, finger = deckOn() || matchMedia('(pointer: coarse)').matches;
    face.say(showing ? (finger && st!.touchText) || st!.text : null);
    face.cue(showing ? st!.cue : null);
    [root, deck].forEach((r) => r?.querySelectorAll('.is-cue').forEach((n) => n.classList.remove('is-cue')));
    if (showing && st!.con) root.querySelector(st!.con!)?.classList.add('is-cue');
    if (showing && deck) deck.querySelector(st!.deck)?.classList.add('is-cue');
    if (st !== shown) { shown = st; if (live) live.textContent = st ? (finger && st.touchSay) || st.say : ''; }
  };
  store.on((s, ch, src) => {
    if (src === 'init' || src === 'story') return;
    let changed = false;
    STEPS.forEach((st, n) => { if (!(doneMask & (1 << n)) && st.done(s, ch as Record<string, unknown>, src)) { doneMask |= 1 << n; changed = true; } });
    if (changed) { try { localStorage.setItem(COACH_KEY, String(doneMask)); } catch {} }
    coach();
  });
  face.onIgnite(() => { lit = true; coach(); });
  matchMedia(DECK_MQ).addEventListener?.('change', coach); // turned sideways or back: the line for the controls in view
  return coach; // sound.ts: the track changed (a mono one asks for HIGH BEAM)
}
