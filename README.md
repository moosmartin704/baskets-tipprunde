# 🏀 Baskets Tipprunde

Eine kleine Web-App für eine private BBL-Tipprunde mit Freunden. Läuft im Browser und lässt sich
auf dem Handy (iOS & Android) wie eine App auf den Homescreen legen (PWA).

- Jeder Spieltag ist einzeln tippbar (Sieger-Tipp, 1 Punkt für richtig getippten Sieger).
- „Offene Tipps“ auf der Startseite zeigt alle Spiele der nächsten 14 Tage, unabhängig davon,
  an welchem Wochentag sie stattfinden.
- Jeder Spieltag wird einzeln ausgewertet (Spieltagssieger), zusätzlich zur Gesamtwertung.
- Bonusfragen laufen als eigene "Bonusrunde" (wie ein zusätzlicher Spieltag), inkl. Fragen mit
  mehreren richtigen Antworten (z. B. "welche 8 Teams erreichen die Playoffs?").
- Playoffs werden wie normale Spieltage abgebildet, jedes Spiel einzeln tippbar.
- Jedes Jahr kannst du in der Verwaltung eine neue Saison anlegen (optional inkl. Übernahme der
  Teams aus der Vorsaison), ohne die Historie der alten Saison zu verlieren.
- Eigene Seite „Telekom Baskets Bonn" (verlinkt im Profil): alle Spiele – Liga, Champions League
  und Netto BBL Pokal – auf einen Blick, nicht tippbar, Heimspiele farblich hervorgehoben, mit
  Filter „Nur Heimspiele" und einer persönlich einstellbaren Heimspiel-Push-Erinnerung.
- Push-Nachricht, sobald ein Spieltag komplett ausgewertet ist und ein Sieger feststeht
  (im Profil abwählbar).

## Wie die App technisch funktioniert

Es ist eine reine HTML/CSS/JavaScript-Seite ganz ohne Build-Prozess (kein npm/React nötig).
Damit deine Tipps zwischen dir und deinen Freunden synchronisiert werden, nutzt die App
**Firebase** (Google) im Hintergrund:

- **Firebase Authentication** – jeder registriert sich mit eigener E-Mail/Passwort.
- **Cloud Firestore** – die Datenbank, in der Saison, Spiele, Tipps etc. gespeichert werden.

Beides ist im kostenlosen Firebase-Tarif ("Spark") für eine kleine Tipprunde völlig ausreichend
und kostet nichts.

**Wichtig zum Sicherheitsmodell:** Es gibt kein zusätzliches Admin-Passwort – wer verwalten darf
(Saison/Teams/Spieltage/Ergebnisse/Bonusfragen), wird stattdessen über eine feste Liste von
E-Mail-Adressen gesteuert (Datei `config/appConfig` in Firestore, siehe Schritt 1). Alle anderen
angemeldeten Nutzer:innen können weiterhin nur tippen, sehen aber unter „Profil“ keinen Eintrag
„Verwaltung“. Ein direkter Datenbankzugriff (z. B. über die Browser-Konsole) könnte theoretisch
fremde Tipps einsehen, bevor ein Spiel beginnt – die App selbst zeigt anderen aber nirgends fremde
Einzel-Tipps vor Spielbeginn an.

---

## 1. Firebase-Projekt einrichten (einmalig)

Das musst du selbst tun, da dafür ein eigenes Google-Konto nötig ist.

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com) und melde dich mit
   einem Google-Konto an.
2. **Projekt hinzufügen** → Namen vergeben, z. B. `baskets-tipprunde` → Google Analytics kannst du
   deaktivieren (wird nicht gebraucht) → Projekt erstellen.
3. Im Projekt links auf **Build → Authentication** → "Los geht's" → Tab **Sign-in method** →
   **E-Mail/Passwort** aktivieren und speichern.
4. Links auf **Build → Firestore Database** → **Datenbank erstellen** → Standort wählen (z. B.
   `eur3 (europe-west)`) → im **Produktionsmodus** starten.
5. Danach auf den Tab **Regeln** und den Inhalt der Datei [`firestore.rules`](firestore.rules) aus
   diesem Projekt komplett hineinkopieren (vorhandenen Text ersetzen) → **Veröffentlichen**.
