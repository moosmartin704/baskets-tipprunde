import { state } from "../state.js";
import {
  listSeasons, createSeason, setActiveSeason, renameSeason,
  listTeams, addTeam, updateTeam, deleteTeam, copyTeamsFromSeason,
  listMatchdays, createMatchday, updateMatchday, deleteMatchday,
  listGamesForMatchday, createGame, updateGame, deleteGame, bulkImportSchedule,
  listBonusRounds, createBonusRound, updateBonusRound, deleteBonusRound,
  listBonusQuestions, createBonusQuestion, updateBonusQuestion, deleteBonusQuestion,
  listPendingChanges, applyPendingChange, dismissPendingChange, listGamesForSeason,
  getAppConfig, updateAppConfig,
  listBonnExtraGames, createBonnExtraGame, updateBonnExtraGame, deleteBonnExtraGame,
  setBonnExtraGameResult, clearBonnExtraGameResult,
  tsToDate
} from "../data.js";
import { el, toast, fmtDateInputValue, suggestTeamCode } from "../util.js";
import {
  setTheme, poster, posterBar, backLink, spacer, posterTitle, posterSub, sheet, loadingView,
  refreshTeamCodes, effectiveTeamCode, updatePendingDot
} from "../ui.js";

let adminSeasonId = null;
let activeTab = "season";

export async function renderAdmin(container) {
  setTheme("ink");
  container.appendChild(loadingView("Lade Verwaltung …"));
  const seasons = await listSeasons();
  if (!adminSeasonId || !seasons.find((s) => s.id === adminSeasonId)) {
    adminSeasonId = state.activeSeason?.id || seasons[0]?.id || null;
  }

  const pendingCount = adminSeasonId ? (await listPendingChanges(adminSeasonId)).length : 0;
  if (adminSeasonId && adminSeasonId === state.activeSeason?.id) updatePendingDot(pendingCount);

  const editedSeason = seasons.find((s) => s.id === adminSeasonId);
  container.innerHTML = "";
  container.appendChild(poster([
    posterBar(backLink("#/profile", "Profil"), spacer(), el("span", { class: "chip chip-mg" }, "Admin")),
    posterTitle([["Verwal-"], ["tung", "mg"]], "is-medium"),
    posterSub(editedSeason ? `Bearbeitet: Saison ${editedSeason.name}` : "Noch keine Saison angelegt")
  ]));

  const tabBar = el("div", { class: "tabs is-scroll", role: "tablist" }, [
    tabBtn("season", "Saison"),
    tabBtn("teams", "Teams"),
    tabBtn("matchdays", "Spieltage"),
    tabBtn("bonus", "Bonusfragen"),
    tabBtn("bonn", "Bonn"),
    tabBtn("changes", pendingCount ? `Änderungen (${pendingCount})` : "Änderungen")
  ]);
  const body = el("div", { class: "admin-body" });
  container.appendChild(sheet([tabBar, body]));

  if (activeTab !== "season") {
    const season = seasons.find((s) => s.id === adminSeasonId);
    body.appendChild(el("div", { class: "card" }, [
      el("label", { for: "adminSeasonSelect" }, "Bearbeitete Saison"),
      seasonSelect(seasons, season)
    ]));
    if (!season) {
      body.appendChild(el("div", { class: "empty-state card" }, "Bitte zuerst eine Saison anlegen."));
      return;
    }
  }

  if (activeTab === "season") await renderSeasonTab(body, seasons);
  else if (activeTab === "teams") await renderTeamsTab(body, seasons);
  else if (activeTab === "matchdays") await renderMatchdaysTab(body);
  else if (activeTab === "bonus") await renderBonusTab(body);
  else if (activeTab === "bonn") await renderBonnAdminTab(body);
  else if (activeTab === "changes") await renderChangesTab(body);

  function tabBtn(id, label) {
    return el("button", {
      type: "button",
      role: "tab",
      "aria-selected": String(activeTab === id),
      class: "tab" + (activeTab === id ? " is-active" : ""),
      onclick: () => { activeTab = id; rerender(); }
    }, label);
  }

  function seasonSelect(seasons, current) {
    const sel = el("select", {
      id: "adminSeasonSelect",
      onchange: (e) => { adminSeasonId = e.target.value; rerender(); }
    }, seasons.map((s) => el("option", { value: s.id, selected: s.id === current?.id }, s.name)));
    return sel;
  }

  function rerender() {
    container.innerHTML = "";
    renderAdmin(container);
  }
}

/* ---------------------------- Saison-Tab ---------------------------- */

