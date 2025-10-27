import { z } from 'zod';

/**
 * Validated environment configuration for Abareyo.
 *
 * CRITICAL SECURITY NOTES:
 * - Variables prefixed with NEXT_PUBLIC_ are exposed to the browser client bundle.
 * - Server-only secrets (SUPABASE_SERVICE_ROLE_KEY, SITE_SUPABASE_SECRET_KEY,
 *   OPENAI_API_KEY, ADMIN_SESSION_SECRET, ONBOARDING_API_TOKEN, etc.)
 *   MUST NEVER be prefixed with NEXT_PUBLIC_ or referenced in client code.
 * - Always verify that server-only keys remain server-only in both config and usage.
 */

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

const normalizeUrl = (value) => value.replace(/\/$/, '');

const envSchema = z.object({
  // === Runtime Environment ===
  APP_ENV: z.enum(['local', 'development', 'staging', 'production', 'test']).default('local'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_BASE_URL: z.string().url().optional(),
  PORT: z.string().optional(),

  // === Client-Safe Public Variables (NEXT_PUBLIC_*) ===
  // These are embedded in the browser bundle and visible to all users
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

  // === SERVER-ONLY SECRETS (NEVER use NEXT_PUBLIC_ prefix) ===
  // These must ONLY be accessed in server-side code (API routes, server components, middleware)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1), // SERVER-ONLY: Full admin access to Supabase
  SITE_SUPABASE_URL: z.string().url(), // SERVER-ONLY: Server-side Supabase URL
  SITE_SUPABASE_SECRET_KEY: z.string().min(1), // SERVER-ONLY: Server-side Supabase secret
  SUPABASE_SERVICE_KEY: z.string().optional(), // SERVER-ONLY: Alternative service key
  SUPABASE_URL: z.string().optional(), // SERVER-ONLY: Alternative URL
  SUPABASE_SECRET_KEY: z.string().optional(), // SERVER-ONLY: Alternative secret
  SITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  ONBOARDING_API_TOKEN: z.string().min(1), // SERVER-ONLY: Onboarding service auth token
  ONBOARDING_ALLOW_MOCK: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(), // SERVER-ONLY: OpenAI API authentication key
  ADMIN_SMS_PARSER_TEST_ENABLED: z.string().optional(),
  ADMIN_SMS_PARSER_TEST_RATE_LIMIT: z.string().optional(),
  ADMIN_SMS_PARSER_TEST_WINDOW_MS: z.string().optional(),

  // === Other Variables ===
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

const parsed = envSchema.parse(process.env);

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
]) {
  if (!parsed[key]) {
    missingCritical.push(key);
  }
}

if (parsed.NODE_ENV === 'production') {
  if (!parsed.NEXT_PUBLIC_SITE_URL) {
    missingCritical.push('NEXT_PUBLIC_SITE_URL (required in production)');
  }
}

if (missingCritical.length > 0) {
  throw new Error(
    `Missing required environment variables:\n  - ${missingCritical.join('\n  - ')}`,
  );
}

const defaultPort = parsed.PORT ?? '3000';

const resolvedAppBaseUrl = (() => {
  if (parsed.APP_BASE_URL) {
    return normalizeUrl(parsed.APP_BASE_URL.trim());
  }
  if (parsed.NEXT_PUBLIC_SITE_URL) {
    return normalizeUrl(parsed.NEXT_PUBLIC_SITE_URL.trim());
  }
  return normalizeUrl(`http://localhost:${defaultPort}`);
})();

const resolvedPublicSiteUrl = parsed.NEXT_PUBLIC_SITE_URL
  ? normalizeUrl(parsed.NEXT_PUBLIC_SITE_URL.trim())
  : resolvedAppBaseUrl;

const serverEnv = {
  APP_ENV: parsed.APP_ENV,
  NODE_ENV: parsed.NODE_ENV,
  APP_BASE_URL: resolvedAppBaseUrl,
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

const fallbackPort = parsed.PORT ?? '3000';
const fallbackSiteUrl =
  parsed.NEXT_PUBLIC_SITE_URL ??
  parsed.APP_BASE_URL ??
  `http://localhost:${fallbackPort}`;

const clientEnv = {
  NEXT_PUBLIC_SITE_URL: resolvedPublicSiteUrl,
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

const runtimeConfig = Object.freeze({
  appEnv: parsed.APP_ENV,
  port: defaultPort,
  server: serverEnv,
  client: clientEnv,
});

export { clientEnv, envSchema, runtimeConfig, serverEnv };
