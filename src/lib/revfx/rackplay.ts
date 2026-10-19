/**
 * #rack: the RevFX window, played. Laptop/tablet (>= 601 px) drives /drift's live rack (src/lib/drift/rack.ts,
 * through its RackApi); phones (the rack is display:none there) keep the same state here and roll the same dice
 * engine (src/lib/drift/fxv/drift-randomizer.js). Either way the die, the scene CRT and the chain row read and
 * write one model:
 *   - drag a strip on the rail (pointer) or press ‹ › on a chain chip (keyboard, phones) = a new chain order;
 *   - the die or the rack's own RANDOMIZE = a roll: the CRT scrambles to the scene's name, prints the engine's
 *     blurb, EXTREME in amber; GLUE COMP keeps its column and is never switched off (the plugin's law);
 *   - SNAPSHOT A-D (rack only): click = recall, hold 600 ms = store (the plugin's own rule).
 */
import { initRack, type RackApi, type RackId, type RackState } from '../drift/rack';
import geo from '../../assets/seasons/drift/rack/rack.json';

type Id = RackId;
interface Roll { i: number; mode: string; name: string; blurb: string; act: string[]; order: string[]; norm: Record<string, number> }
interface Rnd { roll(o: { seed: number; context: unknown }): { mode: string; name: string; blurb?: string; active: string[]; order: string[]; norm: Record<string, number> } }

