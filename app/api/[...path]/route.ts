import { NextRequest } from 'next/server';

const BACKEND_BASE = (process.env.BACKEND_BASE_URL || '').replace(/\/$/, '');

async function proxy(req: NextRequest, ctx: { params: { path?: string[] } }) {
  if (!BACKEND_BASE) {
    return new Response(
      'Backend not configured. Set BACKEND_BASE_URL in Vercel to your API base (e.g., https://api.example.com).',
      { status: 503 }
    );
  }

  const segments = (ctx.params.path || []).join('/');
  const url = new URL(req.url);
  const target = `${BACKEND_BASE}/api/${segments}${url.search}`;

  const init: RequestInit = {
    method: req.method,
    // Pass through headers except host
    headers: new Headers(
      Array.from(req.headers.entries()).filter(([k]) => k.toLowerCase() !== 'host')
    ),
    // Only include body for non-GET/HEAD
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    redirect: 'manual',
  };

  try {
    const resp = await fetch(target, init);
    const headers = new Headers(resp.headers);
    // Remove hop-by-hop headers that can cause issues
    headers.delete('transfer-encoding');
    headers.delete('content-encoding');
    headers.delete('content-length');
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return new Response(`Upstream error: ${message}`, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

