/**
 * /widebeam sound (lane D): the engine's start and stop, the SOUND key's runtime state, your own track, the rear-view
 * mirror (a vectorscope in the console's road window) and the face's correlation needle. It plays the synth loop, or the
 * visitor's own track, at a fixed monitor level: the player (TRACK, VOLUME, the engine key) went, Dan 2026-11-21, "remove
 * the player".
 *
 * When the music starts (Dan's pick P2 B, the allow-list; demo-08, a11y-01, mobile-07, hero-11, copy-17, guidelines-09):
 * only on a touch of the demo, an element marked [data-wb-demo] inside the page: a knob or switch on the face or the phone
 * deck, a console key, the SOUND key, "Take it for a drive", a preset card; a chosen file plays once it is in. Whatever
 * starts it lights the face if the face is there to see it (the old engine key's turn of the key). A pointer counts on
 * press with a mouse and on release with a finger (a scroll swipe that starts on a knob is cancelled, never a start); a key counts when it adjusts a
 * focused control (arrows, Page Up / Down, Home, End; Enter and Space arrive as a click). Never: Tab, a letter, the cookie
 * banner, a form, Skip / Replay, the nav, the cart, the footer, the Owner's Manual ([data-wb-manual]). There is no
 * AudioContext and no probe at load (a11y-16, perf-05): the engine is made inside the first act, which is also what
 * unlocks audio on iOS; navigator.audioSession is 'playback' first, so the iPhone's silent switch does not mute it
 * (demo-17, owed: a check on a real phone). A visitor who stopped the sound (SOUND) or a tutorial that stopped it
 * (stopForFilm) is never restarted by a knob or a card: only SOUND, "Take it for a drive" or a chosen file.
 *
 * API for the other modules: requestSound(srcEl) starts it as "Take it for a drive" does; stopForFilm() stops it and
 * nothing restarts it by itself (lane S calls it when the tutorial plays); isPlaying(); onChange(fn) hears play / stop.
 * The SOUND key (lane A's markup, no aria-label): its visible text is its name, a fixed "Sound", and aria-pressed carries the
 * state (WbSound.astro, r-asks-soundname).
 */
import { WideBeamEngine } from './audio';
import type { Store } from './state';
import type { Face } from './face';
import { initConsole } from './console';
import { initDeck } from './deck';

let api: { request(srcEl: Element | null): Promise<void>; stopForFilm(): void; playing(): boolean } | null = null;
const listeners = new Set<(on: boolean) => void>();

export const requestSound = (srcEl: Element | null = null) => api?.request(srcEl) ?? Promise.resolve();
export const stopForFilm = () => api?.stopForFilm();
export const isPlaying = () => !!api?.playing();
export function onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

// what the status line says plays (the synth loop: audio.ts nightDrive)
const DEMO = 'Synth loop · turn WIDTH, flip HIGH BEAM, press MONO';
// the monitor level, fixed where the old VOLUME fader started (80 of 100 on its 40 dB-a-decade taper = -3.9 dB), so the
// loudness did not change when the fader went
const MONITOR_DB = 40 * Math.log10(0.8);