6. Zurück zur Projektübersicht (Zahnrad oben links → **Projekteinstellungen**) → ganz unten bei
   "Meine Apps" auf das Web-Symbol `</>` klicken → App registrieren (Name z. B. "Tipprunde-Web",
   Firebase Hosting NICHT aktivieren) → Firebase zeigt dir jetzt einen Code-Block mit
   `firebaseConfig = { apiKey: ..., ... }`.
7. Öffne in diesem Projekt die Datei [`js/firebase-config.js`](js/firebase-config.js) und trage
   dort genau diese Werte ein (die Platzhalter `DEIN_...` ersetzen).
8. **Admins festlegen:** Im Firestore-Tab **Daten** → **Startsammlung erstellen** → Sammlungs-ID
   `config` → Dokument-ID `appConfig` → ein Feld hinzufügen: Name `adminEmails`, Typ **Array**, und
   darin die E-Mail-Adressen aller Admins/Spielleiter eintragen (z. B. deine eigene und die deines
   Kumpels, mit denen ihr euch später auch in der App registriert). Nur diese Adressen sehen die
   „Verwaltung“ (unter „Profil“) und dürfen Ergebnisse eintragen. Weitere Admins könnt ihr später einfach durch
   Bearbeiten dieses Arrays hinzufügen/entfernen.

Das war's – ab jetzt läuft die Datenbank im Hintergrund.

---

## 2. App auf GitHub Pages veröffentlichen

