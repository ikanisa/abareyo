import { test, expect, type Page } from '@playwright/test';

const login = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
};

test.describe('Admin SMS actions', () => {
  test('retry, dismiss, and activate prompt', async ({ page }) => {
    await login(page);

    const now = new Date().toISOString();

    // Shared fixtures
    await page.route('**/admin/sms/inbound?*', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }),
    );

    await page.route('**/admin/sms/manual?*', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'sms-1',
              text: 'Manual review: 1500 RWF REF XYZ',
              fromMsisdn: '+250789999999',
              toMsisdn: '+250780000001',
              receivedAt: now,
              ingestStatus: 'manual_review',
              parsed: { id: 'px', amount: 1500, currency: 'RWF', ref: 'XYZ', confidence: 0.6, matchedEntity: null },
            },
          ],
        }),
      }),
    );

    await page.route('**/admin/sms/manual/payments?*', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }),
    );

    await page.route('**/admin/sms/queue', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: { waiting: 1, delayed: 0, active: 0, pending: [{ jobId: 'job-2', smsId: 'sms-1', attemptsMade: 1, maxAttempts: 3, state: 'manual_review', enqueuedAt: now }] } }),
      }),
    );

    await page.route('**/admin/sms/parser/prompts', (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ data: [
            { id: 'prompt-1', label: 'Parser v1', body: 'v1 body', version: 1, isActive: true, createdAt: now },
            { id: 'prompt-2', label: 'Parser v2', body: 'v2 body', version: 2, isActive: false, createdAt: now },
          ] }),
        });
      }
      return route.continue();
    });
    await page.route('**/admin/sms/parser/prompts/active', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: { id: 'prompt-1', label: 'Parser v1', body: 'v1 body', version: 1, isActive: true, createdAt: now } }) }),
    );

    // Capture actions
    const retryCalls: Array<string> = [];
    await page.route('**/admin/sms/manual/*/retry', async (route) => {
      retryCalls.push(route.request().url());
      return route.fulfill({ status: 200, body: JSON.stringify({ status: 'queued' }) });
    });

    const dismissCalls: Array<{ url: string; body: unknown }> = [];
    await page.route('**/admin/sms/manual/*/dismiss', async (route, request) => {
      dismissCalls.push({ url: request.url(), body: JSON.parse(request.postData() ?? '{}') });
      return route.fulfill({ status: 200, body: JSON.stringify({ status: 'resolved' }) });
    });

    const activateCalls: Array<string> = [];
    await page.route('**/admin/sms/parser/prompts/*/activate', async (route) => {
      activateCalls.push(route.request().url());
      return route.fulfill({ status: 200, body: JSON.stringify({ data: { id: 'prompt-2', label: 'Parser v2', body: 'v2 body', version: 2, isActive: true, createdAt: now } }) });
    });

    // Go to SMS view
    await page.goto('/admin/sms');
    await expect(page.getByText('Inbound SMS Stream')).toBeVisible();

    // Select SMS and trigger retry
    await page.getByText('Manual review: 1500 RWF REF XYZ').click();
    await page.getByRole('button', { name: 'Retry parse' }).click();
    await expect.poll(() => retryCalls.length).toBe(1);
    expect(retryCalls[0]).toContain('/admin/sms/manual/sms-1/retry');

    // Dismiss with a note (default resolution is 'ignore')
    await page.getByPlaceholder('Optional note for audit trail').fill('Handled by test');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect.poll(() => dismissCalls.length).toBe(1);
    expect(dismissCalls[0].url).toContain('/admin/sms/manual/sms-1/dismiss');
    expect(dismissCalls[0].body).toMatchObject({ resolution: 'ignore', note: 'Handled by test' });

    // Activate prompt v2
    await page.locator('div', { hasText: 'Parser v2' }).getByRole('button', { name: 'Activate' }).click();
    await expect.poll(() => activateCalls.length).toBe(1);
    expect(activateCalls[0]).toContain('/admin/sms/parser/prompts/prompt-2/activate');
  });
});

