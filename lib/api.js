import { GROCERY_INDUSTRIES } from "./constants.js";
import { API_HEADERS } from "./settings.js";
import { isNotExpired } from "./utils.js";
import { parseOffer } from "./offers.js";

const API_SEARCH = "https://api.marktguru.de/api/v1/offers/search";
const API_PUBLISHERS = "https://api.marktguru.de/api/v1/offers/publishers";
const API_RETAILER_OFFERS = "https://api.marktguru.de/api/v1/publishers/retailer";
const API_LEAFLET_FLIGHTS = "https://api.marktguru.de/api/v1/leafletflights/industries";
const API_LEAFLET_FLIGHTS_BEST = "https://api.marktguru.de/api/v1/leafletflights";
const API_LEAFLET_DETAIL = "https://api.marktguru.de/api/v1/leaflets";
const API_LEAFLET_OFFERS = "https://api.marktguru.de/api/v1/offers";
const LEAFLET_IMG_CDN = "https://mg2de.b-cdn.net/api/v1/leaflets";

export function leafletPageUrl(leafletId, pageIndex) {
  return `${LEAFLET_IMG_CDN}/${leafletId}/images/pages/${pageIndex}/large.webp`;
}

export async function fetchRetailerOffers(retailerSlug, zip, {
  limit = 500,
  offset = 0,
  fallbackIndustryIds = [],
  fallbackCategoryNames = [],
  retailerName = "",
} = {}) {
  if (!retailerSlug) return [];
  const url = `${API_RETAILER_OFFERS}/${encodeURIComponent(retailerSlug)}/offers?as=mobile&limit=${limit}&offset=${offset}&zipCode=${zip}`;
  console.log("[SP] retailer offers:", url);
  let resp;
  try { resp = await fetch(url, { headers: API_HEADERS }); }
  catch(e) { throw new Error(`Netzwerkfehler für ${retailerSlug}: ${e.message}`); }
  if (!resp.ok) { throw new Error(`Retailer API Fehler ${resp.status} (${retailerSlug})`); }
  const data = await resp.json();
  return (data.results || []).map(raw => parseOffer(raw, {
    industryIds: fallbackIndustryIds,
    categoryNames: fallbackCategoryNames,
    retailer: { name: retailerName, uniqueName: retailerSlug },
  })).filter(isNotExpired);
}

export async function fetchPublishers(zip, { limit = 50, offerLimit = 500, showAllIndustries = false } = {}) {
  const url = `${API_PUBLISHERS}?as=mobile&limit=${limit}&offerLimit=1&zipCode=${zip}`;
  console.log("[SP] publishers:", url);
  let resp;
  try { resp = await fetch(url, { headers: API_HEADERS }); }
  catch(e) { console.error("[SP] net err:", e); throw new Error(`Netzwerkfehler: ${e.message}`); }
  if (!resp.ok) { const b=await resp.text().catch(()=>""); console.error(`[SP] ${resp.status}:`,b.slice(0,200)); throw new Error(`API Fehler ${resp.status}`); }
  const data = await resp.json();

  const groupsRaw = await Promise.all((data.results || []).map(async (pub) => {
    let offers = [];
    const fallbackIndustryIds = Array.from(new Set((pub.offers || []).flatMap(o => (o.industries || []).map(i => i.id)).filter(id => typeof id === "number")));
    const fallbackCategoryNames = Array.from(new Set((pub.offers || []).flatMap(o => (o.categories || []).map(c => c.name)).filter(Boolean)));
    try {
      offers = await fetchRetailerOffers(pub.uniqueName, zip, {
        limit: offerLimit,
        offset: 0,
        fallbackIndustryIds,
        fallbackCategoryNames,
        retailerName: pub.name,
      });
    } catch (e) {
      console.error(`[SP] retailer fallback ${pub.uniqueName}:`, e.message);
      offers = (pub.offers || []).map(raw => parseOffer(raw, {
        industryIds: fallbackIndustryIds,
        categoryNames: fallbackCategoryNames,
        retailer: { name: pub.name, uniqueName: pub.uniqueName },
      })).filter(isNotExpired);
    }
    const scopedOffers = showAllIndustries
      ? offers
      : offers.filter(o => o.industryIds.some(id => GROCERY_INDUSTRIES.has(id)));
    if (scopedOffers.length === 0) return null;
    return {
      id: pub.id,
      slug: pub.uniqueName,
      name: pub.name,
      offers: scopedOffers,
    };
  }));
  const groups = groupsRaw.filter(Boolean);

  console.log(`[SP] ${groups.length} grocery retailers, ${groups.reduce((s,g)=>s+g.offers.length,0)} offers`);
  return groups;
}

