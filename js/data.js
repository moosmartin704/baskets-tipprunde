// Alle Firestore-Datenzugriffe an einem Ort.
import {
  db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, Timestamp, writeBatch, arrayUnion
} from "./firebase.js";
import { suggestTeamCode } from "./util.js";

const col = (name) => collection(db, name);

/* ---------------------------- Seasons ---------------------------- */

export async function listSeasons() {
  const snap = await getDocs(col("seasons"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

export async function getSeason(seasonId) {
  const s = await getDoc(doc(db, "seasons", seasonId));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function getActiveSeason() {
  const seasons = await listSeasons();
  return seasons.find((s) => s.isActive) || seasons[0] || null;
}

export async function createSeason(name) {
  const ref = await addDoc(col("seasons"), {
    name,
    isActive: false,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });
  return ref.id;
}

export async function setActiveSeason(seasonId) {
  const seasons = await listSeasons();
  const batch = writeBatch(db);
  for (const s of seasons) {
    batch.update(doc(db, "seasons", s.id), { isActive: s.id === seasonId });
  }
  await batch.commit();
}

export async function renameSeason(seasonId, name) {
  await updateDoc(doc(db, "seasons", seasonId), { name });
}

/**
 * Einstellungen für die "Kasse" (Spieltagssieger-Auszahlungen), an der Saison hinterlegt:
 * wer zahlende:r Teilnehmer:in ist und wie hoch die Einsätze sind. participantIds bezieht sich
 * auf Dokument-IDs aus der "users"-Sammlung.
 */
export async function updateSeasonMoneyConfig(seasonId, { perMatchdayFee, seasonFee, participantIds }) {
  await updateDoc(doc(db, "seasons", seasonId), {
    money: { perMatchdayFee, seasonFee, participantIds }
  });
}

/* ----------------------------- Teams ------------------------------ */

export async function listTeams(seasonId) {
  const snap = await getDocs(query(col("teams"), where("seasonId", "==", seasonId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export async function addTeam(seasonId, name, shortName) {
  return addDoc(col("teams"), {
    seasonId, name,
    shortName: shortName || suggestTeamCode(name),
    shortNameCustom: Boolean(shortName)
  });
}

export async function updateTeam(teamId, patch) {
  await updateDoc(doc(db, "teams", teamId), patch);
}

export async function deleteTeam(teamId) {
  await deleteDoc(doc(db, "teams", teamId));
}

export async function copyTeamsFromSeason(fromSeasonId, toSeasonId) {
  const teams = await listTeams(fromSeasonId);
  const batch = writeBatch(db);
  for (const t of teams) {
    const ref = doc(col("teams"));
    batch.set(ref, { seasonId: toSeasonId, name: t.name, shortName: t.shortName, shortNameCustom: Boolean(t.shortNameCustom) });
  }
  await batch.commit();
}

/* --------------------------- Matchdays ----------------------------- */

export async function listMatchdays(seasonId) {
  const snap = await getDocs(query(col("matchdays"), where("seasonId", "==", seasonId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getMatchday(matchdayId) {
  const s = await getDoc(doc(db, "matchdays", matchdayId));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function createMatchday(seasonId, { number, label, type, order }) {
  const ref = await addDoc(col("matchdays"), { seasonId, number: number ?? null, label, type, order });
  return ref.id;
}

export async function updateMatchday(matchdayId, patch) {
  await updateDoc(doc(db, "matchdays", matchdayId), patch);
}

export async function deleteMatchday(matchdayId) {
  const games = await listGamesForMatchday(matchdayId);
  const batch = writeBatch(db);
  for (const g of games) batch.delete(doc(db, "games", g.id));
  batch.delete(doc(db, "matchdays", matchdayId));
  await batch.commit();
}

/* ----------------------------- Games -------------------------------- */

export async function listGamesForSeason(seasonId) {
  const snap = await getDocs(query(col("games"), where("seasonId", "==", seasonId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => tsMillis(a.kickoff) - tsMillis(b.kickoff));
}

/**
 * Beobachtet ein Spiel und ruft onChange(game) bei jeder Änderung auf – z. B. wenn der BBL-Bot
 * im Live-Modus den Zwischenstand (game.live) oder das Endergebnis schreibt. Gibt die
 * Abmelde-Funktion zurück.
 */
export function watchGame(gameId, onChange) {
  return onSnapshot(doc(db, "games", gameId), (snap) => {
    if (snap.exists()) onChange({ id: snap.id, ...snap.data() });
  }, (err) => console.warn("Live-Aktualisierung unterbrochen:", err));
}

export async function listGamesForMatchday(matchdayId) {
  const snap = await getDocs(query(col("games"), where("matchdayId", "==", matchdayId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => tsMillis(a.kickoff) - tsMillis(b.kickoff));
}

export async function createGame(seasonId, matchdayId, { homeTeamName, awayTeamName, kickoff }) {
  const ref = await addDoc(col("games"), {
    seasonId, matchdayId, homeTeamName, awayTeamName,
    kickoff: Timestamp.fromDate(new Date(kickoff)),
    homeScore: null, awayScore: null, status: "scheduled"
  });
  return ref.id;
}

export async function updateGame(gameId, patch) {
  const clean = { ...patch };
  if (clean.kickoff) clean.kickoff = Timestamp.fromDate(new Date(clean.kickoff));
  await updateDoc(doc(db, "games", gameId), clean);
}

export async function setGameResult(gameId, homeScore, awayScore) {
  await updateDoc(doc(db, "games", gameId), {
    homeScore: Number(homeScore), awayScore: Number(awayScore), status: "finished"
  });
}

export async function clearGameResult(gameId) {
  await updateDoc(doc(db, "games", gameId), { homeScore: null, awayScore: null, status: "scheduled" });
}

export async function deleteGame(gameId) {
  await deleteDoc(doc(db, "games", gameId));
}

/**
 * Importiert einen kompletten Spielplan auf einmal (z. B. den offiziellen BBL-Spielplan).
 * rows: [{ matchdayNumber, matchdayLabel?, type?, kickoff, homeTeamName, awayTeamName }]
 * Legt fehlende Teams und Spieltage automatisch an. onProgress(done, total) ist optional.
 */
export async function bulkImportSchedule(seasonId, rows, onProgress) {
  const existingTeams = await listTeams(seasonId);
  const teamByName = new Map(existingTeams.map((t) => [t.name, t]));
  const existingMatchdays = await listMatchdays(seasonId);
  const mdByKey = new Map(
    existingMatchdays.filter((m) => m.number != null).map((m) => [`${m.type || "regular"}_${m.number}`, m])
  );

  const created = { teams: 0, matchdays: 0, games: 0 };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const type = row.type || "regular";

    for (const name of [row.homeTeamName, row.awayTeamName]) {
      if (!teamByName.has(name)) {
        const ref = await addTeam(seasonId, name);
        teamByName.set(name, { id: ref.id, seasonId, name });
        created.teams++;
      }
    }

    const key = `${type}_${row.matchdayNumber}`;
    let md = mdByKey.get(key);
    if (!md) {
      const label = row.matchdayLabel || `${row.matchdayNumber}. Spieltag`;
      const id = await createMatchday(seasonId, { number: row.matchdayNumber, label, type, order: row.matchdayNumber });
      md = { id, seasonId, number: row.matchdayNumber, label, type };
      mdByKey.set(key, md);
      created.matchdays++;
    }

    await createGame(seasonId, md.id, {
      homeTeamName: row.homeTeamName, awayTeamName: row.awayTeamName, kickoff: row.kickoff
    });
    created.games++;

    if (onProgress) onProgress(i + 1, rows.length);
  }

  return created;
}

/* ------------------- Zusatzspiele Telekom Baskets Bonn (CL/Pokal) ------------------- */
// Eigene, nicht tippbare Spiele außerhalb der BBL-Hauptrunde/Playoffs (Champions League,
// Netto BBL Pokal). Werden von Admins manuell gepflegt, da es dafür keine automatisch
// auslesbare Quelle gibt (anders als beim BBL-Spielplan, siehe scripts/daily-bbl-check).

export const BONN_TEAM_NAME = "Telekom Baskets Bonn";

export async function listBonnExtraGames(seasonId) {
  const snap = await getDocs(query(col("bonnExtraGames"), where("seasonId", "==", seasonId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => tsMillis(a.kickoff) - tsMillis(b.kickoff));
}

export async function createBonnExtraGame(seasonId, { competition, opponent, isHome, kickoff, note }) {
  const ref = await addDoc(col("bonnExtraGames"), {
    seasonId, competition, opponent, isHome: Boolean(isHome),
    kickoff: Timestamp.fromDate(new Date(kickoff)),
    note: note || "",
    homeScore: null, awayScore: null, status: "scheduled"
  });
  return ref.id;
}

export async function updateBonnExtraGame(id, patch) {
  const clean = { ...patch };
  if (clean.kickoff) clean.kickoff = Timestamp.fromDate(new Date(clean.kickoff));
  await updateDoc(doc(db, "bonnExtraGames", id), clean);
}

export async function setBonnExtraGameResult(id, homeScore, awayScore) {
  await updateDoc(doc(db, "bonnExtraGames", id), {
    homeScore: Number(homeScore), awayScore: Number(awayScore), status: "finished"
  });
}

export async function clearBonnExtraGameResult(id) {
  await updateDoc(doc(db, "bonnExtraGames", id), { homeScore: null, awayScore: null, status: "scheduled" });
}

export async function deleteBonnExtraGame(id) {
  await deleteDoc(doc(db, "bonnExtraGames", id));
}

/* ------------------------- Automatisch erkannte Änderungen ------------------------- */
// Ein täglicher Hintergrund-Job (z. B. ein geplanter Cloud-Agent) kann hier Vorschläge ablegen,
// statt Spiele/Ergebnisse direkt zu ändern. Erst wenn jemand den Vorschlag in der Verwaltung
// bestätigt, wird die eigentliche Änderung übernommen (setGameResult / updateGame).

export async function listPendingChanges(seasonId) {
  const snap = await getDocs(query(col("pendingChanges"), where("seasonId", "==", seasonId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createPendingChange(seasonId, { gameId, type, field, oldValue, newValue, note, source }) {
  return addDoc(col("pendingChanges"), {
    seasonId, gameId, type, field, oldValue, newValue,
    note: note || "", source: source || "automatisch",
    createdAt: serverTimestamp()
  });
}

export async function applyPendingChange(change) {
  if (change.type === "kickoff") {
    await updateGame(change.gameId, { kickoff: change.newValue });
  } else if (change.type === "result") {
    const [homeScore, awayScore] = change.newValue.split(":").map(Number);
    await setGameResult(change.gameId, homeScore, awayScore);
  }
  await deleteDoc(doc(db, "pendingChanges", change.id));
}

export async function dismissPendingChange(changeId) {
  await deleteDoc(doc(db, "pendingChanges", changeId));
}

/* --------------------------- Bonus rounds ---------------------------- */

export async function listBonusRounds(seasonId) {
  const snap = await getDocs(query(col("bonusRounds"), where("seasonId", "==", seasonId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getBonusRound(id) {
  const s = await getDoc(doc(db, "bonusRounds", id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function createBonusRound(seasonId, { label, deadline, order }) {
  const ref = await addDoc(col("bonusRounds"), {
    seasonId, label, order,
    deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null
  });
  return ref.id;
}

export async function updateBonusRound(id, patch) {
  const clean = { ...patch };
  if (clean.deadline) clean.deadline = Timestamp.fromDate(new Date(clean.deadline));
  await updateDoc(doc(db, "bonusRounds", id), clean);
}

export async function deleteBonusRound(id) {
  const questions = await listBonusQuestions(id);
  const batch = writeBatch(db);
  for (const q of questions) batch.delete(doc(db, "bonusQuestions", q.id));
  batch.delete(doc(db, "bonusRounds", id));
  await batch.commit();
}

/* -------------------------- Bonus questions --------------------------- */

export async function listBonusQuestions(bonusRoundId) {
  const snap = await getDocs(query(col("bonusQuestions"), where("bonusRoundId", "==", bonusRoundId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function listBonusQuestionsForSeason(seasonId) {
  const snap = await getDocs(query(col("bonusQuestions"), where("seasonId", "==", seasonId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createBonusQuestion(seasonId, bonusRoundId, {
  text, type, options, pickCount, pointsPerCorrect, order, autoResolve
}) {
  const ref = await addDoc(col("bonusQuestions"), {
    seasonId, bonusRoundId, text, type,
    options: options || [],
    pickCount: type === "multi" ? (pickCount || 1) : 1,
    pointsPerCorrect: pointsPerCorrect || 1,
    correctOptions: null,
    resolved: false,
    order: order || 0,
    // Optional: Regel, nach der der stündliche BBL-Check (siehe scripts/daily-bbl-check)
    // diese Frage automatisch selbst auflösen kann, sobald die Datenlage es zulässt
    // (z.B. { kind: "regularSeasonRank", fromRank: 1, toRank: 6 }). Ohne dieses Feld
    // bleibt die Frage wie bisher nur manuell über "Auflösen" auswertbar.
    autoResolve: autoResolve || null
  });
  return ref.id;
}

export async function updateBonusQuestion(id, patch) {
  await updateDoc(doc(db, "bonusQuestions", id), patch);
}

export async function resolveBonusQuestion(id, correctOptions) {
  await updateDoc(doc(db, "bonusQuestions", id), { correctOptions, resolved: true });
}

export async function reopenBonusQuestion(id) {
  await updateDoc(doc(db, "bonusQuestions", id), { correctOptions: null, resolved: false });
}

export async function deleteBonusQuestion(id) {
  await deleteDoc(doc(db, "bonusQuestions", id));
}

/* -------------------------------- Tips --------------------------------- */

const tipId = (uid, gameId) => `${uid}_${gameId}`;

export async function getMyTip(uid, gameId) {
  const s = await getDoc(doc(db, "tips", tipId(uid, gameId)));
  return s.exists() ? s.data() : null;
}

export async function setMyTip(uid, seasonId, matchdayId, gameId, picked, kickoff) {
  await setDoc(doc(db, "tips", tipId(uid, gameId)), {
    userId: uid, seasonId, matchdayId, gameId, picked,
    kickoff, updatedAt: serverTimestamp()
  });
}

export async function listTipsForSeason(seasonId) {
  const snap = await getDocs(query(col("tips"), where("seasonId", "==", seasonId)));
  return snap.docs.map((d) => d.data());
}

/** Tipps aller Nutzer zu bestimmten Spielen (Firestore erlaubt max. 30 Werte pro „in“-Abfrage). */
export async function listTipsForGames(gameIds) {
  const chunks = [];
  for (let i = 0; i < gameIds.length; i += 30) chunks.push(gameIds.slice(i, i + 30));
  const snaps = await Promise.all(chunks.map((ids) => getDocs(query(col("tips"), where("gameId", "in", ids)))));
  return snaps.flatMap((snap) => snap.docs.map((d) => d.data()));
}

export async function listMyTipsForSeason(uid, seasonId) {
  const all = await listTipsForSeason(seasonId);
  return all.filter((t) => t.userId === uid);
}

/* ---------------------------- Bonus answers ------------------------------ */

const answerId = (uid, questionId) => `${uid}_${questionId}`;

export async function getMyBonusAnswer(uid, questionId) {
  const s = await getDoc(doc(db, "bonusAnswers", answerId(uid, questionId)));
  return s.exists() ? s.data() : null;
}

export async function setMyBonusAnswer(uid, seasonId, bonusRoundId, questionId, selected, deadline) {
  await setDoc(doc(db, "bonusAnswers", answerId(uid, questionId)), {
    userId: uid, seasonId, bonusRoundId, questionId, selected,
    deadline: deadline || null, updatedAt: serverTimestamp()
  });
}

export async function listBonusAnswersForSeason(seasonId) {
  const snap = await getDocs(query(col("bonusAnswers"), where("seasonId", "==", seasonId)));
  return snap.docs.map((d) => d.data());
}

/* --------------------------------- Users ---------------------------------- */

export async function ensureUserDoc(uid, displayName, email) {
  await setDoc(doc(db, "users", uid), { displayName, email, updatedAt: serverTimestamp() }, { merge: true });
}

export async function listUsers() {
  const snap = await getDocs(col("users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMyUserDoc(uid) {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? s.data() : null;
}

/**
 * Beliebige Profil-Einstellungen speichern (z.B. bonnReminder, notifyMatchdayWinner).
 * Wird per merge geschrieben, überschreibt also nur die übergebenen Felder.
 */
export async function updateUserPrefs(uid, patch) {
  await setDoc(doc(db, "users", uid), patch, { merge: true });
}

/* --------------------------------- Admin-Konfiguration ---------------------------------- */

export async function getAppConfig() {
  const s = await getDoc(doc(db, "config", "appConfig"));
  return s.exists() ? s.data() : { adminEmails: [] };
}

export async function updateAppConfig(patch) {
  await setDoc(doc(db, "config", "appConfig"), patch, { merge: true });
}

export async function saveFcmToken(uid, token) {
  await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });
}

/* ----------------------------------- Kasse ---------------------------------- */
// Ob eine Spieltags-/Bonusrunden-/Saisonauszahlung schon an den/die Gewinner:in ausgezahlt wurde.
// Eine Zeile pro Spieltag/Bonusrunde/Saison (nicht pro Person), da der Spielleiter das Geld in
// der Praxis gesammelt für alle Gewinner:innen eines Eintrags auszahlt.

export function payoutDocId(seasonId, kind, refId) {
  return `${seasonId}_${kind}_${refId}`;
}

export async function listPayouts(seasonId) {
  const snap = await getDocs(query(col("payouts"), where("seasonId", "==", seasonId)));
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
}

export async function setPayoutStatus(seasonId, kind, refId, paid) {
  await setDoc(doc(db, "payouts", payoutDocId(seasonId, kind, refId)), {
    seasonId, kind, refId, paid, paidAt: paid ? serverTimestamp() : null
  }, { merge: true });
}

/* --------------------------------- Utils ----------------------------------- */

export function tsMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts.seconds != null) return ts.seconds * 1000;
  return new Date(ts).getTime();
}

export function tsToDate(ts) {
  return new Date(tsMillis(ts));
}
