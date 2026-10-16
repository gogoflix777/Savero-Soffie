create table if not exists public.memory_pins (
  id text primary key,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users(id),
  check (payload->>'id' = id)
);

alter table public.memory_pins enable row level security;
revoke all on public.memory_pins from public, anon;
grant select, insert, update, delete on public.memory_pins to authenticated;

drop policy if exists "Couple members read memory pins" on public.memory_pins;
create policy "Couple members read memory pins"
  on public.memory_pins for select to authenticated
  using (public.is_couple_member());

drop policy if exists "Couple members add memory pins" on public.memory_pins;
create policy "Couple members add memory pins"
  on public.memory_pins for insert to authenticated
  with check (public.is_couple_member());

drop policy if exists "Couple members update memory pins" on public.memory_pins;
create policy "Couple members update memory pins"
  on public.memory_pins for update to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

drop policy if exists "Couple members remove memory pins" on public.memory_pins;
create policy "Couple members remove memory pins"
  on public.memory_pins for delete to authenticated
  using (public.is_couple_member());

drop trigger if exists memory_pin_identity_guard on public.memory_pins;

insert into public.memory_pins (id, payload)
values
  ('pin-1', $json${"id":"pin-1","title":"Pertemuan Pertama: Mie Gacoan","date":"2026-03-24","time":"20:15","description":"Pertemuan awal cerita kita berdua. Suasana ramai Mie Gacoan Semarang dengan tawa dan obrolan pertama yang tidak terlupakan.","photos":["https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"],"rating":5,"tags":["Pertama Kali","Mie Gacoan","Awal Cerita","Semarang"],"category":"restoran","lat":-7.004128,"lng":110.419234,"mapUrl":"https://maps.app.goo.gl/YVWJqrZoqhJp6ZXs5?g_st=iw","status":"visited","addedBy":"Berdua","isSensitive":false}$json$::jsonb),
  ('pin-2', $json${"id":"pin-2","title":"Pindah Ngobrol: Kafe Dekat Unika","date":"2026-03-25","time":"01:30","description":"Melanjutkan obrolan sampai dini hari di kafe hangat dekat kampus Unika Soegijapranata Bendan Dhuwur. Kopi pertama dan percakapan mendalam.","photos":["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"],"rating":5,"tags":["Kafe Unika","Dini Hari","Kopi","Ngobrol Santai"],"category":"kafe","lat":-7.018241,"lng":110.407632,"mapUrl":"https://maps.app.goo.gl/hUEKGe5DZ5jh51fz9?g_st=iw","status":"visited","addedBy":"Berdua","isSensitive":false}$json$::jsonb),
  ('pin-3', $json${"id":"pin-3","title":"Kencan Berdua Pertama: KONICIPICIP Taichan Pleburan","date":"2026-08-26","time":"23:23","description":"Pertama kali resmi keluar berdua! Menikmati sate taichan gurih pedas di Pleburan jam 23.23 malam. Titik tolak hari jadian kita yang penuh debar.","photos":["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80","https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80"],"rating":5,"tags":["Kencan Pertama","Hari Jadian","Taichan Pleburan","Malam Romantis"],"category":"restoran","lat":-6.9957834,"lng":110.423215,"mapUrl":"http://google.com/maps/place/KONICIPICIP+sate+taichan+semarang+PLEBURAN/@-6.9957834,110.423215,17z/data=!3m1!4b1!4m6!3m5!1s0x2e708b8a726ddc57:0x4111b05b0bbccff1!8m2!3d-6.9957834!4d110.423215!16s%2Fg%2F11jjpqjcpp","status":"visited","addedBy":"Berdua","isSensitive":false}$json$::jsonb),
  ('pin-4', $json${"id":"pin-4","title":"Night Ride: Jalan Baru Jangli – Undip Sampai Subuh","date":"2026-08-27","time":"05:38","description":"Menyusuri jalanan malam Semarang dari Jangli sampai tembusan kampus Tembalang Undip. Angin dingin, jalan sepi, dan pemandangan sunrise fajar jam 05.38 pagi.","photos":["https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80"],"rating":5,"tags":["Night Ride","Jangli-Undip","Subuh","Sunrise","Rute Spesial"],"category":"jalan","lat":-7.0375,"lng":110.4335,"mapUrl":"https://maps.google.com/?q=-7.0375,110.4335","status":"visited","addedBy":"Berdua","isSensitive":false,"isRoute":true,"routeCoords":[[-7.025,110.428],[-7.031,110.431],[-7.0375,110.4335],[-7.044,110.437],[-7.052,110.441]]}$json$::jsonb),
  ('pin-5', $json${"id":"pin-5","title":"Menginap Pertama: Alam Indah Hotel Gombel","date":"2026-09-06","time":"02:00","description":"Motel pertama kita di perbukitan Gombel, Jl. Setia Budi No. 12, Gombel, Ngesrep Banyumanik (~200m dari Gombel Golf Course). View bukit Semarang malam hari dan kehangatan privat berdua.","photos":["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"],"rating":5,"tags":["Menginap Pertama","Gombel","Privat","Malam Berdua"],"category":"motel","lat":-7.0289,"lng":110.4245,"mapUrl":"https://www.google.com/maps/search/?api=1&query=Alam+Indah+Hotel+Gombel+Semarang","status":"visited","addedBy":"Berdua","isSensitive":true}$json$::jsonb),
  ('pin-6', $json${"id":"pin-6","title":"Rumah Savero","date":"2026-04-10","time":"14:00","description":"Rumah Savero di Semarang. Ruang hangat keluarga dan tempat istirahat anak Hukum UNNES.","photos":["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"],"rating":5,"tags":["Rumah Savero","Keluarga","Semarang"],"category":"rumah","lat":-7.0012,"lng":110.395,"mapUrl":"https://share.google/z1owJXRhPZkB6OMHC","status":"visited","addedBy":"Savero","isSensitive":true}$json$::jsonb),
  ('pin-7', $json${"id":"pin-7","title":"Rumah Soffie","date":"2026-04-18","time":"16:00","description":"Rumah Soffie di Semarang. Tempat penuh kenyamanan bidadari Keperawatan UNDIP.","photos":["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],"rating":5,"tags":["Rumah Soffie","Keluarga","Semarang"],"category":"rumah","lat":-6.988,"lng":110.435,"mapUrl":"https://maps.app.goo.gl/zEY72KjjhbJMTxPh8?g_st=iw","status":"visited","addedBy":"Soffie","isSensitive":true}$json$::jsonb),
  ('pin-8', $json${"id":"pin-8","title":"Kos Soffie: Jalan Turus Asri III","date":"2026-05-02","time":"19:00","description":"Kos Soffie di dekat kampus Undip Tembalang. Tempat singgah tugas stase keperawatan dan tempat jemputan Savero.","photos":["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],"rating":5,"tags":["Kos Soffie","Tembalang","UNDIP","Turus Asri"],"category":"kos","lat":-7.057831,"lng":110.44791,"mapUrl":"https://maps.apple.com/?ll=-7.057831,110.447910&q=Jalan%20Turus%20Asri%20III&t=m","status":"visited","addedBy":"Soffie","isSensitive":true}$json$::jsonb)
on conflict (id) do nothing;

create or replace function public.enforce_memory_pin_identity()
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
    raise exception 'ID pin pada metadata tidak cocok.';
  end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'ID pin tidak dapat diubah.';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists memory_pin_identity_guard on public.memory_pins;
create trigger memory_pin_identity_guard
  before insert or update on public.memory_pins
  for each row execute function public.enforce_memory_pin_identity();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'memory_pins'
     ) then
    alter publication supabase_realtime add table public.memory_pins;
  end if;
end;
$$;
