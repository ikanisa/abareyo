import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/admin/service-client', () => ({
  AdminServiceClientUnavailableError: class extends Error {},
  getAdminServiceClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }),
  })),
  tryGetAdminServiceClient: vi.fn(() => null),
  withAdminServiceClient: vi.fn(),
}));

import type { AdminContext } from '@/app/api/admin/_lib/session';
import * as adminSession from '@/app/api/admin/_lib/session';

const buildRequest = (options: { method: string; cookie?: string; headers?: Record<string, string> }) => {
  const headers = new Headers(options.headers ?? {});
  if (options.cookie) {
    headers.set('cookie', options.cookie);
  }
  return new Request('http://localhost/test', { method: options.method, headers });
};

describe('requireAdmin CSRF enforcement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects mutating requests without CSRF tokens', async () => {
    const request = buildRequest({ method: 'POST', cookie: 'admin_session=token' });

    const result = await adminSession.requireAdmin(request);

    expect(result.response?.status).toBe(403);
  });

  it('rejects when CSRF header and cookie mismatch', async () => {
    const request = buildRequest({
      method: 'PATCH',
      cookie: 'admin_session=token; gikundiro-admin-csrf=alpha',
      headers: { 'x-admin-csrf': 'beta' },
    });

    const result = await adminSession.requireAdmin(request);

    expect(result.response?.status).toBe(403);
  });

  it('allows mutating requests when CSRF token matches and session resolves', async () => {
    const context: AdminContext = {
      user: { id: 'admin-1', email: 'admin@example.com', displayName: 'Admin', status: 'active', roles: [] },
      permissions: ['*'],
      session: { id: 'session-1', expiresAt: null },
    };

    const spy = vi
      .spyOn(adminSession.adminSessionInternals, 'fetchContext')
      .mockResolvedValue(context);

    const request = buildRequest({
      method: 'DELETE',
      cookie: 'admin_session=token; gikundiro-admin-csrf=secure',
      headers: { 'x-admin-csrf': 'secure' },
    });

    const result = await adminSession.requireAdmin(request);

    expect(spy).toHaveBeenCalledWith('token');
    expect(result.context?.user.id).toBe('admin-1');
  });
});
