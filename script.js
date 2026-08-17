const API_URL =
    "https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/lieux_culturels_touristiques_evenementiels_visitbrussels_vbx/records?limit=1000";

const FALLBACK_API_URL =
    "https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/bruxelles_musees/records?limit=100";

let places = [];
let filteredPlaces = [];
let favorites = JSON.parse(
    localStorage.getItem("brusselsExplorerFavorites") || "[]"
);

let currentLanguage =
    localStorage.getItem("brusselsExplorerLanguage") || "nl";

let currentView = "cards";
let map = null;
let markersLayer = null;


/* =========================
   ELEMENTEN
========================= */

const $ = (id) => document.getElementById(id);


/* =========================
   VEILIG HTML
========================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function firstValue(...values) {
    return values.find(
        (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
    ) ?? "";
}


/* =========================
   VERTALINGEN
========================= */

const translations = {

    nl: {
        discover: "Ontdekken",
        map: "Kaart",
        favorites: "Favorieten",

        country: "BRUSSEL • BELGIË",

        heroTitle: "Ontdek leuke plekken",
        heroSpan: "in Brussel.",

        heroCopy:
            "Weet je niet wat je vandaag kan doen? Zoek een leuke plek, bekijk waar ze ligt en bewaar je favorieten.",

        discoverBtn: "Ontdek plekken",
        nearby: "◎ In mijn buurt",

        discoverLabel: "ONTDEKKEN",
        discoverTitle: "Wat wil je vandaag ontdekken?",

        search: "Zoeken",
        searchPlaceholder: "Typ bijvoorbeeld een naam...",

        type: "Type",
        allTypes: "Alle types",

        location: "Locatie",
        allLocations: "Alle locaties",

        sort: "Sorteren",
        az: "Naam A-Z",
        za: "Naam Z-A",

        reset: "Reset",

        cards: "▦ Kaarten",
        table: "☷ Tabel",

        loading: "Even geduld, de plekken worden geladen...",

        mapLabel: "KAART",
        mapTitle: "Bekijk de plekken op de kaart",
        mapTip: "Klik op een marker om meer informatie te bekijken.",

        favLabel: "FAVORIETEN",
        favTitle: "Mijn opgeslagen plekken ♡",

        noFav: "Je hebt nog geen favorieten.",

        favText:
            "Klik op het hartje bij een plek om die hier te bewaren.",

        toPlaces: "Naar de plekken",

        prefLabel: "VOORKEUREN",
        prefTitle: "Stel de website in zoals jij hem wil.",

        prefText:
            "Je voorkeuren worden in je browser bewaard zodat ze niet telkens opnieuw ingesteld moeten worden.",

        theme: "Thema",
        light: "Licht",
        pink: "Roze",
        dark: "Donker",

        locationUse: "Locatie gebruiken",

        savePrefs: "Voorkeuren bewaren ♡",
        saved: "Voorkeuren opgeslagen ✓",

        noResults: "Geen plekken gevonden.",

        details: "Bekijk locatie",
        website: "Website",
        address: "Adres",

        results: "plaatsen gevonden"
    },


    fr: {
        discover: "Découvrir",
        map: "Carte",
        favorites: "Favoris",

        country: "BRUXELLES • BELGIQUE",

        heroTitle: "Découvrez de beaux endroits",
        heroSpan: "à Bruxelles.",

        heroCopy:
            "Vous ne savez pas quoi faire aujourd'hui ? Trouvez un endroit, voyez où il se trouve et gardez vos favoris.",

        discoverBtn: "Découvrir",
        nearby: "◎ Près de moi",

        discoverLabel: "DÉCOUVRIR",
        discoverTitle: "Que voulez-vous découvrir aujourd'hui ?",

        search: "Rechercher",
        searchPlaceholder: "Recherchez un endroit...",

        type: "Type",
        allTypes: "Tous les types",

        location: "Lieu",
        allLocations: "Tous les lieux",

        sort: "Trier",
        az: "Nom A-Z",
        za: "Nom Z-A",

        reset: "Réinitialiser",

        cards: "▦ Cartes",
        table: "☷ Tableau",

        loading: "Chargement des endroits...",

        mapLabel: "CARTE",
        mapTitle: "Voir les endroits sur la carte",
        mapTip: "Cliquez sur un marqueur pour plus d'informations.",

        favLabel: "FAVORIS",
        favTitle: "Mes endroits favoris ♡",

        noFav: "Vous n'avez pas encore de favoris.",

        favText:
            "Cliquez sur le cœur d'un endroit pour le sauvegarder.",

        toPlaces: "Voir les endroits",

        prefLabel: "PRÉFÉRENCES",
        prefTitle: "Personnalisez votre site.",

        prefText:
            "Vos préférences sont enregistrées dans votre navigateur.",

        theme: "Thème",
        light: "Clair",
        pink: "Rose",
        dark: "Sombre",

        locationUse: "Utiliser ma localisation",

        savePrefs: "Enregistrer ♡",
        saved: "Préférences enregistrées ✓",

        noResults: "Aucun endroit trouvé.",

        details: "Voir la localisation",
        website: "Site web",
        address: "Adresse",

        results: "endroits trouvés"
    },


    en: {
        discover: "Discover",
        map: "Map",
        favorites: "Favorites",

        country: "BRUSSELS • BELGIUM",

        heroTitle: "Discover great places",
        heroSpan: "in Brussels.",

        heroCopy:
            "Not sure what to do today? Find a place, see where it is and save your favorites.",

        discoverBtn: "Discover places",
        nearby: "◎ Near me",

        discoverLabel: "DISCOVER",
        discoverTitle: "What would you like to discover today?",

        search: "Search",
        searchPlaceholder: "Search for a place...",

        type: "Type",
        allTypes: "All types",

        location: "Location",
        allLocations: "All locations",

        sort: "Sort",
        az: "Name A-Z",
        za: "Name Z-A",

        reset: "Reset",

        cards: "▦ Cards",
        table: "☷ Table",

        loading: "Loading places...",

        mapLabel: "MAP",
        mapTitle: "See the places on the map",
        mapTip: "Click a marker for more information.",

        favLabel: "FAVORITES",
        favTitle: "My saved places ♡",

        noFav: "You have no favorites yet.",

        favText:
            "Click the heart on a place to save it.",

        toPlaces: "View places",

        prefLabel: "PREFERENCES",
        prefTitle: "Make the website yours.",

        prefText:
            "Your preferences are saved in your browser.",

        theme: "Theme",
        light: "Light",
        pink: "Pink",
        dark: "Dark",

        locationUse: "Use my location",

        savePrefs: "Save preferences ♡",
        saved: "Preferences saved ✓",

        noResults: "No places found.",

        details: "View location",
        website: "Website",
        address: "Address",

        results: "places found"
    }
};


