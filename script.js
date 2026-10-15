// ===== Configuración =====
const API_URL = "https://thronesapi.com/api/v2/Characters";

// Si el navegador bloquea la API (CORS), se reintenta con estas rutas en orden.
// La primera solo existe si abriste el juego con "node server.js" (puerto 3000).
const enc = encodeURIComponent;
const PROXIES = [
  { build: (u) => "/proxy?url=" + enc(u), onlyLocalServer: true },
  { build: (u) => u },
  { build: (u) => "https://api.codetabs.com/v1/proxy?quest=" + u },
  { build: (u) => "https://api.allorigins.win/get?url=" + enc(u), wrapped: true },
  { build: (u) => "https://api.allorigins.win/raw?url=" + enc(u) },
];
const TOTAL_ROUNDS = 10;
const OPTIONS_PER_QUESTION = 4;

// Casas reconocidas. La API escribe algunas con errores ("Lanister", "Targaryan")
// o con "House ..." delante, así que cada casa tiene sus variantes.
const HOUSES = [
  { name: "Stark", aliases: ["stark"] },
  { name: "Lannister", aliases: ["lannister", "lanister"] },
  { name: "Targaryen", aliases: ["targaryen", "targaryan"] },
  { name: "Baratheon", aliases: ["baratheon"] },
  { name: "Greyjoy", aliases: ["greyjoy"] },
  { name: "Tyrell", aliases: ["tyrell"] },
  { name: "Tully", aliases: ["tully"] },
  { name: "Martell", aliases: ["martell"] },
  { name: "Bolton", aliases: ["bolton"] },
  { name: "Arryn", aliases: ["arryn"] },
  { name: "Frey", aliases: ["frey"] },
  { name: "Mormont", aliases: ["mormont"] },
  { name: "Tarly", aliases: ["tarly"] },
  { name: "Clegane", aliases: ["clegane"] },
];

// ===== Estado =====
let characters = [];
let housesInPlay = [];
let round = 0;
let score = 0;
let streak = 0;

// ===== Elementos =====
const $ = (id) => document.getElementById(id);
const photoEl = $("photo");
const nameEl = $("name");
const titleEl = $("title");
const optionsEl = $("options");
const feedbackEl = $("feedback");
const nextBtn = $("next");

// ===== Utilidades =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// "House Lanister" -> "Lannister" ; "Unknown" -> null
function normalizeHouse(family) {
  if (!family) return null;
  const f = family.toLowerCase().replace("house", "").trim();
  const house = HOUSES.find((h) => h.aliases.some((a) => f.includes(a)));
  return house ? house.name : null;
}

// ===== API =====
async function fetchJson(url) {
  let lastError;
  for (const p of PROXIES) {
    if (p.onlyLocalServer && location.port !== "3000") continue;
    const target = p.build(url);
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const body = await res.json();
      return p.wrapped ? JSON.parse(body.contents) : body;
    } catch (err) {
      console.warn("Falló:", target, err);
      lastError = err;
    }
  }
  throw lastError;
}

async function loadCharacters() {
  const data = await fetchJson(API_URL);
  return data
    .map((c) => ({
      name: c.fullName || `${c.firstName} ${c.lastName}`.trim(),
      title: c.title && c.title !== "None" ? c.title : "",
      image: c.imageUrl,
      house: normalizeHouse(c.family),
    }))
    .filter((c) => c.name && c.house); // solo personajes con casa conocida
}

// ===== Juego =====
async function startGame() {
  round = 0;
  score = 0;
  streak = 0;
  $("end").hidden = true;
  $("game").hidden = false;
  $("total").textContent = TOTAL_ROUNDS;
  updateStats();

  nameEl.textContent = "Cargando personajes…";
  titleEl.textContent = "";
  photoEl.hidden = true;
  optionsEl.innerHTML = "";
  feedbackEl.textContent = "";

  try {
    const all = await loadCharacters();
    if (all.length === 0) throw new Error("Sin personajes");
    characters = shuffle(all).slice(0, TOTAL_ROUNDS);
    // Casas que aparecen en la API (para alternativas creíbles)
    housesInPlay = [...new Set(all.map((c) => c.house))];
    if (housesInPlay.length < OPTIONS_PER_QUESTION) {
      housesInPlay = HOUSES.map((h) => h.name);
    }
    nextQuestion();
  } catch (err) {
    console.error(err);
    nameEl.textContent = "No se pudieron cargar los personajes.";
    titleEl.textContent = "(" + err.message + ") Recarga la página.";
  }
}

function nextQuestion() {
  if (round >= characters.length) return endGame();

  const c = characters[round];
  round++;
  updateStats();

  nameEl.textContent = c.name;
  titleEl.textContent = c.title;
  if (c.image) {
    photoEl.src = c.image;
    photoEl.alt = c.name;
    photoEl.hidden = false;
  } else {
    photoEl.hidden = true;
  }
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  nextBtn.hidden = true;

  // 1 casa correcta + 3 incorrectas
  const wrong = shuffle(housesInPlay.filter((h) => h !== c.house)).slice(
    0,
    OPTIONS_PER_QUESTION - 1
  );
  const options = shuffle([c.house, ...wrong]);

  optionsEl.innerHTML = "";
  options.forEach((house) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = "Casa " + house;
    btn.dataset.house = house;
    btn.onclick = () => answer(btn, house, c.house);
    optionsEl.appendChild(btn);
  });
}

function answer(btn, chosen, correct) {
  optionsEl.querySelectorAll(".option").forEach((b) => {
    b.disabled = true;
    if (b.dataset.house === correct) b.classList.add("correct");
  });

  if (chosen === correct) {
    score++;
    streak++;
    feedbackEl.textContent = "¡Correcto! 🐺🦁🐉";
    feedbackEl.classList.add("ok");
  } else {
    streak = 0;
    btn.classList.add("wrong");
    feedbackEl.textContent = `Incorrecto. Pertenece a la Casa ${correct}.`;
    feedbackEl.classList.add("bad");
  }

  updateStats();
  nextBtn.textContent = round >= characters.length ? "Ver resultado" : "Siguiente ▶";
  nextBtn.hidden = false;
}

function endGame() {
  $("game").hidden = true;
  $("end").hidden = false;
  const total = characters.length;
  const pct = score / total;
  $("end-title").textContent =
    pct === 1 ? "¡Digno del Trono de Hierro! 👑"
    : pct >= 0.7 ? "Un gran Mano del Rey"
    : pct >= 0.4 ? "Te falta un poco, joven escudero"
    : "No sabes nada, Jon Snow 😅";
  $("end-text").textContent = `Acertaste ${score} de ${total}.`;
}

function updateStats() {
  $("round").textContent = round;
  $("score").textContent = score;
  $("streak").textContent = streak;
}

// ===== Eventos =====
nextBtn.onclick = nextQuestion;
$("restart").onclick = startGame;

startGame();
