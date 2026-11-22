// G9 Phone (plan §4 G9). 390x844 and 360x740 (DPR 3, touch): the ask is on screen on >= 80 % of 200 px scroll steps after a real Decline tap;
// every story step is lit AND fully readable for >= 120 px (390) / >= 60 px (360) of scroll; 844x390: the face fits under the nav, the hero key is on
// screen, the cookie banner fits; a CDP swipe from a knob scrolls >= 100 px and leaves the value alone, a horizontal drag turns it (Chrome);
// the deck's controls are native ranges and the face's hits are inert; a tapped preset card does not stay hovered.
//   node G9.cjs <base> [--engines chromium,webkit]
const G = require('./Glib.cjs');
const GATE = 'G9';
const BAR_SEL = '[data-wb-bar],[data-wb-sticky],.wb-bar,.wb-sticky-bar,.wb-stickybar,.wb-stickyBar';
const fresh = async (engine, size) => { const b = await G.launch(engine); const { ctx, page } = await G.page(b, engine, size); await G.goto(page, G.BASE, '/widebeam', 2800); return { b, ctx, page }; };
const tap = async (page, sel) => { const r = await G.rect(page, sel); if (!r) throw new Error('MISSING ' + sel); await page.touchscreen.tap(r.cx, r.cy); };

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G9.cjs <base>');
  for (const engine of G.ARGS.engines) {
    if (engine === 'firefox') { G.skip(GATE, `phone gates [${engine}]`, 'Firefox has no mobile / touch emulation'); continue; }
    const T = `[${engine}]`;
    // 1. the ask is on screen on >= 80 % of 200 px steps
    for (const size of ['P390', 'P360']) await G.step(GATE, `ask visible on >= 80 % of 200 px scroll steps [${engine} ${size}]`, async () => {
      const name = `ask visible on >= 80 % of 200 px scroll steps [${engine} ${size}]`; const { b, ctx, page } = await fresh(engine, size);
      try {
        const dec = page.locator('#cookie-decline'); if (await dec.count()) { await tap(page, '#cookie-decline'); await G.sleep(700); }
        const max = await G.maxScroll(page); let yes = 0, n = 0; const where = [];
        for (let y = 0; y <= max; y += 200) {
          await page.evaluate((y) => window.scrollTo(0, y), y); await G.sleep(engine === 'webkit' ? 260 : 150);
          const v = await page.evaluate((BAR_SEL) => {
            const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
            const ok = (e) => { if (!e) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) return false; const r = e.getBoundingClientRect(); if (r.width < 20 || r.height < 14) return false; const l = Math.max(r.left, 0), rr = Math.min(r.right, innerWidth), t = Math.max(r.top, nav), b = Math.min(r.bottom, innerHeight); if (rr - l < r.width * 0.6 || b - t < r.height * 0.6) return false; const h = document.elementFromPoint((l + rr) / 2, (t + b) / 2); return !!h && (e.contains(h) || h.contains(e) && h !== document.body); };
            const cands = [...document.querySelectorAll('#wb-trial-email,#wb-email,[data-wb-trial] button[type=submit],[data-wb-form] button[type=submit]')]; const bar = document.querySelector(BAR_SEL); if (bar) cands.push(bar);
            return cands.some(ok);
          }, BAR_SEL);
          n++; if (v) yes++; else where.push(y);
        }
        const pct = (100 * yes) / n;
        G.ok(GATE, name, pct >= 80, `ask on screen in ${yes} of ${n} steps = ${pct.toFixed(1)} % (need >= 80; DRIFT 91.7 %); phone bar ${await G.has(page, BAR_SEL) ? 'present' : 'NOT present'}`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // 2. story steps lit and readable (stage 4: the step's [data-step-mark], lane S's empty 0 px anchor for the chapter
    //    links, placed by story.ts away from the text, is not text to read: it no longer counts toward the step's box)
    for (const [size, need] of [['P390', 120], ['P360', 60]]) await G.step(GATE, `every story step lit + readable >= ${need} px of scroll [${engine} ${size}]`, async () => {
      const name = `every story step lit + readable >= ${need} px of scroll [${engine} ${size}]`; const { b, ctx, page } = await fresh(engine, size);
      try {
        await G.hideCookie(page);
        if (await G.skipIfCut(page, GATE, name, 'story')) return;
        const info = await page.evaluate(() => { const steps = [...document.querySelectorAll('[id^="wb-step-"]')]; const stage = document.querySelector('.wb-story-stage,[data-wb-stage]'); const wrap = document.querySelector('.wb-steps,[data-wb-steps]') || (steps[0] && steps[0].parentElement); if (!steps.length || !stage || !wrap) return null; const r = wrap.getBoundingClientRect(); return { n: steps.length, a: Math.round(r.top + scrollY - innerHeight), z: Math.round(r.bottom + scrollY) }; });
        if (!info) return G.missing(GATE, name, 'no [id^=wb-step-] steps / .wb-story-stage');
        const lit = {}; const best = {};
        for (let y = info.a; y < info.z; y += 10) {
          await page.evaluate((y) => window.scrollTo(0, y), y); await G.sleep(engine === 'webkit' ? 110 : 40);
          const m = await page.evaluate(() => { const st = document.querySelector('.wb-story-stage,[data-wb-stage]').getBoundingClientRect(); const top = st.bottom, bot = innerHeight - 70; return [...document.querySelectorAll('[id^="wb-step-"]')].map((e, i) => { const kids = [...e.children].filter((k) => !/wb-step-n/.test(k.className) && !k.matches('[data-step-mark]')); const t = Math.min(...kids.map((k) => k.getBoundingClientRect().top)), b = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom)); const vis = Math.max(0, Math.min(b, bot) - Math.max(t, top)) / Math.max(1, b - t); const on = e.classList.contains('is-on') || +getComputedStyle(e).opacity >= 0.7; return { i, vis, on }; }); });
          for (const s of m) { best[s.i] = Math.max(best[s.i] || 0, s.vis); if (s.on && s.vis > 0.99) lit[s.i] = (lit[s.i] || 0) + 10; }
        }
        const per = Array.from({ length: info.n }, (_, i) => lit[i] || 0); const bad = per.map((p, i) => [i + 1, p]).filter(([, p]) => p < need);
        G.ok(GATE, name, bad.length === 0, `px of scroll lit + fully readable per step: ${per.join('/')} (need >= ${need} each)${bad.length ? '; short: step ' + bad.map(([i]) => i).join(',') : ''}`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // 3. sideways phone
    await G.step(GATE, `844x390: face fits under the nav, hero key on screen, cookie banner fits ${T}`, async () => {
      const name = `844x390: face fits under the nav, hero key on screen, cookie banner fits ${T}`; const { b, ctx, page } = await fresh(engine, 'S844');
      try {
        const r0 = await page.evaluate(() => { const cb = document.getElementById('cookie-banner'); const r = cb && cb.getBoundingClientRect(); const k = document.querySelector('[data-wb-start]').getBoundingClientRect(); const turn = document.querySelector('.wb-turn'); return { vh: innerHeight, banner: r ? { top: Math.round(r.top), h: Math.round(r.height) } : null, key: [Math.round(k.top), Math.round(k.bottom)], turn: turn ? getComputedStyle(turn).display : 'none' }; });
        await G.hideCookie(page); await G.bring(page, '[data-wb-face]', true); await G.sleep(600);
        const f = await page.evaluate(() => { const r = document.querySelector('[data-wb-face]').getBoundingClientRect(); const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44; return { w: Math.round(r.width), h: Math.round(r.height), nav, vh: innerHeight }; });
        const probs = [];
        if (f.h > f.vh - f.nav) probs.push(`the face is ${f.w}x${f.h} in a ${f.vh} px screen under a ${f.nav} px nav`);
        if (r0.key[0] < 0 || r0.key[1] > r0.vh) probs.push(`the hero key is at ${r0.key.join('-')} on a ${r0.vh} px screen`);
        if (r0.banner && (r0.banner.h > r0.vh || r0.banner.top < 0)) probs.push(`the cookie banner is ${r0.banner.h} px tall at top ${r0.banner.top}`);
        if (r0.turn !== 'none') probs.push('the "turn your phone sideways" line still shows sideways');
        G.ok(GATE, name, probs.length === 0, probs.length ? probs.join('; ') : `face ${f.w}x${f.h}, hero key ${r0.key.join('-')}, banner ${r0.banner ? r0.banner.h + ' px' : 'none'}`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // 4. swipe from a knob (Chrome CDP touch)
    if (engine === 'chromium') await G.step(GATE, `a swipe from a knob scrolls the page; a horizontal drag turns it ${T}`, async () => {
      const name = `a swipe from a knob scrolls the page; a horizontal drag turns it ${T}`; const { b, ctx, page } = await fresh(engine, 'P390');
      try {
        // n29 (stage 4): under 901 px held upright the face is inert by Dan's D7 B and the deck takes its gestures, so both
        // halves aim at the deck's WIDTH there (its native range carries the value); elsewhere at the face's WIDTH
        const deck = await page.evaluate(() => matchMedia('(max-width: 900px) and (orientation: portrait)').matches && !!document.querySelector('[data-wb-deck-ctl="width"]'));
        const KSEL = deck ? '[data-wb-deck-ctl="width"]' : G.knobSel('Width');
        const wval = deck ? () => page.evaluate(() => +document.querySelector('[data-wb-deck-k="width"]').value) : () => G.val(page, 'Width');
        await G.hideCookie(page); await G.bring(page, KSEL, true); await G.sleep(700);
        const cdp = await ctx.newCDPSession(page);
        const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
        const swipe = async (x0, y0, x1, y1) => { await t('touchStart', x0, y0); for (let i = 1; i <= 12; i++) { await t('touchMove', x0 + ((x1 - x0) * i) / 12, y0 + ((y1 - y0) * i) / 12); await G.sleep(16); } await t('touchEnd'); await G.sleep(900); };
        const k = await G.rect(page, KSEL); if (!k) return G.missing(GATE, name, 'no WIDTH slider');
        const y0 = await G.scrollY(page), v0 = await wval();
        await swipe(k.cx, k.cy, k.cx, k.cy - 200); const y1 = await G.scrollY(page), v1 = await wval();
        const k2 = await G.rect(page, KSEL); const v2 = await wval();
        await swipe(k2.cx - 40, k2.cy, k2.cx + 60, k2.cy + 4); const v3 = await wval();
        const probs = []; if (y1 - y0 < 100) probs.push(`the vertical swipe scrolled the page ${y1 - y0} px`); if (v1 !== v0) probs.push(`the vertical swipe turned WIDTH ${v0} -> ${v1}`); if (v3 === v2) probs.push(`a horizontal drag left WIDTH at ${v2}`);
        G.ok(GATE, name, probs.length === 0, (deck ? 'the deck: ' : 'the face: ') + (probs.length ? probs.join('; ') : `vertical swipe: page +${y1 - y0} px, WIDTH ${v0} -> ${v1}; horizontal drag: WIDTH ${v2} -> ${v3}`));
        await ctx.close();
      } finally { await b.close(); }
    });
    else G.skip(GATE, `a swipe from a knob scrolls the page; a horizontal drag turns it ${T}`, 'CDP touch is Chrome only (WebKit: the sizes + verify cover its phone layout)');

    // 5. the deck + inert face, 6. no sticky hover
    await G.step(GATE, `the deck's controls are native ranges, the face's hits inert ${T}`, async () => {
      const name = `the deck's controls are native ranges, the face's hits inert ${T}`; const { b, ctx, page } = await fresh(engine, 'P390');
      try {
        const r = await page.evaluate(() => { const ranges = [...document.querySelectorAll('#wb-drive input[type=range], [data-wb-deck] input[type=range]')].filter((e) => e.getBoundingClientRect().width > 0 || true); const face = document.querySelector('[data-wb-face]'); const hits = [...document.querySelectorAll('[data-wb-face] .wb-hit')]; const inertFace = !!face && (face.hasAttribute('inert') || !!face.closest('[inert]')); const peNone = hits.length > 0 && hits.every((h) => getComputedStyle(h).pointerEvents === 'none'); return { ranges: ranges.length, hits: hits.length, inert: inertFace || peNone, how: inertFace ? 'inert attribute' : peNone ? 'pointer-events none' : 'live' }; });
        const probs = []; if (r.ranges < 4) probs.push(`${r.ranges} native range inputs in #wb-drive (the deck needs width, low focus, mix, tilt, reach)`); if (!r.inert) probs.push(`the face's ${r.hits} hits are ${r.how}`);
        G.ok(GATE, name, probs.length === 0, probs.length ? probs.join('; ') : `${r.ranges} native ranges; face hits ${r.how}`);
        await ctx.close();
      } finally { await b.close(); }
    });
    await G.step(GATE, `a tapped preset card does not stay lifted by sticky hover ${T}`, async () => {
      const name = `a tapped preset card does not stay lifted by sticky hover ${T}`; const { b, ctx, page } = await fresh(engine, 'P390');
      try {
        await G.hideCookie(page); if (await G.skipIfCut(page, GATE, name, 'presets')) return;
        if (!(await G.has(page, '[data-preset="1"]'))) return G.missing(GATE, name, 'no preset card');
        await G.bring(page, '[data-preset="1"]', true, 0.6); await G.sleep(500);
        const r = await G.rect(page, '[data-preset="1"]'); await page.touchscreen.tap(r.cx, r.cy); await G.sleep(3800);
        const c = await page.evaluate(() => { const e = document.querySelector('[data-preset="1"]'); return { tr: getComputedStyle(e).transform, hover: e.matches(':hover'), hoverMq: matchMedia('(hover:hover)').matches }; });
        const idle = c.tr === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(c.tr);
        G.ok(GATE, name, idle, `3.8 s after the tap: transform ${c.tr}, :hover ${c.hover}, (hover:hover) ${c.hoverMq}`);
        await ctx.close();
      } finally { await b.close(); }
    });
  }
});
