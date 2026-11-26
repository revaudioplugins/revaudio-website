import { test, expect, type Page } from '@playwright/test';
import { widebeam, buyable, askFor, projector } from '../src/data/widebeam';
import { salePhases } from '../src/data/sale';

// The durable assertions for /widebeam (lane T of the WIDE BEAM build). Run by the house config (chromium + mobile-safari) against the built preview.
// Honesty: the page says only what the plugin can back (src/data/widebeam.ts owns the phase and the formats). Behaviour: no errors, the ask's name,
// the manual anchor, the letter keys scoped to the dash, the music never starting on Tab or on the cookie banner.
// Everything is scoped to [data-wb-page] (the footer, the cart catalogue and the legal modal are site furniture and name AAX for other plugins).

const WORKER = /workers\.dev|cloudflareinsights/;
// the stub: the licence worker gets JSON; the Cloudflare beacon (a <script> on a production build) gets an empty script, since JSON parsed as JS
// is a page error ("Unexpected token ':'") that the page itself never has
const stub = (r: import('@playwright/test').Route) => /cloudflareinsights/.test(r.request().url())
  ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  : r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' });

// The one known dev-only noise: the Astro dev toolbar's script answers 403 on a dev server (node_modules is outside Vite's allow list). A built preview
// has no such request, so the filter is off unless the scratch config (tests are run against `astro dev`) sets WB_DEV_NOISE=1.
const isDevNoise = (text: string, url = '') => process.env.WB_DEV_NOISE === '1' && /dev-toolbar|\/@astro\//.test(url + ' ' + text);

