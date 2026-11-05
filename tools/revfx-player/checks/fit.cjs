const { chromium } = require(require('os').homedir() + '/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch();
  for (const w of [1440, 1280, 1141, 1024, 1000, 768, 600, 430, 390, 360]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await p.goto('http://localhost:4399/revfx/', { waitUntil: 'networkidle' });
    console.log(w, JSON.stringify(await p.evaluate(() => {
      const R = (e) => e.getBoundingClientRect(), q = (s) => document.querySelector(s);
      const bd = R(q('.rfx-hear-board')), sw = R(q('.rfx-stomp')), peds = [...document.querySelectorAll('.rfx-pm-ped')].map(R);
      return { pm: Math.round(peds[0].width), swW: Math.round(sw.width), swH: Math.round(sw.height), pedH: Math.round(peds[0].height), inL: Math.round(sw.left - bd.left), inR: Math.round(bd.right - peds[4].right),
        overlap: sw.right > peds[0].left + 1, panelH: Math.round(R(q('.rfx-hear-panel')).height), sx: document.documentElement.scrollWidth };
    })));
  }
  await b.close();
})();
