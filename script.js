"use strict";

const API_URL = "https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/lieux_culturels_touristiques_evenementiels_visitbrussels_vbx/records?limit=100";
const STORAGE_KEYS = {
    favorites: "brusselsExplorerFavorites",
    preferences: "brusselsExplorerPreferences",
    theme: "brusselsExplorerTheme",
    language: "brusselsExplorerLanguage",
    location: "brusselsExplorerLocation"
};

let places = [];
let filteredPlaces = [];
let favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || [];
let selectedPlaceId = null;
let userLocation = JSON.parse(localStorage.getItem(STORAGE_KEYS.location)) || null;
let map;
let markersLayer;
let toastTimer;

const loading = document.getElementById("loading");
const cardsView = document.getElementById("cards-view");
const tableView = document.getElementById("table-view");
const tableBody = document.getElementById("places-table-body");
const emptyState = document.getElementById("empty-state");
const favoritesGrid = document.getElementById("favorites-grid");
const favoritesEmpty = document.getElementById("favorites-empty");
const resultCount = document.getElementById("result-count");
const favoriteCount = document.getElementById("favorite-count");
const categoryFilter = document.getElementById("category-filter");
const locationFilter = document.getElementById("location-filter");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const locationNote = document.getElementById("location-note");
const modal = document.getElementById("place-modal");
const modalTitle = document.getElementById("modal-title");
const modalCategory = document.getElementById("modal-category");
const modalDetails = document.getElementById("modal-details");
const modalWebsite = document.getElementById("modal-website");
const modalFavorite = document.getElementById("modal-favorite");

window.addEventListener("load", () => {
    setTimeout(() => loading.classList.add("done"), 450);
});

const getField = (record, ...names) => {
    for (const name of names) {
        if (record?.[name] !== undefined && record[name] !== null && String(record[name]).trim() !== "") {
            return record[name];
        }
    }
    return "-";
};

const cleanText = (value) => String(value ?? "-").replace(/<[^>]*>/g, "").trim() || "-";

const normalizePlace = (record) => {
    const fields = record.fields || record;
    const point = fields.add_geo_point_2;

    return {
        id: String(getField(fields, "id", "recordid") === "-" ? crypto.randomUUID() : getField(fields, "id", "recordid")),
        name: cleanText(getField(fields, "translations_nl_name", "translations_fr_name", "translations_en_name")),
        category: cleanText(getField(fields, "visit_category_nl_multi", "visit_category_fr_multi", "visit_category_en_multi")),
        address: cleanText(getField(fields, "translations_nl_address_line1", "translations_fr_address_line1")),
        postal: cleanText(getField(fields, "translations_fr_address_zip", "translations_nl_address_zip")),
        municipality: cleanText(getField(fields, "add_municipality_nl", "add_municipality_fr")),
        phone: cleanText(getField(fields, "translations_fr_phone_contact", "translations_nl_phone_contact")),
        website: cleanText(getField(fields, "translations_fr_website", "translations_nl_website")),
        email: cleanText(getField(fields, "translations_fr_email", "translations_nl_email")),
        accessibility: cleanText(getField(fields, "accessibilities_translations_nl_item", "accessibilities_translations_fr_item")),
        googleMaps: cleanText(getField(fields, "google_maps")),
        updated: getField(fields, "last_updated_at", "published_at"),
        coordinates: parseCoordinates(point)
    };
};

function parseCoordinates(point) {
    if (!Array.isArray(point) || point.length < 2) return null;

    const first = Number(point[0]);
    const second = Number(point[1]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

    // De dataset geeft de geo-punten als twee getallen. Voor Brussel gebruiken we lat, lon.
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
        return [first, second];
    }

    return [second, first];
}

