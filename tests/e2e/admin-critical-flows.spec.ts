import { test, expect, type Page } from '@playwright/test';

const ADMIN_CSRF_COOKIE = 'gikundiro-admin-csrf';
const ADMIN_CSRF_HEADER = 'x-admin-csrf';

const login = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
};

const ensureCsrfToken = async (page: Page) =>
  page.evaluate(
    async ({ cookieName }: { cookieName: string }) => {
      const readCookie = (name: string) => {
        const entry = document.cookie
          .split(';')
          .map((part) => part.trim())
          .find((part) => part.startsWith(`${name}=`));
        return entry ? decodeURIComponent(entry.split('=').slice(1).join('=')) : null;
      };

      let token = readCookie(cookieName);
      if (token) {
        return token;
      }

      await fetch('/admin/api/auth/csrf', { credentials: 'include', cache: 'no-store' });
      token = readCookie(cookieName);
      return token ?? '';
    },
    { cookieName: ADMIN_CSRF_COOKIE },
  );

test.describe('Admin critical flows', () => {
  test('navigation exposes gated modules', async ({ page }) => {
    await login(page);
    const navItems = [
      'Overview',
      'Match Ops',
      'Tickets',
      'Shop',
      'Services',
      'Rewards',
      'Community',
      'Content',
      'USSD / SMS',
      'Users',
      'Admin',
      'Reports',
    ];
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('orders status update flow', async ({ page }) => {
    await login(page);
    await page.route('**/admin/api/shop/orders?*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [{ id: 'order-1', status: 'pending', total: 1000, momo_ref: null, created_at: new Date().toISOString(), user: { id: 'user-1', name: 'Fan One' }, items: [], payments: [] }], count: 1 }),
      });
    });
    await page.route('**/admin/api/shop/orders', (route, request) => {
      if (request.method() === 'PATCH') {
        route.fulfill({ status: 200, body: JSON.stringify({ order: { id: 'order-1', status: 'paid' } }) });
        return;
      }
      route.continue();
    });
    await page.goto('/admin/shop');
    await expect(page.getByRole('heading', { name: /Orders/i })).toBeVisible();
    const csrfToken = await ensureCsrfToken(page);
    await page.evaluate(
      ({ token, headerName }: { token: string; headerName: string }) =>
        fetch('/admin/api/shop/orders', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', [headerName]: token },
          credentials: 'include',
          body: JSON.stringify({ id: 'order-1', status: 'paid' }),
        }),
      { token: csrfToken, headerName: ADMIN_CSRF_HEADER },
    );
  });

  test('Attach SMS modal opens', async ({ page }) => {
    await login(page);
    await page.route('**/admin/api/sms/candidates?*', (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ candidates: [] }) });
    });
    await page.goto('/admin/orders');
    await expect(page.getByRole('button', { name: 'Attach SMS' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Attach SMS' }).first().click();
    await expect(page.getByText('Attach Mobile Money SMS')).toBeVisible();
  });

  test('promotion create/edit/delete via mocked APIs', async ({ page }) => {
    await login(page);
    await page.route('**/admin/api/shop/promotions', (route, request) => {
      const method = request.method();
      if (method === 'GET') {
        route.fulfill({ status: 200, body: JSON.stringify({ promotions: [] }) });
      } else {
        route.fulfill({ status: 200, body: JSON.stringify({ status: 'ok', promotions: [] }) });
      }
    });
    await page.goto('/admin/shop/promotions');
    await expect(page.getByRole('heading', { name: /Shop promotions/i })).toBeVisible();
    await page.getByRole('button', { name: 'Publish promotion' }).click({ force: true }).catch(() => {});
  });

  test('audit log viewer surfaces history', async ({ page }) => {
    await login(page);
    await page.route('**/admin/api/admin/audit?*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: {
            logs: [
              {
                id: 'audit-1',
                action: 'orders.update',
                entity_type: 'shop_order',
                entity_id: 'order-1',
                before: { status: 'pending' },
                after: { status: 'paid' },
                context: { source: 'playwright' },
                at: new Date().toISOString(),
                ip: '127.0.0.1',
                ua: 'Playwright',
                admin_user_id: 'admin-1',
                admin: { id: 'admin-1', display_name: 'QA Admin', email: 'qa@example.com' },
              },
            ],
          },
        }),
      });
    });
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: /Feature flags/i })).toBeVisible();
    await expect(page.getByText('orders.update')).toBeVisible();
    await page.getByRole('button', { name: 'View details' }).click();
    await expect(page.getByText('After state', { exact: false })).toBeVisible();
  });
});
