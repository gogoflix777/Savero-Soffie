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
