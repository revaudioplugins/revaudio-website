/**
 * The hero's scanner IS the plugin's UI: OBDTune Source/ui/public (obdtune.css + obdtune.js + obdtune-custom.js and the
 * PHOTO skin's photos), copied verbatim into public/obdtune/ui by tools/obdtune-ui/sync.sh. This file is the page's
 * side of what the plugin's own binder (Source/ui/public/index.html) does, with the page's engine in the DSP's seat:
 *   - the feed: the 30 Hz ring obdtune-plugin.js keeps (RT_FEED / RT_CORRECT), filled from the page's live signal in
 *     the atinfo shape { note, corr, voiced, f0 };
 *   - the parameters: OBD.P <-> the page's one state, both ways (a TUNE page edit moves the bench; the bench moves the
 *     screen). The FX ids have no audio here: they stay on the screen only;
 *   - DETECT: a press on the OBD connector goes to the page's DETECT (live.ts), painted back the binder's way
 *     (LISTENING + the scan bar, the answer, UNDO?);
 *   - natives: openUrl -> a new tab; the rest (window size, CLOSE, BACKGROUND) has nothing to do on a web page.
 * It lives in a shadow root: the plugin's CSS and the site's never meet. The site's CSP blocks frames (X-Frame-Options
 * DENY), so an iframe is not an option.
 */
import ui from '../../data/obdtune-ui.json';
import { clamp, midiToHz, onChange, state, touch, type ObdState } from './engine';
import { detect, onFrame, pressDetect } from './live';

const BASE = '/obdtune/ui/';
const W = 767, H = 900;           // the plugin's design box (#plugin, index.html)
const HZ = 30, N = HZ * 4 + 2;    // obdtune-plugin.js's ring

type Frame = { f0: number; note: number; corr: number; voiced: boolean };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obd = any;
declare global { interface Window { OBD?: Obd; RT_FEED?: unknown; RT_CORRECT?: unknown } }

function feedRing() {
  const frames: Frame[] = [];
  for (let i = 0; i < N; i++) frames.push({ f0: 0, note: -1000, corr: 0, voiced: false });
  let head = 0;
  window.RT_FEED = { hz: HZ, source: 'engine', frames };
  window.RT_CORRECT = (fr: Frame[]) => fr;
  return {
    index: () => head,
    push(d: { note: number; corr: number; voiced: boolean; f0: number }) {
      head = (head + 1) % N;
      const f = frames[head];
      f.f0 = d.f0 > 0 ? d.f0 : 0; f.note = d.note; f.corr = d.corr || 0; f.voiced = d.voiced && f.note > -1000 && f.f0 > 0;
    },
    // the LIVE DATA lanes are measured at build: seed a singer's range (C3..A4), then clear (the binder's REV_LIVE.seed)
    seed() { frames.forEach((f, k) => { const m = k % 2 ? 69 : 48; f.f0 = midiToHz(m); f.note = m; f.corr = 0; f.voiced = true; }); },
    clear() { frames.forEach((f) => { f.f0 = 0; f.note = -1000; f.corr = 0; f.voiced = false; }); },
  };
}

const loadScript = (src: string) => new Promise<void>((ok, no) => {
  const s = document.createElement('script');
  s.src = src; s.onload = () => ok(); s.onerror = () => no(new Error(src));
  document.head.appendChild(s);
});

// ---- the page's state <-> the plugin's parameter ids ----
const dB = (lin: number) => clamp(20 * Math.log10(Math.max(lin, 1e-6)), -24, 0);
function toP(s: ObdState): Record<string, number | boolean> {
  const P: Record<string, number | boolean> = {
    AT_ON: s.on, AT_TUNE: s.tune, AT_KEY: s.key, AT_SCALE: s.scale, AT_RETUNE: s.speed, AT_HUMANIZE: s.human,
    AT_FLEX: s.flex, AT_VOICE: s.voice, HM_ON: s.harm.on, HM_MIX: s.harm.mix,
  };
  s.notes.forEach((on, i) => { P['AT_NOTE_' + i] = on; });
  s.harm.v.forEach((v, i) => { P[`HM_${i + 1}_ON`] = v.on; P[`HM_${i + 1}_INTERVAL`] = v.int; P[`HM_${i + 1}_LEVEL`] = dB(v.level); });
  return P;
}
function fromP(id: string, v: number | boolean): boolean {
  const n = +v, b = !!v;
  const note = /^AT_NOTE_(\d+)$/.exec(id), hv = /^HM_([12])_(ON|INTERVAL|LEVEL)$/.exec(id);
  if (note) state.notes[+note[1]] = b;
  else if (hv) {
    const voice = state.harm.v[+hv[1] - 1];
    if (hv[2] === 'ON') voice.on = b; else if (hv[2] === 'INTERVAL') voice.int = n; else voice.level = Math.pow(10, n / 20);
  } else switch (id) {
    case 'AT_ON': state.on = b; break;
    case 'AT_TUNE': state.tune = b; break;
    case 'AT_KEY': state.key = n; break;
    case 'AT_SCALE': state.scale = n; break;
    case 'AT_RETUNE': state.speed = n; break;
    case 'AT_HUMANIZE': state.human = n; break;
    case 'AT_FLEX': state.flex = n; break;
    case 'AT_VOICE': state.voice = n; break;
    case 'HM_ON': state.harm.on = b; break;
    case 'HM_MIX': state.harm.mix = n; break;
    default: return false;   // FX, CUSTOM, POSITION, SETUP: the screen keeps them
  }
  return true;
}

