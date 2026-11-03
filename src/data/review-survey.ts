/**
 * Review: the question bank of /review (src/pages/review.astro), the public
 * page that replaced RevBeta (Yoni, 2026-11-03). A visitor picks a plugin,
 * answers general questions that fit every plugin, rates it 1-10 and gets ONE
 * 10% site-wide code by email (one per email, ever; 60 days).
 *
 * The skeleton is RevLimiter's beta survey (beta-survey.ts), made general:
 * anything that named RevLimiter's own controls, its licence or its price is
 * gone. `{p}` in a label is the picked plugin's name (the page swaps it in).
 *
 * `id` = the stored field name: keep ids snake_case and STABLE forever (a
 * rename splits the data). To change wording, edit `en` only. Closed answers
 * are stored as their `code`, never the label.
 */
import type { QType as BetaQType } from './beta-survey';

export type QType = BetaQType | 'rating10' | 'email';

export interface Choice {
  code: string;
  en: string;
}

export interface Question {
  id: string;
  section: string;
  type: QType;
  required: boolean;
  en: string;
  helpEn?: string;
  choices?: Choice[];
  /** Adds an "Other" choice with a free-text input, stored in `${id}_other`. */
  hasOther?: boolean;
  /** likert only: a "not applicable" option that stores nothing. */
  allowNa?: boolean;
  scale?: { lowEn: string; highEn: string };
  /** A free-text follow-up shown when the answer is in `whenIn`. */
  reveal?: { whenIn: string[]; field: { id: string; type: 'text' | 'shorttext'; en: string } };
  maxLen?: number;
  /** Only for a plugin with a price today (the page hides it, and drops it from the required set, for a free one). */
  paidOnly?: boolean;
}

export interface Section {
  id: string;
  en: string;
}

/** The plugins a visitor can review, in picker order. A slug must be a plugin in plugins.ts. Add one as it ships. */
export const REVIEW_PLUGINS = ['revlimiter', 'drift', 'radio-roulette', 'gas'] as const;

export const reviewMeta = {
  version: 1,
  offPercent: 10,
  codeDays: 60,
  ui: {
    title: 'Review a plugin',
    intro:
      'Tell us how it really went, good and bad. Finish the review and we email you a 10% code for any RevAudio plugin. About 4 minutes.',
    pickTitle: 'Which plugin are you reviewing?',
    required: 'required',
    optional: 'optional',
    other: 'Other',
    otherPlaceholder: 'please specify…',
    na: 'N/A',
    submit: 'Send my review',
    sending: 'Sending…',
    thanksTitle: 'Check your inbox',
    thanksBody: 'Thanks for the honest review. Your 10% code is on its way to {email}. It works on any RevAudio plugin for 60 days.',
    previewNote: 'Preview: the form is not connected yet, nothing was sent.',
    err: 'Something went wrong. Try again, or email info@revaudio.net.',
    already: 'This email already got its review code. Thank you for reviewing again!',
    requiredMissing: 'Some required questions are unanswered (highlighted).',
    fairness: 'Everyone who finishes gets the code. Your score never changes that.',
  },
} as const;

export const sections: Section[] = [
  { id: 'about', en: 'About you' },
  { id: 'install', en: 'Install & first open' },
  { id: 'ui', en: 'Interface' },
  { id: 'sound', en: 'Sound' },
  { id: 'bugs', en: 'Bugs & stability' },
  { id: 'value', en: 'Value' },
  { id: 'open', en: 'In your words' },
  { id: 'rating', en: 'Your rating' },
];

const AGREE_SCALE = { lowEn: 'Strongly disagree', highEn: 'Strongly agree' };

