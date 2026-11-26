/**
 * /obdtune boot (the one-pager, 2026-11-26): the live signal, the hovering scanner (the plugin's own UI, unit.ts), and
 * the reading that follows the hand. A press on a part of the tool, or the page its screen opens, picks a reading
 * (src/data/obdtune-parts.ts); the index lamps light the part being read, and an index press also opens that page on
 * the tool's screen. BACK and the D-pad keep their own reading while they walk the screen; OK, a tile or a code's jump
 * hands over to the page they open.
 */
import { KEY_TO_PAGE, PAGE_TO_KEY, PART_TO_KEY, READINGS, shortFor } from '../../data/obdtune-parts';
import { pressDetect, startLive } from './live';
import { mountUnit } from './unit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obd = any;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initObdtune() {
  const page = document.querySelector<HTMLElement>('[data-obd-page]');
  if (!page) return;
  const stage = page.querySelector<HTMLElement>('[data-obd-stage]')!;
  const wrap = page.querySelector<HTMLElement>('[data-obd-wrap]')!;
  const host = page.querySelector<HTMLElement>('[data-obd-unit]')!;
  const read = page.querySelector<HTMLElement>('[data-obd-read]')!;
  const ixs = [...page.querySelectorAll<HTMLButtonElement>('[data-ix]')];
  let cur = 'home';

  // ---------------------------------------------------------------- the reading: out, swap, in (one tween each way)
  // the words: the part's number + name from READINGS, the rest from the short reading in the page's style ([data-read])
  const fill = (k: string) => {
    const r = READINGS[k], s = shortFor(page.dataset.read || 'a', k);
    const set = (f: string, v: string) => { const el = read.querySelector<HTMLElement>(`[data-r-${f}]`); if (el) el.textContent = v; };
    set('n', r.n); set('label', r.label); set('h', s.h); set('p', s.p ?? ''); set('spec', s.spec ?? '');
    const rows = read.querySelector<HTMLElement>('[data-r-rows]');
    if (rows) rows.replaceChildren(...(s.rows ?? []).map(([l, v]) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = l; dd.textContent = v; row.append(dt, dd); return row;
    }));
  };
  fill('home');
  // ---------------------------------------------------------------- the reading screen (screen C "Data page", Dan's pick
  // of three, 2026-11-27): the words change through the tool's own scan. The glitch is the change itself: before and
  // after it the words stand still (DESIGN.md §6). Reduced motion: a plain swap.
  const fx = page.querySelector<HTMLCanvasElement>('[data-scr-fx]');
  const meter = page.querySelector<HTMLElement>('[data-scr-meter]');
  const crumb = page.querySelector<HTMLElement>('[data-scr-crumb]');
  let swap = 0;   // the change in flight; a newer press wins
  const setCrumb = (k: string) => { if (crumb) crumb.textContent = k === 'home' ? '' : READINGS[k].label; };

  // the tool's own scan bar fills in the header while the old words break up into the LCD's pixel blocks, then the
  // blocks clear off the new words in another random order
  function blocks(k: string, id: number) {
    if (!fx) { fill(k); setCrumb(k); return; }
    const r = fx.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), S = 9;
    fx.width = Math.round(r.width * dpr); fx.height = Math.round(r.height * dpr);
    const ctx = fx.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const top = 34;   // under the header row
    const cols = Math.ceil(r.width / S), rows = Math.ceil((r.height - top) / S);
    const cells = Array.from({ length: cols * rows }, (_, i) => i);
    const shuffle = () => { for (let i = cells.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; } };
    const fillI = meter?.querySelector<HTMLElement>('i');
    meter?.classList.add('on');
    const T_IN = 150, T_OUT = 190, t0 = performance.now();
    let swapped = false, done = 0;
    shuffle();
    const step = (now: number) => {
      if (id !== swap) { ctx.clearRect(0, 0, r.width, r.height); meter?.classList.remove('on'); return; }
      const t = now - t0;
      if (fillI) fillI.style.width = `${Math.min(100, (t / (T_IN + T_OUT)) * 100)}%`;
      if (t < T_IN) {
        const want = Math.floor((t / T_IN) * cells.length);
        for (; done < want; done++) {
          const c = cells[done];
          ctx.fillStyle = Math.random() < .14 ? 'rgba(108,198,230,.55)' : '#132331';
          ctx.fillRect((c % cols) * S, top + ((c / cols) | 0) * S, S - 1, S - 1);
        }
      } else {
        if (!swapped) {
          swapped = true; fill(k); setCrumb(k); shuffle(); done = 0;
          ctx.fillStyle = '#132331'; ctx.fillRect(0, top, r.width, r.height - top);
        }
        const want = Math.floor(Math.min(1, (t - T_IN) / T_OUT) * cells.length);
        for (; done < want; done++) { const c = cells[done]; ctx.clearRect((c % cols) * S - 1, top + ((c / cols) | 0) * S - 1, S + 1, S + 1); }
        if (t >= T_IN + T_OUT) { ctx.clearRect(0, 0, r.width, r.height); setTimeout(() => meter?.classList.remove('on'), 120); return; }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function showRead(k: string) {
    const id = ++swap;
    read.getAnimations().forEach((a) => a.cancel());
    if (reduced()) { fill(k); setCrumb(k); return; }
    blocks(k, id);
  }

  // a sub-reading lights its parent's lamp (FX · EQ -> FX): they share the number
  const lightIndex = (k: string) => {
    const n = READINGS[k].n;
    ixs.forEach((b) => {
      const on = READINGS[b.dataset.ix!].n === n;
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  };

  function show(k: string) {
    if (!READINGS[k] || k === cur) return;
    cur = k;
    showRead(k);
    lightIndex(k);
  }

  // ---------------------------------------------------------------- the live tool
  startLive();
  void mountUnit(host).then((ok) => {
    if (!ok) return;
    const O: Obd = (window as unknown as { OBD?: Obd }).OBD;
    const sr = host.shadowRoot!;

    // a press on a part: its reading (capture, before the plugin's own handlers, which may stop the event)
    let lastPart = '', lastAt = 0;
    sr.addEventListener('pointerdown', (e) => {
      const t = e.target as Element | null;
      const el = t && t.closest ? t.closest('[data-part]') : null;
      if (!el) return;
      lastPart = el.getAttribute('data-part')!; lastAt = performance.now();
      const k = PART_TO_KEY[lastPart];
      if (k) show(k);
    }, true);

    // the page on the tool's screen: its reading, unless BACK / the D-pad walked there
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

    // the index: the reading, and the page it names opens on the tool's screen (DETECT starts a scan)
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
  });
  lightIndex(cur);

  // ROUND 2 switcher (dev only): each area three ways ([data-name|ixl|read|cta] on the page, ?name= &ix= &read= &cta=)
  const looks = [...page.querySelectorAll<HTMLButtonElement>('[data-look]')];
  const attr = (k: string) => (k === 'ix' ? 'ixl' : k);
  const markLooks = () => looks.forEach((b) => b.setAttribute('aria-pressed', String(page.dataset[attr(b.dataset.look!)] === b.dataset.v)));
  looks.forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.look!, v = b.dataset.v!;
    page.dataset[attr(k)] = v;
    const u = new URL(location.href); u.searchParams.set(k, v); history.replaceState(null, '', u);
    markLooks();
    if (k === 'read') showRead(cur);
  }));
  markLooks();
}
