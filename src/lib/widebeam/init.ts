/**
 * /widebeam boot: one shared state (state.ts) for the hero road (night.ts), the living face (face.ts), the audio
 * (audio.ts, built on the first START so no AudioContext exists before a gesture), the stereo road story (story.ts),
 * the preset strip, the reveals and the launch-list form (POST {form:'newsletter', email, source:'widebeam-notify',
 * _gotcha, page} to the worker's /form-once, the list relay every site form uses).
 */
import { gsap, ScrollTrigger, reducedMotion } from '../motion';
import { createStore, PRESETS } from './state';
import { createFace, type FaceArt } from './face';
import { startNight } from './night';
import { initStory } from './story';
import type { WideBeamEngine } from './audio';

export function initWideBeam(art: FaceArt) {
  const page = document.querySelector<HTMLElement>('[data-wb-page]');
  if (!page) return;
  const store = createStore();
  const reduced = reducedMotion();

  // ── hero: the road, the wordmark that opens with WIDTH ──
  const night = page.querySelector<HTMLCanvasElement>('[data-wb-night]');
  if (night) startNight(night, store);
  const mark = page.querySelector<HTMLElement>('[data-wb-mark]');
  const setMark = () => { const s = store.get(); page.style.setProperty('--wb-w', String(s.power ? (s.mono ? 0 : s.width / 200) : 0)); };
  store.on(setMark); setMark();
  if (mark && !reduced) {
    // the letters come out of the dark one by one, as if the beams found them
    gsap.fromTo(mark.querySelectorAll('i'), { opacity: 0, filter: 'blur(10px)', y: 18 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.35 });
    gsap.fromTo(page.querySelectorAll('[data-wb-hero-in]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: 1.0 });
    // scrolling away opens the wordmark to full beam and fades the road
    gsap.to(page.querySelector('[data-wb-hero-inner]'), { scrollTrigger: { trigger: page.querySelector('.wb-hero'), start: 'top top', end: 'bottom top', scrub: true }, y: 120, opacity: 0.1, ease: 'none' });
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
  let engine: WideBeamEngine | null = null, mod: typeof import('./audio') | null = null;
  const playBtn = page.querySelector<HTMLButtonElement>('[data-wb-play]');
  const fileIn = page.querySelector<HTMLInputElement>('[data-wb-file]');
  const msg = page.querySelector<HTMLElement>('[data-wb-msg]');
  const scope = page.querySelector<HTMLCanvasElement>('[data-wb-scope]');
  const corrRead = page.querySelector<HTMLElement>('[data-wb-corr]');
  const getEngine = async () => {
    mod ??= await import('./audio');
    if (!engine) { engine = new mod.WideBeamEngine(); engine.set(store.get()); store.on((s) => engine!.set(s)); }
    if (engine.ctx.state !== 'running') await engine.ctx.resume();
    return engine;
  };
  const setPlaying = (on: boolean, label?: string) => {
    page.classList.toggle('is-playing', on);
    playBtn?.setAttribute('aria-pressed', String(on));
    const f = playBtn?.querySelector('[data-face]');
    if (f) f.textContent = on ? 'Stop the engine' : 'Start the engine';
    if (msg) msg.textContent = on ? (label ?? 'Night Drive loop · turn WIDTH, flip HIGH BEAM, press MONO') : 'Engine off.';
    if (on) { ignite(); meterLoop(); } else face.setCorrelation(null);
  };
  playBtn?.addEventListener('click', async () => {
    const e = await getEngine();
    if (e.playing) { e.stop(); setPlaying(false); } else { e.playDemo(); setPlaying(true); }
  });
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

  // ── launch list ──
  const form = page.querySelector<HTMLFormElement>('[data-wb-form]');
  const status = page.querySelector<HTMLElement>('[data-wb-status]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const show = (m: string, ok: boolean) => { if (!status) return; status.textContent = m; status.classList.toggle('ok', ok); status.classList.toggle('err', !ok); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email || '')) { show('That email looks off. Try again?', false); return; }
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const label = btn?.querySelector<HTMLElement>('[data-face]');
    if (btn) btn.disabled = true;
    if (label) label.textContent = 'Sending';
    try {
      const res = await fetch(form.dataset.onceUrl!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form: 'newsletter', page: location.pathname, ...fields }) });
      const j = await res.json().catch(() => null);
      if (j && j.ok) {
        form.hidden = true;
        show(j.already ? "You're already on the list. We'll email you at launch." : "You're on the list. We'll email you the day WIDE BEAM goes live.", true);
        status?.focus({ preventScroll: true });
      } else show((j && j.error) || 'Something went wrong. Try again, or email info@revaudio.net.', false);
    } catch { show('Network hiccup. Try again in a moment.', false); }
    if (btn) btn.disabled = false;
    if (label) label.textContent = 'Notify me';
  });

  ScrollTrigger.refresh();
}
