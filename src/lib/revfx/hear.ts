import { lcdText } from '../drift/lcd';
import { initFader } from '../drift/faders';
import presetsJson from '../../data/revfx-presets.json';

/**
 * #rfx-hear, the before/after player (RfxHear.astro). /drift's engine (src/lib/drift/hear.ts) without the pan bus:
 * <id>-before.m4a (dry) and one file per preset (<id>-p1..p4.m4a; peaks.json names them), all level-matched and
 * padded PAD s on both sides so the loop seam never lands on the AAC priming gap (tools/revfx-player/prep_audio.py).
 * Dry and the current preset run in sync; BYPASS / REVFX is a 12 ms crossfade, so the flip is instant and fair.
 *
 * THE DIE (step 4, Yoni 2026-11-09: "only for the user its random"): each track has 4 presets Yoni made
 * (src/data/revfx-presets.json). A roll plays one of the other 3, REVFX on; playing, it crossfades in at the same spot
 * in the loop, stopped, it starts the music. The roll after this one is picked and loaded while this one plays, so a
 * roll is instant. A new track starts on a random preset. In memory: the dry, the current preset and the next one.
 *
 * The guide, as on /drift: root[data-next] names the step to take next (CSS breathes that step's key and control,
 * the LCD's coach cell says it): 'play' -> 'stomp' (dry plays, REVFX never pushed) -> 'back' (RevFX plays, not yet
 * pushed back off) -> 'roll' (heard both, never rolled) -> '' (free play); 'wait' while the sound loads.
 */
const BASE = '/audio/revfx/';
type Lr = { L: number[]; R: number[] };
type Info = { dur: number; before: Lr; presets: (Lr & { file: string })[] };
type Manifest = { pad: number; tracks: Record<string, Info> };
type Preset = { name: string; on: string[]; order: string[] };
const PRESETS = presetsJson.tracks as Record<string, Preset[]>;

