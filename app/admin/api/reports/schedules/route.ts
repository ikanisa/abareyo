import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';
import type { Json } from '@/integrations/supabase/types';
import { computeInitialRun, InvalidCronExpressionError } from '@/lib/reports/scheduler';

type SchedulePayload = {
  name: string;
  cron: string;
  destination: string;
  payload?: Json;
  dispatch?: boolean;
};

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.reports']);
    return await withAdminServiceClient(async (supabase) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .select(
          'id, name, cron, destination, payload, created_at, created_by, next_run_at, last_run_at, last_delivered_at, last_delivery_status, last_delivery_error, delivery_metadata',
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      adminLogger.info('reports.schedules.list', { admin: session.user.id, count: data?.length ?? 0 });
      return respond({ schedules: data ?? [] });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('reports.schedules.list_failed', { error: (error as Error).message });
    return respondWithError('reports_fetch_failed', 'Unable to load schedules', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.reports']);
    const payload = (await request.json()) as SchedulePayload;

    if (!payload?.name || !payload.cron || !payload.destination) {
      return respondWithError('schedule_payload_invalid', 'Name, cron, and destination are required', 400);
    }

    let nextRunAt: Date;
    try {
      nextRunAt = computeInitialRun(payload.cron, Boolean(payload.dispatch));
    } catch (error) {
      if (error instanceof InvalidCronExpressionError) {
        return respondWithError('schedule_cron_invalid', error.message, 400);
      }
      throw error;
    }

    return await withAdminServiceClient(async (supabase) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .insert({
          name: payload.name,
          cron: payload.cron,
          destination: payload.destination,
          payload: payload.payload ?? {},
          created_by: session.user.id,
          next_run_at: nextRunAt.toISOString(),
          last_delivery_status: payload.dispatch ? 'queued' : 'scheduled',
        })
        .select(
          'id, name, cron, destination, payload, created_at, next_run_at, last_run_at, last_delivered_at, last_delivery_status, last_delivery_error, delivery_metadata',
        )
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
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('reports.schedules.create_failed', { error: (error as Error).message });
    return respondWithError('report_schedule_failed', 'Unable to create schedule', 500);
  }
}
