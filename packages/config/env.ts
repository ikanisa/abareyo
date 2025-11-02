import { z } from "zod";

type NodeEnv = "development" | "test" | "production";

type ResolvedEnv = {
  raw: Record<string, string | undefined>;
};

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" })
    .optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: "NEXT_PUBLIC_SUPABASE_ANON_KEY must be provided" })
    .optional(),
  NEXT_PUBLIC_BACKEND_URL: z
    .string()
    .min(1)
    .optional()
    .transform((value) => (value ? normalizeBaseUrl(value) : value)),
});

const serverSchema = z
  .object({
    SITE_SUPABASE_URL: z
      .string()
      .url({ message: "SITE_SUPABASE_URL must be a valid URL" })
      .or(z.literal(""))
      .transform((value) => (value ? normalizeBaseUrl(value) : value))
      .optional(),
    SITE_SUPABASE_SECRET_KEY: z
      .string()
      .min(1, { message: "SITE_SUPABASE_SECRET_KEY must be provided" })
      .optional(),
    SITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
    SUPABASE_URL: z.string().url().optional(),
  })
  .transform((value) => ({
    ...value,
    SITE_SUPABASE_URL: value.SITE_SUPABASE_URL ?? undefined,
  }));

const runtimeSchema = z.object({
  NODE_ENV: z
    .string()
    .optional()
    .refine(
      (value): value is NodeEnv => !value || ["development", "test", "production"].includes(value),
      { message: "NODE_ENV must be development, test, or production" },
    ),
});

const loadEnv = (): ResolvedEnv => ({
  raw: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    SITE_SUPABASE_URL:
      process.env.SITE_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      undefined,
    SITE_SUPABASE_SECRET_KEY:
      process.env.SITE_SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_KEY ??
      undefined,
    SITE_SUPABASE_PUBLISHABLE_KEY:
      process.env.SITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SITE_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      undefined,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
});

const resolvedEnv = loadEnv();

const parsedClientEnv = clientSchema.safeParse(resolvedEnv.raw);
if (!parsedClientEnv.success) {
  throw new Error(
    `Invalid client environment configuration:\n${parsedClientEnv.error.issues
      .map((issue) => `  • ${issue.message}`)
      .join("\n")}`,
  );
}

const parsedServerEnv = serverSchema.safeParse(resolvedEnv.raw);
if (!parsedServerEnv.success) {
  throw new Error(
    `Invalid server environment configuration:\n${parsedServerEnv.error.issues
      .map((issue) => `  • ${issue.message}`)
      .join("\n")}`,
  );
}

const parsedRuntimeEnv = runtimeSchema.parse(resolvedEnv.raw);

const resolveServiceRoleKey = (data: z.infer<typeof serverSchema>): string | null =>
  data.SUPABASE_SERVICE_ROLE_KEY ?? data.SUPABASE_SERVICE_KEY ?? data.SITE_SUPABASE_SECRET_KEY ?? null;

const resolveAnonKey = (
  client: z.infer<typeof clientSchema>,
  server: z.infer<typeof serverSchema>,
): string | null => server.SITE_SUPABASE_PUBLISHABLE_KEY ?? client.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

const resolveUrl = (
  client: z.infer<typeof clientSchema>,
  server: z.infer<typeof serverSchema>,
): string | null => server.SITE_SUPABASE_URL ?? server.SUPABASE_URL ?? client.NEXT_PUBLIC_SUPABASE_URL ?? null;

const clientEnv = parsedClientEnv.data;

const serverEnv = {
  NODE_ENV: (parsedRuntimeEnv.NODE_ENV ?? "development") as NodeEnv,
  SITE_SUPABASE_URL: resolveUrl(parsedClientEnv.data, parsedServerEnv.data),
  SITE_SUPABASE_SECRET_KEY: parsedServerEnv.data.SITE_SUPABASE_SECRET_KEY ?? null,
  SITE_SUPABASE_PUBLISHABLE_KEY: parsedServerEnv.data.SITE_SUPABASE_PUBLISHABLE_KEY ?? null,
  SUPABASE_SERVICE_ROLE_KEY: resolveServiceRoleKey(parsedServerEnv.data),
  SUPABASE_URL: parsedServerEnv.data.SUPABASE_URL ?? null,
};

const runtimeEnv = parsedRuntimeEnv;

const supabaseClientConfig = Object.freeze({
  url: serverEnv.SITE_SUPABASE_URL,
  anonKey: resolveAnonKey(parsedClientEnv.data, parsedServerEnv.data),
  publishableKey: parsedServerEnv.data.SITE_SUPABASE_PUBLISHABLE_KEY ?? null,
});

const supabaseServerConfig = Object.freeze({
  url: supabaseClientConfig.url,
  serviceRoleKey: resolveServiceRoleKey(parsedServerEnv.data),
});

export type ClientEnv = typeof clientEnv;
export type ServerEnv = typeof serverEnv;
export type RuntimeEnv = typeof parsedRuntimeEnv;
export type SupabaseClientConfig = typeof supabaseClientConfig;
export type SupabaseServerConfig = typeof supabaseServerConfig;

export { clientEnv, resolveAnonKey, resolveUrl, runtimeEnv, serverEnv, supabaseClientConfig, supabaseServerConfig };
