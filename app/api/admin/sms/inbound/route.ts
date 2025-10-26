import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { fetchInboundSmsRecords } from '@/services/admin/sms';

const clampLimit = (value: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 50;
  }
  return Math.max(1, Math.min(200, value));
};

export const GET = async (request: Request) => {
  const session = await requireAdmin(request, { permission: 'sms:view' });
  if ('response' in session) {
    return session.response;
  }

  const url = new URL(request.url);
  const limit = clampLimit(Number(url.searchParams.get('limit')));

  try {
    const sms = await fetchInboundSmsRecords(limit);
    return NextResponse.json({ data: sms });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.sms.inbound_failed', error);
    return NextResponse.json({ message: 'Failed to load inbound SMS' }, { status: 500 });
  }
};