async function open(page: Page, path = '/widebeam', wait = 2400) {
  const errors: string[] = [];
  // the licence worker and analytics are never reached: a stub answers
  await page.route(WORKER, stub);
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !isDevNoise(m.text(), m.location().url)) errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && !isDevNoise('', r.url()) && !WORKER.test(r.url()) && !/paddle|googletagmanager|google-analytics|fonts\.g/.test(r.url())) errors.push(`http ${r.status()}: ${r.url()}`); });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
  return errors;
}
// the film's voice (section 2, src/lib/widebeam/projector/film.ts): heard = the voice element playing, or its sound key pressed
const soundOn = (page: Page) => page.evaluate(() => {
  const v = document.querySelector<HTMLAudioElement>('[data-wbp-voice]');
  return (!!v && !v.paused) || document.querySelector('[data-wbp-tap]')?.getAttribute('aria-pressed') === 'true';
});
const filmRunning = (page: Page) => page.evaluate(() => { const v = document.querySelector<HTMLVideoElement>('[data-wbp-manual]'); return !!v && !v.paused && v.currentTime > 0.3; });
// section 2 scrolled in, and its film really running (so a check on the voice is never vacuous)
async function toFilm(page: Page) {
  await page.evaluate(() => document.getElementById('manual')?.scrollIntoView());
  await expect.poll(() => filmRunning(page), { timeout: 20_000, message: 'the film runs once section 2 is in view' }).toBe(true);
}
// Paddle is never reached from a test: the cart's script gets an empty answer
const noPaddle = (page: Page) => page.route(/paddle\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
const press = (loc: import('@playwright/test').Locator, isMobile: boolean) => (isMobile ? loc.tap() : loc.click());
const pageText = (page: Page) => page.evaluate(() => {
  const root = document.querySelector('[data-wb-page]') as HTMLElement;
  const out = [root.innerText];
  root.querySelectorAll('[aria-label],[title],[alt]').forEach((e) => out.push(['aria-label', 'title', 'alt'].map((a) => e.getAttribute(a) || '').join(' ')));
  root.querySelectorAll('[role=status],[aria-live]').forEach((e) => out.push(e.textContent || ''));
  return out.join('\n');
});

test.describe('/widebeam honesty', () => {
  test('says nothing the plugin cannot back: no AAX, no Buy now, no Notify me, no trial promise before the trial opens', async ({ page }) => {
    await open(page);
    // interact once, so text that only exists after a click is read too (copy-02 lived in a script)
    await page.evaluate(() => (document.querySelector('[data-wb-start]') as HTMLElement | null)?.click());
    await page.waitForTimeout(600);
    const text = await pageText(page);
    if (!widebeam.aaxReady) expect(text, 'AAX named while aaxReady is false').not.toMatch(/AAX/);
    expect(text, '"Buy now"').not.toMatch(/Buy now/i);
    expect(text, '"Notify me"').not.toMatch(/Notify me/i);
    // CRUISE is always on with no control since 0.10.0 and TRACTION is gone (README): the stale claims are 0.9.0's switches
    expect(text, 'CRUISE as a switch').not.toMatch(/CRUISE[^.]{0,40}\b(is a switch|switch(es)? (it )?off|turn(s)? (it )?off|on\/off|off by default)|\b(switch|turn) (CRUISE|TRACTION) (on|off)/i);
    expect(text, 'TRACTION as a control').not.toMatch(/TRACTION(?! (is gone|was removed|is removed|has gone))/);
    if (!buyable()) {
      await expect(page.locator('[data-wb-page] [data-add-to-cart]')).toHaveCount(0);
      expect(text, 'a BUY note').not.toMatch(/Checkout opens on launch day|rolls straight into the full version/i);
    }
    if (widebeam.phase === 'preopen') {
      expect(text, 'a trial-download promise before the trial opens').not.toMatch(/getting-started|heads-up before your trial ends|Start (your )?free trial|Get your free \d+-day trial|check your inbox/i);
    }
  });

  test('search engines skip the page until it is listed, and index it after', async ({ page }) => {
    await open(page, '/widebeam', 300);
    const robots = page.locator('meta[name="robots"]');
    // listed: BaseLayout emits no robots tag at all, so read what is there instead of waiting for a tag that never comes
    if (widebeam.listed) {
      const tags = await robots.evaluateAll((els) => els.map((e) => e.getAttribute('content') || ''));
      for (const c of tags) expect(c).not.toMatch(/noindex/);
    } else await expect(robots).toHaveAttribute('content', /noindex/);
  });
});

test.describe('/widebeam behaviour', () => {
  test('loads and runs a visit with no console or page errors', async ({ page }) => {
    test.setTimeout(120_000); // the page is heavy (canvas, video, a live face): a slow machine needs room
    const errors = await open(page);
    await page.keyboard.press('Escape');
    for (let i = 0; i < 14; i++) { await page.evaluate(() => window.scrollBy(0, 900)); await page.waitForTimeout(160); }
    await expect(page.locator('[data-wb-page]')).toBeVisible();
    expect(errors, 'console / page errors on /widebeam').toEqual([]);
  });

  test('the single ask is named "Your email" and promises nothing else', async ({ page }) => {
    await open(page, '/widebeam', 800);
    const fields = page.locator('[data-wb-page]').getByRole('textbox', { name: 'Your email', exact: true });
    expect(await fields.count(), 'email fields named exactly "Your email"').toBeGreaterThan(0);
    const names = await page.evaluate(() => [...document.querySelectorAll('[data-wb-page] input[type=email]')].map((e) => (e.getAttribute('aria-label') || (e.id && document.querySelector(`label[for="${e.id}"]`)?.textContent) || '').trim()));
    for (const n of names) expect(n, 'an email field whose name is not "Your email"').toBe('Your email');
  });

  // #manual is section 2, the film (the plugin's MANUAL button lands here); its heading is visually hidden
  test('the Owner\'s Manual anchor is there and /widebeam/#manual lands on it', async ({ page }) => {
    await open(page, '/widebeam/#manual', 3500);
    // the manual's heading lands under the nav: the section itself lands with its top padding above the screen
    // (manual.css scroll-margin-top), so the heading, the screen and its strap fit together on a 1141x636 laptop
    const r = await page.evaluate(() => {
      const h = document.querySelector('#manual #wb-manual-h') ?? document.querySelector('#manual h2');
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 44;
      return h ? { top: Math.round(h.getBoundingClientRect().top), nav } : null;
    });
    expect(r, '#manual heading').not.toBeNull();
    expect(r!.top, '#manual should land with its heading under the nav').toBeGreaterThanOrEqual(r!.nav - 4);
    expect(r!.top, '#manual should land with its heading under the nav').toBeLessThan(200);
  });

  // the dash is gone from the projector page; section 3 (the plugin's face) decides what the letter keys do
  test.fixme('the letter keys act only inside the dash', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'a keyboard check: phones have no letter keys');
    await open(page);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { window.scrollTo(0, 0); (document.activeElement as HTMLElement | null)?.blur(); });
    await page.waitForTimeout(400);
    const mono = () => page.evaluate(() => (document.querySelector('[aria-label="Mono"]') || document.querySelector('[aria-label^="Mono"]'))?.getAttribute('aria-pressed'));
    const before = await mono();
    await page.keyboard.press('m'); await page.waitForTimeout(250);
    expect(await mono(), '"m" at the hero (dash off screen) must do nothing').toBe(before);
    // inside the dash it works
    await page.evaluate(() => { const f = document.querySelector('[data-wb-face]') as HTMLElement; window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 120); });
    await page.waitForTimeout(500);
    await page.locator('[role=slider][aria-label="Width"]').focus();
    const b2 = await mono();
    await page.keyboard.press('m'); await page.waitForTimeout(300);
    expect(await mono(), '"m" with a dash control focused toggles MONO').not.toBe(b2);
  });

  // the voice is heard only after a qualifying act on the page itself (film.ts): never a key, never the cookie banner, a gate
  // or the Buy key. Checked with the film running in view, so a paused voice means something.
  test('the voice never starts on Tab, a letter key, the cookie Decline, a gate field or the BUY key; a click on the film starts it', async ({ page, isMobile, browserName }) => {
    test.skip(browserName === 'firefox', 'headless Firefox has no audio device');
    test.setTimeout(90_000);
    await noPaddle(page);
    await open(page, '/widebeam', 1500);
    await toFilm(page);
    expect(await soundOn(page), 'sound before any act').toBe(false);
    if (!isMobile) {
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('m');
      await page.waitForTimeout(900);
      expect(await soundOn(page), 'sound after Tab and a letter key').toBe(false);
    }
    const decline = page.locator('#cookie-decline');
    if (await decline.isVisible().catch(() => false)) {
      // a real press (a scripted el.click() carries no user activation)
      await press(decline, isMobile); await page.waitForTimeout(900);
      expect(await soundOn(page), 'sound after the cookie Decline').toBe(false);
    }
    await press(page.locator('[data-wbp-s1] input[type=email]'), isMobile); await page.waitForTimeout(400);
    const buy = page.locator('[data-wbp-s1] [data-add-to-cart]');
    if (await buy.count()) {
      await press(buy, isMobile); await page.waitForTimeout(800);
      await page.locator('dialog[open] [data-cart-close]').first().click({ timeout: 3000 }).catch(() => page.keyboard.press('Escape'));
    }
    await toFilm(page); await page.waitForTimeout(900);
    expect(await filmRunning(page), 'the film runs').toBe(true);
    expect(await soundOn(page), 'sound after a gate field and the BUY key').toBe(false);
    await press(page.locator('[data-wbp-frame]'), isMobile);
    await expect.poll(() => soundOn(page), { message: 'a click on the film starts the voice' }).toBe(true);
  });

  // the natural order: everything that is not a qualifying act happens first, with section 2 off screen; the browser's
  // activation is sticky by then, so only our own gate keeps the film's 'play' from starting the voice
  test('the voice stays off when the film starts after a Decline, Tab, a gate field and BUY', async ({ page, isMobile, browserName }) => {
    test.skip(browserName === 'firefox', 'headless Firefox has no audio device');
    test.setTimeout(90_000);
    await noPaddle(page);
    await open(page, '/widebeam', 1500);
    const decline = page.locator('#cookie-decline');
    if (await decline.isVisible().catch(() => false)) { await press(decline, isMobile); await page.waitForTimeout(600); }
    if (!isMobile) await page.keyboard.press('Tab');
    await press(page.locator('[data-wbp-s1] input[type=email]'), isMobile);
    const buy = page.locator('[data-wbp-s1] [data-add-to-cart]');
    if (await buy.count()) {
      await press(buy, isMobile); await page.waitForTimeout(800);
      await page.locator('dialog[open] [data-cart-close]').first().click({ timeout: 3000 }).catch(() => page.keyboard.press('Escape'));
    }
    await toFilm(page); await page.waitForTimeout(1500);
    expect(await filmRunning(page), 'the film runs').toBe(true);
    expect(await soundOn(page), 'sound with no qualifying act').toBe(false);
  });

  test('the sound key turns the voice on, and a second press turns it off', async ({ page, isMobile, browserName }) => {
    test.skip(browserName === 'firefox', 'headless Firefox has no audio device');
    test.setTimeout(60_000);
    await open(page, '/widebeam', 1500);
    await page.evaluate(() => { const b = document.getElementById('cookie-banner'); if (b) b.remove(); });
    await toFilm(page);
    const key = page.locator('[data-wbp-tap]');
    await press(key, isMobile);
    await expect.poll(() => soundOn(page), { message: 'sound after the sound key' }).toBe(true);
    await expect(key).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(1000); // a second press, not the same one
    await press(key, isMobile); await page.waitForTimeout(600);
    expect(await soundOn(page), 'sound after a second press').toBe(false);
  });
});

