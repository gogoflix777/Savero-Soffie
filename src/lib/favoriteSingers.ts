import { CoupleProfile, FavoriteSinger } from '../types';
import { supabase } from './supabase';

interface FavoriteSingerRow {
  profile: CoupleProfile;
  artist_mbid: string;
  payload: unknown;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) throw new Error('Hubungkan Supabase agar penyanyi favorit terlihat oleh kedua profil.');
  return supabase;
}

function parseFavoriteSinger(row: FavoriteSingerRow): FavoriteSinger {
  if (!row.payload || typeof row.payload !== 'object') throw new Error('Data penyanyi favorit tidak valid.');
  const payload = row.payload as Partial<FavoriteSinger>;
  if (
    (row.profile !== 'Savero' && row.profile !== 'Soffie')
    || typeof row.artist_mbid !== 'string'
    || payload.profile !== row.profile
    || payload.musicBrainzId !== row.artist_mbid
    || typeof payload.name !== 'string'
    || typeof payload.description !== 'string'
  ) {
    throw new Error('Data penyanyi favorit memiliki format yang tidak lengkap.');
  }
  return { ...payload, createdAt: row.created_at } as FavoriteSinger;
}

export async function loadFavoriteSingers(): Promise<FavoriteSinger[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('favorite_singers')
    .select('profile,artist_mbid,payload,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Penyanyi favorit gagal dimuat: ${error.message}`);
  return ((data ?? []) as FavoriteSingerRow[]).map(parseFavoriteSinger);
}

export async function saveFavoriteSinger(singer: FavoriteSinger): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('favorite_singers').upsert({
    profile: singer.profile,
    artist_mbid: singer.musicBrainzId,
    payload: singer
  }, { onConflict: 'profile,artist_mbid' });
  if (error) throw new Error(`Penyanyi favorit gagal disimpan: ${error.message}`);
}

export async function deleteFavoriteSinger(profile: CoupleProfile, musicBrainzId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('favorite_singers')
    .delete()
    .eq('profile', profile)
    .eq('artist_mbid', musicBrainzId);
  if (error) throw new Error(`Penyanyi favorit gagal dihapus: ${error.message}`);
}
