// Savero & Soffie — High Performance Service Worker
// Enables instant repeat loads (0ms from Cache), full offline resilience,
// and real native Mobile / Web Push notifications even in background/closed state.

const CACHE_NAME = 'savero-soffie-v3';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo/logo%20couple%203d.webp',
  '/logo/logo%20couple%203d.png'
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

// ==========================================================================
// NATIVE WEB PUSH & BACKGROUND NOTIFICATIONS
// ==========================================================================

// Handle push notification events delivered by browser push service / server
self.addEventListener('push', (event) => {
  let data = {
    title: 'Savero & Soffie ♥',
    body: 'Ada kabar cinta baru untukmu!',
    icon: '/logo/logo%20couple%203d.png',
    badge: '/favicon.ico',
    tag: 'savero-soffie-push',
    url: '/'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      const text = event.data.text();
      if (text) data.body = text;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo/logo%20couple%203d.png',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || `ss-push-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click: focus existing tab or open new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for messages from client tabs (e.g. background notification triggers)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    if (title && options) {
      self.registration.showNotification(title, options);
    }
  }
});

// ==========================================================================
// ASSET FETCHING & CACHING
// ==========================================================================

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
