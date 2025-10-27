import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { retryManualSms } from '@/services/admin/sms';

type RouteParams = {
  params: {
    smsId: string;
  };
};

export const POST = async (request: Request, { params }: RouteParams) => {
  const session = await requireAdmin(request, { permission: 'sms:retry' });
  if ('response' in session) {
    return session.response;
  }

  const smsId = params.smsId;
  if (!smsId) {
    return NextResponse.json({ message: 'smsId is required' }, { status: 400 });
  }

  try {
    await retryManualSms(smsId);
    await writeAuditLog({
      adminId: session.context.user.id,
      action: 'sms.manual.retry',
      entityType: 'sms_raw',
      entityId: smsId,
      request,
    });
    return NextResponse.json({ status: 'queued' });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    if (error instanceof Error && error.message === 'sms_not_found') {
      return NextResponse.json({ message: 'SMS not found' }, { status: 404 });
    }
    console.error('admin.sms.manual_retry_failed', error);
    return NextResponse.json({ message: 'Failed to retry SMS' }, { status: 500 });
  }
};
