import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = (process.env.BACKEND_BASE_URL || '').replace(/\/$/, '');

type MockContext = { params: { path?: string[] } };

const paginatedSkeleton = {
  page: 1,
  pageSize: 50,
  total: 0,
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

async function mockResponse(req: NextRequest, ctx: MockContext) {
  const segments = ctx.params.path ?? [];
  const path = segments.join('/');
  const method = req.method.toUpperCase();

  // Sample data used across responses
  const sampleProject = {
    id: 'demo-project',
    title: 'Stadium Upgrade Fund',
    description: 'Help Rayon Sports renovate the home stands.',
    goal: 50000000,
    progress: 12500000,
    status: 'active',
    coverImage: null,
    coverImageUrl: null,
  };

  const sampleMatch = {
    id: 'match-demo',
    opponent: 'APR FC',
    kickoff: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    venue: 'Kigali Stadium',
    competition: 'Rwanda Premier League',
    status: 'scheduled',
    score: null,
  };

  switch (method) {
    case 'GET': {
      if (path === 'fundraising/projects') {
        return json({ data: [sampleProject] });
      }

      if (path === 'tickets/catalog') {
        return json({
          data: [
            {
              ...sampleMatch,
              zones: [
                { zone: 'VIP', price: 15000, capacity: 500, remaining: 420, gate: 'A' },
                { zone: 'REGULAR', price: 5000, capacity: 4000, remaining: 3510, gate: 'C' },
              ],
            },
          ],
        });
      }

      if (path === 'matches/summaries') {
        return json({ data: [sampleMatch] });
      }

      if (path === 'tickets/analytics') {
        return json({
          data: {
            totals: {
              revenue: 12500000,
              orders: 420,
              paid: 320,
              pending: 80,
              cancelled: 20,
              expired: 0,
              averageOrderValue: 29762,
            },
            matchBreakdown: [],
            recentSales: [],
            paymentStatus: [],
          },
        });
      }

      if (path === 'tickets/gate/history') {
        return json({ data: [] });
      }

      if (path === 'fundraising/donations') {
        return json({ data: [], meta: paginatedSkeleton });
      }

      if (path.startsWith('admin/')) {
        return json({ data: [], meta: paginatedSkeleton });
      }

      if (segments[0] === 'health') {
        return json({ status: 'ok', source: 'mock' });
      }

      return json({ data: [] });
    }

    case 'POST': {
      if (path === 'fundraising/donate') {
        const payload = await req.json().catch(() => ({}));
        return json({
          data: {
            donationId: 'demo-donation',
            paymentId: 'demo-payment',
            amount: payload?.amount ?? 10000,
            ussdCode: '*182*8*1#',
            expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            project: sampleProject,
          },
        });
      }

      if (path === 'tickets/checkout') {
        return json({
          data: {
            orderId: 'order-demo',
            total: 10000,
            ussdCode: '*182*8*1#',
            expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            paymentId: 'payment-demo',
          },
        });
      }

      if (path === 'tickets/verify-pass') {
        return json({
          data: { status: 'verified', passId: 'pass-demo', orderId: 'order-demo', zone: 'VIP' },
        });
      }

      if (path === 'tickets/passes/initiate-transfer') {
        return json({
          data: { transferCode: '123456', passId: 'pass-demo', targetUserId: null },
        });
      }

      if (path === 'tickets/passes/claim-transfer') {
        return json({ data: { passId: 'pass-demo', recipientUserId: 'user-demo' } });
      }

      if (path === 'wallet/transactions') {
        return json({ data: { acknowledged: true } });
      }

      return json({ data: { ok: true } });
    }

    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return json({ data: { ok: true } });

    default:
      return new Response('Method not supported in mock backend.', { status: 405 });
  }
}

async function proxy(req: NextRequest, ctx: MockContext) {
  if (!BACKEND_BASE) {
    return mockResponse(req, ctx);
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