async function renderSeasonTab(body, seasons) {
  body.appendChild(await renderReminderSettingsCard());

  const nameInput = el("input", { type: "text", placeholder: "z.B. 2026/2027" });
  const copySelect = el("select", {}, [
    el("option", { value: "" }, "Keine Teams übernehmen"),
    ...seasons.map((s) => el("option", { value: s.id }, `Teams aus „${s.name}“ übernehmen`))
  ]);
  const createBtn = el("button", { class: "btn btn-primary" }, "Saison anlegen");
  createBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!name) { toast("Bitte einen Namen eingeben.", "error"); return; }
    const id = await createSeason(name);
    if (copySelect.value) await copyTeamsFromSeason(copySelect.value, id);
    toast("Saison angelegt", "success");
    adminSeasonId = id;
    activeTab = "teams";
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderAdmin(root);
  });

  body.appendChild(el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Neue Saison anlegen"),
    el("p", { class: "hint" }, "Damit passt du die Tipprunde jedes Jahr an die neue Saison an, ohne die alten Daten zu verlieren."),
    el("label", {}, "Saisonname"),
    nameInput,
    el("label", {}, "Teams übernehmen (optional)"),
    copySelect,
    createBtn
  ]));

  const listCard = el("div", { class: "card" }, [el("h2", { class: "mt-0" }, "Alle Saisons")]);
  if (!seasons.length) {
    listCard.appendChild(el("div", { class: "empty-state" }, "Noch keine Saison angelegt."));
  }
  for (const s of seasons) {
    const nameEdit = el("input", { type: "text", value: s.name, style: "max-width:180px" });
    nameEdit.addEventListener("change", async () => {
      await renameSeason(s.id, nameEdit.value.trim());
      toast("Gespeichert", "success");
    });
    listCard.appendChild(el("div", { class: "list-row" }, [
      nameEdit,
      el("div", { class: "inline-actions" }, [
        s.isActive ? el("span", { class: "badge-active" }, "Aktiv") : el("button", {
          class: "btn btn-secondary btn-sm",
          onclick: async () => { await setActiveSeason(s.id); toast("Aktive Saison gesetzt", "success"); location.hash.includes("admin") && renderAdminRefresh(); }
        }, "Aktivieren")
      ])
    ]));
  }
  body.appendChild(listCard);

  function renderAdminRefresh() {
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderAdmin(root);
  }
}

async function renderReminderSettingsCard() {
  const config = await getAppConfig();
  const hoursInput = el("input", { type: "number", min: "1", max: "72", value: String(config.reminderHoursBefore ?? 12) });
  const saveBtn = el("button", { class: "btn btn-primary btn-sm" }, "Speichern");
  saveBtn.addEventListener("click", async () => {
    const hours = Number(hoursInput.value) || 12;
    await updateAppConfig({ reminderHoursBefore: hours });
    toast("Gespeichert", "success");
  });

  return el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Erinnerungen"),
    el("p", { class: "hint" }, "Wie viele Stunden vor Spielbeginn (bzw. vor Ablauf einer Bonusfrage) sollen Nutzer:innen mit noch offenen Tipps per Push benachrichtigt werden?"),
    el("div", { style: "display:flex;gap:8px;align-items:center;max-width:220px" }, [
      hoursInput, el("span", { class: "hint" }, "Std. vorher"), saveBtn
    ])
  ]);
}

/* ---------------------------- Teams-Tab ---------------------------- */

async function renderTeamsTab(body, seasons) {
  const teams = await listTeams(adminSeasonId);

  const nameInput = el("input", { type: "text", placeholder: "Teamname, z.B. FC Bayern München Basketball" });
  const shortInput = el("input", { type: "text", placeholder: "Kürzel (optional), z.B. FCB", maxlength: "5" });
  nameInput.addEventListener("input", () => {
    shortInput.placeholder = nameInput.value.trim()
      ? `Kürzel, Vorschlag: ${suggestTeamCode(nameInput.value)}`
      : "Kürzel (optional), z.B. FCB";
  });
  const addBtn = el("button", { class: "btn btn-primary" }, "Team hinzufügen");
  addBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!name) return;
    await addTeam(adminSeasonId, name, shortInput.value.trim().toUpperCase());
    await refreshTeamCodes(state.activeSeason?.id);
    toast("Team hinzugefügt", "success");
    refresh();
  });

  body.appendChild(el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Team hinzufügen"),
    el("div", { class: "grid-2" }, [nameInput, shortInput]),
    addBtn
  ]));

  const listCard = el("div", { class: "card" }, [el("h2", { class: "mt-0" }, `Teams (${teams.length})`)]);
  if (!teams.length) listCard.appendChild(el("div", { class: "empty-state" }, "Noch keine Teams für diese Saison."));
  if (teams.length) {
    listCard.appendChild(el("p", { class: "hint" }, "Das Kürzel steht in den Tipp-Kreisen. Ändern und Eingabe verlassen – es wird sofort gespeichert."));
  }
  for (const t of teams) {
    const codeInput = el("input", {
      type: "text", class: "code-input", maxlength: "5", value: effectiveTeamCode(t),
      "aria-label": `Kürzel für ${t.name}`
    });
    codeInput.addEventListener("change", async () => {
      const code = codeInput.value.trim().toUpperCase();
      if (!code) { codeInput.value = effectiveTeamCode(t); return; }
      codeInput.value = code;
      await updateTeam(t.id, { shortName: code, shortNameCustom: true });
      t.shortName = code;
      t.shortNameCustom = true;
      await refreshTeamCodes(state.activeSeason?.id);
      toast(`Kürzel für ${t.name} gespeichert`, "success");
    });
    listCard.appendChild(el("div", { class: "list-row" }, [
      el("span", { class: "list-row-main" }, t.name),
      el("div", { class: "inline-actions" }, [
        codeInput,
        el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
          if (!confirm(`Team „${t.name}“ löschen?`)) return;
          await deleteTeam(t.id);
          await refreshTeamCodes(state.activeSeason?.id);
          toast("Team gelöscht", "success");
          refresh();
        } }, "Löschen")
      ])
    ]));
  }
  body.appendChild(listCard);

  function refresh() {
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderAdmin(root);
  }
}

