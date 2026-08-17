# BrusselsExplorer ♡

## 1. Projectbeschrijving

BrusselsExplorer is mijn individueel project voor Dynamic Web. Met de website kan je interessante plaatsen in Brussel ontdekken. Ik gebruik hiervoor echte open data van de Stad Brussel / Visit.Brussels.

Je kan zoeken op naam, filteren op type en gemeente, sorteren, plaatsen op een kaart bekijken en favorieten bewaren. Er is ook een donkere modus, een taalvoorkeur, geolocatie en een klein formulier om persoonlijke voorkeuren lokaal te bewaren.

Ik heb gekozen voor een zachte roze stijl omdat ik de website een beetje als een persoonlijke city guide wilde laten aanvoelen, maar ik heb de layout bewust vrij simpel gehouden.

## 2. Dataset en API

Gebruikte dataset:

- **Cultural, tourist and event venues registered by Visit.Brussels in the City of Brussels**
- Dataset ID: `lieux_culturels_touristiques_evenementiels_visitbrussels_vbx`
- API: `https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/lieux_culturels_touristiques_evenementiels_visitbrussels_vbx/records?limit=100`
- Bron: https://opendata.brussels.be/explore/dataset/lieux_culturels_touristiques_evenementiels_visitbrussels_vbx/
- Licentie: CC BY 4.0

De dataset bevat volgens het Open Data-portaal honderden plaatsen en bevat onder andere categorie, naam, adres, gemeente, telefoon, website en geografische coördinaten. De dataset wordt dagelijks bijgewerkt.

## 3. Functionaliteiten

- Data ophalen met Fetch API
- Minstens 20 records ophalen uit de Open Data API
- Kaartenweergave
- Tabelweergave met meer dan 6 kolommen
- Zoeken
- Filteren op type
- Filteren op gemeente
- Sorteren op naam, type en recente update
- Details openen in een modal
- Favorieten toevoegen/verwijderen
- Favorieten bewaren met LocalStorage
- Donkere modus bewaren met LocalStorage
- Taalkeuze bewaren met LocalStorage
- Geolocatie gebruiken om afstand te tonen
- Persoonlijke voorkeuren bewaren
- Formulier validatie
- Responsive design
- IntersectionObserver voor de kaarten

## 4. Technische vereisten

### DOM manipulatie

**Elementen selecteren**

In `script.js` gebruik ik onder andere:

- `document.getElementById()` voor de belangrijkste elementen.
- `document.querySelectorAll()` voor knoppen en kaarten.
- `document.querySelector()` / `closest()` voor events.

**Elementen manipuleren**

De pagina wordt dynamisch opgebouwd met `innerHTML`, `textContent`, `classList` en `create`-achtige DOM acties via de rendering van de kaarten en tabel.

**Events**

Ik gebruik `addEventListener()` voor onder andere:

- `click`
- `input`
- `change`
- `submit`
- `keydown`
- `load`

### Modern JavaScript

**Constanten**

In het begin van `script.js` staan bijvoorbeeld `API_URL` en `STORAGE_KEYS` met `const`.

**Template literals**

Bij het maken van de HTML van de kaarten, tabel en modal gebruik ik backticks en `${...}`.

**Iteratie over arrays**

Ik gebruik `for...of` bij het uitlezen van velden en `forEach()` bij onder andere events en observer entries.

**Array methodes**

Ik gebruik onder andere:

- `map()` om HTML te maken.
- `filter()` voor zoeken en filters.
- `sort()` voor sorteren.
- `find()` om een plaats te vinden.
- `some()` voor favorieten.
- `reduce()` is gebruikt in de afstandsberekening niet; de app gebruikt vooral `map`, `filter`, `sort`, `find` en `some` omdat die hier nuttiger zijn.

**Arrow functions**

Er staan veel arrow functions in `script.js`, bijvoorbeeld bij `map`, `filter`, event callbacks en de IntersectionObserver.

