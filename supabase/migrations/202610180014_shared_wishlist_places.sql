-- Migration 014: Shared Wishlist Places for Savero and Soffie

create table if not exists public.wishlist_places (
  id text primary key,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users(id),
  check (payload->>'id' = id)
);

alter table public.wishlist_places enable row level security;
revoke all on public.wishlist_places from public, anon;
grant select, insert, update, delete on public.wishlist_places to authenticated;

drop policy if exists "Couple members read wishlist places" on public.wishlist_places;
create policy "Couple members read wishlist places"
  on public.wishlist_places for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add wishlist places" on public.wishlist_places;
create policy "Couple members add wishlist places"
  on public.wishlist_places for insert to authenticated
  with check (public.is_couple_member());

drop policy if exists "Couple members update wishlist places" on public.wishlist_places;
create policy "Couple members update wishlist places"
  on public.wishlist_places for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove wishlist places" on public.wishlist_places;
create policy "Couple members remove wishlist places"
  on public.wishlist_places for delete to authenticated
  using (public.is_couple_member());

create or replace function public.enforce_wishlist_place_identity()
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
    raise exception 'ID wishlist tempat pada metadata tidak cocok.';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'ID wishlist tempat tidak dapat diubah.';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists wishlist_place_identity_guard on public.wishlist_places;
create trigger wishlist_place_identity_guard
  before insert or update on public.wishlist_places
  for each row execute function public.enforce_wishlist_place_identity();

-- Enable full replica identity for realtime
alter table public.wishlist_places replica identity full;

-- Register table to supabase_realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'wishlist_places'
     ) then
    alter publication supabase_realtime add table public.wishlist_places;
  end if;
end;
$$;

-- Seed default initial wishlist places
insert into public.wishlist_places (id, payload)
values
  ('wplace-1', $json${"id":"wplace-1","name":"Kofitiere Semarang","category":"kafe","area":"Peleburan / Erlangga","budgetEstimate":"sedang","priority":"tinggi","requestedBy":"Soffie","notes":"Matcha latte-nya terkenal enak dan suasananya teduh buat nugas berdua.","tags":["Matcha","Nugas","Cozy"],"createdAt":"2026-09-02","isVisited":false}$json$::jsonb),
  ('wplace-2', $json${"id":"wplace-2","name":"Spiegel Bar & Bistro Kota Lama","category":"restoran","area":"Kota Lama Semarang","budgetEstimate":"mewah","priority":"tinggi","requestedBy":"Savero","notes":"Bangunan heritage Eropa yang estetik buat kencan formal atau perayaan milestone.","tags":["Heritage","Kota Lama","Fine Dining"],"createdAt":"2026-09-05","isVisited":false}$json$::jsonb),
  ('wplace-3', $json${"id":"wplace-3","name":"Pantai Marina Sunset","category":"pantai","area":"Tawangsari Semarang Barat","budgetEstimate":"murah","priority":"sedang","requestedBy":"Berdua","notes":"Duduk di tanggul sore-sore sambil makan jagung bakar melihat matahari terbenam.","tags":["Sunset","Angin Laut","Santai"],"createdAt":"2026-09-12","isVisited":false}$json$::jsonb),
  ('wplace-4', $json${"id":"wplace-4","name":"XXI The Premiere DP Mall","category":"bioskop","area":"Jl. Pemuda Semarang","budgetEstimate":"mewah","priority":"tinggi","requestedBy":"Berdua","notes":"Nonton film terbaru dengan sofa rebah empuk dan selimut tebal berdua.","tags":["Cinema","Comfort","Premiere"],"createdAt":"2026-09-15","isVisited":false}$json$::jsonb)
on conflict (id) do nothing;
