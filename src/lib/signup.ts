/**
 * The trial / free-download email sign-up, shared by its two forms (Home TV Phase 5 step 3, 2026-11-08):
 * TrialGateModal (the product pages' pop-up) and the home TV's sign-up on the screen (WordWall.astro).
 * POST {email, plugin, marketing, + how they found us} to the licence worker's /download/register; the worker mails
 * the verify link. A verified address leaves a 24 h gate token per plugin (the worker's DL_RETURN_TTL), so the
 * Mac / Windows keys come back without a second email.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** POST a JSON body; resolves the worker's JSON answer ({ok, error?}), rejects on a network or non-JSON failure, and
 *  after 15 s with no answer (a stalled mobile line left "Sending…" up for good: TV QA N8, 2026-11-11), so both forms
 *  show their network message and give the key back. */
export const postJson = (url: string, body: object, ms = 15000): Promise<{ ok?: boolean; error?: string } | null> => {
  const ctl = new AbortController();
  const timer = window.setTimeout(() => ctl.abort(), ms);
  return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal })
    .then((r) => r.json())
    .finally(() => window.clearTimeout(timer));
};

/** The body plus how the person reached us (Cart.astro's raSaleSource: channel + campaign / referring host, no click
 *  ids), stored on the trial lead. */
export function withSource<T extends object>(body: T): T {
  try {
    const src = (window as unknown as { raSaleSource?: () => object }).raSaleSource;
    if (src) Object.assign(body, src());
  } catch (e) { /* no source note: the lead goes without it */ }
  return body;
}

/** The registration really happened (never a click on a key that might be abandoned): the exit pop-up's "already got
 *  it" keys off this. */
export const announce = (plugin: string) => document.dispatchEvent(new CustomEvent('tg:registered', { detail: { plugin } }));

// the gate token, per plugin, for the worker's 24 h; localStorage, guarded (private mode may throw)
const GATE_TTL_MS = 24 * 3600 * 1000;
const gateKey = (id: string) => 'tg:gate:' + id;
export function saveGate(id: string, gate: string) {
  try { localStorage.setItem(gateKey(id), JSON.stringify({ gate, exp: Date.now() + GATE_TTL_MS })); } catch (e) { /* this visit only */ }
}
export function loadGate(id: string): string {
  try {
    const rec = JSON.parse(localStorage.getItem(gateKey(id)) || 'null');
    if (rec && rec.gate && rec.exp > Date.now()) return rec.gate;
    if (rec) localStorage.removeItem(gateKey(id));
  } catch (e) { /* storage blocked: nothing saved */ }
  return '';
}
export function clearGate(id: string) {
  try { localStorage.removeItem(gateKey(id)); } catch (e) { /* nothing to clear */ }
}
