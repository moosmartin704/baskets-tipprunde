import { state } from "../state.js";
import {
  listGamesForSeason, listMatchdays, listBonusRounds, listBonusQuestionsForSeason,
  getMyTip, setMyTip, getMyBonusAnswer, tsToDate
} from "../data.js";
import { el, toast, fmtDayShort, dayKey } from "../util.js";
import {
  setTheme, poster, posterBar, brand, seasonChip, spacer, avatarLink, posterTitle, posterSub,
  sticker, sheet, sectionHead, loadingView, emptyState, plural
} from "../ui.js";
import { renderGameRow } from "./shared.js";

const HORIZON_DAYS = 14;
// So lange nach Anpfiff gilt ein Spiel ohne Ergebnis als laufend: Spielzeit samt Verlängerung plus
// bis zu einer Stunde, bis der stündliche BBL-Abgleich das Ergebnis einträgt. Danach verschwindet
// es von der Übersicht, auch falls das Ergebnis fehlt.
const LIVE_WINDOW_HOURS = 4;

export async function renderDashboard(container) {
  setTheme("magenta");
  container.appendChild(loadingView("Lade offene Tipps …"));

  const season = state.activeSeason;
  if (!season) {
    container.innerHTML = "";
    container.append(...noSeasonView());
    return;
  }

  const now = Date.now();
  const horizon = now + HORIZON_DAYS * 24 * 60 * 60 * 1000;

  const [games, matchdays, bonusRounds, bonusQuestions] = await Promise.all([
    listGamesForSeason(season.id),
    listMatchdays(season.id),
    listBonusRounds(season.id),
    listBonusQuestionsForSeason(season.id)
  ]);
  const matchdayById = Object.fromEntries(matchdays.map((m) => [m.id, m]));

  const liveSince = now - LIVE_WINDOW_HOURS * 60 * 60 * 1000;
  const live = games.filter((g) => {
    const t = tsToDate(g.kickoff).getTime();
    return g.status !== "finished" && t <= now && t > liveSince;
  });
  const upcoming = games.filter((g) => {
    const t = tsToDate(g.kickoff).getTime();
    return g.status !== "finished" && t > now && t <= horizon;
  });

  const bonusRoundById = Object.fromEntries(bonusRounds.map((b) => [b.id, b]));
  const openQuestions = bonusQuestions.filter((q) => !q.resolved && !isBonusRoundLocked(bonusRoundById[q.bonusRoundId]));

  const [tips, answers] = await Promise.all([
    Promise.all([...live, ...upcoming].map((g) => getMyTip(state.user.uid, g.id))),
    Promise.all(openQuestions.map((q) => getMyBonusAnswer(state.user.uid, q.id)))
  ]);
  const tipByGame = new Map([...live, ...upcoming].map((g, i) => [g.id, tips[i]?.picked || null]));
  const unanswered = openQuestions.filter((q, i) => !answers[i]?.selected?.length);

  // Kopfbereich – Überschrift und Zeile darunter werden nach jedem Tipp aktualisiert.
  const titleHost = el("div", { class: "title-host" });
  const subEl = posterSub("");
  function updateSummary() {
    const total = upcoming.length;
    const tipped = upcoming.filter((g) => tipByGame.get(g.id)).length;
    const open = total - tipped;
    const lines = total === 0
      ? live.length
        ? [[live.length === 1 ? "Spiel" : "Spiele"], [live.length === 1 ? "läuft" : "laufen", "ink"]]
        : [["Keine"], ["Spiele", "ink"]]
      : open === 0
        ? [["Alles"], ["getippt", "ink"]]
        : [[`${open} ${open === 1 ? "Tipp" : "Tipps"}`], ["offen", "ink"]];
    titleHost.replaceChildren(posterTitle(lines));
    subEl.textContent = total === 0
      ? `In den nächsten ${HORIZON_DAYS} Tagen steht ${live.length ? "kein weiteres" : "kein"} Spiel an.`
      : `Nächste ${HORIZON_DAYS} Tage · ${tipped} von ${total} getippt`;
  }
  updateSummary();

  const headerItems = [
    posterBar(brand(), seasonChip(), spacer(), avatarLink()),
    titleHost,
    subEl
  ];
  if (unanswered.length) {
    const target = unanswered[0].bonusRoundId;
    headerItems.push(sticker(`#/bonus/${target}`, `Bonus · ${plural(unanswered.length, "Frage", "Fragen")} offen`));
  }

  const sheetItems = [];
  if (live.length) {
    // Laufende Spiele bleiben oben stehen (Tipp gesperrt, eigener Tipp sichtbar) und sind hervorgehoben.
    sheetItems.push(
      el("div", { class: "sec-head" }, [
        el("h2", { class: "sec-title live-title" }, [el("span", { class: "live-dot", "aria-hidden": "true" }), "Live"]),
        el("div", { class: "sec-rule" }),
        el("div", { class: "sec-count" }, live.length === 1 ? "Läuft gerade" : `${live.length} Spiele laufen`)
      ]),
      el("div", { class: "live-card" }, live.map((game) =>
        renderGameRow(game, { picked: tipByGame.get(game.id) }, {
          seasonGames: games,
          matchdayLabel: matchdayById[game.matchdayId]?.label
        })
      ))
    );
  }
  if (!upcoming.length) {
    sheetItems.push(emptyState(
      "Spielfrei",
      `In den nächsten ${HORIZON_DAYS} Tagen stehen keine ${live.length ? "weiteren " : ""}Spiele an. Alle Paarungen findest du unter „Spieltage“.`,
      el("a", { class: "btn btn-ink", href: "#/matchdays" }, "Zu den Spieltagen")
    ));
  } else {
    for (const group of groupByDay(upcoming)) {
      sheetItems.push(sectionHead(fmtDayShort(group.date), plural(group.games.length, "Spiel", "Spiele")));
      for (const game of group.games) {
        sheetItems.push(renderGameRow(game, { picked: tipByGame.get(game.id) }, {
          seasonGames: games,
          matchdayLabel: matchdayById[game.matchdayId]?.label,
          onPick: async (picked) => {
            await setMyTip(state.user.uid, season.id, game.matchdayId, game.id, picked, game.kickoff);
            tipByGame.set(game.id, picked);
            updateSummary();
            toast("Tipp gespeichert", "success");
          }
        }));
      }
    }
  }

  container.innerHTML = "";
  container.append(poster(headerItems), sheet(sheetItems));
}

function groupByDay(games) {
  const groups = [];
  for (const g of games) {
    const date = tsToDate(g.kickoff);
    const key = dayKey(date);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, date, games: [] };
      groups.push(group);
    }
    group.games.push(g);
  }
  return groups;
}

function noSeasonView() {
  const action = state.isAdmin
    ? el("a", { class: "btn btn-primary", href: "#/admin" }, "Zur Verwaltung")
    : null;
  const text = state.isAdmin
    ? "Lege in der Verwaltung eine Saison an und aktiviere sie."
    : "Sobald die Spielleitung eine Saison freischaltet, kannst du hier tippen.";
  return [
    poster([
      posterBar(brand(), spacer(), avatarLink()),
      posterTitle([["Keine"], ["Saison", "ink"]]),
      posterSub("Noch ist keine Saison aktiv.")
    ]),
    sheet([emptyState("Gleich geht's los", text, action)])
  ];
}

function isBonusRoundLocked(bonusRound) {
  if (!bonusRound?.deadline) return false;
  return Date.now() >= tsToDate(bonusRound.deadline).getTime();
}
