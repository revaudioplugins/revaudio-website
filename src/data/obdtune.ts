/**
 * /obdtune commerce config: the one place the page reads its trial and buy state from (the src/data/widebeam.ts
 * pattern). OBDTUNE = the OBDTune repo (~/RevTune, branch obdtune-fx, 0.8.0), not released yet.
 *
 * Commerce (Gil 2026-11-19, Paddle product pro_01m7vhdsxv3arw74gkb1fe9fxp):
 *   - gateWired true: the trial form posts {email, plugin, marketing} to the worker's /download/register first, which
 *     emails the download at once, then joins the list via /form-once. The worker's DL_PLUGINS.obdtune opened with
 *     revlimiter-license 0f241f7; until /pit-lane ships the builds the email says "coming soon" per platform. The
 *     worker must be live before this page is, or the register call has no gate.
 *   - priceUsd + paddlePriceId: BUY NOW adds to the cart and opens it. plugins.ts has the same id and price (the cart
 *     only checks out slugs it finds there), [slug].astro OWN_ROUTE has 'obdtune', and the plugins.ts entry has no
 *     `library`, so OBDTUNE stays off the home TV until it is meant to be listed.
 */
import { site } from './site';

export const obdtune = {
  slug: 'obdtune',
  name: 'OBDTUNE',
  trialDays: 30, // the plugin's LicenseManager: a silent 30-day trial from the first load
  priceUsd: 15 as number | null, // = the Paddle price ($15.00 USD)
  paddlePriceId: 'pri_01m7vhe769c8s1rsqs3c0f0xvm' as string | null, // keep equal to plugins.ts obdtune
  gateWired: true,
  gateId: 'obdtune',
  /** the Mac pkg ships AAX (Gil, 2026-11-19), same as WIDE BEAM */
  formats: 'Mac VST3 · AU · AAX · Windows VST3',
};

/** BUY NOW adds to the cart only when Paddle has a price for it */
export const buyable = () => obdtune.priceUsd != null && !!obdtune.paddlePriceId;
export const registerUrl = () => (obdtune.gateWired ? site.downloadGate.workerUrl + '/download/register' : null);
export const onceUrl = () => site.downloadGate.workerUrl + '/form-once';
export const fmtUsd = (v: number) => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
