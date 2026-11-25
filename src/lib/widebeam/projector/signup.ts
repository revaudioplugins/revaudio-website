/**
 * The projector page's sign-ups: every gate on the page (WbpGate.astro, form[data-wbp-gate]) is bound, with the old
 * page's requests, bodies, order and states (src/lib/widebeam/capture.ts bindSignup / joinAll, copied without its
 * dash code):
 *  1. POST {email, plugin, marketing:true} to data-register-url (/download/register: it emails the download);
 *  2. only on its ok: a background POST {form:'newsletter', page, email, source, _gotcha} to data-once-url (/form-once,
 *     the list join), then the StartTrial / Ads conversion (cookie consent only);
 *  a filled honeypot skips 1 and posts 2 only; pre-open (no register url) 2 is the only request.
 * In front of the worker sits the mock-up's own check (emailProblem: "An email needs an @.", the one-tap "Did you mean
 * …@gmail.com?"), stricter than capture.ts's one pattern.
 *
 * One sign-up is the done state on EVERY gate (joinAll): each form turns into the mock-up's done box (ask.ok + the
 * address + Change) in the field's place, each status line says it, each [data-wb-ask] gets .is-joined and
 * data-wb-done, <html> gets data-wb-joined and the page hears 'wb:joined'. The form is never hidden: the done box
 * lives in it, and the card keeps its size (the status line sits outside the form, as on the old page).
 * Change reopens the gates. The same address again (any gate) goes straight back to done: no second email, no second
 * conversion. Another address is a new, real sign-up.
 */
const CONSENT_KEY = 'ra-cookie-consent'; // CookieBanner.astro
const ADS_CONVERSION = 'AW-18334323184/KDtwCLHa4dIcEPCjvqZE'; // TrialStamp.astro / TrialPlates.astro

type Reply = { ok?: boolean; already?: boolean; error?: string } | null;
interface Gate { form: HTMLFormElement; ask: HTMLElement; status: HTMLElement | null; field: HTMLInputElement | null; described: string }

// What is wrong with an address, in a few words that fit the message line on the narrowest phone, or null if it looks
// right. A missing or misspelt ending on a common provider is offered back as one tap ("Did you mean ...?").
const FIXES: Record<string, string> = { gmail: 'gmail.com', gmial: 'gmail.com', gmai: 'gmail.com', gamil: 'gmail.com', gnail: 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com',
  hotmail: 'hotmail.com', hotmial: 'hotmail.com', 'hotmail.con': 'hotmail.com', outlook: 'outlook.com', 'outlook.con': 'outlook.com',
  yahoo: 'yahoo.com', 'yahoo.con': 'yahoo.com', icloud: 'icloud.com', 'icloud.con': 'icloud.com', me: 'me.com',
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'yaho.com': 'yahoo.com', 'outlok.com': 'outlook.com', 'iclod.com': 'icloud.com' };
export function emailProblem(v: string): { msg: string; fix?: string } | null {
  if (!v) return { msg: 'Type your email first.' };
  if (/\s/.test(v)) return { msg: 'Take out the spaces.' };
  const at = v.indexOf('@');
  if (at < 0) return { msg: 'An email needs an @.' };
  if (v.indexOf('@', at + 1) >= 0) return { msg: 'Only one @, please.' };
  const name = v.slice(0, at), dom = v.slice(at + 1).toLowerCase();
  if (!name) return { msg: 'Add the name before the @.' };
  if (!dom) return { msg: 'Add the part after the @.' };
  if (dom.includes(',')) return { msg: 'Did you mean ', fix: name + '@' + dom.replace(/,/g, '.') };
  if (dom.endsWith('.')) return { msg: 'Take out the dot at the end.' };
  if (dom.includes('..') || name.includes('..') || name.startsWith('.') || name.endsWith('.')) return { msg: 'Check the dots in it.' };
  if (/(^|\.)-|-(\.|$)/.test(dom)) return { msg: 'Check the part after the @.' };
  if (FIXES[dom]) return { msg: 'Did you mean ', fix: name + '@' + FIXES[dom] };
  // the ending: letters in any script (.рф, .भारत: \p{M} for the vowel marks) or its punycode (xn--p1ai)
  if (!/^[^.]+(\.[^.]+)*\.(xn--[a-z0-9-]+|[\p{L}\p{M}]{2,})$/iu.test(dom)) return { msg: 'Add the ending, like .com' };
  return null;
}

