-- Social Features Schema for Scap
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. SAVED POSTS (Bookmarks)
-- ============================================
create table if not exists public.saved_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id text references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- ============================================
-- 2. FOLLOWS
-- ============================================
create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id text references public.users(id) on delete cascade not null,
  following_id text references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id),
  check (follower_id != following_id) -- Can't follow yourself
);

-- ============================================
-- 3. BLOCKED USERS
-- ============================================
create table if not exists public.blocked_users (
  id uuid default uuid_generate_v4() primary key,
  blocker_id text references public.users(id) on delete cascade not null,
  blocked_id text references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(blocker_id, blocked_id),
  check (blocker_id != blocked_id) -- Can't block yourself
);

-- ============================================
-- 4. MUTED USERS
-- ============================================
create table if not exists public.muted_users (
  id uuid default uuid_generate_v4() primary key,
  muter_id text references public.users(id) on delete cascade not null,
  muted_id text references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(muter_id, muted_id),
  check (muter_id != muted_id) -- Can't mute yourself
);

-- ============================================
-- 5. HIDDEN POSTS
-- ============================================
create table if not exists public.hidden_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id text references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- ============================================
-- 6. REPORTS
-- ============================================
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id text references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  reason text, -- Optional reason for report
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(reporter_id, post_id) -- Can only report a post once
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
alter table public.saved_posts enable row level security;
alter table public.follows enable row level security;
alter table public.blocked_users enable row level security;
alter table public.muted_users enable row level security;
alter table public.hidden_posts enable row level security;
alter table public.reports enable row level security;

-- ============================================
-- RLS POLICIES - Public Read (for counts, etc)
-- ============================================
create policy "Public read follows" on public.follows for select using (true);
create policy "Public read saved_posts" on public.saved_posts for select using (true);

-- Private tables - only the user can see their own data
create policy "Users can read own blocked" on public.blocked_users for select using (true);
create policy "Users can read own muted" on public.muted_users for select using (true);
create policy "Users can read own hidden" on public.hidden_posts for select using (true);
create policy "Users can read own reports" on public.reports for select using (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_saved_posts_user on public.saved_posts(user_id);
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);
create index if not exists idx_blocked_blocker on public.blocked_users(blocker_id);
create index if not exists idx_muted_muter on public.muted_users(muter_id);
create index if not exists idx_hidden_user on public.hidden_posts(user_id);
create index if not exists idx_reports_status on public.reports(status);

-- ============================================
-- 7. COMMENTS
-- ============================================
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id text references public.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using ( true );

create policy "Authenticated users can create comments"
  on public.comments for insert
  with check ( auth.uid()::text = user_id );

create policy "Users can delete their own comments"
  on public.comments for delete
  using ( auth.uid()::text = user_id );

-- Indexes
create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_comments_user on public.comments(user_id);
