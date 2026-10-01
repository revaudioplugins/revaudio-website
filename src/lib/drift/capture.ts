/**
 * Every DRIFT sign-up form (form[data-drift-capture]): the hero trial stamp
 * and #try's capture. One contract: POST {form:'newsletter', email, source,
 * _gotcha} to the worker's /form-once (one-per-email relay); the status line
 * (.d-capture-status) and the creators nudge (.d-capture-next) are the form's
 * siblings. A [data-face] inside the submit button reads "Sending…" in flight.
 */
export function initCaptures(): void {
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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!wired) {
        show('Almost there. Sign-up goes live shortly. Your email wasn’t sent yet.', false);
        return;
      }
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const face = submitBtn?.querySelector<HTMLElement>('[data-face]');
      const idle = face?.innerHTML;
      if (submitBtn) submitBtn.disabled = true;
      if (face) face.textContent = 'Sending…';
      try {
        const res = await fetch(form.dataset.onceUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: 'newsletter', ...Object.fromEntries(new FormData(form)) }),
        });
        const j = await res.json().catch(() => null);
        if (j && j.ok) {
          form.hidden = true;
          show(j.already ? form.dataset.msgAlready! : form.dataset.msgOk!, true);
          if (!j.already && next) next.hidden = false;
          status?.focus({ preventScroll: true });   // the focused submit button just went with the form
        } else {
          show((j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.', false);
        }
      } catch {
        show('Network hiccup. Try again in a moment.', false);
      }
      if (face && idle !== undefined) face.innerHTML = idle;
      if (submitBtn) submitBtn.disabled = false;
    });
  });
}
