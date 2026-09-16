const CACHE_NAME = "baskets-tipprunde-v6";
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
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

// ----------------------------------------------------------------------------
// Push-Benachrichtigungen (Firebase Cloud Messaging) im Hintergrund empfangen.
// WICHTIG: Diese Werte müssen exakt mit js/firebase-config.js übereinstimmen.
// Ein Service Worker kann keine ES-Module importieren, daher hier dupliziert.
// ----------------------------------------------------------------------------
try {
  importScripts(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
  );
  firebase.initializeApp({
    apiKey: "DEIN_API_KEY",
    authDomain: "DEIN_PROJEKT.firebaseapp.com",
    projectId: "DEIN_PROJEKT",
    storageBucket: "DEIN_PROJEKT.appspot.com",
    messagingSenderId: "DEINE_SENDER_ID",
    appId: "DEINE_APP_ID"
  });
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Baskets Tipprunde";
    const body = payload.notification?.body || "";
    self.registration.showNotification(title, {
      body, icon: "icons/icon-192.png", badge: "icons/icon-192.png"
    });
  });
} catch (err) {
  console.warn("Firebase Messaging im Service Worker nicht verfügbar:", err);
}

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
