/**
 * /revfx page config: the one place the RevFX page reads its state from (the src/data/drift.ts pattern).
 *
 * RevFX = DRIFT's FX rack sold on its own (RevFX repo HANDOFF.md, 1.2.0 synced to DRIFT 5.2.10): GLUE COMP,
 * PITCH, ECHO, REVERB, HALO, RANDOMIZE, SNAPSHOT A-D + DICE LOG, FX MIX, FX POWER, the draggable chain. No
 * panner, no band split: the rack runs on the whole stereo input. Every claim on the page is checked against
 * RevFX Source/PluginProcessor.cpp (parameter ranges) and the plugin UI's own tips.
 *
 * Commerce (2026-10-14): nothing is wired yet, so the page ships in a state that promises only what works.
 *   - gateWired false: the trial forms post to the worker's /form-once (the newsletter relay, source
 *     'revfx-trial'); the copy says the download link comes by email, not "now". Flip true once the
 *     revlimiter-license worker has DL_PLUGINS.revfx + the R2 builds: the forms then post to
 *     /download/register and the link goes out at once (capture.ts, as on /drift).
 *   - priceUsd null: no price shows anywhere. paddlePriceId null: no buy key. Both set = phase 'released'
 *     shows the buy key next to the trial (the build refuses 'released' without them).
 */
import { site } from './site';

export type RevfxPhase = 'trial' | 'released';

export const revfx = {
  phase: 'trial' as RevfxPhase,
  trialDays: 30,             // RevFX LicenseManager: REVFX_TRIAL_ENABLED, 30-day silent trial
  priceUsd: null as number | null,
  paddlePriceId: null as string | null,
  /** the licence worker's download gate knows 'revfx' (DL_PLUGINS) */
  gateWired: false,
  gateId: 'revfx',
  /** RevFX 1.2.0 ships Mac only (packaging/ = the Mac pipeline; no PACE wcguid yet, so no AAX) */
  aaxReady: false,
  winReady: false,
  version: '1.2.0',
  /** true = RevFX shows in the homepage carousel and the store; false = only the /revfx page is live (Gil 2026-10-18:
   *  "keep the page link live for now") */
  listed: false,
};

export const formatsMac = () => (revfx.aaxReady ? 'VST3 · AU · AAX' : 'VST3 · AU');
export const compatRows = () => [
  { k: 'MAC', v: `${formatsMac()} · macOS 10.13+ · Apple silicon + Intel` },
  { k: 'WIN', v: revfx.winReady ? 'VST3 · 64-bit · needs WebView2' : 'Not yet' },
];

/** The five, in the plugin's default chain (PITCH, ECHO, REVERB, HALO in slots 0-3, GLUE COMP place 4 = last).
 *  ink / rgb = each strip's own lamp colour (rack.json, the dice-log dots). Specs: PluginProcessor.cpp ranges. */
