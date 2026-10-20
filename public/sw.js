// Savero & Soffie — High Performance Service Worker
// Enables instant repeat loads (0ms from Cache) and full offline resilience

const CACHE_NAME = 'savero-soffie-v2';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo/logo%20couple%203d.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin external API requests (Supabase, Google APIs)
  if (request.method !== 'GET') return;
  if (url.origin.includes('supabase.co') || url.pathname.startsWith('/api/')) return;

  // Navigation requests: Network First, falling back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }

  // Static Assets (WebP, JS, CSS, Fonts): Stale-While-Revalidate
  const isStatic =
    url.pathname.match(/\.(js|css|webp|png|jpg|svg|woff2|woff|ttf)$/) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});
