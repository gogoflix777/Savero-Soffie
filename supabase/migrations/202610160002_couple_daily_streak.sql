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
