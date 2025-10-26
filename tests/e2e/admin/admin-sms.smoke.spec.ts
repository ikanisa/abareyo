import { test, expect, type Page } from '@playwright/test';

const login = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
};

test.describe('Admin SMS smoke', () => {
  test('renders panels, attaches SMS, and tests parser', async ({ page }) => {
    await login(page);

    const now = new Date().toISOString();

    // Stub new Admin SMS API endpoints used by the view
    await page.route('**/admin/sms/inbound?*', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'sms-0',
              text: 'MTN MoMo: You have received 500 RWF',
              fromMsisdn: '+250780000000',
              toMsisdn: '+250780000001',
              receivedAt: now,
              ingestStatus: 'received',
              parsed: null,
            },
          ],
        }),
      }),
    );

    await page.route('**/admin/sms/manual?*', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'sms-1',
              text: 'Test manual SMS: 1000 RWF REF ABC',
              fromMsisdn: '+250781111111',
              toMsisdn: '+250780000001',
              receivedAt: now,
              ingestStatus: 'manual_review',
              parsed: { id: 'p-1', amount: 1000, currency: 'RWF', ref: 'ABC', confidence: 0.9, matchedEntity: null },
            },
          ],
        }),
      }),
    );

    await page.route('**/admin/sms/manual/payments?*', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'pay-1',
              amount: 1000,
              currency: 'RWF',
              status: 'manual_review',
              kind: 'shop',
              createdAt: now,
              metadata: null,
              order: null,
              membership: null,
              donation: null,
              smsParsed: { id: 'p-1', amount: 1000, currency: 'RWF', ref: 'ABC', confidence: 0.9 },
            },
          ],
        }),
      }),
    );

    await page.route('**/admin/sms/queue', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: { waiting: 1, delayed: 0, active: 0, pending: [{ jobId: 'job-1', smsId: 'sms-1', attemptsMade: 1, maxAttempts: 3, state: 'manual_review', enqueuedAt: now }] },
        }),
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
      // Create prompt
      return route.fulfill({ status: 200, body: JSON.stringify({ data: { id: 'prompt-3', label: 'New', body: 'Body', version: 3, isActive: false, createdAt: now } }) });
    });

    await page.route('**/admin/sms/parser/prompts/active', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: { id: 'prompt-1', label: 'Parser v1', body: 'v1 body', version: 1, isActive: true, createdAt: now } }) }),
    );

    await page.route('**/admin/sms/parser/prompts/*/activate', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: { id: 'prompt-2', label: 'Parser v2', body: 'v2 body', version: 2, isActive: true, createdAt: now } }) }),
    );

    await page.route('**/admin/sms/parser/test', async (route, request) => {
      if (request.method() === 'POST') {
        const payload = JSON.parse(request.postData() ?? '{}');
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ data: { amount: 1000, currency: 'RWF', ref: 'ABC', confidence: 0.95, parserVersion: payload?.promptId ?? 'v1' } }),
        });
      }
      return route.continue();
    });

    const attachRequests: Array<unknown> = [];
    await page.route('**/admin/sms/manual/attach', async (route, request) => {
      attachRequests.push(JSON.parse(request.postData() ?? '{}'));
      return route.fulfill({ status: 200, body: JSON.stringify({ status: 'ok', data: { id: 'sms-1' } }) });
    });

    // Open the SMS admin view
    await page.goto('/admin/sms');
    await expect(page.getByText('Inbound SMS Stream')).toBeVisible();
    await expect(page.getByText('Parser Queue Health')).toBeVisible();
    await expect(page.getByText('Parser tuning')).toBeVisible();

    // Select SMS and payment, perform attach
    await page.getByText('Test manual SMS: 1000 RWF REF ABC').click();
    await page.getByText(/1000\sRWF/).click();
    await page.getByRole('button', { name: 'Attach to payment' }).click();

    // Verify attach call shape
    await expect.poll(() => attachRequests.length).toBe(1);
    const attachPayload = attachRequests[0] as { smsId?: string; paymentId?: string };
    expect(attachPayload.smsId).toBe('sms-1');
    expect(attachPayload.paymentId).toBe('pay-1');

    // Run parser test
    await page.getByPlaceholder('Paste a recent MTN or Airtel mobile money receipt...').fill('MTN MoMo 1000 RWF');
    await page.getByRole('button', { name: 'Test parser' }).click();
    await expect(page.getByText('"amount": 1000')).toBeVisible();
  });
});

