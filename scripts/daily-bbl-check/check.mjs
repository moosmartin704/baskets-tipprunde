// ============================================================================
// Stuendlicher Abgleich mit der offiziellen easyCredit-BBL-Website.
//
// Was der Job macht:
// 1. Laedt die Spiele der aktiven Saison aus Firestore.
// 2. Laedt die "aktuellen Spiele" von easycredit-bbl.de (oeffentliche Seite,
//    kein offizielles API -> siehe fetchBblCurrentGames() fuer Details/Risiken).
// 3. Fuer Spiele mit Endergebnis: traegt das Ergebnis DIREKT ein (kein Vorschlag,
//    kein Admin-Klick noetig - wie von Martin gewuenscht). Admins koennen das
//    Ergebnis wie gewohnt ueber "Ergebnis eintragen" korrigieren, falls noetig.
// 4. Fuer Spiele mit abweichender Anstosszeit: legt einen Vorschlag in
//    "pendingChanges" ab (wie bisher - landet im Tab "Aenderungen", muss von
//    einem Admin bestaetigt werden). Grund: Anstoss-Verschiebungen sind zum
//    Teil vorlaeufig/kurzfristig und beeinflussen die Tipp-Sperrfrist, deshalb
//    bewusst NICHT automatisch.
//
// Laeuft per GitHub Actions Cron (siehe .github/workflows/daily-bbl-check.yml)
// mit einem Firebase-Dienstkonto (Admin SDK, umgeht die Firestore-Regeln
// gezielt fuer diesen Bot - siehe README fuer Einrichtung).
//
// WICHTIGER HINWEIS zur Datenquelle:
// easycredit-bbl.de bietet kein offiziell dokumentiertes, oeffentliches API.
// Dieses Skript liest ein JSON ("__NEXT_DATA__"), das die Website selbst zum
// serverseitigen Rendern in die aufgerufene Seite einbettet - das ist die
// gleiche Information, die jede/r Besucher:in sowieso zu sehen bekommt, nur
// strukturiert statt als HTML-Text. Aendert die BBL ihre Website-Technik
// (z. B. Wechsel von Next.js auf etwas anderes), bricht dieses Skript und
// muss angepasst werden - der Job faellt dann NICHT lautlos aus, sondern
// schlaegt in den GitHub-Actions-Logs sichtbar fehl (siehe main()-Fehlerbehandlung).
// ============================================================================

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const KICKOFF_DRIFT_MINUTES = 15; // ab wann eine Zeitabweichung als "echt" gilt (Rundungstoleranz)
const BBL_URL = "https://www.easycredit-bbl.de/saison/aktuelle-spiele";

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

/**
 * Liest die "Aktuelle Spiele"-Seite und extrahiert das eingebettete
 * __NEXT_DATA__-JSON, darin den Widget-Block mit scheduledGames/finishedGames.
 * Gibt ein flaches Array von Spielen zurueck: { home, away, scheduledTime, result }
 */
async function fetchBblCurrentGames() {
  const res = await fetch(BBL_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BasketsTipprundeBot/1.0; +https://github.com/moosmartin704/baskets-tipprunde)" }
  });
  if (!res.ok) throw new Error(`BBL-Seite antwortete mit Status ${res.status}`);
  const html = await res.text();

  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(
      "Konnte __NEXT_DATA__ nicht in der BBL-Seite finden - vermutlich hat " +
      "easycredit-bbl.de ihre Website-Technik geaendert. Skript muss angepasst werden."
    );
  }

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    throw new Error("__NEXT_DATA__ gefunden, aber kein gueltiges JSON: " + err.message);
  }

  const widgetData = data?.props?.pageProps?.preloadedWidgetData;
  if (!widgetData) {
    throw new Error("Kein preloadedWidgetData im __NEXT_DATA__ gefunden - Seitenstruktur hat sich geaendert.");
  }

  for (const key of Object.keys(widgetData)) {
    const val = widgetData[key];
    if (val && val.scheduledGames && val.finishedGames) {
      const items = [
        ...(val.scheduledGames.items || []),
        ...(val.finishedGames.items || [])
      ];
      return items.map((g) => ({
        bblId: g.id,
        home: g.homeTeam?.name,
        away: g.guestTeam?.name,
        scheduledTime: g.scheduledTime,
        status: g.status,
        result: g.result
      }));
    }
  }

  throw new Error("Widget mit scheduledGames/finishedGames nicht gefunden - Seitenstruktur hat sich geaendert.");
}

/**
 * Versucht aus dem BBL-"result"-Objekt ein {home, away}-Zahlenpaar zu lesen.
 * Das exakte Feldformat war zum Zeitpunkt der Entwicklung nicht verifizierbar
 * (Saison hatte noch nicht begonnen, alle result-Objekte waren leer "{}").
 * Deshalb bewusst defensiv: mehrere plausible Formate probieren, bei echten
 * (nicht-leeren) aber unbekannten Formaten laut warnen statt zu raten.
 */
