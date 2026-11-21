// G13 CSP (plan §4 G13): /widebeam under the LIVE site's Content-Security-Policy (lessons 2026-11-10), added to the page response, 0
// securitypolicyviolation events across load, the intro, sound, the switches, a preset, the visitor's own file, both forms (stubbed) and a full scroll,
// the YouTube facade click included (needs the YouTube fixture: --fixture).
//   node G13.cjs <base> [--engines chromium,webkit] [--fixture <youtube-fixture-base>] [--plant script]   (--csp-file <file> to pin a header)
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const G = require('./Glib.cjs');
const GATE = 'G13';
const A = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const CACHE = path.join(G.GATES, 'csp-live.txt');
const liveCsp = () => {
  const f = A('csp-file'); if (f) return { csp: fs.readFileSync(f, 'utf8').trim(), src: f };
  try { const h = execSync('curl -sI -m 15 https://revaudio.net', { encoding: 'utf8' }).split(/\r?\n/).find((l) => /^content-security-policy:/i.test(l)); if (h) { const csp = h.replace(/^[^:]+:\s*/, '').trim(); fs.writeFileSync(CACHE, csp); return { csp, src: 'https://revaudio.net (just fetched)' }; } } catch {}
  if (fs.existsSync(CACHE)) return { csp: fs.readFileSync(CACHE, 'utf8').trim(), src: CACHE + ' (cached: the live site was not reachable)' };
  return null;
};
const wavPath = path.join(G.GATES, 'tone.wav');
if (!fs.existsSync(wavPath)) { const sr = 44100, n = sr, buf = Buffer.alloc(44 + n * 4); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40); for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(8000 * Math.sin(2 * Math.PI * 440 * i / sr)), 44 + i * 4); buf.writeInt16LE(Math.round(8000 * Math.sin(2 * Math.PI * 660 * i / sr)), 46 + i * 4); } fs.writeFileSync(wavPath, buf); }

async function exercise(engine, base, csp, withFacade) {
  const b = await G.launch(engine);
  try {
    const { ctx, page } = await G.page(b, engine, 'L1141');
    const u0 = new URL(base);
    await ctx.route((u) => u.origin === u0.origin && /^\/widebeam\/?$/.test(u.pathname), async (r) => { const res = await r.fetch(); let body = await res.text(); if (G.ARGS.plant === 'script') body = body.replace('</body>', '<script src="https://evil.example.invalid/x.js"></script></body>'); const h = { ...res.headers(), 'content-security-policy': csp }; delete h['content-length']; delete h['content-encoding']; r.fulfill({ response: res, body, headers: h }); });
    await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} <- ${String(e.blockedURI).slice(0, 80)}${e.sourceFile ? ' @' + e.sourceFile.replace(/^https?:\/\/[^/]+/, '').slice(0, 50) + ':' + e.lineNumber : ''}`)); });
    const cons = []; page.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|vite|token=|403|dev-toolbar/i.test(m.text())) cons.push(m.text().slice(0, 140)); });
    const resp = await page.goto(base + '/widebeam', { waitUntil: 'load' });
    const had = !!resp.headers()['content-security-policy']; await G.sleep(engine === 'webkit' ? 3500 : 2500);
    // stage 4: answer the banner with a real Decline first: under the live CSP WebKit refuses the injected <style> that
    // hideCookie adds, so the banner stayed up and took the facade's click
    await page.keyboard.press('Escape'); await G.sleep(1200); await G.declineCookie(page); await G.hideCookie(page);
    const click = async (sel) => { const r = await G.rect(page, sel); if (r) { await page.mouse.click(r.cx, r.cy); await G.sleep(500); } };
    await G.bring(page, '[data-wb-face]'); await click('[data-wb-sound]');
    for (const l of ['High beam', 'Mono']) { const r = await G.rect(page, `[aria-label="${l}"]`); if (r) { await page.mouse.click(r.cx, r.cy); await G.sleep(300); } }
    await page.evaluate(() => { const c = document.querySelector('[data-preset="4"]'); if (c) c.click(); }); await G.sleep(1500);
    await page.setInputFiles('[data-wb-file]', wavPath).catch(() => {}); await G.sleep(1500);
    for (const [inp] of [['#wb-trial-email'], ['#wb-email']]) if (await page.locator(inp).count()) { await page.locator(inp).evaluate((e) => e.scrollIntoView({ block: 'center' })); await page.fill(inp, 'csp@example.com').catch(() => {}); await page.press(inp, 'Enter').catch(() => {}); await G.sleep(900); }
    let facade = 'not tested';
    if (withFacade) {
      await G.bring(page, '[data-wb-manual]'); await G.sleep(800);
      const sel = await page.evaluate(() => { const m = document.querySelector('[data-wb-manual]'); const b = m && [...m.querySelectorAll('button,[role=button]')].find((e) => e.getBoundingClientRect().width > 60); if (b) { b.setAttribute('data-gate-facade', '1'); return '[data-gate-facade]'; } return null; });
      if (sel) { await click(sel); await G.sleep(2500); facade = (await page.evaluate(() => !!document.querySelector('iframe[src*="youtube"]'))) ? 'iframe loaded after the tap' : 'tapped, no iframe appeared'; } else facade = 'NO facade button (stand-by only)';
    }
    await G.toEnd(page); await G.sleep(1200);
    const v = await page.evaluate(() => window.__csp); await ctx.close();
    return { had, v: [...new Set(v)], cons: [...new Set(cons)], facade };
  } finally { await b.close(); }
}

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G13.cjs <base>');
  const live = liveCsp(); if (!live) return G.skip(GATE, 'CSP under the live header', 'no live header (offline) and no cached csp-live.txt');
  for (const engine of G.ARGS.engines) {
    await G.step(GATE, `0 CSP violations under the live header [${engine}]`, async () => {
      const r = await exercise(engine, G.BASE, live.csp, false);
      G.ok(GATE, `0 CSP violations under the live header [${engine}]`, r.had && r.v.length === 0, `${r.had ? '' : 'the header was not applied; '}${r.v.length} violation(s)${r.v.length ? ': ' + r.v.slice(0, 4).join(' | ') : ''}; header from ${live.src}; console errors ${r.cons.length}${r.cons.length ? ': ' + r.cons.slice(0, 2).join(' | ') : ''}`);
    });
    await G.step(GATE, `YouTube facade click under the live header [${engine}]`, async () => {
      const name = `YouTube facade click under the live header [${engine}]`;
      if (!G.ARGS.fixture) return G.skip(GATE, name, 'needs the YouTube fixture: pass --fixture <base from Gfixture.sh youtube>');
      const r = await exercise(engine, G.ARGS.fixture, live.csp, true);
      if (/NO facade/.test(r.facade)) return G.missing(GATE, name, 'the fixture page has no facade button in [data-wb-manual] (lane S not merged)');
      G.ok(GATE, name, r.had && r.v.length === 0 && /iframe loaded/.test(r.facade), `${r.v.length} violation(s)${r.v.length ? ': ' + r.v.slice(0, 3).join(' | ') : ''}; ${r.facade}`);
    });
  }
});
