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
};
