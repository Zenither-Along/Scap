-- Allow authenticated users (and service role) to insert posts
-- This often fixes RLS errors if the service role isn't bypassing correctly or if using client-side logic.
create policy "Allow authenticated inserts" on public.posts for insert with check (auth.uid() = user_id);

-- Also ensure public read access is actually correct
drop policy if exists "Public read access" on public.posts;
create policy "Public read access" on public.posts for select using (true);
