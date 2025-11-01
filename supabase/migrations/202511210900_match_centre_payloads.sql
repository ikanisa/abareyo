-- Match centre payloads for timeline/stats/lineups served via edge function
create table if not exists public.match_centre_payloads (
  match_id uuid primary key references public.matches(id) on delete cascade,
  live_minute text,
  score_home int,
  score_away int,
  badge text,
  broadcast text,
  timeline jsonb default '[]'::jsonb,
  stats jsonb default '[]'::jsonb,
  lineups jsonb default '{}'::jsonb,
  chat jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists match_centre_payloads_updated_idx on public.match_centre_payloads using brin (updated_at);

create or replace function public.set_match_centre_payloads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_match_centre_payloads_updated
  before update on public.match_centre_payloads
  for each row
  execute function public.set_match_centre_payloads_updated_at();

alter table public.match_centre_payloads enable row level security;

do $$
begin
  if to_regclass('public.match_centre_payloads') is not null then
    execute 'drop policy if exists p_match_centre_payloads_public_select on public.match_centre_payloads';
    execute 'create policy p_match_centre_payloads_public_select on public.match_centre_payloads for select using (true)';
  end if;
end;
$$;
