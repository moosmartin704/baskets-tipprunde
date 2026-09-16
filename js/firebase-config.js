// ============================================================================
// TRAGE HIER DEINE EIGENEN FIREBASE-PROJEKTDATEN EIN.
// Du bekommst diese Werte, wenn du in der Firebase-Konsole
// (https://console.firebase.google.com) dein Projekt anlegst unter:
// Projekteinstellungen -> "Meine Apps" -> Web-App hinzufügen (</>)
// Eine ausführliche Anleitung dazu steht in der README.md.
// ============================================================================
export const firebaseConfig = {
  apiKey: "AIzaSyCYYNvfoG43Xr9l23RVxlEDYkkSMPwRLY8",
  authDomain: "baskets-tipprunde.firebaseapp.com",
  projectId: "baskets-tipprunde",
  storageBucket: "baskets-tipprunde.firebasestorage.app",
  messagingSenderId: "761869689864",
  appId: "1:761869689864:web:8c015489d3bef8d6049dbd"
};

// Für Push-Benachrichtigungen: Firebase-Konsole -> Projekteinstellungen -> Cloud Messaging ->
// "Web-Push-Zertifikate" -> Schlüsselpaar generieren. Ohne diesen Wert funktionieren
// Benachrichtigungen nicht, der Rest der App läuft aber ganz normal weiter.
export const vapidKey = "BBQxg-vqGZcyU5Hk5f7LNIWjCm6GntfIpGWbJ7N4DHLEK3Wb-7UyxGYJeajRX8NCutBpo1r-342Y74dX6KPEuI0";
