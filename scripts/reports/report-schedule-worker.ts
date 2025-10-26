/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '@/integrations/supabase/types';
import { computeNextRun } from '@/lib/reports/scheduler';

const SUPABASE_URL =
  process.env.SITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SITE_SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Supabase URL and service role key must be configured for the report worker');
}

const REPORTS_BUCKET = process.env.REPORTS_STORAGE_BUCKET ?? 'report-exports';
const POLL_INTERVAL_MS = Number(process.env.REPORT_WORKER_INTERVAL_MS ?? '60000');
const SIGNED_URL_TTL_SECONDS = Number(process.env.REPORT_SIGNED_URL_TTL ?? '86400');

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const schedulePayloadSchema = z
  .object({
    type: z.enum(['fundraising.donations']).default('fundraising.donations'),
    params: z
      .object({
        status: z.string().optional(),
      })
      .catch({})
      .optional(),
  })
  .catch({ type: 'fundraising.donations' as const });

type ScheduleRow = Database['public']['Tables']['report_schedules']['Row'];

type ReportPayload = z.infer<typeof schedulePayloadSchema>;

type DestinationType = 'webhook' | 'email' | 'unknown';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let bucketEnsured = false;

const ensureBucket = async () => {
  if (bucketEnsured) return;
  const { data, error } = await supabase.storage.getBucket(REPORTS_BUCKET);
  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(REPORTS_BUCKET, {
      public: false,
    });
    if (createError) {
      throw createError;
    }
  }
  bucketEnsured = true;
};

const resolveDestinationType = (destination: string): DestinationType => {
  if (/^https?:\/\//i.test(destination)) {
    return 'webhook';
  }
  if (destination.includes('@')) {
    return 'email';
  }
  return 'unknown';
};

const buildCsv = async (payload: ReportPayload) => {
  switch (payload.type) {
    case 'fundraising.donations':
      return buildFundraisingDonationsCsv(payload.params ?? {});
    default:
      throw new Error(`Unsupported report payload type: ${payload.type}`);
  }
};

const buildFundraisingDonationsCsv = async (params: ReportPayload['params'] = {}) => {
  const query = supabase.from('fund_donations').select('id, amount, status, user_id');
  if (params?.status) {
    query.eq('status', params.status);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  const rows = data ?? [];
  const header = ['id', 'user_id', 'amount', 'status'];
  const lines = rows.map((row) => [row.id, row.user_id ?? '', String(row.amount ?? 0), row.status ?? '']);
  return {
    csv: [header.join(','), ...lines.map((line) => line.join(','))].join('\n'),
    rows: rows.length,
  };
};

const uploadReport = async (schedule: ScheduleRow, csv: string) => {
  await ensureBucket();
  const storage = supabase.storage.from(REPORTS_BUCKET);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${schedule.id}/${timestamp}.csv`;
  const { error: uploadError } = await storage.upload(path, csv, {
    contentType: 'text/csv',
    upsert: true,
  });
  if (uploadError) {
    throw uploadError;
  }
  const { data: signedData, error: signedError } = await storage.createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signedError) {
    throw signedError;
  }
  return {
    path,
    signedUrl: signedData?.signedUrl ?? null,
    signedUrlExpiresAt:
      signedData?.expiration ? new Date(signedData.expiration * 1000).toISOString() : null,
  };
};

const dispatchToDestination = async (
  schedule: ScheduleRow,
  destinationType: DestinationType,
  artifact: { signedUrl: string | null; path: string; signedUrlExpiresAt: string | null },
  rows: number,
) => {
  if (destinationType === 'webhook' && artifact.signedUrl) {
    const response = await fetch(schedule.destination, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scheduleId: schedule.id,
        name: schedule.name,
        generatedAt: new Date().toISOString(),
        csvUrl: artifact.signedUrl,
        csvExpiresAt: artifact.signedUrlExpiresAt,
        rows,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Webhook delivery failed (${response.status}): ${text}`);
    }
    return { webhookStatus: response.status };
  }

  if (destinationType === 'email') {
    return { note: 'Email delivery pending manual send. Share the signed URL with the recipient.' };
  }

  return { note: 'No automated delivery attempted for this destination.' };
};

