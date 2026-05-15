import { normalizeText, uPrice } from "./utils.js";
import { scoreOfferMatch } from "./offers.js";

export function stapleKey(term) {
  return normalizeText(term).replace(/\s+/g, " ");
}

export function stapleMatchesOffer(staple, offer) {
  if (!staple?.term || !offer) return false;
  return scoreOfferMatch(offer, staple.term).matched;
}

function offerFingerprint(offer) {
  const validityTo = offer.validityDates?.[0]?.to || "";
  return [offer.id, offer.retailerSlug, offer.price, validityTo].filter(Boolean).join(":");
}

export function recordOfferForStaple(memory, term, offer, seenAt = new Date().toISOString()) {
  const key = stapleKey(term);
  if (!key || !offer?.id || typeof offer.price !== "number") return memory;

  const entry = {
    fingerprint: offerFingerprint(offer),
    offerId: offer.id,
    productName: offer.productName,
    brandName: offer.brandName || null,
    retailerName: offer.retailerName,
    retailerSlug: offer.retailerSlug,
    price: offer.price,
    oldPrice: offer.oldPrice || null,
    unitPrice: uPrice(offer),
    unitShort: offer.unitShort || null,
    seenAt,
    validTo: offer.validityDates?.[0]?.to || null,
  };

  const existing = Array.isArray(memory?.[key]) ? memory[key] : [];
  const nextEntries = [
    entry,
    ...existing.filter(item => item.fingerprint !== entry.fingerprint),
  ].slice(0, 40);

  return { ...(memory || {}), [key]: nextEntries };
}

export function recordOffersForStaple(memory, term, offers) {
  return offers.slice(0, 12).reduce(
    (next, offer) => recordOfferForStaple(next, term, offer),
    memory || {}
  );
}

export function recordOfferForMatchingStaples(memory, staples, offer) {
  return staples
    .filter(staple => stapleMatchesOffer(staple, offer))
    .reduce((next, staple) => recordOfferForStaple(next, staple.term, offer), memory || {});
}

export function memorySummary(memory, term) {
  const entries = Array.isArray(memory?.[stapleKey(term)]) ? memory[stapleKey(term)] : [];
  if (!entries.length) return null;

  const prices = entries.map(item => item.price).filter(price => typeof price === "number");
  const unitPrices = entries.map(item => item.unitPrice).filter(price => typeof price === "number");
  const latest = [...entries].sort((a, b) => new Date(b.seenAt) - new Date(a.seenAt))[0];
  const best = [...entries].sort((a, b) => a.price - b.price)[0];

  return {
    count: entries.length,
    latest,
    best,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    minUnitPrice: unitPrices.length ? Math.min(...unitPrices) : null,
  };
}
