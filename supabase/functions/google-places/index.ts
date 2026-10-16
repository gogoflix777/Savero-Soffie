import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Metode tidak diizinkan.' }, 405);

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!authorization || !supabaseUrl || !anonKey) return json({ error: 'Sesi Supabase tidak tersedia.' }, 401);
  if (!googleMapsApiKey) return json({ error: 'Secret GOOGLE_MAPS_API_KEY belum dipasang pada Supabase.' }, 503);

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false }
  });
  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError || !userResult.user) return json({ error: 'Silakan masuk ke akun pasangan terlebih dahulu.' }, 401);
  const { data: isMember, error: memberError } = await client.rpc('is_couple_member');
  if (memberError || isMember !== true) return json({ error: 'Pencarian tempat hanya untuk anggota pasangan.' }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Isi permintaan tidak valid.' }, 400);
  }
  if (typeof body !== 'object' || body === null) return json({ error: 'Isi permintaan tidak valid.' }, 400);

  const textQuery = 'textQuery' in body && typeof body.textQuery === 'string' ? body.textQuery.trim() : '';
  const maxResultCount = 'maxResultCount' in body && typeof body.maxResultCount === 'number'
    ? Math.max(1, Math.min(Math.floor(body.maxResultCount), 20))
    : 16;
  const locationBias = 'locationBias' in body ? body.locationBias : undefined;
  if (!textQuery || textQuery.length > 200) return json({ error: 'Kata pencarian harus berisi 1–200 karakter.' }, 400);

  let placesResponse: Response;
  try {
    placesResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.googleMapsUri,places.photos,places.priceLevel,places.primaryType,places.editorialSummary',
        'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1'
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount,
        ...(locationBias ? { locationBias } : {})
      })
    });
  } catch {
    return json({ error: 'Google Places tidak dapat dihubungi. Coba lagi nanti.' }, 502);
  }
  if (!placesResponse.ok) return json({ error: `Google Places merespons HTTP ${placesResponse.status}.` }, 502);

  let result: unknown;
  try {
    result = await placesResponse.json();
  } catch {
    return json({ error: 'Google Places mengirim respons dengan format yang tidak valid.' }, 502);
  }
  if (typeof result !== 'object' || result === null) {
    return json({ error: 'Google Places mengirim respons dengan format yang tidak valid.' }, 502);
  }
  return json(result);
});
