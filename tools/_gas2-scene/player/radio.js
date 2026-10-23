/* GAS 2 radio player (Yoni's part of page-b; plan tasks/gas2-radio-plan.md).
   Scene: tap the station's radio -> the close-up opens and plays the station on ORIGINAL. Close-up: the dial = 5
   stations, the two band keys ORIGINAL | GAS 2 = the A/B (same spot in the song, 30 ms crossfade, level-matched
   renders), left knob = volume, right knob = tuning. Closing the close-up keeps it playing; the scene radio glows.
   Keys while open: A / B or arrows left-right = the keys, 1-5 / arrows up-down = stations, Space = play / stop. */
(() => {
  const BASE = new URL('.', document.currentScript.src).href;
  // the renders: <id>_before / <id>_after, sample-aligned, level-matched (spec: tasks/gas2-radio-plan.md).
  // PLACEHOLDER until Yoni's renders exist: every station plays the GAS mixer loops (-17 LUFS both sides).
  const PH = { a: 'audio/placeholder_before.m4a', b: 'audio/placeholder_after.m4a', gas: null };
  const STATIONS = [
    { id: 'hiphop', name: 'HIP HOP', a: 'audio/hiphop_before.m4a', b: 'audio/hiphop_after.m4a', gas: { grade: 'PREMIUM', amount: 140 } },   // Yoni's renders 2026-10-23 (prep_audio.py)
    { id: 'electronic', name: 'ELECTRONIC', ...PH },
    { id: 'rock', name: 'ROCK', ...PH },
    { id: 'trap', name: 'TRAP', ...PH },
    { id: 'folk', name: 'FOLK', ...PH },
  ];   // gas: { grade: 'PREMIUM', amount: 140 } prints the mix's GAS 2 settings in the caption

  // ---------- the close-up ----------
  const veil = document.createElement('div');
  veil.className = 'veil rp-veil'; veil.id = 'rpVeil';
  veil.setAttribute('role', 'dialog'); veil.setAttribute('aria-modal', 'true'); veil.setAttribute('aria-label', 'The GAS 2 radio');
  veil.innerHTML = `
    <button type="button" class="rp-x" data-close aria-label="Close">×</button>
    <div class="rp-view"><div class="rp-plate">
      <img class="rp-off" src="${BASE}img/radio-off.webp" alt="" draggable="false">
      <img class="rp-lit" src="${BASE}img/radio-lit.webp" alt="" draggable="false">
      <div class="rp-px rp-glass"><i class="rp-glow"></i><i class="rp-scale"></i><i class="rp-ptr"></i>
        <div class="rp-st">${STATIONS.map((s, i) => `<button type="button" data-st="${i}">${s.name}</button>`).join('')}</div></div>
      <div class="rp-px rp-well"></div>
      <button type="button" class="rp-key p" aria-label="Play / stop" aria-pressed="false"><span><svg viewBox="0 0 10 10"><path d="M1.5 .8 9 5 1.5 9.2z"/></svg><svg viewBox="0 0 10 10"><path d="M1.2 1.2h7.6v7.6H1.2z"/></svg></span></button>
      <button type="button" class="rp-key a" data-side="a" aria-pressed="true"><span>ORIGINAL</span></button>
      <button type="button" class="rp-key b" data-side="b" aria-pressed="false"><span>GAS 2</span></button>
      <div class="rp-knob rp-vol" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100"><b></b></div>
      <div class="rp-knob rp-tun" role="slider" tabindex="0" aria-label="Tuning" aria-valuemin="1" aria-valuemax="${STATIONS.length}"><b></b></div>
      <i class="rp-jewel"></i><i class="rp-eye"><canvas></canvas></i>
      <span class="rp-eng" style="left:calc(345 * var(--u))">VOLUME</span><span class="rp-eng" style="left:calc(1013.5 * var(--u))">TUNING</span>
    </div></div>
    <div class="rp-tags">${STATIONS.map((s, i) => `<button type="button" data-st="${i}" style="--r:${[-1.5, 1, -.5, 1.5, -1][i]}deg">${s.name}</button>`).join('')}</div>
    <div class="rp-cap" aria-live="polite"></div>
    <div class="rp-hint">A / B switch · 1-5 stations · Space play / stop<span class="rp-ph"> · placeholder audio</span></div>`;
  document.body.appendChild(veil);
  const q = s => veil.querySelector(s), qa = s => [...veil.querySelectorAll(s)];
  const plate = q('.rp-plate'), cap = q('.rp-cap'), ptr = q('.rp-ptr');
  const knobVol = q('.rp-knob.rp-vol'), knobTune = q('.rp-knob.rp-tun');

  const knobAt = (el, deg) => {
    const f = Math.round((Math.max(-135, Math.min(135, deg)) + 135) / 270 * 128), b = el.firstChild;
    b.style.backgroundPosition = `${(f % 12) * 100 / 11}% ${Math.floor(f / 12) * 10}%`;
  };
  // the tuning knob glides to its detent (a short ease-out tween of the angle, frame by frame); the hand drives it 1:1
  let tuneA = -100, tuneRaf = 0;
  const tuneTo = deg => {
    cancelAnimationFrame(tuneRaf); const a0 = tuneA, t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - k, 3); tuneA = a0 + (deg - a0) * e; knobAt(knobTune, tuneA); if (k < 1) tuneRaf = requestAnimationFrame(step); };
    tuneRaf = requestAnimationFrame(step);
  };

  // ---------- state ----------
  let st = 0, side = 'a', playing = false, vol = .8;

  // ---------- the engine: both sides of a mix play in sync, the keys only move two gains ----------
  let ac, bus, master, gA, gB, an, srcs = [], cache = new Map(), token = 0;
  const ensure = () => {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.connect(ac.destination);
    bus = ac.createGain(); bus.connect(master);
    gA = ac.createGain(); gB = ac.createGain(); gA.connect(bus); gB.connect(bus);
    an = ac.createAnalyser(); an.fftSize = 2048; bus.connect(an);   // the magic eye listens after the keys, before volume
    setVol(vol);
  };
  const buf = url => {
    if (!cache.has(url)) cache.set(url, fetch(BASE + url).then(r => r.arrayBuffer()).then(d => new Promise((ok, no) => ac.decodeAudioData(d, ok, no))));
    return cache.get(url);
  };
  // ramp only while sound runs; on a still context set the value (a ramp scheduled on a suspended context is read
  // back mid-way once it starts: tasks/lessons.md 2026-10-22)
  const glide = (p, v, s) => { const t = ac.currentTime; p.cancelScheduledValues(t);
    if (playing && ac.state === 'running') { p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + s); } else p.setValueAtTime(v, t); };
  const stopSrcs = () => { srcs.forEach(s => { try { s.stop(); } catch (e) {} }); srcs = []; };
  const start = async () => {
    const my = ++token, s = STATIONS[st];
    const [a, b] = await Promise.all([buf(s.a), buf(s.b)]);
    if (my !== token || !playing) return;
    stopSrcs();
    const t = ac.currentTime + .06;
    srcs = [[a, gA], [b, gB]].map(([bf, g]) => { const n = ac.createBufferSource(); n.buffer = bf; n.loop = true; n.connect(g); n.start(t); return n; });
    gA.gain.setValueAtTime(side === 'a' ? 1 : 0, t); gB.gain.setValueAtTime(side === 'b' ? 1 : 0, t);
    bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(1, t + .15);
  };
  // the dial between stations: a short burst of band-passed static (the radio's own sound of tuning)
  const crackle = () => {
    const n = ac.sampleRate * .32, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < .02 ? 1 : .35);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = .8;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .03); g.gain.linearRampToValueAtTime(0, t + .32);
    s.buffer = b; s.connect(f).connect(g).connect(master); s.start(t);
  };
  const setVol = v => { vol = Math.min(1, Math.max(0, v)); if (master) master.gain.setTargetAtTime(vol * vol, ac.currentTime, .015);
    knobAt(knobVol, -135 + vol * 270); knobVol.setAttribute('aria-valuenow', Math.round(vol * 100)); };

  // ---------- actions ----------
  const play = () => { ensure(); playing = true; start(); render(); };
  const stop = () => {
    playing = false; token++;
    if (ac) { const t = ac.currentTime; bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + .12);
      const old = srcs; srcs = []; setTimeout(() => old.forEach(s => { try { s.stop(); } catch (e) {} }), 160); }
    render();
  };
  const setSide = v => { if (v === side && playing) return; side = v; if (!playing) return play(); glide(gA.gain, v === 'a' ? 1 : 0, .03); glide(gB.gain, v === 'b' ? 1 : 0, .03); render(); };
  const tune = i => {
    i = (i + STATIONS.length) % STATIONS.length;
    if (i === st && playing) return stop();            // the station on air again = off
    st = i; side = 'a';                                 // every mix starts on ORIGINAL (Yoni 2026-10-22)
    ensure(); const was = playing;
    if (was) { crackle(); const t = ac.currentTime; bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + .15); }
    playing = true; setTimeout(start, was ? 160 : 0); render();
  };

  // ---------- what the eye reads ----------
  const radio = document.getElementById('radio'), sceneCap = document.getElementById('radioCap');
  const render = () => {
    const s = STATIONS[st], b = side === 'b';
    plate.classList.toggle('on', playing); plate.classList.toggle('b', playing && b);
    qa('.rp-key[data-side]').forEach(k => { const d = k.dataset.side === side; k.classList.toggle('down', d); k.setAttribute('aria-pressed', d); });
    const pk = q('.rp-key.p'); pk.classList.toggle('down', playing); pk.setAttribute('aria-pressed', playing);
    if (playing) eyeLoop();
    qa('[data-st]').forEach(x => x.classList.toggle('on', +x.dataset.st === st));
    ptr.style.left = (2 + 96 * (st + .5) / STATIONS.length) + '%';
    tuneTo(-100 + 200 * st / (STATIONS.length - 1)); knobTune.setAttribute('aria-valuenow', st + 1);
    const set = s.gas ? `${s.gas.grade} · GAS ${s.gas.amount} %` : 'on the master';
    cap.innerHTML = !playing ? 'Off · tap a station' : b ? `On air: ${s.name} · <em>GAS 2</em> ${set}` : `On air: ${s.name} · <em>Original</em> · press GAS 2`;
    q('.rp-ph').hidden = s.a !== PH.a;
    if (radio) { radio.classList.toggle('on', playing); radio.classList.toggle('b', playing && b); }
    if (sceneCap) sceneCap.innerHTML = playing ? `On air: <em>${b ? 'GAS 2' : 'ORIGINAL'}</em> · ${s.name}` : 'Tap the radio';
  };

  // ---------- hands ----------
  qa('.rp-key[data-side]').forEach(k => k.addEventListener('click', () => setSide(k.dataset.side)));
  q('.rp-key.p').addEventListener('click', () => (playing ? stop() : play()));

  // ---------- the magic eye: an EM34-style green fan whose dark shadow closes as the music gets louder ----------
  const eyeC = q('.rp-eye canvas'), eyeX = eyeC.getContext('2d');
  let eyeRaf = 0, lvl = 0, tbuf;
  const eyeSize = () => { const r = eyeC.getBoundingClientRect(), d = Math.max(16, Math.round(r.width * (window.devicePixelRatio || 1))); if (eyeC.width !== d) eyeC.width = eyeC.height = d; };
  const drawEye = open => {
    const W = eyeC.width, c = W / 2, r0 = c * .36, r1 = c * .95, th = (52 - 46 * open) * Math.PI / 180;
    eyeX.clearRect(0, 0, W, W);
    let g = eyeX.createRadialGradient(c, c * .9, 0, c, c, c); g.addColorStop(0, '#10261a'); g.addColorStop(1, '#07120b');
    eyeX.fillStyle = g; eyeX.beginPath(); eyeX.arc(c, c, c, 0, 7); eyeX.fill();
    g = eyeX.createRadialGradient(c, c, r0, c, c, r1);
    g.addColorStop(0, 'rgba(170,255,185,.96)'); g.addColorStop(.45, 'rgba(84,236,128,.88)'); g.addColorStop(1, 'rgba(22,128,64,.55)');
    const a0 = -Math.PI / 2 + th, a1 = Math.PI * 1.5 - th;
    eyeX.fillStyle = g; eyeX.beginPath(); eyeX.arc(c, c, r1, a0, a1); eyeX.arc(c, c, r0, a1, a0, true); eyeX.closePath(); eyeX.fill();
    eyeX.strokeStyle = 'rgba(200,255,210,.75)'; eyeX.lineWidth = Math.max(1, W / 70);   // the bright edges of the shadow
    [a0, a1].forEach(a => { eyeX.beginPath(); eyeX.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); eyeX.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); eyeX.stroke(); });
    g = eyeX.createRadialGradient(c * .9, c * .85, 0, c, c, r0 * .9); g.addColorStop(0, '#3a2c1e'); g.addColorStop(1, '#140d08');
    eyeX.fillStyle = g; eyeX.beginPath(); eyeX.arc(c, c, r0 * .86, 0, 7); eyeX.fill();   // the cathode cap
    g = eyeX.createLinearGradient(0, 0, W * .6, W * .6); g.addColorStop(0, 'rgba(235,245,230,.22)'); g.addColorStop(1, 'rgba(235,245,230,0)');
    eyeX.fillStyle = g; eyeX.beginPath(); eyeX.ellipse(c * .72, c * .62, c * .5, c * .3, -.6, 0, 7); eyeX.fill();   // the glass, lit from the upper left
  };
  const eyeLoop = () => {
    if (eyeRaf) return;
    eyeSize();
    const step = () => {
      if (!playing || !an) { eyeRaf = 0; return; }
      tbuf = tbuf || new Float32Array(an.fftSize); an.getFloatTimeDomainData(tbuf);
      let e = 0; for (let i = 0; i < tbuf.length; i++) e += tbuf[i] * tbuf[i];
      const db = 10 * Math.log10(e / tbuf.length + 1e-12), t = Math.min(1, Math.max(0, (db + 34) / 26));
      lvl += (t - lvl) * (t > lvl ? .45 : .07);   // fast attack, slow release: the tube's own ballistics
      drawEye(lvl); eyeRaf = requestAnimationFrame(step);
    };
    eyeRaf = requestAnimationFrame(step);
  };
  addEventListener('resize', eyeSize);
  qa('[data-st]').forEach(x => x.addEventListener('click', () => tune(+x.dataset.st)));
  // knobs: drag up / right = clockwise, 1:1 (no transition while the hand is on it); wheel and arrow keys too
  const knob = (el, onDelta) => {
    let y0 = null, acc = 0;
    el.addEventListener('pointerdown', e => { y0 = e.clientY - e.clientX; acc = 0; el.setPointerCapture(e.pointerId); el.classList.add('drag'); });
    el.addEventListener('pointermove', e => { if (y0 === null) return; const p = e.clientY - e.clientX, d = y0 - p; y0 = p; acc = onDelta(d, acc); });
    const up = () => { y0 = null; el.classList.remove('drag'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); acc = onDelta(-e.deltaY / 2, acc); }, { passive: false });
    el.addEventListener('keydown', e => { const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); e.stopPropagation(); acc = onDelta(d * 40, 0); } });
  };
  knob(knobVol, (d, acc) => { setVol(vol + d / 220); return 0; });
  knob(knobTune, (d, acc) => { acc += d; if (Math.abs(acc) >= 40) { tune(st + Math.sign(acc)); return 0; } return acc; });   // detents

  // the camera flies from the radio on the bench into the close-up, and back out (one tween, the house curve; a
  // radio the scene has cropped off-screen, e.g. on a phone, just fades)
  const view = q('.rp-view');
  const flightFrom = () => {
    const r = radio && radio.getBoundingClientRect();
    if (!r || r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) return null;
    view.classList.remove('fly'); const t0 = view.style.transform; view.style.transform = 'none';
    const V = view.getBoundingClientRect(), cs = getComputedStyle(view), cw = +cs.getPropertyValue('--cw'), cx = +cs.getPropertyValue('--cx'), cy = +cs.getPropertyValue('--cy');
    view.style.transform = t0;
    const u = V.width / cw, bx = (204 - cx) * u, by = (108 - cy) * u, bw = 960 * u, sc = r.width / bw;   // the radio's body in the plate: x 204..1164, top 108
    return `translate(${r.left - V.left - bx * sc}px, ${r.top - V.top - by * sc}px) scale(${sc})`;
  };
  let flyT = 0;
  const open = () => {
    clearTimeout(flyT);
    const from = flightFrom();
    if (from) { view.style.transform = from; view.offsetWidth; view.classList.add('fly'); }
    veil.classList.add('open'); view.style.transform = 'none';
    if (!playing) play(); else render();
    eyeSize(); setTimeout(() => { eyeSize(); q('.rp-key.b').focus({ preventScroll: true }); }, 650);
  };
  const close = () => {
    if (!veil.classList.contains('open')) return;
    const to = flightFrom();
    if (to) { view.classList.add('fly'); view.style.transform = to; }
    veil.classList.remove('open');
    flyT = setTimeout(() => { view.classList.remove('fly'); view.style.transform = 'none'; }, 650);
  };
  veil.addEventListener('click', e => { if (e.target === veil || e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && veil.classList.contains('open')) { e.stopImmediatePropagation(); close(); } }, true);
  addEventListener('keydown', e => {
    if (!veil.classList.contains('open') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'a' || k === 'arrowleft') setSide('a');
    else if (k === 'b' || k === 'arrowright') setSide('b');
    else if (k === 'arrowup') tune(st - 1);
    else if (k === 'arrowdown') tune(st + 1);
    else if (/^[1-9]$/.test(k) && +k <= STATIONS.length) tune(+k - 1);
    else if (k === ' ') { playing ? stop() : play(); }
    else return;
    e.preventDefault();
  });

  // the scene's radio opens the close-up (the page's own first-draft handler is replaced, not stacked)
  if (radio) { radio.onclick = null; radio.addEventListener('click', open); radio.setAttribute('aria-label', 'Open the radio: hear GAS 2 on and off'); }
  setVol(vol); render();
  window.gas2Radio = { open, close, tune, setSide, play, stop, get state() { return { st, side, playing, vol, t: ac && ac.currentTime, gA: gA && gA.gain.value, gB: gB && gB.gain.value }; } };
})();
