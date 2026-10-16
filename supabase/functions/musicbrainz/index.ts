import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface MusicBrainzArtist {
  id?: string;
  name?: string;
  disambiguation?: string;
  country?: string;
  type?: string;
}

interface MusicBrainzRecording {
  id?: string;
  title?: string;
  length?: number;
  disambiguation?: string;
  'artist-credit-phrase'?: string;
  'artist-credit'?: Array<{ name?: string; joinphrase?: string; artist?: MusicBrainzArtist } | string>;
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

function recordingArtist(recording: MusicBrainzRecording): string {
  if (recording['artist-credit-phrase']) return recording['artist-credit-phrase'];
  return (recording['artist-credit'] ?? []).map((credit) => {
    if (typeof credit === 'string') return credit;
    return `${credit.name ?? credit.artist?.name ?? ''}${credit.joinphrase ?? ''}`;
  }).join('').trim();
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Metode tidak diizinkan.' }, 405);

  const authorization = request.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!authorization || !url || !anonKey) return json({ error: 'Sesi Supabase tidak tersedia.' }, 401);

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false }
  });
  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError || !userResult.user) return json({ error: 'Silakan masuk ke akun pasangan terlebih dahulu.' }, 401);
  const { data: isMember, error: memberError } = await client.rpc('is_couple_member');
  if (memberError || isMember !== true) return json({ error: 'Akses pencarian musik hanya untuk anggota pasangan.' }, 403);

  let body: { action?: unknown; query?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Isi permintaan tidak valid.' }, 400);
  }

  const action = body.action;
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const validMbid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if ((action === 'search-recordings' || action === 'search-artists') && (query.length < 2 || query.length > 120)) {
    return json({ error: 'Kata pencarian harus berisi 2–120 karakter.' }, 400);
  }
  if ((action === 'recording-details' || action === 'artist-details') && !validMbid.test(id)) {
    return json({ error: 'ID MusicBrainz tidak valid.' }, 400);
  }
  if (!['search-recordings', 'search-artists', 'recording-details', 'artist-details'].includes(String(action))) {
    return json({ error: 'Jenis pencarian musik tidak dikenal.' }, 400);
  }

  const { data: requestAt, error: rateLimitError } = await client.rpc('reserve_musicbrainz_request');
  if (rateLimitError || typeof requestAt !== 'string') {
    return json({ error: rateLimitError?.message ?? 'Pembatasan laju pencarian musik gagal.' }, 503);
  }
  const delay = new Date(requestAt).getTime() - Date.now();
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

  const endpoint = new URL('https://musicbrainz.org/ws/2/');
  endpoint.searchParams.set('fmt', 'json');
  if (action === 'search-recordings') {
    endpoint.pathname += 'recording';
    endpoint.searchParams.set('query', query);
    endpoint.searchParams.set('limit', '8');
  } else if (action === 'search-artists') {
    endpoint.pathname += 'artist';
    endpoint.searchParams.set('query', query);
    endpoint.searchParams.set('limit', '8');
  } else if (action === 'recording-details') {
    endpoint.pathname += `recording/${id}`;
    endpoint.searchParams.set('inc', 'releases');
  } else {
    endpoint.pathname += `artist/${id}`;
    endpoint.searchParams.set('inc', 'url-rels');
  }

  let musicBrainzResponse: Response;
  try {
    musicBrainzResponse = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SaveroSoffie/1.0 (https://github.com/gogoflix777/Savero-Soffie)'
      }
    });
  } catch {
    return json({ error: 'MusicBrainz tidak dapat dihubungi. Coba lagi nanti.' }, 502);
  }
  if (!musicBrainzResponse.ok) {
    return json({ error: `MusicBrainz merespons ${musicBrainzResponse.status}. Coba lagi nanti.` }, 502);
  }

  let data: Record<string, unknown>;
  try {
    data = await musicBrainzResponse.json();
  } catch {
    return json({ error: 'MusicBrainz mengirim metadata dengan format yang tidak valid.' }, 502);
  }
  if (action === 'search-artists') {
    const artists = (data.artists ?? []) as MusicBrainzArtist[];
    return json({
      results: artists.flatMap((artist) => artist.id && artist.name ? [{
        id: artist.id,
        name: artist.name,
        disambiguation: artist.disambiguation,
        country: artist.country,
        type: artist.type
      }] : [])
    });
  }

  if (action === 'search-recordings') {
    const recordings = (data.recordings ?? []) as MusicBrainzRecording[];
    return json({
      results: recordings.flatMap((recording) => recording.id && recording.title ? [{
        id: recording.id,
        title: recording.title,
        artist: recordingArtist(recording),
        length: recording.length,
        disambiguation: recording.disambiguation
      }] : [])
    });
  }

  if (action === 'artist-details') {
    const artist = data as MusicBrainzArtist & {
      relations?: Array<{
        type?: string;
        url?: { resource?: string };
      }>;
    };
    if (!artist.id || !artist.name) return json({ error: 'Metadata artis tidak ditemukan.' }, 404);
    const imageRelation = artist.relations?.find((relation) =>
      relation.type === 'image' && relation.url?.resource
    );
    return json({
      id: artist.id,
      name: artist.name,
      disambiguation: artist.disambiguation,
      country: artist.country,
      type: artist.type,
      photoUrl: imageRelation?.url?.resource
    });
  }

  const recording = data as MusicBrainzRecording & {
    releases?: Array<{
      id?: string;
      title?: string;
      'cover-art-archive'?: { front?: boolean };
    }>;
  };
  if (!recording.id || !recording.title) return json({ error: 'Metadata rekaman tidak ditemukan.' }, 404);
  const releases = (recording.releases ?? [])
    .filter((item) => item.id)
    .sort((left, right) => Number(Boolean(right['cover-art-archive']?.front)) - Number(Boolean(left['cover-art-archive']?.front)));
  let albumArt: string | undefined;
  let coverReleaseTitle: string | undefined;
  for (const release of releases.slice(0, 3)) {
    const coverUrl = `https://coverartarchive.org/release/${release.id}/front-250`;
    try {
      const coverResponse = await fetch(coverUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000)
      });
      const isRedirect = coverResponse.status >= 300 && coverResponse.status < 400;
      if (coverResponse.ok || isRedirect) {
        albumArt = coverResponse.headers.get('location') ?? coverUrl;
        coverReleaseTitle = release.title;
        await coverResponse.body?.cancel();
        break;
      }
      await coverResponse.body?.cancel();
    } catch (error) {
      console.warn('Cover Art Archive lookup failed:', error);
    }
  }
  return json({
    id: recording.id,
    title: recording.title,
    artist: recordingArtist(recording),
    length: recording.length,
    disambiguation: recording.disambiguation,
    releaseTitle: coverReleaseTitle ?? releases[0]?.title,
    albumArt
  });
});
