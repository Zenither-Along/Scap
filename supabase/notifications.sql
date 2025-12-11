-- Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null references public.users(id) on delete cascade, -- The user receiving the notification
  actor_id text not null references public.users(id) on delete cascade, -- The user performing the action
  type text check (type in ('follow', 'like', 'comment', 'mention')),
  entity_id uuid, -- Post ID or Comment ID related to the notification
  metadata jsonb, -- Store extra context like { comment_id: uuid }
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure metadata column exists if table was already created
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'metadata') then
        alter table public.notifications add column metadata jsonb;
    end if; 
end $$;

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using ( auth.uid()::text = user_id );

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using ( auth.uid()::text = user_id );

-- TRIGGERS

-- 1. Handle New Like
create or replace function handle_new_like()
returns trigger as $$
begin
  -- Don't notify if user likes their own post
  if (select user_id from public.posts where id = new.post_id) != new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (
      (select user_id from public.posts where id = new.post_id), -- Owner of post
      new.user_id, -- Liker
      'like',
      new.post_id
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_new_like on public.likes;
create trigger on_new_like
  after insert on public.likes
  for each row execute procedure handle_new_like();

-- 2. Handle New Follow
create or replace function handle_new_follow()
returns trigger as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (
    new.following_id, -- Person being followed
    new.follower_id, -- Follower
    'follow'
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_new_follow on public.follows;
create trigger on_new_follow
  after insert on public.follows
  for each row execute procedure handle_new_follow();

-- 3. Handle New Comment
create or replace function handle_new_comment()
returns trigger as $$
begin
  -- Don't notify if user comments on their own post
  if (select user_id from public.posts where id = new.post_id) != new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id, metadata)
    values (
      (select user_id from public.posts where id = new.post_id), -- Owner of post
      new.user_id, -- Commenter
      'comment',
      new.post_id,
      jsonb_build_object('comment_id', new.id)
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_new_comment on public.comments;
create trigger on_new_comment
  after insert on public.comments
  for each row execute procedure handle_new_comment();
