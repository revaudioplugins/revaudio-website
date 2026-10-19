/**
 * #hear's screen is a segment LCD (drift.css, "THE SCREEN"): every character cell shows its unlit segments. A
 * readout's ghost = its text with every character '~' (DSEG14 lights all 14 segments for it) except a colon, which
 * keeps its own narrow cell; the CSS paints it from data-g under the lit text. A readout opts in by carrying data-g
 * in the markup; any other element just gets its text.
 */
export const ghost = (s: string): string => s.replace(/[^:]/g, '~');

/** Write a readout's text (and its ghost). Returns false when nothing changed. */
export function lcdText(el: HTMLElement, s: string): boolean {
  if (el.textContent === s) return false;
  el.textContent = s;
  if (el.dataset.g !== undefined) el.dataset.g = ghost(s);
  return true;
}
