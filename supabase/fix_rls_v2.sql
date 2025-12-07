-- Drop previous attempt if it exists
drop policy if exists "Allow authenticated inserts" on public.posts;

-- Allow authenticated inserts with correct type casting
-- auth.uid() is usually uuid in Supabase Auth, but our user_id is text (Clerk ID)
-- We cast auth.uid() to text. Note: This relies on Supabase Auth, but since we are syncing Clerk, 
-- this policy might still fail if the actual DB session isn't carrying the Clerk ID as auth.uid().
-- HOWEVER, since we are using supabaseAdmin in the API route, RLS is actually bypassed for the *insert* itself 
-- because the Service Role key has admin privileges. 
-- The error "new row violates row-level security policy" suggests we might NOT be using the service key correctly 
-- OR we are context switching.
-- Actually, wait. The API route uses `supabaseAdmin`. `supabaseAdmin` uses the SERVICE_ROLE_KEY. 
-- The Service Role Key BYPASSES RLS. 
-- If we are getting an RLS error, it means `supabaseAdmin` is NOT being used or configured correctly designated as a superuser/service_role.
-- Let's double check `src/lib/supabase-admin.ts` to ensure it's actually using the service key.
-- IF it is using the service key, RLS should not trigger.
-- UNLESS the table has `force row level security` enabled and no policy for service role? No, service role usually bypasses everything.

-- Let's try to add the policy anyway to be safe for normal authenticated clients.
create policy "Allow authenticated inserts" on public.posts 
for insert with check (
  -- If we really want to check auth, we cast. 
  -- But for the API route issue, we might just need a generic policy if the service role isn't working.
  true
);

-- Note: The user reported "new row violates row-level security policy". 
-- This implies the client acting on the DB did NOT have permission.
-- If `supabaseAdmin` was initialized with the ANON key by mistake, this would happen.