/* -------------------------- Spieltage-Tab -------------------------- */

async function renderMatchdaysTab(body) {
  const matchdays = await listMatchdays(adminSeasonId);
  const teams = await listTeams(adminSeasonId);

  const labelInput = el("input", { type: "text", placeholder: "z.B. 5. Spieltag oder Viertelfinale Spiel 1" });
  const typeSelect = el("select", {}, [
    el("option", { value: "regular" }, "Hauptrunde"),
    el("option", { value: "playoff" }, "Playoff")
  ]);
  const orderInput = el("input", { type: "number", placeholder: "Reihenfolge (z.B. 5)" });
  const addBtn = el("button", { class: "btn btn-primary" }, "Spieltag anlegen");
  addBtn.addEventListener("click", async () => {
    const label = labelInput.value.trim();
    if (!label) return;
    await createMatchday(adminSeasonId, {
      label, type: typeSelect.value, order: Number(orderInput.value) || matchdays.length + 1
    });
    toast("Spieltag angelegt", "success");
    refresh();
  });

  body.appendChild(el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Spieltag anlegen"),
    el("label", {}, "Bezeichnung"),
    labelInput,
    el("div", { class: "grid-2" }, [
      el("div", {}, [el("label", {}, "Typ"), typeSelect]),
      el("div", {}, [el("label", {}, "Reihenfolge"), orderInput])
    ]),
    addBtn
  ]));

  body.appendChild(renderBulkImportCard(refresh));

  if (!teams.length) {
    body.appendChild(el("div", { class: "card empty-state" }, "Lege zuerst Teams im Tab „Teams“ an, um Spiele anlegen zu können."));
  }

  for (const md of matchdays) {
    body.appendChild(await renderMatchdayAdminCard(md, teams, refresh));
  }

  function refresh() {
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderAdmin(root);
  }
}

function renderBulkImportCard(onChange) {
  const textarea = el("textarea", {
    rows: "6",
    placeholder: "1;18.09.2026;20:00;ALBA BERLIN;NINERS Chemnitz\n1;19.09.2026;18:30;ROSTOCK SEAWOLVES;Phoenix Hagen\n…"
  });
  const importBtn = el("button", { class: "btn btn-primary" }, "Spielplan importieren");
  const progress = el("p", { class: "hint" }, "");

  importBtn.addEventListener("click", async () => {
    const { rows, errors } = parseScheduleText(textarea.value);
    if (errors.length) {
      toast(`${errors.length} Zeile(n) konnten nicht gelesen werden (siehe Format-Hinweis).`, "error");
      return;
    }
    if (!rows.length) {
      toast("Bitte zuerst Spielplan-Zeilen einfügen.", "error");
      return;
    }
    importBtn.disabled = true;
    progress.textContent = `Importiere 0/${rows.length} Spiele …`;
    try {
      const result = await bulkImportSchedule(adminSeasonId, rows, (done, total) => {
        progress.textContent = `Importiere ${done}/${total} Spiele …`;
      });
      await refreshTeamCodes(state.activeSeason?.id);
      toast(`Import fertig: ${result.games} Spiele, ${result.matchdays} neue Spieltage, ${result.teams} neue Teams`, "success");
      onChange();
    } catch (err) {
      console.error(err);
      toast("Import fehlgeschlagen: " + err.message, "error");
      importBtn.disabled = false;
    }
  });

  return el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Spielplan-Massenimport"),
    el("p", { class: "hint" }, "Ein Spiel pro Zeile, Format: Spieltag;Datum(TT.MM.JJJJ);Uhrzeit(HH:MM);Heimteam;Auswärtsteam — Teams und Spieltage werden automatisch angelegt, falls sie noch nicht existieren."),
    textarea,
    importBtn,
    progress
  ]);
}

