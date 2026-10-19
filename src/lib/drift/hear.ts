import { setPan } from './bus';
import { lcdText } from './lcd';

/**
 * #hear, the test drive (DriftHear.astro). Real bounces only: <id>-before.m4a (the original, level-matched down to
 * the DRIFT bounce) and <id>-after.m4a (DRIFT), padded PAD s on both sides so the loop seam never lands on the AAC
 * priming gap (tools/drift-player/prep_audio.py). One track in memory at a time (the iPhone rule): picking another
 * drops the old buffers. Both versions of the track run in sync; ORIGINAL / DRIFT is a 12 ms crossfade, so the
 * flip is instant and fair.
 *
 * What you hear is measured (L / R RMS -> equal-power pan) and written to the page's pan bus as 'demo', so the hero
 * wheel, the rails and the balance screen follow the real sound. Stopped, the pan settles back to centre.
 *
 * The guide: it opens on the ORIGINAL, and root[data-next] names the step to take next, for the CSS (that step's key
 * and control breathe) and the LCD's coach cell: 'play' (stopped) -> 'drift' (the original plays, DRIFT never pushed)
 * -> 'back' (DRIFT plays, not yet pushed back to the original) -> '' (heard both: free play); 'wait' while the sound
 * loads. Pushing DRIFT before PLAY starts in DRIFT (the push-to-start), so that visitor is asked for the original next.
 */
const BASE = '/audio/drift/';
type Lr = { L: number[]; R: number[] };
type Info = { dur: number; trimDb: number; before: Lr; after: Lr };
type Manifest = { pad: number; sr: number; bins: number; tracks: Record<string, Info> };

