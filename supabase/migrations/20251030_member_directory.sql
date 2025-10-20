-- Member directory + onboarding profile enhancements
alter table public.users
  add column if not exists display_name text,
  add column if not exists region text,
  add column if not exists fan_club text,
  add column if not exists public_profile boolean default false,
  add column if not exists language text default 'rw',
  add column if not exists joined_at timestamptz default now();

update public.users set joined_at = coalesce(joined_at, now()) where joined_at is null;
update public.users set language = coalesce(language, 'rw') where language is null;
do $do$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'public_profile'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = 'public_profile'
        and data_type = 'boolean'
    ) then
      execute 'update public.users set public_profile = coalesce(public_profile, false) where public_profile is null';
    else
      execute 'update public.users set public_profile = coalesce(public_profile, ''{}''::jsonb) where public_profile is null';
    end if;
  end if;
end
$do$;

do $do$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'public_profile'
      and data_type = 'boolean'
  ) then
    execute 'drop view if exists public.public_members';
    execute $view$
      create view public.public_members as
      select
        id,
        coalesce(display_name, name, 'Fan') as display_name,
        coalesce(region, '—') as region,
        coalesce(fan_club, '—') as fan_club,
        joined_at,
        coalesce(avatar_url, '') as avatar_url
      from public.users
      where coalesce(public_profile, false) is true
    $view$;
  end if;
end
$do$;

do $do$
begin
  if to_regclass('public.public_members') is not null then
    execute 'grant select on public.public_members to anon, authenticated';
  end if;
end
$do$;
