import { useState, useEffect, useRef } from "react";
import { getRetColor, isMyLoyalty, isLightColor, RETAILER_META } from "../lib/constants.js";
import { normalizeText, disc, uPrice } from "../lib/utils.js";
import { catLabel, groupOffersByCategory, scoreOfferMatch } from "../lib/offers.js";
import { SearchIc, ChevD, RefIc, BookIc, StoreIc } from "./Icons.jsx";
import { chipRowStyle, Spinner, ErrBox } from "./Shared.jsx";
import { Card } from "./Card.jsx";

export function AngeboteTab({ pubGroups, leafletFlights, storeLocations = {}, cfg, added, addItem, onLoadBrowse, bLoad, bErr, onOpenProspekt, onGoSearch }) {
  const [openRets, setOpenRets] = useState(new Set());
  const [openCatsByRet, setOpenCatsByRet] = useState({});
  const [retF, setRetF] = useState(null);
  const [catF, setCatF] = useState(null);
  const [angeboteQ, setAngeboteQ] = useState("");
  const prevAngeboteQRef = useRef("");

  const srt = (arr) => [...arr].sort((a, b) => {
    return (uPrice(a) || a.price) - (uPrice(b) || b.price);
  });

  const filtOffers = (arr) => {
    let r = [...arr];
    if (!cfg.loyalty) r = r.filter(o => !o.requiresLoyalty || isMyLoyalty(o.retailerSlug, o.retailerName, cfg.myLoyalty));
    return r;
  };

  const filtGroups = pubGroups.filter(g => !retF || g.name === retF || g.slug === retF);
  const allRetailers = pubGroups.map(g => g.name);
  const angeboteQNorm = normalizeText(angeboteQ);
  const categoryCounts = (() => { const m = new Map(); filtGroups.forEach(g => { filtOffers(g.offers).forEach(o => { const c = catLabel(o); m.set(c, (m.get(c) || 0) + 1); }); }); return m; })();
  const allCategories = Array.from(categoryCounts.keys()).sort((a, b) => a.localeCompare(b, "de"));
  const allCategoriesKey = allCategories.join("|");
  useEffect(() => { if (catF && !allCategories.includes(catF)) setCatF(null); }, [catF, allCategoriesKey]);

  const visGroups = filtGroups.map(g => {
    const base = filtOffers(g.offers);
    const catFiltered = catF ? base.filter(o => catLabel(o) === catF) : base;
    const offers = angeboteQNorm
      ? catFiltered
        .map((offer, index) => ({ offer, index, match: scoreOfferMatch(offer, angeboteQNorm) }))
        .filter(x => x.match.matched)
        .sort((a, b) => {
          const scoreDiff = b.match.score - a.match.score;
          if (scoreDiff !== 0) return scoreDiff;
          return a.index - b.index;
        })
        .map(x => x.offer)
      : catFiltered;
    const groupedCategories = groupOffersByCategory(offers);
    return { ...g, groupedOffers: offers, groupedCategories };
  }).filter(g => g.groupedOffers.length > 0);

  const leafletOnlyRetailers = (() => {
    const pubSlugs = new Set(pubGroups.map(g => g.slug));
    return Object.entries(leafletFlights)
      .filter(([slug]) => !pubSlugs.has(slug))
      .map(([slug, flights]) => {
        const flight = flights[0];
        const name = RETAILER_META[slug]?.name || flight.advertiserName || slug;
        return { slug, name, flight };
      })
      .filter(r => !retF || r.name === retF || r.slug === retF)
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  })();

  const visGroupSlugsKey = visGroups.map(g => g.slug).join("|");
  useEffect(() => { setOpenCatsByRet({}); }, [angeboteQNorm, retF, catF, visGroupSlugsKey]);
  useEffect(() => {
    const hadQuery = !!prevAngeboteQRef.current;
    if (angeboteQNorm) {
      setOpenRets(new Set(visGroups.map(g => g.slug)));
    } else if (hadQuery) {
      setOpenRets(new Set());
    }
    prevAngeboteQRef.current = angeboteQNorm;
  }, [angeboteQNorm, visGroupSlugsKey]);

  const totalOffers = visGroups.reduce((s, g) => s + g.groupedOffers.length, 0);
  const hasAngeboteRefinements = !!angeboteQNorm || !!retF || !!catF;

  const togRet = (slug, wasOpen) => {
    setOpenRets(p => { const n = new Set(p); if (n.has(slug)) n.delete(slug); else n.add(slug); return n; });
    if (wasOpen) {
      setOpenCatsByRet(p => {
        if (!p[slug]) return p;
        const n = { ...p };
        delete n[slug];
        return n;
      });
    }
  };
  const togCat = (retSlug, catName) => setOpenCatsByRet(p => {
    const retCats = { ...(p[retSlug] || {}) };
    if (retCats[catName]) delete retCats[catName];
    else retCats[catName] = true;
    const n = { ...p };
    if (Object.keys(retCats).length) n[retSlug] = retCats;
    else delete n[retSlug];
    return n;
  });

  return (
    <div>
      <div style={{ padding: "10px 18px 0", position: "sticky", top: 0, zIndex: 50, background: "#f5f4f0" }}>
        <div style={{ display: "flex", gap: "8px", paddingBottom: "6px" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "#fff", borderRadius: "11px", padding: "0 12px", border: "2px solid #e5e5e0" }}>
            <SearchIc />
            <input
              type="text"
              value={angeboteQ}
              onChange={e => setAngeboteQ(e.target.value)}
              placeholder="In Angeboten suchen: Produkt, Marke, Stichwort"
              style={{ flex: 1, border: "none", outline: "none", padding: "10px 0", fontSize: "14px", fontFamily: "inherit", background: "transparent" }}
            />
            {angeboteQ && <button type="button" onClick={() => setAngeboteQ("")} style={{ border: "none", background: "none", color: "#999", cursor: "pointer", fontSize: "14px", padding: 0, lineHeight: 1 }}>✕</button>}
          </div>
        </div>
        {allRetailers.length > 0 && <div style={chipRowStyle}>
          <button onClick={() => setRetF(null)} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: !retF ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: !retF ? "#1a1a1a" : "#fff", color: !retF ? "#fff" : "#999", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>Alle</button>
          {pubGroups.map(g => { const rc = getRetColor(g.slug, g.name); const on = retF === g.name || retF === g.slug; const lt = isLightColor(rc); return <button key={g.slug} onClick={() => setRetF(on ? null : g.name)} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: on ? `2px solid ${rc}` : "1.5px solid #ddd", background: on ? rc : "#fff", color: on ? (lt ? "#1a1a1a" : "#fff") : "#999", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>{g.name}</button> })}
          {leafletOnlyRetailers.map(r => { const rc = getRetColor(r.slug, r.name); const on = retF === r.name || retF === r.slug; const lt = isLightColor(rc); return <button key={r.slug} onClick={() => setRetF(on ? null : r.name)} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: on ? `2px solid ${rc}` : "1.5px solid #ddd", background: on ? rc : "#fff", color: on ? (lt ? "#1a1a1a" : "#fff") : "#999", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, opacity: on ? 1 : 0.7 }}>{r.name}</button> })}
        </div>}
        {allCategories.length > 0 && <div style={chipRowStyle}>
          <button onClick={() => setCatF(null)} style={{ padding: "4px 9px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: !catF ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: !catF ? "#1a1a1a" : "#fff", color: !catF ? "#fff" : "#999", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>Alle Kategorien</button>
          {allCategories.map(c => { const on = catF === c; const cnt = categoryCounts.get(c) || 0; return <button key={c} onClick={() => setCatF(on ? null : c)} style={{ padding: "4px 9px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: on ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: on ? "#1a1a1a" : "#fff", color: on ? "#fff" : "#999", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>{c} <span style={{ opacity: 0.6 }}>{cnt}</span></button> })}
        </div>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "4px" }}>
          <span style={{ fontSize: "10px", color: "#bbb", fontFamily: "'JetBrains Mono',monospace" }}>{totalOffers} Angebote · {visGroups.length + leafletOnlyRetailers.length} Läden{catF ? ` · ${catF}` : ""}{angeboteQNorm ? " · Filter aktiv" : ""}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {angeboteQNorm && onGoSearch && <button type="button" onClick={() => onGoSearch(angeboteQ.trim())} style={{ padding: "4px 10px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: "1.5px solid #e0e0db", background: "#fff", color: "#666", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}><SearchIc /> Alle Händler</button>}
            <button onClick={onLoadBrowse} disabled={bLoad} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", fontFamily: "inherit" }}><RefIc /> Neu laden</button>
          </div>
        </div>
      </div>

      {bLoad && <Spinner text="Lade Prospekte…" />}
      {bErr && !bLoad && <ErrBox msg={bErr} onRetry={onLoadBrowse} />}
      {!bLoad && !bErr && visGroups.length === 0 && !hasAngeboteRefinements && <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div><div style={{ fontSize: "13px" }}>Keine Prospekte gefunden</div></div>}
      {!bLoad && !bErr && visGroups.length === 0 && hasAngeboteRefinements && <div style={{ textAlign: "center", padding: "42px 18px", color: "#bbb" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔎</div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#777" }}>Keine Angebote mit den aktuellen Filtern</div>
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
          {angeboteQNorm && <button type="button" onClick={() => setAngeboteQ("")} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: "1.5px solid #ddd", background: "#fff", color: "#777", cursor: "pointer", fontFamily: "inherit" }}>Suche löschen</button>}
          {catF && <button type="button" onClick={() => setCatF(null)} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: "1.5px solid #ddd", background: "#fff", color: "#777", cursor: "pointer", fontFamily: "inherit" }}>Kategorie zurücksetzen</button>}
          {retF && <button type="button" onClick={() => setRetF(null)} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: "1.5px solid #ddd", background: "#fff", color: "#777", cursor: "pointer", fontFamily: "inherit" }}>Händler zurücksetzen</button>}
        </div>
      </div>}

      <div style={{ padding: "8px 18px 18px" }}>
        {visGroups.map(g => {
          const offers = g.groupedOffers;
          const categories = g.groupedCategories || [];
          const open = openRets.has(g.slug);
          const rc = getRetColor(g.slug, g.name);
          const lt = isLightColor(rc);
          const bestDisc = Math.max(0, ...offers.map(disc));
          const loyaltyCount = offers.filter(o => o.requiresLoyalty).length;
          const hasLeaflet = leafletFlights[g.slug]?.length > 0;
          const topFlight = hasLeaflet ? leafletFlights[g.slug][0] : null;
          return <div key={g.slug} style={{ marginBottom: "6px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "stretch", borderRadius: open ? "10px 10px 0 0" : "10px", overflow: "hidden" }}>
              <button onClick={() => togRet(g.slug, open)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: open ? rc : "#fff", border: open ? "none" : "1px solid #eee", borderRight: "none", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", gap: "6px", transition: "all 0.15s", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, flex: 1 }}>
                  <StoreIc />
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: open ? (lt ? "#1a1a1a" : "#fff") : "#1a1a1a" }}>{g.name}</span>
                      {storeLocations[g.slug] && <span style={{ fontSize: "10px", color: open ? (lt ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)") : "#bbb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{storeLocations[g.slug].address}, {storeLocations[g.slug].zipCode}</span>}
                    </div>
                    <div style={{ fontSize: "10px", color: open ? (lt ? "#555" : "rgba(255,255,255,0.6)") : "#bbb", fontFamily: "'JetBrains Mono',monospace" }}>{offers.length} Angebote{loyaltyCount > 0 ? ` · ${loyaltyCount} Karte` : ""}</div>
                    {!open && categories.length > 0 && <div style={{ fontSize: "10px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{categories.slice(0, 3).map(c => `${c.name} ${c.count}`).join(" · ")}{categories.length > 3 ? ` · +${categories.length - 3}` : ""}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                  {bestDisc > 0 && !open && <span style={{ fontSize: "9px", fontWeight: 800, color: "#ef4444", background: "#fef2f2", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>−{bestDisc}%</span>}
                  <ChevD open={open} />
                </div>
              </button>
              {hasLeaflet && <button onClick={(e) => { e.stopPropagation(); onOpenProspekt(g.slug, g.name, topFlight); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", padding: "6px 10px", background: open ? rc : "#fff", border: open ? "none" : "1px solid #eee", borderLeft: open ? `1px solid ${lt ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"}` : "1px solid #eee", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                <BookIc />
                <span style={{ fontSize: "8px", fontWeight: 700, color: open ? (lt ? "#1a1a1a" : "#fff") : "#999", whiteSpace: "nowrap" }}>Prospekt</span>
              </button>}
            </div>
            {open && <div style={{ background: "#edece8", borderRadius: "0 0 10px 10px", padding: "6px 6px 3px", display: "flex", flexDirection: "column", gap: "5px" }}>
              {(catF || categories.length === 1) ? <div style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "2px" }}>
                {srt(offers).map(o => <Card key={o.id} o={o} sm highlightQuery={angeboteQ} added={added} addItem={addItem} myLoyalty={cfg.myLoyalty} />)}
              </div> : categories.map(cat => {
                const catOpen = !!openCatsByRet[g.slug]?.[cat.name] || !!angeboteQNorm;
                return <div key={`${g.slug}-${cat.name}`} style={{ background: "#f6f5f1", borderRadius: "8px", border: "1px solid #e8e6df", overflow: "hidden" }}>
                  <button onClick={() => togCat(g.slug, cat.name)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: catOpen ? "#eceae2" : "#f6f5f1", border: "none", cursor: "pointer", fontFamily: "inherit", gap: "8px" }}>
                    <div style={{ textAlign: "left", minWidth: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.35px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.name}</div>
                      <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'JetBrains Mono',monospace" }}>{cat.count} Angebote</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                      {cat.bestDisc > 0 && <span style={{ fontSize: "9px", fontWeight: 800, color: "#ef4444", background: "#fef2f2", padding: "2px 6px", borderRadius: "4px" }}>bis −{cat.bestDisc}%</span>}
                      <ChevD open={catOpen} />
                    </div>
                  </button>
                  {catOpen && <div style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "6px" }}>
                    {cat.offers.map(o => <Card key={o.id} o={o} sm highlightQuery={angeboteQ} added={added} addItem={addItem} myLoyalty={cfg.myLoyalty} />)}
                  </div>}
                </div>;
              })}
            </div>}
          </div>;
        })}
        {/* Leaflet-only retailers */}
        {leafletOnlyRetailers.map(r => {
          const rc = getRetColor(r.slug, r.name);
          const lt = isLightColor(rc);
          return <div key={r.slug} style={{ marginBottom: "6px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "stretch", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", padding: "10px 12px", background: "#fff", border: "1px solid #eee", borderRight: "none", borderRadius: 0, gap: "7px" }}>
                <StoreIc />
                <div style={{ textAlign: "left", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{r.name}</span>
                    {storeLocations[r.slug] && <span style={{ fontSize: "10px", color: "#bbb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{storeLocations[r.slug].address}, {storeLocations[r.slug].zipCode}</span>}
                  </div>
                  <div style={{ fontSize: "10px", color: "#bbb", fontFamily: "'JetBrains Mono',monospace" }}>Nur Prospekt · {r.flight.pageCount} Seiten</div>
                </div>
              </div>
              <button onClick={() => onOpenProspekt(r.slug, r.name, r.flight)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", padding: "6px 12px", background: "#fff", border: "1px solid #eee", borderLeft: "1px solid #eee", borderRadius: 0, cursor: "pointer", fontFamily: "inherit" }}>
                <BookIc />
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#999", whiteSpace: "nowrap" }}>Prospekt</span>
              </button>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}
