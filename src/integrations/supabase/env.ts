const pick = (candidates: Array<string | undefined | null>): string | null => {
  for (const value of candidates) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

export const getSupabaseUrl = (): string | null =>
  pick([
    process.env.SITE_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
  ]);

export const getSupabasePublishableKey = (): string | null =>
  pick([
    process.env.SITE_SUPABASE_PUBLISHABLE_KEY,
    process.env.SITE_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ]);

export const getSupabaseSecretKey = (): string | null =>
  pick([
    process.env.SITE_SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_KEY,
  ]);
