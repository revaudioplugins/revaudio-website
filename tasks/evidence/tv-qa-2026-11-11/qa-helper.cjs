// Home TV QA kit (2026-11-11, Dan: "test and check the home tv ... real world and real internet ... all the buttons
// work and clickable"). Every tester runs ITS OWN Playwright browser through this file (never the Playwright MCP: it
// is one shared browser). The site = the feat/tv-sells production build, served at http://127.0.0.1:4491.
//
// Nothing leaves this Mac: every request outside 127.0.0.1 is stopped and logged.
//   - the licence worker's /download/register and /form-once (the sign-up forms) get a FAKE answer and their bodies
//     are recorded: opts.worker = 'ok' (default, {ok:true}) | 'fail' ({ok:false,error:'invalid_email'}) |
//     'slow' (ok after 4 s) | 'down' (network error)
//   - Paddle never loads: window.Paddle is a recorder (window.__qa.paddle: init / open calls with their items)
//   - Google Analytics, the Meta pixel, Cloudflare analytics: blocked
//
//   const qa = require('<this file>');
//   const t = await qa.open({ engine: 'webkit', size: 'phone-390', path: '/', lane: 'phone' });
//   await t.shot('list');                 // <lane>/shots/001-webkit-phone-390-list.png
//   ... t.page, t.context, t.log (blocked, posts, errors, console, bad, paddle via t.paddle()) ...
//   await t.close();                      // returns the log
//
// Network for the real-internet lane (Chromium only; WebKit gets per-request latency):
//   opts.net = 'slow3g' | 'fast3g' | '4g' | null, opts.cpu = 4 (CPU slowdown), opts.latency = ms (WebKit)
const fs = require('fs');
const path = require('path');
const pw = require('/Users/danavivi/projects/revaudio/revaudio-website/.claude/worktrees/tv-sells/node_modules/playwright');

