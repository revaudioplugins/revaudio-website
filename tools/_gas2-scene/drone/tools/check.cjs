// Drone intro check in a fresh headless Edge (no stored zoom, TUNE or bench settings). Shots of the hover and the
// flight for each angle, the last frame before touchdown, and the page after landing, plus the same window with
// ?drone=0 to diff against (drone/tools/diff.py). Needs a server on the scene folder (see render-landing.cjs).
//   node drone/tools/check.cjs <out dir> [base url] [WxH,...] [angles]
const os = require('os'), path = require('path'), fs = require('fs');
const { chromium } = require(path.join(os.homedir(), 'node_modules', 'playwright-core'));
const OUT = process.argv[2], base = process.argv[3] || 'http://127.0.0.1:4462';
const sizes = (process.argv[4] || '1440x900').split(',').map(s => s.split('x').map(Number));
const angles = (process.argv[5] || 'top').split(',');
fs.mkdirSync(OUT, { recursive: true });
const runTo = (page, f) => page.evaluate(f => { const r = document.querySelector('.dr-run'); if (!r) return -1; const max = r.offsetHeight + r.offsetTop - innerHeight; scrollTo(0, Math.round(max * f)); return max; }, f);
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu'] });
  const log = [];
  for (const [w, h] of sizes) for (const angle of angles) {
    const tag = `${w}x${h}-${angle}`;
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()));
    await page.goto(`${base}/page-b.html?angle=${angle}`);
    await page.waitForTimeout(3200);                                   // hover: the car is mid-road by now
    await page.screenshot({ path: path.join(OUT, `${tag}-0-hover.png`) });
    for (const f of [.3, .45, .55, .66, .8, .985]) {
      await runTo(page, f); await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(OUT, `${tag}-${Math.round(f * 1000)}.png`) });
    }
    await runTo(page, 1); await page.waitForTimeout(3000);             // touchdown, pop, cleanup
    const st = await page.evaluate(() => ({ cls: document.documentElement.className, run: !!document.querySelector('.dr-run'), layer: !!document.querySelector('.dr'), y: scrollY }));
    await page.screenshot({ path: path.join(OUT, `${tag}-9-landed.png`) });
    log.push(`${tag} after landing: class="${st.cls}" runway=${st.run} layer=${st.layer} scrollY=${st.y} errors=${errs.join(' | ') || 'none'}`);
    await page.close();
    const hold = await browser.newPage({ viewport: { width: w, height: h } });   // the exact landing frame, frozen
    await hold.goto(`${base}/page-b.html?angle=${angle}&landhold`); await hold.waitForTimeout(1500);
    await runTo(hold, 1); await hold.waitForTimeout(2500);
    await hold.screenshot({ path: path.join(OUT, `${tag}-9-landframe.png`) });
    await hold.close();
  }
  for (const [w, h] of sizes) {                                         // references: the page without the intro
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${base}/page-b.html?drone=0`); await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, `${w}x${h}-ref-page.png`) });
    await page.addStyleTag({ content: '.rd { visibility: hidden !important; } .rd::before { display: none !important; }' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${w}x${h}-ref-land.png`) });
    await page.close();
  }
  await browser.close();
  console.log(log.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
