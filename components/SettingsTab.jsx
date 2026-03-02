import { RETAILER_META, MY_LOYALTY } from "../lib/constants.js";
import { StarIc } from "./Icons.jsx";
import { Tog } from "./Shared.jsx";

export function SettingsTab({ cfg, onUpdateCfg, onLoadBrowse, onClearList }) {
  const toggleShowAllIndustries = () => {
    const next = !cfg.showAllIndustries;
    onUpdateCfg({ showAllIndustries: next });
    onLoadBrowse({ showAllIndustries: next });
  };

  return (
    <div style={{ padding: "16px 18px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>Einstellungen</h2>
      <div style={{ marginBottom: "16px" }}><label style={{ fontSize: "10px", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>Postleitzahl</label><div style={{ display: "flex", gap: "8px" }}><input type="text" value={cfg.zip} onChange={e => onUpdateCfg({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })} style={{ flex: 1, padding: "10px 12px", borderRadius: "9px", border: "2px solid #e5e5e0", fontSize: "16px", fontFamily: "'DM Mono',monospace", background: "#fff", outline: "none" }} /><button onClick={() => onLoadBrowse()} style={{ padding: "10px 14px", borderRadius: "9px", background: "#1a1a1a", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Laden</button></div></div>
      <div style={{ marginBottom: "16px" }}><label style={{ fontSize: "10px", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>Preisvergleich</label><div style={{ display: "flex", gap: "6px" }}>{[{ k: "per_unit", l: "Pro Einheit" }, { k: "per_pack", l: "Pro Packung" }].map(m => <button key={m.k} onClick={() => onUpdateCfg({ mode: m.k })} style={{ flex: 1, padding: "10px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, border: cfg.mode === m.k ? "2px solid #1a1a1a" : "2px solid #e5e5e0", background: cfg.mode === m.k ? "#1a1a1a" : "#fff", color: cfg.mode === m.k ? "#fff" : "#777", cursor: "pointer", fontFamily: "inherit" }}>{m.l}</button>)}</div></div>
      <Tog label="Treueangebote" desc={cfg.loyalty ? "Alle anzeigen (inkl. Karte)" : "Nur ohne Treuekarte"} val={cfg.loyalty} set={() => onUpdateCfg({ loyalty: !cfg.loyalty })} />
      <Tog label="Erweiterte Suche" desc={cfg.expand ? "Begriffe automatisch erweitern" : "Nur exakte Suche"} val={cfg.expand} set={() => onUpdateCfg({ expand: !cfg.expand })} />
      <Tog label="Alle Branchen zeigen" desc={cfg.showAllIndustries ? "Auch Baumarkt, Möbel etc." : "Nur Lebensmittel & Drogerie"} val={cfg.showAllIndustries} set={toggleShowAllIndustries} />
      <div style={{ marginBottom: "16px" }}><label style={{ fontSize: "10px", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>Meine Treueprogramme</label><div style={{ padding: "10px 12px", background: "#fff", borderRadius: "9px", border: "2px solid #e5e5e0", display: "flex", gap: "6px", flexWrap: "wrap" }}>{MY_LOYALTY.filter(s => RETAILER_META[s]).map(s => { const m = RETAILER_META[s]; return <span key={s} style={{ padding: "4px 9px", borderRadius: "5px", fontSize: "11px", fontWeight: 700, background: "#fef3c7", color: "#92400e", display: "inline-flex", alignItems: "center", gap: "3px" }}><StarIc />{m.name}{m.loyalty && ` (${m.loyalty})`}</span> })}</div></div>
      <div style={{ fontSize: "10px", color: "#ccc", padding: "10px", background: "#fff", borderRadius: "9px", border: "1px solid #eee", fontFamily: "'DM Mono',monospace", lineHeight: 1.5, marginBottom: "16px" }}><strong style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: "#999" }}>Lucene Suche:</strong><br />OR → milch OR hafermilch<br />Phrase → "irische butter"<br />Wildcard → kell*<br />Grouping → (milch OR sahne)</div>
      <button onClick={onClearList} style={{ width: "100%", padding: "10px", borderRadius: "9px", border: "2px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Einkaufsliste leeren</button>
    </div>
  );
}
