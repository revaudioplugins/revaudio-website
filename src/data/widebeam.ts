/**
 * /widebeam: the one place the WIDE BEAM page reads its state and its words from (the drift.ts / revfx.ts pattern).
 * WIDE BEAM = revaudioplugins/WideBeam, a 1.0 candidate, not released (README "State", 2026-11-18). Every claim here is
 * checked against the plugin's origin/main (0.10.3, 672964b, read 2026-11-20; release/widebeam-1.0 lags it and still
 * describes 0.9.0's CRUISE and TRACTION switches): README.md (parameter table, "Known limits", "Licence", "Formats")
 * and Source/PluginProcessor.cpp makeParameters() + render(). One `phase` drives every ask on the page (hero key, plate, phone bar,
 * the line under the manual, the closer): read it through askFor(), never hard-code "trial", a price or a format.
 *
 * assertWidebeamConfig() runs in widebeam.astro's frontmatter and in [slug].astro's getStaticPaths, so a flip the page
 * can't back fails the build instead of shipping.
 *
 * LAUNCH DAY, in this order (plan 2026-11-18 §6; nothing below is done yet):
 *  1. Gil: DL_PLUGINS.widebeam in the licence worker (DONE 2026-11-19, revlimiter-license 0f241f7; gateWired is
 *     true) + the R2 builds (owed: until /pit-lane ships them the email says "coming soon" per platform). Then
 *     phase: 'open' (the build
 *     refuses 'open' without the gate). Send the list one email the day the trial opens: the pre-open words promise
 *     it ("One email when the trial opens"), and nothing sends it by itself. Send it to the WHOLE newsletter list
 *     (launchMailToWholeList), or also mail the people who wrote in under "subject WIDE BEAM".
 *     - The open-phase consent line promises "a few short getting-started emails": true only while the worker's KV
 *       campaign:trial-seq is 'on' (its t0 / t2 / t5 emails). Off, the old drip sends one (day 1) and the 3-days-left
 *       one (day 27): then the line reads "a getting-started email". Check the KV value the day the trial opens.
 *     - Before the trial opens, fix the worker's WIDE BEAM day-0 email (RevLimiter repo, gumroad-worker/src/worker.js
 *       ~4411-4416, "At 100 your track is exactly as it was"): false, the side below LOW FOCUS is removed at any WIDTH
 *       and the dry is allpass-rotated (plan "Read first", Copy). STEPS[0] here has the true words.
 *  2. Paddle (price id, priceUsd, the plugins.ts entry and OWN_ROUTE: DONE by Gil 2026-11-19, below): the price id +
 *     priceUsd here, a plugins.ts entry with the same id and price (the build refuses
 *     'released' without it: the cart sells only plugins.ts slugs) and systemReq.formats = formatsLine() (the cart
 *     drawer prints it; no AAX. Gil's entry still says 'VST3 + AU + AAX on Mac': fix it before 'released'), 'widebeam' in OWN_ROUTE (src/pages/[slug].astro; the build refuses the entry without
 *     it), then phase: 'released'.
 *     - Once downloads exist, 'released' has to come within 30 days of the first download: the worker's day-31
 *       "KEEP WIDE BEAM" email sends people to this page to pay (guidelines-d03).
 *     - With the worker's trial sequence on (KV campaign:trial-seq 'on'; SEQ_PLUGINS has widebeam) the first buy ask
 *       comes on DAY 9: its t9 email says "Every way to keep WIDE BEAM is on the WIDE BEAM page", and t25 / t30 carry a
 *       KEEP WIDE BEAM key to this page. So 'released' has to come before day 9 of the first download, or WIDE BEAM's
 *       t9 / t25 / t30 steps are held in the worker (SEQ_STEPS) until it is: in 'open' this page has no way to buy,
 *       only "Own it · Price coming soon" (r-base-pricelaunch).
 *     - OFFER_PLUGINS.widebeam with buyPath /buy/widebeam/ in the licence worker (RevLimiter repo, guidelines-d02).
 *     - The smoke test asserts /buy/widebeam/ exists.
 *     - The money chain (plan "Read first"): WIDE BEAM's own licence worker deployed (README: "source only"), the
 *       hub's PADDLE_PRICE_MAP / LICENSE_TARGETS / service binding / admin token, signed builds on R2 (the signed
 *       installer has never been run), the /purchase download, and the mandatory real test purchase (wiki
 *       store-paddle, website-update step 6).
 *  3. Confirm the formats: winInstallTested (README "State": the Windows install test is still owed; the build refuses
 *     'released' without it) and aaxReady (README "Build": the PACE wcguid for AAX is not created).
 *  4. Ilay: MANUAL_URL to /widebeam/#manual before the release build (D14). The film goes from Unlisted to Public, and
 *     manual.youtubeId / length / poster / transcript get filled in here, and each manual.chapters[].at (seconds into
 *     the film; null keeps that chapter going to the road step): the chapters start the film only once their times are in.
 *  5. Listing: listed: true (the home TV and the /plugins entry), remove '/widebeam/' from NOINDEX in astro.config.mjs,
 *     index on, canonical, the 153-character meta description, SoftwareApplication JSON-LD with no rating.
 *  6. Cloudflare: add widebeam/ to the long-cache rule.
 *  7. Black Friday: sale.ts per D10 (Gil's line on main, not this branch). Until WIDE BEAM can be bought the sale strip
 *     stays off /widebeam (BaseLayout's pre-paint gate).
 *  Open/released: the trial forms have no no-JS route (the worker's /download/register reads JSON only). Without the
 *  page script their key stays disabled and a <noscript> line says why (askFor().nojs).
 *
 * Commerce, wired while the page stays pre-open (Gil 2026-11-19, Paddle product pro_01m7vhb719rzqnagt7vmm03kwh):
 *   - gateWired true: the trial form posts {email, plugin, marketing} to the worker's /download/register first, which
 *     emails the download at once (as src/lib/drift/capture.ts does), then joins the list via /form-once. The worker's
 *     DL_PLUGINS.widebeam opened with revlimiter-license 0f241f7; until /pit-lane ships the builds the email says
 *     "coming soon" per platform. The worker must be live before this page is, or the register call has no gate.
 *   - priceUsd + paddlePriceId: BUY NOW adds to the cart and opens it. plugins.ts has the same id and price (the cart
 *     only checks out slugs it finds there), [slug].astro OWN_ROUTE has 'widebeam', and the plugins.ts entry has no
 *     `library`, so WIDE BEAM stays off the home TV until it is meant to be listed.
 */
