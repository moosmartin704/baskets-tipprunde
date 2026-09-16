// Eigene Seite für alle Spiele der Telekom Baskets Bonn: Liga-Spiele (aus dem normalen
// Spielplan) plus manuell gepflegte Champions-League-/Pokal-Zusatzspiele (siehe Verwaltung,
// Tab "Bonn"). Reine Anzeige, nicht tippbar. Dazu: Filter auf Heimspiele und eine persönliche
// Heimspiel-Erinnerung (unabhängig von den normalen Tipp-Erinnerungen).
import { state } from "../state.js";
import {
  listGamesForSeason, listBonnExtraGames, BONN_TEAM_NAME,
  getMyUserDoc, updateUserPrefs, tsToDate
} from "../data.js";
import { el, toast, fmtTime, fmtDayShort, dayKey } from "../util.js";
import {
  setTheme, poster, posterBar, backLink, spacer, posterTitle, posterSub, sheet,
  sectionHead, loadingView, emptyState, plural
} from "../ui.js";

const COMPETITION_LABELS = { liga: "Liga", cl: "Champions League", pokal: "Netto BBL Pokal" };
const DEFAULT_COMPETITIONS = ["liga", "cl", "pokal"];

let homeOnly = false;

export async function renderBonnPage(container) {
  setTheme("ink");
  container.appendChild(loadingView("Lade Spielplan …"));

  const season = state.activeSeason;
  if (!season) {
    container.innerHTML = "";
    container.append(
      poster([posterBar(backLink("#/profile", "Profil")), posterTitle([["Telekom"], ["Baskets Bonn", "mg"]], "is-medium")]),
      sheet([emptyState("Keine Saison", "Sobald eine Saison aktiv ist, erscheint hier der Spielplan.")])
    );
    return;
  }

  const [leagueGames, extraGames, myDoc] = await Promise.all([
    listGamesForSeason(season.id),
    listBonnExtraGames(season.id),
    getMyUserDoc(state.user.uid)
  ]);

  const bonnLeagueGames = leagueGames
    .filter((g) => g.homeTeamName === BONN_TEAM_NAME || g.awayTeamName === BONN_TEAM_NAME)
    .map((g) => ({
      id: g.id, competition: "liga",
      opponent: g.homeTeamName === BONN_TEAM_NAME ? g.awayTeamName : g.homeTeamName,
      isHome: g.homeTeamName === BONN_TEAM_NAME,
      kickoff: g.kickoff, status: g.status, homeScore: g.homeScore, awayScore: g.awayScore, note: ""
    }));

  const bonnExtra = extraGames.map((g) => ({
    id: g.id, competition: g.competition, opponent: g.opponent, isHome: g.isHome,
    kickoff: g.kickoff, status: g.status, homeScore: g.homeScore, awayScore: g.awayScore, note: g.note || ""
  }));

  const all = [...bonnLeagueGames, ...bonnExtra].sort((a, b) => tsToDate(a.kickoff) - tsToDate(b.kickoff));

  container.innerHTML = "";
  container.append(poster([
    posterBar(backLink("#/profile", "Profil"), spacer()),
    posterTitle([["Telekom"], ["Baskets Bonn", "mg"]], "is-medium"),
    posterSub("Liga, Champions League & Pokal – alle Spiele auf einen Blick")
  ]));

  const filterBar = el("div", { class: "tabs", role: "tablist" }, [
    filterBtn(false, "Alle Spiele"),
    filterBtn(true, "Nur Heimspiele")
  ]);
  const listHost = el("div");
  renderList();

  container.appendChild(sheet([filterBar, listHost, renderReminderPanel(myDoc)]));

  function filterBtn(value, label) {
    const btn = el("button", {
      type: "button", role: "tab", class: "tab" + (homeOnly === value ? " is-active" : ""),
      "aria-selected": String(homeOnly === value)
    }, label);
    btn.addEventListener("click", () => {
      if (homeOnly === value) return;
      homeOnly = value;
      const root = document.getElementById("view");
      root.innerHTML = "";
      renderBonnPage(root);
    });
    return btn;
  }

  function renderList() {
    listHost.innerHTML = "";
    const filtered = homeOnly ? all.filter((g) => g.isHome) : all;
    if (!filtered.length) {
      listHost.appendChild(emptyState(
        "Keine Spiele",
        homeOnly ? "Aktuell keine Heimspiele eingetragen." : "Noch keine Spiele für diese Saison eingetragen."
      ));
      return;
    }
    for (const group of groupByDay(filtered)) {
      listHost.appendChild(sectionHead(fmtDayShort(group.date), plural(group.games.length, "Spiel", "Spiele")));
      for (const g of group.games) listHost.appendChild(renderBonnRow(g));
    }
  }
}

