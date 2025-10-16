alter table if exists public.partners
  add column if not exists slug text unique;

create unique index if not exists partners_slug_idx on public.partners (slug);