import { site } from './site';

export type WidebeamPhase = 'preopen' | 'open' | 'released';

export const widebeam = {
  slug: 'widebeam',
  name: 'WIDE BEAM',
  /** preopen = nothing to download yet: one ask, the launch email. open = the trial downloads (gateWired).
   *  released = Paddle sells it (buyable()). */
  phase: 'preopen' as WidebeamPhase,
  trialDays: 30, // README "Licence": a silent 30-day trial from the first load
  priceUsd: 9 as number | null, // = the Paddle price ($9.00 USD); the page shows it only in 'released'
  paddlePriceId: 'pri_01m7vhcdt6t1dtpbyn9g1mx00m' as string | null, // keep equal to plugins.ts widebeam
  /** the licence worker has DL_PLUGINS.widebeam + the R2 builds: the forms post to /download/register first */
  gateWired: true, // Gil 2026-11-19 (revlimiter-license 0f241f7); pre-open forms never use it (askFor)
  gateId: 'widebeam',
  /** README "Build": "the PACE wcguid for AAX is not created". false takes AAX off the whole page. */
  aaxReady: false,
  /** README "Formats": a Windows x64 VST3 is built (WebView2). */
  winReady: true,
  /** README "State": "the Windows install test [is] still owed". The build refuses 'released' until it is true. */
  winInstallTested: false,
  /** on the home TV and /plugins. Only once released. */
  listed: false,
  /** true = the launch email goes to the WHOLE newsletter list, not only the widebeam-notify sign-ups. The licence
   *  worker's /form-once keys a repeat by form + email (not by source), so a visitor already on the newsletter gets
   *  'already' and their WIDE BEAM sign-up is never relayed: only a whole-list mail reaches them (drift.ts
   *  trialMailToWholeList, the same case). false = the pre-open 'already' words ask them to write in. */
  launchMailToWholeList: false,
};

