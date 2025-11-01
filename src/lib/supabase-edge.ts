import { getSupabasePublishableKey, getSupabaseUrl } from '@/integrations/supabase/env';

const resolveFunctionsBaseUrl = (): string | null => {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    return null;
  }

  try {
    const parsed = new URL(supabaseUrl);
    const { protocol, hostname, port } = parsed;

    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      const origin = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
      return `${origin}/functions/v1`;
    }

    const functionHost = hostname.replace('.supabase.co', '.functions.supabase.co');
    return `${protocol}//${functionHost}`;
  } catch (error) {
    console.warn('[supabase-edge] Failed to parse Supabase URL', error);
    return null;
  }
};

const functionsBaseUrl = resolveFunctionsBaseUrl();

export const invokeSupabaseFunction = async <T = unknown>(
  functionName: string,
  init?: RequestInit & { searchParams?: Record<string, string | number | undefined> },
): Promise<T | null> => {
  if (!functionsBaseUrl) {
    return null;
  }

  const params = new URLSearchParams();
  const extra = init?.searchParams ?? {};
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }

  const publishableKey = getSupabasePublishableKey();
  const headers = new Headers(init?.headers);
  if (publishableKey && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${publishableKey}`);
  }

  const target = `${functionsBaseUrl.replace(/\/$/, '')}/${functionName}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(target, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Supabase function ${functionName} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};
