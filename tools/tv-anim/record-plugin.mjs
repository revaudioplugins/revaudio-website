// GAS, Radio Roulette, GAS 2 and RevFX's real screens running to music, for the TV (Dan 2026-11-10: "record them"), the way
// record-revlimiter.mjs records RevLimiter: each plugin's own UI (served from its repo through Playwright's router, no
// server), its idle state set, Playwright's fake clock stepping it frame by frame, and each 60 Hz tick feeding it the
// one value its plugin sends (tools/tv-anim/song-meters.py <plugin> value ...): GAS 'heat' (the lamp), Radio
// Roulette 'level' (the VU), GAS 2 the loudness its pump's number drums show. GAS and Radio Roulette run in their
// JUCE mode on JUCE's own browser stand-in (js/juce/check_native_interop.js, loaded before the page); GAS 2 takes its
// loudness through its own hook (window.GAS_LOOK.meters) and is shot on a clear background (it floats on the TV).
// RevFX (Dan 2026-11-11: "record its loop", it joined the TV on main) takes its GLUE COMP's gain reduction ('gluegr')
// from the /revfx player's drum loop; its other four screens run on their own clocks, so its loop never closes by
// itself: `tail` frames more are shot after it and cut-webp.py's xfade= blends them into its first frames.
// The values loop, so after a warm-up frame N and frame N + loop are the same picture.
//   node tools/tv-anim/record-plugin.mjs <gas|radio-roulette|gas2|revfx> <values.json> <outDir> [fps=15] [probe]
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
  revfx: {
    dir: `${R}/RevFX/Source/ui/public`, vp: [1725, 806], el: null, shim: false, clear: true, tail: 12,
    // DRIFT's page (RevFX is its FX view) runs in bench mode without a backend, every screen reading 0: so the
    // plugin's relays are stood in for (mockBackend), answering with the page's own DEFAULTS (= the C++ defaults)
    mock: { BYP_GLUE: 0, HALO_MIX: 0.45, PITCH_ST: 19 / 24 },
    // the natives RevFX's editor registers (PluginEditor.cpp withNativeFunction): with none the page hides RANDOMIZE,
    // with only that one it waits on the rest (no preset bar, no dice log). Each answers null; the host tempo 90
    mockFns: ['getVersion', 'getScale', 'setScale', 'gripResizeStart', 'gripResizeEnd', 'getHostBpm', 'getSampleRate',
      'fxRandomize', 'fxChainOrder', 'fxSnapState', 'fxSnapStore', 'fxSnapRecall', 'fxDiceGet', 'fxDicePut', 'undo', 'redo',
      'undoState', 'forwardSpace', 'releaseFocus', 'getLicenseStatus', 'activateLicense', 'sendBugReport', 'presetName',
      'presetPrev', 'presetNext', 'presetList', 'presetSelect', 'presetSave', 'setSpectrumActive', 'setScopeActive',
      'setTestTone', 'toggleFxWindow', 'closeFxWindow', 'openUrl', 'checkForUpdates'],
    // a licensed copy (license-overlay.js: a null status covers the rack with INSERT KEY)
    mockAnswers: { getHostBpm: 90, getLicenseStatus: { status: 'activated', machineId: '', trialDays: 0 } },
    css: `${CLEAR} #cornerGrip { display: none !important; }`,
    // the drum loop's 90 BPM (the echo and reverb screens read the host tempo); no faults: one is a random glitch
    // 12-25 s apart (revfx-shell.js), and a loop would repeat it every 10 s
    // `mock` above: in use, as its product shot (src/assets/plugins/revfx-hero.png): the GLUE COMP on (it loads
    // bypassed, its screen dark), HALO (mode 2 by default) at 45 %, PITCH up a fifth
    init: () => {
      window.__JUCE__.backend.emitByBackend('tempo', '90');
      if (window.RevFXGlitch) { window.RevFXGlitch.cfg.auto = false; window.RevFXGlitch.stop(); }
    },
    emit: (v) => window.__JUCE__.backend.emitByBackend('gluegr', JSON.stringify(v)),
  },
};

/* The plugin's relays stood in for, after Drift tests/h2_fxview_probe.cjs (installMock / mockConfig): every slider,
   toggle and combo the page names, 0..1 linear, answering requestInitialUpdate with the page's DEFAULTS (+ `over`)
   and echoing each write; no natives (the page feature-detects them). Runs in the page before any script. */
