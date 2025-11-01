import { expect, test } from "@playwright/test";

test.describe("RN parity navigation + USSD CTAs", () => {
  test.use({ viewport: { width: 430, height: 932 } });

  const navItems: Array<{ label: string; heading: RegExp | string; path: RegExp }> = [
    { label: "Home", heading: /Quick Actions/i, path: /\/?$/ },
    { label: "Matches", heading: /Matches/, path: /\/matches$/ },
    { label: "Tickets", heading: /Upcoming Matches/, path: /\/tickets$/ },
    { label: "Shop", heading: /Official Shop/, path: /\/shop$/ },
    { label: "More", heading: /My Profile/, path: /\/more$/ },
  ];

  test("bottom navigation mirrors mobile tabs", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    for (const item of navItems) {
      const tab = page.getByRole("link", { name: item.label, exact: true }).first();
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(page).toHaveURL(item.path);
      await expect(page.getByRole("heading", { name: item.heading })).toBeVisible({ timeout: 15000 });
    }
  });

  test("USSD CTAs expose dialable shortcodes", async ({ page }) => {
    await page.goto("/services/savings", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Savings Streak" })).toBeVisible({ timeout: 15000 });

    const primaryCta = page.getByRole("link", { name: "Dial *182*1*1*0788767816#" });
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "tel:*182*1*1*0788767816%23");

    await expect(page.getByText(/launching the savings USSD code/i)).toBeVisible();
  });
});
