"use strict";

/* =========================
   BRUSSELSEXPLORER
   ========================= */

const API_URL =
    "https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/lieux_culturels_touristiques_evenementiels_visitbrussels_vbx/records?limit=1000";

const STORAGE = {
    favorites: "brusselsExplorerFavorites",
    preferences: "brusselsExplorerPreferences",
    theme: "brusselsExplorerTheme",
    language: "brusselsExplorerLanguage",
    location: "brusselsExplorerLocation"
};

let places = [];
let filteredPlaces = [];
let favorites = JSON.parse(localStorage.getItem(STORAGE.favorites)) || [];
let userLocation =
    JSON.parse(localStorage.getItem(STORAGE.location)) || null;

let map = null;
let markersLayer = null;
let selectedPlaceId = null;
let toastTimer = null;


/* =========================
   ELEMENTEN
   ========================= */

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

const languageSelect = document.getElementById("language-select");


/* =========================
   HULPFUNCTIES
   ========================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function cleanText(value) {
    if (value === null || value === undefined) {
        return "-";
    }

    if (Array.isArray(value)) {
        return value
            .filter(Boolean)
            .map(item => String(item).trim())
            .filter(Boolean)
            .join(", ") || "-";
    }

    if (typeof value === "object") {
        return "-";
    }

    return String(value)
        .replace(/<[^>]*>/g, "")
        .trim() || "-";
}


function getField(record, ...names) {
    for (const name of names) {
        if (
            record &&
            record[name] !== undefined &&
            record[name] !== null &&
            record[name] !== ""
        ) {
            return record[name];
        }
    }

    return null;
}


/* =========================
   COÖRDINATEN
   ========================= */

function parseCoordinates(point) {

    if (!point) {
        return null;
    }

    /*
       De Brussels API geeft bijvoorbeeld:

       {
           "lon": 4.35425753,
           "lat": 50.8491797
       }
    */

    if (
        typeof point === "object" &&
        !Array.isArray(point) &&
        Number.isFinite(Number(point.lat)) &&
        Number.isFinite(Number(point.lon))
    ) {
        return [
            Number(point.lat),
            Number(point.lon)
        ];
    }

    /* Voor het geval de API ooit een array gebruikt */

    if (Array.isArray(point) && point.length >= 2) {

        const first = Number(point[0]);
        const second = Number(point[1]);

        if (
            Number.isFinite(first) &&
            Number.isFinite(second)
        ) {
            if (Math.abs(first) <= 90) {
                return [first, second];
            }

            return [second, first];
        }
    }

    return null;
}


/* =========================
   DATA NORMALISEREN
   ========================= */

function normalizePlace(record) {

    const fields = record.fields || record;

    return {

        id: String(
            getField(fields, "id", "recordid") ||
            crypto.randomUUID()
        ),

        nameNL: cleanText(
            getField(fields, "translations_nl_name")
        ),

        nameFR: cleanText(
            getField(fields, "translations_fr_name")
        ),

        nameEN: cleanText(
            getField(fields, "translations_en_name")
        ),

        categoryNL: cleanText(
            getField(fields, "visit_category_nl_multi")
        ),

        categoryFR: cleanText(
            getField(fields, "visit_category_fr_multi")
        ),

        categoryEN: cleanText(
            getField(fields, "visit_category_en_multi")
        ),

        addressNL: cleanText(
            getField(fields, "translations_nl_address_line1")
        ),

        addressFR: cleanText(
            getField(fields, "translations_fr_address_line1")
        ),

        postal: cleanText(
            getField(fields, "translations_fr_address_zip")
        ),

        municipalityNL: cleanText(
            getField(fields, "add_municipality_nl")
        ),

        municipalityFR: cleanText(
            getField(fields, "add_municipality_fr")
        ),

        phone: cleanText(
            getField(
                fields,
                "translations_nl_phone_contact",
                "translations_fr_phone_contact"
            )
        ),

        website: cleanText(
            getField(
                fields,
                "translations_nl_website",
                "translations_fr_website"
            )
        ),

        email: cleanText(
            getField(
                fields,
                "translations_nl_email",
                "translations_fr_email"
            )
        ),

        accessibility: cleanText(
            getField(
                fields,
                "accessibilities_translations_nl_item",
                "accessibilities_translations_fr_item"
            )
        ),

        updated: getField(
            fields,
            "last_updated_at",
            "published_at"
        ),

        coordinates: parseCoordinates(
            fields.add_geo_point_2
        )
    };
}


