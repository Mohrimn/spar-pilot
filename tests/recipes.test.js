import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeOn, berlinDate, packAmount, recommendRecipes, mergeRecipeItems, recipeShoppingItems } from '../lib/recipes.js';
const day = '2026-09-18';
const offer = (productName, more={}) => ({ id:productName, productName, price:2, retailerSlug:'lidl', validityDates:[{from:day,to:day}], ...more });
const prefs = { diet:'all', servings:2, minutes:60, retailer:'', mealPrep:false, excluded:[] };
test('validity includes full date-only end day, excludes future, expired and unknown', () => {
  assert.equal(activeOn(offer('Tomaten'),day),true);
  assert.equal(activeOn(offer('Tomaten'),'2026-09-19'),false);
  assert.equal(activeOn(offer('Tomaten'),'2026-09-17'),false);
  assert.equal(activeOn(offer('Tomaten',{validityDates:[]}),day),false);
  assert.equal(activeOn(offer('Tomaten',{validityDates:[{from:'invalid',to:'invalid'}]}),day),false);
  assert.equal(berlinDate(new Date('2026-09-17T23:30:00Z')),day);
});
test('strict ingredient matching rejects prepared products and unrelated food', () => {
  assert.equal(recommendRecipes([offer('Tomatensauce'),offer('Nudelsalat'),offer('Spinatpizza'),offer('Tofu paniert')],prefs,day).length,0);
  assert.ok(recommendRecipes([offer('Tomaten')],prefs,day).length > 0);
});
test('diet, time, meal prep and exclusions are hard filters', () => {
  const results = recommendRecipes([offer('Tomaten'),offer('Spinat'),offer('Brokkoli')],{...prefs,diet:'vegan',minutes:30,mealPrep:true,excluded:['tomato']},day);
  assert.ok(results.length);
  for (const r of results) { assert.equal(r.diet,'vegan'); assert.ok(r.minutes<=30); assert.ok(r.mealPrep); assert.ok(!r.ingredients.some(i=>i.id==='tomato')); }
});
test('retailer and usable price filter', () => {
  assert.equal(recommendRecipes([offer('Tomaten')],{...prefs,retailer:'rewe'},day).length,0);
  for (const price of [0,null,NaN,-1]) assert.equal(recommendRecipes([offer('Tomaten',{price})],prefs,day).length,0);
});
test('only unambiguous pack descriptions can establish pack quantities', () => {
  assert.equal(packAmount(offer('Tomaten',{description:'0,5 kg'}),'g'),500);
  for (const description of ['je 100 g = 0.49', '2 x 500 g', '500 g / 1 kg', '500 ml','']) assert.equal(packAmount(offer('Tomaten',{description}),'g'),null);
});
test('portion scaling rounds checkout up to whole packs and does not invent savings', () => {
  const r = recommendRecipes([offer('Tomaten',{description:'500 g'})],{...prefs,servings:4},day).find(r=>r.id==='tomato-pasta');
  const i = r.ingredients.find(i=>i.id==='tomato');
  assert.equal(i.amount,600); assert.equal(i.checkout,4); assert.equal(r.discounts,0);
  assert.equal(recipeShoppingItems(r).find(i=>i.ingredientId==='tomato').amount,600);
});
test('unknown pack size stays unknown', () => {
  const r = recommendRecipes([offer('Tomaten')],prefs,day)[0];
  assert.equal(r.ingredients.find(i=>i.offer).checkout,null);
});
test('shopping list aggregates ingredients without mutating existing list or offer items', () => {
  const original = [{id:'a',ingredientId:'tomato',amount:200,unit:'g',ck:false},{id:'b',offer:offer('Tomaten'),qty:1}];
  const result = mergeRecipeItems(original,[{id:'c',ingredientId:'tomato',amount:300,unit:'g',ck:false}]);
  assert.equal(result[0].amount,500); assert.equal(original[0].amount,200); assert.equal(result[1].qty,1);
  const checked = mergeRecipeItems([{...original[0],ck:true}],[{id:'c',ingredientId:'tomato',amount:300,unit:'g',ck:false}]);
  assert.equal(checked.length,2);
});
