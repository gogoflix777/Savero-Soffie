# Setup Supabase

1. Buat project di Supabase, lalu salin **Project URL** dan **publishable/anon key** ke `.env`:

   ```env
   VITE_SUPABASE_URL="https://PROJECT_REF.supabase.co"
   VITE_SUPABASE_ANON_KEY="YOUR_PUBLISHABLE_OR_ANON_KEY"
   ```

   Jangan pernah menaruh `service_role` key di `.env` frontend.

2. Jalankan isi `supabase/migrations/202610160001_photo_library.sql` melalui SQL Editor Supabase.
3. Buat akun untuk Savero dan Soffie di **Authentication → Users → Add user**. Registrasi publik memang tidak disediakan dari halaman login.
4. Mulai ulang Vite setelah mengubah `.env` (`Ctrl+C`, lalu `npm run dev`) dan login dengan akun yang dibuat.
5. Buka **Pengaturan → Galeri foto**. Untuk mengganti foto profil, unggah foto dengan kunci `profil:savero` atau `profil:soffie`. Foto lain dapat diunggah dengan kunci yang mudah dikenali; kunci yang sama akan mengganti pemetaan fotonya.

Galeri membatasi file gambar hingga 10 MB dan menggunakan bucket privat. Data aplikasi yang sudah ada tetap tersimpan di browser saat ini; migrasi ini menambahkan autentikasi akun dan penyimpanan foto, belum memindahkan data kenangan/siklus ke database.
