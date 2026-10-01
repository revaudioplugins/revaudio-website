/**
 * /drift page config — the one place the season page reads its state from.
 *
 * Phases (beta review H21/H23): the page never guesses the phase from the
 * clock; flipping `phase` is a one-line commit by the push owner, plus flags.
 *
 * The offer (Dan, 2026-09-30): the trial is 14 days free for anyone who signs
 * up, the download goes out BY EMAIL on Sat Oct 10 17:00 UTC (never linked on
 * the page). After the 14 days you keep DRIFT one of three ways: free with a
 * qualifying video (creator deal via /affiliate), $39 by filling in the
 * feedback form by Sat Oct 24, or $69 at release on Sun Nov 1. Prices show;
 * nothing is on sale before Nov 1 (no buy button, no checkout, no coupon or
 * discount wording). D2/H1: DRIFT pans the WHOLE sound; the LOW/HIGH CUT band
 * is only where echo, reverb, tremolo and pitch play.
 *
 * assertDriftConfig() runs in drift.astro's frontmatter, so a flip the page
 * can't honour fails the BUILD instead of shipping a dead route.
 */
import { existsSync } from 'node:fs';

export type DriftPhase = 'preopen' | 'open' | 'closed' | 'released';

export const drift = {
  phase: 'preopen' as DriftPhase,

  trialOpensIso: '2026-10-10T17:00:00Z',
  trialOpensLabel: 'Sat Oct 10, 17:00 UTC',
  trialOpensDay: 'Sat Oct 10',
  feedbackClosesLabel: 'Sat Oct 24',
  releaseLabel: 'Sun Nov 1',
  trialDays: 14,
  listPriceUsd: 69,
  driverPriceUsd: 39,
  showPrices: true,

  /** The $39 route's form. The build refuses phase 'open' until it exists. */
  feedbackFormLive: false,
  /** Creator deal (keep DRIFT free with a video). Lights the ON AIR lamp. */
  creatorDealOpen: true,
  /** e.g. 'Sat Oct 24'; appended to creator step 3 when set. */
  videoDeadlineLabel: null as string | null,
  /** true = the Oct 10 trial mail goes to the whole newsletter list, so an
   *  already-subscribed sign-up still gets it (worker.js /form-once swallows repeats). */
  trialMailToWholeList: false,
  /** The 'What happens after 14 days?' answer; the FAQ row renders only when set. */
  afterTrialAnswer: null as string | null,
  /** Released-phase gate: a post-release trial instead of real before/after audio. */
  trialAfterRelease: null as boolean | null,

  /** Gate id the licence worker will know DRIFT by (dlGateId contract). */
  gateId: 'drift',
  /** false until the worker has DL_PLUGINS.drift; then the open phase uses TrialGateModal. */
  gateWired: false,
  /** AAX ships in the beta (Dan 2026-10-01, Decision 7; PACE signing = Gil).
   *  Every format string reads this: false takes AAX off the whole page. */
  aaxReady: true,

  /** 'real' = Dan's level-matched before/after bounces in public/audio/drift/
   *  on the whole-sound build. There is no 'test' value: the browser synth never ships. */
  demoMode: 'off' as 'off' | 'real',
  /** false while src/lib/drift/demo.ts still routes only the band and synthesises
   *  its sound; flip only once it pans the WHOLE signal and plays the <audio>
   *  bounces (D2/H1). The build refuses demoMode 'real' until then. */
  demoWholeSound: false,
  /** Full DRIFT window screenshot (src/assets/seasons/drift/drift-window.png) staged per Decision 19. */
  screenshotReady: false,
  /** FX RANDOMIZE confirmed in the Oct 10 build. */
  randomizeInBuild: false,
};

export const formatsMac = () => (drift.aaxReady ? 'VST3 · AU · AAX' : 'VST3 · AU');
export const formatsWin = () => (drift.aaxReady ? 'VST3 · AAX' : 'VST3');
export const formatsShort = () => `MAC ${formatsMac()} · WIN ${formatsWin()}`;
export const compatLine = () =>
  // U+2011 non-breaking hyphen: at 390 px the line broke as '64-' / 'bit'
  `Mac: ${formatsMac()}, macOS 10.13+, native on Apple silicon and Intel. Windows: ${formatsWin()}, 64\u2011bit, needs WebView2.` +
  (drift.aaxReady ? '' : ' No Pro Tools (AAX) yet.');
/** #get's compat rows (dl): the formats are read before the email. ASCII hyphen in 64-bit (Oswald/mono subsets). */
export const compatRows = () => [
  { k: 'MAC', v: `${formatsMac()} · macOS 10.13+ · Apple silicon + Intel` },
  { k: 'WIN', v: `${formatsWin()} · 64-bit · needs WebView2` },
  ...(drift.aaxReady ? [] : [{ k: 'PRO TOOLS', v: 'not yet' }]),
];

/** 'Sat Oct 24' -> 'Oct 24' (the short rows are tighter than #get). */
export const noDay = (label: string) => label.replace(/^[A-Z][a-z]{2} /, '');
/** A date that never breaks across lines ('Oct\u00a024'). */
const nb = (label: string) => label.replace(/ /g, '\u00a0');

export interface Route {
  id: 'video' | 'feedback' | 'release';
  /** #get row condition */
  cond: string;
  /** short row condition (the keep-it menu under the tracks) */
  heroCond: string;
  /** #get row note */
  note: string;
  /** glass value; omitted when !showPrices */
  value?: string;
  /** only the FREE route links (the $39/$69 rows are plain text, no dead taps) */
  href?: string;
}

