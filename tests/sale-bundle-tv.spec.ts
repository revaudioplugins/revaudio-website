import { test, expect, type Page } from '@playwright/test';
import { salePhases } from '../src/data/sale';

// The sale bundle on the TV (Dan's pick A, 2026-11-25): while the sale is on, /plugins opens on the BUNDLES tab with
// the bundle lit, and its button puts the bundle in the cart; off it, nothing of the bundle is on the TV. This runs the
// real date path on the built site (the ?sale= preview is dev only). setSystemTime, not setFixedTime: GSAP's ticker
// reads Date.now, so a frozen clock freezes every channel change.

const mid = (a: string, b: string) => new Date((Date.parse(a) + Date.parse(b)) / 2);
const last = salePhases[salePhases.length - 1];

const tv = (page: Page) => page.evaluate(() => ({
  pressed: [...document.querySelectorAll<HTMLElement>('.ww-cat[aria-pressed="true"]')].map((b) => b.dataset.wwCat),
  on: document.querySelector<HTMLElement>('[data-wordwall]')?.dataset.wwOn,
  saleParts: document.querySelectorAll('[data-ww-sale]').length,
}));

async function open(page: Page, at: Date) {
  // the Cloudflare beacon is never reached: an empty script answers (JSON parsed as JS would be a page error)
  await page.route(/cloudflareinsights/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.clock.setSystemTime(at);
  await page.goto('/plugins/');
  const decline = page.getByRole('button', { name: 'Decline' }); // the cookie bar, off the button
  if (await decline.isVisible().catch(() => false)) await decline.click();
}

test.describe('the sale bundle on the TV', () => {
  for (const ph of salePhases) {
    test(`${ph.name}: /plugins opens on BUNDLES, and "Add all" puts the bundle in the cart`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, mid(ph.start, ph.end));
      await expect.poll(() => tv(page)).toMatchObject({ pressed: ['bundles'], on: 'bundle' });
      const add = page.locator('[data-ww-panel="bundle"] [data-add-to-cart][data-slug="bundle"]');
      await expect(add).toBeVisible();
      await add.click();
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('revaudio_cart_v2') || '[]').map((i: { slug: string }) => i.slug)))
        .toEqual(['bundle']);
      expect(errors, 'page errors').toEqual([]);
    });
  }

  test('off the sale: no bundle on the TV, ALL and its first plugin', async ({ page }) => {
    await open(page, new Date(Date.parse(last.end) + 86400e3));
    await expect.poll(() => tv(page)).toMatchObject({ pressed: ['all'], saleParts: 0 });
    expect((await tv(page)).on).not.toBe('bundle');
  });

  test('the sale ends with the page open: the TV steps from the bundle to ALL', async ({ page }) => {
    await open(page, new Date(Date.parse(last.end) - 10 * 60e3)); // ten minutes left, however slow the load
    await expect.poll(() => tv(page)).toMatchObject({ pressed: ['bundles'], on: 'bundle' });
    await page.clock.setSystemTime(new Date(Date.parse(last.end) + 1000)); // the end passes, the page still open
    await expect.poll(() => tv(page), { timeout: 10000 }).toMatchObject({ pressed: ['all'] }); // the strip's next tick
    expect((await tv(page)).on).not.toBe('bundle');
    await expect(page.locator('[data-ww-panel="bundle"]')).toBeHidden();
  });
});
