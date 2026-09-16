// ============================================================================
// TRAGE HIER DEINE EIGENEN FIREBASE-PROJEKTDATEN EIN.
// Du bekommst diese Werte, wenn du in der Firebase-Konsole
// (https://console.firebase.google.com) dein Projekt anlegst unter:
// Projekteinstellungen -> "Meine Apps" -> Web-App hinzufügen (</>)
// Eine ausführliche Anleitung dazu steht in der README.md.
// ============================================================================
export const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};

// Für Push-Benachrichtigungen: Firebase-Konsole -> Projekteinstellungen -> Cloud Messaging ->
// "Web-Push-Zertifikate" -> Schlüsselpaar generieren. Ohne diesen Wert funktionieren
// Benachrichtigungen nicht, der Rest der App läuft aber ganz normal weiter.
export const vapidKey = "DEIN_VAPID_KEY";
