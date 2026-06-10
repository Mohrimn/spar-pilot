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
Disclaimer

This project is unofficial and is not affiliated with, endorsed by, or sponsored by MarktGuru or any listed retailer.

The license of this repository applies only to the source code written for this project. It does not grant any rights to third party APIs, data, trademarks, logos, endpoints, or services.

Users are responsible for ensuring that their use of this project complies with applicable laws and the terms of any third party services they interact with.

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
