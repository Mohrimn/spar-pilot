# Spar·Pilot

A mobile-first grocery deal finder for German supermarkets. Browse current offers from Lidl, Aldi, REWE, Edeka, Penny, and more — all in one place. Search across retailers, flip through digital leaflets, and build a shopping list.

## Features

- **Angebote tab** — Browse offers grouped by retailer with category accordions, inline search, and retailer/category filters
- **Prospekt viewer** — Page through digital leaflets with clickable hotspots to add items directly
- **Global search** — Lucene-style search across all retailers (supports `OR`, phrases, wildcards) with synonym expansion
- **Stammprodukte + price memory** — Save recurring product terms, refresh current matches, and keep a local price history for comparison
- **Shopping list + Einkaufsplan** — Add offers from any tab, track quantities, compare store totals, spot expiring/future offers, and get a compact route plan
- **Tanken tab** — Live gas prices from nearby stations (E5, E10, Diesel) sorted by price, powered by the Tankerkönig API
- **Settings** — ZIP code, loyalty card filtering, industry scope (grocery-only or all)

Data comes from the MarktGuru API.
## Disclaimer
This project is unofficial and is not affiliated with, endorsed by, or sponsored by MarktGuru or any listed retailer.
The license of this repository applies only to the source code written for this project. It does not grant any rights to third party APIs, data, trademarks, logos, endpoints, or services.
Users are responsible for ensuring that their use of this project complies with applicable laws and the terms of any third party services they interact with.

## Cooking from offers

The **Kochen** tab matches 40 curated vegetarian and vegan recipes to offers for
an explicit shopping date (Europe/Berlin). Preferences for diet, portions, cooking
time, meal prep, excluded ingredients and retailer are saved locally.

Only offers with known validity and a positive price are matched. Loyalty offers
require a card selected in Settings. Ingredient names deliberately match narrowly;
ambiguous variants and prepared foods are not treated as equivalent ingredients.
The feed is a set of advertised offers, not proof that every product is discounted:
a discount is counted only when the supplied old price exceeds the current price.

Recipe details show quantities, instructions, linked offers and additional ingredients.
Mark ingredients already available before adding the rest to the list. Recipe
requirements aggregate by ingredient and unit, separately from priced offer packs.
Adding a pack does not automatically satisfy an ingredient requirement: check the
pack size and mark the corresponding requirement as available or completed.
Unknown prices are excluded from the labelled offer subtotal. Pack counts are shown
only for an unambiguous pack-size description; no whole-meal price is invented.

Offers refresh on recipe-tab entry after a date/postcode change, on window focus
following such a change, and through the refresh button. API cache entries expire
after 15 minutes when next requested.

This initial catalogue has no meat recipes, nutrition calculations, protein target,
AI generation or full weekly planner. Ingredient exclusions are not an allergen
certification. Recipe data lives in `lib/recipes.js` and `lib/recipeCatalogue.js` and the UI in
`components/RecipesTab.jsx`.

Run `npm test` for matching, date, quantity and shopping-list regression tests.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app defaults to ZIP code `35516` — change it in Settings.

### Environment variables

Create a local `.env` file (or copy `.env.example`) with:

```bash
VITE_DEFAULT_ZIP=35516
VITE_API_CLIENT_KEY=...
VITE_API_KEY=...
```

Because this is a client-side Vite app, these values are bundled into frontend code at build time.

## Build

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## Project structure

```
angebote-finder.jsx          Main orchestrator (~90 lines)

lib/
  constants.js               Retailer metadata, config, color helpers
  utils.js                   Text normalization, date formatting, storage
  offers.js                  Offer parsing, search engine, categorization, synonyms
  priceMemory.js             Stammprodukte price history helpers
  api.js                     All MarktGuru API fetch functions

components/
  Icons.jsx                  SVG icon components
  Shared.jsx                 ErrBox, Spinner, Tog toggle, chipRowStyle
  Card.jsx                   Offer card component
  ProspektViewer.jsx         Full-screen leaflet overlay (self-contained state)
  AngeboteTab.jsx            Browse tab with filter/accordion UI
  SearchTab.jsx              Global search tab
  StammTab.jsx               Saved recurring products + local price memory
  ListTab.jsx                Shopping list tab
  SettingsTab.jsx            Settings tab
  GasPricesTab.jsx           Tanken tab — nearby fuel prices

src/
  main.jsx                   React entry point + localStorage polyfill
```

## Tech stack

- React 19 — UI
- Vite 7 — bundler / dev server
- No CSS framework — inline styles throughout

The local collection includes pasta, curries, soups, salads, bowls, skillet meals
and oven dishes. No recipe service or paid subscription is required. Canned
legumes match only when the offer description confirms a cooked/canned product;
dry legumes are not interchangeable. Recipe amounts use drained weight.
