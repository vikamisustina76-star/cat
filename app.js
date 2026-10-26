"use strict";

const $ = (id) => document.getElementById(id);
const SAVE_KEY = window.PIXEL_CAT_SAVE_KEY || "pixelCatClubSave";
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const safeInt = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
};

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function freshDaily() {
  return { date: todayKey(), pets: 0, worlds: 0, thoughts: 0, games: 0, claimed: [] };
}
function freshState() {
  return {
    schemaVersion: 4, clicks: 0, level: 1, xp: 0, coins: 0,
    skin: "orange", theme: "day", location: "room", weather: "sun",
    accessory: null, ownedAccessories: [], unlockedSkins: ["orange", "cream", "black", "pink"],
    achievements: [], discoveredThoughts: [], visitedLocations: ["room"], secretsFound: [],
    miniGamesPlayed: 0, arcadeRecord: 0, fullness: 100,
    lastHungerUpdate: Date.now(), lastCareAt: Date.now(), lastFedAt: Date.now(), lastPetAt: Date.now(),
    soundOn: true, musicOn: false, volume: 50, autoWeather: true, reduceMotion: false,
    welcomeSeen: false, daily: freshDaily(), dailyRewardDate: "", dailyStreak: 0,
    lastLoginDate: "", lastDailyClaimedStreak: 0
  };
}
function readSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}
const state = { ...freshState(), ...readSave() };

const thoughts = [
  "Мяу! Погладь меня 💗", "Где мои вкусняшки?!", "Ты мой любимый человек ♡",
  "Мне нужен новый пакетик!", "Я здесь главный!", "Пора поспать ещё 18 часов...",
  "Можно ещё 100 порций еды?", "Я не толстый. Я пушистый!", "Почеши за ушком!",
  "Вазу разбил призрак.", "Мррр... люблю тебя!", "Я красивее всех пикселей!",
  "В три ночи пора бегать!", "Садись. Ты теперь моя лежанка.",
  "Эта коробка — моё королевство!", "Ещё один клик! Для науки!",
  "Я слышал холодильник!", "Мои лапки — сокровище.", "Пиксельный хаос активирован!",
  "Ты лучший друг котика!", "Сейчас будет секретное мяу.",
  "Может, заведём ещё котика?", "Я контролирую эту квартиру.",
  "Твоя клавиатура такая удобная...", "Пять минут обнимашек!",
  "Сон — моё призвание.", "Этот мир слишком маленький!",
  "Ты видел мой новый хвост?", "Мне приснился огромный лосось!", "Я вообще-то модель."
];

const skins = {
  orange: { name: "Рыжий", body: "#f5a044", shade: "#c96a32", light: "#ffd18a", inner: "#f27c9f", eye: "#593b50" },
  cream: { name: "Кремовый", body: "#f5e2b5", shade: "#bca16c", light: "#fff5d8", inner: "#e99aaf", eye: "#70536a" },
  black: { name: "Чёрный", body: "#55485f", shade: "#31283e", light: "#9380a4", inner: "#ff9dc8", eye: "#a7f4e8" },
  pink: { name: "Розовый", body: "#ff91bf", shade: "#d94e8d", light: "#ffc9df", inner: "#bc5997", eye: "#65416d" },
  calico: { name: "Трёхцветный", body: "#fff0cf", shade: "#55485f", light: "#fff8e8", inner: "#f27c9f", eye: "#593b50" }
};
const baseSkins = ["orange", "cream", "black", "pink"];
const locations = [
  { id: "room", name: "УЮТНАЯ КОМНАТА", description: "Самое время поспать!", icon: "🏡", intro: "Добро пожаловать домой! Мур-р. 🏡", caption: "Место, где живёт уют", thoughts: ["Мой диванчик!", "Как уютно...", "Не мешай мне спать!"] },
  { id: "garden", name: "ЦВЕТОЧНЫЙ САД", description: "Ловим бабочек!", icon: "🌷", intro: "Свежий воздух и цветочки! 🌷", caption: "Пахнет цветами и приключениями", thoughts: ["Этот цветочек мой!", "Где бабочки?", "Трава идеальная!"] },
  { id: "city", name: "НОЧНОЙ ГОРОД", description: "Мяу под фонарями.", icon: "🌆", intro: "Котик исследует большой город! 🌆", caption: "Король ночных переулков", thoughts: ["Я звезда этого района!", "Мяу в переулке!", "Где мой лимузин?"] },
  { id: "space", name: "КОСМИЧЕСКАЯ МИССИЯ", description: "Покоряем галактику!", icon: "🚀", intro: "Три, два, один... МЯУ-КОСМОС! 🚀", caption: "Котик среди далёких звёзд", thoughts: ["Я первый кот на Луне!", "Это звёзды или корм?", "Мяу до Марса!"] },
  { id: "snow", name: "СНЕЖНАЯ ДЕРЕВНЯ", description: "Тёплый шарфик и снежинки.", icon: "❄️", intro: "Бр-р-р! Как красиво падает снег! ❄️", caption: "Снежинки, плед и горячее молоко", thoughts: ["Лови снежинку!", "Где мой тёплый плед?", "Снег похож на сахар!"] }
];
const weatherTypes = [{ id: "sun", name: "ЯСНО", icon: "☀" }, { id: "rain", name: "ДОЖДЬ", icon: "☔" }, { id: "snow", name: "СНЕГ", icon: "❄" }];
const accessories = [
  { id: "none", name: "Без аксессуара", icon: "🐾", price: 0, category: "other", description: "Естественная красота" },
  { id: "bow", name: "Розовый бантик", icon: "🎀", price: 15, category: "head", description: "Милота +100" },
  { id: "collar", name: "Ошейник", icon: "🔴", price: 10, category: "neck", description: "Модный аксессуар" },
  { id: "flower", name: "Цветочек", icon: "🌸", price: 20, category: "head", description: "Садовый стиль" },
  { id: "crown", name: "Корона", icon: "👑", price: 40, category: "head", description: "Король комнаты" },
  { id: "wizard", name: "Шляпа мага", icon: "🪄", price: 50, category: "head", description: "Магия мяу!" },
  { id: "star", name: "Звёздный обруч", icon: "⭐", price: 30, category: "other", description: "Космический образ" }
];
const achievementsDef = [
  { id: "first-pet", icon: "🐾", name: "Первое мяу", description: "Погладь котика один раз.", reward: 2, condition: () => state.clicks >= 1 },
  { id: "ten-pets", icon: "💗", name: "Пушистый друг", description: "Погладь котика 10 раз.", reward: 5, condition: () => state.clicks >= 10 },
  { id: "thirty-pets", icon: "🎀", name: "Любимчик", description: "Погладь котика 30 раз.", reward: 10, condition: () => state.clicks >= 30 },
  { id: "hundred-pets", icon: "🏆", name: "Мастер поглаживаний", description: "Погладь котика 100 раз.", reward: 30, condition: () => state.clicks >= 100 },
  { id: "first-shop", icon: "🛍️", name: "Модник", description: "Купи первый аксессуар.", reward: 5, condition: () => state.ownedAccessories.length > 0 },
  { id: "first-game", icon: "🎮", name: "Аркадный чемпион", description: "Заверши мини-игру.", reward: 10, condition: () => state.miniGamesPlayed >= 1 },
  { id: "traveler", icon: "🚀", name: "Кругосветный кот", description: "Посети все пять локаций.", reward: 15, condition: () => state.visitedLocations.length >= locations.length },
  { id: "thought-collector", icon: "📖", name: "Читатель мыслей", description: "Открой 15 разных мыслей.", reward: 20, condition: () => state.discoveredThoughts.length >= 15 },
  { id: "secret-hunter", icon: "✨", name: "Охотник за секретами", description: "Найди секреты в трёх разных мирах.", reward: 20, condition: () => state.secretsFound.length >= 3 }
];
const dailyQuestDef = [
  { id: "pet-15", metric: "pets", target: 15, title: "Пушистый марафон", description: "Погладь котика 15 раз.", coins: 12, xp: 10 },
  { id: "world-3", metric: "worlds", target: 3, title: "Маленький путешественник", description: "Переключись между мирами три раза.", coins: 15, xp: 15 },
  { id: "thought-5", metric: "thoughts", target: 5, title: "Телепат", description: "Узнай пять новых мыслей котика сегодня.", coins: 10, xp: 10 },
  { id: "game-1", metric: "games", target: 1, title: "Аркадное приключение", description: "Заверши один раунд мини-игры.", coins: 15, xp: 15 }
];

