import { expect, test } from "@playwright/test";

const PWA_OPT_IN_KEY = "rayon-pwa-opt-in";
const PWA_OPT_IN_EVENT = "pwa-opt-in";

async function enableServiceWorker(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(
    ({ key, event }) => {
      const record = {
        optedIn: true,
        reason: "install",
        timestamp: Date.now(),
      } as const;
      window.localStorage.setItem(key, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent(event, { detail: record }));
    },
    { key: PWA_OPT_IN_KEY, event: PWA_OPT_IN_EVENT },
  );

  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration);
  });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
}

async function ensureOfflineMode(context: import("@playwright/test").BrowserContext, offline: boolean) {
  await context.setOffline(offline);
}

test.describe("PWA resilience", () => {
  test("service worker and manifest make the app installable", async ({ page }) => {
    await enableServiceWorker(page);

    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute("href", /manifest\.json/);

    const installability = await page.evaluate(() => ({
      hasPromptHook: "onbeforeinstallprompt" in window,
      scriptUrl: navigator.serviceWorker.controller?.scriptURL ?? null,
      active: navigator.serviceWorker.controller !== null,
    }));

    expect(installability.hasPromptHook).toBe(true);
    expect(installability.active).toBe(true);
    expect(installability.scriptUrl).not.toBeNull();
  });

  test("offline fallback renders when network is lost", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await enableServiceWorker(page);
      await ensureOfflineMode(context, true);
      const response = await page.goto("/", { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: /Offline mode/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Retry connection/i })).toHaveAttribute("href", "/");
    } finally {
      await ensureOfflineMode(context, false);
      await context.close();
    }
  });
});

test("USSD savings CTA exposes tel: launcher", async ({ page }) => {
  await page.goto("/services/savings", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Savings Streak" })).toBeVisible();
  const cta = page.getByRole("link", { name: /Dial \*182\*1\*1\*0788767816#/i });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "tel:*182*1*1*0788767816%23");
});

test.describe("Locale navigation", () => {
  test("language switcher persists locale and rewrites routes", async ({ page }) => {
    await page.goto("/more", { waitUntil: "networkidle" });

    const trigger = page.getByRole("button", { name: /Change language, current English/i });
    await trigger.click();
    await page.getByRole("menuitemradio", { name: "Français" }).click();

    await expect(page).toHaveURL(/\/fr\/more$/);
    await expect(page.getByRole("button", { name: /Change language, current Français/i })).toBeVisible();

    const storedLocale = await page.evaluate(() => window.localStorage.getItem("rayon-locale"));
    expect(storedLocale).toBe("fr");

    await page.goto("/fr/community", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/fr\/community$/);
  });
});
