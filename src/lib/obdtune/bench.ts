/**
 * #obd-bench: the hands-on part. PLAY = the demo singer, heard (synth stand-in); SING = the visitor's mic, read only.
 * Knobs (drag up / down, wheel, arrow keys) for SPEED, HUMANIZE and FLEX; KEY / SCALE / VOICE pickers; DETECT,
 * HARMONY and POWER keys. All of it is the page's one state, so the hero scanner follows along.
 */
import { clamp, keyName, NOTE_NAMES, onChange, SCALES, set, state, touch, VOICES } from './engine';
import { currentSource, detect, onFrame, onSource, pressDetect, setSource } from './live';
import { drawGauge, Graph, readNote } from './graph';

interface KnobDef { id: 'speed' | 'human' | 'flex'; norm: () => number; from: (n: number) => number; fmt: () => string }
const KNOBS: KnobDef[] = [
  { id: 'speed', norm: () => Math.pow((state.speed - 1) / 199, 0.4), from: (n) => +(1 + 199 * Math.pow(n, 2.5)).toFixed(1),
    fmt: () => `${state.speed < 10 ? state.speed.toFixed(1) : Math.round(state.speed)} ms` },
  { id: 'human', norm: () => state.human, from: (n) => +n.toFixed(2), fmt: () => `${Math.round(state.human * 100)} %` },
  { id: 'flex', norm: () => state.flex / 100, from: (n) => Math.round(n * 100), fmt: () => (state.flex <= 0 ? 'OFF' : `±${Math.round(state.flex)}¢`) },
];

