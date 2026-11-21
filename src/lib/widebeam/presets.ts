/**
 * /widebeam glove box (lane S): a card drives the page up to the dash (driveTo, align 'face') and loads its preset on
 * arrival, so the visitor sees the knobs glide (motion-09; lane D owns when onArrive fires and the glide itself). Then
 * focus moves to the face's preset control without a scroll, so Tab carries on at the dash (a11y-08); on an upright
 * phone a keyboard pick then brings the deck's control into view (bringUp below, r-road-handoff). The cards'
 * is-on / aria-pressed mirror the store, so the console's PRESET ‹ › and the face's own ‹ › keep them right too.
 * The lane drags sideways with a mouse; touch scrolls it natively.
 */
import type { Store } from './state';
import type { Face } from './face';
import { driveTo, driveDestination } from './drive-to';
import { lenis, reducedMotion } from '../motion';

// a keyboard pick's hand-off on an upright phone: the drive lands the face at the top and the deck's "Next preset" under
// it can sit below the fold (preventScroll then leaves the focus ring off screen; the face is inert there, D7 B). Then
// bring the deck's rows from that control down to its last key up into the band between the nav and the bottom stack
// (the phone bar / --wb-lift, and the page's scroll-padding-bottom, which is what the browser's own Tab scroll uses), so
// the focus ring shows and the next Tabs (the TRACK keys) need no jump. By a number through the page's Lenis (instant
// under reduced motion). On a laptop the face's control is already in the band: nothing moves.
function bringUp(c: HTMLElement) {
  const html = document.documentElement, cs = getComputedStyle(html);
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  const top = (nav ? Math.max(0, nav.getBoundingClientRect().bottom) : parseFloat(cs.getPropertyValue('--nav-h')) || 44) + 12;
  let lift = Math.max(parseFloat(cs.getPropertyValue('--wb-lift')) || 0, parseFloat(cs.scrollPaddingBottom) || 0);
  const bar = document.querySelector<HTMLElement>('[data-wb-bar]');
  if (bar && getComputedStyle(bar).display !== 'none') lift = Math.max(lift, bar.offsetHeight);
  const bottom = innerHeight - lift - 12;
  const g = (c.closest<HTMLElement>('[role="group"]') ?? c).getBoundingClientRect();
  if (g.top >= top && g.bottom <= bottom) return; // in the band already (the laptop's face)
  const last = [...(c.closest('[data-wb-deck]')?.querySelectorAll<HTMLElement>('button, input, a[href]') ?? [])].pop();
  const end = Math.max(g.bottom, last ? last.getBoundingClientRect().bottom : 0);
  const dy = end > bottom ? Math.min(end - bottom, g.top - top) : g.top - top;
  if (Math.abs(dy) < 1) return;
  const to = Math.max(0, Math.min(html.scrollHeight - innerHeight, scrollY + dy));
  if (lenis && !reducedMotion()) lenis.scrollTo(to, { duration: 0.5, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
  else window.scrollTo({ top: to, behavior: 'instant' as ScrollBehavior });
}

// after a preset load, the face's preset control takes focus (the face's glide runs ~0.5 s; focus after it, so a screen
// reader hears the new name in its place), unless the visitor has moved focus since the click. [data-wb-preset-focus]
// is the hook asked of lane D; "Next preset" today.
// Integration (stage 4): face.root.querySelector alone handed focus to the inert face on a phone, a silent no-op.
const GLIDE_MS = 600;

export function initPresets(page: HTMLElement, store: Store, face: Face, dash: HTMLElement | null) {
  const cards = [...page.querySelectorAll<HTMLButtonElement>('[data-preset]')];
  const sync = () => cards.forEach((x) => {
    const on = Number(x.dataset.preset) === store.preset && !store.edited;
    x.classList.toggle('is-on', on);
    x.setAttribute('aria-pressed', String(on));
  });
  // the store also tells a load that moves no knob (Default -> Factory Cruise: a new name), so this alone keeps the cards
  // right, on the phone too (state.ts `told`)
  store.on(sync);
  sync();

  // the first "Next preset" a visitor can reach: the face's, or on an upright phone (the face is inert there, D7 B)
  // the deck's, or the console's
  const reachable = (el: HTMLElement) => el.getClientRects().length > 0 && !el.closest('[inert]');
  const presetControl = () =>
    [...page.querySelectorAll<HTMLElement>('[data-wb-preset-focus], [aria-label="Next preset"]')].find(reachable) ?? null;

  // one pick at a time: the last click wins; if the arrival never comes (a visitor wheels mid-glide and Lenis drops its
  // onComplete), the preset still loads after the longest drive (1.2 s) and a margin
  // the focus move is only for a visitor who has not moved focus since the click: once they put it anywhere else (grab
  // WIDTH as the face lands, go to type in a field), it stays there. "Since the click" = the card, or whatever the click
  // left focused (Safari focuses no button on a click: focus lands on <main tabindex=-1>)
  let want = -1, fallback = 0, picked: (Element | null)[] = [], byKey = false;
  const untouched = () => { const a = document.activeElement; return !a || a === document.body || picked.includes(a); };
  const load = (i: number) => {
    if (want !== i) return;
    want = -1; clearTimeout(fallback);
    face.loadPreset(i);
    // where the drive left the page, and whether that is where it aimed (the dash): a visitor who took over mid-drive
    // (the arrival fires where they stopped, drive-to.ts) or scrolls on before the focus move keeps their place and their
    // focus. A focus moved to a control far off screen would make the next Space step the preset out of sight and the
    // next Tab pull the page back (r-road-focusaway); the hand-off is only for a visitor still at the dash.
    const key = byKey, landed = scrollY;
    // (40 px of slack: a late layout shift or a nudge at the end still counts as at the dash)
    const atDash = !dash || Math.abs(landed - driveDestination(dash, 'face').y) < 40;
    setTimeout(() => {
      if (!atDash || Math.abs(scrollY - landed) >= 3 || !untouched()) return;
      const c = presetControl();
      if (!c) return;
      c.focus({ preventScroll: true });
      if (key) bringUp(c);
    }, GLIDE_MS);
  };
  cards.forEach((b) => b.addEventListener('click', (e) => {
    const i = Number(b.dataset.preset);
    // a pick made with Enter / Space (or a screen reader's activate) clicks with detail 0; a tap or a mouse click says 1+
    want = i; picked = [b, document.activeElement]; byKey = e.detail === 0;
    clearTimeout(fallback);
    if (!dash) { load(i); return; }
    fallback = window.setTimeout(() => load(i), 1600);
    driveTo(dash, { align: 'face', onArrive: () => load(i) });
  }));

  const lane = page.querySelector<HTMLElement>('[data-wb-lane]');
  if (lane) {
    // Tab along the lane: Chrome leaves a focused card that is already partly in the lane where it is (a sliver of it and
    // its ring at the edge), so the lane brings it in whole itself, sideways only (the page never moves), to the next card
    // start (the snap points), with the lane's own 14 px of room so the ring clears. Keyboard focus only: a mouse focuses
    // the card it presses, and moving the lane under the pointer would break the drag and the click.
    // Measured and started two frames after the focus: WebKit's own focus handling cancels a smooth scroll started inside
    // focusin (the card stayed a 35 % sliver in Safari, r-road-lanewebkit), and by then its own focus scroll, if any, has
    // already moved the lane, so a card it brought in whole is left alone.
    const bringIn = (c: HTMLElement) => {
      if (document.activeElement !== c) return;
      const pad = 14, L = lane.getBoundingClientRect(), r = c.getBoundingClientRect();
      const over = r.right + pad - L.right, under = r.left - pad - L.left;
      if (over <= 0 && under >= 0) return; // whole already
      // the snap points (each card's start at the lane's scroll-padding), and the nearest one that shows this card whole
      const snaps = cards.map((x) => lane.scrollLeft + x.getBoundingClientRect().left - L.left - pad);
      const max = lane.scrollWidth - lane.clientWidth;
      const need = lane.scrollLeft + (over > 0 ? over : under);
      const to = over > 0 ? (snaps.find((s) => s >= need - 1) ?? max) : ([...snaps].reverse().find((s) => s <= need + 1) ?? 0);
      lane.scrollTo({ left: Math.max(0, Math.min(max, to)), behavior: reducedMotion() ? 'auto' : 'smooth' });
    };
    lane.addEventListener('focusin', (e) => {
      const c = e.target as HTMLElement;
      if (!c.matches?.('[data-preset]') || !c.matches(':focus-visible')) return;
      requestAnimationFrame(() => requestAnimationFrame(() => bringIn(c)));
    });
    // drag the lane sideways with a mouse; touch scrolls natively
    let x0 = 0, s0 = 0, down = false, moved = false;
    lane.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = lane.scrollLeft; });
    window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; lane.classList.add('is-grab'); } lane.scrollLeft = s0 - dx; });
    window.addEventListener('pointerup', () => { down = false; lane.classList.remove('is-grab'); });
    lane.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }
}
