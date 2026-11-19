/**
 * /widebeam furniture (lane A, A.2 + A.3): the fixed layer at the bottom edge, plus the closer's lamps (they need the
 * store, and this is the lane-A init that gets it).
 *
 * The bottom edge has ONE owner, this stack, published as --wb-lift (px) on <html>:
 *   the cookie banner's measured height while it is up (.cb--visible), else the phone bar's while it is up, else 0.
 * furniture.css adds the safe-area inset (max of the two: the banner and the bar pad their own) and sets
 * scroll-padding-bottom from it, so a focused control clears the stack.
 *
 * The SOUND key ([data-wb-sound]; its click, text and aria-pressed are sound.ts's):
 *   - rides the stack; never under the banner, the bar or the home bar;
 *   - at the footer, and over a focused field or key, it rides just above it (frame by frame, like a sticky part
 *     pushed by the floor), so every footer link and every focused control stays clear;
 *   - over a watched block ([data-wb-watch], watch()) or an ask ([data-wb-cta], ctaZone()) it slides off the right edge,
 *     but ONLY while the sound is off: while sound plays it is the only stop control and never leaves the screen.
 * The cart FAB (<= 700 px, the house CartFab): rides the stack; off the edge while the cart is empty (CSS), and over a
 *   watched block, an ask or the footer (html.wb-fab-aside).
 * The phone bar ([data-wb-bar], <= 900 px): askFor().sticky; away while any [data-wb-cta], the manual
 *   ([data-wb-manual]) or the footer is on screen, while an email field has focus, after a sign-up
 *   (html[data-wb-joined], capture.ts) and (CSS) while the cookie banner is up.
 *
 * API for the other lanes: watch(el) / ctaZone(el) add a block at runtime (safe before init). The markup attributes do
 * the same for what the server renders.
 */
import type { Store } from './state';
import { onChange, isPlaying } from './sound';
import { driveTo } from './drive-to';

const extraWatch = new Set<HTMLElement>();
const extraCta = new Set<HTMLElement>();
let refresh: (() => void) | null = null;

/** the SOUND key (sound off) and the cart FAB step aside while `el` passes under them */
export function watch(el: HTMLElement) { extraWatch.add(el); refresh?.(); }
/** an ask zone: the phone bar steps away while `el` is on screen (and the SOUND key / FAB step aside over it) */
export function ctaZone(el: HTMLElement) { extraCta.add(el); refresh?.(); }

