import { NextRequest, NextResponse } from 'next/server';

const ok = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(typeof data === 'string' ? { message: data } : data, init);

const unauthorized = () => new NextResponse('Unauthorized', { status: 401 });
const notFound = () => new NextResponse('Not found', { status: 404 });

// Very small in-memory store for e2e
let sessionId: string | null = null;

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
  if (!process.env.E2E_API_MOCKS) return notFound();
  const parts = params.path ?? [];
  const path = '/' + parts.join('/');

  // Simple auth guard for /admin/* endpoints
  const cookie = request.cookies.get(process.env.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? 'admin_session');

  const requireAuth = () => {
    if (!cookie || (sessionId && cookie.value !== sessionId)) return unauthorized();
    return null;
  };

  if (path === '/admin/me') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          displayName: 'System Admin',
          status: 'active',
          roles: ['SYSTEM_ADMIN'],
        },
        permissions: [
          'membership:plan:view',
          'membership:plan:update',
          'membership:member:view',
          'membership:member:update',
          'shop:order:view',
          'shop:order:update',
          'fundraising:project:view',
          'fundraising:project:update',
          'fundraising:donation:view',
          'fundraising:donation:update',
          'translation:view',
          'reports:view',
        ],
        session: { id: cookie?.value ?? 'sess', expiresAt: null },
      },
    });
  }

  // Membership
  if (path === '/admin/membership/plans') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: [
        { id: 'p1', name: 'Standard', slug: 'standard', price: 15000, perks: ['Early tickets'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'p2', name: 'Premium', slug: 'premium', price: 40000, perks: ['VIP'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
    });
  }
  if (path === '/admin/membership/members') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: [
        {
          id: 'm1',
          userId: 'u1',
          planId: 'p1',
          status: 'active',
          autoRenew: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { id: 'u1', email: 'user1@example.com', phoneMask: '+2507******12', locale: 'rw' },
          plan: { id: 'p1', name: 'Standard', slug: 'standard', price: 15000, perks: ['Early tickets'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        },
      ],
      meta: { page: 1, pageSize: 25, total: 1 },
    });
  }

  // Shop
  if (path === '/admin/shop/summary') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: {
        totalsByStatus: { pending: 1, ready: 0, fulfilled: 1 },
        totalRevenue: 25000,
        averageOrderValue: 25000,
        outstandingCount: 1,
        readyForPickupCount: 0,
        fulfilledCount: 1,
        range: { from: null, to: null },
      },
    });
  }
  if (path === '/admin/shop/orders') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: [
        {
          id: 'o1',
          status: 'pending',
          total: 25000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { id: 'u1', email: 'user1@example.com', phoneMask: '+2507******12' },
          items: [{ id: 'i1', qty: 1, price: 25000, product: { id: 'prod1', name: 'Home Jersey', price: 25000 } }],
          payments: [{ id: 'pay1', amount: 25000, status: 'pending', createdAt: new Date().toISOString() }],
        },
      ],
      meta: { page: 1, pageSize: 25, total: 1 },
    });
  }

  // Fundraising
  if (path === '/admin/fundraising/summary') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: {
        totalRaised: 12000000,
        pendingAmount: 1000000,
        activeProjects: 2,
        topProjects: [
          { id: 'fp1', title: 'Youth Academy Pitch', status: 'active', goal: 30000000, progress: 12000000, percent: 40 },
        ],
        dailySeries: [{ date: new Date().toISOString().slice(0, 10), value: 500000 }],
        range: { from: null, to: null },
      },
    });
  }
  if (path === '/admin/fundraising/projects') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: [
        { id: 'fp1', title: 'Youth Academy Pitch', goal: 30000000, progress: 12000000, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      meta: { page: 1, pageSize: 25, total: 1 },
    });
  }
  if (path === '/admin/fundraising/donations') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: [
        {
          id: 'd1',
          amount: 500000,
          status: 'pending',
          createdAt: new Date().toISOString(),
          user: { id: 'u1', email: 'user1@example.com', phoneMask: '+2507******12' },
          project: { id: 'fp1', title: 'Youth Academy Pitch' },
          payments: [{ id: 'pay2', amount: 500000, status: 'pending', createdAt: new Date().toISOString() }],
        },
      ],
      meta: { page: 1, pageSize: 25, total: 1 },
    });
  }

  // Translations (used by existing page)
  if (path === '/admin/translations/languages') {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({ data: ['en', 'rw'] });
  }
  if (path.startsWith('/admin/translations')) {
    const guard = requireAuth();
    if (guard) return guard;
    return ok({
      data: [
        { lang: 'en', key: 'cta.buy', value: 'Buy now', updatedAt: new Date().toISOString(), updatedBy: null },
      ],
      meta: { page: 1, pageSize: 50, total: 1 },
    });
  }

  return notFound();
}

export async function POST(request: NextRequest, { params }: { params: { path?: string[] } }) {
  if (!process.env.E2E_API_MOCKS) return notFound();
  const parts = params.path ?? [];
  const path = '/' + parts.join('/');

  if (path === '/admin/auth/login') {
    // Accept any email/password, set cookie
    sessionId = 'sess-' + Math.random().toString(36).slice(2);
    const cookieName = process.env.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? 'admin_session';
    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      `${cookieName}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60};`
    );
    return ok({ status: 'ok' }, { headers });
  }

  // No-op updates in mocks
  if (
    path.startsWith('/admin/membership/members/') ||
    path.startsWith('/admin/membership/plans') ||
    path.startsWith('/admin/fundraising/donations/') ||
    path.startsWith('/admin/fundraising/projects') ||
    path.startsWith('/admin/shop/orders')
  ) {
    return ok({ status: 'ok' });
  }

  return notFound();
}

