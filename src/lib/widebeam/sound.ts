/**
 * /widebeam sound (lane D): the engine's start and stop, the SOUND key's runtime state, the engine key, your own track,
 * the rear-view mirror (a vectorscope in the console's road window) and the face's correlation needle.
 *
 * When the music starts (Dan's pick P2 B, the allow-list; demo-08, a11y-01, mobile-07, hero-11, copy-17, guidelines-09):
 * only on a touch of the demo, an element marked [data-wb-demo] inside the page: a knob or switch on the face, a console
 * key, the engine key, the SOUND key, "Take it for a drive", a preset card. A pointer counts on press with a mouse and on
 * release with a finger (a scroll swipe that starts on a knob is cancelled, never a start); a key counts when it adjusts a
 * focused control (arrows, Page Up / Down, Home, End; Enter and Space arrive as a click). Never: Tab, a letter, the cookie
 * banner, a form, Skip / Replay, the nav, the cart, the footer, the Owner's Manual ([data-wb-manual]). There is no
 * AudioContext and no probe at load (a11y-16, perf-05): the engine is made inside the first act, which is also what
 * unlocks audio on iOS; navigator.audioSession is 'playback' first, so the iPhone's silent switch does not mute it
 * (demo-17, owed: a check on a real phone). A visitor who stopped the sound (SOUND, the engine key) or a tutorial that
 * stopped it (stopForFilm) is never restarted by a knob or a card: only the engine key, SOUND or "Take it for a drive".
 *
 * API for the other modules: requestSound(srcEl) starts it as "Take it for a drive" does; stopForFilm() stops it and
 * nothing restarts it by itself (lane S calls it when the tutorial plays); isPlaying(); onChange(fn) hears play / stop.
 * The SOUND key (lane A's markup, no aria-label): its visible text is its name, "Sound on" / "Sound off", with aria-pressed.
 */
import { WideBeamEngine } from './audio';
import type { Store } from './state';
import type { Face } from './face';
import { initConsole } from './console';

let api: { request(srcEl: Element | null): Promise<void>; stopForFilm(): void; playing(): boolean } | null = null;
const listeners = new Set<(on: boolean) => void>();

export const requestSound = (srcEl: Element | null = null) => api?.request(srcEl) ?? Promise.resolve();
export const stopForFilm = () => api?.stopForFilm();
export const isPlaying = () => !!api?.playing();
export function onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

const NEVER = '[data-wb-manual], form, input, textarea, select, label, iframe, video, [data-wb-sound], [data-wb-play]';
const ACT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']);