export const pedals = [
  {
    id: 'pitch', name: 'Pitch', kana: 'ピッチ', ink: '#cfe0ff', rgb: '168, 200, 255',
    line: 'Up or down an octave.',
    pitch: 'Shift the whole sound up to 12 semitones either way, with its own formant control, so a voice goes deep or high without turning into a cartoon. Blend it under the dry for a harmony layer.',
    specs: ['±12 semitones', 'Formant ±12', 'Mix'],
    knob: { label: 'PITCH', param: 'PITCH_ST', from: 0, to: 1, fmt: (v: number) => { const st = Math.round(v * 24 - 12); return `${st > 0 ? '+' : ''}${st} st`; } },
  },
  {
    id: 'echo', name: 'Echo', kana: 'エコー', ink: '#ff5fd9', rgb: '255, 79, 216',
    line: 'Synced, tape-dark to clean.',
    pitch: 'Lock the repeats to your song from a whole note to a 1/32 (dotted and triplet too), or set them free from 20 ms to 2 s. Character runs from dark tape to clean digital, with ping-pong, width, wobble and a duck that keeps the repeats out of the singer’s way.',
    specs: ['1/1 to 1/32 · dotted · triplet', 'Free 20 ms – 2 s', 'Ping-pong', 'Wobble', 'Duck'],
    knob: { label: 'FEEDBACK', param: 'DLY_FEEDBACK', from: 0.08, to: 0.92, fmt: (v: number) => `${Math.round(v * 100)}%` },
  },
  {
    id: 'reverb', name: 'Reverb', kana: 'リバーブ', ink: '#c79bff', rgb: '196, 139, 255',
    line: 'Room, plate, hall. Plus shimmer.',
    pitch: 'Three spaces: room, plate and hall. Decay free or in beats, up to 200 ms of predelay, a brightness control, a shimmer that adds octave air on top, and a duck so the tail blooms in the gaps.',
    specs: ['Room · Plate · Hall', 'Predelay 0 – 200 ms', 'Decay in beats', 'Shimmer', 'Duck'],
    knob: { label: 'DECAY', param: 'VERB_DECAY', from: 0.05, to: 1, fmt: (v: number) => `${Math.round(v * 100)}%` },
  },
  {
    id: 'halo', name: 'Halo', kana: 'ハロー', ink: '#6dff9a', rgb: '77, 255, 138',
    line: 'Wide, airy glow. No tails.',
    pitch: 'A ring of light around the sound: two short modulated lines that breathe against each other, so the source gets wide and shiny without a wash. Four modes from slow and subtle to fast and wide. It never touches the dry.',
    specs: ['4 modes', 'Size', 'Tone', 'Mix'],
    knob: { label: 'SIZE', param: 'HALO_SIZE', from: 0, to: 1, fmt: (v: number) => `${Math.round(v * 100)}%` },
  },
  {
    id: 'glue', name: 'Glue Comp', kana: 'グルー', ink: '#6fe8ff', rgb: '111, 232, 255',
    line: 'Bus glue, anywhere in line.',
    pitch: 'A console-style bus compressor: 2:1, 4:1 or 10:1, stepped attack and release (with Auto), makeup, mix for parallel glue, a soft clip and a sidechain high-pass so the low end doesn’t pump it. Last in line by default, or drag it anywhere.',
    specs: ['2:1 · 4:1 · 10:1', 'Attack 0.01 – 30 ms', 'Release 0.1 s – Auto', 'Soft clip', 'SC HPF'],
    knob: { label: 'THRESHOLD', param: 'GLUE_THRESH', from: 1, to: 0.2, fmt: (v: number) => `${(v * 40 - 40).toFixed(0)} dB` },
  },
] as const;

export type PedalId = (typeof pedals)[number]['id'];

/** Where the sign-up forms post: the worker's /download/register once it knows RevFX, else undefined (the
 *  /form-once list relay only). */
export const registerUrl = (): string | undefined =>
  revfx.gateWired ? site.downloadGate.workerUrl + '/download/register' : undefined;

export const captureCopy = () => (revfx.gateWired
  ? { source: 'revfx-trial', ok: "You're in. Download on its way by email.", already: 'Already on our list. Email info@revaudio.net, subject REVFX TRIAL, and we send it.', fine: 'Download by email. Open it on a Mac. You join our list · unsubscribe anytime.' }
  : { source: 'revfx-trial', ok: "You're in. The download link comes to this inbox.", already: 'Already on our list. Email info@revaudio.net, subject REVFX TRIAL, and we send it.', fine: 'The download link comes by email. Open it on a Mac. You join our list · unsubscribe anytime.' });

export const buyable = () => revfx.phase === 'released' && !!revfx.paddlePriceId && revfx.priceUsd != null;

export function assertRevfxConfig(): void {
  if (revfx.phase === 'released' && !buyable())
    throw new Error("[revfx.ts] phase 'released' needs priceUsd and paddlePriceId.");
}
