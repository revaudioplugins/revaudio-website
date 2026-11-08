import { test, expect } from '@playwright/test';

// The home TV sells (Phase 5, 2026-11-08): step 5 (the picture, the name and the lit row lead to the product page),
// P09 (a shared ?plugin= link opens that plugin on a phone too), P10 (the categories are one Tab stop with arrows;
// Escape closes a phone's pane). Nothing here posts.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('ra-cookie-consent', 'declined'); } catch (e) { /* the banner then */ } });
});
const isPhone = (project: string) => project === 'mobile-safari';

test('the picture and the name lead to the product page', async ({ page }) => {
  await page.goto('/?plugin=gas');
  const pane = page.locator('[data-ww-panel="gas"]');
  await expect(pane.locator('.ww-to-pic')).toHaveAttribute('href', '/gas');
  await expect(pane.locator('.ww-pname a')).toHaveAttribute('href', '/gas');
  await pane.locator('.ww-pname a').click();
  await expect(page).toHaveURL(/\/gas\/?$/);
});

test('a laptop: a row lights its plugin, the lit row again is its product page', async ({ page }, info) => {
  test.skip(isPhone(info.project.name), 'on a phone a row opens the pane');
  await page.goto('/');
  const row = page.locator('[data-ww-pick="radio-roulette"]');
  await row.click();
  await expect(page.locator('[data-wordwall]')).toHaveAttribute('data-ww-on', 'radio-roulette');
  await expect(page).toHaveURL(/plugin=radio-roulette/);
  await row.click();
  await expect(page).toHaveURL(/\/radio-roulette\/?$/);
});

test('a phone: a shared ?plugin= link opens that plugin, ‹ All plugins goes to the list', async ({ page }, info) => {
  test.skip(!isPhone(info.project.name), 'phones only');
  const wall = page.locator('[data-wordwall]');
  await page.goto('/?plugin=drift');
  await expect(wall).toHaveAttribute('data-ww-view', 'panel');
  await expect(wall).toHaveAttribute('data-ww-on', 'drift');
  await page.locator('[data-ww-panel="drift"] .ww-back').click();
  await expect(wall).toHaveAttribute('data-ww-view', 'list');
  await page.goto('/?plugin=nope');
  await expect(wall).toHaveAttribute('data-ww-view', 'list');
});

test('the categories: one Tab stop, the arrows pick', async ({ page }, info) => {
  test.skip(isPhone(info.project.name), 'a keyboard');
  await page.goto('/');
  await expect(page.locator('.ww-cats')).toHaveAttribute('role', 'toolbar');
  await expect(page.locator('[data-ww-cat][tabindex="0"]')).toHaveCount(1);
  await page.locator('[data-ww-cat="all"]').focus();
  await page.keyboard.press('ArrowRight');
  const second = page.locator('[data-ww-cat]').nth(1);
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('tabindex', '0');
  await page.keyboard.press('Tab');
  await expect(page.locator('.ww-row.is-lit')).toBeFocused();
});

test('a phone-wide window: Escape in a plugin goes back to the list', async ({ page }, info) => {
  test.skip(isPhone(info.project.name), 'a keyboard, at a phone width');
  await page.setViewportSize({ width: 700, height: 760 });
  await page.goto('/');
  const wall = page.locator('[data-wordwall]');
  await page.locator('[data-ww-pick="gas"]').click();
  await expect(wall).toHaveAttribute('data-ww-view', 'panel');
  await page.keyboard.press('Escape');
  await expect(wall).toHaveAttribute('data-ww-view', 'list');
  await expect(page.locator('[data-ww-pick="gas"]')).toBeFocused();
});
