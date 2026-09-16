import {
  auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail
} from "./firebase.js";
import { ensureUserDoc } from "./data.js";
import { el, toast } from "./util.js";
import { setTheme, poster, posterBar, brand, posterTitle, posterSub, sheet } from "./ui.js";

export function renderAuthView(container) {
  setTheme("magenta");
  let mode = "login";

  const errorBox = el("div", { class: "field-error", role: "alert", hidden: true });

  const nameInput = el("input", { type: "text", id: "authName", placeholder: "z. B. Martin", autocomplete: "nickname" });
  const nameField = el("div", { class: "field", hidden: true }, [
    el("label", { for: "authName" }, "Name (für die Rangliste)"),
    nameInput
  ]);

  const emailInput = el("input", { type: "email", id: "authEmail", placeholder: "du@example.com", autocomplete: "email", required: true });
  const pwInput = el("input", { type: "password", id: "authPw", placeholder: "Mindestens 6 Zeichen", autocomplete: "current-password", required: true });

  const submitBtn = el("button", { type: "submit", class: "btn btn-primary btn-block" }, "Anmelden");
  const resetLink = el("button", { type: "button", class: "btn-ghost" }, "Passwort vergessen?");

  const form = el("form", {
    class: "auth-form",
    onsubmit: async (e) => {
      e.preventDefault();
      errorBox.hidden = true;
      const email = emailInput.value.trim();
      const password = pwInput.value;
      submitBtn.disabled = true;
      try {
        if (mode === "login") {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          const name = nameInput.value.trim() || email.split("@")[0];
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName: name });
          await ensureUserDoc(cred.user.uid, name, email);
        }
      } catch (err) {
        errorBox.textContent = translateAuthError(err);
        errorBox.hidden = false;
      } finally {
        submitBtn.disabled = false;
      }
    }
  }, [
    nameField,
    el("div", { class: "field" }, [el("label", { for: "authEmail" }, "E-Mail"), emailInput]),
    el("div", { class: "field" }, [el("label", { for: "authPw" }, "Passwort"), pwInput]),
    errorBox,
    submitBtn,
    resetLink
  ]);

  resetLink.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) { toast("Bitte zuerst deine E-Mail eingeben.", "error"); emailInput.focus(); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      toast("E-Mail zum Zurücksetzen verschickt", "success");
    } catch (err) {
      toast(translateAuthError(err), "error");
    }
  });

  const tabLogin = el("button", { type: "button", class: "is-active", "aria-pressed": "true" }, "Anmelden");
  const tabRegister = el("button", { type: "button", "aria-pressed": "false" }, "Registrieren");

  function setMode(next) {
    mode = next;
    tabLogin.classList.toggle("is-active", mode === "login");
    tabRegister.classList.toggle("is-active", mode === "register");
    tabLogin.setAttribute("aria-pressed", String(mode === "login"));
    tabRegister.setAttribute("aria-pressed", String(mode === "register"));
    nameField.hidden = mode !== "register";
    submitBtn.textContent = mode === "login" ? "Anmelden" : "Konto erstellen";
    pwInput.autocomplete = mode === "login" ? "current-password" : "new-password";
    resetLink.hidden = mode !== "login";
    errorBox.hidden = true;
  }
  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  container.append(
    poster([
      posterBar(brand()),
      posterTitle([["Tippen."], ["Fiebern.", "ink"], ["Gewinnen."]], "is-medium"),
      posterSub("Die BBL-Tipprunde unter Freunden. Melde dich an, um mitzutippen.")
    ]),
    sheet([
      el("div", { class: "auth-wrap" }, [
        el("div", { class: "segmented" }, [tabLogin, tabRegister]),
        form
      ])
    ])
  );
}

function translateAuthError(err) {
  const code = err?.code || "";
  const map = {
    "auth/invalid-email": "Ungültige E-Mail-Adresse.",
    "auth/user-not-found": "Kein Konto mit dieser E-Mail gefunden.",
    "auth/wrong-password": "Falsches Passwort.",
    "auth/invalid-credential": "E-Mail oder Passwort ist falsch.",
    "auth/email-already-in-use": "Diese E-Mail wird bereits verwendet.",
    "auth/weak-password": "Das Passwort muss mindestens 6 Zeichen haben.",
    "auth/too-many-requests": "Zu viele Versuche. Bitte kurz warten."
  };
  return map[code] || "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
}
