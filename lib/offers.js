import { normalizeText, tokenizeNormalized, disc } from "./utils.js";

export const FAKE_BRAND = "thisisnobrand123";

export function inferOfferCategory({ productName = "", brandName = "", description = "", unitShort = "" }) {
  const tokens = tokenizeNormalized([productName, brandName, description].filter(Boolean).join(" "));
  const innerMatchStems = new Set(["tomat", "karott"]);
  const has = (terms) => terms.some(term => tokens.some(tok =>
    tok === term ||
    (term.length >= 4 && tok.startsWith(term)) ||
    (term.length >= 4 && tok.endsWith(term)) ||
    (term.length >= 7 && tok.includes(term)) ||
    (innerMatchStems.has(term) && tok.includes(term))
  ));
  const unit = normalizeText(unitShort);

  if (has(["schnittblumen", "blumenstrauss", "strauss", "tulpen", "orchidee", "vergissmeinnicht", "osterglocken", "primeln", "hortensien", "blumentopf", "pflanze", "topf", "rasen", "garten", "saat", "deko"])) return "Blumen & Garten";
  if (has(["katze", "katzen", "hund", "hunde", "tiernahrung", "pedigree", "purina", "gourmet", "dentastix", "hundenahrung", "katzennahrung"])) return "Tierbedarf";
  if (has(["socken", "boxershorts", "bastel", "handyzubehor", "kinderbuch", "fritteuse", "tisch", "lampe", "kerze", "duftkerze", "aufbewahrungstasche"])) return "Non-Food";
  if (has(["waschmittel", "toilettenpapier", "kuchentucher", "wisch", "reiniger", "spul", "tabs", "haushalt", "muellbeutel", "aufbewahrung", "tortenunterlagen", "zahnseide"])) return "Haushalt";
  if (has(["dusch", "shampoo", "deo", "zahn", "haarpflege", "haarfarbe", "kosmetik", "rasier", "hautcreme", "handcreme", "gesichtscreme", "sonnencreme", "parfum", "reinigungstucher"])) return "Drogerie";
  if (has(["bier", "helles", "pils", "weizen", "wein", "sekt", "prosecco", "whisky", "vodka", "rum", "likor", "likoer", "cola", "limonade", "saft", "wasser", "shot", "espresso", "kaffee", "spritz", "aperitivo", "tee", "halswarmer", "fanta", "sprite", "mezzo", "bionade", "fritz"])) return "Getranke";
  if (has(["tiefgekuhlt", "tiefkuehl", "tiefkuhl", "pizza", "pommes", "frites", "eiscreme", "speiseeis", "eisbecher", "piccolinis", "frosta", "bami", "burgerpatty", "burgerpatties", "veggieburger", "cheeseburger", "chickenburger", "iglo", "schlemmerfilet"])) return "Tiefkuhlkost";
  if (has(["rind", "schwein", "pute", "hahnchen", "chicken", "kalb", "gyros", "hack", "steak", "braten", "wurst", "salami", "schinken", "lamm", "ente", "eisbein", "kabanos", "mett", "prosciutto", "parma"])) return "Fleisch & Wurst";
  if (has(["fisch", "lachs", "forelle", "kabeljau", "rotbarsch", "garnelen", "garnele", "seelachs", "frutti", "hering", "matjes", "backfisch"])) return "Fisch & Meeresfruchte";
  if (has(["joghurt", "skyr", "quark", "milch", "mozzarella", "kase", "kaese", "schnittkase", "weichkase", "hartkase", "frischkase", "huttenkase", "ricotta", "butter", "sahne", "cremiot", "muritzer", "mueritzer", "activia", "almighurt", "monte", "finello", "grana", "padano", "brie", "camembert", "vioblock", "violife", "streich", "ehrmann", "feta"])) return "Molkerei & Kaese";
  if (has(["brot", "bread", "brotchen", "baguette", "croissant", "kuchen", "toast", "breze", "stange", "weizenbaguette", "steinofenbrot", "waffelhornchen"])) return "Backwaren";
  if (has(["apfel", "pflaume", "mandarine", "zitrone", "birne", "orange", "orangen", "trauben", "banane", "heidelbeere", "gemuse", "kartoffel", "karotte", "karott", "brokkoli", "tomat", "ingwer", "rote", "obst", "salat", "kohlrabi", "kohl", "zwiebel", "mango", "physalis", "spinat", "sellerie", "knoblauch", "melon"])) return "Obst & Gemuese";
  if (has(["chips", "cracker", "waffel", "keks", "schokolade", "bonbon", "gumm", "riegel", "nuss", "nutella", "musli", "muesli", "cerealien", "honig", "kitkat", "celebrations", "ovomaltine", "studentenfutter", "haferkissen", "crunchy", "pinienkerne", "walnuss", "crisps"])) return "Snacks & Susses";
  if (has(["nudel", "noodle", "pasta", "sauce", "konfiture", "marmelade", "mais", "bohnen", "suppe", "mehl", "oel", "ol", "dressing", "essig", "gewurz", "ravioli", "aufstrich", "croutons", "bulgur", "marinaden", "tofu"])) return "Vorrat & Kochen";
  if (unit === "l") return "Getranke";
  return "Sonstiges";
}

