import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendWhatsappMock = vi.hoisted(() => vi.fn()) as ReturnType<typeof vi.fn>;

const serverEnvMock = vi.hoisted(() => ({
  APP_ENV: 'test',
  NODE_ENV: 'test',
  APP_BASE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_BACKEND_URL: 'http://localhost:3000/api',
  NEXT_PUBLIC_ENVIRONMENT_LABEL: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'anon',
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: 'public-token',
  NEXT_PUBLIC_FEATURE_FLAGS: '{}',
  NEXT_PUBLIC_SOCKET_TRANSPORT: undefined,
  NEXT_PUBLIC_SOCKET_PATH: undefined,
  NEXT_PUBLIC_TELEMETRY_URL: undefined,
  NEXT_PUBLIC_SENTRY_DSN: undefined,
  NEXT_PUBLIC_OPENAI_BASE_URL: undefined,
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE: 'admin_session',
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK: undefined,
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: undefined,
  PORT: '3000',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  SITE_SUPABASE_URL: 'http://localhost:54321',
  SITE_SUPABASE_SECRET_KEY: 'service-secret',
  SUPABASE_SERVICE_KEY: 'service-key',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SECRET_KEY: 'secret',
  SITE_SUPABASE_PUBLISHABLE_KEY: 'publishable',
  SUPABASE_PUBLISHABLE_KEY: 'publishable',
  SUPABASE_ANON_KEY: 'anon',
  ONBOARDING_API_TOKEN: 'onboard-token',
  ONBOARDING_ALLOW_MOCK: '0',
  OPENAI_API_KEY: 'sk-test',
  ADMIN_SMS_PARSER_TEST_ENABLED: undefined,
  ADMIN_SMS_PARSER_TEST_RATE_LIMIT: undefined,
  ADMIN_SMS_PARSER_TEST_WINDOW_MS: undefined,
  WEB_PUSH_PRIVATE_KEY: undefined,
  WEB_PUSH_CONTACT: undefined,
  EXPO_PUSH_ACCESS_TOKEN: undefined,
  META_WABA_BASE_URL: 'https://graph.facebook.com/v21.0',
  META_WABA_PHONE_NUMBER_ID: '123456',
  META_WABA_ACCESS_TOKEN: 'meta-access-token',
  OTP_TEMPLATE_NAME: 'otp_template',
  OTP_TEMPLATE_LANGUAGE: 'en',
  OTP_TTL_SEC: 300,
  RATE_LIMIT_PER_PHONE_PER_HOUR: 5,
  JWT_SECRET: 'a'.repeat(64),
  AGENT_ID: 'agent',
  NEXT_PHASE: undefined,
  NEXT_RUNTIME: undefined,
  CI: undefined,
  E2E_API_MOCKS: undefined,
  SENTRY_DSN: undefined,
  SENTRY_TRACES_SAMPLE_RATE: undefined,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE: undefined,
  SENTRY_REPLAYS_ERROR_SAMPLE_RATE: undefined,
})) as Record<string, unknown>;

const clientEnvMock = vi.hoisted(() => ({
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_BACKEND_URL: 'http://localhost:3000/api',
  NEXT_PUBLIC_ENVIRONMENT_LABEL: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'anon',
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: 'public-token',
  NEXT_PUBLIC_FEATURE_FLAGS: '{}',
  NEXT_PUBLIC_SOCKET_TRANSPORT: undefined,
  NEXT_PUBLIC_SOCKET_PATH: undefined,
  NEXT_PUBLIC_TELEMETRY_URL: undefined,
  NEXT_PUBLIC_SENTRY_DSN: undefined,
  NEXT_PUBLIC_OPENAI_BASE_URL: undefined,
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE: 'admin_session',
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK: undefined,
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: undefined,
})) as Record<string, unknown>;

const runtimeConfigMock = vi.hoisted(() => ({
  appEnv: 'test',
  port: '3000',
  server: serverEnvMock,
  client: clientEnvMock,
})) as Record<string, unknown>;

vi.mock('@/config/env', () => ({
  serverEnv: serverEnvMock,
  clientEnv: clientEnvMock,
  runtimeConfig: runtimeConfigMock,
}));

vi.mock('@/lib/server/otp/whatsapp', async () => {
  const actual = await vi.importActual<typeof import('@/lib/server/otp/whatsapp')>(
    '@/lib/server/otp/whatsapp',
  );
  return {
    ...actual,
    sendWhatsAppOtp: sendWhatsappMock,
  };
});

import { POST as startHandler } from '@/app/api/auth/whatsapp/start/route';
import { POST as verifyHandler } from '@/app/api/auth/whatsapp/verify/route';
import { POST as resendHandler } from '@/app/api/auth/whatsapp/resend/route';
import { __internal as redisInternal } from '@/lib/redis';
import { __internal as whatsappStoreInternal } from '@/lib/server/whatsapp-auth/store';

