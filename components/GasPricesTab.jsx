import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchFuelStations } from "../lib/api.js";
import { FuelIc, RefIc } from "./Icons.jsx";
import { ErrBox, Spinner } from "./Shared.jsx";

const fuelOptions = [
  { key: "diesel", label: "Diesel" },
  { key: "e5", label: "Super E5" },
  { key: "e10", label: "Super E10" },
  { key: "all", label: "Alle" },
];

function fmtPrice(value) {
  return typeof value === "number" ? `${value.toFixed(3)} EUR` : "n/a";
}

function fmtDist(value) {
  return typeof value === "number" ? `${value.toFixed(1)} km` : "n/a";
}

function fmtAddress(station) {
  const street = [station.street, station.houseNumber].filter(Boolean).join(" ").trim();
  const place = [station.postCode, station.place].filter(Boolean).join(" ").trim();
  return [street, place].filter(Boolean).join(", ");
}

function fmtTimestamp(value) {
  if (!value) return "Noch nicht geladen";
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

export function GasPricesTab({ cfg, active, onUpdateCfg, getCoords }) {
  const [fuelData, setFuelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const requestRef = useRef(0);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    hasRequestedRef.current = false;
    setFuelData(null);
    setErr(null);
    setLastLoadedAt(null);
  }, [cfg.zip, cfg.fuelRadiusKm, cfg.fuelApiKey]);

  const loadFuelStations = useCallback(async (options = {}) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setErr(null);

    try {
      const coords = await getCoords(cfg.zip, { force: !!options.force });
      const response = await fetchFuelStations({
        zip: cfg.zip,
        radius: cfg.fuelRadiusKm,
        apiKey: cfg.fuelApiKey,
        coords,
        force: !!options.force,
      });
      if (requestRef.current !== requestId) return;
      setFuelData(response);
      setLastLoadedAt(new Date());
    } catch (e) {
      if (requestRef.current !== requestId) return;
      setErr(e.message);
      setFuelData(null);
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [cfg.fuelApiKey, cfg.fuelRadiusKm, cfg.zip, getCoords]);

  useEffect(() => {
    if (!active || !cfg.fuelApiKey || hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    loadFuelStations();
  }, [active, cfg.fuelApiKey, loadFuelStations]);

  const visibleStations = useMemo(() => {
    const stations = fuelData?.stations || [];
    const fuelType = cfg.fuelType || "diesel";

    return [...stations]
      .filter((station) => !cfg.fuelOpenOnly || station.isOpen)
      .sort((a, b) => {
        if (fuelType !== "all") {
          const aPrice = typeof a[fuelType] === "number" ? a[fuelType] : Number.POSITIVE_INFINITY;
          const bPrice = typeof b[fuelType] === "number" ? b[fuelType] : Number.POSITIVE_INFINITY;
          if (aPrice !== bPrice) return aPrice - bPrice;
        }
        return (a.dist ?? Number.POSITIVE_INFINITY) - (b.dist ?? Number.POSITIVE_INFINITY);
      });
  }, [cfg.fuelOpenOnly, cfg.fuelType, fuelData]);

  const summary = useMemo(() => {
    const stations = fuelData?.stations || [];
    const openStations = stations.filter((station) => station.isOpen).length;
    return {
      total: stations.length,
      open: openStations,
      showing: visibleStations.length,
    };
  }, [fuelData, visibleStations.length]);

  const hasKey = !!cfg.fuelApiKey?.trim();

  return (
    <div>
      <div style={{ padding: "12px 18px 0", position: "sticky", top: 0, zIndex: 50, background: "#f5f4f0" }}>
        <div style={{ background: "#fff", border: "1.5px solid #e5e5e0", borderRadius: "14px", padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ color: "#1a1a1a" }}><FuelIc /></span>
                <strong style={{ fontSize: "14px" }}>Spritpreise um PLZ {cfg.zip}</strong>
              </div>
              <div style={{ fontSize: "11px", color: "#888", fontFamily: "'JetBrains Mono',monospace" }}>
                Radius {cfg.fuelRadiusKm} km · Letztes Laden {fmtTimestamp(lastLoadedAt)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadFuelStations({ force: true })}
              disabled={loading || !hasKey}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 11px", borderRadius: "10px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: loading || !hasKey ? "default" : "pointer", opacity: loading || !hasKey ? 0.5 : 1, fontFamily: "inherit" }}
            >
              <RefIc />
              {fuelData ? "Aktualisieren" : "Preise laden"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {fuelOptions.map((option) => (
              <button
                type="button"
                key={option.key}
                onClick={() => onUpdateCfg({ fuelType: option.key })}
                style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: cfg.fuelType === option.key ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: cfg.fuelType === option.key ? "#1a1a1a" : "#fff", color: cfg.fuelType === option.key ? "#fff" : "#888", cursor: "pointer", fontFamily: "inherit" }}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onUpdateCfg({ fuelOpenOnly: !cfg.fuelOpenOnly })}
              style={{ padding: "5px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 600, border: cfg.fuelOpenOnly ? "2px solid #1a1a1a" : "1.5px solid #ddd", background: cfg.fuelOpenOnly ? "#1a1a1a" : "#fff", color: cfg.fuelOpenOnly ? "#fff" : "#888", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}
            >
              Nur offen
            </button>
          </div>
        </div>
      </div>

      {!hasKey && (
        <div style={{ padding: "12px 18px 18px" }}>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", marginBottom: "6px" }}>Tankerkönig API-Key fehlt</div>
            <div style={{ fontSize: "12px", color: "#92400e", lineHeight: 1.5 }}>
              Der Tab ist vorbereitet. Sobald dein Key da ist, kannst du ihn unter Einstellungen einfuegen und direkt laden.
            </div>
          </div>
        </div>
      )}

      {err && <ErrBox msg={err} onRetry={hasKey ? () => loadFuelStations({ force: true }) : undefined} />}

      <div style={{ padding: "6px 18px 18px" }}>
        {loading && <Spinner text="Spritpreise werden geladen..." />}

        {!loading && hasKey && !fuelData && !err && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⛽</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Spritpreise laden</div>
            <div style={{ fontSize: "11px", marginTop: "3px", fontFamily: "'JetBrains Mono',monospace" }}>PLZ {cfg.zip} · {cfg.fuelRadiusKm} km</div>
          </div>
        )}

        {!loading && fuelData && visibleStations.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>😕</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Keine passenden Tankstellen gefunden</div>
            <div style={{ fontSize: "11px", marginTop: "3px", fontFamily: "'JetBrains Mono',monospace" }}>
              {cfg.fuelOpenOnly ? "Filter 'Nur offen' deaktivieren oder Radius erhoehen" : "Radius erhoehen oder PLZ pruefen"}
            </div>
          </div>
        )}

        {!loading && visibleStations.length > 0 && (
          <>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
              <span style={{ padding: "4px 8px", borderRadius: "999px", background: "#fff", border: "1px solid #eee", fontSize: "10px", color: "#777", fontFamily: "'JetBrains Mono',monospace" }}>{summary.showing} sichtbar</span>
              <span style={{ padding: "4px 8px", borderRadius: "999px", background: "#fff", border: "1px solid #eee", fontSize: "10px", color: "#777", fontFamily: "'JetBrains Mono',monospace" }}>{summary.open} offen</span>
              <span style={{ padding: "4px 8px", borderRadius: "999px", background: "#fff", border: "1px solid #eee", fontSize: "10px", color: "#777", fontFamily: "'JetBrains Mono',monospace" }}>{summary.total} gesamt</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {visibleStations.map((station) => (
                <div key={station.id} style={{ background: "#fff", borderRadius: "12px", padding: "12px", border: "1px solid #ece9e2", animation: "fadeIn 0.2s ease" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>{station.brand || station.name}</div>
                      <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{fmtAddress(station)}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: station.isOpen ? "#10b981" : "#dc2626" }}>
                        {station.isOpen ? "Offen" : "Geschlossen"}
                      </div>
                      <div style={{ fontSize: "10px", color: "#999", fontFamily: "'JetBrains Mono',monospace" }}>{fmtDist(station.dist)}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "6px" }}>
                    {["diesel", "e5", "e10"].map((fuelKey) => (
                      <div key={fuelKey} style={{ padding: "8px 9px", borderRadius: "10px", background: cfg.fuelType === fuelKey ? "#1a1a1a" : "#f6f5f1", color: cfg.fuelType === fuelKey ? "#fff" : "#1a1a1a" }}>
                        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.4px", opacity: cfg.fuelType === fuelKey ? 0.7 : 0.5 }}>{fuelKey}</div>
                        <div style={{ fontSize: "12px", fontWeight: 800, marginTop: "2px", fontFamily: "'JetBrains Mono',monospace" }}>{fmtPrice(station[fuelKey])}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: "14px", fontSize: "10px", color: "#999", lineHeight: 1.5, textAlign: "center" }}>
          Preisdaten von <a href="https://creativecommons.tankerkoenig.de/?page=info" target="_blank" rel="noreferrer" style={{ color: "#666" }}>Tankerkönig.de</a> · CC BY 4.0
        </div>
      </div>
    </div>
  );
}
