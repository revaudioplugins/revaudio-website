/**
 * The hero scanner: layout A "Stock" (OBDTune docs/decisions.md, gate 10-1e): a tile menu on the colour screen,
 * one page per tile, the D-pad + OK to move and nudge, BACK always home, DETECT and POWER as body keys.
 * Every value on a page is also clicked or dragged. Keys: arrows, Enter = OK, Esc / Backspace = BACK,
 * D = DETECT, P = POWER (while the scanner has focus).
 */
import {
  clamp, HARM_INTERVALS, keyName, legal, NOTE_NAMES, onChange, SCALES, set, state, touch, VOICES,
} from './engine';
import { detect, onFrame, pressDetect, type Frame } from './live';
import { drawGauge, Graph, readNote } from './graph';

type Page = 'home' | 'tune' | 'notes' | 'voice' | 'harmony' | 'live' | 'setup';
const TILES: { page: Page; label: string; icon: string }[] = [
  { page: 'tune', label: 'TUNE', icon: '<path d="M9 3v8a3 3 0 0 0 6 0V3M12 14v7M9 21h6"/>' },
  { page: 'notes', label: 'NOTES', icon: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M8 5v14M13 5v14M18 5v14"/><path d="M6.5 5v8h3V5M16.5 5v8h3V5" fill="currentColor"/>' },
  { page: 'voice', label: 'VOICE', icon: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>' },
  { page: 'harmony', label: 'HARMONY', icon: '<circle cx="7" cy="17" r="2.5"/><circle cx="17" cy="14" r="2.5"/><path d="M9.5 17V5l10-2v11"/>' },
  { page: 'live', label: 'LIVE DATA', icon: '<path d="M3 17l4-5 3 3 5-8 3 4 3-2"/><path d="M3 21h18"/>' },
  { page: 'setup', label: 'SETUP', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>' },
];
const TITLE: Record<Page, string> = { home: 'MAIN MENU', tune: 'TUNE', notes: 'NOTES', voice: 'VOICE', harmony: 'HARMONY', live: 'LIVE DATA', setup: 'SETUP' };

const speedNorm = (v: number) => Math.pow((v - 1) / 199, 0.4);
const fmtSpeed = (v: number) => `${v < 10 ? v.toFixed(1) : Math.round(v)} MS`;
const fmtFlex = (v: number) => (v <= 0 ? 'OFF' : `±${Math.round(v)}¢`);

interface Row { id: string; label: string; val: () => string; bar?: () => number; nudge: (d: number) => void; ok?: () => void }

const TUNE_ROWS: Row[] = [
  { id: 'key', label: 'KEY', val: () => NOTE_NAMES[state.key], nudge: (d) => set('key', (state.key + d + 12) % 12) },
  { id: 'scale', label: 'SCALE', val: () => SCALES[state.scale][0], nudge: (d) => set('scale', (state.scale + d + 13) % 13) },
  { id: 'speed', label: 'SPEED', val: () => fmtSpeed(state.speed), bar: () => speedNorm(state.speed),
    nudge: (d) => set('speed', clamp(+(state.speed * Math.pow(1.14, d)).toFixed(1), 1, 200)) },
  { id: 'human', label: 'HUMANIZE', val: () => `${Math.round(state.human * 100)} %`, bar: () => state.human,
    nudge: (d) => set('human', clamp(+(state.human + d * 0.05).toFixed(2), 0, 1)) },
  { id: 'flex', label: 'FLEX', val: () => fmtFlex(state.flex), bar: () => state.flex / 100,
    nudge: (d) => set('flex', clamp(state.flex + d * 5, 0, 100)) },
];
const harmRows = (): Row[] => [
  { id: 'hon', label: 'HARMONY', val: () => (state.harm.on ? 'ON' : 'OFF'), nudge: () => { state.harm.on = !state.harm.on; touch('harm'); }, ok: () => { state.harm.on = !state.harm.on; touch('harm'); } },
  ...[0, 1].flatMap((i) => [
    { id: `v${i}`, label: `V${i + 1}`, val: () => (state.harm.v[i].on ? HARM_INTERVALS[state.harm.v[i].int].name : 'OFF'),
      nudge: (d: number) => { const v = state.harm.v[i]; v.int = (v.int + d + HARM_INTERVALS.length) % HARM_INTERVALS.length; v.on = true; touch('harm'); },
      ok: () => { state.harm.v[i].on = !state.harm.v[i].on; touch('harm'); } },
    { id: `l${i}`, label: `V${i + 1} LEVEL`, val: () => `${Math.round(state.harm.v[i].level * 100)} %`, bar: () => state.harm.v[i].level,
      nudge: (d: number) => { const v = state.harm.v[i]; v.level = clamp(+(v.level + d * 0.1).toFixed(1), 0, 1); touch('harm'); } },
  ]),
];

export function initScanner(root: HTMLElement) {
  const screen = root.querySelector<HTMLElement>('[data-obd-screen]')!;
  const pageEl = screen.querySelector<HTMLElement>('[data-obd-page]')!;
  const titleEl = screen.querySelector<HTMLElement>('[data-obd-title]')!;
  const keyEl = screen.querySelector<HTMLElement>('[data-obd-key]')!;
  const stripNote = screen.querySelector<HTMLElement>('[data-obd-strip-note]')!;
  const stripCents = screen.querySelector<HTMLElement>('[data-obd-strip-cents]')!;
  const stripMode = screen.querySelector<HTMLElement>('[data-obd-strip-mode]')!;
  const stage = root.closest<HTMLElement>('[data-obd-stage]');

  let page: Page = 'live';
  let focus = 0;         // tile / row / note cursor
  let graph: Graph | null = null;
  let gauge: HTMLCanvasElement | null = null;
  let lastFrame: Frame | null = null;

  const rows = (): Row[] => (page === 'tune' ? TUNE_ROWS : page === 'harmony' ? harmRows() : []);

  function render() {
    titleEl.textContent = TITLE[page];
    keyEl.textContent = state.on ? keyName() : 'BYPASS';
    screen.classList.toggle('is-off', !state.on);
    root.querySelectorAll<HTMLElement>('[data-obd-key-power]').forEach((k) => k.classList.toggle('is-lit', state.on));
    graph = null; gauge = null;
    if (page === 'home') {
      pageEl.innerHTML = `<div class="obd-tiles">${TILES.map((t, i) => `
        <button type="button" class="obd-tile${i === focus ? ' is-focus' : ''}" data-tile="${i}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>
          <span class="obd-tile-l">${t.label}</span><span class="obd-tile-v" data-tile-v="${t.page}">${tileValue(t.page)}</span>
        </button>`).join('')}</div>`;
    } else if (page === 'tune' || page === 'harmony') {
      pageEl.innerHTML = `${page === 'harmony' ? '<p class="obd-dev-tag">IN DEVELOPMENT · PREVIEW</p>' : ''}<ul class="obd-rows">${rows().map((r, i) => `
        <li class="obd-row${i === focus ? ' is-focus' : ''}" data-row="${i}">
          <span class="obd-row-l">${r.label}</span>
          <button type="button" class="obd-arrow" data-nudge="-1" aria-label="${r.label} down">◂</button>
          <span class="obd-row-v">${r.bar ? `<i class="obd-bar"><b style="width:${(r.bar() * 100).toFixed(1)}%"></b></i>` : ''}<em>${r.val()}</em></span>
          <button type="button" class="obd-arrow" data-nudge="1" aria-label="${r.label} up">▸</button>
        </li>`).join('')}</ul>`;
    } else if (page === 'notes') {
      const ok = legal();
      const inScale = Array(12).fill(false);
      for (const d of SCALES[state.scale][1]) inScale[(state.key + d) % 12] = true;
      const keyHtml = (pc: number) => `<button type="button" class="obd-nk ${[1, 3, 6, 8, 10].includes(pc) ? 'is-black' : 'is-white'}${ok[pc] ? ' is-on' : ''}${inScale[pc] && !state.notes[pc] ? ' is-cut' : ''}${!inScale[pc] ? ' is-outside' : ''}${pc === state.key ? ' is-root' : ''}${pc === focus ? ' is-focus' : ''}" data-note="${pc}" aria-pressed="${state.notes[pc]}">${NOTE_NAMES[pc]}</button>`;
      pageEl.innerHTML = `<div class="obd-notes"><div class="obd-notes-w">${[0, 2, 4, 5, 7, 9, 11].map(keyHtml).join('')}</div><div class="obd-notes-b">${[1, 3, 6, 8, 10].map(keyHtml).join('')}</div></div>
        <p class="obd-hint">${keyName()} · ${ok.filter(Boolean).length} NOTES LIVE · TAP TO CUT</p>`;
    } else if (page === 'voice') {
      pageEl.innerHTML = `<div class="obd-voices">${VOICES.map((v, i) => `
        <button type="button" class="obd-voice${i === state.voice ? ' is-on' : ''}${i === focus ? ' is-focus' : ''}" data-voice="${i}">
          <span>${v.name}</span><em>${v.lo}–${v.hi} HZ</em></button>`).join('')}</div>
        <p class="obd-hint">THE RANGE THE DETECTOR LISTENS IN</p>`;
    } else if (page === 'live') {
      pageEl.innerHTML = `<div class="obd-live">
        <div class="obd-live-top"><div class="obd-big"><span data-live-note>--</span><em data-live-cents></em></div><canvas class="obd-gauge" data-live-gauge></canvas></div>
        <canvas class="obd-graph" data-live-graph></canvas>
        <div class="obd-live-legend"><span class="is-raw">SUNG</span><span class="is-out">OBDTUNE</span><span data-live-speed>SPEED ${fmtSpeed(state.speed)}</span></div>
      </div>`;
      graph = new Graph(pageEl.querySelector('[data-live-graph]')!);
      graph.window = 3.2; graph.span = 13;
      gauge = pageEl.querySelector('[data-live-gauge]');
    } else if (page === 'setup') {
      pageEl.innerHTML = `<ul class="obd-rows">
        <li class="obd-row${focus === 0 ? ' is-focus' : ''}" data-row="0"><span class="obd-row-l">BACKGROUND</span><button type="button" class="obd-arrow" data-nudge="-1" aria-label="background">◂</button><span class="obd-row-v"><em>${state.bg}</em></span><button type="button" class="obd-arrow" data-nudge="1" aria-label="background">▸</button></li>
        <li class="obd-row" data-row="1"><span class="obd-row-l">VERSION</span><span class="obd-row-v"><em>PREVIEW</em></span></li>
        <li class="obd-row" data-row="2"><span class="obd-row-l">LATENCY</span><span class="obd-row-v"><em>48 MS</em></span></li>
      </ul><p class="obd-hint">FLOATING: THE SCANNER HOVERS OVER YOUR SESSION</p>`;
    }
    renderDetect();
  }

  function tileValue(p: Page): string {
    if (p === 'tune') return `${NOTE_NAMES[state.key]} ${SCALES[state.scale][0].slice(0, 5)}`;
    if (p === 'notes') return `${legal().filter(Boolean).length}/12`;
    if (p === 'voice') return VOICES[state.voice].name;
    if (p === 'harmony') return state.harm.on ? `${state.harm.v.filter((v) => v.on).length} VOICE` : 'OFF';
    if (p === 'live') return '<span data-tile-live>--</span>';
    return state.bg;
  }

  function renderDetect() {
    const b = root.querySelector<HTMLElement>('[data-obd-key-detect] [data-face]');
    const bar = screen.querySelector<HTMLElement>('[data-obd-detect]');
    if (b) b.textContent = detect.phase === 'answer' ? 'UNDO' : detect.phase === 'listening' ? 'STOP' : 'DETECT';
    if (bar) {
      bar.hidden = detect.phase === 'idle';
      bar.querySelector<HTMLElement>('em')!.textContent =
        detect.phase === 'listening' ? `LISTENING ${Math.round(detect.progress * 100)}%` :
        detect.phase === 'answer' ? `KEY FOUND · ${detect.answer}` : detect.phase === 'none' ? 'NO KEY · SING A LITTLE LONGER' : '';
      bar.querySelector<HTMLElement>('b')!.style.width = `${(detect.phase === 'listening' ? detect.progress : 1) * 100}%`;
    }
  }

  // ---- input ----
  function ok() {
    if (page === 'home') { open(TILES[focus].page); return; }
    if (page === 'notes') { toggleNote(focus); return; }
    if (page === 'voice') { set('voice', focus); return; }
    if (page === 'setup') { set('bg', state.bg === 'FLOATING' ? 'ROOM' : 'FLOATING'); return; }
    const r = rows()[focus];
    if (r?.ok) r.ok(); else open('home');
  }
  function back() { if (page !== 'home') { const from = TILES.findIndex((t) => t.page === page); open('home'); focus = Math.max(0, from); render(); } }
  function open(p: Page) { page = p; focus = p === 'notes' ? state.key : p === 'voice' ? state.voice : 0; render(); }
  function toggleNote(pc: number) { const n = state.notes.slice(); n[pc] = !n[pc]; set('notes', n); }
  function move(dx: number, dy: number) {
    if (page === 'home') { const c = focus % 3, r = Math.floor(focus / 3); focus = clamp(r + dy, 0, 1) * 3 + clamp(c + dx, 0, 2); render(); return; }
    if (page === 'notes') { focus = (focus + dx + dy + 12) % 12; render(); return; }
    if (page === 'voice') { focus = clamp(focus + dx + dy, 0, 2); render(); return; }
    if (page === 'live') { if (dy) set('speed', clamp(+(state.speed * Math.pow(1.14, dy)).toFixed(1), 1, 200)); return; }
    if (page === 'setup') { if (dx) set('bg', state.bg === 'FLOATING' ? 'ROOM' : 'FLOATING'); return; }
    if (dy) { focus = clamp(focus + dy, 0, rows().length - 1); render(); }
    if (dx) rows()[focus]?.nudge(dx);
  }

  const press = (el: HTMLElement) => { el.classList.add('is-down'); setTimeout(() => el.classList.remove('is-down'), 120); };
  root.querySelectorAll<HTMLElement>('[data-pad]').forEach((k) => k.addEventListener('click', () => {
    press(k);
    const d = k.dataset.pad!;
    if (d === 'ok') ok(); else move(d === 'left' ? -1 : d === 'right' ? 1 : 0, d === 'up' ? -1 : d === 'down' ? 1 : 0);
  }));
  root.querySelector<HTMLElement>('[data-obd-key-back]')?.addEventListener('click', (e) => { press(e.currentTarget as HTMLElement); back(); });
  root.querySelector<HTMLElement>('[data-obd-key-detect]')?.addEventListener('click', (e) => { press(e.currentTarget as HTMLElement); pressDetect(); });
  root.querySelector<HTMLElement>('[data-obd-key-power]')?.addEventListener('click', (e) => { press(e.currentTarget as HTMLElement); set('on', !state.on); });

  pageEl.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const tile = t.closest<HTMLElement>('[data-tile]');
    if (tile) { focus = +tile.dataset.tile!; open(TILES[focus].page); return; }
    const note = t.closest<HTMLElement>('[data-note]');
    if (note) { focus = +note.dataset.note!; toggleNote(focus); return; }
    const voice = t.closest<HTMLElement>('[data-voice]');
    if (voice) { focus = +voice.dataset.voice!; set('voice', focus); return; }
    const nudge = t.closest<HTMLElement>('[data-nudge]');
    const row = t.closest<HTMLElement>('[data-row]');
    if (row) focus = +row.dataset.row!;
    if (nudge) { if (page === 'setup') set('bg', state.bg === 'FLOATING' ? 'ROOM' : 'FLOATING'); else rows()[focus]?.nudge(+nudge.dataset.nudge!); return; }
    if (row && rows()[focus]?.ok) rows()[focus].ok!();
    else if (row) render();
  });
  // drag a row's value sideways (every 10 px = one nudge); the wheel nudges too
  pageEl.addEventListener('pointerdown', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    if (!row || (e.target as HTMLElement).closest('[data-nudge]') || !rows().length) return;
    focus = +row.dataset.row!;
    const r = rows()[focus];
    let x0 = e.clientX, moved = false;
    const mv = (ev: PointerEvent) => {
      const steps = Math.trunc((ev.clientX - x0) / 10);
      if (steps) { moved = true; x0 += steps * 10; r.nudge(Math.sign(steps)); }
    };
    const up = () => { window.removeEventListener('pointermove', mv); if (!moved) render(); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up, { once: true });
  });
  pageEl.addEventListener('wheel', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    if (!row || !rows().length) return;
    e.preventDefault();
    focus = +row.dataset.row!;
    rows()[focus].nudge(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  root.addEventListener('keydown', (e) => {
    const map: Record<string, () => void> = {
      ArrowLeft: () => move(-1, 0), ArrowRight: () => move(1, 0), ArrowUp: () => move(0, -1), ArrowDown: () => move(0, 1),
      Enter: ok, ' ': ok, Escape: back, Backspace: back, d: pressDetect, p: () => set('on', !state.on),
    };
    const fn = map[e.key];
    if (fn && !(e.target as HTMLElement).matches('input, select')) { e.preventDefault(); fn(); }
  });

  onChange((why) => {
    if (why === 'detect') { renderDetect(); if (page !== 'live') render(); keyEl.textContent = state.on ? keyName() : 'BYPASS'; return; }
    if (why === 'bg' && stage) stage.dataset.bg = state.bg.toLowerCase();
    if (page === 'live' && (why === 'speed')) {
      const s = pageEl.querySelector('[data-live-speed]'); if (s) s.textContent = `SPEED ${fmtSpeed(state.speed)}`;
      return;
    }
    render();
  });

  onFrame((f) => {
    lastFrame = f;
    const rd = readNote(f.r, state.on);
    stripNote.textContent = rd.note; stripCents.textContent = rd.cents;
    stripMode.textContent = f.source === 'mic' ? 'MIC' : f.source === 'synth' ? 'PLAYING' : 'DEMO';
    if (detect.phase === 'listening') renderDetect();
    if (page === 'live' && graph && gauge) {
      graph.push(f.t, f.r, f.harm); graph.draw(f.t);
      drawGauge(gauge, f.r, state.on);
      const n = pageEl.querySelector('[data-live-note]'), c = pageEl.querySelector('[data-live-cents]');
      if (n) n.textContent = rd.note; if (c) c.textContent = rd.cents;
    } else if (page === 'home') {
      const t = pageEl.querySelector('[data-tile-live]'); if (t) t.textContent = `${rd.note} ${rd.cents}`;
    }
  });
  void lastFrame;
  render();
}
