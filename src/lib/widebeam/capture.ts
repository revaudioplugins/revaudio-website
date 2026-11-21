/**
 * /widebeam sign-ups (lane A, A.1): the plate under the hero and the closer carry the same one ask, every word from
 * askFor(phase) in src/data/widebeam.ts (the forms' data-msg-ok / data-msg-already, data-register-url and the hidden
 * source). Pre-open the forms post source 'widebeam-notify' to /form-once, which relays it to the list (copy-01).
 *
 * One sign-up is the done state on EVERY surface: each [data-wb-trial] / [data-wb-form] goes, each status line says
 * it, each [data-wb-ask] gets .is-joined and data-wb-done, <html> gets data-wb-joined (the phone bar leaves:
 * furniture.ts) and the page hears a 'wb:joined' event (the closer's lamps go to full beam).
 * A [data-wb-ask] with no form in it is a LINE (the one under the manual: "WIDE BEAM isn't out yet ... Email me at
 * launch"): its words become the done message, since its ask and its link to the plate are spent. A form surface keeps
 * its markup; its own status line carries the message.
 *
 * Conversion events (guidelines-14): fbq StartTrial + the Google Ads conversion, the house's two guarded lines
 * (TrialPlates / TrialStamp), fire ONLY when the trial gate is wired (the form has data-register-url, i.e.
 * gateWired), /download/register answered ok and the visitor accepted cookies. Pre-open none of that is true, so
 * nothing fires.
 */
import { ScrollTrigger, lenis } from '../motion';
import { deckOn, driveDestination, isDriving } from './drive-to';

const CONSENT_KEY = 'ra-cookie-consent'; // CookieBanner.astro
const ADS_CONVERSION = 'AW-18334323184/KDtwCLHa4dIcEPCjvqZE'; // TrialStamp.astro / TrialPlates.astro

type Reply = { ok?: boolean; already?: boolean; error?: string } | null;

export function initCapture(page: HTMLElement) {
  const surfaces = [
    { form: page.querySelector<HTMLFormElement>('form[data-wb-trial]'), status: page.querySelector<HTMLElement>('[data-wb-trial-status]') },
    { form: page.querySelector<HTMLFormElement>('form[data-wb-form]'), status: page.querySelector<HTMLElement>('[data-wb-status]') },
  ];
  const joinAll = (msg: string, from: HTMLElement | null) => {
    for (const s of surfaces) {
      if (s.form) s.form.hidden = true;
      if (s.status) { s.status.textContent = msg; s.status.classList.add('ok'); s.status.classList.remove('err'); }
    }
    page.querySelectorAll<HTMLElement>('[data-wb-ask]').forEach((a) => {
      a.classList.add('is-joined');
      a.setAttribute('data-wb-done', '');
      if (!a.querySelector('[data-wb-trial], [data-wb-form]')) a.textContent = msg;
    });
    document.documentElement.setAttribute('data-wb-joined', '');
    from?.focus({ preventScroll: true });
    page.dispatchEvent(new CustomEvent('wb:joined'));
  };
  surfaces.forEach((s) => bindSignup(s.form, s.status, joinAll));
  keepPlaceOnTurn(page);
}

/**
 * A turn of the phone (or any width change): the svh heights of the hero and the story change the page's length, the
 * browser clamps the scroll, and ScrollTrigger's refresh then puts back a raw pixel scrollY. So in Chrome a focused
 * sign-up field ended 502 px above the screen sideways and 2146 px below it upright again (r-cross-rotate), and a visitor
 * on the dash lost it: upright to sideways the face landed ~459 px above the screen, sideways to upright the deck went
 * below it (r-cross-turndash). D7 B invites that turn (the deck is the control upright, the face sideways).
 * After each refresh that follows a resize, the place the visitor had at the last settled size comes back:
 *  - a sign-up field that was focused AND fully on screen goes to the middle of the clear band (under the nav, over the
 *    cookie banner / phone bar: --wb-lift);
 *  - else, on a TURN (the screen's orientation or the phone deck flipped) with the dash ([data-wb-dash]: the face, the
 *    deck, the console) across the middle of that band, the page goes where "Take it for a drive" lands at the new size
 *    (driveDestination: the face centred, or on an upright phone the face at the top with the deck under it): the
 *    control changes sides there (D7 B), so the place to keep is the control;
 *  - else the block across the top of that band (a road step, else the page's section) keeps the same share of itself
 *    above the band: without it a turn sideways put the road's step 03 1765 px above the screen, the glove box 1102 px,
 *    and the manual came back upright 596-1055 px lower. On a laptop resize (1141 -> 1041 / 800, or 80 px less height)
 *    the road, the manual and the closer stay within 14-53 px, and a visitor parked off the dash's landing stays off it.
 * Each move is checked once more after the nav and the phone bar have settled.
 */
