// Gemeinsame Bausteine für das Plakat-Design: Icons, Kopfbereich („Poster“) mit Spielfeld-Linien,
// Papier-Fläche („Sheet“), Abschnittsüberschriften und Team-Kürzel.
import { el, suggestTeamCode } from "./util.js";
import { state } from "./state.js";
import { listTeams } from "./data.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"></path>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"></rect><path d="M3.5 9.5h17M3.5 14.5h17M9 4.5v15"></path>',
  trophy: '<path d="M7.5 4.5h9v4.5a4.5 4.5 0 0 1-9 0z"></path><path d="M7.5 6.5H5a2.5 2.5 0 0 0 2.7 3.9M16.5 6.5H19a2.5 2.5 0 0 1-2.7 3.9M12 13.5v3.5M8.5 20h7M10 17h4"></path>',
  user: '<circle cx="12" cy="8.5" r="3.8"></circle><path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path>',
  chevL: '<path d="M14.5 6l-6 6 6 6"></path>',
  chevR: '<path d="M9.5 6l6 6-6 6"></path>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
  x: '<path d="M7 7l10 10M17 7L7 17"></path>',
  help: '<circle cx="12" cy="12" r="8.5"></circle><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4"></path><path d="M12 16.8v.2"></path>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
  settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>',
  bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"></path><path d="M10 20.5a2 2 0 0 0 4 0"></path>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"></path><path d="M10 16l-4-4 4-4M6 12h10"></path>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"></rect><path d="M4 7.5l8 6 8-6"></path>',
  wallet: '<path d="M6 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1"></path><rect x="3" y="7" width="18" height="12" rx="2.5"></rect><path d="M3 10.5h18"></path><circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none"></circle>'
};

export function icon(name, size = 24, strokeWidth = 1.8) {
  const svg = document.createElementNS(SVG_NS, "svg");
  const attrs = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": strokeWidth, "stroke-linecap": "round", "stroke-linejoin": "round",
    "aria-hidden": "true", focusable: "false"
  };
  for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);
  svg.innerHTML = ICONS[name] || "";
  return svg;
}

/** Hintergrund der Seite: "magenta" (Übersicht, Login) oder "ink" (alle anderen Ansichten). */
export function setTheme(theme) {
  document.body.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "magenta" ? "#E20074" : "#0F0D0E";
}

function courtLines() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "court");
  svg.setAttribute("viewBox", "0 0 390 420");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M76 -2A236 236 0 1 0 544 -2"></path><rect x="250" y="-2" width="120" height="180"></rect>'
    + '<circle cx="310" cy="178" r="60"></circle><path d="M285 16h50"></path><circle cx="310" cy="30" r="10"></circle>';
  return svg;
}

export function poster(children) {
  return el("header", { class: "poster" }, [courtLines(), ...children]);
}

export function posterBar(...items) {
  return el("div", { class: "poster-bar" }, items);
}

export function spacer() {
  return el("div", { class: "spacer" });
}

export function brand() {
  return el("div", { class: "brand" }, "Baskets Tipprunde");
}

export function shortSeason(name) {
  const m = String(name || "").match(/(\d{2,4})\s*\/\s*(\d{2,4})/);
  return m ? `${m[1].slice(-2)}/${m[2].slice(-2)}` : String(name || "");
}

export function seasonChip(extraClass = "") {
  const season = state.activeSeason;
  if (!season) return null;
  return el("span", { class: `chip ${extraClass}`.trim(), title: `Saison ${season.name}` }, shortSeason(season.name));
}

export function initial(name) {
  return (String(name || "").trim()[0] || "?").toUpperCase();
}

export function avatarLink() {
  const name = state.user?.displayName || state.user?.email || "";
  return el("a", { class: "avatar-link", href: "#/profile", "aria-label": "Profil" }, initial(name));
}

export function backLink(href, label) {
  return el("a", { class: "back-btn", href }, [
    el("span", { class: "circle" }, icon("chevL", 22, 2.2)),
    el("span", { class: "label" }, label)
  ]);
}

/** Große Plakat-Überschrift. lines: [["23 Tipps"], ["offen", "ink"]] – zweiter Wert färbt die Zeile ein. */
export function posterTitle(lines, size = "") {
  return el("h1", { class: `poster-title ${size}`.trim() },
    lines.map(([text, accent]) => el("span", { class: accent ? `accent-${accent}` : "" }, text)));
}

export function posterSub(text) {
  return el("p", { class: "poster-sub" }, text);
}

export function sticker(href, text) {
  return el("a", { class: "sticker", href }, [
    el("span", {}, text),
    el("span", { class: "go" }, icon("arrowR", 18, 2.2))
  ]);
}

export function sheet(children) {
  return el("section", { class: "sheet" }, children);
}

export function sectionHead(title, count) {
  return el("div", { class: "sec-head" }, [
    el("h2", { class: "sec-title" }, title),
    el("div", { class: "sec-rule" }),
    count != null && count !== "" ? el("div", { class: "sec-count" }, count) : null
  ]);
}

export function loadingView(text) {
  return el("div", { class: "loading-splash" }, [el("div", { class: "spinner" }), el("p", {}, text)]);
}

export function emptyState(title, text, action) {
  return el("div", { class: "empty-state" }, [
    el("div", { class: "empty-title" }, title),
    text ? el("p", { class: "hint" }, text) : null,
    action || null
  ]);
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

/* ------------------------------ Team-Kürzel ------------------------------ */

export async function refreshTeamCodes(seasonId) {
  if (!seasonId) { state.teamCodes = {}; return; }
  const teams = await listTeams(seasonId);
  state.teamCodes = Object.fromEntries(teams.map((t) => [t.name, storedCode(t)]).filter(([, code]) => code));
}

// Ältere Importe haben automatisch die ersten drei Buchstaben gespeichert („TEL“ für Telekom Baskets
// Bonn). Solche Kürzel ignorieren wir zugunsten des besseren Vorschlags – außer ein Admin hat sie
// ausdrücklich so gesetzt (shortNameCustom).
function storedCode(team) {
  if (!team.shortName) return null;
  if (team.shortNameCustom) return team.shortName;
  return team.shortName === String(team.name).slice(0, 3).toUpperCase() ? null : team.shortName;
}

/** Kürzel, das für ein Team-Dokument angezeigt wird (gespeichert oder vorgeschlagen). */
export function effectiveTeamCode(team) {
  return storedCode(team) || suggestTeamCode(team.name);
}

/** Zähler für offene Änderungsvorschläge am Profil-Symbol der Navigation. */
export function updatePendingDot(count) {
  state.pendingCount = count;
  const dot = document.getElementById("profileDot");
  if (!dot) return;
  dot.hidden = !count;
  dot.textContent = String(count);
}

export function teamCode(name) {
  return state.teamCodes?.[name] || suggestTeamCode(name);
}

export function teamTag(name, picked = false) {
  return el("span", { class: "tag" + (picked ? " is-picked" : ""), title: name }, teamCode(name));
}
