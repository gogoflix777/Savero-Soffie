import { MemoryPin } from '../types';
import { supabase } from './supabase';
import { convertToWebP } from '../utils/imageOptimizer';

interface MemoryPinRow {
  payload: unknown;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi untuk menyinkronkan pin peta.');
  return supabase;
}

function parsePin(payload: unknown): MemoryPin {
  if (!payload || typeof payload !== 'object') throw new Error('Data pin Supabase tidak valid.');
  const pin = payload as Partial<MemoryPin>;
  if (
    typeof pin.id !== 'string'
    || typeof pin.title !== 'string'
    || typeof pin.lat !== 'number'
    || typeof pin.lng !== 'number'
    || !Array.isArray(pin.photos)
    || !Array.isArray(pin.tags)
  ) {
    throw new Error('Data pin Supabase memiliki format yang tidak lengkap.');
  }
  return pin as MemoryPin;
}

export async function loadMemoryPins(): Promise<MemoryPin[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('memory_pins')
    .select('payload')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Pin peta gagal dimuat: ${error.message}`);
  return ((data ?? []) as MemoryPinRow[]).map((row) => parsePin(row.payload));
}

export async function saveMemoryPin(pin: MemoryPin): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('memory_pins').upsert({
    id: pin.id,
    payload: pin,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  if (error) throw new Error(`Pin peta gagal disimpan: ${error.message}`);
  await syncMemoryPinPhotos(pin);
}

export async function deleteMemoryPin(pinId: string): Promise<void> {
  const client = requireSupabase();
  await removeMemoryPinPhotos(pinId);
  const { error } = await client.from('memory_pins').delete().eq('id', pinId);
  if (error) throw new Error(`Pin peta gagal dihapus: ${error.message}`);
}

export async function uploadMemoryPinPhoto(pinId: string, file: File, index: number): Promise<string> {
  const client = requireSupabase();
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    throw new Error('Format foto harus JPEG, PNG, WebP, atau GIF.');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran foto pin maksimal 10 MB.');





  const optimizedFile = file.type === 'image/webp'
    ? file
    : await convertToWebP(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85, cropSquare: false });

  const storagePath = `memory-pins/${pinId}/${crypto.randomUUID()}.webp`;
  const photoKey = `pin-photo:${pinId}:${index}`;
  const { error: uploadError } = await client.storage.from('app-photos').upload(storagePath, optimizedFile, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: false
  });
  if (uploadError) throw new Error(`Foto pin gagal diunggah: ${uploadError.message}`);

  const { data: previous, error: lookupError } = await client
    .from('app_photos')
    .select('storage_path')
    .eq('photo_key', photoKey)
    .maybeSingle();
  if (lookupError) {
    const { error: cleanupError } = await client.storage.from('app-photos').remove([storagePath]);
    if (cleanupError) console.error('Failed to clean up uploaded pin photo:', cleanupError);
    throw new Error(`Metadata foto pin gagal dimuat: ${lookupError.message}`);
  }

  const { error: metadataError } = await client.from('app_photos').upsert({
    photo_key: photoKey,
    title: `Foto pin ${pinId}`,
    category: 'Peta Kenangan',
    storage_path: storagePath,
    public_url: ''
  }, { onConflict: 'photo_key' });
  if (metadataError) {
    const { error: cleanupError } = await client.storage.from('app-photos').remove([storagePath]);
    if (cleanupError) console.error('Failed to clean up uploaded pin photo:', cleanupError);
    throw new Error(`Metadata foto pin gagal disimpan: ${metadataError.message}`);
  }

  if (previous?.storage_path) {
    const { error: cleanupError } = await client.storage.from('app-photos').remove([previous.storage_path]);
    if (cleanupError) throw new Error(`Foto lama gagal diganti: ${cleanupError.message}`);
  }
  return `managed://${photoKey}`;
}

async function syncMemoryPinPhotos(pin: MemoryPin): Promise<void> {
  const client = requireSupabase();
  const prefix = `pin-photo:${pin.id}:`;
  const { data, error } = await client
    .from('app_photos')
    .select('photo_key,storage_path')
    .like('photo_key', `${prefix}%`);
  if (error) throw new Error(`Daftar foto pin gagal diselaraskan: ${error.message}`);

  const removed = (data ?? []).filter((photo) => {
    const index = Number(photo.photo_key.slice(prefix.length));
    return !Number.isInteger(index) || pin.photos[index] !== `managed://${photo.photo_key}`;
  });
  if (!removed.length) return;

  const paths = removed.map((photo) => photo.storage_path).filter(Boolean);
  if (paths.length) {
    const { error: storageError } = await client.storage.from('app-photos').remove(paths);
    if (storageError) throw new Error(`Foto pin yang dihapus gagal dibersihkan: ${storageError.message}`);
  }
  const { error: metadataError } = await client
    .from('app_photos')
    .delete()
    .in('photo_key', removed.map((photo) => photo.photo_key));
  if (metadataError) throw new Error(`Metadata foto pin gagal dibersihkan: ${metadataError.message}`);
}

async function removeMemoryPinPhotos(pinId: string): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('app_photos')
    .select('photo_key,storage_path')
    .like('photo_key', `pin-photo:${pinId}:%`);
  if (error) throw new Error(`Foto pin gagal dimuat sebelum dihapus: ${error.message}`);

  const photos = data ?? [];
  const paths = photos.map((photo) => photo.storage_path).filter(Boolean);
  if (paths.length) {
    const { error: storageError } = await client.storage.from('app-photos').remove(paths);
    if (storageError) throw new Error(`Foto pin gagal dihapus dari penyimpanan: ${storageError.message}`);
  }
  if (photos.length) {
    const { error: metadataError } = await client
      .from('app_photos')
      .delete()
      .in('photo_key', photos.map((photo) => photo.photo_key));
    if (metadataError) throw new Error(`Data foto pin gagal dihapus: ${metadataError.message}`);
  }
}
