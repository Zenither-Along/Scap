-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table (Synced with Clerk)
create table public.users (
  id text not null primary key, -- Clerk User ID
  username text unique,
  full_name text,
  avatar_url text,
  email text,
  bio text,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts Table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id text references public.users(id) on delete cascade not null,
  content text,
  code_snippet text, -- For sharing code
  language text, -- e.g. 'javascript', 'python'
  media_urls text[], -- Array of URLs
  media_type text check (media_type in ('image', 'video', 'none')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Likes Table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id text references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- Comments Table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id text references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Public read access
create policy "Public read access" on public.users for select using (true);
create policy "Public read access" on public.posts for select using (true);
create policy "Public read access" on public.likes for select using (true);
create policy "Public read access" on public.comments for select using (true);

-- Authenticated insert/update/delete (Generic placeholder - requires Auth integration)
-- Ideally, we check auth.uid() = id for users, or auth.uid() = user_id for others.
-- However, since we use Clerk, we might use a custom function or just allow authenticated if using service role for writes via webhook, 
-- but for client-side writes we need to verify the Clerk token via a custom claim or just rely entirely on server actions (safer).
-- For now, we will leave policies open to authenticated users or define them later when we settle on the precise Auth method (Server Actions vs Client).
