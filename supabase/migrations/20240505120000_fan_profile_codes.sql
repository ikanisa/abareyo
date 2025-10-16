-- Ensure every fan can be referenced by a short unique code and expose
-- WhatsApp hints in the public directory.
alter table public.users
  add column if not exists user_code text;

create unique index if not exists users_user_code_key on public.users (user_code)
  where user_code is not null;

-- Refresh the public view with the extra fan metadata.
drop view if exists public.public_members;
create view public.public_members as
select
  id,
  coalesce(user_code, lpad(right(id, 6), 6, '0')) as user_code,
  coalesce(display_name, 'Fan #' || coalesce(user_code, lpad(right(id, 6), 6, '0'))) as display_name,
  coalesce(region, 'Global') as region,
  coalesce(fan_club, 'Worldwide') as fan_club,
  joined_at,
  coalesce(avatar_url, '') as avatar_url,
  coalesce(phone, '') as phone,
  coalesce(momo_number, '') as momo_number
from public.users
where coalesce(public_profile, false) is true;

grant select on public.public_members to anon, authenticated;
