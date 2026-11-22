// G8 Furniture (plan §4 G8), at 11 sizes: the kit's 7 + 1920x953 + 1000x700 (901-1099 px) + iPad 820x1180 / 1180x820, DPR 2 laptops / 3 phones.
//  A  every footer link at the page end hit-tests to itself.
//  B  the SOUND key is never under the cookie banner or the phone bar (banner up and down, 4 scroll positions); with a CDP safe-area override
//     (portrait 59/34, sideways 59/21) it stays inside the safe area (Chrome only).
//  C  the SOUND key and the cart FAB step aside over [data-wb-watch]; the key is never hidden while sound plays.
//  D  the cart FAB never covers the plate's / closer's field or key (phones).
//  E  no fixed part covers a focused field or key (a Tab walk, banner up).
//   node G8.cjs <base> [--engines chromium,webkit] [--sizes L1141,P390] [--only "A "]
const G = require('./Glib.cjs');
const GATE = 'G8';
const BAR_SEL = '[data-wb-bar],[data-wb-sticky],.wb-bar,.wb-sticky-bar,.wb-stickybar,.wb-stickyBar';
const SAFE = { P390: { top: 59, bottom: 34, left: 0, right: 0 }, P360: { top: 59, bottom: 34, left: 0, right: 0 }, S844: { top: 0, bottom: 21, left: 59, right: 59 } };

// geometry helpers run in the page
const GEO = () => {
  window.__g = {
    R: (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; },
    shown: (e) => { if (!e) return false; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05 || r.width < 2 || r.height < 2) return false; const vis = Math.min(r.right, innerWidth) - Math.max(r.left, 0) > 2 && Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) > 2; return vis; },
    over: (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 2 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 2,
  };
};

async function setPos(page, frac, touch) { const max = await G.maxScroll(page); const y = Math.round(max * frac); if (touch) { await page.evaluate((y) => window.scrollTo(0, y), y); await G.sleep(450); } else { const cur = await G.scrollY(page); await G.scrollBy(page, y - cur, false); } }

