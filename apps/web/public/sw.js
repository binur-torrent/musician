const CACHE_NAME = "musician-shell-v2";
const SHELL = ["/login", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/auth") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Don't cache redirects or errors — only stable 200 HTML/assets.
        if (!response.ok || response.status !== 200) return response;
        if (response.type === "opaqueredirect") return response;

        const contentType = response.headers.get("content-type") ?? "";
        if (
          !contentType.includes("text/html") &&
          !contentType.includes("javascript") &&
          !contentType.includes("css") &&
          !contentType.includes("manifest")
        ) {
          return response;
        }

        const clone = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    }),
  );
});
