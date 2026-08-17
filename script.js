"use strict";

/* =========================================================
   BRUSSELSEXPLORER
   Dynamic Web - EHB
   ========================================================= */


/* =========================================================
   API
   ========================================================= */

const API_URL =
    "https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/lieux_culturels_touristiques_evenementiels_visitbrussels_vbx/records?limit=1000";


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

const STORAGE = {
    favorites: "brusselsExplorerFavorites",
    preferences: "brusselsExplorerPreferences",
    theme: "brusselsExplorerTheme",
    language: "brusselsExplorerLanguage",
    location: "brusselsExplorerLocation"
};


/* =========================================================
   DATA
   ========================================================= */

let places = [];
let filteredPlaces = [];

let favorites = [];

try {
    favorites = JSON.parse(
        localStorage.getItem(STORAGE.favorites) || "[]"
    );

    if (!Array.isArray(favorites)) {
        favorites = [];
    }
} catch {
    favorites = [];
}

let userLocation = null;

try {
    userLocation = JSON.parse(
        localStorage.getItem(STORAGE.location) || "null"
    );
} catch {
    userLocation = null;
}

let map = null;
let markersLayer = null;


/* =========================================================
   HTML ELEMENTEN
   ========================================================= */

const loading =
    document.getElementById("loading");

const errorMessage =
    document.getElementById("error-message");

const placesContainer =
    document.getElementById("places-container");

const tableContainer =
    document.getElementById("table-container");

const resultCount =
    document.getElementById("result-count");

const favoriteCount =
    document.getElementById("favorite-count");

const favoritesContainer =
    document.getElementById("favorites-container");

const favoritesEmpty =
    document.getElementById("favorites-empty");

const searchInput =
    document.getElementById("search-input");

const categoryFilter =
    document.getElementById("category-filter");

const locationFilter =
    document.getElementById("location-filter");

const sortSelect =
    document.getElementById("sort-select");

const resetFilters =
    document.getElementById("reset-filters");

const languageSelect =
    document.getElementById("language-select");

const themeButton =
    document.getElementById("theme-button");

const nearbyButton =
    document.getElementById("nearby-button");

const themeSelect =
    document.getElementById("theme-select");

const locationPreference =
    document.getElementById("location-preference");

const preferencesForm =
    document.getElementById("preferences-form");


