import { z } from "./schema.ts";

export const json = (body: unknown, init?: ResponseInit): Response => {
  const status = init?.status ?? 200;
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return new Response(JSON.stringify(body), {
    ...init,
    status,
    headers,
  });
};

export const jsonError = (message: string, status = 400, extra?: Record<string, unknown>) =>
  json({ error: message, ...(extra ?? {}) }, { status });

export const methodNotAllowed = (methods: string | string[]): Response => {
  const allowed = Array.isArray(methods) ? methods : [methods];
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allowed.join(", ") },
  });
};

export const requireMethod = (req: Request, methods: string | string[]): Response | null => {
  const allowed = Array.isArray(methods) ? methods : [methods];
  return allowed.includes(req.method) ? null : methodNotAllowed(allowed);
};

export const parseJsonBody = async <T>(req: Request): Promise<{ data: T | null; error: Response | null }> => {
  try {
    const data = (await req.json()) as T;
    return { data, error: null };
  } catch {
    return { data: null, error: jsonError("invalid_json", 400) };
  }
};

export const validateJsonBody = async <Schema extends z.ZodTypeAny>(
  req: Request,
  schema: Schema,
): Promise<{ data: z.infer<Schema> | null; error: Response | null }> => {
  const parsed = await parseJsonBody<unknown>(req);
  if (parsed.error) {
    return { data: null, error: parsed.error };
  }

  const result = schema.safeParse(parsed.data ?? {});
  if (!result.success) {
    return {
      data: null,
      error: jsonError("invalid_payload", 400, { issues: result.error.issues }),
    };
  }

  return { data: result.data, error: null };
};
