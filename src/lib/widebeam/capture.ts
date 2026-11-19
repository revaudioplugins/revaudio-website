/**
 * /widebeam sign-ups (lane A, A.1): the plate under the hero and the closer carry the same one ask, every word from
 * askFor(phase) in src/data/widebeam.ts (the forms' data-msg-ok / data-msg-already, data-register-url and the hidden
 * source). Pre-open the forms post source 'widebeam-notify' to /form-once, which relays it to the list (copy-01).
 *
 * One sign-up is the done state on EVERY surface: each [data-wb-trial] / [data-wb-form] goes, each status line says
 * it, each [data-wb-ask] gets .is-joined, <html> gets data-wb-joined (the phone bar leaves: furniture.ts) and the page
 * hears a 'wb:joined' event (the closer's lamps go to full beam; lane S's line under the manual can listen too).
 *
 * Conversion events (guidelines-14): fbq StartTrial + the Google Ads conversion, the house's two guarded lines
 * (TrialPlates / TrialStamp), fire ONLY when the trial gate is wired (the form has data-register-url, i.e.
 * gateWired), /download/register answered ok and the visitor accepted cookies. Pre-open none of that is true, so
 * nothing fires.
 */
const CONSENT_KEY = 'ra-cookie-consent'; // CookieBanner.astro
const ADS_CONVERSION = 'AW-18334323184/KDtwCLHa4dIcEPCjvqZE'; // TrialStamp.astro / TrialPlates.astro

type Reply = { ok?: boolean; already?: boolean; error?: string } | null;

export function initCapture(page: HTMLElement) {
  const surfaces = [
    { form: page.querySelector<HTMLFormElement>('[data-wb-trial]'), status: page.querySelector<HTMLElement>('[data-wb-trial-status]') },
    { form: page.querySelector<HTMLFormElement>('[data-wb-form]'), status: page.querySelector<HTMLElement>('[data-wb-status]') },
  ];
  const joinAll = (msg: string, from: HTMLElement | null) => {
    for (const s of surfaces) {
      if (s.form) s.form.hidden = true;
      if (s.status) { s.status.textContent = msg; s.status.classList.add('ok'); s.status.classList.remove('err'); }
    }
    page.querySelectorAll('[data-wb-ask]').forEach((a) => a.classList.add('is-joined'));
    document.documentElement.setAttribute('data-wb-joined', '');
    from?.focus({ preventScroll: true });
    page.dispatchEvent(new CustomEvent('wb:joined'));
  };
  surfaces.forEach((s) => bindSignup(s.form, s.status, joinAll));
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
