/**
 * /obdtune boot (the one-pager, 2026-11-26): the live signal, the hovering scanner (the plugin's own UI, unit.ts), and
 * the reading that follows the hand. A press on a part of the tool, or the page its screen opens, picks a reading
 * (src/data/obdtune-parts.ts); the index lamps light the part being read, and an index press also opens that page on
 * the tool's screen. BACK and the D-pad keep their own reading while they walk the screen; OK, a tile or a code's jump
 * hands over to the page they open.
 */
import { KEY_TO_PAGE, PAGE_TO_KEY, PART_TO_KEY, READINGS } from '../../data/obdtune-parts';
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
  const fill = (k: string) => {
    const r = READINGS[k];
    (['n', 'label', 'h', 'p', 'spec'] as const).forEach((f) => {
      const el = read.querySelector<HTMLElement>(`[data-r-${f}]`);
      if (el) el.textContent = r[f];
    });
  };
  // ---------------------------------------------------------------- the reading screen: the words change through a
  // glitch, one per screen look ([data-screen], SCREEN LOOK ROUND 2026-11-26). The glitch is the change itself: before
  // and after it the words stand still (DESIGN.md §6). Reduced motion: a plain swap.
  const screen = () => page.dataset.screen || 'a';
  const band = page.querySelector<HTMLElement>('.obd-scr-band');
  const fx = page.querySelector<HTMLCanvasElement>('[data-scr-fx]');
  const meter = page.querySelector<HTMLElement>('[data-scr-meter]');
  const crumb = page.querySelector<HTMLElement>('[data-scr-crumb]');
  let swap = 0;   // the change in flight; a newer press wins
  const setCrumb = (k: string) => { if (crumb) crumb.textContent = k === 'home' ? '' : READINGS[k].label; };

  // A · GLASS: a signal tear. Slices of the words jump sideways with a red / cyan split, the new words tear in and settle.
  const TEAR = (x: number, top: number, bot: number, a = 1) => ({
    transform: `translateX(${x}px)`, clipPath: `inset(${top}% 0 ${bot}% 0)`, opacity: a,
    textShadow: `${-x / 3}px 0 rgba(255, 70, 60, .75), ${x / 3}px 0 rgba(90, 220, 255, .75)`,
  });
  function tear(k: string, id: number) {
    const out = read.animate([TEAR(0, 0, 0), TEAR(-9, 8, 62), TEAR(7, 44, 30), TEAR(-12, 70, 6, .5), TEAR(0, 0, 100, 0)],
      { duration: 130, easing: 'steps(4, end)', fill: 'forwards' });
    out.onfinish = () => {
      if (id !== swap) return;
      fill(k); out.cancel();
      read.animate([TEAR(10, 60, 10, .6), TEAR(-6, 0, 55), TEAR(4, 30, 0), TEAR(-2, 0, 0), { transform: 'none', clipPath: 'inset(0 0 0 0)', opacity: 1, textShadow: '0 0 3px rgba(108, 198, 230, .22)' }],
        { duration: 170, easing: 'steps(5, end)' });
    };
  }

  // B · RED TWIN: the picture loses vertical hold. The old words roll up under a bright scan band, the new ones roll in
  // from below, overshoot and lock.
  function roll(k: string, id: number) {
    band?.animate([{ top: '105%', opacity: 1 }, { top: '-30%', opacity: 1 }], { duration: 300, easing: 'linear' });
    const out = read.animate([{ transform: 'translateY(0)', filter: 'brightness(1)', opacity: 1 }, { transform: 'translateY(-55%)', filter: 'brightness(1.7)', opacity: 0 }],
      { duration: 120, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' });
    out.onfinish = () => {
      if (id !== swap) return;
      fill(k); out.cancel();
      read.animate([
        { transform: 'translateY(60%)', filter: 'brightness(1.7)', opacity: 0 },
        { transform: 'translateY(-5%)', filter: 'brightness(1.25)', opacity: 1, offset: .55 },
        { transform: 'translateY(2.5%)', offset: .75 },
        { transform: 'translateY(-1%)', offset: .88 },
        { transform: 'none', filter: 'brightness(1)', opacity: 1 },
      ], { duration: 280, easing: 'linear' });
    };
  }

  // C · DATA PAGE: the tool's own scan bar fills in the header while the old words break up into the LCD's pixel blocks,
  // then the blocks clear off the new words in another random order
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
    const s = screen();
    if (s === 'b') roll(k, id);
    else if (s === 'c') blocks(k, id);
    else tear(k, id);
    if (s !== 'c') setCrumb(k);
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

  // the screen switcher (dev only: the look round's three screens); a press replays the current reading's change
  const lookBtns = [...page.querySelectorAll<HTMLButtonElement>('[data-scr-look]')];
  const markLook = () => lookBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scrLook === screen())));
  lookBtns.forEach((b) => b.addEventListener('click', () => {
    page.dataset.screen = b.dataset.scrLook!;
    const u = new URL(location.href); u.searchParams.set('screen', screen()); history.replaceState(null, '', u);
    markLook();
    showRead(cur);
  }));
  markLook();
}
