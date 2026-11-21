// G10 a11y (plan §4 G10).
//  1 axe-core (4.10, WCAG 2.0/2.1 A+AA + label-content-name-mismatch): 0 violations at 1141x636 and 390x844, banner up / down, after sound on + a preset + the manual.
//  2 a Tab walk: focus never lands on body, every stop has a name and is on screen and uncovered; a glove-box card hands focus to the face
//    (L1141), or on an upright phone (P390) to the deck's 'Next preset', fully on screen (stage 4 cross fixer).
//  3 forced colours: every face control draws a ring (pixels differ focused vs not).
//  4 `contrast: more` brings in html.hc (small print lifted, steps at opacity 1).
//  5 AA contrast on painted pixels for every distinct text style under 18 px (Chrome).
//   node G10.cjs <base> [--engines chromium,webkit] [--only axe|walk|forced|hc|contrast]
const fs = require('fs');
const G = require('./Glib.cjs');
const GATE = 'G10';
const AXE_SRC = fs.readFileSync(G.AXE, 'utf8');
const RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const fresh = async (engine, size, extra = {}) => { const b = await G.launch(engine); const { ctx, page } = await G.page(b, engine, size, extra); await G.goto(page, G.BASE, '/widebeam', 2800); return { b, ctx, page }; };
async function reveal(page, touch) { // walk the page once so every reveal has played, then back to the top
  const max = await G.maxScroll(page); for (let y = 0; y <= max; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await G.sleep(110); }
  await page.evaluate(() => window.scrollTo(0, 0)); await G.sleep(500);
}
async function axeRun(page) {
  await page.evaluate(AXE_SRC);
  return page.evaluate(async (RULES) => {
    const out = [];
    const a = await axe.run(document, { runOnly: { type: 'tag', values: RULES }, resultTypes: ['violations'] });
    for (const v of a.violations) out.push({ id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 2).map((n) => n.target.join(' ').slice(0, 60)) });
    const l = await axe.run(document, { runOnly: ['label-content-name-mismatch'], resultTypes: ['violations'] });
    for (const v of l.violations) out.push({ id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 2).map((n) => n.target.join(' ').slice(0, 60)) });
    return out;
  }, RULES);
}
const fmtV = (v) => v.map((x) => `${x.id} x${x.n} (${x.ex.join(' ; ')})`).join(' | ');

