// hold each cap down (mouse down, no up) and on hover: is it still inside its bezel?
const { chromium } = require(require('os').homedir() + '/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of [1440, 390]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await p.goto('http://localhost:4399/revfx/', { waitUntil: 'networkidle' });
    await p.evaluate(() => { for (const x of document.querySelectorAll('button')) if (x.textContent.trim() === 'Decline') x.click(); });
    for (const sel of ['[data-hear="play"]', '[data-hear="stop"]']) {
      const el = p.locator(sel); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox();
      for (const st of ['hover', 'press']) {
        await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); if (st === 'press') await p.mouse.down();
        await p.waitForTimeout(250);
        const r = await p.evaluate((s) => { const c = document.querySelector(s), bo = c.closest('.rfx-bore'); const a = c.getBoundingClientRect(), z = bo.getBoundingClientRect(), pad = 4;
          return { dx: +(a.left + a.width / 2 - (z.left + z.width / 2)).toFixed(1), dy: +(a.top + a.height / 2 - (z.top + z.height / 2)).toFixed(1), inside: a.left >= z.left + pad - 1 && a.right <= z.right - pad + 1 && a.top >= z.top + pad - 1 && a.bottom <= z.bottom - pad + 1 }; }, sel);
        if (!r.inside || Math.abs(r.dy) > .5) bad++;
        console.log(w, sel, st, JSON.stringify(r));
        if (st === 'press') await p.mouse.up();
      }
    }
  }
  console.log(bad ? `FAIL ${bad}` : 'PASS caps stay in their bezels');
  await b.close();
})();
