// demo lens: what starts the music, what the global keys do, drag sensitivity, the wheel rule. Worker stubbed.
// Usage: node gestures.cjs <chromium|webkit>
const { chromium, webkit } = require('@playwright/test');
const L = require('./lib.cjs');
const path = require('path');
const fs = require('fs');
const ENGINE = process.argv[2] || 'chromium';
const BASE = (process.env.BASE || (() => { throw new Error('BASE is not set (env BASE or the base URL argument)'); })()).replace(/\/$/, ''); // kit copy: base from env BASE
const OUT = (process.env.OUT_DIR || require('path').join(__dirname, '..', '..', 'runs', 'adhoc'));
fs.mkdirSync(OUT, { recursive: true });
const stub = (ctx) => ctx.route(/revlimiter-license[.]revaudio[.]workers[.]dev|cloudflareinsights/, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));
const log = (...a) => console.log(...a);
let b;
async function fresh(vp = { width: 1141, height: 636 }, extra = {}) {
  const ctx = await b.newContext({ viewport: vp, ...extra });
  await stub(ctx);
  const page = await ctx.newPage();
  const errs = [], cons = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') cons.push(m.text().slice(0, 160)); });
  await page.goto(BASE + '/widebeam', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  return { ctx, page, errs, cons };
}
const playing = (page) => page.evaluate(() => document.querySelector('[data-wb-page]').classList.contains('is-playing'));
const st = (page) => page.evaluate(() => {
  const a = (s) => document.querySelector(s);
  return { width: a('.wb-hit--knob[aria-label="Width"]').getAttribute('aria-valuenow'), side: a('[aria-label="Side solo"]').getAttribute('aria-checked'), high: a('[aria-label="High beam"]').getAttribute('aria-checked'), mono: a('[aria-label="Mono"]').getAttribute('aria-pressed'), power: a('[aria-label="Power"]').getAttribute('aria-pressed'), preset: a('.wb-lcd--preset').textContent, y: Math.round(scrollY) };
});
async function toDashOld(page) {
  const target = await page.evaluate(() => { const d = document.querySelector('[data-wb-dash]').parentElement; const r = d.getBoundingClientRect(); return r.top + scrollY + r.height / 2 - innerHeight / 2; });
  await page.mouse.move(20, 300);
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => scrollY); const d = target - y;
    if (Math.abs(d) < 30) break;
    await page.mouse.wheel(0, Math.sign(d) * Math.min(Math.abs(d), 300)); await page.waitForTimeout(160);
  }
  await page.waitForTimeout(2200);
}
const toDash = L.toDash;
const center = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; }, sel);
// On a phone held upright (DECK_MQ in src/lib/widebeam/drive-to.ts, Dan's D7 B) the face is inert and the deck under it
// (WbDeck.astro) holds the controls: a knob's pointer handlers sit on its box [data-wb-deck-ctl] (deck.ts bindKnob; the
// range inside has pointer-events: none). Same as power2.cjs: aim at the deck there, at the face everywhere else.
const deckOn = (page) => page.evaluate(() => !!document.querySelector('[data-wb-deck]') && matchMedia('(max-width: 900px) and (orientation: portrait)').matches);
const knobSel = (deck, name) => (deck ? `[data-wb-deck] [data-wb-deck-ctl="${name.toLowerCase()}"]` : `.wb-hit--knob[aria-label="${name}"]`);
// wheel (Lenis) until the element's centre sits mid-screen, then wait for the page to stop
async function toEl(page, sel) {
  await page.mouse.move(20, 300);
  for (let round = 0; round < 6; round++) {
    await L.settle(page);
    const d = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top + r.height / 2 - innerHeight / 2; }, sel);
    if (Math.abs(d) < 8) break;
    let left = d; while (Math.abs(left) > 1) { const st = Math.sign(left) * Math.min(Math.abs(left), 200); await page.mouse.wheel(0, st); left -= st; await page.waitForTimeout(120); }
  }
  await L.settle(page); await page.waitForTimeout(600);
}