/** The hero line (D2 B, word for word) and the signature under the key (D1). */
export const heroLine = 'WIDER MIX. BASS DEAD CENTRE.';
export const signature = 'Open the road.';

/* ---------- formats: every string reads the flags ---------- */
export const formatsMac = () => (widebeam.aaxReady ? 'VST3 · AU · AAX' : 'VST3 · AU');
export const formatsWin = () => (widebeam.aaxReady ? 'VST3 · AAX' : 'VST3');
/** 'Mac VST3 · AU · Windows VST3' (P5 A) */
export const formatsLine = () => (widebeam.winReady ? `Mac ${formatsMac()} · Windows ${formatsWin()}` : `Mac ${formatsMac()}`);
/** README "Formats": macOS universal (arm64 + x86_64), minimum macOS 11; Windows x64 VST3 (WebView2) */
export const compatRows = () => [
  { k: 'MAC', v: formatsMac(), d: 'macOS 11 Big Sur or later · Apple silicon + Intel' },
  ...(widebeam.winReady ? [{ k: 'WINDOWS', v: formatsWin(), d: '64-bit · needs WebView2' }] : []),
  ...(widebeam.aaxReady ? [] : [{ k: 'PRO TOOLS', v: 'Not yet', d: '' }]),
];

/* ---------- the stereo road: six steps (the manual's six chapters land on their ids) ---------- */
export interface Step { n: string; id: string; label: string; h: string; p: string; }
export const STEPS: Step[] = [
  {
    n: '01', id: 'wb-step-01', label: 'WIDTH', h: 'Dipped to full beam.',
    // README WIDTH: 0-200, default 136, 100 = side unchanged, 200 = side +6 dB; LOW FOCUS removes the side below it
    p: 'One big knob, 0 to 200, and WIDE BEAM opens at 136, a touch wider than your track. At 100 the side keeps its own level; below it the image folds in toward mono, above it the sides open, up to 6 dB more side at WIDTH 200. At any WIDTH, the side below LOW FOCUS is removed.',
  },
  {
    n: '02', id: 'wb-step-02', label: 'LOW FOCUS', h: 'The bass stays on the centre line.',
    // README LOW FOCUS: 20-1000 Hz, default 120, LR4 split on the side, side below it removed; MIX: dry blend
    p: 'Below LOW FOCUS (120 Hz to start, anywhere from 20 Hz to 1 kHz) the side is removed at any WIDTH, with a steep 24 dB/oct split, so the kick and bass sit dead centre in mono and on a club system while the top opens up. MIX under 100 blends your dry track back in, its own side bass included.',
  },
  {
    n: '03', id: 'wb-step-03', label: 'HIGH BEAM', h: 'Throw a mono source wide.',
    // README HIGH BEAM: velvet-noise decorrelator above LOW FOCUS, added to the side only; REACH 0-100. Not "L+R never
    // changes": CRUISE's gain also takes REACH, so the mono sum drops a little with the beam on (-0.79 dB at REACH 100,
    // WIDTH <= 100; PluginProcessor.cpp render(), comp)
    p: "Flip the bat switch and a mono vocal or synth gets a wide spread above LOW FOCUS. It's a decorrelator, not a doubler. REACH sets how far it throws, and the beam goes into the side only: it adds nothing to the mono sum.",
  },
  {
    n: '04', id: 'wb-step-04', label: 'TILT', h: 'Put the width where you want it.',
    // README TILT: one-pole split at 1.5 kHz, highs x 2^tilt, lows x 2^-tilt, +-6.02 dB at the ends
    p: 'The thumbwheel tilts the widening: roll up and the highs spread while the lows narrow, roll down for the opposite. ±6 dB at the ends, flat in the detent.',
  },
  {
    n: '05', id: 'wb-step-05', label: 'MONO · CORRELATION', h: 'Check it on a phone speaker. Before your listeners do.',
    // README MONO / SIDE: listening switches, not automatable (makeParameters: withAutomatable(false)); a preset load
    // switches them off (PluginProcessor.cpp onAfterLoad). No TRACTION: removed from the engine in 0.10.0 (README, round 13)
    // README POWER (bypass): MONO and SIDE act only while POWER is on; POWER off or the DAW's bypass plays the aligned dry
    p: 'A moving-coil style correlation meter reads the result. MONO sums the output to mono; SIDE solos the stereo side. They are listening checks: the DAW can\'t automate them, and loading a preset switches them off. They act only while POWER is on: POWER off, or the DAW\'s bypass, plays the aligned dry.',
  },
  {
    n: '06', id: 'wb-step-06', label: 'CRUISE', h: 'Wider, not louder.',
    // README CRUISE: no control since 0.10.0, always on; a static law: 1 at WIDTH <= 100 (HIGH BEAM off), -2 dB at 200
    // (-0.53 dB at the default 136); never above 1; no measurement of the material
    p: "Widening usually makes things louder, and louder always sounds 'better'. CRUISE is built in, with no switch: a fixed gain law for a typical mix trims the level as WIDTH goes up (about −0.5 dB at the default 136, −2 dB at 200, unity at 100 or below with HIGH BEAM off), so you judge the width, not the volume.",
  },
];

