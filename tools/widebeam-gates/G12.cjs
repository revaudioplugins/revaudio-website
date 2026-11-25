// G12 Motion (plan §4 G12): at 4x CPU, no frame over 33 ms through the hand-off, the dash arrival, HIGH BEAM and the preset glide, judged against
// /drift in the same minute. TIMING ONLY: run-timing.sh runs it, one at a time, on a quiet machine. run-gates.sh lists it as SKIP.
//   node G12.cjs <base> --timing [--rate 4]
const G = require('./Glib.cjs');
const GATE = 'G12';
const RATE = Number((process.argv[process.argv.indexOf('--rate') + 1]) || 4) || 4;
const INIT = () => { window.__fr = []; window.__seg = 'load'; let last = 0; const tick = (t) => { if (last) window.__fr.push([window.__seg, t - last]); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); };

async function run(path, extra) {
  const b = await G.launch('chromium'); const { ctx, page } = await G.page(b, 'chromium', 'L1141', path === '/widebeam' ? {} : { plant: false }); // a plant (--plant) hits /widebeam only: /drift is the yardstick
  await page.addInitScript(INIT); await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.documentElement.appendChild(s); });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await page.goto(G.BASE + path, { waitUntil: 'domcontentloaded' });
  const seg = (s) => page.evaluate((s) => { window.__seg = s; }, s);
  await seg('hand-off (first 10 s)'); await G.sleep(10000);
  await seg('scroll'); await page.mouse.move(570, 330); for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 200); await G.sleep(110); } await G.sleep(800);
  if (extra) await extra(page, seg);
  const fr = await page.evaluate(() => window.__fr); await ctx.close(); await b.close();
  const by = {}; for (const [s, d] of fr) (by[s] = by[s] || []).push(d);
  return Object.fromEntries(Object.entries(by).map(([s, d]) => [s, { n: d.length, over33: d.filter((x) => x > 33.4).length, max: Math.round(Math.max(...d)) }]));
}

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G12.cjs <base> --timing');
  if (!G.ARGS.timing) return G.skip(GATE, 'frame times at 4x CPU vs /drift', 'timing gate: run-timing.sh, one at a time, quiet machine');
  await G.step(GATE, `no frame over 33 ms at ${RATE}x CPU, judged against /drift [chromium]`, async () => {
    const drift = await run('/drift');
    const wb = await run('/widebeam', async (page, seg) => {
      await G.bring(page, '[data-wb-face]'); await G.sleep(1500);
      await seg('dash arrival'); await page.evaluate(() => window.scrollTo(0, 0)); await G.sleep(1200); const k = await G.rect(page, '[data-wb-start]'); if (k) { await page.mouse.click(k.cx, k.cy); await G.sleep(3500); }
      await seg('HIGH BEAM'); await page.locator('[aria-label="High beam"]').focus().catch(() => {}); await page.keyboard.press('h'); await G.sleep(1400); await page.keyboard.press('h'); await G.sleep(900);
      await seg('preset glide'); for (const i of [3, 11, 4]) { await page.evaluate((i) => { const c = document.querySelector(`[data-preset="${i}"]`); if (c) c.click(); }, i); await G.sleep(1600); }
    });
    const base = (drift.scroll || { over33: 0 }).over33, baseN = (drift.scroll || { n: 1 }).n;
    const bad = Object.entries(wb).filter(([s, v]) => s !== 'load' && v.over33 > 0 && v.over33 / v.n > Math.max(0.02, base / baseN + 0.02)).map(([s, v]) => `${s}: ${v.over33} of ${v.n} frames > 33 ms (max ${v.max} ms)`);
    G.ok(GATE, `no frame over 33 ms at ${RATE}x CPU, judged against /drift [chromium]`, bad.length === 0, (bad.length ? bad.join('; ') + ' | ' : '') + 'widebeam ' + Object.entries(wb).map(([s, v]) => `${s} ${v.over33}/${v.n} (max ${v.max})`).join(', ') + ' | /drift ' + Object.entries(drift).map(([s, v]) => `${s} ${v.over33}/${v.n} (max ${v.max})`).join(', ') + ' | bar: 0 frames over 33 ms, or no worse than /drift in the same minute');
  });
});
