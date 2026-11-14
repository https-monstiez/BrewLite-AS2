const CACHE = 'brewlite-offline-v1';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.add('/offline.html'))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('brewlite-') && key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  // Do not cache authenticated pages, API responses, or payment operations.
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
});
