import { state, displayNameFor } from "../state.js";
import {
  getBonusRound, listBonusQuestions, listBonusAnswersForSeason, listUsers,
  getMyBonusAnswer, setMyBonusAnswer, resolveBonusQuestion, reopenBonusQuestion, tsToDate
} from "../data.js";
import { el, toast, fmtDateTime } from "../util.js";
import {
  setTheme, poster, posterBar, backLink, spacer, posterTitle, posterSub, sheet,
  loadingView, emptyState
} from "../ui.js";
import { renderBonusQuestion, renderBonusRoundAnswers, rankRow, tipParticipantIds } from "./shared.js";
import { computeBonusRoundScores } from "../scoring.js";

export async function renderBonusDetail(container, { id }) {
  setTheme("magenta");
  container.appendChild(loadingView("Lade Bonusfragen …"));

  const season = state.activeSeason;
  const [br, questions, users, allAnswers] = await Promise.all([
    getBonusRound(id),
    listBonusQuestions(id),
    listUsers(),
    season ? listBonusAnswersForSeason(season.id) : Promise.resolve([])
  ]);
  state.usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  const myAnswers = await Promise.all(questions.map((q) => getMyBonusAnswer(state.user.uid, q.id)));

  const deadline = br?.deadline ? tsToDate(br.deadline) : null;
  const locked = deadline ? Date.now() >= deadline.getTime() : false;

  const scores = computeBonusRoundScores(questions, allAnswers);
  const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const answeredCount = myAnswers.filter((a) => a?.selected?.length).length;
  const resolvedCount = questions.filter((q) => q.resolved).length;

  container.innerHTML = "";
  container.appendChild(poster([
    posterBar(backLink("#/matchdays", "Spieltage"), spacer(), el("span", { class: "chip" }, "Bonus")),
    posterTitle([[br?.label || "Bonusfragen"]], "is-small"),
    posterSub(deadline
      ? (locked ? `Abgabe beendet seit ${fmtDateTime(deadline)}` : `Abgabe bis ${fmtDateTime(deadline)}`)
      : "Keine Abgabefrist"),
    el("div", { class: "stat-row" }, [
      stat(`${answeredCount}/${questions.length}`, "Beantwortet"),
      stat(String(scores[state.user.uid] ?? 0), "Punkte"),
      stat(`${resolvedCount}/${questions.length}`, "Aufgelöst")
    ])
  ]));

  const questionsPane = el("div", { class: "pane", id: "pane-questions", role: "tabpanel", "aria-labelledby": "tab-questions" });
  const tablePane = el("div", { class: "pane", id: "pane-bonus-table", role: "tabpanel", "aria-labelledby": "tab-bonus-table", hidden: true });
  const tabQuestions = el("button", { type: "button", class: "tab is-active", id: "tab-questions", role: "tab", "aria-selected": "true", "aria-controls": "pane-questions" }, "Fragen");
  const tabTable = el("button", { type: "button", class: "tab", id: "tab-bonus-table", role: "tab", "aria-selected": "false", "aria-controls": "pane-bonus-table" }, "Tabelle");
  const selectTab = (showQuestions) => {
    questionsPane.hidden = !showQuestions;
    tablePane.hidden = showQuestions;
    tabQuestions.classList.toggle("is-active", showQuestions);
    tabTable.classList.toggle("is-active", !showQuestions);
    tabQuestions.setAttribute("aria-selected", String(showQuestions));
    tabTable.setAttribute("aria-selected", String(!showQuestions));
  };
  tabQuestions.addEventListener("click", () => selectTab(true));
  tabTable.addEventListener("click", () => selectTab(false));

  if (!br) {
    questionsPane.appendChild(emptyState("Nicht gefunden", "Diese Bonusrunde gibt es nicht (mehr)."));
  } else if (!questions.length) {
    questionsPane.appendChild(emptyState("Noch leer", "Für diese Runde sind noch keine Fragen angelegt."));
  }
  const participantIds = tipParticipantIds(users);
  questions.forEach((q, i) => {
    const questionLocked = locked || q.resolved;
    const questionEl = renderBonusQuestion(q, myAnswers[i], async (selected) => {
      await setMyBonusAnswer(state.user.uid, season.id, q.bonusRoundId, q.id, selected, br?.deadline || null);
      toast("Antwort gespeichert", "success");
      rerender();
    }, questionLocked, i);
    // Antworten der anderen erst, wenn niemand mehr antworten kann.
    if (questionLocked) questionEl.appendChild(renderBonusRoundAnswers(q, allAnswers, participantIds));
    questionsPane.appendChild(questionEl);
    if (state.isAdmin) questionsPane.appendChild(renderResolvePanel(q, rerender));
  });

  if (!ranking.length) {
    tablePane.appendChild(emptyState("Noch keine Antworten", "Sobald jemand antwortet, erscheint hier die Tabelle."));
  } else {
    tablePane.appendChild(el("div", { class: "rank-list" }, ranking.map(([uid, pts], i) => rankRow({
      rank: i + 1, name: displayNameFor(uid), points: pts, you: uid === state.user.uid
    }))));
  }

  container.appendChild(sheet([
    el("div", { class: "tabs", role: "tablist" }, [tabQuestions, tabTable]),
    questionsPane,
    tablePane
  ]));

  function rerender() {
    container.innerHTML = "";
    renderBonusDetail(container, { id });
  }
}

