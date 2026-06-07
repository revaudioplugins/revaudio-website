/**
 * Plugin catalog — single source of truth for store + marketing pages.
 *
 * Lifecycle:
 *   status: 'in-development' → no Buy CTA, only waitlist
 *   status: 'beta'           → Buy CTA shows but Gumroad URL = '#' until product live
 *   status: 'live'           → Buy CTA active, gumroadUrl set, demoUrl optional
 *
 * Prices are intent — flip when commerce launches.
 * gumroadUrl format: https://yoursubdomain.gumroad.com/l/<product-slug>
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
  gumroadUrl: string | null;
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
  formats: 'VST3 (AU + AAX planned)',
  daws: 'Cubase 12+, Studio One 6+, Reaper 7+, Ableton Live 11+, FL Studio 21+, Pro Tools 2023+',
};

/**
 * COMMERCE SWITCH — RevLimiter goes on sale the instant this URL is set.
 * Paste the Gumroad checkout link here (nothing else needs to change):
 *   https://<subdomain>.gumroad.com/l/<product>
 * While it's null the site shows the waitlist CTA — no broken buy button ships.
 */
const REVLIMITER_GUMROAD_URL: string | null = 'https://hameatbach.gumroad.com/l/Revlimiter';

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
    status: REVLIMITER_GUMROAD_URL ? 'live' : 'beta',
    statusLabel: REVLIMITER_GUMROAD_URL ? 'Available now' : 'Beta — Q3 2026',
    introPriceUsd: 56, // launch: 40% off the $93 regular ($55.80, rounded to $56)
    regularPriceUsd: 93,
    gumroadUrl: REVLIMITER_GUMROAD_URL,
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

export const isBuyable = (p: Plugin) => p.status === 'live' && !!p.gumroadUrl;

export const fmtPrice = (usd: number | null) => (usd == null ? '—' : `$${usd}`);

export const discountPct = (p: Plugin): number | null => {
  if (p.regularPriceUsd == null || p.introPriceUsd == null) return null;
  if (p.regularPriceUsd <= p.introPriceUsd) return null;
  return Math.round(((p.regularPriceUsd - p.introPriceUsd) / p.regularPriceUsd) * 100);
};
