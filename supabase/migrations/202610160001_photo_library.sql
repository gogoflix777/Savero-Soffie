-- Private image library. Run in Supabase SQL Editor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('app-photos', 'app-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

create table if not exists public.app_photos (
  id uuid primary key default gen_random_uuid(),
  photo_key text not null unique,
  title text not null,
  category text not null default 'Kenangan',
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id) on delete cascade
);

alter table public.app_photos enable row level security;
revoke all on public.app_photos from anon;
grant select, insert, update, delete on public.app_photos to authenticated;

drop policy if exists "Signed-in users can read photo library" on public.app_photos;
create policy "Signed-in users can read photo library" on public.app_photos
  for select to authenticated using (auth.uid() is not null);
drop policy if exists "Signed-in users can manage photo library" on public.app_photos;
create policy "Signed-in users can manage photo library" on public.app_photos
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Signed-in users can read app photos" on storage.objects;
create policy "Signed-in users can read app photos" on storage.objects
  for select to authenticated using (bucket_id = 'app-photos');
drop policy if exists "Signed-in users can upload app photos" on storage.objects;
create policy "Signed-in users can upload app photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'app-photos');
drop policy if exists "Signed-in users can update app photos" on storage.objects;
create policy "Signed-in users can update app photos" on storage.objects
  for update to authenticated using (bucket_id = 'app-photos') with check (bucket_id = 'app-photos');
drop policy if exists "Signed-in users can delete app photos" on storage.objects;
create policy "Signed-in users can delete app photos" on storage.objects
  for delete to authenticated using (bucket_id = 'app-photos');
