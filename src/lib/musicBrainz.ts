import { supabase } from './supabase';

export interface MusicRecordingSearchResult {
  id: string;
  title: string;
  artist: string;
  length?: number;
  disambiguation?: string;
}

export interface MusicArtistSearchResult {
  id: string;
  name: string;
  disambiguation?: string;
  country?: string;
  type?: string;
  photoUrl?: string;
}

export interface MusicRecordingMetadata extends MusicRecordingSearchResult {
  releaseTitle?: string;
  albumArt?: string;
}

type MusicBrainzAction =
  | { action: 'search-recordings'; query: string }
  | { action: 'search-artists'; query: string }
  | { action: 'recording-details'; id: string }
  | { action: 'artist-details'; id: string };

async function invokeMusicBrainz<T>(body: MusicBrainzAction): Promise<T> {
  if (!supabase) throw new Error('Hubungkan Supabase untuk mencari metadata musik.');
  const { data, error } = await supabase.functions.invoke('musicbrainz', { body });
  if (error) {
    const response = error.context instanceof Response ? error.context : null;
    if (response) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (payload?.error) throw new Error(payload.error);
    }
    throw new Error(error.message || 'Permintaan metadata musik gagal.');
  }
  if (!data || typeof data !== 'object') throw new Error('Respons metadata musik tidak valid.');
  if ('error' in data && typeof data.error === 'string') throw new Error(data.error);
  return data as T;
}

export async function searchMusicRecordings(query: string): Promise<MusicRecordingSearchResult[]> {
  const result = await invokeMusicBrainz<{ results: MusicRecordingSearchResult[] }>({
    action: 'search-recordings',
    query
  });
  return result.results;
}

export async function searchMusicArtists(query: string): Promise<MusicArtistSearchResult[]> {
  const result = await invokeMusicBrainz<{ results: MusicArtistSearchResult[] }>({
    action: 'search-artists',
    query
  });
  return result.results;
}

export async function getMusicRecordingMetadata(id: string): Promise<MusicRecordingMetadata> {
  return invokeMusicBrainz<MusicRecordingMetadata>({ action: 'recording-details', id });
}

export async function getMusicArtistMetadata(id: string): Promise<MusicArtistSearchResult> {
  return invokeMusicBrainz<MusicArtistSearchResult>({ action: 'artist-details', id });
}
