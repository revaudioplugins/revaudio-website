// Headless captures of the flight lab (flight/lab.html, page served on :4462): node flight/tools/lab-shot.cjs '<query>' out.png [...]
// e.g. 'b=0&s=1&minres=30' = the blockout the aerial is painted from; '&mask=1' = where the landing photo paints; 'u=0.5&s=0.5' = mid-flight
const { chromium } = require(process.env.PW || 'playwright');   // PW=<a website clone>/node_modules/playwright when this checkout has none
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] }).catch(() => chromium.launch());
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) {
    const qs = new URLSearchParams(a[i]); const w = +(qs.get('w') || 1536), h = +(qs.get('h') || 1024);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
    await page.goto('http://127.0.0.1:4462/flight/lab.html?shot&' + a[i]);
    await page.waitForFunction(() => document.title === 'ready', null, { timeout: 30000 }).catch(e => errs.push('timeout ' + e.message));
    await page.screenshot({ path: a[i + 1] });
    console.log(a[i + 1], errs.length ? errs.slice(0, 6).join(' | ') : 'ok');
    await page.close();
  }
  await browser.close();
})();
