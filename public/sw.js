// TravelMate Service Worker - Safe Pass-Through & Auto-Clean
// Cleans up any prior caches and unregisters immediately to ensure single-instance module loading

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Pass through all network requests directly
self.addEventListener('fetch', () => {});