export function parseOffer(raw, opts = {}) {
  const fallbackRetailer = opts.retailer || {};
  const adv = raw.advertisers?.[0] || raw.retailer || fallbackRetailer;
  const prod = raw.product || {};
  const brand = raw.brand || {};
  const brandName = brand.name === FAKE_BRAND ? null : (brand.name || null);
  const retailerId = typeof adv.id === "string" ? adv.id.replace("retailers/","") : "";
  const validityDates = raw.validityDates?.length
    ? raw.validityDates
    : ((raw.validFrom || raw.validTo) ? [{ from: raw.validFrom || raw.validTo, to: raw.validTo || raw.validFrom }] : []);
  const rawIndustryIds = raw.industries?.map(i => i.id) || [];
  if (typeof raw.industryId === "number") rawIndustryIds.push(raw.industryId);
  const industryIds = Array.from(new Set(rawIndustryIds.filter(id => typeof id === "number")));
  const fallbackIndustryIds = Array.isArray(opts.industryIds) ? opts.industryIds : [];
  const rawCategoryNames = raw.categories?.map(c => c.name) || [];
  if (raw.category?.name) rawCategoryNames.push(raw.category.name);
  if (raw.categoryName) rawCategoryNames.push(raw.categoryName);
  const categoryNames = Array.from(new Set(rawCategoryNames.filter(Boolean)));
  const productName = prod.name || raw.title || "Unbekannt";
  const description = raw.description || "";
  const unitShort = raw.unit?.shortName || raw.unitShort || null;
  const derivedCategory = inferOfferCategory({
    productName,
    brandName,
    description,
    unitShort,
  });
  return {
    id: raw.id,
    productName,
    brandName,
    retailerName: adv.name || fallbackRetailer.name || "Unbekannt",
    retailerSlug: adv.uniqueName || fallbackRetailer.uniqueName || retailerId || "",
    price: raw.price ?? 0,
    oldPrice: raw.oldPrice > 0 ? raw.oldPrice : null,
    referencePrice: raw.referencePrice > 0 ? raw.referencePrice : null,
    referencePriceLabel: raw.referencePriceLabel || null,
    volume: raw.volume,
    unitShort,
    unitName: raw.unit?.name || null,
    requiresLoyalty: raw.requiresLoyalityMembership || raw.requiresLoyaltyMembership || raw.requiresLoyalty || false,
    validityDates,
    description,
    categoryNames,
    derivedCategory,
    industryIds: industryIds.length ? industryIds : fallbackIndustryIds,
  };
}

export function catLabel(o) {
  if (o.derivedCategory && o.derivedCategory !== "Sonstiges") return o.derivedCategory;
  return o.categoryNames?.[0] || o.derivedCategory || "Sonstiges";
}

export function groupOffersByCategory(offers) {
  const byCat = new Map();
  for (const offer of offers) {
    const name = catLabel(offer);
    if (!byCat.has(name)) byCat.set(name, []);
    byCat.get(name).push(offer);
  }
  return Array.from(byCat.entries())
    .map(([name, catOffers]) => ({
      name,
      offers: catOffers,
      count: catOffers.length,
      bestDisc: Math.max(0, ...catOffers.map(disc)),
    }))
    .sort((a, b) => {
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      return a.name.localeCompare(b.name, "de");
    });
}

export function offerSearchText(o) {
  return normalizeText([o.productName, o.brandName, o.description].filter(Boolean).join(" "));
}

