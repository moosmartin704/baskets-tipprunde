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
//    Uebernommen wird nur ein offiziell bestaetigtes Ergebnis (BBL-Status
//    "OFFICIAL") - waehrend des Spiels steht im selben Feld schon der Zwischenstand.
// 4. Fuer Spiele mit abweichender Anstosszeit: legt einen Vorschlag in
//    "pendingChanges" ab (wie bisher - landet im Tab "Aenderungen", muss von
//    einem Admin bestaetigt werden). Grund: Anstoss-Verschiebungen sind zum
//    Teil vorlaeufig/kurzfristig und beeinflussen die Tipp-Sperrfrist, deshalb
//    bewusst NICHT automatisch.
// 5. Bonusfragen mit einer "autoResolve"-Regel (siehe js/views/admin.js,
//    Standardfrage-Vorlagen) werden automatisch ausgewertet, sobald die
//    Hauptrunde komplett beendet ist - z. B. "Playoff-Einzug (Plaetze 1-6)"
//    oder "Auf welchem Platz landet Team X". Fragen ohne diese Regel (z. B.
//    "Wer wird Meister?") bleiben weiterhin manuell ueber "Aufloesen".
// 6. Sobald alle Spiele eines Spieltags beendet sind, geht einmalig eine Push-
//    Nachricht mit dem/den Spieltagssieger(n) an alle Nutzer:innen raus, die
//    das nicht abgewaehlt haben (users/{uid}.notifyMatchdayWinner, Default an).
// 7. Heimspiel-Erinnerungen fuer die Telekom Baskets Bonn (Liga + manuell
//    gepflegte Champions-League-/Pokal-Zusatzspiele, siehe Verwaltung Tab
//    "Bonn"): jede Person kann in ihrem Profil individuell Vorlaufzeit und
//    Wettbewerbe einstellen (users/{uid}.bonnReminder), der Bot verschickt
//    die Push-Nachricht, sobald ein Heimspiel ins jeweils eingestellte
//    Zeitfenster faellt (jede/r bekommt sie nur einmal pro Spiel).
//
// 8. Live-Modus: Laeuft gerade ein Spiel (oder beginnt eines in der naechsten gut
//    einen Stunde), bleibt der Job nach dem Abgleich aktiv und fragt jede Minute
//    die BBL-Seite der laufenden Spiele ab. Den Zwischenstand schreibt er nach
//    games/{id}.live (die App zeigt ihn live an), das Endergebnis traegt er
//    wenige Minuten nach Spielende ein und wertet sofort aus (Sieger-Push usw.).
//    Zwischendurch laeuft der komplette Abgleich weiter einmal pro Stunde. Sind
//    keine Spiele mehr offen, beendet sich der Job (siehe liveLoop()).
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
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import {
  computeLeagueTable, allFinished, regularSeasonGames, computeMatchdayScores, matchdayWinners
} from "../../js/standings-core.js";

const KICKOFF_DRIFT_MINUTES = 15; // ab wann eine Zeitabweichung als "echt" gilt (Rundungstoleranz)
const BBL_URL = "https://www.easycredit-bbl.de/saison/aktuelle-spiele";
const BBL_GAME_URL = (bblId) => `https://www.easycredit-bbl.de/spiele/${bblId}`;
const USER_AGENT = "Mozilla/5.0 (compatible; BasketsTipprundeBot/1.0; +https://github.com/moosmartin704/baskets-tipprunde)";

// Live-Modus (siehe liveLoop()):
const LIVE_TICK_SECONDS = 60;          // Abfrage-Takt waehrend laufender Spiele
const LIVE_LOOKAHEAD_MINUTES = 70;     // so frueh vor Anpfiff bleibt der Job schon aktiv (Cron ist stuendlich)
const LIVE_WINDOW_HOURS = 4;           // so lange nach Anpfiff wird ein Spiel ohne Ergebnis beobachtet (wie js/views/dashboard.js)
const LIVE_HEARTBEAT_MINUTES = 5;      // Live-Stand auch ohne Aenderung neu schreiben (z. B. Halbzeit), damit die App ihn nicht als veraltet verwirft
const FULL_SYNC_EVERY_MINUTES = 60;    // kompletter Abgleich auch waehrend des Live-Modus einmal pro Stunde
const MAX_RUN_MINUTES = 330;           // GitHub Actions bricht Jobs nach 6 h ab - vorher sauber beenden, der naechste Lauf macht weiter