/* ---------- the trip computer (the Specs fold) ---------- */
export const SPECS: [string, string, string][] = [
  ['WIDTH', '0 – 200 %', 'Opens at 136 · 100 = the side at its own level · 200 = 6 dB more side'],
  ['LOW FOCUS', '20 – 1000 Hz', 'Opens at 120 · the side below it is removed · Linkwitz-Riley 24 dB/oct'],
  ['MIX', '0 – 100 %', 'Dry blend, allpass-aligned, no comb when blending'],
  ['HIGH BEAM', 'On / off', 'Velvet-noise decorrelator, 25 ms, ducked on attacks'],
  ['REACH', '0 – 100 %', 'How far HIGH BEAM throws'],
  ['TILT', '±6 dB', 'Width tilt about 1.5 kHz'],
  ['CRUISE', 'Built in', 'No switch · a fixed gain law · −2 dB at WIDTH 200'], // README: no control since 0.10.0
  ['MONO · SIDE', 'Listening', 'Sum to mono, or solo the side · not automatable · a preset switches them off'],
  ['CORRELATION', '−1 … +1', 'Moving-coil style meter, ~300 ms'], // WideBeam DESIGN.md:21
  ['POWER', 'Host bypass', '20 ms fade to the aligned dry, no click'],
  ['LATENCY', '0 samples', 'Zero latency, per-sample mid/side'],
  ['PRESETS', '16 factory', 'Plus your own, saved as files'],
  ...compatRows().map((r): [string, string, string] => [r.k, r.v, r.d]),
];

/** the Specs fold's card title */
export const SPECS_TITLE = `Trip computer · ${SPECS.length} items`;

/** The odometer: the real values go in the HTML; any rolling drum on top is aria-hidden decoration. */
export const ODOMETER = [
  { value: 0, unit: 'samples of latency' },
  { value: 6, unit: 'dB more side at WIDTH 200' },
  { value: 24, unit: 'dB/oct mono-bass split' },
  { value: 16, unit: 'factory presets' },
];

