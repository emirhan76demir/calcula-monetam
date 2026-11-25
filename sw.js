const CACHE = "cm-v4";
const SHELL = [
  "./",
  "index.html",
  "css/app.css",
  "js/config.js",
  "js/i18n.js",
  "js/core.js",
  "js/app.js",
  "icon.svg",
  "manifest.webmanifest",
  "data/tcmb.js",
  "fonts/hanken-grotesk-latin.woff2",
  "fonts/hanken-grotesk-latin-ext.woff2",
  "fonts/martian-mono-latin.woff2",
  "fonts/martian-mono-latin-ext.woff2",
  "fonts/chivo-latin.woff2",
  "fonts/chivo-latin-ext.woff2",
  "fonts/archivo-latin.woff2",
  "fonts/archivo-latin-ext.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});