/* =========================
   TAAL
   ========================= */

const translations = {

    nl: {
        discover: "Ontdekken",
        map: "Kaart",
        favorites: "Favorieten",
        heroTitle: "Ontdek jouw volgende Brusselse plek.",
        heroText:
            "Van musea en galerijen tot leuke plekken en toeristische hotspots. Zoek, filter, bewaar en plan je volgende ontdekking.",
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
        favoritesTitle: "Mijn favorieten",
        emptyFavorites: "Je lijstje is nog leeg",
        preferenceTitle: "Maak BrusselsExplorer een beetje van jou.",
        savePreference: "Voorkeur bewaren ♡"
    },

    fr: {
        discover: "Découvrir",
        map: "Carte",
        favorites: "Favoris",
        heroTitle: "Découvrez votre prochain endroit à Bruxelles.",
        heroText:
            "Des musées et galeries aux endroits sympas et lieux touristiques. Recherchez, filtrez, sauvegardez et planifiez votre prochaine découverte.",
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
        favoritesTitle: "Mes favoris",
        emptyFavorites: "Votre liste est encore vide",
        preferenceTitle: "Faites de BrusselsExplorer votre espace.",
        savePreference: "Enregistrer ♡"
    },

    en: {
        discover: "Discover",
        map: "Map",
        favorites: "Favorites",
        heroTitle: "Discover your next Brussels spot.",
        heroText:
            "From museums and galleries to nice places and tourist hotspots. Search, filter, save and plan your next discovery.",
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
        favoritesTitle: "My favorites",
        emptyFavorites: "Your list is still empty",
        preferenceTitle: "Make BrusselsExplorer your own.",
        savePreference: "Save preference ♡"
    }
};


function currentLanguage() {
    return localStorage.getItem(STORAGE.language) || "nl";
}


function getName(place) {

    const lang = currentLanguage();

    if (lang === "fr" && place.nameFR !== "-") {
        return place.nameFR;
    }

    if (lang === "en" && place.nameEN !== "-") {
        return place.nameEN;
    }

    return place.nameNL !== "-" ?
        place.nameNL :
        place.nameFR;
}


function getCategory(place) {

    const lang = currentLanguage();

    if (lang === "fr" && place.categoryFR !== "-") {
        return place.categoryFR;
    }

    if (lang === "en" && place.categoryEN !== "-") {
        return place.categoryEN;
    }

    return place.categoryNL !== "-" ?
        place.categoryNL :
        place.categoryFR;
}


function getAddress(place) {

    const lang = currentLanguage();

    if (
        lang === "fr" &&
        place.addressFR !== "-"
    ) {
        return place.addressFR;
    }

    return place.addressNL !== "-"
        ? place.addressNL
        : place.addressFR;
}


function getMunicipality(place) {

    const lang = currentLanguage();

    if (
        lang === "fr" &&
        place.municipalityFR !== "-"
    ) {
        return place.municipalityFR;
    }

    return place.municipalityNL !== "-"
        ? place.municipalityNL
        : place.municipalityFR;
}


/* =========================
   API
   ========================= */