// While WIDE BEAM can't be bought (src/data/widebeam.ts buyable()), on the REAL Black Friday / Cyber Monday dates /widebeam carries no sale
// strip and no html[data-sale] (BaseLayout clears the phase there and leaves <SaleStrip/> out of the markup); once buyable it carries both. The ?sale=bf preview cannot prove this: it is a
// dev-only switch and never runs the date path. A control page in the same clock must show the phase, or the clock never took.
test.describe('/widebeam on the sale dates', () => {
  for (const ph of salePhases) {
    test(`the sale strip on /widebeam during ${ph.name} follows buyable()`, async ({ page }) => {
      await page.route(WORKER, stub);
      await page.clock.setFixedTime(new Date((Date.parse(ph.start) + Date.parse(ph.end)) / 2));
      const read = () => page.evaluate(() => ({
        sale: document.documentElement.dataset.sale ?? null,
        shown: [...document.querySelectorAll('.ss,[data-sale-strip]')].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0).length,
      }));
      await page.goto('/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
      expect((await read()).sale, `the clock took: the home page is in ${ph.name}`).toBe(ph.id);
      await page.goto('/widebeam/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
      const wb = await read();
      expect(wb.sale, 'html[data-sale] on /widebeam').toBe(buyable() ? ph.id : null);
      expect(wb.shown > 0, 'a sale strip shown on /widebeam').toBe(buyable());
    });
  }
});

// The projector page's sign-up gate (src/components/widebeam/projector/WbpGate.astro + src/lib/widebeam/projector/signup.ts): the old page's live
// contract on every gate. The licence worker is faked: each POST is recorded with its body, a preflight gets a 204, and the reply is the test's.
test.describe('/widebeam sign-up gate', () => {
  const ask = askFor();
  type Call = { path: string; body: Record<string, unknown> };
  async function fake(page: Page, reply: (path: string) => object | 'abort' = () => ({ ok: true, sent: true })) {
    const calls: Call[] = [];
    await page.route(WORKER, (r) => {
      const req = r.request(), url = req.url();
      if (/cloudflareinsights/.test(url)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST' };
      if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      const path = new URL(url).pathname;
      if (req.method() === 'POST') calls.push({ path, body: JSON.parse(req.postData() || '{}') });
      const out = reply(path);
      if (out === 'abort') return r.abort('failed');
      return r.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(out) });
    });
    await page.goto('/widebeam/', { waitUntil: 'domcontentloaded' });
    // bound: signup.ts took [data-wb-needs-script] off and enabled the key
    await expect(page.locator('form[data-wbp-gate][data-wb-needs-script]')).toHaveCount(0);
    await page.evaluate(() => document.getElementById('cookie-banner')?.remove());
    return calls;
  }
  const gate = (page: Page) => page.locator('[data-wbp-ask]').first();
  const send = async (page: Page, email: string) => {
    const g = gate(page);
    await g.getByRole('textbox', { name: 'Your email', exact: true }).fill(email);
    await g.locator('form[data-wbp-gate] button[type=submit]').click();
  };

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('the server renders the whole contract: key disabled, the no-JS line, the hooks, the honeypot, the status outside the form', async ({ page }) => {
      await page.goto('/widebeam/', { waitUntil: 'domcontentloaded' });
      const forms = page.locator('[data-wb-page] form[data-wbp-gate]');
      expect(await forms.count(), 'a gate on the page').toBeGreaterThan(0);
      for (const f of await forms.all()) {
        await expect(f).toHaveAttribute('novalidate', '');
        await expect(f).toHaveAttribute('method', /post/i);
        await expect(f).toHaveAttribute('data-plugin', widebeam.gateId);
        await expect(f).toHaveAttribute('data-msg-ok', ask.ok);
        await expect(f).toHaveAttribute('data-msg-already', ask.already);
        await expect(f).toHaveAttribute('data-once-url', /\/form-once$/);
        await expect(f).toHaveAttribute('data-wb-cta', '');
        await expect(f.locator('input[type=hidden][name=source]')).toHaveAttribute('value', ask.source);
        await expect(f.locator('input[name=_gotcha]')).toHaveCount(1);
        await expect(f.locator('[data-wbp-status]'), 'the status line sits outside the form (a done form keeps it)').toHaveCount(0);
        if (ask.registerUrl) {
          await expect(f).toHaveAttribute('data-register-url', ask.registerUrl);
          await expect(f).toHaveAttribute('data-wb-needs-script', '');
          await expect(f.locator('button[type=submit]'), 'the key waits for the script').toBeDisabled();
        }
      }
      await expect(page.locator('[data-wb-ask] > [data-wbp-status][role=status][aria-live=polite]').first()).toHaveCount(1);
      // the no-JS line, read from the served HTML: a script-disabled test browser still parses <noscript> as text
      if (ask.nojs) expect(await (await page.request.get('/widebeam/')).text()).toContain(`<noscript><p class="wbp-status err">${ask.nojs}</p></noscript>`);
      await expect(page.locator('[data-wb-page] [data-wb-ask] a[href="/privacy"]').first()).toBeVisible();
    });
  });

  test('a good address posts /download/register, then /form-once, with the live bodies, and every gate shows done', async ({ page }) => {
    const calls = await fake(page);
    await send(page, '  Test.Person@example.com ');
    await expect(gate(page).locator('.wbp-done')).toBeVisible();
    await expect.poll(() => calls.length).toBe(2);
    expect(calls.map((c) => c.path)).toEqual(['/download/register', '/form-once']);
    expect(calls[0].body).toEqual({ email: 'Test.Person@example.com', plugin: widebeam.gateId, marketing: true });
    expect(calls[1].body).toEqual({ form: 'newsletter', page: '/widebeam/', email: 'Test.Person@example.com', source: ask.source, _gotcha: '' });
    await expect(gate(page).locator('[data-wbp-status]')).toHaveText(ask.ok);
    await expect(gate(page).locator('.wbp-done em')).toContainText('@example.com');
    for (const a of await page.locator('[data-wb-page] [data-wb-ask]').all()) await expect(a).toHaveAttribute('data-wb-done', '');
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-wb-joined'))).toBe(true);
  });

  test('the same address again never registers twice; another address is a new sign-up', async ({ page }) => {
    const calls = await fake(page);
    await send(page, 'same@example.com');
    await expect.poll(() => calls.length).toBe(2);
    await gate(page).locator('[data-wbp-change]').click();
    await expect(gate(page).getByRole('textbox', { name: 'Your email', exact: true })).toBeFocused();
    await send(page, 'SAME@example.com');
    await expect(gate(page).locator('.wbp-done')).toBeVisible();
    await page.waitForTimeout(400);
    expect(calls.length, 'no second register, no second list join').toBe(2);
    await gate(page).locator('[data-wbp-change]').click();
    await send(page, 'other@example.com');
    await expect.poll(() => calls.length).toBe(4);
    expect(calls[2]).toEqual({ path: '/download/register', body: { email: 'other@example.com', plugin: widebeam.gateId, marketing: true } });
  });

  test('the worker\'s "already" reply shows the already words', async ({ page }) => {
    await fake(page, () => ({ ok: true, already: true }));
    await send(page, 'again@example.com');
    await expect(gate(page).locator('[data-wbp-status]')).toHaveText(ask.already);
  });

  test('a worker error marks the field and joins nothing; a network drop says so', async ({ page }) => {
    let mode: 'err' | 'net' = 'err';
    const calls = await fake(page, () => (mode === 'err' ? { ok: false, error: 'That address bounced.' } : 'abort'));
    const field = gate(page).getByRole('textbox', { name: 'Your email', exact: true });
    await send(page, 'bad@example.com');
    await expect(gate(page).locator('[data-wbp-status]')).toHaveText('That address bounced.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(calls.map((c) => c.path), 'no list join after a refused register').toEqual(['/download/register']);
    await expect(gate(page).locator('.wbp-done')).toBeHidden();
    mode = 'net';
    await field.fill('net@example.com');
    await expect(gate(page).locator('[data-wbp-status]')).toHaveText('');
    await gate(page).locator('form[data-wbp-gate] button[type=submit]').click();
    await expect(gate(page).locator('[data-wbp-status]')).toHaveText('Network hiccup. Try again in a moment.');
  });

  test('a filled honeypot skips the register and posts the list join only', async ({ page }) => {
    const calls = await fake(page);
    await page.evaluate(() => { (document.querySelector('form[data-wbp-gate] input[name=_gotcha]') as HTMLInputElement).value = 'bot'; });
    await send(page, 'bot@example.com');
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0].path).toBe('/form-once');
    expect(calls[0].body).toMatchObject({ form: 'newsletter', email: 'bot@example.com', _gotcha: 'bot' });
  });

  test('a bad address is caught before the worker, with a one-tap fix', async ({ page }) => {
    const calls = await fake(page);
    await send(page, 'dan');
    await expect(gate(page).locator('[data-wbp-status]')).toHaveText('An email needs an @.');
    await send(page, 'dan@gmail');
    await expect(gate(page).locator('[data-wbp-status]')).toContainText('Did you mean');
    await gate(page).locator('[data-wbp-fix]').click();
    await expect(gate(page).getByRole('textbox', { name: 'Your email', exact: true })).toHaveValue('dan@gmail.com');
    expect(calls.length, 'nothing sent for a bad address').toBe(0);
    // a real address on an internationalised ending goes through to the worker (Chromium hands the field's value over
    // in punycode, WebKit as typed: both pass)
    await send(page, 'user@пример.рф');
    await expect.poll(() => calls.length).toBeGreaterThan(0);
    expect(calls[0].path).toBe('/download/register');
    expect(calls[0].body.email).toMatch(/^user@(пример\.рф|xn--e1afmkfd\.xn--p1ai)$/);
  });

  test('the emailed trial link (#dl=) is left to TrialGateModal', async ({ page }) => {
    await page.route(WORKER, stub);
    await page.goto('/widebeam/#dl=test-token&p=widebeam', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => location.hash), 'TrialGateModal scrubs the token').not.toMatch(/dl=/);
    expect(await page.evaluate(() => localStorage.getItem('tg:gate:widebeam')), 'TrialGateModal kept the gate').not.toBeNull();
    await expect(page.locator('dialog.tg-modal')).toHaveAttribute('open', '');
  });
});

