import { DEFAULT_ZIP as SETTINGS_DEFAULT_ZIP } from "./settings.js";

export const DEFAULT_ZIP = SETTINGS_DEFAULT_ZIP;
export const GROCERY_INDUSTRIES = new Set([1009, 1023, 1024]); // Supermarkt, Discounter, Drogerie & Gesundheit

export const RETAILER_META = {
  "lidl":{name:"Lidl",color:"#0050aa",loyalty:"Lidl Plus"},
  "netto-marken-discount":{name:"Netto",color:"#ffe800",loyalty:"Payback"},
  "aldi-sued":{name:"Aldi Süd",color:"#00005f"},
  "aldi-nord":{name:"Aldi Nord",color:"#00005f"},
  "penny":{name:"Penny",color:"#cd1719",loyalty:"Penny App"},
  "norma":{name:"Norma",color:"#e2001a"},
  "rewe":{name:"REWE",color:"#cc071e",loyalty:"REWE Bonus"},
  "rewe-center":{name:"REWE Center",color:"#cc071e",loyalty:"REWE Bonus"},
  "edeka":{name:"Edeka",color:"#1b3a73",loyalty:"Payback"},
  "kaufland":{name:"Kaufland",color:"#e10a14",loyalty:"Kaufland XTRA"},
  "dm-drogerie-markt":{name:"dm",color:"#009ee3"},
  "rossmann":{name:"Rossmann",color:"#e30613"},
  "mueller":{name:"Müller",color:"#ff6600"},
  "globus":{name:"Globus",color:"#004f9f"},
  "hit":{name:"HIT",color:"#e3000f"},
};
export const DEFAULT_LOYALTY = ["rewe","rewe-center","lidl"];

export function getRetColor(slug, name) {
  if (slug && RETAILER_META[slug]) return RETAILER_META[slug].color;
  if (!name) return "#6b7280";
  const l = name.toLowerCase();
  for (const [s,m] of Object.entries(RETAILER_META)) {
    if (l.includes(m.name.toLowerCase())) return m.color;
  }
  return "#6b7280";
}

export function loyaltyRetailers() {
  return Object.entries(RETAILER_META).filter(([, m]) => m.loyalty).map(([slug, m]) => ({ slug, name: m.name, loyalty: m.loyalty }));
}

export function isMyLoyalty(slug, name, myLoyalty) {
  if (!myLoyalty || !myLoyalty.length) return false;
  const l = (slug||"").toLowerCase();
  const n = (name||"").toLowerCase();
  return myLoyalty.some(s => l.includes(s) || n.includes(RETAILER_META[s]?.name.toLowerCase()||"__"));
}

export function isLightColor(rc) {
  return ["#fff000","#ffe800"].includes(rc);
}
