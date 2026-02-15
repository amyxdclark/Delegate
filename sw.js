/* Delegate PWA Service Worker (simple, GitHub Pages friendly) */
const CACHE_NAME = "delegate-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./app/app.js",
  "./app/state.js",
  "./app/ui.js",
  "./app/utils.js",
  "./assets/styles.css",
  "./data/seed.json",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for app shell, network-first for anything else
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // For navigation, serve index.html (SPA)
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then(resp => resp || fetch("./index.html"))
    );
    return;
  }

  // Cache first for known assets
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(net => {
      // Update cache opportunistically for GET
      if (req.method === "GET") {
        const copy = net.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return net;
    }).catch(() => cached))
  );
});
