import { test, expect, type Page } from '@playwright/test';
import { widebeam, buyable } from '../src/data/widebeam';
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
const soundOn = (page: Page) => page.evaluate(() => document.querySelector('[data-wb-sound]')?.getAttribute('aria-pressed') === 'true' || !!document.querySelector('.wb-page.is-playing'));
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
    if (widebeam.listed) expect(await robots.getAttribute('content').catch(() => null) ?? '').not.toMatch(/noindex/);
    else await expect(robots).toHaveAttribute('content', /noindex/);
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

  test('the letter keys act only inside the dash', async ({ page, isMobile }) => {
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

  test('the music never starts on Tab or on the cookie banner', async ({ page, isMobile }) => {
    test.setTimeout(90_000);
    await open(page, '/widebeam', 3000);
    expect(await soundOn(page), 'sound before any act').toBe(false);
    if (!isMobile) { await page.keyboard.press('Tab'); await page.waitForTimeout(900); expect(await soundOn(page), 'sound after Tab').toBe(false); }
    const decline = page.locator('#cookie-decline');
    if (await decline.isVisible().catch(() => false)) {
      // a real press: a tap on a phone, a click on a laptop (not scripted el.click(): that carries no user activation)
      if (isMobile) await decline.tap({ timeout: 15_000 }); else await decline.click({ timeout: 15_000 });
      await page.waitForTimeout(900);
      expect(await soundOn(page), 'sound after the cookie Decline').toBe(false);
    }
  });

  test('the music starts on a real act on the demo (SOUND key), and stops on a second press', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'headless Firefox has no audio device: an AudioContext stays suspended even after a gesture');
    await open(page, '/widebeam', 2500);
    await page.evaluate(() => { const b = document.getElementById('cookie-banner'); if (b) b.remove(); });
    const key = page.locator('[data-wb-sound]');
    await key.click(); await page.waitForTimeout(900);
    expect(await soundOn(page), 'sound after the SOUND key').toBe(true);
    await key.click(); await page.waitForTimeout(600);
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
