-- Migration 015: Shared Flo Cycle and Intimate Records for Savero and Soffie

-- 1. Table: cycle_records
create table if not exists public.cycle_records (
  id text primary key,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users(id),
  check (payload->>'id' = id)
);

alter table public.cycle_records enable row level security;
revoke all on public.cycle_records from public, anon;
grant select, insert, update, delete on public.cycle_records to authenticated;

drop policy if exists "Couple members read cycle records" on public.cycle_records;
create policy "Couple members read cycle records"
  on public.cycle_records for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add cycle records" on public.cycle_records;
create policy "Couple members add cycle records"
  on public.cycle_records for insert to authenticated
  with check (public.is_couple_member());

drop policy if exists "Couple members update cycle records" on public.cycle_records;
create policy "Couple members update cycle records"
  on public.cycle_records for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove cycle records" on public.cycle_records;
create policy "Couple members remove cycle records"
  on public.cycle_records for delete to authenticated
  using (public.is_couple_member());

create or replace function public.enforce_cycle_record_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_couple_member() then
    raise exception 'Akses akun pasangan diperlukan.';
  end if;
  if new.payload->>'id' is distinct from new.id then
    raise exception 'ID siklus pada metadata tidak cocok.';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'ID siklus tidak dapat diubah.';
  end if;
  new.updated_at := now();
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists cycle_record_identity_guard on public.cycle_records;
create trigger cycle_record_identity_guard
  before insert or update on public.cycle_records
  for each row execute function public.enforce_cycle_record_identity();

alter table public.cycle_records replica identity full;

-- 2. Table: intimate_logs
create table if not exists public.intimate_logs (
  id text primary key,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users(id),
  check (payload->>'id' = id)
);

alter table public.intimate_logs enable row level security;
revoke all on public.intimate_logs from public, anon;
grant select, insert, update, delete on public.intimate_logs to authenticated;

drop policy if exists "Couple members read intimate logs" on public.intimate_logs;
create policy "Couple members read intimate logs"
  on public.intimate_logs for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add intimate logs" on public.intimate_logs;
create policy "Couple members add intimate logs"
  on public.intimate_logs for insert to authenticated
  with check (public.is_couple_member());

drop policy if exists "Couple members update intimate logs" on public.intimate_logs;
create policy "Couple members update intimate logs"
  on public.intimate_logs for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove intimate logs" on public.intimate_logs;
create policy "Couple members remove intimate logs"
  on public.intimate_logs for delete to authenticated
  using (public.is_couple_member());

create or replace function public.enforce_intimate_log_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_couple_member() then
    raise exception 'Akses akun pasangan diperlukan.';
  end if;
  if new.payload->>'id' is distinct from new.id then
    raise exception 'ID catatan intim pada metadata tidak cocok.';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'ID catatan intim tidak dapat diubah.';
  end if;
  new.updated_at := now();
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists intimate_log_identity_guard on public.intimate_logs;
create trigger intimate_log_identity_guard
  before insert or update on public.intimate_logs
  for each row execute function public.enforce_intimate_log_identity();

alter table public.intimate_logs replica identity full;

-- 3. Register tables to realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cycle_records'
    ) then
      alter publication supabase_realtime add table public.cycle_records;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'intimate_logs'
    ) then
      alter publication supabase_realtime add table public.intimate_logs;
    end if;
  end if;
end;
$$;

-- 4. Initial historical seed from Flo records (idempotent with on conflict do nothing)
insert into public.cycle_records (id, payload)
values
  ('cycle-2026-09-17', $json${
    "id": "cycle-2026-09-17",
    "startDate": "2026-09-17",
    "endDate": "2026-09-21",
    "cycleLength": 26,
    "periodLength": 5,
    "flow": "sedang",
    "pain": "ringan",
    "mood": "tenang",
    "notes": "Siklus menstruasi tercatat Flo (17-21 September 2026)."
  }$json$::jsonb),
  ('cycle-2026-10-13', $json${
    "id": "cycle-2026-10-13",
    "startDate": "2026-10-13",
    "endDate": "2026-10-17",
    "recordedPeriodEndDate": "2026-10-14",
    "cycleLength": 26,
    "periodLength": 5,
    "flow": "sedang",
    "pain": "ringan",
    "mood": "hangat",
    "notes": "Siklus menstruasi tercatat Flo (13-14 Oktober aktual, 15-17 Oktober prediksi sisa haid)."
  }$json$::jsonb)
on conflict (id) do nothing;

insert into public.intimate_logs (id, payload)
values
  ('intimate-2026-09-06', $json${"id":"intimate-2026-09-06","date":"2026-09-06","time":"21:00","protection":"kondom","protectionIssue":false,"mood":"romantis","notes":"Aktivitas keintiman tercatat di Flo.","createdAt":"2026-09-06T21:00:00Z"}$json$::jsonb),
  ('intimate-2026-09-13', $json${"id":"intimate-2026-09-13","date":"2026-09-13","time":"22:00","protection":"kondom","protectionIssue":false,"mood":"hangat","notes":"Aktivitas keintiman tercatat di Flo.","createdAt":"2026-09-13T22:00:00Z"}$json$::jsonb),
  ('intimate-2026-09-22', $json${"id":"intimate-2026-09-22","date":"2026-09-22","time":"23:00","protection":"kondom","protectionIssue":false,"mood":"romantis","notes":"Aktivitas keintiman tercatat di Flo (masa subur).","createdAt":"2026-09-22T23:00:00Z"}$json$::jsonb),
  ('intimate-2026-09-26', $json${"id":"intimate-2026-09-26","date":"2026-09-26","time":"22:30","protection":"kondom","protectionIssue":false,"mood":"romantis","notes":"Aktivitas keintiman tercatat di Flo (masa subur).","createdAt":"2026-09-26T22:30:00Z"}$json$::jsonb),
  ('intimate-2026-09-28', $json${"id":"intimate-2026-09-28","date":"2026-09-28","time":"23:30","protection":"kondom","protectionIssue":false,"mood":"romantis","notes":"Aktivitas keintiman tercatat di Flo (perkiraan ovulasi).","createdAt":"2026-09-28T23:30:00Z"}$json$::jsonb),
  ('intimate-2026-10-04', $json${"id":"intimate-2026-10-04","date":"2026-10-04","time":"21:30","protection":"kondom","protectionIssue":false,"mood":"hangat","notes":"Aktivitas keintiman tercatat di Flo.","createdAt":"2026-10-04T21:30:00Z"}$json$::jsonb),
  ('intimate-2026-10-07', $json${"id":"intimate-2026-10-07","date":"2026-10-07","time":"22:00","protection":"kondom","protectionIssue":false,"mood":"romantis","notes":"Aktivitas keintiman tercatat di Flo.","createdAt":"2026-10-07T22:00:00Z"}$json$::jsonb),
  ('intimate-2026-10-11', $json${"id":"intimate-2026-10-11","date":"2026-10-11","time":"23:00","protection":"kondom","protectionIssue":false,"mood":"hangat","notes":"Aktivitas keintiman tercatat di Flo.","createdAt":"2026-10-11T23:00:00Z"}$json$::jsonb)
on conflict (id) do nothing;