export function initFurniture(page: HTMLElement, store: Store, reduced: boolean) {
  const html = document.documentElement;
  const key = page.querySelector<HTMLElement>('[data-wb-sound]');
  const bar = page.querySelector<HTMLElement>('[data-wb-bar]');
  const banner = document.getElementById('cookie-banner');
  const footer = document.querySelector<HTMLElement>('.site-footer');
  const fab = document.querySelector<HTMLElement>('.cart-fab');
  const barMq = matchMedia('(max-width: 900px)');
  const fabMq = matchMedia('(max-width: 700px)');

  const watched = () => [...page.querySelectorAll<HTMLElement>('[data-wb-watch]'), ...extraWatch];
  const ctas = () => [...page.querySelectorAll<HTMLElement>('[data-wb-cta]'), ...extraCta];
  // the asks the fixed parts must not sit on: the sign-up forms (the hero column is an ask zone for the bar only)
  const asks = () => [...page.querySelectorAll<HTMLElement>('form[data-wb-cta]'), ...extraCta];
  // the manual's FRAME (the player, whose control band the bar would cover), not the whole section: the stand-by
  // has no player, so nothing to step away from yet
  const FRAME = 'iframe, video, [data-wb-frame], .wb-manual-frame';
  const manuals = () => [...page.querySelectorAll<HTMLElement>('[data-wb-manual]')]
    .map((m) => (m.matches(FRAME) ? m : m.querySelector<HTMLElement>(FRAME)))
    .filter((m): m is HTMLElement => !!m);

  let raf = 0, lastDy = 0, lastAside = false;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };

  // ── the stack ──
  let bannerUp = false, bannerH = 0, barUp = false, barH = 0;
  const setLift = () => {
    const lift = bannerUp ? bannerH : barUp && barMq.matches ? barH : 0;
    // a banner taller than the screen (a sideways phone: hero-08, Yoni's fix) can't be cleared; keep the key on screen
    const cap = Math.max(0, innerHeight - 120);
    html.style.setProperty('--wb-lift', Math.min(lift, cap) + 'px');
    // while the banner is up the page can scroll its end clear of it (furniture.css: room under the footer), so a
    // focused footer link is never under the banner (G8). Written on the next frame, not inside the ResizeObserver
    // callback: it changes the page's height, which Lenis observes (WebKit: "ResizeObserver loop completed")
    const room = (bannerUp ? Math.min(bannerH, innerHeight) : 0) + 'px';
    requestAnimationFrame(() => html.style.setProperty('--wb-banner', room));
    schedule();
  };
  if (banner) {
    let off = 0;
    const read = () => {
      const up = banner.classList.contains('cb--visible') && !banner.hidden;
      bannerH = banner.offsetHeight;
      clearTimeout(off);
      // going down: hold the lift until the banner has slid away (its own .4 s transition), so the key never dips
      // under it on the way out
      if (!up && bannerUp) off = window.setTimeout(() => { bannerUp = false; setLift(); }, reduced ? 0 : 420);
      else { bannerUp = up; setLift(); }
    };
    new MutationObserver(read).observe(banner, { attributes: true, attributeFilter: ['class', 'hidden'] });
    new ResizeObserver(read).observe(banner, { box: 'border-box' }); // its padding holds the safe-area inset
    read();
  }
  if (bar) new ResizeObserver(() => { barH = bar.offsetHeight; setLift(); }).observe(bar, { box: 'border-box' });

  // ── the phone bar ──
  const hits = new Set<Element>();
  let typing = false;
  const setBar = () => {
    if (!bar) return;
    const away = hits.size > 0 || typing || html.hasAttribute('data-wb-joined');
    bar.classList.toggle('is-away', away);
    const up = !away && barMq.matches;
    if (up !== barUp) { barUp = up; setLift(); }
  };
  let barIo: IntersectionObserver | null = null;
  const observeBar = () => {
    barIo?.disconnect(); hits.clear();
    if (!bar) return;
    // a sign-up form counts by its key, and only while the key is whole on screen (a key half under the edge is no
    // ask; the bar carries it there): DriftStickyBar's phone rule
    const keyOf = new Map<Element, true>();
    barIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const on = keyOf.has(e.target) ? e.intersectionRatio >= 0.98 : e.isIntersecting;
        if (on) hits.add(e.target); else hits.delete(e.target);
      }
      setBar();
    }, { threshold: [0, 1] });
    const zones = [...ctas(), ...manuals(), ...(footer ? [footer] : [])].map((z) => {
      const k = z.matches('form') ? z.querySelector<HTMLElement>('[type="submit"]') : null;
      if (k) keyOf.set(k, true);
      return k ?? z;
    });
    zones.forEach((z) => barIo!.observe(z));
  };
  const emailField = (t: EventTarget | null) => t instanceof HTMLInputElement && t.type === 'email' && page.contains(t);
  document.addEventListener('focusin', (e) => { typing = emailField(e.target); setBar(); schedule(); });
  document.addEventListener('focusout', () => { typing = false; setBar(); schedule(); });
  new MutationObserver(setBar).observe(html, { attributes: true, attributeFilter: ['data-wb-joined'] });
  window.addEventListener('pageshow', (e) => { if ((e as PageTransitionEvent).persisted) observeBar(); }); // Safari bfcache
  barMq.addEventListener('change', () => { setBar(); setLift(); });
  // the bar's key: one mover (stop Lenis's own anchor handling), to the plate's form, then the field takes focus
  const barKey = bar?.querySelector<HTMLAnchorElement>('[data-wb-bar-key]');
  barKey?.addEventListener('click', (e) => {
    const form = page.querySelector<HTMLElement>('[data-wb-trial]') ?? page.querySelector<HTMLElement>('#wb-get');
    if (!form) return;
    e.preventDefault(); e.stopPropagation();
    const field = form.querySelector<HTMLInputElement>('input[type="email"]');
    driveTo(form, { align: 'face', onArrive: () => field?.focus({ preventScroll: true }) });
  });

  // ── the SOUND key and the FAB: where they may sit ──
  const overlaps = (a: DOMRect, b: DOMRect, pad = 0) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  const visibleRect = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight ? r : null; };
  function place() {
    raf = 0;
    if (key) {
      // the key's home: where its CSS puts it, without the ride / aside offset (a rect read mid-glide would lie)
      const cs = getComputedStyle(key);
      const w = key.offsetWidth, h = key.offsetHeight;
      const right = innerWidth - (parseFloat(cs.right) || 0), bottom = innerHeight - (parseFloat(cs.bottom) || 0);
      const home = new DOMRect(right - w, bottom - h, w, h);
      const nav = parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 44;
      const playing = isPlaying() || key.getAttribute('aria-pressed') === 'true';
      // ride: the footer, the focused control
      let dy = 0;
      const riders: HTMLElement[] = [];
      if (footer) riders.push(footer);
      const focused = document.activeElement as HTMLElement | null;
      if (focused && focused !== key && focused !== document.body && page.contains(focused) && !focused.closest('[data-wb-bar]')) riders.push(focused);
      for (const el of riders) {
        const fr = visibleRect(el);
        if (!fr || !overlaps(home, fr, 8)) continue;
        // sit 12 px above it; never above the nav
        const want = fr.top - 12 - home.bottom;
        dy = Math.min(dy, Math.max(want, nav + 8 - home.top));
      }
      // aside: a watched block or an ask under the key, sound off only
      let aside = false;
      if (!playing && dy === 0) {
        for (const el of [...watched(), ...asks()]) {
          const wr = visibleRect(el);
          if (wr && overlaps(home, wr, 4)) { aside = true; break; }
        }
      }
      dy = Math.round(dy);
      const jump = Math.abs(dy - lastDy) > 60 || aside !== lastAside;
      key.classList.toggle('is-gliding', jump && !reduced);
      key.style.setProperty('--wb-sound-dy', dy + 'px');
      key.classList.toggle('is-aside', aside);
      lastDy = dy; lastAside = aside;
    }
    if (fab && fabMq.matches) {
      const cs = getComputedStyle(fab);
      const w = fab.offsetWidth, h = fab.offsetHeight;
      const home = new DOMRect(parseFloat(cs.left) || 16, innerHeight - (parseFloat(cs.bottom) || 16) - h, w, h);
      let aside = false;
      for (const el of [...watched(), ...asks(), ...(footer ? [footer] : [])]) {
        const wr = visibleRect(el);
        if (wr && overlaps(home, wr, 8)) { aside = true; break; }
      }
      html.classList.toggle('wb-fab-aside', aside);
    } else html.classList.remove('wb-fab-aside');
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { setLift(); schedule(); });
  onChange(() => schedule());
  // sound.ts sets aria-pressed itself: follow it too (a play / stop from any key)
  if (key) new MutationObserver(schedule).observe(key, { attributes: true, attributeFilter: ['aria-pressed'] });

  refresh = () => { observeBar(); schedule(); };
  refresh();

  bindLamps(page, store, reduced);
}

