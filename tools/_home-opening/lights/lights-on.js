// The long garage's loading screen: a dark room whose lights come on bank by bank as the page loads (Dan 2026-11-09:
// "while the user is loading, the amount of loading = a dark room turning into a lit room, as if someone turned on the
// light ... I want it to feel real"). Each bank is a picture of its own light (assets/lights/bank-<n>.webp: the room
// with banks 1..n minus the room with 1..n-1, rendered by lights/render.mjs) added over the dark room (base.webp) with
// plus-lighter: light adds, so every step is the room as rendered. The room's script reports the load
// (lightsOn.progress 0..1); bank i comes on at its share, pure progress (Dan's pick), the way its kind does: a tube
// strikes, a neon buzzes on, a bulb warms up, the gear powers on; a camera in the dark: grain, and the exposure catching
// up when the first lights strike. Opacity only, so the compositor plays it while the 3D compiles. Flashes: at most one
// every 400 ms across the whole room (2.5 a second; WCAG 2.3.1 allows 3, the room's own rule since 11-04).
// Reduced motion, or the second visit this session (Dan's pick): soft rises, no flicker, no flare.
// API: lightsOn.progress(p) · lightsOn.ready() -> Promise once every bank is on and settled · lightsOn.handoff()
// URL: ?lights=demo plays a cold first visit's pace (~5.5 s) whatever the real load, and always the full show;
//      ?lights=calm the soft version; ?lights=hold never hands off (the check script's picture)
(() => {
  const root = document.getElementById('lights');
  if (!root) return;
  if (/[?&]capture=/.test(location.search)) { root.remove(); return; }
  const banks = window.LIGHT_BANKS || [], dir = root.dataset.dir || '', q = new URLSearchParams(location.search).get('lights');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, demo = q === 'demo';
  let again = false;
  try { again = sessionStorage.getItem('ra:lightsOn') === '1'; sessionStorage.setItem('ra:lightsOn', '1'); } catch (e) {}
  const calm = reduced || q === 'calm' || (again && !demo);
  if (!(window.CSS && CSS.supports('mix-blend-mode', 'plus-lighter'))) root.classList.add('no-plus');
  document.documentElement.classList.add('lights-loading');
  const t0 = performance.now(), log = [];
  const note = (what) => log.push([Math.round(performance.now() - t0), what]);

  const pic = (src, cls, high) => {
    const im = new Image(); im.alt = ''; im.decoding = 'async'; im.className = cls;
    if (high) im.fetchPriority = 'high';
    im.src = dir + src; root.append(im); return im;
  };
  const base = pic('base.webp', 'lo-base', true);
  const baseIn = base.decode().catch(() => {});
  // a bank drawn per screen width (the TV: its picture follows the room's CAPS): the one the room will pick, the nearest
  const capOf = (caps) => caps.reduce((a, t) => (Math.abs(+t.split('x')[0] - innerWidth) < Math.abs(+a.split('x')[0] - innerWidth) ? t : a));
  const L = banks.map((b, i) => {
    const el = pic(`bank-${i + 1}${b.caps ? '@' + capOf(b.caps) : ''}.webp`, 'lo-bank');
    return { ...b, i, el, dec: el.decode().catch(() => {}), done: null };
  });
  const W = L.reduce((s, b) => s + (b.w ?? 1), 0) || 1;
  let lit = 0; // the share of the room's light that is on (by the banks' weights)

  // the camera in the dark: sensor noise, strongest before any light, gone by the full room
  const grain = document.createElement('div'); grain.className = 'lo-grain'; root.append(grain);
  try {
    const c = document.createElement('canvas'); c.width = c.height = 192;
    const x = c.getContext('2d'), d = x.createImageData(192, 192);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.pow(Math.random(), 5) * 48; // (fine and faint: Dan 11-09, "too much noise in the beginning")
      d.data[i] = v * (0.85 + Math.random() * 0.3); d.data[i + 1] = v * (0.8 + Math.random() * 0.3); d.data[i + 2] = v * (0.95 + Math.random() * 0.35); d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0); grain.style.backgroundImage = `url(${c.toDataURL()})`;
    if (!reduced) {
      const jumps = Array.from({ length: 9 }, (_, i) => ({ transform: `translate(${(i * 71) % 192 - 96}px, ${(i * 113) % 192 - 96}px)`, easing: 'steps(1, end)' }));
      grain.animate(jumps, { duration: 9 * 70, iterations: Infinity });
    }
  } catch (e) {}
  const setGrain = () => { grain.style.opacity = (0.3 * Math.pow(1 - lit, 2.5)).toFixed(3); };

  // the eyes getting used to the dark: the room's shapes come up out of black
  baseIn.then(() => {
    note('dark room');
    base.animate([{ opacity: 0 }, { opacity: 1 }], { duration: calm ? 450 : 1500, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
    setGrain();
  });

  // a curve as points [ms from now, opacity, 'step' (hold, then jump) or an easing to the next point]
  function play(el, pts) {
    const T = Math.max(1, pts[pts.length - 1][0]);
    return el.animate(pts.map(([t, o, e]) => ({ offset: t / T, opacity: o, easing: e === 'step' ? 'steps(1, end)' : e || 'linear' })),
      { duration: T, fill: 'forwards' }).finished.catch(() => {});
  }
  // one flash at a time across the whole room: a flash (up, then down) starts at least 400 ms after the last one did
  let flashFree = 0;
  const flashSlot = (want) => { const at = Math.max(want, flashFree); flashFree = at + 400; return at; };
  // the camera's exposure catching up: the new light, again, fading off (only while the room is still dark)
  function flare(b, at, k) {
    if (calm || k < 0.05) return;
    const f = new Image(); f.alt = ''; f.className = 'lo-flare'; f.src = b.el.src; root.append(f);
    play(f, [[0, 0, 'step'], [at, k, 'cubic-bezier(.2,.6,.3,1)'], [at + 1100, 0]]).then(() => f.remove());
  }
  function curve(b, now) {
    const r = (a, z) => a + Math.random() * (z - a), darkK = Math.max(0, 0.65 - 1.1 * lit);
    if (calm) return { pts: [[0, 0, 'cubic-bezier(.45,0,.4,1)'], [520, 1]], strike: -1 };
    if (b.kind === 'tube') { // a fluorescent: its ends glow, it tries, it tries again, it strikes and warms up
      const a = 0, glow = r(380, 560), f1 = flashSlot(now + glow) - now, f2 = flashSlot(now + f1 + r(320, 480)) - now, s = flashSlot(now + f2 + r(330, 420)) - now;
      return { strike: s, flareK: darkK, pts: [[a, 0, 'ease-out'], [140, 0.035, 'ease-in-out'], [glow * 0.6, 0.06, 'ease-in-out'], [f1, 0.045, 'step'],
        [f1, 0.8, 'step'], [f1 + 70, 0.05, 'step'], [f2, 0.05, 'step'], [f2, 0.9, 'step'], [f2 + 110, 0.08, 'step'], [s, 0.08, 'step'],
        [s, 0.82, 'cubic-bezier(.3,.6,.3,1)'], [s + 650, 1]] };
    }
    if (b.kind === 'neon') { // a neon strip: a stutter, then it holds
      const f = flashSlot(now + r(0, 80)) - now;
      return { strike: f + 220, flareK: darkK * 0.8, pts: [[0, 0, 'step'], [f, 0, 'step'], [f, 0.5, 'step'], [f + 70, 0.07, 'step'], [f + 220, 0.07, 'step'],
        [f + 220, 0.9, 'ease-out'], [f + 520, 1]] };
    }
    if (b.kind === 'screen') { // an LCD: the standby light, the backlight on a dark panel, then the picture comes up
      return { strike: 480, flareK: 0, pts: [[0, 0, 'step'], [60, 0.1, 'step'], [480, 0.1, 'cubic-bezier(.25,.6,.3,1)'], [900, 1]] };
    }
    if (b.kind === 'gear') { // the gear: the CRTs pop on, the sign buzzes, the LEDs come up
      const f = flashSlot(now) - now;
      return { strike: f, flareK: 0, pts: [[0, 0, 'step'], [f, 0, 'step'], [f, 0.7, 'step'], [f + 50, 0.3, 'step'], [f + 190, 0.3, 'cubic-bezier(.3,.5,.3,1)'], [f + 560, 1]] };
    }
    // a bulb: the filament heats, fast and then easing in
    return { strike: 0, flareK: darkK * 0.6, pts: [[0, 0, 'cubic-bezier(.35,.1,.25,1)'], [r(300, 380), 1]] };
  }
  function fire(b) {
    b.done = Promise.all([b.dec, baseIn]).then(() => {
      const now = performance.now(), c = curve(b, now);
      note(`${b.id} (${b.kind})`);
      if (c.strike >= 0) flare(b, c.strike, c.flareK);
      setTimeout(() => { lit += (b.w ?? 1) / W; setGrain(); }, Math.max(0, c.strike));
      return play(b.el, c.pts);
    });
  }

  // pure progress: bank i comes on when the load passes (i + 1) / (banks + 1)
  let p = 0, fired = 0;
  function progress(x) {
    if (demo && !progress.real) return; // the demo paces itself
    p = Math.max(p, x);
    while (fired < L.length && p >= (fired + 1) / (L.length + 1) - 1e-6) fire(L[fired++]);
  }
  if (demo) { // a cold first visit's pace: ~5.5 s from the first byte to the room
    const T = 5500;
    const tick = () => { const x = Math.min(1, (performance.now() - t0) / T); progress.real = true; progress(x); progress.real = false; if (x < 1) setTimeout(tick, 50); };
    baseIn.then(tick);
  }
  let readyCalls = 0;
  function ready() {
    readyCalls++;
    const go = () => { progress.real = true; progress(1); return Promise.all(L.map((b) => b.done)); };
    const wait = demo ? new Promise((r) => { const t = () => (p >= 1 ? r() : setTimeout(t, 50)); t(); }) : Promise.resolve();
    return wait.then(go).then(() => new Promise((r) => setTimeout(r, calm ? 60 : 180))).then(() => {
      note('ready');
      if (q === 'hold') return new Promise(() => {});
    });
  }
  function handoff() {
    note('hand-off');
    root.classList.add('is-off');
    document.documentElement.classList.remove('lights-loading');
    setTimeout(() => root.remove(), 700);
  }
  // nothing came (the 3D failed): the lights all the same, and the page scrolls
  const giveUp = setTimeout(() => { if (!readyCalls) { progress.real = true; progress(1); document.documentElement.classList.remove('lights-loading'); } }, 30000);
  window.lightsOn = { progress, ready: (...a) => { clearTimeout(giveUp); return ready(...a); }, handoff, log, calm };
})();
