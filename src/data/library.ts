/**
 * The home TV's plugin library (WordWall.astro; branch feat/home-library, 2026-10-18): the categories, which
 * plugins the TV carries and in what order, and each one's price line and "Try it free" action. The per-plugin
 * copy (type word, five words, blurb, window alt) is the plugin's `library` entry in plugins.ts, so the TV and a
 * later "you may also like" read one source.
 *
 * Server-side only (Astro frontmatter): drift.ts reads node:fs. A client script gets what it needs as JSON in a
 * data attribute, never by importing this file.
 */
import { plugins, dlGateId, fmtPrice, type Plugin, type LibraryCatId } from './plugins';
import { drift } from './drift';
import { revfx } from './revfx';
import { site } from './site';

export interface LibraryCat {
  id: LibraryCatId | 'all';
  /** The label on the TV. */
  label: string;
  /** The label where room is short (phones). */
  short: string;
}

/** ALL: every plugin on the TV. The TV opens on it, so nobody has to pick a category to see what there is. */
export const ALL_CAT: LibraryCat = { id: 'all', label: 'All', short: 'All' };

/** Category order on the TV, after ALL. A category no plugin on the TV sits in is hidden, so the four before Free
 *  wait for their first plugin (research 2026-10-15: the peers' taxonomy; one plugin may sit in several). */
export const LIBRARY_CATS: LibraryCat[] = [
  { id: 'mastering', label: 'Mastering', short: 'Mastering' },
  { id: 'vocals', label: 'Vocals', short: 'Vocals' },
  { id: 'saturation', label: 'Saturation & Distortion', short: 'Saturation' },
  { id: 'modulation', label: 'Modulation & Stereo', short: 'Modulation' },
  { id: 'creative', label: 'Creative FX', short: 'Creative' },
  { id: 'reverb', label: 'Reverb & Delay', short: 'Reverb' },
  { id: 'eq', label: 'EQ & Dynamics', short: 'EQ' },
  { id: 'guitar', label: 'Guitar & Bass', short: 'Guitar' },
  { id: 'instruments', label: 'Instruments', short: 'Instruments' },
  { id: 'free', label: 'Free', short: 'Free' },
];

/** On the TV: it has its copy, and it can be tried or bought today (live, or an open trial like DRIFT's beta).
 *  The AC (in development, no trial) stays off. */
const onTv = (p: Plugin) => !!p.library && (p.status === 'live' || !!p.trialOpen);

/** TV order, after DRIFT: DRIFT goes first while it leads the homepage (drift.homeLead, Dan 2026-10-08, "first
 *  slide until Nov 1"), then drops back to its slot here. A plugin missing from the list goes last. */
const TV_ORDER = ['revlimiter', 'gas', 'gas2', 'drift', 'revfx', 'radio-roulette'];

export function tvPlugins(): Plugin[] {
  const rank = (p: Plugin) => {
    if (drift.homeLead && p.slug === 'drift') return -1;
    const i = TV_ORDER.indexOf(p.slug);
    return i === -1 ? TV_ORDER.length : i;
  };
  return plugins.filter(onTv).sort((a, b) => rank(a) - rank(b));
}

/** A plugin's categories on the TV: its own, plus Free when it is free (`isFree` is the one source of "free"). */
export const catsOf = (p: Plugin): LibraryCatId[] => [...(p.library?.cats ?? []), ...(p.isFree ? (['free'] as const) : [])];

/** The categories the TV shows: ALL, then every category that has at least one plugin on the TV. */
export const tvCats = (list: Plugin[] = tvPlugins()): LibraryCat[] => [
  ALL_CAT,
  ...LIBRARY_CATS.filter((c) => list.some((p) => catsOf(p).includes(c.id as LibraryCatId))),
];

/** The plugin's name on the TV. */
export const tvName = (p: Plugin) => p.library?.name ?? p.name;

/** Trial length of the paid plugins: RevLimiter's and Radio Roulette's LicenseManager::trialDaysRemaining() count
 *  30 days from the first launch (both sources checked 2026-10-18), and TrialGateModal says 30. */
export const PAID_TRIAL_DAYS = 30;

/** What it costs today, in plain words, beside the TV's main button. DRIFT's trial terms ride on its price line and
 *  its button (drift.ts phase; the page never guesses the phase from the clock). */
export function priceLine(p: Plugin): string {
  if (p.isFree) return 'Free';
  if (p.status === 'live' && p.introPriceUsd != null) return fmtPrice(p.introPriceUsd);
  if (p.slug === 'drift') return drift.phase === 'preopen' || drift.phase === 'open' ? 'Free beta' : `On sale ${drift.releaseLabel}`;
  return '';
}

/** The TV's main button. `attrs` = TrialGateModal's trigger (the email gate, mounted in BaseLayout); `href` = a
 *  plain link. */
export interface TvAction {
  label: string;
  /** Under the label, smaller: what you get. */
  sub?: string;
  href?: string;
  attrs?: Record<string, string | true>;
}

const registerUrl = site.downloadGate.workerUrl + '/download/register';

/** Try it free. A paid live plugin opens the trial gate with its licence-worker id (dlGateId, never the slug: the
 *  worker treats an unknown id as RevLimiter); a free one opens the same gate as a free download (GAS: the gate IS
 *  the delivery while `trialGateActive`, else its plain download link); DRIFT's open trial goes to its own page's
 *  sign-up (`/drift#try`: that console carries the formats and the keep-it routes, and its form is DRIFT's own). */
export function tryAction(p: Plugin): TvAction | null {
  const gate = (free: boolean): Record<string, string | true> => ({
    'data-trial-gate-open': true,
    'data-plugin-name': tvName(p),
    'data-plugin-slug': dlGateId(p),
    'data-register-url': registerUrl,
    ...(free ? { 'data-gate-free': true as const } : {}),
  });
  if (p.isFree) {
    if (!p.downloadUrl) return null;
    return p.trialGateActive
      ? { label: 'Free download', sub: 'Mac + Windows', attrs: gate(true) }
      : { label: 'Free download', sub: 'Mac + Windows', href: p.downloadUrl };
  }
  if (p.status === 'live') {
    return { label: `Try free for ${PAID_TRIAL_DAYS} days`, sub: 'Full version · no credit card', attrs: gate(false) };
  }
  if (p.slug === 'drift' && p.trialOpen && (drift.phase === 'open' || drift.phase === 'preopen')) {
    return { label: `Try free for ${drift.trialDays} days`, sub: 'Download by email', href: '/drift#try' };
  }
  // RevFX's open trial (not 'live' yet: no price) opens the same gate as a paid plugin once the worker knows it
  // (revfx.ts gateWired); the sub says Mac while the Windows installer waits on its signature (winReady).
  if (p.slug === 'revfx' && p.trialOpen && revfx.gateWired) {
    return { label: `Try free for ${revfx.trialDays} days`, sub: revfx.winReady ? 'Full version · no credit card' : 'Mac · full version · no credit card', attrs: gate(false) };
  }
  return null;
}
