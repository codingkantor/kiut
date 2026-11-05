// Service worker KIUT: menyimpan semua file agar aplikasi bisa dipakai offline.
// Setiap kali data.js (atau file lain) diubah, naikkan CACHE agar HP mengambil versi baru.
const CACHE = 'kiut-2026.11.06';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './calc.js',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', event => {
  // cache: 'reload' memaksa unduh dari server, bukan dari cache HTTP browser yang mungkin masih versi lama.
  const segar = ASSETS.map(u => new Request(u, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(segar)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