export async function apiSearch(query, zip, limit=200) {
  const url = `${API_SEARCH}?as=web&limit=${limit}&offset=0&q=${encodeURIComponent(query)}&zipCode=${zip}`;
  console.log("[SP] search:", url);
  let resp;
  try { resp = await fetch(url, { headers: API_HEADERS }); }
  catch(e) { throw new Error(`Netzwerkfehler: ${e.message}`); }
  if (!resp.ok) { throw new Error(`API Fehler ${resp.status}`); }
  const data = await resp.json();
  return (data.results || []).map(parseOffer).filter(isNotExpired);
}

export async function fetchLeafletFlights(zip, { showAllIndustries = false } = {}) {
  const url = `${API_LEAFLET_FLIGHTS}?as=mobile&leafletFlightLimit=64&limit=64&zipCode=${zip}`;
  console.log("[SP] leaflet flights:", url);
  const resp = await fetch(url, { headers: API_HEADERS });
  if (!resp.ok) throw new Error(`Leaflet API Fehler ${resp.status}`);
  const data = await resp.json();
  const map = {};
  for (const industry of (data.results || data || [])) {
    if (!showAllIndustries && !GROCERY_INDUSTRIES.has(industry.id)) continue;
    for (const flight of (industry.leafletFlights || [])) {
      const adv = flight.advertiser || {};
      const slug = adv.uniqueName || "";
      if (!slug) continue;
      if (!map[slug]) map[slug] = [];
      map[slug].push({
        id: flight.id,
        mainLeafletId: flight.mainLeafletId,
        advertiserName: adv.name || "",
        advertiserSlug: slug,
        offerCount: flight.offerCount || 0,
        pageCount: flight.pageCount || 0,
        validFrom: flight.validFrom,
        validTo: flight.validTo,
      });
    }
  }
  console.log(`[SP] leaflet flights: ${Object.keys(map).length} retailers`);
  return map;
}

export async function fetchLeafletDetail(leafletId, zip) {
  const url = `${API_LEAFLET_DETAIL}/${leafletId}?as=mobiledetailed&zipCode=${zip}`;
  console.log("[SP] leaflet detail:", url);
  const resp = await fetch(url, { headers: API_HEADERS });
  if (!resp.ok) throw new Error(`Leaflet Detail API Fehler ${resp.status}`);
  return resp.json();
}

export async function fetchLeafletPageOffers(leafletId, pageIndex) {
  const url = `${API_LEAFLET_OFFERS}?as=mobiledetailed&leafletId=${leafletId}&pageIndex=${pageIndex}`;
  console.log("[SP] leaflet page offers:", url);
  const resp = await fetch(url, { headers: API_HEADERS });
  if (!resp.ok) throw new Error(`Leaflet Offers API Fehler ${resp.status}`);
  const data = await resp.json();
  return (data.results || []).map(parseOffer).filter(isNotExpired);
}

export async function fetchBestLeaflet(flightId, zip, coords) {
  let url = `${API_LEAFLET_FLIGHTS_BEST}/${flightId}/bestleaflet?as=mobiledetailed&zipCode=${zip}`;
  if (coords) url += `&latitude=${coords.lat}&longitude=${coords.lon}`;
  const resp = await fetch(url, { headers: API_HEADERS });
  if (!resp.ok) return null;
  return resp.json();
}

export async function geocodeZip(zip) {
  if (!zip || zip.length < 5) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=de&format=json&limit=1`;
    console.log("[SP] geocode:", url);
    const resp = await fetch(url, { headers: { "User-Agent": "SparPilot/1.0" } });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (e) {
    console.error("[SP] geocode err:", e);
    return null;
  }
}

export async function fetchStoreLocations(leafletFlights, zip, coords) {
  const storeMap = {};
  // Pick first flight per retailer
  const entries = Object.entries(leafletFlights);
  const results = await Promise.allSettled(
    entries.map(async ([slug, flights]) => {
      if (!flights.length) return;
      const best = await fetchBestLeaflet(flights[0].id, zip, coords);
      const store = best?.closestStore;
      if (store) {
        storeMap[slug] = {
          name: store.name || "",
          address: store.address || "",
          zipCode: store.zipCode || "",
          distance: store.distanceInMeters ?? null,
        };
      }
    })
  );
  console.log(`[SP] store locations: ${Object.keys(storeMap).length}/${entries.length}`);
  return storeMap;
}
