# Spar·Pilot

A mobile-first grocery deal finder for German supermarkets. Browse current offers from Lidl, Aldi, REWE, Edeka, Penny, and more — all in one place. Search across retailers, flip through digital leaflets, and build a shopping list.

## Features

- **Angebote tab** — Browse offers grouped by retailer with category accordions, inline search, and retailer/category filters
- **Prospekt viewer** — Page through digital leaflets with clickable hotspots to add items directly
- **Global search** — Lucene-style search across all retailers (supports `OR`, phrases, wildcards) with synonym expansion
- **Shopping list** — Add offers from any tab, track quantities, check off items, grouped by store and category
- **Settings** — ZIP code, loyalty card filtering, industry scope (grocery-only or all)

Data comes from the MarktGuru API.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app defaults to ZIP code `35516` — change it in Settings.

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
  api.js                     All MarktGuru API fetch functions

components/
  Icons.jsx                  SVG icon components
  Shared.jsx                 ErrBox, Spinner, Tog toggle, chipRowStyle
  Card.jsx                   Offer card component
  ProspektViewer.jsx         Full-screen leaflet overlay (self-contained state)
  AngeboteTab.jsx            Browse tab with filter/accordion UI
  SearchTab.jsx              Global search tab
  ListTab.jsx                Shopping list tab
  SettingsTab.jsx            Settings tab

src/
  main.jsx                   React entry point + localStorage polyfill
```

## Tech stack

- React 19 — UI
- Vite 7 — bundler / dev server
- No CSS framework — inline styles throughout
