// G6 Hero (plan §4 G6). Non-timing: the column's bottom >= 40 px above the computed vanishing point (4 laptop sizes); with the page's own
// script blocked (production: its /_astro/hoisted.<hash>.js; dev: its .astro?type=script modules) the h1 is visible by 9 s, every [data-reveal]
// reaches opacity 1 and the dash still / parts are not bare (L1141, P390); on the real BF and CM clocks /widebeam has no sale strip; a stalled / missing intro video still gets the title up (logic, not a number); Skip / Replay hit-test to themselves with
// the banner up; focus lands on the h1 after Skip and on Skip after Replay; the wordmark keeps its filter; ?sale=bf hero fits; /#manual lands
// on the section with no intro request.   --timing: the title is up <= 6.5 s after play() on a 4 Mbit/s line (stage 4).
//   node G6.cjs <base> [--engines chromium,webkit] [--timing] [--block <regex: block these paths instead of the page's own modules>]
const G = require('./Glib.cjs');
const GATE = 'G6';
// stage 4 fix (r-gates-initblock): the old default regex (init.ts | _astro/widebeam.astro_astro_type_script | _astro/init.) matched nothing on a
// production build (the page ships ONE /_astro/hoisted.<hash>.js), so the row passed with nothing blocked; on dev it blocked init.ts only and the
// house reveal (BaseLayout's script, bundled into that same hoisted file in production) still ran. Now the block list is read from the page's own
// <script type="module" src>: on production every same-origin /_astro/*.js module (the hoisted bundle); on dev every
// /src/**/*.astro?astro&type=script module (the dev twin of that bundle: page + layout + components). The vite client, the dev toolbar and the
// dev-served CSS modules stay. 0 requests aborted = FAIL (the row measured nothing). --block <regex> still overrides.
const BLOCK_ARG = (() => { const i = process.argv.indexOf('--block'); return i < 0 ? null : new RegExp(process.argv[i + 1]); })();
const pageModules = async (base) => {
  const html = (await G.fetchText(base + '/widebeam/')).body;
  const out = [];
  for (const m of html.matchAll(/<script\b[^>]*>/g)) {
    const tag = m[0]; if (!/\stype="module"/.test(tag)) continue;
    const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1]; if (!src) continue;
    const u = new URL(src.replace(/&amp;/g, '&'), base + '/widebeam/'); if (u.origin !== new URL(base).origin) continue;
    const k = u.pathname + u.search;
    if (/^\/_astro\/.+\.js$/.test(u.pathname) || /\.astro$/.test(u.pathname) && /[?&]type=script/.test(u.search)) out.push(k);
  }
  return out;
};
const INTRO_RE = /intro-(720|1080)\.mp4/;
// the sale windows, read from src/data/sale.ts (not literals: the file changes on Nov 22): [{ id, start, end }]
const salePhases = () => {
  const src = require('fs').readFileSync(require('path').join(G.REPO, 'src/data/sale.ts'), 'utf8');
  const arr = src.slice(src.indexOf('salePhases'));
  return [...arr.matchAll(/id:\s*'(\w+)'[\s\S]*?start:\s*'([^']+)'[\s\S]*?end:\s*'([^']+)'/g)].map((m) => ({ id: m[1], start: m[2], end: m[3] }));
};

