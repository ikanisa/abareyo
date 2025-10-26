alter table if exists public.report_schedules
  add column if not exists next_run_at timestamptz,
  add column if not exists last_run_at timestamptz,
  add column if not exists last_delivered_at timestamptz,
  add column if not exists last_delivery_status text,
  add column if not exists last_delivery_error text,
  add column if not exists delivery_metadata jsonb default '{}'::jsonb;
