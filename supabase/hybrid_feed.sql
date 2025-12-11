-- Hybrid Feed Algorithm
-- Sorts by a weighted score of:
-- 1. Freshness (Time)
-- 2. Relationship (Is Following)
-- 3. Random Factor (Discovery/Jitter)

-- Drop previous versions to avoid signature conflicts
drop function if exists get_hybrid_feed(uuid, int, int);
drop function if exists get_hybrid_feed(text, int, int);

create or replace function get_hybrid_feed(
  p_user_id text,
  p_limit int,
  p_offset int
)
returns setof posts as $$
begin
  return query
  select p.*
  from posts p
  left join follows f on p.user_id = f.following_id and f.follower_id = p_user_id
  where 
    -- Exclude the user's own posts from their "Feed" (they see them on their profile)
    p.user_id != p_user_id
  order by (
    -- 1. Time Score: giving weight to recent posts
    -- Extract epoch gives seconds. Dividing keeps it manageable but monotonic.
    (extract(epoch from p.created_at) / 100000) 
    + 
    -- 2. Following Boost: Huge weight to bring followed/friend content to top
    -- Adjust '1000' to balance against time. 
    -- If time/100000 changes by 1 every ~27 hours.
    -- So 1000 points = ~3 years worth of seconds. 
    -- This means a followed post from 3 years ago is still "newer" score-wise than a non-followed post from today?
    -- Maybe 1000 is too high if we want *fresh* non-followed content to compete.
    -- Let's check: 
    -- 1 day = 86400 seconds. 86400 / 100000 = 0.86 points per day.
    -- If we give 50 points boost for following, that's equivalent to (50 / 0.86) = ~58 days.
    -- So a followed post from 2 months ago == non-followed post from today.
    -- That seems reasonable. Let's use 50.
    (case when f.follower_id is not null then 50 else 0 end)
    +
    -- 3. Discovery/Random Factor: Small jitter to shuffle equal-scored items or bump near-items.
    -- 0 to 5 points. Equivalent to ~5 days variance.
    (random() * 5)
  ) desc
  limit p_limit offset p_offset;
end;
$$ language plpgsql;
