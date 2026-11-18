/**
 * /widebeam sign-ups (lane A): the free trial under the hero and the launch list at the end, plus BUY NOW's
 * placeholder note before Paddle has a price (src/data/widebeam.ts).
 */
export function initCapture(page: HTMLElement) {
  // ── the two sign-up forms: the free trial under the hero, the launch list at the end ──
  bindSignup(page.querySelector('[data-wb-trial]'), page.querySelector('[data-wb-trial-status]'));
  bindSignup(page.querySelector('[data-wb-form]'), page.querySelector('[data-wb-status]'), {
    ok: "You're on the list. We'll email you the day WIDE BEAM goes live.",
    already: "You're already on the list. We'll email you at launch.",
  });

  // ── BUY NOW before Paddle has a price (src/data/widebeam.ts): it explains instead of adding to the cart ──
  const soon = page.querySelector<HTMLButtonElement>('[data-wb-buy-soon]');
  const soonNote = page.querySelector<HTMLElement>('[data-wb-buy-note]');
  soon?.addEventListener('click', () => {
    if (soonNote) soonNote.textContent = 'Checkout opens on launch day. Start the free trial now and it rolls straight into the full version.';
  });
}

/**
 * One sign-up form (the src/lib/drift/capture.ts contract): POST {form:'newsletter', email, source, _gotcha, page}
 * to the worker's /form-once, the one-per-email list relay. With data-register-url (src/data/widebeam.ts gateWired)
 * it first posts {email, plugin, marketing} to /download/register, which emails the download, and joins the list in
 * the background. Messages come from data-msg-ok / data-msg-already, or `msgs`.
 */
function bindSignup(form: HTMLFormElement | null, status: HTMLElement | null, msgs?: { ok: string; already: string }) {
  if (!form) return;
  const show = (m: string, ok: boolean) => { if (!status) return; status.textContent = m; status.classList.toggle('ok', ok); status.classList.toggle('err', !ok); };
  const post = (url: string, body: object) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email || '')) { show('That email looks off. Try again?', false); return; }
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const face = btn?.querySelector<HTMLElement>('[data-face]');
    const idle = face?.innerHTML;
    if (btn) { btn.style.minWidth = btn.offsetWidth + 'px'; btn.disabled = true; }
    if (face) face.textContent = 'Sending';
    const listJoin = { form: 'newsletter', page: location.pathname, ...fields };
    try {
      let j: { ok?: boolean; already?: boolean; error?: string } | null;
      if (form.dataset.registerUrl && !fields._gotcha) {
        j = await (await post(form.dataset.registerUrl, { email: fields.email, plugin: form.dataset.plugin, marketing: true })).json().catch(() => null);
        if (j && j.ok) post(form.dataset.onceUrl!, listJoin).catch(() => { /* the list join is best-effort */ });
      } else {
        j = await (await post(form.dataset.onceUrl!, listJoin)).json().catch(() => null);
      }
      if (j && j.ok) {
        form.hidden = true;
        show(j.already ? (msgs?.already ?? form.dataset.msgAlready!) : (msgs?.ok ?? form.dataset.msgOk!), true);
        status?.focus({ preventScroll: true });
      } else show((j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.', false);
    } catch { show('Network hiccup. Try again in a moment.', false); }
    if (face && idle !== undefined) face.innerHTML = idle;
    if (btn) { btn.disabled = false; btn.style.minWidth = ''; }
  });
}
