const { chromium } = require(require('os').homedir() + '/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of [1440, 1280, 1240, 1141, 1024, 1000, 768, 600, 430, 390, 360]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await p.goto('http://localhost:4399/revfx/', { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => { const n = [...document.querySelectorAll('.rfx-pm-nm')].map((e) => e.getBoundingClientRect());
      const gaps = n.slice(1).map((x, i) => Math.round(x.left - n[i].right)); const pm = Math.round(document.querySelector('.rfx-pm-ped').getBoundingClientRect().width);
      const k = getComputedStyle(document.querySelector('.rfx-start')).getPropertyValue('--k'); return { pm, k, minGap: Math.min(...gaps) }; });
    if (r.minGap < 4) bad++; console.log(w, JSON.stringify(r));
  }
  console.log(bad ? `FAIL ${bad} widths with names closer than 4 px` : 'PASS names clear');
  await b.close();
})();
