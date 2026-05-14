import { useMemo, useState } from "react";
import { getRetColor, isLightColor } from "../lib/constants.js";
import { catLabel } from "../lib/offers.js";
import { isStarted, getRelevantValidity, fmtDate } from "../lib/utils.js";
import { CheckIc, TrashIc } from "./Icons.jsx";

function fmtDistance(meters) {
  if (typeof meters !== "number") return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function buildStorePlans(list, storeLocations) {
  const now = new Date();
  const stores = new Map();

  for (const item of list.filter(i => !i.ck)) {
    const offer = item.offer;
    const key = offer.retailerSlug || offer.retailerName;
    if (!stores.has(key)) {
      stores.set(key, {
        key,
        slug: offer.retailerSlug,
        name: offer.retailerName,
        items: [],
        itemCount: 0,
        total: 0,
        oldTotal: 0,
        savings: 0,
        startsLater: 0,
        expiresSoon: 0,
        location: storeLocations[offer.retailerSlug] || null,
      });
    }

    const store = stores.get(key);
    const qty = item.qty || 1;
    const total = offer.price * qty;
    const oldTotal = (offer.oldPrice && offer.oldPrice > offer.price ? offer.oldPrice : offer.price) * qty;
    const validity = getRelevantValidity(offer.validityDates, now);
    const started = isStarted(offer, now);
    const daysLeft = validity?.to ? Math.ceil((new Date(validity.to) - now) / 864e5) : null;

    store.items.push(item);
    store.itemCount += qty;
    store.total += total;
    store.oldTotal += oldTotal;
    store.savings += Math.max(0, oldTotal - total);
    if (!started) store.startsLater += 1;
    if (started && daysLeft !== null && daysLeft <= 2) store.expiresSoon += 1;
  }

  const route = [...stores.values()].sort((a, b) => {
    const ad = a.location?.distance;
    const bd = b.location?.distance;
    if (typeof ad === "number" && typeof bd === "number" && ad !== bd) return ad - bd;
    if (typeof ad === "number" && typeof bd !== "number") return -1;
    if (typeof ad !== "number" && typeof bd === "number") return 1;
    if (b.itemCount !== a.itemCount) return b.itemCount - a.itemCount;
    return b.savings - a.savings;
  });

  const valueRank = [...stores.values()].sort((a, b) => {
    if (b.itemCount !== a.itemCount) return b.itemCount - a.itemCount;
    if (b.savings !== a.savings) return b.savings - a.savings;
    return b.total - a.total;
  });

  return {
    route,
    bestStore: valueRank[0] || null,
    total: route.reduce((sum, store) => sum + store.total, 0),
    savings: route.reduce((sum, store) => sum + store.savings, 0),
    startsLater: route.reduce((sum, store) => sum + store.startsLater, 0),
    expiresSoon: route.reduce((sum, store) => sum + store.expiresSoon, 0),
    remainingCount: list.filter(i => !i.ck).length,
  };
}

function planHint(plan) {
  if (plan.route.length <= 1) return "Ein Stopp reicht fuer die offenen Artikel.";

  const extraStores = plan.route.slice(1);
  const extraSavings = extraStores.reduce((sum, store) => sum + store.savings, 0);
  const extraDistance = extraStores.reduce((sum, store) => sum + (store.location?.distance || 0), 0);
  const hasDistance = extraStores.some(store => typeof store.location?.distance === "number");

  if (hasDistance && extraSavings > 0) {
    const valuePerKm = extraSavings / Math.max(1, extraDistance / 1000);
    return valuePerKm >= 0.75
      ? `Split lohnt sich: ${extraSavings.toFixed(2)}€ Ersparnis fuer ca. ${(extraDistance / 1000).toFixed(1)} km Zusatzweg.`
      : `Split nur mitnehmen: ${extraSavings.toFixed(2)}€ Ersparnis bei ca. ${(extraDistance / 1000).toFixed(1)} km Zusatzweg.`;
  }

  if (extraSavings >= 3) return `Split wirkt lohnend: ${extraSavings.toFixed(2)}€ Ersparnis ausserhalb des ersten Ladens.`;
  return "Mehrere Laeden nur anfahren, wenn sie auf dem Weg liegen.";
}

function ShoppingPlan({ plan }) {
  if (plan.remainingCount === 0) {
    return (
      <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "13px", marginBottom: "12px", color: "#065f46" }}>
        <div style={{ fontSize: "13px", fontWeight: 800 }}>Einkaufsplan erledigt</div>
        <div style={{ fontSize: "11px", marginTop: "3px" }}>Alle Artikel sind abgehakt. Die Liste ist bereit zum Aufraeumen.</div>
      </div>
    );
  }

  const routeNames = plan.route.slice(0, 2).map(store => store.name).join(" + ");
  const moreStores = plan.route.length > 2 ? ` +${plan.route.length - 2}` : "";

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e5e0", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "9px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800 }}>Einkaufsplan</div>
          <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Beste Route: {routeNames}{moreStores}</div>
          <div style={{ fontSize: "11px", color: "#777", marginTop: "3px", lineHeight: 1.35 }}>{planHint(plan)}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "18px", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{plan.total.toFixed(2)}€</div>
          <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 800 }}>{plan.savings > 0 ? `${plan.savings.toFixed(2)}€ gespart` : "Preisplan"}</div>
        </div>
      </div>

      {(plan.startsLater > 0 || plan.expiresSoon > 0) && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          {plan.startsLater > 0 && <span style={{ fontSize: "10px", fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", padding: "4px 7px", borderRadius: "999px" }}>{plan.startsLater} noch nicht gueltig</span>}
          {plan.expiresSoon > 0 && <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "4px 7px", borderRadius: "999px" }}>{plan.expiresSoon} laeuft bald ab</span>}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {plan.route.map((store, index) => {
          const rc = getRetColor(store.slug, store.name);
          const lt = isLightColor(rc);
          const dist = fmtDistance(store.location?.distance);
          return (
            <div key={store.key} style={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr) auto", alignItems: "center", gap: "8px", padding: "8px 9px", borderRadius: "9px", background: "#f6f5f1", border: "1px solid #ece9e2" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: rc, color: lt ? "#1a1a1a" : "#fff", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace" }}>{index + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</div>
                <div style={{ fontSize: "10px", color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {store.itemCount} Artikel{dist ? ` · ${dist}` : ""}{store.location?.address ? ` · ${store.location.address}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{store.total.toFixed(2)}€</div>
                {store.savings > 0 && <div style={{ fontSize: "9px", color: "#10b981", fontWeight: 800 }}>−{store.savings.toFixed(2)}€</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ListTab({ list, storeLocations = {}, onRemove, onToggleCheck, onUpdateQty, onClearChecked }) {
  const [showPlan, setShowPlan] = useState(false);
  const groupedList = useMemo(() => {
    const grouped = {};
    for (const item of list) {
      const retailer = item.offer.retailerName;
      if (!grouped[retailer]) grouped[retailer] = {};
      const category = catLabel(item.offer);
      if (!grouped[retailer][category]) grouped[retailer][category] = [];
      grouped[retailer][category].push(item);
    }
    return grouped;
  }, [list]);
  const tot = useMemo(() => list.reduce((s, i) => s + i.offer.price * i.qty, 0), [list]);
  const ckN = useMemo(() => list.filter(i => i.ck).length, [list]);
  const plan = useMemo(() => buildStorePlans(list, storeLocations), [list, storeLocations]);

  return (
    <div style={{ padding: "12px 18px" }}>
      {list.length === 0 ? <div style={{ textAlign: "center", padding: "52px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div><div style={{ fontSize: "13px", fontWeight: 500 }}>Einkaufsliste ist leer</div></div> : <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", background: "#1a1a1a", borderRadius: "11px", color: "#fff", marginBottom: "12px" }}>
          <div><div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gesamt</div><div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{tot.toFixed(2)}€</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: "10px", color: "#cccbcb" }}>{list.length} Artikel · {Object.keys(groupedList).length} Läden</div>{ckN > 0 && <button onClick={onClearChecked} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: 700, cursor: "pointer", marginTop: "3px", fontFamily: "inherit" }}>{ckN} erledigt ✕</button>}</div>
        </div>
        <button
          type="button"
          onClick={() => setShowPlan(p => !p)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "10px 12px", borderRadius: "11px", border: "1.5px solid #e5e5e0", background: "#fff", color: "#1a1a1a", marginBottom: showPlan ? "8px" : "12px", cursor: "pointer", fontFamily: "inherit" }}
        >
          <span style={{ fontSize: "12px", fontWeight: 800 }}>{showPlan ? "Einkaufsplan ausblenden" : "Einkaufsplan anzeigen"}</span>
          <span style={{ fontSize: "10px", color: "#999", fontFamily: "'JetBrains Mono',monospace" }}>{plan.remainingCount} offen · {plan.route.length} Läden</span>
        </button>
        {showPlan && <ShoppingPlan plan={plan} />}
        {Object.entries(groupedList).map(([ret, cats]) => { const rc = getRetColor("", ret); const lt = isLightColor(rc); const rT = Object.values(cats).flat().reduce((s, i) => s + i.offer.price * i.qty, 0); return <div key={ret} style={{ marginBottom: "12px", animation: "fadeIn 0.25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 11px", borderRadius: "9px 9px 2px 2px", background: rc, color: lt ? "#1a1a1a" : "#fff" }}><span style={{ fontSize: "12px", fontWeight: 800 }}>{ret}</span><span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{rT.toFixed(2)}€</span></div>
          {Object.entries(cats).map(([cat, items]) => <div key={cat}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#bbb", padding: "6px 11px 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{cat}</div>
            {items.map(item => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 11px", background: "#fff", borderBottom: "1px solid #f0efeb", opacity: item.ck ? 0.4 : 1, transition: "opacity 0.15s" }}>
              <button onClick={() => onToggleCheck(item.id)} style={{ width: "21px", height: "21px", borderRadius: "5px", flexShrink: 0, border: item.ck ? "none" : "2px solid #ddd", background: item.ck ? "#10b981" : "#fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.ck && <CheckIc />}</button>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: "12px", fontWeight: 500, textDecoration: item.ck ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.offer.productName}</div><div style={{ fontSize: "10px", color: "#aaa" }}>{item.offer.brandName && <>{item.offer.brandName} · </>}{(item.offer.price * item.qty).toFixed(2)}€{item.qty > 1 && ` (${item.qty}×${item.offer.price.toFixed(2)})`}</div>{!isStarted(item.offer) && (() => { const v = getRelevantValidity(item.offer.validityDates); return v ? <div style={{ fontSize: "9px", fontWeight: 700, color: "#d97706", background: "#fffbeb", padding: "1px 6px", borderRadius: "4px", marginTop: "2px", display: "inline-block" }}>ab {fmtDate(v.from)}</div> : null; })()}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                <button onClick={() => onUpdateQty(item.id, -1)} style={{ width: "24px", height: "24px", borderRadius: "6px", border: "1.5px solid #e0e0db", background: "#fff", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>−</button>
                <span style={{ fontSize: "12px", fontWeight: 700, width: "16px", textAlign: "center", fontFamily: "'JetBrains Mono',monospace" }}>{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, 1)} style={{ width: "24px", height: "24px", borderRadius: "6px", border: "1.5px solid #e0e0db", background: "#fff", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>+</button>
              </div>
              <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", padding: "2px" }}><TrashIc /></button>
            </div>)}
          </div>)}
        </div> })}
      </>}
    </div>
  );
}