const HOME: Id[] = ['pitch', 'echo', 'reverb', 'halo', 'glue'];
const NAME: Record<string, Id> = { PITCH: 'pitch', ECHO: 'echo', REVERB: 'reverb', HALO: 'halo' };
const LABEL: Record<Id, string> = { pitch: 'Pitch', echo: 'Echo', reverb: 'Reverb', halo: 'Halo', glue: 'Glue Comp' };
const HOLD_MS = 600;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initRackPlay(): void {
  const sec = document.getElementById('rack');
  if (!sec) return;
  const rk = sec.querySelector<HTMLElement>('[data-rack]');
  const api: RackApi | undefined = rk && matchMedia('(min-width: 601px)').matches ? initRack(rk) : undefined;

  /* ---- the model (the rack's own state when there is one) ---- */
  const local: { order: Id[]; on: Record<Id, boolean> } = { order: HOME.slice(), on: { pitch: true, echo: true, reverb: true, halo: true, glue: true } };
  const getState = () => (api ? api.state() : local);
  const setOrder = (o: Id[]) => { if (api) api.setOrder(o); else { local.order = o; paintChain(); } };

  /* ---- the chain row: FLIP-animated chips in signal order ---- */
  const chain = sec.querySelector<HTMLOListElement>('[data-rfx-chain]');
  const say = sec.querySelector<HTMLElement>('[data-rfx-say]');
  const chips = new Map<Id, HTMLElement>();
  chain?.querySelectorAll<HTMLElement>('[data-fx]').forEach((li) => chips.set(li.dataset.fx as Id, li));
  const outLi = chain?.lastElementChild ?? null;
  const paintChain = () => {
    if (!chain) return;
    const s = getState();
    const before = new Map<Id, number>();
    chips.forEach((li, id) => before.set(id, li.getBoundingClientRect().left));
    s.order.forEach((id) => chain.insertBefore(chips.get(id)!, outLi));
    chips.forEach((li, id) => {
      li.classList.toggle('is-off', !s.on[id]);
      const dx = before.get(id)! - li.getBoundingClientRect().left;
      if (dx && !reduce()) li.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,.72,.18,1)' });
    });
  };
  chain?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mv]');
    const li = b?.closest<HTMLElement>('[data-fx]');
    if (!b || !li) return;
    const id = li.dataset.fx as Id;
    const o = getState().order.slice();
    const i = o.indexOf(id), j = i + Number(b.dataset.mv);
    if (j < 0 || j >= o.length) return;
    o.splice(i, 1); o.splice(j, 0, id);
    setOrder(o);
    if (say) say.textContent = `${LABEL[id]} moved. Chain: ${o.map((x) => LABEL[x]).join(', ')}.`;
    requestAnimationFrame(() => li.querySelector<HTMLButtonElement>(`[data-mv="${b.dataset.mv}"]`)?.focus());
  });
  rk?.addEventListener('rack:change', paintChain);
  paintChain();

  /* ---- the CRT ---- */
  const crt = sec.querySelector<HTMLElement>('[data-rfx-crt]');
  const nameEl = sec.querySelector<HTMLElement>('[data-rfx-name]');
  const blurbEl = sec.querySelector<HTMLElement>('[data-rfx-blurb]');
  const rollEl = sec.querySelector<HTMLElement>('[data-rfx-roll]');
  const xEl = sec.querySelector<HTMLElement>('[data-rfx-x]');
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?';
  let scrT = 0;
  const scramble = (el: HTMLElement, to: string) => {
    if (scrT) cancelAnimationFrame(scrT);
    if (reduce()) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 520;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const fixed = Math.floor(k * to.length);
      let s = to.slice(0, fixed);
      for (let i = fixed; i < to.length; i++) s += to[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = s;
      scrT = k < 1 ? requestAnimationFrame(step) : 0;
    };
    scrT = requestAnimationFrame(step);
  };
  const showRoll = (r: Roll) => {
    const x = r.mode === 'EXTREME';
    if (rollEl) rollEl.textContent = `ROLL ${r.i}`;
    if (xEl) xEl.hidden = !x;
    crt?.classList.toggle('is-x', x);
    crt?.classList.remove('is-hit'); void crt?.offsetWidth; crt?.classList.add('is-hit');
    if (nameEl) scramble(nameEl, r.name);
    if (blurbEl) blurbEl.textContent = r.blurb ? r.blurb[0].toUpperCase() + r.blurb.slice(1) + '.' : '';
    tumble(r.i);
    if (!api && say) say.textContent = `Roll ${r.i}: ${r.name}${x ? ', extreme' : ''}. ${r.blurb}.`;
  };
  rk?.addEventListener('rack:roll', (e) => showRoll((e as CustomEvent<Roll>).detail));

  /* ---- the die ---- */
  const die = sec.querySelector<HTMLButtonElement>('[data-rfx-die]');
  const cube = sec.querySelector<HTMLElement>('[data-rfx-cube]');
  // the face each roll lands on: rotations that show face 1..6 to the viewer
  const FACE: [number, number][] = [[0, 0], [0, -90], [-90, 0], [90, 0], [0, 90], [0, 180]];
  let spins = 0;
  const tumble = (i: number) => {
    if (!cube) return;
    spins++;
    const [fx, fy] = FACE[(i * 7 + 3) % 6];
    cube.style.setProperty('--rx', `${fx + spins * 720}deg`);
    cube.style.setProperty('--ry', `${fy + spins * 360}deg`);
    die?.classList.remove('is-thrown'); void die?.offsetWidth; die?.classList.add('is-thrown');
  };

  // phones: the same engine, the same seed recipe and memory as rack.ts
  let engine: Promise<Rnd> | null = null;
  // the engine is UMD: the dev server runs it as a browser script (window.DriftRandomizer), the production bundle as
  // CommonJS (module.exports = the module's default). Take whichever exists: reading only window broke every roll live.
  const getEngine = () => (engine ??= import('../drift/fxv/drift-randomizer.js').then((m: { default?: Rnd }) =>
    (m.default && typeof m.default.roll === 'function' ? m.default : (window as unknown as { DriftRandomizer: Rnd }).DriftRandomizer)));
  const memory = { sinceExtreme: null as number | null, lastPersonality: null as string | null, count: 0, n: 0 };
  const rollLocal = async () => {
    const R = await getEngine();
    const seed = ((++memory.count * 0x9e3779b1) ^ Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
    const ord: Record<string, number> = {};
    local.order.filter((id) => id !== 'glue').forEach((id, i) => { ord[id.toUpperCase()] = i; });
    const out = R.roll({ seed, context: { atOn: false, ord, sinceExtreme: memory.sinceExtreme, lastPersonality: memory.lastPersonality } });
    memory.sinceExtreme = out.mode === 'EXTREME' ? 0 : (memory.sinceExtreme ?? 0) + 1;
    memory.lastPersonality = out.name;
    for (const id of HOME) if (id !== 'glue') local.on[id] = out.active.some((k) => NAME[k] === id);
    const four: Id[] = out.order.map((k) => NAME[k]);
    four.splice(Math.max(0, local.order.indexOf('glue')), 0, 'glue');
    local.order = four;
    paintChain();
    showRoll({ i: ++memory.n, mode: out.mode, name: out.name, blurb: out.blurb ?? '', act: out.active, order: out.order, norm: out.norm });
  };
  die?.addEventListener('pointerenter', () => { if (!api) void getEngine(); }, { once: true });
  die?.addEventListener('click', () => { if (api) api.roll(); else void rollLocal(); });

  if (!api || !rk) return;

  /* ---- drag a strip along the rail (pointer) ---- */
  const stage = rk.querySelector<HTMLElement>('[data-rk-stage]')!;
  const colX = HOME.map((id) => geo.strips[id].crop.x);
  rk.querySelectorAll<HTMLElement>('[data-rk-strip]').forEach((strip) => {
    const id = strip.dataset.rkStrip as Id;
    const movers = () => [strip, rk.querySelector<HTMLElement>(`[data-rk-grab="${id}"]`), rk.querySelector<HTMLElement>(`[data-rk-cap="${id}"]`)].filter(Boolean) as HTMLElement[];
    strip.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      strip.setPointerCapture(e.pointerId);
      const u = stage.getBoundingClientRect().width / geo.stage.w;
      const start = getState().order.slice();
      const c0 = start.indexOf(id);
      const x0 = e.clientX;
      let moved = false, target = c0;
      rk.classList.add('is-dragging');
      const move = (ev: PointerEvent) => {
        const d = (ev.clientX - x0) / u;
        if (!moved && Math.abs(d) < 4) return;
        moved = true;
        const pos = Math.max(colX[0], Math.min(colX[4], colX[c0] + d));
        const base = colX[c0] - geo.strips[id].crop.x;
        const px = (base + pos - colX[c0]) * u;
        movers().forEach((el) => { el.classList.add('is-drag'); el.style.transform = `translateX(${px}px) translateY(${-6 * u}px)`; });
        let best = 0;
        colX.forEach((x, k) => { if (Math.abs(x - pos) < Math.abs(colX[best] - pos)) best = k; });
        if (best !== target) {
          target = best;
          const o = start.filter((x) => x !== id); o.splice(target, 0, id);
          api.setOrder(o);
        }
      };
      const up = () => {
        strip.removeEventListener('pointermove', move);
        rk.classList.remove('is-dragging');
        movers().forEach((el) => { el.classList.remove('is-drag'); el.style.transform = ''; });
        if (moved && say) say.textContent = `${LABEL[id]} moved. Chain: ${getState().order.map((x) => LABEL[x]).join(', ')}.`;
      };
      strip.addEventListener('pointermove', move);
      strip.addEventListener('pointerup', up, { once: true });
      strip.addEventListener('pointercancel', up, { once: true });
    });
  });

  /* ---- SNAPSHOT A-D: click = recall, hold = store ---- */
  const snaps: (RackState | null)[] = [null, null, null, null];
  rk.querySelectorAll<HTMLButtonElement>('[data-rfx-slot]').forEach((b) => {
    const i = Number(b.dataset.rfxSlot);
    const m = b.querySelector<HTMLElement>('[data-m]')!;
    let t = 0, stored = false;
    const flash = (cls: string) => { b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls); };
    const start = () => {
      if (t) return;
      stored = false;
      b.classList.add('is-holding');
      t = window.setTimeout(() => {
        t = 0; stored = true;
        snaps[i] = api.state();
        b.classList.remove('is-holding'); b.classList.add('is-full');
        m.textContent = 'SAVED';
        flash('is-flash');
        rk.querySelectorAll('.rfx-rk-slot').forEach((x) => x.classList.remove('is-cur'));
        b.classList.add('is-cur');
        if (say) say.textContent = `Snapshot ${'ABCD'[i]} saved.`;
      }, HOLD_MS);
    };
    const end = () => {
      b.classList.remove('is-holding');
      if (!t) return;
      clearTimeout(t); t = 0;
      if (stored) return;
      const s = snaps[i];
      if (!s) { m.textContent = 'HOLD'; flash('is-nope'); setTimeout(() => { if (!snaps[i]) m.textContent = 'EMPTY'; }, 1100); return; }
      api.restore(s);
      rk.querySelectorAll('.rfx-rk-slot').forEach((x) => x.classList.remove('is-cur'));
      b.classList.add('is-cur');
      flash('is-flash');
      if (say) say.textContent = `Snapshot ${'ABCD'[i]} recalled.`;
    };
    // captured: a page that shifts under a still finger never cancels the hold; only a real cancel does
    b.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; b.setPointerCapture(e.pointerId); start(); });
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', () => { if (t) { clearTimeout(t); t = 0; b.classList.remove('is-holding'); } });
    b.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); start(); } });
    b.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') end(); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}