function parseScheduleText(text) {
  const rows = [];
  const errors = [];
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  for (const line of lines) {
    const parts = line.split(";").map((p) => p.trim());
    if (parts.length !== 5) { errors.push(line); continue; }
    const [mdStr, datum, zeit, home, away] = parts;
    const md = Number(mdStr);
    const dm = datum.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    const tm = zeit.match(/^(\d{1,2}):(\d{2})$/);
    if (!md || !dm || !tm || !home || !away) { errors.push(line); continue; }
    const kickoff = new Date(Number(dm[3]), Number(dm[2]) - 1, Number(dm[1]), Number(tm[1]), Number(tm[2]));
    rows.push({ matchdayNumber: md, kickoff, homeTeamName: home, awayTeamName: away });
  }
  return { rows, errors };
}

async function renderMatchdayAdminCard(md, teams, onChange) {
  const games = await listGamesForMatchday(md.id);
  const card = el("div", { class: "card" });
  const header = el("div", { class: "card-title-row" }, [
    el("h3", { class: "mt-0" }, [md.label, md.type === "playoff" ? el("span", { class: "pill pill-ink" }, "Playoff") : null]),
    el("div", { class: "inline-actions" }, [
      el("button", { class: "btn btn-secondary btn-sm", onclick: () => toggle() }, "Spiele"),
      el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
        if (!confirm(`Spieltag „${md.label}“ inkl. aller Spiele löschen?`)) return;
        await deleteMatchday(md.id); toast("Spieltag gelöscht", "success"); onChange();
      } }, "Löschen")
    ])
  ]);
  card.appendChild(header);

  const body = el("div", { style: "display:none" });
  card.appendChild(body);

  function toggle() { body.style.display = body.style.display === "none" ? "block" : "none"; }

  if (teams.length >= 2) {
    const homeSel = teamSelect(teams);
    const awaySel = teamSelect(teams);
    const kickoffInput = el("input", { type: "datetime-local", value: fmtDateInputValue(nextDefaultKickoff()) });
    const addGameBtn = el("button", { class: "btn btn-primary btn-sm" }, "Spiel hinzufügen");
    addGameBtn.addEventListener("click", async () => {
      if (homeSel.value === awaySel.value) { toast("Heim- und Auswärtsteam müssen unterschiedlich sein.", "error"); return; }
      await createGame(md.seasonId, md.id, {
        homeTeamName: teams.find((t) => t.id === homeSel.value)?.name,
        awayTeamName: teams.find((t) => t.id === awaySel.value)?.name,
        kickoff: kickoffInput.value
      });
      toast("Spiel hinzugefügt", "success");
      onChange();
    });
    body.appendChild(el("div", { class: "card is-sub" }, [
      el("div", { class: "grid-2" }, [
        el("div", {}, [el("label", {}, "Heimteam"), homeSel]),
        el("div", {}, [el("label", {}, "Auswärtsteam"), awaySel])
      ]),
      el("label", {}, "Anstoß"),
      kickoffInput,
      addGameBtn
    ]));
  }

  if (!games.length) {
    body.appendChild(el("div", { class: "empty-state" }, "Noch keine Spiele."));
  }
  for (const g of games) {
    body.appendChild(renderGameAdminRow(g, onChange));
  }

  return card;
}

function renderGameAdminRow(g, onChange) {
  const row = el("div", { class: "list-row" }, [
    el("div", {}, [
      el("div", {}, `${g.homeTeamName} – ${g.awayTeamName}`),
      el("div", { class: "hint" }, `${tsToDate(g.kickoff).toLocaleString("de-DE")}${g.status === "finished" ? ` · ${g.homeScore}:${g.awayScore}` : ""}`)
    ]),
    el("div", { class: "inline-actions" }, [
      el("button", { class: "btn btn-secondary btn-sm", onclick: () => toggleEdit() }, "Anstoß ändern"),
      el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
        if (!confirm("Dieses Spiel löschen?")) return;
        await deleteGame(g.id); toast("Spiel gelöscht", "success"); onChange();
      } }, "Löschen")
    ])
  ]);

  const editForm = el("div", { style: "display:none;width:100%;padding:8px 0" });
  const kickoffInput = el("input", { type: "datetime-local", value: fmtDateInputValue(tsToDate(g.kickoff)) });
  const saveBtn = el("button", { class: "btn btn-primary btn-sm" }, "Speichern");
  saveBtn.addEventListener("click", async () => {
    await updateGame(g.id, { kickoff: kickoffInput.value });
    toast("Anstoß aktualisiert", "success");
    onChange();
  });
  editForm.appendChild(el("div", { style: "display:flex;gap:8px;align-items:center" }, [kickoffInput, saveBtn]));

  function toggleEdit() { editForm.style.display = editForm.style.display === "none" ? "block" : "none"; }

  return el("div", {}, [row, editForm]);
}