// Synonym groups — each group is fully bidirectional (any term finds all others)
const SYNONYM_GROUPS = [
  ["bier", "helles", "pils", "pilsener", "weizen", "weissbier", "lager", "craftbier", "radler"],
  ["wasser", "mineralwasser", "sprudel", "tafelwasser"],
  ["cola", "softdrink", "limonade", "coca", "pepsi"],
  ["kaffee", "kaffeebohnen", "bohnenkaffee", "espresso", "filterkaffee"],
  ["milch", "vollmilch", "h-milch", "frischmilch", "haltbarmilch", "hafermilch", "laktosefrei"],
  ["butter", "markenbutter", "rahmbutter", "streichzart", "laetta"],
  ["kaese", "kase", "schnittkase", "weichkase", "hartkase", "frischkase", "reibekase", "gouda", "emmentaler", "edamer", "camembert", "brie", "mozzarella", "parmesan", "grana", "padano", "butterkase", "huttenkase", "muritzer", "mueritzer", "cremiot", "bergkase", "wildblumenkase"],
  ["fleisch", "rind", "schwein", "pute", "hahnchen", "hackfleisch", "steak", "braten", "schnitzel"],
  ["wurst", "aufschnitt", "salami", "schinken", "mortadella", "bratwurst"],
  ["fisch", "lachs", "forelle", "kabeljau", "rotbarsch", "garnelen", "garnele", "seelachs"],
  ["joghurt", "jogurt", "skyr", "quark"],
  ["muesli", "musli", "cerealien", "crunchy"],
  ["chips", "crisps", "cracker", "crispy"],
  ["tofu", "raeuchertofu"],
];

function buildSynonymMap(groups) {
  const map = {};
  for (const g of groups) {
    // Only use single-token entries for local search matching
    const single = g.filter(t => !t.includes(" "));
    for (const term of single) {
      map[term] = single.filter(t => t !== term);
    }
  }
  return map;
}
export const ANGEBOTE_SYNONYMS = buildSynonymMap(SYNONYM_GROUPS);

// EXPANSIONS for API search (Lucene OR queries) — can include multi-word phrases
function buildExpansions(groups) {
  const out = {};
  for (const g of groups) {
    for (const term of g) {
      if (term.includes(" ")) continue; // only single-word keys
      const terms = [...new Set(g)];
      out[term] = terms.map(t => /[^a-z0-9]/.test(t) ? `"${t}"` : t).join(" OR ");
    }
  }
  return out;
}
export const EXPANSIONS = buildExpansions(SYNONYM_GROUPS);

const OFFER_SEARCH_INDEX_CACHE = new WeakMap();
const QUERY_TOKEN_CANDIDATES_CACHE = new Map();

function addInflectionVariants(token, out) {
  if (!token || token.length < 4) return;
  if (token.endsWith("en")) out.add(token.slice(0, -2));
  if (token.endsWith("er")) out.add(token.slice(0, -2));
  if (token.endsWith("e")) out.add(token.slice(0, -1));
  if (token.endsWith("n")) out.add(token.slice(0, -1));
  if (token.endsWith("s")) out.add(token.slice(0, -1));
  out.add(`${token}e`);
  out.add(`${token}en`);
  out.add(`${token}er`);
  out.add(`${token}n`);
  out.add(`${token}s`);
}

function buildTokenCandidates(token) {
  const normalized = normalizeText(token);
  if (!normalized) return { exact: [], synonym: [], inflection: [] };
  if (QUERY_TOKEN_CANDIDATES_CACHE.has(normalized)) return QUERY_TOKEN_CANDIDATES_CACHE.get(normalized);

  const exact = new Set([normalized]);
  const synonym = new Set(
    (ANGEBOTE_SYNONYMS[normalized] || [])
      .flatMap(t => tokenizeNormalized(t))
      .filter(Boolean)
  );
  synonym.delete(normalized);

  const inflection = new Set();
  addInflectionVariants(normalized, inflection); // only for query token, not synonyms
  exact.forEach(t => inflection.delete(t));
  synonym.forEach(t => inflection.delete(t));

  const result = {
    exact: [...exact],
    synonym: [...synonym],
    inflection: [...inflection],
  };
  QUERY_TOKEN_CANDIDATES_CACHE.set(normalized, result);
  return result;
}

function expandQueryToken(token) {
  const parts = buildTokenCandidates(token);
  return [...new Set([...parts.exact, ...parts.synonym, ...parts.inflection])];
}

function tokenMatchesCandidate(offerToken, candidate) {
  if (!offerToken || !candidate) return false;
  if (offerToken === candidate) return true;
  if (candidate.length < 4) return false;
  if (offerToken.startsWith(candidate)) return true;
  return candidate.length >= 6 && offerToken.endsWith(candidate);
}

