/**
 * Acuterium Master Ops Dashboard — Service Worker (Next.js port)
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 *
 * Cache strategy:
 *   - App shell (the /master-ops page, manifest, icons) → cache-first
 *   - Next.js static assets (/_next/static/*) → stale-while-revalidate
 *   - Self-hosted fonts (/fonts/*) → stale-while-revalidate (also immutable per vercel.json)
 *   - /api/* and authenticated paths → network-first (no offline fallback to avoid stale data)
 *
 * NOTE: This is the Phase 1A Next.js port of the original standalone-HTML sw.js
 * from the v1.3 PWA bundle. APP_SHELL paths and cache-first matcher are
 * adapted to the Next.js route /master-ops instead of the HTML filename.
 */
const VERSION = 'acu-master-ops-v1.4.0-rc.2';
const SHELL = 'shell::' + VERSION;
const RUNTIME = 'runtime::' + VERSION;

const APP_SHELL = [
  '/master-ops',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/brand/acuterium-logo.svg',
  '/sovereign-fonts.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) =>
      // Tolerant addAll: each fetch is independent so one missing asset
      // doesn't abort the whole install. Best-effort shell caching.
      Promise.all(APP_SHELL.map((url) =>
        fetch(url, { cache: 'no-store', credentials: 'include' }).then((res) => {
          if (res && res.ok) return c.put(url, res);
        }).catch(() => { /* tolerate */ })
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin + GET
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never cache API calls — always network-first with no fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // Never cache the login page or login API
  if (url.pathname === '/login') {
    event.respondWith(fetch(req));
    return;
  }

  // Cache-first for the master-ops route and its app-shell assets
  const isShell = APP_SHELL.some((p) => url.pathname === p)
    || url.pathname === '/master-ops'
    || url.pathname.startsWith('/master-ops/');

  if (isShell) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('/master-ops')))
    );
    return;
  }

  // Stale-while-revalidate for fonts, icons, Next.js static assets
  if (/\.(woff2?|ttf|otf|png|jpg|jpeg|svg|webp|gif|ico|css|js)$/i.test(url.pathname)
   || url.pathname.startsWith('/_next/static/')
   || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.open(RUNTIME).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req).then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Default: network-first, fall back to cache, then offline shell
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req).then((hit) => hit || caches.match('/master-ops'))
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
