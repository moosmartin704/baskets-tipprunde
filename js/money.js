// Reine Berechnungslogik für die "Kasse": Wer hat an welchem Spieltag (inkl. Bonusrunde und
// Gesamtwertung) wie viel Geld gewonnen. Baut auf den Ergebnissen von computeSeasonStandings()
// auf (siehe scoring.js) und rechnet nur noch Töpfe/Anteile aus - keine Firestore-Zugriffe hier.
import { matchdayWinners } from "./standings-core.js";

function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

function moneyRow({ kind, refId, label, decided, winners, pot }) {
  const share = decided && winners.length ? roundMoney(pot / winners.length) : 0;
  return { kind, refId, label, decided, winners, pot, share };
}

/**
 * Baut die Liste aller Geld-Zeilen: ein Eintrag pro Spieltag (regulär + Playoff), einer pro
 * Bonusrunde, und ein abschließender Eintrag für den Gesamtsieger der Saison.
 *
 * @param {object} standings - Rückgabewert von computeSeasonStandings().
 * @param {number} participantCount - Anzahl der zahlenden Teilnehmer:innen (Kasse).
 * @param {number} perMatchdayFee - Einsatz pro Person und Spieltag (inkl. Bonusrunde).
 * @param {number} seasonFee - Einsatz pro Person für den Gesamtsieger-Topf.
 */
export function computeMoneyRows({ matchdayResults, bonusResults, ranking }, { participantCount, perMatchdayFee, seasonFee }) {
  const matchdayPot = roundMoney(participantCount * perMatchdayFee);
  const rows = [];

  for (const r of matchdayResults) {
    rows.push(moneyRow({
      kind: "matchday", refId: r.matchday.id, label: r.matchday.label,
      decided: r.allFinished, winners: r.allFinished ? r.winners : [], pot: matchdayPot
    }));
  }

  for (const r of bonusResults) {
    const { winners } = matchdayWinners(r.scores);
    rows.push(moneyRow({
      kind: "bonus", refId: r.bonusRound.id, label: r.bonusRound.label,
      decided: r.allResolved, winners: r.allResolved ? winners : [], pot: matchdayPot
    }));
  }

  const seasonDecided = rows.length > 0 && rows.every((r) => r.decided);
  const topPoints = ranking[0]?.points ?? 0;
  const seasonWinners = topPoints > 0 ? ranking.filter((r) => r.points === topPoints).map((r) => r.userId) : [];
  rows.push(moneyRow({
    kind: "season", refId: "season", label: "Gesamtsieger",
    decided: seasonDecided, winners: seasonDecided ? seasonWinners : [], pot: roundMoney(participantCount * seasonFee)
  }));

  return rows;
}

/** Summen für die Kopfzeile: Gesamttopf der Saison, bereits entschiedene/ausgezahlte Beträge. */
export function summarizeMoneyRows(rows, isPaid) {
  let totalPot = 0, decidedPot = 0, paidOut = 0;
  for (const r of rows) {
    totalPot += r.pot;
    if (r.decided) {
      decidedPot += r.pot;
      if (isPaid(r)) paidOut += r.pot;
    }
  }
  return { totalPot: roundMoney(totalPot), decidedPot: roundMoney(decidedPot), paidOut: roundMoney(paidOut), open: roundMoney(decidedPot - paidOut) };
}
