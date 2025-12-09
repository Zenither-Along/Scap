-- Message Interactions Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. UPDATE MESSAGES TABLE
-- ============================================
-- Add columns for edit/delete tracking and replies
alter table public.messages 
  add column if not exists edited_at timestamp with time zone,
  add column if not exists is_deleted boolean default false,
  add column if not exists replied_to_message_id uuid references public.messages(id) on delete set null;

-- ============================================
-- 2. MESSAGE REACTIONS TABLE
-- ============================================
create table if not exists public.message_reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id text references public.users(id) on delete cascade not null,
  reaction text not null check (reaction in ('❤️', '👍', '😂', '😮', '😢', '🔥')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, reaction) -- One reaction type per user per message
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
alter table public.message_reactions enable row level security;

-- ============================================
-- RLS POLICIES
-- ============================================
-- Drop existing policies if they exist
drop policy if exists "Users can view reactions" on public.message_reactions;
drop policy if exists "Users can add reactions" on public.message_reactions;
drop policy if exists "Users can remove own reactions" on public.message_reactions;

-- Create policies
create policy "Users can view reactions" on public.message_reactions
  for select using (true);

create policy "Users can add reactions" on public.message_reactions
  for insert with check (auth.uid()::text = user_id);

create policy "Users can remove own reactions" on public.message_reactions
  for delete using (auth.uid()::text = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_message_reactions_message on public.message_reactions(message_id);
create index if not exists idx_message_reactions_user on public.message_reactions(user_id);
create index if not exists idx_messages_conversation_undeleted on public.messages(conversation_id) where is_deleted = false;
