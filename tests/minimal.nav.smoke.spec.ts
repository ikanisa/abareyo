import { test, expect } from "@playwright/test";

const pages = ["/", "/matches", "/tickets", "/shop", "/more"];

for (const path of pages) {
  test(`renders ${path}`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`);
    const regex = new RegExp(path.replace("/", "\\/"));
    await expect(page).toHaveURL(regex);
  });
}
