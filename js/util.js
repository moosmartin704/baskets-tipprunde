export function toast(message, type = "") {
  const host = document.getElementById("toastHost");
  const el = document.createElement("div");
  el.className = `toast ${type}`.trim();
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function fmtDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const wd = WEEKDAYS[d.getDay()];
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${wd}, ${day}. ${month} · ${hh}:${mm}`;
}

export function fmtDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const wd = WEEKDAYS[d.getDay()];
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  return `${wd}, ${day}. ${month}`;
}

export function fmtTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Kurzes Tagesdatum für Überschriften, z. B. „Fr 18.09.“ */
export function fmtDayShort(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${WEEKDAYS[d.getDay()]} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
}

/** Zeitraum mehrerer Termine, z. B. „Do 24. – Fr 25. Sep“ oder „Do 24. Sep – Di 3. Nov“. */
export function fmtDateRange(dates) {
  if (!dates.length) return "";
  const sorted = [...dates].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const day = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}.`;
  if (first.toDateString() === last.toDateString()) return `${day(first)} ${MONTHS[first.getMonth()]}`;
  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    return `${day(first)} – ${day(last)} ${MONTHS[last.getMonth()]}`;
  }
  return `${day(first)} ${MONTHS[first.getMonth()]} – ${day(last)} ${MONTHS[last.getMonth()]}`;
}

export function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Kürzel für bekannte BBL-Teams; alle anderen bekommen die ersten drei Buchstaben ihres Ortsnamens.
const KNOWN_TEAM_CODES = {
  "ALBA BERLIN": "ALB",
  "BMA365 Bamberg Baskets": "BAM",
  "Basketball Löwen Braunschweig": "BRA",
  "EWE Baskets Oldenburg": "OLD",
  "FC Bayern München Basketball": "FCB",
  "Fitness First Würzburg Baskets": "WÜR",
  "MHP RIESEN Ludwigsburg": "LUD",
  "NINERS Chemnitz": "CHE",
  "Phoenix Hagen": "HAG",
  "RASTA Vechta": "VEC",
  "ROSTOCK SEAWOLVES": "ROS",
  "SKYLINERS": "FRA",
  "SYNTAINICS MBC": "MBC",
  "Science City Jena": "JEN",
  "Telekom Baskets Bonn": "BON",
  "VET-CONCEPT Gladiators Trier": "TRI",
  "Veolia Towers Hamburg": "HAM",
  "ratiopharm ulm": "ULM"
};
const GENERIC_TEAM_WORDS = new Set(["basketball", "baskets", "basket", "bbl"]);

export function suggestTeamCode(name) {
  const clean = String(name || "").trim();
  if (KNOWN_TEAM_CODES[clean]) return KNOWN_TEAM_CODES[clean];
  const words = clean.split(/[\s-]+/).filter(Boolean);
  const meaningful = words.filter((w) => !GENERIC_TEAM_WORDS.has(w.toLowerCase()));
  const word = meaningful[meaningful.length - 1] || words[words.length - 1] || clean;
  return word.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 3).toUpperCase() || "???";
}

export function fmtDateInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
