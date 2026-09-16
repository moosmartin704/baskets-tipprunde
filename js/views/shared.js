import { el, fmtTime, toast } from "../util.js";
import { gameWinner, teamForm } from "../scoring.js";
import { tsToDate, setGameResult, clearGameResult } from "../data.js";
import { icon, teamCode, teamTag } from "../ui.js";

/**
 * Eine Spielzeile im Plakat-Stil: Uhrzeit | Teams mit Kürzel | Tipp-Kreise (bzw. Ergebnis-Stempel).
 * opts.onPick(side) speichert einen Tipp ("home"/"away") und darf eine Promise zurückgeben;
 * die Zeile zeigt den neuen Tipp sofort an und springt bei einem Fehler zurück.
 * opts.seasonGames (optional): alle Spiele der Saison, um die Form der Teams anzuzeigen.
 * opts.adminEditor (optional): Ergebnis-Eingabe aus renderResultEditor() – der Link landet unter
 * der Uhrzeit, das Formular klappt unter der Zeile auf.
 */
export function renderGameRow(game, myTip, opts = {}) {
  const { onPick, seasonGames, adminEditor } = opts;
  const kickoff = tsToDate(game.kickoff);
  const finished = game.status === "finished";
  const started = () => Date.now() >= kickoff.getTime();
  const locked = finished || started();
  const winner = gameWinner(game);
  let picked = myTip?.picked || null;

  const homeTag = teamTag(game.homeTeamName, picked === "home");
  const awayTag = teamTag(game.awayTeamName, picked === "away");

  const timeCol = el("div", { class: "game-time" }, [
    el("div", { class: "game-clock" }, fmtTime(kickoff)),
    finished
      ? el("div", { class: "game-state" }, "Ende")
      : locked ? el("div", { class: "game-state is-live" }, "Läuft") : null,
    adminEditor?.toggle
  ]);

  const teamsCol = el("div", { class: "game-teams" }, [
    teamLine(game.homeTeamName, homeTag, finished ? scoreEl(game.homeScore, winner !== "home") : null, seasonGames),
    teamLine(game.awayTeamName, awayTag, finished ? scoreEl(game.awayScore, winner !== "away") : null, seasonGames)
  ]);

  const row = el("div", { class: "game" }, [timeCol, teamsCol]);

  if (finished) {
    row.appendChild(resultStamp(winner, picked));
  } else {
    const buttons = {};
    const setPicked = (side) => {
      picked = side;
      for (const [s, tag] of [["home", homeTag], ["away", awayTag]]) {
        buttons[s].classList.toggle("is-picked", s === side);
        buttons[s].setAttribute("aria-pressed", String(s === side));
        tag.classList.toggle("is-picked", s === side);
      }
    };
    const makeButton = (side, name) => {
      const code = teamCode(name);
      const btn = el("button", {
        type: "button",
        class: "pick" + (picked === side ? " is-picked" : "") + (code.length > 3 ? " is-long" : ""),
        disabled: locked || !onPick,
        "aria-pressed": String(picked === side),
        "aria-label": `Tipp: ${name} gewinnt`,
        title: name
      }, code);
      btn.addEventListener("click", async () => {
        if (!onPick || picked === side) return;
        if (started()) {
          toast("Das Spiel hat schon begonnen – Tipp gesperrt.", "error");
          buttons.home.disabled = buttons.away.disabled = true;
          return;
        }
        const previous = picked;
        setPicked(side);
        buttons.home.disabled = buttons.away.disabled = true;
        try {
          await onPick(side);
        } catch (err) {
          console.error(err);
          setPicked(previous);
          toast("Tipp konnte nicht gespeichert werden.", "error");
        } finally {
          buttons.home.disabled = buttons.away.disabled = started();
        }
      });
      return btn;
    };
    buttons.home = makeButton("home", game.homeTeamName);
    buttons.away = makeButton("away", game.awayTeamName);
    row.appendChild(el("div", { class: "picks" }, [buttons.home, buttons.away]));
  }

  if (adminEditor) row.appendChild(adminEditor.form);
  return row;
}

