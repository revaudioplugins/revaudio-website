import { chromium } from 'playwright';

const deg = (t) => {
  if (!t || t === 'none') return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return t;
  const p = m[1].split(',').map(Number);
  return Math.round(Math.atan2(p[1], p[0]) * 180 / Math.PI * 100) / 100;
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:4399/', { waitUntil: 'load' });
await page.waitForTimeout(5000);

const geo = await page.evaluate(() => {
  const hero = document.querySelector('[data-hero]');
  const r = hero.getBoundingClientRect();
  return {
    heroTopDoc: Math.round(r.top + window.scrollY),
    heroH: Math.round(r.height),
    vh: innerHeight,
    motionOk: document.documentElement.classList.contains('motion-ok'),
    sr: history.scrollRestoration,
  };
});
console.log('GEO', JSON.stringify(geo));

await page.evaluate(() => window.scrollTo(0, 200));
await page.waitForTimeout(900);
console.log('BEFORE RELOAD', JSON.stringify(await page.evaluate(() => ({ y: Math.round(window.scrollY), sr: history.scrollRestoration }))));

await page.addInitScript(() => {
  window.__rec = [];
  const t0 = performance.now();
  const loop = () => {
    const n = document.querySelector('.hero-dial-desktop [data-needle]');
    if (n) window.__rec.push([Math.round(performance.now() - t0), getComputedStyle(n).transform, Math.round(window.scrollY)]);
    if (performance.now() - t0 < 7000) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});

await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(7500);

const raw = await page.evaluate(() => ({
  rec: window.__rec,
  finalScroll: Math.round(window.scrollY),
  sr: history.scrollRestoration,
  st: (window.__reveditHero && window.__reveditHero.dials) ? window.__reveditHero.dials.map(d => ({ ...d })) : null,
}));

const rows = raw.rec.map(([ms, t, sy]) => [ms, deg(t), sy]);
const changes = [];
let prev = null;
for (const r of rows) {
  if (prev === null || Math.abs(r[1] - prev) > 0.001) { changes.push([r[0], r[1], r[2], prev === null ? 0 : Math.round((r[1] - prev) * 100) / 100]); prev = r[1]; }
}
console.log('AFTER RELOAD scroll=', raw.finalScroll, 'sr=', raw.sr, 'dialState=', JSON.stringify(raw.st));
console.log('frames=', rows.length, 'firstFrame=', JSON.stringify(rows[0]), 'changes=', changes.length);
console.log('FIRST 14 CHANGES:', JSON.stringify(changes.slice(0, 14)));
const big = changes.reduce((a, c) => Math.abs(c[3]) > Math.abs(a[3]) ? c : a, [0, 0, 0, 0]);
console.log('BIGGEST SINGLE-FRAME JUMP:', JSON.stringify(big));

await browser.close();
