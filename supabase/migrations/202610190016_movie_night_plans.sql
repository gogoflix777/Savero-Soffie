-- Migration 016: Movie Night Plans Realtime & Shared Persistence for Savero and Soffie

create table if not exists public.movie_night_plans (
  id text primary key,
  movie_id text,
  movie_title text not null,
  poster_url text,
  scheduled_at timestamptz not null,
  snacks text,
  drinks text,
  planned_by text not null default 'Berdua' check (planned_by in ('Savero', 'Soffie', 'Berdua')),
  confirmed_by_savero boolean not null default false,
  confirmed_by_soffie boolean not null default false,
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'completed', 'cancelled')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users(id),
  check (payload->>'id' = id)
);

alter table public.movie_night_plans enable row level security;
revoke all on public.movie_night_plans from public, anon;
grant select, insert, update, delete on public.movie_night_plans to authenticated;

drop policy if exists "Couple members read movie night plans" on public.movie_night_plans;
create policy "Couple members read movie night plans"
  on public.movie_night_plans for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add movie night plans" on public.movie_night_plans;
create policy "Couple members add movie night plans"
  on public.movie_night_plans for insert to authenticated
  with check (public.is_couple_member());

drop policy if exists "Couple members update movie night plans" on public.movie_night_plans;
create policy "Couple members update movie night plans"
  on public.movie_night_plans for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove movie night plans" on public.movie_night_plans;
create policy "Couple members remove movie night plans"
  on public.movie_night_plans for delete to authenticated
  using (public.is_couple_member());

create or replace function public.enforce_movie_night_plan_identity()
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
    raise exception 'ID jadwal kencan pada metadata tidak cocok.';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'ID jadwal kencan tidak dapat diubah.';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists movie_night_plan_identity_guard on public.movie_night_plans;
create trigger movie_night_plan_identity_guard
  before insert or update on public.movie_night_plans
  for each row execute function public.enforce_movie_night_plan_identity();

alter table public.movie_night_plans replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'movie_night_plans'
    ) then
      alter publication supabase_realtime add table public.movie_night_plans;
    end if;
  end if;
end;
$$;
