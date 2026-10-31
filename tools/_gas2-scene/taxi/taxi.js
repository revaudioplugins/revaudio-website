/* GAS 2 page: the taxi to the store (Dan 2026-10-31). How it works + the art and sound sources: taxi/README.md.
   After the service ticket is sent (SENT lands) the ticket closes, a 1950s cab rolls in from the right on the dirt, brakes
   (the nose dips), pulls up to the curb in front of the station and honks twice. Click / Enter = the tyre squeal: the rear
   wheel spins, it peels off left, the dust fills the screen and the store opens at Radio Roulette. "Not now" / Esc = it
   drives off calmly. The page's Download FREE turns over to a red "To the store" while it waits (it sends the cab too).
   One clock drives the whole visit, so nothing switches on with a jump (Dan, round 5: "make this scene more smooth,
   seamless"): the engine shakes the body and smokes from the tail pipe from the moment it rolls in, a trail behind it on
   the move, idling at the curb; the engine's sound idles on under it. The sound pans with the car.
   Dev: ?taxi=park shows it parked, ?taxi=bench adds the size / place bench, ?store=<url> sends the ride elsewhere. */
(() => {
  const Q = new URLSearchParams(location.search);
  const STORE = (() => {                               // ?store= is for a local review only, and only to an http(s) page:
    const def = 'https://revaudio.net/store#radio-roulette', o = Q.get('store');   // never a javascript: link on the web
    if (!o || !/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return def;
    try { const u = new URL(o, location.href); return /^https?:$/.test(u.protocol) ? u.href : def; } catch (e) { return def; }
  })();
  const DIR = document.currentScript.src.replace(/[^/]*$/, '');
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAR_W = 2385, TYRE = 171, REAR = 512 / 2385;   // car.png: the art's width, the tyre radius, the rear axle (art faces right)
  const PIPE = [-.004, .789];                          // the exhaust's outlet, just past the rear bumper, in the car box
  const HEAD = -1;                                     // the cab drives right to left (Dan, 2026-10-31): the art is mirrored
  const DRIVE = 2, STOP_IN_CLIP = 2.5;                 // s: the roll-in; where the car stops inside arrive.m4a
  const clamp = x => Math.max(0, Math.min(1, x));

  // ── sound: fetched with the page, decoded once a tap has unlocked audio (browsers start sound only after one) ──
  const NAMES = ['arrive', 'honk', 'peel', 'leave', 'idle'];
  const raw = Object.fromEntries(NAMES.map(n => [n, fetch(DIR + 'audio/' + n + '.m4a').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null)]));
  let ac = null, master = null; const bufs = {};
  const unlock = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ac && AC) {
      ac = new AC(); master = ac.createGain(); master.connect(ac.destination);
      for (const n of NAMES) bufs[n] = raw[n].then(ab => ab && new Promise(res => {      // a browser that can't decode AAC stays silent
        const p = ac.decodeAudioData(ab.slice(0), res, () => res(null)); if (p && p.catch) p.catch(() => res(null)); }));
    }
    if (ac && ac.state === 'suspended') ac.resume();
    if (master) master.gain.cancelScheduledValues(ac.currentTime), master.gain.setValueAtTime(1, ac.currentTime);
  };
  const voices = new Set();
  async function play(name, at = 0, loop = false) {     // at: seconds from now; returns the voice, or null without sound
    if (!ac) return null;
    const when = ac.currentTime + at, b = await bufs[name]; if (!b) return null;
    const src = ac.createBufferSource(), gain = ac.createGain(), pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    src.buffer = b; src.loop = loop; src.connect(gain); gain.connect(pan || master); if (pan) pan.connect(master);
    const v = { src, gain, pan }; voices.add(v); src.onended = () => voices.delete(v);
    src.start(Math.max(ac.currentTime, when)); return v;
  }
  const panTo = x => { if (!ac) return; for (const v of voices) if (v.pan) v.pan.pan.setTargetAtTime(x, ac.currentTime, .04); };
  const hush = s => { if (master) master.gain.setTargetAtTime(0, ac.currentTime, s / 3); };
  // the engine idling under the scene: in as the cab stops (over the arrival clip's own idle tail), settling quieter
  let idling = null;
  async function idleOn(at) {
    if (idling || !ac) return;
    idling = 'starting';
    const v = await play('idle', at, true);
    if (idling !== 'starting' || !v) { if (v) v.src.stop(); if (idling === 'starting') idling = null; return; }
    idling = v;
    const t0 = ac.currentTime + at, g = v.gain.gain;
    g.setValueAtTime(0, t0); g.linearRampToValueAtTime(1, t0 + .7); g.setTargetAtTime(.55, t0 + 5, 3);
  }
  function idleOff(fade) {
    const v = idling; idling = null;
    if (!v || v === 'starting' || !ac) return;
    const t = ac.currentTime, g = v.gain.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + fade); v.src.stop(t + fade + .05);
  }

  // ── the taxi, in the scene (its sizes are cqw of the photo); the exhaust is drawn on a canvas over the stage ──
  const scene = document.getElementById('scene'), stage = document.getElementById('stage');
  if (!scene || !stage) return;
  const wheel = w => `<div class="tx-wheel tx-${w}"><img class="tx-ring" src="${DIR}img/ring-${w}.webp" alt=""><img class="tx-ring tx-spin" src="${DIR}img/ring-${w}-spin.webp" alt="">` +
    `<img class="tx-shade" src="${DIR}img/shade-${w}.webp" alt=""><img class="tx-hub" src="${DIR}img/hub-${w}.webp" alt=""></div>`;
  const tx = document.createElement('div');
  tx.className = 'tx' + (HEAD < 0 ? ' tx-west' : ''); tx.hidden = true;
  tx.innerHTML = `<button class="tx-hit" type="button" aria-label="Take the taxi to the RevAudio store"></button>
    <div class="tx-car" aria-hidden="true"><i class="tx-shadow"></i>${wheel('r')}${wheel('f')}
      <div class="tx-body"><img src="${DIR}img/body.webp" alt=""><i class="tx-pipe"></i><span class="tx-sign">TAXI</span>
        <i class="tx-glow tx-head"></i><i class="tx-glow tx-tail"></i><i class="tx-glow tx-lit"></i></div></div>
    <div class="tx-cap"><b>Hop in</b><button type="button" class="tx-no">Not now</button></div>`;
  scene.append(tx);
  const $ = s => tx.querySelector(s);
  const car = $('.tx-car'), body = $('.tx-body'), hit = $('.tx-hit'), cap = $('.tx-cap');
  const rings = { r: [...tx.querySelectorAll('.tx-r .tx-ring')], f: [...tx.querySelectorAll('.tx-f .tx-ring')] };
  const FLIP = HEAD < 0 ? ' scaleX(-1)' : '';
  const fxc = document.createElement('canvas'); fxc.className = 'tx-fx'; fxc.setAttribute('aria-hidden', 'true'); stage.append(fxc);
  const fx = fxc.getContext('2d');

  let state = 'gone', viaKeys = false;
  const here = on => document.documentElement.classList.toggle('tx-here', on);   // the readings it covers step back
  const covers = () => { const rd = document.querySelector('.rd'); return !!rd && geo().c.right > rd.getBoundingClientRect().left + 8; };
  addEventListener('keydown', () => { viaKeys = true; }, true);
  addEventListener('pointerdown', () => { viaKeys = false; }, true);

  // one frame: s = px driven forward from the parked spot (< 0 = still on its way in), each wheel's turn (rad), its spin
  // blur (0-1), the body's tilt (deg, + = nose down) and lift (px). The art faces right, so it's mirrored heading left.
  function pose(s, ar, af, sr, sf, tilt, lift) {
    car.style.transform = `translateX(${(HEAD * s).toFixed(2)}px)${FLIP}`;
    rings.r[0].style.transform = rings.r[1].style.transform = `rotate(${ar}rad)`;
    rings.f[0].style.transform = rings.f[1].style.transform = `rotate(${af}rad)`;
    rings.r[1].style.opacity = sr; rings.f[1].style.opacity = sf;
    body.style.transform = `translateY(${lift.toFixed(2)}px) rotate(${tilt.toFixed(3)}deg)`;
  }
  const geo = () => {                                   // px, measured with the car on its mark
    const t = car.style.transform; car.style.transform = FLIP.trim();
    const S = stage.getBoundingClientRect(), c = car.getBoundingClientRect(); car.style.transform = t;
    return { c, S, w: c.width, k: c.width / 1200, tyre: TYRE / CAR_W * c.width,
      start: HEAD > 0 ? S.left - c.right - 30 : -(S.right - c.left + 30),   // s where it is just out of sight behind
      exit: HEAD > 0 ? S.right - c.left + 30 : c.right - S.left + 30 };     // s where it is just out of sight ahead
  };
  const sx = (g, s) => g.c.left + HEAD * s;              // the car box's screen left at s
  const rearX = (g, s) => sx(g, s) + (HEAD > 0 ? REAR : 1 - REAR) * g.w;
  const pipeX = (g, s) => sx(g, s) + (HEAD > 0 ? PIPE[0] : 1 - PIPE[0]) * g.w;
  const panAt = (g, s) => panTo(Math.max(-.85, Math.min(.85, ((sx(g, s) + g.w / 2 - g.S.left) / g.S.width - .5) * 1.8)));

  // ── the exhaust and the tyre smoke: soft puffs on a canvas over the stage, each one left where it was blown out
  //    (a trail behind a moving cab), drifting back, rising as it cools, spreading and fading ──
  let fxW = 0, fxH = 0, dpr = 1;
  const sizeFx = () => { const r = stage.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); fxW = r.width; fxH = r.height;
    fxc.width = Math.round(fxW * dpr); fxc.height = Math.round(fxH * dpr); };
  sizeFx(); addEventListener('resize', sizeFx);
  const sprite = rgb => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.42, `rgba(${rgb},.5)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  const SPRITE = { light: sprite('214,215,220'), dark: sprite('78,72,66'), tyre: sprite('226,222,214') };
  const parts = [];
  const emit = (x, y, o) => { if (parts.length < 260) parts.push({ x, y, ...o, age: 0 }); };
  function drawFx(dt) {
    fx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.clearRect(0, 0, fxW, fxH);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.age += dt;
      if (p.age >= p.life) { parts.splice(i, 1); continue; }
      p.vx *= Math.exp(-1.5 * dt); p.vy = p.vy * Math.exp(-.8 * dt) - 24 * dt;      // air drag; warm gas rises
      p.x += p.vx * dt; p.y += p.vy * dt;
      const u = p.age / p.life, r = p.r * (1 + p.grow * (1 - Math.exp(-3 * u)));
      fx.globalAlpha = p.peak * (u < .14 ? u / .14 : (1 - (u - .14) / .86) ** 1.7);
      fx.drawImage(SPRITE[p.tone], p.x - r, p.y - r, 2 * r, 2 * r);
    }
    fx.globalAlpha = 1;
  }

  // ── one clock for the whole visit. A plan says, for the time u since it began, where the cab is (s), how fast (v),
  //    how hard the engine works (throttle 0-1), where its springs want the body (pitch) and how the rear tyre slips.
  //    The loop turns that into the drive, the wheels, the springs, the engine's shake and the exhaust, frame by frame,
  //    and runs on until the last puff has faded ──
  let plan = null, u = 0, raf = 0, last = 0, g = null, s = 0, ar = 0, af = 0;
  const body$ = { p: 0, v: 0 };                          // the body's pitch on its springs
  const eng = { a: 0, b: 0, c: 0, d: 0, puff: 0, trail: 0, tyre: 0 };
  function follow(next) { plan = next; u = 0; if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
  function tick(now) {
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; u += dt;
    const k = plan && plan(u);
    if (k && g) {
      const ds = k.s - s; s = k.s;
      af += ds / g.tyre; ar += ds / g.tyre + (k.slip || 0) * dt;
      const wf = Math.abs(k.v) / g.tyre, wr = wf + (k.slip || 0);
      // the springs: braking dips the nose, a launch squats the tail; they settle by themselves when the cab stops
      const hz = k.hz || 1.6, w = 2 * Math.PI * hz, z = k.zeta || .34;
      body$.v += (w * w * (k.pitch - body$.p) - 2 * z * w * body$.v) * dt; body$.p += body$.v * dt;
      // the engine: an old six idling, quicker and rougher with throttle, a heavier knock about once a second at idle;
      // on the move the road adds slow bumps. Phases accumulate, so a change of pace never jumps.
      const rpm = 1 + 1.6 * k.throttle + .5 * clamp(Math.abs(k.v) / 1200);
      eng.a += 2 * Math.PI * 11 * rpm * dt; eng.b += 2 * Math.PI * 17.3 * rpm * dt; eng.c += 2 * Math.PI * .9 * dt; eng.d += 2 * Math.PI * 3.4 * dt;
      const hum = (Math.sin(eng.a) + .64 * Math.sin(eng.b + 1.7) + .5 * (Math.random() - .5)) * .55 * (1 + .8 * k.throttle);
      const knock = Math.max(0, Math.sin(eng.c)) ** 10 * 1.1 / rpm;
      const road = clamp(Math.abs(k.v) / 700) * (.65 * Math.sin(eng.d) + .35 * Math.sin(eng.d * 1.53 + 1));
      pose(s, ar, af, clamp((wr - 4) / 10), clamp((wf - 4) / 10), body$.p + .035 * (1 + k.throttle) * Math.sin(eng.a * .63), (hum + knock + road * 1.1) * g.k);
      panAt(g, s);
      // the exhaust: puffs by time (more with throttle) and by distance (so a moving cab leaves a trail)
      eng.puff += dt * (5 + 12 * k.throttle); eng.trail += Math.abs(ds);
      while (eng.puff >= 1) { eng.puff -= 1; exhaust(k); }
      while (eng.trail >= 40 * g.k) { eng.trail -= 40 * g.k; exhaust(k); }
      if (k.burn) { eng.tyre += dt * 30; while (eng.tyre >= 1) { eng.tyre -= 1; tyreSmoke(); } }
    }
    drawFx(dt);
    if (plan || parts.length) raf = requestAnimationFrame(tick); else raf = 0;
  }
  function exhaust(k) {
    const x = pipeX(g, s) - g.S.left, y = g.c.top + PIPE[1] * g.c.height - g.S.top, th = k.throttle;
    emit(x, y, {
      vx: HEAD * Math.abs(k.v) * .12 - HEAD * (35 + 55 * th) * (.7 + Math.random() * .6),   // blown back, dragged a little along
      vy: -6 - Math.random() * 12, r: g.w * (.011 + .007 * th + Math.random() * .006), grow: 2.4 + Math.random() * 1.4 + th,
      life: 1.6 + Math.random() * 1.1, peak: .38 + .22 * th + Math.random() * .1, tone: th > .8 ? 'dark' : 'light' });
  }
  function tyreSmoke() {
    emit(rearX(g, s) - g.S.left, g.c.bottom - .02 * g.c.height - g.S.top, {
      vx: -HEAD * (90 + Math.random() * 130), vy: -18 - Math.random() * 40, r: g.w * (.018 + Math.random() * .02),
      grow: 3 + Math.random() * 2, life: .9 + Math.random() * .7, peak: .5 + Math.random() * .2, tone: 'tyre' });
  }

  // the plans
  const waiting = () => ({ s: 0, v: 0, throttle: 0, pitch: 0 });
  function rollIn() {                                    // a steady roll, then even braking onto its mark
    const D = -g.start, T = DRIVE, t1 = .35 * T, v0 = D / (t1 + (T - t1) / 2), a = v0 / (T - t1);
    let stopped = false;
    return u => {
      if (u >= T) { if (!stopped) { stopped = true; atCurb(); } return waiting(); }
      const d = u < t1 ? v0 * u : v0 * t1 + v0 * (u - t1) - a * (u - t1) ** 2 / 2;
      return { s: g.start + d, v: u < t1 ? v0 : v0 - a * (u - t1), throttle: u < t1 ? .35 : 0, pitch: u < t1 ? 0 : .9 };
    };
  }
  function peelOff(dust) {                               // a burnout (it barely creeps), then the launch; the dust rolls over
    const B = .32, creep = 12, vB = 2 * creep / B, TL = .78, acc = 2 * (g.exit - creep - vB * TL) / TL ** 2;
    let dustAt = .22;
    return u => {
      const t = u - B, s = u < B ? creep * (u / B) ** 2 : creep + vB * t + acc * t * t / 2;
      if (u > dustAt && u < 1.05) { dustAt = u + .06; cloud(dust, rearX(g, s), g.c.bottom - .02 * g.c.height); }
      dust.style.setProperty('--tx-dark', clamp((u - .78) / .42).toFixed(3));
      return { s, v: u < B ? vB * u / B : vB + acc * t, throttle: 1, pitch: u < B + .25 ? -1.15 : -.4, hz: 2.2, zeta: .4,
        slip: u < B ? 26 + 40 * u : 38 * Math.exp(-t * 2.5), burn: u < .9 };
    };
  }
  function pullAway() {                                  // a calm pull away to the left; gone once out of sight
    const TL = 2.4, acc = 2 * g.exit / TL ** 2;
    return u => {
      if (u >= TL) { gone(); return null; }
      return { s: acc * u * u / 2, v: acc * u, throttle: .5, pitch: u < .6 ? -.45 : 0 };
    };
  }

  // ── the visit ──
  function arrive(force) {
    if (state !== 'gone' && !force) return;
    state = 'arriving'; tx.hidden = false; hit.disabled = true; cap.classList.remove('tx-on');
    here(covers());
    if (still()) {                                       // reduced motion: it is just there at the stop
      car.style.opacity = 0; pose(0, 0, 0, 0, 0, 0, 0);
      setTimeout(() => { car.style.opacity = ''; }, DRIVE * 1000);
      setTimeout(() => { play('honk'); idleOn(0); }, (DRIVE + .35) * 1000);
      setTimeout(park, (DRIVE + 1.2) * 1000);
      return;
    }
    g = geo(); s = g.start; ar = af = s / g.tyre; body$.p = body$.v = 0;
    pose(s, ar, af, 1, 1, 0, 0);
    follow(rollIn());
  }
  function atCurb() {                                    // it has just stopped: honk, the engine idles on
    state = 'stopping';
    play('honk', .35); idleOn(.25);
    setTimeout(() => { if (state === 'stopping') park(); }, 1000);
  }
  function park() {
    state = 'parked'; tx.hidden = false; car.style.opacity = ''; here(covers());
    hit.disabled = false; cap.classList.add('tx-on');
    if (!document.querySelector('link[data-tx-prefetch]')) {
      const l = document.createElement('link'); l.rel = 'prefetch'; l.href = STORE; l.dataset.txPrefetch = ''; document.head.append(l);
    }
    if (viaKeys) hit.focus({ preventScroll: true });
    turn(true);
    if (!still() && !plan) { g = geo(); s = 0; follow(waiting); }   // straight to the curb (?taxi=park): idle anyway
  }
  function go() {                                        // squeal, wheelspin, the tail squats, it peels off; the dust; the store
    if (state !== 'parked') return;
    state = 'leaving'; hit.disabled = true; cap.classList.remove('tx-on');
    unlock(); play('peel'); idleOff(.25);
    const dust = document.createElement('div'); dust.className = 'tx-dust'; document.body.append(dust);
    const leaveAt = still() ? .35 : 1.38;
    setTimeout(() => hush(.2), (leaveAt - .22) * 1000);
    setTimeout(() => { location.href = STORE; }, leaveAt * 1000);
    if (still()) { dust.style.setProperty('--tx-dark', 1); return; }
    g = geo(); follow(peelOff(dust));
  }
  function away() {                                      // not now: it pulls away calmly
    if (state !== 'parked') return;
    state = 'leaving'; hit.disabled = true; cap.classList.remove('tx-on');
    unlock(); play('leave'); idleOff(1.2);
    if (still()) { car.style.opacity = 0; setTimeout(gone, 400); return; }
    g = geo(); follow(pullAway());
  }
  function gone() {                                      // out of sight; the loop runs on until its last puff fades
    plan = null; state = 'gone'; tx.hidden = true; car.style.opacity = ''; s = 0; pose(0, 0, 0, 0, 0, 0, 0);
    here(false); turn(false);
  }
  function cloud(layer, x, y) {                          // the dust that rolls over the screen
    const v = Math.max(innerWidth, innerHeight), i = document.createElement('i'), d = v * (.35 + Math.random() * .3);
    Object.assign(i.style, { left: x - d / 2 + 'px', top: y - d / 2 + 'px', width: d + 'px', height: d + 'px' });
    layer.append(i);
    i.animate([{ transform: 'scale(.12)', opacity: 0 }, { opacity: .95, offset: .3 },
      { transform: `translate(${-HEAD * (Math.random() - .3) * d * .9}px, ${-Math.random() * d * .7}px) scale(${2.6 + Math.random() * 1.4})`, opacity: .9 }],
      { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.15,.6,.3,1)', fill: 'forwards' });
  }

  // ── the page's Download FREE turns over to a red "To the store" while the cab waits (Dan, 2026-10-31) ──
  const cta = document.getElementById('cta'), ctaHTML = cta ? cta.innerHTML : '';
  let red = false;
  function turn(on) {
    if (!cta || red === on) return;
    red = on;
    const swap = () => { cta.classList.toggle('tx-red', on); cta.innerHTML = on ? 'To the store' : ctaHTML; };
    if (still()) { swap(); return; }
    const P = 'perspective(700px) ';
    cta.animate([{ transform: P + 'rotateY(0deg)' }, { transform: P + 'rotateY(90deg)' }], { duration: 240, easing: 'cubic-bezier(.55,0,.9,.4)' })
      .onfinish = () => { swap(); cta.animate([{ transform: P + 'rotateY(-90deg)' }, { transform: P + 'rotateY(0deg)' }], { duration: 460, easing: 'cubic-bezier(.2,.9,.25,1.12)' }); };
  }
  // red, it rides: caught before the page's own click (which opens the service ticket)
  document.addEventListener('click', e => {
    if (!red || !e.target.closest || !e.target.closest('#cta')) return;
    e.preventDefault(); e.stopPropagation(); go();
  }, true);

  hit.addEventListener('click', go);
  $('.tx-no').addEventListener('click', away);
  addEventListener('keydown', e => { if (e.key === 'Escape' && state === 'parked' && !document.querySelector('.veil.open')) away(); });
  // the ticket is sent (page-b's own submit handler has stamped it): close it after a beat, then the cab rolls in
  const ticket = document.getElementById('ticket'), veil = document.getElementById('veil');
  const CLOSE = 1.35, ROLL = 1.6;                      // s after the send: the ticket goes, the cab starts rolling in
  if (ticket) ticket.addEventListener('submit', () => {
    unlock();
    setTimeout(() => { if (veil) veil.classList.remove('open'); }, CLOSE * 1000);
    if (state === 'gone') { play('arrive', ROLL + DRIVE - STOP_IN_CLIP); setTimeout(arrive, ROLL * 1000); }
    else if (state === 'parked') play('honk', CLOSE + .3);
  });
  // back from the store: the page comes back as it was left (bfcache), so clear the dust and send the cab home
  addEventListener('pageshow', e => { if (!e.persisted) return;
    document.querySelectorAll('.tx-dust').forEach(d => d.remove());
    cancelAnimationFrame(raf); raf = 0; plan = null; parts.length = 0; drawFx(0); idleOff(0);
    state = 'gone'; tx.hidden = true; pose(0, 0, 0, 0, 0, 0, 0); here(false); turn(false); if (master) master.gain.value = 1; });

  if (Q.get('taxi') === 'park' || Q.get('taxi') === 'bench') park();
  if (Q.get('taxi') === 'bench') bench();

  // ── ?taxi=bench: size and place the parked cab by eye; COPY = the numbers to bake into taxi.css ──
  function bench() {
    const KEY = 'gas2taxi:bench2', DEF = { w: 105, x: -53.8, lift: -.2 };   // a new key per new default (old stored values would hide it)
    let v = { ...DEF }; try { Object.assign(v, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
    const p = document.createElement('div'); p.className = 'tx-bench';
    const row = (k, label, min, max, step) => `<label>${label}<input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}"><output data-o="${k}"></output></label>`;
    p.innerHTML = `<b>TAXI</b>${row('w', 'Size', 50, 160, 1)}${row('x', 'Stop', -80, 40, .5)}${row('lift', 'Lift', -8, 8, .1)}
      <div class="tx-bench-row"><button type="button" data-a="arrive">▶ Arrive</button><button type="button" data-a="reset">Reset</button><button type="button" data-a="copy">Copy</button></div>
      <small>Size = its length (cqw of the scene) · Stop = where its left end parks · Lift = up/down</small>`;
    document.body.append(p);
    const apply = () => {
      tx.style.setProperty('--tx-w', v.w + 'cqw'); tx.style.setProperty('--tx-x', v.x + 'cqw'); tx.style.setProperty('--tx-lift', v.lift + 'cqw');
      p.querySelectorAll('input').forEach(i => { i.value = v[i.dataset.k]; p.querySelector(`[data-o="${i.dataset.k}"]`).textContent = v[i.dataset.k]; });
      try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
      if (state === 'parked' && !still()) g = geo();       // the idle loop measures the cab where it now stands
    };
    p.addEventListener('input', e => { const k = e.target.dataset.k; if (k) { v[k] = +e.target.value; apply(); } });
    p.addEventListener('click', e => {
      const a = e.target.dataset.a;
      if (a === 'arrive') { unlock(); idleOff(.3); plan = null; state = 'gone'; tx.hidden = true; play('arrive');
        setTimeout(() => arrive(true), (STOP_IN_CLIP - DRIVE) * 1000); }
      if (a === 'reset') { v = { ...DEF }; apply(); }
      if (a === 'copy') { const t = `--tx-w: ${v.w}cqw; --tx-x: ${v.x}cqw; --tx-lift: ${v.lift}cqw;`, note = p.querySelector('small');
        note.textContent = t;                                          // shown too, in case the clipboard is refused
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { e.target.textContent = 'Copied'; }, () => {}); }
    });
    apply();
  }
})();
