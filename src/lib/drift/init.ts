import { initPanDisplays } from './bus';
import { initWheel } from './wheel';
import { initTracks } from './trackui';
import { initCaptures } from './capture';
import { lenis } from '../motion';    // the house scroller (null under reduced motion)
import type { Slot } from './demo';   // type-only: erased, demo.ts stays out of the bundle

/** /drift page entry: one pan bus, then every section that reads or writes it. */
export function initDrift(): void {
  const root = document.querySelector<HTMLElement>('[data-drift-page]');
  if (!root) return;
  initPanDisplays(root);
  initWheel(root);
  initTracks(root);
  initJump();
  initCaptures();
  initDeferredImages(root);
  // #hear renders only when drift.demoMode === 'real'; demo.ts never loads otherwise
  if (root.querySelector('[data-demo-screen]')) void initDeckUi(root);
}

const phone = () => matchMedia('(max-width: 600px)').matches;

/**
 * Every [data-drift-jump] CTA (hero keycap, phone sticky bar): scroll the
 * target's TOP into view, so #try's compat line is read first, then focus the
 * email field without a second scroll. No JS = a native anchor jump.
 * With Lenis up, its own window click handler already animates the same hash
 * (it ignores preventDefault and honours scroll-padding-top), so only the
 * reduced-motion path scrolls here: one engine per click, never two.
 * Phone (≤600, S2 10-02): the sticky bar's link goes to the NEARER form
 * instead (jumpNearest).
 */
function initJump(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-drift-jump]').forEach((a) => {
    const sticky = !!a.closest('[data-drift-sticky]');
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (sticky && phone() && jumpNearest(e)) return;
      const t = a.hash ? document.querySelector<HTMLElement>(a.hash) : null;
      if (!t) return;
      e.preventDefault();
      if (!lenis) t.scrollIntoView({ behavior: 'auto', block: 'start' });
      // pointer: fine only: on touch the visitor reads the compat rows first, then taps the field (no keyboard pop)
      if (matchMedia('(pointer: fine)').matches) t.querySelector<HTMLInputElement>('input[type=email]')?.focus({ preventScroll: true });
      history.replaceState(null, '', a.hash);
    });
  });
}

/**
 * Phone sticky bar tap (S2, 10-02): the hero console or #try's form, whichever
 * is the shorter scroll from here, landed so its field + key sit in the top
 * ~330 px (above an IG keyboard): the hero's stamp label, or #get's heading,
 * just under the sticky nav. The field is focused (inside the tap, so iOS
 * opens the keyboard) only when the jump is under one screen; a long jump
 * lands with no focus and the thumb taps the field.
 * ONE engine, ONE target: Lenis's window click handler still runs after this
 * one and starts its own scroll to a.hash (#try). Ours is queued behind it on
 * the same event (a window listener added during dispatch runs after the ones
 * already there), so our scrollTo replaces its tween before a frame is drawn.
 * Returns false when no form is rendered (the default jump runs).
 */
const LAND_GAP = 6;   // px between the sticky nav and the landed heading
function jumpNearest(e: MouseEvent): boolean {
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  const top = nav ? nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0) : 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const y0 = window.scrollY;
  const pick = [
    { form: document.querySelector<HTMLFormElement>('.d-stamp-form'), head: document.querySelector<HTMLElement>('#d-stamp-label'), hash: '' },
    { form: document.querySelector<HTMLFormElement>('#try .d-capture-form'), head: document.querySelector<HTMLElement>('#d-get-h'), hash: '#try' },
  ]
    .filter((c) => c.form && !c.form.hidden && c.form.offsetParent !== null && c.head && c.head.offsetParent !== null)
    .map((c) => {
      const y = Math.round(Math.max(0, Math.min(max, c.head!.getBoundingClientRect().top + y0 - top - LAND_GAP)));
      return { ...c, y, d: Math.abs(y - y0) };
    })
    .sort((p, q) => p.d - q.d)[0];
  if (!pick) return false;
  e.preventDefault();
  if (pick.d < window.innerHeight) pick.form!.querySelector<HTMLInputElement>('input[type=email]')?.focus({ preventScroll: true });
  const l = lenis;
  if (l) {
    const opts = typeof l.options.anchors === 'object' ? l.options.anchors : undefined;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.removeEventListener('click', go);
      l.scrollTo(pick.y, opts);
    };
    window.addEventListener('click', go);
    setTimeout(go, 0);   // backstop: the click never reached window (a listener stopped it)
  } else {
    window.scrollTo({ top: pick.y, behavior: 'auto' });
  }
  if (pick.hash) history.replaceState(null, '', pick.hash);
  return true;
}

