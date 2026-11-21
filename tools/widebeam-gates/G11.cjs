// G11 Weight and speed (plan §4 G11).
// Non-timing (run-gates.sh): no face-art request before the dash nears or the hand-off, and the art DOES load once near; the tutorial costs 0 bytes until
//   near and only the poster before a tap (nothing from YouTube); CLS <= 0.01 over a load + a full scroll; and, on a PRODUCTION build (--prod, astro
//   preview; a dev server's bytes mean nothing): first view <= 1.9 MB laptop / <= 1.0 MB phone, full visit <= 3.3 MB laptop up to 1440 / <= 1.8 MB phone (<= 2.7 MB with the deck).
//   The non-timing rows run with NO navigator.connection (what Safari and Firefox give every visitor, and what a fast line gives in Chrome):
//   headless Chrome on localhost reports a downlink of about 1.5, which intro.ts reads as a slow line and drops the data-wb-tier="hi" film,
//   so without this the weight rows measured the 720 file. Each weight row prints the film it measured and FAILs if the page still saw a slow line.
//   Sizes: --sizes overrides every row; by default the weight rows run at L1141, L1440 and P390, the other rows at L1141 and P390.
//   Bars exist only where the plan gives them: a laptop wider than 1440 gets the first-view bar only, a tablet (T820/T1180) no bar (SKIP with the numbers).
// --timing (run-timing.sh, stage 4): on a 4 Mbit/s line the car starts <= 1.5 s with 0 stalls, with the face art blocked as the pair (BLOCK_FACE) and /drift in the same minute;
//   no long task over 100 ms at load.
//   node G11.cjs <base> [--prod] [--dist <dir>] [--timing]
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const G = require('./Glib.cjs');
const GATE = 'G11';
const FACE_RE = /face-base|knob-width|knob-focus|knob-mix|level-wheel|switch-toggle2|power-rocker/;
const YT_RE = /youtube|ytimg|googlevideo|youtu\.be/;
const A = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const DIST = A('dist', path.join(G.REPO, 'dist'));
const typeOf = (url, mime = '') => { const u = url.split('?')[0]; if (/\.(mp4|webm)$/.test(u) || mime.startsWith('video/')) return 'video'; if (/\.(mp3|m4a|wav|ogg)$/.test(u) || mime.startsWith('audio/')) return 'audio'; if (/\.(woff2?|ttf|otf)$/.test(u) || mime.includes('font')) return 'font'; if (/\.(webp|png|jpe?g|avif|gif|svg)$/.test(u) || mime.startsWith('image/')) return 'image'; if (/\.m?js$/.test(u) || mime.includes('javascript')) return 'js'; if (/\.css$/.test(u) || mime.includes('css')) return 'css'; if (mime.includes('html')) return 'html'; return 'other'; };
// what a text file weighs over the wire from GitHub Pages (gzip), read from dist; media and images as they are
const wire = (r) => { if (['html', 'css', 'js', 'other'].includes(r.type)) { let p = decodeURIComponent(new URL(r.url).pathname); let f = path.join(DIST, p); try { if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f) && fs.existsSync(f + '/index.html')) f += '/index.html'; if (fs.existsSync(f)) return zlib.gzipSync(fs.readFileSync(f), { level: 9 }).length; } catch {} } return r.bytes; };