export async function mountUnit(host: HTMLElement): Promise<boolean> {
  const ring = feedRing();
  try {
    await loadScript(BASE + 'obdtune.js');
    await loadScript(BASE + 'obdtune-custom.js');
  } catch { return false; }
  const O: Obd = window.OBD;
  if (!O) return false;

  const shadow = host.attachShadow({ mode: 'open' });
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = BASE + 'obdtune.css';
  const cssReady = new Promise((ok) => { css.onload = ok; css.onerror = ok; });
  const style = document.createElement('style');
  // the binder's page CSS: the plugin draws on its own; the connector's LATCH / CABLE zones have no job in the plugin
  style.textContent = `:host{display:block;position:relative;aspect-ratio:${W}/${H}}
.plugin{position:absolute;left:0;top:0;transform-origin:0 0}
.plug .hot-latch,.plug .hot-cable{display:none}`;
  const root = document.createElement('div');
  root.className = 'plugin'; root.id = 'plugin';
  root.style.width = W + 'px'; root.style.height = H + 'px';
  shadow.append(css, style, root);
  await cssReady;
  try { await document.fonts.load('20px "OBD Pixel"'); } catch { /* the build measures with the fallback */ }

  root.classList.add('obd', 'skin-photo');
  O.VERSION = ui.version;
  O.onNative = (name: string, args: unknown[]) => {
    if (name === 'openUrl') window.open(String(args[0]), '_blank', 'noopener');
  };
  // open on the page's state, then build layout A the binder's way
  const P0 = toP(state);
  Object.keys(P0).forEach((id) => { if (O.SPEC[id]) O.P[id] = P0[id]; });
  ring.seed();
  O.build(root, 'A');
  ring.clear();
  O.frameIndex = ring.index;
  O.ui.bg = 'FLOATING';
  O.recorrect();
  O.render();

  // fit the design box to the host
  const fit = () => { root.style.transform = `scale(${host.clientWidth / W})`; };
  new ResizeObserver(fit).observe(host);
  fit();

  // parameters: a screen edit -> the page; a page change -> the screen (no write, so no echo)
  let fromUnit = false;
  const changed0 = O.changed;
  O.changed = function (id: string, old: unknown) {
    if (changed0) changed0(id, old);
    if (fromP(id, O.P[id])) { fromUnit = true; touch('unit'); fromUnit = false; }
  };
  onChange(() => {
    if (fromUnit) return;
    const P = toP(state);
    let moved = false;
    for (const id of Object.keys(P)) {
      const v = P[id], cur = O.P[id];
      if (typeof v === 'number' ? Math.abs(v - +cur) > 1e-6 : v !== cur) { O.P[id] = v; moved = true; }
    }
    if (moved) { O.recorrect(); O.render(); }
  });

  // the feed, at the plugin's 30 Hz
  let acc = 0, lastT = 0;
  onFrame((f) => {
    const dt = f.t - lastT; lastT = f.t;
    acc += dt > 0 && dt < 0.25 ? dt : 0;
    paintDetect();
    if (acc < 1 / HZ) return;
    acc %= 1 / HZ;
    const r = f.r;
    if (r.raw == null || !r.voiced) { ring.push({ note: -1000, corr: 0, voiced: false, f0: 0 }); return; }
    const note = r.target != null ? Math.round(r.target) : Math.round(r.raw);
    ring.push({ note, corr: (r.out ?? r.raw) - r.raw, voiced: true, f0: midiToHz(r.raw) });
  });

  // DETECT = the OBD connector (the binder's capture-phase intercept, before the bench stand-in sees it)
  const plug = root.querySelector<HTMLElement>('[data-part="detect"]');
  root.addEventListener('pointerdown', (e) => {
    const t = e.target as Element | null;
    if (!t || !t.closest || !t.closest('[data-part="detect"]')) return;
    e.stopPropagation(); e.preventDefault();
    plug?.classList.add('down'); setTimeout(() => plug?.classList.remove('down'), 140);
    pressDetect();
  }, true);
  let lastPhase = 0, until = 0, shown = '';
  function paintDetect() {
    const now = performance.now();
    const st = detect.phase === 'listening' ? 1 : detect.phase === 'answer' ? 2 : detect.phase === 'none' ? 3 : 0;
    const undo = detect.phase === 'answer' && now < detect.undoUntil;
    if (st !== 1 && lastPhase === 1 && (st === 2 || st === 3)) {
      shown = st === 2 ? `${O.KEY_NAMES[state.key]} ${O.SCALE_NAMES[state.scale] || 'MAJOR'}` : 'NO KEY';
      until = undo ? 0 : now + 3000;
    }
    if (st === 1) until = 0;
    const listening = st === 1, showing = now < until;
    const tag = listening ? '' : undo ? 'UNDO?' : showing ? shown : '';
    const lit = listening || undo || showing;
    const prog = listening ? clamp(detect.progress, 0, 1) : 0;
    if (O.ui.detect !== lit || O.ui.plugListen !== listening || O.ui.detectTag !== tag) {
      O.ui.detect = lit; O.ui.plugListen = listening; O.ui.detectTag = tag; O.ui.detectProgress = prog; O.render();
    } else if (Math.abs((O.ui.detectProgress || 0) - prog) > 0.004) {
      O.ui.detectProgress = prog; O.renderScan();
    }
    lastPhase = st;
  }
  onChange((why) => { if (why === 'detect') paintDetect(); });

  // keyboard: D = DETECT, P = POWER (the plugin itself is pointer-only)
  host.tabIndex = 0;
  host.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'd') { e.preventDefault(); pressDetect(); }
    else if (k === 'p') { e.preventDefault(); O.write('AT_ON', !O.P.AT_ON); O.render(); }
  });
  return true;
}
