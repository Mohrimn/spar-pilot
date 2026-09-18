// Deliberately narrow product names: search synonyms are not safe substitutions.
export const INGREDIENTS = {
  pasta: { name: 'Nudeln', match: /^(nudeln|spaghetti|penne|fusilli|pasta)$/i },
  tomato: { name: 'Tomaten', match: /^(tomaten|cherrytomaten|rispentomaten|cocktailtomaten)$/i },
  broccoli: { name: 'Brokkoli', match: /^brokkoli$/i },
  tofu: { name: 'Naturtofu', match: /^(naturtofu|tofu natur)$/i },
  potato: { name: 'Kartoffeln', match: /^(speise)?kartoffeln$/i },
  quark: { name: 'Magerquark', match: /^magerquark$/i },
  feta: { name: 'Feta', match: /^feta$/i },
  spinach: { name: 'Blattspinat', match: /^(blattspinat|babyspinat|spinat)$/i },
  rice: { name: 'Reis', match: /^(reis|basmatireis|jasminreis|langkornreis)$/i },
  zucchini: { name: 'Zucchini', match: /^zucchini$/i },
  carrot: { name: 'Karotten', match: /^(karotten|möhren)$/i },
  lentils: { name: 'Rote Linsen', match: /^rote linsen$/i },
  onion: { name: 'Zwiebeln', match: /^(zwiebeln|speisezwiebeln)$/i },
  oil: { name: 'Olivenöl', match: /^olivenöl$/i },
};
const ingredient = (id, amount, unit = 'g') => ({ id, amount, unit });
const recipe = (id, name, minutes, diet, mealPrep, ingredients, steps) => ({ id, name, minutes, diet, mealPrep, servings: 2, ingredients, steps });
export const RECIPES = [
  recipe('tomato-pasta', 'Tomaten-Spinat-Pasta', 25, 'vegan', true, [ingredient('pasta',200),ingredient('tomato',300),ingredient('spinach',150),ingredient('oil',10,'ml')], ['Nudeln nach Packungsangabe kochen, etwas Kochwasser aufheben.', 'Tomaten würfeln und im Öl 8 Minuten dünsten. Spinat zugeben und zusammenfallen lassen.', 'Nudeln und etwas Kochwasser unterheben, nach Geschmack würzen.']),
  recipe('tofu-rice', 'Tofu-Brokkoli-Reispfanne', 30, 'vegan', true, [ingredient('tofu',300),ingredient('broccoli',400),ingredient('rice',150),ingredient('oil',10,'ml')], ['Reis nach Packungsangabe kochen.', 'Brokkoli in Röschen teilen und 6 Minuten in Wasser garen.', 'Tofu würfeln und im Öl rundherum 8 Minuten braten. Brokkoli und Reis unterheben und würzen.']),
  recipe('potato-quark', 'Ofenkartoffeln mit Magerquark', 45, 'vegetarian', false, [ingredient('potato',600),ingredient('quark',400),ingredient('tomato',200),ingredient('oil',10,'ml')], ['Ofen auf 200 °C Ober-/Unterhitze vorheizen.', 'Kartoffeln waschen, in Spalten schneiden, mit Öl mischen und 30 bis 35 Minuten backen, bis sie weich sind.', 'Quark mit etwas Wasser glatt rühren und würzen. Tomaten schneiden und dazu servieren.']),
  recipe('feta-vegetables', 'Ofengemüse mit Feta', 40, 'vegetarian', true, [ingredient('zucchini',300),ingredient('tomato',300),ingredient('feta',200),ingredient('potato',400),ingredient('oil',10,'ml')], ['Ofen auf 200 °C Ober-/Unterhitze vorheizen. Kartoffeln klein würfeln und mit Öl 15 Minuten vorbacken.', 'Zucchini und Tomaten schneiden, dazugeben und weitere 15 Minuten backen.', 'Feta darüberbröseln und 5 Minuten mitbacken. Prüfen, ob die Kartoffeln weich sind.']),
  recipe('lentil-pot', 'Roter Linsentopf mit Karotten', 30, 'vegan', true, [ingredient('lentils',180),ingredient('carrot',300),ingredient('tomato',300),ingredient('onion',100),ingredient('oil',10,'ml')], ['Zwiebeln und Karotten klein schneiden und im Öl 5 Minuten dünsten.', 'Gewürfelte Tomaten, gewaschene Linsen und 600 ml Wasser für 2 Portionen zugeben.', 'Etwa 20 Minuten köcheln lassen, bis die Linsen weich sind. Bei Bedarf Wasser nachgießen und würzen.']),
  recipe('spinach-feta', 'Spinat-Feta-Pasta', 20, 'vegetarian', true, [ingredient('pasta',200),ingredient('spinach',300),ingredient('feta',150),ingredient('oil',10,'ml')], ['Nudeln nach Packungsangabe kochen und etwas Kochwasser aufheben.', 'Spinat waschen und im Öl zusammenfallen lassen.', 'Feta zerbröseln, mit Nudeln und etwas Kochwasser zum Spinat geben und würzen.']),
  recipe('vegetable-rice', 'Bunte Gemüse-Reispfanne', 25, 'vegan', true, [ingredient('rice',160),ingredient('zucchini',300),ingredient('carrot',200),ingredient('onion',100),ingredient('oil',10,'ml')], ['Reis nach Packungsangabe kochen.', 'Gemüse klein schneiden und im Öl 10 bis 12 Minuten garen.', 'Reis unterheben, alles erhitzen und würzen.']),
  recipe('broccoli-pasta', 'Brokkoli-Pasta mit Quarkcreme', 25, 'vegetarian', false, [ingredient('pasta',200),ingredient('broccoli',400),ingredient('quark',250)], ['Nudeln kochen. Brokkoliröschen in den letzten 6 Minuten mitgaren.', 'Etwas Kochwasser aufheben und Nudeln und Brokkoli abgießen.', 'Topf vom Herd nehmen. Quark mit etwas Kochwasser glatt rühren, unterheben und würzen. Nicht mehr aufkochen.']),
];
export function berlinDate(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year:'numeric', month:'2-digit', day:'2-digit' }).format(now);
}
function dateKey(value) {
  if (typeof value !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : berlinDate(date);
}
export function activeOn(offer, day) {
  return (offer.validityDates || []).some(range => {
    const from = dateKey(range.from), to = dateKey(range.to);
    return from && to && from <= day && day <= to;
  });
}
export function packAmount(offer, unit) {
  // Only explicit pack sizes, never guess the meaning of API volume/referencePrice.
  const text = (offer.description || '').trim();
  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)(?:\s*(?:Packung|Beutel|Becher))?$/i);
  if (!match) return null;
  const [, number, rawUnit] = match;
  const u = rawUnit.toLowerCase();
  if ((unit === 'g' && !['g','kg'].includes(u)) || (unit === 'ml' && !['ml','l'].includes(u))) return null;
  const amount = Number(number.replace(',','.')) * (['kg','l'].includes(u) ? 1000 : 1);
  return amount > 0 ? amount : null;
}
export function recommendRecipes(offers, prefs, day) {
  const excluded = new Set(prefs.excluded || []);
  const eligible = offers.filter(o => activeOn(o,day) && Number.isFinite(o.price) && o.price > 0 && (!prefs.retailer || o.retailerSlug === prefs.retailer));
  return RECIPES.filter(r => (prefs.diet !== 'vegan' || r.diet === 'vegan') && r.minutes <= prefs.minutes && (!prefs.mealPrep || r.mealPrep) && !r.ingredients.some(i => excluded.has(i.id))).map(r => {
    const ingredients = r.ingredients.map(i => {
      const amount = i.amount * prefs.servings / r.servings;
      const matches = eligible.filter(o => INGREDIENTS[i.id].match.test(o.productName.trim()));
      const priced = matches.map(offer => { const pack = packAmount(offer,i.unit); return { offer, pack, checkout: pack ? Math.ceil(amount / pack) * offer.price : null }; });
      priced.sort((a,b) => (a.checkout ?? Infinity) - (b.checkout ?? Infinity) || a.offer.price - b.offer.price);
      return { ...i, amount, ...priced[0] };
    });
    const matched = ingredients.filter(i => i.offer);
    const discounts = matched.filter(i => i.offer.oldPrice > i.offer.price).length;
    const stores = new Set(matched.map(i => i.offer.retailerSlug)).size;
    return { ...r, ingredients, matched: matched.length, discounts, stores, score: matched.length / ingredients.length * 10 + discounts - stores * .5 };
  }).filter(r => r.matched > 0).sort((a,b) => b.score-a.score || a.minutes-b.minutes);
}
export function recipeShoppingItems(recipe) {
  return recipe.ingredients.map(i => ({ id: `ingredient-${i.id}-${i.unit}`, ingredientId: i.id, name: INGREDIENTS[i.id].name, amount: i.amount, unit: i.unit, ck: false }));
}
export function mergeRecipeItems(list, incoming) {
  const next = list.map(i => ({ ...i }));
  for (const item of incoming) {
    const existing = next.find(i => !i.ck && i.ingredientId === item.ingredientId && i.unit === item.unit);
    if (existing) existing.amount += item.amount;
    else next.push({ ...item, id: `${item.id}-${Date.now()}-${next.length}` });
  }
  return next;
}
