import { state } from "../state.js";
import { auth, updateProfile, signOut, sendPasswordResetEmail, getMessagingSafe, getFcmToken } from "../firebase.js";
import { vapidKey } from "../firebase-config.js";
import { ensureUserDoc, saveFcmToken } from "../data.js";
import { el, toast } from "../util.js";
import {
  setTheme, poster, posterBar, brand, spacer, seasonChip, sheet, sectionHead, icon, initial
} from "../ui.js";

export async function renderProfile(container) {
  setTheme("ink");
  container.innerHTML = "";

  const name = state.user.displayName || state.user.email;
  const avatar = el("div", { class: "profile-avatar", "aria-hidden": "true" }, initial(name));
  const nameHeading = el("h1", { class: "profile-name" }, name);

  container.appendChild(poster([
    posterBar(brand(), spacer(), seasonChip("chip-mg")),
    el("div", { class: "profile-hero" }, [
      avatar,
      el("div", { class: "profile-id" }, [
        nameHeading,
        el("div", { class: "profile-mail" }, state.user.email)
      ])
    ])
  ]));

  const items = [];

  if (state.isAdmin) {
    items.push(el("a", { class: "list-link is-feature", href: "#/admin" }, [
      el("div", { class: "icon-badge" }, icon("settings", 22)),
      el("div", { class: "list-body" }, [
        el("div", { class: "list-title" }, "Verwaltung"),
        el("div", { class: "list-sub" }, "Saison, Teams, Spieltage, Ergebnisse, Bonusfragen")
      ]),
      el("div", { class: "list-end" }, [
        state.pendingCount ? el("span", { class: "pill pill-mg" }, `${state.pendingCount} neu`) : null,
        icon("chevR", 20, 2)
      ])
    ]));
  }

  // Anzeigename
  const nameInput = el("input", { type: "text", id: "profileName", value: state.user.displayName || "", autocomplete: "nickname" });
  const saveBtn = el("button", { type: "button", class: "btn btn-primary" }, "Speichern");
  saveBtn.addEventListener("click", async () => {
    const newName = nameInput.value.trim();
    if (!newName) { toast("Bitte einen Namen eingeben.", "error"); return; }
    saveBtn.disabled = true;
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      await ensureUserDoc(state.user.uid, newName, state.user.email);
      state.user.displayName = newName;
      nameHeading.textContent = newName;
      avatar.textContent = initial(newName);
      toast("Name gespeichert", "success");
    } finally {
      saveBtn.disabled = false;
    }
  });
  items.push(
    sectionHead("Anzeigename"),
    el("div", { class: "panel" }, [
      el("p", { class: "hint" }, "So erscheinst du in den Ranglisten."),
      el("label", { for: "profileName" }, "Name"),
      nameInput,
      el("div", { class: "btn-row" }, [saveBtn])
    ])
  );

  // Erinnerungen
  const notifyBtn = el("button", { type: "button", class: "btn btn-ink" }, [icon("bell", 18, 2), "Benachrichtigungen aktivieren"]);
  notifyBtn.addEventListener("click", () => enableNotifications(notifyBtn));
  items.push(
    sectionHead("Erinnerungen"),
    el("div", { class: "panel" }, [
      el("p", { class: "hint" }, "Erinnert dich, wenn du kurz vor Anpfiff noch nicht getippt hast. Auf dem iPhone klappt das nur, wenn du die App über „Zum Home-Bildschirm“ installiert hast und von dort öffnest."),
      el("div", { class: "btn-row" }, [notifyBtn])
    ])
  );

  // Konto
  const resetBtn = el("button", { type: "button", class: "btn btn-secondary" }, [icon("mail", 18, 2), "Passwort per E-Mail zurücksetzen"]);
  resetBtn.addEventListener("click", async () => {
    resetBtn.disabled = true;
    try {
      await sendPasswordResetEmail(auth, state.user.email);
      toast("E-Mail zum Zurücksetzen verschickt", "success");
    } finally {
      resetBtn.disabled = false;
    }
  });
  const logoutBtn = el("button", { type: "button", class: "btn btn-danger" }, [icon("logout", 18, 2), "Abmelden"]);
  logoutBtn.addEventListener("click", () => signOut(auth));
  items.push(
    sectionHead("Konto"),
    el("div", { class: "panel" }, [
      el("div", { class: "kv" }, [el("span", { class: "kv-label" }, "E-Mail"), el("span", { class: "kv-value" }, state.user.email)]),
      el("div", { class: "btn-row" }, [resetBtn, logoutBtn])
    ])
  );

  container.appendChild(sheet(items));
}

async function enableNotifications(btn) {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    toast("Dein Browser unterstützt leider keine Push-Benachrichtigungen.", "error");
    return;
  }
  if (!vapidKey || vapidKey.startsWith("DEIN_")) {
    toast("Push ist noch nicht eingerichtet (VAPID-Key fehlt in firebase-config.js).", "error");
    return;
  }

  btn.disabled = true;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast("Berechtigung wurde nicht erteilt.", "error");
      return;
    }
    const messaging = getMessagingSafe();
    if (!messaging) {
      toast("Push-Benachrichtigungen werden auf diesem Gerät nicht unterstützt.", "error");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const token = await getFcmToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) throw new Error("Kein Gerätetoken erhalten");
    await saveFcmToken(state.user.uid, token);
    toast("Benachrichtigungen aktiviert", "success");
  } catch (err) {
    console.error(err);
    toast("Aktivierung fehlgeschlagen: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}
