# Setup Supabase: akun, check-in, streak, diary, dan konfirmasi bertemu

Fitur check-in ini memakai dua akun Supabase yang berbeda. Satu akun diikat permanen ke Savero dan satu ke Soffie. Setelah masuk pertama kali, pilih profil yang sesuai; pemilih profil biasa akan terkunci. Ini yang membuat streak bersama dan konfirmasi bertemu tidak bisa dipalsukan dengan berganti profil pada satu akun.

Sesi login disimpan di `sessionStorage` per tab browser, bukan cache `localStorage` lintas tab. Tab baru meminta login sendiri; reload pada tab yang sama tetap mempertahankan sesi sampai sesi browser berakhir atau pengguna keluar.

## 1. Siapkan project dan aplikasi

Di Supabase, buka **Project Settings → API** dan salin Project URL serta publishable key (atau anon key lama) ke `.env` di root project:

```env
VITE_SUPABASE_URL="https://PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_PUBLISHABLE_OR_ANON_KEY"
```

Jangan masukkan `service_role` key ke `.env` atau kode browser. Setelah menyimpan `.env`, mulai ulang Vite dengan `Ctrl+C`, lalu `npm run dev`.

### Environment variable saat deploy

File `.env` sengaja masuk `.gitignore`, jadi tidak akan ikut `git push`. Ini mencegah key dan konfigurasi lokal tersebar ke repository. Untuk website hasil build, nilai `.env` harus tersedia **di environment proses build pada penyedia hosting**; file `.env` di komputer lokal tidak otomatis tersedia di website yang sudah ter-deploy.

Di dashboard Cloudflare pada project seperti yang terlihat di tangkapan layar, buka **Settings → Builds** (atau klik **Builds** di daftar navigasi Settings), lalu tambahkan variable di **Build variables and secrets**. Jangan gunakan bagian **Runtime variables and secrets**: project ini hanya menyajikan static assets, dan variable di situ tidak tersedia untuk Worker static-only. Selain itu, variable `VITE_*` harus ada saat build karena nilainya ditanam ke bundle browser.

Tambahkan variable berikut untuk build Production (dan Preview jika digunakan):

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GOOGLE_MAPS_API_KEY
VITE_TMDB_API_KEY
VITE_CARTO_API_KEY
```

Isi value dari konfigurasi project masing-masing, simpan, lalu buka **Deployments** dan jalankan **Retry deployment** untuk deployment Production terbaru (atau push commit baru). Environment variable yang baru diatur hanya dipakai oleh build berikutnya; deployment lama tidak berubah. Untuk hosting lain, atur nama-nama variable yang sama pada build/deployment settings. Jika build dijalankan dari GitHub Actions, pasang nilainya di **Repository Settings → Secrets and variables → Actions**, lalu workflow harus meneruskannya ke langkah build.

Hanya variable dengan awalan `VITE_` yang dimasukkan ke bundle browser. URL Supabase, publishable/anon key, dan key Maps/TMDB yang dipakai browser dapat dilihat oleh pengguna; batasi key provider ke API/domain yang diperlukan dan jangan pernah gunakan `service_role` di sini. Key Gemini adalah rahasia server-side dan dipasang sebagai Supabase Function secret pada bagian Gemini di bawah.

### Aktifkan login dengan Google

1. Di Google Cloud Console, buat atau pilih project, siapkan **OAuth consent screen**, lalu buat OAuth Client ID bertipe **Web application**.
2. Di Supabase buka **Authentication → Providers → Google**, aktifkan provider, lalu salin **Client ID** dan **Client Secret** dari Google Cloud ke kolom Supabase.
3. Salin **Callback URL** yang ditampilkan Supabase. Di Google Cloud, tambahkan URL itu ke **Authorized redirect URIs** pada OAuth client. Callback biasanya berbentuk `https://PROJECT_REF.supabase.co/auth/v1/callback`; gunakan URL persis dari dashboard, bukan alamat aplikasi.
4. Di Supabase buka **Authentication → URL Configuration**. Atur **Site URL** ke alamat aplikasi yang digunakan, lalu tambahkan alamat development `http://localhost:3000/**` serta alamat production aplikasi ke **Redirect URLs**. Alamat production harus memakai domain aplikasi yang sebenarnya.
5. Simpan pengaturan dan mulai ulang aplikasi jika masih berjalan. Pada layar login, klik **Masuk dengan Google**.

Jika pendaftaran publik dimatikan, siapkan akun pengguna lewat **Authentication → Users → Add user** dengan alamat email Google yang akan dipakai. Untuk akun yang sudah ada, gunakan alamat email yang sama dan pastikan email Google terverifikasi agar Supabase dapat menautkan identitasnya ke akun tersebut. Setelah login pertama, pengguna tetap perlu memilih profil Savero atau Soffie yang belum dipasangkan.