(async () => {
  b = ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });

  // 0. nothing clicked: does the music start at load? console warnings?
  { const { ctx, page, cons, errs } = await fresh(); await page.waitForTimeout(1500);
    log(`T0 load, no gesture: playing=${await playing(page)} | console warn/err: ${JSON.stringify(cons)} | pageerrors ${errs.length}`); await ctx.close(); }

  // 1. the cookie banner's Decline
  { const { ctx, page } = await fresh();
    const dec = await page.$('#cookie-decline');
    const vis = dec && await dec.isVisible();
    if (vis) { await dec.click(); await page.waitForTimeout(800); }
    log(`T1 cookie Decline visible=${vis} -> playing=${await playing(page)}`); await ctx.close(); }

  // 2. Skip intro
  { const { ctx, page } = await fresh();
    const sk = await page.$('[data-wb-skip]'); const vis = sk && await sk.isVisible();
    if (vis) { await sk.click(); await page.waitForTimeout(800); }
    log(`T2 Skip intro visible=${vis} -> playing=${await playing(page)}`); await ctx.close(); }

  // 3. click into the trial email field and type
  { const { ctx, page } = await fresh();
    await page.addStyleTag({ content: '#cookie-banner{display:none!important}' });
    await page.keyboard.press('Escape');
    await page.click('#wb-trial-email'); await page.waitForTimeout(500);
    const p1 = await playing(page);
    await page.keyboard.type('me@x.com'); await page.waitForTimeout(400);
    log(`T3 click the trial email field -> playing=${p1}; after typing -> ${await playing(page)}`); await ctx.close(); }

  // 4. keyboard only: Tab
  { const { ctx, page } = await fresh();
    await page.keyboard.press('Tab'); await page.waitForTimeout(600);
    const f = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 30));
    log(`T4 one Tab press (focus on "${f}") -> playing=${await playing(page)}`); await ctx.close(); }

  // 5. global single-letter keys from the hero (WCAG 2.1.4)
  { const { ctx, page } = await fresh();
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    const before = await st(page);
    for (const k of ['s', 'h', 'm', 'p', ']']) await page.keyboard.press(k);
    await page.waitForTimeout(800);
    const after = await st(page);
    log(`T5 keys s h m p ] pressed at the top of the page (y=${before.y}), dash off screen: ${JSON.stringify(before)} -> ${JSON.stringify(after)} | playing=${await playing(page)}`); await ctx.close(); }

  // 6. drag sensitivity on WIDTH (laptop + 390 + 360): px of travel per 0..200
  for (const vp of (process.env.SKIP6 ? [] : [{ width: 1141, height: 636 }, { width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 740 }])) {
    const { ctx, page } = await fresh(vp);
    await page.addStyleTag({ content: '#cookie-banner{display:none!important}' });
    await page.keyboard.press('Escape');
    await toDash(page);
    // the value is read off the face's WIDTH (aria-valuenow 0..200): on a phone it is the live display and follows the deck
    const deck = await deckOn(page); const KW = knobSel(deck, 'Width'), KM = knobSel(deck, 'Mix');
    if (deck) await toEl(page, KW);
    const k = await center(page, KW);
    const at = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); const c = e && e.closest('[data-wb-deck-ctl], .wb-hit'); return c ? (c.dataset.wbDeckCtl ? 'deck ' + c.dataset.wbDeckCtl : c.getAttribute('aria-label')) : (e ? e.tagName + '.' + e.className : 'nothing'); }, k);
    const v0 = Number((await st(page)).width);
    await page.mouse.move(k.x, k.y); await page.mouse.down();
    await page.mouse.move(k.x, k.y - 10, { steps: 4 }); await page.waitForTimeout(100);
    const v10 = Number((await st(page)).width);
    await page.mouse.move(k.x, k.y - 400, { steps: 20 }); await page.waitForTimeout(100);
    const vTop = Number((await st(page)).width);
    // find the travel to reach 200 from 0: go to bottom, then up in 2px steps
    await page.mouse.move(k.x, k.y + 400, { steps: 20 });
    let travel = null;
    for (let dy = 0; dy <= 800; dy += 2) { await page.mouse.move(k.x, k.y + 400 - dy); if (Number((await st(page)).width) >= 200) { travel = dy; break; } }
    await page.mouse.up();
    // FOCUS / MIX sizes and travel
    const m = await center(page, KM);
    log(`T6 ${vp.width}x${vp.height}${deck ? ' (phone deck: the face is inert)' : ''}: WIDTH hit ${k.w.toFixed(0)}px (drag starts on ${at}), 10px drag ${v0}->${v10} (+${v10 - v0}), full 0->200 sweep = ${travel}px of travel (start ${v0} -> top ${vTop}); MIX hit ${m.w.toFixed(0)}px`);
    await ctx.close();
  }

  // 7. wheel rule: focused knob + pointer over it turns; pointer elsewhere scrolls; is the page stuck while the pointer stays?
  { const { ctx, page } = await fresh();
    await page.addStyleTag({ content: '#cookie-banner{display:none!important}' });
    await page.keyboard.press('Escape');
    await toDash(page);
    const k = await center(page, '.wb-hit--knob[aria-label="Width"]');
    await page.mouse.click(k.x, k.y); await page.waitForTimeout(300);
    const a = await st(page);
    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(120); }
    await page.waitForTimeout(600);
    const b1 = await st(page);
    // pointer over another knob (MIX) while WIDTH keeps focus
    const m = await center(page, '.wb-hit--knob[aria-label="Mix"]');
    await page.mouse.move(m.x, m.y);
    const mix0 = await page.getAttribute('.wb-hit--knob[aria-label="Mix"]', 'aria-valuenow');
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(120); }
    await page.waitForTimeout(900);
    const b2 = await st(page);
    const mix1 = await page.getAttribute('.wb-hit--knob[aria-label="Mix"]', 'aria-valuenow');
    log(`T7 click WIDTH then wheel down x4 over it: width ${a.width}->${b1.width}, page y ${a.y}->${b1.y}; then wheel over MIX (not picked): MIX ${mix0}->${mix1}, page y ${b1.y}->${b2.y}`);
    await ctx.close(); }

  // 8. presets: click card, glide; then the music + preset name; then a knob drag marks it edited
  { const { ctx, page } = await fresh();
    await page.addStyleTag({ content: '#cookie-banner{display:none!important}' });
    await page.keyboard.press('Escape');
    await toDash(page);
    // POWER off then on: the before/after as a visitor would find it
    const p = await center(page, '[aria-label="Power"]');
    await page.mouse.click(p.x, p.y); await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${ENGINE}-power-off.png` });
    const off = await st(page);
    await page.mouse.click(p.x, p.y); await page.waitForTimeout(900);
    log(`T8 POWER hit ${p.w.toFixed(0)}x${p.h.toFixed(0)}px at laptop; off -> ${JSON.stringify(off)} playing=${await playing(page)}`);
    // MONO and the mirror in one screen?
    const mono = await center(page, '[aria-label="Mono"]');
    await page.mouse.click(mono.x, mono.y); await page.waitForTimeout(1500);
    const mir = await page.evaluate(() => { const r = document.querySelector('.wb-mirror').getBoundingClientRect(); return { top: Math.round(r.top), vh: innerHeight }; });
    log(`T8b MONO pressed with the dash centred: the mirror top is at y=${mir.top} of a ${mir.vh} px screen (visible: ${mir.top < mir.vh})`);
    await ctx.close(); }

  await b.close();
})();