/**
 * The closer's two headlamps (A.4; art-13, motion-13): dipped and steady, following the visitor's own WIDTH, POWER,
 * MONO and HIGH BEAM (the plugin's exposure law, 0.09 + 0.91 x w^0.72, the one face.ts uses); full beam with a halogen
 * lag once an email is accepted (capture.ts dispatches wb:joined). No page flash, no idle breathing.
 */
function bindLamps(page: HTMLElement, store: Store, reduced: boolean) {
  const lamps = [...page.querySelectorAll<HTMLElement>('.wb-closer-lamp')];
  if (!lamps.length) return;
  let joined = document.documentElement.hasAttribute('data-wb-joined');
  let shown = -1, raf = 0, t0 = 0, from = 0;
  const goal = () => {
    if (joined) return 1.6;
    const s = store.get();
    const energy = s.power && !s.mono ? Math.min(1, Math.max(0, s.width / 200)) : 0;
    const exposure = 0.09 + 0.91 * Math.pow(energy, 0.72);
    const hb = s.high && s.power ? 0.35 + 0.65 * (s.reach / 100) : 0;
    return 0.3 + 0.62 * exposure + 0.22 * hb; // dipped: 0.3 (off) .. ~1.1 (WIDTH 200 + HIGH BEAM)
  };
  const put = (v: number) => { shown = v; lamps.forEach((l) => l.style.setProperty('--wb-lamp', v.toFixed(3))); };
  // steady following: a short exponential approach, stopped once there
  const follow = () => {
    cancelAnimationFrame(raf);
    const g = goal();
    if (reduced || shown < 0) { put(g); return; }
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const v = shown + (g - shown) * (1 - Math.exp(-dt * 8));
      if (Math.abs(g - v) < 0.004) { put(g); return; }
      put(v); raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  // the halogen lag: the filament takes a beat to catch (slow start), then comes up and settles (~0.9 s)
  const fullBeam = () => {
    cancelAnimationFrame(raf);
    const g = goal();
    if (reduced) { put(g); return; }
    from = shown; t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 900);
      const k = t < 0.18 ? 0.06 * (t / 0.18) : 0.06 + 0.94 * (1 - Math.pow(1 - (t - 0.18) / 0.82, 3));
      put(from + (g - from) * k);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  put(goal());
  store.on((_s, changed) => { if (!joined && ['width', 'power', 'mono', 'high', 'reach'].some((k) => k in changed)) follow(); });
  page.addEventListener('wb:joined', () => { if (joined) return; joined = true; fullBeam(); });
}
