/**
 * Plugin catalog — single source of truth for store + marketing pages.
 *
 * Lifecycle:
 *   status: 'in-development' → no Buy CTA, only waitlist
 *   status: 'beta'           → Buy CTA shows but no paddlePriceId until product live
 *   status: 'live'           → Buy CTA active, paddlePriceId + PADDLE.token set, demoUrl optional
 *
 * Prices are intent — flip when commerce launches.
 * Checkout: Paddle (merchant of record). See PADDLE config + per-product paddlePriceId below.
 */

export type PluginStatus = 'in-development' | 'beta' | 'live';
export type PluginCategory = 'limiter' | 'saturation' | 'panner' | 'eq';

export interface Feature {
  name: string;
  desc: string;
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
  /** Paddle price ID (pri_...). Null until wired → product shows the "checkout reopening" state. */
  paddlePriceId: string | null;
  /** True while a live product has no working checkout yet (Paddle price ID not set). */
  checkoutPaused: boolean;
  demoUrl: string | null;
  releaseTarget: string;
  heroImage: string | null;
  galleryImages: string[];
  features: Feature[];
  audioDemos: AudioDemo[];
  systemReq: SystemReq;
  reviewsCount: number;
  reviewsAvg: number;
}

const baseSystemReq: SystemReq = {
  os: 'Windows 10/11 64-bit (macOS planned)',
  cpu: '2 GHz dual-core (Intel/AMD)',
  ram: '8 GB minimum, 16 GB recommended',
  formats: 'VST3, AU, AAX',
  daws: 'Cubase 12+, Studio One 6+, Reaper 7+, Ableton Live 11+, FL Studio 21+, Pro Tools 2023+',
};

/**
 * COMMERCE — Paddle (merchant of record). Three pieces to go live:
 *   1. PADDLE.token       — publishable client-side token (safe in the browser).
 *                           Paddle dashboard → Developer Tools → Authentication → Client-side token.
 *   2. PADDLE.environment — 'sandbox' while testing, 'production' once the seller account is approved.
 *   3. per-product paddlePriceId (pri_...) — set on each plugin below.
 * A plugin is buyable only when status==='live', PADDLE.token is set, AND it has a paddlePriceId.
 * While a live plugin has no paddlePriceId it shows the honest "checkout reopening" CTA.
 */
export const PADDLE = {
  token: null as string | null,                       // sandbox 'test_...' to test, swap to 'live_...' at cutover
  environment: 'sandbox' as 'sandbox' | 'production',  // flip to 'production' when the live token is in
};

// RevLimiter Paddle price ID — paste the sandbox pri_... to test, swap to the live pri_... at cutover.
const REVLIMITER_PADDLE_PRICE_ID: string | null = null;

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
    statusLabel: REVLIMITER_PADDLE_PRICE_ID ? 'Available now' : 'Checkout reopening soon',
    introPriceUsd: 93, // flat price — no launch discount shown
    regularPriceUsd: null,
    paddlePriceId: REVLIMITER_PADDLE_PRICE_ID,
    checkoutPaused: !REVLIMITER_PADDLE_PRICE_ID,
    demoUrl: null,
    releaseTarget: 'Q3 2026',
    heroImage: 'revlimiter-hero.png',
    galleryImages: [],
    features: [
      { name: 'True-peak limiting', desc: 'Hit the ceiling, never cross it — inter-sample peak control at oversampled rate, with a base-rate hard-clip as the safety net.' },
      { name: 'Adaptive multi-band release', desc: 'Per-band envelope tracking. Bass holds, mids breathe, highs respond — no static release time fights your material.' },
      { name: 'Analog-modelled saturation', desc: 'Asymmetric soft-to-hard curve with DC-block. Adds density and weight before the brick wall.' },
      { name: 'Pro-tier metering', desc: 'Trust your eyes, not a guess — true peak, max peak, LUFS-M/S/I, LRA and per-band GR, RT-safe and audited against external mastering meters.' },
      { name: '16× oversampling', desc: 'Catch the peaks between samples — optional, for the dense mixes that fight the ceiling and need surgical inter-sample control.' },
      { name: 'Visual rev gauge', desc: 'Redline = threshold. Needle = gain reduction. You know what is happening at a glance.' },
      { name: 'A/B compare', desc: 'Two state slots. Switch instantly. Compare without leaving the plugin.' },
      { name: 'Lookahead with PDC', desc: 'The rest of your chain stays in time — lookahead delay is reported to the host, so nothing drifts on your master bus.' },
    ],
    audioDemos: [
      { label: 'Vocal lead — A/B', description: 'Pop vocal pushed 3 dB into RevLimiter on a mastering chain.', beforeUrl: null, afterUrl: null },
      { label: 'Drum bus — A/B', description: 'Acoustic kit summed bus, RevLimiter glueing the transients without choking the snare.', beforeUrl: null, afterUrl: null },
      { label: 'Full mix master — A/B', description: 'Indie-rock master, target -10 LUFS-I, RevLimiter as final stage.', beforeUrl: null, afterUrl: null },
    ],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
];

export const bySlug = (slug: string) => plugins.find((p) => p.slug === slug);

export const isBuyable = (p: Plugin) => p.status === 'live' && !!p.paddlePriceId && !!PADDLE.token;

export const fmtPrice = (usd: number | null) => (usd == null ? '—' : `$${usd}`);

export const discountPct = (p: Plugin): number | null => {
  if (p.regularPriceUsd == null || p.introPriceUsd == null) return null;
  if (p.regularPriceUsd <= p.introPriceUsd) return null;
  return Math.round(((p.regularPriceUsd - p.introPriceUsd) / p.regularPriceUsd) * 100);
};