const processSchedule = async (schedule: ScheduleRow) => {
  const startedAt = new Date();
  await supabase
    .from('report_schedules')
    .update({
      last_delivery_status: 'running',
      last_run_at: startedAt.toISOString(),
      last_delivery_error: null,
    })
    .eq('id', schedule.id);

  let metadata: Record<string, unknown> = {
    startedAt: startedAt.toISOString(),
  };

  try {
    const payload = schedulePayloadSchema.parse(schedule.payload ?? {});
    const { csv, rows } = await buildCsv(payload);
    const artifact = await uploadReport(schedule, csv);
    metadata = {
      ...metadata,
      rows,
      storagePath: artifact.path,
      signedUrl: artifact.signedUrl,
      signedUrlExpiresAt: artifact.signedUrlExpiresAt,
    };
    const destinationType = resolveDestinationType(schedule.destination.trim());
    const delivery = await dispatchToDestination(schedule, destinationType, artifact, rows);
    metadata = {
      ...metadata,
      destinationType,
      delivery,
    };
    const completedAt = new Date();
    const nextRun = computeNextRun(schedule.cron, completedAt).toISOString();
    await supabase
      .from('report_schedules')
      .update({
        next_run_at: nextRun,
        last_delivered_at: completedAt.toISOString(),
        last_delivery_status: 'delivered',
        last_delivery_error: null,
        delivery_metadata: metadata as unknown as Database['public']['Tables']['report_schedules']['Update']['delivery_metadata'],
      })
      .eq('id', schedule.id);
    console.info('report.schedule.delivered', {
      schedule: schedule.id,
      rows,
      destinationType,
      nextRun,
    });
  } catch (error) {
    const failedAt = new Date();
    let nextRun: string | null = null;
    try {
      nextRun = computeNextRun(schedule.cron, failedAt).toISOString();
    } catch (nextError) {
      console.error('report.schedule.nextRun_failed', { schedule: schedule.id, error: (nextError as Error).message });
    }
    metadata = {
      ...metadata,
      error: error instanceof Error ? error.message : String(error),
      failedAt: failedAt.toISOString(),
    };
    await supabase
      .from('report_schedules')
      .update({
        next_run_at: nextRun,
        last_delivery_status: 'failed',
        last_delivery_error: error instanceof Error ? error.message : String(error),
        delivery_metadata: metadata as unknown as Database['public']['Tables']['report_schedules']['Update']['delivery_metadata'],
      })
      .eq('id', schedule.id);
    console.error('report.schedule.failed', {
      schedule: schedule.id,
      error: error instanceof Error ? error.message : error,
    });
  }
};

const poll = async () => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('report_schedules')
    .select('*')
    .lte('next_run_at', now)
    .order('next_run_at', { ascending: true })
    .limit(10);
  if (error) {
    throw error;
  }
  const schedules = data ?? [];
  for (const schedule of schedules) {
    await processSchedule(schedule);
  }
};

let running = true;

const shutdown = async () => {
  running = false;
};

process.on('SIGINT', () => {
  console.info('report.worker.shutdown', { signal: 'SIGINT' });
  void shutdown();
});
process.on('SIGTERM', () => {
  console.info('report.worker.shutdown', { signal: 'SIGTERM' });
  void shutdown();
});

const main = async () => {
  console.info('report.worker.start', { bucket: REPORTS_BUCKET, pollIntervalMs: POLL_INTERVAL_MS });
  await ensureBucket();
  while (running) {
    const started = Date.now();
    try {
      await poll();
    } catch (error) {
      console.error('report.worker.poll_failed', { error: error instanceof Error ? error.message : error });
    }
    if (POLL_INTERVAL_MS <= 0) {
      break;
    }
    const elapsed = Date.now() - started;
    const delay = Math.max(POLL_INTERVAL_MS - elapsed, 0);
    if (!running) break;
    if (delay > 0) {
      await sleep(delay);
    }
  }
  console.info('report.worker.stop');
};

void main();
