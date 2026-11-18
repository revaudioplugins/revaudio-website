/** /widebeam letter keys (lane D): H high beam, M mono, S side, P power, [ ] presets (never while typing). */
import { PRESETS, type Store } from './state';
import type { Face } from './face';

export function initKeys(store: Store, face: Face) {
  // keys: H high beam, M mono, S side, P power, [ ] presets (never while typing)
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    const s = store.get();
    const act: Record<string, () => void> = {
      h: () => store.set({ high: !s.high }, 'key'), m: () => store.set({ mono: !s.mono }, 'key'),
      s: () => store.set({ side: !s.side }, 'key'), p: () => store.set({ power: !s.power }, 'key'),
      ']': () => face.loadPreset((store.preset + 1) % PRESETS.length), '[': () => face.loadPreset((store.preset + PRESETS.length - 1) % PRESETS.length),
    };
    const f = act[e.key.toLowerCase()];
    if (f) { f(); }
  });
}
