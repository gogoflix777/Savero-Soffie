create table if not exists public.shared_media_catalog (
  kind text not null check (kind in ('movie', 'tv', 'person')),
  tmdb_id bigint not null check (tmdb_id > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  primary key (kind, tmdb_id),
  check (payload->>'tmdbId' = tmdb_id::text)
);

alter table public.shared_media_catalog enable row level security;
revoke all on public.shared_media_catalog from public, anon;
grant select, insert, update, delete on public.shared_media_catalog to authenticated;

drop policy if exists "Couple members read shared media catalog" on public.shared_media_catalog;
create policy "Couple members read shared media catalog"
  on public.shared_media_catalog for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add shared media" on public.shared_media_catalog;
create policy "Couple members add shared media"
  on public.shared_media_catalog for insert to authenticated
  with check (
    public.is_couple_member()
  );

drop policy if exists "Couple members update shared media" on public.shared_media_catalog;
create policy "Couple members update shared media"
  on public.shared_media_catalog for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove shared media" on public.shared_media_catalog;
create policy "Couple members remove shared media"
  on public.shared_media_catalog for delete to authenticated
  using (public.is_couple_member());

create or replace function public.enforce_shared_media_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_couple_member() then
    raise exception 'Akses akun pasangan diperlukan.';
  end if;

  if new.payload->>'tmdbId' is distinct from new.tmdb_id::text then
    raise exception 'ID TMDB pada metadata tidak cocok.';
  end if;

  if tg_op = 'INSERT' then
    null;
  elsif new.kind is distinct from old.kind
     or new.tmdb_id is distinct from old.tmdb_id then
    raise exception 'Identitas katalog bersama tidak dapat diubah.';
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists shared_media_identity_guard on public.shared_media_catalog;
create trigger shared_media_identity_guard
  before insert or update on public.shared_media_catalog
  for each row execute function public.enforce_shared_media_identity();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'shared_media_catalog'
     ) then
    alter publication supabase_realtime add table public.shared_media_catalog;
  end if;
end;
$$;
