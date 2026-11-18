/**
 * #obd-story: a sticky LIVE DATA screen beside six steps. The step in view drives the screen with its own private
 * state (it never touches the visitor's settings): each step shows one control doing its job on the demo singer.
 */
import { Corrector, demoPitch, DEMO_KEY, keyName, legal, harmNote, state, HARM_INTERVALS, type ObdState } from './engine';
import { Graph, readNote } from './graph';

const fresh = (): ObdState => ({ ...structuredClone(state), on: true, key: DEMO_KEY.key, scale: DEMO_KEY.scale, speed: 25, human: 0, flex: 0, notes: Array(12).fill(true), harm: { on: false, mix: 50, v: [{ on: true, int: 7, level: 0.5 }, { on: false, int: 9, level: 0.5 }] } });

interface Step { readout: (s: ObdState, t: number) => string; drive: (s: ObdState, t: number) => void }
const tri = (t: number, p: number) => { const x = (t % p) / p; return x < 0.5 ? x * 2 : 2 - x * 2; };

const STEPS: Record<string, Step> = {
  detect: {
    drive: (s, t) => { const ph = t % 10; if (ph < 4.5) { s.key = 0; s.scale = 1; } else { s.key = DEMO_KEY.key; s.scale = DEMO_KEY.scale; } },
    readout: (s, t) => (t % 10 < 4.5 ? `LISTENING ${Math.min(100, Math.round(((t % 10) / 4.5) * 100))}% · WAS ${keyName(s)}` : `KEY FOUND · ${keyName(s)}`),
  },
  speed: {
    drive: (s, t) => { s.speed = 1 + 199 * Math.pow(tri(t, 8), 2.2); },
    readout: (s) => `SPEED ${s.speed < 10 ? s.speed.toFixed(1) : Math.round(s.speed)} MS · ${s.speed < 12 ? 'HARD SNAP' : s.speed > 90 ? 'TRANSPARENT' : 'NATURAL'}`,
  },
  human: {
    drive: (s, t) => { const on = t % 8 > 4; s.speed = 6; s.human = on ? 0.8 : 0; s.flex = on ? 35 : 0; },
    readout: (s) => (s.human ? 'HUMANIZE 80% · FLEX ±35¢' : 'HUMANIZE OFF · FLEX OFF'),
  },
  notes: {
    drive: (s, t) => { s.notes = Array(12).fill(true); if (t % 8 > 4) s.notes[9] = false; },
    readout: (s) => (s.notes[9] ? `${keyName(s)} · 7 NOTES` : `${keyName(s)} · A CUT · 6 NOTES`),
  },
  harmony: {
    drive: (s, t) => { s.harm.on = true; const k = Math.floor(t / 5) % 3; s.harm.v[0].on = true; s.harm.v[0].int = k === 2 ? 9 : 7; s.harm.v[1].on = k === 1; s.harm.v[1].int = 9; },
    readout: (s) => `HARMONY · ${s.harm.v.filter((v) => v.on).map((v) => HARM_INTERVALS[v.int].name).join(' + ')}`,
  },
  power: {
    drive: (s, t) => { s.on = t % 6 < 3; },
    readout: (s) => (s.on ? 'POWER ON · TUNING' : 'POWER OFF · TRUE BYPASS'),
  },
};

export function initStory(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-story-graph]')!;
  const readout = root.querySelector<HTMLElement>('[data-story-readout]')!;
  const note = root.querySelector<HTMLElement>('[data-story-note]')!;
  const label = root.querySelector<HTMLElement>('[data-story-label]')!;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const s = fresh();
  const graph = new Graph(canvas);
  graph.stateOf = () => s;
  graph.window = 5; graph.span = 14;
  const corr = new Corrector();
  let current = 'detect';
  let t0 = 0, t = 0, last = performance.now(), inView = false;

  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      const id = (e.target as HTMLElement).dataset.step!;
      if (id === current) continue;
      current = id; t0 = t;
      Object.assign(s, fresh());
      graph.clear();
      steps.forEach((el) => el.classList.toggle('is-active', el.dataset.step === id));
      label.textContent = (e.target as HTMLElement).dataset.label || '';
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((el) => io.observe(el));
  steps[0]?.classList.add('is-active');
  label.textContent = steps[0]?.dataset.label || '';

  new IntersectionObserver((es) => { inView = es[0].isIntersecting; }).observe(root);

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!inView) return;
    t += dt;
    const st = STEPS[current];
    st.drive(s, t - t0);
    const r = corr.step(demoPitch(t), dt * 1000, s);
    const ok = legal(s);
    const harm = s.harm.v.map((v) => (s.on && s.harm.on && v.on && r.target != null && r.out != null ? harmNote(r.target, v.int, ok) + (r.out - r.target) : null));
    graph.push(t, r, harm);
    graph.draw(t);
    readout.textContent = st.readout(s, t - t0);
    const rd = readNote(r, s.on);
    note.textContent = `${rd.note} ${rd.cents}`;
  };
  requestAnimationFrame(frame);
}