**Ternary operator**

Bijvoorbeeld bij de tekst van de result count en bij de favorietenknop.

**Callback functions**

Callbacks worden gebruikt bij `addEventListener`, `forEach`, `map`, `filter`, `sort` en de geolocation callback.

**Promises**

`fetch()` werkt met Promises. In `fetchPlaces()` wordt de Promise met `await` afgehandeld. Ook worden de Promise-afspraken gebruikt door `async` functies.

**Async & Await**

`fetchPlaces()` en `startApp()` zijn async functies en gebruiken `await`.

**Observer API**

Ik gebruik `IntersectionObserver` in `observeCards()`. Hierdoor worden kaarten zichtbaar wanneer ze in beeld komen.

### Data & API

De data wordt opgehaald met:

```js
const response = await fetch(API_URL);
const data = await response.json();
```

Daarna wordt de JSON data omgezet naar een eenvoudiger object met `normalizePlace()` en op de pagina getoond.

### LocalStorage

Favorieten worden opgeslagen als JSON:

```js
localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
```

Bij het openen van de website worden ze opnieuw ingelezen met `JSON.parse()`.

Ook de volgende voorkeuren worden bewaard:

- thema
- taal
- geolocatie
- formuliergegevens

### Formulier validatie

Het formulier controleert onder andere:

- naam: minstens 2 tekens
- geldig e-mailadres
- bericht: minstens 5 tekens

Ik gebruik zowel HTML-validatie (`required`, `minlength`, `type="email"`) als JavaScript-validatie.

### Responsive design

De website gebruikt CSS Grid, Flexbox en media queries. De kaarten veranderen bijvoorbeeld van drie kolommen naar twee en uiteindelijk naar één kolom op kleinere schermen.

## 5. Installatie

Dit is een gewone HTML/CSS/JavaScript website.

1. Download of clone de repository.
2. Open de map in Visual Studio Code.
3. Start de website met Live Server.
4. Open de URL die Live Server geeft.
5. Een internetverbinding is nodig omdat de website de Open Data API en Leaflet kaart gebruikt.

Je hebt geen npm-installatie nodig.

## 6. Bestandsstructuur

```text
BrusselsExplorer/
├── index.html
├── styles.css
├── script.js
├── README.md
└── .gitignore
```

## 7. Bronnen

- Open Data Brussels: https://opendata.brussels.be/
- Gebruikte dataset: https://opendata.brussels.be/explore/dataset/lieux_culturels_touristiques_evenementiels_visitbrussels_vbx/
- Visit.Brussels: https://www.visit.brussels/
- Leaflet: https://leafletjs.com/
- OpenStreetMap: https://www.openstreetmap.org/
- MDN Web Docs: https://developer.mozilla.org/

## 8. AI chatlog

Ik heb ChatGPT gebruikt als hulpmiddel tijdens het project voor uitleg over JavaScript-concepten, ideeën voor de structuur en hulp bij debugging. De uiteindelijke code heb ik aangepast zodat ik de werking zelf kan uitleggen en zodat de code past bij wat we in Dynamic Web gezien hebben.

## 9. Commits

Voor GitHub maak ik tijdens het project verschillende kleine commits, bijvoorbeeld:

```text
Initial project setup
Add Brussels Open Data API
Add place cards and search
Add filters and sorting
Add favorites with localStorage
Add interactive map
Add preferences and validation
Add responsive styling
Finish README and cleanup
```

Deze commits zijn bedoeld om mijn ontwikkelingsproces zichtbaar te maken in plaats van alles in één keer te committen.

## 10. Wat ik kan uitleggen tijdens de demo

Ik kan uitleggen hoe de API-data binnenkomt, hoe `fetch()` en `async/await` werken, hoe de filters de array aanpassen, hoe favorieten met LocalStorage worden bewaard, hoe geolocatie werkt en waarom ik een IntersectionObserver heb gebruikt.
