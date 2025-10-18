-- Phase 2 schema & storage alignment.
set search_path = public;

-- Drop legacy tables that no longer hold data.
drop table if exists public.wallets;
drop table if exists public.tickets_legacy;
drop table if exists public.transactions_legacy;
drop table if exists public.products_legacy;

-- Add helpful indexes for fan-facing queries.
create index if not exists idx_ticket_orders_user on public.ticket_orders(user_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_ticket_order on public.payments(ticket_order_id);

-- Provision storage buckets for avatars, tickets, and media assets.
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('tickets', 'tickets', false),
  ('media', 'media', true)
on conflict (id) do nothing;

-- Storage policies for bucket governance.
set search_path = storage, public;

-- Allow service role full control across buckets.
drop policy if exists storage_service_role_all on storage.objects;
create policy storage_service_role_all
  on storage.objects
  for all
  using (coalesce(auth.jwt()->>'role', '') = 'service_role')
  with check (coalesce(auth.jwt()->>'role', '') = 'service_role');

-- Avatars: public read, owners manage their files, admins can curate.
drop policy if exists storage_avatars_public_read on storage.objects;
create policy storage_avatars_public_read
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists storage_avatars_owner_write on storage.objects;
create policy storage_avatars_owner_write
  on storage.objects
  for insert
  with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists storage_avatars_owner_update on storage.objects;
create policy storage_avatars_owner_update
  on storage.objects
  for update
  using (bucket_id = 'avatars' and auth.uid() = owner)
  with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists storage_avatars_owner_delete on storage.objects;
create policy storage_avatars_owner_delete
  on storage.objects
  for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists storage_avatars_admin_write on storage.objects;
create policy storage_avatars_admin_write
  on storage.objects
  for all
  using (bucket_id = 'avatars' and coalesce(auth.jwt()->>'role', '') = 'admin')
  with check (bucket_id = 'avatars' and coalesce(auth.jwt()->>'role', '') = 'admin');

-- Tickets: strictly owner-bound downloads/uploads.
drop policy if exists storage_tickets_owner_select on storage.objects;
create policy storage_tickets_owner_select
  on storage.objects
  for select
  using (bucket_id = 'tickets' and auth.uid() = owner);

drop policy if exists storage_tickets_owner_write on storage.objects;
create policy storage_tickets_owner_write
  on storage.objects
  for insert
  with check (bucket_id = 'tickets' and auth.uid() = owner);

drop policy if exists storage_tickets_owner_update on storage.objects;
create policy storage_tickets_owner_update
  on storage.objects
  for update
  using (bucket_id = 'tickets' and auth.uid() = owner)
  with check (bucket_id = 'tickets' and auth.uid() = owner);

drop policy if exists storage_tickets_owner_delete on storage.objects;
create policy storage_tickets_owner_delete
  on storage.objects
  for delete
  using (bucket_id = 'tickets' and auth.uid() = owner);

-- Media: public read, admin uploads, service role already covered.
drop policy if exists storage_media_public_read on storage.objects;
create policy storage_media_public_read
  on storage.objects
  for select
  using (bucket_id = 'media');

drop policy if exists storage_media_admin_write on storage.objects;
create policy storage_media_admin_write
  on storage.objects
  for insert
  with check (bucket_id = 'media' and coalesce(auth.jwt()->>'role', '') = 'admin');

drop policy if exists storage_media_admin_update on storage.objects;
create policy storage_media_admin_update
  on storage.objects
  for update
  using (bucket_id = 'media' and coalesce(auth.jwt()->>'role', '') = 'admin')
  with check (bucket_id = 'media' and coalesce(auth.jwt()->>'role', '') = 'admin');

drop policy if exists storage_media_admin_delete on storage.objects;
create policy storage_media_admin_delete
  on storage.objects
  for delete
  using (bucket_id = 'media' and coalesce(auth.jwt()->>'role', '') = 'admin');

-- Restore search_path.
set search_path = public;

-- Attempt to enable helpful extensions (ignoring permission errors gracefully).
do $$
begin
  execute 'create extension if not exists pg_stat_monitor';
exception
  when insufficient_privilege then
    raise notice 'Insufficient privilege to create extension %', 'pg_stat_monitor';
  when undefined_file then
    raise notice 'Extension % is not available on this project', 'pg_stat_monitor';
end $$;

do $$
begin
  execute 'create extension if not exists pgaudit';
exception
  when insufficient_privilege then
    raise notice 'Insufficient privilege to create extension %', 'pgaudit';
  when undefined_file then
    raise notice 'Extension % is not available on this project', 'pgaudit';
end $$;

do $$
begin
  execute 'create extension if not exists moddatetime';
exception
  when insufficient_privilege then
    raise notice 'Insufficient privilege to create extension %', 'moddatetime';
  when undefined_file then
    raise notice 'Extension % is not available on this project', 'moddatetime';
end $$;

do $$
begin
  execute 'create extension if not exists tablefunc';
exception
  when insufficient_privilege then
    raise notice 'Insufficient privilege to create extension %', 'tablefunc';
  when undefined_file then
    raise notice 'Extension % is not available on this project', 'tablefunc';
end $$;