async function fetchPlaces() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                `API fout: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.results) {
            throw new Error("Geen results gevonden.");
        }

        console.log(
            "BrusselsExplorer API:",
            data.results.length,
            "plaatsen geladen"
        );

        return data.results.map(normalizePlace);

    } catch (error) {

        console.error(
            "API kon niet geladen worden:",
            error
        );

        showToast(
            "De plaatsen konden niet geladen worden."
        );

        throw error;
    }
}


/* =========================
   FILTERS
   ========================= */

function fillFilterOptions() {

    const categories = [
        ...new Set(
            places
                .map(place => getCategory(place))
                .filter(value => value && value !== "-")
        )
    ].sort((a, b) => a.localeCompare(b));

    const locations = [
        ...new Set(
            places
                .map(place => getMunicipality(place))
                .filter(value => value && value !== "-")
        )
    ].sort((a, b) => a.localeCompare(b));


    categoryFilter.innerHTML =
        `<option value="all">Alle types</option>` +
        categories.map(category =>
            `<option value="${escapeHtml(category)}">
                ${escapeHtml(category)}
            </option>`
        ).join("");


    locationFilter.innerHTML =
        `<option value="all">Alle gemeenten</option>` +
        locations.map(location =>
            `<option value="${escapeHtml(location)}">
                ${escapeHtml(location)}
            </option>`
        ).join("");
}


function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const category =
        categoryFilter.value;

    const location =
        locationFilter.value;

    const sort =
        sortSelect.value;


    filteredPlaces = places.filter(place => {

        const searchableText = `
            ${getName(place)}
            ${getCategory(place)}
            ${getAddress(place)}
            ${getMunicipality(place)}
        `.toLowerCase();


        const matchesSearch =
            search === "" ||
            searchableText.includes(search);


        const matchesCategory =
            category === "all" ||
            getCategory(place) === category;


        const matchesLocation =
            location === "all" ||
            getMunicipality(place) === location;


        return (
            matchesSearch &&
            matchesCategory &&
            matchesLocation
        );
    });


    if (sort === "name-asc") {

        filteredPlaces.sort(
            (a, b) =>
                getName(a).localeCompare(
                    getName(b)
                )
        );

    } else if (sort === "name-desc") {

        filteredPlaces.sort(
            (a, b) =>
                getName(b).localeCompare(
                    getName(a)
                )
        );

    } else if (sort === "category") {

        filteredPlaces.sort(
            (a, b) =>
                getCategory(a).localeCompare(
                    getCategory(b)
                )
        );

    } else if (sort === "recent") {

        filteredPlaces.sort(
            (a, b) =>
                new Date(b.updated) -
                new Date(a.updated)
        );
    }


    renderPlaces();
    updateMap();
}


/* =========================
   KAARTEN
   ========================= */

function createPlaceCard(place) {

    const isFavorite =
        favorites.some(
            favorite =>
                favorite.id === place.id
        );


    let distance = null;

    if (
        userLocation &&
        place.coordinates
    ) {
        distance =
            calculateDistance(
                userLocation,
                place.coordinates
            );
    }


    const distanceText =
        distance !== null
            ? `${distance.toFixed(1)} km van jou`
            : "";


    return `
        <article class="place-card">

            <div class="card-top">

                <span class="category-pill">
                    ${escapeHtml(getCategory(place))}
                </span>

                <button
                    class="favorite-button ${isFavorite ? "active" : ""}"
                    type="button"
                    data-favorite="${escapeHtml(place.id)}"
                    aria-label="Favoriet"
                >
                    ${isFavorite ? "♥" : "♡"}
                </button>

            </div>

            <h3>
                ${escapeHtml(getName(place))}
            </h3>

            <p class="place-address">
                ${escapeHtml(getAddress(place))}
                ·
                ${escapeHtml(getMunicipality(place))}
            </p>

            <div class="place-meta">
                ${escapeHtml(place.phone)}
            </div>

            <div class="card-bottom">

                <span class="distance">
                    ${escapeHtml(distanceText)}
                </span>

                <button
                    class="details-button"
                    type="button"
                    data-details="${escapeHtml(place.id)}"
                >
                    Bekijk details →
                </button>

            </div>

        </article>
    `;
}


function createTableRow(place) {

    const isFavorite =
        favorites.some(
            favorite =>
                favorite.id === place.id
        );


    const website =
        place.website !== "-"
            ? `<a href="${safeUrl(place.website)}"
                    target="_blank"
                    rel="noopener">
                    Open ↗
               </a>`
            : "-";


    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(getName(place))}
                </strong>
            </td>

            <td>
                ${escapeHtml(getCategory(place))}
            </td>

            <td>
                ${escapeHtml(getAddress(place))}
            </td>

            <td>
                ${escapeHtml(place.postal)}
            </td>

            <td>
                ${escapeHtml(getMunicipality(place))}
            </td>

            <td>
                ${escapeHtml(place.phone)}
            </td>

            <td>
                ${website}
            </td>

            <td>
                <button
                    class="table-favorite"
                    data-favorite="${escapeHtml(place.id)}"
                    type="button"
                >
                    ${isFavorite ? "♥" : "♡"}
                </button>
            </td>

        </tr>
    `;
}


