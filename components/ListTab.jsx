import { getRetColor, isLightColor } from "../lib/constants.js";
import { catLabel } from "../lib/offers.js";
import { isStarted, getRelevantValidity, fmtDate } from "../lib/utils.js";
import { CheckIc, TrashIc } from "./Icons.jsx";

export function ListTab({ list, onRemove, onToggleCheck, onUpdateQty, onClearChecked }) {
  const grpList = () => {
    const g = {}; for (const i of list) { const r = i.offer.retailerName; if (!g[r]) g[r] = {}; const c = catLabel(i.offer); if (!g[r][c]) g[r][c] = []; g[r][c].push(i); }
    return g;
  };
  const tot = list.reduce((s, i) => s + i.offer.price * i.qty, 0);
  const ckN = list.filter(i => i.ck).length;

  return (
    <div style={{ padding: "12px 18px" }}>
      {list.length === 0 ? <div style={{ textAlign: "center", padding: "52px 0", color: "#bbb" }}><div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div><div style={{ fontSize: "13px", fontWeight: 500 }}>Einkaufsliste ist leer</div></div> : <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", background: "#1a1a1a", borderRadius: "11px", color: "#fff", marginBottom: "12px" }}>
          <div><div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gesamt</div><div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{tot.toFixed(2)}€</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: "10px", color: "#cccbcb" }}>{list.length} Artikel · {Object.keys(grpList()).length} Läden</div>{ckN > 0 && <button onClick={onClearChecked} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: 700, cursor: "pointer", marginTop: "3px", fontFamily: "inherit" }}>{ckN} erledigt ✕</button>}</div>
        </div>
        {Object.entries(grpList()).map(([ret, cats]) => { const rc = getRetColor("", ret); const lt = isLightColor(rc); const rT = Object.values(cats).flat().reduce((s, i) => s + i.offer.price * i.qty, 0); return <div key={ret} style={{ marginBottom: "12px", animation: "fadeIn 0.25s ease" }}>
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
