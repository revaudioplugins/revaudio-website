/**
 * shoot-drift-fx-rack.mjs — the /drift #fx LIVE RACK layers, shot from the DRIFT plugin's own UI (website rule:
 * product images come from the real UI). Dan 2026-10-09: #fx = the 5.2.4 FX rack, built from its real pixels, with
 * live screens, a page RANDOMIZE and strips that ride the rail.
 *
 *   cd ~/projects/revaudio/Drift/Source/ui/public && python3 -m http.server 4399 --bind 127.0.0.1
 *   node tools/shoot-drift-fx-rack.mjs [http://127.0.0.1:4399/index.html]
 *
 * Opens the plugin page standalone (no JUCE: the page's own fallback) at its native 1725x912 stage, opens the FX
 * rack (window.FXBAY) and shoots the FX view's stacking order as separate true-alpha layers, all on one stage box
 * (deck top .. stage bottom) at DPR 2:
 * (shot, then merged / cut below)
 *   rack-base.png     the bay floor (#fxBay + #winFx backgrounds), nothing on it
 *   rack-<id>.png     one strip's plate + every part on it (knobs, keys, combos, bezel), screen canvas hidden
 *   rack-lcd.png      the header LCD glass (SNAPSHOT A-D, dashed rules, //// FX RACK ////), under the chassis
 *   rack-chassis.png  the A-RAIL console (#fxChassis: frame, bay shade, groove, notches, stops) over the plates
 *   rack-grab-<id>.png the strip's carriage on the rail (z over the chassis)
 *   rack-deck.png     the deck over it all: the RING-MIX dial and the FX POWER key
 * The X key, RANDOMIZE, the dice tiles and the roll counter are left out of every layer: the page draws those itself.
 * Kept: rack-floor.png (base + LCD), rack-<id>.png + rack-grab-<id>.png (cut to their box), rack-top.png (chassis + deck)
 * + rack.json: the stage box, each strip's plate / canvas / carriage rect and the header parts the page overlays,
 * in stage px. Re-shoot whenever the rack changes.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { unlinkSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://127.0.0.1:4399/index.html';
const outDir = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/seasons/drift/rack');
const DPR = 2;
const STRIPS = [['pitch', 's-pitch'], ['echo', 's-dly'], ['reverb', 's-verb'], ['halo', 's-halo'], ['glue', 's-glue']];

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1725, height: 912 }, deviceScaleFactor: DPR, reducedMotion: 'reduce' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.evaluate(() => { document.body.classList.add('ui-ready'); window.FXBAY && window.FXBAY.open(); });
await p.waitForTimeout(2500);

const geo = await p.evaluate((strips) => {
  if (!window.FXBAY || !window.FXBAY.isOpen()) throw new Error('FX rack did not open');
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
  const deck = document.getElementById('fxBayDeck'), win = document.getElementById('winFx');
  const st = document.getElementById('stage').getBoundingClientRect();
  const stage = { x: r(win).x, y: r(deck).y, w: r(win).w, h: st.bottom - r(deck).y };
  const rel = (b) => ({ x: +(b.x - stage.x).toFixed(1), y: +(b.y - stage.y).toFixed(1), w: +b.w.toFixed(1), h: +b.h.toFixed(1) });
  const out = { stage, strips: {} };
  for (const [id, cls] of strips) {
    out.strips[id] = {
      plate: rel(r(document.querySelector(`#winFx .fxvplate.${cls}`))),
      screen: rel(r(document.querySelector(`#winFx canvas.fxscr.${cls}`))),
      grab: rel(r(document.querySelector(`#winFx .fxgrab.${cls}`))),
      phos: getComputedStyle(document.querySelector(`#winFx canvas.fxscr.${cls}`)).getPropertyValue('--fx-phos').trim(),
      accent: getComputedStyle(document.querySelector(`#winFx canvas.fxscr.${cls}`)).getPropertyValue('--fx-accent').trim(),
      ink: getComputedStyle(document.querySelector(`#winFx canvas.fxscr.${cls}`)).getPropertyValue('--fx-ink').trim(),
      hot: getComputedStyle(document.querySelector(`#winFx canvas.fxscr.${cls}`)).getPropertyValue('--fx-hot').trim(),
    };
  }
  const lcd = document.getElementById('fxhLcd');
  out.header = {
    lcd: rel(r(lcd)),
    tiles: rel(r(lcd.querySelector('.tiles'))),
    cnt: rel(r(lcd.querySelector('.cnt'))),
    hdr: rel(r(document.querySelector('#winFx .pxbar .fxh-hdr'))),
    rnd: rel(r(document.getElementById('fxRnd'))),
    x: rel(r(document.querySelector('.fxbay-xcap'))),
  };
  return out;
}, STRIPS);

const clip = { x: geo.stage.x, y: geo.stage.y, width: geo.stage.w, height: geo.stage.h };

/** show only what `keepFn` (run in the page) tags data-rk / data-rk-bg, every other pixel transparent */
async function layer(file, keepFn, arg) {
  await p.evaluate(() => {
    document.querySelectorAll('[data-rk]').forEach((e) => e.removeAttribute('data-rk'));
    document.querySelectorAll('[data-rk-bg]').forEach((e) => e.removeAttribute('data-rk-bg'));
  });
  await p.evaluate(keepFn, arg);
  await p.evaluate(() => {
    let s = document.getElementById('rk-iso');
    if (!s) { s = document.createElement('style'); s.id = 'rk-iso'; document.head.appendChild(s); }
    s.textContent = `html, body { background: transparent !important; }
      body * { visibility: hidden !important; }
      [data-rk], [data-rk] * { visibility: visible !important; }
      [data-rk-bg] { visibility: visible !important; }
      [data-rk-bg] > * { visibility: hidden !important; }
      [data-rk-hide], [data-rk-hide] * { visibility: hidden !important; }`;
  });
  await p.waitForTimeout(250);
  await p.screenshot({ path: join(outDir, file), clip, omitBackground: true });
  console.log(file);
}

