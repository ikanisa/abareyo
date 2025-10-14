import { expect, test, type Page } from '@playwright/test';

const nowIso = new Date().toISOString();

const stubMatch = {
  id: 'match-1',
  title: 'APR FC vs Rayon Sports',
  date: nowIso,
  venue: 'Amahoro Stadium',
  comp: 'Premier League',
  status: 'scheduled',
};

const stubTicketOrder = {
  id: 'order-1',
  status: 'pending',
  total: 25000,
  momo_ref: 'MOMO12345',
  ussd_code: null,
  created_at: nowIso,
  expires_at: null,
  user: { id: 'user-1', name: 'Alice Fan', phone: '+250788123456' },
  match: stubMatch,
  passes: [],
  payments: [],
};

const stubTicketPass = {
  id: 'pass-1',
  order_id: stubTicketOrder.id,
  zone: 'Blue',
  gate: 'G1',
  state: 'active',
  qr_token_hash: null,
  created_at: nowIso,
  order: {
    id: stubTicketOrder.id,
    status: stubTicketOrder.status,
    momo_ref: stubTicketOrder.momo_ref,
    total: stubTicketOrder.total,
    match_id: stubMatch.id,
    created_at: nowIso,
    user: stubTicketOrder.user,
    match: { id: stubMatch.id, title: stubMatch.title, date: stubMatch.date, venue: stubMatch.venue },
  },
};

const stubScanStats = {
  passes: 42,
  orders: 28,
  statusSummary: [
    { status: 'pending', count: 12 },
    { status: 'paid', count: 10 },
  ],
  throughputPerGate: [{ gate: 'Gate A', perMin: 35, samples: 120 }],
};

const stubShopProduct = {
  id: 'prod-1',
  name: 'Home Jersey',
  category: 'jerseys',
  price: 45000,
  stock: 25,
  description: 'Classic 2025 kit',
  badge: null,
  image_url: null,
  images: ['https://placehold.co/200x200'],
};

const stubShopOrder = {
  id: 'shop-order-1',
  status: 'pending',
  total: 45000,
  momo_ref: 'MOMO9988',
  created_at: nowIso,
  user: { id: 'user-10', name: 'Jean Supporter', phone: '+250789654321' },
  items: [
    {
      id: 'item-1',
      qty: 1,
      price: 45000,
      product: { id: stubShopProduct.id, name: stubShopProduct.name, image_url: stubShopProduct.images[0] ?? null },
    },
  ],
  payments: [],
};

async function loginAsAdmin(page: Page) {
  const response = await page.request.post('/api/e2e/admin/auth/login', {
    data: { email: 'admin@example.com', password: 'password' },
  });
  expect(response.ok()).toBeTruthy();
}

async function mockAdminApis(page: Page) {
  await page.route('**/admin/api/tickets/matches**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 200, body: JSON.stringify({ matches: [stubMatch] }), headers: { 'content-type': 'application/json' } });
      return;
    }
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ matches: [stubMatch] }),
      headers: { 'content-type': 'application/json' },
    });
  });

  await page.route('**/admin/api/tickets/orders**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [stubTicketOrder], count: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ order: stubTicketOrder }),
      headers: { 'content-type': 'application/json' },
    });
  });

  await page.route('**/admin/api/tickets/passes**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ passes: [stubTicketPass] }),
        headers: { 'content-type': 'application/json' },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ pass: stubTicketPass }),
      headers: { 'content-type': 'application/json' },
    });
  });

  await page.route('**/admin/api/tickets/scan-stats**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(stubScanStats),
      headers: { 'content-type': 'application/json' },
    });
  });

  await page.route('**/admin/api/sms/parsed**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ sms: [] }),
      headers: { 'content-type': 'application/json' },
    });
  });

  await page.route('**/admin/api/shop/products**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ products: [stubShopProduct] }),
        headers: { 'content-type': 'application/json' },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ product: stubShopProduct, ok: true }),
      headers: { 'content-type': 'application/json' },
    });
  });

  await page.route('**/admin/api/shop/orders**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [stubShopOrder], count: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ order: stubShopOrder }),
      headers: { 'content-type': 'application/json' },
    });
  });
}

test.describe('admin ticketing console', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockAdminApis(page);
  });

  test('orders page renders', async ({ page }) => {
    await page.goto('/admin/tickets/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    await expect(page.locator('body')).toContainText('Ticketing Console', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('Status', { timeout: 10_000 });
  });

  test('passes page renders', async ({ page }) => {
    await page.goto('/admin/tickets/passes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    await expect(page.locator('body')).toContainText('Ticketing Console', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('Issued passes', { timeout: 10_000 });
  });

  test('scan dashboard renders', async ({ page }) => {
    await page.goto('/admin/tickets/scan', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    await expect(page.locator('body')).toContainText('Ticketing Console', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('Scan Dashboard', { timeout: 10_000 });
  });
});

test.describe('admin shop console', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockAdminApis(page);
  });

  test('products page renders', async ({ page }) => {
    await page.goto('/admin/shop/products', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    await expect(page.locator('body')).toContainText('Shop Console', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('Catalog', { timeout: 10_000 });
  });

  test('orders page renders', async ({ page }) => {
    await page.goto('/admin/shop/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    await expect(page.locator('body')).toContainText('Shop Console', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('Orders', { timeout: 10_000 });
  });
});
