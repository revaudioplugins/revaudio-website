// G3 Music matrix (plan §4 G3). A fresh context per case, real mouse / keyboard / touch input, Chrome (sound locked until a real
// gesture) + WebKit + Firefox. The sound state is the SOUND key's aria-pressed (contract) or .wb-page.is-playing.
//   node G3.cjs <base> [--engines chromium,webkit,firefox] [--only <case>] [--fixture <youtube-fixture-base>] [--timing]
// NEVER starts it: Tab, cookie Accept / Decline, Skip, Replay, email focus + typing (letter keys too), a plate / closer / phone-bar
//   click, nav, cart, a footer link, a touch scroll over a knob, the tutorial play.   STARTS it: a knob drag, an arrow on a focused knob,
//   a console key, Start, SOUND, "Take it for a drive", a preset card.   A tutorial play STOPS it (needs the YouTube fixture).
// Also: no AudioContext before the first act (no probe at load). --timing: the first sound's long task on the first knob touch.
const G = require('./Glib.cjs');
const GATE = 'G3';
const TOUCH_SIZE = 'P390';

// nav / footer / cart clicks must not leave the page before we read the state
const NO_NAV = () => document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[href]'); if (a && !a.closest('[data-wb-page]')) e.preventDefault(); }, false);
const COUNT_AC = () => { window.__ac = 0; window.__acs = []; for (const k of ['AudioContext', 'webkitAudioContext']) { const O = window[k]; if (!O) continue; window[k] = class extends O { constructor(...a) { super(...a); window.__ac++; window.__acs.push(this); } }; } };
const LONGTASK = () => { window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch {} };

