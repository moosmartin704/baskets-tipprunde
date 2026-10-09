// „Basketball-ABC“: Regeln, Fouls, Positionen und Spielzüge, erklärt für alle in der Tipprunde.
// Reine Lese-Seite ohne Daten aus Firestore. Der Text steht in basketball-content.js, die
// Spielfeld-Grafiken zeichnet basketball-figures.js.
import { el } from "../util.js";
import { setTheme, poster, posterBar, backLink, spacer, posterTitle, posterSub, sheet } from "../ui.js";
import { GUIDE_HTML } from "../basketball-content.js";
import { drawFigures } from "../basketball-figures.js";

export function renderBasketballPage(container) {
  setTheme("ink");

  container.append(poster([
    posterBar(backLink("#/profile", "Profil"), spacer(), el("span", { class: "chip chip-mg" }, "Stand Okt. 2026")),
    posterTitle([["Basketball"], ["verstehen", "mg"]], "is-medium"),
    posterSub("Regeln · Fouls · Positionen · Spielzüge"),
    el("div", { class: "stat-row" }, [
      stat("40", "Minuten netto"),
      stat("24", "Sekunden pro Angriff", true),
      stat("5", "Fouls, dann raus")
    ])
  ]));

  const guide = el("div", { class: "abc", html: GUIDE_HTML });
  drawFigures(guide);

  // Die App nutzt den Hash fürs Routing („#/…“). Ein Sprung zu „#abc-fouls“ würde die Seite
  // verlassen, deshalb scrollen die Inhaltslinks per Skript statt über den Hash.
  guide.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#abc-"]');
    if (!link) return;
    e.preventDefault();
    jumpTo(link.getAttribute("href").slice(1));
  });

  container.append(
    sheet([guide]),
    el("button", { type: "button", class: "abc-fab", onclick: () => jumpTo("abc-inhalt") }, "Inhalt")
  );
}

function stat(value, label, accent = false) {
  return el("div", { class: "stat" }, [
    el("div", { class: accent ? "stat-value is-mg" : "stat-value" }, value),
    el("div", { class: "stat-label" }, label)
  ]);
}

function jumpTo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}
