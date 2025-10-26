import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { fetchSmsQueueOverview } from '@/services/admin/sms';

export const GET = async (request: Request) => {
  const session = await requireAdmin(request, { permission: 'sms:attach' });
  if ('response' in session) {
    return session.response;
  }

  try {
    const overview = await fetchSmsQueueOverview();
    return NextResponse.json({ data: overview });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.sms.queue_overview_failed', error);
    return NextResponse.json({ message: 'Failed to load SMS queue overview' }, { status: 500 });
  }
};
