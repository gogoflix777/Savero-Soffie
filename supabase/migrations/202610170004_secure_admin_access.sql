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
