import { state, displayNameFor } from "../state.js";
import {
  getMatchday, listGamesForMatchday, listGamesForSeason, listTipsForSeason, listUsers,
  setMyTip, tsToDate
} from "../data.js";
import { el, toast, fmtDayShort, fmtDateRange, dayKey } from "../util.js";
import {
  setTheme, poster, posterBar, backLink, spacer, posterTitle, sheet, sectionHead,
  loadingView, emptyState, plural
} from "../ui.js";
import { renderGameRow, renderResultEditor, rankRow } from "./shared.js";
import { computeMatchdayScores, matchdayWinners } from "../scoring.js";

export async function renderMatchdayDetail(container, { id }) {
  setTheme("ink");
  container.appendChild(loadingView("Lade Spieltag …"));

  const season = state.activeSeason;
  const [md, games, users, allTips, seasonGames] = await Promise.all([
    getMatchday(id),
    listGamesForMatchday(id),
    listUsers(),
    season ? listTipsForSeason(season.id) : Promise.resolve([]),
    season ? listGamesForSeason(season.id) : Promise.resolve([])
  ]);
  state.usersById = Object.fromEntries(users.map((u) => [u.id, u]));

  container.innerHTML = "";
  if (!md) {
    container.append(
      poster([posterBar(backLink("#/matchdays", "Spieltage")), posterTitle([["Nicht"], ["gefunden", "mg"]], "is-medium")]),
      sheet([emptyState("Spieltag fehlt", "Diesen Spieltag gibt es nicht (mehr).",
        el("a", { class: "btn btn-ink", href: "#/matchdays" }, "Alle Spieltage"))])
    );
    return;
  }

  const myTipByGame = new Map(
    allTips.filter((t) => t.userId === state.user.uid).map((t) => [t.gameId, t.picked])
  );

  // Spieltags-Tabelle und eigene Werte
  const scores = computeMatchdayScores(games, allTips);
  const { winners, max } = matchdayWinners(scores);
  const finishedCount = games.filter((g) => g.status === "finished").length;
  const allFinished = games.length > 0 && finishedCount === games.length;
  const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const myIndex = ranking.findIndex(([uid]) => uid === state.user.uid);
  const myPoints = scores[state.user.uid] ?? 0;

  // Kopfbereich
  const typeLabel = md.type === "playoff" ? "Playoff" : "Hauptrunde";
  const numberMatch = String(md.label || "").match(/^(\d+)\.\s*(.*)$/);
  const dates = games.map((g) => tsToDate(g.kickoff));
  const dateText = dates.length ? fmtDateRange(dates) : "Noch keine Spiele";

  const hero = numberMatch
    ? el("div", { class: "md-hero" }, [
        el("div", { class: "md-hero-num" }, `${numberMatch[1]}.`),
        el("div", { class: "md-hero-text" }, [
          el("h1", { class: "md-hero-title" }, numberMatch[2] || "Spieltag"),
          el("div", { class: "md-hero-dates" }, dateText)
        ])
      ])
    : el("div", { class: "md-hero-stack" }, [
        posterTitle([[md.label, "mg"]], "is-small"),
        el("div", { class: "md-hero-dates" }, dateText)
      ]);

  const stats = el("div", { class: "stat-row" }, [
    stat(String(myPoints), myPoints === 1 ? "Punkt" : "Punkte", true),
    stat(myIndex >= 0 && finishedCount > 0 ? `${myIndex + 1}.` : "–", "Platz"),
    stat(`${finishedCount}/${games.length}`, "Gewertet")
  ]);

  container.appendChild(poster([
    posterBar(backLink("#/matchdays", "Spieltage"), spacer(), el("span", { class: "chip chip-outline" }, typeLabel)),
    hero,
    stats
  ]));

  // Reiter: Spiele | Tabelle
  const gamesPane = el("div", { class: "pane", id: "pane-games", role: "tabpanel", "aria-labelledby": "tab-games" });
  const tablePane = el("div", { class: "pane", id: "pane-table", role: "tabpanel", "aria-labelledby": "tab-table", hidden: true });
  const tabGames = el("button", { type: "button", class: "tab is-active", id: "tab-games", role: "tab", "aria-selected": "true", "aria-controls": "pane-games" }, "Spiele");
  const tabTable = el("button", { type: "button", class: "tab", id: "tab-table", role: "tab", "aria-selected": "false", "aria-controls": "pane-table" }, "Tabelle");
  const selectTab = (showGames) => {
    gamesPane.hidden = !showGames;
    tablePane.hidden = showGames;
    tabGames.classList.toggle("is-active", showGames);
    tabTable.classList.toggle("is-active", !showGames);
    tabGames.setAttribute("aria-selected", String(showGames));
    tabTable.setAttribute("aria-selected", String(!showGames));
  };
  tabGames.addEventListener("click", () => selectTab(true));
  tabTable.addEventListener("click", () => selectTab(false));

  // Spiele, nach Tagen gruppiert
  if (!games.length) {
    gamesPane.appendChild(emptyState("Noch leer", "In diesem Spieltag sind noch keine Spiele angelegt."));
  }
  let lastKey = null;
  for (const game of games) {
    const date = tsToDate(game.kickoff);
    const key = dayKey(date);
    if (key !== lastKey) {
      const count = games.filter((g) => dayKey(tsToDate(g.kickoff)) === key).length;
      gamesPane.appendChild(sectionHead(fmtDayShort(date), plural(count, "Spiel", "Spiele")));
      lastKey = key;
    }
    gamesPane.appendChild(renderGameRow(game, { picked: myTipByGame.get(game.id) }, {
      seasonGames,
      adminEditor: state.isAdmin ? renderResultEditor(game, rerender) : null,
      onPick: season ? async (picked) => {
        await setMyTip(state.user.uid, season.id, game.matchdayId, game.id, picked, game.kickoff);
        myTipByGame.set(game.id, picked);
        toast("Tipp gespeichert", "success");
      } : null
    }));
  }

  // Spieltags-Tabelle
  if (!ranking.length) {
    tablePane.appendChild(emptyState("Noch keine Tipps", "Sobald jemand tippt, erscheint hier die Tabelle."));
  } else {
    tablePane.appendChild(el("div", { class: "rank-list" }, ranking.map(([uid, pts], i) => rankRow({
      rank: i + 1,
      name: displayNameFor(uid),
      points: pts,
      you: uid === state.user.uid,
      winner: allFinished && max > 0 && winners.includes(uid)
    }))));
    tablePane.appendChild(el("p", { class: "hint pane-note" }, allFinished
      ? "Alle Spiele sind gewertet – die Tabelle ist endgültig."
      : "Endgültig, sobald alle Spiele gewertet sind."));
  }

  container.appendChild(sheet([
    el("div", { class: "tabs", role: "tablist" }, [tabGames, tabTable]),
    gamesPane,
    tablePane
  ]));

  function rerender() {
    container.innerHTML = "";
    renderMatchdayDetail(container, { id });
  }
}

function stat(value, label, accent = false) {
  return el("div", { class: "stat" }, [
    el("div", { class: "stat-value" + (accent ? " is-mg" : "") }, value),
    el("div", { class: "stat-label" }, label)
  ]);
}
