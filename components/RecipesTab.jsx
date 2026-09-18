import { useMemo, useState } from 'react';
import { INGREDIENTS, berlinDate, recommendRecipes, recipeShoppingItems } from '../lib/recipes.js';
import { isMyLoyalty } from '../lib/constants.js';

const field = { padding: 9, border: '1px solid #ddd', borderRadius: 8, background: '#fff', font: 'inherit', width: '100%', boxSizing: 'border-box' };
const button = { ...field, cursor: 'pointer', fontWeight: 700 };
export function RecipesTab({ pubGroups, cfg, prefs, onPreferences, onAddIngredients, onAddOffer, added, bLoad, bErr, onRefresh }) {
  const [day, setDay] = useState(berlinDate());
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [omitted, setOmitted] = useState({});
  const offers = useMemo(() => pubGroups.flatMap(g => g.offers).filter(o => !o.requiresLoyalty || isMyLoyalty(o.retailerSlug, o.retailerName, cfg.myLoyalty)), [pubGroups,cfg.myLoyalty]);
  const recipes = useMemo(() => recommendRecipes(offers,prefs,day), [offers,prefs,day]);
  const patch = value => { onPreferences(value); setNotice(''); };
  return <div style={{padding:'16px 18px',fontSize:13}}>
    <h2 style={{margin:'0 0 6px'}}>Was koche ich diese Woche?</h2>
    <p style={{color:'#666',lineHeight:1.5}}>Rezeptideen aus Angeboten für deine PLZ. Kundenkartenpreise werden nur für deine hinterlegten Karten berücksichtigt.</p>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <label>Einkaufstag<input style={field} type="date" value={day} onChange={e => setDay(e.target.value || berlinDate())}/></label>
      <label>Ernährung<select style={field} value={prefs.diet} onChange={e => patch({diet:e.target.value})}><option value="all">Alles</option><option value="vegetarian">Vegetarisch</option><option value="vegan">Vegan</option></select></label>
      <label>Portionen<select style={field} value={prefs.servings} onChange={e => patch({servings:Number(e.target.value)})}>{[1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label>
      <label>Max. Kochzeit<select style={field} value={prefs.minutes} onChange={e => patch({minutes:Number(e.target.value)})}>{[20,30,45,60].map(n => <option value={n} key={n}>{n} Minuten</option>)}</select></label>
    </div>
    <label style={{display:'block',marginTop:12}}>Supermarkt<select style={field} value={prefs.retailer} onChange={e => patch({retailer:e.target.value})}><option value="">Alle geladenen Märkte</option>{pubGroups.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}</select></label>
    <label style={{display:'block',margin:'12px 0'}}><input type="checkbox" checked={prefs.mealPrep} onChange={e => patch({mealPrep:e.target.checked})}/> Für Meal Prep geeignet</label>
    <details><summary style={{cursor:'pointer'}}>Zutaten ausschließen ({prefs.excluded.length})</summary><div style={{display:'flex',flexWrap:'wrap',gap:10,padding:'12px 0'}}>{Object.entries(INGREDIENTS).map(([id,i]) => <label key={id}><input type="checkbox" checked={prefs.excluded.includes(id)} onChange={e => patch({excluded:e.target.checked ? [...prefs.excluded,id] : prefs.excluded.filter(x=>x!==id)})}/>{i.name}</label>)}</div><p>Filter beziehen sich auf Rezeptzutaten. Produktetiketten auf Allergene prüfen.</p></details>
    <button style={{...button,margin:'12px 0'}} disabled={bLoad} onClick={onRefresh}>{bLoad ? 'Angebote werden geladen …' : 'Angebote aktualisieren'}</button>
    {bErr && <p role="alert">Angebote konnten nicht geladen werden: {bErr}</p>}
    <p style={{fontSize:11,color:'#777'}}>Startkollektion: 8 vegetarische und vegane Rezepte. Preise gelten für Packungen. Ohne Vergleichspreis wird keine Ersparnis behauptet. Salz, Pfeffer und Wasser nach Bedarf.</p>
    <p role="status" style={{color:'#047857'}}>{notice}</p>
    {!bLoad && !bErr && recipes.length === 0 && <p>Keine passenden Rezepte mit gültigen Angeboten gefunden. Ändere Filter oder Einkaufstag, oder lade Angebote neu.</p>}
    {!bLoad && !bErr && recipes.map(r => <article key={r.id} style={{background:'#fff',border:'1px solid #e5e5e0',borderRadius:12,padding:14,marginBottom:12}}>
      <h3 style={{margin:'0 0 8px'}}>{r.name}</h3>
      <div>{r.minutes} Min. · {prefs.servings} Portionen · {r.diet === 'vegan' ? 'Vegan' : 'Vegetarisch'}</div>
      <p style={{color:'#047857'}}>{r.matched} von {r.ingredients.length} Zutaten im Angebot · {r.discounts} mit belegtem Rabatt · {r.stores} Märkte</p>
      <button style={button} aria-expanded={expanded === r.id} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>{expanded === r.id ? 'Schließen' : 'Rezept ansehen'}</button>
      {expanded === r.id && <div>
        <p>Hake Zutaten ab, die du schon hast oder als Angebot zur Liste hinzugefügt hast.</p>
        {r.ingredients.map(i => { const key = `${r.id}:${i.id}`; return <div key={i.id} style={{padding:'10px 0',borderBottom:'1px solid #eee'}}>
          <label><input type="checkbox" checked={!!omitted[key]} onChange={e => setOmitted(p=>({...p,[key]:e.target.checked}))}/> Schon vorhanden: {i.amount} {i.unit} {INGREDIENTS[i.id].name}</label>
          {i.offer ? <div style={{fontSize:12,marginTop:6}}>{i.offer.retailerName}: {i.offer.productName} · {i.offer.price.toFixed(2)} € / Angebotspackung{i.offer.requiresLoyalty ? ' · Kundenkarte nötig' : ''}
            {i.offer.oldPrice > i.offer.price && <span> (vorher {i.offer.oldPrice.toFixed(2)} €)</span>}
            <div>{i.checkout !== null ? `${Math.ceil(i.amount/i.pack)} Packung(en): ${i.checkout.toFixed(2)} €` : 'Packungsmenge prüfen; benötigte Packungszahl unbekannt'}</div>
            <button style={{...button,marginTop:6}} disabled={added.has(i.offer.id)} onClick={() => { onAddOffer(i.offer); setNotice('Eine Angebotspackung hinzugefügt. Menge in der Liste prüfen.'); }}>{added.has(i.offer.id) ? 'Angebot auf der Liste' : 'Eine Angebotspackung hinzufügen'}</button>
          </div> : <div style={{color:'#777',fontSize:12}}>Zusätzlich benötigt · Preis unbekannt</div>}
        </div>; })}
        <ol style={{paddingLeft:20,lineHeight:1.6}}>{r.steps.map((s,index)=><li key={index}>{s}</li>)}</ol>
        <p style={{fontSize:11}}>Mengen für {prefs.servings} Portionen. Wasserangaben im Text beziehen sich auf 2 Portionen; entsprechend anpassen.</p>
        {r.mealPrep && <p style={{fontSize:11}}>Nach dem Kochen zügig abkühlen und gekühlt aufbewahren. Zum Essen vollständig durcherhitzen.</p>}
        <button style={{...button,background:'#047857',color:'#fff'}} onClick={() => { const items=recipeShoppingItems(r).filter(i=>!omitted[`${r.id}:${i.ingredientId}`]); onAddIngredients(items); setNotice(items.length ? 'Zutaten zur Liste hinzugefügt. Gleiche Zutaten werden zusammengefasst.' : 'Alle Zutaten sind bereits vorhanden.'); }}>Fehlende Zutaten zur Liste</button>
      </div>}
    </article>)}
  </div>;
}