/* ---------- the folds by the closer ---------- */
export interface Fold { id: string; title: string; body: string[]; }
export const FOLDS: Fold[] = [
  {
    id: 'runs-on', title: 'Runs on',
    body: [
      `Mac: ${formatsMac()}, macOS 11 Big Sur or later, Apple silicon and Intel.`,
      ...(widebeam.winReady ? [`Windows: 64-bit ${formatsWin()}, needs WebView2.`] : []),
      ...(widebeam.aaxReady ? [] : ['Pro Tools: not yet.']),
    ],
  },
  {
    id: 'after-30', title: 'After 30 days?',
    // README "Licence": silent 30-day trial from the first load; after it, with no key, the card comes up and the
    // plugin passes the audio through dry
    body: [`The trial is the full plugin for ${widebeam.trialDays} days from the first time it loads. When it ends and no key is activated, the owner's card comes up and WIDE BEAM passes your audio through dry until you add a key.`],
  },
  {
    id: 'licence', title: 'Licence',
    // README "Licence": key prefix WDBM., ACTIVATE on the owner's card, first time needs internet, 2 seats
    body: ["One key, two computers. Click the RevAudio plate on the face to open the owner's card, paste the key and press ACTIVATE. The first activation needs internet."],
  },
  {
    id: 'where-it-stops', title: 'Where it stops',
    // README "Known limits" (origin/main), the ones a buyer can hear; the two about checking against Ilay's build stay out
    body: [
      'HIGH BEAM has no ear match: at a high REACH a centred voice can lean 1 to 2 dB to one side.',
      'POWER off and MIX 0 play a dry that is phase-rotated around LOW FOCUS (its level stays flat), like any crossover mono maker. A raw copy won\'t null against it below about 500 Hz.',
      'Nothing holds the width back: at a high WIDTH, REACH or TILT a wide source can go below correlation 0.',
      "CRUISE is a fixed law for a typical mix: on a much wider or narrower source the level still moves with WIDTH, and it doesn't follow TILT.",
      'TILT is not level-neutral: about 3 dB more side at 1.5 kHz at both ends.',
      'Input above +24 dBFS is held in the processed path; the dry path (POWER off, MIX 0) is not clipped above that.',
      ...(widebeam.aaxReady ? [] : ['No Pro Tools version yet.']),
    ],
  },
  { id: 'specs', title: 'Specs', body: [] }, // the trip computer: SPECS
];

/* ---------- the dash's words ---------- */
export const DASH = {
  head: 'Every knob works.',
  headEm: 'Go wide.',
  sub: "This is WIDE BEAM's own face, running in your browser. Drag a knob up or down, flip HIGH BEAM, press MONO. Start the engine to hear it.",
  /** a touch screen (the phone deck, where WIDTH slides sideways, and any coarse pointer): the coach's own gesture */
  subTouch: "This is WIDE BEAM's own face, running in your browser. Slide WIDTH to the right, flip HIGH BEAM, press MONO. Start the engine to hear it.",
  idle: 'Engine off. Start it for a demo loop; headphones help.',
  fileNote: 'Your track plays in this tab only. Nothing is uploaded.',
  demoNote: "What you hear is a browser sketch of WIDE BEAM built on the plugin's own laws, not the plugin itself.",
};
/** the glove box: one neutral line for mouse and touch (mobile-11) */
export const GLOVE_SUB = 'Pick one and the knobs on the dash glide to it. The row slides sideways to show all sixteen.';
/** the same line with JavaScript off: the cards still show each preset's settings, but a pick moves nothing (r-cross-nojs) */
export const GLOVE_SUB_NOJS = "Each card shows a preset's settings. The row slides sideways to show all sixteen. Picking one needs JavaScript, which is off in this browser.";

/* ---------- the Owner's Manual (stand-by until a film exists; P4 A) ---------- */
export const manual = {
  title: "Owner's Manual",
  standby: "MANUAL · BEING FILMED. It plays right here when it's ready.",
  youtubeId: null as string | null,
  src: null as string | null,
  length: null as string | null,
  poster: null as string | null,
  transcript: null as string | null,
  chapters: STEPS.map((s) => ({ label: s.label, step: s.id, at: null as number | null })),
};

