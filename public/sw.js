/* Service worker du backoffice PWA.
 * - Cache du shell applicatif (navigation offline)
 * - Stale-while-revalidate pour les assets statiques Next
 * - Réseau uniquement pour l'API (données fraîches + sécurité)
 * - Support des notifications push
 */

const VERSION = "v1";
const STATIC_CACHE = `mk-static-${VERSION}`;
const PAGES_CACHE = `mk-pages-${VERSION}`;

// Ressources de secours toujours disponibles hors-ligne.
const PRECACHE_URLS = ["/offline.html", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, PAGES_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // On ne gère que le GET same-origin. Le reste (POST, API externe) passe direct.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation (pages) : network-first, repli sur le cache puis page offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline.html");
        })
    );
    return;
  }

  // Assets statiques (_next/static, icônes…) : stale-while-revalidate.
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icon") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

// --- Notifications push ---

self.addEventListener("push", (event) => {
  let payload = { title: "Backoffice", body: "Nouvelle notification" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: payload.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
