import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { dismissManualSms } from '@/services/admin/sms';
import type { ManualSmsResolution } from '@/types/admin-sms';

type RouteParams = {
  params: {
    smsId: string;
  };
};

const ALLOWED_RESOLUTIONS: ManualSmsResolution[] = ['ignore', 'linked_elsewhere', 'duplicate'];

export const POST = async (request: Request, { params }: RouteParams) => {
  const session = await requireAdmin(request, { permission: 'sms:attach' });
  if ('response' in session) {
    return session.response;
  }

  const smsId = params.smsId;
  if (!smsId) {
    return NextResponse.json({ message: 'smsId is required' }, { status: 400 });
  }

  let body: { resolution?: string; note?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
  }

  const resolution = body.resolution as ManualSmsResolution | undefined;
  if (!resolution || !ALLOWED_RESOLUTIONS.includes(resolution)) {
    return NextResponse.json({ message: 'Unsupported resolution' }, { status: 400 });
  }

  try {
    await dismissManualSms({
      smsId,
      resolution,
      note: body.note,
      adminUserId: session.context.user.id,
    });

    await writeAuditLog({
      adminId: session.context.user.id,
      action: 'sms.manual.dismiss',
      entityType: 'sms_raw',
      entityId: smsId,
      request,
      context: { resolution, note: body.note ?? null },
    });

    return NextResponse.json({ status: 'resolved' });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    if (error instanceof Error && error.message === 'sms_not_found') {
      return NextResponse.json({ message: 'SMS not found' }, { status: 404 });
    }
    console.error('admin.sms.manual_dismiss_failed', error);
    return NextResponse.json({ message: 'Failed to dismiss SMS' }, { status: 500 });
  }
};