function renderPlaces() {

    resultCount.textContent =
        `${filteredPlaces.length} ${
            filteredPlaces.length === 1
                ? "plaats"
                : "plaatsen"
        }`;


    if (!filteredPlaces.length) {

        cardsView.innerHTML = "";
        tableBody.innerHTML = "";

        emptyState.classList.remove("hidden");

        return;
    }


    emptyState.classList.add("hidden");


    cardsView.innerHTML =
        filteredPlaces
            .map(createPlaceCard)
            .join("");


    tableBody.innerHTML =
        filteredPlaces
            .map(createTableRow)
            .join("");
}


/* =========================
   FAVORIETEN
   ========================= */

function renderFavorites() {

    favoriteCount.textContent =
        favorites.length;


    if (!favorites.length) {

        favoritesGrid.innerHTML = "";

        favoritesEmpty.classList.remove(
            "hidden"
        );

        return;
    }


    favoritesEmpty.classList.add(
        "hidden"
    );


    favoritesGrid.innerHTML =
        favorites
            .map(createPlaceCard)
            .join("");
}


function toggleFavorite(placeId) {

    const place =
        places.find(
            item => item.id === placeId
        ) ||
        favorites.find(
            item => item.id === placeId
        );


    if (!place) return;


    const exists =
        favorites.some(
            favorite =>
                favorite.id === placeId
        );


    if (exists) {

        favorites =
            favorites.filter(
                favorite =>
                    favorite.id !== placeId
            );

        showToast(
            "Verwijderd uit je favorieten."
        );

    } else {

        favorites = [
            ...favorites,
            place
        ];

        showToast(
            "Toegevoegd aan je favorieten ♡"
        );
    }


    localStorage.setItem(
        STORAGE.favorites,
        JSON.stringify(favorites)
    );


    renderPlaces();
    renderFavorites();
    updateModalFavorite();
}


/* =========================
   MODAL
   ========================= */

function openModal(placeId) {

    const place =
        places.find(
            item => item.id === placeId
        ) ||
        favorites.find(
            item => item.id === placeId
        );


    if (!place) return;


    selectedPlaceId = place.id;


    modalTitle.textContent =
        getName(place);


    modalCategory.textContent =
        getCategory(place);


    modalDetails.innerHTML = `

        <div class="modal-detail">
            <strong>Adres</strong>
            ${escapeHtml(getAddress(place))},
            ${escapeHtml(place.postal)}
            ${escapeHtml(getMunicipality(place))}
        </div>

        <div class="modal-detail">
            <strong>Telefoon</strong>
            ${escapeHtml(place.phone)}
        </div>

        <div class="modal-detail">
            <strong>E-mail</strong>
            ${escapeHtml(place.email)}
        </div>

        <div class="modal-detail">
            <strong>Toegankelijkheid</strong>
            ${escapeHtml(place.accessibility)}
        </div>

        <div class="modal-detail">
            <strong>Laatst bijgewerkt</strong>
            ${formatDate(place.updated)}
        </div>
    `;


    if (
        place.website &&
        place.website !== "-"
    ) {

        modalWebsite.href =
            safeUrl(place.website);

        modalWebsite.classList.remove(
            "hidden"
        );

    } else {

        modalWebsite.classList.add(
            "hidden"
        );
    }


    updateModalFavorite();

    modal.classList.remove("hidden");

    document.body.style.overflow =
        "hidden";
}


function closeModal() {

    modal.classList.add("hidden");

    document.body.style.overflow =
        "";
}


function updateModalFavorite() {

    if (!selectedPlaceId) return;


    const isFavorite =
        favorites.some(
            favorite =>
                favorite.id === selectedPlaceId
        );


    modalFavorite.textContent =
        isFavorite
            ? "♥ Favoriet"
            : "♡ Favoriet";
}


