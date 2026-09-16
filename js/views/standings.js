import { state, displayNameFor } from "../state.js";
import {
  listMatchdays, listGamesForSeason, listBonusRounds, listBonusQuestionsForSeason,
  listTipsForSeason, listBonusAnswersForSeason, listUsers
} from "../data.js";
import { el, fmtDate } from "../util.js";
import {
  setTheme, poster, posterBar, brand, spacer, seasonChip, posterTitle, posterSub,
  sheet, sectionHead, loadingView, emptyState, plural, icon
} from "../ui.js";
import { rankRow } from "./shared.js";
import { computeSeasonStandings } from "../scoring.js";

export async function renderStandings(container) {
  setTheme("ink");
  container.appendChild(loadingView("Lade Gesamtwertung …"));

  const season = state.activeSeason;
  if (!season) {
    container.innerHTML = "";
    container.append(
      poster([posterBar(brand()), title()]),
      sheet([emptyState("Keine Saison", "Sobald eine Saison aktiv ist, erscheint hier die Wertung.")])
    );
    return;
  }

  const [matchdays, games, bonusRounds, questions, tips, answers, users] = await Promise.all([
    listMatchdays(season.id), listGamesForSeason(season.id), listBonusRounds(season.id),
    listBonusQuestionsForSeason(season.id), listTipsForSeason(season.id),
    listBonusAnswersForSeason(season.id), listUsers()
  ]);
  state.usersById = Object.fromEntries(users.map((u) => [u.id, u]));

  const gamesByMatchday = {};
  for (const g of games) (gamesByMatchday[g.matchdayId] ||= []).push(g);
  const questionsByRound = {};
  for (const q of questions) (questionsByRound[q.bonusRoundId] ||= []).push(q);

  const { ranking, matchdayResults, bonusResults } = computeSeasonStandings({
    matchdays, gamesByMatchday, tips, bonusRounds, questionsByRound, answers
  });

  // Spieltagssiege pro Person (nur vollständig gewertete Spieltage)
  const winsByUser = {};
  for (const r of matchdayResults) {
    if (!r.allFinished || r.max <= 0) continue;
    for (const uid of r.winners) winsByUser[uid] = (winsByUser[uid] || 0) + 1;
  }

  const finishedGames = games.filter((g) => g.status === "finished").length;

  const headerItems = [
    posterBar(brand(), spacer(), seasonChip("chip-mg")),
    title(),
    posterSub(`Stand ${fmtDate(new Date())} · ${plural(finishedGames, "Spiel", "Spiele")} gewertet`)
  ];

  const listItems = [];
  if (ranking.length) {
    const top = ranking[0].points;
    const leaders = ranking.filter((r) => r.points === top);
    headerItems.push(leaderCard(leaders, winsByUser));
    ranking.slice(leaders.length).forEach((r, i) => {
      listItems.push(rankRow({
        rank: leaders.length + i + 1,
        name: displayNameFor(r.userId),
        points: r.points,
        you: r.userId === state.user.uid
      }));
    });
  }

  container.innerHTML = "";
  container.appendChild(poster(headerItems));
  if (listItems.length) {
    container.appendChild(el("div", { class: "rank-list on-ink" }, listItems));
  }

  // Papierfläche: Spieltagssieger & Bonusrunden
  const sheetItems = [];
  if (!ranking.length) {
    sheetItems.push(emptyState("Noch keine Punkte", "Sobald die ersten Spiele gewertet sind, steht hier die Rangliste."));
  }

  // Nur Spieltage, in denen schon mindestens ein Spiel gewertet ist – neueste zuerst.
  const finishedByMatchday = (id) => (gamesByMatchday[id] || []).filter((g) => g.status === "finished").length;
  const playedMatchdays = matchdayResults.filter((r) => finishedByMatchday(r.matchday.id) > 0).reverse();
  sheetItems.push(sectionHead("Spieltagssieger", playedMatchdays.length ? plural(playedMatchdays.length, "Spieltag", "Spieltage") : ""));
  if (!playedMatchdays.length) {
    sheetItems.push(el("p", { class: "hint pane-note" }, "Sobald das erste Spiel gewertet ist, steht hier der Spieltagssieger."));
  }
  for (const r of playedMatchdays) {
    let sub;
    let end;
    if (!r.allFinished) {
      sub = `${finishedByMatchday(r.matchday.id)} von ${plural(r.gamesCount, "Spiel", "Spielen")} gewertet`;
      end = el("span", { class: "pill" }, "Läuft");
    } else if (!r.winners.length) {
      sub = "Niemand hat gepunktet";
      end = null;
    } else {
      sub = r.winners.map(displayNameFor).join(", ");
      end = el("span", { class: "pill pill-mg" }, `${r.max} Pkt.`);
    }
    const num = r.matchday.number ?? String(r.matchday.label || "").match(/^(\d+)\./)?.[1];
    sheetItems.push(el("a", { class: "list-link", href: `#/matchday/${r.matchday.id}` }, [
      num != null
        ? el("div", { class: "list-num" }, `${num}.`)
        : el("div", { class: "icon-badge is-ink" }, icon("trophy", 22)),
      el("div", { class: "list-body" }, [
        el("div", { class: "list-title" }, r.matchday.label),
        el("div", { class: "list-sub" }, sub)
      ]),
      el("div", { class: "list-end" }, [end, icon("chevR", 20, 2)])
    ]));
  }

  if (bonusResults.length) {
    sheetItems.push(sectionHead("Bonusrunden", plural(bonusResults.length, "Runde", "Runden")));
    for (const r of bonusResults) {
      const top = Object.entries(r.scores).sort((a, b) => b[1] - a[1])[0];
      const sub = !r.allResolved
        ? "Auflösung steht noch aus"
        : top ? `Beste Runde: ${displayNameFor(top[0])}` : "Niemand hat geantwortet";
      const end = !r.allResolved
        ? el("span", { class: "pill" }, "Läuft")
        : top ? el("span", { class: "pill pill-mg" }, `${top[1]} Pkt.`) : null;
      sheetItems.push(el("a", { class: "list-link", href: `#/bonus/${r.bonusRound.id}` }, [
        el("div", { class: "icon-badge" }, icon("help", 24)),
        el("div", { class: "list-body" }, [
          el("div", { class: "list-title" }, r.bonusRound.label),
          el("div", { class: "list-sub" }, sub)
        ]),
        el("div", { class: "list-end" }, [end, icon("chevR", 20, 2)])
      ]));
    }
  }

  container.appendChild(sheet(sheetItems));
}

