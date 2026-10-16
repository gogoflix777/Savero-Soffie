import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const expected = Deno.env.get('CLEANUP_SECRET');
  if (!expected || request.headers.get('x-cleanup-secret') !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return Response.json({ error: 'Function secrets are missing.' }, { status: 500 });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: expired, error: selectError } = await admin
    .from('daily_checkins')
    .select('id,photo_path')
    .lte('expires_at', new Date().toISOString())
    .or('diary_text.not.is.null,photo_path.not.is.null')
    .limit(500);
  if (selectError) return Response.json({ error: selectError.message }, { status: 500 });

  const paths = [...new Set((expired ?? []).flatMap((row) => row.photo_path ? [row.photo_path] : []))];
  if (paths.length) {
    const { error: removeError } = await admin.storage.from('daily-diary').remove(paths);
    if (removeError) return Response.json({ error: removeError.message }, { status: 500 });
  }

  const ids = (expired ?? []).map((row) => row.id);
  if (ids.length) {
    const { error: clearError } = await admin.from('daily_checkins').update({ diary_text: null, photo_path: null }).in('id', ids);
    if (clearError) return Response.json({ error: clearError.message }, { status: 500 });
  }
  return Response.json({ cleaned: ids.length, photosRemoved: paths.length });
});
