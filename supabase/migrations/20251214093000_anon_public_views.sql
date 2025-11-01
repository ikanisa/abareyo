set search_path = public;

-- Ensure core tables expose an explicit public flag for anonymous reads.
alter table if exists public.matches
  add column if not exists is_public boolean default true;

alter table if exists public.feature_flags
  add column if not exists expose_to_anon boolean default false;

-- Normalise null values before we rely on predicates.
update public.matches set is_public = true where is_public is null;
update public.feature_flags set expose_to_anon = false where expose_to_anon is null;
update public.feature_flags set expose_to_anon = true where key like 'features.%';

-- Harden row level security for anon vs authenticated access.
alter table if exists public.matches enable row level security;
alter table if exists public.matches force row level security;
alter table if exists public.feature_flags enable row level security;
alter table if exists public.feature_flags force row level security;
alter table if exists public.partners enable row level security;
alter table if exists public.partners force row level security;

-- Replace permissive public select policies with scoped variants.
drop policy if exists p_matches_public_select on public.matches;
create policy p_matches_public_select on public.matches
  for select using (
    coalesce(auth.jwt()->>'role', '') <> 'anon'
    or coalesce(is_public, false)
  );

drop policy if exists p_partners_public_select on public.partners;
create policy p_partners_public_select on public.partners
  for select using (
    coalesce(auth.jwt()->>'role', '') <> 'anon'
    or coalesce(active, false)
  );

drop policy if exists p_feature_flags_public_select on public.feature_flags;
create policy p_feature_flags_public_select on public.feature_flags
  for select using (
    coalesce(auth.jwt()->>'role', '') <> 'anon'
    or coalesce(expose_to_anon, false)
  );

-- Public views consumed by anon clients (limited column projection + predicate).
create or replace view public.public_match_schedule as
  select
    id,
    opponent,
    kickoff,
    venue,
    status,
    blue_price,
    regular_price,
    vip_price,
    seats_blue,
    seats_regular,
    seats_vip
  from public.matches
  where coalesce(is_public, false) is true;

grant select on public.public_match_schedule to anon, authenticated;

create or replace view public.public_partners as
  select id, name, category, url, logo_url, slug, metadata
  from public.partners
  where coalesce(active, false) is true;

grant select on public.public_partners to anon, authenticated;

create or replace view public.public_feature_flags as
  select key, enabled, description
  from public.feature_flags
  where coalesce(expose_to_anon, false) is true;

grant select on public.public_feature_flags to anon, authenticated;

comment on view public.public_match_schedule is 'Matches safe for anonymous presentation (no internal notes or private fixtures).';
comment on view public.public_partners is 'Subset of partners whitelisted for public/mobile clients.';
comment on view public.public_feature_flags is 'Feature flags that may be exposed to anonymous clients.';