function mockConfig(src, over) {
  const m = /const DEFAULTS=(\{[\s\S]*?\n\});/.exec(src);
  if (!m) throw new Error('DEFAULTS block not found');
  const defaults = { ...new Function('return ' + m[1])(), ...over };
  const toggles = new Set();
  for (const tag of src.match(/<[^>]*\bdata-toggle\b[^>]*>/g) || []) { const q = /data-param="([A-Z0-9_]+)"/.exec(tag); if (q) toggles.add(q[1]); }
  for (const tag of src.match(/<[^>]*\bdata-combo\b[^>]*>/g) || []) {
    const q = /data-param="([A-Z0-9_]+)"/.exec(tag), i = /data-init="(\d+)"/.exec(tag), o = /data-options="([^"]*)"/.exec(tag);
    if (!q || !i || !o || q[1] in defaults) continue;
    const n = JSON.parse(o[1].replace(/&quot;/g, '"')).length;
    if (n > 1) defaults[q[1]] = +i[1] / (n - 1);
  }
  const sliders = new Set(Object.keys(defaults));
  for (const r of src.matchAll(/data-(?:param|p0|p1|mode-param)="([A-Z0-9_]+)"/g)) if (!toggles.has(r[1])) sliders.add(r[1]);
  toggles.forEach((t) => sliders.delete(t));
  return { defaults, sliders: [...sliders].sort(), toggles: [...toggles].sort() };
}
function mockBackend(cfg) { // cfg.fns: the natives the page finds, answered with cfg.answers[name] or null
  const L = new Map(); let seq = 0; const vals = {};
  const fire = (id, payload) => { const m = L.get(id); if (m) for (const fn of [...m.values()]) { try { fn(payload); } catch (e) { setTimeout(() => { throw e; }); } } };
  const route = (id, obj) => {
    if (id === '__juce__invoke') {
      setTimeout(() => fire('__juce__complete', { promiseId: obj.resultId, result: (cfg.answers || {})[obj.name] ?? null }), 0);
      return;
    }
    const m = /^__juce__(slider|toggle|comboBox)(.+)$/.exec(id);
    if (!m || !obj) return;
    const [, kind, name] = m;
    if (obj.eventType === 'requestInitialUpdate') setTimeout(() => {
      fire(id, kind === 'slider' ? { eventType: 'propertiesChanged', start: 0, end: 1, skew: 1, name, label: '', numSteps: 100, interval: 0, parameterIndex: -1 }
        : { eventType: 'propertiesChanged', name, parameterIndex: -1 });
      fire(id, { eventType: 'valueChanged', value: id in vals ? vals[id] : kind === 'toggle' ? !!cfg.defaults[name] : name in cfg.defaults ? cfg.defaults[name] : 0.5 });
    }, 0);
    else if (obj.eventType === 'valueChanged') { vals[id] = obj.value; setTimeout(() => fire(id, { eventType: 'valueChanged', value: obj.value }), 0); }
  };
  window.__JUCE__ = {
    postMessage() {},
    initialisationData: { __juce__platform: ['mac'], __juce__registeredGlobalEventIds: [],
      __juce__sliders: cfg.sliders, __juce__toggles: cfg.toggles, __juce__comboBoxes: [], __juce__functions: cfg.fns },
    backend: {
      addEventListener(id, fn) { if (!L.has(id)) L.set(id, new Map()); const k = ++seq; L.get(id).set(k, fn); return [id, k]; },
      removeEventListener(tok) { const m = tok && L.get(tok[0]); if (m) m.delete(tok[1]); },
      emitEvent(id, obj) { route(id, obj); },
      emitByBackend(id, s) { fire(id, JSON.parse(s)); },
    },
  };
}

const [, , NAME, VALUES, OUT, FPS_ARG, PROBE] = process.argv;
const P = PLUGINS[NAME];
if (!P || !VALUES || !OUT) throw new Error('usage: record-plugin.mjs <gas|radio-roulette|gas2|revfx> <values.json> <outDir> [fps] [probe]');
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
if (P.mock) await page.addInitScript(mockBackend, { ...mockConfig(fs.readFileSync(`${P.dir}/index.html`, 'utf8'), P.mock), fns: P.mockFns || [], answers: P.mockAnswers });
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
// the tail: the loop's next frames, for the crossfade (P.tail frames)
for (let i = 0; i < (P.tail || 0) * every; i++, k++) {
  await page.evaluate(P.emit, ROWS[k % ROWS.length]); await page.clock.runFor(TICK);
  if (i % every === 0) await shoot(path.join(OUT, `f_${String(n++).padStart(4, '0')}.png`));
}
console.log(NAME, 'frames', n, 'at', FPS, 'fps;', errs.length ? errs.slice(0, 5) : 'no errors');
await b.close();