/* =========================
   API DATA NORMALISEREN
========================= */

function normalize(record, index) {

    const f = record.fields || record;

    let lat = null;
    let lon = null;

    /*
       Visit.Brussels dataset:
       add_geo_point_2 = [latitude, longitude]
    */

    if (Array.isArray(f.add_geo_point_2)) {

        lat = Number(f.add_geo_point_2[0]);
        lon = Number(f.add_geo_point_2[1]);

    }

    /*
       Fallback museum dataset
    */

    if (
        (!Number.isFinite(lat) || !Number.isFinite(lon)) &&
        Array.isArray(f.coordonnees_geographiques)
    ) {

        lat = Number(f.coordonnees_geographiques[0]);
        lon = Number(f.coordonnees_geographiques[1]);

    }

    const name = firstValue(
        f.translations_nl_name,
        f.translations_fr_name,
        f.translations_en_name,
        f.naam,
        f.nom,
        f.name,
        "Onbekende plek"
    );

    const nameNl = firstValue(
        f.translations_nl_name,
        f.naam,
        name
    );

    const nameFr = firstValue(
        f.translations_fr_name,
        f.nom,
        name
    );

    const nameEn = firstValue(
        f.translations_en_name,
        f.name,
        name
    );

    const address = firstValue(
        f.translations_nl_address_line1,
        f.translations_fr_address_line1,
        f.adres,
        f.adresse,
        f.address,
        "Adres niet beschikbaar"
    );

    const postcode = firstValue(
        f.translations_fr_address_zip,
        f.translations_nl_address_zip,
        f.postcode,
        f.code_postal,
        ""
    );

    const municipality = firstValue(
        f.add_municipality_nl,
        f.add_municipality_fr,
        f.gemeente,
        f.commune,
        "Brussel"
    );

    /*
       We combineren gemeente + postcode.
       Hierdoor heeft de locatie-filter echt meerdere keuzes.
    */

    const location = postcode
        ? `${municipality} ${postcode}`
        : municipality;

    const category = firstValue(
        f.visit_category_nl_multi,
        f.visit_category_fr_multi,
        f.visit_category_en_multi,
        f.type,
        "Bezienswaardigheid"
    );

    const categoryFr = firstValue(
        f.visit_category_fr_multi,
        f.type,
        category
    );

    const categoryEn = firstValue(
        f.visit_category_en_multi,
        f.type,
        category
    );

    const website = firstValue(
        f.translations_fr_website,
        f.translations_nl_website,
        f.translations_en_website,
        f.weblink,
        f.website,
        ""
    );

    const googleMaps = firstValue(
        f.google_maps,
        ""
    );

    return {
        id: String(
            firstValue(
                record.recordid,
                f.id,
                index
            )
        ),

        name,

        nameNl,
        nameFr,
        nameEn,

        address,
        postcode,

        location,

        category,
        categoryFr,
        categoryEn,

        website,
        googleMaps,

        lat,
        lon
    };
}


