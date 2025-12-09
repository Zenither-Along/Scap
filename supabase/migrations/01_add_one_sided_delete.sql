-- Migration: Add one-sided deletion support
-- Run this in your Supabase SQL Editor

-- Add column to track users who have "deleted" the conversation
-- It is an array of user IDs. If a user's ID is in this array, the conversation is hidden from them.
alter table public.conversations 
add column if not exists deleted_by_users text[] default '{}';

-- Update RLS to ensure users can still interact with the row even if "deleted" (to un-delete it)
-- Existing policies should be fine, but let's ensure write access
