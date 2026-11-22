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
 *   watched block, an ask, the phone deck ([data-wb-deck] while deckOn()) or the footer (html.wb-fab-aside).
 * The phone bar ([data-wb-bar], <= 900 px): askFor().sticky; away while any [data-wb-cta], the manual
 *   ([data-wb-manual]; with a film only: in stand-by the bar stays up over the manual's frame and line) or the footer is
 *   on screen, in the band under the nav (a sign-up form counts while its key is whole on screen or any of its
 *   email field is: the closer's field enters from the bottom edge, where the bar sits), while the visitor drives the
 *   phone deck (until the dash has left the screen), while an email field has
 *   focus, after a sign-up (html[data-wb-joined], capture.ts) and (CSS) while the cookie banner is up. Its key goes to
 *   the nearer sign-up form (the plate's or the closer's).
 *
 * API for the other lanes: watch(el) / ctaZone(el) add a block at runtime (safe before init). The markup attributes do
 * the same for what the server renders.
 */
import type { Store } from './state';
import { onChange, isPlaying } from './sound';
import { driveTo, deckOn, DECK_MQ, navH } from './drive-to';

const extraWatch = new Set<HTMLElement>();
const extraCta = new Set<HTMLElement>();
let refresh: (() => void) | null = null;

/** the SOUND key (sound off) and the cart FAB step aside while `el` passes under them */
export function watch(el: HTMLElement) { extraWatch.add(el); refresh?.(); }
/** an ask zone: the phone bar steps away while `el` is on screen (and the SOUND key / FAB step aside over it) */
export function ctaZone(el: HTMLElement) { extraCta.add(el); refresh?.(); }

/** A link to the ask (the phone bar's key, the line under the manual): one mover (stops Lenis's own anchor handling)
 *  to the NEARER sign-up form (beside the closer the plate is a 6,700 px trip back up), then its field takes focus.
 *  Without JS, or once both forms are gone (a sign-up), the link's own href is left alone. */
export function driveToAsk(page: HTMLElement, e: MouseEvent) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const away = (f: HTMLElement) => { const r = f.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - innerHeight / 2); };
  const form = [...page.querySelectorAll<HTMLFormElement>('form[data-wb-cta]')].filter((f) => !f.hidden)
    .reduce<HTMLFormElement | null>((a, b) => (!a || away(b) < away(a) ? b : a), null);
  if (!form) return;
  e.preventDefault(); e.stopPropagation();
  const field = form.querySelector<HTMLInputElement>('input[type="email"]');
  driveTo(form, { align: 'face', onArrive: () => field?.focus({ preventScroll: true }) });
}

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

  let raf = 0, lastDy = 0, lastAside = false, lastY = scrollY;
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
  // setBar too: its height decides whether the bar may show at all (tooTall); `setBar` is declared below, read at call time
  if (bar) new ResizeObserver(() => { barH = bar.offsetHeight; setBar(); setLift(); }).observe(bar, { box: 'border-box' });

  // ── the phone bar ──
  const hits = new Set<Element>();
  let typing = false;
  // the dash on an upright phone (the deck, D7 B): its controls run the full width down to the bottom edge, where the
  // bar sits (stage 4, i04: at the drive's landing the bar covered HIGH BEAM, MONO, SIDE, POWER at 390x844 and LOW FOCUS,
  // MIX, REACH at 360x740). So while the visitor DRIVES the deck (a drive landed on the dash, an act on one of its
  // controls, or the focus inside #wb-drive) the bar leaves, until the dash is off screen. A visitor only scrolling past
  // keeps the ask (G9: leaving over the whole dash cost 12 of 50 scroll steps at 390, 62 % against the 80 % floor).
  // An act counts as sound.ts counts one: a mouse on press, a finger on release (a scroll swipe that starts on a control
  // ends in pointercancel, never a release), and only on a control ([data-wb-demo]).
  const dashSec = page.querySelector<HTMLElement>('#wb-drive');
  let dashOn = false, driving = false;
  const drive = () => { if (dashOn && deckOn() && !driving) { driving = true; setBar(); } };
  const onControl = (e: Event) => !!(e.target as Element | null)?.closest?.('[data-wb-demo]');
  if (dashSec) {
    new IntersectionObserver(([e]) => { dashOn = e.isIntersecting; if (!dashOn) driving = false; setBar(); }).observe(dashSec);
    dashSec.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && onControl(e)) drive(); }, true);
    dashSec.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse' && onControl(e)) drive(); }, true);
    dashSec.addEventListener('input', (e) => { if (onControl(e)) drive(); }, true); // a screen reader's adjust on a deck knob
    dashSec.addEventListener('focusin', drive);
    window.addEventListener('wb:drive', (e) => { const d = (e as CustomEvent).detail; if (d?.phase === 'arrive' && d.face) drive(); });
  }
  // a bar that would take over 40 % of the room under the nav hides the page it points into (a laptop at 400 % zoom,
  // 285x159: even the key alone is 60 of the 115 px under the nav), so it stays away there (r-asks-zoombar)
  const tooTall = () => {
    const nav = navH();
    return barH > (innerHeight - nav) * 0.4;
  };
  const setBar = () => {
    if (!bar) return;
    const away = hits.size > 0 || typing || html.hasAttribute('data-wb-joined') || (driving && dashOn && deckOn()) || tooTall();
    bar.classList.toggle('is-away', away);
    const up = !away && barMq.matches;
    if (up !== barUp) { barUp = up; setLift(); }
  };
  let barIo: IntersectionObserver | null = null;
  const observeBar = () => {
    barIo?.disconnect(); hits.clear();
    if (!bar) return;
    // a sign-up form counts by its key while the key is whole on screen (a key half under the edge is no ask; the bar
    // carries it there: DriftStickyBar's phone rule), and by its email field while any of the field is on screen: the
    // closer's field enters from the bottom edge, under the bar, and a tap on it landed on the bar's key
    const keyOf = new Map<Element, true>();
    barIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const on = keyOf.has(e.target) ? e.intersectionRatio >= 0.98 : e.isIntersecting;
        if (on) hits.add(e.target); else hits.delete(e.target);
      }
      setBar();
    // (the band under the nav: a field or key behind the nav is not on screen; Dan's page map, 2026-11-22, put the plate
    // right above the manual, and its field under the nav held the bar away there)
    }, { threshold: [0, 1], rootMargin: `-${Math.round(navH())}px 0px 0px 0px` });
    // the manual in stand-by (no film yet: no player to clear, the frame shows one line): the bar stays up over its
    // frame and the line under it (Dan's page map, 2026-11-22: without the road the manual was 5 of the phone's 26
    // scroll steps with no ask in view, G9). With a film, both hold the bar away again.
    const standby = !page.querySelector('[data-wb-manual-glass][data-film]');
    const skip = (z: HTMLElement) => standby && (z.matches('.wb-manual-frame, [data-wb-manual-line]'));
    const zones = [...ctas(), ...manuals(), ...(footer ? [footer] : [])].filter((z) => !skip(z)).flatMap((z) => {
      if (!z.matches('form')) return [z];
      const k = z.querySelector<HTMLElement>('[type="submit"]'), f = z.querySelector<HTMLElement>('input[type="email"]');
      if (k) keyOf.set(k, true);
      return k || f ? [k, f].filter((x): x is HTMLElement => !!x) : [z];
    });
    zones.forEach((z) => barIo!.observe(z));
  };
  const emailField = (t: EventTarget | null) => t instanceof HTMLInputElement && t.type === 'email' && page.contains(t);
  document.addEventListener('focusin', (e) => { typing = emailField(e.target); setBar(); schedule(); });
  document.addEventListener('focusout', () => { typing = false; setBar(); schedule(); });
  new MutationObserver(setBar).observe(html, { attributes: true, attributeFilter: ['data-wb-joined'] });
  window.addEventListener('pageshow', (e) => { if ((e as PageTransitionEvent).persisted) observeBar(); }); // Safari bfcache
  barMq.addEventListener('change', () => { setBar(); setLift(); });
  matchMedia(DECK_MQ).addEventListener('change', () => setBar()); // a phone turned: the deck comes or goes
  // the bar's key: one mover (stop Lenis's own anchor handling), to the NEARER sign-up form (beside the closer it was a
  // 6,700 px trip back up to the plate), then the field takes focus. Without JS its href goes to the plate.
  bar?.querySelector<HTMLAnchorElement>('[data-wb-bar-key]')?.addEventListener('click', (e) => driveToAsk(page, e));

  // ── the SOUND key and the FAB: where they may sit ──
  const overlaps = (a: DOMRect, b: DOMRect, pad = 0) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  const visibleRect = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight ? r : null; };
  // the key's resting corner, read from a twin with the key's right / bottom / translate and no transition (furniture.css):
  // the key's own box is a value in between while it glides on the stack (the bar leaving at the footer), and
  // a ride measured from it put the key over the footer's links once the glide ended
  const homeOf = key ? Object.assign(document.createElement('i'), { className: 'wb-sound-home' }) : null;
  if (key && homeOf) { homeOf.setAttribute('aria-hidden', 'true'); key.after(homeOf); }
  function place() {
    raf = 0;
    if (key && homeOf) {
      // the key's home: where its CSS puts it at rest, without the ride / aside offset or the glide
      const w = key.offsetWidth, h = key.offsetHeight;
      const corner = homeOf.getBoundingClientRect();
      const home = new DOMRect(corner.right - w, corner.bottom - h, w, h);
      const nav = navH();
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
      // a ride the scroll made follows it at once: the page under the key moved with the scroll (a glide from the old
      // place crossed the footer's links after a jump to the end). One the scroll didn't make glides: the stack (the
      // same .28 s curve as the key's own glide on the stack (`translate`), so riding the footer the two mostly cancel
      // while the bar leaves), a focused control, stepping aside
      const scrolled = Math.abs(scrollY - lastY) > 1;
      const glide = aside !== lastAside || (dy !== lastDy && !scrolled);
      key.classList.toggle('is-gliding', glide && !reduced);
      key.style.setProperty('--wb-sound-dy', dy + 'px');
      key.classList.toggle('is-aside', aside);
      lastDy = dy; lastAside = aside; lastY = scrollY;
    }
    if (fab && fabMq.matches) {
      const cs = getComputedStyle(fab);
      const w = fab.offsetWidth, h = fab.offsetHeight;
      const home = new DOMRect(parseFloat(cs.left) || 16, innerHeight - (parseFloat(cs.bottom) || 16) - h, w, h);
      let aside = false;
      // the phone deck too (the FAB only): its controls run down to the bottom-left corner, and the drive lands with
      // HIGH BEAM / LOW FOCUS under the FAB, where a tap opened the cart (stage 4, r-asks-fabdeck)
      const deck = deckOn() ? page.querySelector<HTMLElement>('[data-wb-deck]') : null;
      for (const el of [...watched(), ...asks(), ...(deck ? [deck] : []), ...(footer ? [footer] : [])]) {
        const wr = visibleRect(el);
        if (wr && overlaps(home, wr, 8)) { aside = true; break; }
      }
      html.classList.toggle('wb-fab-aside', aside);
    } else html.classList.remove('wb-fab-aside');
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { setBar(); setLift(); schedule(); });
  // a glide on the stack (the key's `translate`, the FAB's `bottom`) ends after the scroll has stopped: measure once more
  // at rest (the FAB reads its own bottom)
  for (const el of [key, fab]) el?.addEventListener('transitionend', (e) => { if (e.target === el && (e.propertyName === 'bottom' || e.propertyName === 'translate')) schedule(); });
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
