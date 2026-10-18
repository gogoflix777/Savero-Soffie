import React, { useEffect, useMemo, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { invalidateManagedPhoto, ManagedPhoto, PHOTO_BUCKET, supabase } from '../../lib/supabase';
import { appStorage } from '../../utils/storage';
import { ManagedImage } from '../common/ManagedImage';

interface PhotoChoice {
  key: string;
  title: string;
  fallback?: string;
}

export const PhotoLibrary: React.FC = () => {
  const [photos, setPhotos] = useState<ManagedPhoto[]>([]);
  const [knownPhotos, setKnownPhotos] = useState<PhotoChoice[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('app_photos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const signedPhotos = await Promise.all(rows.map(async (photo) => {
      const { data: signed, error: signedError } = await supabase!.storage.from(PHOTO_BUCKET).createSignedUrl(photo.storage_path, 3600);
      if (signedError) throw signedError;
      return { ...photo, public_url: signed.signedUrl };
    }));
    setPhotos(signedPhotos);
  };

  useEffect(() => {
    const inventory: PhotoChoice[] = [
      { key: 'profil:savero', title: 'Foto profil Savero' },
      { key: 'profil:soffie', title: 'Foto profil Soffie' },
      ...appStorage.getPins().flatMap((pin) => pin.photos.map((url, index) => ({ key: `pin-photo:${pin.id}:${index}`, title: `Peta • ${pin.title} • Foto ${index + 1}`, fallback: url }))),
      ...appStorage.getMovies().map((movie) => ({ key: movie.posterUrl, title: `Film • ${movie.title}` })),
      ...appStorage.getActors().map((actor) => ({ key: actor.photoUrl, title: `Aktor • ${actor.name}` })),
      ...appStorage.getTvSeries().map((series) => ({ key: series.posterUrl, title: `Serial • ${series.title}` })),
      ...appStorage.getSongs().map((song) => ({ key: song.albumArt, title: `Musik • ${song.title}` }))
    ].filter((photo) => photo.key);
    setKnownPhotos(Array.from(new Map(inventory.map((photo) => [photo.key, photo])).values()));
    void load().catch((error: unknown) => setStatus(error instanceof Error ? error.message : 'Galeri foto gagal dimuat.'));
  }, []);

  const customPhotos = useMemo(() => {
    const knownKeys = new Set(knownPhotos.map((photo) => photo.key));
    return photos.filter((photo) => !knownKeys.has(photo.photo_key));
  }, [knownPhotos, photos]);

  const upload = async (key: string, title: string, file: File): Promise<boolean> => {
    if (!supabase) {
      setStatus('Supabase belum dikonfigurasi.');
      return false;
    }
    if (!file.type.startsWith('image/')) {
      setStatus('Pilih file gambar.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus('Ukuran gambar maksimal 10 MB.');
      return false;
    }
    setBusyKey(key);
    setStatus('');
    try {
      const { data: previous, error: previousError } = await supabase
        .from('app_photos').select('storage_path').eq('photo_key', key).maybeSingle();
      if (previousError) throw previousError;
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) throw uploadError;
      const { error: saveError } = await supabase.from('app_photos').upsert({
        photo_key: key,
        title: title.trim() || key,
        category: 'Kenangan',
        storage_path: path
      }, { onConflict: 'photo_key' });
      if (saveError) {
        const { error: cleanupError } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
        if (cleanupError) console.error('Uploaded replacement photo cleanup failed:', cleanupError);
        throw saveError;
      }
      if (previous?.storage_path) {
        const { error: cleanupError } = await supabase.storage.from(PHOTO_BUCKET).remove([previous.storage_path]);
        if (cleanupError) console.error('Previous managed photo cleanup failed:', cleanupError);
      }
      invalidateManagedPhoto(key);
      setStatus(`Foto “${title}” berhasil diperbarui.`);
      await load();
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Foto gagal diperbarui.');
      return false;
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddPhoto = () => {
    if (!newFile || !newKey.trim() || !newTitle.trim()) {
      setStatus('Isi nama, kunci foto, dan pilih file gambar terlebih dahulu.');
      return;
    }
    void upload(newKey.trim(), newTitle.trim(), newFile).then((saved) => {
      if (!saved) return;
      setNewTitle(''); setNewKey(''); setNewFile(null);
    });
  };

  const remove = async (photo: ManagedPhoto) => {
    if (!supabase || !window.confirm(`Hapus foto “${photo.title}”?`)) return;
    setBusyKey(photo.photo_key);
    setStatus('');
    try {
      const { error } = await supabase.from('app_photos').delete().eq('id', photo.id);
      if (error) throw error;
      const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
      if (storageError) throw storageError;
      invalidateManagedPhoto(photo.photo_key);
      setStatus(`Foto “${photo.title}” berhasil dihapus.`);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Foto gagal dihapus.');
    } finally {
      setBusyKey(null);
    }
  };

  const cardClass = 'overflow-hidden rounded-2xl border border-[#7A1018]/15 bg-white/75 shadow-sm dark:border-white/10 dark:bg-black/20';
  const actionClass = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#bd7182]/30 bg-[#fff5f5] px-3 py-2 text-[11px] font-extrabold text-[#7A1018] transition hover:bg-[#f9e5e8] dark:border-white/10 dark:bg-white/5 dark:text-rose-100 dark:hover:bg-white/10';

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b95770] dark:text-rose-200">Kelola foto</p>
          <h3 className="mt-1 text-xl font-extrabold text-[#3B0A0F] dark:text-rose-50">Foto-foto kita</h3>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-[#5c2432] dark:text-rose-200">
            Ketuk “Ganti foto” pada foto yang ingin diperbarui. Foto lama tetap tampil sampai penggantinya berhasil disimpan.
          </p>
        </div>
        {supabase && <button type="button" aria-label="Muat ulang galeri" onClick={() => void load().catch((error: unknown) => setStatus(error instanceof Error ? error.message : 'Galeri gagal dimuat.'))} className={actionClass}><RefreshCw className="h-4 w-4" /><span className="hidden sm:inline">Muat ulang</span></button>}
      </header>

      {!supabase && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Hubungkan Supabase untuk mengganti atau mengunggah foto.</p>}

      {knownPhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {knownPhotos.map((photo) => (
            <article key={photo.key} className={cardClass}>
              <label className="group relative block aspect-[4/3] cursor-pointer overflow-hidden bg-rose-50 dark:bg-white/5">
                <ManagedImage src={photo.fallback ?? photo.key} photoKey={photo.key} alt={photo.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-x-2 bottom-2 flex min-h-9 items-center justify-center gap-1 rounded-lg bg-black/65 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm">
                  <ImagePlus className="h-3.5 w-3.5" />{busyKey === photo.key ? 'Menyimpan…' : 'Ganti foto'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!supabase || busyKey !== null}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void upload(photo.key, photo.title, file);
                  }}
                />
              </label>
              <p className="truncate px-2.5 py-2 text-[10px] font-bold text-[#57202c] dark:text-rose-50">{photo.title}</p>
            </article>
          ))}
        </div>
      )}

      {customPhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {customPhotos.map((photo) => (
            <article key={photo.id} className={cardClass}>
              <label className="group relative block aspect-[4/3] cursor-pointer overflow-hidden bg-rose-50 dark:bg-white/5">
                <img src={photo.public_url} alt={photo.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-x-2 bottom-2 flex min-h-9 items-center justify-center gap-1 rounded-lg bg-black/65 px-2 text-[10px] font-extrabold text-white backdrop-blur-sm"><ImagePlus className="h-3.5 w-3.5" />Ganti foto</span>
                <input type="file" accept="image/*" disabled={busyKey !== null} className="sr-only" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void upload(photo.photo_key, photo.title, file);
                }} />
              </label>
              <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                <p className="truncate text-[10px] font-bold text-[#57202c] dark:text-rose-50">{photo.title}</p>
                <button type="button" disabled={busyKey !== null} onClick={() => void remove(photo)} aria-label={`Hapus ${photo.title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {supabase && (
        <details className="rounded-2xl border border-[#7A1018]/15 bg-white/60 p-4 dark:border-white/10 dark:bg-black/15">
          <summary className="cursor-pointer list-none text-xs font-extrabold text-[#7A1018] dark:text-rose-100">Tambah foto dengan kunci baru</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Nama foto" className="min-h-11 min-w-0 rounded-xl border border-[#7A1018]/15 bg-white px-3 text-xs text-[#57202c] outline-none focus:ring-2 focus:ring-rose-300 dark:border-white/10 dark:bg-black/20 dark:text-rose-50" />
            <input value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder="Kunci unik foto" className="min-h-11 min-w-0 rounded-xl border border-[#7A1018]/15 bg-white px-3 text-xs text-[#57202c] outline-none focus:ring-2 focus:ring-rose-300 dark:border-white/10 dark:bg-black/20 dark:text-rose-50" />
            <input type="file" accept="image/*" onChange={(event) => setNewFile(event.target.files?.[0] ?? null)} className="min-h-11 min-w-0 rounded-xl border border-[#7A1018]/15 bg-white px-2 py-2 text-xs text-[#57202c] dark:border-white/10 dark:bg-black/20 dark:text-rose-50 sm:col-span-2" />
            <button type="button" disabled={busyKey !== null} onClick={handleAddPhoto} className="min-h-11 rounded-xl bg-[#b95770] px-4 text-xs font-extrabold text-white transition hover:bg-[#9f465e] disabled:opacity-60 sm:col-span-2">{busyKey === newKey ? 'Mengunggah…' : 'Unggah foto'}</button>
          </div>
        </details>
      )}

      {status && <p role="status" aria-live="polite" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-[#7A1018] dark:bg-white/5 dark:text-rose-100">{status}</p>}
    </section>
  );
};