function normalizeState() {
  for (const field of ["ownedAccessories", "unlockedSkins", "achievements", "discoveredThoughts", "visitedLocations", "secretsFound"]) {
    if (!Array.isArray(state[field])) state[field] = [];
  }
  for (const field of ["clicks", "xp", "coins", "miniGamesPlayed", "arcadeRecord"]) state[field] = safeInt(state[field]);
  state.level = Math.max(1, safeInt(state.level, 1));
  state.volume = Math.max(0, Math.min(100, Number(state.volume) || 0));
  state.fullness = Math.max(0, Math.min(100, Number(state.fullness ?? 100)));
  for (const field of ["lastHungerUpdate", "lastCareAt", "lastFedAt", "lastPetAt"]) state[field] = Number(state[field]) || Date.now();
  if (!own(skins, state.skin)) state.skin = "orange";
  if (!["day", "night"].includes(state.theme)) state.theme = "day";
  if (!locations.some((item) => item.id === state.location)) state.location = "room";
  if (!weatherTypes.some((item) => item.id === state.weather)) state.weather = "sun";
  if (!accessories.some((item) => item.id === state.accessory)) state.accessory = null;
  state.ownedAccessories = [...new Set(state.ownedAccessories.filter((id) => accessories.some((item) => item.id === id && id !== "none")))];
  state.unlockedSkins = [...new Set([...baseSkins, ...state.unlockedSkins.filter((id) => own(skins, id))])];
  if (state.level >= 3 && !state.unlockedSkins.includes("calico")) state.unlockedSkins.push("calico");
  if (!state.unlockedSkins.includes(state.skin)) state.skin = "orange";
  if (state.accessory && !state.ownedAccessories.includes(state.accessory)) state.accessory = null;
  state.achievements = [...new Set(state.achievements.filter((id) => achievementsDef.some((item) => item.id === id)))];
  state.discoveredThoughts = [...new Set(state.discoveredThoughts.filter((text) => typeof text === "string"))];
  state.visitedLocations = [...new Set(state.visitedLocations.filter((id) => locations.some((item) => item.id === id)))];
  state.secretsFound = [...new Set(state.secretsFound.filter((id) => locations.some((item) => item.id === id)))];
  if (!state.visitedLocations.includes(state.location)) state.visitedLocations.push(state.location);
  if (!state.daily || typeof state.daily !== "object" || state.daily.date !== todayKey()) state.daily = freshDaily();
  else {
    for (const field of ["pets", "worlds", "thoughts", "games"]) state.daily[field] = safeInt(state.daily[field]);
    if (!Array.isArray(state.daily.claimed)) state.daily.claimed = [];
  }
  state.daily.claimed = [...new Set(state.daily.claimed)];
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = todayKey(yesterdayDate);
  state.dailyStreak = safeInt(state.dailyStreak);
  if (state.lastLoginDate !== todayKey()) {
    state.dailyStreak = state.lastLoginDate === yesterday ? Math.max(1, state.dailyStreak + 1) : 1;
    state.lastLoginDate = todayKey();
  }
}
normalizeState();

let lastThought = "";
let previewAccessory = null;
let shopFilter = "all";
let toastTimeout = null;
let blinkTimer = null;
let idleTimeout = null;
let secretTimeout = null;
let weatherTimer = null;
let musicTimer = null;
let audioContext = null;
let miniTimer = null;
let miniRunning = false;
let miniScore = 0;
let miniBonus = 0;
let miniTimeLeft = 20;
let miniType = "fish";
let miniIsGolden = false;
let fullscreenFallback = false;

const locationIndex = () => Math.max(0, locations.findIndex((item) => item.id === state.location));
const currentLocation = () => locations[locationIndex()];
const xpNeeded = () => 50 + (state.level - 1) * 25;

function saveState() {
  try {
    state._savedAt = Date.now();
    if (state._deluxe && typeof state._deluxe === "object") {
      state._deluxe.coins = state.coins;
      const deluxeKey = SAVE_KEY === "pixelCatClubSave" ? "pixelCatClubDeluxeSave" : `pixelCatClubDeluxeSave:${SAVE_KEY.slice("pixelCatClubSave:".length)}`;
      try { localStorage.setItem(deluxeKey, JSON.stringify(state._deluxe)); } catch { /* Main save has priority if storage is nearly full. */ }
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    const note = $("save-note");
    if (note) note.textContent = "♡ ПРОГРЕСС СОХРАНЁН!";
    window.dispatchEvent(new CustomEvent("pixel-cat-save", { detail: JSON.parse(JSON.stringify(state)) }));
  } catch (error) {
    const note = $("save-note");
    if (note) note.textContent = "♡ ИГРА ПРОДОЛЖАЕТСЯ, НО СОХРАНЕНИЕ НЕДОСТУПНО";
    console.warn("Не удалось сохранить прогресс:", error);
  }
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { $("toast").hidden = true; }, 2800);
}