const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G10.cjs <base>');
  for (const engine of G.ARGS.engines) {
    const T = `[${engine}]`;
    if (engine === 'firefox') { G.skip(GATE, `a11y ${T}`, 'axe + walks run in Chrome and WebKit'); continue; }
    // 1 axe
    for (const size of ['L1141', 'P390']) await G.step(GATE, `axe: 0 violations, 3 page states [${engine} ${size}]`, async () => {
      const name = `axe: 0 violations, 3 page states [${engine} ${size}]`; const touch = G.isTouchSize(size); const { b, ctx, page } = await fresh(engine, size);
      try {
        const res = {};
        await reveal(page, touch); res['banner up'] = await axeRun(page);
        await G.declineCookie(page); await G.sleep(500); res['banner down'] = await axeRun(page);
        // sound on, a preset picked, the manual reached
        const s = await G.rect(page, '[data-wb-sound]'); if (s) { if (touch) await page.touchscreen.tap(Math.min(s.cx, page.viewportSize().width - 2), s.cy); else await page.mouse.click(s.cx, s.cy); await G.sleep(900); }
        await page.evaluate(() => { const c = document.querySelector('[data-preset="4"]'); if (c) c.click(); }); await G.sleep(1800);
        await G.bring(page, '#manual', touch, 0.4); await G.sleep(900);
        res['sound on + preset + manual'] = await axeRun(page);
        const bad = Object.entries(res).filter(([, v]) => v.length);
        G.ok(GATE, name, bad.length === 0, bad.length ? bad.map(([k, v]) => `${k}: ${fmtV(v)}`).join(' || ') : 'banner up, banner down, sound on + preset + manual: 0 violations');
        await ctx.close();
      } finally { await b.close(); }
    });

    // 2 the Tab walk
    for (const size of ['L1141', 'P390']) await G.step(GATE, `keyboard walk: focus never on body, names, on screen [${engine} ${size}]`, async () => {
      const name = `keyboard walk: focus never on body, names, on screen [${engine} ${size}]`; const { b, ctx, page } = await fresh(engine, size);
      try {
        const probs = []; const seen = []; let bodyStops = 0, unnamed = [], off = [], covered = [], lastBody = false;
        // stage 4: WebKit's plain Tab skips links (Safari's default), so it wrapped after a dozen form controls; Alt+Tab is
        // Safari's every-item walk, the same set Chrome's Tab visits. A body stop right before the walk repeats is the
        // wrap through the document's edge (WebKit passes the body there, Chrome does not), not a focus lost on the page.
        const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab';
        for (let i = 0; i < 150; i++) {
          await page.keyboard.press(TAB); await G.sleep(engine === 'webkit' ? 300 : 200);
          const d = await page.evaluate(() => {
            const el = document.activeElement; if (!el || el === document.body || el === document.documentElement) return { body: true };
            const r = el.getBoundingClientRect(); const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
            const name = (el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute('title') || el.textContent || el.getAttribute('alt') || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby')).textContent) || '').trim().replace(/\s+/g, ' ');
            const on = r.bottom > nav && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
            let cov = null; if (on) { const l = Math.max(r.left, 0), rr = Math.min(r.right, innerWidth), t = Math.max(r.top, 0), bb = Math.min(r.bottom, innerHeight); const h = document.elementFromPoint((l + rr) / 2, (t + bb) / 2); if (h && !el.contains(h) && !h.contains(el)) cov = (h.id || h.className.toString().split(' ')[0] || h.tagName); }
            const site = !!el.closest('nav[data-site-nav], header, footer'); return { site, key: el.tagName + (el.id || '') + '|' + (el.getAttribute('aria-label') || '') + '|' + name.slice(0, 20) + '|' + Math.round(r.left), name, on, cov, label: name.slice(0, 28) || el.tagName };
          });
          if (d.body) { bodyStops++; lastBody = true; continue; }
          if (seen.includes(d.key) && seen.length > 10) { if (lastBody) bodyStops--; break; } seen.push(d.key); lastBody = false;
          if (!d.name) unnamed.push(d.label); if (d.site) continue; /* the site's own nav / footer are not this page's to judge */ if (!d.on) off.push(d.label); if (d.cov) covered.push(`${d.label} under ${d.cov}`);
        }
        if (bodyStops > 1) probs.push(`focus on body ${bodyStops}x`); if (unnamed.length) probs.push('no name: ' + unnamed.slice(0, 4).join(', ')); if (off.length) probs.push('off screen: ' + off.slice(0, 4).join(', ')); if (covered.length) probs.push('covered: ' + covered.slice(0, 4).join(', '));
        G.ok(GATE, name, seen.length > 12 && probs.length === 0, probs.length ? probs.join('; ') : `${seen.length} distinct stops: all named, on screen, uncovered`);
        await ctx.close();
      } finally { await b.close(); }
    });
    await G.step(GATE, `a glove-box card (Enter) hands focus to the face ${T}`, async () => {
      const name = `a glove-box card (Enter) hands focus to the face ${T}`; const { b, ctx, page } = await fresh(engine, 'L1141');
      try {
        await G.hideCookie(page); if (!(await G.has(page, '[data-preset="8"]'))) return G.missing(GATE, name, 'no preset card 09');
        await G.bring(page, '[data-preset="8"]'); await page.locator('[data-preset="8"]').focus(); await page.keyboard.press('Enter'); await G.sleep(2800);
        const a = await page.evaluate(() => { const e = document.activeElement; return { inFace: !!e && !!e.closest('[data-wb-face]'), what: e ? (e.getAttribute('aria-label') || e.tagName) : 'none', y: Math.round(scrollY) }; });
        await page.keyboard.press('Tab'); await G.sleep(700); const y2 = await G.scrollY(page);
        G.ok(GATE, name, a.inFace && Math.abs(y2 - a.y) < 200, `focus is on "${a.what}" (in the face: ${a.inFace}); the next Tab moved the page ${y2 - a.y} px`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // the same hand-off on an upright phone (Dan's D7 B: the face is inert there, so the focus goes to the deck's 'Next preset'):
    // focus there, fully on screen (under the nav, over the bottom edge), and the next Tab moves the page < 200 px (r-road-handoff)
    await G.step(GATE, `a glove-box card (Enter) hands focus to the deck's 'Next preset' [${engine} P390]`, async () => {
      const name = `a glove-box card (Enter) hands focus to the deck's 'Next preset' [${engine} P390]`; const { b, ctx, page } = await fresh(engine, 'P390');
      try {
        await G.hideCookie(page); if (!(await G.has(page, '[data-preset="8"]'))) return G.missing(GATE, name, 'no preset card 09');
        if (!(await G.has(page, '[data-wb-deck] [aria-label="Next preset"]'))) return G.missing(GATE, name, "no deck 'Next preset'");
        await G.bring(page, '[data-preset="8"]', true); await page.locator('[data-preset="8"]').focus(); await page.keyboard.press('Enter'); await G.sleep(2800);
        const a = await page.evaluate(() => { const e = document.activeElement; const r = e ? e.getBoundingClientRect() : null; const nav = document.querySelector('nav[data-site-nav], header'); const top = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
          return { deck: !!e && e.matches('[data-wb-deck] [aria-label="Next preset"]'), what: e ? (e.getAttribute('aria-label') || e.tagName) : 'none', full: !!r && r.top >= top && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, top: r ? Math.round(r.top) : null, bottom: r ? Math.round(r.bottom) : null, navEnd: Math.round(top), ih: innerHeight, y: Math.round(scrollY) }; });
        // WebKit's plain Tab skips buttons and links (Safari's default), as in the walk above: Alt+Tab is the keyboard user's Tab there
        await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab'); await G.sleep(700); const y2 = await G.scrollY(page);
        G.ok(GATE, name, a.deck && a.full && Math.abs(y2 - a.y) < 200, `focus is on "${a.what}" (the deck's: ${a.deck}); top ${a.top} / bottom ${a.bottom} (nav ends ${a.navEnd}, screen ${a.ih}): fully on screen ${a.full}; the next Tab moved the page ${y2 - a.y} px`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // 3 forced colours rings
    if (engine === 'chromium') await G.step(GATE, `forced colours: every face control draws a focus ring ${T}`, async () => {
      const name = `forced colours: every face control draws a focus ring ${T}`; const { b, ctx, page } = await fresh(engine, 'L1141', { forcedColors: 'active' });
      try {
        await G.hideCookie(page); await G.bring(page, '[data-wb-face]'); await G.sleep(1200);
        const n = await page.evaluate(() => document.querySelectorAll('[data-wb-face] .wb-hit').length); if (!n) return G.missing(GATE, name, 'no .wb-hit controls');
        const none = [];
        for (let i = 0; i < n; i++) {
          await page.evaluate(() => document.activeElement && document.activeElement.blur()); await G.sleep(120);
          const box = await page.evaluate((i) => { const e = document.querySelectorAll('[data-wb-face] .wb-hit')[i]; const r = e.getBoundingClientRect(); return { label: e.getAttribute('aria-label') || e.className, x: Math.max(0, r.x - 14), y: Math.max(0, r.y - 14), width: r.width + 28, height: r.height + 28 }; }, i);
          box.width = Math.min(box.width, 700); box.height = Math.min(box.height, 700);
          const a = await page.screenshot({ clip: box }); await page.keyboard.press('Shift');
          await page.evaluate((i) => document.querySelectorAll('[data-wb-face] .wb-hit')[i].focus(), i); await G.sleep(200);
          const c = await page.screenshot({ clip: box });
          if (a.equals(c)) none.push(box.label);
        }
        G.ok(GATE, name, none.length === 0, none.length ? `no pixel change when focused: ${none.join(', ')} (of ${n})` : `all ${n} controls change pixels when focused`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // 4 contrast: more
    await G.step(GATE, `contrast: more brings in html.hc (small print lifted, steps at opacity 1) ${T}`, async () => {
      const name = `contrast: more brings in html.hc (small print lifted, steps at opacity 1) ${T}`; const b = await G.launch(engine);
      try {
        const read = async (contrast) => { const { ctx, page } = await G.page(b, engine, 'L1141', { contrast }); await G.goto(page, G.BASE, '/widebeam', 1800); const r = await page.evaluate(() => { const f = document.querySelector('.wb-fine,.wb-get-micro,.wb-headsub'); const steps = [...document.querySelectorAll('[id^="wb-step-"]')]; const c = f ? getComputedStyle(f).color.match(/\d+/g).map(Number) : null; return { hc: document.documentElement.classList.contains('hc'), c, minOp: steps.length ? Math.min(...steps.map((s) => +getComputedStyle(s).opacity)) : null, nSteps: steps.length }; }); await ctx.close(); return r; };
        let more; try { more = await read('more'); } catch (e) { return G.skip(GATE, name, 'this Playwright cannot emulate contrast: ' + String(e.message).split('\n')[0]); }
        const norm = await read('no-preference');
        const probs = []; if (!more.hc) probs.push('html.hc not set under prefers-contrast: more'); if (norm.hc) probs.push('html.hc set without it');
        if (more.c && norm.c && lum(more.c) <= lum(norm.c) + 0.02) probs.push(`small print not lifted (${more.c} vs ${norm.c})`);
        if (more.minOp != null && more.minOp < 0.99) probs.push(`steps at opacity ${more.minOp}`);
        G.ok(GATE, name, probs.length === 0, probs.length ? probs.join('; ') : `html.hc on; small print ${norm.c} -> ${more.c}; steps min opacity ${more.minOp}`);
      } finally { await b.close(); }
    });

    // 5 painted-pixel AA contrast
    if (engine === 'chromium') for (const size of ['L1141', 'P390']) await G.step(GATE, `AA contrast on painted pixels, text under 18 px [${engine} ${size}]`, async () => {
      const name = `AA contrast on painted pixels, text under 18 px [${engine} ${size}]`; const touch = G.isTouchSize(size); const { b, ctx, page } = await fresh(engine, size, { deviceScaleFactor: 1 });
      try {
        await page.keyboard.press('Escape'); await G.hideCookie(page);
        // stage 4: every fold open, so its text is measured as a visitor sees it opened (a closed <details> keeps a layout box
        // for its content but paints none: the old pass measured the Specs card's ink against the closer's strap behind it)
        await page.evaluate(() => document.querySelectorAll('[data-wb-page] details').forEach((d) => { d.open = true; }));
        await reveal(page, touch);
        const picks = await page.evaluate(() => {
          const seen = new Map(); const root = document.querySelector('[data-wb-page]');
          const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            const t = n.textContent.trim(); if (t.length < 3) continue; const e = n.parentElement; if (!e || e.closest('[aria-hidden="true"],script,style,.sr-only,[hidden],canvas,svg')) continue;
            const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 4 || r.height < 4 || (e.checkVisibility && !e.checkVisibility())) continue;
            const px = parseFloat(cs.fontSize); const large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700); if (large) continue;
            let op = 1; for (let x = e; x; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity); if (op < 0.05) continue;
            const key = e.tagName + '.' + (e.className.toString().split(' ')[0] || '') + '|' + cs.color + '|' + cs.fontSize; if (!seen.has(key)) { e.setAttribute('data-gate-c', String(seen.size)); seen.set(key, { i: seen.size, text: t.slice(0, 30), color: cs.color, size: cs.fontSize }); }
          }
          return [...seen.values()];
        });
        const bad = []; let n = 0;
        for (const p of picks.slice(0, 70)) {
          // bring it on screen with the wheel / scrollTo, then read the pixels behind the text
          const sel = `[data-gate-c="${p.i}"]`; await G.bring(page, sel, true, 0.5); await G.sleep(700);
          const readInfo = () => page.evaluate((i) => { const el = document.querySelector(`[data-gate-c="${i}"]`); if (!el) return null; const cs = getComputedStyle(el); let op = 1; for (let x = el; x; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity); const m = cs.color.match(/[\d.]+/g).map(Number); return { color: m.slice(0, 3), alpha: (m[3] ?? 1) * op }; }, p.i);
          let info = await readInfo(); for (let k = 0; k < 8 && info && info.alpha < 0.98; k++) { await G.sleep(300); info = await readInfo(); } // a reveal still fading in is not the text's colour
          if (!info) continue;
          for (let k = 0; k < 4; k++) { const a = await G.rect(page, sel); await G.sleep(160); const c2 = await G.rect(page, sel); if (a && c2 && Math.abs(a.top - c2.top) < 0.5) break; }
          const box = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); const x = Math.max(0, r.x), y = Math.max(44, r.y); return { x, y, width: Math.min(r.width, innerWidth - x), height: Math.min(r.bottom, innerHeight) - y }; }, sel);
          if (box.width < 3 || box.height < 3) continue;
          const st = await page.addStyleTag({ content: `${sel}, ${sel} * { color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }` }); await G.sleep(90);
          const png = await page.screenshot({ clip: box }); await st.evaluate((n) => n.remove());
          const px = await page.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; const o = []; for (let i = 0; i < d.length; i += 16) o.push([d[i], d[i + 1], d[i + 2]]); return o; }, png.toString('base64'));
          if (!px.length) continue; n++;
          const L = px.map((q) => [lum(q), q]).sort((a, c) => a[0] - c[0]); const med = L[Math.floor(L.length / 2)][1];
          const fg = info.color.map((c, i) => Math.round(c * info.alpha + med[i] * (1 - info.alpha))); const r = ratio(fg, med);
          if (r < 4.5) { const where = await page.evaluate((sel) => { const e = document.querySelector(sel); const s = e.closest('section,[id]'); return (s && (s.id || s.className.toString().split(' ')[0])) || '?'; }, sel); bad.push(`"${p.text}" ${p.size} ${r.toFixed(2)}:1 in ${where} (text rgb ${info.color} on ~rgb ${med})`); if (process.env.WB_SHOTS) await page.screenshot({ path: `${process.env.WB_SHOTS}/contrast-${size}-${p.i}.png`, clip: box }); }
        }
        G.ok(GATE, name, n > 10 && bad.length === 0, bad.length ? `${bad.length} of ${n} text styles under 4.5:1: ${bad.slice(0, 6).join(' | ')}` : `${n} distinct text styles measured on painted pixels: all >= 4.5:1`);
        await ctx.close();
      } finally { await b.close(); }
    });
  }
});
