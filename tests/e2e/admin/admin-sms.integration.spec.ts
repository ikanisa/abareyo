import { expect, test, type Page } from '@playwright/test';

const login = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
};

const primeSmsRoutes = async (
  page: Page,
  {
    inbound,
    manual,
    payments,
    queue,
  }: {
    inbound?: unknown;
    manual?: unknown;
    payments?: unknown;
    queue?: unknown;
  },
) => {
  const now = new Date().toISOString();
  await page.route('**/admin/api/sms/inbound?*', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ data: inbound ?? [] }) }),
  );
  await page.route('**/admin/api/sms/manual?*', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ data: manual ?? [] }) }),
  );
  await page.route('**/admin/api/sms/manual/payments?*', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ data: payments ?? [] }) }),
  );
  await page.route('**/admin/api/sms/queue', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        data:
          queue ??
          ({ waiting: 0, delayed: 0, active: 0, pending: [] } as {
            waiting: number;
            delayed: number;
            active: number;
            pending: Array<Record<string, unknown>>;
          }),
      }),
    }),
  );
  await page.route('**/admin/api/sms/parser/prompts', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }),
  );
  await page.route('**/admin/api/sms/parser/prompts/active', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ data: null }) }),
  );
  await page.route('**/admin/api/sms/parser/prompts/*/activate', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ data: null }) }),
  );
  await page.route('**/admin/api/sms/parser/test', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ data: null, meta: { at: now } }) }),
  );
};

test.describe('Admin SMS integration flows', () => {
  test('retries parser and refreshes queue state', async ({ page }) => {
    const now = new Date().toISOString();
    await primeSmsRoutes(page, {
      inbound: [
        {
          id: 'sms-inbound-1',
          text: 'Paid 1500 RWF REF RETRY',
          fromMsisdn: '+250780000000',
          toMsisdn: '+250780000001',
          receivedAt: now,
          ingestStatus: 'received',
          parsed: null,
        },
      ],
      manual: [
        {
          id: 'sms-100',
          text: 'Manual review 1500 RWF REF RETRY',
          fromMsisdn: '+250780000000',
          toMsisdn: '+250780000001',
          receivedAt: now,
          ingestStatus: 'manual_review',
          parsed: { id: 'parsed-100', amount: 1500, currency: 'RWF', ref: 'RETRY', confidence: 0.76, matchedEntity: null },
        },
      ],
      payments: [],
      queue: { waiting: 1, delayed: 0, active: 0, pending: [] },
    });

    await page.route('**/admin/api/sms/manual/sms-100/retry', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ status: 'queued' }) }),
    );

    await login(page);
    await page.goto('/admin/sms');
    await page.getByText('Manual review 1500 RWF REF RETRY').click();
    await page.getByRole('button', { name: 'Retry parse' }).click();
    await expect(page.getByText('Parser will retry shortly.', { exact: false })).toBeVisible();
    await expect(page.getByText('Waiting 1')).toBeVisible();
  });

  test('surfaces delayed jobs for out-of-order SMS', async ({ page }) => {
    const now = new Date().toISOString();
    await primeSmsRoutes(page, {
      inbound: [
        {
          id: 'sms-inbound-new',
          text: 'Newer message',
          fromMsisdn: '+250780000001',
          toMsisdn: '+250780000002',
          receivedAt: now,
          ingestStatus: 'received',
          parsed: null,
        },
        {
          id: 'sms-inbound-old',
          text: 'Older message',
          fromMsisdn: '+250780000003',
          toMsisdn: '+250780000004',
          receivedAt: new Date(Date.now() - 3_600_000).toISOString(),
          ingestStatus: 'received',
          parsed: null,
        },
      ],
      manual: [],
      payments: [],
      queue: {
        waiting: 0,
        delayed: 2,
        active: 1,
        pending: [
          {
            jobId: 'job-delayed',
            smsId: 'sms-inbound-old',
            attemptsMade: 2,
            maxAttempts: 4,
            state: 'delayed',
            enqueuedAt: now,
            lastFailedReason: 'out-of-order ingest',
          },
        ],
      },
    });

    await login(page);
    await page.goto('/admin/sms');
    await expect(page.getByText('Delayed 2')).toBeVisible();
    await expect(page.getByText('out-of-order ingest')).toBeVisible();
  });

  test('manually attaches an SMS to a payment with an override note', async ({ page }) => {
    const now = new Date().toISOString();
    await primeSmsRoutes(page, {
      inbound: [],
      manual: [
        {
          id: 'sms-attach',
          text: 'Attach me 4500 RWF REF ATTACH',
          fromMsisdn: '+250780000010',
          toMsisdn: '+250780000011',
          receivedAt: now,
          ingestStatus: 'manual_review',
          parsed: { id: 'parsed-attach', amount: 4500, currency: 'RWF', ref: 'ATTACH', confidence: 0.8, matchedEntity: null },
        },
      ],
      payments: [
        {
          id: 'pay-1',
          amount: 4500,
          currency: 'RWF',
          kind: 'ticket',
          status: 'manual_review',
          createdAt: now,
          metadata: {},
          order: { id: 'order-1', status: 'pending' },
          smsParsed: null,
        },
      ],
      queue: { waiting: 0, delayed: 0, active: 0, pending: [] },
    });

    const attachCalls: Array<Record<string, unknown>> = [];
    await page.route('**/admin/api/sms/manual/attach', async (route, request) => {
      attachCalls.push(JSON.parse(request.postData() ?? '{}'));
      return route.fulfill({ status: 200, body: JSON.stringify({ status: 'ok' }) });
    });

    await login(page);
    await page.goto('/admin/sms');
    await page.getByText('Attach me 4500 RWF REF ATTACH').click();
    await page.getByText('4,500 RWF').click();
    await page.getByPlaceholder('Optional note for audit trail').fill('Override attached by test');
    await page.getByRole('button', { name: 'Attach to payment' }).click();

    await expect.poll(() => attachCalls.length).toBe(1);
    expect(attachCalls[0]).toMatchObject({ smsId: 'sms-attach', paymentId: 'pay-1' });
  });
});
