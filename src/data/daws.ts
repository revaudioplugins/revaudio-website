/**
 * DAW compatibility — drives the homepage compatibility strip.
 *
 * Logos: place a monochrome SVG/PNG at /public/daws/<slug>.svg.
 *        Until logos are dropped in, the strip renders as text-only badges.
 */

export interface DAW {
  slug: string;
  name: string;
  tested: boolean;
  logo: string | null;
}

export const daws: DAW[] = [
  { slug: 'cubase',     name: 'Cubase',       tested: true,  logo: null },
  { slug: 'studio-one', name: 'Studio One',   tested: true,  logo: null },
  { slug: 'reaper',     name: 'Reaper',       tested: true,  logo: null },
  { slug: 'ableton',    name: 'Ableton Live', tested: true,  logo: null },
  { slug: 'fl-studio',  name: 'FL Studio',    tested: true,  logo: null },
  { slug: 'pro-tools',  name: 'Pro Tools',    tested: true,  logo: null },
  { slug: 'logic',      name: 'Logic Pro',    tested: false, logo: null },
];