const tapAt = async (page, touch, x, y) => (touch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
const clickSel = async (page, sel, touch, { hideBanner = false } = {}) => {
  if (hideBanner) await G.hideCookie(page);
  const r = await G.rect(page, sel); if (!r) throw new Error('MISSING ' + sel);
  await tapAt(page, touch, Math.min(r.cx, page.viewportSize().width - 2), r.cy);
};
const toKnob = async (page, touch) => { await G.hideCookie(page); await G.bring(page, '[data-wb-face]', touch); await G.sleep(800); };
// n29 (stage 4): a touch case under 901 px held upright aims at the deck's WIDTH (the face is inert there by Dan's D7 B)
const DECK_W = '[data-wb-deck-ctl="width"]';
const touchKnob = async (page) => {
  await G.hideCookie(page);
  const deck = await page.evaluate((s) => matchMedia('(max-width: 900px) and (orientation: portrait)').matches && !!document.querySelector(s), DECK_W);
  const sel = deck ? DECK_W : G.knobSel('Width');
  await G.bring(page, sel, true); await G.sleep(800);
  return { deck, r: await G.rect(page, sel) };
};
const dragCdp = async (page, x0, y0, x1, y1) => {
  const cdp = await page.context().newCDPSession(page);
  const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await t('touchStart', x0, y0); for (let i = 1; i <= 12; i++) { await t('touchMove', x0 + ((x1 - x0) * i) / 12, y0 + ((y1 - y0) * i) / 12); await G.sleep(16); } await t('touchEnd'); await G.sleep(500);
};
const swipeCdp = async (page, x0, y0, y1) => {
  const cdp = await page.context().newCDPSession(page);
  const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await t('touchStart', x0, y0); for (let i = 1; i <= 12; i++) { await t('touchMove', x0, y0 + ((y1 - y0) * i) / 12); await G.sleep(16); } await t('touchEnd'); await G.sleep(500);
};

// id, size, expect: 'off' (never starts) | 'on' (starts), engines it can run on, act(page, touch)
const CASES = [
  { id: 'Tab key', exp: 'off', act: async (p) => { await p.keyboard.press('Tab'); } },
  { id: 'cookie Decline', exp: 'off', act: async (p, t) => clickSel(p, '#cookie-decline', t) },
  { id: 'cookie Accept all', exp: 'off', act: async (p, t) => clickSel(p, '#cookie-accept', t) },
  { id: 'cookie Accept all (phone)', exp: 'off', size: TOUCH_SIZE, act: async (p, t) => clickSel(p, '#cookie-accept', t) },
  { id: 'Skip intro', exp: 'off', act: async (p, t) => clickSel(p, '[data-wb-skip]', t, { hideBanner: true }) },
  { id: 'Skip then Replay', exp: 'off', act: async (p, t) => { await clickSel(p, '[data-wb-skip]', t, { hideBanner: true }); await G.sleep(1500); await clickSel(p, '[data-wb-replay]:not([hidden])', t); } },
  { id: 'email field focus + typing', exp: 'off', act: async (p, t) => { await G.hideCookie(p); await G.bring(p, '#wb-trial-email', t); await clickSel(p, '#wb-trial-email', t); await p.keyboard.type('hmsp a@b.co', { delay: 30 }); } },
  { id: 'plate click (label + key, empty)', exp: 'off', act: async (p, t) => { await G.hideCookie(p); await G.bring(p, '.wb-get-plate', t); await clickSel(p, '.wb-get-label', t); await clickSel(p, '[data-wb-trial] button[type=submit]', t); } },
  { id: 'closer click (key, empty)', exp: 'off', act: async (p, t) => { await G.hideCookie(p); await G.bring(p, '[data-wb-form]', t); await clickSel(p, '[data-wb-form] button[type=submit]', t); } },
  { id: 'phone bar click', exp: 'off', size: TOUCH_SIZE, act: async (p, t) => { await G.hideCookie(p); await G.scrollBy(p, 900, true); const ok = await p.evaluate(() => { const e = document.querySelector('[data-wb-bar],[data-wb-sticky],.wb-bar,.wb-sticky-bar,.wb-stickybar,.wb-stickyBar'); if (!e) return false; e.setAttribute('data-gate-bar', '1'); return true; }); if (!ok) throw new Error('MISSING the phone bar element'); await clickSel(p, '[data-gate-bar] button, [data-gate-bar] a, [data-gate-bar]', t); } },
  { id: 'nav link', exp: 'off', noNav: true, act: async (p, t) => { await G.hideCookie(p); await clickSel(p, 'nav[data-site-nav] .nav-links a', t); } },
  { id: 'cart button', exp: 'off', noNav: true, act: async (p, t) => { await G.hideCookie(p); await clickSel(p, '.cart-fab', t); } },
  { id: 'footer link', exp: 'off', noNav: true, act: async (p, t) => { await G.hideCookie(p); await G.toEnd(p, t); await clickSel(p, 'footer a', t); } },
  { id: 'touch scroll over a knob', exp: 'off', size: TOUCH_SIZE, engines: ['chromium'], act: async (p) => { const { r } = await touchKnob(p); await swipeCdp(p, r.cx, r.cy, r.cy - 160); } },
  { id: 'tutorial play (YouTube fixture)', exp: 'off', fixture: true, act: async (p, t) => { await G.hideCookie(p); await G.bring(p, '[data-wb-manual]', t); const sel = await facadeSel(p); await clickSel(p, sel, t); } },
  { id: 'knob drag', exp: 'on', act: async (p) => { await toKnob(p, false); const r = await G.rect(p, G.knobSel('Width')); await p.mouse.move(r.cx, r.cy); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(r.cx, r.cy - i * 8); await G.sleep(30); } await p.mouse.up(); } },
  { id: 'knob drag (touch)', exp: 'on', size: TOUCH_SIZE, engines: ['chromium'], act: async (p) => { const { deck, r } = await touchKnob(p); if (deck) await dragCdp(p, r.cx - 40, r.cy, r.cx + 60, r.cy + 4); else await swipeCdp(p, r.cx, r.cy, r.cy + 90); } },
  { id: 'arrow on a focused knob', exp: 'on', act: async (p) => { await toKnob(p, false); await p.locator(G.knobSel('Width')).focus(); await G.sleep(200); await p.keyboard.press('ArrowUp'); } },
  { id: 'console key', exp: 'on', act: async (p, t) => { await toKnob(p, t); const sel = await p.evaluate(() => { const c = document.querySelector('.wb-console,[data-wb-console]'); const k = c && [...c.querySelectorAll('[data-wb-demo]')].find((e) => !e.matches('[data-wb-play],[data-wb-sound],[data-wb-file]') && e.getBoundingClientRect().width); if (k) { k.setAttribute('data-gate-key', '1'); return '[data-gate-key]'; } return null; }); await clickSel(p, sel || '[role=button][aria-label="Mono"],[role=switch][aria-label="Mono"],[aria-label="Mono"]', t); } },
  // stage 4: hiding the banner drops the stack, and the SOUND key glides down from above it (.28 s): aim after it lands
  { id: 'SOUND key', exp: 'on', act: async (p, t) => { await G.hideCookie(p); await G.sleep(700); await clickSel(p, '[data-wb-sound]', t); } },
  // n32 (stage 4): the intro film covers the key until it ends (at 2.3 s it is still playing): Skip first, as a visitor would
  { id: 'Take it for a drive (hero key)', exp: 'on', act: async (p, t) => { await G.hideCookie(p); if (await p.locator('[data-wb-skip]').isVisible().catch(() => false)) { await clickSel(p, '[data-wb-skip]', t); await G.sleep(900); } await clickSel(p, '[data-wb-start]', t); } },
  { id: 'preset card', exp: 'on', act: async (p, t) => { await G.hideCookie(p); await G.bring(p, '[data-preset]', t, 0.55); await clickSel(p, '[data-preset="3"]', t); } },
  { id: 'a tutorial play stops the sound', exp: 'stops', fixture: true, act: async (p, t) => { await G.hideCookie(p); await G.sleep(700); await clickSel(p, '[data-wb-sound]', t); for (let i = 0; i < 20 && !(await G.soundOn(p)); i++) await G.sleep(100); if (!(await G.soundOn(p))) throw new Error('NOSTART could not start the sound first'); await G.bring(p, '[data-wb-manual]', t); await clickSel(p, await facadeSel(p), t); } },
];
async function facadeSel(page) { // the click-to-load YouTube facade inside the manual frame (lane S): a button in [data-wb-manual] that is not a chapter link
  const sel = await page.evaluate(() => { const m = document.querySelector('[data-wb-manual]'); const b = m && [...m.querySelectorAll('button, [role=button]')].find((e) => e.getBoundingClientRect().width > 60); if (b) { b.setAttribute('data-gate-facade', '1'); return '[data-gate-facade]'; } return null; });
  if (!sel) throw new Error('MISSING the YouTube facade button in [data-wb-manual] (stand-by only, or lane S not merged)');
  return sel;
}

