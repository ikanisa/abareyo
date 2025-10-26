import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAdminFundraisingProjects,
  exportAdminFundraisingDonations,
  fetchAdminFundraisingSummary,
} from '@/lib/api/admin/fundraising';
import {
  fetchAdminMembershipPlans,
  fetchAdminMembershipMembers,
  updateAdminMembershipStatus,
} from '@/lib/api/admin/membership';
import {
  fetchAdminShopOrders,
  fetchAdminShopSummary,
  updateAdminShopStatus,
  batchUpdateAdminShopStatus,
} from '@/lib/api/admin/shop';
import { fetchAdminFeatureFlags, upsertAdminFeatureFlag } from '@/lib/api/admin/feature-flags';
import {
  fetchAdminTranslations,
  fetchAdminTranslationLanguages,
  upsertAdminTranslation,
  deleteAdminTranslation,
  exportAdminTranslations,
  importAdminTranslations,
} from '@/lib/api/admin/translations';
import {
  fetchInboundSms,
  fetchManualReviewSms,
  fetchManualReviewPayments,
  attachSmsToPayment,
  fetchSmsQueueOverview,
  retryManualSms,
  dismissManualSms,
  fetchSmsParserPrompts,
  fetchActiveSmsParserPrompt,
  createSmsParserPrompt,
  activateSmsParserPrompt,
  testSmsParser,
} from '@/lib/api/admin/sms';
import { fetchAdminReportsOverview } from '@/lib/api/admin/reports';

const originalFetch = global.fetch;

