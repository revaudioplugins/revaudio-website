/**
 * /widebeam boot: one shared state (state.ts) for the hero (intro.ts: the video, then its own last frame; night.ts: the departing tail lights), the living face (face.ts), the audio
 * (audio.ts; the music starts at load where the browser allows sound, else on the first click / tap / key), the stereo road story (story.ts),
 * the preset strip, the reveals and the launch-list form (POST {form:'newsletter', email, source:'widebeam-notify',
 * _gotcha, page} to the worker's /form-once, the list relay every site form uses).
 */
import { gsap, ScrollTrigger, reducedMotion } from '../motion';
import { createStore, PRESETS } from './state';
import { createFace, type FaceArt } from './face';
import { startNight } from './night';
import { initStory } from './story';
import { initIntro } from './intro';
import { WideBeamEngine } from './audio';

export function initWideBeam(art: FaceArt) {
  const page = document.querySelector<HTMLElement>('[data-wb-page]');
  if (!page) return;
  const store = createStore();
  const reduced = reducedMotion();

  // ── hero: the intro video, its last frame as the road, the wordmark that opens with WIDTH ──
  const hero = page.querySelector<HTMLElement>('.wb-hero')!;
  const nightEl = page.querySelector<HTMLCanvasElement>('[data-wb-night]');
  const night = nightEl ? startNight(nightEl) : null;
  const mark = page.querySelector<HTMLElement>('[data-wb-mark]');
  const setMark = () => { const s = store.get(); page.style.setProperty('--wb-w', String(s.power ? (s.mono ? 0 : s.width / 200) : 0)); };
  store.on(setMark); setMark();
  initIntro(hero, {
    reveal(instant) {
      hero.classList.add('is-shown');
      if (!mark || reduced) return;
      // the letters come out of the dark one by one, as if the beams found them
      const d = instant ? 0.35 : 0;
      gsap.fromTo(mark.querySelectorAll('i'), { opacity: 0, filter: 'blur(10px)', y: 18 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: d });
      gsap.fromTo(page.querySelectorAll('[data-wb-hero-in]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: d + 0.65 });
    },
    handoff() {
      // the video's last frame: the coupe's tail lights at (969, 697), 54 px apart, on a 1920×1080 frame
      night?.tailLights(969, 697, 54);
    },
  });
  if (!reduced) {
    // scrolling away lifts the title off the road
    gsap.to(page.querySelector('[data-wb-hero-inner]'), { scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }, y: 120, opacity: 0.1, ease: 'none' });
  }

  // ── the face ──
  const faceEl = page.querySelector<HTMLElement>('[data-wb-face]')!;
  const face = createFace(faceEl, art, store);
  let ignited = false;
  const ignite = () => { if (!ignited) { ignited = true; face.ignite(); } };
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { ignite(); io.disconnect(); } }, { threshold: 0.35 }).observe(faceEl);
  const dash = page.querySelector<HTMLElement>('[data-wb-dash]');
  if (dash && !reduced) {
    // the dash rises into the windscreen as it scrolls in
    gsap.fromTo(dash, { rotateX: 28, y: 80, scale: 0.9, opacity: 0.4 }, {
      rotateX: 0, y: 0, scale: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: dash, start: 'top 95%', end: 'top 30%', scrub: 0.6 },
    });
  }

  // ── audio ──
  let engine: WideBeamEngine | null = null, userStopped = false;
  const playBtn = page.querySelector<HTMLButtonElement>('[data-wb-play]');
  const fileIn = page.querySelector<HTMLInputElement>('[data-wb-file]');
  const msg = page.querySelector<HTMLElement>('[data-wb-msg]');
  const scope = page.querySelector<HTMLCanvasElement>('[data-wb-scope]');
  const corrRead = page.querySelector<HTMLElement>('[data-wb-corr]');
  const sound = page.querySelector<HTMLButtonElement>('[data-wb-sound]');
  // created synchronously so a gesture handler can resume it inside the gesture (iOS Safari unlocks audio only there)
  const makeEngine = () => {
    if (!engine) { engine = new WideBeamEngine(); engine.set(store.get()); store.on((s) => engine!.set(s)); }
    return engine;
  };
  const getEngine = async () => {
    const e = makeEngine();
    if (e.ctx.state !== 'running') await e.ctx.resume();
    return e;
  };
  const setPlaying = (on: boolean, label?: string) => {
    page.classList.toggle('is-playing', on);
    playBtn?.setAttribute('aria-pressed', String(on));
    const f = playBtn?.querySelector('[data-face]');
    if (f) f.textContent = on ? 'Stop the engine' : 'Start the engine';
    if (msg) msg.textContent = on ? (label ?? 'Night Drive loop · turn WIDTH, flip HIGH BEAM, press MONO') : 'Engine off.';
    sound?.setAttribute('aria-pressed', String(on));
    const sf = sound?.querySelector('[data-face]');
    if (sf) sf.textContent = on ? 'Sound on' : 'Sound off';
    if (on) meterLoop(); else face.setCorrelation(null);
  };
  const toggle = async () => {
    const e = makeEngine();
    if (e.playing) { e.stop(); userStopped = true; setPlaying(false); return; }
    userStopped = false;
    await getEngine(); e.playDemo(); setPlaying(true);
  };
  playBtn?.addEventListener('click', async () => { await toggle(); ignite(); });
  sound?.addEventListener('click', toggle);

  // the music plays by itself: at load where the browser already allows sound (Chrome, for a site it trusts),
  // otherwise on the first click / tap / key anywhere on the page. A scroll is not a gesture, so it can't count.
  // Never restarts a visitor who stopped it.
  const autoStart = async () => {
    if (userStopped) return;
    const e = await getEngine();
    if (!e.playing && !userStopped) { e.playDemo(); setPlaying(true); }
  };
  const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'] as const;
  const offGesture = () => GESTURES.forEach((k) => document.removeEventListener(k, onGesture, true));
  function onGesture(ev: Event) {
    if ((ev.target as HTMLElement)?.closest?.('[data-wb-play], [data-wb-file], [data-wb-sound]')) { offGesture(); return; } // those choose for themselves
    if (ev instanceof KeyboardEvent && (ev.key === 'Escape' || ev.metaKey || ev.ctrlKey || ev.altKey)) return; // not activations
    const e = makeEngine();
    if (e.ctx.state !== 'running') e.ctx.resume().catch(() => {}); // inside the gesture: this is what unlocks audio
    // a touch counts on release, not on press; browsers without userActivation (Safari < 16.4) get that rule by hand
    const active = navigator.userActivation ? navigator.userActivation.isActive : ev.type !== 'pointerdown' || (ev as PointerEvent).pointerType === 'mouse';
    if (e.ctx.state === 'running' || active) { offGesture(); autoStart(); }
  }
  GESTURES.forEach((k) => document.addEventListener(k, onGesture, true));
  try { if (makeEngine().ctx.state === 'running') { offGesture(); autoStart(); } } catch {}
  page.querySelectorAll<HTMLElement>('[data-wb-start]').forEach((b) => b.addEventListener('click', async () => {
    const e = await getEngine();
    if (!e.playing) { e.playDemo(); setPlaying(true); }
  }));
  fileIn?.addEventListener('change', async () => {
    const f = fileIn.files?.[0];
    if (!f) return;
    const e = await getEngine();
    try { await e.playFile(f); setPlaying(true, `${f.name} · stays on your computer, nothing is uploaded`); }
    catch { if (msg) msg.textContent = "That file didn't decode. Try an MP3, WAV or M4A."; }
    fileIn.value = '';
  });

  // the rear-view mirror: a vectorscope with phosphor persistence; the face's needle reads the real correlation
  const sctx = scope?.getContext('2d');
  let mRaf = 0, gain = 200;
  function meterLoop() {
    if (mRaf || !engine) return;
    const step = () => {
      mRaf = 0;
      if (!engine?.playing) { if (sctx && scope) sctx.clearRect(0, 0, scope.width, scope.height); return; }
      const { corr, level } = engine.measure();
      face.setCorrelation(level > 1e-4 ? corr : 0);
      if (corrRead) corrRead.textContent = (corr >= 0 ? '+' : '') + corr.toFixed(2);
      if (sctx && scope) {
        const w = scope.width, h = scope.height, [L, R] = engine.scope();
        sctx.globalCompositeOperation = 'source-over';
        sctx.fillStyle = 'rgba(8,7,6,.28)'; sctx.fillRect(0, 0, w, h);
        sctx.globalCompositeOperation = 'lighter';
        sctx.fillStyle = 'rgba(255,214,140,.55)';
        // a classic goniometer: mono is a vertical line, wide is a fat cloud, out of phase lies flat; auto-gain
        let pk = 0.02;
        for (let i = 0; i < L.length; i += 4) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
        gain += (h * 0.36 / pk - gain) * 0.08;
        const d = Math.max(1.2, devicePixelRatio);
        for (let i = 0; i < L.length; i += 2) {
          const x = w / 2 + (L[i] - R[i]) * 0.7071 * gain, y = h * 0.45 - (L[i] + R[i]) * 0.7071 * gain;
          sctx.fillRect(x, y, d, d);
        }
      }
      mRaf = requestAnimationFrame(step);
    };
    mRaf = requestAnimationFrame(step);
  }
  if (scope) { const fit = () => { scope.width = scope.clientWidth * Math.min(2, devicePixelRatio); scope.height = scope.clientHeight * Math.min(2, devicePixelRatio); }; new ResizeObserver(fit).observe(scope); fit(); }

  // keys: H high beam, M mono, S side, P power, [ ] presets (never while typing)
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    const s = store.get();
    const act: Record<string, () => void> = {
      h: () => store.set({ high: !s.high }, 'key'), m: () => store.set({ mono: !s.mono }, 'key'),
      s: () => store.set({ side: !s.side }, 'key'), p: () => store.set({ power: !s.power }, 'key'),
      ']': () => face.loadPreset((store.preset + 1) % PRESETS.length), '[': () => face.loadPreset((store.preset + PRESETS.length - 1) % PRESETS.length),
    };
    const f = act[e.key.toLowerCase()];
    if (f) { f(); }
  });

  // HIGH BEAM on: a warm flash across the whole page, like flashing the lights at a crossing
  const flash = page.querySelector<HTMLElement>('[data-wb-flash]');
  store.on((s, ch) => {
    if (flash && 'high' in ch && s.high && s.power && !reduced) {
      flash.classList.remove('is-on'); void flash.offsetWidth; flash.classList.add('is-on');
    }
  });

  // ── story ──
  const story = page.querySelector<HTMLElement>('[data-wb-story]');
  if (story) initStory(story);

  // ── presets: cards load into the face, the page drives back up to it ──
  page.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    face.loadPreset(Number(b.dataset.preset));
    page.querySelectorAll('[data-preset]').forEach((x) => x.classList.toggle('is-on', x === b));
    dash?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  }));
  store.on(() => { page.querySelectorAll('[data-preset]').forEach((x) => x.classList.toggle('is-on', Number((x as HTMLElement).dataset.preset) === store.preset && !store.edited)); });
  const lane = page.querySelector<HTMLElement>('[data-wb-lane]');
  if (lane) {
    // drag the lane sideways with a mouse; touch scrolls natively
    let x0 = 0, s0 = 0, down = false, moved = false;
    lane.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = lane.scrollLeft; });
    window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; lane.classList.add('is-grab'); } lane.scrollLeft = s0 - dx; });
    window.addEventListener('pointerup', () => { down = false; lane.classList.remove('is-grab'); });
    lane.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }

  // ── odometer spec numbers roll up when they come into view ──
  page.querySelectorAll<HTMLElement>('[data-odo]').forEach((el) => {
    const end = Number(el.dataset.odo), dec = Number(el.dataset.dec || 0);
    if (reduced) { el.textContent = end.toFixed(dec); return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onUpdate: () => { el.textContent = o.v.toFixed(dec); } });
  });

  // ── reveals ──
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  page.querySelectorAll('[data-wb-reveal]').forEach((el) => io.observe(el));

  // ── the two sign-up forms: the free trial under the hero, the launch list at the end ──
  bindSignup(page.querySelector('[data-wb-trial]'), page.querySelector('[data-wb-trial-status]'));
  bindSignup(page.querySelector('[data-wb-form]'), page.querySelector('[data-wb-notify-status]'), {
    ok: "You're on the list. We'll email you the day WIDE BEAM goes live.",
    already: "You're already on the list. We'll email you at launch.",
  });

  // ── BUY NOW before Paddle has a price (src/data/widebeam.ts): it explains instead of adding to the cart ──
  const soon = page.querySelector<HTMLButtonElement>('[data-wb-buy-soon]');
  const soonNote = page.querySelector<HTMLElement>('[data-wb-buy-note]');
  soon?.addEventListener('click', () => {
    if (soonNote) soonNote.textContent = 'Checkout opens on launch day. Start the free trial now and it rolls straight into the full version.';
  });

  ScrollTrigger.refresh();
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
