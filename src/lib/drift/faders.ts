/**
 * #drive faders (INTENSITY / SPEED, Dan 2026-10-02 layout B): the plugin's
 * vertical fader as a real role="slider". Up = more. Drag the slot or the cap
 * (only the slot blocks page scroll on touch), arrows step 1 %, PageUp/Down
 * 10 %, Home/End jump to the ends, double-click resets to the default.
 * The value is 0..1; the caller maps it (INTENSITY %, SPEED lap time).
 */
export interface Fader { value: () => number; set: (v: number, fire?: boolean) => void }

export function initFader(slot: HTMLElement, def: number, text: (v: number) => string, onInput: (v: number) => void): Fader {
  const fill = slot.querySelector<HTMLElement>('.d-fad-fill');
  const thumb = slot.querySelector<HTMLElement>('.d-fad-thumb');
  let v = def;

  const set = (next: number, fire = true) => {
    v = Math.min(1, Math.max(0, next));
    const pct = `${(v * 100).toFixed(2)}%`;
    if (fill) fill.style.height = pct;
    if (thumb) thumb.style.bottom = pct;
    slot.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    slot.setAttribute('aria-valuetext', text(v));
    if (fire) onInput(v);
  };
  const fromY = (y: number) => { const r = slot.getBoundingClientRect(); return 1 - (y - r.top) / r.height; };

  slot.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    slot.focus({ preventScroll: true });
    slot.setPointerCapture(e.pointerId);
    set(fromY(e.clientY));
    const move = (ev: PointerEvent) => set(fromY(ev.clientY));
    const up = () => { slot.removeEventListener('pointermove', move); slot.removeEventListener('pointerup', up); slot.removeEventListener('pointercancel', up); };
    slot.addEventListener('pointermove', move);
    slot.addEventListener('pointerup', up);
    slot.addEventListener('pointercancel', up);
  });
  slot.addEventListener('keydown', (e) => {
    const step: Record<string, number> = { ArrowUp: 0.01, ArrowRight: 0.01, ArrowDown: -0.01, ArrowLeft: -0.01, PageUp: 0.1, PageDown: -0.1 };
    if (e.key in step) set(v + step[e.key]);
    else if (e.key === 'Home') set(0);
    else if (e.key === 'End') set(1);
    else return;
    e.preventDefault();
  });
  slot.addEventListener('dblclick', () => set(def));

  set(def, false);
  return { value: () => v, set };
}
