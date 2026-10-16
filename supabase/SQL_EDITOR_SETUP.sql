-- Savero & Soffie: Supabase SQL Editor setup
-- Run once on a fresh Supabase project. Do not rerun after applying migrations individually.
-- Edge Functions, Auth provider setup, admin assignment, and scheduled secrets are documented separately in SUPABASE_SETUP.md.

-- ============================================================================
-- 202610160001_photo_library.sql
-- ============================================================================
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

-- ============================================================================
-- 202610160002_couple_daily_streak.sql
-- ============================================================================
-- Couple daily check-ins, streak restores, meeting confirmations and private diary photos.
create extension if not exists pgcrypto;

create or replace function public.jakarta_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Jakarta')::date
$$;

create table if not exists public.couple_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_name text not null unique check (profile_name in ('Savero', 'Soffie')),
  bound_at timestamptz not null default now()
);
alter table public.couple_profiles enable row level security;

create or replace function public.is_couple_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.couple_profiles where user_id = auth.uid())
$$;
revoke all on function public.is_couple_member() from public;
grant execute on function public.is_couple_member() to authenticated;

create policy "Couple members can read bound profiles" on public.couple_profiles
  for select to authenticated using (public.is_couple_member());
grant select on public.couple_profiles to authenticated;
revoke insert, update, delete on public.couple_profiles from anon, authenticated;

create or replace function public.claim_couple_profile(requested_profile text)
returns text language plpgsql security definer set search_path = public as $$
declare existing_profile text;
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if requested_profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
  select profile_name into existing_profile from public.couple_profiles where user_id = auth.uid();
  if existing_profile is not null then return existing_profile; end if;
  if exists (select 1 from public.couple_profiles where profile_name = requested_profile) then
    raise exception 'Profil ini sudah terikat ke akun lain.';
  end if;
  insert into public.couple_profiles(user_id, profile_name) values (auth.uid(), requested_profile);
  return requested_profile;
end;
$$;
revoke all on function public.claim_couple_profile(text) from public;
grant execute on function public.claim_couple_profile(text) to authenticated;

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile text not null check (profile in ('Savero', 'Soffie')),
  log_date date not null,
  expression text not null check (expression in ('bahagia', 'rindu', 'tenang', 'semangat', 'lelah', 'sedih')),
  rating smallint not null check (rating between 1 and 5),
  diary_text text,
  photo_path text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  unique(user_id, log_date)
);
create index if not exists daily_checkins_date_idx on public.daily_checkins(log_date desc);
alter table public.daily_checkins enable row level security;

create or replace function public.enforce_daily_checkin_identity()
returns trigger language plpgsql security definer set search_path = public as $$
declare bound_profile text;
begin
  if auth.uid() is null or new.user_id <> auth.uid() then raise exception 'Log hanya dapat dibuat oleh akun sendiri.'; end if;
  select profile_name into bound_profile from public.couple_profiles where user_id = auth.uid();
  if bound_profile is null then raise exception 'Pilih profil akun terlebih dahulu.'; end if;
  if new.profile <> bound_profile then raise exception 'Profil log tidak cocok dengan akun.'; end if;
  if new.log_date <> public.jakarta_today() then raise exception 'Log hanya dapat dicatat untuk tanggal hari ini.'; end if;
  if tg_op = 'UPDATE' then
    if old.user_id <> new.user_id or old.profile <> new.profile or old.log_date <> new.log_date then
      raise exception 'Identitas dan tanggal log tidak dapat diubah.';
    end if;
    new.created_at := old.created_at;
    if new.photo_path is not distinct from old.photo_path then new.expires_at := old.expires_at;
    else new.expires_at := now() + interval '24 hours'; end if;
  end if;
  if tg_op = 'INSERT' then new.expires_at := now() + interval '24 hours'; end if;
  return new;
end;
$$;
drop trigger if exists daily_checkin_identity_guard on public.daily_checkins;
create trigger daily_checkin_identity_guard before insert or update on public.daily_checkins
for each row execute function public.enforce_daily_checkin_identity();

create policy "Couple members can read checkins" on public.daily_checkins
  for select to authenticated using (public.is_couple_member());
create policy "Users create their own checkin" on public.daily_checkins
  for insert to authenticated with check (user_id = auth.uid() and public.is_couple_member());
create policy "Users edit their own checkin" on public.daily_checkins
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.daily_checkins to authenticated;
revoke delete on public.daily_checkins from anon, authenticated;

create table if not exists public.streak_restores (
  missed_date date primary key,
  restored_by uuid not null references auth.users(id),
  restored_at timestamptz not null default now()
);
alter table public.streak_restores enable row level security;
create policy "Couple members can read restores" on public.streak_restores
  for select to authenticated using (public.is_couple_member());
grant select on public.streak_restores to authenticated;
revoke insert, update, delete on public.streak_restores from anon, authenticated;

