const pick = (candidates: Array<string | undefined | null>): string | null => {
  for (const value of candidates) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

export class MissingEnvError extends Error {
  constructor(public readonly key: string, message?: string) {
    super(message ?? `Missing required environment variable: ${key}`);
    this.name = "MissingEnvError";
  }
}

export const getSupabaseUrl = (): string | null =>
  pick([
    Deno.env.get("SITE_SUPABASE_URL"),
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("NEXT_PUBLIC_SUPABASE_URL"),
  ]);

export const getSupabaseServiceRoleKey = (): string | null =>
  pick([
    Deno.env.get("SITE_SUPABASE_SECRET_KEY"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    Deno.env.get("SUPABASE_SECRET_KEY"),
    Deno.env.get("SUPABASE_SERVICE_KEY"),
  ]);

export const getSupabaseAnonKey = (): string | null =>
  pick([
    Deno.env.get("SITE_SUPABASE_PUBLISHABLE_KEY"),
    Deno.env.get("SITE_SUPABASE_ANON_KEY"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    Deno.env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  ]);

export const getRealtimeSigningSecret = (): string | null =>
  pick([Deno.env.get("REALTIME_SIGNING_SECRET"), Deno.env.get("SUPABASE_REALTIME_SECRET")]);

export const getSmsWebhookToken = (): string | null =>
  pick([Deno.env.get("SMS_WEBHOOK_TOKEN"), Deno.env.get("SMS_DIGEST_TOKEN")]);

export const getOpenAiApiKey = (): string | null =>
  pick([Deno.env.get("OPENAI_API_KEY"), Deno.env.get("OPENAI_SECRET_KEY")]);

export const requireEnv = (value: string | null, key: string): string => {
  if (!value) {
    throw new MissingEnvError(key);
  }
  return value;
};
