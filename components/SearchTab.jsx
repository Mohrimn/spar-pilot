import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getRetColor, isMyLoyalty, isLightColor } from "../lib/constants.js";
import { disc, uPrice, isStarted } from "../lib/utils.js";
import { catLabel, EXPANSIONS, isStrongProductMatch } from "../lib/offers.js";
import { apiSearch } from "../lib/api.js";
import { SearchIc } from "./Icons.jsx";
import { Spinner, ErrBox } from "./Shared.jsx";
import { Card } from "./Card.jsx";

export function SearchTab({ cfg, added, addItem, searchHistory = [], onSearchHistoryUpdate, initialQ, onConsumeInitialQ }) {
  const [q, setQ] = useState("");
  const [sRes, setSRes] = useState([]);
  const [sDone, setSDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [sort, setSort] = useState("unitPrice");
  const [searchGroupBy, setSearchGroupBy] = useState("vendor");
  const [searchOnlyStarted, setSearchOnlyStarted] = useState(false);
  const [searchPrecise, setSearchPrecise] = useState(false);
  const requestRef = useRef(0);
  const qRef = useRef(q);

  useEffect(() => {
    qRef.current = q;
  }, [q]);

  const doSearch = useCallback(async (e, overrideQ, options = {}) => {
    e?.preventDefault();
    const term = overrideQ || qRef.current;
    if (!term.trim() || term.trim().length < 2) return;
    const force = !!options.force;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true); setErr(null); setSDone(false);
    try {
      const expanded = cfg.expand && EXPANSIONS[term.trim().toLowerCase()] ? EXPANSIONS[term.trim().toLowerCase()] : term;
      const offers = await apiSearch(expanded, cfg.zip, 200, { force });
      if (requestRef.current !== requestId) return;
      setSRes(offers); setSDone(true);
      onSearchHistoryUpdate?.(term.trim());
    } catch (e) {
      if (requestRef.current !== requestId) return;
      setErr(e.message); setSRes([]); setSDone(true);
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [cfg.expand, cfg.zip, onSearchHistoryUpdate]);

  useEffect(() => {
    if (!initialQ) return;
    setQ(initialQ);
    doSearch(null, initialQ);
    onConsumeInitialQ?.();
  }, [doSearch, initialQ, onConsumeInitialQ]);

  const srt = useCallback((arr) => [...arr].sort((a, b) => {
    if (sort === "unitPrice") {
      const ua = uPrice(a), ub = uPrice(b);
      // Items with unit price sort before items without, then by unit price; fallback to pack price
      if (ua && ub) return ua - ub;
      if (ua && !ub) return -1;
      if (!ua && ub) return 1;
      return a.price - b.price;
    }
    if (sort === "price") return a.price - b.price;
    if (sort === "discount") return disc(b) - disc(a);
    if (sort === "endsSoon") { const ae = a.validityDates?.[0]?.to ? new Date(a.validityDates[0].to) : new Date("2099-01-01"); const be = b.validityDates?.[0]?.to ? new Date(b.validityDates[0].to) : new Date("2099-01-01"); return ae - be; }
    return 0;
  }), [sort]);

  const filtOffers = useCallback((arr) => {
    let r = [...arr];
    if (!cfg.loyalty) r = r.filter(o => !o.requiresLoyalty || isMyLoyalty(o.retailerSlug, o.retailerName, cfg.myLoyalty));
    return r;
  }, [cfg.loyalty, cfg.myLoyalty]);

  const fsBase = useMemo(() => srt(filtOffers(sRes)), [filtOffers, sRes, srt]);
  const fsPreciseBase = useMemo(() => searchPrecise ? fsBase.filter(o => isStrongProductMatch(o, q)) : fsBase, [fsBase, q, searchPrecise]);
  const fs = useMemo(() => searchOnlyStarted ? fsPreciseBase.filter(o => isStarted(o)) : fsPreciseBase, [fsPreciseBase, searchOnlyStarted]);
  const searchVendorCount = useMemo(() => new Set(fs.map(o => o.retailerName)).size, [fs]);
  const searchUpcomingCount = useMemo(() => fs.filter(o => !isStarted(o)).length, [fs]);
  const searchGrouped = useMemo(() => {
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
  }, [fs, searchGroupBy]);

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
            <button type="button" onClick={() => setSearchPrecise(v => !v)} style={{ padding: "4px 9px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: searchPrecise ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: searchPrecise ? "#1a1a1a" : "#fff", color: searchPrecise ? "#fff" : "#888", cursor: "pointer", fontFamily: "inherit" }}>Genaue Treffer</button>
            <button type="button" onClick={() => setSearchOnlyStarted(v => !v)} style={{ padding: "4px 9px", borderRadius: "14px", fontSize: "10px", fontWeight: 600, border: searchOnlyStarted ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: searchOnlyStarted ? "#1a1a1a" : "#fff", color: searchOnlyStarted ? "#fff" : "#888", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>Nur gestartet</button>
          </div>
          <span style={{ fontSize: "10px", color: "#bbb", fontFamily: "'JetBrains Mono',monospace", width: "100%" }}>
            {searchVendorCount} Händler · {fs.length - searchUpcomingCount} aktiv · {searchUpcomingCount} startet später
          </span>
        </div>}
        {!sDone && !loading && <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
          {(searchHistory.length > 0 ? searchHistory : ["Milch", "Butter", "Kaffee", "Bier", "Nudeln", "Chips", "Käse", "Wasser", "Eier", "Pizza"]).map(t => <button type="button" key={t} onClick={() => { setQ(t); doSearch(null, t); }} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 500, border: "1.5px solid #e0e0db", background: "#fff", color: "#777", cursor: "pointer", fontFamily: "inherit" }}>{t}</button>)}
          {searchHistory.length > 0 && <button type="button" onClick={() => onSearchHistoryUpdate?.("__clear__")} style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 500, border: "1.5px solid #e0e0db", background: "#fff", color: "#ccc", cursor: "pointer", fontFamily: "inherit" }}>Verlauf löschen</button>}
        </div>}
      </form>
      <div style={{ padding: "6px 18px 18px" }}>
        {loading && <Spinner text="Suche läuft…" />}
        {!loading && !sDone && !err && <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div><div style={{ fontSize: "13px", fontWeight: 500 }}>Produkt suchen</div><div style={{ fontSize: "11px", marginTop: "3px", fontFamily: "'JetBrains Mono',monospace" }}>"milch OR hafermilch" · kell* · "irische butter"</div></div>}
        {err && <ErrBox msg={err} onRetry={() => doSearch(null, q, { force: true })} />}
        {sDone && !loading && sRes.length === 0 && !err && <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>😕</div><div style={{ fontSize: "13px" }}>Keine Treffer für „{q}"</div></div>}
        {sDone && !loading && sRes.length > 0 && fs.length === 0 && !err && <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>{searchPrecise ? "🎯" : "⏳"}</div><div style={{ fontSize: "13px" }}>{searchPrecise ? "Keine genauen Treffer" : "Nur kommende Angebote gefunden"}</div><div style={{ fontSize: "11px", marginTop: "3px", fontFamily: "'JetBrains Mono',monospace" }}>{searchPrecise ? "Filter „Genaue Treffer” deaktivieren" : "Filter „Nur gestartet” deaktivieren"}</div></div>}
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