/* =========================================================
   VERTALINGEN
   ========================================================= */

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

        discoverTitle:
            "Leuke plekken, op één plek.",

        search: "Zoeken",
        searchPlaceholder: "Zoek een plek...",
        type: "Type",
        location: "Locatie",
        sort: "Sorteren",
        reset: "Reset",

        cards: "▦ Kaarten",
        table: "☷ Tabel",

        mapTitle: "Waar is het precies?",
        mapTip:
            "Klik op een marker voor meer info.",

        favoritesTitle:
            "Mijn favorieten ♡",

        emptyFavorites:
            "Je lijstje is nog leeg",

        emptyFavoritesText:
            "Bewaar een paar leuke plekken en ze verschijnen hier.",

        preferenceTitle:
            "Maak BrusselsExplorer een beetje van jou.",

        preferenceText:
            "Bewaar je voorkeuren zodat de website de volgende keer meteen goed staat.",

        light: "Licht",
        pink: "Roze",
        dark: "Donker",

        locationUse:
            "Locatie gebruiken",

        savePreference:
            "Voorkeuren bewaren ♡",

        allTypes: "Alle types",
        allLocations: "Alle locaties",

        place: "plaats",
        places: "plaatsen",

        details: "Bekijk details →",

        noResults:
            "Geen plaatsen gevonden.",

        apiError:
            "De plaatsen konden niet geladen worden. Controleer je internetverbinding.",

        locationSaved:
            "Locatie gevonden ♡",

        locationError:
            "Je locatie kon niet worden gebruikt.",

        favoriteAdded:
            "Toegevoegd aan je favorieten ♡",

        favoriteRemoved:
            "Verwijderd uit je favorieten.",

        preferencesSaved:
            "Je voorkeuren zijn opgeslagen ♡"
    },

    fr: {
        discover: "Découvrir",
        map: "Carte",
        favorites: "Favoris",

        heroTitle:
            "Découvrez votre prochain endroit à Bruxelles.",

        heroText:
            "Des musées et galeries aux endroits sympas et lieux touristiques. Recherchez, filtrez, sauvegardez et planifiez votre prochaine découverte.",

        start: "Commencer",
        nearby: "◎ Près de moi",

        discoverTitle:
            "Les endroits sympas, au même endroit.",

        search: "Rechercher",
        searchPlaceholder: "Rechercher un endroit...",
        type: "Type",
        location: "Lieu",
        sort: "Trier",
        reset: "Réinitialiser",

        cards: "▦ Cartes",
        table: "☷ Tableau",

        mapTitle:
            "Où est-ce exactement ?",

        mapTip:
            "Cliquez sur un marqueur pour plus d'informations.",

        favoritesTitle:
            "Mes favoris ♡",

        emptyFavorites:
            "Votre liste est encore vide",

        emptyFavoritesText:
            "Sauvegardez quelques endroits et ils apparaîtront ici.",

        preferenceTitle:
            "Faites de BrusselsExplorer votre espace.",

        preferenceText:
            "Sauvegardez vos préférences pour retrouver votre configuration.",

        light: "Clair",
        pink: "Rose",
        dark: "Sombre",

        locationUse:
            "Utiliser ma position",

        savePreference:
            "Enregistrer les préférences ♡",

        allTypes: "Tous les types",
        allLocations: "Tous les lieux",

        place: "lieu",
        places: "lieux",

        details: "Voir les détails →",

        noResults:
            "Aucun endroit trouvé.",

        apiError:
            "Les endroits n'ont pas pu être chargés. Vérifiez votre connexion.",

        locationSaved:
            "Position trouvée ♡",

        locationError:
            "Votre position n'a pas pu être utilisée.",

        favoriteAdded:
            "Ajouté à vos favoris ♡",

        favoriteRemoved:
            "Supprimé de vos favoris.",

        preferencesSaved:
            "Vos préférences ont été enregistrées ♡"
    },

    en: {
        discover: "Discover",
        map: "Map",
        favorites: "Favorites",

        heroTitle:
            "Discover your next Brussels spot.",

        heroText:
            "From museums and galleries to nice places and tourist hotspots. Search, filter, save and plan your next discovery.",

        start: "Start exploring",
        nearby: "◎ Near me",

        discoverTitle:
            "Nice places, all in one place.",

        search: "Search",
        searchPlaceholder: "Search for a place...",
        type: "Type",
        location: "Location",
        sort: "Sort",
        reset: "Reset",

        cards: "▦ Cards",
        table: "☷ Table",

        mapTitle:
            "Where exactly is it?",

        mapTip:
            "Click on a marker for more information.",

        favoritesTitle:
            "My favorites ♡",

        emptyFavorites:
            "Your list is still empty",

        emptyFavoritesText:
            "Save a few nice places and they will appear here.",

        preferenceTitle:
            "Make BrusselsExplorer your own.",

        preferenceText:
            "Save your preferences so the website remembers your settings.",

        light: "Light",
        pink: "Pink",
        dark: "Dark",

        locationUse:
            "Use my location",

        savePreference:
            "Save preferences ♡",

        allTypes: "All types",
        allLocations: "All locations",

        place: "place",
        places: "places",

        details: "View details →",

        noResults:
            "No places found.",

        apiError:
            "The places could not be loaded. Check your internet connection.",

        locationSaved:
            "Location found ♡",

        locationError:
            "Your location could not be used.",

        favoriteAdded:
            "Added to your favorites ♡",

        favoriteRemoved:
            "Removed from your favorites.",

        preferencesSaved:
            "Your preferences have been saved ♡"
    }
};


/* =========================================================
   TAAL
   ========================================================= */

function currentLanguage() {
    return (
        localStorage.getItem(STORAGE.language) ||
        "nl"
    );
}


function t(key) {
    const language = currentLanguage();

    return (
        translations[language]?.[key] ||
        translations.nl[key] ||
        key
    );
}


function changeLanguage(language) {

    if (!translations[language]) {
        return;
    }

    localStorage.setItem(
        STORAGE.language,
        language
    );

    document.documentElement.lang =
        language;

    if (languageSelect) {
        languageSelect.value = language;
    }

    updateInterfaceText();

    if (places.length > 0) {
        fillFilterOptions();
        applyFilters();
        renderFavorites();
    }
}


