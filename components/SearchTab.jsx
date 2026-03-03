import { useState } from "react";
import { getRetColor, isMyLoyalty, isLightColor } from "../lib/constants.js";
import { disc, uPrice, isStarted } from "../lib/utils.js";
import { catLabel, EXPANSIONS } from "../lib/offers.js";
import { apiSearch } from "../lib/api.js";
import { SearchIc, ZapIc } from "./Icons.jsx";
import { Spinner, ErrBox } from "./Shared.jsx";
import { Card } from "./Card.jsx";

export function SearchTab({ cfg, added, addItem }) {
  const [q, setQ] = useState("");
  const [sRes, setSRes] = useState([]);
  const [sDone, setSDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [sort, setSort] = useState("unitPrice");
  const [searchGroupBy, setSearchGroupBy] = useState("vendor");
  const [searchOnlyStarted, setSearchOnlyStarted] = useState(false);

  const doSearch = async (e, overrideQ) => {
    e?.preventDefault();
    const term = overrideQ || q;
    if (!term.trim() || term.trim().length < 2) return;
    setLoading(true); setErr(null); setSDone(false);
    try {
      const expanded = cfg.expand && EXPANSIONS[term.trim().toLowerCase()] ? EXPANSIONS[term.trim().toLowerCase()] : term;
      const offers = await apiSearch(expanded, cfg.zip);
      setSRes(offers); setSDone(true);
    } catch (e) { setErr(e.message); setSRes([]); setSDone(true); }
    finally { setLoading(false); }
  };

  const srt = (arr) => [...arr].sort((a, b) => {
    if (sort === "unitPrice") return (uPrice(a) || a.price) - (uPrice(b) || b.price);
    if (sort === "price") return a.price - b.price;
    if (sort === "discount") return disc(b) - disc(a);
    if (sort === "endsSoon") { const ae = a.validityDates?.[0]?.to ? new Date(a.validityDates[0].to) : new Date("2099-01-01"); const be = b.validityDates?.[0]?.to ? new Date(b.validityDates[0].to) : new Date("2099-01-01"); return ae - be; }
    return 0;
  });

  const filtOffers = (arr) => {
    let r = [...arr];
    if (!cfg.loyalty) r = r.filter(o => !o.requiresLoyalty || isMyLoyalty(o.retailerSlug, o.retailerName, cfg.myLoyalty));
    return r;
  };

  const fsBase = srt(filtOffers(sRes));
  const fs = searchOnlyStarted ? fsBase.filter(o => isStarted(o)) : fsBase;
  const searchVendorCount = new Set(fs.map(o => o.retailerName)).size;
  const searchUpcomingCount = fs.filter(o => !isStarted(o)).length;
  const searchGrouped = (() => {
    if (searchGroupBy === "none") return [];
    const keyFn = searchGroupBy === "vendor"
      ? (o) => o.retailerName || "Unbekannt"
      : (o) => catLabel(o);
    const groups = new Map();
    for (const o of fs) {
      const k = keyFn(o);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(o);
    }
    return Array.from(groups.entries()).map(([name, offers]) => ({ name, offers }));
  })();

  return (
    <div>
      <form onSubmit={doSearch} style={{ padding: "12px 18px 4px", position: "sticky", top: 0, zIndex: 50, background: "#f5f4f0" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "#fff", borderRadius: "11px", padding: "0 12px", border: "2px solid #e5e5e0" }}>
            <SearchIc />
            <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder='Milch, "irische butter", kell*' style={{ flex: 1, border: "none", outline: "none", padding: "11px 0", fontSize: "16px", fontFamily: "inherit", background: "transparent" }} />
          </div>
          <button type="submit" disabled={loading} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "11px", padding: "0 16px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.5 : 1 }}>{loading ? "…" : "Los"}</button>
        </div>
        <div style={{ fontSize: "10px", color: "#999", fontFamily: "'JetBrains Mono',monospace", padding: "6px 2px 0" }}>Globale Suche über alle Händler</div>
        {sDone && sRes.length > 0 && <div style={{ display: "flex", gap: "4px", marginTop: "8px", alignItems: "center", flexWrap: "wrap", paddingBottom: "4px" }}>
          {[{ k: "unitPrice", l: "Stückpreis" }, { k: "price", l: "Preis" }, { k: "discount", l: "% Rabatt" }, { k: "endsSoon", l: "Endet bald" }].map(s => <button type="button" key={s.k} onClick={() => setSort(s.k)} style={{ padding: "4px 9px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: sort === s.k ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: sort === s.k ? "#1a1a1a" : "#fff", color: sort === s.k ? "#fff" : "#888", cursor: "pointer", fontFamily: "inherit" }}>{s.l}</button>)}
          <span style={{ fontSize: "10px", color: "#bbb", fontFamily: "'JetBrains Mono',monospace", marginLeft: "auto" }}>{fs.length}</span>
          <div style={{ width: "100%", display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[{ k: "vendor", l: "Nach Händler" }, { k: "category", l: "Nach Kategorie" }, { k: "none", l: "Liste" }].map(g => <button type="button" key={g.k} onClick={() => setSearchGroupBy(g.k)} style={{ padding: "4px 9px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: searchGroupBy === g.k ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: searchGroupBy === g.k ? "#1a1a1a" : "#fff", color: searchGroupBy === g.k ? "#fff" : "#888", cursor: "pointer", fontFamily: "inherit" }}>{g.l}</button>)}
            <button type="button" onClick={() => setSearchOnlyStarted(v => !v)} style={{ padding: "4px 9px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: searchOnlyStarted ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: searchOnlyStarted ? "#1a1a1a" : "#fff", color: searchOnlyStarted ? "#fff" : "#888", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>Nur gestartet</button>
          </div>
          <span style={{ fontSize: "10px", color: "#bbb", fontFamily: "'JetBrains Mono',monospace", width: "100%" }}>
            {searchVendorCount} Händler · {fs.length - searchUpcomingCount} aktiv · {searchUpcomingCount} startet später
          </span>
        </div>}
        {!sDone && !loading && <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
          {["Milch", "Butter", "Kaffee", "Bier", "Nudeln", "Chips", "Käse", "Wasser", "Eier", "Pizza"].map(t => <button type="button" key={t} onClick={() => { setQ(t); doSearch(null, t); }} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 500, border: "1.5px solid #e0e0db", background: "#fff", color: "#777", cursor: "pointer", fontFamily: "inherit" }}>{t}</button>)}
        </div>}
      </form>
      <div style={{ padding: "6px 18px 18px" }}>
        {loading && <Spinner text="Suche läuft…" />}
        {!loading && !sDone && !err && <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div><div style={{ fontSize: "13px", fontWeight: 500 }}>Produkt suchen</div><div style={{ fontSize: "11px", marginTop: "3px", fontFamily: "'JetBrains Mono',monospace" }}>"milch OR hafermilch" · kell* · "irische butter"</div></div>}
        {err && <ErrBox msg={err} onRetry={() => doSearch(null, q)} />}
        {sDone && !loading && sRes.length === 0 && !err && <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>😕</div><div style={{ fontSize: "13px" }}>Keine Treffer für „{q}"</div></div>}
        {sDone && !loading && sRes.length > 0 && fs.length === 0 && !err && <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div><div style={{ fontSize: "13px" }}>Nur kommende Angebote gefunden</div><div style={{ fontSize: "11px", marginTop: "3px", fontFamily: "'JetBrains Mono',monospace" }}>Filter „Nur gestartet" deaktivieren</div></div>}
        {fs.length > 0 && !added.has(fs[0]?.id) && <button onClick={() => addItem(fs[0])} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "#059669", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px" }}><ZapIc /> Günstigstes: {fs[0]?.price.toFixed(2)}€ bei {fs[0]?.retailerName}</button>}
        {searchGroupBy === "none" && fs.map(o => <div key={o.id} style={{ marginBottom: "6px", animation: "fadeIn 0.2s ease" }}><Card o={o} added={added} addItem={addItem} myLoyalty={cfg.myLoyalty} /></div>)}
        {searchGroupBy !== "none" && searchGrouped.map(g => { const vendorMode = searchGroupBy === "vendor"; const rc = vendorMode ? getRetColor(g.offers[0]?.retailerSlug, g.name) : "#1a1a1a"; const lt = isLightColor(rc); return <div key={g.name} style={{ marginBottom: "10px", animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", background: vendorMode ? rc : "#fff", border: vendorMode ? "none" : "1px solid #eee", borderRadius: "9px 9px 4px 4px", color: vendorMode ? (lt ? "#1a1a1a" : "#fff") : "#1a1a1a" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>{g.name}</span>
            <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono',monospace", opacity: vendorMode ? 0.8 : 0.6 }}>{g.offers.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingTop: "5px" }}>
            {g.offers.map(o => <Card key={o.id} o={o} sm showRetailer={searchGroupBy === "category"} added={added} addItem={addItem} myLoyalty={cfg.myLoyalty} />)}
          </div>
        </div> })}
      </div>
    </div>
  );
}