/** The keep-it ladder: condition first, value second, so it reads as routes, not tiers. */
export function routesFor(phase: DriftPhase = drift.phase): Route[] {
  const p = drift.showPrices;
  const video: Route = {
    id: 'video',
    cond: 'Keep it with a video',
    heroCond: 'Post a video',
    note: 'Post a DRIFT video on your channel.',
    value: p ? 'FREE' : undefined,
    href: '#creators',
  };
  const feedback: Route = {
    id: 'feedback',
    cond: 'Keep it with the feedback form',
    heroCond: `Feedback form · by ${nb(noDay(drift.feedbackClosesLabel))}`,
    note: `Fill it in by ${drift.feedbackClosesLabel} and we email you how to keep DRIFT${p ? ` for $${drift.driverPriceUsd}` : ''}.`,
    value: p ? `$${drift.driverPriceUsd}` : undefined,
  };
  const release: Route = {
    id: 'release',
    cond: 'Buy it at release',
    heroCond: `Release · ${nb(noDay(drift.releaseLabel))}`,
    note: `DRIFT goes on sale ${drift.releaseLabel}.`,
    value: p ? `$${drift.listPriceUsd}` : undefined,
  };
  switch (phase) {
    case 'preopen':
    case 'open':
      return [...(drift.creatorDealOpen ? [video] : []), feedback, release];
    case 'closed':
      return [...(drift.creatorDealOpen ? [video] : []), release];
    default:
      return [];
  }
}

export interface DriftCta {
  label: string;
  sub: string;
  /** the phone sticky bar's VT323 micro line */
  sticky: string;
  action: 'capture' | 'gate' | 'cart';
}

export function ctaFor(phase: DriftPhase = drift.phase): DriftCta {
  switch (phase) {
    case 'preopen':
      return {
        label: 'Get it',
        sub: `By email · ${drift.trialOpensLabel}`,
        sticky: `${drift.trialDays} DAYS FREE · BY EMAIL ${drift.trialOpensDay.toUpperCase()}`,
        action: 'capture',
      };
    case 'open':
      return {
        label: 'Get it',
        sub: `Download by email`,
        sticky: `${drift.trialDays} DAYS FREE · BY EMAIL`,
        action: drift.gateWired ? 'gate' : 'capture',
      };
    case 'closed':
      return {
        label: 'Get notified',
        sub: `Trial closed. On sale ${drift.releaseLabel}.`,
        sticky: `ON SALE ${drift.releaseLabel.toUpperCase()}`,
        action: 'capture',
      };
    case 'released':
      return {
        label: 'Buy DRIFT',
        sub: `$${drift.listPriceUsd} · ${formatsShort()}`,
        sticky: `$${drift.listPriceUsd} · ${formatsShort()}`,
        action: 'cart',
      };
  }
}

/**
 * DriftCapture's copy per phase: what the sign-up promises and how the
 * worker tags it, so a phase flip never promises a download on a past date
 * or files a 'notify me' as a trial. null = the phase has no capture (released
 * shows the buy slot).
 */
export interface CaptureCopy {
  /** the form's hidden source field */
  source: string;
  /** status after a first sign-up */
  ok: string;
  /** status when the email is already on the list */
  already: string;
  /** the fine print under the form */
  fine: string;
}
export function captureCopyFor(phase: DriftPhase = drift.phase): CaptureCopy | null {
  const list = 'You join our list · unsubscribe anytime. Nothing to pay today.';
  const askUs = "Already on our list. Email info@revaudio.net, subject DRIFT TRIAL. We add you to the trial.";
  switch (phase) {
    case 'preopen':
      return {
        source: 'drift-trial',
        ok: `You're in. Watch your inbox on ${drift.trialOpensDay}.`,
        already: drift.trialMailToWholeList
          ? `Already on our list. The trial reaches you ${drift.trialOpensDay}.`
          : askUs,
        fine: `Download by email, ${drift.trialOpensDay}. Open it on a computer. You join our list · unsubscribe anytime.`,
      };
    case 'open':
      return {
        source: 'drift-trial',
        ok: "You're in. Download on its way by email.",
        already: askUs,
        fine: `Download by email. Open it on a computer. You join our list · unsubscribe anytime.`,
      };
    case 'closed':
      return {
        source: 'drift-notify',
        ok: `You're on the list. We email you at release, ${drift.releaseLabel}.`,
        already: `Already on our list. You hear from us at release, ${drift.releaseLabel}.`,
        fine: `We email you at release, ${drift.releaseLabel}. ${list}`,
      };
    default:
      return null;
  }
}

/** Build guard: a phase the page can't honour fails the build, loudly. */
export function assertDriftConfig(checkoutUrl: string | null | undefined): void {
  const fail = (msg: string) => { throw new Error(`[drift.ts] ${msg}`); };
  if (drift.phase === 'open' && !drift.feedbackFormLive)
    fail("phase 'open' needs feedbackFormLive: the $39 route would point at a form that doesn't exist.");
  if (drift.phase === 'released' && !checkoutUrl)
    fail("phase 'released' needs plugins.ts drift.checkoutUrl.");
  if (drift.phase === 'released' && drift.demoMode !== 'real' && drift.trialAfterRelease !== true)
    fail("phase 'released' needs demoMode 'real' (before/after bounces) or trialAfterRelease === true.");
  if (drift.demoMode === 'real' && !existsSync('public/audio/drift'))
    fail("demoMode 'real' needs the bounces in public/audio/drift/.");
  if (drift.demoMode === 'real' && !drift.demoWholeSound)
    fail("demoMode 'real' needs demoWholeSound: demo.ts still pans only the band and synthesises its sound (D2/H1).");
}
