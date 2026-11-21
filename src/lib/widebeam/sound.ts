/**
 * /widebeam sound (lane D): the engine's start and stop, the SOUND key's runtime state, the engine key, your own track,
 * the rear-view mirror (a vectorscope in the console's road window) and the face's correlation needle.
 *
 * When the music starts (Dan's pick P2 B, the allow-list; demo-08, a11y-01, mobile-07, hero-11, copy-17, guidelines-09):
 * only on a touch of the demo, an element marked [data-wb-demo] inside the page: a knob or switch on the face or the phone
 * deck, a console key, the engine key, the SOUND key, "Take it for a drive", a preset card; a TRACK pick plays the picked
 * track once it is in, as a chosen file does (D.3). A pointer counts on press with a mouse and on
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
import { WideBeamEngine, type WbSource } from './audio';
import type { Store } from './state';
import { fitLine, onRefit, type Face } from './face';
import { initConsole } from './console';
import { initDeck } from './deck';
// the demo clips (D.3, Dan's pick P3 B): Vite gives each a hashed /_astro/ name, so a returning visitor keeps it for a
// year and a changed clip gets a new URL (perf-d02); nothing here fetches one until it is picked
import vocalClip from '../../assets/widebeam/clips/vocal.m4a?url';
import guitarClip from '../../assets/widebeam/clips/guitar.m4a?url';
import padClip from '../../assets/widebeam/clips/pad.m4a?url';
import mixClip from '../../assets/widebeam/clips/mix.m4a?url';

let api: { request(srcEl: Element | null): Promise<void>; stopForFilm(): void; playing(): boolean } | null = null;
const listeners = new Set<(on: boolean) => void>();

export const requestSound = (srcEl: Element | null = null) => api?.request(srcEl) ?? Promise.resolve();
export const stopForFilm = () => api?.stopForFilm();
export const isPlaying = () => !!api?.playing();
export function onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

/**
 * What the demo plays: the synthesized Night Drive loop, or one of four clips cut from the team's own renders already on
 * the site (Yoni's DAW bounces; how each was cut, measured and matched: the lane D report, D.3). Each clip is a seamless
 * loop of `samples` at 48 kHz with 0.25 s of itself on both sides (the AAC priming never reaches the seam), AAC 160k,
 * loudness-matched to the others and to the synth loop at the engine's input (-19.3 LUFS, true peak <= -1.4 dBTP), so it
 * plays at unity gain through the same chain as everything else.
 *   Vocal (mono)  RevFX's dry vocal (public/audio/revfx/vocal-before.m4a): mono, so WIDTH has no side to widen; HIGH BEAM does.
 *   Guitar        the Radio Roulette station mixer's dry guitar (public/station-mixer/audio/guitar_dry.m4a): a double, two
 *                 takes hard left and right, its first 4 of 8 bars (the two halves are the same audio).
 *   Pad           RevFX's dry instrument bed (public/audio/revfx/instruments-before.m4a): sustained, side ~6 dB under mid.
 *   Full mix      the GAS mixer's three dry stems summed (public/gas-mixer/audio/*_dry.m4a), its first 4 of 8 bars.
 */
const PAD = 0.25, SR = 48000;
type Track = { name: string; hint: string; url?: string; loop?: [number, number] };
const clip = (url: string, samples: number) => ({ url, loop: [PAD, PAD + samples / SR] as [number, number] });
export const TRACKS: Track[] = [
  { name: 'Night Drive (synth)', hint: 'turn WIDTH, flip HIGH BEAM, press MONO' },
  { name: 'Vocal (mono)', hint: "WIDTH can't widen a mono track: flip HIGH BEAM", ...clip(vocalClip, 576000) },
  { name: 'Guitar', hint: 'two takes, left and right: turn WIDTH, then press MONO', ...clip(guitarClip, 512000) },
  { name: 'Pad', hint: 'turn WIDTH; LOW FOCUS keeps its low end in the middle', ...clip(padClip, 610331) },
  { name: 'Full mix', hint: 'turn WIDTH, then press MONO', ...clip(mixClip, 658286) },
];

// the deck's knobs are range inputs: an act on one is an act on the demo (the console's VOLUME fader is not)
const NEVER = '[data-wb-manual], form, input:not([data-wb-deck-k]), textarea, select, label, iframe, video, [data-wb-sound], [data-wb-play], [data-wb-track-step]';
const ACT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']);
const ADJUSTS = '[role="slider"], input[type="range"]';

