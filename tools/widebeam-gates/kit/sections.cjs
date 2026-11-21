// Section shots of /widebeam: one element screenshot per top-level section, per size and engine.
// Usage: NODE_PATH=<repo>/node_modules node sections.cjs <base> <outdir> [--sizes L1141,P390] [--engines chromium,webkit]
// Deterministic by construction: reducedMotion 'reduce' (the page then removes the intro video and shows the road
// at once, no Lenis, no GSAP tweens), cookie banner + fixed chrome hidden, fonts + images settled, canvas/video masked.
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');

const argv = process.argv.slice(2);
const BASE = (argv[0] || process.env.BASE || '').replace(/\/$/, '');
const OUT = path.resolve(argv[1] || path.join(L.RUNS, 'sections-' + Date.now()));
const SIZES = L.parseList(argv, '--sizes', Object.keys(L.SIZES));
const ENGINES = L.parseList(argv, '--engines', ['chromium', 'webkit']);
if (!/^https?:/.test(BASE)) { console.error('usage: sections.cjs <base> <outdir> [--sizes ..] [--engines ..]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

// Top-level sections of src/pages/widebeam.astro, in page order. Each is found by a stable id (or the hero's class),
// with fallbacks, so a pure refactor that keeps ids/classes keeps the shots comparable. The footer is the site's own.
const SECTIONS = [
  ['hero', ['.wb-hero', '[data-wb-page] > section:first-of-type']],
  ['get', ['#wb-get', '.wb-get']],
  ['drive', ['#wb-drive', '.wb-drive']],
  ['story', ['#wb-story', '.wb-story']],
  ['manual', ['#manual', '.wb-manual']],
  ['presets', ['#wb-presets', '.wb-presets']],
  ['specs', ['#wb-specs', '.wb-specs']],
  ['notify', ['#wb-notify', '.wb-notify']],
  ['footer', ['footer.site-footer', 'footer']],
];

// Fixed / sticky site chrome that would sit on top of whatever is shot: the nav, SOUND pill, cart, banner, haze.
// The first-screen shot ("fold") keeps the nav and the SOUND pill, because the hero is judged with them.
const CHROME_CSS = `#cookie-banner,[class*="cookie"],.cart-fab,.cart-tip,.haze,.ss,.si,.st{display:none!important}
.site-nav,.wb-sound{visibility:hidden!important}`;
const FOLD_CSS = `.site-nav,.wb-sound{visibility:visible!important}`;
// text carets / focus rings never differ run to run, but a blinking caret can: none is focused here anyway.

async function settle(page) {
  // fonts, then every image decoded (lazy ones are brought in by the pre-walk), then two frames
  await page.evaluate(async () => {
    const cap = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
    await cap(document.fonts.ready, 5000);
    // only images that have a source and are displayed (an <img> with no src never loads and must not stall the shot)
    const imgs = [...document.images].filter((i) => i.currentSrc && i.getClientRects().length);
    await cap(Promise.all(imgs.map((i) => cap((i.complete ? Promise.resolve() : new Promise((res) => { i.addEventListener('load', res, { once: true }); i.addEventListener('error', res, { once: true }); })).then(() => i.decode().catch(() => {})), 5000))), 8000);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}
const scrollTo = async (page, y) => {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(500);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

async function find(page, sels) {
  for (const s of sels) { const h = await page.$(s); if (h) return { s, h }; }
  return null;
}

(async () => {
  let wrote = 0, missing = [];
  for (const engine of ENGINES) {
    const browser = await L.launch(engine, true);
    for (const size of SIZES) {
      const ctx = await L.newCtx(browser, size); // reducedMotion 'reduce'
      const page = await ctx.newPage();
      await page.goto(BASE + '/widebeam', { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      await page.addStyleTag({ content: CHROME_CSS });
      await page.keyboard.press('Escape').catch(() => {});
      // pre-walk: bring in lazy images and fire the reveal observers, then back to the top
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      const vh = await page.evaluate(() => innerHeight);
      for (let y = 0; y < total; y += Math.round(vh * 0.8)) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(250); }
      await scrollTo(page, 0);
      await settle(page);
      // Masks: every <video> and every <canvas> gets Playwright's mask box, EXCEPT the hero's full-bleed night canvas
      // ([data-wb-night]): boxed, it would paint over the title and buttons on top of it, so it is taken out of the picture
      // with visibility:hidden instead (the road still behind it stays). See MASKS.md.
      await page.evaluate(() => { document.querySelectorAll('canvas, video').forEach((e) => { if (e.matches('[data-wb-night], [data-story-canvas]')) e.setAttribute('data-kit-hide', ''); else e.setAttribute('data-kit-mask', ''); }); });
      // n16 (stage 4): the story canvas is hidden only, never masked: its mask box leaked into the P390/P360 Chrome drive shot
      // (the sticky stage is painted elsewhere than the box was computed for)
      // every canvas/video is ALSO taken out of the picture (visibility:hidden keeps the layout): on a very tall element shot the
      // sticky story stage is painted at a different place than the mask box was computed for, and the canvas leaked round its edge
      await page.addStyleTag({ content: '[data-kit-hide],[data-kit-mask]{visibility:hidden!important}' });
      const mask = () => page.locator('[data-kit-mask]');
      const dbg = (m) => { if (process.env.DEBUG_KIT) console.log('  ..', m); };
      dbg('walked');

      // the first screen as a visitor sees it, with the nav and the SOUND pill
      await page.addStyleTag({ content: FOLD_CSS });
      await scrollTo(page, 0);
      dbg('fold');
      await page.screenshot({ path: path.join(OUT, `${size}-${engine}-fold.png`), mask: [mask()], animations: 'disabled', caret: 'hide' });
      wrote++;
      await page.addStyleTag({ content: CHROME_CSS });

      for (const [name, sels] of SECTIONS) {
        const f = await find(page, sels);
        if (!f) { missing.push(`${size}-${engine}-${name}`); continue; }
        // bring the section to the top of the screen so its own scroll-tied state is the same every run
        const top = await f.h.evaluate((e) => e.getBoundingClientRect().top + scrollY);
        await scrollTo(page, Math.max(0, Math.round(top)));
        await settle(page);
        dbg(name);
        await f.h.screenshot({ path: path.join(OUT, `${size}-${engine}-${name}.png`), mask: [mask()], animations: 'disabled', caret: 'hide' });
        wrote++;
      }
      // the story is a tall sticky stage: also shoot the screen at 5 points down it
      const st = await find(page, SECTIONS.find((s) => s[0] === 'story')[1]);
      if (st) {
        const box = await st.h.evaluate((e) => ({ top: e.getBoundingClientRect().top + scrollY, h: e.offsetHeight, vh: innerHeight }));
        for (let i = 0; i < 5; i++) {
          await scrollTo(page, Math.round(box.top + ((box.h - box.vh) * i) / 4));
          await settle(page);
          await page.screenshot({ path: path.join(OUT, `${size}-${engine}-story-p${i}.png`), mask: [mask()], animations: 'disabled', caret: 'hide' });
          wrote++;
        }
      }
      await ctx.close();
      console.log(`${engine} ${size} done`);
    }
    await browser.close();
  }
  console.log(`sections: wrote ${wrote} shots to ${OUT}`);
  if (missing.length) { console.log('MISSING sections (selector not found): ' + missing.join(', ')); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
