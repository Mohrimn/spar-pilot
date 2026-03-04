import { useState, useEffect, useRef } from "react";
import { DEFAULT_ZIP } from "./lib/settings.js";
import { DEFAULT_LOYALTY } from "./lib/constants.js";
import { sLoad, sSave } from "./lib/utils.js";
import { fetchPublishers, fetchLeafletFlights, fetchStoreLocations, fetchBestLeaflet, geocodeZip } from "./lib/api.js";
import { TagIc, SearchIc, ListIc, GearIc, ZapIc } from "./components/Icons.jsx";
import { ProspektViewer } from "./components/ProspektViewer.jsx";
import { AngeboteTab } from "./components/AngeboteTab.jsx";
import { SearchTab } from "./components/SearchTab.jsx";
import { ListTab } from "./components/ListTab.jsx";
import { SettingsTab } from "./components/SettingsTab.jsx";

export default function SparPilot() {
  const [tab, setTab] = useState("angebote");
  const [list, setList] = useState([]);
  const [cfg, setCfg] = useState({ zip: DEFAULT_ZIP, loyalty: true, mode: "per_unit", expand: false, showAllIndustries: false, myLoyalty: DEFAULT_LOYALTY });
  const [added, setAdded] = useState(new Set());
  const [pubGroups, setPubGroups] = useState([]);
  const [leafletFlights, setLeafletFlights] = useState({});
  const [storeLocations, setStoreLocations] = useState({});
  const [bLoad, setBLoad] = useState(false);
  const [bErr, setBErr] = useState(null);
  const [rdy, setRdy] = useState(false);
  const [prospektOpen, setProspektOpen] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchPreFill, setSearchPreFill] = useState(null);
  const geoCacheRef = useRef({ zip: null, coords: null });
  const mainScrollRef = useRef(null);
  const savedScrollRef = useRef(0);

  const getCoords = async (zip) => {
    if (geoCacheRef.current.zip === zip) return geoCacheRef.current.coords;
    const coords = await geocodeZip(zip);
    geoCacheRef.current = { zip, coords };
    return coords;
  };

  useEffect(() => { (async () => { const l = await sLoad("sp5-list", []); const c = await sLoad("sp5-cfg", null); const h = await sLoad("sp5-searchHistory", []); if (l.length) setList(l); if (c) setCfg(s => ({ ...s, ...c })); if (h.length) setSearchHistory(h); setRdy(true); })(); }, []);
  useEffect(() => { if (rdy) sSave("sp5-list", list); }, [list, rdy]);
  useEffect(() => { if (rdy) sSave("sp5-cfg", cfg); }, [cfg, rdy]);
  useEffect(() => { if (rdy) sSave("sp5-searchHistory", searchHistory); }, [searchHistory, rdy]);
  useEffect(() => { setAdded(new Set(list.map(i => i.oid))); }, [list]);
  useEffect(() => { if (rdy) doLoadBrowse(); }, [rdy]);

  const doLoadBrowse = async (options = {}) => {
    const zip = options.zipCode ?? cfg.zip;
    const showAllIndustries = options.showAllIndustries ?? cfg.showAllIndustries;
    setBLoad(true); setBErr(null);
    try {
      const [groups, flights] = await Promise.all([
        fetchPublishers(zip, { showAllIndustries }),
        fetchLeafletFlights(zip, { showAllIndustries }).catch(e => { console.error("[SP] leaflet flights err:", e); return {}; }),
      ]);
      setPubGroups(groups);
      setLeafletFlights(flights);
      // Fetch store locations in background (non-blocking)
      if (Object.keys(flights).length > 0) {
        getCoords(zip).then(coords => {
          fetchStoreLocations(flights, zip, coords)
            .then(locs => setStoreLocations(locs))
            .catch(e => console.error("[SP] store locations err:", e));
        });
      }
    } catch (e) { setBErr(e.message); }
    finally { setBLoad(false); }
  };

  const addToHistory = (term) => {
    if (term === "__clear__") { setSearchHistory([]); return; }
    setSearchHistory(prev => {
      const trimmed = term.trim();
      return [trimmed, ...prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    });
  };
  const goSearchWith = (term) => { setSearchPreFill(term); setTab("search"); };

  const openProspekt = async (slug, name, flight, allFlights) => {
    savedScrollRef.current = mainScrollRef.current?.scrollTop ?? 0;
    let leafletId = flight.mainLeafletId;
    let pageCount = flight.pageCount;
    try {
      const coords = await getCoords(cfg.zip);
      const best = await fetchBestLeaflet(flight.id, cfg.zip, coords);
      if (best?.id) { leafletId = best.id; pageCount = best.pageCount || pageCount; }
    } catch (e) { console.error("[SP] best leaflet err:", e); }
    setProspektOpen({ slug, name, leafletId, pageCount, offerCount: flight.offerCount, flight, allFlights: allFlights || [flight] });
  };
  const closeProspekt = () => {
    setProspektOpen(null);
    requestAnimationFrame(() => { if (mainScrollRef.current) mainScrollRef.current.scrollTop = savedScrollRef.current; });
  };

  const addItem = o => { if (added.has(o.id)) return; setList(p => [...p, { id: Date.now() + "_" + o.id, oid: o.id, offer: o, qty: 1, ck: false }]); };
  const rmItem = id => setList(p => p.filter(i => i.id !== id));
  const togCk = id => setList(p => p.map(i => i.id === id ? { ...i, ck: !i.ck } : i));
  const updQ = (id, d) => setList(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const clrCk = () => setList(p => p.filter(i => !i.ck));

  const tot = list.reduce((s, i) => s + i.offer.price * i.qty, 0);

  return (
    <div style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#f5f4f0", minHeight: "100vh", maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", color: "#1a1a1a", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}input::placeholder{color:#bbb}::-webkit-scrollbar{width:0}`}</style>

      {/* HEADER */}
      <div style={{ padding: "12px 18px 8px", background: "#1a1a1a", color: "#f5f4f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.5px" }}>Spar·Pilot</span>
            <span style={{ fontSize: "10px", color: "#666", fontFamily: "'JetBrains Mono',monospace" }}>{cfg.zip}</span>
          </div>
          {list.length > 0 && <div style={{ fontSize: "10px", color: "#10b981", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: "3px", background: "#10b98115", padding: "3px 8px", borderRadius: "6px" }}><ZapIc />{list.length} · {tot.toFixed(2)}€</div>}
        </div>
      </div>

      <div ref={mainScrollRef} style={{ flex: 1, overflowY: "auto", paddingBottom: "66px" }}>
        {tab === "angebote" && <AngeboteTab pubGroups={pubGroups} leafletFlights={leafletFlights} storeLocations={storeLocations} cfg={cfg} added={added} addItem={addItem} onLoadBrowse={doLoadBrowse} bLoad={bLoad} bErr={bErr} onOpenProspekt={openProspekt} onGoSearch={goSearchWith} />}
        {tab === "search" && <SearchTab cfg={cfg} added={added} addItem={addItem} searchHistory={searchHistory} onSearchHistoryUpdate={addToHistory} initialQ={searchPreFill} onConsumeInitialQ={() => setSearchPreFill(null)} />}
        {tab === "list" && <ListTab list={list} onRemove={rmItem} onToggleCheck={togCk} onUpdateQty={updQ} onClearChecked={clrCk} />}
        {tab === "settings" && <SettingsTab cfg={cfg} onUpdateCfg={patch => setCfg(s => ({ ...s, ...patch }))} onLoadBrowse={doLoadBrowse} onClearList={() => { if (confirm("Einkaufsliste leeren?")) setList([]); }} />}
      </div>

      {/* PROSPEKT VIEWER OVERLAY */}
      {prospektOpen && <ProspektViewer key={prospektOpen.leafletId} prospektOpen={prospektOpen} onClose={closeProspekt} onSwitchFlight={(flight) => openProspekt(prospektOpen.slug, prospektOpen.name, flight, prospektOpen.allFlights)} cfg={cfg} added={added} addItem={addItem} />}

      {/* NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", display: "flex", background: "#fff", borderTop: "1.5px solid #eee", zIndex: 100, padding: "0 0 env(safe-area-inset-bottom)" }}>
        {[{ k: "angebote", ic: <TagIc />, l: "Angebote" }, { k: "search", ic: <SearchIc />, l: "Suche" }, { k: "list", ic: <ListIc />, l: "Liste", b: list.length }, { k: "settings", ic: <GearIc />, l: "Mehr" }].map(t => <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "8px 0 6px", border: "none", background: "transparent", color: tab === t.k ? "#1a1a1a" : "#ccc", cursor: "pointer", position: "relative", fontFamily: "inherit", transition: "color 0.1s" }}>
          {t.b > 0 && <span style={{ position: "absolute", top: "2px", right: "calc(50% - 15px)", background: "#10b981", color: "#fff", fontSize: "8px", fontWeight: 800, width: "14px", height: "14px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.b}</span>}
          {t.ic}<span style={{ fontSize: "9px", fontWeight: tab === t.k ? 800 : 500 }}>{t.l}</span>
        </button>)}
      </div>
    </div>
  );
}
