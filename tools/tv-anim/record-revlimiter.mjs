// RevLimiter's real UI running (served from the Revlimiter repo, no host), for the TV's pixelated animation.
// Playwright's fake clock steps the page frame by frame, the plugin's own 'meters' event is fed a periodic
// mix (120 BPM, one 4 s loop = 2 bars), so frame N and frame N + loop are the same picture: a seamless loop.
//   1. python3 -m http.server 8787 --bind 127.0.0.1   (in Revlimiter/Source/ui/public; its fonts/ -> Assets symlink)
//   2. node tools/tv-anim/record-revlimiter.mjs <outDir> [fps=15] [width=933]   -> outDir/f_0000.png ... (one 4 s loop)
//   3. the TV's cut: each frame down to the pixel size (194 or 129 wide), LANCZOS + a light unsharp, as an animated WebP
import { webkit } from 'playwright';
import fs from 'node:fs';
const OUT = process.argv[2]; const FPS = +(process.argv[3] || 15); const W = +(process.argv[4] || 933);
fs.mkdirSync(OUT, { recursive: true });
const LOOP = 4000, TICK = 1000 / 60;
const b = await webkit.launch();
const page = await b.newPage({ viewport: { width: W, height: Math.round(W * 901 / 1866) + 2 }, deviceScaleFactor: 1 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).split('\n')[0]));
await page.clock.install({ time: new Date('2026-11-09T12:00:00Z') });
await page.goto('http://127.0.0.1:8787/index.html', { waitUntil: 'load' });
await page.clock.runFor(1500);
await page.waitForTimeout(800);
// the plugin's real idle state (tools/revlimiter-shoot/shoot-revlimiter.mjs)
await page.evaluate(() => {
  const setP = (id, norm) => { try { const st = window.Juce.getSliderState(id); st.setNormalisedValue(norm); st.valueChangedEvent?.callListeners?.(); } catch (e) {} };
  document.querySelectorAll('[data-revaudio="knob"]').forEach((el) => {
    const min = +el.dataset.min, max = +el.dataset.max, def = +el.dataset.default;
    setP(el.dataset.paramId, (def - min) / (max - min));
  });
  setP('mode', 0); setP('comp_mode', 0); setP('lim_mode', 0); setP('clip_mode', 0);
  try { const t = window.Juce.getToggleState('modes_off'); t.setValue(false); t.valueChangedEvent?.callListeners?.(); } catch (e) {}
  setP('xover_low', Math.log(150 / 20) / Math.log(1000 / 20));
  setP('xover_high', Math.log(2500 / 200) / Math.log(16000 / 200));
  const os = document.getElementById('osCombo'); if (os) { os.value = '1'; os.dispatchEvent(new Event('change', { bubbles: true })); }
  const fix = document.createElement('style');
  fix.textContent = '#swNos .guard-face.back { visibility: hidden !important; } html, body { background: #000 !important; }';
  document.head.appendChild(fix);
  ['undoBtn', 'redoBtn'].forEach((id) => document.getElementById(id)?.classList.add('disabled'));
  // the mix: a kick on every beat (120 BPM), a snare on 2 and 4, a phrase swell over the 2 bars; everything periodic in 4 s
  window.__mix = (ms) => {
    const t = (ms % 4000) / 1000, beat = t * 2, ph = beat % 1, bar = Math.floor(beat) % 4;
    const kick = Math.exp(-ph * 7), snare = (bar === 1 || bar === 3) ? Math.exp(-ph * 9) * 0.7 : 0;
    const swell = 0.5 - 0.5 * Math.cos((t / 4) * 2 * Math.PI);
    const hit = Math.min(1, kick + snare);
    const lufsM = -12.5 + 3.2 * swell + 3.4 * hit;
    const gr = -(0.6 + 2.6 * hit + 0.8 * swell);
    return {
      inputDb: -7 + 5.6 * hit + 1.2 * swell, outputDb: -1.4 + 1.1 * hit, gr, clipGr: Math.max(0, hit - 0.55) * 2.2,
      lufs: -9.6 + 0.9 * swell, truePeak: -0.6 + 0.4 * hit, heatUse: 0.08 + 0.12 * hit,
      grLow: gr * 1.15, grMid: gr * 0.6, grHigh: gr * 0.35, maxIn: -0.4, maxOut: -0.2, lufsM, lufsI: -9.2, lra: 5.6,
    };
  };
});
const emit = (ms) => page.evaluate((m) => window.__JUCE__.backend.emitByBackend('meters', JSON.stringify(window.__mix(m))), ms);
// warm up three loops (the self-test sweep, the needle's inertia, the history strip filling), then record one
let ms = 0;
for (; ms < 3 * LOOP; ms += TICK) { await emit(ms); await page.clock.runFor(TICK); }
const every = Math.round(60 / FPS); let n = 0;
const plugin = page.locator('.plugin');
for (let i = 0; i < (LOOP / 1000) * 60; i++, ms += TICK) {
  await emit(ms); await page.clock.runFor(TICK);
  if (i % every === 0) await plugin.screenshot({ path: `${OUT}/f_${String(n++).padStart(4, '0')}.png` });
}
console.log('frames', n, 'at', FPS, 'fps;', errs.length ? errs.slice(0, 5) : 'no errors');
await b.close();
