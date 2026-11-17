/**
 * One shared WIDE BEAM state for the whole page: the face, the audio, the hero road, the story and the preset strip all
 * read and write it. Factory bank from WideBeam Source/PresetManager.cpp (a preset loads what it does not list at its
 * default and switches MONO and SIDE off; it never touches POWER).
 */
import { DEFAULTS, type WbParams } from './audio';

export interface Preset { name: string; note: string; v: Partial<WbParams>; }

export const PRESETS: Preset[] = [
  { name: 'Default', note: 'Every control at its starting value.', v: {} },
  { name: 'Factory Cruise', note: 'The original WIDE BEAM starting point.', v: { width: 136 } },
  { name: 'Tight Lane', note: 'A restrained spread with a focused center.', v: { width: 40, focus: 250, mix: 65 } },
  { name: 'Center Line', note: 'Zero width with maximum low-focus setting.', v: { width: 0, focus: 1000 } },
  { name: 'Vocal Halo', note: 'A subtle starting point for vocal space.', v: { width: 70, focus: 320, mix: 45 } },
  { name: 'Acoustic Space', note: 'Moderate spread for acoustic arrangements.', v: { width: 90, focus: 180, mix: 60 } },
  { name: 'Clean Guitar', note: 'An open setting for clean guitar layers.', v: { width: 124, focus: 220, mix: 75 } },
  { name: 'Double Track', note: 'A broad setting for layered guitars.', v: { width: 170, focus: 350, mix: 85 } },
  { name: 'Drum Room', note: 'A balanced starting point for room tracks.', v: { width: 110, focus: 150, mix: 55 } },
  { name: 'Overhead Sky', note: 'Wide overhead space with higher low focus.', v: { width: 164, focus: 400, mix: 80 } },
  { name: 'Synth Boulevard', note: 'A broad setting for synth layers.', v: { width: 180, focus: 250, mix: 90 } },
  { name: 'Pad Panorama', note: 'Maximum spread for an expansive pad scene.', v: { width: 200, focus: 600 } },
  { name: 'Bass Anchor', note: 'Maximum low focus with moderate width.', v: { width: 80, focus: 1000, mix: 65 } },
  { name: 'Wide Chorus', note: 'A near-maximum setting for chorus sections.', v: { width: 190, focus: 450, mix: 75 } },
  { name: 'Night Drive', note: 'A spacious all-purpose starting point.', v: { width: 156, focus: 180, mix: 80 } },
  { name: 'Master Cruise', note: 'A restrained width and blend starting point.', v: { width: 60, mix: 35 } },
];

export const presetValues = (p: Preset): WbParams => ({
  ...DEFAULTS, width: DEFAULTS.width, focus: DEFAULTS.focus, mix: DEFAULTS.mix, tilt: 0, reach: DEFAULTS.reach, high: false, ...p.v, mono: false, side: false,
});

export type Source = 'face' | 'preset' | 'story' | 'key' | 'init';
type Listener = (s: WbParams, changed: Partial<WbParams>, src: Source) => void;

export interface Store {
  get(): WbParams;
  set(next: Partial<WbParams>, src: Source): void;
  on(fn: Listener): () => void;
  preset: number;
  edited: boolean;
}

export function createStore(): Store {
  let s: WbParams = { ...DEFAULTS };
  const fns = new Set<Listener>();
  const store: Store = {
    preset: 0,
    edited: false,
    get: () => s,
    set(next, src) {
      const changed: Partial<WbParams> = {};
      for (const k of Object.keys(next) as (keyof WbParams)[]) if (next[k] !== s[k]) (changed as any)[k] = next[k];
      if (!Object.keys(changed).length) return;
      s = { ...s, ...changed };
      if (src !== 'preset' && src !== 'init' && ['width', 'focus', 'mix', 'tilt', 'reach', 'high'].some((k) => k in changed)) store.edited = true;
      fns.forEach((f) => f(s, changed, src));
    },
    on(fn) { fns.add(fn); return () => fns.delete(fn); },
  };
  return store;
}
