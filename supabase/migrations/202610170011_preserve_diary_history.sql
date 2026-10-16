-- Keep one editable check-in per profile and date while retaining past diary content.
alter table public.daily_checkins
  add column if not exists updated_at timestamptz;

alter table public.daily_checkins
  add column if not exists photo_uploaded_at timestamptz;

do $$
begin
  execute 'alter table public.daily_checkins disable trigger daily_checkin_identity_guard';

  update public.daily_checkins
  set updated_at = created_at
  where updated_at is null;

  execute 'alter table public.daily_checkins alter column updated_at set default now(), alter column updated_at set not null';

  update public.daily_checkins
  set photo_uploaded_at = created_at
  where photo_path is not null and photo_uploaded_at is null;

  update public.daily_checkins
  set expires_at = now() + interval '100 years';

  execute 'alter table public.daily_checkins enable trigger daily_checkin_identity_guard';
exception when others then
  execute 'alter table public.daily_checkins enable trigger daily_checkin_identity_guard';
  raise;
end;
$$;

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

  if new.log_date <> public.jakarta_today() then raise exception 'Log hanya dapat dicatat untuk tanggal hari ini.'; end if;
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
