// Service worker pentru Școala de șoferi — face aplicația disponibilă offline,
// oricât timp a trecut de la ultima deschidere cu internet.
const CACHE_NAME = 'scoala-soferi-cache-v17';
const FILES_DE_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './xlsx.full.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_DE_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nume) =>
      Promise.all(nume.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Strategie: încearcă rețeaua întâi (ca să prinzi mereu ultima versiune când ai
// internet), iar dacă nu ai semnal, servește din cache — deci aplicația se
// deschide oricum, chiar și fără nicio conexiune.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Conexiunile cu contul Google și baza de date (Firebase) nu trec prin cache
  const gazda = new URL(event.request.url).hostname;
  if ((gazda.endsWith('googleapis.com') && !gazda.startsWith('fonts.')) || gazda.endsWith('google.com') || gazda.endsWith('firebaseapp.com')) return;
  event.respondWith(
    fetch(event.request)
      .then((raspuns) => {
        const copie = raspuns.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
        return raspuns;
      })
      .catch(() => caches.match(event.request).then((r) => {
        if (r) return r;
        // pagina principală doar pentru navigare; pentru scripturi/fonturi lipsă nu întoarcem HTML
        return event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
      }))
  );
});
