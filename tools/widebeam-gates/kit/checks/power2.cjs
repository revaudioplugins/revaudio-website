// POWER on/off twice at laptop + phone sizes, the page at rest. Usage: node power2.cjs <chromium|webkit>
const { chromium, webkit } = require('@playwright/test');
const { stub, toDash } = require('./lib.cjs');
const ENGINE = process.argv[2] || 'chromium';
(async () => {
  const b = ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
  for (const vp of [{ width: 1141, height: 636 }, { width: 390, height: 844 }]) {
    const ctx = await b.newContext({ viewport: vp }); await stub(ctx);
    const page = await ctx.newPage();
    await page.goto((process.env.BASE || (() => { throw new Error('BASE not set'); })()).replace(/\/$/, '') + '/widebeam', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
    await page.addStyleTag({ content: '#cookie-banner{display:none!important}' }); await page.keyboard.press('Escape');
    await toDash(page);
    // On a phone held upright (DECK_MQ in src/lib/widebeam/drive-to.ts, Dan's D7 B) the face is inert and the deck under it
    // holds POWER (WbDeck.astro, data-wb-deck-sw="power"): click the deck key there, the face's key everywhere else.
    // Both keys follow the one store, so after each click the check reads BOTH (face lamp = live display, deck key = control).
    const deck = await page.evaluate(() => !!document.querySelector('[data-wb-deck]') && matchMedia('(max-width: 900px) and (orientation: portrait)').matches);
    const FACE_KEY = '[data-wb-face] [aria-label="Power"]', DECK_KEY = '[data-wb-deck] [data-wb-deck-sw="power"]';
    const KEY = deck ? DECK_KEY : FACE_KEY;
    const face = await page.evaluate(() => Math.round(document.querySelector('[data-wb-face]').getBoundingClientRect().top));
    const seq = [], mirror = [];
    for (let i = 0; i < 4; i++) {
      await page.click(KEY); await page.waitForTimeout(500);
      seq.push(await page.getAttribute(KEY, 'aria-pressed'));
      if (deck) mirror.push(await page.getAttribute(FACE_KEY, 'aria-pressed'));
    }
    console.log(`${ENGINE} ${vp.width}: face top ${face}; POWER after 4 clicks${deck ? ' on the deck key' : ''}: ${seq.join(' ')}${deck ? `; face POWER follows: ${mirror.join(' ')}` : ''}`);
    await ctx.close();
  }
  await b.close();
})();
