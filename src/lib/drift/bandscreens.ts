/**
 * #band (DriftBand.astro, Dan 2026-10-09: "bring the real spectrum of drift and the imager from real drift, show a
 * spectrum of a vocal on the band selection"). DRIFT's left cabinet, its two live layers run by ports of the plugin's
 * own code (Drift Source/ui/public/index.html, 5.2.7) on a real lead vocal baked by tools/bake-drift-band-vocal.mjs:
 *   BAND SELECT: "EQ panel" - the 112-bin contour + stroke (attack .5 / release .16), the grid + Hz ticks, the cut
 *     shades and the two handles with the plugin's caption layout (audit #5), drag = the bench path (nearer line,
 *     click snaps, shift = 0.1x fine, double-tap resets, 50 Hz gap, LOW 20..19950 / HIGH 70..20000).
 *   STEREO IMAGER: the 45-degree lissajous (x = side, y = mono), 0.30 phosphor wipe, the correlation bar.
 * The imager's points are the vocal's 12 log stems: the stems outside [LOW, HIGH] sum as they came in (a mono vocal: a
 * vertical line, "your mix stays as it was"), the ones inside are the band and get DRIFT's TRUE pan (PluginProcessor
 * recombine: psi = |p|pi/4, far *= c - s, near = (near + far 2sc) / (c + s)). The pan = the page's pan bus (the hero
 * wheel, the TRACKS car); with no writer for a while a slow sway drives it, so the band always shows its move.
 * Runs only near view; reduced motion = still frames.
 */
import { getPan, onPan } from './bus';

const PW = 410, PH = 134, HIT = 8, FINE_DRAG = 0.1;
const LG20 = Math.log10(20), LGSPAN = Math.log10(20000) - LG20;
const NS = 'http://www.w3.org/2000/svg';
const xOf = (h: number) => (PW * (Math.log10(Math.max(20, Math.min(20000, h))) - LG20)) / LGSPAN;
const hzAt = (x: number) => 10 ** (LG20 + Math.max(0, Math.min(1, x / PW)) * LGSPAN);
const fmtHz = (sc: number) => (sc >= 1000 ? (sc / 1000).toFixed(sc < 10000 ? 1 : 0) + 'k Hz' : Math.round(sc) + ' Hz');
const IDLE_MS = 3500;   // the pan bus quiet this long = the slow sway takes the band

interface Vocal { specFps: number; specFrames: number; bins: number; scopeFps: number; scopeFrames: number; stems: number; pts: number; edges: number[]; spec: Uint8Array; scope: Int8Array }

async function loadVocal(url: string): Promise<Vocal> {
  const b = new DataView(await (await fetch(url)).arrayBuffer());
  const u = (i: number) => b.getUint16(4 + i * 2, true);
  const [specFps, specFrames, bins, scopeFps, scopeFrames, stems, pts] = [0, 1, 2, 3, 4, 5, 6].map(u);
  const edges = Array.from({ length: stems + 1 }, (_, i) => b.getFloat32(20 + i * 4, true));
  const o = 20 + (stems + 1) * 4;
  return { specFps, specFrames, bins, scopeFps, scopeFrames, stems, pts, edges,
    spec: new Uint8Array(b.buffer, o, specFrames * bins), scope: new Int8Array(b.buffer, o + specFrames * bins, scopeFrames * stems * pts) };
}