function formatDate(value) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleDateString(
        currentLanguage() === "fr"
            ? "fr-BE"
            : currentLanguage() === "en"
                ? "en-GB"
                : "nl-BE"
    );
}


function safeUrl(url) {

    try {

        const parsed =
            new URL(url);

        if (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        ) {
            return parsed.href;
        }

    } catch (error) {
        return "#";
    }

    return "#";
}


/* =========================
   KAART
   ========================= */

function initMap() {

    if (!window.L) {

        console.error(
            "Leaflet is niet geladen."
        );

        return;
    }


    map =
        L.map("map").setView(
            [50.8476, 4.3572],
            12
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    markersLayer =
        L.layerGroup().addTo(map);


    updateMap();


    setTimeout(() => {
        map.invalidateSize();
    }, 300);
}


function updateMap() {

    if (
        !map ||
        !markersLayer
    ) {
        return;
    }


    markersLayer.clearLayers();


    const bounds = [];


    filteredPlaces.forEach(place => {

        if (!place.coordinates) {
            return;
        }


        const marker =
            L.marker(
                place.coordinates
            ).addTo(markersLayer);


        marker.bindPopup(`
            <div>
                <strong>
                    ${escapeHtml(getName(place))}
                </strong>

                <p>
                    ${escapeHtml(getMunicipality(place))}
                </p>

                <button
                    type="button"
                    onclick="openModal('${escapeHtml(place.id)}')"
                >
                    Bekijk details
                </button>
            </div>
        `);


        bounds.push(
            place.coordinates
        );
    });


    if (bounds.length) {

        map.fitBounds(
            bounds,
            {
                padding: [30, 30],
                maxZoom: 14
            }
        );
    }
}


/* =========================
   LOCATIE
   ========================= */

function calculateDistance(from, to) {

    const earthRadius = 6371;

    const lat1 =
        from[0] *
        Math.PI /
        180;

    const lat2 =
        to[0] *
        Math.PI /
        180;

    const deltaLat =
        (to[0] - from[0]) *
        Math.PI /
        180;

    const deltaLon =
        (to[1] - from[1]) *
        Math.PI /
        180;


    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) ** 2;


    return (
        earthRadius *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
}


function useMyLocation() {

    if (!navigator.geolocation) {

        showToast(
            "Je browser ondersteunt geen locatie."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        position => {

            userLocation = [
                position.coords.latitude,
                position.coords.longitude
            ];


            localStorage.setItem(
                STORAGE.location,
                JSON.stringify(userLocation)
            );


            locationNote.textContent =
                "Locatie opgeslagen. De plaatsen worden op afstand weergegeven.";


            locationNote.classList.remove(
                "hidden"
            );


            filteredPlaces.sort(
                (a, b) => {

                    const distanceA =
                        a.coordinates
                            ? calculateDistance(
                                userLocation,
                                a.coordinates
                            )
                            : Infinity;


                    const distanceB =
                        b.coordinates
                            ? calculateDistance(
                                userLocation,
                                b.coordinates
                            )
                            : Infinity;


                    return distanceA - distanceB;
                }
            );


            renderPlaces();
            updateMap();


            showToast(
                "Locatie gevonden ♡"
            );
        },

        error => {

            console.warn(
                "Locatie niet beschikbaar:",
                error.message
            );


            showToast(
                "Je locatie kon niet worden gebruikt."
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: 60000
        }
    );
}


/* =========================
   THEMA
   ========================= */

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const theme =
        document.body.classList.contains(
            "dark"
        )
            ? "dark"
            : "light";


    localStorage.setItem(
        STORAGE.theme,
        theme
    );


    const button =
        document.getElementById(
            "theme-toggle"
        );


    button.textContent =
        theme === "dark"
            ? "☀"
            : "☾";
}


function loadTheme() {

    const theme =
        localStorage.getItem(
            STORAGE.theme
        ) || "light";


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );
    }


    const button =
        document.getElementById(
            "theme-toggle"
        );


    button.textContent =
        theme === "dark"
            ? "☀"
            : "☾";
}


/* =========================
   VOORKEUREN
   ========================= */

