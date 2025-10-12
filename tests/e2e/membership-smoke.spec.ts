import { test, expect } from '@playwright/test';

test('membership page renders and shows members table', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/membership');
  await expect(page.getByRole('heading', { name: 'Members', level: 2 })).toBeVisible();

  const memberRow = page.getByRole('row', { name: /user1@example.com/i });
  await expect(memberRow).toBeVisible();
  await expect(memberRow.getByRole('switch')).toBeVisible();
  await expect(page.getByRole('switch', { name: /auto.?renew/i })).toBeVisible();
});

