import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { fetchRealtimeMonitorSnapshot } from '@/services/admin/realtime';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';

export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => {
  const session = await requireAdmin(request);
  if ('response' in session) {
    return session.response;
  }

  try {
    const snapshot = await fetchRealtimeMonitorSnapshot();
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.realtime.health_failed', error);
    return NextResponse.json({ message: 'Failed to load realtime health' }, { status: 500 });
  }
};
