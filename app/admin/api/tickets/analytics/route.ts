import { NextResponse } from 'next/server';

import { ADMIN_PERMISSION_CODES } from '@/config/admin-rbac';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';

const configuredBackendBase = process.env.NEXT_PUBLIC_BACKEND_URL
  ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '')
  : null;

const localFallback =
  !configuredBackendBase && process.env.NODE_ENV !== 'production'
    ? 'http://localhost:5000/api'
    : null;

const resolveBackendBase = () => configuredBackendBase ?? localFallback;

export async function GET() {
  try {
    const session = await requireAdminSession([ADMIN_PERMISSION_CODES.TICKET_ORDER_VIEW]);
    const backendBase = resolveBackendBase();

    if (!backendBase) {
      return NextResponse.json({ error: 'admin_backend_unconfigured' }, { status: 503 });
    }

    const response = await fetch(`${backendBase}/admin/tickets/analytics`, {
      headers: {
        cookie: session.cookieHeader,
      },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ error: 'admin_forbidden' }, { status: response.status });
    }

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'tickets_analytics_backend_error', detail: message || null },
        { status: 502 },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to proxy ticket analytics request', error);
    return NextResponse.json({ error: 'tickets_analytics_proxy_error' }, { status: 500 });
  }
}

