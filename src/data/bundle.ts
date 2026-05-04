/**
 * Bundle product — sold separately from individual plugins.
 * Activate by setting status='live' and gumroadUrl.
 */

import { plugins } from './plugins';

export interface Bundle {
  slug: string;
  name: string;
  tagline: string;
  pitch: string;
  status: 'in-development' | 'beta' | 'live';
  statusLabel: string;
  bundlePriceUsd: number;
  individualSumUsd: number;
  gumroadUrl: string | null;
  includedSlugs: string[];
}

const sumIntro = (slugs: string[]) =>
  plugins
    .filter((p) => slugs.includes(p.slug))
    .reduce((sum, p) => sum + (p.introPriceUsd ?? 0), 0);

export const everythingBundle: Bundle = {
  slug: 'everything',
  name: 'The Everything Bundle',
  tagline: 'All four plugins, one purchase',
  pitch:
    'Every RevAudio plugin in the lineup. RevLimiter, The AC, The Cooker, and Maybach — owned, not subscribed, with free updates within each plugin\'s major version. Save when you commit to the full set.',
  status: 'in-development',
  statusLabel: 'Bundles open after first plugin ships',
  bundlePriceUsd: 129,
  individualSumUsd: sumIntro(['revlimiter', 'the-ac', 'the-cooker', 'maybach']),
  gumroadUrl: null,
  includedSlugs: ['revlimiter', 'the-ac', 'the-cooker', 'maybach'],
};

export const bundleSavingsPct = (b: Bundle) =>
  Math.round(((b.individualSumUsd - b.bundlePriceUsd) / b.individualSumUsd) * 100);

export const bundleSavingsUsd = (b: Bundle) => b.individualSumUsd - b.bundlePriceUsd;
