-- Ensure every fan can be referenced by a short unique code and expose
-- WhatsApp hints in the public directory.
do $do$
begin
  if to_regclass('public.users') is null then
    raise notice 'public.users table missing; skipping fan profile bootstrap until core schema migration runs';
  else
    execute 'alter table public.users add column if not exists user_code text';

    execute 'create unique index if not exists users_user_code_key on public.users (user_code) where user_code is not null';

    -- Refresh the public view with the extra fan metadata.
    execute 'drop view if exists public.public_members';
    execute $sql$
      create view public.public_members as
      select
        id,
        coalesce(user_code, lpad(right(id::text, 6), 6, '0')) as user_code,
        coalesce(display_name, 'Fan #' || coalesce(user_code, lpad(right(id::text, 6), 6, '0'))) as display_name,
        coalesce(region, 'Global') as region,
        coalesce(fan_club, 'Worldwide') as fan_club,
        joined_at,
        coalesce(avatar_url, '') as avatar_url,
        coalesce(phone, '') as phone,
        coalesce(momo_number, '') as momo_number
      from public.users
      where coalesce(public_profile, false) is true
    $sql$;

    execute 'grant select on public.public_members to anon, authenticated';
  end if;
end
$do$;