export function initBandScreens(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-bs-eq]');
  const cv = root.querySelector<HTMLCanvasElement>('[data-bs-spec]');
  const svg = root.querySelector<SVGSVGElement>('[data-bs-svg]');
  const sc = root.querySelector<HTMLCanvasElement>('[data-bs-scope]');
  const ranges = { LOW: root.querySelector<HTMLInputElement>('[data-bs-range="LOW"]'), HIGH: root.querySelector<HTMLInputElement>('[data-bs-range="HIGH"]') };
  if (!panel || !cv || !svg || !sc) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bench = { LOW: +(root.dataset.lo ?? 200), HIGH: +(root.dataset.hi ?? 6000) };
  const hzOf = (cut: 'LOW' | 'HIGH') => bench[cut];

  /* ---- BAND SELECT: grid + ticks + handles (index.html "EQ panel") ---- */
  const grid = document.createElementNS(NS, 'g');
  const cutL = document.createElementNS(NS, 'rect'), cutR = document.createElementNS(NS, 'rect');
  for (const [el, x] of [[cutL, 0], [cutR, PW]] as const) { el.setAttribute('class', 'cut'); el.setAttribute('x', String(x)); el.setAttribute('y', '0'); el.setAttribute('width', '0'); el.setAttribute('height', '134'); el.setAttribute('rx', '6'); }
  svg.append(grid, cutL, cutR);
  ([[20, '20'], [50, '50'], [100, '100'], [200, '200'], [500, '500'], [1000, '1k'], [2000, '2k'], [5000, '5k'], [10000, '10k'], [20000, '20k']] as const).forEach(([h, txt]) => {
    const x = xOf(h);
    const ln = document.createElementNS(NS, 'line');
    ln.setAttribute('x1', String(x)); ln.setAttribute('x2', String(x)); ln.setAttribute('y1', '2'); ln.setAttribute('y2', String(PH - 2));
    ln.setAttribute('class', 'grid' + (h === 100 || h === 1000 || h === 10000 ? ' maj' : ''));
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', String(x)); t.setAttribute('y', String(PH + 15)); t.setAttribute('class', 'tick-t'); t.textContent = txt;
    grid.append(ln, t);
  });
  const gEl = {} as Record<'LOW' | 'HIGH', SVGGElement>, valT = {} as Record<'LOW' | 'HIGH', SVGTextElement>, capT = {} as Record<'LOW' | 'HIGH', SVGTextElement>;
  for (const [cut, cap] of [['LOW', 'LOW CUT'], ['HIGH', 'HIGH CUT']] as const) {
    const g = gEl[cut] = document.createElementNS(NS, 'g'); g.setAttribute('class', 'eq-handle'); svg.appendChild(g);
    const right = cut === 'LOW';
    const mk = (tag: string, attrs: Record<string, string | number>) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, String(attrs[k])); g.appendChild(el); return el; };
    mk('rect', { class: 'halo', x: -4.2, y: 0, width: 8.4, height: PH });
    mk('rect', { class: 'core', x: -1.4, y: 0, width: 2.8, height: PH });
    mk('rect', { class: 'cap', x: -5.6, y: 0, width: 11.2, height: 4 });
    capT[cut] = mk('text', { class: 'cap-t', x: right ? 6 : -6, y: 14, 'text-anchor': right ? 'start' : 'end' }) as SVGTextElement; capT[cut].textContent = cap;
    valT[cut] = mk('text', { class: 'val-t', x: right ? 6 : -6, y: 30, 'text-anchor': right ? 'start' : 'end' }) as SVGTextElement;
    const GY = 75;
    mk('rect', { class: 'grip-pad', x: -8.5, y: GY - 11, width: 17, height: 22, rx: 3 });
    mk('rect', { class: 'grip-tx', x: -0.8, y: GY - 7, width: 1.6, height: 14, rx: 0.5 });
    mk('path', { class: 'grip-ln', d: `M-3.4 ${GY - 5.5} L-6.2 ${GY} L-3.4 ${GY + 5.5}` });
    mk('path', { class: 'grip-ln', d: `M3.4 ${GY - 5.5} L6.2 ${GY} L3.4 ${GY + 5.5}` });
  }

  /* caption layout (audit #5), verbatim in behaviour */
  const OFF = 6, GAP = 6, HYS = 4, EDGE = 2, ROW2 = 30;
  const capW = { LOW: 0, HIGH: 0 }, valS = { LOW: '', HIGH: '' };
  const pos = { LOW: '6|start|0', HIGH: '-6|end|0' };
  let mode = 'RL', wDirty = true, held = false;
  const measure = () => { wDirty = false;
    for (const k of ['LOW', 'HIGH'] as const) { let w = 0;
      try { w = Math.max(capT[k].getComputedTextLength(), valT[k].getComputedTextLength()); } catch { /* not rendered */ }
      if (!(w > 0)) wDirty = true; capW[k] = w; } };
  document.fonts?.ready.then(() => { wDirty = true; });
  const place = (k: 'LOW' | 'HIGH', x: number, right: boolean, row: number) => { const a = right ? 'start' : 'end', key = x + '|' + a + '|' + row;
    if (pos[k] === key) return; pos[k] = key;
    for (const [t, y] of [[capT[k], 14], [valT[k], 30]] as const) { t.setAttribute('x', String(x)); t.setAttribute('text-anchor', a); t.setAttribute('y', String(y + row * ROW2)); } };
  const span = (x: number, w: number, side: string) => (side === 'R' ? [x + OFF, x + OFF + w] : [x - OFF - w, x - OFF]);
  const inP = (s: number[], m: number) => s[0] >= EDGE + m && s[1] <= PW - EDGE - m;
  const MODES = ['RL', 'LR', 'LL', 'RR'];
  const layoutCaps = (xL: number, xH: number) => {
    if (wDirty) measure();
    const wL = capW.LOW, wH = capW.HIGH;
    const fits = (md: string, m: number) => { const a = span(xL, wL, md[0]), b = span(xH, wH, md[1]);
      const clr = (s: number[], x: number) => s[1] + OFF + m <= x || x + OFF + m <= s[0];
      return inP(a, m) && inP(b, m) && (a[1] + GAP + m <= b[0] || b[1] + GAP + m <= a[0]) && clr(a, xH) && clr(b, xL); };
    const keep = MODES.includes(mode) && fits(mode, 0);
    const lead = held && (keep || mode[0] === '2') ? HYS : 0;
    for (const md of MODES) {
      if (md === mode && keep) return;
      if (fits(md, lead)) { mode = md; place('LOW', md[0] === 'R' ? OFF : -OFF, md[0] === 'R', 0); place('HIGH', md[1] === 'R' ? OFF : -OFF, md[1] === 'R', 0); return; }
    }
    const w = Math.max(wL, wH);
    const left = inP(span(xL, w, 'L'), held && mode !== '2L' ? HYS : 0) || !inP(span(xH, w, 'R'), 0);
    mode = left ? '2L' : '2R';
    if (left) { place('LOW', -OFF, false, 0); place('HIGH', xL - xH - OFF, false, 1); }
    else { place('LOW', xH - xL + OFF, true, 0); place('HIGH', OFF, true, 1); }
  };

  /* interaction: the plugin's bench path (panel-level; nearer line wins) */
  const xIn = (ev: PointerEvent) => { const rc = panel.getBoundingClientRect(); return ((ev.clientX - rc.left) / rc.width) * PW; };
  const nearer = (x: number) => (Math.abs(x - xOf(hzOf('LOW'))) <= Math.abs(x - xOf(hzOf('HIGH'))) ? 'LOW' : 'HIGH');
  const write = (cut: 'LOW' | 'HIGH', hz: number) => {
    bench[cut] = cut === 'LOW' ? Math.max(20, Math.min(Math.min(19950, bench.HIGH - 50), hz)) : Math.min(20000, Math.max(Math.max(70, bench.LOW + 50), hz));
    const r = ranges[cut]; if (r) r.value = String(Math.round((xOf(bench[cut]) / PW) * 1000));
    still();
  };
  const setHot = (cut: 'LOW' | 'HIGH' | null) => { for (const k of ['LOW', 'HIGH'] as const) gEl[k].classList.toggle('hot', k === cut);
    panel.classList.toggle('grab', !!cut); if (cut) svg.appendChild(gEl[cut]); };
  let lastTap = 0, lastTapCut = '';
  panel.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const x = xIn(e), cut = nearer(x), now = Date.now();
    if (now - lastTap < 350 && lastTapCut === cut && Math.abs(x - xOf(hzOf(cut))) <= HIT) { write(cut, cut === 'LOW' ? 20 : 20000); lastTap = 0; return; }
    lastTap = now; lastTapCut = cut;
    setHot(cut); held = true;
    let lastX = e.clientX;
    panel.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      if (ev.shiftKey) { const rc = panel.getBoundingClientRect(); write(cut, hzAt(xOf(hzOf(cut)) + ((ev.clientX - lastX) / rc.width) * PW * FINE_DRAG)); }
      else write(cut, hzAt(xIn(ev)));
      lastX = ev.clientX;
    };
    const up = () => { held = false; panel.removeEventListener('pointermove', move); panel.removeEventListener('lostpointercapture', up); };
    panel.addEventListener('pointermove', move);
    panel.addEventListener('lostpointercapture', up);
    write(cut, hzAt(x));
  });
  panel.addEventListener('pointermove', (e) => { if (e.buttons) return; const x = xIn(e), cut = nearer(x); setHot(Math.abs(x - xOf(hzOf(cut))) <= HIT ? cut : null); });
  panel.addEventListener('pointerleave', () => { if (!held) setHot(null); });
  for (const k of ['LOW', 'HIGH'] as const) ranges[k]?.addEventListener('input', () => write(k, hzAt((+ranges[k]!.value / 1000) * PW)));

  /* ---- live layers ---- */
  const ctx = cv.getContext('2d')!, sx = sc.getContext('2d')!;
  const SW = 352, SH = 304;
  let vocal: Vocal | null = null, disp: Float32Array | null = null;
  const grad = ctx.createLinearGradient(0, 0, 0, PH);
  grad.addColorStop(0, 'rgba(180,107,255,0.35)'); grad.addColorStop(1, 'rgba(180,107,255,0)');
  const size = () => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    for (const [c, w, h] of [[cv, PW, PH], [sc, SW, SH]] as const) {
      const k = (c.getBoundingClientRect().width / w) * dpr;
      const W = Math.round(w * k), H = Math.round(h * k);
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    }
  };

  // the band's pan: the page bus, or a slow sway when nobody has written it for IDLE_MS
  let busT = -1e9;
  onPan(() => { busT = performance.now(); });
  const panAt = (t: number) => (performance.now() - busT < IDLE_MS ? getPan() : 0.85 * Math.sin(t * 0.9));

  const drawSpec = (fr: number) => {
    const v = vocal!; const NB = v.bins, base = fr * NB;
    for (let b = 0; b < NB; b++) { const tg = v.spec[base + b] / 255, d = tg - disp![b]; disp![b] += d * (d > 0 ? 0.5 : 0.16); }
    const k = cv.width / PW;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, PW, PH);
    ctx.beginPath(); ctx.moveTo(0, PH);
    for (let b = 0; b < NB; b++) { const val = Math.max(0, Math.min(1, disp![b])); ctx.lineTo(((b + 0.5) / NB) * PW, PH - 8 - val * (PH - 16)); }
    ctx.lineTo(PW, PH); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath();
    for (let b = 0; b < NB; b++) { const val = Math.max(0, Math.min(1, disp![b])); const x = ((b + 0.5) / NB) * PW, y = PH - 8 - val * (PH - 16); if (b) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.strokeStyle = '#b026ff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9; ctx.shadowColor = 'rgba(180,107,255,.55)'; ctx.shadowBlur = 6; ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  };
  const drawCuts = () => {
    const xc = { LOW: xOf(hzOf('LOW')), HIGH: xOf(hzOf('HIGH')) };
    for (const cut of ['LOW', 'HIGH'] as const) {
      gEl[cut].setAttribute('transform', `translate(${xc[cut]},0)`);
      const s = fmtHz(hzOf(cut)); if (s !== valS[cut]) { valS[cut] = s; valT[cut].textContent = s; wDirty = true; }
    }
    layoutCaps(xc.LOW, xc.HIGH);
    cutL.setAttribute('width', String(Math.max(0, xc.LOW)));
    cutR.setAttribute('x', String(xc.HIGH)); cutR.setAttribute('width', String(Math.max(0, PW - xc.HIGH)));
  };

  // imager (index.html "STEREO IMAGER"), its points from the stems
  const cx = 149, cyPlot = 126, SCX = 100, SCY = 100, CM_X = 313, CM_W = 12, CM_TOP = 98, CM_BOT = 226, CM_MID = (CM_TOP + CM_BOT) / 2;
  let corrSm = 0;
  const drawScope = (fr: number, pan: number) => {
    const v = vocal!; const k = sc.width / SW;
    sx.setTransform(k, 0, 0, k, 0, 0);
    sx.globalCompositeOperation = 'destination-out'; sx.fillStyle = reduce ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.30)'; sx.fillRect(0, 0, SW, SH);
    sx.globalCompositeOperation = 'source-over';
    sx.strokeStyle = 'rgba(217,139,255,0.16)'; sx.lineWidth = 1;
    sx.beginPath(); sx.moveTo(cx, cyPlot - SCY); sx.lineTo(cx, cyPlot + SCY); sx.stroke();
    sx.beginPath(); sx.moveTo(cx - SCX * 0.75, cyPlot - SCY * 0.75); sx.lineTo(cx + SCX * 0.75, cyPlot + SCY * 0.75); sx.stroke();
    sx.beginPath(); sx.moveTo(cx + SCX * 0.75, cyPlot - SCY * 0.75); sx.lineTo(cx - SCX * 0.75, cyPlot + SCY * 0.75); sx.stroke();
    sx.strokeStyle = 'rgba(217,139,255,0.11)'; sx.beginPath(); sx.ellipse(cx, cyPlot, SCX * 0.72, SCY * 0.72, 0, 0, Math.PI * 2); sx.stroke();
    sx.fillStyle = 'rgba(217,139,255,0.65)'; sx.font = '14px VT323, monospace'; sx.textAlign = 'center';
    sx.fillText('L', cx - SCX * 0.8, cyPlot - SCY * 0.82); sx.fillText('R', cx + SCX * 0.8, cyPlot - SCY * 0.82);
    sx.textAlign = 'left'; sx.font = '12px VT323, monospace'; sx.fillStyle = 'rgba(217,139,255,0.5)'; sx.fillText('STEREO FIELD', 16, 246);

    // stems -> l / r: outside the band as it came (l = r), inside it DRIFT's true pan
    const lo = hzOf('LOW'), hi = hzOf('HIGH'), inBand: boolean[] = [];
    for (let s = 0; s < v.stems; s++) { const c = Math.sqrt(v.edges[s] * v.edges[s + 1]); inBand.push(c >= lo && c <= hi); }
    // a mono band (near = far = band): near -> band (1 + 2sc) / (c + s), far -> band (c - s); pan 0 = both 1
    const psi = (Math.abs(pan) * Math.PI) / 4, c = Math.cos(psi), sn = Math.sin(psi), gFar = c - sn, gNear = (1 + 2 * sn * c) / (c + sn);
    const G = 2.4;   // display gain: the baked stems are scaled to their own peak; the plugin's tap is raw dBFS
    let lr = 0, ll = 0, rr = 0;
    sx.fillStyle = '#d98bff'; sx.shadowColor = 'rgba(190,90,255,0.85)'; sx.shadowBlur = 5; sx.beginPath();
    for (let i = 0; i < v.pts; i++) {
      let out = 0, band = 0;
      for (let s = 0; s < v.stems; s++) { const val = v.scope[(fr * v.stems + s) * v.pts + i] / 127; if (inBand[s]) band += val; else out += val; }
      out *= G; band *= G;
      const l = out + band * (pan > 0 ? gFar : gNear), r = out + band * (pan < 0 ? gFar : gNear);
      lr += l * r; ll += l * l; rr += r * r;
      const sd = (r - l) * 0.7071, m = (l + r) * 0.7071;
      const x = cx + Math.max(-1.05, Math.min(1.05, sd)) * SCX, y = cyPlot - Math.max(-1.05, Math.min(1.05, m)) * SCY;
      sx.moveTo(x + 1, y); sx.arc(x, y, 1, 0, Math.PI * 2);
    }
    sx.fill(); sx.shadowBlur = 0;
    // correlation bar
    const d = Math.sqrt(ll * rr), corrRaw = d > 1e-9 ? lr / d : 0;
    corrSm += (corrRaw - corrSm) * (Math.abs(corrRaw) > Math.abs(corrSm) ? 0.35 : 0.1);
    const yOf = (q: number) => CM_MID - (q * (CM_BOT - CM_TOP)) / 2;
    sx.fillStyle = 'rgba(120,60,180,0.10)'; sx.fillRect(CM_X, CM_TOP, CM_W, CM_BOT - CM_TOP);
    sx.strokeStyle = 'rgba(217,139,255,0.22)'; sx.strokeRect(CM_X + 0.5, CM_TOP + 0.5, CM_W - 1, CM_BOT - CM_TOP - 1);
    const y = yOf(corrSm);
    if (corrSm >= 0) { const g = sx.createLinearGradient(0, CM_MID, 0, CM_TOP); g.addColorStop(0, 'rgba(138,43,226,0.55)'); g.addColorStop(1, 'rgba(199,125,255,0.95)'); sx.fillStyle = g; sx.fillRect(CM_X + 1, y, CM_W - 2, CM_MID - y); }
    else { const g = sx.createLinearGradient(0, CM_MID, 0, CM_BOT); g.addColorStop(0, 'rgba(255,77,109,0.55)'); g.addColorStop(1, 'rgba(255,77,109,0.95)'); sx.fillStyle = g; sx.fillRect(CM_X + 1, CM_MID, CM_W - 2, y - CM_MID); }
    sx.fillStyle = corrSm >= 0 ? '#e9d2ff' : '#ffd0d8'; sx.shadowColor = corrSm >= 0 ? 'rgba(180,107,255,0.9)' : 'rgba(255,77,109,0.9)'; sx.shadowBlur = 6;
    sx.fillRect(CM_X - 1, y - 1, CM_W + 2, 2); sx.shadowBlur = 0;
  };

  let raf = 0, visible = false, t0 = performance.now();
  const draw = (now: number) => {
    drawCuts();
    if (!vocal) return;
    const t = (now - t0) / 1000;
    drawSpec(Math.floor(t * vocal.specFps) % vocal.specFrames);
    drawScope(Math.floor(t * vocal.scopeFps) % vocal.scopeFrames, panAt(t));
  };
  const frame = (now: number) => { raf = 0; if (!visible || document.hidden) return; draw(now); if (!reduce) raf = requestAnimationFrame(frame); };
  const run = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  // reduced motion: a still frame on every change (a few passes so the release / phosphor settle)
  function still() { if (reduce) { for (let i = 0; i < 6; i++) draw(t0 + 2000); } else if (!vocal) drawCuts(); }
  drawCuts();

  let loading: Promise<void> | null = null;
  new IntersectionObserver((es) => {
    visible = es.some((x) => x.isIntersecting);
    if (visible && !loading) loading = loadVocal(root.dataset.vocal!).then((v) => { vocal = v; disp = new Float32Array(v.bins); size(); still(); run(); }).catch(() => { /* the cabinet stays, dark glass */ });
    run();
  }, { rootMargin: '200px 0px' }).observe(root);
  document.addEventListener('visibilitychange', run);
  new ResizeObserver(() => { size(); still(); }).observe(cv);
}