const BASE = 'http://127.0.0.1:4491';
const ROOT = '/private/tmp/claude-501/-Users-danavivi/1be1ada2-cab5-409b-9b41-2958b202818b/scratchpad/qa';
const TOUCH = { isMobile: true, hasTouch: true };
// the plan's 9 sizes (tasks/home-library-plan.md); 1141 x 636 = Dan's own Safari window
const SIZES = {
  'laptop-1280': { viewport: { width: 1280, height: 665 }, deviceScaleFactor: 2 },
  'laptop-1141': { viewport: { width: 1141, height: 636 }, deviceScaleFactor: 2 },
  'laptop-1440': { viewport: { width: 1440, height: 789 }, deviceScaleFactor: 1 },
  'laptop-1728': { viewport: { width: 1728, height: 992 }, deviceScaleFactor: 2 },
  'tablet-860': { viewport: { width: 860, height: 1000 }, deviceScaleFactor: 2 },
  'phone-390': { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, ...TOUCH },
  'phone-360': { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, ...TOUCH },
  'phone-375': { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, ...TOUCH },
  'phone-393': { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, ...TOUCH },
};
// Chrome DevTools' presets (bytes / s, ms)
const NETS = {
  slow3g: { latency: 400, downloadThroughput: (400 * 1000) / 8, uploadThroughput: (400 * 1000) / 8 },
  fast3g: { latency: 150, downloadThroughput: (1600 * 1000) / 8, uploadThroughput: (750 * 1000) / 8 },
  '4g': { latency: 60, downloadThroughput: (9000 * 1000) / 8, uploadThroughput: (1500 * 1000) / 8 },
};
const CORS = { 'access-control-allow-origin': BASE, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' };

async function open(opts = {}) {
  const { engine = 'chromium', size = 'laptop-1280', path: p = '/', lane = 'misc', worker = 'ok', net = null, cpu = 1,
    latency = 0, storage = null, wait = 'domcontentloaded', colorScheme = 'dark', reducedMotion = 'no-preference' } = opts;
  const dev = SIZES[size];
  if (!dev) throw new Error('unknown size ' + size + ' (one of ' + Object.keys(SIZES).join(', ') + ')');
  const dir = path.join(ROOT, lane, 'shots');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await pw[engine].launch({ headless: true });
  const ua = dev.isMobile ? (engine === 'webkit' ? pw.devices['iPhone 14'].userAgent : pw.devices['Pixel 7'].userAgent) : undefined;
  const ctxOpts = { ...dev, colorScheme, reducedMotion, ...(ua ? { userAgent: ua } : {}), ...(storage ? { storageState: storage } : {}) };
  if (engine === 'firefox') delete ctxOpts.isMobile;
  const context = await browser.newContext(ctxOpts);
  const log = { blocked: [], posts: [], errors: [], console: [], bad: [], popups: [] };
  await context.addInitScript(() => {
    window.__qa = { paddle: [] };
    const rec = (k) => (o) => { try { window.__qa.paddle.push([k, JSON.parse(JSON.stringify(o || null))]); } catch (e) { window.__qa.paddle.push([k, String(o)]); } };
    window.Paddle = { Environment: { set: rec('env') }, Initialize: rec('init'), Update: rec('update'), Checkout: { open: rec('open'), close: rec('close') } };
  });
  await context.route('**/*', async (route) => {
    const req = route.request();
    let u;
    try { u = new URL(req.url()); } catch (e) { return route.continue(); }
    if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
      if (latency) await new Promise((r) => setTimeout(r, latency));
      return route.continue();
    }
    if (/\/(download\/register|form-once)$/.test(u.pathname)) {
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      let body = req.postData();
      try { body = JSON.parse(body || 'null'); } catch (e) { /* keep the text */ }
      log.posts.push({ url: req.url(), body, worker, at: new Date().toISOString() });
      if (worker === 'down') return route.abort('failed');
      if (worker === 'slow') await new Promise((r) => setTimeout(r, 4000));
      const answer = worker === 'fail' ? { ok: false, error: 'invalid_email' } : { ok: true };
      return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(answer) });
    }
    log.blocked.push(req.method() + ' ' + req.url().slice(0, 180));
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => log.errors.push(String(e && e.message ? e.message : e).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(m.type() + ': ' + m.text().slice(0, 220)); });
  page.on('response', (r) => { try { const u = new URL(r.url()); if ((u.hostname === '127.0.0.1') && r.status() >= 400) log.bad.push(r.status() + ' ' + r.url().slice(0, 180)); } catch (e) {} });
  page.on('popup', (pp) => log.popups.push(pp.url()));
  if (engine === 'chromium' && (net || cpu > 1)) {
    const cdp = await context.newCDPSession(page);
    if (net) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NETS[net] });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  }
  let n = 0;
  const t = {
    browser, context, page, log, engine, size, BASE,
    url: (p2) => BASE + p2,
    goto: (p2, o = {}) => page.goto(BASE + p2, { waitUntil: wait, timeout: 180000, ...o }),
    shot: async (name, o = {}) => {
      const f = path.join(dir, `${String(++n).padStart(3, '0')}-${engine}-${size}-${name.replace(/[^a-z0-9_-]+/gi, '-')}.png`);
      await page.screenshot({ path: f, ...o });
      return f;
    },
    paddle: () => page.evaluate(() => (window.__qa ? window.__qa.paddle : null)),
    // the TV parked as the site parks it (#plugins' top under the nav: the site's own landY), and ready
    toTV: async () => {
      await page.waitForSelector('[data-wordwall]', { timeout: 120000 });
      await page.evaluate(() => {
        const sec = document.getElementById('plugins');
        const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-nav-h')) || 44;
        if (sec) window.scrollTo({ top: Math.ceil(window.scrollY + sec.getBoundingClientRect().top - nav), behavior: 'instant' });
      });
      await page.waitForTimeout(600);
    },
    close: async () => { const l = { ...log, paddle: await t.paddle().catch(() => null) }; await browser.close(); return l; },
  };
  if (p !== null) await t.goto(p);
  return t;
}

module.exports = { open, SIZES, NETS, BASE, ROOT };