function teamLine(name, tag, score, seasonGames) {
  return el("div", { class: "team-line" }, [
    tag,
    el("div", { class: "team-name" }, [name, formDots(seasonGames, name)]),
    score
  ]);
}

function scoreEl(value, isLoser) {
  return el("div", { class: "team-score" + (isLoser ? " is-loser" : "") }, String(value ?? "–"));
}

function resultStamp(winner, picked) {
  if (!picked) return el("div", { class: "stamp is-none", title: "Kein Tipp abgegeben", "aria-label": "Kein Tipp abgegeben" }, "–");
  if (!winner || winner === "draw") return el("div", { class: "stamp is-none", title: "Unentschieden – keine Punkte" }, "0");
  if (picked === winner) return el("div", { class: "stamp is-ok", title: "Richtig getippt", "aria-label": "Richtig getippt, 1 Punkt" }, "+1");
  return el("div", { class: "stamp is-bad", title: "Falsch getippt", "aria-label": "Falsch getippt, 0 Punkte" }, "0");
}

function formDots(seasonGames, teamName) {
  if (!seasonGames) return null;
  const letters = teamForm(seasonGames, teamName, 5);
  if (!letters.length) return null;
  const label = `Form der letzten Spiele (älteste zuerst): ${letters.map((l) => (l === "S" ? "Sieg" : "Niederlage")).join(", ")}`;
  return el("span", { class: "form-dots", title: label, "aria-label": label },
    letters.map((l) => el("i", { class: l === "S" ? "w" : "" })));
}

/** Zeile einer Rangliste (Spieltag, Bonusrunde, Gesamtwertung). */
export function rankRow({ rank, name, points, you, winner }) {
  return el("div", { class: "rank-row" + (you ? " is-you" : "") }, [
    el("div", { class: "rank-num" }, String(rank)),
    el("div", { class: "rank-name" }, [
      el("span", { class: "rank-name-text" }, name),
      you ? el("span", { class: "you-tag" }, "Du") : null,
      winner ? el("span", { class: "winner-mark", title: "Spieltagssieg" }, icon("trophy", 16, 2.2)) : null
    ]),
    el("div", { class: "rank-pts" }, String(points))
  ]);
}

/** Aufklappbare Ergebnis-Eingabe für Admins: { toggle, form } für renderGameRow(). */
export function renderResultEditor(game, onSaved) {
  const finished = game.status === "finished";
  const form = el("div", { class: "result-form", hidden: true });
  const homeInput = el("input", { type: "number", min: "0", inputmode: "numeric", value: game.homeScore ?? "", "aria-label": `Punkte ${game.homeTeamName}` });
  const awayInput = el("input", { type: "number", min: "0", inputmode: "numeric", value: game.awayScore ?? "", "aria-label": `Punkte ${game.awayTeamName}` });

  const saveBtn = el("button", { type: "button", class: "btn btn-primary btn-sm" }, "Speichern");
  saveBtn.addEventListener("click", async () => {
    if (homeInput.value === "" || awayInput.value === "") { toast("Bitte beide Ergebnisse eingeben.", "error"); return; }
    saveBtn.disabled = true;
    await setGameResult(game.id, homeInput.value, awayInput.value);
    toast("Ergebnis gespeichert", "success");
    onSaved();
  });

  const clearBtn = finished ? el("button", { type: "button", class: "btn btn-secondary btn-sm" }, "Zurücksetzen") : null;
  clearBtn?.addEventListener("click", async () => {
    clearBtn.disabled = true;
    await clearGameResult(game.id);
    toast("Ergebnis zurückgesetzt", "success");
    onSaved();
  });

  form.append(
    el("div", { class: "score-inputs" }, [
      teamTag(game.homeTeamName), homeInput,
      el("span", { class: "score-sep" }, ":"),
      awayInput, teamTag(game.awayTeamName)
    ]),
    el("div", { class: "btn-row" }, [saveBtn, clearBtn])
  );

  const toggle = el("button", {
    type: "button", class: "admin-link", "aria-expanded": "false",
    "aria-label": `${finished ? "Ergebnis ändern" : "Ergebnis eintragen"}: ${game.homeTeamName} – ${game.awayTeamName}`
  }, finished ? "Ändern" : "Ergebnis");
  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
    toggle.setAttribute("aria-expanded", String(!form.hidden));
    if (!form.hidden) homeInput.focus();
  });

  return { toggle, form };
}

