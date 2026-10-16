Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const expected = Deno.env.get('CLEANUP_SECRET');
  if (!expected || request.headers.get('x-cleanup-secret') !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json({
    cleaned: 0,
    photosRemoved: 0,
    message: 'Diary history retention is enabled; no data was removed.'
  });
});
