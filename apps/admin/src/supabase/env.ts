const getEnv = (key: string) => process.env[key];

export const getSupabaseUrl = () =>
  getEnv("NEXT_PUBLIC_SUPABASE_URL") ??
  getEnv("SUPABASE_URL") ??
  getEnv("SITE_SUPABASE_URL") ??
  "";

export const getSupabaseAnonKey = () =>
  getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
  getEnv("SUPABASE_ANON_KEY") ??
  getEnv("SUPABASE_PUBLISHABLE_KEY") ??
  getEnv("SITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";

export const getSupabaseServiceRoleKey = () =>
  getEnv("SUPABASE_SERVICE_ROLE_KEY") ??
  getEnv("SUPABASE_SERVICE_ROLE") ??
  getEnv("SITE_SUPABASE_SERVICE_ROLE_KEY") ??
  "";