async function measureSize(engine, size, rows) {
  const touch = G.isTouchSize(size);
  const b = await G.launch(engine);
  try {
    const { ctx, page } = await G.page(b, engine, size);
    await page.addInitScript(GEO);
    let cdp = null, safe = null;
    if (engine === 'chromium' && SAFE[size]) { cdp = await ctx.newCDPSession(page); try { await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: SAFE[size] }); safe = SAFE[size]; } catch (e) { rows.safeErr = String(e.message).split('\n')[0]; } }
    await G.goto(page, G.BASE, '/widebeam', 3000);
    await page.keyboard.press('Escape').catch(() => {});
    const probe = () => page.evaluate(({ BAR_SEL, safe }) => {
      const g = window.__g, s = document.querySelector('[data-wb-sound]'), cb = document.getElementById('cookie-banner'), bar = document.querySelector(BAR_SEL), fab = document.querySelector('.cart-fab');
      const out = { sound: !!s, soundShown: g.shown(s), playing: !!document.querySelector('.wb-page.is-playing'), cover: [], safeOut: [], watch: [], fabWatch: [] };
      if (!s) return out;
      const sr = g.R(s);
      if (cb && g.shown(cb) && g.over(sr, g.R(cb))) out.cover.push('cookie banner');
      if (bar && g.shown(bar) && g.over(sr, g.R(bar))) out.cover.push('phone bar');
      if (safe) { if (sr.b > innerHeight - safe.bottom + 1) out.safeOut.push(`bottom ${Math.round(sr.b)} > ${innerHeight - safe.bottom}`); if (sr.r > innerWidth - safe.right + 1) out.safeOut.push(`right ${Math.round(sr.r)} > ${innerWidth - safe.right}`); if (sr.l < safe.left - 1) out.safeOut.push(`left ${Math.round(sr.l)} < ${safe.left}`); }
      document.querySelectorAll('[data-wb-watch]').forEach((w) => { if (!g.shown(w)) return; const wr = g.R(w); if (g.shown(s) && g.over(sr, wr)) out.watch.push('SOUND over ' + (w.id || w.className.toString().split(' ')[0])); if (fab && g.shown(fab) && g.over(g.R(fab), wr)) out.fabWatch.push('cart FAB over ' + (w.id || w.className.toString().split(' ')[0])); });
      return out;
    }, { BAR_SEL, safe });

    // B (banner up) -- 4 positions
    const bannerUp = await page.evaluate(() => { const c = document.getElementById('cookie-banner'); return !!c && window.__g.shown(c); });
    const pos = [0, 0.3, 0.6, 0.92];
    const cover = [], safeOut = [], watch = [], fabW = [];
    for (const f of pos) { await setPos(page, f, touch); const r = await probe(); if (!r.sound) { rows.missingSound = true; break; } r.cover.forEach((c) => cover.push(`${c} @${f}`)); r.safeOut.forEach((c) => safeOut.push(`${c} @${f}`)); r.watch.forEach((c) => watch.push(`${c} @${f}`)); r.fabWatch.forEach((c) => fabW.push(`${c} @${f}`)); }
    rows.cover.push([size, bannerUp ? 'banner up' : 'no banner', cover]);
    rows.safe.push([size, safe ? safeOut : null]);
    // answer the banner like a visitor, then repeat
    await G.declineCookie(page); await page.keyboard.press('Escape').catch(() => {});
    const cover2 = [];
    for (const f of pos) { await setPos(page, f, touch); const r = await probe(); r.cover.forEach((c) => cover2.push(`${c} @${f}`)); r.watch.forEach((c) => watch.push(`${c} @${f}`)); r.fabWatch.forEach((c) => fabW.push(`${c} @${f}`)); r.safeOut.forEach((c) => safeOut.push(`${c} @${f} (banner answered)`)); }
    rows.cover.push([size + ' (banner answered)', '', cover2]);
    if (safe) rows.safe[rows.safe.length - 1][1] = safeOut;
    // C: with sound on the key is still there
    const s = await G.rect(page, '[data-wb-sound]');
    let hiddenWhilePlaying = [];
    if (s) {
      await setPos(page, 0.5, touch); const sr = await G.rect(page, '[data-wb-sound]');
      if (!(await G.soundOn(page))) { if (touch) await page.touchscreen.tap(Math.min(sr.cx, page.viewportSize().width - 2), Math.min(sr.cy, page.viewportSize().height - 2)); else await page.mouse.click(sr.cx, sr.cy); await G.sleep(900); }
      if (await G.soundOn(page)) { for (const f of [0, 0.3, 0.6, 0.92, 1]) { await setPos(page, f, touch); const r = await probe(); if (!r.soundShown) hiddenWhilePlaying.push('@' + f); r.watch.forEach((c) => watch.push(`${c} @${f} (playing)`)); } }
      else hiddenWhilePlaying = ['(could not start the sound to test)'];
    }
    rows.watch.push([size, watch.concat(fabW)]); rows.playing.push([size, hiddenWhilePlaying]);
    // A: footer links at the page end
    await G.toEnd(page, touch); await G.sleep(700);
    const foot = await page.evaluate(() => { const bad = [], all = [...document.querySelectorAll('footer a')].filter((a) => { const r = a.getBoundingClientRect(); return r.width > 1 && r.height > 1; }); for (const a of all) { const r = a.getBoundingClientRect(); const x = Math.min(innerWidth - 1, Math.max(0, r.x + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.y + r.height / 2)); if (r.bottom < 0 || r.top > innerHeight) { bad.push((a.getAttribute('href') || '').slice(0, 30) + ' (off screen)'); continue; } const el = document.elementFromPoint(x, y); if (!el || !a.contains(el)) bad.push((a.getAttribute('href') || '').slice(0, 30) + ' under ' + (el ? (el.closest('[data-wb-sound]') ? 'SOUND key' : (el.id || el.className.toString().split(' ')[0] || el.tagName)) : 'nothing')); } return { n: all.length, bad }; });
    rows.foot.push([size, foot]);
    // D: the cart FAB vs the ask fields (phones / tablets)
    if (touch) {
      const hits = [];
      for (const sel of ['#wb-trial-email', '[data-wb-trial] button[type=submit]', '#wb-email', '[data-wb-form] button[type=submit]']) {
        if (!(await G.has(page, sel))) continue; await G.bring(page, sel, true, 0.7);
        const r = await page.evaluate((sel) => { const g = window.__g, e = document.querySelector(sel), f = document.querySelector('.cart-fab'), s = document.querySelector('[data-wb-sound]'), bar = document.querySelector('[data-wb-bar],[data-wb-sticky],.wb-bar,.wb-sticky-bar'); const er = g.R(e); const o = []; if (f && g.shown(f) && g.over(er, g.R(f))) o.push('cart FAB'); if (s && g.shown(s) && g.over(er, g.R(s))) o.push('SOUND key'); if (bar && g.shown(bar) && g.over(er, g.R(bar))) o.push('phone bar'); return o; }, sel);
        r.forEach((o) => hits.push(`${o} over ${sel}`));
      }
      rows.fab.push([size, hits]);
    }
    await ctx.close();
  } finally { await b.close(); }
}

