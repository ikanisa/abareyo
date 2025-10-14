import { test, expect } from "@playwright/test";

const routes = ["/", "/matches", "/tickets", "/shop", "/more"];

for (const route of routes) {
  test(`renders ${route}`, async ({ page }) => {
    await page.goto(`http://localhost:3000${route}`);
    const pattern =
      route === "/"
        ? /\/$/
        : new RegExp(`${route.replace(/\//g, "\\/")}(\\/)?$`);
    await expect(page).toHaveURL(pattern);
  });
}