create or replace function public.restore_couple_streak()
returns date language plpgsql security definer set search_path = public as $$
declare today_date date := public.jakarta_today(); missed date := public.jakarta_today() - 1; profile_count integer;
begin
  if auth.uid() is null or not public.is_couple_member() then raise exception 'Akun pasangan diperlukan.'; end if;
  perform pg_advisory_xact_lock(hashtext('couple_streak_restore'));
  if exists (select 1 from public.streak_restores where restored_at > now() - interval '7 days') then
    raise exception 'Pemulihan streak hanya tersedia sekali dalam 7 hari.';
  end if;
  if exists (select 1 from public.streak_restores where missed_date = missed) then raise exception 'Tanggal ini sudah dipulihkan.'; end if;
  select count(distinct profile) into profile_count from public.daily_checkins where log_date = today_date - 2;
  if profile_count < 2 and not exists (select 1 from public.streak_restores where missed_date = today_date - 2) then
    raise exception 'Streak sebelumnya sudah terputus; tanggal sebelum kemarin belum lengkap.';
  end if;
  insert into public.streak_restores(missed_date, restored_by) values (missed, auth.uid());
  return missed;
end;
$$;
revoke all on function public.restore_couple_streak() from public;
grant execute on function public.restore_couple_streak() to authenticated;

create table if not exists public.meeting_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile text not null check (profile in ('Savero', 'Soffie')),
  meeting_date date not null,
  confirmed_at timestamptz not null default now(),
  unique(user_id, meeting_date)
);
create index if not exists meeting_confirmations_date_idx on public.meeting_confirmations(meeting_date desc);
alter table public.meeting_confirmations enable row level security;

create or replace function public.enforce_meeting_identity()
returns trigger language plpgsql security definer set search_path = public as $$
declare bound_profile text;
begin
  if auth.uid() is null or new.user_id <> auth.uid() then raise exception 'Konfirmasi harus berasal dari akun sendiri.'; end if;
  select profile_name into bound_profile from public.couple_profiles where user_id = auth.uid();
  if bound_profile is null or new.profile <> bound_profile then raise exception 'Profil tidak cocok dengan akun.'; end if;
  if new.meeting_date <> public.jakarta_today() then raise exception 'Konfirmasi hanya berlaku untuk hari ini.'; end if;
  new.confirmed_at := now();
  return new;
end;
$$;
drop trigger if exists meeting_identity_guard on public.meeting_confirmations;
create trigger meeting_identity_guard before insert or update on public.meeting_confirmations
for each row execute function public.enforce_meeting_identity();
create policy "Couple members read meeting confirmations" on public.meeting_confirmations
  for select to authenticated using (public.is_couple_member());
create policy "Users confirm their own meeting" on public.meeting_confirmations
  for insert to authenticated with check (user_id = auth.uid() and public.is_couple_member());
create policy "Users update their own meeting confirmation" on public.meeting_confirmations
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.meeting_confirmations to authenticated;
revoke delete on public.meeting_confirmations from anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('daily-diary', 'daily-diary', false, 786432, array['image/webp'])
on conflict (id) do update set public = false, file_size_limit = 786432, allowed_mime_types = array['image/webp'];

create policy "Couple members read unexpired diary photos" on storage.objects
  for select to authenticated using (
    bucket_id = 'daily-diary' and public.is_couple_member() and
    exists (select 1 from public.daily_checkins d where d.photo_path = name and d.expires_at > now())
  );
create policy "Users upload diary photo into own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'daily-diary' and (storage.foldername(name))[1] = auth.uid()::text and
    (storage.foldername(name))[2] = public.jakarta_today()::text
  );
create policy "Users replace own diary photos" on storage.objects
  for update to authenticated using (bucket_id = 'daily-diary' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'daily-diary' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users remove own diary photos" on storage.objects
  for delete to authenticated using (bucket_id = 'daily-diary' and (storage.foldername(name))[1] = auth.uid()::text);

-- The scheduled Edge Function performs Storage API deletion and then nulls expired diary text/path.

-- ============================================================================
-- 202610160003_profile_heart_progress.sql
-- ============================================================================
create table if not exists public.profile_heart_progress (
  profile text primary key check (profile in ('Savero', 'Soffie')),
  percentage numeric(5, 2) not null default 0 check (percentage between 0 and 100),
  updated_at timestamptz not null default now()
);

insert into public.profile_heart_progress (profile, percentage)
values ('Savero', 0), ('Soffie', 0)
on conflict (profile) do nothing;

alter table public.profile_heart_progress enable row level security;
revoke all on public.profile_heart_progress from public, anon, authenticated;
grant select on public.profile_heart_progress to authenticated;

drop policy if exists "Couple members can read profile heart progress" on public.profile_heart_progress;
create policy "Couple members can read profile heart progress" on public.profile_heart_progress
  for select to authenticated using (public.is_couple_member());

create or replace function public.set_my_heart_progress(requested_percentage numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  bound_profile text;
  saved_percentage numeric(5, 2);
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if requested_percentage is null or requested_percentage < 0 or requested_percentage > 100 then
    raise exception 'Persentase hati harus berada di antara 0 dan 100.';
  end if;

  select profile_name into bound_profile
  from public.couple_profiles
  where user_id = auth.uid();

  if bound_profile is null then raise exception 'Pilih profil akun terlebih dahulu.'; end if;

  insert into public.profile_heart_progress (profile, percentage, updated_at)
  values (bound_profile, requested_percentage, now())
  on conflict (profile) do update
    set percentage = greatest(public.profile_heart_progress.percentage, excluded.percentage),
        updated_at = now()
  returning percentage into saved_percentage;

  return saved_percentage;
end;
$$;

revoke all on function public.set_my_heart_progress(numeric) from public;
grant execute on function public.set_my_heart_progress(numeric) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'profile_heart_progress'
     ) then
    alter publication supabase_realtime add table public.profile_heart_progress;
  end if;
end;
$$;

-- ============================================================================
-- 202610170004_secure_admin_access.sql
-- ============================================================================
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
revoke all on public.app_admins from public, anon, authenticated;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.app_admins where user_id = auth.uid()
  )
