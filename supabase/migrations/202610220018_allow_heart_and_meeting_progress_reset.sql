-- Migration: 202610220018_allow_heart_and_meeting_progress_reset.sql
-- Description: Allow resetting heart progress and meeting fill progress to 0% (e.g. hammer smash / leak mechanic)
-- Previously, greatest(...) always prevented reducing the percentage below its historical max.

-- 1. Heart Progress: set_my_heart_progress
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
    set percentage = case
          when excluded.percentage <= 0 then 0
          else greatest(public.profile_daily_heart_progress.percentage, excluded.percentage)
        end,
        updated_at = now()
  returning percentage into saved_percentage;

  insert into public.profile_heart_progress(profile, percentage, updated_at)
  values (bound_profile, requested_percentage, now())
  on conflict (profile) do update
    set percentage = case
          when excluded.percentage <= 0 then 0
          else greatest(public.profile_heart_progress.percentage, excluded.percentage)
        end,
        updated_at = now();

  return saved_percentage;
end;
$$;
revoke all on function public.set_my_heart_progress(numeric) from public;
grant execute on function public.set_my_heart_progress(numeric) to authenticated;

-- 2. Heart Progress: admin_set_profile_heart_progress
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
    set percentage = case
          when excluded.percentage <= 0 then 0
          else greatest(public.profile_daily_heart_progress.percentage, excluded.percentage)
        end,
        updated_at = now()
  returning percentage into saved_percentage;

  insert into public.profile_heart_progress(profile, percentage, updated_at)
  values (requested_profile, requested_percentage, now())
  on conflict (profile) do update
    set percentage = case
          when excluded.percentage <= 0 then 0
          else greatest(public.profile_heart_progress.percentage, excluded.percentage)
        end,
        updated_at = now();

  return saved_percentage;
end;
$$;
revoke all on function public.admin_set_profile_heart_progress(text, numeric) from public;
grant execute on function public.admin_set_profile_heart_progress(text, numeric) to authenticated;

-- 3. Meeting Fill Progress: set_my_meeting_fill_progress
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
          when excluded.percentage <= 0 then 0
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

-- 4. Meeting Fill Progress: admin_set_meeting_fill_progress
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
          when excluded.percentage <= 0 then 0
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

