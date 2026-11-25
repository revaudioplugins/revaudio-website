// shared helpers for the demo-lens probes
exports.stub = (ctx) => ctx.route(/revlimiter-license[.]revaudio[.]workers[.]dev|cloudflareinsights/, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));
const settle = async (page) => { let last = -1; for (let i = 0; i < 40; i++) { const y = await page.evaluate(() => Math.round(scrollY)); if (y === last) return y; last = y; await page.waitForTimeout(250); } return last; };
exports.settle = settle;
// wheel to the dash (Lenis), wait for the scroll and the scrub to stop, correct in small notches
exports.toDash = async (page, touch = false) => {
  await page.mouse.move(20, 300).catch(() => {});
  for (let round = 0; round < 6; round++) {
    await settle(page);
    const d = await page.evaluate(() => { const f = document.querySelector('[data-wb-face]').getBoundingClientRect(); const nav = 44; return f.top - (nav + Math.max(0, (innerHeight - nav - f.height) / 2)); });
    if (Math.abs(d) < 8) break;
    if (touch) await page.evaluate((dy) => window.scrollBy(0, dy), d);
    else { let left = d; while (Math.abs(left) > 1) { const s = Math.sign(left) * Math.min(Math.abs(left), 200); await page.mouse.wheel(0, s); left -= s; await page.waitForTimeout(120); } }
  }
  await settle(page); await page.waitForTimeout(1200);
};
