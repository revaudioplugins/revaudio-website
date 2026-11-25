// The loading screen's pictures (lights/README.md): the room at walk 0 as its light banks come on one by one (room.html
// ?capture=0&lights=k, k = 0..banks), then layers.py turns them into the dark room (base.webp) and each bank's own light
// (bank-k.webp = room k minus room k-1, never below 0) that lights-on.js adds back up. One wide shape serves every
// laptop, like still.mjs: object-fit cover only trims the sides (the room's view is as tall on every screen, so a set
// must stay wider than any screen it serves). Re-run it whenever the room changes.
// &flat=<screen>: in the room's look (room.html LOOKS, LOOK_DEFAULT) the pictures leave out the vignette and the
// scanlines, which the loading screen lays over them itself in the screen's own pixels (lookOverlay), and the grain; and
// the look's resolution is the one the live room draws on that screen. One set of pictures per kind of screen
// (window.LIGHT_SETS in room.html: its folder and its screen), each in assets/lights/<set>/; lights-on.js picks.
// sign.webp (one, beside the sets): the dark room's picture kept only round the REVAUDIO sign, black elsewhere; it is
// on from the loading screen's first painted frame, under the dark room that fades up (Dan 11-18: "in the loading
// screen I still don't see RevAudio"). Its place is measured here, from the room (the lit word's box on the picture).
//   node tools/_home-opening/lights/render.mjs --port 4471 [--q 82] [--check] [--out dir] [--keep]   (serve the worktree root; cwebp, dwebp, python3 numpy + PIL)
//   --check renders the full room twice first: the two must match (a capture that moves would smear every layer)
//   --out: write the pictures somewhere else (a trial; the default is assets/lights)
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4471'), W = 2560, H = 1080, Q = arg('q', '82');
const here = path.dirname(fileURLToPath(import.meta.url)), out = arg('out', path.join(here, '..', 'assets', 'lights'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lights-'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', timeout: 300000 }); // (a busy Mac starts Chrome slowly)
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
let flat = ''; // the screen this set's pictures are drawn for (&flat=<w>x<h>@<dpr>)
async function shot(k, file, probe) {
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?capture=0&lights=${k}&flat=${flat}${probe ? '&expose' : ''}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__lightsReady, null, { timeout: 90000 });
  await page.waitForTimeout(2500); // the pictures land after the first layout, the probe redraws
  const info = await page.evaluate((probe) => {
    const o = { banks: window.LIGHT_BANKS, sets: window.LIGHT_SETS, buf: [document.getElementById('gl').width, document.getElementById('gl').height] };
    if (probe) { // the lit word's box on the picture, as shares of its width and height (the room's own numbers)
      const { R, camera } = window.__room, hw = R.signHalf ?? 0.95, xs = [], ys = [];
      R.sign.updateWorldMatrix(true, false); camera.updateMatrixWorld();
      for (const [x, y] of [[-hw, -0.2], [hw, -0.2], [-hw, 0.26], [hw, 0.26]]) { const v = R.sign.position.clone().set(x, y, 0).applyMatrix4(R.sign.matrixWorld).project(camera); xs.push((v.x + 1) / 2); ys.push((1 - v.y) / 2); }
      o.sign = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
    return o;
  }, !!probe);
  if (info.buf[0] !== W || info.buf[1] !== H) throw new Error(`the room drew ${info.buf.join('x')}, not ${W}x${H}: a smaller picture stretched`);
  await page.screenshot({ path: file });
  await page.close();
  if (errs.length) console.log('  page errors at %s: %s', k, errs.join(' | '));
  return info;
}
const first = await shot(0, path.join(tmp, 'probe.png'), true), n = first.banks.length, sets = first.sets || [{ tag: '', ref: [1141, 636, 2] }];
const caps = Object.fromEntries(first.banks.map((b, i) => [i + 1, b.caps]).filter(([, c]) => c)); // banks drawn per screen width
if (process.argv.includes('--check')) {
  await shot(n, path.join(tmp, 'check-a.png')); await shot(n, path.join(tmp, 'check-b.png'));
  execFileSync('python3', ['-I', path.join(here, 'layers.py'), '--diff', path.join(tmp, 'check-a.png'), path.join(tmp, 'check-b.png')], { stdio: 'inherit' });
}
for (const set of sets) {
  const dir = path.join(tmp, set.tag || 'set'); fs.mkdirSync(dir, { recursive: true });
  flat = `${set.ref[0]}x${set.ref[1]}@${set.ref[2]}`;
  for (let k = 0; k <= n; k++) {
    await shot(k, path.join(dir, `room-${k}.png`)); // the room's own pick at 2560 wide: the chain the later banks build on
    for (const tag of caps[k] || []) await shot(`${k}&tvcap=${tag}`, path.join(dir, `room-${k}@${tag}.png`));
    process.stdout.write(`  ${flat}: room ${k}/${n}\n`);
  }
}
await browser.close();
const stale = (d) => { for (const f of fs.existsSync(d) ? fs.readdirSync(d) : []) if (/^(base|sign|bank-\d+(@[\dx]+)?)\.webp$/.test(f)) fs.unlinkSync(path.join(d, f)); };
stale(out); // (and the one set of before 2026-11-20, which lay here)
let total = 0;
for (const set of sets) {
  const to = path.join(out, set.tag); fs.mkdirSync(to, { recursive: true }); stale(to); // no stale bank left
  console.log(`set ${set.tag || '(one)'}: as a ${set.ref[0]}x${set.ref[1]} @${set.ref[2]}x screen draws the room`);
  const o = execFileSync('python3', ['-I', path.join(here, 'layers.py'), path.join(tmp, set.tag || 'set'), to, String(n), Q, JSON.stringify(caps)], { encoding: 'utf8' });
  process.stdout.write(o); total += +(/total (\d+) KB/.exec(o) || [0, 0])[1];
}
// the sign's own layer, from the dark room of the set with the most detail (the last)
const last = sets[sets.length - 1];
const so = execFileSync('python3', ['-I', path.join(here, 'layers.py'), '--sign', path.join(tmp, last.tag || 'set', 'room-0.png'), path.join(out, 'sign.webp'), ...first.sign.map(String), Q], { encoding: 'utf8' });
process.stdout.write(so); total += +(/sign\.webp (\d+) KB/.exec(so) || [0, 0])[1];
console.log(`  all sets: ${total} KB`);
if (!process.argv.includes('--keep')) fs.rmSync(tmp, { recursive: true, force: true }); else console.log('renders kept in', tmp);
