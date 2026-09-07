/* Gauge bench panel. Drives every custom property behind the hero dial's two
   darkening circles, live, on the real page. See tools/gaugebench/integration.mjs
   for how it is mounted and why it exists.

   The AA readout is an ESTIMATE, and says so in the panel: it recomposites
   face -> tint -> needle -> hub -> glass -> veil into an offscreen canvas and
   scores the headline colour against it through a canvas-drawn glyph mask.
   That is close enough to steer by, but the authoritative number still comes
   from measuring the rendered page — the h1-vs-hub case is tight enough that
   a couple of percent matters. */
(() => {
  const KEY = 'gaugebench:v1';
  const med = document.querySelector('.hero-medallion');
  const dial = document.querySelector('.hero-dial-desktop');
  if (!med || !dial) return console.warn('gaugebench: no desktop medallion on this page.');

  /* Every knob, grouped the way you actually think about them. `p` is the
     custom property on .hero-medallion; `u` its unit. */
  const SPEC = [
    ['TINT — on the face, under the needle', [
      { p: '--tint', l: 'Strength', min: 0, max: 1, step: 0.01 },
      { p: '--tint-core', l: 'Core', min: 0, max: 90, step: 1, u: '%' },
      { p: '--tint-edge', l: 'Edge', min: 10, max: 130, step: 1, u: '%' },
      { p: '--tint-cx', l: 'Centre X', min: 20, max: 80, step: 0.5, u: '%' },
      { p: '--tint-cy', l: 'Centre Y', min: 20, max: 80, step: 0.5, u: '%' },
      { p: '--tint-a2', l: 'Falloff 1', min: 0, max: 1, step: 0.005 },
      { p: '--tint-a3', l: 'Falloff 2', min: 0, max: 1, step: 0.005 },
      { p: '--tint-a4', l: 'Falloff 3', min: 0, max: 1, step: 0.005 },
      { p: '--tint-a5', l: 'Falloff 4', min: 0, max: 1, step: 0.005 },
      { p: '--tint-r', l: 'Red', min: 0, max: 255, step: 1 },
      { p: '--tint-g', l: 'Green', min: 0, max: 255, step: 1 },
      { p: '--tint-b', l: 'Blue', min: 0, max: 255, step: 1 },
    ]],
    ['VEIL — over everything, needle included', [
      { p: '--veil', l: 'Strength', min: 0, max: 1, step: 0.01 },
      { p: '--veil-core', l: 'Core', min: 0, max: 90, step: 1, u: '%' },
      { p: '--veil-edge', l: 'Edge', min: 10, max: 130, step: 1, u: '%' },
      { p: '--veil-size', l: 'Size', min: 0.4, max: 1.6, step: 0.01 },
      { p: '--veil-cx', l: 'Centre X', min: 20, max: 80, step: 0.5, u: '%' },
      { p: '--veil-cy', l: 'Centre Y', min: 20, max: 80, step: 0.5, u: '%' },
      { p: '--veil-a2', l: 'Falloff 1', min: 0, max: 1, step: 0.005 },
      { p: '--veil-a3', l: 'Falloff 2', min: 0, max: 1, step: 0.005 },
      { p: '--veil-a4', l: 'Falloff 3', min: 0, max: 1, step: 0.005 },
      { p: '--veil-a5', l: 'Falloff 4', min: 0, max: 1, step: 0.005 },
      { p: '--veil-r', l: 'Red', min: 0, max: 255, step: 1 },
      { p: '--veil-g', l: 'Green', min: 0, max: 255, step: 1 },
      { p: '--veil-b', l: 'Blue', min: 0, max: 255, step: 1 },
    ]],
    ['MEDALLION', [
      { p: '--medallion-op', l: 'Opacity', min: 0.3, max: 1, step: 0.01, style: 'opacity' },
      { p: '--medallion', l: 'Size', min: 300, max: 900, step: 4, u: 'px' },
    ]],
  ];
  const KNOBS = SPEC.flatMap(([, ks]) => ks);

  /* Source truth: read before anything is overridden, so RESET and the COPY
     block are both diffed against committed CSS rather than against whatever
     the last session left in localStorage. */
  const cs = getComputedStyle(med);
  const DEF = {};
  for (const k of KNOBS) {
    DEF[k.p] = k.style === 'opacity' ? parseFloat(cs.opacity) : parseFloat(cs.getPropertyValue(k.p));
    if (!Number.isFinite(DEF[k.p])) DEF[k.p] = k.min;
  }
  /* --medallion is declared as a clamp(), and an unregistered custom property
     computes to its token stream, not to a length — parseFloat sees NaN. Take
     the size the dial actually rendered at instead. */
  DEF['--medallion'] = Math.round(dial.getBoundingClientRect().width);

  let val = { ...DEF };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) val = { ...val, ...saved };
  } catch (e) {}

  const fmt = (k) => (k.u === 'px' ? Math.round(val[k.p]) + 'px' : val[k.p] + (k.u || ''));

  /* Only knobs that actually moved get written, so an untouched bench leaves
     the page byte-identical to committed source and nothing here can silently
     override a value the bench failed to read correctly. */
  function apply() {
    for (const k of KNOBS) {
      const moved = val[k.p] !== DEF[k.p];
      if (k.style === 'opacity') med.style.opacity = moved ? val[k.p] : '';
      else if (moved) med.style.setProperty(k.p, fmt(k));
      else med.style.removeProperty(k.p);
    }
    try { localStorage.setItem(KEY, JSON.stringify(val)); } catch (e) {}
    schedule();
  }

  /* ── AA estimate ─────────────────────────────────────────────────────── */
  /* Recomposite at the dial's own rendered size. At half resolution the hub's
     specular bled into the glyph mask and the estimate came back ~1.2 low —
     conservative, but low enough to read as a failure at values that measure
     fine. */
  let N = 0;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const mk = document.createElement('canvas');
  const mctx = mk.getContext('2d', { willReadFrequently: true });

  const lin = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const rl = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  /* One layer's stops, in the same shape the CSS builds them: peak at 0, the
     core stop, three between core and edge on the shared 0.34/0.63/0.87 ratio
     family, then zero at the edge. */
  function addStops(g, pre) {
    const a = val[`${pre}`], core = val[`${pre}-core`], edge = val[`${pre}-edge`];
    const col = (m) => `rgba(${val[`${pre}-r`]},${val[`${pre}-g`]},${val[`${pre}-b`]},${a * m})`;
    const at = (f) => Math.min(1, Math.max(0, (core + (edge - core) * f) / 100));
    g.addColorStop(0, col(1));
    g.addColorStop(Math.min(1, core / 100), col(val[`${pre}-a2`]));
    g.addColorStop(at(0.34), col(val[`${pre}-a3`]));
    g.addColorStop(at(0.63), col(val[`${pre}-a4`]));
    g.addColorStop(at(0.87), col(val[`${pre}-a5`]));
    g.addColorStop(Math.min(1, edge / 100), col(0));
    return g;
  }

  /* A zero-size inline-block sits ON the baseline, so its bottom minus the
     text span's top is the ascent the browser is actually laying out with. */
  let LM = null;
  function layoutAscentDescent(cs) {
    if (LM && LM.key === cs.font) return LM;
    const box = document.createElement('div');
    box.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;line-height:normal';
    const t = document.createElement('span');
    t.style.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    t.textContent = 'Hg';
    const strut = document.createElement('span');
    strut.style.cssText = 'display:inline-block;width:0;height:0';
    box.append(t, strut);
    document.body.appendChild(box);
    const tr = t.getBoundingClientRect(), sr = strut.getBoundingClientRect();
    LM = { key: cs.font, A: sr.bottom - tr.top, D: tr.bottom - sr.bottom };
    box.remove();
    return LM;
  }

  function angleOf(el) {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return Math.atan2(m.b, m.a);
  }

  function estimate() {
    const face = dial.querySelector('img.g-face');
    const nWrap = dial.querySelector('.g-needle');
    const nImg = nWrap && nWrap.querySelector('img');
    const hub = dial.querySelector('img.g-hub');
    const h1 = document.querySelector('.hh-h1');
    if (!face || !face.complete || !nImg || !nImg.complete || !hub || !hub.complete || !h1) return null;

    const dr = dial.getBoundingClientRect();
    const want = Math.min(800, Math.round(dr.width));
    if (want !== N) { N = want; cv.width = cv.height = mk.width = mk.height = N; }
    const K = N / dr.width;

    ctx.clearRect(0, 0, N, N);
    ctx.save();
    ctx.beginPath();
    ctx.arc(N / 2, N / 2, N / 2, 0, 7);
    ctx.clip();
    ctx.drawImage(face, 0, 0, N, N);

    // tint — between the face and the needle, exactly as .hero-dial-desktop::before sits
    const R = Math.SQRT1_2 * N; // CSS `circle` default is farthest-corner
    ctx.fillStyle = addStops(
      ctx.createRadialGradient(N * val['--tint-cx'] / 100, N * val['--tint-cy'] / 100, 0,
        N * val['--tint-cx'] / 100, N * val['--tint-cy'] / 100, R), '--tint');
    ctx.fillRect(0, 0, N, N);

    // needle, rotated about its own transform-origin, then the hub
    const to = getComputedStyle(nWrap).transformOrigin.split(' ').map(parseFloat);
    ctx.save();
    ctx.translate((nWrap.offsetLeft + to[0]) * K, (nWrap.offsetTop + to[1]) * K);
    ctx.rotate(angleOf(nWrap));
    ctx.drawImage(nImg, -to[0] * K, -to[1] * K, nWrap.offsetWidth * K, nWrap.offsetHeight * K);
    ctx.restore();
    ctx.drawImage(hub, hub.offsetLeft * K, hub.offsetTop * K, hub.offsetWidth * K, hub.offsetHeight * K);

    // .g-glass — screened highlight. It LIGHTENS, so leaving it out would
    // flatter the score; ellipse 58% 42% at 34% 24%, per index.astro.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(0.34 * N, 0.24 * N);
    ctx.scale(1, 0.42 / 0.58);
    const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.58 * N);
    gg.addColorStop(0, 'rgba(255,250,235,0.11)');
    gg.addColorStop(0.45, 'rgba(255,250,235,0.035)');
    gg.addColorStop(0.7, 'rgba(255,250,235,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(-N, -N, 2 * N, 2 * N);
    ctx.restore();
    ctx.restore();

    // veil — its own box, --veil-size of the medallion, concentric with the dial
    const vs = val['--veil-size'];
    const vR = Math.SQRT1_2 * N * vs;
    const vx = N / 2 + (val['--veil-cx'] - 50) / 100 * N * vs;
    const vy = N / 2 + (val['--veil-cy'] - 50) / 100 * N * vs;
    ctx.fillStyle = addStops(ctx.createRadialGradient(vx, vy, 0, vx, vy, vR), '--veil');
    ctx.fillRect(0, 0, N, N);

    // the medallion's own opacity, over the wall behind it (near-black there)
    const op = val['--medallion-op'];

    // glyph mask: the headline lines, drawn with the page's own font metrics
    const h1cs = getComputedStyle(h1);
    const fs = parseFloat(h1cs.fontSize);
    const lh = parseFloat(h1cs.lineHeight) || fs;
    mctx.clearRect(0, 0, N, N);
    mctx.fillStyle = '#fff';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'alphabetic';
    mctx.font = `${h1cs.fontWeight} ${fs * K}px ${h1cs.fontFamily}`;
    try { mctx.letterSpacing = h1cs.letterSpacing; } catch (e) {}
    /* Where the baseline actually sits. Canvas's own fontBoundingBox metrics
       do not agree with the ones the browser lays CSS out with — using them
       put the mask 4px high (onto the hub's rim) and (line-height - font-size)
       / 2 put it 5px low (off the top row of caps, which is the row that
       actually grazes the hub). So measure the layout ascent/descent from the
       DOM with a baseline strut, and the mask lands where the glyphs do. */
    const { A, D } = layoutAscentDescent(h1cs);
    for (const line of h1.querySelectorAll('.hh-h1-line')) {
      const r = line.getBoundingClientRect();
      mctx.fillText(line.textContent.trim(),
        (r.left + r.width / 2 - dr.left) * K,
        ((r.top - dr.top) + (lh - (A + D)) / 2 + A) * K);
    }

    const fg = h1cs.color.match(/[\d.]+/g).map(Number);
    const Lfg = rl(fg[0], fg[1], fg[2]);
    const px = ctx.getImageData(0, 0, N, N).data;
    const mp = mctx.getImageData(0, 0, N, N).data;
    let worst = Infinity, bad = 0, tot = 0, wx = 0, wy = 0;
    for (let i = 0; i < mp.length; i += 4) {
      /* Glyph interiors only. Opaque is not enough — a fully-covered pixel one
         step from the edge still has an antialiased neighbour whose background
         is outside the letter, which is exactly where the hub's bright rim
         sits. Require the 4-neighbourhood to be solid too. */
      if (mp[i + 3] < 250) continue;
      const q = i / 4, qx = q % N;
      if (qx === 0 || qx === N - 1 || q < N || q >= N * (N - 1)) continue;
      if (mp[i - 4 + 3] < 250 || mp[i + 4 + 3] < 250 ||
          mp[i - N * 4 + 3] < 250 || mp[i + N * 4 + 3] < 250) continue;
      const bgc = [0, 1, 2].map((c) => px[i + c] * op + 12 * (1 - op));
      const r = ratio(Lfg, rl(bgc[0], bgc[1], bgc[2]));
      tot++;
      if (r < 4.5) bad++;
      if (r < worst) { worst = r; wx = (i / 4) % N; wy = Math.floor(i / 4 / N); }
    }
    return tot ? { worst, pct: (bad / tot) * 100, wx, wy } : null;
  }

  /* ── panel ───────────────────────────────────────────────────────────── */
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:auto 12px 12px auto;z-index:2147483000';
  const sh = host.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>
    :host{all:initial}
    *{box-sizing:border-box;font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .p{width:340px;max-height:88vh;overflow:auto;background:#16130f;border:1px solid #3a3227;
       border-radius:8px;color:#e9e2d4;box-shadow:0 18px 50px rgba(0,0,0,.6)}
    header{position:sticky;top:0;background:#16130f;border-bottom:1px solid #3a3227;padding:9px 12px;
           display:flex;align-items:center;gap:8px;z-index:2}
    h1{margin:0;font:700 10px/1 sans-serif;letter-spacing:.22em;color:#c9a35c;text-transform:uppercase}
    .aa{margin-left:auto;font:11px/1 ui-monospace,Menlo,monospace;padding:3px 7px;border-radius:4px}
    .ok{background:rgba(90,150,90,.18);color:#9ed49e}
    .no{background:rgba(224,68,43,.18);color:#f0947f}
    .sect{padding:9px 12px 3px;font:700 9.5px/1 sans-serif;letter-spacing:.18em;color:#c9a35c;
          text-transform:uppercase;border-top:1px solid #29231b;margin-top:4px}
    .row{display:flex;align-items:center;gap:7px;padding:2px 12px}
    .row label{width:64px;flex:none;font-size:10.5px;color:#9b9082}
    .row input[type=range]{flex:1;min-width:0;accent-color:#c9a35c;height:16px}
    .row input[type=number]{width:56px;flex:none;background:#0d0b08;border:1px solid #3a3227;
      color:#e9e2d4;border-radius:3px;padding:2px 4px;font:11px/1.3 ui-monospace,Menlo,monospace}
    .row.moved label{color:#c9a35c}
    footer{position:sticky;bottom:0;background:#16130f;border-top:1px solid #3a3227;padding:9px 12px;
           display:flex;gap:6px;flex-wrap:wrap}
    button{flex:1;background:#221d16;border:1px solid #3a3227;color:#e9e2d4;border-radius:4px;
           padding:6px 8px;cursor:pointer;font-size:11px}
    button:hover{border-color:#c9a35c}
    button.go{background:#c9a35c;color:#140d05;border-color:#c9a35c;font-weight:700}
    .pre{padding:0 12px 10px;display:flex;gap:6px}
    .note{padding:0 12px 9px;color:#7d7263;font-size:10.5px}
    textarea{width:100%;height:150px;background:#0d0b08;border:1px solid #3a3227;color:#e9e2d4;
      border-radius:4px;padding:8px;font:10.5px/1.5 ui-monospace,Menlo,monospace;margin:0 0 8px}
  </style>
  <div class="p">
    <header><h1>Gauge circles</h1><span class="aa" id="aa">…</span></header>
    <div class="pre">
      <button data-pre="light">Lighter</button>
      <button data-pre="src">Source</button>
      <button data-pre="dark">Darker</button>
      <button data-pre="max">Much darker</button>
    </div>
    <div id="body"></div>
    <div class="note">AA figure is a live estimate of the headline against the
      recomposited dial. Hand the block back and it gets measured for real.</div>
    <footer>
      <button id="copy" class="go">Copy CSS</button>
      <button id="reset">Reset</button>
      <button id="hide">Hide</button>
    </footer>
  </div>`;

  const body = sh.getElementById('body');
  const rows = {};
  for (const [title, ks] of SPEC) {
    const h = document.createElement('div');
    h.className = 'sect';
    h.textContent = title;
    body.appendChild(h);
    for (const k of ks) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<label>${k.l}</label>
        <input type="range" min="${k.min}" max="${k.max}" step="${k.step}">
        <input type="number" min="${k.min}" max="${k.max}" step="${k.step}">`;
      const [rng, num] = row.querySelectorAll('input');
      const set = (v) => {
        val[k.p] = Math.min(k.max, Math.max(k.min, Number(v)));
        rng.value = num.value = val[k.p];
        row.classList.toggle('moved', val[k.p] !== DEF[k.p]);
        apply();
      };
      rng.addEventListener('input', () => set(rng.value));
      num.addEventListener('input', () => set(num.value));
      rows[k.p] = set;
      body.appendChild(row);
    }
  }

  /* Presets scale the two strengths and pull the tint's edge out with them —
     "more dark" is nearly always both, and doing one alone just makes a
     harder ring. */
  const PRE = { light: [0.8, 0.7, -4], src: [1, 1, 0], dark: [1.15, 1.35, 4], max: [1.3, 1.9, 9] };
  sh.querySelectorAll('[data-pre]').forEach((b) =>
    b.addEventListener('click', () => {
      const [t, v, e] = PRE[b.dataset.pre];
      for (const k of KNOBS) rows[k.p](DEF[k.p]);
      rows['--tint'](Math.min(1, DEF['--tint'] * t));
      rows['--veil'](Math.min(1, DEF['--veil'] * v));
      rows['--tint-edge'](DEF['--tint-edge'] + e);
      rows['--veil-edge'](DEF['--veil-edge'] + e);
    })
  );

  sh.getElementById('reset').addEventListener('click', () => {
    for (const k of KNOBS) rows[k.p](DEF[k.p]);
  });
  sh.getElementById('hide').addEventListener('click', () => {
    sh.querySelector('.p').style.display = 'none';
    setTimeout(() => (sh.querySelector('.p').style.display = ''), 2500);
  });

  sh.getElementById('copy').addEventListener('click', () => {
    const lines = KNOBS.filter((k) => !k.style && k.p !== '--medallion')
      .map((k) => `    ${k.p}: ${fmt(k)};`);
    const op = val['--medallion-op'];
    const css = `  .hero-medallion {\n${lines.join('\n')}\n  }\n` +
      (op !== DEF['--medallion-op'] ? `  /* .hero-medallion opacity: ${op}; */\n` : '') +
      (val['--medallion'] !== DEF['--medallion'] ? `  /* --medallion: ${Math.round(val['--medallion'])}px on .hero-feat */\n` : '');
    const ta = document.createElement('textarea');
    ta.value = css;
    sh.querySelector('.pre').after(ta);
    ta.select();
    navigator.clipboard.writeText(css).catch(() => {});
    setTimeout(() => ta.remove(), 30000);
  });

  let raf = 0;
  function schedule() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = estimate();
      const el = sh.getElementById('aa');
      if (!r) { el.textContent = '…'; el.className = 'aa'; return; }
      el.textContent = `h1 ${r.worst.toFixed(2)}:1 · ${r.pct.toFixed(1)}% under`;
      el.className = 'aa ' + (r.worst >= 4.5 ? 'ok' : 'no');
    });
  }

  /* Debug hook: the estimate is the one part of this panel that can be wrong
     without looking wrong, so keep a way to eyeball the recomposite and the
     glyph mask it scores through. */
  window.__gauge = { cv, mk, val, DEF, estimate };

  document.body.appendChild(host);
  for (const k of KNOBS) rows[k.p](val[k.p]);
  addEventListener('resize', schedule);
  document.fonts && document.fonts.ready.then(schedule);
  console.log('gaugebench: ready. ?gauge=reset clears saved knobs.');
})();