function parseResult(bblGame) {
  const r = bblGame.result;
  if (!r || typeof r !== "object") return null;

  const candidates = [
    [r.homeScore, r.guestScore],
    [r.homeScore, r.awayScore],
    [r.home, r.guest],
    [r.home, r.away],
    [r.homePoints, r.guestPoints],
    [r.homeTeamScore, r.guestTeamScore]
  ];
  for (const [h, a] of candidates) {
    if (typeof h === "number" && typeof a === "number") return { home: h, away: a };
  }

  if (Object.keys(r).length > 0) {
    console.warn(
      `  Unbekanntes Ergebnis-Format bei ${bblGame.home} - ${bblGame.away}, ` +
      `wird ignoriert (bitte manuell in der Verwaltung eintragen): ${JSON.stringify(r)}`
    );
  }
  return null;
}

async function main() {
  const db = initFirestore();

  const seasonsSnap = await db.collection("seasons").where("isActive", "==", true).limit(1).get();
  if (seasonsSnap.empty) {
    console.log("Keine aktive Saison in Firestore - nichts zu tun.");
    return;
  }
  const seasonId = seasonsSnap.docs[0].id;
  console.log(`Aktive Saison: ${seasonId}`);

  const gamesSnap = await db.collection("games").where("seasonId", "==", seasonId).get();
  const gamesByTeams = new Map();
  for (const doc of gamesSnap.docs) {
    const g = doc.data();
    gamesByTeams.set(`${g.homeTeamName}|||${g.awayTeamName}`, { id: doc.id, ...g });
  }
  console.log(`${gamesSnap.size} Spiele der aktiven Saison aus Firestore geladen.`);

  const bblGames = await fetchBblCurrentGames();
  console.log(`${bblGames.length} Spiele von ${BBL_URL} geladen.`);

  let resultsApplied = 0;
  let resultMismatches = 0;
  let kickoffFlags = 0;
  let unmatched = 0;

  for (const bg of bblGames) {
    if (!bg.home || !bg.away) continue;
    const key = `${bg.home}|||${bg.away}`;
    const ours = gamesByTeams.get(key);
    if (!ours) {
      unmatched++;
      continue;
    }

    // --- Ergebnis: automatisch uebernehmen, sofern noch nicht eingetragen ---
    const score = parseResult(bg);
    if (score) {
      if (ours.status !== "finished") {
        await db.collection("games").doc(ours.id).update({
          homeScore: score.home,
          awayScore: score.away,
          status: "finished"
        });
        console.log(`Ergebnis eingetragen: ${bg.home} ${score.home}:${score.away} ${bg.away}`);
        resultsApplied++;
      } else if (ours.homeScore !== score.home || ours.awayScore !== score.away) {
        console.warn(
          `Abweichung bei bereits eingetragenem Ergebnis ${bg.home} - ${bg.away}: ` +
          `bei uns ${ours.homeScore}:${ours.awayScore}, BBL meldet ${score.home}:${score.away}. ` +
          `Wurde NICHT automatisch ueberschrieben - bitte manuell pruefen.`
        );
        resultMismatches++;
      }
    }

    // --- Anstosszeit: nur als Vorschlag ablegen, solange das Spiel noch offen ist ---
    if (bg.scheduledTime && ours.status !== "finished") {
      const bblMs = new Date(bg.scheduledTime).getTime();
      const ourMs = ours.kickoff.toMillis();
      const diffMin = Math.abs(bblMs - ourMs) / 60000;
      if (Number.isFinite(diffMin) && diffMin > KICKOFF_DRIFT_MINUTES) {
        const changeId = `${ours.id}_kickoff`;
        await db.collection("pendingChanges").doc(changeId).set(
          {
            seasonId,
            gameId: ours.id,
            type: "kickoff",
            field: "kickoff",
            oldValue: ours.kickoff.toDate().toISOString(),
            newValue: new Date(bblMs).toISOString(),
            note: `${bg.home} - ${bg.away}`,
            source: "BBL-Automatik (taeglicher Check)",
            createdAt: Timestamp.now()
          },
          { merge: true }
        );
        console.log(`Anstoss-Abweichung erkannt (${bg.home} - ${bg.away}) -> Vorschlag in "Aenderungen" abgelegt/aktualisiert.`);
        kickoffFlags++;
      }
    }
  }

  console.log(
    `Fertig. ${resultsApplied} Ergebnis(se) automatisch uebernommen, ` +
    `${resultMismatches} Abweichung(en) bei bestehenden Ergebnissen (nicht ueberschrieben), ` +
    `${kickoffFlags} Anstoss-Aenderung(en) vorgeschlagen, ` +
    `${unmatched} BBL-Spiel(e) ohne Zuordnung zu unseren Daten.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fehler im taeglichen BBL-Check:", err);
    process.exit(1);
  });
