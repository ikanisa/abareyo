-- Admin community moderation observability
-- Provides rate limit view for moderation dashboard

create or replace view public.admin_community_rate_limits as
with post_activity as (
  select
    user_id,
    count(*) filter (where created_at >= now() - interval '15 minutes') as posts_15m,
    count(*) filter (where created_at >= now() - interval '1 hour') as posts_1h,
    count(*) filter (where created_at >= now() - interval '24 hours') as posts_24h,
    count(*) filter (where status in ('flagged', 'hidden', 'warned', 'banned')) as flagged_total,
    count(*) filter (where status = 'warned') as warns_total,
    count(*) filter (where status = 'banned') as bans_total,
    max(created_at) as last_post_at
  from public.community_posts
  group by user_id
), thresholds as (
  select 5 as limit_15m, 12 as limit_1h, 30 as limit_24h
)
select
  pa.user_id,
  coalesce(u.public_profile ->> 'displayName', u.display_name, 'Anonymous') as display_name,
  coalesce(u.public_profile ->> 'avatar', '') as avatar_url,
  pa.posts_15m,
  t.limit_15m,
  pa.posts_1h,
  t.limit_1h,
  pa.posts_24h,
  t.limit_24h,
  pa.flagged_total,
  pa.warns_total,
  pa.bans_total,
  pa.last_post_at,
  (coalesce(pa.posts_15m, 0) >= t.limit_15m
    or coalesce(pa.posts_1h, 0) >= t.limit_1h
    or coalesce(pa.posts_24h, 0) >= t.limit_24h
    or coalesce(pa.bans_total, 0) > 0) as rate_limited
from post_activity pa
cross join thresholds t
left join public.users u on u.id = pa.user_id;

comment on view public.admin_community_rate_limits is 'Aggregated community posting volume compared against moderation thresholds.';