export function initBench(root: HTMLElement) {
  const graph = new Graph(root.querySelector<HTMLCanvasElement>('[data-bench-graph]')!);
  graph.window = 5; graph.span = 15;
  const gauge = root.querySelector<HTMLCanvasElement>('[data-bench-gauge]')!;
  const noteEl = root.querySelector<HTMLElement>('[data-bench-note]')!;
  const centsEl = root.querySelector<HTMLElement>('[data-bench-cents]')!;
  const keyEl = root.querySelector<HTMLElement>('[data-bench-key]')!;
  const msg = root.querySelector<HTMLElement>('[data-bench-msg]')!;
  const playBtn = root.querySelector<HTMLButtonElement>('[data-bench-play]')!;
  const micBtn = root.querySelector<HTMLButtonElement>('[data-bench-mic]')!;
  const powerBtn = root.querySelector<HTMLButtonElement>('[data-bench-power]')!;
  const detectBtn = root.querySelector<HTMLButtonElement>('[data-bench-detect]')!;
  const harmBtn = root.querySelector<HTMLButtonElement>('[data-bench-harm]')!;
  const keySel = root.querySelector<HTMLSelectElement>('[data-bench-keysel]')!;
  const scaleSel = root.querySelector<HTMLSelectElement>('[data-bench-scalesel]')!;
  const voiceSel = root.querySelector<HTMLSelectElement>('[data-bench-voicesel]')!;
  keySel.innerHTML = NOTE_NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
  scaleSel.innerHTML = SCALES.map(([n], i) => `<option value="${i}">${n}</option>`).join('');
  voiceSel.innerHTML = VOICES.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
  keySel.addEventListener('change', () => set('key', +keySel.value));
  scaleSel.addEventListener('change', () => set('scale', +scaleSel.value));
  voiceSel.addEventListener('change', () => set('voice', +voiceSel.value));

  // ---- knobs ----
  const knobs = KNOBS.map((k) => {
    const el = root.querySelector<HTMLElement>(`[data-knob="${k.id}"]`)!;
    const ptr = el.querySelector<HTMLElement>('[data-knob-ptr]')!;
    const val = el.parentElement!.querySelector<HTMLElement>('[data-knob-val]')!;
    const apply = (n: number) => set(k.id, k.from(clamp(n, 0, 1)));
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const y0 = e.clientY, n0 = k.norm();
      const mv = (ev: PointerEvent) => apply(n0 + (y0 - ev.clientY) / (ev.shiftKey ? 600 : 180));
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); };
      el.addEventListener('pointermove', mv);
      el.addEventListener('pointerup', up);
    });
    el.addEventListener('wheel', (e) => { e.preventDefault(); apply(k.norm() + (e.deltaY < 0 ? 0.03 : -0.03)); }, { passive: false });
    el.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 0.03 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -0.03 : 0;
      if (d) { e.preventDefault(); apply(k.norm() + d); }
    });
    el.addEventListener('dblclick', () => apply(k.id === 'speed' ? Math.pow(24 / 199, 0.4) : 0));
    return () => {
      const n = k.norm();
      ptr.style.transform = `rotate(${-135 + n * 270}deg)`;
      el.style.setProperty('--n', n.toFixed(3));
      el.setAttribute('aria-valuenow', String(Math.round(n * 100)));
      el.setAttribute('aria-valuetext', k.fmt());
      val.textContent = k.fmt();
    };
  });

  // ---- keys ----
  playBtn.addEventListener('click', async () => { await setSource(currentSource() === 'synth' ? 'demo' : 'synth'); });
  micBtn.addEventListener('click', async () => {
    if (currentSource() === 'mic') { await setSource('demo'); return; }
    msg.textContent = 'Allow the mic, then sing or hum a few notes.';
    const okMic = await setSource('mic');
    if (!okMic) msg.textContent = 'No mic here (or it was blocked). PLAY works without one.';
  });
  powerBtn.addEventListener('click', () => set('on', !state.on));
  detectBtn.addEventListener('click', () => pressDetect());
  harmBtn.addEventListener('click', () => { state.harm.on = !state.harm.on; touch('harm'); });

  const sync = () => {
    knobs.forEach((f) => f());
    keySel.value = String(state.key); scaleSel.value = String(state.scale); voiceSel.value = String(state.voice);
    powerBtn.classList.toggle('is-lit', state.on);
    powerBtn.setAttribute('aria-pressed', String(state.on));
    powerBtn.querySelector('[data-face]')!.textContent = state.on ? 'POWER ON' : 'BYPASS';
    harmBtn.classList.toggle('is-lit', state.harm.on);
    harmBtn.setAttribute('aria-pressed', String(state.harm.on));
    keyEl.textContent = state.on ? keyName() : 'BYPASS';
    detectBtn.querySelector('[data-face]')!.textContent = detect.phase === 'answer' ? 'UNDO' : detect.phase === 'listening' ? `LISTENING ${Math.round(detect.progress * 100)}%` : 'DETECT';
    detectBtn.classList.toggle('is-lit', detect.phase === 'listening');
    if (detect.phase === 'answer') msg.textContent = `DETECT heard ${detect.answer}. Not right? Press UNDO within 8 seconds.`;
    if (detect.phase === 'none') msg.textContent = 'No clear key yet. Keep singing and press DETECT again.';
  };
  const syncSource = () => {
    const s = currentSource();
    playBtn.classList.toggle('is-lit', s === 'synth');
    playBtn.setAttribute('aria-pressed', String(s === 'synth'));
    playBtn.querySelector('[data-face]')!.textContent = s === 'synth' ? 'STOP' : 'PLAY';
    micBtn.classList.toggle('is-lit', s === 'mic');
    micBtn.setAttribute('aria-pressed', String(s === 'mic'));
    micBtn.querySelector('[data-face]')!.textContent = s === 'mic' ? 'MIC ON' : 'SING';
    if (s === 'synth') msg.textContent = 'It is singing in E minor and the scanner says C major. Listen to the F#, then press DETECT.';
    if (s === 'demo') msg.textContent = 'Press PLAY to hear it, or SING to put your own voice on the scanner.';
    if (s === 'mic') msg.textContent = 'Sing or hum. Amber is you, cyan is where OBDTUNE puts you.';
    graph.clear();
  };
  onChange(sync);
  onSource(syncSource);
  sync(); syncSource();

  let inView = false;
  new IntersectionObserver((es) => { inView = es[0].isIntersecting; }).observe(root);
  onFrame((f) => {
    if (detect.phase === 'listening') sync();
    graph.push(f.t, f.r, f.harm);
    if (!inView) return;
    graph.draw(f.t);
    drawGauge(gauge, f.r, state.on);
    const rd = readNote(f.r, state.on);
    noteEl.textContent = rd.note; centsEl.textContent = rd.cents;
  });
}
