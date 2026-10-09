/**
 * THE LIVE RACK (#fx, 601 px up; Dan 2026-10-09: "design it after the latest DRIFT, more invested"). The DRIFT 5.2.4 FX
 * view rebuilt from its own pixels (tools/shoot-drift-fx-rack.mjs) and run by the plugin's own code:
 *   - the five strip screens are the plugin's FXV screen modules (./fxv/screen-*.js, verbatim), hosted the way the
 *     plugin's FXV runtime hosts them: one rAF loop, one P per strip, DPR canvases (backing store x the rack scale);
 *   - RANDOMIZE runs the plugin's seeded dice engine (./fxv/drift-randomizer.js, verbatim): a roll picks a scene, which
 *     strips play and sometimes the chain order. The four re-roll round GLUE COMP, which keeps its column (the plugin's
 *     law). A strip that sits a roll out goes dark like a bypassed strip; a new order slides the strips on the rail.
 *   - the DICE LOG keeps the last 8 rolls (number, EXTREME in red, a dot per strip that plays); a tile re-applies its
 *     roll, as in the plugin.
 * What the page cannot show: the knob faces, combos and HALO keys are photos, so the named modes they print stay put:
 * a roll's echo SYNC/FREE + ping-pong, reverb TYPE + SYNC and HALO MODE are held at the photo's (SYNC, PLATE, FREE,
 * MODE 2) on the screens; every amount (times, feedback, decay, size, mix, pitch) is the roll's.
 * Boot: dark until the rack lands (the crane's drift:covered on #drive) or, without the crane, half of it is in view;
 * then the strips roll in on the rail and their screens power on one by one. Reduced motion: no slide, no flicker,
 * the screens draw a still frame. Screens run only while the rack is on screen and the tab is visible.
 */
import geo from '../../assets/seasons/drift/rack/rack.json';

type Id = 'pitch' | 'echo' | 'reverb' | 'halo' | 'glue';
type Norm = Record<string, number>;
interface Roll { i: number; seed: number; mode: string; name: string; act: string[]; order: string[]; norm: Norm }
interface Screen { init?(cv: HTMLCanvasElement, P: P): void; draw?(t: number, P: P): void }
interface P { get(pid: string): number; on: boolean; dpr: number; w: number; h: number; phosphor: string; accent: string; ink: string; hot: string; tempoBpm: number }
interface Rnd { roll(o: { seed: number; context: unknown }): { mode: string; name: string; active: string[]; order: string[]; norm: Norm } }

const SID: Record<Id, string> = { pitch: 'pitch', echo: 'dly', reverb: 'verb', halo: 'halo', glue: 'glue' };
const NAME: Record<string, Id> = { PITCH: 'pitch', ECHO: 'echo', REVERB: 'reverb', HALO: 'halo' };
const FOUR: Id[] = ['pitch', 'echo', 'reverb', 'halo'];
const HOME: Id[] = ['pitch', 'echo', 'reverb', 'halo', 'glue'];   // the plugin's default chain = its markup order
const DOT = [['PITCH', '#a8c8ff'], ['ECHO', '#ff4fd8'], ['REVERB', '#c48bff'], ['HALO', '#4dff8a']];   // the plugin's dice-log dots
/** the photo's named modes (see the header): what the strips print, so the screens say the same */
const HELD: Norm = { DLY_MODE: 0, DLY_PINGPONG: 0, VERB_TYPE: 0.5, VERB_SYNC: 1, HALO_MODE: 1 / 3, GLUE_RATIO: 0 };
/** the rack as it lands: every strip playing, a vocal-polish scene (the plugin ships every FX on at MIX 0 = silent
 *  screens; the page opens with something to look at). Normalised like the APVTS. */
const START: Norm = {
  PITCH_ST: 19 / 24, FORMANT_ST: 0.5, PITCH_MIX: 0.35,
  DLY_DIV: 6 / 17, DLY_TIME_MS: 0.53413, DLY_FEEDBACK: 0.38, DLY_MIX: 0.3, DLY_CHAR: 1,
  VERB_DECAY: 0.45, VERB_BRIGHT: 0.55, VERB_PREDELAY: 0.12, SHIMMER: 0.25, VERB_MIX: 0.3, VERB_PRE_DIV: 12 / 17, VERB_DEC_DIV: 3 / 7,
  HALO_SIZE: 0.6, HALO_TONE: 0.5, HALO_MIX: 0.45,
};
const SLIDE = 230;    // stage px: the boot roll-in, from the right along the rail
const STEP = 110;     // ms between strips at boot
const ROLL_MS = 520, EXTREME_MS = 1600;

const crop = (id: Id) => geo.strips[id].crop;

