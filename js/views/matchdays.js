import { state } from "../state.js";
import {
  listMatchdays, listGamesForSeason, listBonusRounds, listBonusQuestionsForSeason,
  listMyTipsForSeason, tsToDate, tsMillis
} from "../data.js";
import { el, fmtDate } from "../util.js";
import {
  setTheme, poster, posterBar, brand, seasonChip, spacer, posterTitle, posterSub, sticker,
  sheet, sectionHead, loadingView, emptyState, plural, icon
} from "../ui.js";

export async function renderMatchdays(container) {
  setTheme("ink");
  container.appendChild(loadingView("Lade Spieltage …"));
  const season = state.activeSeason;
  if (!season) {
    container.innerHTML = "";
    container.append(...noSeasonView());
    return;
  }

  const [matchdays, games, bonusRounds, bonusQuestions, myTips] = await Promise.all([
    listMatchdays(season.id),
    listGamesForSeason(season.id),
    listBonusRounds(season.id),
    listBonusQuestionsForSeason(season.id),
    listMyTipsForSeason(state.user.uid, season.id)
  ]);

  const gamesByMd = groupBy(games, "matchdayId");
  const questionsByBr = groupBy(bonusQuestions, "bonusRoundId");
  const tippedGameIds = new Set(myTips.map((t) => t.gameId));
  const current = currentMatchday(matchdays, games);

  const regular = matchdays.filter((m) => m.type !== "playoff");
  const playoff = matchdays.filter((m) => m.type === "playoff");

  const headerItems = [
    posterBar(brand(), spacer(), seasonChip("chip-mg")),
    posterTitle([["Spiel-"], ["tage", "mg"]], "is-medium"),
    posterSub(`Saison ${season.name} · ${plural(matchdays.length, "Spieltag", "Spieltage")}`)
  ];
  if (current) headerItems.push(sticker(`#/matchday/${current.id}`, `Weiter zu: ${current.label}`));

  const items = [];
  if (regular.length) {
    items.push(sectionHead("Hauptrunde", plural(regular.length, "Spieltag", "Spieltage")));
    regular.forEach((md) => items.push(matchdayItem(md, gamesByMd[md.id] || [], tippedGameIds, md.id === current?.id)));
  }
  if (playoff.length) {
    items.push(sectionHead("Playoffs", plural(playoff.length, "Runde", "Runden")));
    playoff.forEach((md) => items.push(matchdayItem(md, gamesByMd[md.id] || [], tippedGameIds, md.id === current?.id)));
  }
  if (bonusRounds.length) {
    items.push(sectionHead("Bonusfragen", plural(bonusRounds.length, "Runde", "Runden")));
    bonusRounds.forEach((br) => items.push(bonusItem(br, questionsByBr[br.id] || [])));
  }
  if (!matchdays.length && !bonusRounds.length) {
    items.push(emptyState(
      "Noch leer",
      "Es sind noch keine Spieltage angelegt.",
      state.isAdmin ? el("a", { class: "btn btn-primary", href: "#/admin" }, "Zur Verwaltung") : null
    ));
  }

  container.innerHTML = "";
  container.append(poster(headerItems), sheet(items));
}

/** Spieltag des nächsten noch nicht gewerteten Spiels (verschobene Nachholspiele zählen nicht mit). */
function currentMatchday(matchdays, games) {
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  const next = games
    .filter((g) => g.status !== "finished" && tsMillis(g.kickoff) >= cutoff)
    .sort((a, b) => tsMillis(a.kickoff) - tsMillis(b.kickoff))[0];
  return next ? matchdays.find((m) => m.id === next.matchdayId) || null : null;
}

function matchdayNumber(md) {
  if (md.number != null) return md.number;
  const m = String(md.label || "").match(/^(\d+)\./);
  return m ? Number(m[1]) : null;
}

function matchdayItem(md, games, tippedGameIds, isCurrent) {
  const finished = games.filter((g) => g.status === "finished").length;
  const tipped = games.filter((g) => tippedGameIds.has(g.id)).length;
  const next = games.find((g) => g.status !== "finished");
  let sub;
  if (!games.length) sub = "Noch keine Spiele";
  else if (finished === games.length) sub = `${plural(games.length, "Spiel", "Spiele")} · alle gewertet`;
  else sub = `${tipped}/${games.length} getippt${next ? ` · nächstes: ${fmtDate(tsToDate(next.kickoff))}` : ""}`;

  const num = matchdayNumber(md);
  const lead = num != null
    ? el("div", { class: "list-num" + (isCurrent ? " is-current" : "") }, `${num}.`)
    : el("div", { class: "icon-badge" + (isCurrent ? "" : " is-ink") }, icon("trophy", 22));

  let badge = null;
  if (isCurrent) badge = el("span", { class: "pill pill-mg" }, "Aktuell");
  else if (games.length && finished === games.length) badge = el("span", { class: "pill pill-ok" }, "Fertig");
  else if (md.type === "playoff") badge = el("span", { class: "pill pill-ink" }, "Playoff");

  return el("a", { class: "list-link", href: `#/matchday/${md.id}` }, [
    lead,
    el("div", { class: "list-body" }, [
      el("div", { class: "list-title" }, md.label),
      el("div", { class: "list-sub" }, sub)
    ]),
    el("div", { class: "list-end" }, [badge, icon("chevR", 20, 2)])
  ]);
}

function bonusItem(br, questions) {
  const resolved = questions.filter((q) => q.resolved).length;
  const sub = questions.length ? `${resolved}/${questions.length} ausgewertet` : "Noch keine Fragen";
  return el("a", { class: "list-link", href: `#/bonus/${br.id}` }, [
    el("div", { class: "icon-badge" }, icon("help", 24)),
    el("div", { class: "list-body" }, [
      el("div", { class: "list-title" }, br.label),
      el("div", { class: "list-sub" }, sub)
    ]),
    el("div", { class: "list-end" }, [el("span", { class: "pill pill-mg" }, "Bonus"), icon("chevR", 20, 2)])
  ]);
}

function groupBy(arr, key) {
  const out = {};
  for (const item of arr) {
    (out[item[key]] ||= []).push(item);
  }
  return out;
}

function noSeasonView() {
  return [
    poster([
      posterBar(brand()),
      posterTitle([["Spiel-"], ["tage", "mg"]], "is-medium"),
      posterSub("Noch ist keine Saison aktiv.")
    ]),
    sheet([emptyState(
      "Keine Saison",
      "Sobald eine Saison aktiv ist, findest du hier alle Spieltage.",
      state.isAdmin ? el("a", { class: "btn btn-primary", href: "#/admin" }, "Zur Verwaltung") : null
    )])
  ];
}