function updateInterfaceText() {

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
            t("discover");
    }

    if (mapLink) {
        mapLink.textContent =
            t("map");
    }

    if (favoritesLink) {
        favoritesLink.innerHTML =
            `${t("favorites")}
             <span id="favorite-count">
                ${favorites.length}
             </span>`;
    }

    const heroTitle =
        document.querySelector(".hero h1");

    if (heroTitle) {
        heroTitle.innerHTML =
            t("heroTitle");
    }

    const heroCopy =
        document.querySelector(".hero-copy");

    if (heroCopy) {
        heroCopy.textContent =
            t("heroText");
    }

    const heroButtons =
        document.querySelectorAll(
            ".hero-buttons .button"
        );

    if (heroButtons[0]) {
        heroButtons[0].textContent =
            t("start");
    }

    if (heroButtons[1]) {
        heroButtons[1].textContent =
            t("nearby");
    }

    const placesTitle =
        document.querySelector(
            "#places h2"
        );

    if (placesTitle) {
        placesTitle.textContent =
            t("discoverTitle");
    }

    const searchLabel =
        document.querySelector(
            'label[for="search-input"]'
        );

    if (searchLabel) {
        searchLabel.textContent =
            t("search");
    }

    if (searchInput) {
        searchInput.placeholder =
            t("searchPlaceholder");
    }

    const categoryLabel =
        document.querySelector(
            'label[for="category-filter"]'
        );

    if (categoryLabel) {
        categoryLabel.textContent =
            t("type");
    }

    const locationLabel =
        document.querySelector(
            'label[for="location-filter"]'
        );

    if (locationLabel) {
        locationLabel.textContent =
            t("location");
    }

    const sortLabel =
        document.querySelector(
            'label[for="sort-select"]'
        );

    if (sortLabel) {
        sortLabel.textContent =
            t("sort");
    }

    if (resetFilters) {
        resetFilters.textContent =
            t("reset");
    }

    const viewButtons =
        document.querySelectorAll(
            ".view-button"
        );

    if (viewButtons[0]) {
        viewButtons[0].textContent =
            t("cards");
    }

    if (viewButtons[1]) {
        viewButtons[1].textContent =
            t("table");
    }

    const mapTitle =
        document.querySelector(
            "#map-section h2"
        );

    if (mapTitle) {
        mapTitle.textContent =
            t("mapTitle");
    }

    const mapTip =
        document.querySelector(
            ".map-tip"
        );

    if (mapTip) {
        mapTip.textContent =
            t("mapTip");
    }

    const favoritesTitle =
        document.querySelector(
            "#favorites h2"
        );

    if (favoritesTitle) {
        favoritesTitle.textContent =
            t("favoritesTitle");
    }

    const emptyTitle =
        document.querySelector(
            "#favorites-empty h3"
        );

    if (emptyTitle) {
        emptyTitle.textContent =
            t("emptyFavorites");
    }

    const emptyText =
        document.querySelector(
            "#favorites-empty p"
        );

    if (emptyText) {
        emptyText.textContent =
            t("emptyFavoritesText");
    }

    const preferenceTitle =
        document.querySelector(
            ".preferences-section h2"
        );

    if (preferenceTitle) {
        preferenceTitle.textContent =
            t("preferenceTitle");
    }

    const preferenceText =
        document.querySelector(
            ".preferences-box > div > p:not(.small-title)"
        );

    if (preferenceText) {
        preferenceText.textContent =
            t("preferenceText");
    }

    const locationLabelPreference =
        document.querySelector(
            'label[for="location-preference"]'
        );

    if (locationLabelPreference) {
        locationLabelPreference.textContent =
            t("locationUse");
    }

    const saveButton =
        document.querySelector(
            '#preferences-form button[type="submit"]'
        );

    if (saveButton) {
        saveButton.textContent =
            t("savePreference");
    }

    if (themeSelect) {

        const options =
            themeSelect.querySelectorAll(
                "option"
            );

        options.forEach(option => {

            if (option.value === "light") {
                option.textContent =
                    t("light");
            }

            if (option.value === "pink") {
                option.textContent =
                    t("pink");
            }

            if (option.value === "dark") {
                option.textContent =
                    t("dark");
            }

        });
    }
}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {
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


/* =========================================================
   COÖRDINATEN
   ========================================================= */

function parseCoordinates(point) {

    if (!point) {
        return null;
    }

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

    if (
        Array.isArray(point) &&
        point.length >= 2
    ) {

        const first =
            Number(point[0]);

        const second =
            Number(point[1]);

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


/* =========================================================
   API DATA NORMALISEREN
   ========================================================= */

function normalizePlace(record) {

    const fields =
        record.fields || record;

    return {

        id: String(
            getField(
                fields,
                "id",
                "recordid"
            ) ||
            crypto.randomUUID()
        ),

        nameNL: cleanText(
            getField(
                fields,
                "translations_nl_name"
            )
        ),

        nameFR: cleanText(
            getField(
                fields,
                "translations_fr_name"
            )
        ),

        nameEN: cleanText(
            getField(
                fields,
                "translations_en_name"
            )
        ),

        categoryNL: cleanText(
            getField(
                fields,
                "visit_category_nl_multi"
            )
        ),

        categoryFR: cleanText(
            getField(
                fields,
                "visit_category_fr_multi"
            )
        ),

        categoryEN: cleanText(
            getField(
                fields,
                "visit_category_en_multi"
            )
        ),

        addressNL: cleanText(
            getField(
                fields,
                "translations_nl_address_line1"
            )
        ),

        addressFR: cleanText(
            getField(
                fields,
                "translations_fr_address_line1"
            )
        ),

        postal: cleanText(
            getField(
                fields,
                "translations_fr_address_zip"
            )
        ),

        municipalityNL: cleanText(
            getField(
                fields,
                "add_municipality_nl"
            )
        ),

        municipalityFR: cleanText(
            getField(
                fields,
                "add_municipality_fr"
            )
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

        updated:
            getField(
                fields,
                "last_updated_at",
                "published_at"
            ),

        coordinates:
            parseCoordinates(
                getField(
                    fields,
                    "add_geo_point_2"
                )
            )
    };
}


/* =========================================================
   TAAL DATA
   ========================================================= */

function getName(place) {

    const language =
        currentLanguage();

    if (
        language === "fr" &&
        place.nameFR !== "-"
    ) {
        return place.nameFR;
    }

    if (
        language === "en" &&
        place.nameEN !== "-"
    ) {
        return place.nameEN;
    }

    if (place.nameNL !== "-") {
        return place.nameNL;
    }

    if (place.nameFR !== "-") {
        return place.nameFR;
    }

    return place.nameEN;
}


function getCategory(place) {

    const language =
        currentLanguage();

    if (
        language === "fr" &&
        place.categoryFR !== "-"
    ) {
        return place.categoryFR;
    }

    if (
        language === "en" &&
        place.categoryEN !== "-"
    ) {
        return place.categoryEN;
    }

    if (place.categoryNL !== "-") {
        return place.categoryNL;
    }

    if (place.categoryFR !== "-") {
        return place.categoryFR;
    }

    return place.categoryEN;
}


function getAddress(place) {

    const language =
        currentLanguage();

    if (
        language === "fr" &&
        place.addressFR !== "-"
    ) {
        return place.addressFR;
    }

    if (place.addressNL !== "-") {
        return place.addressNL;
    }

    return place.addressFR;
}


function getMunicipality(place) {

    const language =
        currentLanguage();

    if (
        language === "fr" &&
        place.municipalityFR !== "-"
    ) {
        return place.municipalityFR;
    }

    if (place.municipalityNL !== "-") {
        return place.municipalityNL;
    }

    return place.municipalityFR;
}


/* =========================================================
   API OPHALEN
   ========================================================= */

async function fetchPlaces() {

    console.log("BrusselsExplorer: API laden...");

    const response =
        await fetch(API_URL);

    console.log(
        "API status:",
        response.status
    );

    if (!response.ok) {

        throw new Error(
            "API fout: " +
            response.status
        );
    }

    const data =
        await response.json();

    console.log(
        "API response:",
        data
    );

    if (
        !data.results ||
        !Array.isArray(data.results)
    ) {

        throw new Error(
            "De API bevat geen results."
        );
    }

    console.log(
        "Aantal plaatsen:",
        data.results.length
    );

    return data.results
        .map(normalizePlace)
        .filter(place =>
            place.id &&
            getName(place) !== "-"
        );
}


/* =========================================================
   FILTERS VULLEN
   ========================================================= */

function fillFilterOptions() {

    if (
        !categoryFilter ||
        !locationFilter
    ) {
        return;
    }

    const selectedCategory =
        categoryFilter.value;

    const selectedLocation =
        locationFilter.value;


    const categories = [
        ...new Set(
            places
                .map(place =>
                    getCategory(place)
                )
                .filter(
                    value =>
                        value &&
                        value !== "-"
                )
        )
    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );


    const locations = [
        ...new Set(
            places
                .map(place =>
                    getMunicipality(place)
                )
                .filter(
                    value =>
                        value &&
                        value !== "-"
                )
        )
    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );


    categoryFilter.innerHTML =
        `<option value="">
            ${escapeHtml(t("allTypes"))}
        </option>` +
        categories
            .map(
                category =>
                    `<option value="${escapeHtml(category)}">
                        ${escapeHtml(category)}
                    </option>`
            )
            .join("");


    locationFilter.innerHTML =
        `<option value="">
            ${escapeHtml(t("allLocations"))}
        </option>` +
        locations
            .map(
                location =>
                    `<option value="${escapeHtml(location)}">
                        ${escapeHtml(location)}
                    </option>`
            )
            .join("");


    if (
        categories.includes(
            selectedCategory
        )
    ) {
        categoryFilter.value =
            selectedCategory;
    }


    if (
        locations.includes(
            selectedLocation
        )
    ) {
        locationFilter.value =
            selectedLocation;
    }
}


/* =========================================================
   FILTERS TOEPASSEN
   ========================================================= */

function applyFilters() {

    if (!places.length) {
        return;
    }

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value
            : "";

    const location =
        locationFilter
            ? locationFilter.value
            : "";

    const sort =
        sortSelect
            ? sortSelect.value
            : "name-asc";


    filteredPlaces =
        places.filter(place => {

            const searchableText = `
                ${getName(place)}
                ${getCategory(place)}
                ${getAddress(place)}
                ${getMunicipality(place)}
            `.toLowerCase();


            const matchesSearch =
                search === "" ||
                searchableText.includes(
                    search
                );


            const matchesCategory =
                category === "" ||
                getCategory(place) ===
                    category;


            const matchesLocation =
                location === "" ||
                getMunicipality(place) ===
                    location;


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

    } else if (
        sort === "name-desc"
    ) {

        filteredPlaces.sort(
            (a, b) =>
                getName(b).localeCompare(
                    getName(a)
                )
        );
    }


    renderPlaces();
    updateMap();
}


/* =========================================================
   PLACE CARD
   ========================================================= */

function createPlaceCard(place) {

    const isFavorite =
        favorites.some(
            favorite =>
                favorite.id === place.id
        );


    let distanceText = "";


    if (
        userLocation &&
        place.coordinates
    ) {

        const distance =
            calculateDistance(
                userLocation,
                place.coordinates
            );

        distanceText =
            `${distance.toFixed(1)} km`;
    }


    return `
        <article class="place-card">

            <div class="card-top">

                <span class="category-pill">
                    ${escapeHtml(
                        getCategory(place)
                    )}
                </span>

                <button
                    class="favorite-button ${
                        isFavorite
                            ? "active"
                            : ""
                    }"
                    type="button"
                    data-favorite="${escapeHtml(
                        place.id
                    )}"
                    aria-label="Favoriet"
                >
                    ${
                        isFavorite
                            ? "♥"
                            : "♡"
                    }
                </button>

            </div>


            <h3>
                ${escapeHtml(
                    getName(place)
                )}
            </h3>


            <p class="place-address">
                ${escapeHtml(
                    getAddress(place)
                )}
                ${
                    getMunicipality(place) !== "-"
                        ? " · " +
                          escapeHtml(
                              getMunicipality(place)
                          )
                        : ""
                }
            </p>


            ${
                place.phone !== "-"
                    ? `
                        <div class="place-meta">
                            ${escapeHtml(
                                place.phone
                            )}
                        </div>
                    `
                    : ""
            }


            <div class="card-bottom">

                <span class="distance">
                    ${escapeHtml(
                        distanceText
                    )}
                </span>

                <button
                    class="details-button"
                    type="button"
                    data-details="${escapeHtml(
                        place.id
                    )}"
                >
                    ${t("details")}
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   TABEL
   ========================================================= */

function createTableRow(place) {

    const isFavorite =
        favorites.some(
            favorite =>
                favorite.id === place.id
        );


    let website = "-";


    if (
        place.website &&
        place.website !== "-"
    ) {

        const url =
            safeUrl(
                place.website
            );

        if (url !== "#") {

            website = `
                <a
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open ↗
                </a>
            `;
        }
    }


    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        getName(place)
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    getCategory(place)
                )}
            </td>

            <td>
                ${escapeHtml(
                    getAddress(place)
                )}
            </td>

            <td>
                ${escapeHtml(
                    place.postal
                )}
            </td>

            <td>
                ${escapeHtml(
                    getMunicipality(place)
                )}
            </td>

            <td>
                ${escapeHtml(
                    place.phone
                )}
            </td>

            <td>
                ${website}
            </td>

            <td>

                <button
                    class="table-favorite"
                    data-favorite="${escapeHtml(
                        place.id
                    )}"
                    type="button"
                >
                    ${
                        isFavorite
                            ? "♥"
                            : "♡"
                    }
                </button>

            </td>

        </tr>
    `;
}


/* =========================================================
   PLAATSEN RENDEREN
   ========================================================= */

function renderPlaces() {

    if (!placesContainer) {
        return;
    }


    if (resultCount) {

        resultCount.textContent =
            `${filteredPlaces.length} ${
                filteredPlaces.length === 1
                    ? t("place")
                    : t("places")
            }`;
    }


    if (!filteredPlaces.length) {

        placesContainer.innerHTML = `
            <div class="empty-state">
                <div>♡</div>

                <h3>
                    ${escapeHtml(
                        t("noResults")
                    )}
                </h3>

                <p>
                    Probeer een andere zoekterm
                    of pas je filters aan.
                </p>
            </div>
        `;

        if (tableContainer) {
            tableContainer.innerHTML = "";
        }

        return;
    }


    placesContainer.innerHTML =
        filteredPlaces
            .map(createPlaceCard)
            .join("");


    if (tableContainer) {

        tableContainer.innerHTML = `
            <div class="table-scroll">
                <table>

                    <thead>
                        <tr>
                            <th>Naam</th>
                            <th>Type</th>
                            <th>Adres</th>
                            <th>Postcode</th>
                            <th>Gemeente</th>
                            <th>Telefoon</th>
                            <th>Website</th>
                            <th>♡</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${filteredPlaces
                            .map(
                                createTableRow
                            )
                            .join("")}
                    </tbody>

                </table>
            </div>
        `;
    }
}


/* =========================================================
   FAVORIETEN
   ========================================================= */

function renderFavorites() {

    const count =
        document.getElementById(
            "favorite-count"
        );

    if (count) {
        count.textContent =
            favorites.length;
    }


    if (!favoritesContainer) {
        return;
    }


    if (!favorites.length) {

        favoritesContainer.innerHTML =
            "";

        if (favoritesEmpty) {
            favoritesEmpty.classList.remove(
                "hidden"
            );
        }

        return;
    }


    if (favoritesEmpty) {
        favoritesEmpty.classList.add(
            "hidden"
        );
    }


    favoritesContainer.innerHTML =
        favorites
            .map(createPlaceCard)
            .join("");
}


function toggleFavorite(placeId) {

    const place =
        places.find(
            item =>
                item.id === placeId
        );


    if (!place) {
        return;
    }


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
            t("favoriteRemoved")
        );

    } else {

        favorites = [
            ...favorites,
            place
        ];

        showToast(
            t("favoriteAdded")
        );
    }


    localStorage.setItem(
        STORAGE.favorites,
        JSON.stringify(
            favorites
        )
    );


    renderPlaces();
    renderFavorites();
}


/* =========================================================
   VEILIG URL
   ========================================================= */

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

    } catch {
        return "#";
    }

    return "#";
}


/* =========================================================
   KAART
   ========================================================= */

function initMap() {

    if (!window.L) {

        console.error(
            "Leaflet is niet geladen."
        );

        return;
    }


    const mapElement =
        document.getElementById("map");


    if (!mapElement) {
        return;
    }


    map =
        L.map(
            "map"
        ).setView(
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


    setTimeout(
        () => map.invalidateSize(),
        300
    );
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


    filteredPlaces.forEach(
        place => {

            if (
                !place.coordinates
            ) {
                return;
            }


            const marker =
                L.marker(
                    place.coordinates
                );


            marker.bindPopup(`
                <div class="map-popup">

                    <strong>
                        ${escapeHtml(
                            getName(place)
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            getCategory(place)
                        )}
                    </p>

                    <p>
                        ${escapeHtml(
                            getMunicipality(place)
                        )}
                    </p>

                </div>
            `);


            marker.addTo(
                markersLayer
            );


            bounds.push(
                place.coordinates
            );
        }
    );


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


/* =========================================================
   LOCATIE
   ========================================================= */

function calculateDistance(
    from,
    to
) {

    const earthRadius =
        6371;


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
        Math.sin(
            deltaLat / 2
        ) ** 2 +

        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(
            deltaLon / 2
        ) ** 2;


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
            t("locationError")
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
                JSON.stringify(
                    userLocation
                )
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


                    return (
                        distanceA -
                        distanceB
                    );
                }
            );


            renderPlaces();
            updateMap();


            showToast(
                t("locationSaved")
            );
        },


        () => {

            showToast(
                t("locationError")
            );
        },


        {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 60000
        }
    );
}


