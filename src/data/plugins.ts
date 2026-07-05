/**
 * Plugin catalog — single source of truth for store + marketing pages.
 *
 * Lifecycle:
 *   status: 'in-development' → no Buy CTA, only waitlist
 *   status: 'beta'           → Buy CTA shows but no checkoutUrl until product live
 *   status: 'live'           → Buy CTA active, set checkoutUrl to the Lemon Squeezy buy link
 *
 * Prices are intent — flip when commerce launches.
 * Checkout: Lemon Squeezy (merchant of record). Set checkoutUrl per product below.
 */

export type PluginStatus = 'in-development' | 'beta' | 'live';
export type PluginCategory = 'limiter' | 'saturation' | 'panner' | 'eq';

export interface Feature {
  name: string;
  desc: string;
  /** Optional slug into the plugin's `stage.parts` map — enables the
   *  scroll-linked part-highlighter on the product page. Omit for plugins
   *  without a `stage` (falls back to plain image crossfade). */
  part?: string;
}

/** A region on `stage.shot`, in PERCENT of the image (0-100). The screenshot
 *  itself never transforms (no zoom/pan) — only the highlight box animates
 *  to this rect. */
export interface StagePart {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Data-driven config for the "What's inside" part-highlighter. Add this to
 *  a plugin + `part` slugs on its features to get the interactive overlay;
 *  omit both to keep the plain image-crossfade walkthrough. */
export interface Stage {
  /** Screenshot filename, resolved the same way as heroImage/galleryImages. */
  shot: string;
  parts: Record<string, StagePart>;
}

export interface AudioDemo {
  label: string;
  description?: string;
  beforeUrl: string | null;
  afterUrl: string | null;
}

export interface SystemReq {
  os: string;
  cpu: string;
  ram: string;
  formats: string;
  daws: string;
}

export interface Plugin {
  slug: string;
  name: string;
  category: PluginCategory;
  tagline: string;
  oneLiner: string;
  /** Jargon-free outcome line — what it does, before the metaphor. Shown first on the product page. */
  plainWhat: string;
  longPitch: string;
  status: PluginStatus;
  statusLabel: string;
  introPriceUsd: number | null;
  regularPriceUsd: number | null;
  /** Lemon Squeezy hosted checkout URL. Null until wired → product shows the "checkout reopening" state. */
  checkoutUrl: string | null;
  /** True while a live product has no working checkout yet (checkoutUrl not set). */
  checkoutPaused: boolean;
  /** Discount code the buyer must enter at checkout to get the intro price. */
  promoCode?: string;
  demoUrl: string | null;
  releaseTarget: string;
  heroImage: string | null;
  galleryImages: string[];
  features: Feature[];
  audioDemos: AudioDemo[];
  systemReq: SystemReq;
  reviewsCount: number;
  reviewsAvg: number;
  /** Optional part-highlighter stage config — see `Stage`. */
  stage?: Stage;
}

const baseSystemReq: SystemReq = {
  os: 'Windows 10/11 64-bit, macOS 12+',
  cpu: '2 GHz dual-core (Intel/AMD)',
  ram: '8 GB minimum, 16 GB recommended',
  formats: 'VST3, AU, AAX',
  daws: 'Cubase 12+, Studio One 6+, Reaper 7+, Ableton Live 11+, FL Studio 21+, Pro Tools 2023+',
};

// RevLimiter — Lemon Squeezy hosted checkout URL.
const REVLIMITER_CHECKOUT_URL: string | null = 'https://revaudiopg.lemonsqueezy.com/checkout/buy/78885904-8a19-4e23-9510-31b50775ada5';

export const plugins: Plugin[] = [
  {
    slug: 'revlimiter',
    name: 'RevLimiter',
    category: 'limiter',
    tagline: 'A mastering limiter you read like a tachometer',
    oneLiner:
      'The redline is your threshold. The needle is your gain reduction. Mastering loudness with the muscle of a tuned engine.',
    plainWhat:
      'In plain terms: RevLimiter is the last plugin on your master bus. It makes your track as loud as a commercial release while keeping it clean and punchy — not squashed, flat, or distorted.',
    longPitch:
      'A mastering limiter that makes loudness, depth, and punch feel like flooring it on an open road. Multi-band compression, analog-modelled saturation, and an adaptive limiter chained the way a top-tier mastering engineer would chain them. Sits last on your master bus, glues the mix, and holds a true-peak ceiling at oversampled rate.',
    status: 'live',
    statusLabel: REVLIMITER_CHECKOUT_URL ? 'Available now' : 'Checkout reopening soon',
    introPriceUsd: 56,
    regularPriceUsd: 93,
    promoCode: 'VROOM',
    checkoutUrl: REVLIMITER_CHECKOUT_URL,
    checkoutPaused: !REVLIMITER_CHECKOUT_URL,
    demoUrl: null,
    releaseTarget: 'Q3 2026',
    heroImage: 'revlimiter-hero.png',
    galleryImages: [],
    features: [
      { name: 'True-peak limiting', desc: 'Hit the ceiling, never cross it — inter-sample peak control at oversampled rate, with a base-rate hard-clip as the safety net.', part: 'ceiling' },
      { name: 'Adaptive multi-band release', desc: 'Per-band envelope tracking. Bass holds, mids breathe, highs respond — no static release time fights your material.', part: 'bands' },
      { name: 'Analog-modelled saturation', desc: 'Asymmetric soft-to-hard curve with DC-block. Adds density and weight before the brick wall.', part: 'saturation' },
      { name: 'Pro-tier metering', desc: 'Trust your eyes, not a guess — true peak, max peak, LUFS-M/S/I, LRA and per-band GR, RT-safe and audited against external mastering meters.', part: 'meters' },
      { name: 'Up to 32× oversampling', desc: 'Catch the peaks between samples — selectable up to 32×, for the dense mixes that fight the ceiling and need surgical inter-sample control.', part: 'oversampling' },
      { name: 'Visual rev gauge', desc: 'Redline = threshold. Needle = gain reduction. You know what is happening at a glance.', part: 'gauge' },
      { name: 'A/B compare', desc: 'Two state slots. Switch instantly. Compare without leaving the plugin.', part: 'ab' },
      { name: 'Lookahead with PDC', desc: 'The rest of your chain stays in time — lookahead delay is reported to the host, so nothing drifts on your master bus.', part: 'lookahead' },
    ],
    audioDemos: [
      { label: 'Vocal lead — A/B', description: 'Pop vocal pushed 3 dB into RevLimiter on a mastering chain.', beforeUrl: null, afterUrl: null },
      { label: 'Drum bus — A/B', description: 'Acoustic kit summed bus, RevLimiter glueing the transients without choking the snare.', beforeUrl: null, afterUrl: null },
      { label: 'Full mix master — A/B', description: 'Indie-rock master, target -10 LUFS-I, RevLimiter as final stage.', beforeUrl: null, afterUrl: null },
    ],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
    // Part rects measured against src/assets/plugins/revlimiter-hero.png
    // (2542x1226 source). Percent of image, top-left origin.
    stage: {
      shot: 'revlimiter-hero.png',
      parts: {
        ceiling: { x: 66.5, y: 16.5, w: 18, h: 28 },
        bands: { x: 2.5, y: 16.5, w: 18, h: 51 },
        // Orphan (no discrete control) — whole drive/HEAT cluster.
        saturation: { x: 0.8, y: 44, w: 40, h: 54 },
        meters: { x: 83.5, y: 25, w: 15, h: 27 },
        oversampling: { x: 76.5, y: 6, w: 7.5, h: 7 },
        gauge: { x: 36, y: 0.5, w: 29.5, h: 61 },
        ab: { x: 29.5, y: 5.5, w: 6.5, h: 12 },
        // Orphan (no discrete control) — whole unit.
        lookahead: { x: 1, y: 1, w: 98, h: 98 },
      },
    },
  },
  {
    slug: 'drift',
    name: 'Drift',
    category: 'panner',
    tagline: 'A multiband panner you steer like a drift car',
    oneLiner:
      'Send your selected freq. band to a trip across the stereo field.',
    plainWhat:
      'In plain terms: Drift moves chosen frequency ranges around the stereo image and adds per-band character, so your mix feels wide, alive, and in motion.',
    longPitch:
      'A multiband panner built for movement. Slice your mix into bands and send each one drifting across the stereo image, with saturation, reverb and tremolo per band. Flip on Autopilot and an LFO steers the motion for you — controlled slides that keep the mix wide and alive.',
    status: 'in-development',
    statusLabel: 'In development',
    introPriceUsd: null,
    regularPriceUsd: null,
    checkoutUrl: null,
    checkoutPaused: false,
    demoUrl: null,
    releaseTarget: '2026',
    heroImage: 'coming-soon-plate.png',
    galleryImages: [],
    features: [
      { name: 'Multiband panning', desc: 'Split the spectrum and send each band sliding across the stereo field independently.' },
      { name: 'Per-band character', desc: 'Saturation, reverb and tremolo dialled in per band — movement with tone, not just position.' },
      { name: 'Autopilot', desc: 'LFO-driven motion that steers the pan or a chosen band for you — hands-off, living stereo.' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
  {
    slug: 'the-ac',
    name: 'The AC',
    category: 'saturation',
    tagline: 'An air-band exciter that brings the breeze',
    oneLiner:
      'Add clean air and shine to your top end.',
    plainWhat:
      'In plain terms: The AC brightens and opens the top of your mix, adding air and sparkle without the harshness.',
    longPitch:
      'An air-band specialist. The AC adds breeze and shine to the top of your mix with a harmonic exciter, tube saturation, and intelligent resonance taming — all set by a single car-AC temperature dial. Cold leans bright and airy, hot leans warm and saturated, the middle blends both.',
    status: 'in-development',
    statusLabel: 'In development',
    introPriceUsd: null,
    regularPriceUsd: null,
    checkoutUrl: null,
    checkoutPaused: false,
    demoUrl: null,
    releaseTarget: '2026',
    heroImage: 'coming-soon-plate.png',
    galleryImages: [],
    features: [
      { name: 'Air-band excitement', desc: 'Harmonic exciter focused on the top octaves — openness and shine without harshness.' },
      { name: 'Tube saturation', desc: 'Warm valve-style saturation on the air band for density and sheen.' },
      { name: 'Smart resonance taming', desc: 'Dynamic EQ / resonance suppression keeps the boosted top smooth.' },
      { name: 'Temperature dial', desc: 'One car-AC temperature control blends exciter (cold) to tube (hot) — mid is both.' },
    ],
    audioDemos: [],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
];

export const bySlug = (slug: string) => plugins.find((p) => p.slug === slug);

export const isBuyable = (p: Plugin) => p.status === 'live' && !!p.checkoutUrl;

export const fmtPrice = (usd: number | null) => (usd == null ? '—' : `$${usd}`);

export const discountPct = (p: Plugin): number | null => {
  if (p.regularPriceUsd == null || p.introPriceUsd == null) return null;
  if (p.regularPriceUsd <= p.introPriceUsd) return null;
  return Math.round(((p.regularPriceUsd - p.introPriceUsd) / p.regularPriceUsd) * 100);
};
