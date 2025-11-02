import { expect, test } from "@playwright/test";

test.describe("Locale-aware navigation smoke", () => {
  test("shop locale toggle updates copy without 404s", async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use?.baseURL;
    const baseOrigin = typeof baseURL === "string" ? new URL(baseURL).origin : undefined;
    const notFoundRequests: string[] = [];

    page.on("response", (response) => {
      if (response.status() !== 404) {
        return;
      }
      const url = response.url();
      if (baseOrigin && !url.startsWith(baseOrigin)) {
        return;
      }
      notFoundRequests.push(url);
    });

    await page.goto("/shop", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("button", { name: /Switch language/i }),
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByText("Official store — discover team merchandise.", { exact: false }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /Switch language/i }).click();

    await expect(
      page.getByText("Official Store — Shakisha ibicuruzwa by'Ikipe.", { exact: false }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /Switch language/i }).click();

    await expect(
      page.getByText("Official store — discover team merchandise.", { exact: false }),
    ).toBeVisible({ timeout: 15000 });

    expect(notFoundRequests).toEqual([]);
  });

  test("global language switcher preserves navigation without 404s", async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use?.baseURL;
    const baseOrigin = typeof baseURL === "string" ? new URL(baseURL).origin : undefined;
    const notFoundRequests: string[] = [];

    page.on("response", (response) => {
      if (response.status() !== 404) {
        return;
      }
      const url = response.url();
      if (baseOrigin && !url.startsWith(baseOrigin)) {
        return;
      }
      notFoundRequests.push(url);
    });

    await page.goto("/more", { waitUntil: "networkidle" });

    const trigger = page.getByRole("button", { name: /Change language, current English/i });
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await trigger.click();

    await page.getByRole("menuitemradio", { name: "Français" }).click();

    await expect(page).toHaveURL(/\/fr\/more$/);
    await expect(page.getByRole("button", { name: /Change language, current Français/i })).toBeVisible({ timeout: 15000 });

    expect(notFoundRequests).toEqual([]);
  });
});