/* =========================================================
   THEMA
   ========================================================= */

function applyTheme(theme) {

    document.body.classList.remove(
        "dark",
        "pink"
    );


    if (
        theme === "dark" ||
        theme === "pink"
    ) {

        document.body.classList.add(
            theme
        );
    }


    localStorage.setItem(
        STORAGE.theme,
        theme
    );


    if (themeSelect) {
        themeSelect.value =
            theme;
    }


    if (themeButton) {

        themeButton.textContent =
            theme === "dark"
                ? "☀"
                : "☾";
    }
}


function toggleTheme() {

    const current =
        localStorage.getItem(
            STORAGE.theme
        ) || "light";


    const next =
        current === "dark"
            ? "light"
            : "dark";


    applyTheme(next);
}


function loadTheme() {

    const saved =
        localStorage.getItem(
            STORAGE.theme
        ) || "light";


    applyTheme(saved);
}


/* =========================================================
   VOORKEUREN
   ========================================================= */

function savePreferences(event) {

    event.preventDefault();


    const preferences = {

        theme:
            themeSelect
                ? themeSelect.value
                : "light",

        location:
            locationPreference
                ? locationPreference.checked
                : false
    };


    localStorage.setItem(
        STORAGE.preferences,
        JSON.stringify(
            preferences
        )
    );


    applyTheme(
        preferences.theme
    );


    if (
        preferences.location
    ) {

        useMyLocation();
    }


    showToast(
        t("preferencesSaved")
    );
}


