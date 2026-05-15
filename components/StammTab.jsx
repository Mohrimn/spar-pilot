import { useCallback, useMemo, useRef, useState } from "react";
import { apiSearch } from "../lib/api.js";
import { EXPANSIONS, isStrongProductMatch } from "../lib/offers.js";
import { disc, uPrice } from "../lib/utils.js";
import { memorySummary, stapleKey } from "../lib/priceMemory.js";
import { SearchIc, TrashIc, RefIc, StarIc } from "./Icons.jsx";
import { ErrBox, Spinner } from "./Shared.jsx";
import { Card } from "./Card.jsx";

const starterTerms = ["Butter", "Milch", "Kaffee", "Käse", "Nudeln", "Waschmittel"];

function sortOffers(offers) {
  return [...offers].sort((a, b) => {
    const ua = uPrice(a);
    const ub = uPrice(b);
    if (ua && ub && ua !== ub) return ua - ub;
    if (ua && !ub) return -1;
    if (!ua && ub) return 1;
    if (disc(b) !== disc(a)) return disc(b) - disc(a);
    return a.price - b.price;
  });
}

function fmtSeen(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function PriceMemoryLine({ summary }) {
  if (!summary) return <span>Noch keine Preishistorie</span>;
  return (
    <span>
      Bestpreis {summary.minPrice?.toFixed(2)}€
      {summary.minUnitPrice ? ` · ${summary.minUnitPrice.toFixed(2)}€/${summary.latest?.unitShort || "Einh."}` : ""}
      {summary.latest ? ` · zuletzt ${summary.latest.price.toFixed(2)}€ am ${fmtSeen(summary.latest.seenAt)}` : ""}
    </span>
  );
}

export function StammTab({
  cfg,
  staples,
  priceMemory,
  added,
  addItem,
  onAddStaple,
  onRemoveStaple,
  onRememberStapleOffers,
  onGoSearch,
}) {
  const [term, setTerm] = useState("");
  const [stateById, setStateById] = useState({});
  const requestRef = useRef({});

  const knownKeys = useMemo(() => new Set(staples.map(staple => stapleKey(staple.term))), [staples]);

  const addTerm = useCallback((rawTerm) => {
    const trimmed = rawTerm.trim();
    if (trimmed.length < 2) return;
    onAddStaple(trimmed);
    setTerm("");
  }, [onAddStaple]);

  const loadStaple = useCallback(async (staple, options = {}) => {
    const requestId = (requestRef.current[staple.id] || 0) + 1;
    requestRef.current = { ...requestRef.current, [staple.id]: requestId };
    setStateById(prev => ({ ...prev, [staple.id]: { ...(prev[staple.id] || {}), loading: true, err: null } }));
    try {
      const q = cfg.expand && EXPANSIONS[stapleKey(staple.term)] ? EXPANSIONS[stapleKey(staple.term)] : staple.term;
      const rawOffers = await apiSearch(q, cfg.zip, 120, { force: !!options.force });
      const preciseOffers = rawOffers.filter(offer => isStrongProductMatch(offer, staple.term));
      const offers = sortOffers(preciseOffers).slice(0, 8);
      const hiddenCount = rawOffers.length - preciseOffers.length;
      if (requestRef.current[staple.id] !== requestId) return;
      onRememberStapleOffers(staple.term, offers);
      setStateById(prev => ({
        ...prev,
        [staple.id]: { loading: false, err: null, offers, hiddenCount, loadedAt: new Date().toISOString() },
      }));
    } catch (e) {
      if (requestRef.current[staple.id] !== requestId) return;
      setStateById(prev => ({ ...prev, [staple.id]: { ...(prev[staple.id] || {}), loading: false, err: e.message } }));
    }
  }, [cfg.expand, cfg.zip, onRememberStapleOffers]);

  const loadAll = useCallback(() => {
    staples.forEach((staple, index) => {
      setTimeout(() => loadStaple(staple, { force: index === 0 }), index * 120);
    });
  }, [loadStaple, staples]);

  return (
    <div>
      <div style={{ padding: "12px 18px 8px", position: "sticky", top: 0, zIndex: 50, background: "#f5f4f0" }}>
        <form onSubmit={(e) => { e.preventDefault(); addTerm(term); }} style={{ background: "#fff", border: "1.5px solid #e5e5e0", borderRadius: "14px", padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ color: "#f59e0b" }}><StarIc /></span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 800 }}>Stammprodukte</div>
              <div style={{ fontSize: "10px", color: "#999", fontFamily: "'JetBrains Mono',monospace" }}>{staples.length} gespeichert · lokale Preishistorie</div>
            </div>
            {staples.length > 0 && <button type="button" onClick={loadAll} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 10px", borderRadius: "9px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "11px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><RefIc /> Alle</button>}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder="z.B. Butter, Kaffee, Waschmittel"
              style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: "10px", border: "2px solid #e5e5e0", fontSize: "14px", fontFamily: "inherit", outline: "none" }}
            />
            <button type="submit" disabled={term.trim().length < 2 || knownKeys.has(stapleKey(term))} style={{ padding: "10px 12px", borderRadius: "10px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: term.trim().length < 2 || knownKeys.has(stapleKey(term)) ? "default" : "pointer", opacity: term.trim().length < 2 || knownKeys.has(stapleKey(term)) ? 0.45 : 1, fontFamily: "inherit" }}>Merken</button>
          </div>
        </form>
      </div>

      <div style={{ padding: "4px 18px 18px" }}>
        {staples.length === 0 && (
          <div style={{ textAlign: "center", padding: "42px 0", color: "#aaa" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>★</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#777" }}>Noch keine Stammprodukte</div>
            <div style={{ fontSize: "11px", marginTop: "4px", lineHeight: 1.4 }}>Speichere Produkte, die du regelmaessig kaufst, und vergleiche ihre Preise wieder.</div>
            <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginTop: "12px" }}>
              {starterTerms.map(t => <button key={t} type="button" onClick={() => addTerm(t)} style={{ padding: "6px 10px", borderRadius: "999px", border: "1.5px solid #e5e5e0", background: "#fff", color: "#777", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t}</button>)}
            </div>
          </div>
        )}

        {staples.map(staple => {
          const state = stateById[staple.id] || {};
          const summary = memorySummary(priceMemory, staple.term);
          const offers = state.offers || [];
          return (
            <div key={staple.id} style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: "13px", padding: "12px", marginBottom: "10px", animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "9px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{staple.term}</div>
                  <div style={{ fontSize: "10px", color: "#999", lineHeight: 1.4 }}>
                    <PriceMemoryLine summary={summary} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                  <button type="button" onClick={() => onGoSearch(staple.term)} style={{ width: "31px", height: "31px", borderRadius: "9px", border: "1.5px solid #e5e5e0", background: "#fff", color: "#666", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="In Suche öffnen"><SearchIc /></button>
                  <button type="button" onClick={() => loadStaple(staple, { force: true })} disabled={state.loading} style={{ width: "31px", height: "31px", borderRadius: "9px", border: "none", background: "#1a1a1a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: state.loading ? "default" : "pointer", opacity: state.loading ? 0.5 : 1 }} title="Aktualisieren"><RefIc /></button>
                  <button type="button" onClick={() => onRemoveStaple(staple.id)} style={{ width: "31px", height: "31px", borderRadius: "9px", border: "1.5px solid #fee2e2", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Entfernen"><TrashIc /></button>
                </div>
              </div>

              {state.loading && <Spinner text={`${staple.term} wird gesucht...`} />}
              {state.err && <ErrBox msg={state.err} onRetry={() => loadStaple(staple, { force: true })} />}
              {!state.loading && !state.err && !state.loadedAt && <div style={{ fontSize: "11px", color: "#aaa", padding: "8px 0" }}>Aktualisieren, um aktuelle Angebote und neue Preiswerte zu speichern.</div>}
              {!state.loading && state.loadedAt && offers.length === 0 && <div style={{ fontSize: "11px", color: "#aaa", padding: "8px 0" }}>Keine genauen aktuellen Angebote gefunden. Die breite Suche kann trotzdem Treffer haben.</div>}
              {!state.loading && state.hiddenCount > 0 && <div style={{ fontSize: "10px", color: "#999", margin: "0 0 7px", background: "#f6f5f1", borderRadius: "8px", padding: "6px 8px" }}>{state.hiddenCount} unscharfe Treffer ausgeblendet</div>}

              {offers.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {offers.slice(0, 3).map(offer => <Card key={offer.id} o={offer} sm showRetailer added={added} addItem={addItem} myLoyalty={cfg.myLoyalty} />)}
                  {offers.length > 3 && <button type="button" onClick={() => onGoSearch(staple.term)} style={{ padding: "8px", borderRadius: "9px", border: "1.5px solid #e5e5e0", background: "#f6f5f1", color: "#777", fontSize: "11px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Alle {offers.length} Treffer in Suche ansehen</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