function keepPlaceOnTurn(page: HTMLElement) {
  const html = document.documentElement;
  const dash = page.querySelector<HTMLElement>('[data-wb-dash]');
  const face = page.querySelector<HTMLElement>('[data-wb-face]');
  const field = () => { const a = document.activeElement; return a instanceof HTMLInputElement && page.contains(a) && a.closest('form[data-wb-trial], form[data-wb-form]') ? a : null; };
  const band = () => {
    const nav = document.querySelector('nav[data-site-nav], header');
    const top = Math.max(0, nav ? nav.getBoundingClientRect().bottom : 0);
    return { top, bottom: innerHeight - (parseFloat(html.style.getPropertyValue('--wb-lift')) || 0) };
  };
  const inBand = (el: HTMLElement) => { const r = el.getBoundingClientRect(), b = band(); return r.top >= b.top && r.bottom <= b.bottom; };
  const onDash = () => { if (!dash || !face) return false; const r = dash.getBoundingClientRect(), b = band(), mid = (b.top + b.bottom) / 2; return r.height > 0 && r.top <= mid && r.bottom >= mid; };
  const go = (y: number) => {
    if (Math.abs(y - scrollY) <= 2) return;
    // Lenis clamps to the page length it last measured (its resize observer hasn't run yet): measure first
    if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); } else window.scrollTo(0, y);
  };
  // the blocks a place is kept by: the page's sections, and inside the tall ones the dash's face and deck and the road's
  // steps (the later one in the page wins). The section alone was too coarse: at 1141 -> 1041 the console drops under
  // the face, the dash section grows, and a face parked at -77 went to -253. Not the console: beside the face at 1141 it
  // would win over it, and a face kept by the console's share went to -610.
  const blocks = [...page.querySelectorAll<HTMLElement>(':scope > section, [data-wb-face], [data-wb-deck], .wb-step')];
  // the record belongs to the size it was taken at. A scroll at another size (the browser's clamp after a resize) never
  // overwrites it: WebKit fires that scroll AND ScrollTrigger's refresh before its own 'resize' event, so a freeze keyed
  // to 'resize' came too late there and the turn back lost the dash (scrollY 1641 -> 1778 at 390x844)
  let kept: HTMLInputElement | null = null, keptDash = false, recW = innerWidth, recH = innerHeight, recDeck = false, thaw = 0, recheck = 0;
  let anchor: { el: HTMLElement; share: number; gap: number } | null = null;
  const record = () => {
    recW = innerWidth; recH = innerHeight; recDeck = deckOn();
    const f = field();
    kept = f && inBand(f) ? f : null;
    keptDash = !kept && onDash();
    anchor = null;
    if (kept) return;
    const top = band().top;
    for (const el of blocks) {
      const r = el.getBoundingClientRect();
      if (!r.height) continue;
      if (r.top <= top && r.bottom > top) anchor = { el, share: (top - r.top) / r.height, gap: 0 };
      else if (!anchor && r.top > top) { anchor = { el, share: 0, gap: r.top - top }; break; } // the band's top is in a gap
    }
  };
  const moved = () => innerWidth !== recW || innerHeight !== recH;
  const turned = () => (innerWidth > innerHeight) !== (recW > recH) || deckOn() !== recDeck;
  const note = () => {
    if (!moved()) { record(); return; }
    // a resize ScrollTrigger lets pass without a refresh (the mobile toolbar, a small height change): the new size's
    // record starts once it has settled
    if (!thaw) thaw = window.setTimeout(() => { thaw = 0; record(); }, 1500);
  };
  addEventListener('focusin', note);
  addEventListener('scroll', note, { passive: true });
  addEventListener('resize', note);
  ScrollTrigger.addEventListener('refresh', () => {
    const f = field();
    let to: (() => number) | null = null;
    if (moved() && f && f === kept && !inBand(f)) {
      const r = f.getBoundingClientRect(), b = band();
      go(Math.max(0, Math.round(scrollY + r.top - (b.top + b.bottom - r.height) / 2)));
    } else if (moved() && keptDash && turned() && face && !isDriving()) {
      to = () => driveDestination(face, 'face').y;
    } else if (moved() && anchor && !isDriving()) {
      const { el, share, gap } = anchor;
      to = () => { const r = el.getBoundingClientRect(); return Math.max(0, Math.round(scrollY + r.top + share * r.height - gap - band().top)); };
    }
    if (to) {
      const again = to;
      go(again());
      // the nav (--site-nav-h: 41 px sideways, 58 upright) and the phone bar settle a moment after the turn (WebKit: after
      // the refresh): once more, unless the visitor moved on
      const at = scrollY;
      clearTimeout(recheck);
      recheck = window.setTimeout(() => { if (Math.abs(scrollY - at) <= 2 && !isDriving()) go(again()); record(); }, 400);
    }
    clearTimeout(thaw); thaw = 0; record();
  });
}