// the address in the done box: whole if it fits, else the name is cut and the domain kept ("firstna…@gmail.com")
function fitEmail(em: HTMLElement, v: string) {
  em.textContent = v;
  if (em.scrollWidth <= em.clientWidth + 1) return;
  const at = v.lastIndexOf('@'), name = v.slice(0, at), dom = v.slice(at);
  for (let k = name.length - 1; k >= 1; k--) { em.textContent = name.slice(0, k) + '…' + dom; if (em.scrollWidth <= em.clientWidth + 1) return; }
  // a domain too long for the line on its own: keep the start and the ending, cut the middle
  for (let t = v.length - 2; t >= 8; t--) { const hd = Math.ceil(t * 0.45); em.textContent = v.slice(0, hd) + '…' + v.slice(v.length - (t - hd)); if (em.scrollWidth <= em.clientWidth + 1) return; }
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

export function initSignup(page: HTMLElement) {
  const gates: Gate[] = [...page.querySelectorAll<HTMLFormElement>('form[data-wbp-gate]')].map((form) => {
    const ask = form.closest<HTMLElement>('[data-wbp-ask]') ?? form;
    const field = form.querySelector<HTMLInputElement>('input[type="email"]');
    return { form, ask, status: ask.querySelector<HTMLElement>('[data-wbp-status]'), field, described: field?.getAttribute('aria-describedby') ?? '' };
  });
  // the addresses this visit has signed up: the same one again never registers twice (one email, one conversion)
  const joined = new Set<string>();
  // one request at a time across every gate: a second Enter (or a second gate) never posts twice
  let busy = false;

  // true: invalid + described by the status line; 'note': described only (a network drop); false: back to rest
  const markField = (g: Gate, bad: boolean | 'note') => {
    g.form.classList.toggle('is-err', bad === true);
    if (!g.field || !g.status?.id) return;
    if (bad) {
      if (bad === true) g.field.setAttribute('aria-invalid', 'true'); else g.field.removeAttribute('aria-invalid');
      g.field.setAttribute('aria-describedby', [g.status.id, g.described].filter(Boolean).join(' '));
    } else {
      g.field.removeAttribute('aria-invalid');
      if (g.described) g.field.setAttribute('aria-describedby', g.described); else g.field.removeAttribute('aria-describedby');
    }
  };
  // the message line holds one line; a longer one (the worker's own words, the network line) may take a second
  const fit = (st: HTMLElement) => { st.classList.remove('is-wrap'); if (st.scrollWidth > st.clientWidth + 1) st.classList.add('is-wrap'); };
  const show = (g: Gate, m: string, ok: boolean) => {
    if (!g.status) return;
    g.status.textContent = m; g.status.classList.toggle('ok', ok); g.status.classList.toggle('err', !ok); fit(g.status);
  };
  const rest = (g: Gate) => {
    markField(g, false);
    if (g.status) { g.status.textContent = ''; g.status.classList.remove('err', 'ok', 'is-wrap'); }
  };

  const joinAll = (msg: string, email: string, from: Gate) => {
    for (const g of gates) {
      g.form.classList.add('is-done');
      markField(g, false);
      const b = g.form.querySelector('.wbp-done b'), em = g.form.querySelector<HTMLElement>('.wbp-done em');
      if (b) b.textContent = msg;
      if (em) fitEmail(em, email);
      if (g.status) { g.status.textContent = msg; g.status.classList.add('ok'); g.status.classList.remove('err', 'is-wrap'); }
    }
    page.querySelectorAll<HTMLElement>('[data-wb-ask]').forEach((a) => {
      a.classList.add('is-joined');
      a.setAttribute('data-wb-done', '');
      if (!a.querySelector('form[data-wbp-gate]')) a.textContent = msg; // a line with no form: its words become the message
    });
    document.documentElement.setAttribute('data-wb-joined', '');
    from.form.querySelector<HTMLElement>('.wbp-done')?.focus({ preventScroll: true });
    page.dispatchEvent(new CustomEvent('wb:joined'));
  };
  // Change: every gate opens again, the visitor's field ready for another address
  const reopen = (from: Gate) => {
    for (const g of gates) { g.form.classList.remove('is-done'); rest(g); }
    page.querySelectorAll<HTMLElement>('[data-wb-ask].is-joined').forEach((a) => { a.classList.remove('is-joined'); a.removeAttribute('data-wb-done'); });
    document.documentElement.removeAttribute('data-wb-joined');
    from.field?.focus(); from.field?.select();
  };

  const post = (url: string, body: object) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });

  for (const g of gates) {
    const { form, field } = g;
    // the trial form waits for this script: no action, its key disabled until now (WbpGate.astro)
    if (form.hasAttribute('data-wb-needs-script')) {
      form.removeAttribute('data-wb-needs-script');
      form.querySelector<HTMLButtonElement>('button[type="submit"]')?.removeAttribute('disabled');
    }
    // a bad address clears the moment the visitor types again
    field?.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') !== 'true' && !g.status?.classList.contains('err')) return;
      rest(g);
    });
    g.ask.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const fx = t.closest<HTMLElement>('[data-wbp-fix]');
      if (fx && field) { field.value = fx.dataset.wbpFix!; rest(g); field.focus(); }
      if (t.closest('[data-wbp-change]')) reopen(g);
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;
      const v = (field?.value ?? '').trim();
      if (field) field.value = v;
      const bad = emailProblem(v);
      if (bad) {
        show(g, bad.msg, false);
        if (bad.fix && g.status) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'wbp-fix'; b.textContent = bad.fix; b.dataset.wbpFix = bad.fix;
          g.status.append(b, '?');
          if (g.status.scrollWidth > g.status.clientWidth + 1) b.textContent = '…@' + bad.fix.split('@')[1];
          fit(g.status);
        }
        markField(g, true);
        field?.focus();
        return;
      }
      markField(g, false);
      const key = v.toLowerCase();
      if (joined.has(key)) { joinAll(form.dataset.msgOk!, v, g); return; }
      const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
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
        if (j && j.ok) { joined.add(key); joinAll(j.already ? form.dataset.msgAlready! : form.dataset.msgOk!, v, g); }
        else { show(g, (j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.', false); markField(g, true); }
      } catch { show(g, 'Network hiccup. Try again in a moment.', false); markField(g, 'note'); }
      if (face && idle !== undefined) face.innerHTML = idle;
      if (btn) { btn.removeAttribute('aria-disabled'); btn.style.minWidth = ''; }
      busy = false;
      // a focus the page lost (a browser that blurs an aria-disabled key) goes to the field, never <body>
      if (!form.classList.contains('is-done') && (document.activeElement === document.body || !document.activeElement)) field?.focus({ preventScroll: true });
    });
  }
}
