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
const SETTLE = 'cubic-bezier(.22,1,.36,1)';

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
  let swap: Animation | null = null;
  function showRead(k: string) {
    if (reduced()) { fill(k); return; }
    read.getAnimations().forEach((a) => a.cancel());
    const mine = swap = read.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'ease-in', fill: 'forwards' });
    mine.onfinish = () => {
      if (mine !== swap) return;
      fill(k); mine.cancel();
      read.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: SETTLE });
    };
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
}
