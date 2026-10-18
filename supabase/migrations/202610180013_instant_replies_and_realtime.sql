-- Migration 013: Instagram Instant replies, full replica identities, and realtime publications

-- 1. Table for Instagram Instant replies between Savero and Soffie
create table if not exists public.daily_checkin_replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_profile text not null check (author_profile in ('Savero', 'Soffie')),
  target_profile text not null check (target_profile in ('Savero', 'Soffie')),
  text text not null check (char_length(trim(text)) between 1 and 280),
  emoji text,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_checkin_replies_created_at
  on public.daily_checkin_replies(created_at desc);

create index if not exists idx_daily_checkin_replies_target
  on public.daily_checkin_replies(target_profile, created_at desc);

-- RLS for instant replies
alter table public.daily_checkin_replies enable row level security;

drop policy if exists "Couple members can read instant replies" on public.daily_checkin_replies;
create policy "Couple members can read instant replies"
  on public.daily_checkin_replies
  for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members can create instant replies" on public.daily_checkin_replies;
create policy "Couple members can create instant replies"
  on public.daily_checkin_replies
  for insert to authenticated
  with check (public.is_couple_member());

drop policy if exists "Authors or admin can delete instant replies" on public.daily_checkin_replies;
create policy "Authors or admin can delete instant replies"
  on public.daily_checkin_replies
  for delete to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

-- Enforce author_profile matches user unless admin
create or replace function public.enforce_reply_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu.';
  end if;

  if not public.is_couple_member() then
    raise exception 'Akses ditolak: Hanya pasangan atau admin yang dapat mengirim balasan.';
  end if;

  if public.is_app_admin() then
    if new.user_id is null then
      new.user_id := auth.uid();
    end if;
    return new;
  end if;

  new.user_id := auth.uid();
  if not exists (
    select 1 from public.couple_profiles
    where user_id = auth.uid() and profile_name = new.author_profile
  ) then
    raise exception 'Akses ditolak: Profil pengirim tidak cocok dengan akun login.';
  end if;

  return new;
end;
$$;

drop trigger if exists reply_identity_guard on public.daily_checkin_replies;
create trigger reply_identity_guard
  before insert or update on public.daily_checkin_replies
  for each row execute function public.enforce_reply_identity();

grant select, insert, delete on public.daily_checkin_replies to authenticated;

-- 2. Enable REPLICA IDENTITY FULL for complete postgres_changes payloads
alter table public.daily_checkins replica identity full;
alter table public.meeting_confirmations replica identity full;
alter table public.streak_restores replica identity full;
alter table public.daily_checkin_replies replica identity full;

-- 3. Register missing daily tables and replies table to supabase_realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'daily_checkins'
    ) then
      alter publication supabase_realtime add table public.daily_checkins;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'meeting_confirmations'
    ) then
      alter publication supabase_realtime add table public.meeting_confirmations;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'streak_restores'
    ) then
      alter publication supabase_realtime add table public.streak_restores;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'daily_checkin_replies'
    ) then
      alter publication supabase_realtime add table public.daily_checkin_replies;
    end if;
  end if;
end;
$$;

-- 4. Increase storage bucket file size limit for high-resolution instant snapshots (5 MB)
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/webp', 'image/png', 'image/jpeg']
where id = 'daily-diary';