function consented() {
  try { return localStorage.getItem(CONSENT_KEY) === 'accepted'; } catch { return false; }
}

function fireConversion() {
  if (!consented()) return;
  const w = window as unknown as { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };
  try { w.fbq?.('track', 'StartTrial'); } catch { /* blocked */ }
  try { w.gtag?.('event', 'conversion', { send_to: ADS_CONVERSION, value: 0, currency: 'USD' }); } catch { /* blocked */ }
}

/**
 * One sign-up form (the src/lib/drift/capture.ts contract): POST {form:'newsletter', email, source, _gotcha, page}
 * to the worker's /form-once, the one-per-email list relay. With data-register-url (gateWired) it first posts
 * {email, plugin, marketing} to /download/register, which emails the download, and joins the list in the background.
 * An error marks the field (aria-invalid + the status line in its aria-describedby, a11y-18) until the next input: a
 * bad format and the worker's own answer. A network drop only ties the status line to the field (the email was fine).
 * While sending, the key is aria-disabled, not disabled: `disabled` blurred the focused key and a failed keyboard
 * sign-up left focus on <body> (r-asks-errfocus). A `busy` flag keeps a second Enter from posting twice.
 */
function bindSignup(form: HTMLFormElement | null, status: HTMLElement | null, joinAll: (msg: string, from: HTMLElement | null) => void) {
  if (!form) return;
  // a trial form waits for this script: no action, its key disabled until now (WbGet.astro)
  if (form.hasAttribute('data-wb-needs-script')) {
    form.removeAttribute('data-wb-needs-script');
    form.querySelector<HTMLButtonElement>('button[type="submit"]')?.removeAttribute('disabled');
  }
  const field = form.querySelector<HTMLInputElement>('input[type="email"]');
  const described = field?.getAttribute('aria-describedby') ?? '';
  // true: invalid + described by the status line; 'note': described only (a network drop); false: back to rest
  const markField = (bad: boolean | 'note') => {
    if (!field || !status?.id) return;
    if (bad) {
      if (bad === true) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
      field.setAttribute('aria-describedby', [status.id, described].filter(Boolean).join(' '));
    } else {
      field.removeAttribute('aria-invalid');
      if (described) field.setAttribute('aria-describedby', described); else field.removeAttribute('aria-describedby');
    }
  };
  const show = (m: string, ok: boolean) => { if (!status) return; status.textContent = m; status.classList.toggle('ok', ok); status.classList.toggle('err', !ok); };
  const post = (url: string, body: object) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  field?.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') !== 'true' && !status?.classList.contains('err')) return;
    markField(false);
    if (status?.classList.contains('err')) { status.textContent = ''; status.classList.remove('err'); }
  });
  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email || '')) {
      show('That email looks off. Try again?', false);
      markField(true);
      field?.focus();
      return;
    }
    markField(false);
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const face = btn?.querySelector<HTMLElement>('[data-face]');
    const idle = face?.innerHTML;
    busy = true;
    if (btn) { btn.style.minWidth = btn.offsetWidth + 'px'; btn.setAttribute('aria-disabled', 'true'); }
    if (face) face.textContent = 'Sending';
    const listJoin = { form: 'newsletter', page: location.pathname, ...fields };
    try {
      let j: Reply;
      if (form.dataset.registerUrl && !fields._gotcha) {
        j = await (await post(form.dataset.registerUrl, { email: fields.email, plugin: form.dataset.plugin, marketing: true })).json().catch(() => null);
        if (j && j.ok) {
          post(form.dataset.onceUrl!, listJoin).catch(() => { /* the list join is best-effort */ });
          fireConversion();
        }
      } else {
        j = await (await post(form.dataset.onceUrl!, listJoin)).json().catch(() => null);
      }
      if (j && j.ok) joinAll(j.already ? form.dataset.msgAlready! : form.dataset.msgOk!, status);
      else { show((j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.', false); markField(true); }
    } catch { show('Network hiccup. Try again in a moment.', false); markField('note'); }
    if (face && idle !== undefined) face.innerHTML = idle;
    if (btn) { btn.removeAttribute('aria-disabled'); btn.style.minWidth = ''; }
    busy = false;
    // a focus the page lost (a browser that blurs an aria-disabled key) goes to the field, never <body>; a visitor
    // who moved on during the wait keeps their place
    if (!form.hidden && (document.activeElement === document.body || !document.activeElement)) field?.focus({ preventScroll: true });
  });
}
