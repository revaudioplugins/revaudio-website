// demo lens: a phone visitor scrolls the page with a thumb swipe that starts on a knob (Chrome, 390x844, isMobile + touch, CDP touch events).
// Upright under 901 px the knobs are the phone deck's (Dan's D7 B), so the swipes start on the deck there.
const { chromium } = require('@playwright/test');
const { stub, settle } = require('./lib.cjs');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }); await stub(ctx);
  const page = await ctx.newPage();
  await page.goto((process.env.BASE || (() => { throw new Error('BASE not set'); })()).replace(/\/$/, '') + '/widebeam', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '#cookie-banner{display:none!important}' });
  const cdp = await ctx.newCDPSession(page);
  const swipe = async (x, y0, y1, steps = 12) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * i / steps }] }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  // On a phone held upright (DECK_MQ in src/lib/widebeam/drive-to.ts, Dan's D7 B) the face is inert (the live display) and
  // the deck under it (WbDeck.astro) holds the controls; a knob's touch handlers sit on its box [data-wb-deck-ctl]
  // (deck.ts bindKnob: hold until 8 px, a sideways drag turns it, a vertical swipe on a knob not picked yet scrolls the page).
  // So the swipes start on the deck there (as power2.cjs aims at the deck's POWER), on the face everywhere else.
  const deck = await page.evaluate(() => !!document.querySelector('[data-wb-deck]') && matchMedia('(max-width: 900px) and (orientation: portrait)').matches);
  const SEL = deck
    ? { width: '[data-wb-deck] [data-wb-deck-ctl="width"]', tilt: '[data-wb-deck] [data-wb-deck-ctl="tilt"]', area: '[data-wb-deck]', ctl: '[data-wb-deck] [data-wb-deck-ctl]' }
    : { width: '.wb-hit--knob[aria-label="Width"]', tilt: '.wb-wheel', area: '[data-wb-face]', ctl: '.wb-hit--knob, .wb-wheel' };
  console.log(`390x844 touch: ${deck ? 'the phone deck holds the controls (the face is inert)' : 'the face holds the controls'}`);
  // bring an element's centre to mid-screen with plain touch swipes on empty margin (x 8: the deck starts at x 22)
  const bring = async (sel) => {
    for (let i = 0; i < 14; i++) {
      const d = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top + r.height / 2 - innerHeight / 2; }, sel);
      if (Math.abs(d) < 60) break;
      const step = Math.sign(d) * Math.min(Math.abs(d), 380); await swipe(8, 600, 600 - step); await settle(page);
    }
    await settle(page); await page.waitForTimeout(900);
  };
  // the values are read off the face (aria-valuenow: WIDTH 0..200, TILT -100..100): on a phone it is the live display and follows the deck
  const read = () => page.evaluate(() => ({ width: document.querySelector('.wb-hit--knob[aria-label="Width"]').getAttribute('aria-valuenow'), tilt: document.querySelector('.wb-wheel').getAttribute('aria-valuenow'), y: Math.round(scrollY), playing: document.querySelector('[data-wb-page]').classList.contains('is-playing') }));
  const c = (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  // what the finger lands on, so the log proves where each swipe began
  const on = (pt) => page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); if (!e) return 'nothing'; const k = e.closest('[data-wb-deck-ctl]'); if (k) return `deck ${k.dataset.wbDeckCtl}`; const h = e.closest('.wb-hit, .wb-wheel'); if (h) return `face ${h.getAttribute('aria-label') || h.className}`; if (e.closest('[data-wb-face]')) return 'the face (road screen)'; const f = document.querySelector('[data-wb-face]'); const r = f.getBoundingClientRect(); const inFace = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; return inFace && f.inert ? `the face (road screen; inert, so the hit lands on ${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]})` : `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`; }, pt);
  // 1. a scroll swipe (thumb up 160 px) that starts on the face background (the road screen)
  await bring('[data-wb-face]');
  const face = await page.evaluate(() => { const r = document.querySelector('[data-wb-face]').getBoundingClientRect(); return { x: r.x + r.width * 0.5, y: r.y + r.height * 0.25 }; });
  let a = await read(); let at = await on(face); await swipe(face.x, face.y, face.y - 160); await settle(page); let z = await read();
  console.log(`swipe up 160px starting on the road screen (finger on ${at}): page y ${a.y} -> ${z.y}, WIDTH ${a.width} -> ${z.width}`);
  // 2. the same swipe starting on WIDTH
  await bring(SEL.width);
  const w = await c(SEL.width);
  a = await read(); at = await on(w); await swipe(w.x, w.y, w.y - 160); await settle(page); z = await read();
  console.log(`swipe up 160px starting on WIDTH (finger on ${at}): page y ${a.y} -> ${z.y}, WIDTH ${a.width} -> ${z.width}, music playing after: ${z.playing}`);
  // 3. a short 30 px swipe down on WIDTH (a visitor nudging)
  await bring(SEL.width);
  const w2 = await c(SEL.width);
  a = await read(); at = await on(w2); await swipe(w2.x, w2.y, w2.y + 30, 6); await settle(page); z = await read();
  console.log(`30px drag down on WIDTH (finger on ${at}): page y ${a.y} -> ${z.y}, WIDTH ${a.width} -> ${z.width}`);
  // 3b. a sideways 60 px drag right on WIDTH (the deck's rule: a sideways drag turns the knob; 200 px = the whole travel)
  const w3 = await c(SEL.width);
  a = await read(); at = await on(w3);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: w3.x - 30, y: w3.y }] });
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: w3.x - 30 + 60 * i / 12, y: w3.y }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(page); z = await read();
  console.log(`60px drag right on WIDTH (finger on ${at}): page y ${a.y} -> ${z.y}, WIDTH ${a.width} -> ${z.width}`);
  // 4. a scroll swipe starting on the TILT wheel
  await bring(SEL.tilt);
  const t = await c(SEL.tilt);
  a = await read(); at = await on(t); await swipe(t.x, t.y, t.y - 160); await settle(page); z = await read();
  console.log(`swipe up 160px starting on TILT (finger on ${at}): page y ${a.y} -> ${z.y}, TILT ${a.tilt} -> ${z.tilt}`);
  // share of the control surface (the deck on a phone, else the face) that is a drag control
  const share = await page.evaluate(({ area, ctl }) => { const f = document.querySelector(area).getBoundingClientRect(); let s = 0; document.querySelectorAll(ctl).forEach((h) => { const r = h.getBoundingClientRect(); s += r.width * r.height * (h.classList.contains('wb-wheel') || h.dataset.wbDeckCtl === 'tilt' ? 1 : Math.PI / 4); }); return (100 * s / (f.width * f.height)).toFixed(0); }, SEL);
  console.log(`drag controls (knobs + wheel) cover ~${share}% of the ${deck ? 'deck' : 'face'}`);
  await b.close();
})();