export function initRack(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>('[data-rk-stage]');
  if (!stage) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const strips = new Map<Id, { el: HTMLElement; grab: HTMLElement; cap: HTMLElement | null; cv: HTMLCanvasElement; P: P; impl: Screen | null; inited: boolean }>();
  const st = { order: HOME.slice(), on: { pitch: true, echo: true, reverb: true, halo: true, glue: true } as Record<Id, boolean>,
    norm: { ...START, ...HELD } as Norm, rolls: [] as Roll[], n: 0, cur: null as Roll | null };

  for (const id of HOME) {
    const el = stage.querySelector<HTMLElement>(`[data-rk-strip="${id}"]`);
    const grab = stage.querySelector<HTMLElement>(`[data-rk-grab="${id}"]`);
    const cv = el?.querySelector<HTMLCanvasElement>('canvas');
    if (!el || !grab || !cv) return;
    const g = geo.strips[id];
    const P: P = { get: (pid) => st.norm[pid] ?? 0, on: true, dpr: 1, w: g.screen.w, h: g.screen.h,
      phosphor: g.phos, accent: g.accent, ink: g.ink, hot: g.hot, tempoBpm: 120 };
    strips.set(id, { el, grab, cap: root.querySelector<HTMLElement>(`[data-rk-cap="${id}"]`), cv, P, impl: null, inited: false });
  }

  /* ---- screens: the plugin's FXV runtime, reduced to what the page needs ---- */
  let modules = false, raf = 0, visible = false;
  const scale = () => stage.getBoundingClientRect().width / geo.stage.w;
  const size = () => {
    const dpr = Math.max(1, (window.devicePixelRatio || 1) * scale());
    for (const s of strips.values()) {
      s.P.dpr = dpr;
      const W = Math.round(s.P.w * dpr), H = Math.round(s.P.h * dpr);
      if (s.cv.width !== W || s.cv.height !== H) { s.cv.width = W; s.cv.height = H; s.inited = false; }
    }
  };
  const tick = (t: number) => {
    const screens = (window as unknown as { FXV?: { screens: Record<string, Screen> } }).FXV?.screens ?? {};
    for (const [id, s] of strips) {
      const impl = screens[SID[id]];
      if (!impl) continue;
      s.P.on = st.on[id];
      try {
        const ctx = s.cv.getContext('2d')!;
        if (!s.inited) { s.impl = impl; impl.init?.(s.cv, s.P); s.inited = true; }
        ctx.setTransform(s.P.dpr, 0, 0, s.P.dpr, 0, 0);
        impl.draw?.(t, s.P);
      } catch { /* one bad frame never stops the rack */ }
    }
  };
  const frame = (ts: number) => { raf = 0; if (document.hidden || !visible) return; tick(ts / 1000); if (!reduce) raf = requestAnimationFrame(frame); };
  const run = () => { if (modules && !raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  const loadScreens = async () => {
    if (modules) return;
    await Promise.all([import('./fxv/screen-pitch.js'), import('./fxv/screen-dly.js'), import('./fxv/screen-verb.js'),
      import('./fxv/screen-halo.js'), import('./fxv/screen-glue.js')]);
    modules = true; size(); run();
  };
  // reduced motion: a still frame, redrawn when something changes
  const redraw = () => { if (reduce && modules && visible) { tick(performance.now() / 1000); setTimeout(() => tick(performance.now() / 1000), 400); } };

  /* ---- the chain on the rail ---- */
  const place = () => {
    st.order.forEach((id, col) => {
      const s = strips.get(id)!;
      const dx = +(crop(HOME[col]).x - crop(id).x).toFixed(1);
      for (const el of [s.el, s.grab, s.cap]) el?.style.setProperty('--dx', String(dx));
      s.el.classList.toggle('is-off', !st.on[id]);
      s.cap?.classList.toggle('is-off', !st.on[id]);
    });
    redraw();
  };

  /* ---- the LCD: dice log + RANDOMIZE ---- */
  const tiles = root.querySelector<HTMLElement>('[data-rk-tiles]');
  const cnt = root.querySelector<HTMLElement>('[data-rk-cnt]');
  const btn = root.querySelector<HTMLButtonElement>('[data-rk-rnd]');
  const say = root.querySelector<HTMLElement>('[data-rk-say]');
  const paint = (fresh?: Roll) => {
    if (!tiles || !cnt) return;
    const list = st.rolls.slice(-8);
    let html = '';
    for (let i = list.length; i < 8; i++) html += '<i class="d-rk-tile is-empty"></i>';
    for (const r of list) {
      html += `<button type="button" class="d-rk-tile${r.mode === 'EXTREME' ? ' is-x' : ''}${st.cur === r ? ' is-cur' : ''}${r === fresh ? ' is-new' : ''}"`
        + ` data-i="${r.i}" aria-label="Roll ${r.i}, ${r.name}: play it again"><span class="n">${r.i}</span><span class="dots">`
        + DOT.map(([k, c]) => `<u${r.act.includes(k) ? ' class="on"' : ''} style="--c:${c}"></u>`).join('')
        + '</span></button>';
    }
    tiles.innerHTML = html;
    cnt.textContent = st.cur ? `ROLL ${st.cur.i} · ${st.cur.name}` : 'HIT RANDOMIZE';
  };
  const apply = (r: Roll) => {
    st.cur = r;
    st.norm = { ...st.norm, ...r.norm, ...HELD };
    for (const id of FOUR) st.on[id] = r.act.some((k) => NAME[k] === id);
    st.order = [...r.order.map((k) => NAME[k]), 'glue'];
    place(); paint();
    if (say) {
      const playing = r.act.map((k) => k[0] + k.slice(1).toLowerCase());
      say.textContent = `Roll ${r.i}: ${r.name}${r.mode === 'EXTREME' ? ', extreme' : ''}. ${playing.length ? playing.join(' and ') + (playing.length > 1 ? ' play' : ' plays') : 'Nothing plays'}. `
        + `Chain: ${st.order.map((id) => (id === 'glue' ? 'Glue Comp' : id[0].toUpperCase() + id.slice(1))).join(', ')}.`;
    }
  };
  let engine: Promise<Rnd> | null = null;
  const getEngine = () => (engine ??= import('./fxv/drift-randomizer.js').then(() => (window as unknown as { DriftRandomizer: Rnd }).DriftRandomizer));
  const memory = { sinceExtreme: null as number | null, lastPersonality: null as string | null, count: 0 };
  btn?.addEventListener('pointerenter', () => { void getEngine(); }, { once: true });
  btn?.addEventListener('click', async () => {
    const R = await getEngine();
    // the plugin's seed: golden-ratio counter mixed with the clock (two presses never share one)
    const seed = ((++memory.count * 0x9e3779b1) ^ Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
    const ord: Record<string, number> = {};
    st.order.slice(0, 4).forEach((id, i) => { ord[id.toUpperCase()] = i; });
    const out = R.roll({ seed, context: { atOn: false, ord, sinceExtreme: memory.sinceExtreme, lastPersonality: memory.lastPersonality } });
    memory.sinceExtreme = out.mode === 'EXTREME' ? 0 : (memory.sinceExtreme ?? 0) + 1;
    memory.lastPersonality = out.name;
    const r: Roll = { i: ++st.n, seed, mode: out.mode, name: out.name, act: out.active, order: out.order, norm: out.norm };
    st.rolls.push(r);
    if (st.rolls.length > 8) st.rolls.shift();
    apply(r); paint(r);
    if (btn) {
      btn.classList.add('was-used');
      const x = out.mode === 'EXTREME';
      btn.classList.remove('is-rolling', 'is-extreme'); void btn.offsetWidth;
      btn.classList.add(x ? 'is-extreme' : 'is-rolling');
      setTimeout(() => btn.classList.remove('is-rolling', 'is-extreme'), x ? EXTREME_MS : ROLL_MS);
    }
  });
  tiles?.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.d-rk-tile[data-i]');
    const r = el && st.rolls.find((x) => String(x.i) === el.dataset.i);
    if (r) apply(r);
  });

  /* ---- boot: dark until the rack lands, then the strips roll in and power on ---- */
  root.style.setProperty('--rk-slide', String(SLIDE));
  HOME.forEach((id, i) => {
    const s = strips.get(id)!;
    for (const el of [s.el, s.grab]) el.style.setProperty('--rk-d', `${i * STEP}ms`);
  });
  place(); paint();
  const boot = () => {
    if (root.dataset.boot === 'on') return;
    root.dataset.boot = 'on';
    drive?.removeEventListener('drift:covered', onCovered);
    bootIo?.disconnect();
  };
  const drive = document.getElementById('drive');
  const onCovered = (e: Event) => { if ((e as CustomEvent<boolean>).detail) boot(); };
  let bootIo: IntersectionObserver | null = null;
  if (!reduce && 'IntersectionObserver' in window) {
    root.dataset.boot = 'off';
    drive?.addEventListener('drift:covered', onCovered);
    // half of it in view and not held up on the crane's hook (crane.ts keeps #fx inert until it lands): this also
    // catches a landing that happened before this listener (a /drift/#fx jump lands at once) and every layout
    // without the crane (601-1000 px)
    bootIo = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting) && !root.closest('[inert]')) boot(); }, { threshold: 0.5 });
    bootIo.observe(stage);
  } else root.dataset.boot = 'on';

  /* ---- run only on screen ---- */
  const near = new IntersectionObserver((es) => {
    for (const x of es) {
      if (x.isIntersecting) void loadScreens();
      visible = x.isIntersecting;
    }
    if (visible) { run(); redraw(); }
  }, { rootMargin: '200px 0px' });
  near.observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
  new ResizeObserver(() => { if (modules) { size(); redraw(); } }).observe(stage);
}
