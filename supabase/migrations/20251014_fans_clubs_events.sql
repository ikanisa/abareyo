set search_path = public;

-- Fan club membership roles reused across events and admin workflows.
create type if not exists fan_club_member_role as enum ('member', 'moderator', 'admin');

create table if not exists fan_club_members (
  fan_club_id uuid not null references public.fan_clubs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role fan_club_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  invited_by uuid references public.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  primary key (fan_club_id, user_id)
);

comment on table fan_club_members is 'Membership roster for fan clubs. User-scoped rows only visible to self/club admins.';
comment on column fan_club_members.metadata is 'Optional structured payload for onboarding context (invitation code, notes).';

create type if not exists fan_club_event_visibility as enum ('public', 'members');
create type if not exists fan_club_event_status as enum ('draft', 'scheduled', 'cancelled', 'completed');

create table if not exists fan_club_events (
  id uuid primary key default gen_random_uuid(),
  fan_club_id uuid not null references public.fan_clubs(id) on delete cascade,
  organizer_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  visibility fan_club_event_visibility not null default 'public',
  status fan_club_event_status not null default 'draft',
  capacity int,
  location jsonb default '{}'::jsonb,
  cover_image text,
  tags text[] default array[]::text[],
  requires_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table fan_club_events is 'Scheduled programming owned by fan clubs (watch parties, community drives, etc.).';
comment on column fan_club_events.location is 'Structured location payload (name, lat/long, directions).';

create or replace function set_fan_club_events_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_fan_club_events_updated_at
before update on fan_club_events
for each row execute procedure set_fan_club_events_updated_at();

create table if not exists fan_club_event_registrations (
  event_id uuid not null references public.fan_club_events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rsvp_status text not null default 'registered' check (rsvp_status in ('registered', 'waitlisted', 'cancelled', 'attended')),
  rsvp_note text,
  responded_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

comment on table fan_club_event_registrations is 'RSVP ledger for fan club events. Rows exposed only to event staff and registrant.';

create index if not exists idx_fan_club_members_user on fan_club_members(user_id);
create index if not exists idx_fan_club_events_fan_club on fan_club_events(fan_club_id);
create index if not exists idx_fan_club_events_start_at on fan_club_events(start_at desc);
create index if not exists idx_fan_club_event_registrations_user on fan_club_event_registrations(user_id);

-- Row-Level Security hardening.
alter table fan_club_members enable row level security;
alter table fan_club_members force row level security;

alter table fan_club_events enable row level security;
alter table fan_club_events force row level security;

alter table fan_club_event_registrations enable row level security;
alter table fan_club_event_registrations force row level security;

-- Service role retains unrestricted access for automation.
do $$
begin
  perform 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'fan_club_members'
    and policyname = 'p_fan_club_members_service_all';
  if not found then
    execute $$create policy p_fan_club_members_service_all on public.fan_club_members for all using (coalesce(auth.jwt()->>'role', '') = 'service_role') with check (coalesce(auth.jwt()->>'role', '') = 'service_role');$$;
  end if;

  perform 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'fan_club_events'
    and policyname = 'p_fan_club_events_service_all';
  if not found then
    execute $$create policy p_fan_club_events_service_all on public.fan_club_events for all using (coalesce(auth.jwt()->>'role', '') = 'service_role') with check (coalesce(auth.jwt()->>'role', '') = 'service_role');$$;
  end if;

  perform 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'fan_club_event_registrations'
    and policyname = 'p_fan_club_event_reg_service_all';
  if not found then
    execute $$create policy p_fan_club_event_reg_service_all on public.fan_club_event_registrations for all using (coalesce(auth.jwt()->>'role', '') = 'service_role') with check (coalesce(auth.jwt()->>'role', '') = 'service_role');$$;
  end if;
end$$;

-- Member-facing read/write policies.
create policy if not exists p_fan_club_members_self_read on public.fan_club_members
  for select using (auth.uid() = user_id);

create policy if not exists p_fan_club_members_self_manage on public.fan_club_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists p_fan_club_events_member_read on public.fan_club_events
  for select using (
    visibility = 'public'
    or exists (
      select 1
      from public.fan_club_members m
      where m.fan_club_id = fan_club_events.fan_club_id
        and m.user_id = auth.uid()
    )
  );

create policy if not exists p_fan_club_events_moderator_manage on public.fan_club_events
  for all using (
    exists (
      select 1
      from public.fan_club_members m
      where m.fan_club_id = fan_club_events.fan_club_id
        and m.user_id = auth.uid()
        and m.role in ('moderator', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.fan_club_members m
      where m.fan_club_id = fan_club_events.fan_club_id
        and m.user_id = auth.uid()
        and m.role in ('moderator', 'admin')
    )
  );

create policy if not exists p_fan_club_event_registrations_self_read on public.fan_club_event_registrations
  for select using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.fan_club_events e
      join public.fan_club_members m on m.fan_club_id = e.fan_club_id
      where e.id = fan_club_event_registrations.event_id
        and m.user_id = auth.uid()
        and m.role in ('moderator', 'admin')
    )
  );

create policy if not exists p_fan_club_event_registrations_self_manage on public.fan_club_event_registrations
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists p_fan_club_event_registrations_staff_manage on public.fan_club_event_registrations
  for all using (
    exists (
      select 1
      from public.fan_club_events e
      join public.fan_club_members m on m.fan_club_id = e.fan_club_id
      where e.id = fan_club_event_registrations.event_id
        and (m.user_id = auth.uid() and m.role in ('moderator', 'admin'))
    )
  )
  with check (
    exists (
      select 1
      from public.fan_club_events e
      join public.fan_club_members m on m.fan_club_id = e.fan_club_id
      where e.id = fan_club_event_registrations.event_id
        and (m.user_id = auth.uid() and m.role in ('moderator', 'admin'))
    )
  );

-- Public, read-only projection safe for anonymous consumers.
-- Expose attendee totals without leaking individual registration rows (bypasses RLS via security definer).
drop function if exists public.fan_club_event_public_attendee_count(uuid);
create or replace function public.fan_club_event_public_attendee_count(p_event_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)
  from public.fan_club_event_registrations
  where event_id = p_event_id
    and rsvp_status in ('registered', 'attended');
$$;

grant execute on function public.fan_club_event_public_attendee_count(uuid) to anon, authenticated;

drop view if exists public.fan_club_events_public;
create view public.fan_club_events_public as
select
  e.id,
  e.fan_club_id,
  fc.name as fan_club_name,
  e.title,
  coalesce(nullif(e.description, ''), '') as description,
  e.start_at,
  e.end_at,
  e.visibility,
  e.status,
  e.capacity,
  e.location,
  e.cover_image,
  e.tags,
  e.requires_approval,
  e.created_at,
  e.updated_at,
  public.fan_club_event_public_attendee_count(e.id)::int as attendee_count
from public.fan_club_events e
join public.fan_clubs fc on fc.id = e.fan_club_id
where e.status in ('scheduled', 'completed')
  and e.visibility = 'public';

grant select on public.fan_club_events_public to anon, authenticated;

-- Revoke direct table access from anon/authenticated; they must use the view and policies.
revoke all on public.fan_club_members from anon, authenticated;
revoke all on public.fan_club_events from anon, authenticated;
revoke all on public.fan_club_event_registrations from anon, authenticated;

-- Privilege hygiene for service role key.
grant select, insert, update, delete on public.fan_club_members to service_role;
grant select, insert, update, delete on public.fan_club_events to service_role;
grant select, insert, update, delete on public.fan_club_event_registrations to service_role;
