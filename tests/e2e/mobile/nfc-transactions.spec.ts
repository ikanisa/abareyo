import { expect, test } from "@playwright/test";

test.describe("NFC transactions", () => {
  test("dispatching NFC transaction event marks payment pending", async ({ page }) => {
    await page.goto("/");

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/transactions/nfc") && response.request().method() === "POST",
    );

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("nfc:transaction", {
          detail: {
            transactionId: "tx-playwright",
            amount: 2750,
            kind: "ticket",
            userId: "fan-e2e",
            metadata: { origin: "test" },
          },
        }),
      );
    });

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: true, data: { transactionId: "tx-playwright", status: "pending" } });

    const events = await page.evaluate(() => (window as unknown as { __nfcEvents?: unknown[] }).__nfcEvents ?? []);
    expect(Array.isArray(events)).toBeTruthy();
    expect(events.some((event: any) => event?.detail?.transactionId === "tx-playwright")).toBeTruthy();
  });
});
