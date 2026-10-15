import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const PHOTO_BUCKET = 'app-photos';

export interface ManagedPhoto {
  id: string;
  title: string;
  category: string;
  photo_key: string;
  storage_path: string;
  public_url: string;
  created_at: string;
}

const photoUrlCache = new Map<string, { url: string; expiresAt: number }>();

export function invalidateManagedPhoto(photoKey: string): void {
  photoUrlCache.delete(photoKey);
}

export async function getManagedPhotoUrl(photoKey: string, fallback: string): Promise<string> {
  if (!supabase) return fallback;
  const cached = photoUrlCache.get(photoKey);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  const { data } = await supabase
    .from('app_photos')
    .select('storage_path')
    .eq('photo_key', photoKey)
    .maybeSingle();
  if (!data?.storage_path) {
    photoUrlCache.set(photoKey, { url: fallback, expiresAt: Date.now() + 60_000 });
    return fallback;
  }
  const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(data.storage_path, 3600);
  const url = signed?.signedUrl || fallback;
  photoUrlCache.set(photoKey, { url, expiresAt: Date.now() + (signed ? 55 * 60_000 : 60_000) });
  return url;
}
