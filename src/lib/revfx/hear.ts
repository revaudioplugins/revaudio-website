import { lcdText } from '../drift/lcd';
import { initFader } from '../drift/faders';

/**
 * #rfx-hear, the before/after player (RfxHear.astro). /drift's engine (src/lib/drift/hear.ts) without the pan bus:
 * <id>-before.m4a (dry, level-matched) and <id>-after.m4a (RevFX), padded PAD s on both sides so the loop seam never
 * lands on the AAC priming gap (tools/revfx-player/prep_audio.py). One track in memory at a time (the iPhone rule).
 * Both versions run in sync; BYPASS / REVFX is a 12 ms crossfade, so the flip is instant and fair.
 *
 * The guide, as on /drift: root[data-next] names the step to take next (CSS breathes that step's key and control,
 * the LCD's coach cell says it): 'play' -> 'stomp' (dry plays, REVFX never pushed) -> 'back' (RevFX plays, not yet
 * pushed back off) -> '' (heard both: free play); 'wait' while the sound loads. Pushing REVFX before PLAY starts in RevFX.
 */
const BASE = '/audio/revfx/';
type Lr = { L: number[]; R: number[] };
type Info = { dur: number; before: Lr; after: Lr };
type Manifest = { pad: number; tracks: Record<string, Info> };

