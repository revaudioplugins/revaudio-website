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

export const plugins: Plugin[] = [
  {
    slug: 'revlimiter',
    name: 'RevLimiter',
    category: 'limiter',
    tagline: 'Mastering limiter built around a car rev gauge',
    oneLiner:
      'The redline is your threshold. The needle is your gain reduction. Mastering loudness with the muscle of a tuned engine.',
    longPitch:
      'A mastering limiter that makes loudness, depth, and punch feel like flooring it on an open road. Multi-band compression, analog-modelled saturation, and an adaptive limiter chained the way a top-tier mastering engineer would chain them. Sits early on your master bus, glues the mix, and holds a true-peak ceiling at oversampled rate.',
    status: 'beta',
    statusLabel: 'Beta — Q3 2026',
    introPriceUsd: 49,
    regularPriceUsd: 79,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: 'Q3 2026',
    heroImage: null,
    galleryImages: [],
    features: [
      { name: 'True-peak limiting', desc: 'Inter-sample peak control at oversampled rate. Hard-clip safety net at base-rate keeps the ceiling honest.' },
      { name: 'Adaptive multi-band release', desc: 'Per-band envelope tracking. Bass holds, mids breathe, highs respond — no static release time fights your material.' },
      { name: 'Analog-modelled saturation', desc: 'Asymmetric soft-to-hard curve with DC-block. Adds density and weight before the brick wall.' },
      { name: 'Pro-tier metering', desc: 'True peak + max peak + LUFS-M/S/I + LRA + per-band GR. RT-safe, audited against external mastering meters.' },
      { name: '16× oversampling', desc: 'Optional. Worth the cost when you need surgical inter-sample control on dense mixes.' },
      { name: 'Visual rev gauge', desc: 'Redline = threshold. Needle = gain reduction. You know what is happening at a glance.' },
      { name: 'A/B compare', desc: 'Two state slots. Switch instantly. Compare without leaving the plugin.' },
      { name: 'Lookahead with PDC', desc: 'Reported correctly to the host. No phase drift on your master bus.' },
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
  {
    slug: 'the-ac',
    name: 'The AC',
    category: 'saturation',
    tagline: 'Air-band exciter / tube saturator with a car AC dashboard',
    oneLiner:
      'Cold air to warm shine. Turn the temperature knob and breathe into the mix.',
    longPitch:
      'A hybrid between an exciter and a saturator, focused on the air band where mixes either sparkle or sting. Cold mode opens a gentle high shelf. Hot mode brings asymmetric tube saturation. Mid is both. An intelligent dynamic EQ underneath suppresses resonances before they bite. The dashboard reads in degrees Fahrenheit and fan bars because mixing should feel like driving, not menu-diving.',
    status: 'in-development',
    statusLabel: 'Coming',
    introPriceUsd: 39,
    regularPriceUsd: 59,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: 'Q4 2026',
    heroImage: null,
    galleryImages: [],
    features: [
      { name: 'Cold / Mid / Hot modes', desc: 'Cold = high-shelf exciter. Hot = tube saturator. Mid = blended. One knob, three flavours of air.' },
      { name: 'Soothe-style resonance suppression', desc: 'Narrow-band dynamic EQ catches sibilance and ringing before they reach your ears.' },
      { name: 'Parallel-compressed HP returns', desc: 'Two overlapping high-passes around 3 kHz and 9 kHz with gentle compression — air boost without the de-essing fight.' },
      { name: 'Fan-speed visualiser', desc: 'Animated fan bars track the saturation amount. Glance, not stare.' },
      { name: 'Asymmetric tube curve', desc: 'tanh(x) + a*tanh(x)^2 with DC-block. Brings second-harmonic warmth, not buzzsaw fizz.' },
    ],
    audioDemos: [
      { label: 'Female vocal — Cold', description: 'High-shelf exciter mode on a thinly-recorded vocal.', beforeUrl: null, afterUrl: null },
      { label: 'Acoustic guitar — Hot', description: 'Tube saturation across an open-tuned strum.', beforeUrl: null, afterUrl: null },
      { label: 'Mix bus — Mid', description: 'Both flavours blended over a finished mix.', beforeUrl: null, afterUrl: null },
    ],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
  {
    slug: 'the-cooker',
    name: 'The Cooker',
    category: 'panner',
    tagline: 'Stereo panner with autopilot',
    oneLiner:
      'Set the stereo image, hit autopilot, and let it cook itself.',
    longPitch:
      'A creative stereo tool. Dial in the target frequency range with HP and LP cutoffs, pan it left and right, sprinkle saturation, reverb, and tremolo into the mix, then engage Autopilot and let an LFO drive the movement. Auto Swerve adds drift so the path never feels mechanical. A static synth pad turns into a living, drifting stereo field.',
    status: 'in-development',
    statusLabel: 'Coming',
    introPriceUsd: 39,
    regularPriceUsd: 59,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: 'Q4 2026',
    heroImage: null,
    galleryImages: [],
    features: [
      { name: 'Single-band panner with Autopilot', desc: 'LFO-driven pan automation. Set the rate, sit back, and let the mix breathe.' },
      { name: 'Auto Swerve', desc: 'Adds drift to the autopilot path. No two passes feel identical — never mechanical.' },
      { name: 'Per-mode FX', desc: 'Saturation, reverb, and tremolo blendable into the panned signal.' },
      { name: 'Preset bank', desc: 'Steering presets for fast deployment on pads, vocals, and synths.' },
      { name: 'Dashboard-style UI', desc: 'Steering wheel as the master controller, gauges as parameter readouts.' },
    ],
    audioDemos: [
      { label: 'Synth pad — Off / Autopilot', description: 'Static lush pad before and after Autopilot drift.', beforeUrl: null, afterUrl: null },
      { label: 'Vocal — band pan', description: 'High-band pan only on a lead vocal — adds width without losing the centre.', beforeUrl: null, afterUrl: null },
      { label: 'Full mix — Auto Swerve', description: 'Subtle drift across a finished mix.', beforeUrl: null, afterUrl: null },
    ],
    systemReq: baseSystemReq,
    reviewsCount: 0,
    reviewsAvg: 0,
  },
  {
    slug: 'maybach',
    name: 'Maybach',
    category: 'eq',
    tagline: 'Dynamic EQ with a Maybach suspension visualiser',
    oneLiner:
      'A dynamic EQ that bounces in time with your spectral moves.',
    longPitch:
      'A dynamic EQ that visualises spectral movement as a luxury car\'s rear suspension. Auto mode finds peaks and smooths them. Manual bands behave like any modern dynamic EQ — threshold, ratio, attack, release — but the feedback is the car. You see the work happening as the wheels and shocks respond.',
    status: 'in-development',
    statusLabel: 'Coming',
    introPriceUsd: 49,
    regularPriceUsd: 79,
    gumroadUrl: null,
    demoUrl: null,
    releaseTarget: '2027',
    heroImage: null,
    galleryImages: [],
    features: [
      { name: 'Auto peak smoothing', desc: 'One-knob mode that finds and tames resonances before you have to dial them in.' },
      { name: 'Suspension visualiser', desc: 'Wheels and shocks bounce in sync with each band\'s gain reduction. Watch the EQ work.' },
      { name: 'Per-band dynamics', desc: 'Threshold, ratio, attack, release — modern dynamic-EQ control on every band.' },
      { name: 'Mid/Side processing', desc: 'Sides on, centre off — typical surgical mid/side workflow.' },
    ],
    audioDemos: [],
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
