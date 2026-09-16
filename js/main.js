import { auth, onAuthStateChanged } from "./firebase.js";
import { ensureUserDoc, getActiveSeason, listPendingChanges, getAppConfig } from "./data.js";
import { state } from "./state.js";
import { addRoute, handleRoute, startRouter, currentBasePath } from "./router.js";
import { renderAuthView } from "./auth.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderMatchdays } from "./views/matchdays.js";
import { renderLeagueTable } from "./views/table.js";
import { renderMatchdayDetail } from "./views/matchdayDetail.js";
import { renderBonusDetail } from "./views/bonusDetail.js";
import { renderStandings } from "./views/standings.js";
import { renderAdmin } from "./views/admin.js";
import { renderProfile } from "./views/profile.js";
import { renderBonnPage } from "./views/bonn.js";
import { clear, el } from "./util.js";
import {
  icon, setTheme, refreshTeamCodes, updatePendingDot, poster, posterBar, backLink,
  posterTitle, sheet, emptyState
} from "./ui.js";

const viewEl = document.getElementById("view");
const tabBar = document.getElementById("tabBar");

// Welcher Reiter der unteren Leiste zu welcher Ansicht gehört.
const TAB_FOR_ROUTE = {
  dashboard: "dashboard",
  matchdays: "matchdays",
  matchday: "matchdays",
  bonus: "matchdays",
  table: "table",
  standings: "standings",
  profile: "profile",
  admin: "profile",
  bonn: "profile"
};

tabBar.querySelectorAll("a[data-tab]").forEach((a) => a.prepend(icon(a.dataset.icon, 22, 2)));

function setActiveNav() {
  const active = TAB_FOR_ROUTE[currentBasePath()] || "dashboard";
  tabBar.querySelectorAll("a[data-tab]").forEach((a) => {
    const isActive = a.dataset.tab === active;
    a.classList.toggle("is-active", isActive);
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function route(pattern, render) {
  addRoute(pattern, async (params) => {
    clear(viewEl);
    window.scrollTo(0, 0);
    await render(viewEl, params);
  });
}

route("dashboard", renderDashboard);
route("matchdays", renderMatchdays);
route("table", renderLeagueTable);
route("matchday/:id", renderMatchdayDetail);
route("bonus/:id", renderBonusDetail);
route("standings", renderStandings);
route("profile", renderProfile);
route("bonn", renderBonnPage);
route("admin", async (container) => {
  if (!state.isAdmin) {
    container.append(...renderNoAccess());
    return;
  }
  await renderAdmin(container);
});

function renderNoAccess() {
  setTheme("ink");
  return [
    poster([posterBar(backLink("#/profile", "Profil")), posterTitle([["Kein"], ["Zugriff", "mg"]], "is-medium")]),
    sheet([emptyState(
      "Nur für Admins",
      "Die Verwaltung ist nur für die Spielleitung freigeschaltet.",
      el("a", { class: "btn btn-ink", href: "#/dashboard" }, "Zur Übersicht")
    )])
  ];
}

window.addEventListener("hashchange", setActiveNav);

startRouter();

onAuthStateChanged(auth, async (user) => {
  clear(viewEl);
  if (!user) {
    state.user = null;
    state.isAdmin = false;
    tabBar.hidden = true;
    document.body.classList.add("no-nav");
    updatePendingDot(0);
    renderAuthView(viewEl);
    return;
  }

  state.user = user;
  tabBar.hidden = false;
  document.body.classList.remove("no-nav");

  await ensureUserDoc(user.uid, user.displayName || user.email, user.email);

  const appConfig = await getAppConfig();
  const myEmail = (user.email || "").toLowerCase();
  state.isAdmin = (appConfig.adminEmails || []).some((e) => e.toLowerCase() === myEmail);

  state.activeSeason = await getActiveSeason();
  await refreshTeamCodes(state.activeSeason?.id);

  if (state.activeSeason && state.isAdmin) {
    const pending = await listPendingChanges(state.activeSeason.id);
    updatePendingDot(pending.length);
  } else {
    updatePendingDot(0);
  }

  await handleRoute();
  setActiveNav();
});