/**
 * img[data-src] (the #fx photos and the GPS plate, 1-3 screens down) and
 * [data-bg] (the GPS caps, background sprites): native loading="lazy" fetched
 * them before any scroll on a fast connection, so they wait here for a 500 px
 * approach instead. srcset goes on before src so the pick is right the first
 * time. No IntersectionObserver = load them all.
 * Phone (S3, 10-02): a [data-drift-jump] scroll flies past #drive / #fx, so
 * for ~900 ms after the tap the photos it crosses are only queued; then the
 * queued ones still within 500 px load and the rest stay observed. At idle the
 * pressed-key sprite is fetched once, so the first press never flashes.
 */
const JUMP_HOLD = 900;
function initDeferredImages(root: HTMLElement): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('img[data-src], [data-bg]'));
  const load = (el: HTMLElement) => {
    if (el instanceof HTMLImageElement) {
      if (el.dataset.srcset) el.srcset = el.dataset.srcset;
      el.src = el.dataset.src!;
      delete el.dataset.src; delete el.dataset.srcset;
    } else {
      el.style.backgroundImage = `url(${el.dataset.bg})`;
      delete el.dataset.bg;
    }
  };
  prefetchKeyPress(root);
  if (!('IntersectionObserver' in window)) { els.forEach(load); return; }
  let holding = false, holdT = 0;
  const queued = new Set<HTMLElement>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      if (holding) { if (e.isIntersecting) queued.add(el); else queued.delete(el); continue; }
      if (e.isIntersecting) { load(el); io.unobserve(el); }
    }
  }, { rootMargin: '500px 0px' });
  els.forEach((el) => io.observe(el));
  const release = () => {
    holding = false; holdT = 0;
    const h = window.innerHeight;
    for (const el of queued) {
      const r = el.getBoundingClientRect();
      if (r.bottom > -500 && r.top < h + 500) { load(el); io.unobserve(el); }
    }
    queued.clear();
  };
  root.ownerDocument.querySelectorAll<HTMLElement>('[data-drift-jump]').forEach((a) => a.addEventListener('click', () => {
    if (!phone()) return;
    holding = true;
    if (holdT) clearTimeout(holdT);
    holdT = window.setTimeout(release, JUMP_HOLD);
  }));
}

function prefetchKeyPress(root: HTMLElement): void {
  if (!phone()) return;
  const run = () => {
    const m = /url\((['"]?)(.+?)\1\)/.exec(getComputedStyle(root).getPropertyValue('--d-img-cta-press'));
    if (m) new Image().src = m[2];
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}

async function initDeckUi(root: HTMLElement): Promise<void> {
  const { deck, elapsedSec, levelBars, onDeck, pause, play, setAfter, setSlot, slotLabel, stop } = await import('./demo');
  const title = root.querySelector<HTMLElement>('[data-demo-title]');
  const mode = root.querySelector<HTMLElement>('[data-demo-mode]');
  const time = root.querySelector<HTMLElement>('[data-demo-time]');
  const playBtn = root.querySelector<HTMLButtonElement>('[data-demo="play"]');
  const slots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-slot]'));
  const abs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-ab]'));
  if (!playBtn) return;

  playBtn.addEventListener('click', () => { void play(); });
  root.querySelector('[data-demo="pause"]')?.addEventListener('click', pause);
  root.querySelector('[data-demo="stop"]')?.addEventListener('click', stop);
  slots.forEach((b) => b.addEventListener('click', () => {
    setSlot(b.dataset.slot as Slot);
    slots.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));
  abs.forEach((b) => b.addEventListener('click', () => {
    setAfter(b.dataset.ab === 'after');
    abs.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));

  let lastTitle = '';
  const paint = () => {
    const t = `${slotLabel()} · ${deck.after ? 'AFTER' : 'BEFORE'}`;
    if (title && t !== lastTitle) { title.textContent = t; lastTitle = t; }
    if (mode) {
      const bars = levelBars();
      mode.textContent = !deck.playing ? 'STOPPED' : deck.paused ? 'PAUSED' : `PLAYING ${'▮'.repeat(bars)}${'▯'.repeat(5 - bars)}`;
    }
    if (time) {
      const s = Math.floor(elapsedSec());
      time.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
    playBtn.setAttribute('aria-pressed', String(deck.playing && !deck.paused));
  };
  onDeck(paint);
  paint();
}