export function initSound(page: HTMLElement, store: Store, face: Face, ignite: () => void) {
  let engine: WideBeamEngine | null = null, userStopped = false, token = 0, volumeDb = -3.9;
  const playBtn = page.querySelector<HTMLButtonElement>('[data-wb-play]');
  const fileIn = page.querySelector<HTMLInputElement>('[data-wb-file]');
  const fileLabel = page.querySelector<HTMLElement>('[data-wb-file-label]');
  const msg = page.querySelector<HTMLElement>('[data-wb-msg]');
  const scope = page.querySelector<HTMLCanvasElement>('[data-wb-scope]');
  const corrRead = page.querySelector<HTMLElement>('[data-wb-corr]');
  const sound = page.querySelector<HTMLButtonElement>('[data-wb-sound]');
  // its name is its visible text, "Sound off" / "Sound on", with aria-pressed (demo-12, WCAG 2.5.3): a static
  // aria-label ("Music") would hide it, so it goes (lane A's markup: WbSound.astro can drop it for good)
  sound?.removeAttribute('aria-label');
  const faceEl = face.root;

  // made inside the first act: it is the gesture that opens the audio device (and unlocks it on iOS)
  const makeEngine = () => {
    if (!engine) {
      try { const s = (navigator as any).audioSession; if (s && s.type !== 'playback') s.type = 'playback'; } catch {}
      engine = new WideBeamEngine();
      engine.set(store.get());
      engine.setVolume(volumeDb);
      store.on((s) => engine!.set(s));
    }
    return engine;
  };
  const unlock = (e: WideBeamEngine) => (e.ctx.state === 'running' ? Promise.resolve() : e.ctx.resume().catch(() => {}));
  const faceShown = () => { const r = faceEl.getBoundingClientRect(); return r.height ? Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / r.height : 0; };

  const label = () => (engine?.sourceKind === 'buffer' ? `${engine.sourceName} · stays on your computer, nothing is uploaded` : 'Night Drive loop · turn WIDTH, flip HIGH BEAM, press MONO');
  const setPlaying = (on: boolean) => {
    page.classList.toggle('is-playing', on);
    if (playBtn) {
      playBtn.classList.toggle('is-on', on);
      const f = playBtn.querySelector('[data-face]');
      if (f) f.textContent = on ? 'Stop the engine' : 'Start the engine';
    }
    // a polite status line: "Sound on" is announced with what plays
    if (msg) msg.textContent = on ? `Sound on. ${label()}` : 'Engine off.';
    sound?.setAttribute('aria-pressed', String(on));
    const sf = sound?.querySelector('[data-face]');
    if (sf) sf.textContent = on ? 'Sound on' : 'Sound off';
    if (on) meterLoop();
    else { face.setCorrelation(null); if (corrRead) corrRead.textContent = '--'; const c = scope?.getContext('2d'); if (c && scope) c.clearRect(0, 0, scope.width, scope.height); }
    listeners.forEach((fn) => fn(on));
  };

  async function start(explicit: boolean) {
    if (!explicit && userStopped) return; // a visitor's (or a film's) stop is never undone by a knob or a card
    if (engine?.playing) return;
    const my = ++token;
    const e = makeEngine();
    await unlock(e);
    if (my !== token || e.playing) return; // stopped (or a film began) while the device opened
    if (e.ctx.state !== 'running') return; // still locked without a gesture: the next act tries again
    userStopped = false;
    e.start();
    setPlaying(true);
  }
  function stop(byVisitor: boolean) {
    token++;
    if (byVisitor) userStopped = true;
    if (engine?.playing) { engine.stop(); setPlaying(false); }
  }
  const toggle = () => (engine?.playing ? stop(true) : start(true));

  api = {
    request: () => start(true),
    stopForFilm: () => stop(true),
    playing: () => !!engine?.playing,
  };

  // ── the allow-list: an act on the demo ([data-wb-demo]) starts it; the sound keys choose for themselves ──
  const demoOf = (t: EventTarget | null) => {
    const n = t as Element | null;
    const el = n?.closest?.('[data-wb-demo]') as HTMLElement | null;
    if (!el || !page.contains(el) || n!.closest(NEVER)) return null;
    return el;
  };
  const act = (el: HTMLElement | null) => { if (el) start(el.matches('[data-wb-start]')); };
  page.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button === 0) act(demoOf(e.target)); }, true);
  page.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') act(demoOf(e.target)); }, true);
  page.addEventListener('click', (e) => act(demoOf(e.target)), true);
  page.addEventListener('keydown', (e) => { if (ACT_KEYS.has(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) act(demoOf(e.target)); }, true);

  // the engine key turns the key in the dash: it plays or stops, and lights the face if the face is there to see it
  playBtn?.addEventListener('click', () => { toggle(); if (faceShown() >= 0.35) ignite(); });
  sound?.addEventListener('click', () => { toggle(); });

  // ── your own track: decoded here, never uploaded; it stays the source until the visitor picks another (demo-16) ──
  // the label's click is the gesture: the device opens there, so the track can play when the chooser returns
  fileLabel?.addEventListener('click', () => { unlock(makeEngine()); });
  fileIn?.addEventListener('change', async () => {
    const f = fileIn.files?.[0];
    fileIn.value = '';
    if (!f) return;
    const e = makeEngine();
    try {
      const buffer = await e.ctx.decodeAudioData(await f.arrayBuffer());
      e.setSource({ kind: 'buffer', buffer, name: f.name });
      if (e.playing) setPlaying(true); else await start(true);
      if (!e.playing && msg) msg.textContent = `${f.name} is loaded. Press Start the engine to hear it.`;
    } catch { if (msg) msg.textContent = "That file didn't decode. Try an MP3, WAV or M4A."; }
  });

  // ── the rear-view mirror: a goniometer whose dots fade off the road window's glass; the face's needle reads the
  //    real correlation. Both draw only while on screen (a11y-17); the audio keeps playing off screen. ──
  const sctx = scope?.getContext('2d');
  let mRaf = 0, gain = 200, mirrorOn = false, faceOn = false;
  function meterLoop() {
    if (mRaf || !engine?.playing || !(mirrorOn || faceOn)) return;
    const step = () => {
      mRaf = 0;
      if (!engine?.playing) { if (sctx && scope) sctx.clearRect(0, 0, scope.width, scope.height); return; }
      if (!(mirrorOn || faceOn)) return; // asleep until one is on screen again
      const { corr, level } = engine.measure();
      if (faceOn) face.setCorrelation(level > 1e-4 ? corr : 0);
      if (corrRead) corrRead.textContent = level > 1e-4 ? (corr >= 0 ? '+' : '') + corr.toFixed(2) : '--';
      if (mirrorOn && sctx && scope) {
        const w = scope.width, h = scope.height, [L, R] = engine.scope();
        sctx.globalCompositeOperation = 'destination-out';
        sctx.fillStyle = 'rgba(0,0,0,.26)'; sctx.fillRect(0, 0, w, h);
        sctx.globalCompositeOperation = 'lighter';
        sctx.fillStyle = 'rgba(255,214,140,.55)';
        // a classic goniometer: mono is a vertical line, wide is a fat cloud, out of phase lies flat; auto-gain
        let pk = 0.02;
        for (let i = 0; i < L.length; i += 4) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
        gain += (h * 0.38 / pk - gain) * 0.08;
        const d = Math.max(1.2, devicePixelRatio);
        for (let i = 0; i < L.length; i += 2) {
          const x = w / 2 + (L[i] - R[i]) * 0.7071 * gain, y = h * 0.5 - (L[i] + R[i]) * 0.7071 * gain;
          sctx.fillRect(x, y, d, d);
        }
      }
      mRaf = requestAnimationFrame(step);
    };
    mRaf = requestAnimationFrame(step);
  }
  const mirror = page.querySelector<HTMLElement>('[data-wb-console] .wb-con-mirror');
  if (mirror) new IntersectionObserver(([e]) => { mirrorOn = e.isIntersecting; meterLoop(); }).observe(mirror);
  new IntersectionObserver(([e]) => { faceOn = e.isIntersecting; meterLoop(); }).observe(faceEl);
  if (scope) { const fit = () => { scope.width = Math.max(1, scope.clientWidth * Math.min(2, devicePixelRatio)); scope.height = Math.max(1, scope.clientHeight * Math.min(2, devicePixelRatio)); }; new ResizeObserver(fit).observe(scope); fit(); }

  // ── the console beside the face (console.ts): its VOLUME is the engine's monitor level ──
  initConsole(page, store, face, { setVolume(db) { volumeDb = db; engine?.setVolume(db); } });
}
