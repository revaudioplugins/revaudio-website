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

export interface Plugin {
  slug: string;
  name: string;
  tagline: string;
  oneLiner: string;
  longPitch: string;
  status: PluginStatus;
  statusLabel: string;
  introPriceUsd: number | null;
  regularPriceUsd: number | null;
  gumroadUrl: string | null;
  demoUrl: string | null;
  releaseTarget: string;
}

export const plugins: Plugin[] = [
  {
    slug: 'revlimiter',
    name: 'RevLimiter',
    tagline: 'Mastering limiter built around a car rev gauge',
    oneLiner:
      'Mastering limiter built around a car rev gauge. Multi-band, oversampled, true-peak ceiling. The redline is your threshold.',
    longPitch:
      'A mastering limiter that makes loudness, depth, and punch feel like floor-it-and-go. Multi-band compression, analog-modelled saturation, and an adaptive limiter chained the way a top-tier mastering engineer would chain them.',
    status: 'beta',
    statusLabel: 'Beta — Q3 2026',
    introPriceUsd: 49,
    regularPriceUsd: 79,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: 'Q3 2026',
  },
  {
    slug: 'the-ac',
    name: 'The AC',
    tagline: 'Air-band exciter / tube saturator with a car AC dashboard',
    oneLiner:
      'Air-band exciter and tube saturator with a car AC dashboard. Cold air to warm shine — turn the dial and breathe into the mix.',
    longPitch:
      'A hybrid between an exciter and a saturator, focused on the air band. Gentle high-shelf boost → tube saturation → intelligent dynamic EQ that suppresses resonances before they sting.',
    status: 'in-development',
    statusLabel: 'In development',
    introPriceUsd: 39,
    regularPriceUsd: 59,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: 'Q4 2026',
  },
  {
    slug: 'the-cooker',
    name: 'The Cooker',
    tagline: 'Multi-band stereo panner with autopilot',
    oneLiner:
      'Multi-band panner with autopilot. Pan, saturate, reverb, and tremolo per band — set it and let the stereo image cook itself.',
    longPitch:
      'Per-band saturation, reverb, and tremolo with an Autopilot LFO mode. Auto Swerve adds drift so the movement never feels mechanical. A static synth pad turns into a living, drifting stereo field.',
    status: 'in-development',
    statusLabel: 'In development',
    introPriceUsd: 39,
    regularPriceUsd: 59,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: 'Q4 2026',
  },
  {
    slug: 'maybach',
    name: 'Maybach',
    tagline: 'Dynamic EQ with a Maybach suspension visualiser',
    oneLiner:
      'Dynamic EQ with a Maybach suspension that bounces in time with your spectral moves. Auto-mode tames peaks before you hear them.',
    longPitch:
      'A dynamic EQ that visualises spectral movement as a luxury car\'s rear suspension. Auto mode finds peaks and smooths them. Manual bands behave like any modern dynamic EQ — but the feedback is the car. You see the work happening.',
    status: 'in-development',
    statusLabel: 'Coming',
    introPriceUsd: 49,
    regularPriceUsd: 79,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: '2027',
  },
];

export const bySlug = (slug: string) => plugins.find((p) => p.slug === slug);

export const isBuyable = (p: Plugin) => p.status === 'live' && !!p.gumroadUrl;

export const fmtPrice = (usd: number | null) => (usd == null ? '—' : `$${usd}`);
