/**
 * THE GEARBOX: the bundle builder on /plugins (Yoni 2026-11-05; structure draft: claude.ai artifact
 * 5QpmHNjZy5JCLCKgbXsH1i). Every paid plugin you add moves the shift knob up a gear; each gear takes more off.
 * Component: src/components/Gearbox.astro. Art: tools/gearbox (gen.ps1 -> raw/, process_art.py -> src/assets/gearbox).
 *
 * MOCK CATALOG (Yoni 2026-11-05): DRIFT $69, RevFX $19 and OBDTune $15 are mock prices so the game has five paid
 * plugins to play with. They only exist in a dev server (`npm run dev`) or a build with PUBLIC_BUNDLE_MOCK=1; a
 * production build never carries them. Checkout is not wired yet (Paddle route: phase 2, needs Dan's + Gil's word).
 */
import { plugins, type Plugin } from './plugins';

export const BUNDLE_MOCK = import.meta.env.DEV || import.meta.env.PUBLIC_BUNDLE_MOCK === '1';

/** The gears. `min` = paid plugins in the bundle. The percentages are Yoni's draft numbers, not signed off. */
export interface Gear {
  id: 'N' | '1' | '2' | '3' | 'T';
  name: string;
  /** In the gear window (VT323). */
  win: string;
  min: number;
  pct: number;
}
export const GEARS: Gear[] = [
  { id: 'N', name: 'Neutral', win: 'N', min: 0, pct: 0 },
  { id: '1', name: '1st gear', win: '1ST', min: 1, pct: 0 },
  { id: '2', name: '2nd gear', win: '2ND', min: 2, pct: 20 },
  { id: '3', name: '3rd gear', win: '3RD', min: 3, pct: 30 },
  { id: 'T', name: 'TOP gear', win: 'TOP', min: 4, pct: 40 },
];

/** Mock prices (USD) while BUNDLE_MOCK is on. */
export const MOCK_PRICES: Record<string, number> = { drift: 69, revfx: 19, obdtune: 15 };

/** What a plugin counts for in the gearbox, or null when it can't go in (free, or not on sale). */
export function bundlePrice(p: Plugin): number | null {
  if (BUNDLE_MOCK && p.slug in MOCK_PRICES) return MOCK_PRICES[p.slug];
  if (p.isFree || p.status !== 'live' || !p.paddlePriceId || p.introPriceUsd == null) return null;
  return p.introPriceUsd;
}
export const isMockPrice = (slug: string) => BUNDLE_MOCK && slug in MOCK_PRICES;

/** The TV's mock channels (BUNDLE_MOCK only): RevFX with TV copy, and OBDTune, which has no product yet. */
export function mockTvPlugins(): Plugin[] {
  if (!BUNDLE_MOCK) return [];
  const revfx = plugins.find((p) => p.slug === 'revfx');
  if (!revfx) return [];
  const rfx: Plugin = {
    ...revfx,
    library: {
      cats: ['creative', 'reverb'],
      typeWord: 'effects rack',
      words: [
        { w: 'Wide', o: 0.5 },
        { w: 'Lush', o: 0.72 },
        { w: 'Rolled', o: 1, hot: true },
        { w: 'Shuffled', o: 0.72 },
        { w: 'Glued', o: 0.5 },
      ],
      blurb: 'Pitch, echo, reverb, halo and a glue compressor in one rack. Drag them into any order, or let the dice roll a scene.',
      alt: 'RevFX plugin window: five effect strips in one rack',
    },
  };
  const obd: Plugin = {
    ...revfx,
    slug: 'obdtune',
    name: 'OBDTune',
    heroImage: 'obdtune-mock.jpg',
    library: {
      cats: ['eq'],
      typeWord: 'mock plugin',
      words: [
        { w: 'Scan', o: 0.5 },
        { w: 'Read', o: 0.72 },
        { w: 'Tuned', o: 1, hot: true },
        { w: 'Clean', o: 0.72 },
        { w: 'Set', o: 0.5 },
      ],
      blurb: 'A mock channel for the gearbox: plug it into your mix like a scanner into the dash. Copy and window are placeholders.',
      alt: 'OBDTune mock window: a vintage diagnostic scanner faceplate',
    },
  };
  return [rfx, obd];
}

/**
 * Where things sit in the console photograph (src/assets/gearbox/console.jpg, 3072 x 1024 px), measured on a 50 px
 * grid off tools/gearbox/raw/console-a.png. The component turns these into percentages, so the parts stay on the
 * photo at any width.
 */
export const GEO = {
  w: 3072,
  h: 1024,
  /** The four shift-light lenses (green, green, amber, red) on the top strip. */
  lamps: [[233, 93], [390, 93], [533, 93], [678, 93]] as [number, number][],
  lampR: 30,
  /** The smoked-glass gear window beside them. */
  gearWin: { x: 820, y: 62, w: 242, h: 70 },
  /** The empty strip to the right: the price and the payment key. */
  strip: { x: 1130, y: 40, w: 1840, h: 104 },
  /** The top strip's bottom edge: what peeks into the first screen under the TV. */
  stripBottom: 150,
  /** The knob's centre at each gate: N, 1, 2, 3, TOP. The slots: x 460 / 743, y 260-760; the cross bar y 500. */
  gates: [[601, 500], [460, 318], [460, 702], [743, 318], [743, 702]] as [number, number][],
  knobD: 172,
  /** The stamps on the plate, beside each slot (1 / 2 left of the left slot, 3 / TOP right of the right one), clear
   *  of the screws and of the knob's reach. */
  stamps: [[336, 392], [336, 616], [868, 392], [868, 616]] as [number, number][],
  /** The tach: hub centre, the tick arc (-96 .. +96 deg = 0 .. 40 % off), the needle's reach, the hub cap. */
  tach: { cx: 1530, cy: 525, arc0: -96, arc1: 96, numR: 150, needleR: 200, hubR: 50 },
  /** The paper card under the clip: where the work order is typed. */
  paper: { x: 2128, y: 345, w: 672, h: 455 },
} as const;
