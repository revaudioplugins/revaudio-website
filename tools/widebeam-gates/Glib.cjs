// Shared helpers for the WIDE BEAM gates G0..G13 (lane T). Run with NODE_PATH=<repo>/node_modules.
//   node G3.cjs <base> [--engines chromium,webkit,firefox] [--plant <name>] [--timing] [--sizes L1141,P390] [--only <check-substring>]
// Every gate prints rows:  @@R <tab> gate <tab> check <tab> PASS|FAIL|MISSING|SKIP <tab> measured value
// MISSING = a contract hook the check needs is not on the page (counted as FAIL by run-gates.sh: a renamed hook or a lane not merged yet).
// SKIP = the check cannot run here (names why); never counted as a pass. The licence worker and analytics are stubbed in EVERY context.
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const pw = require('@playwright/test');

const G = exports;
G.GATES = __dirname;
G.REPO = process.env.WB_REPO || path.resolve(__dirname, '..', '..'); // the repo this folder sits in (tools/widebeam-gates)
G.BASELINE = process.env.WB_BASELINE || path.join(__dirname, 'baseline'); // not in git: make one with kit/sections.cjs (README.md)
G.KIT = path.join(__dirname, 'kit');
G.AXE = path.join(__dirname, 'vendor', 'axe.min.js'); // axe-core 4.10.2, vendored
G.OUT = process.env.OUT_DIR || path.join(__dirname, 'runs', 'gate-out');
fs.mkdirSync(G.OUT, { recursive: true });

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : (argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[i + 1]); };
G.ARGS = {
  base: (argv.find((a) => /^https?:/.test(a)) || process.env.BASE || '').replace(/\/$/, ''),
  engines: String(flag('engines', 'chromium,webkit')).split(','),
  plant: flag('plant', null),
  timing: !!flag('timing', false),
  sizes: flag('sizes', null) && String(flag('sizes')).split(','),
  only: flag('only', null),
  fixture: (flag('fixture', process.env.FIXTURE || '') || '').replace(/\/$/, ''),
  prod: !!flag('prod', false),
};
G.BASE = G.ARGS.base;