// Muss exakt zu js/data.js (BONN_TEAM_NAME) passen. Dort als Konstante exportiert, aber dieses
// Node-Skript kann js/data.js nicht importieren (das haengt am Firebase-Web-SDK/Browser).
const BONN_TEAM_NAME = "Telekom Baskets Bonn";
const COMPETITION_LABELS = { liga: "Liga", cl: "Champions League", pokal: "Netto BBL Pokal" };

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
  const { html } = await fetchPage(BBL_URL);
  const data = extractNextData(html);

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
        bblId: String(g.id),
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

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`BBL-Seite ${url} antwortete mit Status ${res.status}`);
  return { html: await res.text(), cache: res.headers.get("x-nextjs-cache") };
}

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(
      "Konnte __NEXT_DATA__ nicht in der BBL-Seite finden - vermutlich hat " +
      "easycredit-bbl.de ihre Website-Technik geaendert. Skript muss angepasst werden."
    );
  }
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    throw new Error("__NEXT_DATA__ gefunden, aber kein gueltiges JSON: " + err.message);
  }
}

/**
 * Liest die Seite eines einzelnen Spiels (easycredit-bbl.de/spiele/<id>). Anders als die
 * "Aktuelle Spiele"-Liste ist sie waehrend des Spiels nahezu in Echtzeit (am 18.09.2026 bei
 * ALBA - Chemnitz gemessen: Abweichung zur Live-Anzeige unter 30 Sekunden; die Liste stand
 * dagegen bis 14 Minuten nach Spielende auf "PRE").
 * Die Seite wird per "stale-while-revalidate" ausgeliefert: Eine als STALE markierte Antwort
 * stammt vom vorherigen Aufruf und stoesst im Hintergrund die Aktualisierung an - dann nach
 * kurzer Pause ein zweites Mal abrufen, um den frischen Stand zu bekommen.
 */
async function fetchBblGame(bblId) {
  let page = await fetchPage(BBL_GAME_URL(bblId));
  if (page.cache === "STALE") {
    await sleep(3000);
    page = await fetchPage(BBL_GAME_URL(bblId));
  }
  const g = extractNextData(page.html)?.props?.pageProps?.initialGameData;
  if (!g) throw new Error(`Keine initialGameData auf der BBL-Seite von Spiel ${bblId} - Seitenstruktur hat sich geaendert.`);
  return {
    bblId: String(g.id),
    home: g.homeTeam?.name,
    away: g.guestTeam?.name,
    status: g.status,
    period: g.gameProgress || null,
    clock: g.gameTime || null,
    result: g.result
  };
}

/**
 * Liest aus einem BBL-Spiel (Liste oder Einzelseite) das offizielle Endergebnis als
 * {home, away}. Verifiziert am 18.09.2026: Die BBL liefert den Stand in
 * result.homeTeamFinalScore/guestTeamFinalScore - und zwar schon WAEHREND des Spiels als
 * Zwischenstand. Deshalb zaehlt er erst als Ergebnis, wenn der Status "OFFICIAL" ist
 * (Ablauf: PRE -> LIVE -> POST beim Schlusspfiff -> OFFICIAL wenige Minuten spaeter).
 */
function parseResult(bblGame) {
  if (bblGame.status !== "OFFICIAL") return null;
  const score = parseScore(bblGame.result);
  if (!score && bblGame.result && Object.keys(bblGame.result).length > 0) {
    console.warn(
      `  Unbekanntes Ergebnis-Format bei ${bblGame.home} - ${bblGame.away}, ` +
      `wird ignoriert (bitte manuell in der Verwaltung eintragen): ${JSON.stringify(bblGame.result)}`
    );
  }
  return score;
}

