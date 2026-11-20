/**
 * /obdtune boot: the live signal, the hero scanner (the plugin's own UI, unit.ts), the scroll story, the bench, the reveals, the hero tilt and the
 * trial form (the download gate's /download/register, then the /form-once list relay; src/data/obdtune.ts).
 */
import { startLive } from './live';
import { mountUnit } from './unit';
import { initStory } from './story';
import { initBench } from './bench';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initObdtune() {
  const page = document.querySelector<HTMLElement>('[data-obd-page]');
  if (!page) return;
  startLive();
  const dev = page.querySelector<HTMLElement>('[data-obd-unit]');
  if (dev) void mountUnit(dev);
  const story = page.querySelector<HTMLElement>('[data-obd-story]');
  if (story) initStory(story);
  const bench = page.querySelector<HTMLElement>('[data-obd-bench]');
  if (bench) initBench(bench);

  // reveals
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  page.querySelectorAll('[data-obd-reveal]').forEach((el) => io.observe(el));

  // the hero scanner leans toward the pointer and lifts as the page scrolls past
  const stage = page.querySelector<HTMLElement>('[data-obd-stage]');
  if (stage && dev && !reduced()) {
    let rx = 0, ry = 0, tx = 0, ty = 0;
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = stage.getBoundingClientRect();
      ty = ((e.clientX - r.left) / r.width - 0.5) * 10;
      tx = -((e.clientY - r.top) / r.height - 0.5) * 8;
    });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    const loop = () => {
      requestAnimationFrame(loop);
      rx += (tx - rx) * 0.08; ry += (ty - ry) * 0.08;
      const sc = Math.min(1, window.scrollY / Math.max(1, stage.offsetHeight));
      dev.style.transform = `perspective(1400px) rotateX(${(rx + sc * 6).toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${(-sc * 40).toFixed(1)}px)`;
    };
    loop();
  }

  // the trial (src/data/obdtune.ts): with data-register-url (gateWired) the form first posts {email, plugin, marketing}
  // to /download/register, which emails the download, and joins the list in the background (widebeam's bindSignup)
  const form = page.querySelector<HTMLFormElement>('[data-obd-form]');
  const status = page.querySelector<HTMLElement>('[data-obd-status]');
  const post = (url: string, body: object) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const show = (m: string, ok: boolean) => { if (!status) return; status.textContent = m; status.classList.toggle('ok', ok); status.classList.toggle('err', !ok); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email || '')) { show('That email looks off. Try again?', false); return; }
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const face = btn?.querySelector<HTMLElement>('[data-face]');
    const idle = face?.innerHTML;
    if (btn) btn.disabled = true;
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
        show(j.already ? form.dataset.msgAlready! : form.dataset.msgOk!, true);
        status?.focus({ preventScroll: true });
      } else show((j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.', false);
    } catch {
      show('Network hiccup. Try again in a moment.', false);
    }
    if (btn) btn.disabled = false;
    if (face && idle !== undefined) face.innerHTML = idle;
  });
}