describe('WhatsApp OTP flow', () => {
  let lastOtp: string | null = null;

  beforeEach(() => {
    redisInternal.clearAll();
    whatsappStoreInternal.reset();
    lastOtp = null;
    sendWhatsappMock.mockReset();
    sendWhatsappMock.mockImplementation(async ({ code }: { code: string }) => {
      lastOtp = code;
      return { ok: true, status: 'mocked' as const };
    });
    (serverEnvMock as Record<string, unknown>).OTP_TTL_SEC = 300;
    (serverEnvMock as Record<string, unknown>).RATE_LIMIT_PER_PHONE_PER_HOUR = 5;
  });

  it('issues and verifies an OTP successfully', async () => {
    const startResponse = await startHandler(
      new Request('http://localhost/api/auth/whatsapp/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '+250788888888' }),
      }),
    );

    expect(startResponse.status).toBe(200);
    const startBody = (await startResponse.json()) as {
      data: { requestId: string; expiresIn: number; resendAfter: number };
    };
    expect(startBody.data.requestId).toMatch(/[0-9a-f-]{36}/i);
    expect(startBody.data.expiresIn).toBeGreaterThan(0);
    expect(startBody.data.resendAfter).toBeGreaterThanOrEqual(0);
    expect(sendWhatsappMock).toHaveBeenCalledTimes(1);
    expect(lastOtp).toMatch(/^[0-9]{6}$/);
    if (!lastOtp) {
      throw new Error('expected OTP to be generated');
    }

    const verifyResponse = await verifyHandler(
      new Request('http://localhost/api/auth/whatsapp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: startBody.data.requestId, code: lastOtp }),
      }),
    );

    expect(verifyResponse.status).toBe(200);
    const verifyBody = (await verifyResponse.json()) as {
      data: { accessToken: string; refreshToken: string; userId: string };
    };
    expect(verifyBody.data.accessToken.split('.')).toHaveLength(3);
    expect(verifyBody.data.refreshToken).toBe(verifyBody.data.accessToken);
    expect(verifyBody.data.userId).toMatch(/^[0-9a-f]+$/);
  });

  it('returns otp_expired when the stored entry has lapsed', async () => {
    await startHandler(
      new Request('http://localhost/api/auth/whatsapp/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '+250788888888' }),
      }),
    );

    const dump = whatsappStoreInternal.dump();
    const [entry] = Array.from(dump.values());
    expect(entry).toBeDefined();
    if (!entry) {
      throw new Error('expected OTP record');
    }
    entry.expiresAt = Date.now() - 1;
    whatsappStoreInternal.upsert(entry);

    const verifyResponse = await verifyHandler(
      new Request('http://localhost/api/auth/whatsapp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: entry.id, code: lastOtp ?? '000000' }),
      }),
    );

    expect(verifyResponse.status).toBe(410);
    const verifyBody = (await verifyResponse.json()) as { error: string };
    expect(verifyBody.error).toBe('otp_expired');
  });

  it('enforces per-phone rate limits', async () => {
    serverEnvMock.RATE_LIMIT_PER_PHONE_PER_HOUR = 1;

    const first = await startHandler(
      new Request('http://localhost/api/auth/whatsapp/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '+250788888888' }),
      }),
    );
    expect(first.status).toBe(200);

    const second = await startHandler(
      new Request('http://localhost/api/auth/whatsapp/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '+250788888888' }),
      }),
    );

    expect(second.status).toBe(429);
    const body = (await second.json()) as { error: string; retryAt: string };
    expect(body.error).toBe('rate_limited');
    expect(new Date(body.retryAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('enforces resend cooldown before issuing a new OTP', async () => {
    const startResponse = await startHandler(
      new Request('http://localhost/api/auth/whatsapp/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '+250788888888' }),
      }),
    );

    const startBody = (await startResponse.json()) as {
      data: { requestId: string; resendAfter: number };
    };

    const cooldownResponse = await resendHandler(
      new Request('http://localhost/api/auth/whatsapp/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: startBody.data.requestId }),
      }),
    );

    expect(cooldownResponse.status).toBe(429);

    const storeDump = whatsappStoreInternal.dump();
    const record = storeDump.get(startBody.data.requestId);
    if (!record) {
      throw new Error('expected OTP record');
    }

    record.resendAvailableAt = Date.now() - 1;
    whatsappStoreInternal.upsert(record);

    const resendResponse = await resendHandler(
      new Request('http://localhost/api/auth/whatsapp/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: startBody.data.requestId }),
      }),
    );

    expect(resendResponse.status).toBe(200);
    const resendBody = (await resendResponse.json()) as { data: { resendAfter: number } };
    expect(resendBody.data.resendAfter).toBeGreaterThan(0);
    expect(sendWhatsappMock).toHaveBeenCalledTimes(2);
  });
});
