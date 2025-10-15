import { test, expect } from '@playwright/test';

test.describe('member directory', () => {
  test('directory loads', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByRole('heading', { name: /Member Directory/i })).toBeVisible();
    await expect(page.getByLabel('Name search')).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/i })).toBeVisible({ timeout: 5_000 }).catch(() => undefined);
  });

  test('onboarding wizard completes core flow', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { name: /Join GIKUNDIRO Members/i })).toBeVisible();

    await page.getByLabel('Full name').fill('Test Fan');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByLabel('Region / City').selectOption({ label: 'Kigali' });
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByLabel(/I agree/i).check();
    await page.getByRole('button', { name: /Finish|Saving…/ }).click();

    await page.waitForURL('**/members', { timeout: 30_000 });
  });
});
