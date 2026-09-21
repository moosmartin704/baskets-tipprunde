const CACHE_NAME = "baskets-tipprunde-v18";
const FONT_CACHE = "baskets-tipprunde-fonts-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/main.js",
  "./js/firebase.js",
  "./js/firebase-config.js",
  "./js/data.js",
  "./js/scoring.js",
  "./js/standings-core.js",
  "./js/state.js",
  "./js/router.js",
  "./js/auth.js",
  "./js/util.js",
  "./js/ui.js",
  "./js/views/shared.js",
  "./js/views/dashboard.js",
  "./js/views/matchdays.js",
  "./js/views/matchdayDetail.js",
  "./js/views/bonusDetail.js",
  "./js/views/standings.js",
  "./js/views/table.js",
  "./js/views/admin.js",
  "./js/views/profile.js",
  "./js/views/bonn.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

// ----------------------------------------------------------------------------
// Push-Benachrichtigungen (Firebase Cloud Messaging) anzeigen.
// Bewusst ein eigener "push"-Handler statt firebase-messaging-compat mit
// onBackgroundMessage: Die Firebase-Bibliothek zeigt Nachrichten nur an, solange die
// App im Hintergrund ist - ist sie offen, reicht sie die Nachricht an die Seite weiter,
// und dort gab es keinen Empfänger (am 19.09.2026 ging so eine Bonn-Erinnerung verloren,
// obwohl FCM sie angenommen hatte). Außerdem wartet event.waitUntil() jetzt, bis die
// Benachrichtigung wirklich angezeigt ist - sonst kann v. a. iOS den Service Worker
// vorher beenden. Der Bot und die Ankündigung schicken reine "data"-Payloads
// ({ data: { title, body } }, siehe scripts/*/*.mjs); ein "notification"-Payload würde
// hier genauso angezeigt, aber nie doppelt, da es keinen zweiten Handler mehr gibt.
// Das Gerätetoken holt weiterhin die Seite (js/views/profile.js, getToken mit dieser
// Service-Worker-Registrierung) - dafür braucht der Service Worker kein Firebase.
// ----------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { data: { body: event.data?.text() || "" } };
  }
  const data = payload.data || {};
  const title = data.title || payload.notification?.title || "Baskets Tipprunde";
  const body = data.body || payload.notification?.body || "";
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: "icons/icon-192.png", badge: "icons/icon-192.png"
  }));
});

// Ohne diesen Handler passiert beim Antippen einer Hintergrund-Benachrichtigung nichts
// (v.a. auf Android/Chrome) - er öffnet ein vorhandenes Tab (fokussiert es) oder startet
// die App neu, falls gerade kein Tab offen ist.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== FONT_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Schriften (Google Fonts) einmal laden und danach aus dem Cache nehmen – auch offline.
  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(req).then((cached) => cached || fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // Firebase/CDN requests: immer live aus dem Netz

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
