export function normalizeText(v) {
  return (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeNormalized(text) {
  if (!text) return [];
  return normalizeText(text).split(/[^a-z0-9]+/).filter(Boolean);
}

export function fmtDate(d) { return d ? new Date(d).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}) : ""; }
export function dLeft(d) { return d ? Math.ceil((new Date(d)-new Date())/864e5) : null; }
export function disc(o) { return o.oldPrice && o.oldPrice>o.price ? Math.round(((o.oldPrice-o.price)/o.oldPrice)*100) : 0; }
export function uPrice(o) { if (o.referencePrice>0 && o.referencePrice !== o.price) return o.referencePrice; if (o.price&&o.volume>0) return o.price/o.volume; return null; }

export async function sLoad(k,fb) { try { const r=await window.storage.get(k); return r?JSON.parse(r.value):fb; } catch{return fb;} }
export async function sSave(k,v) { try { await window.storage.set(k,JSON.stringify(v)); } catch{} }

export function isNotExpired(o) {
  const now = new Date();
  if (!o.validityDates?.length) return true;
  return o.validityDates.some(v => now <= new Date(v.to));
}

export function getRelevantValidity(validityDates, now = new Date()) {
  if (!Array.isArray(validityDates) || validityDates.length === 0) return null;
  const ranges = validityDates
    .map(v => ({ from: new Date(v.from), to: new Date(v.to), raw: v }))
    .filter(v => !Number.isNaN(v.from.getTime()) && !Number.isNaN(v.to.getTime()))
    .sort((a, b) => a.from - b.from);
  if (!ranges.length) return null;
  const current = ranges.find(v => now >= v.from && now <= v.to);
  if (current) return current.raw;
  const next = ranges.find(v => now < v.from);
  if (next) return next.raw;
  return ranges[ranges.length - 1].raw;
}

export function pickCurrentFlight(flights) {
  if (!flights || flights.length === 0) return { current: null, all: [] };
  const now = new Date();
  const active = flights
    .filter(f => new Date(f.validFrom) <= now && now <= new Date(f.validTo))
    .sort((a, b) => new Date(a.validTo) - new Date(b.validTo));
  return { current: active[0] || flights[0], all: flights };
}

export function isStarted(o, now = new Date()) {
  const validity = getRelevantValidity(o.validityDates, now);
  if (!validity?.from) return true;
  return new Date(validity.from) <= now;
}
