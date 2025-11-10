import { test, expect, type Page } from '@playwright/test';

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
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin$/);
};

test.describe('Admin membership RBAC', () => {
  test('blocks membership endpoints without admin session', async ({ request }) => {
    const plans = await request.get('/api/e2e/admin/membership/plans');
    expect(plans.status()).toBe(401);

    const members = await request.get('/api/e2e/admin/membership/members');
    expect(members.status()).toBe(401);
  });

  test('updates membership status and auto renew flags', async ({ page }) => {
    await login(page);

    const updates: Array<{ url: string; payload: unknown }> = [];

    await page.route('**/admin/membership/members/**/status', async (route, request) => {
      const payload = JSON.parse(request.postData() ?? '{}');
      updates.push({ url: request.url(), payload });
      const nextStatus = typeof payload.status === 'string' ? payload.status : 'active';
      const nextAutoRenew = typeof payload.autoRenew === 'boolean' ? payload.autoRenew : true;

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: {
            id: 'm1',
            status: nextStatus,
            autoRenew: nextAutoRenew,
          },
        }),
      });
    });

    await page.goto('/admin/membership');

    const membersSection = page.getByRole('heading', { name: 'Members', level: 2 });
    await expect(membersSection).toBeVisible();

    const memberRow = page.getByRole('row', { name: /user1@example.com/i });
    await expect(memberRow).toBeVisible();

    const statusTrigger = memberRow.getByRole('combobox').first();
    await statusTrigger.click();
    await page.getByRole('option', { name: 'Cancelled' }).click();

    await expect.poll(() => updates.length).toBeGreaterThan(0);
    expect((updates.at(-1)?.payload as { status?: string } | undefined)?.status).toBe('cancelled');
    await expect(statusTrigger).toHaveText(/cancelled/i);

    const toggle = memberRow.getByRole('switch').first();
    await toggle.click();

    await expect.poll(() => updates.length).toBe(2);
    const lastPayload = updates.at(-1)?.payload as { autoRenew?: boolean } | undefined;
    expect(lastPayload?.autoRenew).toBe(false);
    await expect(toggle).not.toBeChecked();
  });
});