export function initHear(): void {
  const root = document.querySelector<HTMLElement>('[data-rfx-hear]');
  if (!root) return;
  const q = <T extends Element>(s: string) => root.querySelector<T>(s);
  const jacks = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hear-track]'));
  const peds = Array.from(root.querySelectorAll<HTMLElement>('.rfx-peds-mini > li'));
  const playBtn = q<HTMLButtonElement>('[data-hear="play"]');
  const stopBtn = q<HTMLButtonElement>('[data-hear="stop"]');
  const stompBox = q<HTMLElement>('[data-hear-stomp-box]');
  const stompBtn = q<HTMLButtonElement>('[data-hear-stomp]');
  const volSlot = q<HTMLElement>('[data-hear-vol]');
  const volRead = q<HTMLElement>('[data-hear-vol-read]');
  const title = q<HTMLElement>('[data-hear-title]');
  const tag = q<HTMLElement>('[data-hear-tag]');
  const stateEl = q<HTMLElement>('[data-hear-state]');
  const timeEl = q<HTMLElement>('[data-hear-time]');
  const chainEl = q<HTMLElement>('[data-hear-chain]');
  const cv = q<HTMLCanvasElement>('[data-hear-wave]');
  if (!playBtn || !stopBtn || !cv || !jacks.length) return;
  const g = cv.getContext('2d')!;
  const inks: string[] = JSON.parse(root.dataset.inks || '[]');

  const st = { track: jacks[0].dataset.hearTrack!, after: false, playing: false, loading: false };
  let didOn = false, didOff = false;
  type Next = 'wait' | 'play' | 'stomp' | 'back' | '';
  const next = (): Next => st.loading ? 'wait' : !st.playing ? 'play' : !st.after && !didOn ? 'stomp' : st.after && !didOff ? 'back' : '';
  const COACH: Record<Next, string> = { wait: 'LOADING', play: 'PRESS PLAY', stomp: 'PUSH REVFX', back: 'PUSH AGAIN: BYPASS', '': 'NOW PLAYING' };
  let M: Manifest | null = null;
  const manifest = fetch(`${BASE}peaks.json`).then((r) => r.json() as Promise<Manifest>).then((m) => { M = m; paintUi(); draw(); return m; });

  // ---- audio
  let ctx: AudioContext | null = null, mix: GainNode;
  let vol = .8;
  let cur: { id: string; before: AudioBuffer; after: AudioBuffer; dur: number } | null = null;
  let srcs: { b: AudioBufferSourceNode; a: AudioBufferSourceNode; gB: GainNode; gA: GainNode } | null = null;
  let t0 = 0, tok = 0;
  const ensure = () => {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    mix = ctx.createGain(); mix.gain.value = vol * vol; mix.connect(ctx.destination);
    return ctx;
  };
  const load = async (id: string) => {
    if (cur?.id === id) return cur;
    const my = ++tok, c = ensure(), m = await manifest;
    const get = async (v: string) => c.decodeAudioData(await (await fetch(`${BASE}${id}-${v}.m4a`)).arrayBuffer());
    const [before, after] = await Promise.all([get('before'), get('after')]);
    if (my !== tok) return null;
    cur = { id, before, after, dur: m.tracks[id].dur };   // the old track's buffers go with the old object
    return cur;
  };
  const position = () => (ctx && cur ? (((ctx.currentTime - t0) % cur.dur) + cur.dur) % cur.dur : 0);
  const stopSources = () => {
    if (!srcs || !ctx) return;
    const s = srcs, now = ctx.currentTime; srcs = null;
    for (const gn of [s.gB, s.gA]) { gn.gain.cancelScheduledValues(now); gn.gain.setTargetAtTime(0, now, .008); }
    for (const n of [s.b, s.a]) { try { n.stop(now + .06); } catch { /* already stopped */ } }
  };
  const start = (offset: number) => {
    if (!ctx || !cur || !M) return;
    stopSources();
    const pad = M.pad, gB = ctx.createGain(), gA = ctx.createGain();
    gB.gain.value = st.after ? 0 : 1; gA.gain.value = st.after ? 1 : 0;
    gB.connect(mix); gA.connect(mix);
    const mk = (buf: AudioBuffer, gn: GainNode) => {
      const s = ctx!.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = pad; s.loopEnd = pad + cur!.dur; s.connect(gn); return s;
    };
    const b = mk(cur.before, gB), a = mk(cur.after, gA), when = ctx.currentTime + .03;
    b.start(when, pad + offset); a.start(when, pad + offset); t0 = when - offset;
    srcs = { b, a, gB, gA };
  };

  // ---- actions
  const play = async (keepAt = 0) => {
    const c = ensure(); void c.resume();
    st.loading = true; paintUi();
    const t = await load(st.track); st.loading = false;
    if (!t) return;
    start(keepAt % t.dur);
    st.playing = true; paintUi(); loop();
    if (st.after) strike();   // the sound is here: the tube strikes
  };
  // the neon strike (/drift's: two flickers, then steady; drift.css d-start-strike)
  let strikeT = 0;
  const strike = () => {
    if (!stompBox) return;
    stompBox.classList.remove('is-striking'); void stompBox.offsetWidth; stompBox.classList.add('is-striking');
    clearTimeout(strikeT); strikeT = window.setTimeout(() => stompBox.classList.remove('is-striking'), 600);
  };
  const stop = () => { stopSources(); st.playing = false; paintUi(); draw(); };
  const pick = (id: string) => {
    if (id === st.track) return;
    const keep = st.playing ? position() : 0;
    st.track = id;
    root.classList.remove('is-plugging'); void root.offsetWidth; root.classList.add('is-plugging');   // the plug seats (CSS)
    paintUi(); draw();
    if (st.playing) void play(keep);
  };
  const flip = (after: boolean) => {
    if (after === st.after) return;
    st.after = after;
    if (after) didOn = true; else if (didOn) didOff = true;
    paintUi(); draw();
    if (srcs && ctx) { const now = ctx.currentTime; srcs.gA.gain.setTargetAtTime(after ? 1 : 0, now, .012); srcs.gB.gain.setTargetAtTime(after ? 0 : 1, now, .012); }
    if (after && st.playing && !st.loading) strike();
  };
  playBtn.addEventListener('click', () => { if (!st.playing) void play(); });
  stopBtn.addEventListener('click', stop);
  jacks.forEach((b) => b.addEventListener('click', () => pick(b.dataset.hearTrack!)));
  // push to engage: one push toggles RevFX; pushing it on while stopped also starts the music (in RevFX)
  stompBtn?.addEventListener('click', () => {
    if (st.loading) return;
    const on = !st.after; flip(on);
    if (on && !st.playing) void play();
  });

  // ---- paint
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const jack = () => jacks.find((c) => c.dataset.hearTrack === st.track);
  const SHORT: Record<string, string> = { pitch: 'PITCH', echo: 'ECHO', halo: 'HALO', reverb: 'VERB', glue: 'GLUE' };
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  function paintUi(): void {
    jacks.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.hearTrack === st.track)));
    const on = new Set((jack()?.dataset.on ?? '').split(' ').filter(Boolean));
    peds.forEach((p) => p.classList.toggle('is-out', !on.has(p.dataset.fx!)));
    stompBtn?.setAttribute('aria-pressed', String(st.after));
    stompBtn?.setAttribute('aria-label', st.after ? 'REVFX. Lit: you hear RevFX. Push for the dry sound.' : 'REVFX. Dark: you hear the dry sound. Push to engage RevFX.');
    stompBox?.setAttribute('data-on', st.after ? 'after' : 'before');
    stompBox?.toggleAttribute('data-loading', st.loading);
    root.dataset.ab = st.after ? 'after' : 'before';
    playBtn!.setAttribute('aria-pressed', String(st.playing));
    root.toggleAttribute('data-playing', st.playing);
    const n = next();
    root.dataset.next = n;
    const chain = st.after ? peds.filter((p) => on.has(p.dataset.fx!)).map((p) => SHORT[p.dataset.fx!]).join('-') || 'DRY' : 'TRUE BYPASS';
    const name = jack()?.dataset.name ?? '';
    // words settle in like liquid crystal (a short fade-in); the running numbers just change
    for (const [el, s] of [[title, name], [tag, st.after ? 'REVFX ON' : 'BYPASS'], [stateEl, COACH[n]], [chainEl, chain]] as const)
      if (el && lcdText(el, s) && !still.matches) el.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 170, easing: 'ease-out' });
    if (timeEl && !st.playing && M) lcdText(timeEl, `00:00 / ${fmt(M.tracks[st.track].dur)}`);
  }

  // the waveform = a segment bar graph (/drift's): columns of 2 px segments on a 3 px pitch, L up from the middle and
  // R down, every unlit segment faintly there; played = full ink, the rest dim, the playhead pale. REVFX = the five
  // pedal inks across the screen in chain order; BYPASS = the screen's own grey. Inks + pitch from the CSS (--seg-*).
  let seg = { col: 6, bar: 4, ink: '#cfc4e0', dim: .34, ghost: 'rgba(230,215,255,.07)', head: '#ffffff' };
  const readSeg = () => {
    const c = getComputedStyle(cv!), v = (k: string) => c.getPropertyValue(k).trim();
    seg = { col: +v('--seg-col') || seg.col, bar: +v('--seg-bar') || seg.bar, ink: v('--seg-bp') || seg.ink,
      dim: +v('--seg-dim-a') || seg.dim, ghost: v('--seg-ghost') || seg.ghost, head: v('--seg-head') || seg.head };
  };
  function draw(): void {
    if (!M) return;
    const info = M.tracks[st.track], P = st.after ? info.after : info.before;
    const dpr = Math.min(2, devicePixelRatio || 1), w = cv!.clientWidth, h = cv!.clientHeight;
    if (!w || !h) return;
    if (cv!.width !== Math.round(w * dpr) || cv!.height !== Math.round(h * dpr)) { cv!.width = Math.round(w * dpr); cv!.height = Math.round(h * dpr); readSeg(); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    // one scale for both versions of a track, so BYPASS vs REVFX is a fair picture
    let mx = 1e-3; for (const v of [info.before, info.after]) for (const x of [...v.L, ...v.R]) mx = Math.max(mx, x);
    const n = P.L.length, played = st.playing && cur ? position() / cur.dur : -1;
    const { col, bar } = seg, cols = Math.floor((w + col - bar) / col), ox = Math.floor((w - (cols - 1) * col - bar) / 2);
    const up = Math.round(h / 6), down = Math.floor((h - 2) / 3) + 1 - up;
    const head = played >= 0 ? Math.min(cols - 1, Math.floor(played * w / col)) : -1;
    const ink = new Path2D(), dim = new Path2D(), off = new Path2D(), hd = new Path2D();
    for (let i = 0; i < cols; i++) {
      const b0 = Math.floor(i * col / w * n), b1 = Math.min(n, Math.max(b0 + 1, Math.floor((i + 1) * col / w * n)));
      let aL = 0, aR = 0; for (let b = b0; b < b1; b++) { aL = Math.max(aL, P.L[b]); aR = Math.max(aR, P.R[b]); }
      const nl = aL / mx > .02 ? Math.max(1, Math.round(aL / mx * up)) : 0, nr = aR / mx > .02 ? Math.max(1, Math.round(aR / mx * down)) : 0;
      const x = ox + i * col, lit = i === head ? hd : (i * col + bar / 2) / w < played ? ink : dim;
      for (let j = 0; j < up; j++) (i === head || j < nl ? lit : off).rect(x, (up - 1 - j) * 3, bar, 2);
      for (let j = 0; j < down; j++) (i === head || j < nr ? lit : off).rect(x, (up + j) * 3, bar, 2);
    }
    let paint: string | CanvasGradient = seg.ink;
    if (st.after && inks.length) {
      const gr = g.createLinearGradient(0, 0, w, 0);
      inks.forEach((c, i) => gr.addColorStop(inks.length > 1 ? i / (inks.length - 1) : 0, c));
      paint = gr;
    }
    g.fillStyle = seg.ghost; g.fill(off);
    g.fillStyle = paint; g.globalAlpha = seg.dim; g.fill(dim); g.globalAlpha = 1; g.fill(ink);
    g.fillStyle = seg.head; g.fill(hd);
  }

  // ---- the loop: screen + clock while playing
  let raf = 0;
  function loop(): void {
    if (raf) return;
    const step = () => {
      raf = 0;
      if (!st.playing) return;
      if (timeEl && cur) lcdText(timeEl, `${fmt(position())} / ${fmt(cur.dur)}`);
      draw();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  // ---- VOLUME: /drift's fader behaviour (faders.ts: drag, arrows 1 %, PageUp/Down 10 %, Home/End, double-click = 80)
  const volText = (v: number) => { const pct = Math.round(v * 100); return pct ? `VOL ${pct}` : 'MUTE'; };
  if (volSlot) initFader(volSlot, vol, volText, (v) => {
    vol = v;
    if (mix && ctx) mix.gain.setTargetAtTime(vol * vol, ctx.currentTime, .02);
    if (volRead) volRead.textContent = volText(v);
  });

  addEventListener('resize', () => draw());
  paintUi();
}