function savePreferences(event) {

    event.preventDefault();


    const nickname =
        document.getElementById(
            "nickname"
        );

    const email =
        document.getElementById(
            "email"
        );

    const message =
        document.getElementById(
            "message"
        );

    const success =
        document.getElementById(
            "form-success"
        );


    document
        .querySelectorAll(".form-error")
        .forEach(
            error =>
                error.textContent = ""
        );


    success.textContent = "";


    let valid = true;


    if (
        nickname.value
            .trim()
            .length < 2
    ) {

        document.getElementById(
            "nickname-error"
        ).textContent =
            "Vul minstens 2 tekens in.";

        valid = false;
    }


    if (!email.validity.valid) {

        document.getElementById(
            "email-error"
        ).textContent =
            "Vul een geldig e-mailadres in.";

        valid = false;
    }


    if (
        message.value
            .trim()
            .length < 5
    ) {

        document.getElementById(
            "message-error"
        ).textContent =
            "Schrijf minstens 5 tekens.";

        valid = false;
    }


    if (!valid) {
        return;
    }


    const preferences = {

        nickname:
            nickname.value.trim(),

        email:
            email.value.trim(),

        message:
            message.value.trim()
    };


    localStorage.setItem(
        STORAGE.preferences,
        JSON.stringify(preferences)
    );


    success.textContent =
        `Opgeslagen! Leuk je te leren kennen, ${preferences.nickname} ♡`;


    showToast(
        "Je voorkeuren zijn opgeslagen."
    );
}


function loadPreferences() {

    const saved =
        JSON.parse(
            localStorage.getItem(
                STORAGE.preferences
            )
        );


    if (!saved) {
        return;
    }


    document.getElementById(
        "nickname"
    ).value =
        saved.nickname || "";


    document.getElementById(
        "email"
    ).value =
        saved.email || "";


    document.getElementById(
        "message"
    ).value =
        saved.message || "";
}


/* =========================
   TAAL WISSELEN
   ========================= */

function changeLanguage(language) {

    const t =
        translations[language];


    if (!t) return;


    localStorage.setItem(
        STORAGE.language,
        language
    );


    document.documentElement.lang =
        language;


    const discoverLink =
        document.querySelector(
            'a[href="#places"]'
        );

    const mapLink =
        document.querySelector(
            'a[href="#map-section"]'
        );

    const favoritesLink =
        document.querySelector(
            'a[href="#favorites"]'
        );


    if (discoverLink) {
        discoverLink.textContent =
            t.discover;
    }


    if (mapLink) {
        mapLink.textContent =
            t.map;
    }


    if (favoritesLink) {

        favoritesLink.innerHTML =
            `${t.favorites} `;

        favoritesLink.appendChild(
            favoriteCount
        );
    }


    document.querySelector(
        ".hero h1"
    ).innerHTML =
        t.heroTitle.replace(
            "Brusselse",
            "<span>Brusselse</span>"
        );


    document.querySelector(
        ".hero-copy"
    ).textContent =
        t.heroText;


    const heroButtons =
        document.querySelectorAll(
            ".hero-buttons .button"
        );


    if (heroButtons[0]) {
        heroButtons[0].textContent =
            t.start;
    }


    if (heroButtons[1]) {
        heroButtons[1].textContent =
            t.nearby;
    }


    document.querySelector(
        ".places-section h2"
    ).textContent =
        t.discoverTitle;


    document.querySelector(
        'label[for="search-input"]'
    ).textContent =
        t.search;


    document.querySelector(
        'label[for="category-filter"]'
    ).textContent =
        t.type;


    document.querySelector(
        'label[for="location-filter"]'
    ).textContent =
        t.location;


    document.querySelector(
        'label[for="sort-select"]'
    ).textContent =
        t.sort;


    document.getElementById(
        "reset-filters"
    ).textContent =
        t.reset;


    const viewButtons =
        document.querySelectorAll(
            ".view-button"
        );


    if (viewButtons[0]) {
        viewButtons[0].textContent =
            t.cards;
    }


    if (viewButtons[1]) {
        viewButtons[1].textContent =
            t.table;
    }


    document.querySelector(
        "#map-section h2"
    ).textContent =
        t.mapTitle;


    document.querySelector(
        "#map-section .map-tip"
    ).textContent =
        t.mapTip;


    document.querySelector(
        "#favorites h2"
    ).textContent =
        t.favoritesTitle;


    document.querySelector(
        "#favorites-empty h3"
    ).textContent =
        t.emptyFavorites;


    document.querySelector(
        ".preferences-section h2"
    ).textContent =
        t.preferenceTitle;


    document.querySelector(
        "#preferences-form button"
    ).textContent =
        t.savePreference;


    /*
       Belangrijk:
       na het veranderen van taal
       worden de filters opnieuw opgebouwd.
    */

    fillFilterOptions();
    applyFilters();
    renderFavorites();
}


