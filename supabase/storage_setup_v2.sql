-- Create a private bucket for post images (if not exists)
insert into storage.buckets (id, name, public)
values ('post_images', 'post_images', true)
on conflict (id) do nothing;

-- REMOVED: alter table storage.objects enable row level security; 
-- (This is already enabled by default and requires superuser to change, causing the error)

-- Policy: Allow authenticated users to upload images
drop policy if exists "Authenticated users can upload images" on storage.objects;
create policy "Authenticated users can upload images"
on storage.objects for insert
with check (
  bucket_id = 'post_images' 
  and auth.role() = 'authenticated'
);

-- Policy: Allow public to view images (since bucket is public)
drop policy if exists "Public can view images" on storage.objects;
create policy "Public can view images"
on storage.objects for select
using ( bucket_id = 'post_images' );
