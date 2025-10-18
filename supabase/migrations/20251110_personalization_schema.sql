-- Personalization and community schema with RLS coverage

-- USER PREFS & FAVORITES
create table if not exists public.user_prefs (
  user_id uuid primary key references public.users(id) on delete cascade,
  language text default 'rw',
  notifications jsonb default '{"goals":true,"kickoff":true,"final":true,"club":true}',
  created_at timestamptz default now()
);

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  entity_type text check (entity_type in ('team','player','competition')) not null,
  entity_id text not null,
  created_at timestamptz default now()
);

alter table if exists public.user_prefs enable row level security;
drop policy if exists p_user_prefs_select_owner on public.user_prefs;
drop policy if exists p_user_prefs_mutate_owner on public.user_prefs;
drop policy if exists p_user_prefs_update_owner on public.user_prefs;
create policy p_user_prefs_select_owner on public.user_prefs
  for select
  using (auth.uid() = user_id);
create policy p_user_prefs_insert_owner on public.user_prefs
  for insert
  with check (auth.uid() = user_id);
create policy p_user_prefs_update_owner on public.user_prefs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table if exists public.user_favorites enable row level security;
drop policy if exists p_user_favorites_select_owner on public.user_favorites;
drop policy if exists p_user_favorites_mutate_owner on public.user_favorites;
drop policy if exists p_user_favorites_update_owner on public.user_favorites;
create policy p_user_favorites_select_owner on public.user_favorites
  for select
  using (auth.uid() = user_id);
create policy p_user_favorites_insert_owner on public.user_favorites
  for insert
  with check (auth.uid() = user_id);
create policy p_user_favorites_update_owner on public.user_favorites
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- CONTENT LIBRARY
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('article','video')) not null,
  title text not null,
  slug text unique,
  summary text,
  body text,
  media_url text,
  tags text[] default '{}',
  published_at timestamptz,
  created_at timestamptz default now()
);

alter table if exists public.content_items enable row level security;
drop policy if exists p_content_items_public_read on public.content_items;
create policy p_content_items_public_read on public.content_items
  for select
  using (true);

-- COMMUNITY POSTS & REPORTS
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  text text,
  media_url text,
  status text check (status in ('visible','hidden')) default 'visible',
  created_at timestamptz default now()
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);

alter table if exists public.community_posts enable row level security;
drop policy if exists p_community_posts_public_read on public.community_posts;
drop policy if exists p_community_posts_insert_owner on public.community_posts;
drop policy if exists p_community_posts_mutate_owner on public.community_posts;
create policy p_community_posts_public_read on public.community_posts
  for select
  using (status = 'visible');
create policy p_community_posts_insert_owner on public.community_posts
  for insert
  with check (auth.uid() = user_id);
create policy p_community_posts_mutate_owner on public.community_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table if exists public.community_reports enable row level security;
drop policy if exists p_community_reports_service_only on public.community_reports;
create policy p_community_reports_service_only on public.community_reports
  for all
  using (false)
  with check (false);
