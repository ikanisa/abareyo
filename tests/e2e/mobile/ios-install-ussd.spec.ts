import { test, expect, devices } from '@playwright/test';

const iosSafari = devices['iPhone 13 Pro'];

test.use({
  ...iosSafari,
  userAgent: iosSafari.userAgent,
});

test.describe('ios safari install + ussd fallbacks', () => {

  test('surfaces share-sheet install instructions', async ({ page }) => {
    await page.goto('/');

    const installDialog = page.getByRole('dialog', { name: /Install GIKUNDIRO on iOS/i });
    await expect(installDialog).toBeVisible();
    await expect(installDialog.getByText(/Tap the Share icon/i)).toBeVisible();
    await expect(installDialog.getByRole('button', { name: /Dismiss message/i })).toBeVisible();
  });

  test('shows copy-friendly USSD fallback controls', async ({ page }) => {
    await page.goto('/shop/home-jersey-24-25');

    await expect(page.getByRole('link', { name: /Pay via USSD/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy USSD/i })).toBeVisible();
  });
});
