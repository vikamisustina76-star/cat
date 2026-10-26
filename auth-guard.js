"use strict";

(async function bootPixelCatClub() {
  const config = window.PIXEL_CAT_CONFIG || {};
  const demoRequested = new URLSearchParams(location.search).get("demo") === "1";
  const configReady = Boolean(
    window.supabase &&
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_PROJECT_REF") &&
    !config.supabaseAnonKey.includes("YOUR_SUPABASE_")
  );

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
      document.body.appendChild(script);
    });
  }

  function showDemoNotice() {
    const notice = document.getElementById("setup-notice");
    if (notice) notice.hidden = false;
  }

  async function loadGameScripts() {
    await loadScript("app.js");
    await loadScript("deluxe.js");
    await loadScript("notifications.js");
  }

  if (demoRequested || !configReady) {
    window.PIXEL_CAT_SAVE_KEY = "pixelCatClubSave";
    window.pixelCatAuth = null;
    showDemoNotice();
    try {
      await loadGameScripts();
    } catch (error) {
      console.error(error);
      showDemoNotice();
    }
    return;
  }

  let client;
  try {
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  } catch (error) {
    console.error(error);
    showDemoNotice();
    await loadGameScripts();
    return;
  }

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError || !sessionData.session) {
    location.replace("login.html");
    return;
  }

  const user = sessionData.session.user;
  window.pixelCatAuth = { client, user };

  const legacyKey = "pixelCatClubSave";
  const localKey = `pixelCatClubSave:${user.id}`;
  window.PIXEL_CAT_SAVE_KEY = localKey;
  function readAt(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch { return null; }
  }

  // Per-user local storage prevents progress from one account being uploaded to another.
  let local = readAt(localKey);
  const legacy = readAt(legacyKey);

  try {
    const { data: remote, error } = await client
      .from("game_saves")
      .select("payload, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Облачные сохранения недоступны; игра продолжит работать локально:", error.message);
    } else {
      const localTime = Number(local?._savedAt || 0);
      const remoteTime = Number(remote?.payload?._savedAt || Date.parse(remote?.updated_at || "") || 0);

      if (remote?.payload && (!local || remoteTime > localTime)) {
        localStorage.setItem(localKey, JSON.stringify(remote.payload));
        local = remote.payload;
      } else if (local) {
        const { error: uploadError } = await client.from("game_saves").upsert({
          user_id: user.id,
          payload: local
        }, { onConflict: "user_id" });
        if (uploadError) console.warn("Не удалось загрузить локальное сохранение:", uploadError.message);
      } else if (legacy) {
        // Migrate the prior single-player save once, only if this account has no save.
        localStorage.setItem(localKey, JSON.stringify(legacy));
        local = legacy;
        const { error: migrationError } = await client.from("game_saves").upsert({
          user_id: user.id,
          payload: legacy
        }, { onConflict: "user_id" });
        if (migrationError) {
          console.warn("Не удалось перенести демо-сохранение в аккаунт:", migrationError.message);
        } else {
          localStorage.removeItem(legacyKey);
        }
      }
    }
  } catch (error) {
    console.warn("Облачное сохранение недоступно:", error);
  }

  // Listen before app.js loads so its initial save is also synchronized.
  let saveTimer = null;
  let inFlight = false;
  let queuedSave = null;

  async function uploadSnapshot(snapshot) {
    const { error } = await client.from("game_saves").upsert({
      user_id: user.id,
      payload: snapshot
    }, { onConflict: "user_id" });
    if (error) console.warn("Ошибка облачного сохранения:", error.message);
  }

  async function flushSave() {
    if (inFlight || !queuedSave) return;
    inFlight = true;
    const snapshot = queuedSave;
    queuedSave = null;
    try { await uploadSnapshot(snapshot); }
    finally {
      inFlight = false;
      if (queuedSave) flushSave();
    }
  }

  window.addEventListener("pixel-cat-save", (event) => {
    queuedSave = event.detail;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 700);
  });

  const controls = document.getElementById("account-controls");
  if (controls) {
    controls.replaceChildren();
    const label = document.createElement("span");
    label.className = "account-label";
    label.title = user.email || user.user_metadata?.name || "Мой аккаунт";
    label.textContent = user.email || user.user_metadata?.name || "МОЙ АККАУНТ";
    const logout = document.createElement("button");
    logout.className = "account-logout";
    logout.type = "button";
    logout.textContent = "ВЫЙТИ";
    logout.addEventListener("click", async () => {
      await flushSave();
      const { error } = await client.auth.signOut();
      if (error) { alert(`Не удалось выйти: ${error.message}`); return; }
      location.replace("login.html");
    });
    controls.append(label, logout);
  }

  try {
    await loadGameScripts();
  } catch (error) {
    console.error(error);
    const notice = document.getElementById("setup-notice");
    if (notice) {
      notice.hidden = false;
      notice.textContent = `Не удалось загрузить игровой файл: ${error.message}`;
    }
  }
})();