export function initSound(page: HTMLElement, store: Store, face: Face, ignite: () => void) {
  let engine: WideBeamEngine | null = null, userStopped = false, token = 0, volumeDb = -3.9, stops = 0;
  // the track the picker shows (TRACKS index; -1 = the visitor's own file) and the one the engine has
  let track = 0, playingTrack = 0, pickSeq = 0, pickT = 0;
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
  // Chrome and Firefox start their audio service inside the first `new AudioContext()`: a 100-210 ms freeze of the page
  // on the first touch (G3 timing; measured on a bare page too). Asking for the device list starts that service off the
  // main thread, so the context opens in ~3 ms later (it needs ~300 ms' start). Asked once, never at load: when the
  // visitor's own scroll brings the face on screen, or a pointer or the focus reaches a control that can start the sound.
  // No AudioContext, no sound, the answer is dropped unread.
  let warmed = false;
  const warm = () => { if (warmed || engine) return; warmed = true; try { navigator.mediaDevices?.enumerateDevices?.().catch(() => {}); } catch {} };
  const WARM_ON = '[data-wb-demo], [data-wb-sound], [data-wb-play]';
  const warmIf = (e: Event) => { if ((e.target as Element | null)?.closest?.(WARM_ON)) warm(); };
  new IntersectionObserver(([e], io) => { if (e.isIntersecting && scrollY > 2) { warm(); io.disconnect(); } }, { threshold: [0, 0.25, 0.5, 0.75, 1] }).observe(faceEl);
  page.addEventListener('pointerover', warmIf, { passive: true });
  page.addEventListener('focusin', warmIf);
  page.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') warmIf(e); }, { passive: true, capture: true }); // a finger acts on release
  const unlock = (e: WideBeamEngine) => (e.ctx.state === 'running' ? Promise.resolve() : e.ctx.resume().catch(() => {}));
  const faceShown = () => { const r = faceEl.getBoundingClientRect(); return r.height ? Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / r.height : 0; };

  const label = () => (playingTrack < 0 ? `${engine?.sourceName} · stays on your computer, nothing is uploaded` : `${TRACKS[playingTrack].name} · ${TRACKS[playingTrack].hint}`);
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
    if (byVisitor) { userStopped = true; stops++; }
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
    if ((e.target as Element | null)?.matches?.(ADJUSTS)) act(demoOf(e.target));
  }, true);
  // a screen reader's adjust on a deck knob (a native range) sends no key: its input event is the act (a script's own
  // value change sends none)
  page.addEventListener('input', (e) => { if ((e.target as Element)?.matches?.('input[data-wb-deck-k]')) act(demoOf(e.target)); }, true);

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
      pickSeq++; clearTimeout(pickT); // a track still loading gives way to the file
      e.setSource({ kind: 'buffer', buffer, name: f.name });
      track = playingTrack = -1; paintTrack();
      if (e.playing) setPlaying(true); else await start(true);
      if (!e.playing && msg) msg.textContent = `${f.name} is loaded. Press Start the engine to hear it.`;
    } catch { if (msg) msg.textContent = "That file didn't decode. Try an MP3, WAV or M4A."; }
  });

  // ── TRACK ‹ name › (the console's and the deck's): what plays. A clip is fetched once the visitor settles on it
  //    (300 ms after the last step, so stepping past one never downloads it), decoded once, kept. A pick plays it, as a
  //    chosen file does; a stop that comes after the pick (SOUND, the engine key, a film) wins: it is then only loaded. ──
  const trackNames = [...page.querySelectorAll<HTMLElement>('[data-wb-track-name]')];
  function paintTrack() {
    const t = track < 0 ? 'YOUR TRACK' : TRACKS[track].name.toUpperCase();
    for (const n of trackNames) {
      n.textContent = t;
      // Courier New, 0.6 em a glyph: the LCD's own size, smaller for a long name so it stays on the glass
      n.style.fontSize = '';
      const w = n.clientWidth - 12, px = parseFloat(getComputedStyle(n).fontSize) || 14;
      if (w > 0 && t.length * 0.6 * px > w - 1) n.style.fontSize = `${Math.max(11, Math.floor(((w - 1) / t.length / 0.6) * 10) / 10)}px`; // 1 px spare: no ellipsis on a rounding
      fitLine(n, n.style.fontSize); // and a visitor's own wider text spacing (WCAG 1.4.12)
    }
  }
  onRefit(paintTrack);
  const decoded = new Map<number, Promise<AudioBuffer>>();
  const bufferOf = (i: number, e: WideBeamEngine) => {
    let p = decoded.get(i);
    if (!p) {
      p = fetch(TRACKS[i].url!).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); }).then((b) => e.ctx.decodeAudioData(b));
      p.catch(() => decoded.delete(i)); // a failed fetch can be tried again
      decoded.set(i, p);
    }
    return p;
  };
  async function loadTrack(my: number, stopsAtPick: number) {
    const i = track, t = TRACKS[i], e = makeEngine();
    let src: WbSource = { kind: 'demo' };
    if (t.url) {
      if (msg && !e.playing) msg.textContent = `Loading ${t.name}…`;
      try { src = { kind: 'buffer', buffer: await bufferOf(i, e), name: t.name, loop: t.loop, gain: 1 }; }
      catch {
        if (my !== pickSeq) return;
        track = playingTrack; paintTrack(); // the LCD goes back to what plays
        if (msg) msg.textContent = `${t.name} didn't load. Try again.`;
        return;
      }
    }
    if (my !== pickSeq) return; // a newer pick (or a file) owns the source
    e.setSource(src);
    playingTrack = i;
    if (e.playing) setPlaying(true); // the status line names the new track
    else if (stops === stopsAtPick) await start(true);
    else if (msg) msg.textContent = `${t.name} is loaded. Press Start the engine to hear it.`;
  }
  page.querySelectorAll<HTMLButtonElement>('[data-wb-track-step]').forEach((b) => b.addEventListener('click', () => {
    unlock(makeEngine()); // the click is the gesture that opens the audio device (iOS)
    const n = TRACKS.length, d = Number(b.dataset.wbTrackStep);
    track = track < 0 ? (d > 0 ? 0 : n - 1) : (track + d + n) % n;
    paintTrack();
    const my = ++pickSeq, at = stops;
    clearTimeout(pickT);
    pickT = window.setTimeout(() => loadTrack(my, at), 300);
  }));
  paintTrack();
  new ResizeObserver(() => paintTrack()).observe(page.querySelector('[data-wb-dash]') ?? page);

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

  // ── the console beside the face (console.ts): its VOLUME is the engine's monitor level ──
  initConsole(page, store, face, { setVolume(db) { volumeDb = db; engine?.setVolume(db); } });
  // ── the phone deck under the face (deck.ts, D.4): the same store; its TRACK keys are the picker's above ──
  initDeck(page, store, face);
}
