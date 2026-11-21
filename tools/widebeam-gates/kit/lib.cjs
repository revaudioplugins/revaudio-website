// Shared helpers for the WIDE BEAM gate kit. Run with NODE_PATH=<repo>/node_modules (see README.md).
const path = require('path');
const { chromium, webkit } = require('@playwright/test');

exports.GATES = path.resolve(__dirname, '..');
exports.RUNS = path.join(exports.GATES, 'runs');
exports.BASE = (argv = process.argv) => (process.env.BASE || '').replace(/\/$/, '');

// The seven sizes (name -> context options). Phones: mobile + touch + DPR 3. Laptops: DPR 1.
exports.SIZES = {
  L1141: { viewport: { width: 1141, height: 636 }, deviceScaleFactor: 1 },
  L1280: { viewport: { width: 1280, height: 665 }, deviceScaleFactor: 1 },
  L1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  L1728: { viewport: { width: 1728, height: 1000 }, deviceScaleFactor: 1 },
  P390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  P360: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  S844: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
};

// launch(engine, deterministic): 'chromium' = installed Chrome, 'webkit' = Playwright WebKit. deterministic=true (section shots)
// makes Chrome raster in software with a fixed colour profile, so gradients and shadows do not wobble by +-1 between runs.
exports.launch = (engine, deterministic = false) => (engine === 'webkit' ? webkit.launch() : chromium.launch({ channel: 'chrome', args: deterministic ? ['--disable-gpu', '--force-color-profile=srgb'] : [] }));

// the licence worker and analytics must never be reached
exports.STUB_RE = /revlimiter-license[.]revaudio[.]workers[.]dev|cloudflareinsights/;
exports.stub = (ctx) => ctx.route(exports.STUB_RE, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));

// newCtx(browser, sizeName, extra): a stubbed context. reducedMotion defaults to 'reduce' (shots); pass reducedMotion:'no-preference' for behaviour.
exports.newCtx = async (browser, sizeName, extra = {}) => {
  const base = exports.SIZES[sizeName];
  if (!base) throw new Error('unknown size ' + sizeName);
  const ctx = await browser.newContext({ ...base, reducedMotion: 'reduce', ...extra });
  await exports.stub(ctx);
  return ctx;
};

exports.HIDE_COOKIE_CSS = '#cookie-banner,[class*="cookie"]{display:none!important}';
exports.hideCookie = (page) => page.addStyleTag({ content: exports.HIDE_COOKIE_CSS }).catch(() => {});

exports.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
exports.parseList = (argv, flag, def) => { const i = argv.indexOf(flag); return i < 0 ? def : argv[i + 1].split(','); };
