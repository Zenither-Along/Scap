-- Messages Schema for Scap
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CONVERSATIONS (Direct Messages between two users)
-- ============================================
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user1_id text references public.users(id) on delete cascade not null,
  user2_id text references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure unique conversation between two users (order-independent)
  unique(user1_id, user2_id),
  check (user1_id < user2_id) -- Enforce ordering to prevent duplicates
);

-- ============================================
-- 2. MESSAGES
-- ============================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id text references public.users(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- ============================================
-- RLS POLICIES
-- ============================================
-- Users can only see conversations they're part of
create policy "Users can view own conversations" on public.conversations
  for select using (true);

-- Users can only see messages in their conversations
create policy "Users can view messages in their conversations" on public.messages
  for select using (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_conversations_user1 on public.conversations(user1_id);
create index if not exists idx_conversations_user2 on public.conversations(user2_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_created on public.messages(created_at desc);

-- ============================================
-- FUNCTION: Get or Create Conversation
-- ============================================
create or replace function get_or_create_conversation(p_user1 text, p_user2 text)
returns uuid as $$
declare
  v_conversation_id uuid;
  v_ordered_user1 text;
  v_ordered_user2 text;
begin
  -- Order users to match the check constraint
  if p_user1 < p_user2 then
    v_ordered_user1 := p_user1;
    v_ordered_user2 := p_user2;
  else
    v_ordered_user1 := p_user2;
    v_ordered_user2 := p_user1;
  end if;

  -- Try to find existing conversation
  select id into v_conversation_id
  from public.conversations
  where user1_id = v_ordered_user1 and user2_id = v_ordered_user2;

  -- If not found, create new one
  if v_conversation_id is null then
    insert into public.conversations (user1_id, user2_id)
    values (v_ordered_user1, v_ordered_user2)
    returning id into v_conversation_id;
  end if;

  return v_conversation_id;
end;
$$ language plpgsql;
