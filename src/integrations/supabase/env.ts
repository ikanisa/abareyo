import { serverEnv } from '@/config/env';

const pick = (candidates: Array<string | undefined | null>): string | null => {
  for (const value of candidates) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const fallbackEnv = process.env as Record<string, string | undefined>;

export const getSupabaseUrl = (): string | null =>
  pick([
    serverEnv.SITE_SUPABASE_URL,
    serverEnv.SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    fallbackEnv.VITE_SUPABASE_URL,
  ]);

export const getSupabasePublishableKey = (): string | null =>
  pick([
    serverEnv.SITE_SUPABASE_PUBLISHABLE_KEY,
    serverEnv.SITE_SUPABASE_ANON_KEY,
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    serverEnv.SUPABASE_PUBLISHABLE_KEY,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serverEnv.SUPABASE_ANON_KEY,
    fallbackEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
  ]);

export const getSupabaseSecretKey = (): string | null =>
  pick([
    serverEnv.SITE_SUPABASE_SECRET_KEY,
    serverEnv.SUPABASE_SECRET_KEY,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    serverEnv.SUPABASE_SERVICE_KEY,
  ]);
