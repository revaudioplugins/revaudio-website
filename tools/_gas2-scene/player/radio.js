/* GAS 2 radio player (Yoni's part of page-b; plan tasks/gas2-radio-plan.md).
   Round 3 (Yoni 2026-10-23: "ditch the zoom"): the radio stands on the station's bench in the scene and IS the player.
   Dial = 4 stations, keys PLAY/STOP | ORIGINAL | GAS 2 (the A/B: same spot in the song, 30 ms crossfade,
   level-matched renders), left knob = volume, right knob = tuning. The caption under the bench says what's on air.
   Keys while the radio has focus: A / B or arrows left-right = the keys, 1-4 / arrows up-down = stations, Space =
   play / stop. */
(() => {
  const BASE = new URL('.', document.currentScript.src).href;
  // the renders: <id>_before / <id>_after, sample-aligned, level-matched (player/tools/prep_audio.py).
  // PLACEHOLDER until Yoni's renders exist: the GAS mixer loops (-17 LUFS both sides).
  const PH = { a: 'audio/placeholder_before.m4a', b: 'audio/placeholder_after.m4a', gas: null };
  const STATIONS = [
    { id: 'hiphop', name: 'HIP HOP', a: 'audio/hiphop_before.m4a', b: 'audio/hiphop_after.m4a', gas: { grade: 'PREMIUM', amount: 140 } },   // Yoni's renders 2026-10-23
    { id: 'pop', name: 'POP', a: 'audio/pop_before.m4a', b: 'audio/pop_after.m4a', gas: null },   // Yoni's renders 2026-10-23
    { id: 'electronic', name: 'ELECTRONIC', dial: 'ELEC.', ...PH },   // the dial prints ELEC. (Yoni 2026-10-23)
    { id: 'rock', name: 'ROCK', a: 'audio/rock_before.m4a', b: 'audio/rock_after.m4a', gas: null },   // Yoni's renders 2026-10-23   // 4 stations (Yoni 2026-10-23: hip hop, pop, electronic, rock)
  ];   // gas: { grade, amount } prints the mix's GAS 2 settings in the caption

  // ---------- the radio, standing on the bench ----------
  const scene = document.getElementById('scene');
  if (!scene) return;
  const dock = document.createElement('div');
  dock.className = 'rp-dock'; dock.id = 'rpDock';
  dock.setAttribute('role', 'group'); dock.setAttribute('aria-label', 'The GAS 2 radio: hear GAS 2 on and off');
  dock.innerHTML = `<div class="rp-body"><div class="rp-plate">
      <img class="rp-off" src="${BASE}img/radio-off.webp" alt="" draggable="false">
      <img class="rp-lit" src="${BASE}img/radio-lit.webp" alt="" draggable="false">
      <button type="button" class="rp-badge" aria-label="Play me"></button>
      <div class="rp-px rp-glass"><i class="rp-glow"></i><i class="rp-scale"></i><i class="rp-ptr"></i>
        <div class="rp-st">${STATIONS.map((s, i) => `<button type="button" data-st="${i}" aria-label="${s.name}">${s.dial || s.name}</button>`).join('')}</div></div>
      <div class="rp-px rp-well"></div>
      <button type="button" class="rp-key p" aria-label="Play / stop" aria-pressed="false"><span><svg viewBox="0 0 10 10"><path d="M1.5 .8 9 5 1.5 9.2z"/></svg><svg viewBox="0 0 10 10"><path d="M1.2 1.2h7.6v7.6H1.2z"/></svg></span></button>
      <button type="button" class="rp-key a" data-side="a" aria-pressed="true"><span>ORIGINAL</span></button>
      <button type="button" class="rp-key b" data-side="b" aria-pressed="false"><span>GAS 2</span></button>
      <div class="rp-knob rp-vol" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100"><b></b></div>
      <div class="rp-knob rp-tun" role="slider" tabindex="0" aria-label="Tuning" aria-valuemin="1" aria-valuemax="${STATIONS.length}"><b></b></div>
      <i class="rp-jewel"></i>
      <svg class="rp-arc" style="left:calc(345 * var(--u))" viewBox="-90 -90 180 180" aria-hidden="true"><path id="rpArc0" d="M -76 0 A 76 76 0 0 0 76 0" fill="none"/><text><textPath href="#rpArc0" startOffset="50%" text-anchor="middle">VOLUME</textPath></text></svg><svg class="rp-arc" style="left:calc(1013.5 * var(--u))" viewBox="-90 -90 180 180" aria-hidden="true"><path id="rpArc1" d="M -76 0 A 76 76 0 0 0 76 0" fill="none"/><text><textPath href="#rpArc1" startOffset="50%" text-anchor="middle">TUNING</textPath></text></svg>
    </div></div>`;
  const bench = document.createElement('img');   // the stool, a cut-out placed by radio.css (.rp-stool, --st-*)
  bench.className = 'rp-stool'; bench.src = BASE + 'img/stool.webp'; bench.alt = ''; bench.draggable = false;
  const noradio = document.createElement('img');   // the photo radio's spot without it (radio.css .rp-noradio)
  noradio.className = 'rp-noradio'; noradio.src = BASE + 'img/noradio.webp'; noradio.alt = ''; noradio.draggable = false;
  scene.appendChild(noradio); scene.appendChild(bench); scene.appendChild(dock);
  const q = s => dock.querySelector(s), qa = s => [...dock.querySelectorAll(s)];
  const plate = q('.rp-plate'), ptr = q('.rp-ptr');

  // the nameplate on the grille: "Play me", EMBROIDERED in the plate photo itself (Dan 2026-10-26: the SVG stitches "look like
  // CSS ... much more fine ... an asset ... glued together"; player/tools/gen_stitch.py). The words in the photo are a second
  // play key: an invisible button over them (radio.css .rp-badge)
  const badge = q('.rp-badge');
  const knobVol = q('.rp-knob.rp-vol'), knobTune = q('.rp-knob.rp-tun');

  // the knob strip: an angle -135..+135 picks one of 129 frames (12 x 11 grid)
  const knobAt = (el, deg) => {
    const f = Math.round((Math.max(-135, Math.min(135, deg)) + 135) / 270 * 128), b = el.firstChild;
    b.style.backgroundPosition = `${(f % 12) * 100 / 11}% ${Math.floor(f / 12) * 10}%`;
  };
  // the tuning knob glides to its detent (a short ease-out tween of the angle, frame by frame)
  let tuneA = -100, tuneRaf = 0;
  const tuneTo = deg => {
    cancelAnimationFrame(tuneRaf); const a0 = tuneA, t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - k, 3); tuneA = a0 + (deg - a0) * e; knobAt(knobTune, tuneA); if (k < 1) tuneRaf = requestAnimationFrame(step); };
    tuneRaf = requestAnimationFrame(step);
  };

  // ---------- state ----------
  let st = 0, side = 'a', playing = false, vol = .8;

  // ---------- the engine: both sides of a mix play in sync, the keys only move two gains ----------
  let ac, bus, master, gA, gB, srcs = [], cache = new Map(), token = 0;
  const ensure = () => {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.connect(ac.destination);
    bus = ac.createGain(); bus.connect(master);
    gA = ac.createGain(); gB = ac.createGain(); gA.connect(bus); gB.connect(bus);
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

  // ---------- what the eye reads (and #radioCap, now a visually hidden status, what a screen reader hears) ----------
  const sceneCap = document.getElementById('radioCap');
  if (sceneCap) sceneCap.setAttribute('aria-live', 'polite');
  const render = () => {
    const s = STATIONS[st], b = side === 'b';
    plate.classList.toggle('on', playing); plate.classList.toggle('b', playing && b);
    qa('.rp-key[data-side]').forEach(k => { const d = k.dataset.side === side; k.classList.toggle('down', d); k.setAttribute('aria-pressed', d); });
    const pk = q('.rp-key.p'); pk.classList.toggle('down', playing); pk.setAttribute('aria-pressed', playing);
    qa('[data-st]').forEach(x => x.classList.toggle('on', +x.dataset.st === st));
    ptr.style.left = (1.5 + 97 * (st + .5) / STATIONS.length) + '%';
    tuneTo(-100 + 200 * st / (STATIONS.length - 1)); knobTune.setAttribute('aria-valuenow', st + 1);
    const set = s.gas ? ` · ${s.gas.grade} ${s.gas.amount} %` : '';
    if (sceneCap) sceneCap.innerHTML = !playing ? '<span>Press <em>play</em> on the radio</span>'
      : `<span>On air: ${s.name}</span><span>${b ? `<em>GAS 2</em>${set}` : '<em>Original</em>'}</span>`;
  };

  // ---------- hands ----------
  qa('.rp-key[data-side]').forEach(k => k.addEventListener('click', () => setSide(k.dataset.side)));
  q('.rp-key.p').addEventListener('click', () => (playing ? stop() : play()));
  badge.addEventListener('click', () => (playing ? stop() : play()));
  qa('[data-st]').forEach(x => x.addEventListener('click', () => tune(+x.dataset.st)));
  // knobs: drag up / right = clockwise, 1:1; wheel and arrow keys too
  const knob = (el, onDelta) => {
    let y0 = null, acc = 0;
    el.addEventListener('pointerdown', e => { y0 = e.clientY - e.clientX; acc = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (y0 === null) return; const p = e.clientY - e.clientX, d = y0 - p; y0 = p; acc = onDelta(d, acc); });
    const up = () => { y0 = null; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); acc = onDelta(-e.deltaY / 2, acc); }, { passive: false });
    el.addEventListener('keydown', e => { const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); e.stopPropagation(); acc = onDelta(d * 40, 0); } });
  };
  knob(knobVol, (d, acc) => { setVol(vol + d / 220); return 0; });
  knob(knobTune, (d, acc) => { acc += d; if (Math.abs(acc) >= 40) { tune(st + Math.sign(acc)); return 0; } return acc; });   // detents
  // the radio's own keyboard, only while focus is on it (the page keeps Space for scrolling everywhere else)
  dock.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
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

  setVol(vol); render();

  // ---------- ?rbench: the placement panel (Yoni 2026-10-23: "a bench where I can control size + position of radio and
  // stool, each separate"). Sliders write the --rp-* / --st-* numbers on #scene (radio.css defaults); the browser keeps
  // them (this panel only); COPY = the numbers to paste back, so they become the page's defaults ----------
  if (new URLSearchParams(location.search).has('rbench')) {
    const KEY = 'gas2radio:place', cs = getComputedStyle(scene);
    const F = [['RADIO'], ['rp-rs', 'size', .7, 1.8, .01], ['rp-x', 'x', 3, 24, .05], ['rp-y', 'bottom', 38, 54, .05],
      ['STOOL'], ['st-x', 'x', 3, 24, .05], ['st-y', 'floor', 46, 58, .05], ['st-w', 'width', .5, 1.6, .01], ['st-h', 'height', .4, 1.4, .01]];
    const D = {}; F.forEach(f => f[1] && (D[f[0]] = parseFloat(cs.getPropertyValue('--' + f[0]))));
    let V = { ...D }; try { Object.assign(V, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
    const tp = document.createElement('div'); tp.className = 'rp-tp';
    tp.innerHTML = F.map(f => f[1] ? `<label>${f[1]}<input type="range" data-k="${f[0]}" min="${f[2]}" max="${f[3]}" step="${f[4]}"><output></output></label>` : `<h4>${f[0]}</h4>`).join('') +
      '<div class="row"><button data-a="snap" title="Put the radio on the stool top">Radio on stool</button></div>' +
      '<div class="row"><button data-a="reset">Reset</button><button data-a="copy">Copy</button></div><textarea readonly hidden rows="3"></textarea>';
    document.body.appendChild(tp);
    const apply = () => {
      for (const k in V) { scene.style.setProperty('--' + k, V[k]); const i = tp.querySelector(`[data-k="${k}"]`); i.value = V[k]; i.nextElementSibling.textContent = (+V[k]).toFixed(2); }
      try { localStorage.setItem(KEY, JSON.stringify(V)); } catch (e) {}
    };
    tp.addEventListener('input', e => { if (e.target.dataset.k) { V[e.target.dataset.k] = +e.target.value; apply(); } });
    tp.addEventListener('click', e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'reset') V = { ...D };
      if (a === 'snap') V['rp-y'] = +(V['st-y'] - 7.2917 * V['st-h'] * (796 - 695.3) / 112).toFixed(3);   // the slab top: frame y 695.3 of the 684..796 cut
      if (a === 'copy') { const t = JSON.stringify(Object.fromEntries(Object.entries(V).map(([k, v]) => [k, +(+v).toFixed(3)])));
        tp.querySelector('textarea').value = t; tp.querySelector('textarea').hidden = false; tp.querySelector('textarea').select();
        Promise.resolve().then(() => navigator.clipboard.writeText(t)).then(() => { e.target.textContent = 'Copied'; setTimeout(() => e.target.textContent = 'Copy', 1200); }, () => {}); }
      apply();
    });
    apply();
  }
  window.gas2Radio = { tune, setSide, play, stop, get state() { return { st, side, playing, vol, t: ac && ac.currentTime, gA: gA && gA.gain.value, gB: gB && gB.gain.value }; } };
})();
