/**
 * LIVE DATA on a canvas: the scale lanes (legal notes lit, switched-off notes struck), the sung pitch (ink) and
 * where OBDTUNE puts it (blue), scrolling right to left. One Graph per canvas; feed it Readings with push().
 * Also draws the cents gauge (needle = what was sung, ghost = where it lands).
 */
import { legal, midiName, NOTE_NAMES, SCALES, state, type ObdState, type Reading } from './engine';

/** The plugin screen's ink (OBDTune obdtune.css, skin PHOTO --lcd-*): sung = ink, where it lands = acc, as its LIVE DATA. */
export const INK = {
  bg0: '#0a141c', bg1: '#142432', bg2: '#081017',
  lane: 'rgba(58, 82, 98, 0.45)', laneOn: 'rgba(108, 198, 230, 0.24)', laneRoot: 'rgba(217, 160, 60, 0.42)',
  label: 'rgba(125, 147, 160, 0.9)', labelOff: 'rgba(125, 147, 160, 0.35)', labelRoot: '#e8b860', off: 'rgba(232, 58, 58, 0.55)',
  raw: '#e2ebec', out: '#6cc6e6', harm: '#d9a03c', grid: 'rgba(58, 82, 98, 0.3)',
};

interface Sample { t: number; r: Reading; h: (number | null)[] }

export class Graph {
  private ctx: CanvasRenderingContext2D;
  private buf: Sample[] = [];
  private center = 66;
  private w = 0; private h = 0; private dpr = 1;
  window = 4;      // seconds of history on screen
  span = 15;       // semitones top to bottom
  labels = true;
  stateOf: () => ObdState = () => state;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas);
    this.resize();
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
  }

  clear() { this.buf = []; }

  push(t: number, r: Reading, harm: (number | null)[] = []) {
    this.buf.push({ t, r, h: harm });
    while (this.buf.length && this.buf[0].t < t - this.window - 0.5) this.buf.shift();
    const v = r.out ?? r.raw;
    if (v != null) this.center += (v - this.center) * 0.02;
  }

  draw(now: number) {
    const { ctx, w, h, dpr } = this;
    const s = this.stateOf();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, INK.bg1); g.addColorStop(0.55, INK.bg0); g.addColorStop(1, INK.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    const lo = this.center - this.span / 2;
    const y = (m: number) => h - ((m - lo) / this.span) * h;
    const x = (t: number) => w - ((now - t) / this.window) * w;
    const ok = legal(s);
    const inScale = Array(12).fill(false);
    for (const d of SCALES[s.scale][1]) inScale[(s.key + d) % 12] = true;

    // vertical time grid
    ctx.strokeStyle = INK.grid; ctx.lineWidth = 1;
    for (let k = Math.ceil(now - this.window); k <= now; k += 0.5) {
      const xx = Math.round(x(k)) + 0.5;
      ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, h); ctx.stroke();
    }
    // the lanes
    ctx.font = `${Math.max(10, Math.min(14, h / 18))}px VT323, monospace`;
    ctx.textBaseline = 'middle';
    for (let m = Math.floor(lo); m <= Math.ceil(lo + this.span); m++) {
      const pc = ((m % 12) + 12) % 12;
      const yy = Math.round(y(m)) + 0.5;
      const root = pc === s.key && s.on;
      if (!s.on) ctx.strokeStyle = INK.lane;
      else if (root) ctx.strokeStyle = INK.laneRoot;
      else if (ok[pc]) ctx.strokeStyle = INK.laneOn;
      else ctx.strokeStyle = INK.lane;
      ctx.lineWidth = ok[pc] && s.on ? 1.4 : 1;
      ctx.setLineDash(ok[pc] || !s.on ? [] : [2, 5]);
      ctx.beginPath(); ctx.moveTo(this.labels ? 30 : 0, yy); ctx.lineTo(w, yy); ctx.stroke();
      if (this.labels) {
        const struck = inScale[pc] && !s.notes[pc];
        ctx.fillStyle = struck ? INK.off : ok[pc] && s.on ? (root ? INK.labelRoot : INK.label) : INK.labelOff;
        ctx.fillText(NOTE_NAMES[pc] + (Math.floor(m / 12) - 1), 4, yy);
        if (struck) { ctx.fillRect(3, yy, 24, 1.2); }
      }
    }
    ctx.setLineDash([]);

    const line = (pick: (sm: Sample) => number | null, color: string, width: number, glow: number) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = color; ctx.shadowBlur = glow;
      ctx.beginPath();
      let pen = false;
      for (const sm of this.buf) {
        const v = pick(sm);
        if (v == null) { pen = false; continue; }
        const xx = x(sm.t), yy = y(v);
        if (!pen) { ctx.moveTo(xx, yy); pen = true; } else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
    line((sm) => sm.r.raw, INK.raw + (s.on ? 'aa' : 'ff'), s.on ? 1.6 : 2.4, 0);
    if (s.on) {
      for (let i = 0; i < 2; i++) line((sm) => sm.h[i] ?? null, INK.harm, 2, 6);
      line((sm) => sm.r.out, INK.out, 2.6, 10);
    }
    // the playhead dot
    const last = this.buf[this.buf.length - 1];
    if (last && last.r.voiced) {
      const v = (s.on ? last.r.out : last.r.raw)!;
      ctx.fillStyle = s.on ? INK.out : INK.raw;
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(x(last.t), y(v), 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

/** The cents gauge, drawn into its own canvas: -50..+50 cents, needle = sung, ghost = after OBDTUNE. */
export function drawGauge(cv: HTMLCanvasElement, r: Reading | null, on: boolean) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.92, R = Math.min(w / 2 - 6, h * 0.86);
  const ang = (c: number) => Math.PI + ((Math.max(-50, Math.min(50, c)) + 50) / 100) * Math.PI;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(108, 198, 230, .28)';
  ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
  // the in-tune window
  ctx.strokeStyle = 'rgba(108, 198, 230, .65)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, R, ang(-5), ang(5)); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(125, 147, 160, .55)';
  for (let c = -50; c <= 50; c += 10) {
    const a = ang(c), l = c % 50 === 0 ? 10 : c === 0 ? 12 : 6;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l));
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
  }
  const needle = (c: number, color: string, len: number, wdt: number) => {
    const a = ang(c);
    ctx.strokeStyle = color; ctx.lineWidth = wdt; ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke();
    ctx.shadowBlur = 0;
  };
  if (r && r.voiced && r.raw != null) {
    const ref = r.target ?? Math.round(r.raw);
    needle((r.raw - ref) * 100, INK.raw, R * 0.92, 2);
    if (on && r.out != null) needle((r.out - ref) * 100, INK.out, R * 0.8, 3.2);
  }
  ctx.fillStyle = '#1e3040';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
}

export const readNote = (r: Reading | null, on: boolean) => {
  if (!r || !r.voiced || r.raw == null) return { note: '--', cents: '' };
  const v = on && r.out != null ? r.out : r.raw;
  const ref = on && r.target != null ? r.target : Math.round(v);
  const c = Math.round((v - ref) * 100);
  return { note: midiName(ref), cents: `${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c)}¢` };
};