async function runCase(engine, c) {
  const size = c.size || 'L1141'; const touch = G.isTouchSize(size);
  if (engine === 'firefox' && touch) return G.skip(GATE, `${c.id} [${engine}]`, 'Firefox has no touch/mobile emulation');
  if (c.engines && !c.engines.includes(engine)) return G.skip(GATE, `${c.id} [${engine}]`, c.engines.includes('chromium') ? 'needs CDP touch (Chrome only)' : 'not for this engine');
  if (c.fixture && !G.ARGS.fixture) return G.skip(GATE, `${c.id} [${engine}]`, 'needs the YouTube fixture: pass --fixture <base from Gfixture.sh youtube>');
  const base = c.fixture ? G.ARGS.fixture : G.BASE;
  const label = `${c.id} [${engine}${size === 'L1141' ? '' : ' ' + size}]`;
  const b = await G.launch(engine);
  try {
    const { ctx, page } = await G.page(b, engine, size);
    await page.addInitScript(COUNT_AC);
    if (c.noNav) await page.addInitScript(NO_NAV);
    await G.goto(page, base, '/widebeam', 2300);
    const before = await G.soundOn(page);
    try { await c.act(page, touch); } catch (e) {
      if (/^MISSING|Error: MISSING/.test(e.message) || /MISSING/.test(e.message)) { await ctx.close(); return G.missing(GATE, label, e.message.replace(/^.*MISSING/, 'MISSING').split('\n')[0]); }
      // the 'stops' case starts the sound itself first: the same headless-Firefox limit as the 'on' rows (a suspended
      // AudioContext after a real gesture) makes that first step unobservable, so it SKIPs under the same rule
      if (/NOSTART/.test(e.message)) {
        const st = await page.evaluate(() => (window.__acs || []).map((x) => x.state));
        if (engine === 'firefox' && st.length && st.every((x) => x !== 'running')) { await ctx.close(); return G.skip(GATE, label, `headless Firefox here leaves the AudioContext '${st[0]}' even after a real gesture (no audio device): the sound cannot be started first, so its stop cannot be observed`); }
        throw new Error(`${e.message.replace('NOSTART ', '')} (AudioContexts: ${st.length ? st.join(', ') : 'none'})`);
      }
      throw e;
    }
    await G.sleep(1100);
    const after = await G.soundOn(page);
    const ac = await page.evaluate(() => window.__ac || 0);
    if (c.exp === 'off') G.ok(GATE, label, !after && !before, `sound ${before ? 'ON' : 'off'} -> ${after ? 'ON (started)' : 'off'}; AudioContexts ${ac}`);
    else if (c.exp === 'on') {
      if (!after && engine === 'firefox') { const st = await page.evaluate(() => (window.__acs || []).map((x) => x.state)); if (st.length && st.every((x) => x !== 'running')) { await ctx.close(); return G.skip(GATE, label, `headless Firefox here leaves the AudioContext '${st[0]}' even after a real gesture (no audio device): the start cannot be observed`); } }
      G.ok(GATE, label, !before && after, `sound ${before ? 'ON' : 'off'} -> ${after ? 'ON' : 'off (did not start)'}; AudioContexts ${ac}`);
    }
    // 'stops': the act starts the sound itself (and throws when it can't), so the sound was ON just before the play; the
    // old test read `before` at load, where it is always off, and could never pass (stage 4)
    else { await G.sleep(1500); const still = await G.soundOn(page); G.ok(GATE, label, !before && !still, `sound ON (started by the case) -> ${still ? 'ON (not stopped)' : 'off'} after the play`); }
    await ctx.close();
  } finally { await b.close(); }
}

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G3.cjs <base>');
  for (const engine of G.ARGS.engines) {
    // 0. nothing makes an AudioContext at load, and nothing plays by itself
    if (!G.ARGS.timing) await G.step(GATE, `no AudioContext and no sound at load [${engine}]`, async () => {
      const b = await G.launch(engine);
      try {
        const { ctx, page } = await G.page(b, engine, 'L1141');
        await page.addInitScript(COUNT_AC);
        await G.goto(page, G.BASE, '/widebeam', 3500);
        const ac = await page.evaluate(() => window.__ac || 0); const on = await G.soundOn(page);
        G.ok(GATE, `no AudioContext and no sound at load [${engine}]`, ac === 0 && !on, `${ac} AudioContext(s) created at load, sound ${on ? 'ON' : 'off'}`);
        await ctx.close();
      } finally { await b.close(); }
    });
    if (G.ARGS.timing) continue;
    for (const c of CASES) await G.step(GATE, `${c.id} [${engine}${(c.size || 'L1141') === 'L1141' ? '' : ' ' + (c.size || '')}]`, () => runCase(engine, c));
  }
  // the first sound's long task (timing: stage 4, one at a time on a quiet machine)
  if (G.ARGS.timing) await G.step(GATE, 'first sound: longest task after the first knob touch [chromium]', async () => {
    const b = await G.launch('chromium');
    try {
      const { ctx, page } = await G.page(b, 'chromium', 'L1141');
      await page.addInitScript(LONGTASK); await page.addInitScript(COUNT_AC);
      await G.goto(page, G.BASE, '/widebeam', 3500);
      await toKnob(page, false); await G.sleep(1500);
      const t0 = await page.evaluate(() => performance.now());
      const r = await G.rect(page, G.knobSel('Width'));
      await page.mouse.move(r.cx, r.cy); await page.mouse.down(); for (let i = 1; i <= 6; i++) { await page.mouse.move(r.cx, r.cy - i * 8); await G.sleep(40); } await page.mouse.up();
      await G.sleep(2500);
      const lt = await page.evaluate((t0) => window.__lt.filter(([s]) => s >= t0 - 50), t0); const on = await G.soundOn(page);
      const mx = lt.reduce((m, [, d]) => Math.max(m, d), 0);
      G.ok(GATE, 'first sound: longest task after the first knob touch [chromium]', on && mx <= 100, `sound ${on ? 'ON' : 'off'}; long tasks after the touch: ${lt.length ? lt.map(([, d]) => d + ' ms').join(', ') : 'none'}; longest ${mx} ms (bar: <= 100 ms, the plan's no-long-task line)`);
      await ctx.close();
    } finally { await b.close(); }
  });
});
