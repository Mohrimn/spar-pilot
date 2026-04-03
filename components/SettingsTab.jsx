import { loyaltyRetailers, getRetColor, isLightColor } from "../lib/constants.js";
import { StarIc } from "./Icons.jsx";
import { Tog } from "./Shared.jsx";

export function SettingsTab({ cfg, onUpdateCfg, onLoadBrowse, onClearList }) {
  const toggleShowAllIndustries = () => {
    const next = !cfg.showAllIndustries;
    onUpdateCfg({ showAllIndustries: next });
    onLoadBrowse({ showAllIndustries: next, force: true });
  };

  const allLoyalty = loyaltyRetailers();
  const myLoyalty = cfg.myLoyalty || [];

  // Group retailers that share the same loyalty program (e.g. REWE + REWE Center → Payback)
  const loyaltyGroups = [];
  const seen = new Set();
  for (const r of allLoyalty) {
    if (seen.has(r.loyalty)) continue;
    seen.add(r.loyalty);
    const slugs = allLoyalty.filter(x => x.loyalty === r.loyalty).map(x => x.slug);
    loyaltyGroups.push({ loyalty: r.loyalty, name: allLoyalty.filter(x => x.loyalty === r.loyalty).map(x => x.name).join(" & "), slugs, mainSlug: slugs[0] });
  }

  const toggleLoyaltyGroup = (slugs) => {
    const current = cfg.myLoyalty || [];
    const allActive = slugs.every(s => current.includes(s));
    const next = allActive
      ? current.filter(s => !slugs.includes(s))
      : [...new Set([...current, ...slugs])];
    onUpdateCfg({ myLoyalty: next });
  };

  const sectionLabel = { fontSize: "10px", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" };

  return (
    <div style={{ padding: "16px 18px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>Einstellungen</h2>

      {/* PLZ */}
      <div style={{ marginBottom: "18px" }}>
        <label style={sectionLabel}>Postleitzahl</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="text" value={cfg.zip} onChange={e => onUpdateCfg({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })} style={{ flex: 1, padding: "10px 12px", borderRadius: "9px", border: "2px solid #e5e5e0", fontSize: "16px", fontFamily: "'JetBrains Mono',monospace", background: "#fff", outline: "none" }} />
          <button onClick={() => onLoadBrowse({ force: true })} style={{ padding: "10px 14px", borderRadius: "9px", background: "#1a1a1a", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Laden</button>
        </div>
      </div>

      {/* Preisvergleich */}
      <div style={{ marginBottom: "18px" }}>
        <label style={sectionLabel}>Preisvergleich</label>
        <div style={{ display: "flex", gap: "6px" }}>
          {[{ k: "per_unit", l: "Pro Einheit" }, { k: "per_pack", l: "Pro Packung" }].map(m =>
            <button key={m.k} onClick={() => onUpdateCfg({ mode: m.k })} style={{ flex: 1, padding: "10px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, border: cfg.mode === m.k ? "2px solid #1a1a1a" : "2px solid #e5e5e0", background: cfg.mode === m.k ? "#1a1a1a" : "#fff", color: cfg.mode === m.k ? "#fff" : "#777", cursor: "pointer", fontFamily: "inherit" }}>{m.l}</button>
          )}
        </div>
      </div>

      {/* Tanken */}
      <div style={{ marginBottom: "18px" }}>
        <label style={sectionLabel}>Tanken</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#999", marginBottom: "4px" }}>Radius in km</div>
              <input
                type="number"
                min="1"
                max="25"
                step="0.5"
                value={cfg.fuelRadiusKm}
                onChange={e => onUpdateCfg({ fuelRadiusKm: Math.min(25, Math.max(1, Number.parseFloat(e.target.value) || 1)) })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: "2px solid #e5e5e0", fontSize: "15px", fontFamily: "'JetBrains Mono',monospace", background: "#fff", outline: "none" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#999", marginBottom: "4px" }}>Standardsorte</div>
              <select
                value={cfg.fuelType || "diesel"}
                onChange={e => onUpdateCfg({ fuelType: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: "2px solid #e5e5e0", fontSize: "13px", fontFamily: "inherit", background: "#fff", outline: "none" }}
              >
                <option value="diesel">Diesel</option>
                <option value="e5">Super E5</option>
                <option value="e10">Super E10</option>
                <option value="all">Alle</option>
              </select>
            </div>
          </div>
          <div style={{ fontSize: "10px", color: "#999", padding: "10px", background: "#fff", borderRadius: "9px", border: "1px solid #eee", lineHeight: 1.5 }}>
            Tankerkönig arbeitet mit Koordinaten und Radius, nicht direkt mit PLZ-Filtern. Die App nutzt deshalb die eingegebene PLZ als Suchzentrum.
            <br />
            Der API-Key ist jetzt fest im Frontend hinterlegt und nicht mehr im UI sichtbar. Abfragen sollten laut API-Doku nur auf Useraktion erfolgen. Namensnennung ist erforderlich: Tankerkönig.de / CC BY 4.0.
          </div>
        </div>
      </div>

      {/* Treueprogramme */}
      <div style={{ marginBottom: "18px" }}>
        <label style={sectionLabel}>Meine Treuekarten</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {loyaltyGroups.map(g => {
            const active = g.slugs.every(s => myLoyalty.includes(s));
            const rc = getRetColor(g.mainSlug, "");
            const lt = isLightColor(rc);
            return <button key={g.loyalty} onClick={() => toggleLoyaltyGroup(g.slugs)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 12px", borderRadius: "9px",
              border: active ? `2px solid ${rc}` : "2px solid #e5e5e0",
              background: active ? rc : "#fff",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0,
                border: active ? "none" : "2px solid #ddd",
                background: active ? (lt ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)") : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: active ? (lt ? "#1a1a1a" : "#fff") : "transparent",
                fontSize: "12px", fontWeight: 800,
              }}>{active ? "✓" : ""}</div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: active ? (lt ? "#1a1a1a" : "#fff") : "#1a1a1a" }}>{g.loyalty}</div>
                <div style={{ fontSize: "10px", color: active ? (lt ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)") : "#999" }}>{g.name}</div>
              </div>
              {active && <span style={{ color: lt ? "#1a1a1a" : "#fff" }}><StarIc /></span>}
            </button>;
          })}
        </div>
        {myLoyalty.length > 0 && <div style={{ fontSize: "10px", color: "#999", marginTop: "6px", paddingLeft: "2px" }}>{loyaltyGroups.filter(g => g.slugs.every(s => myLoyalty.includes(s))).length} Karte{loyaltyGroups.filter(g => g.slugs.every(s => myLoyalty.includes(s))).length !== 1 ? "n" : ""} aktiv</div>}
      </div>

      {/* Toggles */}
      <Tog label="Treueangebote" desc={cfg.loyalty ? "Alle anzeigen (inkl. Kartenangebote)" : "Nur Angebote ohne Treuekarte"} val={cfg.loyalty} set={() => onUpdateCfg({ loyalty: !cfg.loyalty })} />
      <Tog label="Erweiterte Suche" desc={cfg.expand ? "Begriffe automatisch erweitern" : "Nur exakte Suche"} val={cfg.expand} set={() => onUpdateCfg({ expand: !cfg.expand })} />
      <Tog label="Alle Branchen" desc={cfg.showAllIndustries ? "Auch Baumarkt, Möbel etc." : "Nur Lebensmittel & Drogerie"} val={cfg.showAllIndustries} set={toggleShowAllIndustries} />
      <Tog label="Tankstellen offen" desc={cfg.fuelOpenOnly ? "Im Tanken-Tab nur offene Tankstellen" : "Im Tanken-Tab auch geschlossene Tankstellen"} val={cfg.fuelOpenOnly} set={() => onUpdateCfg({ fuelOpenOnly: !cfg.fuelOpenOnly })} />

      {/* Lucene help */}
      <div style={{ fontSize: "10px", color: "#ccc", padding: "10px", background: "#fff", borderRadius: "9px", border: "1px solid #eee", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5, marginBottom: "16px" }}>
        <strong style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: "#999" }}>Suchtipps:</strong><br />
        OR → milch OR hafermilch<br />
        Phrase → "irische butter"<br />
        Wildcard → kell*
      </div>

      {/* Clear list */}
      <button onClick={onClearList} style={{ width: "100%", padding: "10px", borderRadius: "9px", border: "2px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Einkaufsliste leeren</button>
    </div>
  );
}
