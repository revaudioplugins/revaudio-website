// G4 Keys (plan §4 G4): the letter keys act only while focus is inside #wb-drive; a held H flashes at most once a second; End / Home /
// Arrow / PageUp on the five sliders; the wheel turns only a picked knob, by <= 5 % of the range per notch.
//   node G4.cjs <base> [--engines chromium,webkit] [--plant flash]
const G = require('./Glib.cjs');
const GATE = 'G4';
const SLIDERS = [['Width', 'WIDTH'], ['Low focus', 'LOW FOCUS'], ['Mix', 'MIX'], ['Reach', 'REACH'], ['Tilt', 'TILT']];
const SW = { High: '[aria-label="High beam"]', Mono: '[aria-label="Mono"]', Side: '[aria-label="Side solo"]', Power: '[aria-label="Power"]' };

const switches = (page) => page.evaluate((SW) => Object.fromEntries(Object.entries(SW).map(([k, s]) => { const e = document.querySelector(s); return [k, e ? (e.getAttribute('aria-pressed') ?? e.getAttribute('aria-checked')) : 'missing']; })), SW);
const flashCounter = (page) => page.evaluate(() => { window.__fl = 0; const f = document.querySelector('[data-wb-flash]'); if (!f) return false; f.addEventListener('animationstart', () => window.__fl++); return true; });
const fresh = async (engine, size = 'L1141') => {
  const b = await G.launch(engine); const { ctx, page } = await G.page(b, engine, size);
  await G.goto(page, G.BASE, '/widebeam', 2200); await page.keyboard.press('Escape'); await G.hideCookie(page);
  return { b, ctx, page };
};

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G4.cjs <base>');
  for (const engine of G.ARGS.engines) {
    const T = `[${engine}]`;
    // 1. the letter keys at the hero do nothing
    await G.step(GATE, `letter keys at the hero do nothing ${T}`, async () => {
      const { b, ctx, page } = await fresh(engine);
      try {
        await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement && document.activeElement.blur(); }); await G.sleep(500);
        const before = await switches(page); const changed = [];
        if (Object.values(before).includes('missing')) return G.missing(GATE, `letter keys at the hero do nothing ${T}`, 'a face switch is missing: ' + JSON.stringify(before));
        for (const k of ['h', 'm', 's', 'p']) { await page.keyboard.press(k); await G.sleep(250); const a = await switches(page); for (const n of Object.keys(a)) if (a[n] !== before[n]) changed.push(`${k} flipped ${n}`); await page.keyboard.press(k); await G.sleep(150); }
        const y = await G.scrollY(page);
        G.ok(GATE, `letter keys at the hero do nothing ${T}`, changed.length === 0 && y === 0, changed.length ? changed.join(', ') + ` (scrollY ${y}) with the dash off screen` : 'h m s p at scrollY 0: no switch moved');
        await ctx.close();
      } finally { await b.close(); }
    });

    // 2. inside #wb-drive the key acts and announces
    await G.step(GATE, `"m" inside #wb-drive toggles and announces ${T}`, async () => {
      const { b, ctx, page } = await fresh(engine);
      try {
        await G.bring(page, '[data-wb-face]');
        const ann = '[data-wb-announce]'; if (!(await G.has(page, ann))) return G.missing(GATE, `"m" inside #wb-drive toggles and announces ${T}`, 'no [data-wb-announce] live region');
        await page.locator(G.knobSel('Width')).focus();
        const before = await switches(page); const a0 = await page.textContent(ann);
        await page.keyboard.press('m'); await G.sleep(500);
        const after = await switches(page); const a1 = await page.textContent(ann);
        const toggled = after.Mono !== before.Mono; const said = a1 !== a0 && /mono/i.test(a1 || '');
        G.ok(GATE, `"m" inside #wb-drive toggles and announces ${T}`, toggled && said, `MONO ${before.Mono} -> ${after.Mono}; announcer "${(a0 || '').trim()}" -> "${(a1 || '').trim()}"`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // 2b. the keys skip [data-wb-manual] (and anything outside the dash)
    await G.step(GATE, `keys ignore a focus in [data-wb-manual] ${T}`, async () => {
      const { b, ctx, page } = await fresh(engine);
      try {
        if (!(await G.has(page, '[data-wb-manual]'))) return G.missing(GATE, `keys ignore a focus in [data-wb-manual] ${T}`, 'no [data-wb-manual]');
        await page.evaluate(() => { const b = document.createElement('button'); b.id = 'gate-man-btn'; b.textContent = 'play'; document.querySelector('[data-wb-manual]').appendChild(b); });
        await page.locator('#gate-man-btn').focus();
        const before = await switches(page);
        for (const k of ['m', 'h', 's', 'p']) { await page.keyboard.press(k); await G.sleep(150); }
        const after = await switches(page);
        const changed = Object.keys(after).filter((k) => after[k] !== before[k]);
        G.ok(GATE, `keys ignore a focus in [data-wb-manual] ${T}`, changed.length === 0, changed.length ? 'flipped ' + changed.join(', ') : 'm h s p on a focused manual control: nothing moved');
        await ctx.close();
      } finally { await b.close(); }
    });

    // 3. HIGH BEAM flash: <= 1 per second (a held key, and 12 quick taps)
    await G.step(GATE, `held H / quick H taps flash <= 1 per second ${T}`, async () => {
      const { b, ctx, page } = await fresh(engine);
      try {
        await G.bring(page, '[data-wb-face]');
        if (!(await flashCounter(page))) return G.missing(GATE, `held H / quick H taps flash <= 1 per second ${T}`, 'no [data-wb-flash]');
        await page.locator(G.knobSel('Width')).focus();
        const t0 = Date.now();
        for (let i = 0; i < 24; i++) { await page.keyboard.down('h'); await G.sleep(33); }
        await page.keyboard.up('h'); const dt1 = Date.now() - t0; await G.sleep(1200);
        const held = await page.evaluate(() => window.__fl);
        await page.evaluate(() => { window.__fl = 0; }); const t1 = Date.now();
        for (let i = 0; i < 12; i++) { await page.keyboard.press('h'); await G.sleep(45); }
        const dt2 = Date.now() - t1; await G.sleep(1200);
        const taps = await page.evaluate(() => window.__fl);
        const rate = (n, ms) => (n / (ms / 1000));
        G.ok(GATE, `held H / quick H taps flash <= 1 per second ${T}`, held <= Math.ceil(dt1 / 1000) && taps <= Math.ceil(dt2 / 1000), `held: ${held} flashes in ${dt1} ms (${rate(held, dt1).toFixed(1)}/s); 12 taps: ${taps} flashes in ${dt2} ms (${rate(taps, dt2).toFixed(1)}/s)`);
        await ctx.close();
      } finally { await b.close(); }
    });

    // n31 (stage 4): a wheel-driven bring ends while Lenis (and the dash's soft snap) still glides; read y0 only once the
    // page has been still for 300 ms, or the rest of that glide is counted as the key's or the notch's scroll
    const settle = async (page) => { let last = await G.scrollY(page), still = 0; for (let i = 0; i < 80 && still < 300; i++) { await G.sleep(50); const y = await G.scrollY(page); if (Math.abs(y - last) < 0.5) still += 50; else { still = 0; last = y; } } };

    // 4. End / Home / Arrow / PageUp on the five sliders: right value, no page scroll
    await G.step(GATE, `sliders: End/Home/Arrow/PageUp, no page scroll ${T}`, async () => {
      const { b, ctx, page } = await fresh(engine);
      try {
        await G.bring(page, '[data-wb-face]');
        const bad = []; const seen = [];
        for (const [aria, name] of SLIDERS) {
          const sel = G.knobSel(aria);
          if (!(await G.has(page, sel))) { bad.push(`${name} slider missing`); continue; }
          const meta = await page.evaluate((s) => { const e = document.querySelector(s); return { min: +e.getAttribute('aria-valuemin'), max: +e.getAttribute('aria-valuemax') }; }, sel);
          await page.locator(sel).focus(); await G.sleep(150); await settle(page);
          const y0 = await G.scrollY(page);
          const press = async (k) => { await page.keyboard.press(k); await G.sleep(300); return G.val(page, aria); };
          const vEnd = await press('End'), vHome = await press('Home');
          const vRight = await press('ArrowRight'), vPgUp = await press('PageUp');
          const y1 = await G.scrollY(page);
          const probs = [];
          if (vEnd !== meta.max) probs.push(`End -> ${vEnd} (want ${meta.max})`);
          if (vHome !== meta.min) probs.push(`Home -> ${vHome} (want ${meta.min})`);
          if (!(vRight > vHome)) probs.push(`ArrowRight ${vHome} -> ${vRight}`);
          if (!(vPgUp > vRight)) probs.push(`PageUp ${vRight} -> ${vPgUp}`);
          if (Math.abs(y1 - y0) > 2) probs.push(`the page scrolled ${y1 - y0} px`);
          seen.push(`${name} ${probs.length ? 'x' : 'ok'}`);
          if (probs.length) bad.push(`${name}: ${probs.join(', ')}`);
          await page.evaluate((y) => window.scrollTo(0, y), y0); await G.sleep(200);
        }
        G.ok(GATE, `sliders: End/Home/Arrow/PageUp, no page scroll ${T}`, bad.length === 0, bad.length ? bad.join(' | ') : seen.join(', '));
        await ctx.close();
      } finally { await b.close(); }
    });

    // 5. the wheel turns only a picked knob, by <= 5 % of its range per notch
    await G.step(GATE, `wheel: only a picked knob turns, <= 5 % per notch ${T}`, async () => {
      const { b, ctx, page } = await fresh(engine);
      try {
        await G.bring(page, '[data-wb-face]');
        const sel = G.knobSel('Width'); const r = await G.rect(page, sel); if (!r) return G.missing(GATE, `wheel: only a picked knob turns, <= 5 % per notch ${T}`, 'no WIDTH slider');
        const meta = await page.evaluate((s) => { const e = document.querySelector(s); return { min: +e.getAttribute('aria-valuemin'), max: +e.getAttribute('aria-valuemax') }; }, sel); const range = meta.max - meta.min;
        // unpicked: wheel over it must leave the value alone
        const v0 = await G.val(page, 'Width'); await page.mouse.move(r.cx, r.cy);
        for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 100); await G.sleep(200); }
        await G.sleep(600); const vUn = await G.val(page, 'Width');
        // picked: a click on it, then single notches
        await G.bring(page, '[data-wb-face]'); await settle(page); const r2 = await G.rect(page, sel);
        await page.mouse.click(r2.cx, r2.cy); await G.sleep(300); await settle(page);
        const steps = []; let prev = await G.val(page, 'Width'); const y0 = await G.scrollY(page);
        for (let i = 0; i < 4; i++) { await page.mouse.move(r2.cx, r2.cy); await page.mouse.wheel(0, -100); await G.sleep(450); const v = await G.val(page, 'Width'); steps.push(Math.abs(v - prev)); prev = v; }
        const y1 = await G.scrollY(page);
        const per = steps.map((s) => +(100 * s / range).toFixed(1));
        const probs = [];
        if (vUn !== v0) probs.push(`an unpicked knob turned ${v0} -> ${vUn}`);
        if (per.some((p) => p > 5)) probs.push(`a notch moved ${Math.max(...per)} % of the range`);
        if (per.every((p) => p === 0)) probs.push('a picked knob did not turn at all');
        if (Math.abs(y1 - y0) > 2) probs.push(`the page scrolled ${y1 - y0} px while the picked knob turned`);
        G.ok(GATE, `wheel: only a picked knob turns, <= 5 % per notch ${T}`, probs.length === 0, probs.length ? probs.join('; ') : `unpicked ${v0} -> ${vUn}; per notch ${per.join(', ')} % of the range`);
        await ctx.close();
      } finally { await b.close(); }
    });
  }
});
