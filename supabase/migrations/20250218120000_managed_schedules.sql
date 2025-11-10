-- Transition cleanup automation to the managed GitHub Actions scheduler.

create extension if not exists pg_cron;

do $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname in (
      'cleanup_sms_raw_daily',
      'cleanup_sms_parsed_daily',
      'cleanup_audit_logs_daily',
      'cleanup_admin_sessions_hourly'
    )
  loop
    perform cron.unschedule(job.jobid);
  end loop;
exception
  when undefined_table then
    -- pg_cron not installed yet; nothing to unschedule.
    null;
end;
$$;

create table if not exists public.job_run_audit (
  id bigserial primary key,
  job_name text not null,
  environment text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  ran_at timestamptz not null default timezone('utc', now())
);

comment on table public.job_run_audit is 'Audit log of managed job executions recorded by GitHub Actions runners.';
comment on column public.job_run_audit.job_name is 'Identifier for the scheduled job (matches GitHub Actions step names).';
comment on column public.job_run_audit.environment is 'Deployment environment the job targeted (production, staging, etc.).';
comment on column public.job_run_audit.status is 'Outcome of the job execution (ok/failed/skipped).';
comment on column public.job_run_audit.detail is 'JSON payload with job-specific metadata such as rows affected or error messages.';
comment on column public.job_run_audit.ran_at is 'Timestamp (UTC) when the job finished executing.';

create index if not exists job_run_audit_job_name_ran_at_idx on public.job_run_audit (job_name, ran_at desc);

grant select on public.job_run_audit to authenticated;

drop view if exists public.data_retention_windows;
create or replace view public.data_retention_windows as
select 'sms_raw'::text as dataset, interval '90 days' as retention_period, 'Managed schedule job cleanup_sms_raw_daily'::text as enforcement_mechanism
union all
select 'sms_parsed', interval '180 days', 'Managed schedule job cleanup_sms_parsed_daily'
union all
select 'audit_logs', interval '400 days', 'Managed schedule job cleanup_audit_logs_daily'
union all
select 'admin_sessions', interval '36 hours', 'Managed schedule job cleanup_admin_sessions_hourly';

grant select on public.data_retention_windows to authenticated;
