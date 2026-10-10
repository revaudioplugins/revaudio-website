/**
 * Every DRIFT sign-up form (form[data-drift-capture]): the hero trial stamp
 * and #try's capture. One contract: POST {form:'newsletter', email, source,
 * _gotcha} to the worker's /form-once (one-per-email relay); in the open phase
 * (data-register-url, drift.ts registerUrlFor) it first posts {email, plugin,
 * marketing} to /download/register, which emails the download; the status line
 * (.d-capture-status) and the creators nudge (.d-capture-next) are the form's
 * siblings. A [data-face] inside the submit button reads "Sending" in flight (no ellipsis: it must not be wider than the rest face).
 */
const phone = () => matchMedia('(max-width: 600px)').matches;
const JOINED_KEY = 'drift-joined';

/** Phone (G3, 10-02): signed up once = signed up on the whole page. <html>
 *  gets data-drift-joined (drift.css hides both forms, the sticky bar
 *  retires) and every status line says so; the live regions stay rendered. */
function markJoined(msg: string): void {
  document.documentElement.dataset.driftJoined = '1';
  document.querySelectorAll<HTMLElement>('.d-capture-status').forEach((s) => {
    if (s.textContent !== msg) s.textContent = msg;
    s.classList.add('ok');
    s.classList.remove('err');
  });
}

export function initCaptures(): void {
  if (phone()) {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(JOINED_KEY); } catch { /* storage blocked: no restore */ }
    if (saved) markJoined(saved);
  }
  document.querySelectorAll<HTMLFormElement>('form[data-drift-capture]:not([data-bound])').forEach((form) => {
    form.dataset.bound = '';
    const box = form.parentElement;
    const status = box?.querySelector<HTMLElement>('.d-capture-status');
    const next = box?.querySelector<HTMLElement>('.d-capture-next');
    // Build-time placeholder still in the action = not wired to a real backend yet.
    const wired = !form.action.includes('REPLACE_WITH_FORM_ID');

    const show = (msg: string, ok: boolean) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle('ok', ok);
      status.classList.toggle('err', !ok);
    };
    // errors land one frame later (P4, 10-02): the region is rendered first
    // (visually hidden while empty), so VoiceOver announces the change
    const showErr = (msg: string) => requestAnimationFrame(() => show(msg, false));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!wired) {
        showErr('Not live yet. Your email was not sent.');
        return;
      }
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const face = submitBtn?.querySelector<HTMLElement>('[data-face]');
      const idle = face?.innerHTML;
      const hadFocus = !!submitBtn && document.activeElement === submitBtn;   // a disabled key drops focus to body; the error path gives it back
      if (submitBtn) { submitBtn.style.minWidth = submitBtn.offsetWidth + 'px'; submitBtn.disabled = true; }   // the key keeps its rest width: 'Sending' is narrower than 'Get it ▸' (measured 10-02)
      if (face) face.textContent = 'Sending';
      const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
      const postJson = (url: string, body: object) => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      });
      try {
        let j: { ok?: boolean; already?: boolean; error?: string } | null;
        if (form.dataset.registerUrl && !fields._gotcha) {
          // Open phase: the worker's email gate sends the download now (Yoni 2026-10-10: preopen's
          // /form-once only filed the address, so nobody got a mail). The form says "You join our list",
          // so that consent goes along as marketing, and the list relay still runs in the background.
          const res = await postJson(form.dataset.registerUrl, { email: fields.email, plugin: form.dataset.plugin, marketing: true });
          j = await res.json().catch(() => null);
          if (j && j.ok) postJson(form.dataset.onceUrl!, { form: 'newsletter', ...fields }).catch(() => { /* list join is best-effort */ });
        } else {
          const res = await postJson(form.dataset.onceUrl!, { form: 'newsletter', ...fields });
          j = await res.json().catch(() => null);
        }
        if (j && j.ok) {
          form.hidden = true;
          const msg = j.already ? form.dataset.msgAlready! : form.dataset.msgOk!;
          show(msg, true);
          if (phone()) {
            markJoined(msg);
            try { sessionStorage.setItem(JOINED_KEY, msg); } catch { /* storage blocked: this visit only */ }
          }
          if (!j.already && next) next.hidden = false;
          status?.focus({ preventScroll: true });   // the focused submit button just went with the form
        } else {
          showErr((j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.');
        }
      } catch {
        showErr('Network hiccup. Try again in a moment.');
      }
      if (face && idle !== undefined) face.innerHTML = idle;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.style.minWidth = ''; }
      if (hadFocus && submitBtn && !form.hidden) submitBtn.focus({ preventScroll: true });
    });
  });
}
