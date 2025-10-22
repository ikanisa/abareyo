import { z } from 'zod';

const isValidBackendUrl = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    // Accept absolute URLs as-is
    new URL(trimmed);
    return true;
  } catch (absoluteUrlError) {
    // Also accept relative paths so deployments can proxy through Next.js
    return trimmed.startsWith('/');
  }
};

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_BACKEND_URL: z
    .string()
    .min(1)
    .refine(
      (value) => isValidBackendUrl(value),
      'NEXT_PUBLIC_BACKEND_URL must be an absolute URL or start with "/"',
    ),
  NEXT_PUBLIC_ENVIRONMENT_LABEL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: z.string().min(1),
  NEXT_PUBLIC_FEATURE_FLAGS: z.string().default('{}'),
  NEXT_PUBLIC_SOCKET_TRANSPORT: z.string().optional(),
  NEXT_PUBLIC_SOCKET_PATH: z.string().optional(),
  NEXT_PUBLIC_TELEMETRY_URL: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_OPENAI_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE: z.string().optional(),
  NEXT_PUBLIC_ADMIN_API_TOKEN: z.string().optional(),
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK: z.string().optional(),
  PORT: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SITE_SUPABASE_URL: z.string().url(),
  SITE_SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  ONBOARDING_API_TOKEN: z.string().min(1),
  ONBOARDING_ALLOW_MOCK: z.string().optional(),
  OPENAI_API_KEY: z.string().min(1),
  AGENT_ID: z.string().optional(),
  NEXT_PHASE: z.string().optional(),
  NEXT_RUNTIME: z.string().optional(),
  CI: z.string().optional(),
  E2E_API_MOCKS: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE: z.string().optional(),
  SENTRY_REPLAYS_ERROR_SAMPLE_RATE: z.string().optional(),
});

const parsed = baseSchema.parse(process.env);

const missingCritical = [];
for (const key of [
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_ENVIRONMENT_LABEL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SITE_SUPABASE_URL',
  'SITE_SUPABASE_SECRET_KEY',
  'ONBOARDING_API_TOKEN',
  'OPENAI_API_KEY',
]) {
  if (!parsed[key]) {
    missingCritical.push(key);
  }
}

if (parsed.NODE_ENV === 'production') {
  if (!parsed.NEXT_PUBLIC_SITE_URL) {
    missingCritical.push('NEXT_PUBLIC_SITE_URL (required in production)');
  }
  if (!parsed.NEXT_PUBLIC_SENTRY_DSN && !parsed.SENTRY_DSN) {
    missingCritical.push('SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN (one must be set in production)');
  }
}

if (missingCritical.length > 0) {
  throw new Error(
    `Missing required environment variables:\n  - ${missingCritical.join('\n  - ')}`,
  );
}

const serverEnv = {
  NODE_ENV: parsed.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: parsed.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_BACKEND_URL: parsed.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_ENVIRONMENT_LABEL: parsed.NEXT_PUBLIC_ENVIRONMENT_LABEL,
  NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: parsed.NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN,
  NEXT_PUBLIC_FEATURE_FLAGS: parsed.NEXT_PUBLIC_FEATURE_FLAGS,
  NEXT_PUBLIC_SOCKET_TRANSPORT: parsed.NEXT_PUBLIC_SOCKET_TRANSPORT,
  NEXT_PUBLIC_SOCKET_PATH: parsed.NEXT_PUBLIC_SOCKET_PATH,
  NEXT_PUBLIC_TELEMETRY_URL: parsed.NEXT_PUBLIC_TELEMETRY_URL,
  NEXT_PUBLIC_SENTRY_DSN: parsed.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_OPENAI_BASE_URL: parsed.NEXT_PUBLIC_OPENAI_BASE_URL,
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE: parsed.NEXT_PUBLIC_ADMIN_SESSION_COOKIE,
  NEXT_PUBLIC_ADMIN_API_TOKEN: parsed.NEXT_PUBLIC_ADMIN_API_TOKEN,
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK: parsed.NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK,
  PORT: parsed.PORT,
  SUPABASE_SERVICE_ROLE_KEY: parsed.SUPABASE_SERVICE_ROLE_KEY,
  SITE_SUPABASE_URL: parsed.SITE_SUPABASE_URL,
  SITE_SUPABASE_SECRET_KEY: parsed.SITE_SUPABASE_SECRET_KEY,
  SUPABASE_SERVICE_KEY: parsed.SUPABASE_SERVICE_KEY,
  SUPABASE_URL: parsed.SUPABASE_URL,
  SUPABASE_SECRET_KEY: parsed.SUPABASE_SECRET_KEY,
  SITE_SUPABASE_PUBLISHABLE_KEY: parsed.SITE_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_PUBLISHABLE_KEY: parsed.SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_ANON_KEY: parsed.SUPABASE_ANON_KEY,
  ONBOARDING_API_TOKEN: parsed.ONBOARDING_API_TOKEN,
  ONBOARDING_ALLOW_MOCK: parsed.ONBOARDING_ALLOW_MOCK,
  OPENAI_API_KEY: parsed.OPENAI_API_KEY,
  AGENT_ID: parsed.AGENT_ID,
  NEXT_PHASE: parsed.NEXT_PHASE,
  NEXT_RUNTIME: parsed.NEXT_RUNTIME,
  CI: parsed.CI,
  E2E_API_MOCKS: parsed.E2E_API_MOCKS,
  SENTRY_DSN: parsed.SENTRY_DSN,
  SENTRY_TRACES_SAMPLE_RATE: parsed.SENTRY_TRACES_SAMPLE_RATE,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE: parsed.SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
  SENTRY_REPLAYS_ERROR_SAMPLE_RATE: parsed.SENTRY_REPLAYS_ERROR_SAMPLE_RATE,
};

const clientEnv = {
  NEXT_PUBLIC_SITE_URL: parsed.NEXT_PUBLIC_SITE_URL ?? '',
  NEXT_PUBLIC_BACKEND_URL: parsed.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_ENVIRONMENT_LABEL: parsed.NEXT_PUBLIC_ENVIRONMENT_LABEL,
  NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: parsed.NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN,
  NEXT_PUBLIC_FEATURE_FLAGS: parsed.NEXT_PUBLIC_FEATURE_FLAGS,
  NEXT_PUBLIC_SOCKET_TRANSPORT: parsed.NEXT_PUBLIC_SOCKET_TRANSPORT,
  NEXT_PUBLIC_SOCKET_PATH: parsed.NEXT_PUBLIC_SOCKET_PATH,
  NEXT_PUBLIC_TELEMETRY_URL: parsed.NEXT_PUBLIC_TELEMETRY_URL,
  NEXT_PUBLIC_SENTRY_DSN: parsed.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_OPENAI_BASE_URL: parsed.NEXT_PUBLIC_OPENAI_BASE_URL,
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE: parsed.NEXT_PUBLIC_ADMIN_SESSION_COOKIE,
  NEXT_PUBLIC_ADMIN_API_TOKEN: parsed.NEXT_PUBLIC_ADMIN_API_TOKEN,
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK: parsed.NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK,
};

export { clientEnv, serverEnv };
