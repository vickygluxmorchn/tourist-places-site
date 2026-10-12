"use strict";

const state = {
  q: "",
  category: "All",
  sort: "rating",
  favoritesOnly: false,
  places: [],
  categories: [],
  favorites: loadFavorites(),
  openId: null,
};

const $ = (id) => document.getElementById(id);
const gridEl = $("grid");
const chipsEl = $("chips");
const countEl = $("result-count");
const messageEl = $("message");
const modal = $("modal");

/* ---------- favourites (stored in the browser) ---------- */
function loadFavorites() {
  try {
    const raw = localStorage.getItem("wanderly:favorites");
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("wanderly:favorites", JSON.stringify([...state.favorites]));
  } catch {
    /* storage unavailable: favourites just last for this visit */
  }
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveFavorites();
}

/* ---------- small DOM helper ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradient(hue) {
  return `linear-gradient(135deg, hsl(${hue} 70% 42%), hsl(${(hue + 40) % 360} 75% 58%))`;
}

/* ---------- API ---------- */
async function fetchPlaces() {
  const params = new URLSearchParams({ sort: state.sort });
  if (state.q) params.set("q", state.q);
  if (state.category !== "All") params.set("category", state.category);

  const response = await fetch(`/api/places?${params.toString()}`);
  if (!response.ok) throw new Error("Could not load places.");
  return response.json();
}

async function load() {
  messageEl.textContent = "Loading places...";
  messageEl.className = "message";
  try {
    const data = await fetchPlaces();
    state.places = data.places;
    if (state.categories.length === 0) {
      state.categories = ["All", ...data.categories];
      renderChips();
    }
    messageEl.textContent = "";
    render();
  } catch (err) {
    state.places = [];
    messageEl.textContent = err.message + " Please try again.";
    messageEl.className = "message error";
    render();
  }
}

/* ---------- rendering ---------- */
function visiblePlaces() {
  return state.favoritesOnly
    ? state.places.filter((p) => state.favorites.has(p.id))
    : state.places;
}

function renderChips() {
  chipsEl.replaceChildren();
  state.categories.forEach((cat) => {
    const chip = el("button", "chip" + (cat === state.category ? " active" : ""), cat);
    chip.type = "button";
    chip.addEventListener("click", () => {
      state.category = cat;
      renderChips();
      load();
    });
    chipsEl.appendChild(chip);
  });
}

function renderCard(place) {
  const card = el("button", "card");
  card.type = "button";
  card.setAttribute("aria-label", `${place.name}, ${place.country}. Open details`);

  const banner = el("div", "card-banner", place.emoji);
  banner.style.background = gradient(place.hue);
  banner.appendChild(el("span", "badge", place.category));
  if (state.favorites.has(place.id)) banner.appendChild(el("span", "heart", "♥"));

  const body = el("div", "card-body");
  body.appendChild(el("h2", "", place.name));

  const meta = el("p", "meta");
  meta.appendChild(document.createTextNode(`${place.country} · `));
  meta.appendChild(el("span", "rating", `★ ${place.rating.toFixed(1)}`));
  body.appendChild(meta);
  body.appendChild(el("p", "", `Best time: ${place.bestTime}`));

  card.append(banner, body);
  card.addEventListener("click", () => openModal(place));
  return card;
}

function render() {
  const list = visiblePlaces();
  gridEl.replaceChildren(...list.map(renderCard));
  countEl.textContent = `${list.length} place${list.length === 1 ? "" : "s"} found`;

  if (list.length === 0 && !messageEl.classList.contains("error")) {
    messageEl.textContent = state.favoritesOnly
      ? "You have no favourites yet. Open a place and tap Save."
      : "No places match your search.";
  } else if (!messageEl.classList.contains("error")) {
    messageEl.textContent = "";
  }
}

/* ---------- modal ---------- */
function updateModalFavButton() {
  const saved = state.favorites.has(state.openId);
  const btn = $("modal-fav");
  btn.textContent = saved ? "♥ Saved to favourites" : "♡ Save to favourites";
  btn.classList.toggle("saved", saved);
}

function openModal(place) {
  state.openId = place.id;
  const banner = $("modal-banner");
  banner.textContent = place.emoji;
  banner.style.background = gradient(place.hue);

  $("modal-title").textContent = place.name;
  $("modal-meta").textContent = `${place.country} · ${place.category} · ★ ${place.rating.toFixed(1)}`;
  $("modal-desc").textContent = place.description;
  $("modal-best").textContent = place.bestTime;
  $("modal-highlights").replaceChildren(...place.highlights.map((h) => el("li", "", h)));
  updateModalFavButton();

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

$("modal-close").addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.close(); // click on the backdrop
});
modal.addEventListener("close", render); // refresh hearts after closing

$("modal-fav").addEventListener("click", () => {
  toggleFavorite(state.openId);
  updateModalFavButton();
});

/* ---------- controls ---------- */
let searchTimer;
$("search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = e.target.value.trim();
    load();
  }, 250);
});

$("sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  load();
});

$("fav-toggle").addEventListener("click", (e) => {
  state.favoritesOnly = !state.favoritesOnly;
  e.currentTarget.setAttribute("aria-pressed", String(state.favoritesOnly));
  render();
});

/* ---------- API health indicator ---------- */
async function checkHealth() {
  const statusEl = $("api-status");
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error();
    statusEl.textContent = "online";
    statusEl.className = "ok";
  } catch {
    statusEl.textContent = "offline";
    statusEl.className = "down";
  }
}

load();
checkHealth();
