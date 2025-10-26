-- Data retention and TTL automation for compliance

-- Ensure cron extension for scheduled cleanup jobs.
create extension if not exists pg_cron;

-- Helper function to register cron jobs idempotently.
create or replace function public.ensure_cron_job(job_name text, schedule text, command text)
returns void
language plpgsql
as $$
declare
  existing integer;
begin
  select jobid into existing from cron.job where jobname = job_name;
  if existing is not null then
    perform cron.unschedule(existing);
  end if;
  perform cron.schedule(job_name, schedule, command);
end;
$$;

comment on function public.ensure_cron_job is 'Idempotent helper that (re)schedules pg_cron jobs used for retention policies.';

-- Cleanup functions -------------------------------------------------------

create or replace function public.cleanup_sms_raw()
returns bigint
language plpgsql
as $$
declare
  deleted_count bigint;
begin
  delete from public.sms_raw
  where received_at < now() - interval '90 days';

  get diagnostics deleted_count = row_count;

  return coalesce(deleted_count, 0);
end;
$$;

comment on function public.cleanup_sms_raw is 'Deletes inbound SMS rows older than 90 days once archived to S3.';

create or replace function public.cleanup_sms_parsed()
returns bigint
language plpgsql
as $$
declare
  deleted_count bigint;
begin
  delete from public.sms_parsed
  where created_at < now() - interval '180 days';

  get diagnostics deleted_count = row_count;

  return coalesce(deleted_count, 0);
end;
$$;

comment on function public.cleanup_sms_parsed is 'Removes structured SMS parses after 180 days (raw record persists for 90 days).';

create or replace function public.cleanup_audit_logs()
returns bigint
language plpgsql
as $$
declare
  deleted_count bigint;
begin
  delete from public.audit_logs
  where created_at < now() - interval '400 days';

  get diagnostics deleted_count = row_count;

  return coalesce(deleted_count, 0);
end;
$$;

comment on function public.cleanup_audit_logs is 'Truncates audit log entries after ~13 months to satisfy privacy retention rules.';

create or replace function public.cleanup_admin_sessions()
returns bigint
language plpgsql
as $$
declare
  deleted_count bigint;
begin
  delete from public.admin_sessions
  where coalesce(expires_at, created_at + interval '36 hours') < now() - interval '1 day'
     or revoked = true;

  get diagnostics deleted_count = row_count;

  return coalesce(deleted_count, 0);
end;
$$;

comment on function public.cleanup_admin_sessions is 'Removes expired or revoked admin sessions to limit credential sprawl.';

-- Schedule the cleanup jobs (run nightly in Kigali TZ / UTC+2 ~ 01:30 UTC)
select public.ensure_cron_job(
  'cleanup_sms_raw_daily',
  '30 23 * * *',
  $$select public.cleanup_sms_raw();$$
);

select public.ensure_cron_job(
  'cleanup_sms_parsed_daily',
  '35 23 * * *',
  $$select public.cleanup_sms_parsed();$$
);

select public.ensure_cron_job(
  'cleanup_audit_logs_daily',
  '40 23 * * *',
  $$select public.cleanup_audit_logs();$$
);

select public.ensure_cron_job(
  'cleanup_admin_sessions_hourly',
  '15 * * * *',
  $$select public.cleanup_admin_sessions();$$
);

-- Surface retention metadata for observability dashboards.
create or replace view public.data_retention_windows as
select 'sms_raw'::text as dataset, interval '90 days' as retention_period, 'cron job cleanup_sms_raw_daily'::text as enforcement_mechanism
union all
select 'sms_parsed', interval '180 days', 'cron job cleanup_sms_parsed_daily'
union all
select 'audit_logs', interval '400 days', 'cron job cleanup_audit_logs_daily'
union all
select 'admin_sessions', interval '36 hours', 'cron job cleanup_admin_sessions_hourly';

grant select on public.data_retention_windows to authenticated;
