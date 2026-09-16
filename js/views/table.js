import { state } from "../state.js";
import { listTeams, listMatchdays, listGamesForSeason } from "../data.js";
import { computeLeagueTable } from "../scoring.js";
import { el } from "../util.js";
import {
  setTheme, poster, posterBar, brand, spacer, seasonChip, posterTitle, posterSub,
  sheet, loadingView, emptyState, teamTag
} from "../ui.js";

export async function renderLeagueTable(container) {
  setTheme("ink");
  container.appendChild(loadingView("Lade Tabelle …"));

  const title = posterTitle([["BBL-"], ["Tabelle", "mg"]], "is-medium");
  const season = state.activeSeason;
  if (!season) {
    container.innerHTML = "";
    container.append(
      poster([posterBar(brand()), title]),
      sheet([emptyState("Keine Saison", "Sobald eine Saison aktiv ist, erscheint hier die Tabelle.")])
    );
    return;
  }

  const [teams, matchdays, games] = await Promise.all([
    listTeams(season.id), listMatchdays(season.id), listGamesForSeason(season.id)
  ]);

  const regularMdIds = new Set(matchdays.filter((m) => m.type !== "playoff").map((m) => m.id));
  const regularGames = games.filter((g) => regularMdIds.has(g.matchdayId));
  const rows = computeLeagueTable(regularGames, teams);

  container.innerHTML = "";
  container.appendChild(poster([
    posterBar(brand(), spacer(), seasonChip("chip-mg")),
    title,
    posterSub("Hauptrunde · aus den eingetragenen Ergebnissen berechnet")
  ]));

  if (!rows.length) {
    container.appendChild(sheet([emptyState("Noch leer", "Für diese Saison gibt es noch keine Teams oder Ergebnisse.")]));
    return;
  }

  const table = el("table", { class: "league" }, [
    el("thead", {}, el("tr", {}, [
      el("th", { class: "col-rank", scope: "col" }, "#"),
      el("th", { class: "col-team", scope: "col" }, "Team"),
      el("th", { scope: "col", title: "Spiele" }, "Sp"),
      el("th", { scope: "col", title: "Siege" }, "S"),
      el("th", { scope: "col", title: "Niederlagen" }, "N"),
      el("th", { class: "col-baskets", scope: "col" }, "Körbe"),
      el("th", { scope: "col", title: "Korbdifferenz" }, "Diff"),
      el("th", { class: "col-pts", scope: "col" }, "Pkt")
    ])),
    el("tbody", {}, rows.map((r, i) => el("tr", {}, [
      el("td", { class: "col-rank" }, String(i + 1)),
      el("td", { class: "col-team" }, el("div", { class: "team-cell" }, [teamTag(r.team), el("span", {}, r.team)])),
      el("td", {}, String(r.played)),
      el("td", {}, String(r.wins)),
      el("td", {}, String(r.losses)),
      el("td", { class: "col-baskets" }, `${r.scored}:${r.conceded}`),
      el("td", { class: r.diff > 0 ? "is-plus" : r.diff < 0 ? "is-minus" : "" }, (r.diff > 0 ? "+" : "") + r.diff),
      el("td", { class: "col-pts" }, String(r.points))
    ])))
  ]);

  container.appendChild(sheet([
    el("div", { class: "table-wrap" }, table),
    el("p", { class: "hint pane-note" }, "Playoffs sind nicht enthalten. Stimmt etwas nicht, fehlt meist nur ein Ergebnis in der Verwaltung.")
  ]));
}
