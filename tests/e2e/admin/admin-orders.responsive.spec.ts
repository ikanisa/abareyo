import { test, expect, type Page } from '@playwright/test';

const ADMIN_COOKIE_NAME = process.env.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? 'admin_session';

const loginAsAdmin = async (page: Page) => {
  await page.context().addCookies([
    {
      name: ADMIN_COOKIE_NAME,
      value: 'test-session-token',
      url: 'http://localhost:3000',
      sameSite: 'Lax',
    },
  ]);
};

const widths = [1280, 1440, 1920] as const;

test.describe('Admin orders responsive layout', () => {
  for (const width of widths) {
    test(`renders controls cleanly at ${width}px`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/admin/orders');

      await expect(page.getByRole('heading', { name: 'Ticket Orders' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Shop Orders' })).toBeVisible();

      const dataSection = page.locator('main');
      await expect(dataSection).toHaveScreenshot(`admin-orders-${width}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  }
});
