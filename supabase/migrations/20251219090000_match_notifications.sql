-- Match notification infrastructure for Expo and web push delivery

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  platform text not null check (platform in ('expo', 'web')),
  expo_token text unique,
  web_endpoint text unique,
  subscription jsonb,
  device_id text,
  build text,
  enabled boolean default true,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists notification_devices_expo_token_idx
  on public.notification_devices (expo_token) where expo_token is not null;
create unique index if not exists notification_devices_web_endpoint_idx
  on public.notification_devices (web_endpoint) where web_endpoint is not null;

alter table public.notification_devices enable row level security;
create policy if not exists p_notification_devices_select_owner on public.notification_devices
  for select using (auth.uid() = user_id);
create policy if not exists p_notification_devices_insert_owner on public.notification_devices
  for insert with check (auth.uid() = user_id);
create policy if not exists p_notification_devices_update_owner on public.notification_devices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists p_notification_devices_deny_anon on public.notification_devices
  for delete using (false) with check (false);

drop trigger if exists notification_devices_set_updated_at on public.notification_devices;
create trigger notification_devices_set_updated_at
  before update on public.notification_devices
  for each row execute procedure moddatetime(updated_at);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  event_type text not null check (event_type in ('kickoff', 'goal', 'full_time')),
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists match_events_match_id_created_at_idx
  on public.match_events (match_id, created_at);

alter table public.match_events enable row level security;
create policy if not exists p_match_events_service_only on public.match_events
  for all using (false) with check (false);

create table if not exists public.match_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.match_events(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  event_type text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'error', 'skipped')),
  created_at timestamptz default now(),
  processed_at timestamptz,
  error text
);

create index if not exists match_notification_jobs_status_idx
  on public.match_notification_jobs (status, created_at);

alter table public.match_notification_jobs enable row level security;
create policy if not exists p_match_notification_jobs_service_only on public.match_notification_jobs
  for all using (false) with check (false);

drop function if exists public.enqueue_match_notification();
create function public.enqueue_match_notification()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.match_notification_jobs (event_id, match_id, event_type, payload)
  values (new.id, new.match_id, new.event_type, coalesce(new.payload, '{}'::jsonb));
  return new;
end;
$$;

drop trigger if exists trg_match_events_enqueue on public.match_events;
create trigger trg_match_events_enqueue
  after insert on public.match_events
  for each row execute function public.enqueue_match_notification();
