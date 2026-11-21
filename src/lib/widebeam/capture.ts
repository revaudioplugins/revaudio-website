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
  keepFieldOnTurn(page);
}

/**
 * A turn of the phone (or any width change) while the visitor types in a sign-up field (r-cross-rotate): the svh
 * heights of the hero and the story change the page's length, the browser clamps the scroll, and ScrollTrigger's
 * refresh then puts back a raw pixel scrollY, so in Chrome the focused field ended 502 px above the screen sideways and
 * 2146 px below it upright again. After each refresh, a field that was focused AND fully on screen at the last settled
 * size is brought back to the middle of the clear band (under the nav, over the cookie banner / phone bar: --wb-lift).
 * A field the visitor had scrolled away from is left where it is. The record is frozen from a resize until the next
 * refresh, so the browser's own clamp (a scroll event at the new size) can't overwrite it.
 */
function keepFieldOnTurn(page: HTMLElement) {
  const html = document.documentElement;
  const field = () => { const a = document.activeElement; return a instanceof HTMLInputElement && page.contains(a) && a.closest('form[data-wb-trial], form[data-wb-form]') ? a : null; };
  const band = () => {
    const nav = document.querySelector('nav[data-site-nav], header');
    const top = Math.max(0, nav ? nav.getBoundingClientRect().bottom : 0);
    return { top, bottom: innerHeight - (parseFloat(html.style.getPropertyValue('--wb-lift')) || 0) };
  };
  const inBand = (el: HTMLElement) => { const r = el.getBoundingClientRect(), b = band(); return r.top >= b.top && r.bottom <= b.bottom; };
  let kept: HTMLInputElement | null = null, frozen = false, thaw = 0;
  const note = () => { if (frozen) return; const f = field(); kept = f && inBand(f) ? f : null; };
  addEventListener('focusin', note);
  addEventListener('scroll', note, { passive: true });
  addEventListener('resize', () => {
    frozen = true;
    // a resize ScrollTrigger lets pass without a refresh (the mobile toolbar, a height-only change) must not freeze it for good
    clearTimeout(thaw); thaw = window.setTimeout(() => { frozen = false; note(); }, 1500);
  });
  ScrollTrigger.addEventListener('refresh', () => {
    const f = field();
    if (frozen && f && f === kept && !inBand(f)) {
      const r = f.getBoundingClientRect(), b = band();
      const y = Math.max(0, Math.round(scrollY + r.top - (b.top + b.bottom - r.height) / 2));
      // Lenis clamps to the page length it last measured (its resize observer hasn't run yet): measure first
      if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); } else window.scrollTo(0, y);
    }
    clearTimeout(thaw); frozen = false; note();
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
 * An error marks the field (aria-invalid + the status line in its aria-describedby, a11y-18) until the next input.
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
  const markField = (bad: boolean) => {
    if (!field || !status?.id) return;
    if (bad) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', [status.id, described].filter(Boolean).join(' '));
    } else {
      field.removeAttribute('aria-invalid');
      if (described) field.setAttribute('aria-describedby', described); else field.removeAttribute('aria-describedby');
    }
  };
  const show = (m: string, ok: boolean) => { if (!status) return; status.textContent = m; status.classList.toggle('ok', ok); status.classList.toggle('err', !ok); };
  const post = (url: string, body: object) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  field?.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') !== 'true') return;
    markField(false);
    if (status?.classList.contains('err')) { status.textContent = ''; status.classList.remove('err'); }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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
    if (btn) { btn.style.minWidth = btn.offsetWidth + 'px'; btn.disabled = true; }
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
      else show((j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.', false);
    } catch { show('Network hiccup. Try again in a moment.', false); }
    if (face && idle !== undefined) face.innerHTML = idle;
    if (btn) { btn.disabled = false; btn.style.minWidth = ''; }
  });
}
