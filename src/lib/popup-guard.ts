/**
 * Keeps the site's own pop-ups (the 10 % welcome, the exit-intent) off the home TV (TV walk P03, Dan 2026-11-04).
 * The walk: one Tab past the TV's last key scrolled the page to 35 % and the 10 % dialog opened with the keyboard
 * cursor in it; on a laptop it opened over a visitor still browsing. So a pop-up may open only when the TV is
 * mostly out of view, holds no focus, has had no press or key for QUIET_MS, and the scroll was not the keyboard's.
 * openWithFocusBack(): the dialog hands focus back to where it was when it closes.
 */
const TV_ID = 'plugins'; // the home TV's GarageWall
const QUIET_MS = 20000; // after the last press or key on the TV
const KEY_MS = 1500; // a scroll this soon after a key came from the keyboard (Tab, arrows, Space, Page Down)
const SEEN_MAX = 0.25; // the TV may fill at most this share of the view

let lastTv = -Infinity;
let lastKey = -Infinity;
const tv = () => document.getElementById(TV_ID);
const inTv = (n: EventTarget | null) => !!n && !!tv()?.contains(n as Node);

document.addEventListener('pointerdown', (e) => { if (inTv(e.target)) lastTv = performance.now(); }, { capture: true, passive: true });
document.addEventListener('keydown', (e) => {
  lastKey = performance.now();
  if (inTv(e.target)) lastTv = lastKey;
}, { capture: true });

export function popupMayOpen(): boolean {
  const now = performance.now();
  if (now - lastKey < KEY_MS) return false;
  const el = tv();
  if (!el) return true;
  if (el.contains(document.activeElement)) return false;
  if (now - lastTv < QUIET_MS) return false;
  const r = el.getBoundingClientRect();
  const seen = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
  return seen < window.innerHeight * SEEN_MAX;
}

export function openWithFocusBack(modal: HTMLDialogElement) {
  const back = document.activeElement as HTMLElement | null;
  modal.addEventListener('close', () => {
    if (back && back.isConnected && back !== document.body) back.focus({ preventScroll: true });
  }, { once: true });
}
