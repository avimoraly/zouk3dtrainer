const CACHE_NAME = 'zouk-trainer-v3';
// Critical assets — install fails loudly if these can't be cached
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manual.html',
];
// Optional assets — cached best-effort; a missing icon won't break the install
const OPTIONAL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/preview.png',
];
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

// Install: critical assets atomically; everything else best-effort
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CRITICAL_ASSETS); // must succeed
      await Promise.allSettled(OPTIONAL_ASSETS.map((u) => cache.add(u)));
      await Promise.allSettled(CDN_ASSETS.map((u) => cache.add(u)));
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: always try network first for navigations (HTML pages) so new pages like
// manual.html are never masked by a stale cache; cache-first for other assets.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        })
        .catch(async () => {
          // Offline: serve cached version of this page, or fall back to the app shell
          const cached = await caches.match(req);
          if (cached) return cached;
          const shell = await caches.match('/index.html') || await caches.match('/');
          return shell || Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response && response.status === 200) {
          const url = req.url;
          if (url.includes('cdnjs') || url.includes('unpkg')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
        }
        return response;
      });
    })
  );
});