/* =========================
   API OPHALEN
========================= */

async function getApiData(url) {

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(
            `API error: ${response.status}`
        );
    }

    const data = await response.json();

    if (!Array.isArray(data.results)) {
        throw new Error(
            "De API heeft geen results teruggestuurd."
        );
    }

    return data.results;
}


async function fetchPlaces() {

    try {

        console.log("BrusselsExplorer: API laden...");

        const data = await getApiData(API_URL);

        console.log(
            "Visit.Brussels API:",
            data.length,
            "records"
        );

        const normalized = data
            .map(normalize)
            .filter(
                place =>
                    place.name &&
                    place.name !== "Onbekende plek"
            );

        if (!normalized.length) {
            throw new Error(
                "De API gaf geen bruikbare plaatsen."
            );
        }

        return normalized;

    } catch (error) {

        console.warn(
            "Hoofd-API mislukt. Fallback API wordt geprobeerd.",
            error
        );

        try {

            const fallbackData =
                await getApiData(FALLBACK_API_URL);

            console.log(
                "Fallback museum API:",
                fallbackData.length,
                "records"
            );

            return fallbackData
                .map(normalize)
                .filter(
                    place =>
                        place.name &&
                        place.name !== "Onbekende plek"
                );

        } catch (fallbackError) {

            console.error(
                "Beide API's mislukt:",
                fallbackError
            );

            throw fallbackError;
        }
    }
}


/* =========================
   TAAL
========================= */

function getPlaceName(place) {

    if (currentLanguage === "fr") {
        return place.nameFr || place.name;
    }

    if (currentLanguage === "en") {
        return place.nameEn || place.name;
    }

    return place.nameNl || place.name;
}


function getPlaceCategory(place) {

    if (currentLanguage === "fr") {
        return place.categoryFr || place.category;
    }

    if (currentLanguage === "en") {
        return place.categoryEn || place.category;
    }

    return place.category || "Bezienswaardigheid";
}


