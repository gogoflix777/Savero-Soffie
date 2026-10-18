import { WishlistPlace } from '../types';
import { supabase } from './supabase';

interface WishlistPlaceRow {
  id: string;
  payload: unknown;
  created_at?: string;
  updated_at?: string;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi untuk menyinkronkan wishlist tempat.');
  return supabase;
}

function parseWishlistPlace(payload: unknown, fallbackId?: string): WishlistPlace {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Data wishlist tempat Supabase tidak valid.');
  }
  const place = payload as Partial<WishlistPlace>;
  if (
    (typeof place.id !== 'string' && !fallbackId) ||
    typeof place.name !== 'string' ||
    typeof place.category !== 'string' ||
    typeof place.area !== 'string'
  ) {
    throw new Error('Data wishlist tempat Supabase memiliki format yang tidak lengkap.');
  }
  return {
    id: place.id || fallbackId || '',
    name: place.name,
    category: place.category as WishlistPlace['category'],
    area: place.area,
    budgetEstimate: place.budgetEstimate || 'sedang',
    priority: place.priority || 'sedang',
    requestedBy: place.requestedBy || 'Berdua',
    notes: place.notes || '',
    mapUrl: place.mapUrl || '',
    tags: Array.isArray(place.tags) ? place.tags : [],
    createdAt: place.createdAt || new Date().toISOString().split('T')[0],
    isVisited: Boolean(place.isVisited)
  };
}

export async function loadWishlistPlaces(): Promise<WishlistPlace[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('wishlist_places')
    .select('id, payload, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Wishlist tempat gagal dimuat: ${error.message}`);
  }

  const rows = (data ?? []) as WishlistPlaceRow[];
  return rows.map((row) => parseWishlistPlace(row.payload, row.id));
}

export async function saveWishlistPlace(place: WishlistPlace): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('wishlist_places').upsert({
    id: place.id,
    payload: place,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });

  if (error) throw new Error(`Wishlist tempat gagal disimpan: ${error.message}`);
}

export async function deleteWishlistPlace(placeId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('wishlist_places').delete().eq('id', placeId);
  if (error) throw new Error(`Wishlist tempat gagal dihapus: ${error.message}`);
}

export async function seedWishlistPlaces(places: WishlistPlace[]): Promise<void> {
  const client = requireSupabase();
  const rows = places.map((place) => ({
    id: place.id,
    payload: place,
    updated_at: new Date().toISOString()
  }));
  const { error } = await client.from('wishlist_places').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`Gagal mengisi data awal wishlist tempat: ${error.message}`);
}
