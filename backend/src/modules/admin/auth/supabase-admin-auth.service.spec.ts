import { ConfigService } from '@nestjs/config';

import { SupabaseAdminAuthService } from './supabase-admin-auth.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
  })),
}));

const { createClient } = jest.requireMock('@supabase/supabase-js') as { createClient: jest.Mock };

describe('SupabaseAdminAuthService', () => {
  const originalEnv = process.env.NODE_ENV;

  const buildConfig = (overrides: Record<string, unknown> = {}) => {
    const defaults: Record<string, unknown> = {
      'supabase.url': 'https://example.supabase.co',
      'supabase.serviceRoleKey': 'service-role-key',
      'supabase.publishableKey': 'anon-key',
      'supabase.requestTimeoutMs': 4000,
      'supabase.circuitBreaker.failureThreshold': 4,
      'supabase.circuitBreaker.resetMs': 30000,
    };

    const values = { ...defaults, ...overrides };

    return {
      get: jest.fn((key: string, defaultValue?: unknown) =>
        key in values ? values[key] : defaultValue,
      ),
    } as unknown as ConfigService;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('throws in production when Supabase credentials are missing', () => {
    process.env.NODE_ENV = 'production';
    const config = buildConfig({ 'supabase.url': undefined, 'supabase.serviceRoleKey': undefined });

    expect(() => new SupabaseAdminAuthService(config)).toThrow(
      /requires a configured URL and service role key/i,
    );
  });

  it('throws when the service role key matches the publishable key', () => {
    const config = buildConfig({
      'supabase.serviceRoleKey': 'duplicate-key',
      'supabase.publishableKey': 'duplicate-key',
    });

    expect(() => new SupabaseAdminAuthService(config)).toThrow(/must not reuse the publishable key/i);
  });

  it('creates a Supabase client when configuration is valid', () => {
    const config = buildConfig();
    const service = new SupabaseAdminAuthService(config);

    expect(service.isEnabled).toBe(true);
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      expect.objectContaining({ auth: expect.any(Object) }),
    );
  });
});
