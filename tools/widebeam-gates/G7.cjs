// G7 No-JS and reduced motion (plan §4 G7). No JavaScript: 0 reveal blocks at opacity 0, the hero title visible (the CSS failsafe, by ~9 s), the
// real odometer numbers in the HTML (raw and rendered). Reduced motion: an identical story-canvas hash over 1 s at rest, no HIGH BEAM flash, no intro.
//   node G7.cjs <base> [--engines chromium,webkit] [--plant nojs-hide|odo0]
const G = require('./Glib.cjs');
const GATE = 'G7';

const hashOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G7.cjs <base>');
  // the raw HTML carries the real numbers (no JS involved)
  await G.step(GATE, 'odometer numbers are in the raw HTML', async () => {
    let html = (await G.fetchText(G.BASE + '/widebeam/')).body; if (G.ARGS.plant) html = G.plantText(G.ARGS.plant, G.BASE + '/widebeam/', html);
    const odos = [...html.matchAll(/<[^>]*data-odo="(\d+)"[^>]*>([^<]*)</g)].map((m) => [m[1], m[2].trim()]);
    if (!odos.length) return G.missing(GATE, 'odometer numbers are in the raw HTML', 'no [data-odo] element in the HTML');
    const wrong = odos.filter(([v, t]) => v !== t); const nonzero = odos.filter(([v]) => v !== '0').length;
    G.ok(GATE, 'odometer numbers are in the raw HTML', wrong.length === 0 && nonzero >= 3, `${odos.length} odometers: ${odos.map(([v, t]) => `${v}->"${t}"`).join(' ')}`);
  });

  for (const engine of G.ARGS.engines) {
    const T = `[${engine}]`;
    await G.step(GATE, `no JavaScript: 0 reveal blocks at opacity 0, odometers real, title visible ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const ctx = await b.newContext({ viewport: { width: 1141, height: 636 }, javaScriptEnabled: false }); await G.stub(ctx); if (G.ARGS.plant) await G.applyPlant(ctx, G.ARGS.plant);
        const page = await ctx.newPage();
        await page.goto(G.BASE + '/widebeam', { waitUntil: 'load' }); await G.sleep(1200);
        const r = await page.evaluate(() => {
          const blocks = [...document.querySelectorAll('[data-reveal],[data-wb-reveal]')];
          const hidden = blocks.filter((e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) if (getComputedStyle(x).opacity === '0') return true; return false; }).map((e) => (e.className || e.tagName).toString().split(' ')[0]);
          const odo = [...document.querySelectorAll('[data-odo]')].map((e) => [e.getAttribute('data-odo'), e.textContent.trim()]);
          return { n: blocks.length, hidden, odo };
        });
        if (r.n === 0) return G.missing(GATE, `no JavaScript: 0 reveal blocks at opacity 0, odometers real, title visible ${T}`, 'no [data-reveal] block on the page to judge');
        const odoBad = r.odo.filter(([v, t]) => v !== t);
        // the hero title: the CSS failsafe shows it by ~8.5 s with no script
        await G.sleep(8600);
        const title = await page.evaluate(() => { const i = document.querySelector('[data-wb-hero-inner]'); const h = document.querySelector('h1'); return i && h ? { vis: getComputedStyle(i).visibility, op: getComputedStyle(i).opacity, w: Math.round(h.getBoundingClientRect().width) } : null; });
        const titleOk = !!title && title.vis !== 'hidden' && +title.op > 0.5 && title.w > 0;
        const probs = [];
        if (r.hidden.length) probs.push(`${r.hidden.length} of ${r.n} blocks at opacity 0: ${[...new Set(r.hidden)].join(', ')}`);
        if (odoBad.length || r.odo.every(([, t]) => t === '0')) probs.push('odometers read ' + r.odo.map(([, t]) => t).join(' '));
        if (!titleOk) probs.push('hero title still hidden at 10 s: ' + JSON.stringify(title));
        G.ok(GATE, `no JavaScript: 0 reveal blocks at opacity 0, odometers real, title visible ${T}`, probs.length === 0, probs.length ? probs.join('; ') : `${r.n} reveal blocks all visible, odometers ${r.odo.map(([, t]) => t).join(' ')}, title visible`);
        await ctx.close();
      } finally { await b.close(); }
    });

    await G.step(GATE, `reduced motion: story canvas identical over 1 s at rest ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141', { reducedMotion: 'reduce' });
        await G.goto(page, G.BASE, '/widebeam', 2200); await G.hideCookie(page);
        if (await G.skipIfCut(page, GATE, `reduced motion: story canvas identical over 1 s at rest ${T}`, 'story')) return;
        const cv = '[data-wb-story] canvas, #wb-story canvas'; if (!(await G.has(page, cv))) return G.missing(GATE, `reduced motion: story canvas identical over 1 s at rest ${T}`, 'no story canvas');
        await G.bring(page, cv, false, 0.45); await G.sleep(1500);
        const snap = () => page.evaluate((cv) => { const c = document.querySelector(cv); try { return c.toDataURL(); } catch { return 'ERR'; } }, cv);
        const hs = []; for (let i = 0; i < 4; i++) { hs.push(hashOf(await snap())); await G.sleep(350); }
        const same = hs.every((h) => h === hs[0]);
        G.ok(GATE, `reduced motion: story canvas identical over 1 s at rest ${T}`, same, same ? 'canvas hash identical over 4 reads in 1.05 s' : `canvas changed with no input: ${hs.join(' / ')}`);
        await ctx.close();
      } finally { await b.close(); }
    });

    await G.step(GATE, `reduced motion: no intro, no HIGH BEAM flash ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141', { reducedMotion: 'reduce' });
        await G.goto(page, G.BASE, '/widebeam', 2500); await G.hideCookie(page);
        const intro = await page.evaluate(() => { const v = document.querySelector('video.wb-intro,[data-wb-intro]'); const hero = document.querySelector('.wb-hero'); return { video: !v ? 'removed' : (v.isConnected ? (v.paused ? 'paused' : 'PLAYING') + ' t=' + v.currentTime.toFixed(1) : 'removed'), isIntro: hero.classList.contains('is-intro'), src: !!(v && v.currentSrc) }; });
        await G.bring(page, '[data-wb-face]'); await page.locator(G.knobSel('Width')).focus();
        await page.evaluate(() => { window.__fl = 0; const f = document.querySelector('[data-wb-flash]'); if (f) f.addEventListener('animationstart', () => window.__fl++); });
        const before = await page.evaluate(() => document.querySelector('[aria-label="High beam"]').getAttribute('aria-checked'));
        await page.keyboard.press('h'); await G.sleep(900);
        const after = await page.evaluate(() => document.querySelector('[aria-label="High beam"]').getAttribute('aria-checked')); const fl = await page.evaluate(() => window.__fl);
        const probs = [];
        if (/PLAYING/.test(intro.video) || intro.isIntro) probs.push(`intro runs (${intro.video}, is-intro ${intro.isIntro})`);
        if (fl > 0) probs.push(`${fl} full-page flash(es)`);
        if (before === after) probs.push('(H did not toggle HIGH BEAM: the flash check is not exercised)');
        G.ok(GATE, `reduced motion: no intro, no HIGH BEAM flash ${T}`, probs.length === 0, probs.length ? probs.join('; ') : `intro ${intro.video}; HIGH BEAM ${before} -> ${after}, flashes ${fl}`);
        await ctx.close();
      } finally { await b.close(); }
    });
  }
});
