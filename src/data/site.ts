/**
 * Site-wide config. One place for the small operational knobs.
 */

export const site = {
  /**
   * Cloudflare Web Analytics beacon token (free, cookieless, privacy-friendly).
   * How to get it: Cloudflare dashboard → Analytics & Logs → Web Analytics →
   * "Add a site" → enter revaudio.net → copy the token from the JS snippet
   * (the value of `"token": "..."`). Paste it below.
   *
   * The beacon token is public by design (it ships in the page), so committing
   * it here is fine. While this is empty, NO analytics script loads. Analytics
   * also only loads in production builds, never in `astro dev`.
   */
  cfBeaconToken: '',

  /**
   * Formspree endpoint for newsletter capture (bottom EmailCapture section +
   * the hero subscribe modal). GO-LIVE: create a free form at
   * https://formspree.io and replace the REPLACE_WITH_FORM_ID token. While the
   * token is in place, forms show an honest "goes live shortly" notice and
   * never pretend to capture.
   */
  formspreeEndpoint: 'https://formspree.io/f/maqzlgwa',

  /**
   * Launch sale marquee (site-wide sticky banner, mounted in BaseLayout).
   * Flip `active: false` to kill the banner everywhere in one move.
   * No countdown — honest "limited time" copy only.
   */
  launchSale: {
    active: true,
    pct: 40,
    code: 'VROOM',
    message: 'LAUNCH SALE — 40% OFF RevLimiter — Insert coupon code "VROOM" at checkout — LIMITED TIME',
  },
};
