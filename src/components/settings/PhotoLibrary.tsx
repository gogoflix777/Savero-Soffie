import React, { useEffect, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { invalidateManagedPhoto, ManagedPhoto, PHOTO_BUCKET, supabase } from '../../lib/supabase';
import { appStorage } from '../../utils/storage';

export const PhotoLibrary: React.FC = () => {
  const [photos, setPhotos] = useState<ManagedPhoto[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Kenangan');
  const [photoKey, setPhotoKey] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [knownPhotos, setKnownPhotos] = useState<Array<{ key: string; title: string }>>([]);

  const load = async () => {
    if (!supabase) return;
    const client = supabase;
    const { data, error } = await client.from('app_photos').select('*').order('created_at', { ascending: false });
    if (error) setStatus(error.message);
    else {
      const rows = data || [];
      const signed = await Promise.all(rows.map(async photo => {
        const { data: url } = await client.storage.from(PHOTO_BUCKET).createSignedUrl(photo.storage_path, 3600);
        return { ...photo, public_url: url?.signedUrl || '' };
      }));
      setPhotos(signed);
    }
  };
  useEffect(() => {
    void load();
    const inventory: Array<{ key: string; title: string }> = [
      { key: 'profil:savero', title: 'Foto profil Savero' },
      { key: 'profil:soffie', title: 'Foto profil Soffie' },
      ...appStorage.getPins().flatMap(pin => pin.photos.map((url, index) => ({ key: url, title: `Peta • ${pin.title} • Foto ${index + 1}` }))),
      ...appStorage.getMovies().map(movie => ({ key: movie.posterUrl, title: `Film • ${movie.title}` })),
      ...appStorage.getActors().map(actor => ({ key: actor.photoUrl, title: `Aktor • ${actor.name}` })),
      ...appStorage.getTvSeries().map(series => ({ key: series.posterUrl, title: `Serial • ${series.title}` })),
      ...appStorage.getSongs().map(song => ({ key: song.albumArt, title: `Musik • ${song.title}` }))
    ].filter(photo => photo.key);
    setKnownPhotos(Array.from(new Map(inventory.map(photo => [photo.key, photo])).values()));
  }, []);

  const upload = async () => {
    if (!supabase || !file || !title.trim() || !photoKey.trim()) return;
    if (!file.type.startsWith('image/')) { setStatus('Pilih file gambar.'); return; }
    if (file.size > 10 * 1024 * 1024) { setStatus('Ukuran gambar maksimal 10 MB.'); return; }
    setBusy(true); setStatus('');
    const { data: previous } = await supabase.from('app_photos').select('storage_path').eq('photo_key', photoKey.trim()).maybeSingle();
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '-')}`;
    const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setStatus(uploadError.message); setBusy(false); return; }
    const { error: saveError } = await supabase.from('app_photos').upsert({ photo_key: photoKey.trim(), title: title.trim(), category, storage_path: path }, { onConflict: 'photo_key' });
    if (saveError) {
      await supabase.storage.from(PHOTO_BUCKET).remove([path]);
      setStatus(saveError.message);
    } else {
      if (previous?.storage_path) await supabase.storage.from(PHOTO_BUCKET).remove([previous.storage_path]);
      invalidateManagedPhoto(photoKey.trim());
      setStatus('Foto berhasil disimpan. Gunakan kunci yang sama untuk mengganti foto.');
      setTitle(''); setPhotoKey(''); setFile(null);
      await load();
    }
    setBusy(false);
  };

  const remove = async (photo: ManagedPhoto) => {
    if (!supabase || !confirm(`Hapus foto “${photo.title}”?`)) return;
    const { error } = await supabase.from('app_photos').delete().eq('id', photo.id);
    if (error) setStatus(error.message);
    else { await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]); await load(); }
  };

  if (!supabase) return <p className="text-sm text-amber-700">Tambahkan URL dan anon key Supabase di file .env untuk mengaktifkan galeri.</p>;
  return <section className="space-y-4 rounded-2xl border border-[#7A1018]/15 bg-white/50 p-4 dark:bg-black/20">
    <div className="flex items-center justify-between"><div><h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2]">Galeri foto</h4><p className="text-xs opacity-70">Unggah foto baru atau ganti foto lama memakai kunci yang sama.</p></div><button type="button" aria-label="Muat ulang foto" onClick={() => void load()} className="rounded-lg p-2"><RefreshCw className="h-4 w-4" /></button></div>
    <div className="grid gap-2 sm:grid-cols-2">
      <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Nama foto" className="min-h-10 rounded-lg border bg-white px-3 dark:bg-black/20" />
      <select value="" onChange={e => { const selected = knownPhotos.find(photo => photo.key === e.target.value); if (selected) { setPhotoKey(selected.key); if (!title) setTitle(selected.title); } }} className="min-h-10 rounded-lg border bg-white px-3 dark:bg-black/20">
        <option value="">Pilih foto lama yang ingin diganti…</option>
        {knownPhotos.map(photo => <option key={photo.key} value={photo.key}>{photo.title}</option>)}
      </select>
      <input required value={photoKey} onChange={e => setPhotoKey(e.target.value)} placeholder="Kunci foto baru atau URL foto lama" className="min-h-10 rounded-lg border bg-white px-3 dark:bg-black/20 sm:col-span-2" />
      <select value={category} onChange={e => setCategory(e.target.value)} className="min-h-10 rounded-lg border bg-white px-3 dark:bg-black/20"><option>Kenangan</option><option>Profil</option><option>Kafe & Penginapan</option><option>Film</option><option>Lainnya</option></select>
      <input required type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="min-h-10 w-full text-xs" />
      <button type="button" onClick={() => void upload()} disabled={busy || !file || !title.trim() || !photoKey.trim()} className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#7A1018] px-3 font-bold text-white disabled:opacity-50 sm:col-span-2"><ImagePlus className="h-4 w-4" />{busy ? 'Mengunggah…' : 'Simpan foto'}</button>
    </div>
    {status && <p role="status" className="text-xs">{status}</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map(photo => <article key={photo.id} className="overflow-hidden rounded-xl border bg-white dark:bg-black/20"><img src={photo.public_url} alt={photo.title} className="h-28 w-full object-cover" /><div className="p-2"><p className="truncate text-xs font-bold">{photo.title}</p><p className="truncate text-[10px] opacity-60">{photo.photo_key}</p><button type="button" onClick={() => void remove(photo)} className="mt-1 flex items-center gap-1 text-xs text-red-600"><Trash2 className="h-3 w-3" />Hapus</button></div></article>)}</div>
  </section>;
};