function renderBonnRow(g) {
  const finished = g.status === "finished";
  const kickoff = tsToDate(g.kickoff);
  const matchup = g.isHome ? `Bonn – ${g.opponent}` : `${g.opponent} – Bonn`;
  const meta = [fmtTime(kickoff)];
  if (finished) meta.push(`Ende · ${g.homeScore}:${g.awayScore}`);
  meta.push(COMPETITION_LABELS[g.competition] || g.competition);
  if (g.note) meta.push(g.note);

  return el("div", { class: "list-row bonn-row" + (g.isHome ? " is-home" : "") }, [
    el("div", {}, [
      el("div", { class: "list-row-main" }, matchup),
      el("div", { class: "hint" }, meta.join(" · "))
    ]),
    g.isHome ? el("span", { class: "pill pill-mg" }, "Heim") : null
  ]);
}

function groupByDay(gamesList) {
  const groups = [];
  for (const g of gamesList) {
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

function renderReminderPanel(myDoc) {
  const prefs = myDoc?.bonnReminder || {};
  const competitions = prefs.competitions || DEFAULT_COMPETITIONS;

  const enabledInput = el("input", { type: "checkbox", checked: Boolean(prefs.enabled) });
  const hoursInput = el("input", { type: "number", min: "1", max: "72", value: String(prefs.hoursBefore ?? 3), style: "max-width:100px" });
  const cbLiga = el("input", { type: "checkbox", checked: competitions.includes("liga") });
  const cbCl = el("input", { type: "checkbox", checked: competitions.includes("cl") });
  const cbPokal = el("input", { type: "checkbox", checked: competitions.includes("pokal") });

  const saveBtn = el("button", { type: "button", class: "btn btn-primary" }, "Speichern");
  saveBtn.addEventListener("click", async () => {
    const selected = [];
    if (cbLiga.checked) selected.push("liga");
    if (cbCl.checked) selected.push("cl");
    if (cbPokal.checked) selected.push("pokal");
    if (enabledInput.checked && !selected.length) {
      toast("Bitte mindestens einen Wettbewerb auswählen.", "error");
      return;
    }
    saveBtn.disabled = true;
    try {
      await updateUserPrefs(state.user.uid, {
        bonnReminder: {
          enabled: enabledInput.checked,
          hoursBefore: Number(hoursInput.value) || 3,
          competitions: selected.length ? selected : DEFAULT_COMPETITIONS
        }
      });
      toast("Gespeichert", "success");
    } finally {
      saveBtn.disabled = false;
    }
  });

  return el("div", { class: "card" }, [
    sectionHead("Heimspiel-Erinnerung"),
    el("p", { class: "hint" },
      "Push-Erinnerung vor Heimspielen der Telekom Baskets Bonn, unabhängig von den Tipp-Erinnerungen. " +
      "Dafür müssen Benachrichtigungen im Profil aktiviert sein."
    ),
    el("label", { class: "check-row" }, [enabledInput, "Erinnerung aktivieren"]),
    el("label", {}, "Wie viele Stunden vorher?"),
    hoursInput,
    el("div", { class: "hint", style: "margin:10px 0 2px" }, "Für welche Wettbewerbe?"),
    el("label", { class: "check-row" }, [cbLiga, "Liga (BBL)"]),
    el("label", { class: "check-row" }, [cbCl, "Champions League"]),
    el("label", { class: "check-row" }, [cbPokal, "Netto BBL Pokal"]),
    el("div", { class: "btn-row" }, [saveBtn])
  ]);
}
