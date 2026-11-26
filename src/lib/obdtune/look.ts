/**
 * /obdlook boot (look round 2026-11-26): the live signal, the hovering scanner (the plugin's own UI, unit.ts), and the
 * reading that follows the hand. A press on a part of the tool, or the page its screen opens, picks a reading
 * (src/data/obdtune-parts.ts); the look then shows it its own way:
 *   A  the column beside the tool + the index lamps (an index press also opens that page on the tool's screen);
 *   B  the reading moves beside the part, a hairline from the words to the tool's edge;
 *   C  the reading is printed on the scan report: the paper rises out of the slot by the new entry's height.
 */
import { KEY_TO_PAGE, KEY_TO_PART, PAGE_TO_KEY, PART_TO_KEY, READINGS } from '../../data/obdtune-parts';
import { pressDetect, startLive } from './live';
import { mountUnit } from './unit';

type Frac = { x: number; y: number; w: number; h: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obd = any;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => matchMedia('(max-width: 860px)').matches;
const SETTLE = 'cubic-bezier(.22,1,.36,1)';

export function initLook() {
  const page = document.querySelector<HTMLElement>('[data-ol]');
  if (!page) return;
  const stage = page.querySelector<HTMLElement>('[data-ol-stage]')!;
  const wrap = page.querySelector<HTMLElement>('[data-ol-wrap]')!;
  const host = page.querySelector<HTMLElement>('[data-obd-unit]')!;
  const read = page.querySelector<HTMLElement>('[data-ol-read]')!;
  const leader = page.querySelector<SVGSVGElement>('[data-ol-leader]')!;
  const paper = page.querySelector<HTMLElement>('[data-ol-paper]')!;
  const name = page.querySelector<HTMLElement>('.ol-name')!;
  const get = page.querySelector<HTMLElement>('.ol-get')!;
  const look = () => page.dataset.look || 'a';

  let cur = 'home';
  let printed: string | null = null;   // the last reading on the paper
  const fracs: Record<string, Frac> = {};

  // ---------------------------------------------------------------- the reading (A + B, and C's screen-reader copy)
  const fill = (k: string) => {
    const r = READINGS[k];
    (['n', 'label', 'h', 'p', 'spec'] as const).forEach((f) => {
      const el = read.querySelector<HTMLElement>(`[data-r-${f}]`);
      if (el) el.textContent = r[f];
    });
  };
  let swap: Animation | null = null;
  function showRead(k: string) {
    if (reduced() || look() === 'c') { fill(k); place(k); return; }
    read.getAnimations().forEach((a) => a.cancel());
    swap = read.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'ease-in', fill: 'forwards' });
    const mine = swap;
    swap.onfinish = () => {
      if (mine !== swap) return;
      fill(k); place(k); mine.cancel();
      read.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: SETTLE });
    };
  }

  // ---------------------------------------------------------------- A: the index lamps
  const ixs = [...page.querySelectorAll<HTMLButtonElement>('[data-ix]')];
  const lightIndex = (k: string) => {
    // a sub-reading lights its parent (FX · EQ -> FX): the parent shares the number
    const n = READINGS[k].n;
    ixs.forEach((b) => {
      const on = READINGS[b.dataset.ix!].n === n;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
    });
  };

  // ---------------------------------------------------------------- B: the callout beside the part
  function place(k: string) {
    if (look() !== 'b' || phone()) { read.style.removeProperty('left'); read.style.removeProperty('top'); read.removeAttribute('data-side'); leader.setAttribute('data-off', ''); return; }
    const S = stage.getBoundingClientRect(), W = wrap.getBoundingClientRect();
    const cardW = read.offsetWidth, cardH = read.offsetHeight, gap = 40;
    const top0 = name.getBoundingClientRect().bottom - S.top + 22;
    const bot0 = S.height - 24;
    const partId = KEY_TO_PART[k];
    const f = partId ? fracs[partId] : undefined;
    const body = fracs.grab;   // the bumper = the device's edges
    if (!f || k === 'home' || !body) {
      read.dataset.side = 'left';
      read.style.left = `${W.left - S.left - gap - cardW}px`;
      read.style.top = `${Math.max(top0, (S.height - cardH) / 2)}px`;
      leader.setAttribute('data-off', '');
      return;
    }
    const cx = f.x + f.w / 2;
    const side = cx < body.x + body.w * 0.5 ? 'left' : 'right';
    const getTop = get.getBoundingClientRect().top - S.top - 18;
    const py = W.top - S.top + (f.y + f.h / 2) * W.height;
    const lo = top0, hi = (side === 'right' ? Math.min(bot0, getTop) : bot0) - cardH;
    const top = Math.round(Math.min(Math.max(py - 8, lo), Math.max(lo, hi)));
    const edge = side === 'left' ? Math.min(f.x, body.x) : Math.max(f.x + f.w, body.x + body.w);
    const ex = W.left - S.left + edge * W.width + (side === 'left' ? -6 : 6);
    const left = side === 'left' ? W.left - S.left - gap - cardW : W.left - S.left + W.width + gap;
    read.dataset.side = side;
    read.style.left = `${Math.round(left)}px`;
    read.style.top = `${top}px`;
    const sy = top + 8;   // the label row's middle
    const sx = side === 'left' ? left + cardW + 12 : left - 12;
    const line = leader.querySelector('line')!, dot = leader.querySelector('circle')!;
    line.setAttribute('x1', String(sx)); line.setAttribute('y1', String(sy));
    line.setAttribute('x2', String(ex)); line.setAttribute('y2', String(py));
    dot.setAttribute('cx', String(ex)); dot.setAttribute('cy', String(py));
    if (!reduced()) leader.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: SETTLE });
    leader.removeAttribute('data-off');
  }

  // ---------------------------------------------------------------- C: the scan report
  const two = (n: number) => String(n).padStart(2, '0');
  const clock = () => { const d = new Date(); return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`; };
  const P = (cls: string, text: string) => { const p = document.createElement('p'); p.className = cls; p.textContent = text; return p; };
  let feed: Animation | null = null;
  function appendEntry(el: HTMLElement) {
    paper.appendChild(el);
    // keep the roll short: the oldest entries are long out of sight under the fade
    const entries = paper.querySelectorAll('.pe');
    if (entries.length > 14) entries[1].remove();   // [0] = the header stays (it's above the fade by then)
    if (reduced()) return;
    const h = el.offsetHeight;
    let from = h;
    if (feed && feed.playState === 'running') {
      const m = new DOMMatrixReadOnly(getComputedStyle(paper).transform);
      from += m.m42;
      feed.cancel();
    }
    // the paper moves, the print stays glued to it: it rises out of the slot by the entry's height
    feed = paper.animate([{ transform: `translateY(${from}px)` }, { transform: 'none' }], { duration: 420 + Math.min(from, 260) * 1.1, easing: 'cubic-bezier(.3,.2,.25,1)' });
  }
  function printHead() {
    const cfg = (window as unknown as { __olCfg?: { price: number | null; trialDays: number } }).__olCfg;
    const d = new Date();
    const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const head = document.createElement('div');
    head.className = 'pe pe-head';
    head.append(
      P('ph-brand', 'RevAudio'), P('ph-title', 'OBDTUNE · SCAN REPORT'),
    );
    const rows: [string, string][] = [
      ['DATE', `${two(d.getDate())} ${mon} ${d.getFullYear()}`],
      ['VEHICLE', 'YOUR VOCAL'],
    ];
    if (cfg?.price != null) rows.push(['OBDTUNE', `$${cfg.price.toFixed(2)}`]);
    rows.push(['TRIAL', `${cfg?.trialDays ?? 30} DAYS FREE`]);
    rows.forEach(([a, b]) => { const p = P('ph-row', ''); const s1 = document.createElement('span'); s1.textContent = a; const s2 = document.createElement('span'); s2.textContent = b; p.append(s1, s2); head.append(p); });
    paper.appendChild(head);
  }
  function print(k: string) {
    if (look() !== 'c' || phone() || printed === k) return;
    if (!paper.querySelector('.pe-head')) printHead();
    const r = READINGS[k];
    const e = document.createElement('div');
    e.className = 'pe';
    const top = P('pe-top', '');
    const b = document.createElement('b'); b.textContent = r.code;
    const s = document.createElement('span'); s.textContent = r.label;
    const t = document.createElement('time'); t.textContent = clock();
    top.append(b, s, t);
    e.append(top, P('pe-h', r.h), P('pe-p', r.p), P('pe-spec', r.spec));
    appendEntry(e);
    printed = k;
  }

  // ---------------------------------------------------------------- one reading, every look
  function show(k: string, force = false) {
    if (!READINGS[k] || (k === cur && !force)) return;
    cur = k;
    showRead(k);
    lightIndex(k);
    print(k);
  }

  // ---------------------------------------------------------------- the look switcher (review only)
  const lookBtns = [...page.querySelectorAll<HTMLButtonElement>('[data-ol-look]')];
  const markLook = () => lookBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.olLook === look())));
  lookBtns.forEach((b) => b.addEventListener('click', () => {
    page.dataset.look = b.dataset.olLook!;
    const u = new URL(location.href); u.searchParams.set('look', look()); history.replaceState(null, '', u);
    markLook();
    fill(cur); place(cur); print(cur);
  }));
  markLook();
  lightIndex(cur);
  addEventListener('resize', () => place(cur));

  // ---------------------------------------------------------------- the live tool
  startLive();
  void mountUnit(host).then((ok) => {
    if (!ok) return;
    const O: Obd = (window as unknown as { OBD?: Obd }).OBD;
    const sr = host.shadowRoot!;

    // where each part sits (on the home page, before anything moves): fractions of the host box
    const H = host.getBoundingClientRect();
    sr.querySelectorAll<HTMLElement>('[data-part]').forEach((el) => {
      const r = el.getBoundingClientRect();
      const id = el.getAttribute('data-part')!;
      if (r.width > 0 && !fracs[id]) fracs[id] = { x: (r.left - H.left) / H.width, y: (r.top - H.top) / H.height, w: r.width / H.width, h: r.height / H.height };
    });

    // a press on a part: its reading (before the plugin's own handlers, which may stop the event)
    let lastPart = '', lastAt = 0;
    sr.addEventListener('pointerdown', (e) => {
      const t = e.target as Element | null;
      const el = t && t.closest ? t.closest('[data-part]') : null;
      if (!el) return;
      lastPart = el.getAttribute('data-part')!; lastAt = performance.now();
      const k = PART_TO_KEY[lastPart];
      if (k) show(k);
    }, true);

    // the page on the tool's screen: its reading (a tile, OK, a code's jump), unless BACK / the D-pad walked there
    let lastPage = O?.ui?.page || 'home';
    const watch = () => {
      requestAnimationFrame(watch);
      const p = O?.ui?.page;
      if (!p || p === lastPage) return;
      lastPage = p;
      const walked = performance.now() - lastAt < 700 && PART_TO_KEY[lastPart] === 'keys';
      if (!walked && PAGE_TO_KEY[p]) show(PAGE_TO_KEY[p]);
    };
    watch();

    // A's index: the reading, and the page it names opens on the tool's screen
    ixs.forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.ix!;
      const pg = KEY_TO_PAGE[k];
      if (pg && O && O.go) { O.go(pg); O.render(); lastPage = pg; }
      else if (k === 'detect') pressDetect();
      show(k);
    }));

    // the tool leans a little toward the pointer (mouse only)
    if (!reduced()) {
      let rx = 0, ry = 0, tx = 0, ty = 0;
      stage.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = wrap.getBoundingClientRect();
        ty = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width)) * 4;
        tx = -Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height)) * 3;
      });
      stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
      const tilt = () => {
        requestAnimationFrame(tilt);
        rx += (tx - rx) * 0.07; ry += (ty - ry) * 0.07;
        host.style.transform = `perspective(1600px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      };
      tilt();
    }

    fill(cur); place(cur); print(cur);
  });
  // until the tool is up, C still shows its paper
  if (look() === 'c') print(cur);
}
