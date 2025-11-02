import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envFiles = ['.env', '.env.local'];
for (const file of envFiles) {
  const filePath = resolve(process.cwd(), file);
  if (existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
}

process.env.META_WABA_BASE_URL ??= 'https://graph.facebook.com/v21.0';
process.env.META_WABA_PHONE_NUMBER_ID ??= 'test-phone-number-id';
process.env.META_WABA_ACCESS_TOKEN ??= 'test-access-token';
process.env.OTP_TEMPLATE_NAME ??= 'test_otp_template';
process.env.OTP_TEMPLATE_LANGUAGE ??= 'en';
process.env.OTP_TTL_SEC ??= '300';
process.env.RATE_LIMIT_PER_PHONE_PER_HOUR ??= '5';
process.env.JWT_SECRET ??= 'test-secret-value-that-is-long-enough-123456';
process.env.NEXT_PUBLIC_BACKEND_URL ??= 'http://localhost:3000/api';
process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ??= 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'anon';
process.env.NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN ??= 'public-token';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'service-role-key';
process.env.SITE_SUPABASE_URL ??= 'http://localhost:54321';
process.env.SITE_SUPABASE_SECRET_KEY ??= 'service-secret';
process.env.ONBOARDING_API_TOKEN ??= 'onboard-token';

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // @ts-expect-error - jsdom globals allow assignment
  globalThis.ResizeObserver = ResizeObserverPolyfill;
}

if (typeof document !== 'undefined' && typeof document.elementFromPoint !== 'function') {
  // @ts-expect-error - jsdom document allows assignment for testing
  document.elementFromPoint = () => null;
}
