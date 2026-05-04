/**
 * Press / "as featured in" logos.
 *
 * Add an entry only when a real publication has covered RevAudio.
 * Until populated, the press strip renders nothing (component handles empty array).
 */

export interface Press {
  slug: string;
  name: string;
  url: string;
  quote?: string;
  date?: string;
  logo: string | null;
}

export const press: Press[] = [
  // {
  //   slug: 'sound-on-sound',
  //   name: 'Sound on Sound',
  //   url: 'https://soundonsound.com/...',
  //   quote: 'Optional pull-quote from the article.',
  //   date: '2026-09-01',
  //   logo: '/press/sound-on-sound.svg',
  // },
];