describe('admin API helpers', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', '/api');
    vi.stubEnv('NEXT_PUBLIC_ADMIN_API_TOKEN', 'admin-token');
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches fundraising projects with query params', async () => {
    const payload = { data: [], meta: { page: 1, pageSize: 25, total: 0 } };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchAdminFundraisingProjects({ status: 'active', search: 'academy' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/fundraising/projects?status=active&search=academy'),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(result).toEqual(payload);
  });

  it('throws when the backend returns an error', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error',
    });

    await expect(fetchAdminMembershipPlans()).rejects.toThrow(/Server error/);
  });

  it('supports exporting fundraising donations as CSV', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => 'id,status',
    });

    const csv = await exportAdminFundraisingDonations({ status: 'confirmed' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/fundraising/donations/export?status=confirmed'),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(csv).toContain('id');
  });

  it('passes date range when fetching fundraising summary', async () => {
    const payload = {
      data: {
        totalRaised: 0,
        pendingAmount: 0,
        activeProjects: 0,
        topProjects: [],
        dailySeries: [],
        range: { from: null, to: null },
      },
    };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const from = new Date('2025-01-01').toISOString();
    const summary = await fetchAdminFundraisingSummary({ from });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/fundraising/summary?from=${encodeURIComponent(from)}`),
      expect.any(Object),
    );
    expect(summary).toEqual(payload.data);
  });

  it('lists membership members with pagination', async () => {
    const payload = { data: [], meta: { page: 2, pageSize: 10, total: 0 } };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchAdminMembershipMembers({ page: 2, pageSize: 10, status: 'active', search: 'jean' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/membership/members?page=2&pageSize=10&status=active&search=jean'),
      expect.any(Object),
    );
    expect(result).toEqual(payload);
  });

  it('updates membership status via POST payload', async () => {
    const updated = { id: 'membership-1', status: 'active' };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', data: updated }),
    });

    const response = await updateAdminMembershipStatus('membership-1', { status: 'active', autoRenew: true });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/membership/members/membership-1/status'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ status: 'active', autoRenew: true }) }),
    );
    expect(response).toEqual(updated);
  });

  it('fetches shop orders with search filters', async () => {
    const payload = { data: [], meta: { page: 1, pageSize: 25, total: 0 } };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchAdminShopOrders({ status: 'pending', search: 'SHOP-123' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/shop/orders?status=pending&search=SHOP-123'),
      expect.any(Object),
    );
    expect(result).toEqual(payload);
  });

  it('updates shop order status and returns response data', async () => {
    const order = { id: 'order-1', status: 'ready_for_pickup' };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', data: order }),
    });

    const response = await updateAdminShopStatus('order-1', { status: 'ready_for_pickup' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/shop/orders/order-1/status'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ status: 'ready_for_pickup' }) }),
    );
    expect(response).toEqual(order);
  });

  it('batch updates shop order statuses', async () => {
    const orders = [{ id: 'order-1', status: 'fulfilled' }];
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', data: orders }),
    });

    const response = await batchUpdateAdminShopStatus({ orderIds: ['order-1'], status: 'fulfilled' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/shop/orders/status/batch'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ orderIds: ['order-1'], status: 'fulfilled' }) }),
    );
    expect(response).toEqual(orders);
  });

  it('applies date filters when fetching shop summary', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { totalsByStatus: {}, totalRevenue: 0, averageOrderValue: 0, outstandingCount: 0, readyForPickupCount: 0, fulfilledCount: 0, range: { from: null, to: null } } }),
    });

    const from = new Date('2025-02-01').toISOString();
    await fetchAdminShopSummary({ from });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/shop/summary?from=${encodeURIComponent(from)}`),
      expect.any(Object),
    );
  });

  it('fetches admin reports overview', async () => {
    const payload = { data: { range: { from: null, to: null }, shop: { totalRevenue: 0, outstandingCount: 0, readyForPickupCount: 0, fulfilledCount: 0, totalsByStatus: {} }, fundraising: { totalRaised: 0, pendingAmount: 0, activeProjects: 0, topProjects: [], dailySeries: [] }, membership: { total: 0, active: 0, pending: 0, cancelled: 0, autoRenewEnabled: 0, expiringSoon: 0, planSeries: [] } } };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchAdminReportsOverview({ from: '2025-01-01' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/reports/overview?from=2025-01-01'),
      expect.any(Object),
    );
    expect(result).toEqual(payload.data);
  });

  it('fetches feature flags and maps data', async () => {
    const flags = [{ key: 'feature.alpha', enabled: true, description: null, updatedAt: new Date().toISOString(), updatedBy: null }];
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: flags }),
    });

    const result = await fetchAdminFeatureFlags();

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/feature-flags'), expect.any(Object));
    expect(result).toEqual(flags);
  });

  it('upserts feature flags via POST', async () => {
    const flag = { key: 'feature.beta', enabled: false, description: 'Beta', updatedAt: new Date().toISOString(), updatedBy: null };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', data: flag }),
    });

    const response = await upsertAdminFeatureFlag({ key: 'feature.beta', enabled: false, description: 'Beta' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/feature-flags'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'feature.beta', enabled: false, description: 'Beta' }) }),
    );
    expect(response).toEqual(flag);
  });

  it('fetches translations with filters', async () => {
    const payload = { data: [], meta: { page: 1, pageSize: 20, total: 0 } };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchAdminTranslations({ lang: 'en', page: 1, search: 'home' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/translations?lang=en&page=1&search=home'),
      expect.any(Object),
    );
    expect(result).toEqual(payload);
  });

  it('lists available translation languages', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: ['en', 'rw'] }),
    });

    const languages = await fetchAdminTranslationLanguages();

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/translations/languages'), expect.any(Object));
    expect(languages).toEqual(['en', 'rw']);
  });

  it('creates or updates a translation entry', async () => {
    const translation = { lang: 'en', key: 'nav.home', value: 'Home', updatedAt: new Date().toISOString(), updatedBy: null };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: translation }),
    });

    const result = await upsertAdminTranslation({ lang: 'en', key: 'nav.home', value: 'Home' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/translations'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ lang: 'en', key: 'nav.home', value: 'Home' }) }),
    );
    expect(result).toEqual(translation);
  });

  it('deletes a translation via DELETE request', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, text: async () => '' });

    await deleteAdminTranslation('en', 'nav.home');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/translations/en/nav.home'),
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    );
  });

  it('exports translations as JSON', async () => {
    const payload = { lang: 'en', entries: [{ key: 'nav.home', value: 'Home', updatedAt: new Date().toISOString() }] };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const exportResult = await exportAdminTranslations('en');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/translations/export?lang=en'),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(exportResult).toEqual(payload);
  });

  it('imports translations and returns diff', async () => {
    const diff = {
      applied: true,
      lang: 'en',
      created: [{ key: 'nav.new', value: 'New' }],
      updated: [],
      unchanged: [],
    };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', data: diff }),
    });

    const response = await importAdminTranslations({ lang: 'en', entries: [{ key: 'nav.new', value: 'New' }], mode: 'apply' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/translations/import'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ lang: 'en', entries: [{ key: 'nav.new', value: 'New' }], mode: 'apply' }) }),
    );
    expect(response).toEqual(diff);
  });

  it('fetches inbound SMS with optional limit', async () => {
    const records = [{ id: 'sms-1', text: 'test', fromMsisdn: '078xx', receivedAt: new Date().toISOString(), ingestStatus: 'received' as const }];
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: records }),
    });

    const result = await fetchInboundSms(20);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/sms/inbound?limit=20'), expect.any(Object));
    expect(result).toEqual(records);
  });

  it('fetches manual review SMS and payments', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await fetchManualReviewSms();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/sms/manual'), expect.any(Object));

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await fetchManualReviewPayments(10);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/sms/manual/payments?limit=10'), expect.any(Object));
  });

  it('attaches SMS to payment', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', data: { id: 'sms-1' } }),
    });

    await attachSmsToPayment({ smsId: 'sms-1', paymentId: 'payment-1' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/sms/manual/attach'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ smsId: 'sms-1', paymentId: 'payment-1' }) }),
    );
  });

  it('fetches SMS queue overview and handles retries/dismissals', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { waiting: 1, delayed: 0, active: 0, pending: [] } }),
    });

    await fetchSmsQueueOverview();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/sms/queue'), expect.any(Object));

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
    await retryManualSms('sms-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/sms/manual/sms-1/retry'),
      expect.objectContaining({ method: 'POST' }),
    );

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
    await dismissManualSms('sms-1', { resolution: 'ignore', note: 'Handled' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/sms/manual/sms-1/dismiss'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ resolution: 'ignore', note: 'Handled' }) }),
    );
  });

  it('manages SMS parser prompts lifecycle', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    await fetchSmsParserPrompts();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/sms/parser/prompts'), expect.any(Object));

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ data: null }) });
    const active = await fetchActiveSmsParserPrompt();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/sms/parser/prompts/active'), expect.any(Object));
    expect(active).toBeNull();

    const prompt = { id: 'prompt-1', label: 'New', body: 'Body', version: 1, isActive: false, createdAt: new Date().toISOString() };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ data: prompt }) });
    const created = await createSmsParserPrompt({ label: 'New', body: 'Body' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/sms/parser/prompts'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ label: 'New', body: 'Body' }) }),
    );
    expect(created).toEqual(prompt);

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ data: { ...prompt, isActive: true } }) });
    await activateSmsParserPrompt('prompt-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/sms/parser/prompts/prompt-1/activate'),
      expect.objectContaining({ method: 'POST' }),
    );

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { amount: 1000, currency: 'RWF', ref: 'ABC', confidence: 0.9, parserVersion: 'v1' } }),
    });
    await testSmsParser({ text: 'MTN MOMO 1000', promptBody: '...' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/sms/parser/test'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ text: 'MTN MOMO 1000', promptBody: '...' }) }),
    );
  });

  it('calls legacy admin SMS endpoints with admin token', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_ADMIN_API_TOKEN', 'admin-token');
    const legacy = await import('@/lib/api/admin');
    const fetchLegacyInboundSms = legacy.fetchInboundSms;
    const fetchLegacyManualSms = legacy.fetchManualReviewSms;
    const fetchLegacyManualPayments = legacy.fetchManualReviewPayments;
    const legacyAttachSmsToPayment = legacy.attachSmsToPayment;

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const expectLastCallAuthHeader = () => {
      const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      const init = (lastCall?.[1] ?? {}) as RequestInit;
      const headers = new Headers(init.headers);
      expect(headers.get('x-admin-token')).toBe('admin-token');
    };

    await fetchLegacyInboundSms();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/sms/inbound'), expect.anything());
    expectLastCallAuthHeader();

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    await fetchLegacyManualSms();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/sms/manual-review'), expect.anything());
    expectLastCallAuthHeader();

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    await fetchLegacyManualPayments();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/payments/manual-review'), expect.anything());
    expectLastCallAuthHeader();

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });
    await legacyAttachSmsToPayment({ smsId: 'sms-1', paymentId: 'payment-1' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sms/manual-review/attach'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.anything(),
      }),
    );
    expectLastCallAuthHeader();
    const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    const init = (lastCall?.[1] ?? {}) as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('content-type')).toBe('application/json');
  });
});
