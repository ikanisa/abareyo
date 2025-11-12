import { expect, test, type Page } from '@playwright/test';

const ADMIN_COOKIE_NAME = process.env.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? 'admin_session';

const login = async (page: Page) => {
  await page.context().addCookies([
    {
      name: ADMIN_COOKIE_NAME,
      value: 'test-session-token',
      url: 'http://localhost:3000',
      sameSite: 'Lax',
    },
  ]);
};

const stubTicketOrders = [
  {
    id: 'order-1',
    status: 'paid',
    total: 25000,
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    user: { id: 'user-1', email: 'fan@example.com', phoneMask: '+250 *** ***' },
    match: {
      id: 'match-1',
      opponent: 'APR FC',
      kickoff: new Date().toISOString(),
      venue: 'Amahoro',
    },
    payments: [],
  },
];

test.describe('Admin search, filters, and CRUD smokes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ticket orders search and status filters sync to URL and API params', async ({ page }) => {
    const requests: URL[] = [];

    await page.route('**/admin/ticket-orders**', async (route) => {
      const requestUrl = new URL(route.request().url());
      requests.push(requestUrl);
      const pageParam = Number.parseInt(requestUrl.searchParams.get('page') ?? '1', 10);
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: stubTicketOrders,
          meta: { page: pageParam, pageSize: 20, total: 1 },
        }),
        headers: { 'content-type': 'application/json' },
      });
    });

    await page.goto('/admin/orders/tickets');
    await page.getByPlaceholder('Search order ID or email').fill('ORD-42');

    await expect.poll(() => requests.filter((url) => url.searchParams.get('search') === 'ORD-42').length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/search=ORD-42/);

    await page.getByRole('button', { name: 'Paid' }).click();
    await expect.poll(() => requests.filter((url) => url.searchParams.get('status') === 'paid').length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/status=paid/);
  });

  test('ticket orders refund shows optimistic state and disables controls', async ({ page }) => {
    await page.route('**/admin/ticket-orders**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: stubTicketOrders, meta: { page: 1, pageSize: 20, total: 1 } }),
        headers: { 'content-type': 'application/json' },
      });
    });

    let refundRequest: URL | null = null;
    await page.route('**/admin/ticket-orders/*/refund', async (route) => {
      refundRequest = new URL(route.request().url());
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({ status: 200, body: JSON.stringify({}), headers: { 'content-type': 'application/json' } });
    });

    await page.goto('/admin/orders/tickets');
    const refundButton = page.getByRole('button', { name: 'Refund' }).first();
    await refundButton.click();
    await expect(refundButton).toBeDisabled();
    await expect(refundButton).toHaveText(/Refunding…/);

    await expect.poll(() => (refundRequest ? 1 : 0)).toBe(1);
    await expect(refundButton).toHaveText('Refund');
  });

  test('services dashboard issues policies and confirms deposits', async ({ page }) => {
    let issued = false;
    let depositStatus: 'pending' | 'confirmed' = 'pending';

    await page.route('**/admin/api/services/insurance', async (route) => {
      if (route.request().method() === 'POST') {
        issued = true;
        await new Promise((resolve) => setTimeout(resolve, 150));
        await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
        return;
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: {
            quotes: [
              {
                id: 'quote-1',
                premium: 12000,
                status: issued ? 'issued' : 'paid',
                ticket_perk: false,
                created_at: new Date().toISOString(),
              },
            ],
          },
        }),
        headers: { 'content-type': 'application/json' },
      });
    });

    await page.route('**/admin/api/services/sacco', async (route) => {
      if (route.request().method() === 'PATCH') {
        const payload = JSON.parse(route.request().postData() ?? '{}');
        depositStatus = payload.status ?? 'pending';
        await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
        return;
      }
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: {
            deposits: [
              {
                id: 'deposit-1',
                amount: 45000,
                status: depositStatus,
                ref: 'ref-1',
                user_id: 'u1',
                created_at: new Date().toISOString(),
              },
            ],
          },
        }),
        headers: { 'content-type': 'application/json' },
      });
    });

    await page.goto('/admin/services');
    const issueButton = page.getByRole('button', { name: /Issue policy/i }).first();
    await issueButton.click();
    await expect(issueButton).toBeDisabled();
    await expect(issueButton).toHaveText(/Issuing…/);
    await expect.poll(() => (issued ? 1 : 0)).toBe(1);
    await expect(issueButton).toHaveText(/Issue policy/);

    await page.getByRole('button', { name: 'Mark confirmed' }).first().click();
    await page.getByRole('button', { name: /Confirm deposit/ }).click();
    await expect.poll(() => (depositStatus === 'confirmed' ? 1 : 0)).toBe(1);
    const statusCell = page.getByText(/Status:/).first();
    await expect(statusCell).toContainText('confirmed');
  });
});
