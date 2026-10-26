"use strict";

const config = window.PIXEL_CAT_CONFIG || {};
const message = document.getElementById("auth-message");
const params = new URLSearchParams(location.search);

function showMessage(text) { message.textContent = text; }
function isConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_PROJECT_REF") &&
    !config.supabaseAnonKey.includes("YOUR_SUPABASE_"));
}

if (!isConfigured() || !window.supabase) {
  showMessage("Для входа нужно подключить Supabase. Пока можно открыть демо-игру.");
} else {
  initAuthPage();
}

async function initAuthPage() {
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const authForm = document.getElementById("auth-form");
  const resetForm = document.getElementById("reset-form");
  const submitButton = document.getElementById("email-submit");
  const password = document.getElementById("password");
  const confirmWrap = document.getElementById("confirm-wrap");
  const forgot = document.getElementById("forgot-password");
  let mode = "login";

  const redirectToGame = () => location.replace(new URL("index.html", location.href).href);
  const { data: sessionData } = await client.auth.getSession();

  if (params.get("recover") === "1") {
    authForm.hidden = true;
    forgot.hidden = true;
    document.querySelector(".auth-tabs").hidden = true;
    resetForm.hidden = false;
    document.getElementById("auth-title").textContent = "Новый пароль";
    document.getElementById("auth-intro").textContent = "Придумай новый пароль для своего аккаунта.";
  } else if (sessionData.session) {
    redirectToGame();
    return;
  }

  if (params.get("setup") === "1") {
    showMessage("Настрой Supabase в supabase-config.js, чтобы включить регистрацию и облачные сохранения.");
  }

  function setMode(nextMode) {
    mode = nextMode;
    const signup = mode === "signup";
    document.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.classList.toggle("active", button.dataset.authMode === mode);
    });
    confirmWrap.hidden = !signup;
    document.getElementById("password-confirm").required = signup;
    password.autocomplete = signup ? "new-password" : "current-password";
    submitButton.textContent = signup ? "СОЗДАТЬ АККАУНТ ♥" : "ВОЙТИ ♥";
    document.getElementById("auth-title").textContent = signup ? "Новый котодруг!" : "С возвращением!";
    document.getElementById("auth-intro").textContent = signup
      ? "Создай аккаунт, чтобы сохранять свои приключения."
      : "Войди в аккаунт и продолжи своё приключение.";
    showMessage("");
  }
  document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.authMode)));

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");
    submitButton.disabled = true;
    const email = document.getElementById("email").value.trim();
    const pass = password.value;
    try {
      if (mode === "signup") {
        const confirmPass = document.getElementById("password-confirm").value;
        if (pass.length < 8) { showMessage("Пароль должен содержать минимум 8 символов."); return; }
        if (pass !== confirmPass) { showMessage("Пароли не совпадают."); return; }
        const { data, error } = await client.auth.signUp({ email, password: pass, options: { emailRedirectTo: new URL("index.html", location.href).href } });
        if (error) throw error;
        if (data.session) redirectToGame();
        else showMessage("Регистрация отправлена. Проверь почту и подтверди адрес, если включено подтверждение email.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        redirectToGame();
      }
    } catch (error) {
      showMessage(error.message || "Не удалось выполнить вход.");
    } finally { submitButton.disabled = false; }
  });

  forgot.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) { showMessage("Сначала введи электронную почту."); document.getElementById("email").focus(); return; }
    forgot.disabled = true;
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: new URL("login.html?recover=1", location.href).href });
      if (error) throw error;
      showMessage("Если аккаунт существует, письмо для сброса пароля отправлено.");
    } catch (error) { showMessage(error.message || "Не удалось отправить письмо."); }
    finally { forgot.disabled = false; }
  });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newPassword = document.getElementById("new-password").value;
    if (newPassword.length < 8) { showMessage("Новый пароль должен содержать минимум 8 символов."); return; }
    try {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showMessage("Пароль изменён! Сейчас откроется игра.");
      setTimeout(redirectToGame, 900);
    } catch (error) { showMessage(error.message || "Не удалось изменить пароль. Проверь ссылку из письма."); }
  });

  document.querySelectorAll("[data-provider]").forEach((button) => button.addEventListener("click", async () => {
    const providerKey = button.dataset.provider;
    const provider = config.providers?.[providerKey];
    if (!provider) { showMessage(`Провайдер ${providerKey} не настроен.`); return; }
    button.disabled = true;
    showMessage("Переходим к защищённому входу…");
    try {
      const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: new URL("index.html", location.href).href } });
      if (error) throw error;
    } catch (error) {
      showMessage(error.message || `Не удалось войти через ${providerKey}. Проверь настройки провайдера.`);
      button.disabled = false;
    }
  }));
}