function loadPreferences() {

    let saved = null;


    try {

        saved =
            JSON.parse(
                localStorage.getItem(
                    STORAGE.preferences
                ) || "null"
            );

    } catch {
        saved = null;
    }


    if (!saved) {
        return;
    }


    if (
        saved.theme &&
        themeSelect
    ) {

        themeSelect.value =
            saved.theme;

        applyTheme(
            saved.theme
        );
    }


    if (
        locationPreference &&
        typeof saved.location ===
            "boolean"
    ) {

        locationPreference.checked =
            saved.location;
    }
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function showToast(message) {

    let toast =
        document.getElementById(
            "brussels-toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "brussels-toast";

        toast.style.position =
            "fixed";

        toast.style.bottom =
            "25px";

        toast.style.left =
            "50%";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.padding =
            "12px 20px";

        toast.style.borderRadius =
            "999px";

        toast.style.background =
            "#222";

        toast.style.color =
            "#fff";

        toast.style.zIndex =
            "9999";

        toast.style.fontSize =
            "14px";

        toast.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.15)";

        document.body.appendChild(
            toast
        );
    }


    toast.textContent =
        message;


    toast.style.opacity =
        "1";


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

            },
            2500
        );
}


/* =========================================================
   VIEW SWITCH
   ========================================================= */