async function fetchPlaces() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP fout ${response.status}`);
        }

        // response.json() geeft ook een Promise terug.
        const jsonPromise = response.json();
        const data = await jsonPromise;
        return data.results.map(normalizePlace);
    } catch (error) {
        console.error("API kon niet geladen worden:", error);
        showToast("De data kon niet geladen worden. Controleer je internetverbinding.");
        throw error;
    }
}

function fillFilterOptions() {
    const categories = [...new Set(places.map(place => place.category).filter(Boolean))].sort();
    const locations = [...new Set(places.map(place => place.municipality).filter(Boolean))].sort();

    categoryFilter.innerHTML = `<option value="all">Alle types</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
    locationFilter.innerHTML = `<option value="all">Alle gemeenten</option>${locations.map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join("")}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const location = locationFilter.value;
    const sort = sortSelect.value;

    filteredPlaces = places.filter(place => {
        const searchableText = `${place.name} ${place.category} ${place.address} ${place.municipality}`.toLowerCase();
        const matchesSearch = search === "" || searchableText.includes(search);
        const matchesCategory = category === "all" || place.category === category;
        const matchesLocation = location === "all" || place.municipality === location;
        return matchesSearch && matchesCategory && matchesLocation;
    });

    if (sort === "name-asc") {
        filteredPlaces.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "name-desc") {
        filteredPlaces.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === "category") {
        filteredPlaces.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    } else if (sort === "recent") {
        filteredPlaces.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    }

    renderPlaces();
    updateMap();
}

function renderPlaces() {
    resultCount.textContent = `${filteredPlaces.length} ${filteredPlaces.length === 1 ? "plaats" : "plaatsen"}`;

    if (!filteredPlaces.length) {
        cardsView.innerHTML = "";
        tableBody.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    cardsView.innerHTML = filteredPlaces.map(place => createPlaceCard(place)).join("");
    tableBody.innerHTML = filteredPlaces.map(place => createTableRow(place)).join("");

    observeCards();
}

function createPlaceCard(place) {
    const isFavorite = favorites.some(favorite => favorite.id === place.id);
    const distance = userLocation && place.coordinates ? calculateDistance(userLocation, place.coordinates) : null;
    const distanceText = distance === null ? "" : `${distance.toFixed(1)} km van jou`;

    return `
        <article class="place-card">
            <div class="card-top">
                <span class="category-pill">${escapeHtml(place.category)}</span>
                <button class="favorite-button ${isFavorite ? "active" : ""}" type="button" data-favorite="${escapeHtml(place.id)}" aria-label="Favoriet">
                    ${isFavorite ? "♥" : "♡"}
                </button>
            </div>
            <h3>${escapeHtml(place.name)}</h3>
            <p class="place-address">${escapeHtml(place.address)} · ${escapeHtml(place.municipality)}</p>
            <div class="place-meta">${escapeHtml(place.phone)}</div>
            <div class="card-bottom">
                <span class="distance">${distanceText}</span>
                <button class="details-button" type="button" data-details="${escapeHtml(place.id)}">Bekijk details →</button>
            </div>
        </article>
    `;
}

function createTableRow(place) {
    const isFavorite = favorites.some(favorite => favorite.id === place.id);
    const website = place.website !== "-"
        ? `<a href="${safeUrl(place.website)}" target="_blank" rel="noopener">Open ↗</a>`
        : "-";

    return `
        <tr>
            <td><strong>${escapeHtml(place.name)}</strong></td>
            <td>${escapeHtml(place.category)}</td>
            <td>${escapeHtml(place.address)}</td>
            <td>${escapeHtml(place.postal)}</td>
            <td>${escapeHtml(place.municipality)}</td>
            <td>${escapeHtml(place.phone)}</td>
            <td>${website}</td>
            <td><button class="table-favorite" data-favorite="${escapeHtml(place.id)}" type="button">${isFavorite ? "♥" : "♡"}</button></td>
        </tr>
    `;
}

function safeUrl(url) {
    try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "#";
    } catch {
        return "#";
    }
}

function observeCards() {
    const cards = document.querySelectorAll(".place-card");
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
}

function renderFavorites() {
    favoriteCount.textContent = favorites.length;

    if (!favorites.length) {
        favoritesGrid.innerHTML = "";
        favoritesEmpty.classList.remove("hidden");
        return;
    }

    favoritesEmpty.classList.add("hidden");
    favoritesGrid.innerHTML = favorites.map(place => createPlaceCard(place)).join("");
    observeCards();
}

function toggleFavorite(placeId) {
    const place = places.find(item => item.id === placeId) || favorites.find(item => item.id === placeId);
    if (!place) return;

    const exists = favorites.some(favorite => favorite.id === placeId);
    favorites = exists
        ? favorites.filter(favorite => favorite.id !== placeId)
        : [...favorites, place];

    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
    renderPlaces();
    renderFavorites();
    updateModalFavorite();
    showToast(exists ? "Verwijderd uit je favorieten." : "Toegevoegd aan je favorieten ♡");
}

function openModal(placeId) {
    const place = places.find(item => item.id === placeId) || favorites.find(item => item.id === placeId);
    if (!place) return;

    selectedPlaceId = place.id;
    modalTitle.textContent = place.name;
    modalCategory.textContent = place.category;
    modalDetails.innerHTML = `
        <div class="modal-detail"><strong>Adres</strong>${escapeHtml(place.address)}, ${escapeHtml(place.postal)} ${escapeHtml(place.municipality)}</div>
        <div class="modal-detail"><strong>Telefoon</strong>${escapeHtml(place.phone)}</div>
        <div class="modal-detail"><strong>E-mail</strong>${escapeHtml(place.email)}</div>
        <div class="modal-detail"><strong>Toegankelijkheid</strong>${escapeHtml(place.accessibility)}</div>
        <div class="modal-detail"><strong>Laatst bijgewerkt</strong>${formatDate(place.updated)}</div>
    `;

    if (place.website !== "-") {
        modalWebsite.href = safeUrl(place.website);
        modalWebsite.classList.remove("hidden");
    } else {
        modalWebsite.classList.add("hidden");
    }

    updateModalFavorite();
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
}

function updateModalFavorite() {
    if (!selectedPlaceId) return;
    const isFavorite = favorites.some(favorite => favorite.id === selectedPlaceId);
    modalFavorite.textContent = isFavorite ? "♥ Favoriet" : "♡ Favoriet";
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("nl-BE");
}

function initMap() {
    map = L.map("map").setView([50.8476, 4.3572], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    updateMap();
}

function updateMap() {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();

    filteredPlaces.forEach(place => {
        if (!place.coordinates) return;

        const marker = L.marker(place.coordinates).addTo(markersLayer);
        marker.bindPopup(`
            <div>
                <p class="popup-title">${escapeHtml(place.name)}</p>
                <span class="popup-category">${escapeHtml(place.category)}</span>
                <p>${escapeHtml(place.municipality)}</p>
                <button type="button" onclick="openModal('${escapeHtml(place.id)}')">Bekijk details</button>
            </div>
        `);
    });
}

function calculateDistance(from, to) {
    const earthRadius = 6371;
    const lat1 = from[0] * Math.PI / 180;
    const lat2 = to[0] * Math.PI / 180;
    const deltaLat = (to[0] - from[0]) * Math.PI / 180;
    const deltaLon = (to[1] - from[1]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function useMyLocation() {
    if (!navigator.geolocation) {
        showToast("Je browser ondersteunt geen locatie.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(userLocation));
            locationNote.textContent = "Locatie opgeslagen. Je ziet nu de afstand bij plaatsen in de buurt.";
            locationNote.classList.remove("hidden");

            filteredPlaces.sort((a, b) => {
                const distanceA = a.coordinates ? calculateDistance(userLocation, a.coordinates) : Infinity;
                const distanceB = b.coordinates ? calculateDistance(userLocation, b.coordinates) : Infinity;
                return distanceA - distanceB;
            });

            renderPlaces();
            updateMap();
            showToast("Locatie gevonden ♡");
        },
        error => {
            console.warn("Locatie geweigerd of mislukt:", error.message);
            showToast("Ik kon je locatie niet gebruiken. Je kunt de website wel gewoon verder gebruiken.");
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
    );
}

function savePreferences(event) {
    event.preventDefault();

    const nickname = document.getElementById("nickname");
    const email = document.getElementById("email");
    const message = document.getElementById("message");
    const success = document.getElementById("form-success");

    document.querySelectorAll(".form-error").forEach(error => error.textContent = "");
    success.textContent = "";

    let valid = true;

    if (nickname.value.trim().length < 2) {
        document.getElementById("nickname-error").textContent = "Vul minstens 2 tekens in.";
        valid = false;
    }

    if (!email.validity.valid) {
        document.getElementById("email-error").textContent = "Vul een geldig e-mailadres in.";
        valid = false;
    }

    if (message.value.trim().length < 5) {
        document.getElementById("message-error").textContent = "Schrijf minstens 5 tekens.";
        valid = false;
    }

    if (!valid) return;

    const preferences = {
        nickname: nickname.value.trim(),
        email: email.value.trim(),
        message: message.value.trim()
    };

    localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
    success.textContent = `Opgeslagen! Leuk je te leren kennen, ${preferences.nickname} ♡`;
    showToast("Je voorkeuren zijn opgeslagen.");
}

function loadPreferences() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.preferences));
    if (!saved) return;

    document.getElementById("nickname").value = saved.nickname || "";
    document.getElementById("email").value = saved.email || "";
    document.getElementById("message").value = saved.message || "";
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const theme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.getElementById("theme-toggle").textContent = theme === "dark" ? "☀" : "☾";
}

function loadTheme() {
    const theme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
    if (theme === "dark") document.body.classList.add("dark");
    document.getElementById("theme-toggle").textContent = theme === "dark" ? "☀" : "☾";
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function switchView(view) {
    document.querySelectorAll(".view-button").forEach(button => {
        button.classList.toggle("active", button.dataset.view === view);
    });

    cardsView.classList.toggle("hidden", view !== "cards");
    tableView.classList.toggle("hidden", view !== "table");
}

function loadLanguage() {
    const language = localStorage.getItem(STORAGE_KEYS.language) || "nl";
    document.getElementById("language-select").value = language;
}

function saveLanguage(event) {
    localStorage.setItem(STORAGE_KEYS.language, event.target.value);
    showToast(`Taalvoorkeur ${event.target.value.toUpperCase()} opgeslagen.`);
}

// Events
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
locationFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);
document.getElementById("reset-filters").addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "all";
    locationFilter.value = "all";
    sortSelect.value = "name-asc";
    applyFilters();
});
document.getElementById("location-button").addEventListener("click", useMyLocation);
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
document.getElementById("language-select").addEventListener("change", saveLanguage);
document.getElementById("preferences-form").addEventListener("submit", savePreferences);

document.querySelectorAll(".view-button").forEach(button => {
    button.addEventListener("click", () => switchView(button.dataset.view));
});

document.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");
    const detailsButton = event.target.closest("[data-details]");

    if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite);
    if (detailsButton) openModal(detailsButton.dataset.details);

    if (event.target.matches("[data-close-modal]")) closeModal();
});

modalFavorite.addEventListener("click", () => toggleFavorite(selectedPlaceId));
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
});

async function startApp() {
    loadTheme();
    loadLanguage();
    loadPreferences();
    renderFavorites();

    try {
        places = await fetchPlaces();
        document.getElementById("hero-total").textContent = `${places.length}+`;
        fillFilterOptions();
        filteredPlaces = [...places];
        applyFilters();
        initMap();
    } catch (error) {
        resultCount.textContent = "Geen data beschikbaar";
        cardsView.innerHTML = "<div class='empty-state'><div>♡</div><h3>Oeps!</h3><p>De open data kon nu niet worden opgehaald.</p></div>";
    }
}

startApp();
// Taal van de website
const languageSelect = document.getElementById("language-select");

const translations = {
    nl: {
        discover: "Ontdekken",
        map: "Kaart",
        favorites: "Favorieten",
        heroTitle: "Ontdek jouw volgende Brusselse plek.",
        heroText: "Van musea en galerijen tot leuke plekken en toeristische hotspots. Zoek, filter, bewaar en plan je volgende ontdekking.",
        start: "Start ontdekken",
        nearby: "◎ Vind dichtbij mij",
        discoverTitle: "Leuke plekken, op één plek.",
        search: "Zoeken",
        type: "Type",
        location: "Locatie",
        sort: "Sorteren",
        reset: "Reset",
        cards: "▦ Kaarten",
        table: "☷ Tabel",
        mapTitle: "Waar is het precies?",
        mapTip: "Klik op een marker voor meer info.",
        myFavorites: "Mijn favorieten",
        emptyFavorites: "Je lijstje is nog leeg",
        preferenceTitle: "Maak BrusselsExplorer een beetje van jou.",
        savePreference: "Voorkeur bewaren ♡"
    },

    fr: {
        discover: "Découvrir",
        map: "Carte",
        favorites: "Favoris",
        heroTitle: "Découvrez votre prochain endroit à Bruxelles.",
        heroText: "Des musées et galeries aux endroits sympas et lieux touristiques. Recherchez, filtrez et gardez vos endroits préférés.",
        start: "Commencer",
        nearby: "◎ Près de moi",
        discoverTitle: "Les endroits sympas, au même endroit.",
        search: "Rechercher",
        type: "Type",
        location: "Lieu",
        sort: "Trier",
        reset: "Réinitialiser",
        cards: "▦ Cartes",
        table: "☷ Tableau",
        mapTitle: "Où est-ce exactement ?",
        mapTip: "Cliquez sur un marqueur pour plus d'informations.",
        myFavorites: "Mes favoris",
        emptyFavorites: "Votre liste est encore vide",
        preferenceTitle: "Faites de BrusselsExplorer votre espace.",
        savePreference: "Enregistrer ♡"
    },

    en: {
        discover: "Discover",
        map: "Map",
        favorites: "Favorites",
        heroTitle: "Discover your next Brussels spot.",
        heroText: "From museums and galleries to nice places and tourist hotspots. Search, filter, save and plan your next discovery.",
        start: "Start exploring",
        nearby: "◎ Near me",
        discoverTitle: "Nice places, all in one place.",
        search: "Search",
        type: "Type",
        location: "Location",
        sort: "Sort",
        reset: "Reset",
        cards: "▦ Cards",
        table: "☷ Table",
        mapTitle: "Where exactly is it?",
        mapTip: "Click on a marker for more information.",
        myFavorites: "My favorites",
        emptyFavorites: "Your list is still empty",
        preferenceTitle: "Make BrusselsExplorer your own.",
        savePreference: "Save preference ♡"
    }
};

function changeLanguage(language) {
    const t = translations[language];

    if (!t) {
        return;
    }

    document.querySelector('a[href="#places"]').textContent = t.discover;
    document.querySelector('a[href="#map-section"]').textContent = t.map;

    const favoritesLink = document.querySelector('a[href="#favorites"]');
    const favoriteCount = document.getElementById("favorite-count");

    if (favoritesLink) {
        favoritesLink.innerHTML = `${t.favorites} `;
        if (favoriteCount) {
            favoritesLink.appendChild(favoriteCount);
        }
    }

    document.querySelector(".hero h1").textContent = t.heroTitle;
    document.querySelector(".hero-copy").textContent = t.heroText;

    const heroButtons = document.querySelectorAll(".hero-buttons .button");
    if (heroButtons[0]) heroButtons[0].textContent = t.start;
    if (heroButtons[1]) heroButtons[1].textContent = t.nearby;

    document.querySelector(".places-section h2").textContent = t.discoverTitle;

    document.querySelector('label[for="search-input"]').textContent = t.search;
    document.querySelector('label[for="category-filter"]').textContent = t.type;
    document.querySelector('label[for="location-filter"]').textContent = t.location;
    document.querySelector('label[for="sort-select"]').textContent = t.sort;

    document.getElementById("reset-filters").textContent = t.reset;

    const viewButtons = document.querySelectorAll(".view-button");
    if (viewButtons[0]) viewButtons[0].textContent = t.cards;
    if (viewButtons[1]) viewButtons[1].textContent = t.table;

    document.querySelector("#map-section h2").textContent = t.mapTitle;
    document.querySelector("#map-section .map-tip").textContent = t.mapTip;

    document.querySelector("#favorites h2").textContent = t.myFavorites;
    document.querySelector("#favorites-empty h3").textContent = t.emptyFavorites;

    document.querySelector(".preferences-section h2").textContent = t.preferenceTitle;
    document.querySelector("#preferences-form button").textContent = t.savePreference;

    // Taal bewaren
    localStorage.setItem("brusselsExplorerLanguage", language);

    // HTML-taal aanpassen
    document.documentElement.lang = language;
}

// Wanneer de gebruiker een andere taal kiest
languageSelect.addEventListener("change", function () {
    changeLanguage(this.value);
});

// Vorige taal ophalen
const savedLanguage = localStorage.getItem("brusselsExplorerLanguage") || "nl";

languageSelect.value = savedLanguage;
changeLanguage(savedLanguage);