$$;
revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

create or replace function public.is_couple_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_app_admin() or exists (
    select 1 from public.couple_profiles where user_id = auth.uid()
  )
$$;
revoke all on function public.is_couple_member() from public;
grant execute on function public.is_couple_member() to authenticated;

create or replace function public.enforce_daily_checkin_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bound_profile text;
  profile_owner uuid;
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;

  if public.is_app_admin() then
    if new.profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
    select user_id into profile_owner from public.couple_profiles where profile_name = new.profile;
    if profile_owner is null or new.user_id <> profile_owner then
      raise exception 'Log admin harus disimpan untuk pemilik profil yang dipilih.';
    end if;
  else
    if new.user_id <> auth.uid() then raise exception 'Log hanya dapat dibuat oleh akun sendiri.'; end if;
    select profile_name into bound_profile from public.couple_profiles where user_id = auth.uid();
    if bound_profile is null then raise exception 'Pilih profil akun terlebih dahulu.'; end if;
    if new.profile <> bound_profile then raise exception 'Profil log tidak cocok dengan akun.'; end if;
  end if;

  if new.log_date <> public.jakarta_today() then raise exception 'Log hanya dapat dicatat untuk tanggal hari ini.'; end if;
  if tg_op = 'UPDATE' then
    if old.user_id <> new.user_id or old.profile <> new.profile or old.log_date <> new.log_date then
      raise exception 'Identitas dan tanggal log tidak dapat diubah.';
    end if;
    new.created_at := old.created_at;
    if new.photo_path is not distinct from old.photo_path then new.expires_at := old.expires_at;
    else new.expires_at := now() + interval '24 hours'; end if;
  end if;
  if tg_op = 'INSERT' then new.expires_at := now() + interval '24 hours'; end if;
  return new;
end;
$$;

drop policy if exists "Users create their own checkin" on public.daily_checkins;
create policy "Users create their own checkin" on public.daily_checkins
  for insert to authenticated with check (
    (user_id = auth.uid() and public.is_couple_member())
    or (public.is_app_admin() and exists (
      select 1 from public.couple_profiles p where p.profile_name = daily_checkins.profile and p.user_id = daily_checkins.user_id
    ))
  );
drop policy if exists "Users edit their own checkin" on public.daily_checkins;
create policy "Users edit their own checkin" on public.daily_checkins
  for update to authenticated using (
    user_id = auth.uid() or public.is_app_admin()
  ) with check (
    user_id = auth.uid() or (public.is_app_admin() and exists (
      select 1 from public.couple_profiles p where p.profile_name = daily_checkins.profile and p.user_id = daily_checkins.user_id
    ))
  );

create or replace function public.admin_set_profile_heart_progress(
  requested_profile text,
  requested_percentage numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare saved_percentage numeric(5, 2);
begin
  if not public.is_app_admin() then raise exception 'Akses admin diperlukan.'; end if;
  if requested_profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
  if requested_percentage is null or requested_percentage < 0 or requested_percentage > 100 then
    raise exception 'Persentase hati harus berada di antara 0 dan 100.';
  end if;
  insert into public.profile_heart_progress(profile, percentage, updated_at)
  values (requested_profile, requested_percentage, now())
  on conflict (profile) do update set percentage = excluded.percentage, updated_at = now()
  returning percentage into saved_percentage;
  return saved_percentage;
end;
$$;
revoke all on function public.admin_set_profile_heart_progress(text, numeric) from public;
grant execute on function public.admin_set_profile_heart_progress(text, numeric) to authenticated;

create or replace function public.admin_confirm_meeting(requested_profile text)
returns public.meeting_confirmations
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_owner uuid;
  saved_confirmation public.meeting_confirmations;
begin
  if not public.is_app_admin() then raise exception 'Akses admin diperlukan.'; end if;
  if requested_profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
  select user_id into profile_owner from public.couple_profiles where profile_name = requested_profile;
  if profile_owner is null then raise exception 'Akun pemilik profil belum terhubung.'; end if;
  insert into public.meeting_confirmations(user_id, profile, meeting_date)
  values (profile_owner, requested_profile, public.jakarta_today())
  on conflict (user_id, meeting_date) do update set profile = excluded.profile, confirmed_at = now()
  returning * into saved_confirmation;
  return saved_confirmation;
end;
$$;
revoke all on function public.admin_confirm_meeting(text) from public;
grant execute on function public.admin_confirm_meeting(text) to authenticated;

create or replace function public.enforce_meeting_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bound_profile text;
  profile_owner uuid;
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if public.is_app_admin() then
    if new.profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
    select user_id into profile_owner from public.couple_profiles where profile_name = new.profile;
    if profile_owner is null or new.user_id <> profile_owner then
      raise exception 'Konfirmasi admin harus disimpan untuk pemilik profil yang dipilih.';
    end if;
  else
    if new.user_id <> auth.uid() then raise exception 'Konfirmasi harus berasal dari akun sendiri.'; end if;
    select profile_name into bound_profile from public.couple_profiles where user_id = auth.uid();
    if bound_profile is null or new.profile <> bound_profile then raise exception 'Profil tidak cocok dengan akun.'; end if;
  end if;
  if new.meeting_date <> public.jakarta_today() then raise exception 'Konfirmasi hanya berlaku untuk hari ini.'; end if;
  new.confirmed_at := now();
  return new;
end;
$$;

drop policy if exists "Users confirm their own meeting" on public.meeting_confirmations;
create policy "Users confirm their own meeting" on public.meeting_confirmations
  for insert to authenticated with check (
    (user_id = auth.uid() and public.is_couple_member())
    or (public.is_app_admin() and exists (
      select 1 from public.couple_profiles p where p.profile_name = meeting_confirmations.profile and p.user_id = meeting_confirmations.user_id
    ))
  );
drop policy if exists "Users update their own meeting confirmation" on public.meeting_confirmations;
create policy "Users update their own meeting confirmation" on public.meeting_confirmations
  for update to authenticated using (user_id = auth.uid() or public.is_app_admin())
  with check (
    user_id = auth.uid() or (public.is_app_admin() and exists (
      select 1 from public.couple_profiles p where p.profile_name = meeting_confirmations.profile and p.user_id = meeting_confirmations.user_id
    ))
  );

drop policy if exists "Couple members read unexpired diary photos" on storage.objects;
create policy "Couple members read unexpired diary photos" on storage.objects
  for select to authenticated using (
    bucket_id = 'daily-diary' and (
      public.is_app_admin() or (
        public.is_couple_member() and exists (
          select 1 from public.daily_checkins d where d.photo_path = name and d.expires_at > now()
        )
      )
    )
  );
drop policy if exists "Users remove own diary photos" on storage.objects;
create policy "Users remove own diary photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'daily-diary' and (
      (storage.foldername(name))[1] = auth.uid()::text or public.is_app_admin()
    )
  );

