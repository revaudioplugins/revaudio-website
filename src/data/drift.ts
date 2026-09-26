/**
 * /drift page config — the one place the season page reads its state from.
 *
 * Phases (beta review H21/H23): the page never guesses the phase from the
 * clock; flipping `phase` is a one-line commit by the push owner.
 * Dates + prices = Dan's FINAL timeline (2026-09-24): beta opens Sat 10-10
 * 17:00 UTC, feedback + videos close Sat 10-24, release Sun 11-01, list $69,
 * $39 for beta drivers who complete the feedback.
 *
 * The CTA is NOT wired to TrialGateModal yet: the licence worker falls back
 * to RevLimiter for any gate id it doesn't know (wiki website-update gotcha),
 * so `drift` must exist in the worker's DL_PLUGINS before a button posts it.
 */
export type DriftPhase = 'preopen' | 'open' | 'closed' | 'released';

export const drift = {
  phase: 'preopen' as DriftPhase,

  betaOpensIso: '2026-10-10T17:00:00Z',
  betaOpensLabel: 'Sat Oct 10 · 17:00 UTC',
  betaClosesLabel: 'Sat Oct 24',
  releaseLabel: 'Sun Nov 1',
  listPriceUsd: 69,
  driverPriceUsd: 39,

  /** Gate id the licence worker will know DRIFT by (dlGateId contract). */
  gateId: 'drift',
  /** false until the worker has DL_PLUGINS.drift — then the CTA opens the gate. */
  gateWired: false,
  /** AAX is decided for the beta (Decision 7) but only builds when the SDK is
   *  present, and no AAX artefact exists yet — the page claims it when true. */
  aaxReady: false,

  /** 'test' = the browser-synth structure test (clearly labelled), 'real' =
   *  Dan's before/after bounces in public/audio/drift/, 'off' = no deck. */
  demoMode: 'test' as 'test' | 'real' | 'off',

  cta: {
    preopen: { label: 'Join the beta', sub: 'Opens Sat Oct 10 · 17:00 UTC · free' },
    open: { label: 'Get the beta', sub: 'Free while the beta runs · Mac & Windows' },
    closed: { label: 'Get notified', sub: 'The beta is closed. DRIFT lands Sun Nov 1.' },
    released: { label: 'Buy DRIFT · $69', sub: 'VST3 · AU · AAX · Mac & Windows' },
  } satisfies Record<DriftPhase, { label: string; sub: string }>,
};

export const ctaFor = (phase: DriftPhase = drift.phase) => drift.cta[phase];
