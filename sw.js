/* ============================================================
   Service Worker – Cache-First strategy
   All app assets are cached on install so the app works
   fully offline after the first load.
   ============================================================ */

const CACHE_NAME = 'geburtstagsapp-v10';

// All files that must be cached for offline use
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/calendar.css',
  './css/transitions.css',
  './js/app.js',
  './js/storage.js',
  './js/utils.js',
  './js/views/start-view.js',
  './js/views/calendar-view.js',
  './js/views/day-view.js',
  './js/views/form-view.js',
  './js/views/delete-dialog.js',
  './js/views/search-view.js',
  './js/views/settings-view.js',
  './js/export.js',
  './js/import.js',
  './icons/icon-180.png?v=1.2.0',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/fonts.css',
  './fonts/inter-latin.woff2',
  './fonts/inter-latin-ext.woff2',
];

/* --- Install: pre-cache all assets --- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

/* --- Activate: remove outdated caches --- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

/* --- Message: allow manual update trigger --- */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/* --- Fetch: serve from cache, fall back to network --- */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // Not in cache → try network, cache the response for next time
      return fetch(event.request).then((response) => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
