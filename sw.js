/* Service worker JusTunes: l'app funziona offline dopo la prima visita.
 * Rete prima, cache come riserva. L'audio (richieste "range") passa sempre dalla rete. */
const VERSION = "justunes-v5";
const SHELL = ["./", "index.html", "manifest.json",
  "css/base.css", "css/layout.css", "css/components.css", "css/player.css", "css/buttons.css", "css/responsive.css",
  "js/main.js", "js/config.js", "js/utils.js", "js/icons.js", "js/state.js", "js/data.js",
  "js/components.js", "js/views.js", "js/player.js", "js/covers.js", "js/store.js",
  "data/artisti.json", "data/brani.json", "data/playlist.json",
  "img/icon-192.png", "img/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.headers.has("range")) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
