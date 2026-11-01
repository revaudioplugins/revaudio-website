// The set straight from above (drone/tools/ortho.html) at an exact size, for the AI art's layout guide.
//   node drone/tools/ortho.cjs <out.png> <x0,z0,w,h metres> <W>x<H> [base url]
const os = require('os'), path = require('path');
const { chromium } = require(path.join(os.homedir(), 'node_modules', 'playwright-core'));
const [out, rect, size, base = 'http://127.0.0.1:4464'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${base}/drone/tools/ortho.html?rect=${rect}`);
  await p.waitForFunction(() => window.done, null, { timeout: 30000 });
  await p.locator('#c').screenshot({ path: out });
  await b.close();
  console.log(out, errs.join(' | ') || 'no errors');
})().catch(e => { console.error(e); process.exit(1); });