export const questions: Question[] = [
  // ── about you ─────────────────────────────────────────────────────────────
  {
    id: 'role',
    section: 'about',
    type: 'single',
    required: true,
    en: 'Your main role',
    choices: [
      { code: 'producer', en: 'Producer' },
      { code: 'mixing_engineer', en: 'Mixing engineer' },
      { code: 'mastering_engineer', en: 'Mastering engineer' },
      { code: 'artist_hobbyist', en: 'Artist / hobbyist' },
    ],
    hasOther: true,
  },
  {
    id: 'experience',
    section: 'about',
    type: 'single',
    required: false,
    en: 'Years working with audio',
    choices: [
      { code: 'lt2', en: 'Under 2' },
      { code: '2_5', en: '2–5' },
      { code: '6_10', en: '6–10' },
      { code: 'gt10', en: '10+' },
    ],
  },
  {
    id: 'daw',
    section: 'about',
    type: 'multi',
    required: true,
    en: 'Which DAW(s) did you use {p} in?',
    choices: [
      { code: 'ableton', en: 'Ableton Live' },
      { code: 'logic', en: 'Logic Pro' },
      { code: 'fl_studio', en: 'FL Studio' },
      { code: 'pro_tools', en: 'Pro Tools' },
      { code: 'cubase', en: 'Cubase' },
      { code: 'studio_one', en: 'Studio One' },
      { code: 'reaper', en: 'Reaper' },
      { code: 'bitwig', en: 'Bitwig' },
    ],
    hasOther: true,
  },
  {
    id: 'os',
    section: 'about',
    type: 'single',
    required: true,
    en: 'Operating system',
    choices: [
      { code: 'macos', en: 'macOS' },
      { code: 'windows', en: 'Windows' },
    ],
  },
  {
    id: 'format',
    section: 'about',
    type: 'single',
    required: false,
    en: 'Plugin format you used',
    choices: [
      { code: 'vst3', en: 'VST3' },
      { code: 'au', en: 'AU (Audio Unit)' },
      { code: 'aax', en: 'AAX (Pro Tools)' },
    ],
  },
  {
    id: 'attribution',
    section: 'about',
    type: 'single',
    required: false,
    en: 'How did you first hear about {p}?',
    choices: [
      { code: 'team', en: 'Directly from the team' },
      { code: 'friend', en: 'Friend / colleague' },
      { code: 'youtube', en: 'YouTube' },
      { code: 'instagram_tiktok', en: 'Instagram / TikTok' },
      { code: 'forum_reddit', en: 'Forum / Reddit' },
      { code: 'facebook', en: 'Facebook group' },
      { code: 'search_ad', en: 'Google search / an ad' },
    ],
    hasOther: true,
  },

  // ── install & first open ──────────────────────────────────────────────────
  {
    id: 'install_result',
    section: 'install',
    type: 'single',
    required: true,
    en: 'Getting {p} installed and open in your DAW was…',
    choices: [
      { code: 'smooth', en: 'Smooth' },
      { code: 'minor_confusion', en: 'A little confusing' },
      { code: 'got_stuck', en: 'I got stuck' },
      { code: 'failed', en: "It didn't work" },
    ],
    reveal: {
      whenIn: ['minor_confusion', 'got_stuck', 'failed'],
      field: { id: 'install_detail', type: 'text', en: 'What happened?' },
    },
  },
  {
    id: 'onboarding_friction',
    section: 'install',
    type: 'text',
    required: false,
    en: 'Anything that slowed you down from download to the first sound?',
    maxLen: 2000,
  },

  // ── interface ─────────────────────────────────────────────────────────────
  {
    id: 'theme_clarity',
    section: 'ui',
    type: 'single',
    required: true,
    en: 'The car-world design of {p} (its names, gauges and parts): did it help or get in the way?',
    choices: [
      { code: 'clearer', en: 'Helped me understand it' },
      { code: 'no_effect', en: 'No real effect either way' },
      { code: 'confusing', en: 'Confused me / got in the way' },
    ],
  },
  {
    id: 'usable_no_docs',
    section: 'ui',
    type: 'likert5',
    required: true,
    en: 'I could use {p} without reading any manual.',
    scale: AGREE_SCALE,
  },
  {
    id: 'ui_change',
    section: 'ui',
    type: 'text',
    required: false,
    en: 'Which control was unclear, or what would you change in the interface?',
    maxLen: 2000,
  },

  // ── sound ─────────────────────────────────────────────────────────────────
  {
    id: 'sound_quality',
    section: 'sound',
    type: 'likert5',
    required: true,
    en: 'Overall sound quality of {p}',
    scale: { lowEn: 'Poor', highEn: 'Excellent' },
  },
  {
    id: 'used_on',
    section: 'sound',
    type: 'multi',
    required: true,
    en: 'What did you use it on?',
    choices: [
      { code: 'vocals', en: 'Vocals' },
      { code: 'drums', en: 'Drums' },
      { code: 'bass', en: 'Bass' },
      { code: 'instruments', en: 'Instruments' },
      { code: 'mix_bus', en: 'Mix bus' },
      { code: 'master', en: 'Master' },
      { code: 'sound_design', en: 'Sound design' },
    ],
    hasOther: true,
  },
  {
    id: 'vs_goto',
    section: 'sound',
    type: 'single',
    required: true,
    en: 'Compared to what you normally use for this job, {p} sounds…',
    choices: [
      { code: 'better', en: 'Better' },
      { code: 'on_par', en: 'On par' },
      { code: 'slightly_behind', en: 'Slightly behind' },
      { code: 'much_behind', en: 'Much behind' },
      { code: 'nothing_like_it', en: "I don't have anything like it" },
    ],
  },
  {
    id: 'goto_name',
    section: 'sound',
    type: 'shorttext',
    required: false,
    en: 'What do you normally use for this job?',
    helpEn: 'A plugin name is perfect.',
    maxLen: 200,
  },
  {
    id: 'use_intent',
    section: 'sound',
    type: 'single',
    required: true,
    en: 'Will {p} stay in your sessions?',
    choices: [
      { code: 'replace', en: "Yes, it replaces what I used" },
      { code: 'alongside', en: 'Yes, alongside my usual' },
      { code: 'occasional', en: 'Now and then' },
      { code: 'wouldnt', en: 'Probably not' },
    ],
  },
  {
    id: 'cpu_perf',
    section: 'sound',
    type: 'likert5',
    required: false,
    allowNa: true,
    en: 'CPU / performance was fine for the way I work.',
    scale: AGREE_SCALE,
  },

  // ── bugs ──────────────────────────────────────────────────────────────────
  {
    id: 'bugs',
    section: 'bugs',
    type: 'multi',
    required: true,
    en: 'Did you hit any bugs? (select all that apply)',
    choices: [
      { code: 'crash', en: 'Crash' },
      { code: 'audio_glitch', en: 'Audio glitch / dropout' },
      { code: 'graphics', en: 'Graphical glitch' },
      { code: 'high_cpu', en: 'Unusually high CPU' },
      { code: 'preset_issue', en: 'Preset issue' },
      { code: 'param_issue', en: "A control didn't respond" },
      { code: 'latency_pdc', en: 'Latency / timing issue' },
      { code: 'none', en: 'No bugs' },
    ],
    reveal: {
      whenIn: ['crash', 'audio_glitch', 'graphics', 'high_cpu', 'preset_issue', 'param_issue', 'latency_pdc'],
      field: { id: 'bug_detail', type: 'text', en: 'Describe the bug(s), with your DAW + OS.' },
    },
  },

  // ── value ─────────────────────────────────────────────────────────────────
  {
    id: 'worth_price',
    section: 'value',
    type: 'single',
    required: true,
    paidOnly: true,
    en: 'At {price}, {p} is…',
    choices: [
      { code: 'clear_yes', en: 'Clearly worth it' },
      { code: 'probably', en: 'Probably worth it' },
      { code: 'unsure', en: 'Unsure' },
      { code: 'too_expensive', en: 'Too expensive' },
    ],
  },
  {
    id: 'nps',
    section: 'value',
    type: 'nps',
    required: true,
    en: 'How likely are you to recommend {p} to a friend?',
    scale: { lowEn: 'Not at all likely', highEn: 'Extremely likely' },
  },
  {
    id: 'testimonial',
    section: 'value',
    type: 'single',
    required: false,
    en: 'Can we quote your review on our site?',
    choices: [
      { code: 'yes_name', en: 'Yes, with my name' },
      { code: 'yes_anon', en: 'Yes, anonymously' },
      { code: 'no', en: 'No' },
    ],
    reveal: {
      whenIn: ['yes_name'],
      field: { id: 'testimonial_name', type: 'shorttext', en: 'Name / handle to credit' },
    },
  },

  // ── in your words ─────────────────────────────────────────────────────────
  {
    id: 'loved_most',
    section: 'open',
    type: 'text',
    required: false,
    en: 'What did you love most?',
    maxLen: 2000,
  },
  {
    id: 'change_one',
    section: 'open',
    type: 'text',
    required: false,
    en: 'The ONE thing you would change:',
    maxLen: 2000,
  },
  {
    id: 'missing_feature',
    section: 'open',
    type: 'text',
    required: false,
    en: 'Any feature you felt was missing?',
    maxLen: 2000,
  },

  // ── rating ────────────────────────────────────────────────────────────────
  {
    id: 'rating',
    section: 'rating',
    type: 'rating10',
    required: true,
    en: 'Your rating for {p}',
  },
  {
    id: 'email',
    section: 'rating',
    type: 'email',
    required: true,
    en: 'Your email',
    helpEn: 'Your 10% code goes here. One code per email.',
    maxLen: 254,
  },
];

/** The words under the 1-10 rating readout. */
export const ratingWords: Record<number, string> = {
  1: 'Stalled',
  2: 'Stalled',
  3: 'Rough ride',
  4: 'Rough ride',
  5: 'Gets there',
  6: 'Gets there',
  7: 'Good drive',
  8: 'Good drive',
  9: 'Redline',
  10: 'Redline',
};
