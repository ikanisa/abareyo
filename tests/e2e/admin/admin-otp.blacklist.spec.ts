import { test, expect, type Page } from '@playwright/test';

const login = async (page: Page) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
};

test.describe('Admin OTP blacklist management', () => {
  test('renders dashboard and supports runtime blacklist updates', async ({ page }) => {
    await login(page);

    const now = new Date().toISOString();
    let phoneBlacklist = [
      { value: '+250788888888', masked: '***8888', source: 'config', note: 'Carding ring' },
    ];
    let ipBlacklist: Array<{ value: string; masked: string; source: 'config' | 'runtime'; note?: string | null }> = [];
    const addRequests: Array<unknown> = [];
    const removeRequests: Array<unknown> = [];

    await page.route('**/admin/otp/dashboard', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: {
            summary: { sent: 42, delivered: 40, blocked: 2, rateLimited: 2, verified: 35, failed: 1 },
            redis: { healthy: true, mode: 'redis', lastError: null },
            template: {
              name: 'fan_otp',
              namespace: 'prod',
              locale: 'en',
              approved: true,
              rateLimitApproval: 'https://example.com/policy',
            },
            rateLimits: {
              windowSeconds: 900,
              maxPerPhone: 5,
              maxPerIp: 15,
              cooldownSeconds: 60,
              verifyWindowSeconds: 900,
              maxVerifyAttempts: 3,
            },
            events: [
              {
                kind: 'send',
                occurredAt: now,
                phoneHash: 'hash-1',
                channel: 'whatsapp',
                locale: 'en',
                status: 'delivered',
                templateApproved: true,
              },
              {
                kind: 'verify',
                occurredAt: now,
                phoneHash: 'hash-1',
                status: 'success',
              },
            ],
            blacklist: { phone: phoneBlacklist, ip: ipBlacklist },
          },
        }),
      }),
    );

    await page.route('**/admin/otp/blacklist', async (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ data: { phone: phoneBlacklist, ip: ipBlacklist } }),
        });
      }

      if (request.method() === 'POST') {
        const payload = JSON.parse(request.postData() ?? '{}') as {
          type: 'phone' | 'ip';
          value: string;
          note?: string;
        };
        addRequests.push(payload);
        const entry = {
          value: payload.value,
          masked: `***${payload.value.slice(-4)}`,
          source: 'runtime' as const,
          note: payload.note ?? null,
        };
        if (payload.type === 'phone') {
          phoneBlacklist = [...phoneBlacklist.filter((item) => item.value !== entry.value), entry];
        } else {
          ipBlacklist = [...ipBlacklist.filter((item) => item.value !== entry.value), entry];
        }
        return route.fulfill({ status: 200, body: JSON.stringify({ data: entry }) });
      }

      if (request.method() === 'DELETE') {
        const payload = JSON.parse(request.postData() ?? '{}') as { type: 'phone' | 'ip'; value: string };
        removeRequests.push(payload);
        if (payload.type === 'phone') {
          phoneBlacklist = phoneBlacklist.filter((item) => item.value !== payload.value);
        } else {
          ipBlacklist = ipBlacklist.filter((item) => item.value !== payload.value);
        }
        return route.fulfill({ status: 204, body: '' });
      }

      return route.continue();
    });

    await page.goto('/admin/sms/otp');
    await expect(page.getByRole('heading', { name: 'OTP Operations' })).toBeVisible();
    await expect(page.getByText('Redis connected')).toBeVisible();
    await expect(page.getByText('Codes sent')).toBeVisible();

    await page.getByPlaceholder('+2507XXXXXXXX').fill('+250799990001');
    await page
      .getByPlaceholder('Optional note (e.g. incident ticket link)')
      .fill('Manual block during incident');
    await page.getByRole('button', { name: 'Add to blacklist' }).click();

    await expect.poll(() => addRequests.length).toBe(1);
    await expect(page.getByText('Manual block during incident')).toBeVisible();
    await expect(page.getByText('***0001')).toBeVisible();

    await page.getByRole('button', { name: /Remove \*\*\*0001 from blacklist/ }).click();
    await expect.poll(() => removeRequests.length).toBe(1);
    await expect(page.getByText('***0001')).toHaveCount(0);
  });
});