## 2. Jalankan SQL

Untuk project Supabase baru, buka file `supabase/SQL_EDITOR_SETUP.sql`, salin seluruh isinya ke **Supabase → SQL Editor → New query**, lalu tekan **Run** satu kali. File tersebut menggabungkan migration 001–009 sesuai urutan dependensinya, termasuk tabel, kebijakan akses, bucket foto, seed pin, dan Realtime.

Jangan jalankan file gabungan ini jika sebagian migration sudah pernah dijalankan. Untuk project yang sudah berisi setup, cocokkan migration yang sudah diterapkan dan jalankan hanya migration yang masih belum diterapkan, satu per satu dari `supabase/migrations/`.

File SQL tidak menjalankan konfigurasi dashboard Authentication, membuat akun pengguna, mendaftarkan akun admin, men-deploy Edge Functions, atau mengisi secret Vault karena semuanya memerlukan pilihan/kredensial khusus project. Lanjutkan langkah-langkah terkait di bawah setelah SQL berhasil.

SQL kedua membuat tabel profil terikat, log harian, pemulihan streak, konfirmasi bertemu, bucket foto privat, RLS, serta RPC pemulihan yang dibatasi satu kali dalam tujuh hari. SQL ketiga membuat progres hati terpisah untuk Savero dan Soffie; akun masing-masing hanya dapat menaikkan progres profil yang telah terikat dengannya.

SQL keempat menambahkan peran admin yang diverifikasi di database. Admin dapat memilih profil Savero atau Soffie dan mengelola check-in, foto diary, konfirmasi bertemu, serta progres hati. Tanpa migration ini, tombol Admin tidak akan tersedia/terverifikasi.

SQL kelima menyimpan progres pengisian hati tahap kedua per profil dan tanggal Jakarta, termasuk RPC khusus admin. Jalankan migration ini agar pengisian kedua bisa dilanjutkan setelah jari dilepas dan otomatis mulai dari nol pada hari berikutnya.

SQL keenam menyimpan progres hati pertama per hari, mengembalikan tampilan hati ke 0% pada hari Jakarta berikutnya, dan mengubah kualifikasi streak: kedua profil harus memiliki check-in dan hati pertama 100% pada tanggal yang sama. Karena progres hati per tanggal belum direkam sebelum migration ini, riwayat streak lama tidak dapat divalidasi ulang; kualifikasi baru mulai tercatat setelah migration diterapkan.

SQL ketujuh membuat katalog film, serial TV, dan aktor bersama yang diambil dari TMDB. Data wishlist, status tontonan, progres serial, dan aktor tersimpan di Supabase sehingga terlihat oleh kedua akun. Akses tabel dibatasi untuk anggota pasangan atau admin yang sudah terverifikasi; migration ini juga mendaftarkan tabel ke `supabase_realtime`. Jalankan setelah migration admin dan migration pasangan.

SQL kedelapan membuat tabel pin peta bersama, mengimpor delapan titik kenangan yang sebelumnya menjadi data awal aplikasi, membatasi akses ke anggota pasangan/admin, dan mengaktifkan Realtime. Setelah migration ini dijalankan, pin dibaca dan disimpan dari Supabase; tambah/edit/hapus pin membutuhkan migration tersebut.

SQL kesembilan membuat daftar penyanyi favorit terpisah untuk profil Savero dan Soffie, dengan akses baca bersama, perubahan yang dibatasi ke pemilik profil/admin, Realtime, dan antrean global untuk mematuhi batas satu permintaan per detik MusicBrainz. Terapkan migration ini setelah migration pasangan/admin.

Setelah SQL Editor setup selesai, buka PowerShell di folder project. CLI perlu login ke akun Supabase terlebih dahulu. Jalankan:

```powershell
npx.cmd supabase login
```

Ikuti prompt CLI. Jika diminta access token, buat token di Supabase Dashboard → Account → Access Tokens lalu tempel langsung ke prompt lokal. Jangan bagikan token di chat, `.env`, atau Git.

Berikutnya, ganti `PROJECT_REF` pada perintah berikut dengan **Project Ref** dari Supabase → Project Settings → General (juga bagian awal URL `https://PROJECT_REF.supabase.co`), lalu hubungkan project satu kali dan deploy fungsi metadata musik:

```powershell
npx.cmd supabase link --project-ref PROJECT_REF
npx.cmd supabase functions deploy musicbrainz
npx.cmd supabase functions deploy google-places
```

Gunakan `npx.cmd` di PowerShell Windows. Perintah ini menjalankan shim Command Prompt dan menghindari error Execution Policy pada `npx.ps1`; tidak perlu mengubah Execution Policy.

