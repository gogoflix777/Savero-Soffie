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
