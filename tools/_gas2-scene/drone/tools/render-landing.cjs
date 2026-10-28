// Renders the drone's landing frame: page-b's own scene at 1536x1024 (DPR 2 = 3072x2048) with the readings hidden,
// so the last frame of the flight is the page itself (photo + every HTML prop over it). Fresh headless profile: no
// TUNE looks or bench settings from localStorage. Needs a server on the scene folder:
//   cd tools/_gas2-scene && python -m http.server 4462 --bind 127.0.0.1
//   node drone/tools/render-landing.cjs [http://127.0.0.1:4462]  -> drone/img/land.png (then land.webp, see README)
const os = require('os'), path = require('path');
const { chromium } = require(path.join(os.homedir(), 'node_modules', 'playwright-core'));
const base = process.argv[2] || 'http://127.0.0.1:4462';
const out = path.join(__dirname, '..', 'img', 'land.png');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 2 });
  await page.goto(base + '/page-b.html?drone=0', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '.rd { visibility: hidden !important; } .rd::before { display: none !important; }' });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const b = document.getElementById('scene').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
  if (r.join() !== '0,0,1536,1024') throw new Error('scene is not the full 1536x1024 window: ' + r.join());
  await page.screenshot({ path: out });
  await browser.close();
  console.log('wrote', out);
})().catch(e => { console.error(e); process.exit(1); });
