import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

function getGeneratedText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null || !('candidates' in payload) || !Array.isArray(payload.candidates)) {
    return '';
  }
  const candidate: unknown = payload.candidates[0];
  if (typeof candidate !== 'object' || candidate === null || !('content' in candidate)) return '';
  const content: unknown = candidate.content;
  if (typeof content !== 'object' || content === null || !('parts' in content) || !Array.isArray(content.parts)) return '';
  return content.parts
    .map((part: unknown) =>
      typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string' ? part.text : ''
    )
    .join('')
    .trim();
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Metode tidak diizinkan.' }, 405);

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!authorization || !supabaseUrl || !anonKey) {
    return json({ error: 'Sesi Supabase tidak tersedia.' }, 401);
  }
  if (!geminiApiKey) return json({ error: 'Secret GEMINI_API_KEY belum dipasang pada Supabase.' }, 503);

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false }
  });
  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError || !userResult.user) return json({ error: 'Silakan masuk ke akun pasangan terlebih dahulu.' }, 401);
  const { data: isMember, error: memberError } = await client.rpc('is_couple_member');
  if (memberError || isMember !== true) return json({ error: 'Fitur ini hanya untuk anggota pasangan.' }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Isi permintaan tidak valid.' }, 400);
  }
  if (typeof body !== 'object' || body === null) return json({ error: 'Isi permintaan tidak valid.' }, 400);

  const title = 'title' in body && typeof body.title === 'string' ? body.title.trim() : '';
  const sender = 'sender' in body && typeof body.sender === 'string' ? body.sender.trim() : '';
  const recipient = 'recipient' in body && typeof body.recipient === 'string' ? body.recipient.trim() : '';
  if (!title || title.length > 120 || !sender || sender.length > 80 || !recipient || recipient.length > 80) {
    return json({ error: 'Judul dan nama pengirim/penerima wajib diisi dan tidak boleh terlalu panjang.' }, 400);
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Tulis satu surat singkat romantis dalam bahasa Indonesia, berjudul "${title}". Surat itu ditulis dari ${sender} untuk ${recipient}. Gunakan nada hangat, manis, personal, dan menggambarkan kebahagiaan bersama.`
            }]
          }]
        })
      }
    );
  } catch {
    return json({ error: 'Layanan Gemini tidak dapat dihubungi. Coba lagi nanti.' }, 502);
  }
  if (!response.ok) return json({ error: `Gemini gagal membuat surat (HTTP ${response.status}).` }, 502);

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    return json({ error: 'Gemini mengirim respons dengan format yang tidak valid.' }, 502);
  }
  const text = getGeneratedText(result);
  if (!text) return json({ error: 'Gemini tidak mengembalikan isi surat.' }, 502);
  return json({ text });
});