/* =========================
   VIEW SWITCH
   ========================= */

function switchView(view) {

    document
        .querySelectorAll(".view-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.view === view
            );
        });


    cardsView.classList.toggle(
        "hidden",
        view !== "cards"
    );


    tableView.classList.toggle(
        "hidden",
        view !== "table"
    );
}


/* =========================
   TOAST
   ========================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () =>
                toast.classList.remove(
                    "show"
                ),
            2500
        );
}


/* =========================
   EVENTS
   ========================= */

searchInput.addEventListener(
    "input",
    applyFilters
);


categoryFilter.addEventListener(
    "change",
    applyFilters
);


locationFilter.addEventListener(
    "change",
    applyFilters
);


sortSelect.addEventListener(
    "change",
    applyFilters
);


document
    .getElementById("reset-filters")
    .addEventListener(
        "click",
        () => {

            searchInput.value = "";

            categoryFilter.value =
                "all";

            locationFilter.value =
                "all";

            sortSelect.value =
                "name-asc";

            applyFilters();
        }
    );


document
    .getElementById("location-button")
    .addEventListener(
        "click",
        useMyLocation
    );


document
    .getElementById("theme-toggle")
    .addEventListener(
        "click",
        toggleTheme
    );


languageSelect.addEventListener(
    "change",
    event =>
        changeLanguage(
            event.target.value
        )
);


document
    .getElementById("preferences-form")
    .addEventListener(
        "submit",
        savePreferences
    );


document
    .querySelectorAll(".view-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () =>
                switchView(
                    button.dataset.view
                )
        );
    });


document.addEventListener(
    "click",
    event => {

        const favoriteButton =
            event.target.closest(
                "[data-favorite]"
            );


        const detailsButton =
            event.target.closest(
                "[data-details]"
            );


        if (favoriteButton) {

            toggleFavorite(
                favoriteButton.dataset.favorite
            );
        }


        if (detailsButton) {

            openModal(
                detailsButton.dataset.details
            );
        }


        if (
            event.target.matches(
                "[data-close-modal]"
            )
        ) {

            closeModal();
        }
    }
);


modalFavorite.addEventListener(
    "click",
    () =>
        toggleFavorite(
            selectedPlaceId
        )
);


document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeModal();
        }
    }
);


/* =========================
   APP STARTEN
   ========================= */

async function startApp() {

    loadTheme();
    loadPreferences();
    renderFavorites();


    const savedLanguage =
        localStorage.getItem(
            STORAGE.language
        ) || "nl";


    languageSelect.value =
        savedLanguage;


    try {

        places =
            await fetchPlaces();


        const heroTotal =
            document.getElementById(
                "hero-total"
            );


        if (heroTotal) {

            heroTotal.textContent =
                `${places.length}+`;
        }


        fillFilterOptions();


        filteredPlaces =
            [...places];


        applyFilters();


        initMap();


        loading.classList.add(
            "done"
        );


        console.log(
            "BrusselsExplorer is klaar."
        );


    } catch (error) {

        console.error(error);


        resultCount.textContent =
            "Geen data beschikbaar";


        cardsView.innerHTML = `
            <div class="empty-state">
                <div>♡</div>
                <h3>Oeps!</h3>
                <p>
                    De open data kon niet worden opgehaald.
                    Controleer je internetverbinding.
                </p>
            </div>
        `;


        loading.classList.add(
            "done"
        );
    }
}


startApp();