Fungsi menggunakan secret `SUPABASE_URL` dan `SUPABASE_ANON_KEY` yang tersedia otomatis pada Supabase Edge Functions. Pencarian rekaman/artis memakai MusicBrainz; sampul album diisi dari Cover Art Archive jika tersedia. Deskripsi lagu dan penyanyi favorit dapat diisi atau diedit manual.

Pencarian Google Places pada website production menggunakan Edge Function `google-places` (middleware proxy di `vite.config.ts` hanya berjalan saat development). Buat key Google Cloud khusus server dengan **Places API (New)** aktif dan API restriction ke Places API, lalu simpan dan deploy:

```powershell
npx.cmd supabase functions deploy google-places
```

Sebelum deploy, tambahkan `GOOGLE_MAPS_API_KEY` pada **Supabase Dashboard → Edge Functions → Secrets**. Jangan gunakan key server tersebut sebagai `VITE_GOOGLE_MAPS_API_KEY`. Untuk Google Maps JavaScript/tiles serta foto Places, tetap gunakan key browser terpisah di environment build hosting dan batasi dengan HTTP referrer/domain serta hanya API yang diperlukan (Maps JavaScript API dan Places API bila dipakai untuk foto). Key Places server hanya disimpan sebagai Supabase secret.

### Secret Gemini untuk membuat surat

Jangan memakai `GEMINI_API_KEY` dari kode browser atau menggantinya menjadi `VITE_GEMINI_API_KEY`; key yang diekspos melalui Vite dapat dibaca oleh siapa pun dari bundle website. Simpan key sebagai secret Supabase, kemudian deploy fungsi yang memanggil Gemini di server:

```powershell
npx.cmd supabase functions deploy generate-love-note
```

Sebelum deploy, tambahkan `GEMINI_API_KEY` pada **Supabase Dashboard → Edge Functions → Secrets**. Fungsi hanya menerima permintaan dari pengguna yang sudah login dan terikat ke profil pasangan. Key tidak dikirim ke browser. Tidak perlu menambahkan Gemini key ke GitHub, `.env` production browser, atau kode aplikasi.

## 3. Buat dua akun dan pasangkan profil

1. Buka **Authentication → Users → Add user**.
2. Buat akun pertama dengan email dan kata sandi untuk Savero, lalu akun kedua untuk Soffie. Gunakan dua alamat email berbeda. Jika ada pilihan **Auto Confirm User**, aktifkan agar tidak perlu verifikasi email saat setup.
3. Di **Authentication → Settings**, matikan public signups setelah akun dibuat supaya orang lain tidak bisa mendaftar dan mengklaim profil yang masih kosong.
4. Berikan kredensial masing-masing secara privat kepada pemilik akun. Jangan memakai satu akun bersama.
5. Jalankan aplikasi dan masuk dengan akun Savero. Saat diminta, pilih **Savero**. Keluar, masuk dengan akun Soffie dan pilih **Soffie**.

Pilihan profil disimpan satu kali oleh database. Jika salah pilih, jangan hapus atau ubah baris database sembarangan; koreksi akun perlu menjaga riwayat agar tidak salah atribusi.

### Buat akun admin terpisah (opsional)

Buat akun admin melalui **Authentication → Users → Add user**. Akun ini tidak perlu mengklaim profil Savero atau Soffie. Setelah migration keempat dijalankan, daftarkan UID akun itu melalui **SQL Editor** dengan mengganti alamat contoh di query berikut:

```sql
insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (user_id) do nothing;
```

Pastikan alamat email cocok dengan akun admin yang dibuat. Untuk memverifikasi pendaftaran di SQL Editor:

```sql
select u.email, a.user_id, a.created_at
from public.app_admins a
join auth.users u on u.id = a.user_id;
```

Jangan memberikan akses admin ke akun Savero/Soffie biasa kecuali memang diperlukan. Status admin hanya dapat diberikan lewat SQL tepercaya, tidak ada tombol di aplikasi yang dapat mendaftarkan dirinya sendiri. Setelah login dengan akun terdaftar, buka **Pengaturan Aplikasi → Akses administrator terverifikasi**, aktifkan Mode Admin, lalu pilih profil dari menu profil.

## 4. Deploy penghapus diary 24 jam

Foto disimpan di bucket privat sebagai WebP persegi yang dikompres browser (maksimum 768×768). Catatan dan foto tersedia selama 24 jam sejak dibuat atau sejak foto diganti. Check-in, tanggal streak, rating, dan ekspresi tetap disimpan setelah teks/foto dibersihkan.

Setelah project di-link pada langkah metadata musik di atas, deploy fungsi cleanup dari PowerShell di folder project:

