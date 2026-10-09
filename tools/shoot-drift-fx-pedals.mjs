/**
 * shoot-drift-fx-pedals.mjs — the /drift #fx pedals as TRUE-ALPHA PNGs, shot from the DRIFT plugin's own UI
 * (website rule: product images come from the real UI). Dan 2026-10-04: the phone #fx carousel shows whole
 * pedals on transparent backgrounds ("make sure the pedals are transparent, true alpha").
 *
 *   cd ~/projects/revaudio/Drift/Source/ui/public && python3 -m http.server 4399 --bind 127.0.0.1
 *   node tools/shoot-drift-fx-pedals.mjs [http://127.0.0.1:4399/index.html] [ids, e.g. halo]
 *
 * HALO (replaces TREMOLO; Dan 10-08) is on Drift main from 5.2 (re-shot from 5.2.4 on 10-09): pass `halo` so the
 * other pedals stay as shot from their own build.
 *
 * Opens the plugin page standalone (no JUCE: the page's own fallback), opens the FX rack (window.FXBAY), and per
 * strip hides everything except the parts that sit inside that strip's plate (the rack, the other strips, the
 * header), clears every background, and screenshots the plate box + a margin for the glow with omitBackground.
 * DPR 3: a plate is ~974 px wide, enough for a ~300 css px card on a 3x phone. Writes
 * src/assets/seasons/drift/pedal-<id>.png and prints each one's alpha coverage (corners must be 0).
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://127.0.0.1:4399/index.html';
const outDir = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/seasons/drift');
const ALL = [['pitch', 's-pitch'], ['echo', 's-dly'], ['reverb', 's-verb'], ['tremolo', 's-trem'], ['halo', 's-halo']];
const only = process.argv[3]?.split(',');
const STRIPS = ALL.filter(([id]) => (only ? only.includes(id) : id !== 'halo'));
const MARGIN = 14;   // css px around the plate: the strip's glow and shadow stay, still transparent past them

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1725, height: 912 }, deviceScaleFactor: 3, reducedMotion: 'reduce' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.evaluate(() => { document.body.classList.add('ui-ready'); window.FXBAY && window.FXBAY.open(); });
await p.waitForTimeout(1500);
// standalone, every FX screen reads 0 for every param (no JUCE): HALO's screen then says MODE 1 under the lit
// default key 2. A narrow JUCE stub answers only the listed params (normalised); anything else throws, which the
// page's readers already treat as "no JUCE" (0 / the DOM's power lamps), so nothing else changes.
const SCREEN_STATE = { HALO_MODE: 1 / 3 };   // MODE 2, the plugin's default (DRIFT 5.1.0 index.html HALO_MODE:1/3)
if (STRIPS.some(([id]) => id === 'halo')) {
  await p.evaluate((st) => {
    window.Juce = { getSliderState(pid) { if (pid in st) return { getNormalisedValue: () => st[pid] }; throw new Error('stub'); },
      getToggleState() { throw new Error('stub'); } };
  }, SCREEN_STATE);
  await p.waitForTimeout(800);
}
for (const [id, cls] of STRIPS) {
  const box = await p.evaluate((c) => {
    const plate = document.querySelector(`#winFx .fxvplate.${c}`);
    const r = plate.getBoundingClientRect();
    const win = document.getElementById('winFx');
    const inside = (b) => b.width > 0 && b.height > 0 && b.left >= r.left - 6 && b.right <= r.right + 6 && b.top >= r.top - 6 && b.bottom <= r.bottom + 6;
    document.querySelectorAll('[data-pedal-keep]').forEach((e) => e.removeAttribute('data-pedal-keep'));
    win.querySelectorAll('*').forEach((e) => { if (inside(e.getBoundingClientRect())) e.setAttribute('data-pedal-keep', ''); });
    let st = document.getElementById('pedal-iso');
    if (!st) { st = document.createElement('style'); st.id = 'pedal-iso'; document.head.appendChild(st); }
    st.textContent = `html, body, body * { background-color: transparent !important; }
      body * { visibility: hidden !important; }
      #winFx [data-pedal-keep], #winFx [data-pedal-keep] * { visibility: visible !important; }
      #winFx [data-pedal-keep] { background-color: revert-layer !important; }
      html, body { background: transparent !important; }`;
    return { x: r.left, y: r.top, w: r.width, h: r.height, kept: win.querySelectorAll('[data-pedal-keep]').length };
  }, cls);
  await p.waitForTimeout(300);
  const clip = { x: box.x - MARGIN, y: box.y - MARGIN, width: box.w + 2 * MARGIN, height: box.h + 2 * MARGIN };
  const buf = await p.screenshot({ clip, omitBackground: true });
  const out = join(outDir, `pedal-${id}.png`);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(out);
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let t = 0; for (let i = 3; i < data.length; i += 4) if (data[i] < 8) t++;
  const a = (x, y) => data[(y * info.width + x) * 4 + 3];
  console.log(`pedal-${id}.png ${info.width}x${info.height} kept ${box.kept} parts · transparent ${(t / (data.length / 4) * 100).toFixed(1)}% · corners ${a(0, 0)} ${a(info.width - 1, 0)} ${a(0, info.height - 1)} ${a(info.width - 1, info.height - 1)}`);
}
if (errs.length) console.log('page errors:', errs.slice(0, 3));
await br.close();
