// Lead spot-check of the team's top bugs on /widebeam. Worker + analytics STUBBED (nothing is sent).
// Usage: NODE_PATH=<repo>/node_modules node verify.cjs [base]
const { chromium, webkit } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const BASE = (process.argv[2] || process.env.BASE || (() => { throw new Error('base URL missing'); })()).replace(/\/$/, ''); // kit copy: base from argv/env
const OUT = (process.env.OUT_DIR || require('path').join(__dirname, '..', '..', 'runs', 'adhoc')); // kit copy: outputs under runs/<label>/
fs.mkdirSync(OUT, { recursive: true });
const STUB = /revlimiter-license[.]revaudio[.]workers[.]dev|cloudflareinsights/;
const HIDE_COOKIE = '#cookie-banner,[class*="cookie"]{display:none!important}';
const log = (k, v) => console.log(k.padEnd(34), typeof v === 'string' ? v : JSON.stringify(v));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ctxFor(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1141, height: 636 }, ...opts });
  await ctx.route(STUB, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));
  return ctx;
}
const sound = (p) => p.evaluate(() => document.querySelector('[data-wb-sound]')?.getAttribute('aria-pressed'));

(async () => {
  const chrome = await chromium.launch({ channel: 'chrome' });

  // 1. static claims on the plate + the field's accessible name
  {
    const ctx = await ctxFor(chrome); const p = await ctx.newPage();
    await p.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
    await sleep(1200);
    const r = await p.evaluate(() => ({
      label: document.querySelector('.wb-get-label')?.textContent?.trim(),
      notice: document.querySelector('.wb-get-notice')?.textContent?.trim(),
      aaxCount: (document.querySelector('[data-wb-page]').textContent.match(/AAX/g) || []).length,
      fieldName: document.querySelector('#wb-trial-email')?.getAttribute('aria-label'),
      cruise: [...document.querySelectorAll('.wb-dr')].map((d) => d.textContent).find((t) => t.includes('CRUISE')),
      traction: document.querySelector('[data-wb-page]').textContent.includes('TRACTION'),
      sitemapNoIndex: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    }));
    log('1 plate label', r.label); log('1 plate notice', r.notice); log('1 AAX mentions on page', r.aaxCount);
    log('1 email field aria-label', r.fieldName); log('1 CRUISE spec row', r.cruise); log('1 TRACTION named', r.traction); log('1 robots', r.sitemapNoIndex);
    await ctx.close();
  }

  // 2. what starts the music (each in a fresh context; the first gesture listener removes itself)
  for (const [name, act] of [
    ['Tab once', async (p) => { await p.keyboard.press('Tab'); }],
    ['cookie Decline', async (p) => { await p.click('#cookie-decline'); }],
    ['Skip intro click', async (p) => { await p.click('[data-wb-skip]', { timeout: 3000 }).catch(() => 'nohit'); }],
  ]) {
    const ctx = await ctxFor(chrome); const p = await ctx.newPage();
    await p.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
    await sleep(2200);
    const before = await sound(p);
    await act(p);
    await sleep(700);
    const extra = name === 'BUY NOW placeholder' ? await p.evaluate(() => document.querySelector('[data-wb-buy-note]')?.textContent) : '';
    log('2 music: ' + name, `sound ${before} -> ${await sound(p)} ${extra ? '| note: ' + extra : ''}`);
    await ctx.close();
  }

  // 3. hero: skip under the banner, the mark's filter after the reveal, the vanishing point vs the CTA
  {
    const ctx = await ctxFor(chrome); const p = await ctx.newPage();
    await p.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
    await sleep(2600);
    const skipHit = await p.evaluate(() => { const s = document.querySelector('[data-wb-skip]'); if (!s) return 'no skip'; const r = s.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { skipBox: [Math.round(r.top), Math.round(r.bottom)], hit: el?.closest('#cookie-banner') ? 'COOKIE BANNER' : el?.className }; });
    log('3 Skip intro under the banner?', skipHit);
    await p.keyboard.press('Escape');
    await sleep(3200);
    const h = await p.evaluate(() => {
      const hero = document.querySelector('.wb-hero').getBoundingClientRect();
      const W = hero.width, H = hero.height, k = Math.max(W / 1920, H / 1080), oy = (H - 1080 * k) / 2;
      const vp = hero.top + scrollY + oy + 697 * k;
      const ctas = document.querySelector('.wb-ctas').getBoundingClientRect();
      const i = document.querySelector('.wb-mark-row i');
      return { vpY: Math.round(vp), ctaTop: Math.round(ctas.top + scrollY), ctaBottom: Math.round(ctas.bottom + scrollY), markFilter: getComputedStyle(i).filter, inlineFilter: i.style.filter, plateTop: Math.round(document.querySelector('.wb-get-plate').getBoundingClientRect().top + scrollY) };
    });
    log('3 hero VP vs CTA (1141x636)', h);
    await p.screenshot({ path: path.join(OUT, 'hero-1141.png') });

    // 4. "Take it for a drive": where does it land?
    await p.addStyleTag({ content: HIDE_COOKIE });
    await p.click('[data-wb-start]');
    await sleep(1800);
    const land = await p.evaluate(() => { const r = document.querySelector('[data-wb-face]').getBoundingClientRect(); const vis = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(41, r.top)) / r.height; return { faceTop: Math.round(r.top), faceH: Math.round(r.height), visible: +vis.toFixed(2), sound: document.querySelector('[data-wb-sound]').getAttribute('aria-pressed') }; });
    log('4 Take it for a drive lands', land);
    await p.screenshot({ path: path.join(OUT, 'drive-cta-1141.png') });
    const eng = await p.evaluate(() => { const b = document.querySelector('[data-wb-sound]'); return b ? { label: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') } : null; }); // the engine key went 2026-11-21
    log('4b SOUND key while playing', eng);

    // 5. the preset glide past the end stops (Default -> Center Line -> Pad Panorama)
    for (const idx of [3, 11]) {
      await p.evaluate(() => { window.__wv = []; window.__lcd = []; const w = document.querySelector('.wb-hit--knob[aria-label="Width"]'); const lcd = document.querySelector('.wb-lcd--trip'); new MutationObserver(() => { window.__wv.push(+w.getAttribute('aria-valuenow')); window.__lcd.push(lcd.textContent); }).observe(w, { attributes: true, attributeFilter: ['aria-valuenow'] }); });
      await p.evaluate((i) => document.querySelector(`[data-preset="${i}"]`).click(), idx);
      await sleep(1600);
      const g = await p.evaluate(() => ({ min: Math.min(...window.__wv), max: Math.max(...window.__wv), last: window.__wv.at(-1), lcdOut: [...new Set(window.__lcd)].filter((t) => /WIDTH (-\d|2[1-9]\d)/.test(t)).slice(0, 3) }));
      log(`5 preset glide to card ${idx}`, g);
    }

    // 6. shortcuts from the top of the page + held H flashes
    await p.evaluate(() => window.scrollTo(0, 0)); await sleep(800);
    await p.evaluate(() => document.activeElement?.blur());
    const monoBefore = await p.evaluate(() => document.querySelector('.wb-hit[aria-label="Mono"]').getAttribute('aria-pressed'));
    await p.keyboard.press('m');
    await sleep(300);
    const monoAfter = await p.evaluate(() => ({ mono: document.querySelector('.wb-hit[aria-label="Mono"]').getAttribute('aria-pressed'), y: scrollY }));
    log('6 "m" pressed at the top', `MONO ${monoBefore} -> ${monoAfter.mono} (scrollY ${monoAfter.y})`);
    await p.keyboard.press('m');
    await p.evaluate(() => { window.__fl = 0; document.querySelector('[data-wb-flash]').addEventListener('animationstart', () => window.__fl++); });
    const t0 = Date.now();
    for (let i = 0; i < 24; i++) { await p.keyboard.down('h'); await sleep(33); }
    await p.keyboard.up('h');
    const dt = Date.now() - t0;
    await sleep(300);
    log('6 H held (24 keydowns)', `${await p.evaluate(() => window.__fl)} full-page flashes in ${dt} ms`);
    await ctx.close();
  }

  // 7. the SOUND pill over the footer links at the page end (cookie banner answered)
  {
    const ctx = await ctxFor(chrome); const p = await ctx.newPage();
    await p.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await p.click('#cookie-decline');
    await p.keyboard.press('Escape');
    await p.mouse.move(570, 300);
    for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 700); await sleep(90); }
    await sleep(2500);
    const f = await p.evaluate(() => {
      const out = {};
      for (const [k, sel] of [['x', 'footer a[href*="x.com"]'], ['facebook', 'footer a[href*="facebook"]']]) {
        const a = document.querySelector(sel); if (!a) { out[k] = 'missing'; continue; }
        const r = a.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        out[k] = el?.closest('[data-wb-sound]') ? 'SOUND PILL on top' : (el?.closest('a') === a ? 'link ok' : el?.className);
      }
      out.scroll = Math.round(scrollY) + ' / ' + Math.round(document.documentElement.scrollHeight - innerHeight);
      return out;
    });
    log('7 footer links at the page end', f);
    await p.screenshot({ path: path.join(OUT, 'footer-1141.png') });
    await ctx.close();
  }

  // 8. no JavaScript: what stays invisible
  {
    const ctx = await ctxFor(chrome, { javaScriptEnabled: false }); const p = await ctx.newPage();
    await p.goto(BASE + '/widebeam', { waitUntil: 'load' });
    await sleep(800);
    const n = await p.evaluate(() => [...document.querySelectorAll('[data-wb-reveal]')].filter((e) => getComputedStyle(e).opacity === '0').map((e) => e.className.split(' ')[0]));
    const odo = await p.evaluate(() => [...document.querySelectorAll('[data-odo]')].map((e) => e.textContent));
    log('8 no-JS blocks at opacity 0', `${n.length}: ${n.join(', ')}`);
    log('8 no-JS odometers read', odo);
    await ctx.close();
  }
  await chrome.close();

  // 9. a sideways phone (WebKit): does the dash fit?
  {
    const wk = await webkit.launch();
    const ctx = await wk.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await ctx.route(STUB, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));
    const p = await ctx.newPage();
    await p.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    const s = await p.evaluate(() => { const r = document.querySelector('[data-wb-face]').getBoundingClientRect(); const cb = document.getElementById('cookie-banner')?.getBoundingClientRect(); return { faceW: Math.round(r.width), faceH: Math.round(r.height), viewportH: innerHeight, cookieBanner: cb ? { top: Math.round(cb.top), h: Math.round(cb.height) } : null }; });
    log('9 sideways 844x390 (WebKit)', s);
    await wk.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
