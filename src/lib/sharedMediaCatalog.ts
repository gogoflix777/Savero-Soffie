import { ActorItem, MovieItem, TvSeries } from '../types';
import { supabase } from './supabase';

export type SharedMediaKind = 'movie' | 'tv' | 'person';

export interface SharedMediaCatalog {
  movies: MovieItem[];
  tvSeries: TvSeries[];
  actors: ActorItem[];
}

interface SharedMediaRow {
  kind: SharedMediaKind;
  tmdb_id: number;
  payload: unknown;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi untuk menyimpan katalog bersama.');
  return supabase;
}

export async function loadSharedMediaCatalog(): Promise<SharedMediaCatalog> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('shared_media_catalog')
    .select('kind,tmdb_id,payload')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Katalog bersama gagal dimuat: ${error.message}`);

  const catalog: SharedMediaCatalog = { movies: [], tvSeries: [], actors: [] };
  for (const row of (data ?? []) as SharedMediaRow[]) {
    if (row.kind === 'movie') catalog.movies.push(row.payload as MovieItem);
    else if (row.kind === 'tv') catalog.tvSeries.push(row.payload as TvSeries);
    else if (row.kind === 'person') catalog.actors.push(row.payload as ActorItem);
  }
  return catalog;
}

export async function saveSharedMediaItem(
  kind: SharedMediaKind,
  item: MovieItem | TvSeries | ActorItem
): Promise<void> {
  const client = requireSupabase();
  const tmdbId = item.tmdbId;
  if (!tmdbId || !Number.isInteger(tmdbId)) throw new Error('Item katalog tidak memiliki ID TMDB yang valid.');

  const { error } = await client.from('shared_media_catalog').upsert({
    kind,
    tmdb_id: tmdbId,
    payload: item,
    updated_at: new Date().toISOString()
  }, { onConflict: 'kind,tmdb_id' });

  if (error) throw new Error(`Katalog bersama gagal disimpan: ${error.message}`);
}

export async function removeSharedMediaItem(kind: SharedMediaKind, tmdbId: number): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('shared_media_catalog')
    .delete()
    .eq('kind', kind)
    .eq('tmdb_id', tmdbId);

  if (error) throw new Error(`Item wishlist gagal dihapus: ${error.message}`);
}

export async function seedSharedMediaCatalog(
  catalog: SharedMediaCatalog
): Promise<void> {
  const client = requireSupabase();
  const rows = [
    ...catalog.movies.filter((item) => item.status !== 'watchlist').map((item) => ({ kind: 'movie', tmdb_id: item.tmdbId, payload: item })),
    ...catalog.tvSeries.filter((item) => item.status !== 'watchlist').map((item) => ({ kind: 'tv', tmdb_id: item.tmdbId, payload: item })),
    ...catalog.actors.map((item) => ({ kind: 'person', tmdb_id: item.tmdbId, payload: item }))
  ].filter((row): row is typeof row & { tmdb_id: number } => typeof row.tmdb_id === 'number');

  if (!rows.length) return;
  const { error } = await client.from('shared_media_catalog').upsert(rows, {
    onConflict: 'kind,tmdb_id',
    ignoreDuplicates: true
  });
  if (error) throw new Error(`Riwayat katalog lokal gagal dipindahkan: ${error.message}`);
}