function stat(value, label) {
  return el("div", { class: "stat" }, [
    el("div", { class: "stat-value" }, value),
    el("div", { class: "stat-label" }, label)
  ]);
}

function renderResolvePanel(question, onSaved) {
  const isMulti = question.type === "multi";
  const pickCount = question.pickCount || 1;
  let picked = new Set(question.correctOptions || []);

  const list = el("div", { class: "check-list" });
  question.options.forEach((opt, i) => {
    const inputId = `resolve_${question.id}_${i}`;
    const input = el("input", {
      type: isMulti ? "checkbox" : "radio",
      id: inputId,
      name: `resolve_${question.id}`,
      checked: picked.has(opt)
    });
    input.addEventListener("change", (e) => {
      if (isMulti) {
        if (e.target.checked) picked.add(opt); else picked.delete(opt);
      } else {
        picked = new Set([opt]);
      }
    });
    list.appendChild(el("label", { class: "check-item", for: inputId }, [input, el("span", {}, opt)]));
  });

  const saveBtn = el("button", { type: "button", class: "btn btn-primary btn-sm" }, "Als richtig markieren");
  saveBtn.addEventListener("click", async () => {
    if (!picked.size) { toast("Bitte mindestens eine Option wählen.", "error"); return; }
    saveBtn.disabled = true;
    await resolveBonusQuestion(question.id, Array.from(picked));
    toast("Bonusfrage ausgewertet", "success");
    onSaved();
  });

  const reopenBtn = question.resolved
    ? el("button", { type: "button", class: "btn btn-secondary btn-sm" }, "Zurücksetzen")
    : null;
  reopenBtn?.addEventListener("click", async () => {
    reopenBtn.disabled = true;
    await reopenBonusQuestion(question.id);
    toast("Auflösung zurückgesetzt", "success");
    onSaved();
  });

  const form = el("div", { class: "panel is-sub", hidden: true }, [
    el("p", { class: "hint" }, `Richtige Antwort${isMulti ? `en (genau ${pickCount})` : ""} auswählen:`),
    list,
    el("div", { class: "btn-row" }, [saveBtn, reopenBtn])
  ]);

  const toggle = el("button", { type: "button", class: "btn-ghost", "aria-expanded": "false" },
    question.resolved ? "Auflösung ändern" : "Frage auflösen");
  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
    toggle.setAttribute("aria-expanded", String(!form.hidden));
  });

  return el("div", { class: "game-admin is-block" }, [toggle, form]);
}