/** Spielstand {home, away} aus dem BBL-"result"-Objekt, egal ob Zwischen- oder Endstand. */
function parseScore(r) {
  if (!r || typeof r !== "object") return null;

  // Das erste Format ist das tatsaechlich verwendete, die weiteren sind Rueckfallebenen
  // fuer den Fall, dass die BBL die Felder umbenennt.
  const candidates = [
    [r.homeTeamFinalScore, r.guestTeamFinalScore],
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
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Kompletter Abgleich, danach ggf. Live-Modus (siehe liveLoop()).
 */
async function main() {
  // initializeApp() darf pro Prozess nur einmal aufgerufen werden - deshalb
  // hier vor der Retry-Schleife und nicht in runOnce() (sonst "duplicate-app"
  // Fehler beim zweiten Versuch).
  const db = initFirestore();
  const startedAt = Date.now();

  const ctx = await runOnceWithRetry(db);
  if (!ctx) return;
  const hadErrors = await liveLoop(db, ctx, startedAt);
  if (hadErrors) {
    throw new Error("Im Live-Modus sind Fehler aufgetreten (siehe Log oben) - Job wird als fehlgeschlagen markiert.");
  }
}

/**
 * Fuehrt den eigentlichen Check aus und wiederholt bei "RESOURCE_EXHAUSTED"
 * (Google-Cloud-Kontingent kurzzeitig ausgeschoepft - kommt bei frisch
 * angelegten Firebase-Projekten in den ersten 1-2 Tagen gelegentlich vor,
 * bis Google die Standard-Kontingente automatisch erhoeht) mit steigender
 * Wartezeit. Alle Operationen in runOnce() sind idempotent (erneutes
 * Ausfuehren richtet keinen Schaden an), ein kompletter Neuversuch ist
 * deshalb sicher.
 */
async function runOnceWithRetry(db) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runOnce(db);
    } catch (err) {
      const isQuotaError = err?.code === 8 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(String(err?.message));
      if (isQuotaError && attempt < maxAttempts) {
        const waitSeconds = attempt * 15;
        console.warn(
          `Google-Cloud-Kontingent kurzzeitig ausgeschoepft (Versuch ${attempt}/${maxAttempts}). ` +
          `Warte ${waitSeconds}s und versuche es erneut...`
        );
        await sleep(waitSeconds * 1000);
        continue;
      }
      throw err;
    }
  }
}