// the deck's knobs are range inputs: an act on one is an act on the demo (the file input is not)
const NEVER = '[data-wb-manual], form, input:not([data-wb-deck-k]), textarea, select, label, iframe, video, [data-wb-sound]';
const ACT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']);
const ADJUSTS = '[role="slider"], input[type="range"]';
// the console's ORIGINAL | WIDE BEAM radio pair: an arrow moves its choice (Page Up / Down, Home, End still scroll the page)
const RADIO_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function initSound(page: HTMLElement, store: Store, face: Face, ignite: () => void) {
  let engine: WideBeamEngine | null = null, userStopped = false, token = 0, ownTrack = false;
  const fileIn = page.querySelector<HTMLInputElement>('[data-wb-file]');
  const fileLabel = page.querySelector<HTMLElement>('[data-wb-file-label]');
  const msg = page.querySelector<HTMLElement>('[data-wb-msg]');
  const scope = page.querySelector<HTMLCanvasElement>('[data-wb-scope]');
  const corrRead = page.querySelector<HTMLElement>('[data-wb-corr]');
  const sound = page.querySelector<HTMLButtonElement>('[data-wb-sound]');
  // its name is its visible text, a fixed "Sound", with aria-pressed (demo-12, WCAG 2.5.3): a static aria-label ("Music")
  // would hide it, so it goes (lane A's markup: WbSound.astro can drop it for good)
  sound?.removeAttribute('aria-label');
  const faceEl = face.root;

  // made inside the first act: it is the gesture that opens the audio device (and unlocks it on iOS). A browser that
  // cannot make an AudioContext (no output device, a hardened browser) gets null and the status line says so; the knobs,
  // the presets and the forms keep working (r-dash-noaudio)
  const NO_AUDIO = "Sound isn't available in this browser, so the demo can't play. The knobs and presets still work.";
  const makeEngine = (): WideBeamEngine | null => {
    if (!engine) {
      try { const s = (navigator as any).audioSession; if (s && s.type !== 'playback') s.type = 'playback'; } catch {}
      try { engine = new WideBeamEngine(); }
      catch { if (msg) msg.textContent = NO_AUDIO; return null; }
      engine.set(store.get());
      engine.setVolume(MONITOR_DB);
      store.on((s) => engine!.set(s));
      // a call, Siri, another app or a screen lock can suspend (or 'interrupt') the context from outside: the page says
      // so, and the next act resumes it (r-dash-interrupt)
      const e = engine;
      e.ctx.addEventListener?.('statechange', () => {
        if (!e.playing) return;
        if (e.ctx.state === 'running') { if (!page.classList.contains('is-playing')) setPlaying(true); }
        else if (page.classList.contains('is-playing')) { setPlaying(false); if (msg) msg.textContent = 'The sound was paused from outside the page. Press Sound or turn a knob to bring it back.'; }
      });
    }
    return engine;
  };
  // sounding: a source plays AND the device runs (a suspended context has a source and no sound)
  const audible = () => !!engine?.playing && engine.ctx.state === 'running';
  // Chrome and Firefox start their audio service inside the first `new AudioContext()`: a 100-210 ms freeze of the page
  // on the first touch (G3 timing; measured on a bare page too). Asking for the device list starts that service off the
  // main thread, so the context opens in ~3 ms later (it needs ~300 ms' start). Asked once, never at load: when the
  // visitor's own scroll brings the face on screen, or a pointer or the focus reaches a control that can start the sound.
  // No AudioContext, no sound, the answer is dropped unread.
  let warmed = false;
  const warm = () => { if (warmed || engine) return; warmed = true; try { navigator.mediaDevices?.enumerateDevices?.().catch(() => {}); } catch {} };
  const WARM_ON = '[data-wb-demo], [data-wb-sound]';
  const warmIf = (e: Event) => { if ((e.target as Element | null)?.closest?.(WARM_ON)) warm(); };
  new IntersectionObserver(([e], io) => { if (e.isIntersecting && scrollY > 2) { warm(); io.disconnect(); } }, { threshold: [0, 0.25, 0.5, 0.75, 1] }).observe(faceEl);
  page.addEventListener('pointerover', warmIf, { passive: true });
  page.addEventListener('focusin', warmIf);
  page.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') warmIf(e); }, { passive: true, capture: true }); // a finger acts on release
  const unlock = (e: WideBeamEngine) => (e.ctx.state === 'running' ? Promise.resolve() : e.ctx.resume().catch(() => {}));
  const faceShown = () => { const r = faceEl.getBoundingClientRect(); return r.height ? Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / r.height : 0; };

  const label = () => (ownTrack ? `${engine?.sourceName} · stays on your computer, nothing is uploaded` : DEMO);
  const setPlaying = (on: boolean) => {
    page.classList.toggle('is-playing', on);
    // a polite status line: "Sound on" is announced with what plays
    if (msg) msg.textContent = on ? `Sound on. ${label()}` : 'Sound off.';
    sound?.setAttribute('aria-pressed', String(on));
    if (on) meterLoop();
    else { face.setCorrelation(null); if (corrRead) corrRead.textContent = '--'; const c = scope?.getContext('2d'); if (c && scope) c.clearRect(0, 0, scope.width, scope.height); }
    listeners.forEach((fn) => fn(on));
  };

  async function start(explicit: boolean) {
    if (!explicit && userStopped) return; // a visitor's (or a film's) stop is never undone by a knob or a card
    if (engine?.playing) { if (engine.ctx.state !== 'running') unlock(engine); return; } // paused from outside: resume (statechange repaints)
    const my = ++token;
    const e = makeEngine();
    if (!e) return;
    await unlock(e);
    if (my !== token || e.playing) return; // stopped (or a film began) while the device opened
    if (e.ctx.state !== 'running') return; // still locked without a gesture: the next act tries again
    userStopped = false;
    e.start();
    setPlaying(true);
    // the key in the dash turns: the face lights if it is there to see it (the engine key's start did this, and every
    // start does now: SOUND, "Take it for a drive", a touch of the demo, a chosen file)
    if (faceShown() >= 0.35) ignite();
  }
  function stop(byVisitor: boolean) {
    token++;
    if (byVisitor) userStopped = true;
    if (engine?.playing) { engine.stop(); setPlaying(false); }
  }
  const toggle = () => (audible() ? stop(true) : start(true));

  api = {
    request: () => start(true),
    stopForFilm: () => stop(true),
    playing: () => audible(),
  };

  // ── the allow-list: an act on the demo ([data-wb-demo]) starts it; the sound keys choose for themselves ──
  const demoOf = (t: EventTarget | null) => {
    const n = t as Element | null;
    const el = n?.closest?.('[data-wb-demo]') as HTMLElement | null;
    if (!el || !page.contains(el) || n!.closest(NEVER)) return null;
    return el;
  };
  const act = (el: HTMLElement | null) => { if (el) start(el.matches('[data-wb-start]')); };
  // a modified click on a link ("Take it for a drive", a card's link) is the browser's: a new tab or window, Ctrl's menu
  // on a Mac. A modified press on a knob still counts (Shift / Alt is the fine drag).
  const browsers = (e: MouseEvent, el: HTMLElement | null) => !!el?.matches('a[href]') && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);
  // the glove box lane drags sideways with a mouse (presets.ts): a press on a card counts only as a click that did not
  // drag the lane (more than 4 px, presets.ts's own threshold), so a drag never starts the sound (r-dash-lanedrag).
  // (Here, not in presets.ts's swallow: this capture listener on the page runs before the lane's.)
  let laneDown: { x: number; y: number } | null = null;
  page.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = demoOf(e.target);
    if (el?.closest('[data-wb-lane]')) { laneDown = { x: e.clientX, y: e.clientY }; return; }
    if (!browsers(e, el)) act(el);
  }, true);
  page.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') act(demoOf(e.target)); }, true);
  page.addEventListener('click', (e) => {
    const el = demoOf(e.target), down = laneDown;
    laneDown = null;
    if (browsers(e, el)) return;
    if (down && el?.closest('[data-wb-lane]') && Math.abs(e.clientX - down.x) > 4) return;
    act(el);
  }, true);
  // a scroll key acts only on a control it adjusts (the face's sliders, the deck's ranges): on a link, a card or a key
  // (the hero's "Take it for a drive", a glove card, MONO CHECK) it scrolls the page, so it never starts the sound (P2 B)
  page.addEventListener('keydown', (e) => {
    if (!ACT_KEYS.has(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as Element | null;
    if (t?.matches?.(ADJUSTS) || (RADIO_KEYS.has(e.key) && t?.matches?.('[data-wb-ab]'))) act(demoOf(e.target));
  }, true);
  // a screen reader's adjust on a deck knob (a native range) sends no key: its input event is the act (a script's own
  // value change sends none)
  page.addEventListener('input', (e) => { if ((e.target as Element)?.matches?.('input[data-wb-deck-k]')) act(demoOf(e.target)); }, true);

  sound?.addEventListener('click', () => { toggle(); });

  // ── your own track: decoded here, never uploaded; it stays the source until the visitor picks another file (demo-16) ──
  // the label's click is the gesture: the device opens there, so the track can play when the chooser returns
  fileLabel?.addEventListener('click', () => { const e = makeEngine(); if (e) unlock(e); });
  fileIn?.addEventListener('change', async () => {
    const f = fileIn.files?.[0];
    fileIn.value = '';
    if (!f) return;
    const e = makeEngine();
    if (!e) return;
    try {
      const buffer = await e.ctx.decodeAudioData(await f.arrayBuffer());
      e.setSource({ kind: 'buffer', buffer, name: f.name });
      ownTrack = true;
      if (e.playing) setPlaying(true); else await start(true);
      if (!e.playing && msg) msg.textContent = `${f.name} is loaded. Press Sound to hear it.`;
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
      if (corrRead) { const t = level > 1e-4 ? (corr >= 0 ? '+' : '') + corr.toFixed(2) : '--'; if (corrRead.textContent !== t) corrRead.textContent = t; }
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

  // ── the console beside the face (console.ts) ──
  initConsole(page, store, face);
  // ── the phone deck under the face (deck.ts, D.4): the same store ──
  initDeck(page, store, face);
}