1. Erstelle auf [github.com](https://github.com) ein neues, **privates oder öffentliches**
   Repository, z. B. `baskets-tipprunde`.
2. Lade den kompletten Inhalt dieses Projektordners in das Repository hoch (z. B. per
   Drag & Drop im Browser über "Add file → Upload files", oder über Git):

   ```bash
   cd "Baskets Tipprunde"
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DEIN-NUTZERNAME/baskets-tipprunde.git
   git push -u origin main
   ```

3. Im Repository: **Settings → Pages** → unter "Build and deployment" als Quelle
   **Deploy from a branch** wählen, Branch `main`, Ordner `/ (root)` → **Save**.
4. Nach ein bis zwei Minuten ist die Seite erreichbar unter
   `https://DEIN-NUTZERNAME.github.io/baskets-tipprunde/`.
5. Falls du ein **privates** Repo nutzt: GitHub Pages für private Repos benötigt GitHub Pro (oder
   ein Organisations-Konto). Alternativ das Repo öffentlich lassen – ohne Zugangsdaten aus
   `firebase-config.js` mit hochzuladen ist das kein Sicherheitsproblem, da der Zugriff auf die
   Daten über die Firestore-Regeln (nur angemeldete Nutzer) abgesichert ist.

Diesen Link teilst du mit deinen Freunden.

---

## 3. Nutzer:innen einrichten

Jede:r Freund:in öffnet den GitHub-Pages-Link und registriert sich selbst über den Tab
**"Registrieren"** mit E-Mail, Passwort und Anzeigename (der Name erscheint in der Bestenliste).
Ein eigenes Konto pro Person ist nötig, damit Tipps eindeutig zugeordnet werden können. Admins/
Spielleiter registrieren sich genauso normal – wichtig ist nur, dass ihre E-Mail-Adresse exakt in
`config/appConfig.adminEmails` steht (siehe Schritt 1.8), dann schaltet sich die Verwaltung nach
dem Login automatisch für sie frei.

---

## 4. Als App auf dem Handy installieren

**iPhone (Safari):**
1. Link im Safari-Browser öffnen (muss Safari sein, nicht Chrome).
2. Teilen-Symbol (Quadrat mit Pfeil) → **Zum Home-Bildschirm**.

**Android (Chrome):**
1. Link in Chrome öffnen.
2. Menü (drei Punkte) → **App installieren** bzw. **Zum Startbildschirm hinzufügen**.

Die App startet danach ohne Browser-Leiste, wie eine normale App, inkl. eigenem Icon.

---

## 5. Saison einrichten (Verwaltung)

Unter **Profil → Verwaltung** legst du Schritt für Schritt an:

1. **Tab „Saison“**: Neue Saison anlegen (z. B. "2026/2027") und danach mit **Aktivieren** als
   aktive Saison markieren – nur die aktive Saison wird Nutzer:innen angezeigt.
2. **Tab „Teams“**: Alle Vereine der Liga eintragen (Name + Kürzel). Das Kürzel (z. B. BON, ALB)
   steht in den runden Tipp-Buttons; für die BBL-Teams schlägt die App passende Kürzel automatisch
   vor, ändern kannst du sie direkt in der Teamliste.
3. **Tab „Spieltage“**: Statt jedes Spiel einzeln anzulegen, gibt es den Kasten
   **„Spielplan-Massenimport“**: dort einen kompletten Spielplan einfügen (ein Spiel pro Zeile,
   Format `Spieltag;Datum;Uhrzeit;Heimteam;Auswärtsteam`) und auf **„Spielplan importieren“**
   klicken — Teams und Spieltage werden dabei automatisch mit angelegt. Für die Saison 2026/2027
   liegt die fertige Datei [`spielplan-2026-27-import.txt`](spielplan-2026-27-import.txt) bereits
   im Projekt (Inhalt inkl. der `#`-Kommentarzeilen einfach hineinkopieren). Für Playoffs bzw.
   künftige Saisons einzelne Spiele weiterhin manuell über die Formulare darunter anlegen. Auch
   nach dem Import können Anstoßzeiten über „Anstoß ändern“ korrigiert werden (relevant, da die
   BBL Termine wegen TV-Übertragungen öfter noch verschiebt) und Ergebnisse eingetragen werden
   (Button „Ergebnis eintragen“ direkt in der Spieltag-Detailansicht oder in der Verwaltung).
4. **Tab „Bonusfragen“**: Eine Bonusrunde anlegen (z. B. "Saisonprognose"), optional mit
   Abgabefrist. Darin Fragen hinzufügen:
   - **Einzelauswahl**: genau eine richtige Antwort (z. B. "Wer wird Meister?").
   - **Mehrfachauswahl**: mehrere richtige Antworten, z. B. "Welche 8 Teams erreichen die
     Playoffs?" → Typ Mehrfachauswahl, Anzahl auszuwählender Antworten = 8, alle Teams als
     Antwortmöglichkeiten eintragen (eine pro Zeile). Punkte pro richtiger Auswahl sind frei
     wählbar (z. B. 1 Punkt pro korrekt getipptem Team).
   - **Standardfrage einfügen**: Im Formular für eine neue Frage gibt es vorgefertigte Vorlagen
     ("Playoff-Einzug", "Absteiger", "Meister", "Tabellenplatz-Frage" für ein einzelnes Team) –
     füllt Frage, Antwortmöglichkeiten (alle Teams der Saison bzw. Plätze 1–18) und Punkte
     automatisch aus. Drei der vier Vorlagen (alle außer "Meister") werden danach vom
     **stündlichen BBL-Check automatisch ausgewertet**, sobald die Hauptrunde komplett beendet
     ist – kein Admin-Klick nötig, siehe Abschnitt 7. Die Meister-Frage bleibt manuell, weil
     Playoffs aktuell noch nicht als Spieltage abgebildet werden (dafür fehlt eine automatische
     Datengrundlage).
   - Für alle anderen Fragen: Sobald das echte Ergebnis feststeht, bei der Frage auf
     **„Auflösen“** klicken und die tatsächlich richtige(n) Antwort(en) auswählen – die Punkte
     werden danach automatisch für alle berechnet.
5. **Tab „Bonn“**: Champions-League- und Pokal-Spiele der Telekom Baskets Bonn eintragen (Gegner,
   Heim/Auswärts, Termin) – erscheinen auf der Bonn-Seite (verlinkt im Profil), sind aber nicht
   tippbar. Liga-Spiele von Bonn kommen automatisch aus dem normalen Spielplan dazu.

## 6. Jährliche Anpassung an die neue Saison

Du musst den Code nicht anfassen! Einfach im Tab „Saison“ eine neue Saison anlegen (optional die
Teams aus der Vorsaison übernehmen, falls sich die Liga kaum ändert, und danach einzelne Teams
ergänzen/löschen), dann Spieltage/Spiele/Bonusfragen für die neue Saison anlegen und sie über
„Aktivieren“ scharfschalten. Die alte Saison bleibt inkl. alter Tipps und Tabellen vollständig
erhalten und ist über das Dropdown in der Verwaltung weiterhin einsehbar.

---

## 7. Automatischer Spielplan-/Ergebnis-Check

Ein stündlicher GitHub-Actions-Job (`.github/workflows/daily-bbl-check.yml`, Skript in
`scripts/daily-bbl-check/`) gleicht die aktive Saison automatisch mit der offiziellen
easyCredit-BBL-Website ab. Stündlich statt nur einmal täglich, damit Ergebnisse spätestens eine
Stunde nach Abpfiff eingetragen sind – für ein öffentliches Repo sind GitHub-Actions-Minuten
unbegrenzt und kostenlos, der Lauf dauert nur ca. 20 Sekunden, häufiger prüfen kostet also nichts.

- **Ergebnisse** abgeschlossener Spiele werden **direkt eingetragen** – kein Admin-Klick nötig.
  Falls doch mal etwas nicht stimmt, bleibt das Ergebnis wie gewohnt über „Ergebnis eintragen“ in
  der Spieltag-Ansicht bzw. Verwaltung jederzeit korrigierbar.
- **Anstoßzeit-Verschiebungen** landen weiterhin nur als Vorschlag im Tab **„Änderungen“** in der
  Verwaltung und müssen von einem Admin per Klick auf „Übernehmen“ bestätigt werden – bewusst
  nicht automatisch, weil Anstoßzeiten die Tipp-Sperrfrist beeinflussen und die BBL Termine
  öfter kurzfristig verlegt.
- **Bonusfragen mit Tabellen-Bezug** (aus den Standardfrage-Vorlagen, siehe Abschnitt 5) werden
  ebenfalls automatisch ausgewertet, sobald alle Hauptrunden-Spiele beendet sind – Grundlage ist
  dieselbe Tabellenberechnung wie auf der BBL-Tabelle-Seite (`js/standings-core.js`, wird von App
  und Bot gemeinsam genutzt).
- Der Job prüft nur ein *nahes Zeitfenster* (die auf easycredit-bbl.de aktuell angezeigten
  Spiele, grob die letzten/nächsten Tage). Das reicht zuverlässig für Ergebnisse (die erscheinen
  ja unmittelbar nach Spielende), erkennt aber **keine langfristigen Verlegungen** (z. B. ein
  Spiel, das Monate im Voraus auf einen ganz anderen Termin verschoben wird) proaktiv – dafür
  bräuchte es einen aufwändigeren Voll-Saison-Abgleich, der von einer nicht offiziell
  dokumentierten Paginierung der BBL-Seite abhängt und entsprechend fehleranfälliger wäre. Solche
  Fälle fallen typischerweise beim Tippen selbst auf (wie schon einmal passiert) und lassen sich
  jederzeit manuell über „Anstoß ändern“ korrigieren.
- **Spieltags-Sieger-Push**: Sobald alle Spiele eines Spieltags beendet sind, verschickt der Job
  einmalig eine Push-Nachricht mit dem/den Sieger(n) an alle Nutzer:innen, die das nicht im Profil
  abgewählt haben.
- **Bonn-Heimspiel-Erinnerung**: Für Nutzer:innen mit aktivierter Erinnerung (Bonn-Seite, siehe
  oben) verschickt der Job eine Push-Nachricht, sobald ein Heimspiel ins jeweils individuell
  eingestellte Zeitfenster fällt.

**Einrichtung (einmalig):**

1. Firebase-Konsole → Projekteinstellungen → **Dienstkonten** → „Neuen privaten Schlüssel
   generieren“ → JSON-Datei wird heruntergeladen (**niemals ins Repository committen!**).
2. GitHub-Repo → **Settings → Secrets and variables → Actions → New repository secret** → Name
   `FIREBASE_SERVICE_ACCOUNT_KEY` → kompletten Inhalt der JSON-Datei einfügen → Speichern.
3. Fertig – der Job läuft ab sofort automatisch jede volle Stunde. Manuell testen: Tab **Actions**
   im Repo → „Stündlicher BBL-Abgleich“ → **Run workflow**. Die Logs zeigen genau, was übernommen
   bzw. vorgeschlagen wurde.

Der Job nutzt bewusst ein **Firebase-Dienstkonto** (Firebase Admin SDK) statt der Zugangsdaten
eines echten Admin-Accounts – das umgeht die Firestore-Regeln gezielt nur für diesen Bot, ist nicht
an ein Passwort gebunden (bleibt also z. B. bei einer Passwort-Änderung weiter gültig) und lässt
sich bei Bedarf unabhängig widerrufen (Firebase-Konsole → Dienstkonten → Schlüssel löschen).

---

## 8. Push-Erinnerungen für offene Tipps (optional)

Nutzer:innen können in ihrem **Profil** auf „🔔 Benachrichtigungen aktivieren“ klicken, um eine
Erinnerung zu bekommen, wenn sie kurz vor knapp noch nicht getippt haben. In der Verwaltung
(Tab „Saison“) stellst du als Admin ein, wie viele Stunden vorher das sein soll (Standard: 12h) –
das gilt sowohl für Spiele als auch für Bonusfragen-Fristen.

**Wichtig für iPhones:** Push-Benachrichtigungen funktionieren auf iOS nur innerhalb einer über
„Zum Home-Bildschirm hinzufügen“ installierten PWA, nicht in einem normalen Safari-Tab. Auf
Android/Desktop-Chrome funktioniert es auch im Browser.

Damit das tatsächlich funktioniert, fehlen noch zwei Dinge:

1. **Cloud Messaging aktivieren:** Firebase-Konsole → Projekteinstellungen → Tab
   **Cloud Messaging** → unter „Web-Push-Zertifikate“ ein Schlüsselpaar generieren → den Wert in
   [`js/firebase-config.js`](js/firebase-config.js) bei `vapidKey` eintragen. Außerdem die
   `firebaseConfig`-Werte (dieselben wie in `firebase-config.js`) oben in
   [`service-worker.js`](service-worker.js) eintragen (ein Service Worker kann die Werte nicht
   direkt aus der App-Datei importieren, deshalb stehen sie dort zusätzlich einmal).
2. **Den stündlichen Versand einrichten:** Ein Cloud-Agent (ähnlich wie der tägliche
   Spielplan-Check) müsste stündlich prüfen, welche Spiele/Bonusfragen in den nächsten X Stunden
   fällig sind, wer dafür noch nicht getippt hat (und noch keine Erinnerung dafür bekommen hat –
   das wird in der Sammlung `remindersSent` vermerkt, um Doppel-Benachrichtigungen zu vermeiden),
   und den eigentlichen Versand über die Firebase-Cloud-Messaging-API auslösen. Das richte ich mit
   dir ein, sobald Firebase live ist.

---

## Projektstruktur

```
index.html              App-Grundgerüst
manifest.json           PWA-Manifest (Name, Icons, Startverhalten)
service-worker.js       Offline-Caching für installierte App
firestore.rules         Sicherheitsregeln für die Datenbank
css/style.css           Gesamtes Styling (Plakat-Design: Magenta, Anton + Archivo)
js/firebase-config.js   Deine Firebase-Projektdaten (hier eintragen!)
js/firebase.js          Firebase-Initialisierung
js/data.js              Alle Datenbankzugriffe (Firestore)
js/scoring.js           Punkteberechnung
js/auth.js              Login/Registrierung
js/router.js            Einfaches Hash-Routing
js/main.js              App-Einstiegspunkt, untere Navigationsleiste
js/ui.js                Design-Bausteine (Icons, Kopfbereich, Team-Kürzel)
js/views/               Eine Datei pro Ansicht (Dashboard, Spieltage, Verwaltung, …)
icons/                  App-Icons (PWA + iOS)
```

## Bekannte Grenzen

- Keine Push-Benachrichtigungen (die "offenen Tipps"-Liste musst du aktiv in der App ansehen).
- Kein Admin-Passwort – Vertrauensbasis unter Freunden (siehe oben).
- Bei einem Basketball-Ergebnis mit Punktegleichstand (praktisch nie der Fall) wertet die App das
  neutral als "unentschieden", niemand bekommt dafür einen Punkt.
