// GAS, Radio Roulette and GAS 2's real screens running to music, for the TV (Dan 2026-11-10: "record them"), the way
// record-revlimiter.mjs records RevLimiter: each plugin's own UI (served from its repo through Playwright's router, no
// server), its idle state set, Playwright's fake clock stepping it frame by frame, and each 60 Hz tick feeding it the
// one value its plugin sends (tools/tv-anim/song-meters.py <plugin> value ...): GAS 'heat' (the lamp), Radio
// Roulette 'level' (the VU), GAS 2 the loudness its pump's number drums show. GAS and Radio Roulette run in their
// JUCE mode on JUCE's own browser stand-in (js/juce/check_native_interop.js, loaded before the page); GAS 2 takes its
// loudness through its own hook (window.GAS_LOOK.meters) and is shot on a clear background (it floats on the TV).
// The values loop, so after a warm-up frame N and frame N + loop are the same picture.
//   node tools/tv-anim/record-plugin.mjs <gas|radio-roulette|gas2> <values.json> <outDir> [fps=15] [probe]
//   then: python3 tools/tv-anim/cut-webp.py <outDir> <out.webp> <width> 15 80 tools/wwbench/anim/<plugin>
import { webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const R = process.env.REVAUDIO_ROOT || path.join(os.homedir(), 'projects/revaudio'); // the plugins' repos
/* every plugin is shot cut out, on a clear ground (Dan 2026-11-11: "I want the gas 2 hovering to be perfect, also do
   that for all the plugins. If you see any like minor details that are not a part of the plugin, then remove them"):
   css hides what isn't the plugin (the window's resize grip, the room, the dash behind the radio, its mounted shadow) */
const CLEAR = 'html, body { background: transparent !important; }';
const PLUGINS = {
  gas: {
    dir: `${R}/GAS/plugin/Source/ui/public`, vp: [400, 595], el: '.plate', shim: true, clear: true,
    css: `${CLEAR} .resize-grip { display: none !important; }`,
    // drive 6 of 10 (the demo's takes), full mix, Tube
    init: () => {
      const set = (id, n) => { try { const s = window.Juce.getSliderState(id); s.setNormalisedValue(n); s.valueChangedEvent?.callListeners?.(); } catch (e) {} };
      set('drive', 0.6); set('mix', 1); set('voice', 0);
    },
    emit: (v) => window.__JUCE__.backend.emitByBackend('heat', JSON.stringify(v)),
  },
  'radio-roulette': {
    dir: `${R}/RadioRoulette/Source/ui/public`, vp: [1376, 768], el: '#stage', shim: true, clear: true,
    css: `${CLEAR} #dash { background: none !important; } #stage::before, #resizeGrip { display: none !important; }`,
    // on, full mix, a station dialled in
    init: () => {
      try { const t = window.Juce.getToggleState('POWER'); t.setValue(true); t.valueChangedEvent?.callListeners?.(); } catch (e) {}
      const set = (id, n) => { try { const s = window.Juce.getSliderState(id); s.setNormalisedValue(n); s.valueChangedEvent?.callListeners?.(); } catch (e) {} };
      set('MIX', 1); set('SEED', 0.3);
    },
    emit: (v) => window.__JUCE__.backend.emitByBackend('level', JSON.stringify(v)),
  },
  gas2: {
    dir: `${R}/GAS2/Source/ui/public`, vp: [440, 800], el: null, shim: false, clear: true,
    css: `${CLEAR} #room, #rGrip, #floatX, #floatGrab { display: none !important; }`,
    // FLOATING, as the plugin floats: its own html.rv-float hides the desert room, and its hose fades along its length
    // (GAS2.hose(true), the floating tail) instead of ending at the window's edge
    init: () => { document.documentElement.classList.add('rv-float'); window.GAS2?.hose?.(true); },
    emit: (v) => window.GAS_LOOK && window.GAS_LOOK.meters(v),
  },
};

const [, , NAME, VALUES, OUT, FPS_ARG, PROBE] = process.argv;
const P = PLUGINS[NAME];
if (!P || !VALUES || !OUT) throw new Error('usage: record-plugin.mjs <gas|radio-roulette|gas2> <values.json> <outDir> [fps] [probe]');
const ROWS = JSON.parse(fs.readFileSync(VALUES, 'utf8')).ticks;
const FPS = +(FPS_ARG || 15), TICK = 1000 / 60, every = Math.round(60 / FPS);
if (ROWS.length % every) throw new Error(`a loop of ${ROWS.length} ticks isn't a whole number of ${FPS} fps frames`);
fs.mkdirSync(OUT, { recursive: true });

const b = await webkit.launch();
const page = await b.newPage({ viewport: { width: P.vp[0], height: P.vp[1] }, deviceScaleFactor: 1 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).split('\n')[0]));
const ORIGIN = 'http://plugin.test';
await page.route(`${ORIGIN}/**`, (route) => {
  const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.join(P.dir, rel);
  if (!file.startsWith(P.dir) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ path: file });
});
if (P.shim) await page.addInitScript({ path: `${P.dir}/js/juce/check_native_interop.js` });
await page.clock.install({ time: new Date('2026-11-10T12:00:00Z') });
await page.goto(`${ORIGIN}/index.html`, { waitUntil: 'load' });
await page.clock.runFor(1500);
await page.waitForTimeout(600);
await page.evaluate(P.init);
if (P.css) await page.addStyleTag({ content: P.css });
await page.clock.runFor(500);

const shoot = (file) => (P.el ? page.locator(P.el).first().screenshot({ path: file, omitBackground: !!P.clear })
  : page.screenshot({ path: file, omitBackground: !!P.clear }));
if (PROBE) {
  for (let k = 0; k < 120; k++) { await page.evaluate(P.emit, ROWS[k % ROWS.length]); await page.clock.runFor(TICK); }
  await shoot(path.join(OUT, 'probe.png'));
  console.log(NAME, 'probe', errs.length ? errs.slice(0, 5) : 'no errors');
  await b.close();
  process.exit(0);
}
// warm up two loops (the needles' inertia, the drums, the lamp), then record one
let k = 0;
for (; k < 2 * ROWS.length; k++) { await page.evaluate(P.emit, ROWS[k % ROWS.length]); await page.clock.runFor(TICK); }
let n = 0;
for (let i = 0; i < ROWS.length; i++, k++) {
  await page.evaluate(P.emit, ROWS[k % ROWS.length]); await page.clock.runFor(TICK);
  if (i % every === 0) await shoot(path.join(OUT, `f_${String(n++).padStart(4, '0')}.png`));
}
console.log(NAME, 'frames', n, 'at', FPS, 'fps;', errs.length ? errs.slice(0, 5) : 'no errors');
await b.close();