export function initHear(): void {
  const root = document.querySelector<HTMLElement>('[data-rfx-hear]');
  if (!root) return;
  const q = <T extends Element>(s: string) => root.querySelector<T>(s);
  const jacks = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hear-track]'));
  const pedList = q<HTMLOListElement>('.rfx-peds-mini');
  const peds = Array.from(root.querySelectorAll<HTMLElement>('.rfx-peds-mini > li'));
  const playBtn = q<HTMLButtonElement>('[data-hear="play"]');
  const stopBtn = q<HTMLButtonElement>('[data-hear="stop"]');
  const stompBox = q<HTMLElement>('[data-hear-stomp-box]');
  const stompBtn = q<HTMLButtonElement>('[data-hear-stomp]');
  const dieBtn = q<HTMLButtonElement>('[data-hear-die]');
  const cube = q<HTMLElement>('[data-hear-cube]');
  const say = q<HTMLElement>('[data-hear-say]');
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
  const inkOf = new Map(peds.map((p) => [p.dataset.fx!, getComputedStyle(p).getPropertyValue('--ink').trim()]));

  // ---- the presets: random for the visitor, never the same one twice in a row
  const count = (id: string) => PRESETS[id]?.length ?? 1;
  const other = (id: string, not: number) => {
    const n = count(id);
    if (n < 2) return 0;
    const k = Math.floor(Math.random() * (n - 1));
    return k >= not ? k + 1 : k;
  };
  const first = jacks[0].dataset.hearTrack!;
  const firstP = Math.floor(Math.random() * count(first));
  const st = { track: first, preset: firstP, next: other(first, firstP), after: false, playing: false, loading: false };
  const preset = () => PRESETS[st.track]?.[st.preset] ?? { name: '', on: [], order: [] };
  let didOn = false, didOff = false, didRoll = false;
  type Next = 'wait' | 'play' | 'stomp' | 'back' | 'roll' | '';
  const next = (): Next => st.loading ? 'wait' : !st.playing ? 'play' : !st.after && !didOn ? 'stomp'
    : st.after && !didOff ? 'back' : !didRoll ? 'roll' : '';
  const COACH: Record<Next, string> = { wait: 'LOADING', play: 'PRESS PLAY', stomp: 'PUSH REVFX', back: 'PUSH AGAIN: BYPASS', roll: 'ROLL THE DICE', '': 'NOW PLAYING' };
  let M: Manifest | null = null;
  const manifest = fetch(`${BASE}peaks.json`).then((r) => r.json() as Promise<Manifest>).then((m) => { M = m; paintUi(); draw(); return m; });

  // ---- audio
  let ctx: AudioContext | null = null, mix: GainNode;
  let vol = .8;
  // decoded files by name; only the dry, the current preset and the next roll's are kept (the iPhone rule)
  const bufs = new Map<string, Promise<AudioBuffer>>();
  const fileOf = (id: string, k: number, m: Manifest) => m.tracks[id].presets[k].file;
  const buf = (file: string) => {
    let b = bufs.get(file);
    if (!b) {
      const c = ensure();
      b = fetch(`${BASE}${file}.m4a`).then((r) => r.arrayBuffer()).then((a) => c.decodeAudioData(a));
      b.catch(() => bufs.delete(file));
      bufs.set(file, b);
    }
    return b;
  };
  const keepOnly = (m: Manifest) => {
    const keep = new Set([`${st.track}-before`, fileOf(st.track, st.preset, m), fileOf(st.track, st.next, m)]);
    for (const f of bufs.keys()) if (!keep.has(f)) bufs.delete(f);
  };
  // load the next roll's preset in the background, so the roll that plays it is instant
  const prefetch = () => { if (ctx && M) { keepOnly(M); void buf(fileOf(st.track, st.next, M)).catch(() => {}); } };

  let cur: { id: string; k: number; before: AudioBuffer; after: AudioBuffer; dur: number } | null = null;
  let srcs: { b: AudioBufferSourceNode; a: AudioBufferSourceNode; gB: GainNode; gA: GainNode } | null = null;
  let t0 = 0, tok = 0;
  const ensure = () => {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    mix = ctx.createGain(); mix.gain.value = vol * vol; mix.connect(ctx.destination);
    return ctx;
  };
  const load = async (id: string, k: number) => {
    if (cur?.id === id && cur.k === k) return cur;
    const my = ++tok, m = await manifest;
    const [before, after] = await Promise.all([buf(`${id}-before`), buf(fileOf(id, k, m))]);
    if (my !== tok) return null;
    cur = { id, k, before, after, dur: m.tracks[id].dur };
    return cur;
  };
  const position = () => (ctx && cur ? (((ctx.currentTime - t0) % cur.dur) + cur.dur) % cur.dur : 0);
  const stopSources = () => {
    if (!srcs || !ctx) return;
    const s = srcs, now = ctx.currentTime; srcs = null;
    for (const gn of [s.gB, s.gA]) { gn.gain.cancelScheduledValues(now); gn.gain.setTargetAtTime(0, now, .008); }
    for (const n of [s.b, s.a]) { try { n.stop(now + .06); } catch { /* already stopped */ } }
  };
  const looped = (b: AudioBuffer, gn: GainNode) => {
    const s = ctx!.createBufferSource(); s.buffer = b; s.loop = true; s.loopStart = M!.pad; s.loopEnd = M!.pad + cur!.dur; s.connect(gn); return s;
  };
  const start = (offset: number) => {
    if (!ctx || !cur || !M) return;
    stopSources();
    const pad = M.pad, gB = ctx.createGain(), gA = ctx.createGain();
    gB.gain.value = st.after ? 0 : 1; gA.gain.value = st.after ? 1 : 0;
    gB.connect(mix); gA.connect(mix);
    const b = looped(cur.before, gB), a = looped(cur.after, gA), when = ctx.currentTime + .03;
    b.start(when, pad + offset); a.start(when, pad + offset); t0 = when - offset;
    srcs = { b, a, gB, gA };
  };
  // a roll while playing: the new preset starts at the very spot the loop is at and crossfades in over 12 ms; the dry
  // keeps running (still in sync), so pushing REVFX back off afterwards is as fair as before
  const swapIn = () => {
    if (!ctx || !cur || !M || !srcs) return;
    const s = srcs, when = ctx.currentTime + .03, offset = (((when - t0) % cur.dur) + cur.dur) % cur.dur;
    const gA = ctx.createGain(); gA.gain.value = 0; gA.connect(mix);
    const a = looped(cur.after, gA);
    a.start(when, M.pad + offset);
    gA.gain.setTargetAtTime(1, when, .012);
    s.gA.gain.cancelScheduledValues(when); s.gA.gain.setTargetAtTime(0, when, .012);
    s.gB.gain.cancelScheduledValues(when); s.gB.gain.setTargetAtTime(0, when, .012);
    try { s.a.stop(when + .1); } catch { /* already stopped */ }
    srcs = { ...s, a, gA };
  };

  // ---- actions
  const play = async (keepAt = 0) => {
    const c = ensure(); void c.resume();
    st.loading = true; paintUi();
    const t = await load(st.track, st.preset); st.loading = false;
    if (!t) return;
    start(keepAt % t.dur);
    st.playing = true; paintUi(); loop(); prefetch();
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
    st.track = id; st.preset = Math.floor(Math.random() * count(id)); st.next = other(id, st.preset);
    root.classList.remove('is-plugging'); void root.offsetWidth; root.classList.add('is-plugging');   // the plug seats (CSS)
    paintUi(); draw(); arrange();
    if (st.playing) void play(keep); else prefetch();
  };
  const flip = (after: boolean) => {
    if (after === st.after) return;
    st.after = after;
    if (after) didOn = true; else if (didOn) didOff = true;
    paintUi(); draw();
    if (srcs && ctx) { const now = ctx.currentTime; srcs.gA.gain.setTargetAtTime(after ? 1 : 0, now, .012); srcs.gB.gain.setTargetAtTime(after ? 0 : 1, now, .012); }
    if (after && st.playing && !st.loading) strike();
  };

  // ---- the roll
  // the face each roll lands on: rotations that show face 1..6 to the viewer; any face but the last one
  const FACE: [number, number][] = [[0, 0], [0, -90], [-90, 0], [90, 0], [0, 90], [0, 180]];
  let spins = 0, face = 0;
  const tumble = () => {
    if (!cube) return;
    spins++;
    face = (face + 1 + Math.floor(Math.random() * 5)) % 6;
    const [fx, fy] = FACE[face];
    // it lands at rest's 3/4 view (-22 / 32 deg, revfx.css .rfx-die), never flat on to the glass
    cube.style.setProperty('--rx', `${fx - 22 + spins * 720}deg`);
    cube.style.setProperty('--ry', `${fy + 32 + spins * 360}deg`);
    dieBtn?.classList.remove('is-thrown'); void dieBtn?.offsetWidth; dieBtn?.classList.add('is-thrown');
  };
  const roll = async () => {
    if (st.loading) return;
    tumble();
    st.preset = st.next; st.next = other(st.track, st.preset);
    didRoll = true;
    if (!st.after) { st.after = true; didOn = true; }
    arrange();
    const p = preset();
    if (say) say.textContent = `Preset ${p.name}. ${p.on.length ? 'Pedals: ' + p.on.join(', ') : 'No pedals'}.`;
    if (!st.playing) { await play(); return; }
    const was = st.preset, ready = M && bufs.has(fileOf(st.track, st.preset, M));
    if (!ready) { st.loading = true; paintUi(); }
    const t = await load(st.track, st.preset);
    st.loading = false;
    if (!t || was !== st.preset || !st.playing) { paintUi(); return; }
    swapIn(); paintUi(); draw(); strike(); prefetch();
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
  dieBtn?.addEventListener('click', () => { void roll(); });

  // ---- the board takes the preset's chain order (a FLIP slide, so the pedals visibly change places)
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  function arrange(): void {
    if (!pedList) return;
    const order = preset().order;
    const at = (id: string) => { const i = order.indexOf(id); return i < 0 ? 99 : i; };
    const sorted = peds.slice().sort((a, b) => at(a.dataset.fx!) - at(b.dataset.fx!));
    if (sorted.every((p, i) => pedList.children[i] === p)) return;
    const before = new Map(peds.map((p) => [p, p.getBoundingClientRect().left]));
    sorted.forEach((p, i) => { pedList.appendChild(p); p.style.setProperty('--i', String(i)); });
    if (still.matches) return;
    for (const p of peds) {
      const dx = before.get(p)! - p.getBoundingClientRect().left;
      if (dx) p.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,.72,.18,1)' });
    }
  }

  // ---- paint
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const SHORT: Record<string, string> = { pitch: 'PITCH', echo: 'ECHO', halo: 'HALO', reverb: 'VERB', glue: 'GLUE' };
  function paintUi(): void {
    jacks.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.hearTrack === st.track)));
    const p = preset(), on = new Set(p.on);
    peds.forEach((el) => el.classList.toggle('is-out', !on.has(el.dataset.fx!)));
    stompBtn?.setAttribute('aria-pressed', String(st.after));
    stompBtn?.setAttribute('aria-label', st.after ? 'REVFX. Lit: you hear RevFX. Push for the dry sound.' : 'REVFX. Dark: you hear the dry sound. Push to engage RevFX.');
    stompBox?.setAttribute('data-on', st.after ? 'after' : 'before');
    stompBox?.toggleAttribute('data-loading', st.loading);
    root.dataset.ab = st.after ? 'after' : 'before';
    playBtn!.setAttribute('aria-pressed', String(st.playing));
    root.toggleAttribute('data-playing', st.playing);
    const n = next();
    root.dataset.next = n;
    const chain = st.after ? p.order.filter((id) => on.has(id)).map((id) => SHORT[id]).join('-') || 'DRY' : 'TRUE BYPASS';
    // words settle in like liquid crystal (a short fade-in); the running numbers just change
    for (const [el, s] of [[title, p.name], [tag, st.after ? 'REVFX ON' : 'BYPASS'], [stateEl, COACH[n]], [chainEl, chain]] as const)
      if (el && lcdText(el, s) && !still.matches) el.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 170, easing: 'ease-out' });
    if (timeEl && !st.playing && M) lcdText(timeEl, `00:00 / ${fmt(M.tracks[st.track].dur)}`);
  }

  // the waveform = a segment bar graph (/drift's): columns of 2 px segments on a 3 px pitch, L up from the middle and
  // R down, every unlit segment faintly there; played = full ink, the rest dim, the playhead pale. REVFX = the inks of
  // the preset's pedals across the screen in chain order; BYPASS = the screen's own grey. Inks + pitch from the CSS.
  let seg = { col: 6, bar: 4, ink: '#cfc4e0', dim: .34, ghost: 'rgba(230,215,255,.07)', head: '#ffffff' };
  const readSeg = () => {
    const c = getComputedStyle(cv!), v = (k: string) => c.getPropertyValue(k).trim();
    seg = { col: +v('--seg-col') || seg.col, bar: +v('--seg-bar') || seg.bar, ink: v('--seg-bp') || seg.ink,
      dim: +v('--seg-dim-a') || seg.dim, ghost: v('--seg-ghost') || seg.ghost, head: v('--seg-head') || seg.head };
  };
  function draw(): void {
    if (!M) return;
    const info = M.tracks[st.track], wet = info.presets[st.preset] ?? info.presets[0], P = st.after ? wet : info.before;
    const dpr = Math.min(2, devicePixelRatio || 1), w = cv!.clientWidth, h = cv!.clientHeight;
    if (!w || !h) return;
    if (cv!.width !== Math.round(w * dpr) || cv!.height !== Math.round(h * dpr)) { cv!.width = Math.round(w * dpr); cv!.height = Math.round(h * dpr); readSeg(); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    // one scale for the dry and the preset, so BYPASS vs REVFX is a fair picture
    let mx = 1e-3; for (const v of [info.before, wet]) for (const x of [...v.L, ...v.R]) mx = Math.max(mx, x);
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
    const p = preset(), inks = p.order.filter((id) => p.on.includes(id)).map((id) => inkOf.get(id)).filter(Boolean) as string[];
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
  arrange();
  paintUi();
}