function activateView(viewId) {
  const target = $(viewId);
  if (!target || !target.classList.contains("view")) return;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
    const active = button.dataset.view === viewId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  window.scrollTo({ top: 0, behavior: state.reduceMotion ? "auto" : "smooth" });
}
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", (event) => {
  event.preventDefault();
  activateView(button.dataset.view);
}));
$("go-quests").addEventListener("click", () => activateView("view-quests"));

/* Pixel sprite */
function rect(x, y, width, height, fill, className = "") {
  const cssClass = className ? ` class="${className}"` : "";
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${cssClass}/>`;
}
function renderOneCat(svg, accessoryId) {
  const c = skins[state.skin];
  const p = [];
  p.push(rect(112, 103, 22, 10, c.shade, "cat-tail"), rect(127, 93, 15, 15, c.shade, "cat-tail"), rect(136, 78, 12, 22, c.shade, "cat-tail"), rect(130, 95, 8, 9, c.light));
  p.push(rect(30, 17, 28, 36, c.shade), rect(102, 17, 28, 36, c.shade), rect(38, 26, 12, 21, c.inner), rect(110, 26, 12, 21, c.inner));
  p.push(rect(43, 91, 78, 45, c.shade), rect(51, 94, 62, 36, c.body), rect(44, 124, 29, 20, c.shade), rect(91, 124, 29, 20, c.shade), rect(50, 132, 21, 9, c.light), rect(94, 132, 21, 9, c.light));
  p.push(rect(23, 34, 114, 76, c.shade), rect(30, 38, 100, 65, c.body));
  if (state.skin === "orange") p.push(rect(48,39,10,18,c.shade),rect(75,36,10,14,c.shade),rect(102,39,10,18,c.shade),rect(34,62,8,19,c.light),rect(118,62,8,19,c.light));
  if (state.skin === "calico") p.push(rect(32,40,26,23,"#f5a044"),rect(105,40,21,26,"#55485f"),rect(42,80,18,14,"#55485f"),rect(100,78,20,16,"#f5a044"));
  if (state.skin === "black") p.push(rect(40,46,12,8,c.light),rect(110,46,12,8,c.light));
  p.push(rect(39,81,19,13,c.inner),rect(102,81,19,13,c.inner),rect(50,64,13,15,c.eye,"cat-eye"),rect(97,64,13,15,c.eye,"cat-eye"),rect(52,65,5,5,c.light),rect(99,65,5,5,c.light),rect(74,83,12,8,c.inner),rect(79,91,4,7,c.shade),rect(69,97,10,4,c.shade),rect(83,97,10,4,c.shade),rect(22,81,18,4,c.light),rect(16,91,23,4,c.light),rect(120,81,18,4,c.light),rect(121,91,23,4,c.light));
  switch (accessoryId === "none" ? null : accessoryId) {
    case "bow": p.push(rect(69,25,10,13,"#ff5d9f"),rect(85,25,10,13,"#ff5d9f"),rect(78,28,8,8,"#b73371"),rect(72,28,5,5,"#ffd6e8")); break;
    case "collar": p.push(rect(49,105,62,7,"#ff668f"),rect(74,108,12,11,"#ffe56a")); break;
    case "flower": p.push(rect(109,25,8,8,"#ff76ad"),rect(101,33,8,8,"#ff76ad"),rect(117,33,8,8,"#ff76ad"),rect(109,41,8,8,"#ff76ad"),rect(109,33,8,8,"#ffd65f")); break;
    case "crown": p.push(rect(50,20,12,15,"#ffd34e"),rect(62,12,12,23,"#ffd34e"),rect(74,19,12,16,"#ffd34e"),rect(86,10,12,25,"#ffd34e"),rect(98,20,12,15,"#ffd34e"),rect(50,32,60,8,"#e2a33a"),rect(65,17,5,5,"#ff91bf"),rect(89,15,5,5,"#91e7e7")); break;
    case "wizard": p.push(rect(62,7,37,8,"#654d98"),rect(66,1,29,8,"#654d98"),rect(71,0,20,8,"#654d98"),rect(54,13,54,8,"#8a66c1"),rect(78,4,8,8,"#ffe586"),rect(74,14,5,5,"#ffe586")); break;
    case "star": p.push(rect(58,19,10,10,"#a66bda"),rect(68,11,10,10,"#a66bda"),rect(78,19,10,10,"#a66bda"),rect(68,29,10,10,"#a66bda"),rect(68,19,10,10,"#ffe56a"),rect(96,24,7,7,"#ffe56a")); break;
  }
  svg.innerHTML = `<g shape-rendering="crispEdges">${p.join("")}</g>`;
  svg.setAttribute("aria-label", `Пиксельный котик: ${c.name}`);
  svg.classList.remove("blink");
}
function currentPreviewAccessory() { return previewAccessory === null ? state.accessory : previewAccessory; }
function renderCat() {
  renderOneCat($("pixel-cat"), currentPreviewAccessory());
  renderOneCat($("preview-cat"), currentPreviewAccessory());
  $("preview-name").textContent = `${skins[state.skin].name.toUpperCase()} КОТИК`;
  const item = accessories.find((a) => a.id === (currentPreviewAccessory() || "none"));
  $("preview-accessory").textContent = item ? item.name : "Без аксессуара";
  $("equipped-summary").textContent = item ? `${item.icon} ${item.name}` : "🐾 Без аксессуара";
}
function animateCat() {
  const catSvg = $("pixel-cat");
  $("pet-button").classList.remove("patted");
  void $("pet-button").offsetWidth;
  $("pet-button").classList.add("patted");
  catSvg.classList.remove("sleepy");
  setTimeout(() => $("pet-button").classList.remove("patted"), 600);
  resetIdleTimer();
}
function blinkCat() {
  const cat = $("pixel-cat");
  if (state.reduceMotion || cat.classList.contains("sleepy")) return;
  cat.classList.add("blink");
  setTimeout(() => cat.classList.remove("blink"), 170);
}
function resetIdleTimer() {
  clearTimeout(idleTimeout);
  $("pixel-cat").classList.remove("sleepy");
  idleTimeout = setTimeout(() => {
    $("pixel-cat").classList.add("sleepy");
    setThought("Хр-р... ты ещё тут? 😴", false);
  }, 45000);
}

/* effects and music */
function playTone(frequency, duration = .12, mode = "effect", offset = 0) {
  if (mode === "music" && !state.musicOn) return;
  if (mode === "effect" && !state.soundOn) return;
  if (state.volume <= 0) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    const start = audioContext.currentTime + offset;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, start);
    const volume = (state.volume / 100) * .045;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(start); oscillator.stop(start + duration + .02);
  } catch { /* audio unavailable: keep the game usable */ }
}
function playCuteSound(levelUp = false) {
  (levelUp ? [660,784,988,1175] : [660,880]).forEach((note, i) => playTone(note,.11,"effect",i*.08));
}
function startMusic() {
  clearInterval(musicTimer);
  if (!state.musicOn) return;
  const melody = [392,494,587,494,440,523,659,523]; let step = 0;
  musicTimer = setInterval(() => { if (state.musicOn) playTone(melody[step++ % melody.length],.17,"music"); },360);
}
function updateAudioControls() {
  $("sound-toggle").textContent = state.soundOn ? "ЗВУК: ВКЛ" : "ЗВУК: ВЫКЛ";
  $("music-toggle").textContent = state.musicOn ? "МУЗЫКА: ВКЛ" : "МУЗЫКА: ВЫКЛ";
  $("sound-toggle").setAttribute("aria-pressed",String(state.soundOn));
  $("music-toggle").setAttribute("aria-pressed",String(state.musicOn));
  $("volume-slider").value = String(state.volume);
  $("volume-value").textContent = `${state.volume}%`;
  $("auto-weather").checked = state.autoWeather;
  $("reduce-motion").checked = state.reduceMotion;
  document.body.classList.toggle("reduce-motion",state.reduceMotion);
}

/* XP and achievements */
function addXP(amount) {
  state.xp += amount; let levelled = false;
  while (state.xp >= xpNeeded()) {
    state.xp -= xpNeeded(); state.level += 1; state.coins += 10; levelled = true;
    showToast(`НОВЫЙ УРОВЕНЬ ${state.level}! +10 МОНЕТОК ★`);
    if (state.level >= 3 && !state.unlockedSkins.includes("calico")) {
      state.unlockedSkins.push("calico"); showToast("ОТКРЫТ ТРЁХЦВЕТНЫЙ КОТИК! 🐈");
    }
  }
  if (levelled) playCuteSound(true);
}
function checkAchievements() {
  let changed = false;
  for (const item of achievementsDef) {
    if (item.condition() && !state.achievements.includes(item.id)) {
      state.achievements.push(item.id); state.coins += item.reward; changed = true;
      showToast(`${item.icon} ${item.name}! +${item.reward} ◆`);
    }
  }
  if (changed) renderAchievements();
}
function setThought(text, collect = false) {
  $("thought-text").textContent = text;
  $("thought-bubble").classList.remove("pop"); void $("thought-bubble").offsetWidth; $("thought-bubble").classList.add("pop");
  if (collect && !state.discoveredThoughts.includes(text)) {
    state.discoveredThoughts.push(text); state.daily.thoughts += 1;
    renderCollection(); renderDailyQuests(); checkAchievements();
  }
}
function chooseThought() {
  const options = [...thoughts,...currentLocation().thoughts];
  let next = options[Math.floor(Math.random()*options.length)];
  if (options.length > 1 && next === lastThought) {
    const alternatives = options.filter((text)=>text !== lastThought);
    next = alternatives[Math.floor(Math.random()*alternatives.length)];
  }
  lastThought = next; return next;
}
function spawnParticles() {
  const catRect = $("pet-button").getBoundingClientRect(); const worldRect = $("game-world").getBoundingClientRect();
  const x = catRect.left + catRect.width/2 - worldRect.left; const y = catRect.top + catRect.height/3 - worldRect.top;
  const icons = ["♥","✦","✧","♡","✿"];
  for (let i=0;i<7;i++) {
    const particle = document.createElement("span"); particle.textContent = icons[Math.floor(Math.random()*icons.length)];
    particle.style.cssText = `position:absolute;z-index:8;pointer-events:none;font-size:20px;left:${x+Math.random()*90-45}px;top:${y+Math.random()*24-12}px;animation:floaty .7s steps(4,end) forwards;`;
    $("game-world").appendChild(particle); setTimeout(()=>particle.remove(),900);
  }
}
function petCat() {
  const now = Date.now(); state.clicks += 1; state.coins += 1; state.daily.pets += 1;
  state.lastPetAt = now; state.lastCareAt = now;
  addXP(5); setThought(chooseThought(),true); animateCat(); spawnParticles(); playCuteSound();
  updateCareUI(); checkAchievements(); renderAll(); saveState();
  window.dispatchEvent(new CustomEvent("pixel-cat-care-action",{detail:{action:"pet",at:new Date().toISOString()}}));
}
$("pet-button").addEventListener("click", petCat);
$("pet-again").addEventListener("click", petCat);

/* Care and fullness */
function updateCareUI() {
  const fullness = Math.round(state.fullness);
  $("fullness-label").textContent = `${fullness}%`;
  $("fullness-fill").style.width = `${fullness}%`;
  $("fullness-fill").style.background = fullness <= 25 ? "#ed6298" : fullness <= 55 ? "#e6b65d" : "#85c77d";
  $("care-status").textContent = fullness <= 25 ? "Котик проголодался. Пора покормить его! 🥣" : fullness <= 55 ? "Котик уже хочет вкусняшку 🍓" : "Котик доволен и полон сил 💗";
  $("feed-cat").textContent = fullness <= 25 ? "🥣 ПОКОРМИТЬ СКОРЕЕ" : "🥣 ПОКОРМИТЬ";
}
function updateFullness() {
  const now = Date.now(); const step = 15*60*1000;
  const steps = Math.floor(Math.max(0,now-state.lastHungerUpdate)/step);
  if (steps>0) { state.fullness=Math.max(0,state.fullness-steps*5); state.lastHungerUpdate+=steps*step; saveState(); }
  updateCareUI();
}
function feedCat() {
  updateFullness();
  if (state.fullness >= 100) { showToast("Котик сыт и доволен! 💗"); return; }
  const now=Date.now(); state.fullness=Math.min(100,state.fullness+35); state.lastFedAt=now; state.lastCareAt=now; state.lastHungerUpdate=now;
  addXP(3); setThought("Мур-р! Очень вкусно. 🍓"); playCuteSound(); updateCareUI(); renderAll(); saveState();
  window.dispatchEvent(new CustomEvent("pixel-cat-care-action",{detail:{action:"feed",at:new Date().toISOString()}}));
}
$("feed-cat").addEventListener("click",feedCat);

/* Skins and theme */
function setSkin(id) {
  if (!own(skins,id)) return;
  if (!state.unlockedSkins.includes(id)) { showToast("Этот скин откроется на 3-м уровне! ★"); return; }
  state.skin=id; renderCat(); renderSkins(); saveState(); playCuteSound();
}
function renderSkins() {
  document.querySelectorAll("[data-skin]").forEach((button)=>{
    const id=button.dataset.skin, unlocked=state.unlockedSkins.includes(id);
    button.classList.toggle("selected",state.skin===id); button.classList.toggle("locked",!unlocked);
    button.setAttribute("aria-pressed",String(state.skin===id));
    button.setAttribute("aria-label",unlocked?`Выбрать скин ${skins[id].name}`:`${skins[id].name}, откроется на третьем уровне`);
  });
}
document.querySelectorAll("[data-skin]").forEach((button)=>button.addEventListener("click",()=>setSkin(button.dataset.skin)));
function setTheme(theme) {
  state.theme=theme==="night"?"night":"day"; document.body.dataset.theme=state.theme; $("game-world").dataset.theme=state.theme;
  const isDay=state.theme==="day"; $("day-button").classList.toggle("selected",isDay); $("night-button").classList.toggle("selected",!isDay);
  $("day-button").setAttribute("aria-pressed",String(isDay)); $("night-button").setAttribute("aria-pressed",String(!isDay)); $("full-theme").textContent=isDay?"☾ НОЧЬ":"☀ ДЕНЬ";
  const meta=document.querySelector('meta[name="theme-color"]'); if(meta)meta.content=isDay?"#ffb8d2":"#292442";
  renderWeather(); saveState();
}
$("day-button").addEventListener("click",()=>setTheme("day")); $("night-button").addEventListener("click",()=>setTheme("night"));

/* Location and scene */
function updateLocationDisplay() {
  const location=currentLocation(), idx=locationIndex();
  $("game-world").dataset.location=location.id; $("location-icon").textContent=location.icon;
  $("location-name").textContent=location.name; $("location-description").textContent=location.description;
  $("current-world-label").textContent=location.name; $("fullscreen-location").textContent=location.name;
  $("scene-caption-text").textContent=location.caption; $("world-count").textContent=`МИР ${idx+1} / ${locations.length}`;
  $("world-card-art").dataset.location=location.id;
  renderWorldGrid();
}
function setLocation(index) {
  const nextIndex=(index+locations.length)%locations.length; const nextId=locations[nextIndex].id;
  if(nextId!==state.location) state.daily.worlds+=1;
  state.location=nextId; if(!state.visitedLocations.includes(nextId))state.visitedLocations.push(nextId);
  updateLocationDisplay(); lastThought=""; setThought(currentLocation().intro); renderAll(); scheduleSecretSpawn(); checkAchievements(); saveState(); playCuteSound();
}
function renderWorldGrid() {
  const grid=$("world-grid"); grid.replaceChildren();
  for(const location of locations) {
    const button=document.createElement("button"); button.type="button"; button.className="world-choice"; button.dataset.world=location.id;
    button.classList.toggle("selected",location.id===state.location); button.setAttribute("aria-pressed",String(location.id===state.location));
    const art=document.createElement("span"); art.className="world-choice-art"; art.textContent=location.icon;
    const copy=document.createElement("span"); copy.className="world-choice-copy";
    const title=document.createElement("strong"); title.textContent=location.name;
    const desc=document.createElement("small"); desc.textContent=location.description;
    const secret=document.createElement("small"); secret.textContent=state.secretsFound.includes(location.id)?"✨ СЕКРЕТ НАЙДЕН":"✦ ЕЩЁ ЕСТЬ СЕКРЕТ";
    copy.append(title,desc,secret); button.append(art,copy); grid.appendChild(button);
  }
}
$("world-grid").addEventListener("click",(event)=>{const b=event.target.closest("[data-world]");if(!b)return;const i=locations.findIndex((x)=>x.id===b.dataset.world);if(i>=0)setLocation(i);activateView("view-worlds");});

function renderWeather() {
  const weather=weatherTypes.find((item)=>item.id===state.weather)||weatherTypes[0];
  $("game-world").dataset.weather=state.weather; $("game-world").dataset.theme=state.theme;
  $("weather-label").textContent=`${weather.icon} ${weather.name}`; $("weather-button").textContent=`${weather.icon} ПОГОДА`;
  document.querySelectorAll("[data-weather]").forEach((button)=>{if(button.tagName==="BUTTON"){button.classList.toggle("selected",button.dataset.weather===state.weather);button.setAttribute("aria-pressed",String(button.dataset.weather===state.weather));}});
  const layer=$("weather-layer"); layer.replaceChildren();
  if(state.weather==="sun") {const obj=document.createElement("span");obj.className=state.theme==="night"?"weather-moon":"weather-sun";obj.textContent=state.theme==="night"?"☾":"☀";layer.appendChild(obj);return;}
  const count=state.weather==="rain"?24:20;
  for(let i=0;i<count;i++){const p=document.createElement("span");p.className=state.weather==="rain"?"weather-particle":"weather-particle snowflake";p.style.left=`${Math.random()*98}%`;p.style.animationDelay=`${-Math.random()*3}s`;p.style.animationDuration=state.weather==="rain"?`${.7+Math.random()*.7}s`:`${2+Math.random()*3}s`;layer.appendChild(p);}
}
function setWeather(id,quiet=false){if(!weatherTypes.some((x)=>x.id===id))return;state.weather=id;renderWeather();saveState();if(!quiet)playCuteSound();}
function cycleWeather(quiet=false){const i=weatherTypes.findIndex((x)=>x.id===state.weather);setWeather(weatherTypes[(i+1)%weatherTypes.length].id,quiet);}
function setupWeatherTimer(){clearInterval(weatherTimer);weatherTimer=setInterval(()=>{if(state.autoWeather)cycleWeather(true);},90000);}
document.querySelectorAll("[data-weather]").forEach((button)=>{if(button.id!=="weather-button")button.addEventListener("click",()=>setWeather(button.dataset.weather));});
$("weather-button").addEventListener("click",()=>cycleWeather()); $("prev-location").addEventListener("click",()=>setLocation(locationIndex()-1)); $("next-location").addEventListener("click",()=>setLocation(locationIndex()+1));

/* Secrets */
function scheduleSecretSpawn() {
  clearTimeout(secretTimeout); const secret=$("secret-item"); secret.hidden=true;
  if(state.secretsFound.includes(state.location))return;
  secretTimeout=setTimeout(()=>{
    if(state.secretsFound.includes(state.location))return;
    secret.style.left=`${12+Math.random()*75}%`;secret.style.top=`${43+Math.random()*32}%`;
    secret.textContent=["✨","💎","⭐","🌸"][Math.floor(Math.random()*4)];secret.hidden=false;
  },2500+Math.random()*2200);
}
$("secret-item").addEventListener("click",()=>{
  const id=state.location;if(state.secretsFound.includes(id))return;state.secretsFound.push(id);
  const reward=8+Math.floor(Math.random()*8);state.coins+=reward;$("secret-item").hidden=true;
  setThought(`Ты нашёл секрет! +${reward} монеток ✨`);showToast(`СЕКРЕТ НАЙДЕН! +${reward} ◆`);
  checkAchievements();renderAll();saveState();playCuteSound(true);
});

/* Shop and fitting room */
function renderShop() {
  const shop=$("accessory-shop");shop.replaceChildren();
  for(const item of accessories){
    if(shopFilter!=="all"&&item.category!==shopFilter)continue;
    const owned=item.id==="none"||state.ownedAccessories.includes(item.id);
    const equipped=item.id==="none"?!state.accessory:state.accessory===item.id;
    const previewing=previewAccessory===item.id;
    const card=document.createElement("article");card.className="accessory-card";
    const icon=document.createElement("div");icon.className="accessory-icon";icon.textContent=item.icon;
    const title=document.createElement("h3");title.textContent=item.name;
    const desc=document.createElement("p");desc.textContent=item.description;
    const price=document.createElement("span");price.className="price-label";price.textContent=item.id==="none"?"Бесплатно":owned?"В коллекции":`Цена: ◆ ${item.price}`;
    const tryButton=document.createElement("button");tryButton.type="button";tryButton.className="shop-button try-on";tryButton.dataset.previewAccessory=item.id;tryButton.textContent=previewing?"ПРИМЕРЕНО ✓":"ПРИМЕРИТЬ";
    const action=document.createElement("button");action.type="button";action.className="shop-button";action.dataset.shopAction=item.id;
    if(equipped){action.textContent="НАДЕТО ✓";action.classList.add("equipped");}
    else if(item.id==="none")action.textContent="СНЯТЬ АКСЕССУАР";
    else if(owned)action.textContent="НАДЕТЬ";
    else {action.textContent=`КУПИТЬ ◆ ${item.price}`;action.disabled=state.coins<item.price;}
    card.append(icon,title,desc,price,tryButton,action);shop.appendChild(card);
  }
}
function handleShopAction(id) {
  const item=accessories.find((a)=>a.id===id);if(!item)return;
  if(id==="none"){state.accessory=null;previewAccessory=null;renderAll();saveState();return;}
  if(state.ownedAccessories.includes(id)){state.accessory=state.accessory===id?null:id;previewAccessory=null;}
  else {if(state.coins<item.price){showToast("Пока не хватает монеток. Погладь котика или выполни задание! ◆");return;}state.coins-=item.price;state.ownedAccessories.push(id);state.accessory=id;previewAccessory=null;showToast(`Покупка: ${item.name}!`);}
  renderAll();checkAchievements();saveState();playCuteSound();
}
$("accessory-shop").addEventListener("click",(event)=>{
  const preview=event.target.closest("[data-preview-accessory]");const action=event.target.closest("[data-shop-action]");
  if(preview){previewAccessory=preview.dataset.previewAccessory;renderCat();renderShop();showToast("Примерка готова! Покупка не совершена.");return;}
  if(action)handleShopAction(action.dataset.shopAction);
});
document.querySelectorAll("[data-shop-filter]").forEach((button)=>button.addEventListener("click",()=>{
  shopFilter=button.dataset.shopFilter;document.querySelectorAll("[data-shop-filter]").forEach((b)=>b.classList.toggle("selected",b===button));renderShop();
}));

/* Daily rewards & quests */
function renderDailyReward(){
  const already=state.dailyRewardDate===todayKey();const bonus=20+Math.min(20,Math.max(0,state.dailyStreak-1)*2);
  $("daily-streak").textContent=`🔥 Серия: ${state.dailyStreak} ${state.dailyStreak===1?"день":"дней"}`;
  $("daily-reward-description").textContent=already?"Подарок уже получен. Возвращайся завтра!":`Сегодня тебя ждут ${bonus} монеток и 10 XP.`;
  $("daily-reward-button").disabled=already;$("daily-reward-button").textContent=already?"УЖЕ ПОЛУЧЕНО ✓":`ЗАБРАТЬ ◆ ${bonus}`;
  $("daily-peek-text").textContent=already?"Подарок получен — до завтра!":"Загляни за наградой дня!";
}
function claimDailyReward(){
  if(state.dailyRewardDate===todayKey()){showToast("Ты уже получил сегодняшний подарок. Возвращайся завтра! 🎁");return;}
  const bonus=20+Math.min(20,Math.max(0,state.dailyStreak-1)*2);state.coins+=bonus;state.dailyRewardDate=todayKey();addXP(10);
  showToast(`ЕЖЕДНЕВНЫЙ ПОДАРОК! +${bonus} ◆ и 10 XP`);renderAll();saveState();playCuteSound(true);
}
$("daily-reward-button").addEventListener("click",claimDailyReward);
function renderDailyQuests(){
  const box=$("daily-quests");box.replaceChildren();
  for(const quest of dailyQuestDef){
    const progress=Math.min(quest.target,safeInt(state.daily[quest.metric]));const claimed=state.daily.claimed.includes(quest.id);const complete=progress>=quest.target;
    const card=document.createElement("article");card.className="quest-card";
    const head=document.createElement("div");head.className="quest-head";
    const title=document.createElement("strong");title.textContent=quest.title;
    const reward=document.createElement("span");reward.className="quest-reward";reward.textContent=`◆ ${quest.coins} + ${quest.xp} XP`;
    head.append(title,reward);
    const desc=document.createElement("p");desc.textContent=quest.description;
    const line=document.createElement("div");line.className="quest-progress-line";
    const track=document.createElement("div");track.className="quest-track";
    const fill=document.createElement("span");fill.style.width=`${progress/quest.target*100}%`;track.appendChild(fill);
    const count=document.createElement("span");count.className="quest-count";count.textContent=`${progress}/${quest.target}`;line.append(track,count);
    const claim=document.createElement("button");claim.type="button";claim.className="quest-claim";claim.dataset.claimQuest=quest.id;
    if(claimed){claim.textContent="ЗАБРАНО ✓";claim.disabled=true;claim.classList.add("claimed");}
    else if(complete)claim.textContent="ЗАБРАТЬ НАГРАДУ";
    else{claim.textContent="В ПРОЦЕССЕ";claim.disabled=true;}
    card.append(head,desc,line,claim);box.appendChild(card);
  }
}
$("daily-quests").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-claim-quest]");if(!button)return;
  const quest=dailyQuestDef.find((item)=>item.id===button.dataset.claimQuest);if(!quest)return;
  if(state.daily.claimed.includes(quest.id)||state.daily[quest.metric]<quest.target)return;
  state.daily.claimed.push(quest.id);state.coins+=quest.coins;addXP(quest.xp);showToast(`ЗАДАНИЕ ВЫПОЛНЕНО! +${quest.coins} ◆ и ${quest.xp} XP`);renderAll();saveState();playCuteSound(true);
});

/* Achievements and collection */
function renderAchievements(){
  const box=$("achievements-list");box.replaceChildren();let count=0;
  for(const item of achievementsDef){const unlocked=state.achievements.includes(item.id);if(unlocked)count++;
    const card=document.createElement("article");card.className=`achievement-item${unlocked?" unlocked":""}`;
    const icon=document.createElement("span");icon.className="achievement-symbol";icon.textContent=unlocked?item.icon:"🔒";
    const title=document.createElement("strong");title.textContent=item.name;
    const desc=document.createElement("p");desc.textContent=unlocked?`${item.description} Награда получена.`:`${item.description} Награда: ${item.reward} ◆`;
    card.append(icon,title,desc);box.appendChild(card);
  }
  $("achievement-counter").textContent=`${count} / ${achievementsDef.length}`;$("achievement-progress-fill").style.width=`${count/achievementsDef.length*100}%`;
}
function renderCollection(){
  const box=$("thought-collection");box.replaceChildren();$("thought-count").textContent=`${state.discoveredThoughts.length} найдено`;
  if(!state.discoveredThoughts.length){const empty=document.createElement("p");empty.className="helper-text";empty.textContent="Пока пусто. Погладь котика, чтобы открыть первые мысли!";box.appendChild(empty);return;}
  for(const text of state.discoveredThoughts){const chip=document.createElement("span");chip.className="thought-chip";chip.textContent=text;box.appendChild(chip);}
}

/* Update stats and rendering */
function updateStats(){
  $("header-level").textContent=String(state.level);$("coin-count").textContent=String(state.coins);$("shop-coins").textContent=String(state.coins);
  $("total-pets").textContent=String(state.clicks);$("games-played").textContent=String(state.miniGamesPlayed);
  $("worlds-visited").textContent=`${state.visitedLocations.length} / ${locations.length}`;$("skins-count").textContent=String(state.unlockedSkins.length);
  $("secrets-count").textContent=`${state.secretsFound.length} / ${locations.length}`;$("arcade-record").textContent=String(state.arcadeRecord);
  $("level").textContent=String(state.level).padStart(2,"0");$("xp-count").textContent=String(state.xp);$("xp-needed").textContent=String(xpNeeded());
  $("xp-fill").style.width=`${Math.min(100,state.xp/xpNeeded()*100)}%`;$("xp-progress").setAttribute("aria-valuenow",String(state.xp));$("xp-progress").setAttribute("aria-valuemax",String(xpNeeded()));
}
function renderAll(){updateStats();renderSkins();renderCat();renderShop();renderWorldGrid();renderDailyQuests();renderDailyReward();renderAchievements();renderCollection();renderWeather();updateAudioControls();updateCareUI();}

/* Fullscreen gameplay */
async function enterFullscreen(){
  try{if(!document.fullscreenElement)await $("game-world").requestFullscreen();else if(document.fullscreenElement!==$("game-world")){await document.exitFullscreen();await $("game-world").requestFullscreen();}}
  catch{fullscreenFallback=true;document.body.classList.add("is-fullscreen");showToast("Включён полноэкранный вид страницы. Нажми «ВЫХОД», чтобы вернуться.");}
}
async function exitFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();}catch{}document.body.classList.remove("is-fullscreen");fullscreenFallback=false;}
$("fullscreen-button").addEventListener("click",enterFullscreen);$("full-exit").addEventListener("click",exitFullscreen);$("full-pet").addEventListener("click",petCat);$("full-theme").addEventListener("click",()=>setTheme(state.theme==="day"?"night":"day"));$("full-prev").addEventListener("click",()=>setLocation(locationIndex()-1));$("full-next").addEventListener("click",()=>setLocation(locationIndex()+1));
document.addEventListener("fullscreenchange",()=>{const full=document.fullscreenElement===$("game-world");document.body.classList.toggle("is-fullscreen",full);$("fullscreen-button").textContent=full?"⛶ ВЫЙТИ ИЗ ЭКРАНА":"⛶ НА ВЕСЬ ЭКРАН";});

/* Mini-game */
function openMinigame(){$("minigame-modal").hidden=false;$("minigame-intro").hidden=false;$("minigame-arena-wrap").hidden=true;$("minigame-result").hidden=true;}
function moveMiniTarget(){const target=$("mini-target");const golden=Math.random()<.2;target.classList.toggle("golden",golden);target.textContent=golden?"✨":miniType==="fish"?"🐟":"🐭";target.style.left=`${10+Math.random()*78}%`;target.style.top=`${12+Math.random()*72}%`;target.dataset.golden=String(golden);}
function startMiniGame(type){clearInterval(miniTimer);miniType=type;miniScore=0;miniBonus=0;miniTimeLeft=20;miniRunning=true;$("minigame-intro").hidden=true;$("minigame-result").hidden=true;$("minigame-arena-wrap").hidden=false;$("minigame-time").textContent="20";$("minigame-score").textContent="0";$("minigame-title").textContent=type==="fish"?"Лови рыбок!":"Лови мышек!";moveMiniTarget();playCuteSound();miniTimer=setInterval(()=>{miniTimeLeft--;$("minigame-time").textContent=String(miniTimeLeft);if(miniTimeLeft<=0)finishMiniGame();},1000);}
function catchMiniTarget(){if(!miniRunning)return;const golden=$("mini-target").dataset.golden==="true";miniScore+=golden?3:1;if(golden)miniBonus++;$("minigame-score").textContent=String(miniScore);moveMiniTarget();playTone(golden?1100:880,.08);}
function finishMiniGame(){if(!miniRunning)return;miniRunning=false;clearInterval(miniTimer);miniTimer=null;state.miniGamesPlayed++;state.daily.games++;const reward=Math.max(2,Math.floor(miniScore/2)+2+miniBonus*2);const earnedXP=miniScore*2;state.coins+=reward;addXP(earnedXP);const newRecord=miniScore>state.arcadeRecord;state.arcadeRecord=Math.max(state.arcadeRecord,miniScore);$("minigame-arena-wrap").hidden=true;$("minigame-result").hidden=false;$("minigame-result-text").textContent=`Попаданий: ${miniScore}. Ты получил ${reward} монеток и ${earnedXP} XP!`;$("minigame-record-message").textContent=newRecord?"🏆 НОВЫЙ РЕКОРД!":`Твой рекорд: ${state.arcadeRecord}`;checkAchievements();renderAll();saveState();playCuteSound(true);}
function resetMinigameScreen(){clearInterval(miniTimer);miniTimer=null;miniRunning=false;$("minigame-intro").hidden=false;$("minigame-arena-wrap").hidden=true;$("minigame-result").hidden=true;}
function closeMinigame(){if(miniRunning)finishMiniGame();$("minigame-modal").hidden=true;resetMinigameScreen();}
$("minigame-open").addEventListener("click",openMinigame);$("start-fish").addEventListener("click",()=>startMiniGame("fish"));$("start-mouse").addEventListener("click",()=>startMiniGame("mouse"));$("mini-target").addEventListener("click",catchMiniTarget);$("minigame-stop").addEventListener("click",finishMiniGame);$("minigame-close").addEventListener("click",closeMinigame);$("minigame-again").addEventListener("click",resetMinigameScreen);$("minigame-modal").addEventListener("click",(event)=>{if(event.target===$("minigame-modal"))closeMinigame();});

/* Settings + notifications options */
function updateAudioControls(){
  $("sound-toggle").textContent=state.soundOn?"ЗВУК: ВКЛ":"ЗВУК: ВЫКЛ";$("music-toggle").textContent=state.musicOn?"МУЗЫКА: ВКЛ":"МУЗЫКА: ВЫКЛ";
  $("sound-toggle").setAttribute("aria-pressed",String(state.soundOn));$("music-toggle").setAttribute("aria-pressed",String(state.musicOn));
  $("volume-slider").value=String(state.volume);$("volume-value").textContent=`${state.volume}%`;$("auto-weather").checked=state.autoWeather;$("reduce-motion").checked=state.reduceMotion;
  document.body.classList.toggle("reduce-motion",state.reduceMotion);
}
$("sound-toggle").addEventListener("click",()=>{state.soundOn=!state.soundOn;updateAudioControls();saveState();if(state.soundOn)playCuteSound();});
$("music-toggle").addEventListener("click",()=>{state.musicOn=!state.musicOn;if(state.musicOn)startMusic();else{clearInterval(musicTimer);musicTimer=null;}updateAudioControls();saveState();if(state.musicOn)playCuteSound();});
$("volume-slider").addEventListener("input",(event)=>{state.volume=Number(event.target.value);$("volume-value").textContent=`${state.volume}%`;saveState();});
$("auto-weather").addEventListener("change",(event)=>{state.autoWeather=event.target.checked;saveState();});
$("reduce-motion").addEventListener("change",(event)=>{state.reduceMotion=event.target.checked;updateAudioControls();saveState();});

/* Daily gift, quests, backup and keyboard handlers */
$("welcome-start").addEventListener("click",()=>{state.welcomeSeen=true;$("welcome-modal").hidden=true;saveState();playCuteSound();});
$("daily-quests").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-claim-quest]");if(!button)return;
  const quest=dailyQuestDef.find((item)=>item.id===button.dataset.claimQuest);if(!quest||state.daily.claimed.includes(quest.id)||state.daily[quest.metric]<quest.target)return;
  state.daily.claimed.push(quest.id);state.coins+=quest.coins;addXP(quest.xp);showToast(`ЗАДАНИЕ ВЫПОЛНЕНО! +${quest.coins} ◆ и ${quest.xp} XP`);renderAll();saveState();playCuteSound(true);
});

/* Backup export/import */
$("export-save").addEventListener("click",()=>{
  try{state._savedAt=Date.now();const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`pixel-cat-save-${todayKey()}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("РЕЗЕРВНАЯ КОПИЯ ПОДГОТОВЛЕНА! 💾");}catch{showToast("Не удалось создать резервную копию.");}
});
$("import-save").addEventListener("change",async(event)=>{
  const file=event.target.files?.[0];if(!file)return;
  try{const data=JSON.parse(await file.text());if(!data||typeof data!=="object"||(!own(data,"clicks")&&!own(data,"level")))throw new Error("invalid save");if(!confirm("Заменить текущий локальный прогресс данными файла?"))return;const deluxeKey=SAVE_KEY==="pixelCatClubSave"?"pixelCatClubDeluxeSave":`pixelCatClubDeluxeSave:${SAVE_KEY.slice("pixelCatClubSave:".length)}`;localStorage.removeItem(deluxeKey);localStorage.setItem(SAVE_KEY,JSON.stringify(data));location.reload();}catch{showToast("Не удалось прочитать файл сохранения.");}finally{event.target.value="";}
});
$("reset-button").addEventListener("click",()=>{
  if(!confirm("Сбросить уровень, монетки, покупки, достижения, секреты и задания? Настройки звука и темы останутся."))return;
  const preserved={theme:state.theme,weather:state.weather,soundOn:state.soundOn,musicOn:state.musicOn,volume:state.volume,autoWeather:state.autoWeather,reduceMotion:state.reduceMotion,welcomeSeen:true};
  const deluxeKey = SAVE_KEY === "pixelCatClubSave" ? "pixelCatClubDeluxeSave" : `pixelCatClubDeluxeSave:${SAVE_KEY.slice("pixelCatClubSave:".length)}`;
  try { localStorage.removeItem(deluxeKey); } catch {}
  const fresh=freshState();Object.keys(state).forEach((key)=>delete state[key]);Object.assign(state,fresh,preserved);window.dispatchEvent(new CustomEvent("pixel-cat-reset"));previewAccessory=null;lastThought="";renderInitialState();setThought("Начинаем новое приключение! 💗");saveState();showToast("Прогресс сброшен. Время для нового приключения!");
});

