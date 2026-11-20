/**
 * /widebeam commerce config: the one place the page reads its trial and buy state from (the src/data/revfx.ts
 * pattern). WIDE BEAM = revaudioplugins/WideBeam, a 1.0 candidate (not released, 2026-11-17).
 *
 * Commerce (Gil 2026-11-19, Paddle product pro_01m7vhb719rzqnagt7vmm03kwh):
 *   - gateWired true: the trial form posts {email, plugin, marketing} to the worker's /download/register first, which
 *     emails the download at once (as src/lib/drift/capture.ts does), then joins the list via /form-once. The worker's
 *     DL_PLUGINS.widebeam opened with revlimiter-license 0f241f7; until /pit-lane ships the builds the email says
 *     "coming soon" per platform. The worker must be live before this page is, or the register call has no gate.
 *   - priceUsd + paddlePriceId: BUY NOW adds to the cart and opens it. plugins.ts has the same id and price (the cart
 *     only checks out slugs it finds there), [slug].astro OWN_ROUTE has 'widebeam', and the plugins.ts entry has no
 *     `library`, so WIDE BEAM stays off the home TV until it is meant to be listed.
 */
import { site } from './site';

export const widebeam = {
  slug: 'widebeam',
  name: 'WIDE BEAM',
  trialDays: 30, // WideBeam README "Licence": a silent 30-day trial from the first load
  priceUsd: 9 as number | null, // = the Paddle price ($9.00 USD)
  paddlePriceId: 'pri_01m7vhcdt6t1dtpbyn9g1mx00m' as string | null, // keep equal to plugins.ts widebeam
  gateWired: true,
  gateId: 'widebeam',
};

/** BUY NOW adds to the cart only when Paddle has a price for it */
export const buyable = () => widebeam.priceUsd != null && !!widebeam.paddlePriceId;
export const registerUrl = () => (widebeam.gateWired ? site.downloadGate.workerUrl + '/download/register' : null);
export const onceUrl = () => site.downloadGate.workerUrl + '/form-once';
export const fmtUsd = (v: number) => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