// ---------- results ----------
G.rows = [];
G.row = (gate, check, status, value = '') => {
  const v = String(value).replace(/[\t\r\n]+/g, ' ').slice(0, 300);
  G.rows.push({ gate, check, status, value: v });
  console.log(['@@R', gate, check, status, v].join('\t'));
};
G.ok = (gate, check, cond, value = '') => G.row(gate, check, cond ? 'PASS' : 'FAIL', value);
G.missing = (gate, check, what) => G.row(gate, check, 'MISSING', what);
G.skip = (gate, check, why) => G.row(gate, check, 'SKIP', why);
// run one check: an exception is a FAIL row (never a silent pass). Honours --only.
G.step = async (gate, check, fn) => {
  if (G.ARGS.only && !(gate + ' ' + check).toLowerCase().includes(String(G.ARGS.only).toLowerCase())) return;
  try { await fn(); } catch (e) { G.row(gate, check, 'FAIL', 'ERROR ' + String(e && e.message || e).split('\n')[0]); }
};
G.main = (fn) => fn().then(() => process.exit(0)).catch((e) => { console.error(e); G.row('?', 'script', 'FAIL', 'ERROR ' + String(e.message).split('\n')[0]); process.exit(1); });
G.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- sizes: the kit's seven + 1920x953, a 901-1099 px width and iPad. Laptops DPR 2, phones/tablets 3 / 2 (G8, G11) ----------
const phone = (w, h) => ({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
G.SIZES = {
  L1141: { viewport: { width: 1141, height: 636 }, deviceScaleFactor: 2 },
  L1280: { viewport: { width: 1280, height: 665 }, deviceScaleFactor: 2 },
  L1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  L1728: { viewport: { width: 1728, height: 1000 }, deviceScaleFactor: 2 },
  L1920: { viewport: { width: 1920, height: 953 }, deviceScaleFactor: 1 },
  W1000: { viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 }, // the 901-1099 px band
  P390: phone(390, 844), P360: phone(360, 740), S844: phone(844, 390),
  T820: { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, // iPad portrait
  T1180: { viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, // iPad landscape
};
G.ALL_SIZES = Object.keys(G.SIZES);
G.LAPTOPS = ['L1141', 'L1280', 'L1440', 'L1728'];
G.sizesOr = (def) => (G.ARGS.sizes || def);
G.isTouchSize = (n) => !!G.SIZES[n].isMobile;

// ---------- launching ----------
// Chrome's own default: the AudioContext is suspended until a real gesture (verified: 'suspended' at load; the flag --autoplay-policy=user-gesture-required made it 'running', so it is NOT passed).
G.launch = (engine) => {
  if (engine === 'webkit') return pw.webkit.launch();
  if (engine === 'firefox') return pw.firefox.launch(); // Firefox's own default: Web Audio stays blocked until a real gesture
  return pw.chromium.launch({ channel: 'chrome' });
};
G.STUB_RE = /revlimiter-license[.]revaudio[.]workers[.]dev|cloudflareinsights|workers[.]dev/;
G.stub = (ctx) => ctx.route(G.STUB_RE, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));
// context options a size gives, minus what an engine cannot do (Firefox has no isMobile)
G.sizeOpts = (engine, size, extra = {}) => {
  const o = { ...G.SIZES[size], ...extra };
  if (engine === 'firefox') { delete o.isMobile; }
  return o;
};
G.newCtx = async (browser, engine, size, extra = {}) => {
  const { plant, ...rest } = extra;
  const ctx = await browser.newContext({ reducedMotion: 'no-preference', ...G.sizeOpts(engine, size, rest) });
  await G.stub(ctx);
  const pl = plant === false ? null : (plant || G.ARGS.plant);
  if (pl) await G.applyPlant(ctx, pl);
  return ctx;
};
// a fresh page, watched for console / page errors (the one known dev-only noise is filtered: the Astro dev toolbar's 403)
G.DEV_NOISE = /dev-toolbar|\/@astro\/|astro\/dist\/runtime\/client\/dev-toolbar/;
G.watch = (page) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const u = (m.location() && m.location().url) || '';
    if (G.DEV_NOISE.test(u) || G.DEV_NOISE.test(m.text())) return;
    errs.push('console: ' + m.text().slice(0, 200) + (u ? ' @' + u.replace(/^https?:\/\/[^/]+/, '').slice(0, 80) : ''));
  });
  page.on('requestfailed', (r) => { const u = r.url(); if (G.DEV_NOISE.test(u) || /cloudflareinsights|workers\.dev|paddle|googletagmanager|google-analytics|fonts\.g/.test(u)) return; errs.push('requestfailed: ' + u.replace(/^https?:\/\/[^/]+/, '').slice(0, 100) + ' ' + (r.failure() && r.failure().errorText)); });
  page.on('response', (r) => { if (r.status() >= 400 && !G.DEV_NOISE.test(r.url()) && !/cloudflareinsights|workers\.dev|paddle|googletagmanager|google-analytics|fonts\.g/.test(r.url()) && !/\?404/.test(r.url())) errs.push(`http ${r.status()}: ` + r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 100)); });
  return errs;
};
G.page = async (browser, engine, size, extra = {}) => {
  const ctx = await G.newCtx(browser, engine, size, extra);
  const page = await ctx.newPage();
  page.errs = G.watch(page);
  return { ctx, page };
};
// goto /widebeam; the intro + the cookie banner need a moment
G.goto = async (page, base = G.BASE, p = '/widebeam', wait = 2200, opts = {}) => {
  await page.goto(base + p, { waitUntil: 'domcontentloaded', ...opts });
  await G.sleep(wait);
};
G.HIDE_COOKIE_CSS = '#cookie-banner,[class*="cookie"]{display:none!important}';
G.hideCookie = (page) => page.addStyleTag({ content: G.HIDE_COOKIE_CSS }).catch(() => {});
G.declineCookie = async (page) => { const b = page.locator('#cookie-decline'); if (await b.count()) await b.click({ timeout: 4000 }).catch(() => {}); await G.sleep(500); };

