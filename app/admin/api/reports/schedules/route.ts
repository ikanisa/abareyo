import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.reports']);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('report_schedules')
      .select('id, name, cron, destination, payload, created_at, created_by')
      .order('created_at', { ascending: false });

    if (error) throw error;

    adminLogger.info('reports.schedules.list', { admin: session.user.id, count: data?.length ?? 0 });
    return respond({ schedules: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('reports.schedules.list_failed', { error: (error as Error).message });
    return respondWithError('reports_fetch_failed', 'Unable to load schedules', 500);
  }
}

type SchedulePayload = {
  name: string;
  cron: string;
  destination: string;
  payload?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.reports']);
    const payload = (await request.json()) as SchedulePayload;

    if (!payload?.name || !payload.cron || !payload.destination) {
      return respondWithError('schedule_payload_invalid', 'Name, cron, and destination are required', 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('report_schedules')
      .insert({
        name: payload.name,
        cron: payload.cron,
        destination: payload.destination,
        payload: payload.payload ?? {},
        created_by: session.user.id,
      })
      .select('id, name, cron, destination, payload, created_at')
      .single();

    if (error) throw error;

    await recordAudit(supabase, {
      action: 'reports.schedule.create',
      entityType: 'report_schedule',
      entityId: data.id,
      before: null,
      after: data,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    adminLogger.info('reports.schedules.created', { admin: session.user.id, schedule: data.id });
    return respond({ schedule: data }, 201);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('reports.schedules.create_failed', { error: (error as Error).message });
    return respondWithError('report_schedule_failed', 'Unable to create schedule', 500);
  }
}