-- ============================================================================
-- 202610170005_meeting_fill_progress.sql
-- ============================================================================
create table if not exists public.meeting_fill_progress (
  profile text primary key check (profile in ('Savero', 'Soffie')),
  progress_date date not null default public.jakarta_today(),
  percentage numeric(5, 2) not null default 0 check (percentage between 0 and 100),
  updated_at timestamptz not null default now()
);

insert into public.meeting_fill_progress (profile, progress_date, percentage)
values ('Savero', public.jakarta_today(), 0), ('Soffie', public.jakarta_today(), 0)
on conflict (profile) do nothing;

alter table public.meeting_fill_progress enable row level security;
revoke all on public.meeting_fill_progress from public, anon, authenticated;
grant select on public.meeting_fill_progress to authenticated;

drop policy if exists "Couple members can read meeting fill progress" on public.meeting_fill_progress;
create policy "Couple members can read meeting fill progress" on public.meeting_fill_progress
  for select to authenticated using (public.is_couple_member());

create or replace function public.set_my_meeting_fill_progress(requested_percentage numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  bound_profile text;
  today_date date := public.jakarta_today();
  saved_percentage numeric(5, 2);
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if requested_percentage is null or requested_percentage < 0 or requested_percentage > 100 then
    raise exception 'Persentase pengisian harus berada di antara 0 dan 100.';
  end if;
  select profile_name into bound_profile
  from public.couple_profiles where user_id = auth.uid();
  if bound_profile is null then raise exception 'Pilih profil akun terlebih dahulu.'; end if;

  insert into public.meeting_fill_progress(profile, progress_date, percentage, updated_at)
  values (bound_profile, today_date, requested_percentage, now())
  on conflict (profile) do update
    set progress_date = today_date,
        percentage = case
          when public.meeting_fill_progress.progress_date = today_date
            then greatest(public.meeting_fill_progress.percentage, excluded.percentage)
          else excluded.percentage
        end,
        updated_at = now()
  returning percentage into saved_percentage;
  return saved_percentage;
end;
$$;
revoke all on function public.set_my_meeting_fill_progress(numeric) from public;
grant execute on function public.set_my_meeting_fill_progress(numeric) to authenticated;

create or replace function public.admin_set_meeting_fill_progress(
  requested_profile text,
  requested_percentage numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  today_date date := public.jakarta_today();
  saved_percentage numeric(5, 2);
begin
  if not public.is_app_admin() then raise exception 'Akses admin diperlukan.'; end if;
  if requested_profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
  if requested_percentage is null or requested_percentage < 0 or requested_percentage > 100 then
    raise exception 'Persentase pengisian harus berada di antara 0 dan 100.';
  end if;
  if not exists (select 1 from public.couple_profiles where profile_name = requested_profile) then
    raise exception 'Akun pemilik profil belum terhubung.';
  end if;

  insert into public.meeting_fill_progress(profile, progress_date, percentage, updated_at)
  values (requested_profile, today_date, requested_percentage, now())
  on conflict (profile) do update
    set progress_date = today_date,
        percentage = case
          when public.meeting_fill_progress.progress_date = today_date
            then greatest(public.meeting_fill_progress.percentage, excluded.percentage)
          else excluded.percentage
        end,
        updated_at = now()
  returning percentage into saved_percentage;
  return saved_percentage;
end;
$$;
revoke all on function public.admin_set_meeting_fill_progress(text, numeric) from public;
grant execute on function public.admin_set_meeting_fill_progress(text, numeric) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'meeting_fill_progress'
     ) then
    alter publication supabase_realtime add table public.meeting_fill_progress;
  end if;
end;
$$;

-- ============================================================================
-- 202610170006_daily_heart_streak_qualification.sql
-- ============================================================================
create table if not exists public.profile_daily_heart_progress (
  profile text not null check (profile in ('Savero', 'Soffie')),
  progress_date date not null,
  percentage numeric(5, 2) not null default 0 check (percentage between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (profile, progress_date)
);

alter table public.profile_daily_heart_progress enable row level security;
revoke all on public.profile_daily_heart_progress from public, anon, authenticated;
grant select on public.profile_daily_heart_progress to authenticated;

drop policy if exists "Couple members can read daily heart progress" on public.profile_daily_heart_progress;
create policy "Couple members can read daily heart progress" on public.profile_daily_heart_progress
  for select to authenticated using (public.is_couple_member());

create or replace function public.set_my_heart_progress(requested_percentage numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  bound_profile text;
  today_date date := public.jakarta_today();
  saved_percentage numeric(5, 2);
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if requested_percentage is null or requested_percentage < 0 or requested_percentage > 100 then
    raise exception 'Persentase hati harus berada di antara 0 dan 100.';
  end if;
  select profile_name into bound_profile
  from public.couple_profiles where user_id = auth.uid();
  if bound_profile is null then raise exception 'Pilih profil akun terlebih dahulu.'; end if;

  insert into public.profile_daily_heart_progress(profile, progress_date, percentage, updated_at)
  values (bound_profile, today_date, requested_percentage, now())
  on conflict (profile, progress_date) do update
    set percentage = greatest(public.profile_daily_heart_progress.percentage, excluded.percentage),
        updated_at = now()
  returning percentage into saved_percentage;

  insert into public.profile_heart_progress(profile, percentage, updated_at)
  values (bound_profile, requested_percentage, now())
  on conflict (profile) do update
    set percentage = greatest(public.profile_heart_progress.percentage, excluded.percentage),
        updated_at = now();
  return saved_percentage;
end;
$$;
revoke all on function public.set_my_heart_progress(numeric) from public;
grant execute on function public.set_my_heart_progress(numeric) to authenticated;

create or replace function public.admin_set_profile_heart_progress(
  requested_profile text,
  requested_percentage numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  today_date date := public.jakarta_today();
  saved_percentage numeric(5, 2);
begin
  if not public.is_app_admin() then raise exception 'Akses admin diperlukan.'; end if;
  if requested_profile not in ('Savero', 'Soffie') then raise exception 'Profil tidak valid.'; end if;
  if requested_percentage is null or requested_percentage < 0 or requested_percentage > 100 then
    raise exception 'Persentase hati harus berada di antara 0 dan 100.';
  end if;
  if not exists (select 1 from public.couple_profiles where profile_name = requested_profile) then
    raise exception 'Akun pemilik profil belum terhubung.';
  end if;

  insert into public.profile_daily_heart_progress(profile, progress_date, percentage, updated_at)
  values (requested_profile, today_date, requested_percentage, now())
  on conflict (profile, progress_date) do update
    set percentage = greatest(public.profile_daily_heart_progress.percentage, excluded.percentage),
        updated_at = now()
  returning percentage into saved_percentage;

  insert into public.profile_heart_progress(profile, percentage, updated_at)
  values (requested_profile, requested_percentage, now())
  on conflict (profile) do update
    set percentage = greatest(public.profile_heart_progress.percentage, excluded.percentage),
        updated_at = now();
  return saved_percentage;
end;
$$;
revoke all on function public.admin_set_profile_heart_progress(text, numeric) from public;
grant execute on function public.admin_set_profile_heart_progress(text, numeric) to authenticated;

create or replace function public.restore_couple_streak()
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  today_date date := public.jakarta_today();
  missed date := public.jakarta_today() - 1;
  qualified_profile_count integer;
begin
  if auth.uid() is null or not public.is_couple_member() then raise exception 'Akun pasangan diperlukan.'; end if;
  perform pg_advisory_xact_lock(hashtext('couple_streak_restore'));
  if exists (select 1 from public.streak_restores where restored_at > now() - interval '7 days') then
    raise exception 'Pemulihan streak hanya tersedia sekali dalam 7 hari.';
  end if;
  if exists (select 1 from public.streak_restores where missed_date = missed) then
    raise exception 'Tanggal ini sudah dipulihkan.';
  end if;

  select count(distinct d.profile) into qualified_profile_count
  from public.daily_checkins d
  join public.profile_daily_heart_progress h
    on h.profile = d.profile and h.progress_date = d.log_date and h.percentage >= 100
  where d.log_date = today_date - 2;
  if qualified_profile_count < 2
     and not exists (select 1 from public.streak_restores where missed_date = today_date - 2) then
    raise exception 'Streak sebelumnya sudah terputus; hari sebelum kemarin belum memenuhi syarat.';
  end if;

  insert into public.streak_restores(missed_date, restored_by) values (missed, auth.uid());
  return missed;
end;
$$;
revoke all on function public.restore_couple_streak() from public;
grant execute on function public.restore_couple_streak() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'profile_daily_heart_progress'
     ) then
    alter publication supabase_realtime add table public.profile_daily_heart_progress;
  end if;
end;
$$;

-- ============================================================================
-- 202610170007_shared_tmdb_catalog.sql
-- ============================================================================
create table if not exists public.shared_media_catalog (
  kind text not null check (kind in ('movie', 'tv', 'person')),
  tmdb_id bigint not null check (tmdb_id > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  primary key (kind, tmdb_id),
  check (payload->>'tmdbId' = tmdb_id::text)
);

alter table public.shared_media_catalog enable row level security;
revoke all on public.shared_media_catalog from public, anon;
grant select, insert, update, delete on public.shared_media_catalog to authenticated;

drop policy if exists "Couple members read shared media catalog" on public.shared_media_catalog;
create policy "Couple members read shared media catalog"
  on public.shared_media_catalog for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add shared media" on public.shared_media_catalog;
create policy "Couple members add shared media"
  on public.shared_media_catalog for insert to authenticated
  with check (
    public.is_couple_member()
  );

drop policy if exists "Couple members update shared media" on public.shared_media_catalog;
create policy "Couple members update shared media"
  on public.shared_media_catalog for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove shared media" on public.shared_media_catalog;
create policy "Couple members remove shared media"
  on public.shared_media_catalog for delete to authenticated
  using (public.is_couple_member());

create or replace function public.enforce_shared_media_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_couple_member() then
    raise exception 'Akses akun pasangan diperlukan.';
  end if;

  if new.payload->>'tmdbId' is distinct from new.tmdb_id::text then
    raise exception 'ID TMDB pada metadata tidak cocok.';
  end if;

  if tg_op = 'INSERT' then
    null;
  elsif new.kind is distinct from old.kind
     or new.tmdb_id is distinct from old.tmdb_id then
    raise exception 'Identitas katalog bersama tidak dapat diubah.';
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists shared_media_identity_guard on public.shared_media_catalog;
create trigger shared_media_identity_guard
  before insert or update on public.shared_media_catalog
  for each row execute function public.enforce_shared_media_identity();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'shared_media_catalog'
     ) then
    alter publication supabase_realtime add table public.shared_media_catalog;
  end if;
end;
$$;

-- ============================================================================
-- 202610170008_shared_memory_pins.sql
-- ============================================================================
create table if not exists public.memory_pins (
  id text primary key,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users(id),
  check (payload->>'id' = id)
);

alter table public.memory_pins enable row level security;
revoke all on public.memory_pins from public, anon;
grant select, insert, update, delete on public.memory_pins to authenticated;

drop policy if exists "Couple members read memory pins" on public.memory_pins;
create policy "Couple members read memory pins"
  on public.memory_pins for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add memory pins" on public.memory_pins;
create policy "Couple members add memory pins"
  on public.memory_pins for insert to authenticated
  with check (public.is_couple_member());

drop policy if exists "Couple members update memory pins" on public.memory_pins;
create policy "Couple members update memory pins"
  on public.memory_pins for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove memory pins" on public.memory_pins;
create policy "Couple members remove memory pins"
  on public.memory_pins for delete to authenticated
  using (public.is_couple_member());

drop trigger if exists memory_pin_identity_guard on public.memory_pins;

insert into public.memory_pins (id, payload)
values
  ('pin-1', $json${"id":"pin-1","title":"Pertemuan Pertama: Mie Gacoan","date":"2026-03-24","time":"20:15","description":"Pertemuan awal cerita kita berdua. Suasana ramai Mie Gacoan Semarang dengan tawa dan obrolan pertama yang tidak terlupakan.","photos":["https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"],"rating":5,"tags":["Pertama Kali","Mie Gacoan","Awal Cerita","Semarang"],"category":"restoran","lat":-7.004128,"lng":110.419234,"mapUrl":"https://maps.app.goo.gl/YVWJqrZoqhJp6ZXs5?g_st=iw","status":"visited","addedBy":"Berdua","isSensitive":false}$json$::jsonb),
  ('pin-2', $json${"id":"pin-2","title":"Pindah Ngobrol: Kafe Dekat Unika","date":"2026-03-25","time":"01:30","description":"Melanjutkan obrolan sampai dini hari di kafe hangat dekat kampus Unika Soegijapranata Bendan Dhuwur. Kopi pertama dan percakapan mendalam.","photos":["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"],"rating":5,"tags":["Kafe Unika","Dini Hari","Kopi","Ngobrol Santai"],"category":"kafe","lat":-7.018241,"lng":110.407632,"mapUrl":"https://maps.app.goo.gl/hUEKGe5DZ5jh51fz9?g_st=iw","status":"visited","addedBy":"Berdua","isSensitive":false}$json$::jsonb),
  ('pin-3', $json${"id":"pin-3","title":"Kencan Berdua Pertama: KONICIPICIP Taichan Pleburan","date":"2026-08-26","time":"23:23","description":"Pertama kali resmi keluar berdua! Menikmati sate taichan gurih pedas di Pleburan jam 23.23 malam. Titik tolak hari jadian kita yang penuh debar.","photos":["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80","https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80"],"rating":5,"tags":["Kencan Pertama","Hari Jadian","Taichan Pleburan","Malam Romantis"],"category":"restoran","lat":-6.9957834,"lng":110.423215,"mapUrl":"http://google.com/maps/place/KONICIPICIP+sate+taichan+semarang+PLEBURAN/@-6.9957834,110.423215,17z/data=!3m1!4b1!4m6!3m5!1s0x2e708b8a726ddc57:0x4111b05b0bbccff1!8m2!3d-6.9957834!4d110.423215!16s%2Fg%2F11jjpqjcpp","status":"visited","addedBy":"Berdua","isSensitive":false}$json$::jsonb),
  ('pin-4', $json${"id":"pin-4","title":"Night Ride: Jalan Baru Jangli – Undip Sampai Subuh","date":"2026-08-27","time":"05:38","description":"Menyusuri jalanan malam Semarang dari Jangli sampai tembusan kampus Tembalang Undip. Angin dingin, jalan sepi, dan pemandangan sunrise fajar jam 05.38 pagi.","photos":["https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80"],"rating":5,"tags":["Night Ride","Jangli-Undip","Subuh","Sunrise","Rute Spesial"],"category":"jalan","lat":-7.0375,"lng":110.4335,"mapUrl":"https://maps.google.com/?q=-7.0375,110.4335","status":"visited","addedBy":"Berdua","isSensitive":false,"isRoute":true,"routeCoords":[[-7.025,110.428],[-7.031,110.431],[-7.0375,110.4335],[-7.044,110.437],[-7.052,110.441]]}$json$::jsonb),
  ('pin-5', $json${"id":"pin-5","title":"Menginap Pertama: Alam Indah Hotel Gombel","date":"2026-09-06","time":"02:00","description":"Motel pertama kita di perbukitan Gombel, Jl. Setia Budi No. 12, Gombel, Ngesrep Banyumanik (~200m dari Gombel Golf Course). View bukit Semarang malam hari dan kehangatan privat berdua.","photos":["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"],"rating":5,"tags":["Menginap Pertama","Gombel","Privat","Malam Berdua"],"category":"motel","lat":-7.0289,"lng":110.4245,"mapUrl":"https://www.google.com/maps/search/?api=1&query=Alam+Indah+Hotel+Gombel+Semarang","status":"visited","addedBy":"Berdua","isSensitive":true}$json$::jsonb),
  ('pin-6', $json${"id":"pin-6","title":"Rumah Savero","date":"2026-04-10","time":"14:00","description":"Rumah Savero di Semarang. Ruang hangat keluarga dan tempat istirahat anak Hukum UNNES.","photos":["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"],"rating":5,"tags":["Rumah Savero","Keluarga","Semarang"],"category":"rumah","lat":-7.0012,"lng":110.395,"mapUrl":"https://share.google/z1owJXRhPZkB6OMHC","status":"visited","addedBy":"Savero","isSensitive":true}$json$::jsonb),
  ('pin-7', $json${"id":"pin-7","title":"Rumah Soffie","date":"2026-04-18","time":"16:00","description":"Rumah Soffie di Semarang. Tempat penuh kenyamanan bidadari Keperawatan UNDIP.","photos":["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],"rating":5,"tags":["Rumah Soffie","Keluarga","Semarang"],"category":"rumah","lat":-6.988,"lng":110.435,"mapUrl":"https://maps.app.goo.gl/zEY72KjjhbJMTxPh8?g_st=iw","status":"visited","addedBy":"Soffie","isSensitive":true}$json$::jsonb),
  ('pin-8', $json${"id":"pin-8","title":"Kos Soffie: Jalan Turus Asri III","date":"2026-05-02","time":"19:00","description":"Kos Soffie di dekat kampus Undip Tembalang. Tempat singgah tugas stase keperawatan dan tempat jemputan Savero.","photos":["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],"rating":5,"tags":["Kos Soffie","Tembalang","UNDIP","Turus Asri"],"category":"kos","lat":-7.057831,"lng":110.44791,"mapUrl":"https://maps.apple.com/?ll=-7.057831,110.447910&q=Jalan%20Turus%20Asri%20III&t=m","status":"visited","addedBy":"Soffie","isSensitive":true}$json$::jsonb)
on conflict (id) do nothing;

create or replace function public.enforce_memory_pin_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_couple_member() then
    raise exception 'Akses akun pasangan diperlukan.';
  end if;
  if new.payload->>'id' is distinct from new.id then
    raise exception 'ID pin pada metadata tidak cocok.';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'ID pin tidak dapat diubah.';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists memory_pin_identity_guard on public.memory_pins;
create trigger memory_pin_identity_guard
  before insert or update on public.memory_pins
  for each row execute function public.enforce_memory_pin_identity();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'memory_pins'
     ) then
    alter publication supabase_realtime add table public.memory_pins;
  end if;
end;
$$;

-- ============================================================================
-- 202610170009_music_library.sql
-- ============================================================================
create table if not exists public.favorite_singers (
  profile text not null check (profile in ('Savero', 'Soffie')),
  artist_mbid text not null check (artist_mbid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  primary key (profile, artist_mbid),
  check (payload->>'profile' = profile),
  check (payload->>'musicBrainzId' = artist_mbid),
  check (jsonb_typeof(payload->'name') = 'string'),
  check (jsonb_typeof(payload->'description') = 'string')
);

alter table public.favorite_singers enable row level security;
revoke all on public.favorite_singers from public, anon;
grant select, insert, update, delete on public.favorite_singers to authenticated;

drop policy if exists "Couple members read favorite singers" on public.favorite_singers;
create policy "Couple members read favorite singers"
  on public.favorite_singers for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Profiles add own favorite singers" on public.favorite_singers;
create policy "Profiles add own favorite singers"
  on public.favorite_singers for insert to authenticated
  with check (
    public.is_couple_member()
    and (
      exists (
        select 1 from public.couple_profiles
        where user_id = auth.uid() and profile_name = favorite_singers.profile
      )
      or (
        public.is_app_admin()
        and exists (select 1 from public.couple_profiles where profile_name = favorite_singers.profile)
      )
    )
  );

drop policy if exists "Profiles update own favorite singers" on public.favorite_singers;
create policy "Profiles update own favorite singers"
  on public.favorite_singers for update to authenticated
  using (
    exists (
      select 1 from public.couple_profiles
      where user_id = auth.uid() and profile_name = favorite_singers.profile
    )
    or (
      public.is_app_admin()
      and exists (select 1 from public.couple_profiles where profile_name = favorite_singers.profile)
    )
  )
  with check (
    exists (
      select 1 from public.couple_profiles
      where user_id = auth.uid() and profile_name = favorite_singers.profile
    )
    or (
      public.is_app_admin()
      and exists (select 1 from public.couple_profiles where profile_name = favorite_singers.profile)
    )
  );

drop policy if exists "Profiles remove own favorite singers" on public.favorite_singers;
create policy "Profiles remove own favorite singers"
  on public.favorite_singers for delete to authenticated
  using (
    exists (
      select 1 from public.couple_profiles
      where user_id = auth.uid() and profile_name = favorite_singers.profile
    )
    or (
      public.is_app_admin()
      and exists (select 1 from public.couple_profiles where profile_name = favorite_singers.profile)
    )
  );

create or replace function public.enforce_favorite_singer_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_couple_member() then
    raise exception 'Akses akun pasangan diperlukan.';
  end if;
  if new.payload->>'profile' is distinct from new.profile
     or new.payload->>'musicBrainzId' is distinct from new.artist_mbid then
    raise exception 'Identitas penyanyi pada metadata tidak cocok.';
  end if;
  if length(trim(new.payload->>'name')) not between 1 and 250
     or length(new.payload->>'description') > 2000 then
    raise exception 'Nama atau deskripsi penyanyi favorit terlalu panjang atau kosong.';
  end if;
  if tg_op = 'UPDATE'
     and (new.profile is distinct from old.profile or new.artist_mbid is distinct from old.artist_mbid) then
    raise exception 'Identitas penyanyi favorit tidak dapat diubah.';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists favorite_singer_identity_guard on public.favorite_singers;
create trigger favorite_singer_identity_guard
  before insert or update on public.favorite_singers
  for each row execute function public.enforce_favorite_singer_identity();

create table if not exists public.musicbrainz_rate_limit (
  singleton boolean primary key default true check (singleton),
  next_request_at timestamptz not null default (clock_timestamp() - interval '1100 milliseconds')
);
insert into public.musicbrainz_rate_limit (singleton)
values (true)
on conflict (singleton) do nothing;
alter table public.musicbrainz_rate_limit enable row level security;
revoke all on public.musicbrainz_rate_limit from public, anon, authenticated;

create or replace function public.reserve_musicbrainz_request()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare scheduled_request_at timestamptz;
begin
  if auth.uid() is null or not public.is_couple_member() then
    raise exception 'Akses akun pasangan diperlukan.';
  end if;
  update public.musicbrainz_rate_limit
     set next_request_at = greatest(clock_timestamp(), next_request_at) + interval '1100 milliseconds'
   where singleton = true
   returning next_request_at - interval '1100 milliseconds' into scheduled_request_at;
  if scheduled_request_at is null then raise exception 'Pembatasan permintaan musik belum siap.'; end if;
  return scheduled_request_at;
end;
$$;
revoke all on function public.reserve_musicbrainz_request() from public, anon;
grant execute on function public.reserve_musicbrainz_request() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'favorite_singers'
     ) then
    alter publication supabase_realtime add table public.favorite_singers;
  end if;
end;
$$;

-- ============================================================================
-- OPTIONAL PROJECT-SPECIFIC SQL (edit values and run separately when needed)
-- ============================================================================
-- Admin enrollment: create the admin Auth user first, replace the email, then
-- run this query separately in SQL Editor.
--
-- insert into public.app_admins (user_id)
-- select id from auth.users
-- where lower(email) = lower('admin@example.com')
-- on conflict (user_id) do nothing;
--
-- Diary cleanup schedule: first deploy cleanup-expired-diary from the CLI,
-- enable pg_cron, pg_net, and Vault in Database > Extensions, and set the
-- CLEANUP_SECRET Edge Function secret. Replace both values below and run
-- these statements separately in SQL Editor. Never commit or share the token.
--
-- select vault.create_secret('https://PROJECT_REF.supabase.co', 'diary_cleanup_project_url');
-- select vault.create_secret('REPLACE_WITH_THE_SAME_RANDOM_CLEANUP_SECRET', 'diary_cleanup_secret');
-- select cron.schedule(
--   'cleanup-expired-diary-every-15-minutes', '*/15 * * * *',
--   $job$ select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'diary_cleanup_project_url') || '/functions/v1/cleanup-expired-diary',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'x-cleanup-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'diary_cleanup_secret')), body := '{}'::jsonb
--   ); $job$
-- );
