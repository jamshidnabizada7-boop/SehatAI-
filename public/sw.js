// ============================================================
// SehatAI — Service worker (app-shell offline caching)
//
// Safety rules (deliberate, conservative):
//   1. /api/* requests are NEVER intercepted or cached — chat,
//      eval, reminders always go to the live network.
//   2. Navigations are NETWORK-FIRST: fresh HTML whenever online
//      (also safe during development); cached shell only when
//      the network is unreachable.
//   3. Only same-origin static assets are cached (cache-first):
//      /_next/static chunks, icons, manifest.
//
// The in-app offline guidance engine is NOT part of this file —
// it already lives in the client bundle and activates when
// navigator.onLine is false.
// ============================================================

const CACHE = 'sehatai-shell-v4';
const SHELL_URLS = ['/', '/manifest.json', '/icon.svg', '/logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => {
        // precache failure must not block installation — runtime
        // caching will still populate the shell on first loads.
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST/SSE etc: always network

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // cross-origin: network
  if (url.pathname.startsWith('/api/')) return; // API: never touch

  if (req.mode === 'navigate') {
    // network-first with cached-shell fallback
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches
            .match('/')
            .then((cached) => cached || caches.match(req))
            .then(
              (cached) =>
                cached ||
                new Response(
                  '<!doctype html><meta charset="utf-8"><title>SehatAI</title><p>SehatAI is offline and not yet cached. Reconnect once to enable offline mode.</p>',
                  { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
                ),
            ),
        ),
    );
    return;
  }

  // static assets: cache-first (content-hashed URLs are immutable)
  if (url.pathname.startsWith('/_next/static/') || SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
            return res;
          }),
      ),
    );
  }
});
