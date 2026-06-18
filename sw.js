// ════════════════════════════════════════════════
// SOMBKIETA AUTO ÉCOLE — Service Worker PWA
// ════════════════════════════════════════════════
const CACHE_NAME = 'sombkieta-v1';

// Ressources à mettre en cache dès l'installation
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ─── INSTALL : mise en cache initiale ───
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE : nettoyage des anciens caches ───
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH : stratégie Cache-First, réseau en fallback ───
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et les requêtes Firebase/externes
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isExternal = url.origin !== self.location.origin;

  if (isExternal) {
    // Pour les ressources externes (Firebase, CDN) : réseau direct
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Pas en cache → réseau + mise en cache dynamique
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Hors-ligne et pas en cache : rien à faire
      });
    })
  );
});