function findCandidateMatch(candidates, tokenList) {
  for (const candidate of candidates) {
    for (const token of tokenList) {
      if (tokenMatchesCandidate(token, candidate)) {
        return { candidate, exact: token === candidate };
      }
    }
  }
  return null;
}

function buildCompoundTokens(tokens, maxSpan = 3) {
  if (!tokens.length) return [];
  const out = new Set();
  for (let start = 0; start < tokens.length; start += 1) {
    let joined = "";
    for (let span = 1; span <= maxSpan && start + span <= tokens.length; span += 1) {
      joined += tokens[start + span - 1];
      if (span >= 2 && joined.length >= 6) out.add(joined);
    }
  }
  return [...out];
}

export function buildOfferSearchIndex(offer) {
  if (OFFER_SEARCH_INDEX_CACHE.has(offer)) return OFFER_SEARCH_INDEX_CACHE.get(offer);
  const raw = normalizeText([offer.productName, offer.brandName, offer.description, catLabel(offer)].filter(Boolean).join(" "));
  const rawTokens = tokenizeNormalized(raw);
  const compoundTokens = buildCompoundTokens(rawTokens);
  const tokens = new Set([...rawTokens, ...compoundTokens]);
  const tokenList = [...tokens];
  const index = { tokens, tokenList, raw };
  OFFER_SEARCH_INDEX_CACHE.set(offer, index);
  return index;
}

export function scoreOfferMatch(offer, query) {
  const queryTokens = tokenizeNormalized(query);
  if (!queryTokens.length) return { matched: true, score: 0, reason: "none" };
  const searchIndex = buildOfferSearchIndex(offer);
  let score = 0;
  let reason = "none";

  for (const token of queryTokens) {
    const candidates = buildTokenCandidates(token);
    const expanded = expandQueryToken(token);
    const anyHit = findCandidateMatch(expanded, searchIndex.tokenList);
    if (!anyHit) return { matched: false, score: 0, reason: "none" };
    const exactHit = findCandidateMatch(candidates.exact, searchIndex.tokenList);
    if (exactHit) {
      score += exactHit.exact ? 6 : 5;
      reason = "exact";
      continue;
    }
    const synonymHit = findCandidateMatch(candidates.synonym, searchIndex.tokenList);
    if (synonymHit) {
      score += synonymHit.exact ? 4 : 3;
      if (reason !== "exact") reason = "synonym";
      continue;
    }
    const inflectionHit = findCandidateMatch(candidates.inflection, searchIndex.tokenList);
    if (inflectionHit) {
      score += 2;
      if (reason !== "exact" && reason !== "synonym") reason = "inflection";
      continue;
    }
    return { matched: false, score: 0, reason: "none" };
  }
  return { matched: true, score, reason };
}

function strongTokenMatch(offerToken, candidate) {
  if (!offerToken || !candidate || candidate.length < 3) return false;
  if (offerToken === candidate) return true;
  if (offerToken.length <= candidate.length) return false;
  return offerToken.endsWith(candidate);
}

export function isStrongProductMatch(offer, query) {
  const queryTokens = tokenizeNormalized(query).filter(t => t.length >= 3);
  if (!queryTokens.length) return false;

  const productTokens = tokenizeNormalized(
    [offer.productName, offer.brandName].filter(Boolean).join(" ")
  );
  if (!productTokens.length) return false;

  return queryTokens.every(token => {
    const candidates = buildTokenCandidates(token);
    const strongCandidates = [...new Set([
      ...candidates.exact,
      ...candidates.synonym,
      ...candidates.inflection,
    ])];
    return strongCandidates.some(candidate =>
      productTokens.some(offerToken => strongTokenMatch(offerToken, candidate))
    );
  });
}

// Returns { parts, hasHighlight } — caller renders JSX from parts
export function highlightTitle(title, query) {
  const q = (query || "").trim();
  if (!q) return { parts: [title], hasHighlight: false };
  const candidates = tokenizeNormalized(q).flatMap(t => {
    const c = buildTokenCandidates(t);
    return [...c.exact, ...c.synonym]; // no inflections — keeps highlights precise
  });
  const uniq = [...new Set(candidates)].filter(c => c.length >= 2).slice(0, 40);
  if (!uniq.length) return { parts: [title], hasHighlight: false };
  const escaped = uniq.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = title.split(re);
  if (parts.length === 1) return { parts: [title], hasHighlight: false };
  return { parts, hasHighlight: true };
}
