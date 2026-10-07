import { test, expect, type Page } from '@playwright/test';

// Pages that should always return 200 and render without throwing JS errors.
// This is a smoke suite, not visual regression: it exists to catch build/render
// breakage (bad imports, broken client scripts, dead links) before it ships.
const STATIC_PAGES = [
  '/',
  '/store',
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

test('store page renders a card for each plugin', async ({ page }) => {
  await page.goto('/store');
  const cards = page.locator('.plugin-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
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
  // would add to the cart and then do nothing at Continue to payment.
  await page.goto('/store');
  const buttons = page.locator('[data-add-to-cart]');
  expect(await buttons.count(), '/store shows no add-to-cart button').toBeGreaterThan(0);
  const map = JSON.parse((await page.locator('[data-checkout-map]').textContent()) || '{}');
  for (const slug of await buttons.evaluateAll((els) => els.map((el) => el.getAttribute('data-slug')))) {
    expect(map[slug ?? ''] ?? '', `add-to-cart for ${slug} has no Paddle price id`).toMatch(/^pri_/);
  }
});
