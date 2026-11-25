// Verify the 2026-11-18 fixes on /widebeam. Worker STUBBED (nothing sent). Usage: node wb-verify.cjs <chromium|webkit> [base]
const { chromium, webkit } = require('@playwright/test');
const path = require('path');
const ENGINE = process.argv[2] || 'chromium';
const BASE = (process.argv[3] || process.env.BASE || (() => { throw new Error('base URL missing'); })()).replace(/\/$/, ''); // kit copy: base from argv/env, never a default port
const OUT = (process.env.OUT_DIR || require('path').join(__dirname, '..', '..', 'runs', 'adhoc')); // kit copy: outputs under runs/<label>/
require('fs').mkdirSync(OUT, { recursive: true });
const ok = (c) => (c ? 'PASS' : 'FAIL');
(async () => {
  const b = ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1141, height: 636 } });
  await ctx.route(/revlimiter-license\.revaudio\.workers\.dev|cloudflareinsights/, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const introState = () => page.evaluate(() => { const v = document.querySelector('video.wb-intro'); return { t: +v.currentTime.toFixed(1), gone: v.classList.contains('is-gone'), intro: document.querySelector('.wb-hero').classList.contains('is-intro') }; });

  // 1. the car: first load, a reload, then Back after leaving
  await page.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const s1 = await introState();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const s2 = await introState();
  await page.screenshot({ path: `${OUT}/${ENGINE}-reload-2s.png` });
  await page.goto(BASE + '/plugins', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const s3 = await introState();
  console.log(`${ok(s1.t > 0.5 && s1.intro)} car plays on first load ${JSON.stringify(s1)}`);
  console.log(`${ok(s2.t > 0.5 && s2.intro)} car plays on reload ${JSON.stringify(s2)}`);
  console.log(`${ok(!s3.intro)} Back skips it (road + REPLAY) ${JSON.stringify(s3)}`);

  // fresh page for the rest, intro skipped
  await page.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape');
  await page.addStyleTag({ content: '#cookie-banner,[class*="cookie"]{display:none!important}' }).catch(() => {});

  // 2. the dash fits the laptop screen
  await page.evaluate(() => document.querySelector('[data-wb-dash]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1800);
  const face = await page.evaluate(() => { const r = document.querySelector('[data-wb-face]').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
  console.log(`${ok(face.h <= face.vh - 44)} dash fits under the nav ${JSON.stringify(face)}`);
  await page.screenshot({ path: `${OUT}/${ENGINE}-dash.png` });

  // 3. the wheel: passing over a knob scrolls the page and leaves it alone; a clicked knob turns
  const knob = await page.evaluate(() => { const h = document.querySelector('.wb-hit--knob[aria-label="Width"]'); const r = h.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, v: h.getAttribute('aria-valuenow') }; });
  const read = () => page.evaluate(() => ({ v: document.querySelector('.wb-hit--knob[aria-label="Width"]').getAttribute('aria-valuenow'), y: Math.round(scrollY) }));
  let y0 = (await read()).y;
  await page.mouse.move(knob.x, knob.y);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(150); }
  await page.waitForTimeout(800);
  let r = await read();
  console.log(`${ok(r.v === knob.v && r.y > y0)} wheel over an unpicked knob: value ${knob.v} -> ${r.v}, page moved ${r.y - y0} px`);
  // back up the way a visitor does (the wheel, through Lenis): a native scrollIntoView here leaves Lenis stale
  await page.mouse.move(30, 300);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(150); }
  await page.waitForTimeout(3000);
  const k2 = await page.evaluate(() => { const r = document.querySelector('.wb-hit--knob[aria-label="Width"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  console.log('before click', JSON.stringify(k2), await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.className || e.tagName) + ' y=' + Math.round(scrollY); }, [k2.x, k2.y]));
  await page.mouse.click(k2.x, k2.y);
  console.log('focused after click:', await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('aria-label')));
  y0 = (await read()).y; const v0 = (await read()).v;
  await page.mouse.move(k2.x, k2.y);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(150); }
  await page.waitForTimeout(800);
  r = await read();
  console.log(`${ok(r.v !== v0 && Math.abs(r.y - y0) < 2)} wheel over a clicked knob: value ${v0} -> ${r.v}, page moved ${r.y - y0} px`);

  // 4. the launch list: a bad email says so; a good one hides the form and confirms
  await page.evaluate(() => document.getElementById('wb-notify').scrollIntoView({ block: 'center' }));
  await page.fill('#wb-email', 'nope');
  await page.click('[data-wb-form] button[type=submit]');
  await page.waitForTimeout(300);
  const bad = await page.textContent('[data-wb-status]');
  await page.fill('#wb-email', 'test@example.com');
  await page.click('[data-wb-form] button[type=submit]');
  await page.waitForTimeout(1200);
  const good = await page.evaluate(() => ({ shown: getComputedStyle(document.querySelector('[data-wb-form]')).display, msg: document.querySelector('[data-wb-status]').textContent }));
  console.log(`${ok(/looks off/.test(bad))} launch list, bad email: "${bad}"`);
  console.log(`${ok(good.shown === 'none' && /on the list/.test(good.msg))} launch list, sent: form ${good.shown}, "${good.msg}"`);
  await page.screenshot({ path: `${OUT}/${ENGINE}-notify-sent.png` });

  // 5. the trial form hides too
  await page.evaluate(() => document.getElementById('wb-get').scrollIntoView({ block: 'center' }));
  // n17 (stage 4, lane A): one sign-up is the done state on EVERY surface, so after step 4 the plate's form is already gone
  if (await page.isVisible('#wb-trial-email')) {
    await page.fill('#wb-trial-email', 'test2@example.com');
    await page.click('[data-wb-trial] button[type=submit]');
    await page.waitForTimeout(1200);
  }
  const trial = await page.evaluate(() => ({ shown: getComputedStyle(document.querySelector('[data-wb-trial]')).display, msg: document.querySelector('[data-wb-trial-status]').textContent }));
  console.log(`${ok(trial.shown === 'none' && /You're (in|on the list)/.test(trial.msg))} trial, sent: form ${trial.shown}, "${trial.msg}"`);
  await page.screenshot({ path: `${OUT}/${ENGINE}-trial-sent.png` });
  console.log('page errors:', JSON.stringify(errs));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