function applyLanguage() {

    const t = translations[currentLanguage];

    document.documentElement.lang =
        currentLanguage;

    $("language-select").value =
        currentLanguage;


    /* NAV */

    const nav =
        document.querySelectorAll(
            ".navigation a"
        );

    if (nav[0])
        nav[0].textContent = t.discover;

    if (nav[1])
        nav[1].textContent = t.map;

    if (nav[2]) {

        nav[2].innerHTML =
            `${t.favorites}
             <span id="favorite-count">
             ${favorites.length}
             </span>`;
    }


    /* HERO */

    const heroSmall =
        document.querySelector(".hero .small-title");

    if (heroSmall)
        heroSmall.textContent = t.country;


    const heroTitle =
        document.querySelector(".hero h1");

    if (heroTitle) {

        heroTitle.childNodes[0].textContent =
            `${t.heroTitle} `;

        heroTitle.querySelector("span")
            .textContent = t.heroSpan;
    }


    document.querySelector(".hero-copy")
        .textContent = t.heroCopy;


    $("nearby-button").textContent =
        t.nearby;


    const heroButton =
        document.querySelector(
            ".hero .primary-button"
        );

    if (heroButton)
        heroButton.textContent =
            t.discoverBtn;


    /* SECTION TITELS */

    const smallTitles =
        document.querySelectorAll(
            ".section .small-title"
        );

    if (smallTitles[0])
        smallTitles[0].textContent =
            t.discoverLabel;

    if (smallTitles[1])
        smallTitles[1].textContent =
            t.mapLabel;

    if (smallTitles[2])
        smallTitles[2].textContent =
            t.favLabel;

    if (smallTitles[3])
        smallTitles[3].textContent =
            t.prefLabel;


    $("places")
        ?.querySelector("h2")
        ?.replaceChildren(
            document.createTextNode(
                t.discoverTitle
            )
        );


    $("map-section")
        ?.querySelector("h2")
        ?.replaceChildren(
            document.createTextNode(
                t.mapTitle
            )
        );


    document.querySelector(".map-tip")
        .textContent = t.mapTip;


    $("favorites")
        ?.querySelector("h2")
        ?.replaceChildren(
            document.createTextNode(
                t.favTitle
            )
        );


    $("favorites-empty")
        ?.querySelector("h3")
        ?.replaceChildren(
            document.createTextNode(
                t.noFav
            )
        );


    $("favorites-empty")
        ?.querySelector("p")
        ?.replaceChildren(
            document.createTextNode(
                t.favText
            )
        );


    $("favorites-empty")
        ?.querySelector("a")
        ?.replaceChildren(
            document.createTextNode(
                t.toPlaces
            )
        );


    /* FILTERS */

    document.querySelector(
        'label[for="search-input"]'
    ).textContent = t.search;


    $("search-input").placeholder =
        t.searchPlaceholder;


    document.querySelector(
        'label[for="category-filter"]'
    ).textContent = t.type;


    document.querySelector(
        'label[for="location-filter"]'
    ).textContent = t.location;


    document.querySelector(
        'label[for="sort-select"]'
    ).textContent = t.sort;


    $("reset-filters").textContent =
        t.reset;


    /* VIEW */

    document.querySelector(
        '[data-view="cards"]'
    ).textContent = t.cards;


    document.querySelector(
        '[data-view="table"]'
    ).textContent = t.table;


    /* PREFERENCES */

    document.querySelector(
        'label[for="theme-select"]'
    ).textContent = t.theme;


    document.querySelector(
        'label[for="location-preference"]'
    ).textContent = t.locationUse;


    const themeOptions =
        $("theme-select").options;

    themeOptions[0].textContent = t.light;
    themeOptions[1].textContent = t.pink;
    themeOptions[2].textContent = t.dark;


    render();
}


/* =========================
   FILTERS VULLEN
========================= */

function populateFilters() {

    const categorySelect =
        $("category-filter");

    const locationSelect =
        $("location-filter");


    const oldCategory =
        categorySelect.value;

    const oldLocation =
        locationSelect.value;


    const categories = [
        ...new Set(
            places
                .map(place => place.category)
                .filter(Boolean)
        )
    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );


    const locations = [
        ...new Set(
            places
                .map(place => place.location)
                .filter(Boolean)
        )
    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );


    categorySelect.innerHTML =
        `<option value="">
            ${escapeHtml(
                translations[currentLanguage]
                    .allTypes
            )}
        </option>`;


    locationSelect.innerHTML =
        `<option value="">
            ${escapeHtml(
                translations[currentLanguage]
                    .allLocations
            )}
        </option>`;


    categories.forEach(category => {

        categorySelect.insertAdjacentHTML(
            "beforeend",

            `<option value="${escapeHtml(category)}">
                ${escapeHtml(category)}
            </option>`
        );
    });


    locations.forEach(location => {

        locationSelect.insertAdjacentHTML(
            "beforeend",

            `<option value="${escapeHtml(location)}">
                ${escapeHtml(location)}
            </option>`
        );
    });


    if (
        [...categorySelect.options]
            .some(option =>
                option.value === oldCategory
            )
    ) {

        categorySelect.value =
            oldCategory;
    }


    if (
        [...locationSelect.options]
            .some(option =>
                option.value === oldLocation
            )
    ) {

        locationSelect.value =
            oldLocation;
    }
}


/* =========================
   FILTEREN
========================= */

