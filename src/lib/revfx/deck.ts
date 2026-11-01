/**
 * The dice deck in the /revfx hero (Gil 2026-10-19; it was the #rack section's, which went): the die, the scene CRT
 * and the signal chain IN -> ... -> OUT, run on the plugin's own dice engine (src/lib/drift/fxv/drift-randomizer.js):
 *   - the die = a roll: the CRT scrambles to the scene's name, prints the engine's blurb, EXTREME in amber; the
 *     chain takes the roll's order (GLUE COMP keeps its column and is never switched off: the plugin's law);
 *   - ‹ › on a chip move that effect one place in the chain;
 *   - the board above follows: a pedal the roll sits out goes dark ([data-fx].is-off on the hero's pedals).
 */
type Id = 'pitch' | 'echo' | 'reverb' | 'halo' | 'glue';
interface Roll { i: number; mode: string; name: string; blurb: string }
interface Rnd { roll(o: { seed: number; context: unknown }): { mode: string; name: string; blurb?: string; active: string[]; order: string[]; norm: Record<string, number> } }

const NAME: Record<string, Id> = { PITCH: 'pitch', ECHO: 'echo', REVERB: 'reverb', HALO: 'halo' };
const LABEL: Record<Id, string> = { pitch: 'Pitch', echo: 'Echo', reverb: 'Reverb', halo: 'Halo', glue: 'Glue Comp' };
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initDeck(): void {
  const deck = document.querySelector<HTMLElement>('[data-rfx-deck]');
  if (!deck) return;
  const chain = deck.querySelector<HTMLOListElement>('[data-rfx-chain]');
  const say = deck.querySelector<HTMLElement>('[data-rfx-say]');
  const chips = new Map<Id, HTMLElement>();
  chain?.querySelectorAll<HTMLElement>('[data-fx]').forEach((li) => chips.set(li.dataset.fx as Id, li));
  const outLi = chain?.lastElementChild ?? null;
  // the chain as the markup starts it (HALO first, Gil 10-19)
  const st = { order: Array.from(chips.keys()), on: { pitch: true, echo: true, reverb: true, halo: true, glue: true } as Record<Id, boolean> };
  const boardPeds = Array.from(document.querySelectorAll<HTMLElement>('[data-rfx-board] [data-fx]'));

  /* ---- paint: the chips in signal order (FLIP slide), the board's pedals lit or dark ---- */
  const paint = () => {
    if (chain) {
      const before = new Map<Id, number>();
      chips.forEach((li, id) => before.set(id, li.getBoundingClientRect().left));
      st.order.forEach((id) => chain.insertBefore(chips.get(id)!, outLi));
      chips.forEach((li, id) => {
        li.classList.toggle('is-off', !st.on[id]);
        const dx = before.get(id)! - li.getBoundingClientRect().left;
        if (dx && !reduce()) li.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,.72,.18,1)' });
      });
    }
    boardPeds.forEach((li) => li.classList.toggle('is-off', !st.on[li.dataset.fx as Id]));
  };
  chain?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mv]');
    const li = b?.closest<HTMLElement>('[data-fx]');
    if (!b || !li) return;
    const id = li.dataset.fx as Id;
    const o = st.order.slice();
    const i = o.indexOf(id), j = i + Number(b.dataset.mv);
    if (j < 0 || j >= o.length) return;
    o.splice(i, 1); o.splice(j, 0, id);
    st.order = o;
    paint();
    if (say) say.textContent = `${LABEL[id]} moved. Chain: ${o.map((x) => LABEL[x]).join(', ')}.`;
    requestAnimationFrame(() => li.querySelector<HTMLButtonElement>(`[data-mv="${b.dataset.mv}"]`)?.focus());
  });

  /* ---- the CRT ---- */
  const crt = deck.querySelector<HTMLElement>('[data-rfx-crt]');
  const nameEl = deck.querySelector<HTMLElement>('[data-rfx-name]');
  const blurbEl = deck.querySelector<HTMLElement>('[data-rfx-blurb]');
  const rollEl = deck.querySelector<HTMLElement>('[data-rfx-roll]');
  const xEl = deck.querySelector<HTMLElement>('[data-rfx-x]');
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

  /* ---- the die ---- */
  const die = deck.querySelector<HTMLButtonElement>('[data-rfx-die]');
  const cube = deck.querySelector<HTMLElement>('[data-rfx-cube]');
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
  const show = (r: Roll) => {
    const x = r.mode === 'EXTREME';
    if (rollEl) rollEl.textContent = `ROLL ${r.i}`;
    if (xEl) xEl.hidden = !x;
    crt?.classList.toggle('is-x', x);
    crt?.classList.remove('is-hit'); void crt?.offsetWidth; crt?.classList.add('is-hit');
    if (nameEl) scramble(nameEl, r.name);
    if (blurbEl) blurbEl.textContent = r.blurb ? r.blurb[0].toUpperCase() + r.blurb.slice(1) + '.' : '';
    tumble(r.i);
    const playing = st.order.filter((id) => st.on[id]).map((id) => LABEL[id]);
    if (say) say.textContent = `Roll ${r.i}: ${r.name}${x ? ', extreme' : ''}. ${r.blurb}. Playing: ${playing.join(', ')}.`;
  };

  // the engine is UMD: the dev server runs it as a browser script (window.DriftRandomizer), the production bundle as
  // CommonJS (module.exports = the module's default). Take whichever exists.
  let engine: Promise<Rnd> | null = null;
  const getEngine = () => (engine ??= import('../drift/fxv/drift-randomizer.js').then((m: { default?: Rnd }) =>
    (m.default && typeof m.default.roll === 'function' ? m.default : (window as unknown as { DriftRandomizer: Rnd }).DriftRandomizer)));
  // the plugin's seed recipe and roll memory (as /drift's rack)
  const memory = { sinceExtreme: null as number | null, lastPersonality: null as string | null, count: 0, n: 0 };
  const roll = async () => {
    const R = await getEngine();
    const seed = ((++memory.count * 0x9e3779b1) ^ Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
    const ord: Record<string, number> = {};
    st.order.filter((id) => id !== 'glue').forEach((id, i) => { ord[id.toUpperCase()] = i; });
    const out = R.roll({ seed, context: { atOn: false, ord, sinceExtreme: memory.sinceExtreme, lastPersonality: memory.lastPersonality } });
    memory.sinceExtreme = out.mode === 'EXTREME' ? 0 : (memory.sinceExtreme ?? 0) + 1;
    memory.lastPersonality = out.name;
    for (const id of ['pitch', 'echo', 'reverb', 'halo'] as Id[]) st.on[id] = out.active.some((k) => NAME[k] === id);
    const four: Id[] = out.order.map((k) => NAME[k]);
    four.splice(Math.max(0, st.order.indexOf('glue')), 0, 'glue');
    st.order = four;
    paint();
    show({ i: ++memory.n, mode: out.mode, name: out.name, blurb: out.blurb ?? '' });
  };
  die?.addEventListener('pointerenter', () => { void getEngine(); }, { once: true });
  die?.addEventListener('click', () => { void roll(); });
  paint();
}