function switchView(view) {

    document
        .querySelectorAll(
            ".view-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.view ===
                        view
                );
            }
        );


    if (placesContainer) {

        placesContainer.classList.toggle(
            "hidden",
            view !== "cards"
        );
    }


    if (tableContainer) {

        tableContainer.classList.toggle(
            "hidden",
            view !== "table"
        );
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );
}


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        applyFilters
    );
}


if (locationFilter) {

    locationFilter.addEventListener(
        "change",
        applyFilters
    );
}


if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        applyFilters
    );
}


if (resetFilters) {

    resetFilters.addEventListener(
        "click",
        () => {

            if (searchInput) {
                searchInput.value = "";
            }

            if (categoryFilter) {
                categoryFilter.value = "";
            }

            if (locationFilter) {
                locationFilter.value = "";
            }

            if (sortSelect) {
                sortSelect.value =
                    "name-asc";
            }

            applyFilters();
        }
    );
}


if (nearbyButton) {

    nearbyButton.addEventListener(
        "click",
        useMyLocation
    );
}


if (themeButton) {

    themeButton.addEventListener(
        "click",
        toggleTheme
    );
}


if (languageSelect) {

    languageSelect.addEventListener(
        "change",
        event => {

            changeLanguage(
                event.target.value
            );
        }
    );
}


