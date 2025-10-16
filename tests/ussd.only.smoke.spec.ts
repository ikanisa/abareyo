import { expect, test } from "@playwright/test";

test("tickets PDP has only USSD payment", async ({ page }) => {
  await page.goto("http://localhost:3000/tickets/123");
  const tel = await page.$("a[href^=\"tel:\"]");
  expect(tel).not.toBeNull();
  const anyCardBtn = await page.$("text=/Card|Visa|Mastercard|Apple Pay|Google Pay/i");
  expect(anyCardBtn).toBeNull();
});

test("shop PDP has only USSD payment", async ({ page }) => {
  await page.goto("http://localhost:3000/shop/home-jersey-24-25");
  const tel = await page.$("a[href^=\"tel:\"]");
  expect(tel).not.toBeNull();
  const anyCardBtn = await page.$("text=/Card|Visa|Mastercard|Apple Pay|Google Pay/i");
  expect(anyCardBtn).toBeNull();
});

test("cart shows only USSD", async ({ page }) => {
  await page.goto("http://localhost:3000/cart");
  const tel = await page.$("a[href^=\"tel:\"]");
  expect(tel).not.toBeNull();
  const other = await page.$("text=/Card|Visa|Mastercard|Apple Pay|Google Pay/i");
  expect(other).toBeNull();
});
