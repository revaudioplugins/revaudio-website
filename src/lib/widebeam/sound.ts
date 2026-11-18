/**
 * /widebeam sound (lane D): the engine's start and stop, the SOUND pill, the Start key, your own track, the music
 * that starts by itself (at load where the browser allows sound, else on the first click / tap / key), and the
 * rear-view mirror (a vectorscope) with the face's correlation needle.
 *
 * API for the other modules: requestSound(srcEl) starts the demo loop as the hero's "Take it for a drive" key does;
 * stopForFilm() stops it (no caller yet); isPlaying(); onChange(fn) hears every play / stop.
 */
import { WideBeamEngine } from './audio';
import type { Store } from './state';
import type { Face } from './face';

let api: { request(srcEl: Element | null): Promise<void>; stop(): void; playing(): boolean } | null = null;
const listeners = new Set<(on: boolean) => void>();

export const requestSound = (srcEl: Element | null = null) => api?.request(srcEl) ?? Promise.resolve();
export const stopForFilm = () => api?.stop();
export const isPlaying = () => !!api?.playing();
export function onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function initSound(page: HTMLElement, store: Store, face: Face, ignite: () => void) {
  // ── audio ──
  let engine: WideBeamEngine | null = null, userStopped = false;
  const playBtn = page.querySelector<HTMLButtonElement>('[data-wb-play]');
  const fileIn = page.querySelector<HTMLInputElement>('[data-wb-file]');
  const msg = page.querySelector<HTMLElement>('[data-wb-msg]');
  const scope = page.querySelector<HTMLCanvasElement>('[data-wb-scope]');
  const corrRead = page.querySelector<HTMLElement>('[data-wb-corr]');
  const sound = page.querySelector<HTMLButtonElement>('[data-wb-sound]');
  // created synchronously so a gesture handler can resume it inside the gesture (iOS Safari unlocks audio only there)
  const makeEngine = () => {
    if (!engine) { engine = new WideBeamEngine(); engine.set(store.get()); store.on((s) => engine!.set(s)); }
    return engine;
  };
  const getEngine = async () => {
    const e = makeEngine();
    if (e.ctx.state !== 'running') await e.ctx.resume();
    return e;
  };
  const setPlaying = (on: boolean, label?: string) => {
    page.classList.toggle('is-playing', on);
    playBtn?.setAttribute('aria-pressed', String(on));
    const f = playBtn?.querySelector('[data-face]');
    if (f) f.textContent = on ? 'Stop the engine' : 'Start the engine';
    if (msg) msg.textContent = on ? (label ?? 'Night Drive loop · turn WIDTH, flip HIGH BEAM, press MONO') : 'Engine off.';
    sound?.setAttribute('aria-pressed', String(on));
    const sf = sound?.querySelector('[data-face]');
    if (sf) sf.textContent = on ? 'Sound on' : 'Sound off';
    if (on) meterLoop(); else face.setCorrelation(null);
    listeners.forEach((fn) => fn(on));
  };
  const toggle = async () => {
    const e = makeEngine();
    if (e.playing) { e.stop(); userStopped = true; setPlaying(false); return; }
    userStopped = false;
    await getEngine(); e.playDemo(); setPlaying(true);
  };
  api = {
    // today's "Take it for a drive": start the loop if it isn't running (a visitor's earlier stop doesn't block it)
    async request() {
      const e = await getEngine();
      if (!e.playing) { e.playDemo(); setPlaying(true); }
    },
    stop() { if (engine?.playing) { engine.stop(); setPlaying(false); } },
    playing: () => !!engine?.playing,
  };
  playBtn?.addEventListener('click', async () => { await toggle(); ignite(); });
  sound?.addEventListener('click', toggle);

  // the music plays by itself: at load where the browser already allows sound (Chrome, for a site it trusts),
  // otherwise on the first click / tap / key anywhere on the page. A scroll is not a gesture, so it can't count.
  // Never restarts a visitor who stopped it.
  const autoStart = async () => {
    if (userStopped) return;
    const e = await getEngine();
    if (!e.playing && !userStopped) { e.playDemo(); setPlaying(true); }
  };
  const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'] as const;
  const offGesture = () => GESTURES.forEach((k) => document.removeEventListener(k, onGesture, true));
  function onGesture(ev: Event) {
    if ((ev.target as HTMLElement)?.closest?.('[data-wb-play], [data-wb-file], [data-wb-sound]')) { offGesture(); return; } // those choose for themselves
    if (ev instanceof KeyboardEvent && (ev.key === 'Escape' || ev.metaKey || ev.ctrlKey || ev.altKey)) return; // not activations
    const e = makeEngine();
    if (e.ctx.state !== 'running') e.ctx.resume().catch(() => {}); // inside the gesture: this is what unlocks audio
    // a touch counts on release, not on press; browsers without userActivation (Safari < 16.4) get that rule by hand
    const active = navigator.userActivation ? navigator.userActivation.isActive : ev.type !== 'pointerdown' || (ev as PointerEvent).pointerType === 'mouse';
    if (e.ctx.state === 'running' || active) { offGesture(); autoStart(); }
  }
  GESTURES.forEach((k) => document.addEventListener(k, onGesture, true));
  try { if (makeEngine().ctx.state === 'running') { offGesture(); autoStart(); } } catch {}
  page.querySelectorAll<HTMLElement>('[data-wb-start]').forEach((b) => b.addEventListener('click', () => requestSound(b)));
  fileIn?.addEventListener('change', async () => {
    const f = fileIn.files?.[0];
    if (!f) return;
    const e = await getEngine();
    try { await e.playFile(f); setPlaying(true, `${f.name} · stays on your computer, nothing is uploaded`); }
    catch { if (msg) msg.textContent = "That file didn't decode. Try an MP3, WAV or M4A."; }
    fileIn.value = '';
  });

  // the rear-view mirror: a vectorscope with phosphor persistence; the face's needle reads the real correlation
  const sctx = scope?.getContext('2d');
  let mRaf = 0, gain = 200;
  function meterLoop() {
    if (mRaf || !engine) return;
    const step = () => {
      mRaf = 0;
      if (!engine?.playing) { if (sctx && scope) sctx.clearRect(0, 0, scope.width, scope.height); return; }
      const { corr, level } = engine.measure();
      face.setCorrelation(level > 1e-4 ? corr : 0);
      if (corrRead) corrRead.textContent = (corr >= 0 ? '+' : '') + corr.toFixed(2);
      if (sctx && scope) {
        const w = scope.width, h = scope.height, [L, R] = engine.scope();
        sctx.globalCompositeOperation = 'source-over';
        sctx.fillStyle = 'rgba(8,7,6,.28)'; sctx.fillRect(0, 0, w, h);
        sctx.globalCompositeOperation = 'lighter';
        sctx.fillStyle = 'rgba(255,214,140,.55)';
        // a classic goniometer: mono is a vertical line, wide is a fat cloud, out of phase lies flat; auto-gain
        let pk = 0.02;
        for (let i = 0; i < L.length; i += 4) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
        gain += (h * 0.36 / pk - gain) * 0.08;
        const d = Math.max(1.2, devicePixelRatio);
        for (let i = 0; i < L.length; i += 2) {
          const x = w / 2 + (L[i] - R[i]) * 0.7071 * gain, y = h * 0.45 - (L[i] + R[i]) * 0.7071 * gain;
          sctx.fillRect(x, y, d, d);
        }
      }
      mRaf = requestAnimationFrame(step);
    };
    mRaf = requestAnimationFrame(step);
  }
  if (scope) { const fit = () => { scope.width = scope.clientWidth * Math.min(2, devicePixelRatio); scope.height = scope.clientHeight * Math.min(2, devicePixelRatio); }; new ResizeObserver(fit).observe(scope); fit(); }
}