if (preferencesForm) {

    preferencesForm.addEventListener(
        "submit",
        savePreferences
    );
}


document
    .querySelectorAll(
        ".view-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    switchView(
                        button.dataset.view
                    )
            );
        }
    );


/* =========================================================
   FAVORIETEN + DETAILS
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const favoriteButton =
            event.target.closest(
                "[data-favorite]"
            );


        if (favoriteButton) {

            toggleFavorite(
                favoriteButton.dataset.favorite
            );

            return;
        }


        const detailsButton =
            event.target.closest(
                "[data-details]"
            );


        if (detailsButton) {

            const place =
                places.find(
                    item =>
                        item.id ===
                        detailsButton.dataset.details
                );


            if (!place) {
                return;
            }


            const website =
                place.website !== "-"
                    ? safeUrl(
                        place.website
                    )
                    : "#";


            const message = `

                ${getName(place)}

                ${getCategory(place)}

                ${getAddress(place)}
                ${getMunicipality(place)}

                ${
                    place.phone !== "-"
                        ? place.phone
                        : ""
                }

                ${
                    website !== "#"
                        ? "\nWebsite: " +
                          website
                        : ""
                }

            `;


            alert(
                message
            );
        }
    }
);


/* =========================================================
   APP STARTEN
   ========================================================= */