/* ---------- the one ask ---------- */
export interface Ask {
  /** the plate's line over the form */
  label: string;
  /** the submit key (and the phone bar's key) */
  key: string;
  micro: string;
  /** the consent line; ' · Privacy' is rendered as a link by the surfaces */
  consent: string;
  ok: string;
  already: string;
  /** the hidden source field: 'widebeam-notify' is relayed to the list; '-trial' only logs (worker handleFormOnce) */
  source: string;
  /** /download/register when the gate is wired and the trial is open; null = the /form-once list relay only */
  registerUrl: string | null;
  sticky: string;
  manualLine: string;
  closerTitle: string;
  /** the closer's eyebrow over "Runs on your setup." */
  closerEyebrow: string;
  /** the closer's small print under the buy side; null = none */
  closerNote: string | null;
  /** the last sentence of the meta / og description (widebeam.astro), so a shared link says what the page offers */
  metaTail: string;
  /** the forms' <noscript> line (WbGet / WbCloser) once the trial is open: the trial goes out only through the page
   *  script (capture.ts), and the line promises nothing else (r-asks-nojstrial). null pre-open: the forms post natively. */
  nojs: string | null;
  /** JS on but the page script never bound the trial form (a blocker, a dropped request): its key stays disabled and this
   *  line shows from 9 s (WbGet / WbCloser, get.css). Open and released phases only: pre-open the forms post natively. */
  late: string;
}
const LATE = "The trial sign-up didn't load. Reload the page, or email info@revaudio.net.";
export function askFor(phase: WidebeamPhase = widebeam.phase): Ask {
  if (phase === 'preopen') {
    return {
      label: `Get the ${widebeam.trialDays}-day trial the day it opens`,
      key: 'Email me at launch ▸',
      micro: 'Full version · no credit card',
      consent: 'One email when the trial opens. You join our list · unsubscribe anytime',
      ok: "You're on the list. We email you the day the trial opens.",
      already: widebeam.launchMailToWholeList
        ? "You're already on the list. We email you the day the trial opens."
        : "You're already on our list. Email info@revaudio.net, subject WIDE BEAM, and we'll tell you the day the trial opens.",
      source: 'widebeam-notify',
      registerUrl: null,
      sticky: 'Email me at launch ▸',
      manualLine: `WIDE BEAM isn't out yet. One email the day the ${widebeam.trialDays}-day trial opens.`,
      closerTitle: 'Be first on the road.',
      closerEyebrow: 'Before launch',
      closerNote: 'WIDE BEAM is in final testing. Details can still change before release.',
      metaTail: 'Coming soon from RevAudio.',
      nojs: null,
      late: LATE,
    };
  }
  // open and released: the trial downloads; the getting-started and trial-end line is true only once the worker's
  // WIDE BEAM drip runs (it does once DL_PLUGINS.widebeam is live)
  return {
    label: `Get your free ${widebeam.trialDays}-day trial`,
    key: 'Start your free trial ▸',
    micro: 'Full version · no credit card',
    consent: "We'll email your download link, then a few short getting-started emails and a heads-up before your trial ends. You join our list · unsubscribe anytime",
    ok: 'Check your inbox: your WIDE BEAM download link is on its way.',
    already: "You're already signed up. Check your inbox (and spam) for the download link.",
    source: 'widebeam-trial',
    registerUrl: registerUrl(),
    sticky: 'Start your free trial ▸',
    manualLine: `Try it on your own mix: ${widebeam.trialDays} days free, the full version.`,
    closerTitle: 'Take WIDE BEAM home.',
    closerEyebrow: 'The trial',
    closerNote: null,
    metaTail: buyable()
      ? `Free ${widebeam.trialDays}-day trial, then ${fmtUsd(widebeam.priceUsd!)} one-time. From RevAudio.`
      : `Free ${widebeam.trialDays}-day trial from RevAudio.`,
    nojs: 'The trial sign-up needs JavaScript, which is off in this browser.',
    late: LATE,
  };
}

/** The buy side of the plate: no key until Paddle has a price (P1 A). Pre-open it reads "Price at launch" (P1 A). Once
 *  the trial is out and Paddle isn't, "launch" has already happened for the visitor (the trial opening is what "Email
 *  me at launch" meant), so 'open' says the price is still to come without the word (r-base-pricelaunch). */
