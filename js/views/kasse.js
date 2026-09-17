// "Kasse": wer hat an welchem Spieltag (inkl. Bonusrunde) und in der Gesamtwertung Geld
// gewonnen, und ist das schon ausgezahlt. Sichtbar für alle (Transparenz), die Einstellungen
// (Einsätze, Teilnehmer:innen) und der "Ausgezahlt"-Schalter sind nur für Admins bedienbar.
import { state, displayNameFor } from "../state.js";
import {
  listMatchdays, listGamesForSeason, listBonusRounds, listBonusQuestionsForSeason,
  listTipsForSeason, listBonusAnswersForSeason, listUsers,
  updateSeasonMoneyConfig, listPayouts, setPayoutStatus, payoutDocId, tsToDate
} from "../data.js";
import { computeSeasonStandings } from "../scoring.js";
import { computeMoneyRows, summarizeMoneyRows } from "../money.js";
import { el, toast, fmtDate } from "../util.js";
import {
  setTheme, poster, posterBar, backLink, spacer, seasonChip, posterTitle, posterSub,
  sheet, sectionHead, loadingView, emptyState, plural, icon
} from "../ui.js";

const DEFAULT_PER_MATCHDAY_FEE = 1;
const DEFAULT_SEASON_FEE = 10;

const fmtEuro = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export async function renderKassePage(container) {
  setTheme("ink");
  container.appendChild(loadingView("Lade Kasse …"));

  const season = state.activeSeason;
  if (!season) {
    container.innerHTML = "";
    container.append(
      poster([posterBar(backLink("#/profile", "Profil")), posterTitle([["Kasse"]], "is-medium")]),
      sheet([emptyState("Keine Saison", "Sobald eine Saison aktiv ist, erscheint hier die Kasse.")])
    );
    return;
  }

  const [matchdays, games, bonusRounds, questions, tips, answers, users, payouts] = await Promise.all([
    listMatchdays(season.id), listGamesForSeason(season.id), listBonusRounds(season.id),
    listBonusQuestionsForSeason(season.id), listTipsForSeason(season.id),
    listBonusAnswersForSeason(season.id), listUsers(), listPayouts(season.id)
  ]);
  state.usersById = Object.fromEntries(users.map((u) => [u.id, u]));

  const gamesByMatchday = {};
  for (const g of games) (gamesByMatchday[g.matchdayId] ||= []).push(g);
  const questionsByRound = {};
  for (const q of questions) (questionsByRound[q.bonusRoundId] ||= []).push(q);

  const standings = computeSeasonStandings({ matchdays, gamesByMatchday, tips, bonusRounds, questionsByRound, answers });

  const moneyConfig = season.money || {};
  const perMatchdayFee = moneyConfig.perMatchdayFee ?? DEFAULT_PER_MATCHDAY_FEE;
  const seasonFee = moneyConfig.seasonFee ?? DEFAULT_SEASON_FEE;
  const participantIds = moneyConfig.participantIds ?? users.map((u) => u.id);

  const rows = computeMoneyRows(standings, {
    participantCount: participantIds.length, perMatchdayFee, seasonFee
  });
  const payoutFor = (r) => payouts[payoutDocId(season.id, r.kind, r.refId)] || null;
  const isPaid = (r) => Boolean(payoutFor(r)?.paid);
  const summary = summarizeMoneyRows(rows, isPaid);
  const roundsCount = rows.length ? rows.length - 1 : 0; // ohne den Gesamtsieger-Eintrag

  container.innerHTML = "";
  container.append(poster([
    posterBar(backLink("#/profile", "Profil"), spacer(), seasonChip("chip-mg")),
    posterTitle([["Kasse"]], "is-medium"),
    posterSub(participantIds.length
      ? `${plural(participantIds.length, "Teilnehmer:in", "Teilnehmer:innen")} · ${fmtEuro(perMatchdayFee)} je Spieltag, ${fmtEuro(seasonFee)} Gesamtsieger`
      : "Noch keine Teilnehmer:innen für die Kasse ausgewählt.")
  ]));

  const sheetItems = [];
  if (state.isAdmin) {
    sheetItems.push(renderSettingsCard(season, users, { perMatchdayFee, seasonFee, participantIds }, roundsCount, refresh));
  }
  sheetItems.push(renderSummaryCard(summary));
  sheetItems.push(sectionHead("Spieltage & Bonusrunde", rows.length ? plural(rows.length, "Eintrag", "Einträge") : ""));
  if (!rows.length) {
    sheetItems.push(emptyState("Noch nichts zu verteilen", "Sobald Spieltage mit Ergebnissen angelegt sind, erscheinen sie hier."));
  }
  for (const r of rows) sheetItems.push(renderMoneyRow(r, season.id, payoutFor(r), refresh));

  container.appendChild(sheet(sheetItems));

  function refresh() {
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderKassePage(root);
  }
}

