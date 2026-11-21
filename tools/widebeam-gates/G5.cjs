// G5 Demo (plan §4 G5). Non-timing: a preset glide never leaves the knob ranges (values AND the LCD text); "Take it for a drive" lands
// the face >= 95 % visible, the lamps ignite after landing, nothing moves after it; two movers (a preset glide, then a chapter link /
// the wheel) end where the second one put the page; the A/B is level-matched within 1 dB; no clip and a peak <= -0.3 dBFS at the worst setting.
// --timing: the face is >= 95 % visible within 1.5 s of the click (stage 4, a quiet machine).
//   node G5.cjs <base> [--engines chromium,webkit] [--sizes L1141,L1280,L1440,P390] [--timing]
const G = require('./Glib.cjs');
const GATE = 'G5';
const RANGES = { Width: [0, 200], 'Low focus': [20, 1000], Mix: [0, 100], Reach: [0, 100], Tilt: [-100, 100] };

// The audio clock does not run in this sandbox's headless browsers (AudioContext.currentTime stays ~0), so the level checks render the page's OWN
// engine (src/lib/widebeam/audio.ts, imported from the dev server) offline: the demo loop is scheduled up front on an OfflineAudioContext.
// The master / limiter inside WideBeamEngine is included; anything a page module wires outside the engine is not (dev server only).
const RENDER = async ({ params, secs }) => {
  const mod = await import('/src/lib/widebeam/audio.ts');
  const sr = 48000; const off = new OfflineAudioContext(2, sr * secs, sr);
  let fakeT = 0; Object.defineProperty(off, 'currentTime', { get: () => fakeT });
  const realAC = window.AudioContext, realSI = window.setInterval; let tickFn = null;
  window.AudioContext = function () { return off; }; window.setInterval = (fn) => { tickFn = fn; return 1; };
  let e;
  try { e = new mod.WideBeamEngine(); e.set({ ...mod.DEFAULTS, ...params }); e.playDemo(); while (fakeT < secs) { fakeT += 0.5; if (tickFn) tickFn(); } fakeT = 0; }
  finally { window.AudioContext = realAC; window.setInterval = realSI; }
  const buf = await off.startRendering(); let peak = 0, ss = 0, n = 0, clip = 0;
  const from = Math.floor(sr * 0.5);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = from; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; if (v >= 0.9995) clip++; ss += d[i] * d[i]; n++; } }
  return { peak, rms: Math.sqrt(ss / n), clip, n };
};
const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const fresh = async (engine, size, opts = {}) => {
  const b = await G.launch(engine); const { ctx, page } = await G.page(b, engine, size);
  await G.goto(page, G.BASE, '/widebeam', 2200); await page.keyboard.press('Escape').catch(() => {}); await G.hideCookie(page);
  return { b, ctx, page };
};

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G5.cjs <base>');
  const sizes = G.sizesOr(['L1141', 'L1280', 'L1440', 'P390']);
  for (const engine of G.ARGS.engines) {
    const T = `[${engine}]`;
    // ---------- 1. the preset glide stays inside the ranges, knobs and LCD ----------
    if (!G.ARGS.timing) await G.step(GATE, `preset glide stays in range (knobs + LCD) ${T}`, async () => {
      const { b, ctx, page } = await fresh(engine, 'L1141');
      try {
        if (!(await G.has(page, '[data-preset="3"]'))) return G.missing(GATE, `preset glide stays in range (knobs + LCD) ${T}`, 'no [data-preset] cards');
        await page.evaluate(() => {
          window.__rec = []; window.__lcd = [];
          const watch = (el) => new MutationObserver(() => window.__rec.push([el.getAttribute('aria-label'), +el.getAttribute('aria-valuenow')])).observe(el, { attributes: true, attributeFilter: ['aria-valuenow'] });
          document.querySelectorAll('[role=slider]').forEach(watch);
          const face = document.querySelector('[data-wb-face]');
          new MutationObserver(() => face.querySelectorAll('.wb-lcd').forEach((l) => window.__lcd.push(l.textContent))).observe(face, { childList: true, characterData: true, subtree: true });
        });
        for (const i of [3, 11, 3, 13, 0, 12, 2, 10, 11, 0]) { await page.evaluate((i) => document.querySelector(`[data-preset="${i}"]`).click(), i); await G.sleep(1900); }
        const { rec, lcd } = await page.evaluate(() => ({ rec: window.__rec, lcd: [...new Set(window.__lcd)] }));
        const bad = [];
        for (const [label, [lo, hi]] of Object.entries(RANGES)) { const v = rec.filter((r) => r[0] === label).map((r) => r[1]); if (!v.length) continue; const mn = Math.min(...v), mx = Math.max(...v); if (mn < lo || mx > hi) bad.push(`${label} ${mn}..${mx} (range ${lo}..${hi})`); }
        const lcdBad = []; for (const t of lcd) { const m = (re, lo, hi) => { const x = t.match(re); return x && (+x[1] < lo || +x[1] > hi); }; if (m(/WIDTH\s*(-?\d+)/i, 0, 200) || m(/FOCUS\s*(-?\d+)/i, 20, 1000) || m(/MIX\s*(-?\d+)/i, 0, 100) || m(/REACH\s*(-?\d+)/i, 0, 100)) lcdBad.push(t.trim()); }
        if (lcdBad.length) bad.push('LCD shows ' + [...new Set(lcdBad)].slice(0, 4).join(' / '));
        G.ok(GATE, `preset glide stays in range (knobs + LCD) ${T}`, bad.length === 0 && rec.length > 0, bad.length ? bad.join('; ') : `${rec.length} knob updates over 10 preset loads, ${lcd.length} LCD texts: all in range`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // ---------- 2. "Take it for a drive": lands the face, lamps after landing, still after ----------
    for (const size of sizes) {
      if (engine === 'firefox' && G.isTouchSize(size)) continue;
      const name = `"Take it for a drive" lands the face ${G.ARGS.timing ? 'within 1.5 s' : '(settles <= 4 s)'} [${engine} ${size}]`;
      await G.step(GATE, name, async () => {
        const { b, ctx, page } = await fresh(engine, size);
        try {
          const touch = G.isTouchSize(size);
          if (!(await G.has(page, '[data-wb-start]'))) return G.missing(GATE, name, 'no [data-wb-start] hero key');
          await page.evaluate(() => {
            window.__s = []; const f = document.querySelector('[data-wb-face]'); const lamp = document.querySelector('[data-exp="lamp"]');
            const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
            window.__t0 = performance.now();
            // n30 (stage 4): the drive's own destination (drive-to.ts announces it on 'wb:drive'); on a phone in deck mode
            // the face is fully in view before the single glide ends, so 95 % visible alone fired mid-glide
            window.__dest = null; addEventListener('wb:drive', (e) => { if (e.detail && e.detail.phase === 'start') window.__dest = e.detail.dest; });
            window.__iv = setInterval(() => { const r = f.getBoundingClientRect(); const vis = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(nav, r.top)) / r.height; window.__s.push([Math.round(performance.now() - window.__t0), Math.round(scrollY), +r.top.toFixed(1), +vis.toFixed(3), lamp ? +lamp.getAttribute('slope') : null]); }, 40);
          });
          const r = await G.rect(page, '[data-wb-start]');
          await page.evaluate(() => { window.__t0 = performance.now(); window.__s.length = 0; });
          if (touch) await page.touchscreen.tap(r.cx, r.cy); else await page.mouse.click(r.cx, r.cy);
          await G.sleep(4600);
          const s = await page.evaluate(() => { clearInterval(window.__iv); return window.__s; });
          const dest = await page.evaluate(() => window.__dest);
          // landed = the face >= 95 % visible AND the page within 2 px of the drive's destination (when it announced one)
          const arrive = s.find((x) => x[3] >= 0.95 && (dest == null || Math.abs(x[1] - dest) <= 2));
          const limit = G.ARGS.timing ? 1500 : 4000;
          const maxVis = Math.max(...s.map((x) => x[3]));
          if (!arrive) return G.ok(GATE, name, false, `the face never reached 95 % visible at the destination (best ${(maxVis * 100).toFixed(0)} %, final face top ${s[s.length - 1][2]} px, scrollY ${s[s.length - 1][1]}, destination ${dest})`);
          const probs = [];
          if (arrive[0] > limit) probs.push(`landed at ${arrive[0]} ms (> ${limit})`);
          const later = s.filter((x) => x[0] >= arrive[0] + 300 && x[0] <= arrive[0] + 1500);
          if (later.length > 5) { const dy = Math.max(...later.map((x) => x[1])) - Math.min(...later.map((x) => x[1])); const dt = Math.max(...later.map((x) => x[2])) - Math.min(...later.map((x) => x[2])); if (dy > 1 || dt > 1.5) probs.push(`still moving after landing: scroll ${dy} px, face top ${dt.toFixed(1)} px`); }
          const lit0 = s[0][4], ign = s.find((x) => x[4] != null && x[4] > 0.5);
          if (s[0][4] == null) probs.push('no lamp filter found');
          else if (lit0 > 0.5) probs.push(`lamps already lit (slope ${lit0}) before the face landed`);
          else if (!ign) probs.push('lamps never ignited');
          else if (ign[0] < arrive[0] - 100) probs.push(`lamps ignited at ${ign[0]} ms, before landing at ${arrive[0]} ms`);
          G.ok(GATE, name, probs.length === 0, probs.length ? probs.join('; ') : `landed ${arrive[0]} ms at scrollY ${arrive[1]} (destination ${dest}), face top ${arrive[2]} px, ${(arrive[3] * 100).toFixed(0)} % visible; lamps ignite ${ign ? ign[0] : '?'} ms; still after`);
          await ctx.close();
        } finally { await b.close(); }
      });
    }
    if (G.ARGS.timing) continue;

    // ---------- 3. two movers: a preset glide, then a chapter link / the wheel ----------
    for (const mode of ['link', 'wheel']) {
      const name = `takeover: ${mode} during a preset glide ends where the second mover put the page ${T}`;
      await G.step(GATE, name, async () => {
        const { b, ctx, page } = await fresh(engine, 'L1141');
        try {
          if (!(await G.has(page, '[data-preset="9"]'))) return G.missing(GATE, name, 'no preset cards');
          let used = '';
          const inject = () => page.evaluate(() => {
              // stage 4: the chapter for #wb-step-05 (the first chapter link is step 01, and the target below is step 05's)
              let a = document.querySelector('[data-wb-manual] a[href="#wb-step-05"]') || document.querySelector('[data-wb-manual] a[href^="#wb-step-"]'); let how = 'the real chapter link';
              if (!a) { const man = document.querySelector('[data-wb-manual]') || document.body; a = document.createElement('a'); a.href = '#wb-step-05'; a.textContent = 'stand-in chapter'; a.style.cssText = 'display:inline-block;padding:12px;position:relative;z-index:9'; man.appendChild(a); how = 'a stand-in <a href="#wb-step-05"> (no chapter links on this page yet)'; }
              a.id = 'gate-link'; return how;
            });
          if (mode === 'link') used = await inject();
          await G.bring(page, '[data-preset="9"]', false, 0.5); await G.sleep(600);
          const y0 = await G.scrollY(page);
          const card = await G.rect(page, '[data-preset="9"]');
          await page.mouse.click(card.cx, card.cy); await G.sleep(180);
          let target;
          if (mode === 'link') {
            // the link may be off screen: a keyboard / programmatic activation is the second mover; use a real click when it is on screen
            // the link's own target: the step its href names; a chapter lands on the step's [data-step-mark] (lane S: the middle of
            // the step's lit range), so that is where the second mover puts the page when the step has one
            target = await page.evaluate(() => { const a = document.getElementById('gate-link'); const t = a && document.getElementById(decodeURIComponent(a.hash.slice(1))); const m = t && (t.querySelector('[data-step-mark]') || t); const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44; return m ? Math.round(m.getBoundingClientRect().top + scrollY - nav) : null; });
            if (!(await G.has(page, '#gate-link'))) await inject(); await page.evaluate(() => document.getElementById('gate-link').click());
          } else { await page.mouse.move(600, 300); await page.mouse.wheel(0, 900); }
          const samples = []; for (let i = 0; i < 40; i++) { await G.sleep(100); samples.push(await G.scrollY(page)); }
          const last = samples.slice(-12); const spread = Math.max(...last) - Math.min(...last); const fin = samples[samples.length - 1];
          const dashY = await page.evaluate(() => { const d = document.querySelector('[data-wb-dash]') || document.querySelector('[data-wb-face]'); const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44; return Math.round(d.getBoundingClientRect().top + scrollY - nav - Math.max(0, (innerHeight - nav - d.offsetHeight) / 2)); });
          const probs = [];
          if (spread > 2) probs.push(`still moving at the end (spread ${spread} px over the last 1.2 s)`);
          if (mode === 'link') { if (target == null) probs.push("the chapter link's target is missing"); else if (Math.abs(fin - target) > 140) probs.push(`ended at ${fin}, the link's target is ${target} (the glide's dash target ${dashY})`); }
          else if (fin < y0 + 300) probs.push(`the wheel (+900 px) lost: ended at ${fin} from ${y0}, pulled back to the dash target ${dashY}`);
          G.ok(GATE, name, probs.length === 0, probs.length ? probs.join('; ') : `${used ? used + ': ' : ''}start ${y0}, ended ${fin}${target != null ? ', link target ' + target : ''}, settled (spread ${spread})`);
          await ctx.close();
        } finally { await b.close(); }
      });
    }

    // ---------- 4. level and clip (offline render of the page's own engine) ----------
    if (engine !== 'firefox') await G.step(GATE, `A/B level-matched within 1 dB, and no clip at the worst setting ${T}`, async () => {
      const name = `A/B level-matched within 1 dB, and no clip at the worst setting ${T}`;
      const { b, ctx, page } = await fresh(engine, 'L1141');
      try {
        const run = (params, secs = 11) => page.evaluate(RENDER, { params, secs });
        let on0;
        try { on0 = await run({}); } catch (e) { return G.skip(GATE, name, 'needs the dev server (imports /src/lib/widebeam/audio.ts): ' + String(e.message).split('\n')[0]); }
        const probs = [], info = [];
        for (const [label, p, infoOnly] of [['default (WIDTH 136)', {}], ['WIDTH 170, FOCUS 350', { width: 170, focus: 350 }], ['WIDTH 60, MIX 35', { width: 60, mix: 35 }], ['WIDTH 200 (info: CRUISE trims -2 dB there by design)', { width: 200, focus: 600 }, true]]) {
          const on = await run({ ...p, power: true }), off = await run({ ...p, power: false });
          const d = db(on.rms) - db(off.rms); info.push(`${label}: ON ${db(on.rms).toFixed(1)} / OFF ${db(off.rms).toFixed(1)} dBFS (${d >= 0 ? '+' : ''}${d.toFixed(2)} dB)`);
          if (!infoOnly && (!(on.n > 1000) || !isFinite(d) || Math.abs(d) > 1)) probs.push(`${label}: A/B differ by ${isFinite(d) ? d.toFixed(2) : 'n/a'} dB`);
        }
        for (const [label, p] of [['WIDTH 200 + TILT -100 + HIGH BEAM', { width: 200, tilt: -100, high: true }], ['the same with REACH 100', { width: 200, tilt: -100, high: true, reach: 100 }]]) {
          const w = await run(p); const pk = db(w.peak); info.push(`${label}: peak ${pk.toFixed(1)} dBFS`);
          if (w.clip > 0) probs.push(`${label}: ${w.clip} clipped samples`);
          if (pk > -0.3) probs.push(`${label}: peak ${pk.toFixed(1)} dBFS (limit -0.3)`);
        }
        G.ok(GATE, name, probs.length === 0, (probs.length ? probs.join('; ') + ' | ' : '') + info.join(' | '));
        await ctx.close();
      } finally { await b.close(); }
    });
  }
});