function getFilteredPlaces() {

    const query =
        $("search-input")
            .value
            .trim()
            .toLowerCase();


    const category =
        $("category-filter").value;


    const location =
        $("location-filter").value;


    const sort =
        $("sort-select").value;


    let result =
        places.filter(place => {

            const searchable = [

                place.nameNl,
                place.nameFr,
                place.nameEn,

                place.address,

                place.location,

                place.category

            ]
                .join(" ")
                .toLowerCase();


            return (

                (!query ||
                    searchable.includes(query))

                &&

                (!category ||
                    place.category === category)

                &&

                (!location ||
                    place.location === location)
            );
        });


    result.sort((a, b) => {

        const comparison =
            getPlaceName(a).localeCompare(
                getPlaceName(b),
                currentLanguage
            );


        return sort === "name-desc"
            ? -comparison
            : comparison;
    });


    return result;
}


/* =========================
   RENDER
========================= */

function render() {

    filteredPlaces =
        getFilteredPlaces();


    $("result-count").textContent =
        `${filteredPlaces.length}
         ${translations[currentLanguage].results}`;


    renderCards();

    renderTable();

    updateMap();
}


/* =========================
   CARDS
========================= */

function renderCards() {

    const container =
        $("places-container");


    if (!filteredPlaces.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div>♡</div>

                <h3>
                    ${escapeHtml(
                        translations[currentLanguage]
                            .noResults
                    )}
                </h3>

            </div>

        `;

        return;
    }


    container.innerHTML =
        filteredPlaces.map(place => {

            const isFavorite =
                favorites.includes(
                    place.id
                );


            return `

                <article class="place-card">

                    <div class="place-card-top">

                        <span class="place-category">
                            ${escapeHtml(
                                getPlaceCategory(place)
                            )}
                        </span>


                        <button

                            class="
                                favorite-button
                                ${isFavorite
                                    ? "is-favorite"
                                    : ""}
                            "

                            data-favorite="${escapeHtml(
                                place.id
                            )}"

                            type="button"

                            aria-label="Favoriet"

                        >
                            ${isFavorite
                                ? "♥"
                                : "♡"}
                        </button>

                    </div>


                    <h3>
                        ${escapeHtml(
                            getPlaceName(place)
                        )}
                    </h3>


                    <p class="place-address">

                        ${escapeHtml(
                            place.address
                        )}

                        ${
                            place.postcode
                                ? `, ${escapeHtml(
                                    place.postcode
                                )}`
                                : ""
                        }

                    </p>


                    <p class="place-location">

                        📍

                        ${escapeHtml(
                            place.location
                        )}

                    </p>


                    <div class="place-actions">

                        ${
                            place.googleMaps

                                ?

                            `<a
                                class="button secondary-button"
                                href="${escapeHtml(
                                    place.googleMaps
                                )}"
                                target="_blank"
                                rel="noopener"
                            >
                                ${
                                    translations[
                                        currentLanguage
                                    ].details
                                }
                            </a>`

                                :

                            ""
                        }


                        ${
                            place.website

                                ?

                            `<a
                                class="text-link"
                                href="${escapeHtml(
                                    place.website
                                )}"
                                target="_blank"
                                rel="noopener"
                            >
                                ${
                                    translations[
                                        currentLanguage
                                    ].website
                                }
                            </a>`

                                :

                            ""
                        }

                    </div>

                </article>

            `;

        }).join("");
}


/* =========================
   TABEL
========================= */

function renderTable() {

    const container =
        $("table-container");


    if (currentView !== "table") {

        container.innerHTML = "";

        container.style.display =
            "none";

        $("places-container")
            .style.display = "grid";

        return;
    }


    $("places-container")
        .style.display = "none";


    container.style.display =
        "block";


    container.innerHTML = `

        <div class="table-scroll">

            <table>

                <thead>

                    <tr>

                        <th>Naam</th>

                        <th>
                            ${translations[
                                currentLanguage
                            ].type}
                        </th>

                        <th>
                            ${translations[
                                currentLanguage
                            ].location}
                        </th>

                        <th>
                            ${translations[
                                currentLanguage
                            ].address}
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        filteredPlaces
                            .map(place => `

                                <tr>

                                    <td>
                                        ${escapeHtml(
                                            getPlaceName(
                                                place
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            getPlaceCategory(
                                                place
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            place.location
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            place.address
                                        )}
                                    </td>

                                </tr>

                            `)
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;
}


