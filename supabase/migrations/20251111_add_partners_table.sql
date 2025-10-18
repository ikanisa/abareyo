-- Ensure partners table exists for partner webviews and API endpoints.
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  url text,
  logo_url text,
  slug text not null,
  active boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at in sync with modifications.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_partners_updated_at on public.partners;
create trigger trg_partners_updated_at
  before update on public.partners
  for each row
  execute function public.set_updated_at();
