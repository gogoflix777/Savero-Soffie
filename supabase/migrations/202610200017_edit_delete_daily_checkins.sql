-- Migration 017: Allow edit and delete for daily checkins (Instant), storage deletion, and RPC helpers

-- 1. Grant delete on daily_checkins to authenticated
grant delete on public.daily_checkins to authenticated;

-- 2. Update trigger enforce_daily_checkin_identity so updates to past checkins are allowed
create or replace function public.enforce_daily_checkin_identity()
returns trigger language plpgsql security definer set search_path = public as $$
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

  -- Only check jakarta_today on INSERT; allow UPDATE for existing checkins
  if tg_op = 'INSERT' and new.log_date <> public.jakarta_today() then
    raise exception 'Log hanya dapat dicatat untuk tanggal hari ini.';
  end if;

  if tg_op = 'UPDATE' then
    if old.user_id <> new.user_id or old.profile <> new.profile or old.log_date <> new.log_date then
      raise exception 'Identitas dan tanggal log tidak dapat diubah.';
    end if;
    new.created_at := old.created_at;
    if new.photo_path is distinct from old.photo_path then
      new.photo_uploaded_at := case when new.photo_path is null then null else now() end;
    else
      new.photo_uploaded_at := old.photo_uploaded_at;
    end if;
  else
    new.photo_uploaded_at := case when new.photo_path is null then null else now() end;
  end if;

  new.updated_at := now();
  new.expires_at := now() + interval '100 years';
  return new;
end;
$$;

-- 3. RLS update and delete policies on public.daily_checkins
drop policy if exists "Users edit their own checkin" on public.daily_checkins;
create policy "Users edit their own checkin" on public.daily_checkins
  for update to authenticated
  using (
    user_id = auth.uid()
    or public.is_app_admin()
    or exists (
      select 1 from public.couple_profiles cp
      where cp.user_id = auth.uid() and cp.profile_name = daily_checkins.profile
    )
  )
  with check (
    user_id = auth.uid()
    or public.is_app_admin()
    or exists (
      select 1 from public.couple_profiles cp
      where cp.user_id = auth.uid() and cp.profile_name = daily_checkins.profile
    )
  );

drop policy if exists "Users delete their own checkin" on public.daily_checkins;
create policy "Users delete their own checkin" on public.daily_checkins
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.is_app_admin()
    or exists (
      select 1 from public.couple_profiles cp
      where cp.user_id = auth.uid() and cp.profile_name = daily_checkins.profile
    )
  );

-- 4. Storage delete policy for daily-diary bucket
drop policy if exists "Users delete own diary photos" on storage.objects;
create policy "Users delete own diary photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'daily-diary' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_app_admin()
      or public.is_couple_member()
    )
  );

-- 5. RPC function to safely delete daily checkin
create or replace function public.delete_daily_checkin(checkin_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile text;
  v_photo_path text;
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu.';
  end if;

  select user_id, profile, photo_path into v_user_id, v_profile, v_photo_path
  from public.daily_checkins
  where id = checkin_id;

  if not found then
    return false;
  end if;

  if not (
    v_user_id = auth.uid()
    or public.is_app_admin()
    or exists (
      select 1 from public.couple_profiles
      where user_id = auth.uid() and profile_name = v_profile
    )
  ) then
    raise exception 'Akses ditolak: Hanya pemilik instant atau admin yang dapat menghapus.';
  end if;

  delete from public.daily_checkins where id = checkin_id;
  return true;
end;
$$;
revoke all on function public.delete_daily_checkin(uuid) from public;
grant execute on function public.delete_daily_checkin(uuid) to authenticated;

-- 6. RPC function to safely update daily checkin
create or replace function public.update_daily_checkin(
  p_id uuid,
  p_expression text,
  p_rating smallint,
  p_diary_text text default null,
  p_photo_path text default null
)
returns public.daily_checkins
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.daily_checkins;
  v_user_id uuid;
  v_profile text;
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu.';
  end if;

  select user_id, profile into v_user_id, v_profile
  from public.daily_checkins
  where id = p_id;

  if not found then
    raise exception 'Log instant tidak ditemukan.';
  end if;

  if not (
    v_user_id = auth.uid()
    or public.is_app_admin()
    or exists (
      select 1 from public.couple_profiles
      where user_id = auth.uid() and profile_name = v_profile
    )
  ) then
    raise exception 'Akses ditolak: Hanya pemilik instant atau admin yang dapat mengubah.';
  end if;

  update public.daily_checkins
  set
    expression = p_expression,
    rating = p_rating,
    diary_text = p_diary_text,
    photo_path = coalesce(p_photo_path, photo_path),
    updated_at = now()
  where id = p_id
  returning * into v_row;

  return v_row;
end;
$$;
revoke all on function public.update_daily_checkin(uuid, text, smallint, text, text) from public;
grant execute on function public.update_daily_checkin(uuid, text, smallint, text, text) to authenticated;