function teamSelect(teams) {
  return el("select", {}, teams.map((t) => el("option", { value: t.id }, t.name)));
}

function nextDefaultKickoff() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(20, 30, 0, 0);
  return d;
}

/* --------------------------- Bonusfragen-Tab --------------------------- */

async function renderBonusTab(body) {
  const rounds = await listBonusRounds(adminSeasonId);

  const labelInput = el("input", { type: "text", placeholder: "z.B. Saisonprognose" });
  const deadlineInput = el("input", { type: "datetime-local" });
  const orderInput = el("input", { type: "number", placeholder: "Reihenfolge" });
  const addBtn = el("button", { class: "btn btn-primary" }, "Bonusrunde anlegen");
  addBtn.addEventListener("click", async () => {
    const label = labelInput.value.trim();
    if (!label) return;
    await createBonusRound(adminSeasonId, {
      label, deadline: deadlineInput.value || null, order: Number(orderInput.value) || rounds.length + 1
    });
    toast("Bonusrunde angelegt", "success");
    refresh();
  });

  body.appendChild(el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Bonusrunde anlegen"),
    el("p", { class: "hint" }, "Eine Bonusrunde funktioniert wie ein zusätzlicher Spieltag mit eigenen Fragen statt Spielen."),
    el("label", {}, "Bezeichnung"),
    labelInput,
    el("div", { class: "grid-2" }, [
      el("div", {}, [el("label", {}, "Abgabefrist (optional)"), deadlineInput]),
      el("div", {}, [el("label", {}, "Reihenfolge"), orderInput])
    ]),
    addBtn
  ]));

  for (const br of rounds) {
    body.appendChild(await renderBonusRoundAdminCard(br, refresh));
  }

  function refresh() {
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderAdmin(root);
  }
}

async function renderBonusRoundAdminCard(br, onChange) {
  const [questions, teams] = await Promise.all([listBonusQuestions(br.id), listTeams(br.seasonId)]);
  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "card-title-row" }, [
    el("h3", { class: "mt-0" }, br.label),
    el("div", { class: "inline-actions" }, [
      el("button", { class: "btn btn-secondary btn-sm", onclick: () => toggle() }, "Fragen"),
      el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
        if (!confirm(`Bonusrunde „${br.label}“ inkl. aller Fragen löschen?`)) return;
        await deleteBonusRound(br.id); toast("Bonusrunde gelöscht", "success"); onChange();
      } }, "Löschen")
    ])
  ]));

  const body = el("div", { style: "display:none" });
  card.appendChild(body);
  function toggle() { body.style.display = body.style.display === "none" ? "block" : "none"; }

  body.appendChild(renderNewQuestionForm(br, questions.length, onChange, teams));

  if (!questions.length) body.appendChild(el("div", { class: "empty-state" }, "Noch keine Fragen."));
  for (const q of questions) {
    body.appendChild(el("div", { class: "list-row" }, [
      el("div", {}, [
        el("div", {}, q.text),
        el("div", { class: "hint" }, `${q.type === "multi" ? `Mehrfachauswahl (${q.pickCount})` : "Einzelauswahl"} · ${q.pointsPerCorrect} Pkt./richtig · ${q.resolved ? "ausgewertet" : "offen"}${q.autoResolve ? " · wird automatisch geprüft" : ""}`)
      ]),
      el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
        if (!confirm("Diese Frage löschen?")) return;
        await deleteBonusQuestion(q.id); toast("Frage gelöscht", "success"); onChange();
      } }, "Löschen")
    ]));
  }
  return card;
}