const titleUp = (page) => page.evaluate(() => { const inner = document.querySelector('[data-wb-hero-inner]'); const h = document.querySelector('h1'); if (!inner || !h) return false; const cs = getComputedStyle(inner); const r = h.getBoundingClientRect(); const L = h.querySelector('i'); return cs.visibility !== 'hidden' && +cs.opacity > 0.9 && r.width > 0 && (!L || +getComputedStyle(L).opacity > 0.9); });
const waitTitle = async (page, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await titleUp(page)) return Date.now() - t0; await G.sleep(150); } return null; };

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G6.cjs <base>');
  for (const engine of G.ARGS.engines) {
    const T = `[${engine}]`;
    if (G.ARGS.timing) {
      if (engine !== 'chromium') continue;
      await G.step(GATE, 'title up <= 6.5 s after play() at 4 Mbit/s [chromium]', async () => {
        const b = await G.launch('chromium');
        try {
          const { ctx, page } = await G.page(b, 'chromium', 'L1141');
          await page.addInitScript(() => { window.__play = null; document.addEventListener('playing', (e) => { if (e.target.tagName === 'VIDEO' && window.__play == null) window.__play = performance.now(); }, true); const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.documentElement.appendChild(s); });
          const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable');
          await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: 1024 * 1024 / 8 });
          await page.goto(G.BASE + '/widebeam', { waitUntil: 'commit' });
          const t0 = Date.now(); let up = null;
          while (Date.now() - t0 < 30000) { if (await titleUp(page).catch(() => false)) { up = Date.now() - t0; break; } await G.sleep(100); }
          const play = await page.evaluate(() => window.__play).catch(() => null);
          const rel = play != null && up != null ? up - Math.round(play) : null;
          G.ok(GATE, 'title up <= 6.5 s after play() at 4 Mbit/s [chromium]', up != null && (play == null ? up <= 6500 : rel <= 6500), `title up ${up} ms after navigation; video playing at ${play == null ? 'never' : Math.round(play) + ' ms'}; ${rel != null ? 'title ' + rel + ' ms after play()' : 'no play() (the road shows without the car)'}`);
          await ctx.close();
        } finally { await b.close(); }
      });
      continue;
    }

    // 1. the column clears the vanishing point
    for (const size of G.sizesOr(G.LAPTOPS)) {
      if (G.isTouchSize(size)) continue;
      await G.step(GATE, `column bottom >= 40 px above the vanishing point [${engine} ${size}]`, async () => {
        const b = await G.launch(engine);
        try {
          const { ctx, page } = await G.page(b, engine, size);
          await G.goto(page, G.BASE, '/widebeam', 2000);
          const up = await waitTitle(page, 11000);
          if (up == null) return G.ok(GATE, `column bottom >= 40 px above the vanishing point [${engine} ${size}]`, false, 'the title never came up in 13 s');
          await G.sleep(800);
          const vp = await G.vanishingY(page), bot = await G.columnBottom(page);
          if (bot == null) return G.missing(GATE, `column bottom >= 40 px above the vanishing point [${engine} ${size}]`, 'no [data-wb-hero-inner]');
          G.ok(GATE, `column bottom >= 40 px above the vanishing point [${engine} ${size}]`, vp - bot >= 40, `vanishing point y ${vp}, column bottom ${bot}: clearance ${vp - bot} px (need >= 40)`);
          await ctx.close();
        } finally { await b.close(); }
      });
    }

    // 2. the page's own script blocked (a failed chunk, a CSP block, a throw at import): the h1 still shows by 9 s (the CSS failsafe); stage 4
    //    (r-gates-initblock) adds, from the same load: every [data-reveal] / [data-reveal-item] reaches opacity 1 (global.css hides them under
    //    html.motion-ok until reveal.ts runs), and the dash still and the deferred parts are not left bare (init.ts nearArt() swaps their art in).
    //    L1141 (the title row keeps its old name there) and P390.
    const PROD = await G.isProd(G.BASE);
    const mods = BLOCK_ARG ? null : await pageModules(G.BASE);
    const isBlocked = (k) => (BLOCK_ARG ? BLOCK_ARG.test(k) : mods.includes(k));
    for (const size of G.sizesOr(['L1141', 'P390'])) {
      if (engine === 'firefox' && G.isTouchSize(size)) continue;
      const tag = `[${engine}${size === 'L1141' ? '' : ' ' + size}${PROD ? ' prod' : ''}]`, tagS = `[${engine} ${size}${PROD ? ' prod' : ''}]`;
      const cT = `init blocked: the title shows by 9 s ${tag}`, cR = `init blocked: every [data-reveal] reaches opacity 1 ${tagS}`, cA = `init blocked: the dash still and the parts are not bare ${tagS}`;
      const match = (c) => !G.ARGS.only || (GATE + ' ' + c).toLowerCase().includes(String(G.ARGS.only).toLowerCase());
      const done = new Set(); const want = (c) => match(c) && !done.has(c) && !!done.add(c); // each row printed once, even when a later read throws
      if (![cT, cR, cA].some(match)) continue;
      // one load reads all three rows, so this is not G.step (its --only filter knows one name); an exception fails each wanted row
      try {
        const touch = G.isTouchSize(size);
        const b = await G.launch(engine);
        try {
          const { ctx, page } = await G.page(b, engine, size); page.errs.length = 0;
          const aborted = [];
          await ctx.route((u) => isBlocked(u.pathname + u.search), (r) => { aborted.push(new URL(r.request().url()).pathname.split('/').pop()); return r.abort(); });
          await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.documentElement.appendChild(s); });
          const t0 = Date.now();
          await page.goto(G.BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
          const up = await waitTitle(page, 9500);
          const what0 = () => { const ab = [...new Set(aborted)]; return ab.length ? `blocked ${ab.length} page module${ab.length > 1 ? 's' : ''}: ${ab.slice(0, 2).join(', ')}${ab.length > 2 ? ', …' : ''}` : `NOTHING was blocked (the page's modules: ${mods ? mods.join(', ') || 'none found' : 'by --block'})`; };
          const vis = await page.evaluate(() => { const i = document.querySelector('[data-wb-hero-inner]'); const h = document.querySelector('h1'); return i && h ? { vis: getComputedStyle(i).visibility, h1: h.getBoundingClientRect().width } : null; });
          if (want(cT)) G.ok(GATE, cT, aborted.length > 0 && up != null && up <= 9200, (up != null ? `title visible after ${up} ms` : `still hidden after 9.5 s: ${JSON.stringify(vis)}`) + `; ${what0()}`);
          // walk the whole page (native scroll: with the page script blocked there is no Lenis), then give a CSS failsafe until 12 s after navigation
          await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } });
          await G.sleep(touch ? 600 : 300);
          const readR = () => page.evaluate(() => { const all = [...document.querySelectorAll('[data-reveal],[data-reveal-item]')]; const stuck = all.filter((e) => +getComputedStyle(e).opacity < 0.99); return { total: all.length, stuck: stuck.map((e) => (e.className || e.tagName).toString().split(' ')[0] + '@' + getComputedStyle(e).opacity), px: Math.round(stuck.reduce((s, e) => s + e.getBoundingClientRect().height, 0)), motionOk: document.documentElement.classList.contains('motion-ok') }; });
          let rv = await readR();
          while (rv.stuck.length && Date.now() - t0 < 12000) { await G.sleep(250); rv = await readR(); }
          if (want(cR)) G.ok(GATE, cR, aborted.length > 0 && rv.total > 0 && rv.stuck.length === 0, `${rv.stuck.length} of ${rv.total} reveal blocks below opacity 1 at ${Date.now() - t0} ms after navigation${rv.stuck.length ? ': ' + rv.stuck.join(', ') + ` (${rv.px} px of page)` : ''}; html.motion-ok ${rv.motionOk}; ${what0()}`);
          // the art: every visible deferred part has its background, the dash still has a decoded image
          await page.evaluate(async () => { for (const e of document.querySelectorAll('img.wb-dash-still')) { const r = e.getBoundingClientRect(); window.scrollTo(0, r.top + scrollY - innerHeight / 3); await new Promise((r) => setTimeout(r, 400)); } });
          await G.sleep(1500);
          // the face art loads on a 12 s at-rest clock + idle (a settled call), so a working page may still be bare before ~13 s: poll to 16 s
          const readA = () => page.evaluate(() => {
            const bare = []; let n = 0;
            for (const e of document.querySelectorAll('.wb-part-lamp-l, .wb-part-lamp-r, .wb-part-road, .wb-part-meter, .wb-part-cap, [data-wb-defer]')) {
              const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
              if (!r.width || !r.height || cs.visibility === 'hidden') continue;
              const name = (e.className || e.tagName).toString().split(' ')[0];
              if (e.tagName === 'IMG') { n++; if (!(e.currentSrc || e.getAttribute('src')) || !e.complete || !e.naturalWidth) bare.push(name + ' (no image)'); continue; }
              if (e.matches('input[type=range]')) continue; // the fader's art is on its thumb (a pseudo element, not readable here)
              n++; if (cs.backgroundImage === 'none') bare.push(name + ' (no background)');
            }
            return { n, bare };
          });
          let art = await readA();
          while (art.bare.length && Date.now() - t0 < 16000) { await G.sleep(300); art = await readA(); }
          if (want(cA)) G.ok(GATE, cA, aborted.length > 0 && art.n > 0 && art.bare.length === 0, `${art.bare.length} of ${art.n} visible art pieces bare at ${Date.now() - t0} ms${art.bare.length ? ': ' + art.bare.join(', ') : ''}; ${what0()}`);
          await ctx.close();
        } finally { await b.close(); }
      } catch (e) { for (const c of [cT, cR, cA]) if (want(c)) G.row(GATE, c, 'FAIL', 'ERROR ' + String(e && e.message || e).split('\n')[0]); }
    }

    // 3. a stalled / a missing intro video: the title still comes (a stub, not a timing number)
    for (const mode of ['stalled', '404']) await G.step(GATE, `${mode} intro video: title up and no Replay for a missing film ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141');
        await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.documentElement.appendChild(s); });
        const held = [];
        await ctx.route((u) => INTRO_RE.test(u.pathname), (r) => { if (mode === '404') r.fulfill({ status: 404, body: '' }); else held.push(r); });
        page.errs.length = 0;
        await page.goto(G.BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
        const up = await waitTitle(page, 13000);
        const replay = await page.evaluate(() => { const r = document.querySelector('[data-wb-replay]'); if (!r) return 'none'; const cs = getComputedStyle(r); return r.hidden || cs.display === 'none' || cs.visibility === 'hidden' ? 'hidden' : 'offered'; });
        const probs = []; if (up == null) probs.push('the title never came up (13 s)'); else if (up > 9500) probs.push(`title only at ${up} ms`);
        if (mode === '404' && replay === 'offered') probs.push('Replay is offered for a missing video');
        G.ok(GATE, `${mode} intro video: title up and no Replay for a missing film ${T}`, probs.length === 0, probs.length ? probs.join('; ') : `title ${up} ms, Replay ${replay}`);
        held.forEach((r) => r.abort().catch(() => {})); await ctx.close();
      } finally { await b.close(); }
    });

    // 4. Skip / Replay with the cookie banner up: they hit-test to themselves, and inside the viewport
    for (const size of G.sizesOr(['L1141', 'P390', 'S844'])) {
      if (engine === 'firefox' && G.isTouchSize(size)) continue;
      await G.step(GATE, `Skip hit-tests to itself with the banner up [${engine} ${size}]`, async () => {
        const b = await G.launch(engine);
        try {
          const { ctx, page } = await G.page(b, engine, size);
          await G.goto(page, G.BASE, '/widebeam', 2800);
          const r = await page.evaluate(() => { const s = document.querySelector('[data-wb-skip]'); if (!s) return null; const q = s.getBoundingClientRect(); const x = Math.min(innerWidth - 1, Math.max(0, q.x + q.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, q.y + q.height / 2)); const el = document.elementFromPoint(x, y); const cb = document.getElementById('cookie-banner'); const cbr = cb ? cb.getBoundingClientRect() : null; return { box: [Math.round(q.top), Math.round(q.bottom), Math.round(q.left), Math.round(q.right)], hit: el ? (el.closest('[data-wb-skip]') ? 'skip' : el.closest('#cookie-banner') ? 'COOKIE BANNER' : (el.id || el.className || el.tagName).toString().slice(0, 40)) : 'nothing', inView: q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 && q.right <= innerWidth, banner: !!cbr && cbr.height > 0 && cbr.bottom > 0 }; });
          if (!r) return G.missing(GATE, `Skip hit-tests to itself with the banner up [${engine} ${size}]`, 'no [data-wb-skip] (the intro may have ended)');
          G.ok(GATE, `Skip hit-tests to itself with the banner up [${engine} ${size}]`, r.hit === 'skip' && r.inView, `Skip box top/bottom/left/right ${r.box.join('/')}, the point hits ${r.hit}, in view ${r.inView}, banner ${r.banner ? 'up' : 'not shown'}`);
          await ctx.close();
        } finally { await b.close(); }
      });
    }

    // 5. focus after Skip -> the h1; after Replay -> Skip; the wordmark's filter; the sale strip
    await G.step(GATE, `focus: Skip -> h1, Replay -> Skip ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141');
        await G.goto(page, G.BASE, '/widebeam', 2200); await G.hideCookie(page);
        const ae = () => page.evaluate(() => { const e = document.activeElement; return e ? (e.tagName + (e.id ? '#' + e.id : '') + (e.hasAttribute('data-wb-skip') ? '[skip]' : '')) : 'null'; });
        const sk = page.locator('[data-wb-skip]'); if (!(await sk.count())) return G.missing(GATE, `focus: Skip -> h1, Replay -> Skip ${T}`, 'no Skip');
        await sk.focus(); await page.keyboard.press('Enter'); await G.sleep(1500);
        const a1 = await ae();
        const rp = page.locator('[data-wb-replay]'); let a2 = 'no Replay offered';
        if (await rp.isVisible().catch(() => false)) { await rp.focus(); await page.keyboard.press('Enter'); await G.sleep(1200); a2 = await ae(); }
        G.ok(GATE, `focus: Skip -> h1, Replay -> Skip ${T}`, /^H1/.test(a1) && /\[skip\]/.test(a2), `after Skip: ${a1}; after Replay: ${a2}`);
        await ctx.close();
      } finally { await b.close(); }
    });
    await G.step(GATE, `wordmark keeps its filter after the reveal ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141');
        await G.goto(page, G.BASE, '/widebeam', 2000); await G.hideCookie(page);
        const up = await waitTitle(page, 11000); await G.sleep(1500);
        const f = await page.evaluate(() => { const i = document.querySelector('.wb-mark-row i'); return i ? { inline: i.style.filter, comp: getComputedStyle(i).filter } : null; });
        if (!f) return G.missing(GATE, `wordmark keeps its filter after the reveal ${T}`, 'no .wb-mark-row i');
        G.ok(GATE, `wordmark keeps its filter after the reveal ${T}`, up != null && f.inline !== 'blur(0px)' && f.comp !== 'blur(0px)', `inline filter "${f.inline}", computed "${f.comp.slice(0, 60)}"`);
        await ctx.close();
      } finally { await b.close(); }
    });
    await G.step(GATE, `?sale=bf: the hero fits the screen ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141');
        await page.goto(G.BASE + '/widebeam?sale=bf', { waitUntil: 'domcontentloaded' }); await G.sleep(2200); await G.hideCookie(page);
        const r = await page.evaluate(() => { const h = document.querySelector('.wb-hero').getBoundingClientRect(); return { bottom: Math.round(h.bottom + scrollY), vh: innerHeight, strip: !!document.querySelector('.sale-strip,[data-sale-strip]') && getComputedStyle(document.querySelector('.sale-strip,[data-sale-strip]')).display !== 'none' }; });
        // /widebeam shows no sale strip (data/widebeam.ts launch step 7): both a strip-less page and a fitted hero pass; a hero taller than the screen fails
        G.ok(GATE, `?sale=bf: the hero fits the screen ${T}`, r.bottom <= r.vh + 1, `hero bottom ${r.bottom} px on a ${r.vh} px screen, sale strip ${r.strip ? 'shown' : 'not shown'}`);
        await ctx.close();
      } finally { await b.close(); }
    });
    // stage 4 (r-gates-salerow): the REAL sale dates, not the dev preview. The clock is fixed inside each window of src/data/sale.ts; /widebeam
    // must carry no html[data-sale] and no displayed strip (.ss / [data-sale-strip]: BaseLayout leaves it out of the markup there). A control page
    // ('/') in the same context must show the phase, or the clock never took and the row measured nothing (FAIL).
    const phases = salePhases();
    if (!phases.length && (!G.ARGS.only || 'g6 sale dates'.includes(String(G.ARGS.only).toLowerCase()) || String(G.ARGS.only).toLowerCase().includes('sale dates'))) G.missing(GATE, `sale dates: no sale strip on /widebeam ${T}`, 'no sale window read from src/data/sale.ts (salePhases: id / start / end): nothing measured');
    for (const ph of phases) for (const size of G.sizesOr(['L1141', 'P390'])) {
      if (engine === 'firefox' && G.isTouchSize(size)) continue;
      const at = new Date((Date.parse(ph.start) + Date.parse(ph.end)) / 2);
      const c = `sale dates: no sale strip on /widebeam on the ${ph.id.toUpperCase()} clock [${engine} ${size}]`;
      await G.step(GATE, c, async () => {
        const b = await G.launch(engine);
        try {
          const { ctx, page } = await G.page(b, engine, size);
          await page.clock.setFixedTime(at);
          const read = () => page.evaluate(() => { const ss = [...document.querySelectorAll('.ss,[data-sale-strip]')]; const shown = ss.filter((e) => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0; }); return { sale: document.documentElement.dataset.sale ?? null, strips: ss.length, shown: shown.length, h: Math.round(shown.reduce((s, e) => Math.max(s, e.getBoundingClientRect().height), 0)), saleH: getComputedStyle(document.documentElement).getPropertyValue('--sale-h').trim() || '-' }; });
          await page.goto(G.BASE + '/', { waitUntil: 'domcontentloaded' }); await G.sleep(2500);
          const ctl = await read();
          await page.goto(G.BASE + '/widebeam/', { waitUntil: 'domcontentloaded' }); await G.sleep(3000);
          const wb = await read();
          const clockOk = ctl.sale === ph.id && ctl.shown > 0;
          const probs = [];
          if (!clockOk) probs.push(`the clock did not take: the control page '/' reads data-sale ${ctl.sale}, ${ctl.shown} strip shown, so this measured nothing`);
          if (wb.sale) probs.push(`html[data-sale]="${wb.sale}" on /widebeam`);
          if (wb.shown) probs.push(`${wb.shown} sale strip shown on /widebeam (${wb.h} px)`);
          G.ok(GATE, c, probs.length === 0, `${probs.length ? probs.join('; ') + '. ' : ''}clock ${at.toISOString()}; control '/': data-sale ${ctl.sale}, strip shown ${ctl.shown}; /widebeam: data-sale ${wb.sale ?? 'unset'}, strips in markup ${wb.strips}, shown ${wb.shown}, --sale-h ${wb.saleH}`);
          await ctx.close();
        } finally { await b.close(); }
      });
    }

    // 6. /widebeam/#manual lands on the section with no intro request
    await G.step(GATE, `/widebeam/#manual lands on the manual, no intro request ${T}`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141'); const intro = [];
        page.on('request', (r) => { if (INTRO_RE.test(r.url())) intro.push(r.url().split('/').pop()); });
        await page.goto(G.BASE + '/widebeam/#manual', { waitUntil: 'domcontentloaded' }); await G.sleep(4500);
        // stage 4: aimed at the manual's heading, not the section box. The section lands with its top padding above the
        // screen (manual.css scroll-margin-top, lane S) so the heading sits under the nav and the screen + strap fit on
        // 1141x636; the section's own top is then about -54 px, by design. The heading must be under the nav, not behind it.
        const r = await page.evaluate(() => { const m = document.getElementById('manual'); const h = m && (m.querySelector('#wb-manual-h') || m.querySelector('h2')); const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44; return h ? { top: Math.round(h.getBoundingClientRect().top), sec: Math.round(m.getBoundingClientRect().top), nav, y: Math.round(scrollY) } : null; });
        if (!r) return G.missing(GATE, `/widebeam/#manual lands on the manual, no intro request ${T}`, 'no #manual heading');
        G.ok(GATE, `/widebeam/#manual lands on the manual, no intro request ${T}`, r.top >= r.nav - 2 && r.top <= r.nav + 80 && intro.length === 0, `#manual heading top ${r.top} px (section ${r.sec}; nav ${r.nav}), scrollY ${r.y}, intro requests: ${intro.length ? intro.join(',') : 'none'}`);
        await ctx.close();
      } finally { await b.close(); }
    });
  }
});
