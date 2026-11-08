// scout stills (adapted from scratchpad/scripts/options.mjs): room.html?capture=<walk>&expose, an async patch in the page, a still
//   node scout.mjs <out-dir> <spec.json> [WxH] [port]
// spec: [{ name, walk, patch: "<async js body; X = window.__room>", wait?: ms, eval?: "<js returning JSON-able>" }]
// files under SCOUT_ROOT are served to the page at /__scout/<path> by request routing (no repo edits, no second server)
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const [out, specPath, size = '1141x636', port = '4492'] = process.argv.slice(2);
const ROOT = path.resolve(process.env.SCOUT_ROOT || process.cwd()); // the builder's own folder: /__scout/<path> and assets/models/scout/<path> are served from here
const [w, h] = size.split('x').map(Number); fs.mkdirSync(out, { recursive: true });
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
const msgs = new Set();
const types = { '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
for (const s of spec) {
  let done = false;
  for (let attempt = 0; attempt < 3 && !done; attempt++) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.route('**/__scout/**', async (route) => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^.*?\/__scout\//, ''));
      const f = path.resolve(ROOT, rel);
      if (!f.startsWith(ROOT + '/') || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nope' });
      return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': types[path.extname(f).toLowerCase()] || 'application/octet-stream' } });
    });
    // the room's own ?model= loader only takes assets/models/... paths: assets/models/scout/<rel> is served from SCOUT_ROOT/<rel>
    await page.route('**/assets/models/scout/**', async (route) => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^.*?\/assets\/models\/scout\//, ''));
      const f = path.resolve(ROOT, rel);
      if (!f.startsWith(ROOT + '/') || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nope' });
      return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': types[path.extname(f).toLowerCase()] || 'application/octet-stream' } });
    });
    page.on('pageerror', (e) => msgs.add('PAGEERROR ' + String(e).slice(0, 400)));
    page.on('console', (m) => { const t = m.text(); if (t.startsWith('SCOUT')) console.log(s.name, t); else if (m.type() === 'error' || m.type() === 'warning') msgs.add(m.type() + ' ' + t.slice(0, 300)); });
    try {
      await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?capture=${s.walk}&expose${s.query || ''}`, { waitUntil: 'load', timeout: 90000 });
      await page.waitForFunction(() => !!window.__room, null, { timeout: 60000 });
      await page.waitForTimeout(s.pre ?? 4200);
      if (s.patch) {
        const r = await page.evaluate(async (code) => {
          const X = window.__room;
          const fn = new Function('X', `return (async () => { ${code}\n })()`);
          const v = await fn(X); X.R.probe.due = 1; return v ?? null;
        }, s.patch);
        if (r != null) console.log(s.name, 'RESULT', JSON.stringify(r));
      }
      await page.waitForTimeout(s.wait ?? 2200);
      if (s.eval) { const r = await page.evaluate(s.eval); console.log(s.name, 'EVAL', JSON.stringify(r)); }
      if (!s.noshot) { const f = path.join(out, `${s.name}.png`); await page.screenshot({ path: f, timeout: 60000 }); console.log(f); }
      done = true;
    } catch (e) { console.log('retry', s.name, String(e).slice(0, 300)); }
    await ctx.close();
  }
}
await browser.close();
for (const m of msgs) console.log(m);
