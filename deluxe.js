"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const MAIN_KEY = window.PIXEL_CAT_SAVE_KEY || "pixelCatClubSave";
  const KEY = MAIN_KEY === "pixelCatClubSave"
    ? "pixelCatClubDeluxeSave"
    : `pixelCatClubDeluxeSave:${MAIN_KEY.slice("pixelCatClubSave:".length)}`;
  const DEFAULT_FURNITURE = [
    { id: "bed", emoji: "🛏️", left: "12%", top: "54%" },
    { id: "plant", emoji: "🪴", left: "72%", top: "52%" },
    { id: "teddy", emoji: "🧸", left: "48%", top: "67%" },
    { id: "lamp", emoji: "💡", left: "80%", top: "20%" }
  ];
  const defaults = {
    schemaVersion: 2, coins: 180, cafeLevel: 1, rep: 0, lastServeAt: 0,
    cityVisits: [], unlocked: ["ginger"], activeCat: "ginger",
    cats: [{ id: "ginger", name: "Моти", emoji: "🐈", kind: "Рыжий котик", rare: "Обычный" }],
    personality: "Ласковый", memories: ["Мы впервые открыли клуб!"],
    furniture: DEFAULT_FURNITURE.map((x) => ({ ...x })), album: [],
    eventsClaimed: [], chestOpened: false, decor: 0, sharedCoinsMigrated: false
  };
  const safeParse = (raw) => { try { return JSON.parse(raw || "null"); } catch { return null; } };
  const readStorage = (key) => { try { return safeParse(localStorage.getItem(key)); } catch { return null; } };
  const mainSave = readStorage(MAIN_KEY) || {};
  const saved = readStorage(KEY);
  const stored = saved && typeof saved === "object" ? saved : (mainSave._deluxe || {});
  const d = { ...defaults, ...stored };
  for (const key of ["cityVisits", "unlocked", "cats", "memories", "furniture", "album", "eventsClaimed"]) {
    if (!Array.isArray(d[key])) d[key] = [...defaults[key]];
  }
  // Repair malformed/old saves before rendering user-controlled content.
  d.cats = d.cats
    .filter((cat) => cat && typeof cat === "object" && typeof cat.id === "string" && /^[a-z0-9_-]{1,32}$/i.test(cat.id))
    .slice(0, 40)
    .map((cat) => ({
      id: cat.id,
      name: String(cat.name || "Котик").slice(0, 32),
      emoji: String(cat.emoji || "🐈").slice(0, 8),
      kind: String(cat.kind || "Компаньон").slice(0, 48),
      rare: String(cat.rare || "Обычный").slice(0, 24)
    }));
  d.cats = d.cats.filter((cat, index, list) => list.findIndex((other) => other.id === cat.id) === index);
  if (!d.cats.length) d.cats = defaults.cats.map((cat) => ({ ...cat }));
  d.cityVisits = d.cityVisits.filter((x) => typeof x === "string").slice(-100);
  d.unlocked = [...new Set(d.unlocked.filter((x) => typeof x === "string" && /^[a-z0-9_-]{1,32}$/i.test(x)))].slice(0, 100);
  d.coins = Math.max(0, Math.floor(Number(d.coins) || 0));
  d.cafeLevel = Math.max(1, Math.floor(Number(d.cafeLevel) || 1));
  d.rep = Math.max(0, Math.floor(Number(d.rep) || 0));
  d.decor = ((Math.floor(Number(d.decor) || 0) % 4) + 4) % 4;
  if (!["Ласковый", "Игривый", "Любопытный", "Соня", "Непоседа"].includes(d.personality)) d.personality = "Ласковый";
  if (!d.cats.some((cat) => cat && cat.id === d.activeCat)) d.activeCat = d.cats[0]?.id || "ginger";
  d.memories = d.memories.filter((x) => typeof x === "string").slice(-80);
  d.album = d.album.filter((x) => x && typeof x === "object").slice(-80);
  d.eventsClaimed = [...new Set(d.eventsClaimed.filter((x) => typeof x === "string"))];
  const normalizePercent = (value, fallback, min, max) => {
    const match = typeof value === "string" ? value.match(/^(\d+(?:\.\d+)?)%$/) : null;
    if (!match) return fallback;
    return `${Math.max(min, Math.min(max, Number(match[1])))}%`;
  };
  d.furniture = d.furniture.slice(0, 100).map((f, i) => ({
    id: String(f?.id || DEFAULT_FURNITURE[i]?.id || `furniture-${i}`).slice(0, 64),
    emoji: String(f?.emoji || "🪴").slice(0, 8),
    left: normalizePercent(f?.left, DEFAULT_FURNITURE[i]?.left || "20%", 2, 92),
    top: normalizePercent(f?.top, DEFAULT_FURNITURE[i]?.top || "30%", 12, 86)
  }));
  if (!d.furniture.length) d.furniture = DEFAULT_FURNITURE.map((x) => ({ ...x }));
  // Migrate the previous independent cafe wallet into the shared game wallet once.
  if (typeof state !== "undefined" && !d.sharedCoinsMigrated) {
    state.coins = Math.max(Number(state.coins) || 0, d.coins);
    d.coins = state.coins;
    d.sharedCoinsMigrated = true;
  }
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const toast = (message) => {
    const note = $("save-note");
    if (note) note.textContent = `♡ ${message}`;
  };
  function save() {
    d.schemaVersion = 2;
    d.memories = d.memories.slice(-80);
    d.album = d.album.slice(-80);
    try {
      if (typeof state !== "undefined") {
        state.coins = d.coins;
        state._deluxe = d;
        state._savedAt = Date.now();
        localStorage.setItem(MAIN_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent("pixel-cat-save", { detail: JSON.parse(JSON.stringify(state)) }));
      }
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (error) {
      console.warn("Не удалось сохранить Pixel Cat Club Deluxe:", error);
      toast("Не удалось сохранить прогресс. Проверь свободное место браузера.");
    }
    render();
  }
  function card(emoji, title, description, action = "", label = "Выбрать", value = "") {
    return `<article class="feature-card"><span class="feature-emoji">${esc(emoji)}</span><h3>${esc(title)}</h3><p>${esc(description)}</p>${action ? `<button type="button" class="pixel-button secondary-button" data-action="${esc(action)}" data-value="${esc(value)}">${esc(label)}</button>` : ""}</article>`;
  }
  const places = [
    ["🏘️", "Площадь Мяу", "Встречай жителей и собирай слухи."],
    ["🌸", "Сад сакуры", "Сезонные лепестки и редкие находки."],
    ["🏖️", "Кошачий пляж", "Ракушки и солнечные сюрпризы."],
    ["🌲", "Шёпот леса", "Тихая тропинка с секретами."],
    ["🛍️", "Рынок усов", "Местные торговцы и подарки."],
    ["🌌", "Звёздный холм", "Редкие ночные находки."]
  ];
  const events = [
    ["🌸", "Фестиваль сакуры", "Собери весеннее настроение.", "spring"],
    ["🎃", "Тыквенная ночь", "Таинственные фонари и конфеты.", "halloween"],
    ["❄️", "Снежный мур-фест", "Зимние сюрпризы и снежинки.", "winter"],
    ["🎂", "День рождения клуба", "Праздничный торт и бонусы.", "birthday"]
  ];
  function render() {
    if (typeof state !== "undefined") {
      d.coins = Math.max(0, Math.floor(Number(state.coins) || 0));
      if ($("coin-count")) $("coin-count").textContent = String(d.coins);
      if ($("shop-coins")) $("shop-coins").textContent = String(d.coins);
    }
    if ($("cafe-rank")) $("cafe-rank").textContent = `Кафе «Мяу-латте» · уровень ${d.cafeLevel}`;
    if ($("cafe-rep")) $("cafe-rep").textContent = String(d.rep);
    if ($("cafe-coins")) $("cafe-coins").textContent = String(d.coins);
    if ($("upgrade-cafe")) $("upgrade-cafe").textContent = `⬆ Улучшить кафе · ${80 * d.cafeLevel} ◆`;
    if ($("town-grid")) $("town-grid").innerHTML = places.map((x, i) => card(x[0], x[1], x[2], "district", "Исследовать район", String(i))).join("");
    if ($("companion-grid")) {
      const owned = d.cats.map((cat) => card(cat.emoji, cat.name, `${cat.kind} · ${cat.rare}${cat.id === d.activeCat ? " · выбран" : ""}`, "selectcat", cat.id === d.activeCat ? "Выбран" : `Выбрать ${cat.name}`, cat.id)).join("");
      const bunny = d.cats.some((cat) => cat.id === "bunny") ? "" : card("🐇", "Пух", "Кролик-компаньон. Найди секрет в саду.", "unlock", "Открыть · 45 ◆", "bunny");
      const dragon = d.cats.some((cat) => cat.id === "dragon") ? "" : card("🐉", "Пиксель-дракон", "Очень редкий спутник.", "unlockdragon", "Открыть · 120 ◆", "dragon");
      $("companion-grid").innerHTML = owned + bunny + dragon;
    }
    if ($("memory-list")) $("memory-list").innerHTML = d.memories.slice(-12).reverse().map((memory) => `<div class="memory-entry">💗 ${esc(memory)}</div>`).join("") || "Пока нет воспоминаний.";
    if ($("cat-personality")) $("cat-personality").value = d.personality;
    if ($("photo-album")) {
      $("photo-album").innerHTML = d.album.length
        ? d.album.slice().reverse().map((photo, i) => card("🖼️", photo.title || "Котопамять", photo.date || "Без даты", "viewphoto", `Открыть фото ${d.album.length - i}`, photo.id || String(d.album.length - 1 - i))).join("")
        : "<p>Альбом пока пуст. Сделай первый снимок!</p>";
    }
    if ($("event-grid")) $("event-grid").innerHTML = events.map((event) => {
      const claimed = d.eventsClaimed.includes(event[3]);
      return card(event[0], event[1], event[2], "event", claimed ? "Получено ✓" : "Забрать награду", event[3]);
    }).join("");
    if ($("chest-status")) $("chest-status").textContent = d.chestOpened
      ? "Сундук уже открыт. Новая сокровищница появится в следующем приключении!"
      : "Внутри может быть редкая находка или монетки.";
  }

  // Cafe: add a small cooldown to avoid accidental double-click rewards.
  $("serve-customer")?.addEventListener("click", () => {
    const now = Date.now();
    if (now - d.lastServeAt < 900) { toast("Гость уже обслужен — следующий почти подошёл!"); return; }
    d.lastServeAt = now;
    const personalityBonus = d.personality === "Игривый" ? 2 : d.personality === "Ласковый" ? 1 : 0;
    const reward = 12 + d.cafeLevel * 3 + personalityBonus;
    d.coins += reward;
    d.rep += 1;
    d.memories.push("Сегодня в кафе было много довольных гостей!");
    const message = $("cafe-message");
    if (message) message.textContent = `Гость доволен! +${reward} монет и +1 репутация.`;
    save();
  });
  $("upgrade-cafe")?.addEventListener("click", () => {
    const cost = 80 * d.cafeLevel;
    if (d.coins < cost) { $("cafe-message").textContent = `Нужно ещё ${cost - d.coins} монет.`; return; }
    d.coins -= cost; d.cafeLevel += 1;
    d.memories.push(`Мы улучшили кафе до уровня ${d.cafeLevel}.`);
    $("cafe-message").textContent = "Ура! Кафе стало уютнее.";
    save();
  });
  function explore(placeIndex) {
    const place = places[placeIndex]?.[1];
    if (!place) return;
    const reward = 8 + Math.floor(Math.random() * 19);
    d.coins += reward;
    d.cityVisits.push(place);
    d.memories.push(`Мы исследовали район «${place}» и нашли ${reward} монет.`);
    if ($("town-message")) $("town-message").textContent = `Ты исследовал(а) «${place}» и нашёл(ла) ${reward} монет!`;
    toast(`Находка в районе «${place}»! +${reward} монет.`);
    save();
  }
  $("town-explore")?.addEventListener("click", () => explore(Math.floor(Math.random() * places.length)));

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const value = button.dataset.value;
    if (action === "district") explore(Number(value));
    else if (action === "selectcat") {
      const cat = d.cats.find((item) => item.id === value);
      if (!cat) return;
      if (d.activeCat === cat.id) { toast(`${cat.name} уже с тобой!`); return; }
      d.activeCat = cat.id;
      d.memories.push(`${cat.name} теперь выбран(а) как спутник.`);
      toast(`${cat.name} теперь с тобой!`);
      save();
    } else if (action === "unlock" || action === "unlockdragon") {
      const isBunny = action === "unlock";
      const id = isBunny ? "bunny" : "dragon";
      const price = isBunny ? 45 : 120;
      if (d.cats.some((cat) => cat.id === id)) { toast("Этот компаньон уже открыт!"); return; }
      if (d.coins < price) { toast(`Нужно ${price} монет, чтобы открыть компаньона.`); return; }
      d.coins -= price;
      const cat = isBunny
        ? { id, name: "Пух", emoji: "🐇", kind: "Кролик-компаньон", rare: "Редкий" }
        : { id, name: "Пиксель", emoji: "🐉", kind: "Дракон-компаньон", rare: "Легендарный" };
      d.cats.push(cat); d.activeCat = id;
      d.memories.push(isBunny ? "К нашей семье присоединился Пух!" : "Мы нашли легендарного дракончика Пикселя!");
      toast(`Добро пожаловать, ${cat.name}!`);
      save();
    } else if (action === "event") {
      if (!events.some((item) => item[3] === value)) return;
      if (d.eventsClaimed.includes(value)) { toast("Эта награда уже получена."); return; }
      d.eventsClaimed.push(value);
      d.coins += 35;
      d.memories.push(`Праздник ${value}: получена награда!`);
      toast("Праздничный подарок: +35 монет!");
      save();
    } else if (action === "viewphoto") {
      const photo = d.album.find((item) => item.id === value) || d.album[Number(value)];
      if (!photo) { toast("Не удалось найти этот снимок."); return; }
      if ($("photo-text")) $("photo-text").value = photo.title || "";
      if ($("photo-caption")) $("photo-caption").textContent = photo.title || "Мой лучший друг";
      if ($("photo-stickers")) $("photo-stickers").textContent = ["✦ ♡ ✦", "🌸 ✧ 🌸", "★ ☆ ★", "💗 ✨ 💗"][Number(photo.decor) || 0];
      toast("Снимок открыт в фотостудии.");
    }
  });

  $("save-personality")?.addEventListener("click", () => {
    const value = $("cat-personality")?.value;
    if (!["Ласковый", "Игривый", "Любопытный", "Соня", "Непоседа"].includes(value)) return;
    d.personality = value;
    d.memories.push(`Сегодня мы выбрали характер «${d.personality}».`);
    if ($("personality-message")) $("personality-message").textContent = `Характер сохранён: ${d.personality} 💗`;
    save();
  });

  // Persist all furniture objects (including newly added items) and support mouse, touch, and pen.
  const room = $("room-canvas");
  let draggedItem = null;
  function persistRoom() {
    if (!room) return;
    d.furniture = [...room.querySelectorAll(".room-item")].map((item) => ({
      id: item.dataset.furnitureId || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      emoji: item.textContent,
      left: item.style.left || "20%",
      top: item.style.top || "30%"
    }));
    save();
    toast("Мебель расставлена и сохранена!");
  }
  function positionFurniture(item, event) {
    const bounds = room.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const left = Math.max(2, Math.min(91, ((event.clientX - bounds.left) / bounds.width) * 100));
    const top = Math.max(12, Math.min(86, ((event.clientY - bounds.top) / bounds.height) * 100));
    item.style.left = `${left}%`;
    item.style.top = `${top}%`;
  }
  function attachFurniture(item) {
    item.addEventListener("pointerdown", (event) => {
      draggedItem = item;
      item.classList.add("is-dragging");
      try { item.setPointerCapture(event.pointerId); } catch { /* browser fallback */ }
      event.preventDefault();
    });
    item.addEventListener("pointermove", (event) => {
      if (draggedItem === item) positionFurniture(item, event);
    });
    const finish = () => {
      if (draggedItem !== item) return;
      draggedItem.classList.remove("is-dragging");
      draggedItem = null;
      persistRoom();
    };
    item.addEventListener("pointerup", finish);
    item.addEventListener("pointercancel", finish);
    item.addEventListener("lostpointercapture", finish);
  }
  function renderFurniture() {
    if (!room) return;
    room.querySelectorAll(".room-item").forEach((item) => item.remove());
    if (!d.furniture.length) d.furniture = DEFAULT_FURNITURE.map((item) => ({ ...item }));
    for (const furniture of d.furniture) {
      const item = document.createElement("div");
      item.className = "room-item";
      item.dataset.furnitureId = furniture.id;
      item.dataset.item = furniture.emoji;
      item.textContent = furniture.emoji;
      item.style.left = furniture.left;
      item.style.top = furniture.top;
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", `Переместить предмет ${furniture.emoji}`);
      attachFurniture(item);
      room.append(item);
    }
  }
  renderFurniture();
  document.querySelectorAll("[data-furniture]").forEach((button) => button.addEventListener("click", () => {
    if (!room) return;
    const emoji = button.dataset.furniture;
    const item = {
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      emoji, left: `${10 + Math.random() * 75}%`, top: `${15 + Math.random() * 60}%`
    };
    d.furniture.push(item);
    renderFurniture();
    save();
  }));
  $("room-reset")?.addEventListener("click", () => {
    if (!room) return;
    const extra = d.furniture.filter((item) => !DEFAULT_FURNITURE.some((base) => base.id === item.id));
    d.furniture = [...DEFAULT_FURNITURE.map((item) => ({ ...item })), ...extra];
    renderFurniture();
    save();
    toast("Основная мебель возвращена на места.");
  });

  $("photo-text")?.addEventListener("input", () => {
    if ($("photo-caption")) $("photo-caption").textContent = $("photo-text").value || "Мой лучший друг";
  });
  const decorations = ["✦ ♡ ✦", "🌸 ✧ 🌸", "★ ☆ ★", "💗 ✨ 💗"];
  $("photo-decor")?.addEventListener("click", () => {
    d.decor = (d.decor + 1) % decorations.length;
    if ($("photo-stickers")) $("photo-stickers").textContent = decorations[d.decor];
    save();
  });
  $("photo-save")?.addEventListener("click", () => {
    d.album.push({
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: ($("photo-text")?.value || "Мой котик").slice(0, 42),
      date: new Date().toLocaleDateString("ru-RU"), decor: d.decor
    });
    d.memories.push("Мы сделали милую фотографию для альбома.");
    save();
    toast("Снимок добавлен в альбом!");
  });
  $("photo-download")?.addEventListener("click", () => {
    try {
      const canvas = document.createElement("canvas"); canvas.width = 600; canvas.height = 700;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas недоступен");
      const gradient = context.createLinearGradient(0, 0, 600, 700);
      gradient.addColorStop(0, "#ffd7e8"); gradient.addColorStop(1, "#fff8fc");
      context.fillStyle = gradient; context.fillRect(0, 0, 600, 700);
      context.strokeStyle = "#df91b6"; context.lineWidth = 16; context.strokeRect(12, 12, 576, 676);
      context.textAlign = "center"; context.fillStyle = "#7b4560";
      context.font = "64px sans-serif"; context.fillText(decorations[d.decor], 300, 100);
      context.font = "150px sans-serif"; context.fillText("🐈", 300, 330);
      context.font = "bold 30px sans-serif"; context.fillText(($ ("photo-text")?.value || "Мой лучший друг").slice(0, 32), 300, 430);
      context.font = "22px sans-serif"; context.fillText("PIXEL CAT CLUB ♥", 300, 490);
      const link = document.createElement("a"); link.download = "pixel-cat-memory.png"; link.href = canvas.toDataURL("image/png"); link.click();
    } catch (error) { console.warn(error); toast("Браузер не смог создать PNG-открытку."); }
  });
  $("open-chest")?.addEventListener("click", () => {
    if (d.chestOpened) { toast("Сундук уже открыт!"); return; }
    if (d.coins < 25) { toast("Нужно 25 монет. Обслужи гостя в кафе!"); return; }
    d.coins -= 25; d.chestOpened = true;
    const reward = 45 + Math.floor(Math.random() * 35);
    d.coins += reward;
    d.memories.push(`Секретный сундук принёс ${reward} монет!`);
    if ($("chest-status")) $("chest-status").textContent = `Ты нашёл(ла) редкую находку и ${reward} монет!`;
    toast(`Сундук открыт: +${reward} монет!`);
    save();
  });

  window.addEventListener("pixel-cat-reset", () => {
    for (const key of Object.keys(d)) delete d[key];
    Object.assign(d, JSON.parse(JSON.stringify(defaults)));
    if (typeof state !== "undefined") { state.coins = d.coins; state._deluxe = d; }
    if (room) renderFurniture();
    save();
  });

  window.addEventListener("pixel-cat-care-action", (event) => {
    const now = Date.now();
    if (now - (d.lastCareMemoryAt || 0) < 5 * 60 * 1000) return;
    d.lastCareMemoryAt = now;
    const action = event.detail?.action;
    const line = action === "feed" ? "Моти получил вкусный обед и довольно замурлыкал." : "Мы провели немного времени вместе, и котик стал доверчивее.";
    d.memories.push(line);
    save();
  });

  save();
})();
