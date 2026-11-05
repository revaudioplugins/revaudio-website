import { test, expect, type Page } from '@playwright/test';

// Pages that should always return 200 and render without throwing JS errors.
// This is a smoke suite, not visual regression: it exists to catch build/render
// breakage (bad imports, broken client scripts, dead links) before it ships.
const STATIC_PAGES = [
  '/',
  '/about',
  '/contact',
  '/support',
  '/affiliate',
  '/beta',
  '/eula',
  '/privacy',
  '/terms',
  '/accessibility',
  '/gas',
  '/thank-you',
];

const PLUGIN_SLUGS = ['revlimiter', 'radio-roulette', 'gas', 'drift', 'the-ac'];

// Cloudflare Web Analytics beacon gets CORS-blocked on any non-production
// origin (localhost, preview deploys, etc). Fulfill it locally with a
// permissive response so it doesn't show up as console noise unrelated to
// this codebase (aborting it would just trade one console error for another).
async function collectPageErrors(page: Page) {
  await page.route('**://*.cloudflareinsights.com/**', (route) =>
    route.fulfill({
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: '',
    })
  );
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

for (const path of STATIC_PAGES) {
  test(`${path} loads with no console errors`, async ({ page }) => {
    const errors = await collectPageErrors(page);
    const response = await page.goto(path);
    expect(response?.status(), `${path} should return 200`).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    expect(errors, `console/page errors on ${path}`).toEqual([]);
  });
}

for (const slug of PLUGIN_SLUGS) {
  test(`/${slug} plugin page loads with no console errors`, async ({ page }) => {
    const errors = await collectPageErrors(page);
    const response = await page.goto(`/${slug}`);
    expect(response?.status(), `/${slug} should return 200`).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    expect(errors, `console/page errors on /${slug}`).toEqual([]);
  });
}

test('the home TV lists the plugins, each row a live product page', async ({ page }) => {
  // The TV (WordWall) is the plugin browser since 2026-10-18; its rows are
  // real links, so a crawler and a no-JS visitor reach every product page.
  // The rows are in the HTML: no need to wait for the page's load event.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const rows = page.locator('#plugins .ww-row');
  expect(await rows.count(), 'the TV lists no plugin').toBeGreaterThan(0);
  for (const href of await rows.evaluateAll((els) => els.map((el) => el.getAttribute('href')))) {
    const res = await page.request.get(href ?? '');
    expect(res.status(), `TV row ${href} should return 200`).toBe(200);
  }
});

test('/store sends visitors to the plugins page and keeps the query string', async ({ page }) => {
  // GitHub Pages has no 301: /store is a redirect page, to the TV on /plugins
  // since 2026-11-02. The query string (utm / gclid) must survive, the cart
  // reads it there.
  await page.goto('/store?utm_source=smoke', { waitUntil: 'commit' });
  await page.waitForURL(/\/plugins\/?\?utm_source=smoke$/, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#plugins')).toBeAttached();
});

test('plugin detail page renders its buy CTA', async ({ page }) => {
  // Plugins with `craneBuy` render BuyButtonCrane (.crane-buy) instead of
  // the plain BuyButton (.buy-block) — either is a valid buy CTA.
  await page.goto('/revlimiter');
  await expect(page.locator('.buy-block, .crane-buy').first()).toBeVisible();
});

test('every add-to-cart button resolves to a Paddle price, not a dead button', async ({ page }) => {
  // The cart checks out whatever the [data-checkout-map] catalog holds for a
  // button's slug (Paddle price id), so a button whose slug is missing there
  // would add to the cart and then do nothing at Continue to payment. Buying
  // lives on the product pages (the home TV has no add-to-cart, and /store
  // redirects to it since 2026-10-18).
  let total = 0;
  for (const slug of PLUGIN_SLUGS) {
    await page.goto(`/${slug}`);
    const map = JSON.parse((await page.locator('[data-checkout-map]').textContent()) || '{}');
    const buttons = page.locator('[data-add-to-cart]');
    for (const s of await buttons.evaluateAll((els) => els.map((el) => el.getAttribute('data-slug')))) {
      expect(map[s ?? ''] ?? '', `/${slug}: add-to-cart for ${s} has no Paddle price id`).toMatch(/^pri_/);
      total++;
    }
  }
  expect(total, 'no product page shows an add-to-cart button').toBeGreaterThan(0);
});
