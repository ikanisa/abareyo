-- FAVORITES & PREFS (personalization)
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

-- LIVE CONTENT (articles/videos)
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('article','video')) not null,
  title text not null,
  slug text unique,
  summary text,
  body text,           -- markdown for articles
  media_url text,      -- video or image cover
  tags text[] default '{}',
  published_at timestamptz,
  created_at timestamptz default now()
);

-- COMMUNITY (modest MVP)
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

-- REWARDS extensions (trivia/prediction/events)
create table if not exists public.rewards_challenges (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('trivia','prediction')) not null,
  title text not null,
  payload jsonb default '{}',
  starts_at timestamptz,
  ends_at timestamptz
);
create table if not exists public.rewards_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.rewards_challenges(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  answer jsonb,
  points_awarded int default 0,
  created_at timestamptz default now()
);

-- PARTNERS (webviews)
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('insurer','bank','telco','travel','sponsor')) not null,
  url text not null,
  logo_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- SENTIMENT & SURVEYS
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  questions jsonb not null,
  created_at timestamptz default now()
);
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  answers jsonb not null,
  created_at timestamptz default now()
);

-- PUBLIC VIEWS (add-only; no PII)
drop view if exists public.public_content cascade;
create view public.public_content as
select id, kind, title, slug, summary, media_url, tags, published_at
from public.content_items
where published_at is not null and published_at <= now();

grant select on public.public_content to anon, authenticated;
