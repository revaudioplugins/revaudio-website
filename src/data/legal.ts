/**
 * Single source of truth for the legal-bundle version.
 * Displayed on /terms and /eula and in the checkout consent modal, and stamped
 * onto each order as a consent record (Paddle customData terms_version). Bump
 * this whenever /terms or the EULA changes — the version live at purchase time
 * is the one that binds.
 */
export const TERMS_LAST_UPDATED = '2026-10-07';

/** Date shown on the Privacy Policy. Kept apart from TERMS_LAST_UPDATED so a
 *  privacy-only change doesn't move the terms version stamped on orders. */
export const PRIVACY_LAST_UPDATED = '2026-10-07';
