// Maplewood as an installed app. The page is fetched fresh whenever there is a connection (so updates arrive
// right away) and kept for playing offline. Icons, the manifest and the fonts are kept after their first load.
// Music is left to the network: streamed audio comes in pieces that a cache cannot hold.
// build.sh stamps __BUILD__, so each new build replaces the old service worker and clears its cache.
const CACHE = 'maplewood-__BUILD__';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('maplewood-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('/music/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => keep(req, res)).catch(() => caches.match(req).then(m => m || caches.match('./'))));
    return;
  }
  if (url.origin === location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => keep(req, res))));
  }
});