function renderNewQuestionForm(br, order, onChange, teams = []) {
  const textInput = el("textarea", { rows: "2", placeholder: "Frage, z.B. „Welche 8 Teams erreichen die Playoffs?“" });
  const typeSelect = el("select", {}, [
    el("option", { value: "single" }, "Einzelauswahl (1 richtige Antwort)"),
    el("option", { value: "multi" }, "Mehrfachauswahl (mehrere richtige Antworten)")
  ]);
  const pickCountInput = el("input", { type: "number", min: "1", value: "1" });
  const pickCountWrap = el("div", { style: "display:none" }, [
    el("label", {}, "Anzahl auszuwählender Antworten"),
    pickCountInput
  ]);
  const pointsInput = el("input", { type: "number", min: "1", value: "1" });
  const optionsArea = el("textarea", { rows: "4", placeholder: "Eine Antwortmöglichkeit pro Zeile" });

  typeSelect.addEventListener("change", () => {
    pickCountWrap.style.display = typeSelect.value === "multi" ? "block" : "none";
  });

  // Wird von den Standardfrage-Vorlagen unten gesetzt und beim Absenden mitgeschickt.
  // Steuert, ob der stündliche BBL-Check (scripts/daily-bbl-check) diese Frage später
  // selbst automatisch auflösen kann - siehe README Abschnitt 7.
  let currentAutoResolve = null;

  function applyTemplate({ text, type, pickCount, points, options, autoResolve, note }) {
    textInput.value = text;
    typeSelect.value = type;
    typeSelect.dispatchEvent(new Event("change"));
    pickCountInput.value = String(pickCount);
    pointsInput.value = String(points);
    optionsArea.value = options.join("\n");
    currentAutoResolve = autoResolve;
    toast(`Vorlage eingefügt${note ? ` (${note})` : ""} – unten prüfen und „Frage hinzufügen“ klicken.`, "success");
  }

  const teamNames = teams.map((t) => t.name);
  let templatesBlock = null;

  if (teamNames.length >= 2) {
    const tplPlayoffBtn = el("button", { type: "button", class: "btn btn-secondary btn-sm" }, "Playoff-Einzug (Plätze 1–6)");
    tplPlayoffBtn.addEventListener("click", () => applyTemplate({
      text: "Welche 6 Mannschaften ziehen direkt in die Playoffs ein?",
      type: "multi", pickCount: 6, points: 1, options: teamNames,
      autoResolve: { kind: "regularSeasonRank", fromRank: 1, toRank: 6 }
    }));

    const tplRelegationBtn = el("button", { type: "button", class: "btn btn-secondary btn-sm" }, "Absteiger (Plätze 17–18)");
    tplRelegationBtn.addEventListener("click", () => applyTemplate({
      text: "Welche Mannschaften steigen ab?",
      type: "multi", pickCount: 2, points: 1, options: teamNames,
      autoResolve: { kind: "regularSeasonRank", fromRank: 17, toRank: 18 }
    }));

    const tplChampionBtn = el("button", { type: "button", class: "btn btn-secondary btn-sm" }, "Meister");
    tplChampionBtn.addEventListener("click", () => applyTemplate({
      text: "Wer wird Meister?",
      type: "single", pickCount: 1, points: 1, options: teamNames,
      autoResolve: null, // Playoffs sind (noch) nicht als Spieltage modelliert -> bleibt manuell über "Auflösen"
      note: "muss nach den Playoffs manuell über \"Auflösen\" ausgewertet werden"
    }));

    const teamRankSelect = el("select", {}, teamNames.map((n) => el("option", { value: n }, n)));
    const tplTeamRankBtn = el("button", { type: "button", class: "btn btn-secondary btn-sm" }, "Tabellenplatz-Frage einfügen");
    tplTeamRankBtn.addEventListener("click", () => {
      const team = teamRankSelect.value;
      applyTemplate({
        text: `Auf welchem Platz beendet ${team} die reguläre Saison?`,
        type: "single", pickCount: 1, points: 1,
        options: Array.from({ length: teamNames.length }, (_, i) => String(i + 1)),
        autoResolve: { kind: "regularSeasonTeamRank", team }
      });
    });

    templatesBlock = el("div", { class: "card is-sub" }, [
      el("h4", { class: "mt-0" }, "Standardfrage einfügen (optional)"),
      el("p", { class: "hint" },
        "Füllt Frage, Antwortmöglichkeiten und Punkte unten aus. Die ersten drei Vorlagen richten " +
        "sich nach der Tabelle der regulären Saison und werden vom stündlichen BBL-Check automatisch " +
        "ausgewertet, sobald alle Hauptrunden-Spiele beendet sind – kein Admin-Klick nötig."
      ),
      el("div", { class: "inline-actions", style: "flex-wrap:wrap" }, [tplPlayoffBtn, tplRelegationBtn, tplChampionBtn]),
      el("div", { style: "display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap" }, [teamRankSelect, tplTeamRankBtn])
    ]);
  }

  const addBtn = el("button", { class: "btn btn-primary btn-sm" }, "Frage hinzufügen");
  addBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    const options = optionsArea.value.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!text || options.length < 2) { toast("Bitte Frage und mindestens 2 Antwortmöglichkeiten angeben.", "error"); return; }
    await createBonusQuestion(br.seasonId, br.id, {
      text, type: typeSelect.value, options,
      pickCount: Number(pickCountInput.value) || 1,
      pointsPerCorrect: Number(pointsInput.value) || 1,
      order,
      autoResolve: currentAutoResolve
    });
    toast("Frage hinzugefügt", "success");
    onChange();
  });

  return el("div", { class: "card is-sub" }, [
    templatesBlock,
    el("label", {}, "Frage"),
    textInput,
    el("div", { class: "grid-2" }, [
      el("div", {}, [el("label", {}, "Typ"), typeSelect]),
      el("div", {}, [el("label", {}, "Punkte pro richtiger Auswahl"), pointsInput])
    ]),
    pickCountWrap,
    el("label", {}, "Antwortmöglichkeiten"),
    optionsArea,
    addBtn
  ]);
}