// Section 2 (src/components/widebeam/projector/WbpFilm.astro + src/lib/widebeam/projector/film.ts): the film, its title card,
// and every way the film can fail to play. The licence worker and Paddle are faked.
test.describe('/widebeam section 2: the film and its title card', () => {
  const MEDIA = /manual-film-|manual-voice/;
  const FILM = /manual-film-\d+\.mp4/;
  const card = (page: Page) => page.locator('[data-wbp-card]');
  const filmKey = (page: Page) => page.locator('[data-wbp-again]');
  // the card is shown: visible and not hidden from assistive tech
  const cardShown = (page: Page) => page.evaluate(() => {
    const c = document.querySelector<HTMLElement>('[data-wbp-card]')!;
    return getComputedStyle(c).visibility === 'visible' && !c.inert && !c.hasAttribute('aria-hidden');
  });
  async function watch(page: Page) {
    const seen: string[] = [];
    page.on('request', (r) => { if (MEDIA.test(r.url())) seen.push(r.url()); });
    await page.route(WORKER, stub); await noPaddle(page);
    return seen;
  }

  test('no section 2 media is fetched before a scroll', async ({ page }) => {
    const seen = await watch(page);
    await page.goto('/widebeam/', { waitUntil: 'load' });
    await page.waitForTimeout(5000);
    expect(seen, 'film, voice, poster or end still in the first view').toEqual([]);
  });

  test('the title card comes up when the film ends, with Watch again, and Watch again plays it from the top', async ({ page }) => {
    test.setTimeout(60_000);
    await watch(page);
    await page.goto('/widebeam/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.getElementById('cookie-banner')?.remove());
    await toFilm(page);
    expect(await cardShown(page), 'the card while the film runs').toBe(false);
    // the sound key holds keyboard focus as the film ends: the cut hides it, so focus goes to the card's film key, never <body>
    await page.locator('[data-wbp-tap]').focus();
    await page.evaluate(() => { const v = document.querySelector<HTMLVideoElement>('[data-wbp-manual]')!; v.currentTime = v.duration - 0.4; });
    await expect.poll(() => cardShown(page), { timeout: 10_000 }).toBe(true);
    await expect(filmKey(page)).toHaveText(projector.film.again);
    await expect(filmKey(page)).toBeFocused();
    if (buyable()) await expect(card(page).locator('[data-add-to-cart]')).toBeVisible();
    await expect(card(page).getByRole('textbox', { name: 'Your email', exact: true })).toBeVisible();
    // Watch again after the film's own end: the film runs again from the top, the card hides, focus goes to the sound key
    await page.keyboard.press('Enter');
    await expect.poll(() => cardShown(page), { message: 'the card after Watch again' }).toBe(false);
    await expect.poll(() => page.evaluate(() => { const v = document.querySelector<HTMLVideoElement>('[data-wbp-manual]')!; return !v.paused && v.currentTime > 0.2 && v.currentTime < 5; }), { timeout: 10_000, message: 'the film runs again from the top' }).toBe(true);
    expect(await page.evaluate(() => document.querySelector<HTMLElement>('[data-wbp-card]')!.inert), 'the hidden card is inert').toBe(true);
    await expect(page.locator('[data-wbp-tap]')).toBeFocused();
  });

  test('a refused play() shows the card at once, with Play the film', async ({ page }) => {
    await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        return this instanceof HTMLVideoElement && this.hasAttribute('data-wbp-manual') ? Promise.reject(new DOMException('Low Power Mode', 'NotAllowedError')) : play.call(this);
      };
    });
    await watch(page);
    await page.goto('/widebeam/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.getElementById('manual')?.scrollIntoView());
    await expect.poll(() => cardShown(page), { timeout: 10_000 }).toBe(true);
    await expect(filmKey(page)).toHaveText(projector.film.play);
  });

  test.describe('with reduced motion', () => {
    test.beforeEach(({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }));
    test('the card shows first, and no film is fetched until Play the film', async ({ page }) => {
      const seen = await watch(page);
      await page.goto('/widebeam/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.getElementById('manual')?.scrollIntoView());
      await page.waitForTimeout(2500);
      expect(await cardShown(page), 'the card').toBe(true);
      await expect(filmKey(page)).toHaveText(projector.film.play);
      expect(seen.filter((u) => FILM.test(u)), 'a film request before the key').toEqual([]);
      await page.evaluate(() => document.getElementById('cookie-banner')?.remove());
      // from the keyboard: the key had focus, so focus goes to the sound key (never <body>) as the card hides
      await filmKey(page).focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => seen.filter((u) => FILM.test(u)).length, { message: 'the film after the key' }).toBeGreaterThan(0);
      expect(await cardShown(page), 'the card after the key').toBe(false);
      await expect(page.locator('[data-wbp-tap]')).toBeFocused();
    });

    test('the card\'s gate sends the same two requests as section 1\'s, and the done state spreads both ways', async ({ page }) => {
      const calls: { path: string; body: Record<string, unknown> }[] = [];
      await page.route(WORKER, (r) => {
        const req = r.request(), url = req.url();
        if (/cloudflareinsights/.test(url)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
        const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST' };
        if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
        if (req.method() === 'POST') calls.push({ path: new URL(url).pathname, body: JSON.parse(req.postData() || '{}') });
        return r.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: '{"ok":true,"sent":true}' });
      });
      await noPaddle(page);
      await page.goto('/widebeam/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('form[data-wbp-gate][data-wb-needs-script]')).toHaveCount(0);
      await page.evaluate(() => document.getElementById('cookie-banner')?.remove());
      const s1 = page.locator('[data-wbp-s1] [data-wbp-ask]'), c = card(page).locator('[data-wbp-ask]');
      await c.getByRole('textbox', { name: 'Your email', exact: true }).fill('card@example.com');
      await c.locator('form[data-wbp-gate] button[type=submit]').click();
      await expect.poll(() => calls.length).toBe(2);
      expect(calls.map((x) => x.path)).toEqual(['/download/register', '/form-once']);
      expect(calls[0].body).toEqual({ email: 'card@example.com', plugin: widebeam.gateId, marketing: true });
      expect(calls[1].body).toEqual({ form: 'newsletter', page: '/widebeam/', email: 'card@example.com', source: askFor().source, _gotcha: '' });
      await expect(c.locator('.wbp-done')).toBeVisible();
      await expect(s1).toHaveAttribute('data-wb-done', '');
      await expect(s1.locator('.wbp-done em')).toContainText('@example.com');
      // the other way: Change on section 1, a new address there, the card shows it done
      await s1.locator('[data-wbp-change]').click();
      await expect(c).not.toHaveAttribute('data-wb-done', '');
      await s1.getByRole('textbox', { name: 'Your email', exact: true }).fill('first@example.com');
      await s1.locator('form[data-wbp-gate] button[type=submit]').click();
      await expect.poll(() => calls.length).toBe(4);
      await expect(c).toHaveAttribute('data-wb-done', '');
      await expect(c.locator('.wbp-done em')).toContainText('first@');
    });
  });
});
