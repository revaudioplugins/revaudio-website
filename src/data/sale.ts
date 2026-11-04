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
    bundleUsd: 74,
    endLabel: 'Monday, November 30, 23:59 Pacific',
    endShort: 'tonight, 23:59 PT',
  },
];

/** The home page's "Black Friday in…" countdown runs from here until Black Friday starts
 *  (Gil 2026-11-02: a week before). Preview: ?sale=soon. */
export const saleSoonFrom = '2026-11-20T00:00:00-08:00';

/** What the bundle holds. OBDTune comes out on Nov 22 if it isn't released by then
 *  (plan decision 3); every count on the site follows this list. */
export const saleBundlePlugins = ['RevLimiter', 'RevFX', 'Radio Roulette', 'GAS', 'GAS 2', 'DRIFT', 'OBDTune'];
export const saleBundleCount = saleBundlePlugins.length;

/** Where the bundle line points: the plugins page (the TV) until the bundle has its own
 *  place to buy it (Paddle bundle product). */
export const saleBundleUrl = '/plugins';