```powershell
npx.cmd supabase functions deploy cleanup-expired-diary
```

Buat token acak panjang khusus untuk fungsi cleanup, lalu pasang sebagai secret. Jangan gunakan publishable key sebagai token ini:

```powershell
npx.cmd supabase secrets set CLEANUP_SECRET="GANTI_DENGAN_TOKEN_ACAK_PANJANG"
```

URL project dan `SUPABASE_SERVICE_ROLE_KEY` tersedia otomatis untuk Edge Function. Pastikan key service role tidak pernah ditambahkan ke Vite.

### Jadwalkan cleanup setiap 15 menit

Di SQL Editor, aktifkan ekstensi **pg_cron**, **pg_net**, dan **Vault** dari **Database → Extensions**. Simpan URL project dan token cleanup ke Vault melalui SQL berikut, ganti nilai contoh:

```sql
select vault.create_secret('https://PROJECT_REF.supabase.co', 'diary_cleanup_project_url');
select vault.create_secret('GANTI_DENGAN_TOKEN_ACAK_PANJANG_YANG_SAMA', 'diary_cleanup_secret');
```

Lalu jadwalkan pemanggilan (jalankan sekali saja):

```sql
select cron.schedule(
  'cleanup-expired-diary-every-15-minutes',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'diary_cleanup_project_url') || '/functions/v1/cleanup-expired-diary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cleanup-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'diary_cleanup_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Pastikan URL hanya punya satu slash sebelum `/functions`. Cek **Database → Cron Jobs** untuk melihat jadwal. Jangan tempelkan token di chat atau commit ke Git.

## 5. Nyalakan update realtime

Migration dalam SQL Editor setup mendaftarkan tabel-tabel terkait ke `supabase_realtime` jika publication tersedia. Jika Realtime belum aktif atau ada tabel yang belum terdaftar, buka **Database → Publications → supabase_realtime** dan tambahkan `daily_checkins`, `streak_restores`, `meeting_confirmations`, `profile_heart_progress`, `profile_daily_heart_progress`, `meeting_fill_progress`, `shared_media_catalog`, `memory_pins`, dan `favorite_singers`.

## Cara kerja yang perlu diketahui

- Rating diberikan terpisah oleh masing-masing profil, skala 1–5.
- Masing-masing profil memiliki hati tersendiri. Ketuk hati sendiri menambah progres 5%; tekan-tahan mengisi hati pertama. Hati pertama kembali 0% pada hari Jakarta berikutnya. Streak harian memenuhi syarat jika Savero dan Soffie masing-masing memiliki check-in serta hati pertama 100% pada tanggal yang sama.
- Setelah hati pertama penuh, tekan-tahan lagi untuk mengisi hati kedua selama lima detik; progres kedua tersimpan per hari dan dapat dilanjutkan setelah dilepas. Setelah penuh, konfirmasi bertemu tersimpan untuk profil itu. Dalam Mode Admin, check-in/diary, konfirmasi, dan progres hati dapat dikelola untuk profil yang sedang dipilih.
- Pemulihan mengisi tanggal streak yang terlewat tanpa membuat log palsu dari pasangan. Hanya tanggal kemarin yang dapat dipulihkan, jika streak sebelum tanggal itu masih tersambung; kuotanya sekali per tujuh hari.
- Konfirmasi bertemu tersimpan saat pengisian hati kedua selesai. Efek perayaan bersama hanya dipicu sekali ketika kedua profil sudah mengonfirmasi pada tanggal Jakarta yang sama.
- Pengingat 7 dan 14 hari ditampilkan di beranda saat aplikasi dibuka. Browser push memerlukan izin/notifikasi server tambahan dan tidak disertakan.
- Saat Supabase belum dikonfigurasi, aplikasi tetap dapat dicoba secara lokal di browser ini. Untuk sinkronisasi dua akun/perangkat dan penghapusan terjadwal, selesaikan setup di atas.
- Katalog media bersama memerlukan migration ketujuh. Jalankan `202610170007_shared_tmdb_catalog.sql` di SQL Editor setelah migration pasangan/admin; jika belum diterapkan atau akun belum dipasangkan, aplikasi menampilkan kesalahan sinkronisasi.
- Data lama dari localStorage tidak otomatis dipindahkan ke Supabase. Data diary lokal lama tetap ada di browser; mulai check-in Supabase setelah akun dipasangkan.
- Mode Admin hanya mengelola data per profil yang saat ini sudah disimpan di Supabase (check-in/diary, konfirmasi bertemu, progres hati, dan pemulihan streak). Fitur lain yang masih memakai localStorage bersifat lokal pada browser dan belum memiliki pemisahan akses/sinkronisasi per profil.
