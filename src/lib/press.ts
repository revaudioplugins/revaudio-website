/**
 * Press feedback for the button family (src/styles/buttons.css): a quick tap
 * ends :active before a frame can show it, and iOS Safari skips :active
 * without a touch listener, so the pointer holds .is-pressed for >= 120ms.
 * One delegated listener for every .rv-btn, including ones added later.
 */
const MIN_MS = 120;

export function initPress(): void {
  const timers = new WeakMap<HTMLElement, number>();
  let btn: HTMLElement | null = null;
  let downAt = 0;

  const release = () => {
    const b = btn;
    if (!b) return;
    btn = null;
    const wait = Math.max(0, MIN_MS - (performance.now() - downAt));
    timers.set(b, window.setTimeout(() => b.classList.remove('is-pressed'), wait));
  };

  document.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element | null)?.closest?.<HTMLElement>('.rv-btn');
    if (!b || (b as HTMLButtonElement).disabled) return;
    clearTimeout(timers.get(b));
    btn = b;
    downAt = performance.now();
    b.classList.add('is-pressed');
  });
  for (const type of ['pointerup', 'pointercancel'] as const) document.addEventListener(type, release);
  document.addEventListener('pointerout', (e) => {
    if (btn && e.target === btn && !btn.contains(e.relatedTarget as Node | null)) release();
  });
}
