alter table if exists public.partners
  add column if not exists slug text unique;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_tables
    where schemaname = 'public'
      and tablename = 'partners'
  ) then
    create unique index if not exists partners_slug_idx on public.partners (slug);
  end if;
end;
$$;
