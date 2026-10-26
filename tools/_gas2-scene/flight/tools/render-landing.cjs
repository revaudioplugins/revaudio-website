// The landing frame (img/land.webp) = page-b's scene exactly as it stands at touchdown: no readings, no dusk / focus
// layers, no TUNE / bench chrome, the flight off. Re-run whenever a prop on the page changes (a poster pick, the radio).
// Needs the page served (cd tools/_gas2-scene && python3 -m http.server 4462 --bind 127.0.0.1) and the website clone's
// Playwright. Usage: node flight/tools/render-landing.cjs <out@2x.png>
//   then: python3 -I -c "from PIL import Image; Image.open('<out@2x.png>').convert('RGB').resize((1536,1024), Image.LANCZOS).save('land.png')"
//         cwebp -q 94 -m 6 land.png -o flight/img/land.webp   (and rebuild img/land-bg.webp: tools/make-landbg.py)
// CHALK=bare / CHALK=off: the chalkboard without its drop shadow / not at all, for its cut-out (tools/make-chalkmask.py)
const { chromium } = require(process.env.PW || 'playwright');   // PW=<a website clone>/node_modules/playwright when this checkout has none
(async () => {
  const out = process.argv[2] || 'land@2x.png';
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 2 })).newPage();
  await page.goto('http://127.0.0.1:4462/page-b.html?look=0&flight=0', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '.rd, .dusk, .tuneBtn, .tune, .bench-note { visibility: hidden !important; } * { animation-play-state: paused !important; }'
    + ({ bare: '.chalk { filter: none !important; }', off: '.chalk { visibility: hidden !important; }' }[process.env.CHALK] || '') });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1536, height: 1024 } });
  await browser.close(); console.log('saved', out);
})();