/* =========================
   KAART
========================= */

function initMap() {

    if (typeof L === "undefined") {

        console.error(
            "Leaflet is niet geladen."
        );

        return;
    }


    map = L.map("map")
        .setView(
            [50.8466, 4.3528],
            13
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    ).addTo(map);


    markersLayer =
        L.layerGroup().addTo(map);
}


function updateMap() {

    if (
        !map ||
        !markersLayer
    ) {
        return;
    }


    markersLayer.clearLayers();


    const validPlaces =
        filteredPlaces.filter(place =>

            Number.isFinite(place.lat) &&

            Number.isFinite(place.lon)
        );


    const bounds = [];


    validPlaces.forEach(place => {

        const marker =
            L.marker([
                place.lat,
                place.lon
            ]).addTo(
                markersLayer
            );


        marker.bindPopup(`

            <strong>
                ${escapeHtml(
                    getPlaceName(place)
                )}
            </strong>

            <br>

            ${escapeHtml(
                place.address
            )}

            <br>

            ${escapeHtml(
                place.location
            )}

        `);


        bounds.push([
            place.lat,
            place.lon
        ]);
    });


    if (bounds.length) {

        map.fitBounds(
            bounds,
            {
                padding: [30, 30],
                maxZoom: 15
            }
        );
    }
}


/* =========================
   FAVORIETEN
========================= */

function toggleFavorite(id) {

    if (
        favorites.includes(id)
    ) {

        favorites =
            favorites.filter(
                favoriteId =>
                    favoriteId !== id
            );

    } else {

        favorites.push(id);
    }


    localStorage.setItem(
        "brusselsExplorerFavorites",
        JSON.stringify(favorites)
    );


    updateFavoriteCount();

    renderFavorites();

    renderCards();
}


function updateFavoriteCount() {

    const count =
        $("favorite-count");


    if (count) {

        count.textContent =
            favorites.length;
    }
}


function renderFavorites() {

    const container =
        $("favorites-container");


    const empty =
        $("favorites-empty");


    const favoritePlaces =
        places.filter(place =>
            favorites.includes(
                place.id
            )
        );


    empty.style.display =
        favoritePlaces.length
            ? "none"
            : "block";


    container.innerHTML =
        favoritePlaces.map(place => `

            <article class="place-card">

                <div class="place-card-top">

                    <span class="place-category">
                        ${escapeHtml(
                            getPlaceCategory(place)
                        )}
                    </span>


                    <button

                        class="
                            favorite-button
                            is-favorite
                        "

                        data-favorite="${escapeHtml(
                            place.id
                        )}"

                        type="button"

                    >
                        ♥
                    </button>

                </div>


                <h3>
                    ${escapeHtml(
                        getPlaceName(place)
                    )}
                </h3>


                <p class="place-address">
                    ${escapeHtml(
                        place.address
                    )}
                </p>


                <p class="place-location">
                    📍
                    ${escapeHtml(
                        place.location
                    )}
                </p>

            </article>

        `).join("");
}


/* =========================
   THEMA
========================= */

function applyTheme(theme) {

    document.body.classList.remove(
        "theme-light",
        "theme-pink",
        "theme-dark"
    );


    document.body.classList.add(
        `theme-${theme}`
    );


    $("theme-select").value =
        theme;


    localStorage.setItem(
        "brusselsExplorerTheme",
        theme
    );
}


function cycleTheme() {

    const current =
        $("theme-select").value;


    let next;


    if (current === "light") {

        next = "pink";

    } else if (current === "pink") {

        next = "dark";

    } else {

        next = "light";
    }


    applyTheme(next);
}


/* =========================
   VOORKEUREN
========================= */

function savePreferences(event) {

    event.preventDefault();


    const theme =
        $("theme-select").value;


    const locationEnabled =
        $("location-preference").checked;


    applyTheme(theme);


    localStorage.setItem(
        "brusselsExplorerLocation",
        String(locationEnabled)
    );


    const button =
        document.querySelector(
            "#preferences-form button"
        );


    const originalText =
        translations[
            currentLanguage
        ].savePrefs;


    button.textContent =
        translations[
            currentLanguage
        ].saved;


    setTimeout(() => {

        button.textContent =
            originalText;

    }, 1800);
}


