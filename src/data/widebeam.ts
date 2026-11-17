/**
 * /widebeam commerce config: the one place the page reads its trial and buy state from (the src/data/revfx.ts
 * pattern). WIDE BEAM = revaudioplugins/WideBeam, a 1.0 candidate (not released, 2026-11-17).
 *
 * Nothing is wired yet (Gil 2026-11-17: "build it and keep it as a placeholder, this won't go live until I give you
 * an ID"), so the page ships in a state that promises only what works:
 *   - gateWired false: the trial form posts to the worker's /form-once (the newsletter relay, source
 *     'widebeam-trial') and says the download link comes by email when the trial opens. Flip true once the
 *     revlimiter-license worker has DL_PLUGINS.widebeam + the R2 builds: the form then posts {email, plugin, marketing}
 *     to /download/register first, which emails the download at once (as src/lib/drift/capture.ts does).
 *   - paddlePriceId / priceUsd null: BUY NOW shows as a placeholder that only explains. To go live: set both here,
 *     add a WideBeam entry to src/data/plugins.ts with the same paddlePriceId and regularPriceUsd (the cart only
 *     checks out slugs it finds there), add 'widebeam' to OWN_ROUTE in src/pages/[slug].astro, and keep it out of
 *     the home TV / store until it is meant to be listed (see how revfx.ts `listed` does it).
 */
import { site } from './site';

export const widebeam = {
  slug: 'widebeam',
  name: 'WIDE BEAM',
  trialDays: 30, // WideBeam README "Licence": a silent 30-day trial from the first load
  priceUsd: null as number | null,
  paddlePriceId: null as string | null,
  gateWired: false,
  gateId: 'widebeam',
};

/** BUY NOW adds to the cart only when Paddle has a price for it */
export const buyable = () => widebeam.priceUsd != null && !!widebeam.paddlePriceId;
export const registerUrl = () => (widebeam.gateWired ? site.downloadGate.workerUrl + '/download/register' : null);
export const onceUrl = () => site.downloadGate.workerUrl + '/form-once';
export const fmtUsd = (v: number) => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
