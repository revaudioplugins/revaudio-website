import { test, expect, type Page } from '@playwright/test';

/* Support chat (SupportChat.astro). The worker is stubbed with page.route so
   the spec never spends API credit and never depends on the worker being up;
   what it checks is the widget's side of the contract:
     POST {message, src, page, conv_id?}  ->  {reply, handoff?, conv_id} */

const WORKER = /revaudio-support\.revaudio\.workers\.dev\/reply/;

async function stubWorker(page: Page, calls: unknown[]) {
  await page.route(WORKER, async (route) => {
    const body = route.request().postDataJSON();
    calls.push(body);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ reply: `Echo: ${body.message}\nDid that fix it? Reply yes or no.`, conv_id: 'conv123' }),
    });
  });
}

test('launcher is on /support only', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sc-launch')).toHaveCount(0);
  await page.goto('/support');
  await expect(page.locator('.sc-launch')).toBeVisible();
});

test('free text goes to the worker and the thread id is echoed back', async ({ page }) => {
  const calls: any[] = [];
  await stubWorker(page, calls);
  await page.goto('/support');
  await page.evaluate(() => document.querySelector('#cookie-banner')?.remove());
  await page.locator('.sc-launch').click();
  await expect(page.locator('#support-chat')).toBeVisible();

  await page.locator('#support-chat-input').fill('revlimiter not showing in ableton');
  await page.locator('[data-support-form] .sc-send').click();
  await expect(page.locator('.sc-msg--bot').last()).toContainText('Echo: revlimiter not showing in ableton');

  await page.locator('#support-chat-input').fill('windows');
  await page.locator('[data-support-form] .sc-send').click();
  await expect(page.locator('.sc-msg--bot').last()).toContainText('Echo: windows');

  expect(calls).toHaveLength(2);
  expect(calls[0].message).toBe('revlimiter not showing in ableton');
  expect(calls[0].page).toBe('/support');
  expect(calls[1].conv_id).toBe('conv123'); // second turn carries the thread id
});

test('worker down: honest fallback with the email chip', async ({ page }) => {
  await page.route(WORKER, (route) => route.abort());
  await page.goto('/support');
  await page.evaluate(() => document.querySelector('#cookie-banner')?.remove());
  await page.locator('.sc-launch').click();
  await page.locator('#support-chat-input').fill('hello');
  await page.locator('[data-support-form] .sc-send').click();
  await expect(page.locator('.sc-msg--bot').last()).toContainText('support@revaudio.net');
  await expect(page.locator('.sc-chip--solid').last()).toContainText('Email support@revaudio.net');
});
