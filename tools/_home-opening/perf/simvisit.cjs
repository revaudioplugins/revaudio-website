// One cold first visit through simserve.py, in Chrome at Dan's laptop size: when each light came on, when each load
// phase ended (room.html's performance marks), when the walk unlocked, bytes on the wire.   node simvisit.cjs <port>
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || '4483', b = await chromium.launch({ channel: 'chrome', timeout: 600000 });
  const ctx = await b.newContext({ viewport: { width: 1141, height: 636 }, deviceScaleFactor: 2 }), p = await ctx.newPage(), errs = [];
  p.setDefaultTimeout(1800000);
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html`, { waitUntil: 'commit' });
  await p.waitForFunction(() => window.lightsOn && window.lightsOn.log.some(([, w]) => w === 'hand-off'), null, { timeout: 1800000, polling: 500 });
  const r = await p.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0], res = performance.getEntriesByType('resource');
    return { log: window.lightsOn.log, calm: window.lightsOn.calm,
      marks: performance.getEntriesByType('mark').filter((m) => m.name.startsWith('lights:')).map((m) => [m.name.slice(7), Math.round(m.startTime)]),
      wire: Math.round((nav.transferSize + res.reduce((s, e) => s + (e.transferSize || 0), 0)) / 1e4) / 100,
      lastByte: Math.round(Math.max(...res.map((e) => e.responseEnd))), files: res.length,
      list: res.map((e) => ({ url: e.name.replace(/^https?:\/\/[^/]+/, ''), wire: e.transferSize, body: e.encodedBodySize, raw: e.decodedBodySize, start: Math.round(e.startTime), end: Math.round(e.responseEnd) })) };
  });
  const s = (ms) => (ms / 1000).toFixed(1) + ' s';
  console.log('calm:', r.calm, '· files:', r.files, '· on the wire:', r.wire, 'MB · last byte at', s(r.lastByte));
  console.log('phase ends:', r.marks.map(([k, t]) => k + ' ' + s(t)).join(' · '));
  console.log('lights (from the loading script start):', r.log.map(([t, w]) => s(t) + ' ' + w).join(' · '));
  if (process.argv[3]) require('fs').writeFileSync(process.argv[3], JSON.stringify(r, null, 1));
  console.log('page errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
