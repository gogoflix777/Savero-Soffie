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