// ---------- reading the page ----------
G.soundOn = (page) => page.evaluate(() => { const s = document.querySelector('[data-wb-sound]'); return !!s && s.getAttribute('aria-pressed') === 'true' || !!document.querySelector('.wb-page.is-playing'); });
G.rect = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, top: r.top, bottom: r.bottom, left: r.left, right: r.right }; }, sel);
G.has = (page, sel) => page.evaluate((s) => !!document.querySelector(s), sel);
// sections Dan cut from his page map (2026-11-22). A row that needs one of them SKIPs, with this reason, ONLY while the
// section itself is absent from the page: a section that is back (or still there with a broken hook) runs its row as
// before, so a renamed hook is still MISSING.
G.CUT = { presets: ['#wb-presets', 'the glove box'], story: ['#wb-story', 'the stereo road'] };
G.CUT_WHY = 'section cut by Dan 2026-11-22 (page map)';
G.isCut = async (page, which) => !(await G.has(page, G.CUT[which][0]));
// true (and the SKIP row written) when `which` is off the page
G.skipIfCut = async (page, gate, check, which) => { if (!(await G.isCut(page, which))) return false; G.skip(gate, check, `${G.CUT[which][1]} (${G.CUT[which][0]}): ${G.CUT_WHY}`); return true; };
G.knobSel = (label) => `[role=slider][aria-label="${label}"]`;
G.val = (page, label) => page.evaluate((l) => { const e = document.querySelector(`[role=slider][aria-label="${l}"]`); return e ? Number(e.getAttribute('aria-valuenow')) : null; }, label);
G.scrollY = (page) => page.evaluate(() => Math.round(scrollY));
G.maxScroll = (page) => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
// a scroll the way a visitor does it: the wheel through Lenis (desktop); window.scrollTo + a wait where there is no wheel
G.scrollBy = async (page, dy, touch = false) => {
  if (touch) { await page.evaluate((d) => window.scrollBy(0, d), dy); await G.sleep(250); return; }
  const v = page.viewportSize();
  await page.mouse.move(v.width / 2, Math.min(v.height - 5, 300));
  let left = dy;
  while (Math.abs(left) > 1) { const s = Math.max(-500, Math.min(500, left)); await page.mouse.wheel(0, s); left -= s; await G.sleep(70); }
  await G.sleep(900);
};
// bring an element near the middle (wheel / scrollTo, never scrollIntoView: Lenis goes stale)
G.bring = async (page, sel, touch = false, block = 0.5) => {
  for (let i = 0; i < 25; i++) {
    const r = await G.rect(page, sel); if (!r) return false;
    const vh = page.viewportSize().height;
    const want = (vh - 44) * block + 44 - r.h / 2;
    const d = r.top - want;
    if (Math.abs(d) < 24) return true;
    if (touch) { await page.evaluate((d) => window.scrollBy(0, d), d); await G.sleep(300); } else { await page.mouse.move(page.viewportSize().width / 2, 330); await page.mouse.wheel(0, Math.max(-600, Math.min(600, d))); await G.sleep(260); }
  }
  return true;
};
G.toEnd = async (page, touch = false) => {
  for (let i = 0; i < 60; i++) {
    if (touch) { await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await G.sleep(350); }
    else { await page.mouse.move(page.viewportSize().width / 2, 300); await page.mouse.wheel(0, 900); await G.sleep(90); }
    if (await page.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 2)) { await G.sleep(500); if (await page.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 2)) return true; }
  }
  return false;
};
// the hero's vanishing point (video 969,697 of 1920x1080, object-fit: cover) in page y, from the plan's repro
G.vanishingY = (page) => page.evaluate(() => { const hero = document.querySelector('.wb-hero').getBoundingClientRect(); const W = hero.width, H = hero.height, k = Math.max(W / 1920, H / 1080), oy = (H - 1080 * k) / 2; return Math.round(hero.top + scrollY + oy + 697 * k); });
// the lowest visible painted thing in the hero's column (the hero key, the signature...), page y
G.columnBottom = (page) => page.evaluate(() => {
  const col = document.querySelector('[data-wb-hero-inner]'); if (!col) return null;
  let bottom = 0;
  for (const e of col.querySelectorAll('*')) {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || e.closest('[aria-hidden="true"]') && !e.closest('h1')) continue;
    if (e.children.length && !(e.textContent || '').trim()) continue;
    bottom = Math.max(bottom, r.bottom + scrollY);
  }
  return Math.round(bottom);
});