function renderSummaryCard(summary) {
  return el("div", { class: "card" }, [
    el("div", { class: "kv" }, [el("span", { class: "kv-label" }, "Gesamttopf der Saison"), el("span", { class: "kv-value" }, fmtEuro(summary.totalPot))]),
    el("div", { class: "kv" }, [el("span", { class: "kv-label" }, "Bereits entschieden"), el("span", { class: "kv-value" }, fmtEuro(summary.decidedPot))]),
    el("div", { class: "kv" }, [el("span", { class: "kv-label" }, "Ausgezahlt"), el("span", { class: "kv-value" }, fmtEuro(summary.paidOut))]),
    el("div", { class: "kv" }, [el("span", { class: "kv-label" }, "Noch offen"), el("span", { class: "kv-value" }, fmtEuro(summary.open))])
  ]);
}

function renderMoneyRow(row, seasonId, payout, onChange) {
  const paid = Boolean(payout?.paid);
  const paidDateText = paid && payout?.paidAt ? fmtDate(tsToDate(payout.paidAt)) : null;
  const winnerText = !row.decided
    ? "Steht noch aus"
    : row.winners.length
      ? row.winners.map(displayNameFor).join(" & ")
      : "Niemand hat gepunktet";
  const amountText = row.decided && row.winners.length
    ? row.winners.length > 1
      ? `${fmtEuro(row.pot)} geteilt · je ${fmtEuro(row.share)}`
      : fmtEuro(row.share)
    : fmtEuro(row.pot);
  const hintText = [winnerText, amountText, paidDateText ? `ausgezahlt am ${paidDateText}` : null]
    .filter(Boolean).join(" · ");

  const end = [];
  if (row.decided && row.winners.length) {
    if (state.isAdmin) {
      const btn = el("button", { class: `btn btn-sm ${paid ? "btn-secondary" : "btn-primary"}` }, paid ? "Ausgezahlt ✓" : "Auszahlen");
      btn.addEventListener("click", async () => {
        const next = !paid;
        if (next && !confirm(`Auszahlung von ${amountText} an ${winnerText} für „${row.label}“ als erledigt markieren?`)) return;
        btn.disabled = true;
        try {
          await setPayoutStatus(seasonId, row.kind, row.refId, next);
          toast(next ? "Als ausgezahlt markiert" : "Als offen markiert", "success");
          onChange();
        } finally {
          btn.disabled = false;
        }
      });
      end.push(btn);
    } else {
      end.push(el("span", { class: `pill ${paid ? "pill-mg" : ""}` }, paid ? "Ausgezahlt" : "Offen"));
    }
  }

  return el("div", { class: "list-row" }, [
    el("div", {}, [
      el("div", { class: "list-row-main" }, row.label),
      el("div", { class: "hint" }, hintText)
    ]),
    el("div", { class: "inline-actions" }, end)
  ]);
}

function renderSettingsCard(season, users, current, roundsCount, onChange) {
  const feeInput = el("input", { type: "number", min: "0", step: "0.5", value: String(current.perMatchdayFee) });
  const seasonFeeInput = el("input", { type: "number", min: "0", step: "0.5", value: String(current.seasonFee) });
  const totalHint = el("p", { class: "hint" });
  function updateTotalHint() {
    const per = Number(feeInput.value) || 0;
    const seasonPart = Number(seasonFeeInput.value) || 0;
    totalHint.textContent = `Bei aktuell ${plural(roundsCount, "gewertetem Eintrag", "gewerteten Einträgen")} zahlt jede:r Teilnehmer:in ${fmtEuro(per * roundsCount + seasonPart)} für die ganze Saison.`;
  }
  feeInput.addEventListener("input", updateTotalHint);
  seasonFeeInput.addEventListener("input", updateTotalHint);
  updateTotalHint();

  const checkboxes = users.map((u) => {
    const cb = el("input", { type: "checkbox", checked: current.participantIds.includes(u.id) });
    return { userId: u.id, cb, row: el("label", { class: "check-row" }, [cb, u.displayName || u.email || "Unbekannt"]) };
  });

  const saveBtn = el("button", { class: "btn btn-primary" }, "Speichern");
  saveBtn.addEventListener("click", async () => {
    const participantIds = checkboxes.filter((c) => c.cb.checked).map((c) => c.userId);
    if (!participantIds.length) { toast("Bitte mindestens eine:n Teilnehmer:in auswählen.", "error"); return; }
    saveBtn.disabled = true;
    try {
      await updateSeasonMoneyConfig(season.id, {
        perMatchdayFee: Number(feeInput.value) || 0,
        seasonFee: Number(seasonFeeInput.value) || 0,
        participantIds
      });
      toast("Kasse gespeichert", "success");
      onChange();
    } finally {
      saveBtn.disabled = false;
    }
  });

  return el("div", { class: "card is-sub" }, [
    el("h4", { class: "mt-0" }, [icon("wallet", 20, 2), " Einstellungen"]),
    el("div", { class: "grid-2" }, [
      el("div", {}, [el("label", {}, "Einsatz je Spieltag"), feeInput]),
      el("div", {}, [el("label", {}, "Einsatz Gesamtsieger"), seasonFeeInput])
    ]),
    totalHint,
    el("div", { class: "hint", style: "margin:10px 0 2px" }, "Zahlende Teilnehmer:innen (Kasse)"),
    ...checkboxes.map((c) => c.row),
    el("div", { class: "btn-row" }, [saveBtn])
  ]);
}
