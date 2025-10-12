import { test, expect } from '@playwright/test';

test('feature flag toggle updates UI', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/settings');
  const row = page.getByRole('row', { name: /ui\.new_shop_flow/i });
  await expect(row).toBeVisible();

  const switchEl = row.getByRole('switch');
  const stateBefore = await switchEl.getAttribute('data-state');
  const expectedState = stateBefore === 'checked' ? 'unchecked' : 'checked';

  await switchEl.click();
  await expect(page.getByText('Updated')).toBeVisible();
  await expect(switchEl).toHaveAttribute('data-state', expectedState);
});