async function open(engine, size, { cdpNet = null, blockFace = false, base = G.BASE, path: p = '/widebeam', noConn = !cdpNet } = {}) {
  const b = await G.launch(engine); const { ctx, page } = await G.page(b, engine, size);
  // no navigator.connection (see the header): the film a fast line / Safari / Firefox visitor gets, not headless Chrome's ~1.5 Mbit/s guess
  if (noConn) await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'connection', { get: () => undefined, configurable: true }); } catch {} });
  await page.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch {} window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch {} window.__med = []; for (const ev of ['playing', 'waiting', 'stalled', 'ended', 'error']) document.addEventListener(ev, (e) => { if (e.target.tagName === 'VIDEO') window.__med.push([ev, Math.round(performance.now())]); }, true); });
  if (blockFace) await ctx.route(FACE_RE, (r) => r.abort());
  const cdp = engine === 'chromium' ? await ctx.newCDPSession(page) : null; const reqs = new Map(); let t0 = null;
  if (cdp) {
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cdpNet) await cdp.send('Network.emulateNetworkConditions', cdpNet);
    cdp.on('Network.requestWillBeSent', (e) => { if (t0 === null) t0 = e.timestamp; if (!reqs.has(e.requestId)) reqs.set(e.requestId, { url: e.request.url, t: e.timestamp - t0, bytes: 0 }); });
    cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) r.mime = e.response.mimeType; });
    cdp.on('Network.dataReceived', (e) => { const r = reqs.get(e.requestId); if (r) r.dl = (r.dl || 0) + (e.dataLength || 0); });
    cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength || r.dl || 0; });
  } else page.on('request', (r) => { if (t0 === null) t0 = Date.now() / 1000; reqs.set(r.url() + Math.random(), { url: r.url(), t: Date.now() / 1000 - t0, bytes: 0 }); });
  const list = () => [...reqs.values()].map((r) => ({ ...r, type: typeOf(r.url, r.mime), bytes: r.bytes || r.dl || 0 }));
  return { b, ctx, page, list, t0: () => t0 };
}
const kb = (n) => (n / 1024).toFixed(0) + ' KB', mb = (n) => (n / 1048576).toFixed(2) + ' MB';
// what a visitor downloads, from the requests seen (stage 4 measurement fix): G.stub's ctx.route makes Playwright turn the
// HTTP cache off, so Chrome sometimes fetches a face strip or the plate a second time when the face's backgrounds claim the
// file its decoder already has (1 run in 3-4). With the cache on (no route; a server sending the live site's
// Cache-Control: max-age=600) the same visit makes each request once, 10 of 10 runs (team/build/fix-cross/nocache-probe.cjs):
// so a file counts once per URL (video and audio keep every range request), and a data: URL counts nothing, its bytes
// being inside the HTML / CSS / JS already counted
const visit = (L) => { const seen = new Set(); return L.filter((r) => { if (/^data:/.test(r.url)) return false; if (r.type === 'video' || r.type === 'audio') return true; if (seen.has(r.url)) return false; seen.add(r.url); return true; }); };
// which film the page chose, and the line it saw (intro.ts: downlink > 0 && < 3 = slow, the hi tier dropped)
const film = (page) => page.evaluate(() => { const v = document.querySelector('video.wb-intro') || document.querySelector('.wb-hero video'); const c = navigator.connection; return { src: v ? (v.currentSrc || '').split('?')[0].split('/').pop() || 'none' : 'no film', dl: c && typeof c.downlink === 'number' ? c.downlink : null }; }).catch(() => ({ src: '?', dl: null }));
const slowSeen = (f) => f.dl != null && f.dl > 0 && f.dl < 3;

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G11.cjs <base>');
  const prod = G.ARGS.prod || (await G.isProd(G.BASE).catch(() => false));
  const net4 = { offline: false, latency: 60, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (1024 * 1024) / 8 };

  if (G.ARGS.timing) {
    // the car on a 4 Mbit/s line: start <= 1.5 s, 0 stalls; paired with the face art blocked and with /drift in the same minute
    const one = async (label, o) => {
      const { b, ctx, page } = await open('chromium', 'L1141', { cdpNet: net4, ...o });
      try {
        await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s)); });
        await page.goto((o.base || G.BASE) + (o.path || '/widebeam'), { waitUntil: 'commit' }); await G.sleep(9000);
        const r = await page.evaluate(() => ({ med: window.__med, lt: window.__lt })).catch(() => ({ med: [], lt: [] })); const f = await film(page);
        // a stall is a rebuffer: a 'waiting' / 'stalled' AFTER the film first played. The 'waiting' Chrome fires at play() on a
        // preload="none" film (readyState 0, the same ms as 'play') is the start-up wait, which the start time (<= 1.5 s) measures
        const play = (r.med.find(([e]) => e === 'playing') || [])[1]; const isW = ([e]) => e === 'waiting' || e === 'stalled';
        const waits = play == null ? r.med.filter(isW).length : r.med.filter((m) => isW(m) && m[1] > play).length; const startWaits = play == null ? 0 : r.med.filter((m) => isW(m) && m[1] <= play).length;
        await ctx.close(); return { label, play, waits, startWaits, f, lt: r.lt.filter(([s]) => s < 9000) };
      } finally { await b.close(); }
    };
    await G.step(GATE, 'car starts <= 1.5 s with 0 stalls at 4 Mbit/s [chromium]', async () => {
      const pair = []; pair.push(await one('/drift', { path: '/drift' })); const wb = await one('/widebeam', {}); const fb = await one('/widebeam, face art blocked', { blockFace: true }); pair.push(wb, fb);
      const line = pair.map((p) => `${p.label}: playing at ${p.play == null ? 'never (no film plays at load)' : p.play + ' ms'}, stalls ${p.waits}${p.startWaits ? ` (+${p.startWaits} start-up wait before the first frame)` : ''}${p.f && p.f.src !== 'no film' ? `, film ${p.f.src} (downlink ${p.f.dl == null ? 'none' : p.f.dl})` : ''}`).join(' | ');
      G.ok(GATE, 'car starts <= 1.5 s with 0 stalls at 4 Mbit/s [chromium]', wb.play != null && wb.play <= 1500 && wb.waits === 0, line);
      const over = wb.lt.filter(([, d]) => d > 100); G.ok(GATE, 'no long task over 100 ms at load [chromium]', over.length === 0, over.length ? over.map(([s, d]) => `${d} ms at ${s} ms`).join(', ') : `${wb.lt.length} tasks over 50 ms, none over 100`);
    });
    return;
  }

  const SIZES = G.sizesOr(['L1141', 'L1440', 'P390']);
  for (const size of SIZES) {
    if (!G.SIZES[size]) { G.row(GATE, `weight: first view and full visit [chromium ${size}]`, 'FAIL', `unknown size ${size}`); continue; }
    const T = `[chromium ${size}]`; const touch = G.isTouchSize(size); const W = G.SIZES[size].viewport.width;
    const kind = !touch ? (W <= 1440 ? 'laptop' : 'wide') : (/^T/.test(size) ? 'tablet' : 'phone'); const laptop = !touch;
    const allRows = !!G.ARGS.sizes || size !== 'L1440'; // by default L1440 is a weight-only row
    if (allRows) await G.step(GATE, `no face-art request before the dash nears or the hand-off, and it loads once near ${T}`, async () => {
      const name = `no face-art request before the dash nears or the hand-off, and it loads once near ${T}`; const { b, ctx, page, list } = await open('chromium', size);
      try {
        await page.addInitScript(() => { window.__hand = null; const iv = setInterval(() => { const h = document.querySelector('.wb-hero'); const v = document.querySelector('video.wb-intro'); if (h && window.__hand == null && (v && (v.ended || v.classList.contains('is-gone')) || !h.classList.contains('is-intro') && performance.now() > 1500)) { window.__hand = Math.round(performance.now()); clearInterval(iv); } }, 100); const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s)); });
        await page.goto(G.BASE + '/widebeam', { waitUntil: 'domcontentloaded' }); await G.sleep(5500);
        const hand = await page.evaluate(() => window.__hand); const L = list(); const t0 = L.length ? Math.min(...L.map((r) => r.t)) : 0;
        const early = L.filter((r) => FACE_RE.test(r.url) && (r.t - t0) * 1000 < Math.min(hand == null ? 8000 : hand + 1000, 8000) && (r.t - t0) * 1000 < 5000);
        const nm = (u) => { try { return (decodeURIComponent(u).match(FACE_RE) || [u.split('/').pop().slice(0, 24)])[0]; } catch { return u.slice(-24); } };
        const before = early.map((r) => `${nm(r.url)} at ${Math.round((r.t - t0) * 1000)} ms`);
        const mark = list().length; await G.bring(page, '[data-wb-face]', G.isTouchSize(size)); await G.sleep(3500);
        const later = list().filter((r) => FACE_RE.test(r.url)).length;
        const probs = []; if (before.length) probs.push(`${before.length} face-art request(s) before the dash was near (hand-off ${hand == null ? 'not yet' : hand + ' ms'}): ${before.slice(0, 3).join(', ')}`); if (!later) probs.push('the face art never loaded once the dash was on screen');
        G.ok(GATE, name, probs.length === 0, probs.length ? probs.join('; ') : `0 before the dash; ${later} face-art request(s) once it is near (hand-off ${hand == null ? 'not yet at the 5.5 s read' : 'at ' + hand + ' ms'})`);
        await ctx.close();
      } finally { await b.close(); }
    });

    if (allRows) await G.step(GATE, `the tutorial costs 0 bytes until near and nothing from YouTube before a tap ${T}`, async () => {
      const name = `the tutorial costs 0 bytes until near and nothing from YouTube before a tap ${T}`; const { b, ctx, page, list } = await open('chromium', size);
      try {
        await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s)); });
        await page.goto(G.BASE + '/widebeam', { waitUntil: 'domcontentloaded' }); await G.sleep(3500);
        const early = list().filter((r) => YT_RE.test(r.url)); const iframesEarly = await page.evaluate(() => document.querySelectorAll('iframe[src*="youtube"]').length);
        await G.bring(page, '[data-wb-manual]', G.isTouchSize(size)); await G.sleep(3000);
        const near = list().filter((r) => YT_RE.test(r.url)); const iframes = await page.evaluate(() => document.querySelectorAll('iframe[src*="youtube"]').length);
        const hasFrame = await G.has(page, '[data-wb-manual]');
        if (!hasFrame) return G.missing(GATE, name, 'no [data-wb-manual]');
        G.ok(GATE, name, early.length === 0 && near.length === 0 && iframes === 0 && iframesEarly === 0, `YouTube requests before near ${early.length}, once near (before any tap) ${near.length}; youtube iframes ${iframes}`);
        await ctx.close();
      } finally { await b.close(); }
    });

    if (allRows) await G.step(GATE, `CLS <= 0.01 over a load and a full scroll ${T}`, async () => {
      const name = `CLS <= 0.01 over a load and a full scroll ${T}`; const { b, ctx, page } = await open('chromium', size);
      try {
        await page.goto(G.BASE + '/widebeam', { waitUntil: 'load' }); await G.sleep(2500); await G.hideCookie(page);
        const max = await G.maxScroll(page); for (let y = 0; y <= max; y += 450) { await page.evaluate((y) => window.scrollTo(0, y), y); await G.sleep(140); } await G.sleep(1500);
        const cls = await page.evaluate(() => window.__cls);
        G.ok(GATE, name, cls <= 0.01, `CLS ${cls.toFixed(4)} (bar 0.01)`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // bytes: production only
    await G.step(GATE, `weight: first view and full visit ${T}`, async () => {
      const name = `weight: first view and full visit ${T}`;
      if (!prod) return G.skip(GATE, name, 'the bytes of a dev server are not the page\'s: run against `astro preview` (pass --prod) on a production build');
      const { b, ctx, page, list } = await open('chromium', size);
      try {
        await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '#cookie-banner{display:none!important}'; document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s)); });
        await page.goto(G.BASE + '/widebeam', { waitUntil: 'commit' }); await G.sleep(10000);
        const t0 = Math.min(...list().map((r) => r.t)); const fv = visit(list().filter((r) => r.t - t0 <= 10)).reduce((s, r) => s + wire(r), 0);
        const f = await film(page);
        for (let i = 0; i < 400; i++) { const done = await page.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 2); if (done) break; if (touch) await page.evaluate(() => window.scrollBy(0, 500)); else { await page.mouse.move(500, 300); await page.mouse.wheel(0, 500); } await G.sleep(140); }
        await G.sleep(4000);
        const full = visit(list()).reduce((s, r) => s + wire(r), 0); const deck = await page.evaluate(() => document.querySelectorAll('#wb-drive input[type=range]').length >= 4);
        // the plan's bars: first view 1.9 MB on a laptop / 1.0 MB on a phone; full visit 3.3 MB on a laptop up to 1440 / 1.8 MB on a phone (2.7 MB with the deck)
        const capFv = kind === 'tablet' ? null : laptop ? 1.9 * 1048576 : 1.0 * 1048576;
        const capFull = kind === 'laptop' ? 3.3 * 1048576 : kind === 'phone' ? (deck ? 2.7 : 1.8) * 1048576 : null;
        const filmTxt = `film ${f.src}${f.dl == null ? ', no navigator.connection' : ', downlink ' + f.dl}`;
        const probs = []; if (slowSeen(f)) probs.push(`the page saw a slow line (downlink ${f.dl}), so this measured the light film, not the one a fast visitor gets`);
        if (capFv != null && fv > capFv) probs.push(`first view ${mb(fv)} > ${mb(capFv)}`); if (capFull != null && full > capFull) probs.push(`full visit ${mb(full)} > ${mb(capFull)}`);
        const val = `${probs.length ? probs.join('; ') + ' | ' : ''}first view ${mb(fv)} (bar ${capFv == null ? 'none' : mb(capFv)}), full visit ${mb(full)} (bar ${capFull == null ? 'none' : mb(capFull)}${deck ? ', deck' : ''}${capFull == null && kind === 'wide' ? ': the laptop bar stops at 1440' : ''}); ${filmTxt}; text gzip'd from dist, media as sent`;
        if (capFv == null && capFull == null && !probs.length) G.skip(GATE, name, `no bar in the plan for a ${kind}: ${val}`);
        else G.ok(GATE, name, probs.length === 0, val);
        await ctx.close();
      } finally { await b.close(); }
    });
  }
});
