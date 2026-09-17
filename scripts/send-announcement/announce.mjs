// ============================================================================
// Verschickt eine einmalige Push-Nachricht an ALLE Nutzer:innen mit mindestens
// einem registrierten Geraetetoken (users/{uid}.fcmTokens) - unabhaengig von
// den einzelnen Erinnerungs-Einstellungen (Tipp-Erinnerung, Spieltagssieger-
// Push, Bonn-Heimspiel-Erinnerung), da es sich um eine allgemeine Mitteilung
// an die ganze Runde handelt (z.B. Saisonbegruessung), nicht um eine der
// bestehenden automatischen Benachrichtigungsarten.
//
// Nur manuell ueber "workflow_dispatch" auslösbar (siehe
// .github/workflows/send-announcement.yml, Tab "Actions" im Repo), kein
// Zeitplan - dafuer ist bewusst ein bewusster Klick noetig, damit nicht aus
// Versehen eine Nachricht an alle rausgeht.
// ============================================================================

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function initFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "Umgebungsvariable FIREBASE_SERVICE_ACCOUNT_KEY fehlt. " +
      "Muss als GitHub-Actions-Secret hinterlegt sein (siehe README)."
    );
  }
  const serviceAccount = JSON.parse(raw);
  initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
}

async function main() {
  const title = process.env.ANNOUNCE_TITLE;
  const body = process.env.ANNOUNCE_BODY;
  if (!title || !body) {
    throw new Error("ANNOUNCE_TITLE und ANNOUNCE_BODY muessen gesetzt sein.");
  }

  const db = initFirestore();
  const usersSnap = await db.collection("users").get();
  const tokens = usersSnap.docs.flatMap((d) => d.data().fcmTokens || []);

  if (!tokens.length) {
    console.log("Keine registrierten Geraetetokens gefunden - nichts zu verschicken.");
    return;
  }

  console.log(`Verschicke Ankuendigung an ${tokens.length} Geraet(e): "${title}" / "${body}"`);
  // "data"-Payload statt "notification" (siehe check.mjs sendPush()): vermeidet doppelte
  // Benachrichtigungen, da sonst sowohl der Browser automatisch als auch der
  // onBackgroundMessage-Handler in service-worker.js je eine Anzeige ausloesen.
  const res = await getMessaging().sendEachForMulticast({ tokens, data: { title, body } });
  console.log(`Fertig: ${res.successCount} erfolgreich, ${res.failureCount} fehlgeschlagen.`);
  if (res.failureCount) {
    res.responses.forEach((r, i) => {
      if (!r.success) console.warn(`  Token #${i}: ${r.error?.message}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fehler beim Versand der Ankuendigung:", err);
    process.exit(1);
  });