/* ----------------------- Bonn-Zusatzspiele-Tab ----------------------- */

const COMPETITION_LABELS = { cl: "Champions League", pokal: "Netto BBL Pokal" };

async function renderBonnAdminTab(body) {
  const games = await listBonnExtraGames(adminSeasonId);

  body.appendChild(el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Zusatzspiel der Telekom Baskets Bonn"),
    el("p", { class: "hint" },
      "Champions-League- und Pokal-Spiele gibt es (anders als die BBL-Hauptrunde) nicht automatisch " +
      "– hier von Hand eintragen, sobald ein Termin feststeht. Erscheinen auf der Bonn-Seite, sind " +
      "aber nicht tippbar."
    ),
    renderNewBonnGameForm(refresh)
  ]));

  const listCard = el("div", { class: "card" }, [el("h2", { class: "mt-0" }, `Zusatzspiele (${games.length})`)]);
  if (!games.length) listCard.appendChild(el("div", { class: "empty-state" }, "Noch keine Zusatzspiele eingetragen."));
  for (const g of games) {
    listCard.appendChild(renderBonnGameAdminRow(g, refresh));
  }
  body.appendChild(listCard);

  function refresh() {
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderAdmin(root);
  }
}

function renderNewBonnGameForm(onChange) {
  const competitionSelect = el("select", {}, [
    el("option", { value: "cl" }, "Champions League"),
    el("option", { value: "pokal" }, "Netto BBL Pokal")
  ]);
  const opponentInput = el("input", { type: "text", placeholder: "Gegner, z.B. Hapoel Tel Aviv" });
  const homeSelect = el("select", {}, [
    el("option", { value: "1" }, "Heimspiel (Bonn)"),
    el("option", { value: "0" }, "Auswärtsspiel")
  ]);
  const kickoffInput = el("input", { type: "datetime-local" });
  const noteInput = el("input", { type: "text", placeholder: "z.B. Achtelfinale, Hinspiel (optional)" });

  const addBtn = el("button", { class: "btn btn-primary" }, "Zusatzspiel hinzufügen");
  addBtn.addEventListener("click", async () => {
    const opponent = opponentInput.value.trim();
    if (!opponent || !kickoffInput.value) { toast("Bitte mindestens Gegner und Termin angeben.", "error"); return; }
    await createBonnExtraGame(adminSeasonId, {
      competition: competitionSelect.value,
      opponent,
      isHome: homeSelect.value === "1",
      kickoff: kickoffInput.value,
      note: noteInput.value.trim()
    });
    toast("Zusatzspiel hinzugefügt", "success");
    onChange();
  });

  return el("div", { class: "card is-sub" }, [
    el("div", { class: "grid-2" }, [
      el("div", {}, [el("label", {}, "Wettbewerb"), competitionSelect]),
      el("div", {}, [el("label", {}, "Heim/Auswärts"), homeSelect])
    ]),
    el("label", {}, "Gegner"),
    opponentInput,
    el("label", {}, "Anstoß"),
    kickoffInput,
    el("label", {}, "Notiz (optional)"),
    noteInput,
    addBtn
  ]);
}