// ---------- the dev server's page response, read as text (HTML + the JS it loads, followed through its imports) ----------
const http = require('http'), https = require('https');
G.fetchText = (url) => new Promise((resolve, reject) => {
  const m = url.startsWith('https') ? https : http;
  m.get(url, { headers: { 'user-agent': 'wb-gates' } }, (res) => { const c = []; res.on('data', (d) => c.push(d)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(c).toString('utf8') })); }).on('error', reject);
});
// strip comments (a dev-served TS module still carries its header comments) without eating "https://" in strings
G.stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1').replace(/<!--[\s\S]*?-->/g, '');
// follow a page's scripts: the HTML's <script src>, inline module text, then every static / dynamic import, for same-origin files
G.crawlJs = async (base, html, plant) => {
  const seen = new Map(); const queue = [];
  const addUrl = (u, from) => { try { const a = new URL(u, from || base + '/widebeam'); if (a.origin !== new URL(base).origin) return; const k = a.pathname + a.search; if (/dev-toolbar|\/@vite\/client|\/@astro\/|\.css(\?|$)|astro\/dist\/runtime|\/node_modules\/\.vite\/deps\/(gsap|lenis)/.test(k) && !/\/src\//.test(k)) return; if (!seen.has(k)) { seen.set(k, null); queue.push([a.href, k]); } } catch {} };
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) addUrl(m[1]);
  const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const scan = (txt, from) => { for (const m of txt.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) { if (/^(\.|\/)/.test(m[1])) addUrl(m[1], from); } };
  inline.forEach((t) => scan(t));
  let n = 0;
  while (queue.length && n++ < 400) {
    const [href, k] = queue.shift();
    let r; try { r = await G.fetchText(href); } catch { continue; }
    if (r.status !== 200) continue;
    let body = r.body; if (plant) body = G.plantText(plant, href, body);
    seen.set(k, body); scan(body, href);
  }
  return { files: [...seen.entries()].filter(([, v]) => v != null).map(([k, v]) => ({ url: k, body: v })), inline };
};

// ---------- planted violations (a routed response / a fixture), to prove a gate CAN fail ----------
// plantText(name, url, body): the mutated body, or the same body when the plant is not for this response
G.plantText = (plant, url, body) => {
  const isHtml = /<html|<!doctype/i.test(body.slice(0, 400));
  const isPage = isHtml && /data-wb-page/.test(body);
  const isWbJs = !isHtml && /\/src\/lib\/widebeam\/(hero|furniture)\.ts|_astro\/.*widebeam/i.test(url) && !/data\/widebeam/.test(url);
  const intoPage = (h) => body.replace(/(<div[^>]*\sdata-wb-page[^>]*>)/, '$1' + h);
  switch (plant) {
    case 'aax': return isPage ? intoPage('<p>Mac VST3 · AU · AAX</p>') : body;
    case 'aax-js': return isWbJs ? body + '\nconst __plant = "Pro Tools (AAX)";\n' : body;
    case 'buynow': return isPage ? intoPage('<button type="button" class="rv-btn">Buy now</button>') : body;
    case 'notify': return isPage ? intoPage('<p>Notify me</p>') : body;
    case 'trialpromise': return isPage ? intoPage('<p>Get your free 30-day trial, with getting-started emails and a heads-up before your trial ends.</p>') : body;
    case 'trial-js': return isWbJs ? body + '\nconst __plant = "Start the free trial now and it rolls straight into the full version.";\n' : body;
    case 'emaillabel': return isPage ? body.replace('id="wb-trial-email"', 'id="wb-trial-email" aria-label="Your email, we send the WIDE BEAM download link here"') : body;
    case 'nojs-hide': return isPage ? body.replace('</head>', '<style>.wb-get-plate,.wb-head{opacity:0!important}</style></head>') : body;
    case 'odo0': return isPage ? body.replace(/(data-odo="\d+"[^>]*>)\d+(<)/g, '$10$2') : body;
    case 'tallhero': return isPage ? body.replace('</head>', '<style>.wb-hero{min-height:calc(100svh + 60px)!important}</style></head>') : body;
    case 'ytframe': return isPage ? intoPage('<iframe src="https://www.youtube-nocookie.com/embed/PLANTED0001" width="10" height="10" title="planted"></iframe>') : body;
    // stage 4: the planted fault moved from the master (x5 on the master now meets lane D's limiter and -0.3 dBFS ceiling,
    // and A and B share it, so nothing the gate guards could go wrong) to the WIDE BEAM (wet) side only, where the engine drives it (set()): +14 dB on B
    case 'loud': return /\/src\/lib\/widebeam\/audio\.ts/.test(url) ? body.replace('to(n.wet.gain, p.power ? mix * cruise(p) : 0)', 'to(n.wet.gain, p.power ? 5 * mix * cruise(p) : 0)') : body;
    case 'lowcontrast': return isPage ? body.replace('</head>', '<style>.wb-get-micro,.wb-get-notice,.wb-headsub{color:#5a554b!important}</style></head>') : body;
    // stage 4 (G6): /widebeam wearing a live sale strip (r-base-salestrip coming back); the reveals pinned hidden; a deferred part left bare
    case 'salestrip': return isPage ? intoPage('<div class="ss" data-sale-strip style="display:block!important;height:36px;background:#c00;color:#fff">Black Friday: 30% off everything</div>').replace('</head>', "<script>document.documentElement.dataset.sale='bf'</script></head>") : body;
    case 'revealstuck': return isPage ? body.replace('</head>', '<style>[data-reveal]{opacity:0!important}</style></head>') : body;
    case 'artbare': return isPage ? body.replace('</head>', '<style>.wb-part-road{background-image:none!important}</style></head>') : body;
    case 'sitemap': return body;
    default: return body;
  }
};
G.applyPlant = async (ctx, plant) => {
  if (!plant) return;
  if (plant === 'tab-sound') { // a page that starts the music on Tab: what G3 must catch
    await ctx.addInitScript(() => document.addEventListener('keydown', (e) => { if (e.key === 'Tab') setTimeout(() => { const s = document.querySelector('[data-wb-sound]'); if (s && s.getAttribute('aria-pressed') !== 'true') s.setAttribute('aria-pressed', 'true'); }, 50); }, true));
    return;
  }
  if (plant === 'buynote') { // text that only exists after a click (copy-02 lived in init.ts): the static greps cannot see it
    await ctx.addInitScript(() => document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-wb-start]')) { const p = document.createElement('p'); p.textContent = 'Checkout opens on launch day. Start the free trial now and it rolls straight into the full version.'; (document.querySelector('[data-wb-page]') || document.body).appendChild(p); } }, true));
    return;
  }
  if (plant === 'jank') { // an 90 ms main-thread stall every 300 ms: long frames at any CPU rate (G12 / G11 long tasks)
    await ctx.addInitScript(() => setInterval(() => { const t = performance.now(); while (performance.now() - t < 90); }, 300));
    return;
  }
  if (plant === 'flash') { // every H keydown fires a "full-page flash" (a synthetic animationstart on [data-wb-flash]): G4's 12 flashes in 850 ms, and a flash under reduced motion
    await ctx.addInitScript(() => document.addEventListener('keydown', (e) => { if (e.key === 'h') { const f = document.querySelector('[data-wb-flash]'); if (f) f.dispatchEvent(new Event('animationstart')); } }, true));
    return;
  }
  await ctx.route((u) => /\/widebeam\/?($|\?|#)|\/src\/lib\/widebeam\/|_astro\/.*\.js/.test(u.pathname + u.search), async (route) => {
    try {
      const res = await route.fetch();
      const ct = res.headers()['content-type'] || '';
      if (!/html|javascript|typescript|text\/plain/.test(ct) && !/\.ts$/.test(route.request().url().split('?')[0])) return route.fulfill({ response: res });
      const body = await res.text();
      const out = G.plantText(plant, route.request().url(), body);
      await route.fulfill({ response: res, body: out });
    } catch { try { await route.continue(); } catch {} }
  });
};

// the production-build check: the page has no vite client => bytes mean something
G.isProd = async (base) => { const r = await G.fetchText(base + '/widebeam/'); return !/@vite\/client/.test(r.body); };

// summary helper for a gate that reports the same check per size/engine
G.tag = (...a) => a.filter(Boolean).join(' ');