// the page draws these itself
await p.evaluate(() => {
  for (const s of ['.fxbay-xcap', '#fxRnd', '#fxhLcd .tiles', '#fxhLcd .cnt', '#winFx canvas.fxscr']) {
    document.querySelectorAll(s).forEach((e) => e.setAttribute('data-rk-hide', ''));
  }
});

await layer('rack-base.png', () => {
  document.getElementById('fxBay').setAttribute('data-rk-bg', '');
  document.getElementById('winFx').setAttribute('data-rk-bg', '');
});
for (const [id, cls] of STRIPS) {
  await layer(`rack-${id}.png`, (c) => {
    const plate = document.querySelector(`#winFx .fxvplate.${c}`);
    const r = plate.getBoundingClientRect();
    const inside = (b) => b.width > 0 && b.height > 0 && b.left >= r.left - 6 && b.right <= r.right + 6 && b.top >= r.top - 6 && b.bottom <= r.bottom + 6;
    document.getElementById('winFx').querySelectorAll('*').forEach((e) => {
      if (e.closest('#fxChassis') || e.classList.contains('fxgrab')) return;
      if (inside(e.getBoundingClientRect())) e.setAttribute('data-rk', '');
    });
  }, cls);
  await layer(`rack-grab-${id}.png`, (c) => { document.querySelector(`#winFx .fxgrab.${c}`).setAttribute('data-rk', ''); }, cls);
}
await layer('rack-lcd.png', () => { document.querySelector('#winFx .pxbar').setAttribute('data-rk', ''); });
await layer('rack-chassis.png', () => { document.getElementById('fxChassis').setAttribute('data-rk', ''); });
await layer('rack-deck.png', () => { document.getElementById('fxBayDeck').setAttribute('data-rk', ''); });

// the page stacks 3 kinds of layer: rack-floor (base + LCD glass, opaque) < the strips < rack-top (chassis + deck);
// the carriages ride between the chassis and the deck, which never overlap them. Strips + carriages are cut to their
// own box (+ a margin for the glow) so they can move; their crop is in rack.json (stage px).
const L = (f) => join(outDir, f);
await sharp(L('rack-base.png')).composite([{ input: L('rack-lcd.png') }]).flatten({ background: '#000' }).png().toFile(L('rack-floor.png'));
await sharp(L('rack-chassis.png')).composite([{ input: L('rack-deck.png') }]).png().toFile(L('rack-top.png'));
for (const f of ['rack-base.png', 'rack-lcd.png', 'rack-chassis.png', 'rack-deck.png']) unlinkSync(L(f));
const cut = async (file, b, m) => {
  const box = { x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), w: b.w + 2 * m, h: b.h + 2 * m };
  box.w = Math.min(box.w, geo.stage.w - box.x); box.h = Math.min(box.h, geo.stage.h - box.y);
  const px = { left: Math.round(box.x * DPR), top: Math.round(box.y * DPR), width: Math.round(box.w * DPR), height: Math.round(box.h * DPR) };
  const buf = await sharp(L(file)).extract(px).png().toBuffer();
  await sharp(buf).toFile(L(file));
  return { x: px.left / DPR, y: px.top / DPR, w: px.width / DPR, h: px.height / DPR };
};
for (const [id] of STRIPS) {
  geo.strips[id].crop = await cut(`rack-${id}.png`, geo.strips[id].plate, 12);
  geo.strips[id].grabCrop = await cut(`rack-grab-${id}.png`, geo.strips[id].grab, 6);
}

writeFileSync(join(outDir, 'rack.json'), JSON.stringify(geo, null, 1) + '\n');
console.log('rack.json', JSON.stringify(geo.stage));
if (errs.length) console.log('page errors:', errs);
await br.close();
