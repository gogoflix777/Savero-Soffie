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