export function initHear(root: HTMLElement): void {
  const q = <T extends Element>(s: string) => root.querySelector<T>(s);
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hear-track]'));
  const playBtn = q<HTMLButtonElement>('[data-hear="play"]');
  const stopBtn = q<HTMLButtonElement>('[data-hear="stop"]');
  const startBox = q<HTMLElement>('[data-hear-start-box]');
  const startBtn = q<HTMLButtonElement>('[data-hear-start]');
  const volKnob = q<HTMLElement>('[data-hear-vol]');
  const volStrip = q<HTMLElement>('[data-hear-vol-strip]');
  const volRead = q<HTMLElement>('[data-hear-vol-read]');
  const volTicks = Array.from(root.querySelectorAll<HTMLElement>('.d-vol-ticks i'));
  const title = q<HTMLElement>('[data-hear-title]');
  const tag = q<HTMLElement>('[data-hear-tag]');
  const stateEl = q<HTMLElement>('[data-hear-state]');
  const timeEl = q<HTMLElement>('[data-hear-time]');
  const cv = q<HTMLCanvasElement>('[data-hear-wave]');
  if (!playBtn || !stopBtn || !cv || !chips.length) return;
  const g = cv.getContext('2d')!;

  const st = { track: chips[0].dataset.hearTrack!, after: false, playing: false, loading: false };
  // the guide: has the visitor pushed DRIFT on, and then back off to the original?
  let didOn = false, didOff = false;
  // 'wait' while the sound loads: keys stay dim and nothing breathes (never the free-play look before it has played)
  type Next = 'wait' | 'play' | 'drift' | 'back' | '';
  const next = (): Next => st.loading ? 'wait' : !st.playing ? 'play' : !st.after && !didOn ? 'drift' : st.after && !didOff ? 'back' : '';
  const COACH: Record<Next, string> = { wait: 'LOADING', play: 'PRESS PLAY', drift: 'PUSH DRIFT', back: 'PUSH AGAIN: ORIGINAL', '': 'NOW PLAYING' };
  let M: Manifest | null = null;
  const manifest = fetch(`${BASE}peaks.json`).then((r) => r.json() as Promise<Manifest>).then((m) => { M = m; paintUi(); draw(); return m; });

  // ---- audio
  let ctx: AudioContext | null = null, mix: GainNode, volG: GainNode, anL: AnalyserNode, anR: AnalyserNode;
  let vol = .8;
  let bufL: Float32Array, bufR: Float32Array;
  let cur: { id: string; before: AudioBuffer; after: AudioBuffer; dur: number } | null = null;
  let srcs: { b: AudioBufferSourceNode; a: AudioBufferSourceNode; gB: GainNode; gA: GainNode } | null = null;
  let t0 = 0, tok = 0;
  const ensure = () => {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    mix = ctx.createGain(); volG = ctx.createGain(); volG.gain.value = vol * vol;
    mix.connect(volG).connect(ctx.destination);   // the meters read before the volume: the pan stays true at any level
    const sp = ctx.createChannelSplitter(2); mix.connect(sp);
    anL = ctx.createAnalyser(); anR = ctx.createAnalyser(); anL.fftSize = anR.fftSize = 1024;
    sp.connect(anL, 0); sp.connect(anR, 1);
    bufL = new Float32Array(1024); bufR = new Float32Array(1024);
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
  // the neon strike: two flickers, then steady (CSS d-start-strike)
  let strikeT = 0;
  const strike = () => {
    if (!startBox) return;
    startBox.classList.remove('is-striking'); void startBox.offsetWidth; startBox.classList.add('is-striking');
    clearTimeout(strikeT); strikeT = window.setTimeout(() => startBox.classList.remove('is-striking'), 600);
  };
  const stop = () => { stopSources(); st.playing = false; paintUi(); };
  const pick = (id: string) => {
    if (id === st.track) return;
    const keep = st.playing ? position() : 0;
    st.track = id; paintUi(); draw();
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
  chips.forEach((b) => b.addEventListener('click', () => pick(b.dataset.hearTrack!)));
  // push to start: one push toggles DRIFT; pushing it on while stopped also starts the music (in DRIFT)
  startBtn?.addEventListener('click', () => {
    if (st.loading) return;
    const on = !st.after; flip(on);
    if (on && !st.playing) void play();
  });

  // ---- paint
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const name = () => chips.find((c) => c.dataset.hearTrack === st.track)?.dataset.name ?? '';
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  function paintUi(): void {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.hearTrack === st.track)));
    startBtn?.setAttribute('aria-pressed', String(st.after));
    startBtn?.setAttribute('aria-label', st.after ? 'DRIFT. Lit: you hear DRIFT. Push for the original.' : 'DRIFT. Dark: you hear the original. Push to start DRIFT.');
    startBox?.setAttribute('data-on', st.after ? 'after' : 'before');
    startBox?.toggleAttribute('data-loading', st.loading);
    root.dataset.ab = st.after ? 'after' : 'before';
    playBtn!.setAttribute('aria-pressed', String(st.playing));
    root.toggleAttribute('data-playing', st.playing);
    const n = next();
    root.dataset.next = n;
    // words settle in like liquid crystal (a short fade-in); the running numbers just change
    for (const [el, s] of [[title, name()], [tag, st.after ? 'DRIFT ON' : 'ORIGINAL'], [stateEl, COACH[n]]] as const)
      if (el && lcdText(el, s) && !still.matches) el.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 170, easing: 'ease-out' });   // unchanged = no repeat announcement
    if (timeEl && !st.playing && M) lcdText(timeEl, `00:00 / ${fmt(M.tracks[st.track].dur)}`);   // before the manifest lands, the build-time length stays
  }
  // the waveform = a segment bar graph on the LCD: columns of 2 px segments on a 3 px pitch, L lit up from the middle
  // and R down, every unlit segment faintly there; played = full ink, the rest dim, the playhead column pale. Pitch,
  // bar width and inks come from the screen's CSS (--seg-*), read again whenever the canvas changes size.
  let seg = { col: 6, bar: 4, ink: '#ff5af5', dim: 'rgba(255,90,245,.34)', ghost: 'rgba(255,90,245,.08)', head: '#ffe6fd' };
  const readSeg = () => {
    const c = getComputedStyle(cv!), v = (k: string) => c.getPropertyValue(k).trim();
    seg = { col: +v('--seg-col') || seg.col, bar: +v('--seg-bar') || seg.bar, ink: v('--seg-ink') || seg.ink,
      dim: v('--seg-wave-dim') || seg.dim, ghost: v('--seg-ghost') || seg.ghost, head: v('--seg-head') || seg.head };
  };
  function draw(): void {
    if (!M) return;
    const info = M.tracks[st.track], P = st.after ? info.after : info.before;
    const dpr = Math.min(2, devicePixelRatio || 1), w = cv!.clientWidth, h = cv!.clientHeight;
    if (!w || !h) return;
    if (cv!.width !== Math.round(w * dpr) || cv!.height !== Math.round(h * dpr)) { cv!.width = Math.round(w * dpr); cv!.height = Math.round(h * dpr); readSeg(); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    // one scale for both versions of a track, so ORIGINAL vs DRIFT is a fair picture
    let mx = 1e-3; for (const v of [info.before, info.after]) for (const x of [...v.L, ...v.R]) mx = Math.max(mx, x);
    const n = P.L.length, played = st.playing && cur ? position() / cur.dur : -1;
    const { col, bar } = seg, cols = Math.floor((w + col - bar) / col), ox = Math.floor((w - (cols - 1) * col - bar) / 2);
    const up = Math.round(h / 6), down = Math.floor((h - 2) / 3) + 1 - up;   // rows above / below the middle
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
    for (const [p, c] of [[off, seg.ghost], [dim, seg.dim], [ink, seg.ink], [hd, seg.head]] as const) { g.fillStyle = c; g.fill(p); }
  }

  // ---- the loop: screen + clock + the measured pan onto the bus; settles to centre after a stop
  let raf = 0, panS = 0, lastT = 0;
  const rms = (a: Float32Array) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / a.length); };
  function loop(): void {
    if (raf) return;
    lastT = performance.now();
    const step = (now: number) => {
      raf = 0;
      const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
      let target = 0, L = 0, R = 0;
      if (st.playing && ctx) {
        anL.getFloatTimeDomainData(bufL); anR.getFloatTimeDomainData(bufR);
        L = rms(bufL); R = rms(bufR);
        target = L + R > 1e-3 ? Math.max(-1, Math.min(1, 4 / Math.PI * Math.atan2(R, L) - 1)) : panS;
        if (timeEl && cur) lcdText(timeEl, `${fmt(position())} / ${fmt(cur.dur)}`);
        draw();
      }
      panS += (target - panS) * Math.min(1, dt * (st.playing ? 10 : 6));
      setPan(Math.abs(panS) < .004 ? 0 : panS, 'demo');
      if (st.playing || Math.abs(panS) > .004) raf = requestAnimationFrame(step);
      else draw();
    };
    raf = requestAnimationFrame(step);
  }
  const loopAfterStop = () => { if (!st.playing) loop(); };
  stopBtn.addEventListener('click', loopAfterStop);

  // ---- VOLUME: DRIFT's own knob (65-frame strip, -135..+135 deg), its bars lit up to the level, the last one white
  const setVol = (v: number) => {
    vol = Math.max(0, Math.min(1, v));
    if (volG && ctx) volG.gain.setTargetAtTime(vol * vol, ctx.currentTime, .02);
    const f = Math.round(vol * 64), col = f % 13, row = Math.floor(f / 13);
    if (volStrip) volStrip.style.backgroundPosition = `${(col / 12 * 100).toFixed(3)}% ${(row / 4 * 100).toFixed(3)}%`;
    const lit = Math.round(vol * (volTicks.length - 1));
    volTicks.forEach((t, i) => { t.classList.toggle('on', vol > 0 && i < lit); t.classList.toggle('tip', vol > 0 && i === lit); });
    const pct = Math.round(vol * 100);
    volKnob?.setAttribute('aria-valuenow', String(pct));
    if (volRead) volRead.textContent = pct ? `VOLUME ${pct}` : 'MUTE';
  };
  if (volKnob) {
    let drag: { y: number; x: number; v: number } | null = null;
    volKnob.addEventListener('pointerdown', (e) => { volKnob.setPointerCapture(e.pointerId); drag = { y: e.clientY, x: e.clientX, v: vol }; });
    volKnob.addEventListener('pointermove', (e) => { if (drag) setVol(drag.v + ((drag.y - e.clientY) + (e.clientX - drag.x)) / 180); });
    const end = () => { drag = null; };
    volKnob.addEventListener('pointerup', end); volKnob.addEventListener('pointercancel', end);
    volKnob.addEventListener('wheel', (e) => { e.preventDefault(); setVol(vol - Math.sign(e.deltaY) * .05); }, { passive: false });
    volKnob.addEventListener('dblclick', () => setVol(.8));
    volKnob.addEventListener('keydown', (e) => {
      const d = { ArrowUp: .05, ArrowRight: .05, ArrowDown: -.05, ArrowLeft: -.05, PageUp: .2, PageDown: -.2 }[e.key];
      if (d !== undefined) { e.preventDefault(); setVol(vol + d); }
      if (e.key === 'Home') { e.preventDefault(); setVol(0); } if (e.key === 'End') { e.preventDefault(); setVol(1); }
    });
  }
  setVol(vol);

  addEventListener('resize', () => draw());
  paintUi();
  void manifest;
}
