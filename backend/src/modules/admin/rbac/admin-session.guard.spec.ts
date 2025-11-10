import 'reflect-metadata';

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AdminAuthService } from '../auth/admin-auth.service.js';
import { AdminSessionGuard } from './admin-session.guard.js';

const createConfigService = () => {
  return {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'admin.session.cookieName') {
        return 'admin_session';
      }
      if (key === 'app.env') {
        return 'development';
      }
      return defaultValue;
    }),
  } as unknown as ConfigService;
};

describe('AdminSessionGuard', () => {
  it('normalizes permission payloads into an immutable set', async () => {
    const adminAuthService = {
      getActiveSession: jest.fn().mockResolvedValue({
        session: { id: 'session-1', expiresAt: new Date(Date.now() + 60_000) },
        permissionKeys: new Set(['ticket:order:view ', 'ticket:order:view']),
        user: { id: 'admin-1', email: 'ops@example.com', displayName: 'Ops', status: 'active', roles: ['SYSTEM_ADMIN'] },
      }),
    } as unknown as AdminAuthService;
    const guard = new AdminSessionGuard(adminAuthService, createConfigService());

    const request: Record<string, unknown> = {
      cookies: { admin_session: 'session-1' },
    };
    const reply = { clearCookie: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(Array.from(request.adminPermissions as ReadonlySet<string>)).toEqual(['ticket:order:view']);
    expect('add' in (request.adminPermissions as object)).toBe(false);
    expect(reply.clearCookie).not.toHaveBeenCalled();
  });

  it('rejects sessions that include invalid permission payloads', async () => {
    const adminAuthService = {
      getActiveSession: jest.fn().mockResolvedValue({
        session: { id: 'session-1', expiresAt: new Date(Date.now() + 60_000) },
        permissionKeys: new Set([123]),
        user: { id: 'admin-1', email: 'ops@example.com', displayName: 'Ops', status: 'active', roles: ['SYSTEM_ADMIN'] },
      }),
    } as unknown as AdminAuthService;
    const guard = new AdminSessionGuard(adminAuthService, createConfigService());

    const request: Record<string, unknown> = {
      cookies: { admin_session: 'session-1' },
    };
    const reply = { clearCookie: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    } as any;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(reply.clearCookie).toHaveBeenCalledWith('admin_session', expect.any(Object));
  });
});
