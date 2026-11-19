/**
 * /widebeam Owner's Manual (lane S): #manual, WbManual.astro, the words in `manual` (src/data/widebeam.ts).
 *
 * Chapters: each is an <a href="#wb-step-0N"> that works without JS. With JS a click drives the page to the middle of
 * that step's lit range (the step's [data-step-mark], placed by story.ts) and is stopped there, so Lenis's own anchor
 * handling (motion.ts `anchors`, a click listener on window) never moves the page as well: one mover. Focus follows to the
 * step on arrival. A modified click (new tab, etc.) is left alone. Once a film exists, a chapter with a time starts the
 * film there instead.
 *
 * The film (only when manual.youtubeId or manual.src is set): the click on the facade builds the player then, never
 * before (0 bytes from YouTube until the tap), stops the page's own sound (stopForFilm), moves focus into the player
 * and, with cookie consent only, tells gtag `video_start`. YouTube: youtube-nocookie with autoplay, captions on, no
 * related videos, no playsinline (a phone opens it full screen); a chapter reloads it with &start=N (the live CSP has no
 * www.youtube.com script, so there is no IFrame API to seek with). Self-hosted: a <video preload="none"> with its
 * captions track; at its end the ask and Watch again.
 */
import { driveTo } from './drive-to';
import { stopForFilm } from './sound';

const consented = () => { try { return localStorage.getItem('ra-cookie-consent') === 'accepted'; } catch { return false; } };
const track = (name: string) => {
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (consented() && typeof g === 'function') g('event', name, { video_title: 'widebeam_manual' });
};

export function initManual(page: HTMLElement) {
  const sec = page.querySelector<HTMLElement>('#manual');
  if (!sec) return;
  const frame = sec.querySelector<HTMLElement>('[data-wb-manual-frame]');
  const glass = sec.querySelector<HTMLElement>('[data-wb-manual-glass]');
  const film = glass?.dataset.film as 'yt' | 'self' | undefined;
  let player: HTMLIFrameElement | HTMLVideoElement | null = null;

  function play(start: number | null) {
    if (!glass || !film) return;
    stopForFilm();
    glass.classList.add('is-playing');
    if (film === 'yt') {
      const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(glass.dataset.ytId || '')}?autoplay=1&rel=0&cc_load_policy=1&cc_lang_pref=en${start ? `&start=${Math.round(start)}` : ''}`;
      if (!player) {
        const f = document.createElement('iframe');
        f.title = glass.dataset.title || '';
        f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        f.allowFullscreen = true;
        f.src = src;
        glass.querySelector('[data-wb-manual-play]')?.replaceWith(f);
        player = f;
        track('video_start');
      } else (player as HTMLIFrameElement).src = src;
    } else {
      let v = player as HTMLVideoElement | null;
      if (!v) {
        v = document.createElement('video');
        v.controls = true; v.preload = 'none'; v.title = glass.dataset.title || '';
        v.src = glass.dataset.src || '';
        if (glass.dataset.captions) {
          const t = document.createElement('track');
          t.kind = 'captions'; t.srclang = 'en'; t.label = 'English'; t.src = glass.dataset.captions; t.default = true;
          v.appendChild(t);
        }
        v.addEventListener('play', () => { stopForFilm(); end?.setAttribute('hidden', ''); });
        v.addEventListener('ended', () => { track('video_complete'); end?.removeAttribute('hidden'); end?.querySelector<HTMLElement>('[data-wb-manual-ask]')?.focus({ preventScroll: true }); });
        glass.querySelector('[data-wb-manual-play]')?.replaceWith(v);
        player = v;
        track('video_start');
      }
      const go = () => { if (start != null) v!.currentTime = start; v!.play().catch(() => {}); };
      if (start != null && v.readyState < 1) { v.addEventListener('loadedmetadata', () => { v!.currentTime = start; }, { once: true }); v.play().catch(() => {}); }
      else go();
    }
    player.focus({ preventScroll: true });
  }

  const end = glass?.querySelector<HTMLElement>('[data-wb-manual-end]') ?? null;
  glass?.querySelector('[data-wb-manual-play]')?.addEventListener('click', () => play(null));
  end?.querySelector('[data-wb-manual-again]')?.addEventListener('click', () => {
    const v = player as HTMLVideoElement | null;
    if (!v) return;
    end.setAttribute('hidden', '');
    v.currentTime = 0; v.play().catch(() => {}); v.focus({ preventScroll: true });
  });

  sec.querySelectorAll<HTMLAnchorElement>('[data-wb-chapter]').forEach((a) => a.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const at = a.dataset.at != null ? Number(a.dataset.at) : null;
    const step = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (at == null && !step) return; // nothing to drive to: let the browser have it
    e.preventDefault();
    e.stopPropagation(); // Lenis's anchor listener sits on window: it never sees this click
    if (at != null && film) {
      play(at);
      if (frame) driveTo(frame, { align: 'face' });
      return;
    }
    const mark = step!.querySelector<HTMLElement>('[data-step-mark]') ?? step!;
    driveTo(mark, { align: 'top', onArrive: () => step!.focus({ preventScroll: true }) });
  }));
}
