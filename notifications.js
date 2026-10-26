"use strict";

(() => {
  const config = window.PIXEL_CAT_CONFIG || {};
  const auth = window.pixelCatAuth || null;
  const PREFS_KEY = "pixelCatNotifications";
  const APP_VERSION = "5.1.0";

  const toggle = document.getElementById("notifications-toggle");
  const intervalSelect = document.getElementById("reminder-interval");
  const updateCheckbox = document.getElementById("update-notifications");
  const status = document.getElementById("notification-status");
  if (!toggle || !intervalSelect || !updateCheckbox || !status) return;

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      return { enabled: false, intervalMinutes: 60, updatesEnabled: true, lastReminderAt: 0, ...saved };
    } catch {
      return { enabled: false, intervalMinutes: 60, updatesEnabled: true, lastReminderAt: 0 };
    }
  }

  const prefs = loadPrefs();
  let registration = null;
  let reminderTimer = null;
  let subscriptionBusy = false;

  function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }
  function setStatus(text) { status.textContent = text; }
  function updateControls() {
    toggle.textContent = prefs.enabled ? "ВЫКЛЮЧИТЬ" : "ВКЛЮЧИТЬ";
    toggle.setAttribute("aria-pressed", String(prefs.enabled));
    intervalSelect.value = String(prefs.intervalMinutes);
    updateCheckbox.checked = prefs.updatesEnabled;
  }
  function validVapidKey() {
    const key = config.vapidPublicKey;
    return Boolean(key && typeof key === "string" && key.length > 30 && !key.includes("PASTE_"));
  }
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from(raw, (character) => character.charCodeAt(0));
  }
  async function registerWorker() {
    if (!("serviceWorker" in navigator)) throw new Error("Браузер не поддерживает Service Worker.");
    if (!window.isSecureContext) throw new Error("Нужен HTTPS или localhost. Запусти через Live Server.");
    registration = await navigator.serviceWorker.register("./service-worker.js");
    await navigator.serviceWorker.ready;
    return registration;
  }
  async function showNotification(title, body, tag = "pixel-cat-reminder") {
    if (!("Notification" in window) || Notification.permission !== "granted") return false;
    const reg = registration || await registerWorker();
    await reg.showNotification(title, { body, tag, renotify: false, data: { url: "./index.html" } });
    return true;
  }
  async function saveSubscription(subscription) {
    if (!auth?.client || !auth?.user || subscriptionBusy) return false;
    subscriptionBusy = true;
    try {
      const payload = {
        user_id: auth.user.id,
        endpoint: subscription.endpoint,
        subscription: subscription.toJSON(),
        enabled: true,
        updates_enabled: prefs.updatesEnabled,
        interval_minutes: prefs.intervalMinutes,
        last_care_at: new Date().toISOString(),
        last_sent_at: new Date().toISOString(),
        last_update_sent_at: new Date().toISOString(),
        last_notification_kind: "pet"
      };
      const { error } = await auth.client.from("push_subscriptions").upsert(payload, { onConflict: "user_id,endpoint" });
      if (error) throw error;
      return true;
    } finally { subscriptionBusy = false; }
  }
  async function syncPrefs() {
    if (!auth?.client || !auth?.user) return;
    const { error } = await auth.client.from("push_subscriptions").update({
      enabled: prefs.enabled,
      updates_enabled: prefs.updatesEnabled,
      interval_minutes: prefs.intervalMinutes
    }).eq("user_id", auth.user.id);
    if (error) console.warn("Не удалось обновить настройки push:", error.message);
  }
  function readGameSave() {
    try { return JSON.parse(localStorage.getItem(window.PIXEL_CAT_SAVE_KEY || "pixelCatClubSave") || "{}"); }
    catch { return {}; }
  }
  function getLastCare() {
    const save = readGameSave();
    return Number(save.lastCareAt || save.lastPetAt || save.lastFedAt || prefs.lastReminderAt || Date.now());
  }
  async function enableNotifications() {
    if (!("Notification" in window)) { setStatus("Этот браузер не поддерживает системные уведомления."); return; }
    if (!window.isSecureContext) { setStatus("Для уведомлений нужен HTTPS или localhost. Включи Live Server."); return; }
    let permission = Notification.permission;
    if (permission !== "granted") permission = await Notification.requestPermission();
    if (permission !== "granted") { prefs.enabled = false; savePrefs(); updateControls(); setStatus("Разреши уведомления в настройках браузера."); return; }

    try {
      await registerWorker();
      prefs.enabled = true;
      if (!prefs.lastReminderAt) prefs.lastReminderAt = Date.now();
      savePrefs(); updateControls();

      if (validVapidKey() && registration.pushManager && auth?.client && auth?.user) {
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
          });
        }
        const saved = await saveSubscription(subscription);
        setStatus(saved
          ? "Push включён. При настроенном серверном расписании уведомления могут приходить и при закрытой игре."
          : "Уведомления для открытой игры включены; проверь таблицу push_subscriptions.");
      } else {
        setStatus("Уведомления работают, пока игра открыта. Для push при закрытой игре нужны аккаунт, VAPID и серверная функция.");
      }
      startReminderTimer();
      await showNotification("Pixel Cat Club 🐱", "Уведомления включены! Мы напомним, когда котику понадобится внимание.", "pixel-cat-enabled");
    } catch (error) {
      prefs.enabled = false; savePrefs(); updateControls(); setStatus(error.message || "Не удалось включить уведомления.");
    }
  }
  async function disableNotifications() {
    prefs.enabled = false; savePrefs(); updateControls();
    clearInterval(reminderTimer); reminderTimer = null;
    await syncPrefs();
    setStatus("Напоминания выключены.");
  }
  async function checkReminder() {
    if (!prefs.enabled || !("Notification" in window) || Notification.permission !== "granted") return;
    const interval = (Number(prefs.intervalMinutes) === 120 ? 120 : 60) * 60 * 1000;
    const dueFrom = Math.max(getLastCare(), Number(prefs.lastReminderAt) || 0);
    if (Date.now() - dueFrom < interval) return;

    const save = readGameSave();
    const hungerStep = 15 * 60 * 1000;
    const anchor = Number(save.lastHungerUpdate || save.lastFedAt || Date.now());
    const steps = Math.floor(Math.max(0, Date.now() - anchor) / hungerStep);
    const fullness = Math.max(0, Number(save.fullness ?? 100) - steps * 5);
    const feedReminder = fullness <= 30;

    try {
      const shown = await showNotification(
        feedReminder ? "Миска котика зовёт! 🥣" : "Котик скучает по тебе 💗",
        feedReminder ? "Котик хочет вкусняшку. Загляни и покорми его!" : "Твой пушистый друг ждёт поглаживаний. Загляни на минутку!",
        feedReminder ? "cat-feed" : "cat-pet"
      );
      if (shown) {
        prefs.lastReminderAt = Date.now();
        savePrefs();
        if (auth?.client && auth?.user) {
          const { error } = await auth.client.from("push_subscriptions").update({
            last_sent_at: new Date().toISOString(),
            last_notification_kind: feedReminder ? "feed" : "pet"
          }).eq("user_id", auth.user.id).eq("enabled", true);
          if (error) console.warn("Не удалось синхронизировать время уведомления:", error.message);
        }
      }
    } catch (error) { console.warn("Не удалось показать уведомление:", error); }
  }
  function startReminderTimer() {
    clearInterval(reminderTimer);
    reminderTimer = setInterval(checkReminder, 30000);
    checkReminder();
  }

  window.addEventListener("pixel-cat-care-action", async () => {
    prefs.lastReminderAt = Date.now(); savePrefs();
    if (auth?.client && auth?.user) {
      const { error } = await auth.client.from("push_subscriptions").update({
        last_care_at: new Date().toISOString(),
        last_sent_at: new Date().toISOString()
      }).eq("user_id", auth.user.id).eq("enabled", true);
      if (error) console.warn("Не удалось обновить время ухода:", error.message);
    }
  });

  toggle.addEventListener("click", async () => {
    if (prefs.enabled) await disableNotifications(); else await enableNotifications();
  });
  intervalSelect.addEventListener("change", async () => {
    prefs.intervalMinutes = Number(intervalSelect.value) === 120 ? 120 : 60;
    savePrefs(); await syncPrefs();
    showToast(`Напоминания: ${prefs.intervalMinutes === 60 ? "каждый час" : "каждые 2 часа"}.`);
  });
  updateCheckbox.addEventListener("change", async () => {
    prefs.updatesEnabled = updateCheckbox.checked; savePrefs(); await syncPrefs();
  });

  async function checkReleaseNotice() {
    const key = "pixelCatSeenVersion";
    const previous = localStorage.getItem(key);
    if (previous && previous !== APP_VERSION && prefs.enabled && prefs.updatesEnabled && Notification.permission === "granted") {
      await showNotification("Pixel Cat Club обновился ✨", "Загляни в игру — появились новые функции и улучшения.", `release-${APP_VERSION}`);
    }
    localStorage.setItem(key, APP_VERSION);
  }

  updateControls();
  if (prefs.enabled && "Notification" in window && Notification.permission === "granted") {
    registerWorker().then(() => { startReminderTimer(); return checkReleaseNotice(); })
      .catch((error) => setStatus(error.message));
  } else if ("Notification" in window && Notification.permission === "denied") {
    setStatus("Уведомления заблокированы браузером. Разреши их в настройках сайта.");
  } else {
    setStatus("Разреши уведомления, чтобы получать напоминания о котике.");
  }
})();
