// Black Friday / Cyber Monday 2026 (plan: revaudio-website tasks/bfcm-2026-plan.html,
// decided with Gil 2026-10-26 / 11-02). The site is static, so the browser picks
// the live phase from these instants (BaseLayout head gate) and the skin follows:
// nobody has to push at midnight. All times US Pacific (PST, UTC-8 in late Nov).
//
// Preview before it is live: `npm run dev`, then open any page with ?sale=bf or
// ?sale=cm (?sale=off clears). Dev builds only; production ignores it.

export type SalePhaseId = 'bf' | 'cm';

export interface SalePhase {
  id: SalePhaseId;
  name: string;
  start: string; // ISO with offset
  end: string;   // exclusive
  pct: number;
  /** Paddle discount code. PLACEHOLDER until plan decision 7 (code names) is made. */
  code: string;
  bundleUsd: number;
  /** Shown to screen readers and as the countdown's plain-words end. */
  endLabel: string;
  /** The same end, short, for the intro's screen. */
  endShort: string;
}

export const salePhases: SalePhase[] = [
  {
    id: 'bf',
    name: 'Black Friday',
    start: '2026-11-27T00:00:00-08:00',
    end: '2026-11-30T00:00:00-08:00',
    pct: 50,
    code: 'REDLINE',
    bundleUsd: 69,
    endLabel: 'Sunday, November 29, 23:59 Pacific',
    endShort: 'Sun Nov 29, 23:59 PT',
  },
  {
    id: 'cm',
    name: 'Cyber Monday',
    start: '2026-11-30T00:00:00-08:00',
    end: '2026-12-01T00:00:00-08:00',
    pct: 40,
    code: 'CYBER40',
    bundleUsd: 69, // same bundle price as Black Friday (Gil 2026-11-17)
    endLabel: 'Monday, November 30, 23:59 Pacific',
    endShort: 'tonight, 23:59 PT',
  },
];

/** The "Black Friday in…" countdown runs on every page from here until Black Friday starts
 *  (Gil 2026-11-02: a week before; every page, not just home: Yoni 2026-11-22). Preview: ?sale=soon. */
export const saleSoonFrom = '2026-11-20T00:00:00-08:00';

/** What the bundle holds. OBDTune comes out on Nov 22 if it isn't released by then
 *  (plan decision 3); Wide Beam ($9) joined on Nov 17, same rule. Every count on the
 *  site follows this list. */
export const saleBundlePlugins = ['RevLimiter', 'RevFX', 'Radio Roulette', 'GAS', 'GAS 2', 'DRIFT', 'OBDTune', 'Wide Beam'];
export const saleBundleCount = saleBundlePlugins.length;

/** Where the bundle line points without JS: the plugins page (the TV). With JS the line is
 *  a buy button: it puts the bundle in the cart and opens it (Cart.astro). */
export const saleBundleUrl = '/plugins';

/** The bundle in the cart (Gil 2026-11-25): one Paddle price, $69 on both days. The licence
 *  worker's PADDLE_BUNDLE_PRICE (revlimiter-license) mints every paid plugin's key for it, so
 *  the two ids must match. Product pro_01m89q42p15tjnxjjbbbcw5v72. */
export const saleBundle = {
  slug: 'bundle',
  name: `RevAudio bundle (all ${saleBundleCount} plugins)`,
  paddlePriceId: 'pri_01m89s443rzzrxj4180yj2ny91',
  priceUsd: 69,
  formats: 'VST3 · AU · AAX',
  /** The cart drops it from here on (a bundle left in a cart after the sale can't be bought). */
  until: salePhases[salePhases.length - 1].end,
  /** The cart row's second line (where a single plugin says "1 licence · Digital download"). */
  meta: '6 licence keys in one email · GAS + GAS 2 free',
  /** The plugins it holds, as src/data/plugins.ts slugs, in saleBundlePlugins' order (the card under the TV,
   *  the cart's thumbnail). Every paid one is in it, so the cart swaps singles out for it. */
  slugs: ['revlimiter', 'revfx', 'radio-roulette', 'gas', 'gas2', 'drift', 'obdtune', 'widebeam'],
  /** The free ones: the cart's offer names only the paid plugins the bundle adds. */
  free: ['gas', 'gas2'],
  /** On the TV (WordWall.astro, Dan's pick A 2026-11-25): the BUNDLES tab, the bundle's channel, its page. */
  tv: {
    name: `All ${saleBundleCount} plugins`,
    short: `All ${saleBundleCount}`,
    blurb: `All ${saleBundleCount} in one order: 6 licence keys in one email.\nDRIFT’s release build comes free when it ships.`,
    /** the words line, the sale's end appended per phase */
    words: ['6 keys', 'GAS + GAS 2 free'],
  },
};
