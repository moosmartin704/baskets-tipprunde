// ============================================================================
// Reine, abhängigkeitsfreie Tabellen-/Standings-Logik.
//
// WICHTIG: Diese Datei darf NICHTS aus firebase.js oder data.js importieren
// (auch nicht transitiv) und keine Browser-APIs verwenden. Sie wird nämlich
// nicht nur von der App (js/scoring.js) genutzt, sondern auch unverändert
// vom Node-Skript des stündlichen BBL-Checks (scripts/daily-bbl-check/check.mjs),
// das außerhalb des Browsers läuft. Reine Funktionen auf einfachen Objekten/
// Arrays rein - keine Firestore-Timestamps, keine DOM-Sachen.
// ============================================================================

/** Sieger eines beendeten Spiels: "home" | "away" | "draw" | null (noch nicht beendet). */
export function gameWinner(game) {
  if (game.status !== "finished" || game.homeScore == null || game.awayScore == null) return null;
  if (game.homeScore > game.awayScore) return "home";
  if (game.awayScore > game.homeScore) return "away";
  return "draw"; // im Basketball praktisch nie, aber sicherheitshalber abgedeckt
}

/**
 * Tabelle aus allen beendeten Spielen. `teams` (Liste mit .name) sorgt dafür,
 * dass auch Teams ohne bisherige Spiele mit 0:0 auftauchen. Sortiert nach
 * Punkten, Korbdifferenz, erzielten Körben, dann alphabetisch.
 */
export function computeLeagueTable(games, teams = []) {
  const table = {};
  function ensure(name) {
    if (!table[name]) table[name] = { team: name, played: 0, wins: 0, losses: 0, scored: 0, conceded: 0 };
    return table[name];
  }
  for (const t of teams) ensure(t.name);

  for (const g of games) {
    if (g.status !== "finished") continue;
    const winner = gameWinner(g);
    if (!winner || winner === "draw") continue;
    const home = ensure(g.homeTeamName);
    const away = ensure(g.awayTeamName);
    home.played++; away.played++;
    home.scored += g.homeScore; home.conceded += g.awayScore;
    away.scored += g.awayScore; away.conceded += g.homeScore;
    if (winner === "home") { home.wins++; away.losses++; }
    else { away.wins++; home.losses++; }
  }

  return Object.values(table)
    .map((r) => ({ ...r, diff: r.scored - r.conceded, points: r.wins * 2 }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.scored - a.scored || a.team.localeCompare(b.team, "de"));
}

/** true, sobald jedes übergebene Spiel den Status "finished" hat (und es mind. 1 Spiel gibt). */
export function allFinished(games) {
  return games.length > 0 && games.every((g) => g.status === "finished");
}

/**
 * Filtert Spiele auf die Hauptrunde (alles außer matchday.type === "playoff").
 * matchdays: Liste aller Spieltage der Saison, games: alle Spiele der Saison.
 */
export function regularSeasonGames(games, matchdays) {
  const regularMdIds = new Set(matchdays.filter((m) => m.type !== "playoff").map((m) => m.id));
  return games.filter((g) => regularMdIds.has(g.matchdayId));
}