function title() {
  return posterTitle([["Gesamt-"], ["wertung", "mg"]], "is-medium");
}

function leaderCard(leaders, winsByUser) {
  const names = leaders.map((r) => displayNameFor(r.userId));
  const nameText = leaders.length > 2 ? `${leaders.length} gleichauf` : names.join(" & ");
  const isYou = leaders.some((r) => r.userId === state.user.uid);
  let note;
  if (leaders.length > 2) {
    note = names.join(", ");
  } else if (leaders.length === 1) {
    const wins = winsByUser[leaders[0].userId] || 0;
    note = wins ? `${wins}× Spieltagssieger` : "";
  } else {
    note = "Punktgleich an der Spitze";
  }

  return el("div", { class: "leader" }, [
    el("div", { class: "leader-main" }, [
      el("div", { class: "leader-label" }, [icon("trophy", 16, 2.2), "Platz 1", isYou ? el("span", { class: "you-tag is-ink" }, "Du") : null]),
      el("div", { class: "leader-name" + (nameText.length > 9 ? " is-long" : "") }, nameText),
      note ? el("div", { class: "leader-note" }, note) : null
    ]),
    el("div", { class: "leader-score" }, [
      el("div", { class: "leader-pts" }, String(leaders[0].points)),
      el("div", { class: "leader-pts-label" }, leaders[0].points === 1 ? "Punkt" : "Punkte")
    ])
  ]);
}