async function runOnce(db) {
  const seasonsSnap = await db.collection("seasons").where("isActive", "==", true).limit(1).get();
  if (seasonsSnap.empty) {
    console.log("Keine aktive Saison in Firestore - nichts zu tun.");
    return;
  }
  const seasonId = seasonsSnap.docs[0].id;
  console.log(`[${berlinTime()}] Aktive Saison: ${seasonId}`);

  const gamesSnap = await db.collection("games").where("seasonId", "==", seasonId).get();
  const allGames = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const gamesByTeams = new Map();
  for (const g of allGames) {
    gamesByTeams.set(`${g.homeTeamName}|||${g.awayTeamName}`, g);
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

    // --- BBL-ID merken: fuer den Live-Modus und den Live-Ticker-Link in der App ---
    if (bg.bblId && ours.bblId !== bg.bblId) {
      await db.collection("games").doc(ours.id).update({ bblId: bg.bblId });
      ours.bblId = bg.bblId;
    }

    // --- Ergebnis: automatisch uebernehmen, sofern noch nicht eingetragen ---
    const score = parseResult(bg);
    if (score) {
      if (ours.status !== "finished") {
        await applyFinalResult(db, ours, score);
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

  const matchdaysSnap = await db.collection("matchdays").where("seasonId", "==", seasonId).get();
  const matchdays = matchdaysSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const bonusResolved = await resolveBonusQuestions(db, seasonId, allGames, matchdays);
  const winnersNotified = await notifyMatchdayWinners(db, seasonId, allGames, matchdays, users);
  const bonnRemindersSent = await sendBonnReminders(db, seasonId, allGames, users);

  console.log(
    `Fertig. ${resultsApplied} Ergebnis(se) automatisch uebernommen, ` +
    `${resultMismatches} Abweichung(en) bei bestehenden Ergebnissen (nicht ueberschrieben), ` +
    `${kickoffFlags} Anstoss-Aenderung(en) vorgeschlagen, ` +
    `${unmatched} BBL-Spiel(e) ohne Zuordnung zu unseren Daten, ` +
    `${bonusResolved} Bonusfrage(n) automatisch ausgewertet, ` +
    `${winnersNotified} Spieltag(e) mit Sieger-Push benachrichtigt, ` +
    `${bonnRemindersSent} Bonn-Heimspiel-Erinnerung(en) verschickt.`
  );

  return { seasonId, allGames };
}

/**
 * Traegt ein Endergebnis ein und raeumt den Live-Stand weg. ours ist dieselbe Objektreferenz
 * wie in allGames - direkt mitschreiben, damit z. B. die Bonusfragen- und Spieltagssieger-
 * Auswertung im selben Lauf schon den aktuellen Stand sieht.
 */
async function applyFinalResult(db, ours, score) {
  await db.collection("games").doc(ours.id).update({
    homeScore: score.home,
    awayScore: score.away,
    status: "finished",
    live: FieldValue.delete()
  });
  ours.homeScore = score.home;
  ours.awayScore = score.away;
  ours.status = "finished";
  delete ours.live;
  console.log(`Ergebnis eingetragen: ${ours.homeTeamName} ${score.home}:${score.away} ${ours.awayTeamName}`);
}

/** Spiele, fuer die der Live-Modus gerade zustaendig ist: offen und kurz vor, im oder kurz nach dem Anpfiff. */
function gamesToWatch(allGames, now) {
  return allGames.filter((g) => {
    if (g.status === "finished" || !g.kickoff) return false;
    const t = g.kickoff.toMillis();
    return t <= now + LIVE_LOOKAHEAD_MINUTES * 60000 && t > now - LIVE_WINDOW_HOURS * 3600000;
  });
}

/**
 * Live-Modus: bleibt aktiv, solange ein Spiel laeuft oder bald beginnt, und fragt jede Minute
 * die BBL-Seiten der laufenden Spiele ab. Der komplette Abgleich (runOnce) laeuft weiter einmal
 * pro Stunde - und sofort, sobald ein Endergebnis eingetragen wurde (Sieger-Push, Bonusfragen).
 * Gibt true zurueck, falls unterwegs ernsthafte Fehler aufgetreten sind (Job soll dann sichtbar
 * fehlschlagen, laeuft aber bis dahin weiter). Einzelne Aussetzer der BBL-Seite zaehlen nicht -
 * erst LIVE_MAX_FAILS Fehlschlaege in Folge fuer dasselbe Spiel (z. B. geaenderte Seitenstruktur).
 */
const LIVE_MAX_FAILS = 5;

async function liveLoop(db, ctx, startedAt) {
  let hadErrors = false;
  let lastFullSync = Date.now();
  let announced = false;
  const warnedMissingId = new Set();
  const failsInARow = new Map();

  while (Date.now() - startedAt < MAX_RUN_MINUTES * 60000) {
    const now = Date.now();
    const watched = gamesToWatch(ctx.allGames, now);
    if (!watched.length) break;
    if (!announced) {
      console.log(
        `Live-Modus: ${watched.length} Spiel(e) laufen oder beginnen bald - Abfrage alle ${LIVE_TICK_SECONDS}s, ` +
        `bis keine Spiele mehr offen sind (hoechstens ${MAX_RUN_MINUTES} Minuten).`
      );
      announced = true;
    }

    let resultApplied = false;
    for (const game of watched.filter((g) => g.kickoff.toMillis() <= now)) {
      if (!game.bblId) {
        if (!warnedMissingId.has(game.id)) {
          console.warn(`  Keine BBL-ID fuer ${game.homeTeamName} - ${game.awayTeamName} (noch nicht auf der BBL-Seite gefunden) - kein Live-Stand.`);
          warnedMissingId.add(game.id);
        }
        continue;
      }
      try {
        resultApplied = (await liveTick(db, game)) || resultApplied;
        failsInARow.delete(game.id);
      } catch (err) {
        const fails = (failsInARow.get(game.id) || 0) + 1;
        failsInARow.set(game.id, fails);
        console.error(`  Live-Abfrage fuer ${game.homeTeamName} - ${game.awayTeamName} fehlgeschlagen (${fails}x in Folge):`, err.message);
        if (fails >= LIVE_MAX_FAILS) hadErrors = true;
      }
    }

    if (resultApplied || Date.now() - lastFullSync >= FULL_SYNC_EVERY_MINUTES * 60000) {
      try {
        ctx = (await runOnceWithRetry(db)) || ctx;
      } catch (err) {
        console.error("Abgleich im Live-Modus fehlgeschlagen:", err);
        hadErrors = true;
      }
      lastFullSync = Date.now();
    }

    await sleep(LIVE_TICK_SECONDS * 1000);
  }

  if (announced) console.log(`[${berlinTime()}] Live-Modus beendet.`);
  return hadErrors;
}

/**
 * Ein Live-Abruf fuer ein angepfiffenes Spiel. Schreibt den Zwischenstand nach games/{id}.live
 * (nur bei Aenderung bzw. als Lebenszeichen alle paar Minuten) oder, sobald die BBL das Ergebnis
 * offiziell bestaetigt hat, das Endergebnis. Gibt true zurueck, wenn ein Endergebnis eingetragen wurde.
 */
async function liveTick(db, game) {
  const bg = await fetchBblGame(game.bblId);
  if (bg.home !== game.homeTeamName || bg.away !== game.awayTeamName) {
    console.warn(`  BBL-Spiel ${game.bblId} ist ${bg.home} - ${bg.away}, erwartet ${game.homeTeamName} - ${game.awayTeamName} - uebersprungen.`);
    return false;
  }

  const final = parseResult(bg);
  if (final) {
    // Frisch nachlesen: Hat ein Admin das Ergebnis inzwischen von Hand eingetragen, bleibt es dabei.
    const current = await db.collection("games").doc(game.id).get();
    if (current.data()?.status === "finished") {
      game.status = "finished";
      return false;
    }
    await applyFinalResult(db, game, final);
    return true;
  }

  if (bg.status !== "LIVE" && bg.status !== "POST") return false; // z. B. noch "PRE" bei spaeterem Beginn

  const score = parseScore(bg.result);
  const live = {
    status: bg.status,
    period: bg.period,
    clock: bg.clock,
    home: score ? score.home : null,
    away: score ? score.away : null
  };
  const prev = game.live;
  const unchanged = prev && ["status", "period", "clock", "home", "away"].every((k) => prev[k] === live[k]);
  const fresh = prev?.updatedAt && Date.now() - prev.updatedAt.toMillis() < LIVE_HEARTBEAT_MINUTES * 60000;
  if (unchanged && fresh) return false;

  live.updatedAt = Timestamp.now();
  await db.collection("games").doc(game.id).update({ live });
  game.live = live;
  if (!unchanged) {
    console.log(`  [${berlinTime()}] ${game.homeTeamName} ${live.home ?? "-"}:${live.away ?? "-"} ${game.awayTeamName} (${live.status} ${live.period || ""} ${live.clock || ""})`);
  }
  return false;
}

function berlinTime() {
  return new Date().toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin" });
}

/**
 * Loest Bonusfragen mit einer "autoResolve"-Regel automatisch auf, sobald die
 * dafuer noetigen Spiele beendet sind (siehe js/views/admin.js fuer die
 * Vorlagen, die dieses Feld setzen). Fragen ohne autoResolve (z. B. "Wer wird
 * Meister?", da Playoffs noch nicht als Spieltage modelliert sind) bleiben
 * unberuehrt und muessen weiterhin manuell ueber "Aufloesen" bearbeitet werden.
 */
async function resolveBonusQuestions(db, seasonId, allGames, matchdays) {
  const questionsSnap = await db.collection("bonusQuestions").where("seasonId", "==", seasonId).get();
  const openAutoQuestions = questionsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((q) => !q.resolved && q.autoResolve);

  if (!openAutoQuestions.length) return 0;

  const regGames = regularSeasonGames(allGames, matchdays);

  if (!allFinished(regGames)) {
    console.log(
      `${openAutoQuestions.length} automatisch aufloesbare Bonusfrage(n) offen, ` +
      `aber die Hauptrunde ist noch nicht komplett beendet - noch nichts zu tun.`
    );
    return 0;
  }

  const teamsSnap = await db.collection("teams").where("seasonId", "==", seasonId).get();
  const teams = teamsSnap.docs.map((d) => d.data());
  const table = computeLeagueTable(regGames, teams);

  let resolvedCount = 0;
  for (const q of openAutoQuestions) {
    const correctOptions = resolveAutoQuestion(q.autoResolve, table);
    if (!correctOptions) {
      console.warn(`Konnte Bonusfrage "${q.text}" nicht automatisch aufloesen (unbekannte autoResolve-Regel).`);
      continue;
    }
    await db.collection("bonusQuestions").doc(q.id).update({ correctOptions, resolved: true });
    console.log(`Bonusfrage automatisch aufgeloest: "${q.text}" -> ${correctOptions.join(", ")}`);
    resolvedCount++;
  }
  return resolvedCount;
}

function resolveAutoQuestion(rule, table) {
  if (rule.kind === "regularSeasonRank") {
    // fromRank/toRank sind 1-basiert und inklusive.
    return table.slice(rule.fromRank - 1, rule.toRank).map((r) => r.team);
  }
  if (rule.kind === "regularSeasonTeamRank") {
    const idx = table.findIndex((r) => r.team === rule.team);
    if (idx === -1) return null;
    return [String(idx + 1)];
  }
  return null;
}

function displayName(user) {
  return user?.displayName || user?.email || "Jemand";
}

/**
 * Sendet eine Push-Nachricht an eine Liste von Nutzer:innen (anhand ihrer fcmTokens).
 * Ignoriert Nutzer:innen ohne Token. Loggt Fehler pro Token, bricht aber nicht ab -
 * ein einzelner ungueltiger/abgelaufener Token soll nicht den ganzen Lauf stoppen.
 */
async function sendPush(recipients, { title, body }) {
  const tokens = recipients.flatMap((u) => u.fcmTokens || []);
  if (!tokens.length) return 0;
  try {
    // "data"-Payload statt "notification": bei "notification"-Payloads zeigt der Browser die
    // Nachricht im Hintergrund automatisch an UND der onBackgroundMessage-Handler in
    // service-worker.js feuert zusaetzlich - das fuehrte zu doppelten Benachrichtigungen.
    // Mit reinem "data"-Payload uebernimmt ausschliesslich der Service-Worker-Handler die Anzeige.
    const res = await getMessaging().sendEachForMulticast({
      tokens,
      data: { title, body }
    });
    if (res.failureCount) {
      console.warn(`  ${res.failureCount}/${tokens.length} Push-Zustellung(en) fehlgeschlagen (z.B. abgelaufene Tokens).`);
    }
    return res.successCount;
  } catch (err) {
    console.warn("  Push-Versand fehlgeschlagen:", err.message);
    return 0;
  }
}

/**
 * Prueft jeden Spieltag, der noch nicht als "Sieger benachrichtigt" markiert ist. Sobald alle
 * Spiele eines Spieltags beendet sind, wird einmalig eine Push-Nachricht an alle Nutzer:innen
 * verschickt, die das nicht deaktiviert haben (users/{uid}.notifyMatchdayWinner !== false).
 */
async function notifyMatchdayWinners(db, seasonId, allGames, matchdays, users) {
  const candidates = matchdays.filter((md) => !md.winnerNotifiedAt);
  if (!candidates.length) return 0;

  let tipsSnap = null; // nur laden, falls tatsaechlich ein Spieltag fertig ist (spart Lesezugriffe)
  let notifiedCount = 0;

  for (const md of candidates) {
    const games = allGames.filter((g) => g.matchdayId === md.id);
    if (!allFinished(games)) continue;

    if (!tipsSnap) {
      tipsSnap = await db.collection("tips").where("seasonId", "==", seasonId).get();
    }
    const tips = tipsSnap.docs.map((d) => d.data());

    const scores = computeMatchdayScores(games, tips);
    const { winners, max } = matchdayWinners(scores);
    const usersById = Object.fromEntries(users.map((u) => [u.id, u]));

    const body = winners.length
      ? `${winners.map((uid) => displayName(usersById[uid])).join(", ")} gewinnt mit ${max} ${max === 1 ? "Punkt" : "Punkten"}.`
      : "Ausgewertet - diesmal ohne eindeutigen Sieger.";

    const recipients = users.filter((u) => u.notifyMatchdayWinner !== false && u.fcmTokens?.length);
    const sent = await sendPush(recipients, { title: `🏀 ${md.label} beendet`, body });

    await db.collection("matchdays").doc(md.id).update({ winnerNotifiedAt: Timestamp.now() });
    console.log(`Spieltag "${md.label}" komplett beendet -> Sieger-Push an ${sent} Geraet(e) verschickt.`);
    notifiedCount++;
  }

  return notifiedCount;
}

/**
 * Verschickt Heimspiel-Erinnerungen fuer die Telekom Baskets Bonn (Liga + Zusatzspiele aus
 * bonnExtraGames) an alle Nutzer:innen mit aktivierter Erinnerung, sobald ein Heimspiel in ihr
 * jeweils eingestelltes Zeitfenster faellt. Jede Person bekommt jede Erinnerung nur einmal
 * (Tracking in der remindersSent-Collection, dieselbe wie fuer die Anstoss-Vorschlaege).
 */
async function sendBonnReminders(db, seasonId, allGames, users) {
  const withReminder = users.filter((u) => u.bonnReminder?.enabled && u.fcmTokens?.length);
  if (!withReminder.length) return 0;

  const now = Date.now();

  const bonnLeagueHomeGames = allGames
    .filter((g) => g.homeTeamName === BONN_TEAM_NAME && g.status !== "finished")
    .map((g) => ({ id: g.id, competition: "liga", opponent: g.awayTeamName, kickoffMs: g.kickoff.toMillis() }));

  const extraSnap = await db.collection("bonnExtraGames").where("seasonId", "==", seasonId).get();
  const bonnExtraHomeGames = extraSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((g) => g.isHome && g.status !== "finished")
    .map((g) => ({ id: g.id, competition: g.competition, opponent: g.opponent, kickoffMs: g.kickoff.toMillis() }));

  const upcomingHomeGames = [...bonnLeagueHomeGames, ...bonnExtraHomeGames].filter((g) => g.kickoffMs > now);
  if (!upcomingHomeGames.length) return 0;

  let sentCount = 0;
  for (const game of upcomingHomeGames) {
    const dueUsers = [];
    for (const user of withReminder) {
      const prefs = user.bonnReminder;
      const competitions = prefs.competitions?.length ? prefs.competitions : ["liga", "cl", "pokal"];
      if (!competitions.includes(game.competition)) continue;
      const hoursBefore = Number(prefs.hoursBefore) || 3;
      if (game.kickoffMs - now > hoursBefore * 3600 * 1000) continue; // noch nicht im Zeitfenster

      const remindKey = `${user.id}_${game.id}_bonn`;
      const alreadySent = await db.collection("remindersSent").doc(remindKey).get();
      if (alreadySent.exists) continue;

      dueUsers.push({ user, remindKey });
    }
    if (!dueUsers.length) continue;

    // timeZone explizit setzen: der GitHub-Runner laeuft in UTC, sonst stuende im Push
    // z. B. "18:00 Uhr" statt "20:00 Uhr" (im Winter 19:00).
    const kickoffLabel = new Date(game.kickoffMs).toLocaleString("de-DE", {
      weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin"
    });
    const sent = await sendPush(dueUsers.map((d) => d.user), {
      title: "🏀 Heimspiel steht an",
      body: `Bonn – ${game.opponent} · ${kickoffLabel} Uhr (${COMPETITION_LABELS[game.competition] || game.competition})`
    });
    sentCount += sent;

    const batch = db.batch();
    for (const { remindKey } of dueUsers) {
      batch.set(db.collection("remindersSent").doc(remindKey), { sentAt: Timestamp.now() });
    }
    await batch.commit();
    console.log(`Heimspiel-Erinnerung fuer Bonn – ${game.opponent} an ${sent} Geraet(e) verschickt.`);
  }

  return sentCount;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fehler im taeglichen BBL-Check:", err);
    process.exit(1);
  });