async function startApp() {

    console.log(
        "BrusselsExplorer starten..."
    );


    loadTheme();
    loadPreferences();


    const savedLanguage =
        localStorage.getItem(
            STORAGE.language
        ) || "nl";


    if (languageSelect) {

        languageSelect.value =
            savedLanguage;
    }


    document.documentElement.lang =
        savedLanguage;


    updateInterfaceText();
    renderFavorites();


    try {

        places =
            await fetchPlaces();


        console.log(
            "Plaatsen succesvol geladen:",
            places.length
        );


        filteredPlaces =
            [...places];


        fillFilterOptions();


        applyFilters();


        initMap();


        if (loading) {

            loading.classList.add(
                "done"
            );
        }


        if (errorMessage) {

            errorMessage.textContent =
                "";

            errorMessage.classList.remove(
                "show"
            );
        }


        console.log(
            "BrusselsExplorer is klaar ♡"
        );


    } catch (error) {

        console.error(
            "FOUT BIJ STARTEN:",
            error
        );


        if (loading) {

            loading.classList.add(
                "done"
            );
        }


        if (resultCount) {

            resultCount.textContent =
                "API fout";
        }


        if (placesContainer) {

            placesContainer.innerHTML = `
                <div class="empty-state">

                    <div>♡</div>

                    <h3>
                        Oeps!
                    </h3>

                    <p>
                        ${escapeHtml(
                            t("apiError")
                        )}
                    </p>

                </div>
            `;
        }


        if (errorMessage) {

            errorMessage.textContent =
                t("apiError");

            errorMessage.classList.add(
                "show"
            );
        }
    }
}


/* =========================================================
   START
   ========================================================= */

startApp();