/* =========================
   LOCATIE
========================= */

function useNearby() {

    if (!navigator.geolocation) {

        alert(
            "Je browser ondersteunt geen locatie."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        position => {

            const userLat =
                position.coords.latitude;


            const userLon =
                position.coords.longitude;


            const nearby =
                places
                    .map(place => {

                        if (
                            !Number.isFinite(
                                place.lat
                            ) ||
                            !Number.isFinite(
                                place.lon
                            )
                        ) {

                            return {
                                place,
                                distance:
                                    Infinity
                            };
                        }


                        const distance =
                            Math.sqrt(

                                Math.pow(
                                    place.lat -
                                        userLat,
                                    2
                                )

                                +

                                Math.pow(
                                    place.lon -
                                        userLon,
                                    2
                                )
                            );


                        return {
                            place,
                            distance
                        };

                    })
                    .sort(
                        (a, b) =>
                            a.distance -
                            b.distance
                    )
                    .slice(0, 20);


            filteredPlaces =
                nearby.map(
                    item =>
                        item.place
                );


            $("result-count")
                .textContent =
                `${filteredPlaces.length}
                ${translations[
                    currentLanguage
                ].results}`;


            renderCards();

            renderTable();

            updateMap();


            if (map) {

                L.marker([
                    userLat,
                    userLon
                ])
                    .addTo(map)
                    .bindPopup(
                        "Je bent hier"
                    )
                    .openPopup();


                map.setView(
                    [
                        userLat,
                        userLon
                    ],
                    14
                );
            }

        },


        () => {

            alert(
                "Ik kon je locatie niet ophalen. Controleer de toestemming in je browser."
            );
        }
    );
}


/* =========================
   EVENTS
========================= */

$("language-select")
    .addEventListener(
        "change",
        event => {

            currentLanguage =
                event.target.value;


            localStorage.setItem(
                "brusselsExplorerLanguage",
                currentLanguage
            );


            populateFilters();

            applyLanguage();
        }
    );


$("theme-button")
    .addEventListener(
        "click",
        cycleTheme
    );


$("preferences-form")
    .addEventListener(
        "submit",
        savePreferences
    );


$("search-input")
    .addEventListener(
        "input",
        render
    );


$("category-filter")
    .addEventListener(
        "change",
        render
    );


$("location-filter")
    .addEventListener(
        "change",
        render
    );


$("sort-select")
    .addEventListener(
        "change",
        render
    );


$("reset-filters")
    .addEventListener(
        "click",
        () => {

            $("search-input").value = "";

            $("category-filter").value = "";

            $("location-filter").value = "";

            $("sort-select").value =
                "name-asc";

            render();
        }
    );


$("nearby-button")
    .addEventListener(
        "click",
        useNearby
    );


document
    .querySelectorAll(".view-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".view-button"
                    )
                    .forEach(btn =>
                        btn.classList.remove(
                            "active"
                        )
                    );


                button.classList.add(
                    "active"
                );


                currentView =
                    button.dataset.view;


                renderTable();
            }
        );
    });


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
        }
    }
);


/* =========================
   START
========================= */

async function init() {

    $("loading").style.display =
        "block";


    $("error-message").textContent =
        "";


    const savedTheme =
        localStorage.getItem(
            "brusselsExplorerTheme"
        ) || "light";


    const savedLocation =
        localStorage.getItem(
            "brusselsExplorerLocation"
        ) === "true";


    applyTheme(savedTheme);


    $("location-preference")
        .checked =
        savedLocation;


    initMap();


    try {

        places =
            await fetchPlaces();


        console.log(
            "✅ API werkt!",
            places.length,
            "plaatsen geladen."
        );


        console.table(
            places.slice(0, 10)
        );


        $("loading").style.display =
            "none";


        populateFilters();

        applyLanguage();

        renderFavorites();

        updateFavoriteCount();


    } catch (error) {

        console.error(
            "❌ API FOUT:",
            error
        );


        $("loading").style.display =
            "none";


        $("error-message").innerHTML = `

            <strong>
                De plaatsen konden niet geladen worden.
            </strong>

            <br><br>

            Controleer je internetverbinding
            en vernieuw daarna de pagina.

        `;
    }
}


/* Eerste taal toepassen */

applyLanguage();


/* Website starten */

init();