// E: a Tab walk, banner up: no fixed part covers the focused control
async function tabWalk(engine, size) {
  const touch = G.isTouchSize(size); const b = await G.launch(engine);
  try {
    const { ctx, page } = await G.page(b, engine, size); await page.addInitScript(GEO);
    await G.goto(page, G.BASE, '/widebeam', 2800);
    const cov = []; let n = 0; const seen = new Set();
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press('Tab'); await G.sleep(engine === 'webkit' ? 330 : 220);
      const d = await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return { body: true };
        const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return { skip: true };
        const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
        const l = Math.max(r.left, 0), rr = Math.min(r.right, innerWidth), t = Math.max(r.top, 0), bb = Math.min(r.bottom, innerHeight);
        if (rr <= l || bb <= t) return { off: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30) };
        const hit = document.elementFromPoint((l + rr) / 2, (t + bb) / 2);
        if (!hit || el.contains(hit) || hit.contains(el)) return { ok: true, key: el.outerHTML.slice(0, 80) };
        let fixed = null; for (let x = hit; x && x !== document.body; x = x.parentElement) { const p = getComputedStyle(x).position; if (p === 'fixed' || p === 'sticky') { fixed = x; break; } }
        return { covered: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30), by: fixed ? (fixed.id || fixed.className.toString().split(' ')[0] || fixed.tagName) : null, key: el.outerHTML.slice(0, 80) };
      });
      if (d.key) { if (seen.has(d.key) && seen.size > 6) break; seen.add(d.key); }
      n++; if (d.covered && d.by) cov.push(`"${d.covered}" under ${d.by}`);
    }
    await ctx.close(); return { n, cov };
  } finally { await b.close(); }
}

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G8.cjs <base>');
  for (const engine of G.ARGS.engines) {
    const T = `[${engine}]`;
    const sizes = G.sizesOr(G.ALL_SIZES).filter((s) => !(engine === 'firefox' && G.isTouchSize(s)));
    const rows = { cover: [], safe: [], watch: [], playing: [], foot: [], fab: [] };
    let failedSizes = [];
    for (const size of sizes) { try { await measureSize(engine, size, rows); } catch (e) { failedSizes.push(size + ': ' + String(e.message).split('\n')[0]); } }
    const fmt = (arr, pick) => arr.filter(pick).map(([s, v, w]) => `${s}: ${(w || v).join(', ')}`);
    if (failedSizes.length) G.row(GATE, `measuring ${T}`, 'FAIL', failedSizes.join(' | '));
    if (rows.missingSound) G.missing(GATE, `SOUND key exists ${T}`, 'no [data-wb-sound]');
    await G.step(GATE, `A footer links hit-test to themselves at the page end, ${sizes.length} sizes ${T}`, async () => {
      const bad = rows.foot.filter(([, f]) => f.bad.length).map(([s, f]) => `${s}: ${f.bad.join(', ')}`); const none = rows.foot.filter(([, f]) => f.n === 0).map(([s]) => s);
      G.ok(GATE, `A footer links hit-test to themselves at the page end, ${sizes.length} sizes ${T}`, !bad.length && !none.length && rows.foot.length > 0, bad.length ? bad.join(' | ') : none.length ? 'no footer links at ' + none.join(',') : `${rows.foot.length} sizes, ${rows.foot[0] ? rows.foot[0][1].n : 0} links each: all hit themselves`);
    });
    await G.step(GATE, `B SOUND key never under the cookie banner or the phone bar ${T}`, async () => {
      const bad = rows.cover.filter(([, , c]) => c.length).map(([s, , c]) => `${s}: ${[...new Set(c)].join(', ')}`);
      G.ok(GATE, `B SOUND key never under the cookie banner or the phone bar ${T}`, !bad.length && rows.cover.length > 0, bad.length ? bad.join(' | ') : `${rows.cover.length} size/banner states x 4 positions: clear`);
    });
    await G.step(GATE, `B SOUND key stays inside the safe area (CDP 59/34 portrait, 59/21 sideways) ${T}`, async () => {
      if (engine !== 'chromium') return G.skip(GATE, `B SOUND key stays inside the safe area (CDP 59/34 portrait, 59/21 sideways) ${T}`, 'the safe-area override is a CDP call: Chrome only');
      if (rows.safeErr) return G.skip(GATE, `B SOUND key stays inside the safe area (CDP 59/34 portrait, 59/21 sideways) ${T}`, 'this Chrome has no Emulation.setSafeAreaInsetsOverride: ' + rows.safeErr);
      const probed = rows.safe.filter(([, v]) => v !== null); const bad = probed.filter(([, v]) => v.length).map(([s, v]) => `${s}: ${[...new Set(v)].join(', ')}`);
      G.ok(GATE, `B SOUND key stays inside the safe area (CDP 59/34 portrait, 59/21 sideways) ${T}`, !bad.length && probed.length > 0, bad.length ? bad.join(' | ') : `${probed.map(([s]) => s).join(', ')}: inside the inset`);
    });
    await G.step(GATE, `C SOUND key and cart FAB step aside over [data-wb-watch] ${T}`, async () => {
      const has = await (async () => true)();
      const bad = rows.watch.filter(([, w]) => w.length).map(([s, w]) => `${s}: ${[...new Set(w)].join(', ')}`);
      G.ok(GATE, `C SOUND key and cart FAB step aside over [data-wb-watch] ${T}`, !bad.length && has, bad.length ? bad.join(' | ') : 'no overlap with any [data-wb-watch] element at 5 positions');
    });
    await G.step(GATE, `C SOUND key is never hidden while sound plays ${T}`, async () => {
      const bad = rows.playing.filter(([, w]) => w.length).map(([s, w]) => `${s}: ${w.join(',')}`);
      G.ok(GATE, `C SOUND key is never hidden while sound plays ${T}`, !bad.length && rows.playing.length > 0, bad.length ? bad.join(' | ') : 'visible at 5 positions at every size');
    });
    if (sizes.some(G.isTouchSize)) await G.step(GATE, `D cart FAB / SOUND key / phone bar never cover the ask fields ${T}`, async () => {
      const bad = rows.fab.filter(([, h]) => h.length).map(([s, h]) => `${s}: ${[...new Set(h)].join(', ')}`);
      G.ok(GATE, `D cart FAB / SOUND key / phone bar never cover the ask fields ${T}`, !bad.length && rows.fab.length > 0, bad.length ? bad.join(' | ') : `${rows.fab.length} touch sizes: clear`);
    });
    for (const size of G.sizesOr(['L1141', 'P390'])) if (!(engine === 'firefox' && G.isTouchSize(size))) await G.step(GATE, `E no fixed part covers a focused control, Tab walk [${engine} ${size}]`, async () => {
      const r = await tabWalk(engine, size);
      G.ok(GATE, `E no fixed part covers a focused control, Tab walk [${engine} ${size}]`, r.n > 8 && r.cov.length === 0, r.cov.length ? r.cov.slice(0, 5).join(' | ') : `${r.n} Tab stops, banner up: none covered`);
    });
  }
});