/* Keyboard shortcuts */
document.addEventListener("keydown",(event)=>{
  if(event.key==="Escape"){
    if(!$ ("minigame-modal").hidden)closeMinigame();
    if(document.fullscreenElement===$("game-world"))exitFullscreen();
    return;
  }
  if(!$ ("minigame-modal").hidden||!$("welcome-modal").hidden)return;
  const target=event.target;
  if(["INPUT","TEXTAREA","SELECT","BUTTON","A"].includes(target.tagName)||target.isContentEditable)return;
  if(event.code==="Space"){event.preventDefault();petCat();}
  else if(event.key.toLowerCase()==="n")setTheme(state.theme==="day"?"night":"day");
  else if(event.key.toLowerCase()==="l")setLocation(locationIndex()+1);
  else if(event.key.toLowerCase()==="m"){state.soundOn=!state.soundOn;updateAudioControls();saveState();if(state.soundOn)playCuteSound();}
  else if(event.key==="ArrowLeft")setLocation(locationIndex()-1);
  else if(event.key==="ArrowRight")setLocation(locationIndex()+1);
});

/* Setup & app init */
function renderInitialState(){
  document.body.dataset.theme=state.theme;
  updateLocationDisplay();
  setTheme(state.theme);
  renderAll();
  checkAchievements();
  setThought(state.clicks>0?"С возвращением, мой любимый человек! ♡":"Мяу! Погладь меня 💗");
  if(!state.welcomeSeen)$("welcome-modal").hidden=false;
  resetIdleTimer();scheduleSecretSpawn();saveState();
}

setupWeatherTimer();
renderInitialState();
updateFullness();
setInterval(updateFullness,60000);
blinkTimer=setInterval(blinkCat,3500);
