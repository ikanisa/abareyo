import type { z } from 'zod';

export type AppEnv = 'local' | 'development' | 'staging' | 'production' | 'test';

export type RuntimeEnv = {
  APP_ENV: AppEnv;
  NODE_ENV: 'development' | 'test' | 'production';
  APP_BASE_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_BACKEND_URL: string;
  NEXT_PUBLIC_ENVIRONMENT_LABEL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: string;
  NEXT_PUBLIC_FEATURE_FLAGS: string;
  NEXT_PUBLIC_SOCKET_TRANSPORT?: string;
  NEXT_PUBLIC_SOCKET_PATH?: string;
  NEXT_PUBLIC_TELEMETRY_URL?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_OPENAI_BASE_URL?: string;
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE?: string;
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK?: string;
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?: string;
  PORT?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SITE_SUPABASE_URL: string;
  SITE_SUPABASE_SECRET_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  SITE_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  ONBOARDING_API_TOKEN: string;
  ONBOARDING_ALLOW_MOCK?: string;
  OPENAI_API_KEY?: string;
  ADMIN_SMS_PARSER_TEST_ENABLED?: string;
  ADMIN_SMS_PARSER_TEST_RATE_LIMIT?: string;
  ADMIN_SMS_PARSER_TEST_WINDOW_MS?: string;
  WEB_PUSH_PRIVATE_KEY?: string;
  WEB_PUSH_CONTACT?: string;
  EXPO_PUSH_ACCESS_TOKEN?: string;
  META_WABA_BASE_URL?: string;
  META_WABA_PHONE_NUMBER_ID: string;
  META_WABA_ACCESS_TOKEN: string;
  OTP_TEMPLATE_NAME: string;
  OTP_TEMPLATE_LANGUAGE: string;
  OTP_TTL_SEC: number;
  RATE_LIMIT_PER_PHONE_PER_HOUR: number;
  JWT_SECRET: string;
  AGENT_ID?: string;
  NEXT_PHASE?: string;
  NEXT_RUNTIME?: string;
  CI?: string;
  E2E_API_MOCKS?: string;
  SENTRY_DSN?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: string;
  SENTRY_REPLAYS_ERROR_SAMPLE_RATE?: string;
};

export interface ServerEnv {
  APP_ENV: AppEnv;
  NODE_ENV: 'development' | 'test' | 'production';
  APP_BASE_URL: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_BACKEND_URL: string;
  NEXT_PUBLIC_ENVIRONMENT_LABEL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: string;
  NEXT_PUBLIC_FEATURE_FLAGS: string;
  NEXT_PUBLIC_SOCKET_TRANSPORT?: string;
  NEXT_PUBLIC_SOCKET_PATH?: string;
  NEXT_PUBLIC_TELEMETRY_URL?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_OPENAI_BASE_URL?: string;
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE?: string;
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK?: string;
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?: string;
  PORT?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SITE_SUPABASE_URL: string;
  SITE_SUPABASE_SECRET_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  SITE_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  ONBOARDING_API_TOKEN: string;
  ONBOARDING_ALLOW_MOCK?: string;
  OPENAI_API_KEY?: string;
  ADMIN_SMS_PARSER_TEST_ENABLED?: string;
  ADMIN_SMS_PARSER_TEST_RATE_LIMIT?: string;
  ADMIN_SMS_PARSER_TEST_WINDOW_MS?: string;
  META_WABA_BASE_URL: string;
  META_WABA_PHONE_NUMBER_ID: string;
  META_WABA_ACCESS_TOKEN: string;
  OTP_TEMPLATE_NAME: string;
  OTP_TEMPLATE_LANGUAGE: string;
  OTP_TTL_SEC: number;
  RATE_LIMIT_PER_PHONE_PER_HOUR: number;
  JWT_SECRET: string;
  AGENT_ID?: string;
  NEXT_PHASE?: string;
  NEXT_RUNTIME?: string;
  CI?: string;
  E2E_API_MOCKS?: string;
  SENTRY_DSN?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: string;
  SENTRY_REPLAYS_ERROR_SAMPLE_RATE?: string;
}

export interface ClientEnv {
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_BACKEND_URL: string;
  NEXT_PUBLIC_ENVIRONMENT_LABEL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: string;
  NEXT_PUBLIC_FEATURE_FLAGS: string;
  NEXT_PUBLIC_SOCKET_TRANSPORT?: string;
  NEXT_PUBLIC_SOCKET_PATH?: string;
  NEXT_PUBLIC_TELEMETRY_URL?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_OPENAI_BASE_URL?: string;
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE?: string;
  NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK?: string;
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?: string;
}

export interface RuntimeConfig {
  appEnv: AppEnv;
  port: string;
  server: ServerEnv;
  client: ClientEnv;
}

export declare const envSchema: z.ZodType<RuntimeEnv>;

export declare const serverEnv: ServerEnv;

export declare const clientEnv: ClientEnv;

export declare const runtimeConfig: Readonly<RuntimeConfig>;