/**
 * Eine Bonusfrage mit Antwort-Pillen.
 * onSave(selectedArray) wird beim Speichern aufgerufen.
 */
export function renderBonusQuestion(question, myAnswer, onSave, locked, index = 0) {
  const isMulti = question.type === "multi";
  const pickCount = question.pickCount || 1;
  let selected = new Set(myAnswer?.selected || []);
  const correctSet = new Set(question.resolved ? (question.correctOptions || []) : []);
  const inputType = isMulti ? "checkbox" : "radio";

  const optionList = el("div", { class: "option-list", role: isMulti ? "group" : "radiogroup", "aria-label": question.text });
  const counter = el("span", { class: "pill" });
  const saveBtn = el("button", { type: "button", class: "btn btn-ink", disabled: locked }, "Tipp speichern");

  function refresh() {
    optionList.innerHTML = "";
    question.options.forEach((opt, i) => {
      const isSelected = selected.has(opt);
      const isCorrect = question.resolved && correctSet.has(opt);
      const isWrong = question.resolved && isSelected && !isCorrect;
      const classes = ["option"];
      if (isSelected) classes.push("is-picked");
      if (isCorrect) classes.push("is-correct");
      if (isWrong) classes.push("is-wrong");
      if (locked) classes.push("is-disabled");
      const inputId = `q_${question.id}_${i}`;
      const input = el("input", {
        type: inputType, id: inputId, name: `q_${question.id}`,
        checked: isSelected, disabled: locked
      });
      input.addEventListener("change", (e) => {
        if (isMulti) {
          if (e.target.checked) {
            if (selected.size >= pickCount) {
              e.target.checked = false;
              toast(`Du kannst genau ${pickCount} auswählen.`, "error");
              return;
            }
            selected.add(opt);
          } else {
            selected.delete(opt);
          }
        } else {
          selected = new Set([opt]);
        }
        refresh();
        optionList.querySelector(`#${CSS.escape(inputId)}`)?.focus();
      });
      optionList.appendChild(el("label", { class: classes.join(" "), for: inputId }, [
        input,
        el("span", { class: "option-text" }, opt),
        el("span", { class: "check" }, icon(isWrong ? "x" : "check", 15, 3))
      ]));
    });
    counter.textContent = isMulti ? `${selected.size}/${pickCount} gewählt` : "";
    counter.hidden = !isMulti;
  }
  refresh();

  saveBtn.addEventListener("click", async () => {
    if (isMulti && selected.size !== pickCount) {
      toast(`Bitte genau ${pickCount} auswählen.`, "error");
      return;
    }
    if (!isMulti && selected.size !== 1) {
      toast("Bitte eine Antwort auswählen.", "error");
      return;
    }
    saveBtn.disabled = true;
    try {
      await onSave(Array.from(selected));
    } finally {
      saveBtn.disabled = false;
    }
  });

  const status = question.resolved
    ? el("span", { class: "pill pill-ink" }, "Ausgewertet")
    : myAnswer?.selected?.length
      ? el("span", { class: "pill pill-ok" }, [icon("check", 12, 3), "Beantwortet"])
      : el("span", { class: "pill pill-mg" }, "Offen");

  const points = question.pointsPerCorrect || 1;
  return el("div", { class: "question" }, [
    el("div", { class: "question-meta" }, [
      el("span", { class: "question-kicker" }, `Frage ${index + 1} · ${points} ${points === 1 ? "Punkt" : "Punkte"}${isMulti ? " je Treffer" : ""}`),
      status
    ]),
    el("h3", { class: "question-text" }, question.text),
    isMulti ? el("div", { class: "question-hint" }, [el("span", {}, `Wähle genau ${pickCount} aus.`), counter]) : null,
    optionList,
    !locked ? el("div", { class: "btn-row" }, [saveBtn]) : null
  ]);
}