function renderBonnGameAdminRow(g, onChange) {
  const finished = g.status === "finished";
  const matchup = g.isHome ? `Bonn – ${g.opponent}` : `${g.opponent} – Bonn`;
  const row = el("div", { class: "list-row" }, [
    el("div", {}, [
      el("div", {}, [
        matchup,
        el("span", { class: "pill pill-ink", style: "margin-left:8px" }, COMPETITION_LABELS[g.competition] || g.competition)
      ]),
      el("div", { class: "hint" },
        `${tsToDate(g.kickoff).toLocaleString("de-DE")}${finished ? ` · ${g.homeScore}:${g.awayScore}` : ""}${g.note ? ` · ${g.note}` : ""}`
      )
    ]),
    el("div", { class: "inline-actions" }, [
      el("button", { class: "btn btn-secondary btn-sm", onclick: () => toggleEdit() }, finished ? "Ergebnis ändern" : "Ergebnis eintragen"),
      el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
        if (!confirm(`Zusatzspiel gegen „${g.opponent}“ löschen?`)) return;
        await deleteBonnExtraGame(g.id); toast("Zusatzspiel gelöscht", "success"); onChange();
      } }, "Löschen")
    ])
  ]);

  const editForm = el("div", { style: "display:none;width:100%;padding:8px 0" });
  const homeInput = el("input", { type: "number", min: "0", inputmode: "numeric", value: g.homeScore ?? "", placeholder: g.isHome ? "Bonn" : g.opponent });
  const awayInput = el("input", { type: "number", min: "0", inputmode: "numeric", value: g.awayScore ?? "", placeholder: g.isHome ? g.opponent : "Bonn" });
  const saveBtn = el("button", { class: "btn btn-primary btn-sm" }, "Speichern");
  saveBtn.addEventListener("click", async () => {
    if (homeInput.value === "" || awayInput.value === "") { toast("Bitte beide Ergebnisse eingeben.", "error"); return; }
    await setBonnExtraGameResult(g.id, homeInput.value, awayInput.value);
    toast("Ergebnis gespeichert", "success");
    onChange();
  });
  const clearBtn = finished ? el("button", { class: "btn btn-secondary btn-sm" }, "Zurücksetzen") : null;
  clearBtn?.addEventListener("click", async () => {
    await clearBonnExtraGameResult(g.id);
    toast("Ergebnis zurückgesetzt", "success");
    onChange();
  });
  editForm.append(el("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, [
    homeInput, el("span", {}, ":"), awayInput, saveBtn, clearBtn
  ]));
  function toggleEdit() { editForm.style.display = editForm.style.display === "none" ? "block" : "none"; }

  return el("div", {}, [row, editForm]);
}

/* --------------------------- Änderungen-Tab --------------------------- */

async function renderChangesTab(body) {
  const [changes, games] = await Promise.all([
    listPendingChanges(adminSeasonId),
    listGamesForSeason(adminSeasonId)
  ]);
  const gameById = Object.fromEntries(games.map((g) => [g.id, g]));

  body.appendChild(el("div", { class: "card" }, [
    el("h2", { class: "mt-0" }, "Automatisch erkannte Änderungen"),
    el("p", { class: "hint" }, "Hier landen Vorschläge eines automatisierten Spielplan-/Ergebnis-Checks (z. B. ein täglich laufender Cloud-Agent). Nichts wird ohne deine Bestätigung übernommen.")
  ]));

  if (!changes.length) {
    body.appendChild(el("div", { class: "card empty-state" }, "Aktuell keine offenen Vorschläge."));
    return;
  }

  const listCard = el("div", { class: "card" });
  for (const change of changes) {
    listCard.appendChild(renderChangeRow(change, gameById[change.gameId], refresh));
  }
  body.appendChild(listCard);

  function refresh() {
    const root = document.getElementById("view");
    root.innerHTML = "";
    renderAdmin(root);
  }
}

function renderChangeRow(change, game, onChange) {
  const matchup = game ? `${game.homeTeamName} – ${game.awayTeamName}` : "Unbekanntes Spiel";
  const fieldLabel = change.type === "kickoff" ? "Anstoß" : change.type === "result" ? "Ergebnis" : change.field || "Wert";
  const oldVal = formatChangeValue(change.type, change.oldValue);
  const newVal = formatChangeValue(change.type, change.newValue);

  return el("div", { class: "list-row" }, [
    el("div", {}, [
      el("div", {}, `${matchup} — ${fieldLabel}`),
      el("div", { class: "hint" }, `${oldVal || "(leer)"} → ${newVal}${change.note ? ` · ${change.note}` : ""} · Quelle: ${change.source}`)
    ]),
    el("div", { class: "inline-actions" }, [
      el("button", {
        class: "btn btn-primary btn-sm",
        onclick: async () => { await applyPendingChange(change); toast("Änderung übernommen", "success"); onChange(); }
      }, "Übernehmen"),
      el("button", {
        class: "btn btn-secondary btn-sm",
        onclick: async () => { await dismissPendingChange(change.id); toast("Vorschlag verworfen", "success"); onChange(); }
      }, "Verwerfen")
    ])
  ]);
}

function formatChangeValue(type, value) {
  if (value == null) return "";
  if (type === "kickoff") return new Date(value).toLocaleString("de-DE");
  return String(value);
}