export function buyFor(phase: WidebeamPhase = widebeam.phase) {
  if (buyable()) return { title: fmtUsd(widebeam.priceUsd!), sub: 'one-time · yours to keep', key: `Buy WIDE BEAM · ${fmtUsd(widebeam.priceUsd!)}`, trust: 'No iLok · key by email · 2 computers · 14-day refund' };
  return { title: 'Own it', sub: phase === 'preopen' ? 'Price at launch' : 'Price coming soon', key: null, trust: null };
}

/** BUY adds to the cart only in 'released' with a Paddle price */
export const buyable = () => widebeam.phase === 'released' && widebeam.priceUsd != null && !!widebeam.paddlePriceId?.trim();
export const registerUrl = () => (widebeam.gateWired ? site.downloadGate.workerUrl + '/download/register' : null);
export const onceUrl = () => site.downloadGate.workerUrl + '/form-once';
export const fmtUsd = (v: number) => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;

/** What the cart sells, per plugins.ts slug: Cart.astro checks out only slugs with a paddlePriceId there, at
 *  introPriceUsd ?? regularPriceUsd. widebeam.astro passes it on every build of the page. */
export type CartCatalog = Record<string, { paddlePriceId: string | null; priceUsd: number | null }>;

/**
 * Fails the build on a state the page can't back. [slug].astro passes `routes` (its OWN_ROUTE and the plugins.ts
 * slugs); widebeam.astro passes `catalog` (from plugins.ts), so the phase rules and the cart rule run on every build of
 * the page.
 */
export function assertWidebeamConfig(
  cfg: typeof widebeam = widebeam,
  routes?: { pluginSlugs: string[]; ownRoute: Iterable<string> },
  catalog?: CartCatalog,
): void {
  const fail = (m: string) => { throw new Error(`[widebeam.ts] ${m}`); };
  if (!['preopen', 'open', 'released'].includes(cfg.phase)) fail(`unknown phase '${cfg.phase}'.`);
  if (cfg.phase === 'open' && !cfg.gateWired) fail("phase 'open' needs gateWired (DL_PLUGINS.widebeam + the R2 builds).");
  if (cfg.phase === 'released') {
    if (!cfg.gateWired) fail("phase 'released' needs gateWired (the trial downloads beside the buy key).");
    if (cfg.priceUsd == null || !Number.isFinite(cfg.priceUsd) || cfg.priceUsd <= 0 || !cfg.paddlePriceId?.trim())
      fail("phase 'released' needs a priceUsd above 0 and a paddlePriceId (buyable()).");
    if (!cfg.winInstallTested) fail("phase 'released' needs winInstallTested (README: the Windows install test is still owed).");
    // the Buy key adds slug 'widebeam' to the cart, and Cart.astro drops a slug plugins.ts doesn't sell: the visitor
    // would press Buy and get "Your cart is empty". The cart's price id and price must be the ones this page shows.
    if (catalog) {
      const e = catalog[cfg.slug], id = e?.paddlePriceId?.trim() ?? '';
      if (!id) fail(`phase 'released' needs a plugins.ts '${cfg.slug}' entry with a paddlePriceId: the cart drops a slug it can't check out.`);
      if (id !== (cfg.paddlePriceId ?? '').trim()) fail(`plugins.ts '${cfg.slug}' paddlePriceId '${id}' isn't this page's '${cfg.paddlePriceId}'.`);
      if (e.priceUsd !== cfg.priceUsd) fail(`plugins.ts '${cfg.slug}' price ${e.priceUsd} isn't this page's ${cfg.priceUsd}: the cart would charge another price than the Buy key says.`);
    }
  }
  if (cfg.listed && cfg.phase !== 'released') fail("listed needs phase 'released'.");
  if (routes && routes.pluginSlugs.includes(cfg.slug) && ![...routes.ownRoute].includes(cfg.slug))
    fail(`plugins.ts has a '${cfg.slug}' entry but [slug].astro's OWN_ROUTE doesn't exclude it: two pages would claim /${cfg.slug}.`);
}
