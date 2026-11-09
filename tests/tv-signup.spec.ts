import { test, expect, type Page } from '@playwright/test';

// The home TV's sign-up on the screen (Phase 5 step 3, 2026-11-08): Try turns the lit plugin's pane into the form,
// never TrialGateModal's pop-up; refusals sit at their fields; Send posts the modal's body to the licence worker.
// The worker is never reached: /download/register and /form-once are answered here (with their CORS preflight).
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' };

async function mockWorker(page: Page) {
  const posts: { path: string; body: Record<string, unknown> }[] = [];
  await page.route(/\/(download\/register|form-once)$/, (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    posts.push({ path: new URL(req.url()).pathname, body: JSON.parse(req.postData() || '{}') });
    return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: '{"ok":true}' });
  });
  return posts;
}

// the lit plugin's pane (a phone opens it from the list first)
async function openPane(page: Page, slug: string) {
  await page.addInitScript(() => { try { localStorage.setItem('ra-cookie-consent', 'declined'); } catch (e) { /* the banner then */ } });
  await page.goto(`/?plugin=${slug}`);
  const pane = page.locator(`[data-ww-panel="${slug}"]`);
  if (!(await pane.locator('.ww-try').isVisible())) await page.locator(`[data-ww-pick="${slug}"]`).click();
  await expect(pane.locator('.ww-try')).toBeVisible();
  return pane;
}

test('Try signs up on the screen, not in a pop-up', async ({ page }) => {
  const posts = await mockWorker(page);
  const pane = await openPane(page, 'revlimiter');
  await pane.locator('.ww-try').click();
  const form = pane.locator('[data-ws-form]');
  await expect(form).toBeVisible();
  await expect(page.locator('dialog[data-tg-modal]')).not.toBeVisible();
  await expect(pane.locator('.ws-field')).toBeFocused();

  // nothing filled: both refusals, each at its field, the focus on the first
  await pane.locator('[data-ws-send]').click();
  await expect(pane.locator('#ws-email-err-revlimiter')).toHaveText('Enter your email.');
  await expect(pane.locator('#ws-terms-err-revlimiter')).toHaveText('Tick the box to agree to the terms.');
  await expect(pane.locator('.ws-field')).toHaveAttribute('aria-invalid', 'true');
  expect(posts).toHaveLength(0);

  await pane.locator('.ws-field').fill('dan@studio.com');
  await pane.locator('[data-ws-terms]').check();
  await pane.locator('[data-ws-send]').click();
  await expect(pane.locator('.ws-st')).toHaveText('Check your inbox');
  await expect(pane.locator('[data-ws-to]')).toHaveText('dan@studio.com');
  expect(posts).toHaveLength(1);
  expect(posts[0].path).toBe('/download/register');
  expect(posts[0].body).toMatchObject({ email: 'dan@studio.com', plugin: 'revlimiter', marketing: false });

  // Back returns to the plugin, the focus on Try
  await pane.locator('[data-ws-back]').click();
  await expect(pane.locator('.ww-try')).toBeVisible();
  await expect(pane.locator('.ww-try')).toBeFocused();
});

// look A, "On air" (Dan 2026-11-09): the headline, the address, three steps per kind, the foot, the channel's bug;
// on a laptop the headline starts level with the list's first row; the bug never touches the foot
test('the sent screen is the station card', async ({ page }, info) => {
  await mockWorker(page);
  const pane = await openPane(page, 'revlimiter');
  await pane.locator('.ww-try').click();
  await pane.locator('.ws-field').fill('dan@studio.com');
  await pane.locator('[data-ws-terms]').check();
  await pane.locator('[data-ws-send]').click();
  await expect(pane.locator('.ws-st')).toBeFocused();
  await expect(pane.locator('.ws-steps li')).toHaveText([
    'Open the email on your Mac or PC',
    'Pick Mac or Windows: the download starts',
    'Open RevLimiter in your DAW: the 30 days start then',
  ]);
  await expect(pane.locator('.ws-bug i')).toHaveText('CH 1');
  // the entrance lands (~1.5 s) and lets go: nothing left animating on the card
  await expect.poll(() => pane.locator('[data-ws-sent]').evaluate((el) => el.getAnimations({ subtree: true }).length), { timeout: 4000 }).toBe(0);
  const box = await pane.evaluate((p) => {
    const t = (el: Element | null) => el!.getBoundingClientRect();
    return {
      name: t(document.querySelector('.ww-item:not([hidden]) .ww-name')).top,
      hl: t(p.querySelector('.ws-st')).top,
      foot: t(p.querySelector('.ws-foot')).bottom,
      bug: t(p.querySelector('.ws-bug')).top,
    };
  });
  if (info.project.name !== 'mobile-safari') expect(Math.abs(box.hl - box.name)).toBeLessThanOrEqual(2);
  expect(box.bug).toBeGreaterThan(box.foot);
});

test('a free download needs the newsletter yes', async ({ page }) => {
  const posts = await mockWorker(page);
  const pane = await openPane(page, 'gas');
  await pane.locator('.ww-try').click();
  await pane.locator('.ws-field').fill('dan@studio.com');
  await pane.locator('[data-ws-terms]').check();
  await pane.locator('[data-ws-send]').click();
  await expect(pane.locator('#ws-news-err-gas')).toHaveText('Tick the box to get your download.');
  expect(posts).toHaveLength(0);
  await pane.locator('[data-ws-news]').check();
  await pane.locator('[data-ws-send]').click();
  await expect(pane.locator('.ws-st')).toBeVisible();
  await expect(pane.locator('.ws-steps li').last()).toHaveText('Open GAS in your DAW. It’s yours to keep.');
  expect(posts[0].body).toMatchObject({ plugin: 'gas', marketing: true });
});
