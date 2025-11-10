import { createWriteStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';

import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';

import type { Database } from '@/integrations/supabase/types';
import { setupNodeObservability } from '@/lib/observability/node-observability';
import { resolveSentryConfiguration } from '@/lib/observability/sentry-config';

type RetentionTask = {
  id: string;
  rpc: keyof Database['public']['Functions'];
  description: string;
};

type TaskResult = {
  task: RetentionTask;
  status: 'ok' | 'skipped' | 'failed';
  rowsAffected?: number | null;
  error?: string;
};

const SUPABASE_URL =
  process.env.SITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SITE_SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Supabase URL and service role key must be configured for the data retention runner');
}

setupNodeObservability('data-retention-runner');

const { dsn, environment } = resolveSentryConfiguration('server');
if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: 0,
    sampleRate: 1,
  });
  Sentry.setTag('job', 'data-retention');
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const RETENTION_TASKS: RetentionTask[] = [
  {
    id: 'cleanup_sms_raw_daily',
    rpc: 'cleanup_sms_raw',
    description: 'Purge inbound SMS rows older than 90 days',
  },
  {
    id: 'cleanup_sms_parsed_daily',
    rpc: 'cleanup_sms_parsed',
    description: 'Remove parsed SMS payloads after 180 days',
  },
  {
    id: 'cleanup_audit_logs_daily',
    rpc: 'cleanup_audit_logs',
    description: 'Trim audit trail records past the 13-month retention window',
  },
  {
    id: 'cleanup_admin_sessions_hourly',
    rpc: 'cleanup_admin_sessions',
    description: 'Expire revoked or stale admin sessions',
  },
];

const getStepSummary = () => process.env.GITHUB_STEP_SUMMARY ?? '';

const appendStepSummary = async (results: TaskResult[]) => {
  const summaryPath = getStepSummary();
  if (!summaryPath) {
    return;
  }

  const lines = [
    '| Task | Status | Rows deleted | Details |',
    '| --- | --- | --- | --- |',
    ...results.map((result) => {
      const status = result.status === 'ok' ? '✅ Success' : result.status === 'skipped' ? '⚪️ Skipped' : '❌ Failed';
      const rows = result.rowsAffected ?? '—';
      const details = result.error ?? result.task.description;
      return `| ${result.task.id} | ${status} | ${rows} | ${details} |`;
    }),
  ];

  try {
    await appendFile(summaryPath, `${lines.join('\n')}\n`, { encoding: 'utf8' });
  } catch (error) {
    // Fallback for older runners that do not expose appendFile with the desired flags.
    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(summaryPath, { flags: 'a', encoding: 'utf8' });
      stream.once('error', reject);
      stream.once('finish', resolve);
      stream.end(`${lines.join('\n')}\n`);
    });
  }
};

const recordAuditLog = async (results: TaskResult[]) => {
  const entries = results.map((result) => ({
    job_name: result.task.id,
    environment: environment ?? process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ?? process.env.NODE_ENV ?? 'development',
    status: result.status,
    detail: {
      description: result.task.description,
      rowsAffected: result.rowsAffected ?? null,
      error: result.error ?? null,
    },
  }));

  await supabase.from('job_run_audit').insert(entries);
};

const runTask = async (task: RetentionTask): Promise<TaskResult> => {
  try {
    const { data, error } = await supabase.rpc(task.rpc);
    if (error) {
      throw error;
    }

    const rows = typeof data === 'number' ? data : Number(data ?? 0);
    console.info('job.retention.success', { job: task.id, rows });
    return { task, status: 'ok', rowsAffected: Number.isFinite(rows) ? rows : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('job.retention.failure', { job: task.id, error: message });
    if (dsn) {
      Sentry.captureException(error, {
        contexts: {
          job: {
            id: task.id,
            description: task.description,
          },
        },
        level: 'error',
      });
    }
    return { task, status: 'failed', error: message };
  }
};

const main = async () => {
  console.info('job.retention.start', {
    tasks: RETENTION_TASKS.map((task) => task.id),
    environment,
  });

  const results: TaskResult[] = [];
  for (const task of RETENTION_TASKS) {
    const result = await runTask(task);
    results.push(result);
  }

  try {
    await recordAuditLog(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('job.retention.audit.failure', { error: message });
    if (dsn) {
      Sentry.captureException(error, {
        contexts: {
          job: { id: 'job_run_audit' },
        },
        level: 'warning',
      });
    }
  }

  await appendStepSummary(results);

  const failed = results.filter((result) => result.status === 'failed');
  if (failed.length > 0) {
    throw new Error(`Data retention job failed for ${failed.length} task(s)`);
  }

  console.info('job.retention.complete', { tasks: results.length });
};

void main()
  .catch(async (error) => {
    console.error('job.retention.unhandled', { error: error instanceof Error ? error.message : String(error) });
    if (dsn) {
      Sentry.captureException(error);
      await Sentry.close(2000);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dsn) {
      await Sentry.close(2000);
    }
  });
