import { deck, onDeck, setBandCuts } from './demo';

/**
 * BAND SELECT + STEREO IMAGER cabinet (section 3). The LOW CUT / HIGH CUT
 * lines drag (pointer or arrow keys) and re-window the deck's real crossover;
 * the spectrum line and the goniometer read the deck's actual output. Idle
 * (nothing playing) = a still frame, no animation for its own sake.
 */
const W = 765, H = 315, F0 = 20, F1 = 20000, MIN_GAP = 1.25;   // HIGH stays >= 1.25x LOW
const fx = (f: number) => (Math.log(f / F0) / Math.log(F1 / F0)) * W;
const xf = (x: number) => F0 * Math.pow(F1 / F0, Math.max(0, Math.min(W, x)) / W);
const fmt = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)}k Hz` : `${Math.round(f)} Hz`);

export function initBand(root: HTMLElement): void {
  const cab = root.querySelector<HTMLElement>('[data-band]');
  if (!cab) return;
  const svg = cab.querySelector('svg')!;
  const fill = cab.querySelector<SVGRectElement>('[data-band-fill]')!;
  const spec = cab.querySelector<SVGPathElement>('[data-band-spec]')!;
  const cuts = Array.from(cab.querySelectorAll<SVGGElement>('[data-cut]'));
  const f = { low: deck.low, high: deck.high };

  const place = () => {
    for (const g of cuts) {
      const id = g.dataset.cut as 'low' | 'high';
      g.setAttribute('transform', `translate(${fx(f[id]).toFixed(1)} 0)`);
      g.setAttribute('aria-valuenow', String(Math.round(f[id])));
      g.setAttribute('aria-valuetext', `${id === 'low' ? 'Low cut' : 'High cut'} ${fmt(f[id])}`);
      const val = g.querySelector('[data-cut-val]');
      if (val) val.textContent = fmt(f[id]);
    }
    fill.setAttribute('x', fx(f.low).toFixed(1));
    fill.setAttribute('width', (fx(f.high) - fx(f.low)).toFixed(1));
    setBandCuts(f.low, f.high);
  };
  const setCut = (id: 'low' | 'high', hz: number) => {
    if (id === 'low') f.low = Math.max(20, Math.min(hz, f.high / MIN_GAP));
    else f.high = Math.min(20000, Math.max(hz, f.low * MIN_GAP));
    place();
  };

  let dragging: 'low' | 'high' | null = null;
  const svgX = (e: PointerEvent) => { const r = svg.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * W; };
  svg.addEventListener('pointerdown', (e) => {
    const x = svgX(e);
    dragging = Math.abs(x - fx(f.low)) <= Math.abs(x - fx(f.high)) ? 'low' : 'high';   // nearest line, like the plugin
    svg.setPointerCapture(e.pointerId);
    setCut(dragging, xf(x));
  });
  svg.addEventListener('pointermove', (e) => { if (dragging) setCut(dragging, xf(svgX(e))); });
  const drop = () => { dragging = null; };
  svg.addEventListener('pointerup', drop);
  svg.addEventListener('pointercancel', drop);
  for (const g of cuts) {
    g.addEventListener('keydown', (e) => {
      const id = g.dataset.cut as 'low' | 'high';
      const k = e.shiftKey ? 1.01 : 1.06;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setCut(id, f[id] * k);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setCut(id, f[id] / k);
      else if (e.key === 'Home') setCut(id, id === 'low' ? 20 : 20000);
      else return;
      e.preventDefault();
    });
  }
  place();

  // route lanes: display-only on this page (the deck is a mono source)
  const routes = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-route]'));
  for (const b of routes) b.addEventListener('click', () => routes.forEach((r) => r.setAttribute('aria-pressed', String(r === b))));

  // --- live screens, only while the deck is playing --------------------------
  const canvas = cab.querySelector<HTMLCanvasElement>('[data-imager]')!;
  const c2 = canvas.getContext('2d')!;
  const corr = cab.querySelector<HTMLElement>('[data-corr]');
  const idleImager = () => {
    c2.clearRect(0, 0, canvas.width, canvas.height);
    c2.strokeStyle = 'rgba(190,90,255,.22)';
    c2.lineWidth = 2;
    c2.beginPath();
    c2.moveTo(364 - 220, 306 - 220); c2.lineTo(364 + 220, 306 + 220);
    c2.moveTo(364 + 220, 306 - 220); c2.lineTo(364 - 220, 306 + 220);
    c2.stroke();
    c2.fillStyle = '#d98bff';
    c2.font = '30px VT323, monospace';
    c2.fillText('L', 364 - 250, 306 - 230);
    c2.fillText('R', 364 + 236, 306 - 230);
  };
  idleImager();
  const bins = new Float32Array(1024), l = new Float32Array(1024), r = new Float32Array(1024);
  let raf = 0;
  const draw = () => {
    raf = 0;
    const g = deck.graph;
    if (!g || !deck.playing) { idleImager(); return; }
    // spectrum: mix FFT on a log axis
    g.anMix.getFloatFrequencyData(bins);
    const ny = g.ctx.sampleRate / 2;
    let d = '';
    for (let k = 0; k <= 96; k++) {
      const x = (k / 96) * W, hz = xf(x);
      const b = Math.min(bins.length - 1, Math.round((hz / ny) * bins.length));
      const db = Math.max(-100, Math.min(-10, bins[b]));
      d += `${k ? 'L' : 'M'}${x.toFixed(1)} ${(H - 34 - ((db + 100) / 90) * (H - 70)).toFixed(1)}`;
    }
    spec.setAttribute('d', d);
    // goniometer: tall = mono energy, wide = side energy (the plugin's own tooltip)
    g.anL.getFloatTimeDomainData(l);
    g.anR.getFloatTimeDomainData(r);
    c2.globalCompositeOperation = 'destination-out';
    c2.fillStyle = 'rgba(0,0,0,.28)';
    c2.fillRect(0, 0, canvas.width, canvas.height);
    c2.globalCompositeOperation = 'source-over';
    c2.fillStyle = 'rgba(200,140,255,.85)';
    let sLR = 0, sLL = 0, sRR = 0;
    for (let i = 0; i < 1024; i += 2) {
      const x = 364 + (l[i] - r[i]) * 330, y = 306 - (l[i] + r[i]) * 330;
      c2.fillRect(x, y, 2.2, 2.2);
      sLR += l[i] * r[i]; sLL += l[i] * l[i]; sRR += r[i] * r[i];
    }
    const rho = sLL * sRR > 1e-9 ? sLR / Math.sqrt(sLL * sRR) : 1;
    corr?.style.setProperty('--corr', rho.toFixed(3));
  };
  onDeck(() => { if (!raf) raf = requestAnimationFrame(draw); });
}
