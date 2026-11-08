// Shared browser helper for the TV test-visitor walk. One browser per run, one folder per visitor.
// Usage (from a visitor's own step script):
//   const { session } = require('<repo>/tools/tv-walk/walk.cjs');
//   session('noa', async ({ page, shot, note }) => { await page.goto('/'); await shot('home'); });
// State (cookies, localStorage) carries over between runs of the same visitor. Every request off the
// local dev server is blocked, except fonts; the trial sign-up POSTs get a fake {ok:true}. Nothing live is reached.
// Needs the dev server: `npx astro dev --port 4480 --host 127.0.0.1`. Shots and logs go to $TV_WALK_OUT (default: the
// system temp folder's tv-walk/<visitor>/), never into the repo.
const path = require('path');
const fs = require('fs');
const os = require('os');
const pw = require('playwright');

const BASE = 'http://127.0.0.1:4480';
const ROOT = process.env.TV_WALK_OUT || path.join(os.tmpdir(), 'tv-walk');
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const UA_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';

const PROFILES = {
  noa: { engine: 'webkit', ctx: { viewport: { width: 393, height: 659 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA_IPHONE } },
  priya: { engine: 'chromium', ctx: { ...pw.devices['Pixel 7'] } },
  marcus: { engine: 'webkit', ctx: { viewport: { width: 1141, height: 636 }, deviceScaleFactor: 2, userAgent: UA_SAFARI } },
  // 1440x900 at 150 % browser zoom = a 960x600 CSS viewport at 1.5 px per CSS px
  walter: { engine: 'chromium', ctx: { viewport: { width: 960, height: 600 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce', forcedColors: 'active' } },
  smoke: { engine: 'chromium', ctx: { viewport: { width: 1280, height: 800 } } },
};

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };

async function session(who, fn, opts = {}) {
  const prof = PROFILES[who];
  if (!prof) throw new Error('unknown visitor ' + who);
  const dir = path.join(ROOT, who);
  const shots = path.join(dir, 'shots');
  fs.mkdirSync(shots, { recursive: true });
  const statePath = path.join(dir, 'state.json');
  const logPath = path.join(dir, 'log.txt');
  const log = (line) => fs.appendFileSync(logPath, new Date().toISOString().slice(11, 19) + ' ' + line + '\n');

  const browser = await pw[prof.engine].launch();
  const ctxOpts = { ...prof.ctx, baseURL: BASE, ...(opts.ctx || {}) };
  if (fs.existsSync(statePath) && !opts.fresh) ctxOpts.storageState = statePath;
  const context = await browser.newContext(ctxOpts);

  await context.route('**/*', (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') return route.continue();
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) && req.method() === 'GET') return route.continue();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (req.method() === 'POST' && /\/(download\/register|form-once)$/.test(u.pathname)) {
      log('FAKE OK (sign-up, never sent): ' + req.method() + ' ' + u.host + u.pathname + ' ' + (req.postData() || '').slice(0, 200));
      return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: '{"ok":true}' });
    }
    log('BLOCKED: ' + req.method() + ' ' + u.host + u.pathname);
    return route.abort();
  });

  const page = await context.newPage();
  page.on('pageerror', (e) => log('PAGE ERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') log('CONSOLE ERROR: ' + m.text().slice(0, 300)); });
  page.on('dialog', (d) => { log('DIALOG: ' + d.message()); d.dismiss().catch(() => {}); });
  page.setDefaultTimeout(15000);

  let n = fs.readdirSync(shots).filter((f) => f.endsWith('.png')).length;
  const shot = async (label, o = {}) => {
    n += 1;
    const file = path.join(shots, String(n).padStart(3, '0') + '-' + String(label).replace(/[^a-z0-9-]+/gi, '-').slice(0, 50) + '.png');
    try {
      await page.screenshot({ path: file, fullPage: !!o.full, timeout: 20000 });
    } catch (e) {
      await page.screenshot({ path: file, fullPage: !!o.full, timeout: 20000, animations: 'disabled', caret: 'initial' });
    }
    log('SHOT ' + path.basename(file));
    return file;
  };
  const note = (t) => log('NOTE ' + t);

  try {
    if (opts.url !== undefined) await page.goto(opts.url);
    await fn({ page, context, shot, note, log, BASE });
  } catch (e) {
    log('STEP FAILED: ' + e.message.split('\n')[0]);
    try { await shot('step-failed'); } catch (_) {}
    console.error('STEP FAILED: ' + e.message.split('\n')[0]);
  } finally {
    try { await context.storageState({ path: statePath }); } catch (_) {}
    log('URL at end: ' + page.url());
    console.log('URL at end: ' + page.url());
    await browser.close();
  }
}

module.exports = { session, BASE, PROFILES };
