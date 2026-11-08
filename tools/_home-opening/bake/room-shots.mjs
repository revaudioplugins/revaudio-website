// The bake-off stills and timings: room.html as it is (A, live lights) vs ?light=baked (B), same walk spots.
//   node room-shots.mjs <out dir> [--port 4493] [--model N34:assets/models/x.glb:yaw] [--at 0,0.3,0.6,0.8,0.97]
//                       [--variants A,B,Bfast,Bmix,Bktx] [--perf 1] [--size 1141x636]
// Per variant and spot: <out>/<variant>-<p>.png (1141 x 636, ?capture=<p>, after the intro); perf.json: the room's
// scene pass timed alone (renderer.render into a 2, a 3.7 and an 8.3 MP target, each frame forced to finish), A vs B.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4493'), at = arg('at', '0,0.3,0.6,0.8,0.97').split(',').map(Number), [W, H] = arg('size', '1141x636').split('x').map(Number);
const models = process.argv.flatMap((a, i) => (a === '--model' ? ['model=' + process.argv[i + 1]] : []));
const VAR = { A: [], B: ['light=baked'], Bfast: ['light=baked', 'spec=0'], Bktx: ['light=baked', 'packs=ktx2'], Bmix: ['light=baked', 'spec=mix'], Bmix0: ['light=baked', 'spec=mix', 'gleam=0'] };
const variants = arg('variants', 'A,B,Bfast').split(',');
const browser = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist'] });
const log = {}, perf = {};
for (const v of variants) {
  for (const p of at) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const page = await ctx.newPage(), errs = [];
    page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (['error', 'warning', 'info'].includes(m.type()) && !/404/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
    const q = [`capture=${p}`, 'expose', ...models, ...VAR[v]].join('&');
    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?${q}`, { waitUntil: 'load', timeout: 90000 });
    await page.waitForFunction(() => window.__room, null, { timeout: 90000, polling: 50 });
    const boot = Date.now() - t0; // to the room built (B: its packs loaded and attached)
    // past the intro, whatever the boot took (B loads its packs first): the TV's power-on is the intro's last light
    await page.waitForFunction(() => { // and the neon and the lamps warmed up (a cold shader cache can hold them back)
      const { R, S } = window.__room;
      return R.tv.faceMat.color.r > 0.99 && R.neon.every((n) => n.lights[0].intensity > 0.9 * 30 * S.neon) && R.lamps[0].light.intensity > 0.99 * 130 * S.lamps * R.lamps[0].k;
    }, null, { timeout: 90000, polling: 100 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(out, `${v}-${p}.png`) });
    log[`${v}-${p}`] = { boot_ms: boot, errs, baked: await page.evaluate(() => window.__baked?.stats && { baked: window.__baked.stats.baked, missing: window.__baked.stats.missing, changed: window.__baked.stats.changed }) };
    if (arg('perf') && p === at[0]) {
      perf[v] = await page.evaluate(async () => {
        const THREE = await import('three');
        const X = window.__room, R = X.R, scene = R.floor.parent, cam = X.camera, gl0 = R.probe.pmrem._renderer, px = new Uint16Array(4);
        const res = {};
        for (const [w, h] of [[1920, 1080], [2560, 1440], [3840, 2160]]) {
          const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
          const once = () => { gl0.setRenderTarget(rt); gl0.render(scene, cam); gl0.setRenderTarget(null); gl0.readRenderTargetPixels(rt, 0, 0, 1, 1, px); }; // a texel of the target itself: the frame has to finish
          for (let i = 0; i < 15; i++) once();
          const runs = [];
          for (let k = 0; k < 5; k++) { const t = performance.now(); for (let i = 0; i < 40; i++) once(); runs.push((performance.now() - t) / 40); }
          res[`${w}x${h}`] = { ms: Math.min(...runs), runs };
          rt.dispose();
        }
        const info = gl0.info; return { ...res, programs: info.programs.length, textures: info.memory.textures, geometries: info.memory.geometries };
      });
      console.log('%s perf %s', v, JSON.stringify(perf[v]));
    }
    console.log('%s %s %s', v, p, errs.length ? JSON.stringify(errs.slice(0, 4)) : 'ok');
    await ctx.close();
  }
}
fs.writeFileSync(path.join(out, 'log.json'), JSON.stringify({ log, perf }, null, 1));
await browser.close();
