// Punkteberechnung: Tipp auf den richtigen Sieger = 1 Punkt.
// Bonusfragen: pro richtig ausgewählter Option gibt es `pointsPerCorrect` Punkte
// (bei Einzelauswahl-Fragen ist das einfach richtig/falsch).
import { tsMillis } from "./data.js";
import { gameWinner, computeLeagueTable } from "./standings-core.js";

export { gameWinner, computeLeagueTable };

/** Punkte eines einzelnen Tipps für ein beendetes Spiel (0 oder 1). */
export function pointsForTip(game, tip) {
  const winner = gameWinner(game);
  if (!winner || winner === "draw" || !tip) return 0;
  return tip.picked === winner ? 1 : 0;
}

/**
 * Für einen Spieltag: Punkte pro Nutzer.
 * games: Spiele dieses Spieltags, tips: alle Tipps der Saison (werden gefiltert).
 * Gibt { [userId]: points } zurück, nur für Nutzer mit mind. einem Tipp an diesem Spieltag.
 */
export function computeMatchdayScores(games, allTips) {
  const finished = games.filter((g) => g.status === "finished");
  const gameIds = new Set(games.map((g) => g.id));
  const relevantTips = allTips.filter((t) => gameIds.has(t.gameId));
  const scores = {};
  for (const t of relevantTips) {
    scores[t.userId] = scores[t.userId] ?? 0;
  }
  for (const g of finished) {
    const winner = gameWinner(g);
    if (!winner || winner === "draw") continue;
    for (const t of relevantTips) {
      if (t.gameId !== g.id) continue;
      if (t.picked === winner) scores[t.userId] = (scores[t.userId] ?? 0) + 1;
    }
  }
  return scores;
}

export function matchdayWinners(scores) {
  const entries = Object.entries(scores);
  if (!entries.length) return { winners: [], max: 0 };
  const max = Math.max(...entries.map(([, p]) => p));
  if (max <= 0) return { winners: [], max };
  return { winners: entries.filter(([, p]) => p === max).map(([uid]) => uid), max };
}

/** Punkte für eine einzelne Bonusfrage-Antwort. */
export function pointsForBonusAnswer(question, answer) {
  if (!question.resolved || !question.correctOptions || !answer) return 0;
  const correctSet = new Set(question.correctOptions);
  const selected = answer.selected || [];
  const correctPicks = selected.filter((s) => correctSet.has(s)).length;
  return correctPicks * (question.pointsPerCorrect || 1);
}

/** Punkte pro Nutzer für eine Bonusrunde (Summe über alle Fragen dieser Runde). */
export function computeBonusRoundScores(questions, allAnswers) {
  const qIds = new Set(questions.map((q) => q.id));
  const relevant = allAnswers.filter((a) => qIds.has(a.questionId));
  const scores = {};
  for (const a of relevant) scores[a.userId] = scores[a.userId] ?? 0;
  const byQuestion = Object.fromEntries(questions.map((q) => [q.id, q]));
  for (const a of relevant) {
    const q = byQuestion[a.questionId];
    if (!q) continue;
    scores[a.userId] = (scores[a.userId] ?? 0) + pointsForBonusAnswer(q, a);
  }
  return scores;
}

/**
 * Gesamtwertung der Saison: Summe aller Spieltags- und Bonuspunkte pro Nutzer.
 * Gibt zusätzlich eine Liste der Spieltagssieger zurück.
 */
export function computeSeasonStandings({ matchdays, gamesByMatchday, tips, bonusRounds, questionsByRound, answers }) {
  const total = {};
  const matchdayResults = [];

  for (const md of matchdays) {
    const games = gamesByMatchday[md.id] || [];
    if (!games.length) continue;
    const scores = computeMatchdayScores(games, tips);
    const allFinished = games.every((g) => g.status === "finished");
    for (const [uid, pts] of Object.entries(scores)) total[uid] = (total[uid] ?? 0) + pts;
    const { winners, max } = matchdayWinners(scores);
    matchdayResults.push({ matchday: md, scores, allFinished, winners, max, gamesCount: games.length });
  }

  const bonusResults = [];
  for (const br of bonusRounds) {
    const questions = questionsByRound[br.id] || [];
    if (!questions.length) continue;
    const scores = computeBonusRoundScores(questions, answers);
    for (const [uid, pts] of Object.entries(scores)) total[uid] = (total[uid] ?? 0) + pts;
    const allResolved = questions.every((q) => q.resolved);
    bonusResults.push({ bonusRound: br, scores, allResolved, questionsCount: questions.length });
  }

  const ranking = Object.entries(total)
    .map(([userId, points]) => ({ userId, points }))
    .sort((a, b) => b.points - a.points);

  return { total, ranking, matchdayResults, bonusResults };
}

/**
 * Form eines Teams über die letzten `limit` beendeten Spiele (chronologisch, ältestes zuerst,
 * aktuellstes zuletzt). Gibt ein Array aus "S" (Sieg) / "N" (Niederlage) zurück.
 */
export function teamForm(games, teamName, limit = 5) {
  const finished = games
    .filter((g) => g.status === "finished" && (g.homeTeamName === teamName || g.awayTeamName === teamName))
    .sort((a, b) => tsMillis(a.kickoff) - tsMillis(b.kickoff));

  const results = [];
  for (const g of finished) {
    const winner = gameWinner(g);
    if (!winner || winner === "draw") continue;
    const isHome = g.homeTeamName === teamName;
    const won = (isHome && winner === "home") || (!isHome && winner === "away");
    results.push(won ? "S" : "N");
  }
  return results.slice(-limit);
}
