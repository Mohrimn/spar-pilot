import { getRetColor, isMyLoyalty, isLightColor } from "../lib/constants.js";
import { fmtDate, dLeft, disc, uPrice, getRelevantValidity } from "../lib/utils.js";
import { highlightTitle } from "../lib/offers.js";
import { StarIc, PlusIc, CheckIc } from "./Icons.jsx";

export function Card({o, sm, showRetailer=false, highlightQuery="", added, addItem}) {
  const d=disc(o),up=uPrice(o),on=added.has(o.id),rc=getRetColor(o.retailerSlug,o.retailerName);
  const now = new Date();
  const validity = getRelevantValidity(o.validityDates, now);
  const startsAt = validity?.from ? new Date(validity.from) : null;
  const startsLater = startsAt && startsAt > now;
  const dl=validity?.to?dLeft(validity.to):null;
  const myL=isMyLoyalty(o.retailerSlug,o.retailerName);
  const hl = highlightTitle(o.productName, highlightQuery);
  const titleContent = hl.hasHighlight
    ? <>{hl.parts.map((p,i)=>i%2===1?<span key={i} style={{background:"#fef08a",borderRadius:"2px"}}>{p}</span>:p)}</>
    : o.productName;
  return(
    <div style={{background:"#fff",borderRadius:sm?"10px":"13px",padding:sm?"10px 12px":"13px 14px",border:"1px solid #ebebeb",display:"flex",gap:"10px",alignItems:"flex-start",position:"relative",overflow:"hidden"}}>
      {d>0&&<div style={{position:"absolute",top:0,left:0,background:"#ef4444",color:"#fff",fontSize:"10px",fontWeight:800,padding:"2px 8px 2px 5px",borderRadius:"0 0 8px 0"}}>−{d}%</div>}
      <div style={{flex:1,minWidth:0,paddingTop:d>0?"12px":0}}>
        <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"2px",flexWrap:"wrap"}}>
          {(!sm||showRetailer)&&<span style={{fontSize:"10px",fontWeight:800,color:rc,textTransform:"uppercase",letterSpacing:"0.4px"}}>{o.retailerName}</span>}
          {o.requiresLoyalty&&<span style={{fontSize:"8px",padding:"1px 5px",borderRadius:"3px",background:myL?"#fef3c7":"#fee2e2",color:myL?"#92400e":"#dc2626",fontWeight:700,display:"inline-flex",alignItems:"center",gap:"2px"}}><StarIc/>{myL?"Karte ✓":"Karte nötig"}</span>}
          {startsLater&&<span style={{fontSize:"8px",padding:"1px 5px",borderRadius:"3px",background:"#eff6ff",color:"#1d4ed8",fontWeight:700}}>Startet am {fmtDate(validity.from)}</span>}
          {!startsLater&&dl!==null&&dl<=2&&<span style={{fontSize:"8px",padding:"1px 5px",borderRadius:"3px",background:"#fef2f2",color:"#dc2626",fontWeight:700}}>{dl<=0?"Letzter Tag!":"Noch "+dl+"T"}</span>}
        </div>
        <div style={{fontSize:sm?"13px":"14px",fontWeight:600,lineHeight:1.25,marginBottom:"2px"}}>{titleContent}</div>
        <div style={{fontSize:"11px",color:"#999",display:"flex",gap:"4px",flexWrap:"wrap"}}>
          {o.brandName&&<span>{o.brandName}</span>}
          {o.volume!=null&&o.unitShort&&<span>{o.brandName?"· ":""}{o.volume}{o.unitShort}</span>}
          {validity?.to&&<span>· bis {fmtDate(validity.to)}</span>}
        </div>
        {o.description&&!sm&&o.description!=="Details im Prospekt"&&<div style={{fontSize:"10px",color:"#a08200",marginTop:"4px",background:"#fffbeb",padding:"3px 6px",borderRadius:"4px",lineHeight:1.2}}>{o.description.slice(0,120)}{o.description.length>120?"…":""}</div>}
      </div>
      <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"5px",paddingTop:d>0?"12px":0}}>
        <div>
          <div style={{display:"flex",alignItems:"baseline",gap:"3px",justifyContent:"flex-end"}}>
            {o.oldPrice&&<span style={{fontSize:"11px",color:"#ccc",textDecoration:"line-through"}}>{o.oldPrice.toFixed(2)}</span>}
            <span style={{fontSize:sm?"17px":"19px",fontWeight:800,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{o.price.toFixed(2)}</span>
            <span style={{fontSize:"10px",color:"#999"}}>€</span>
          </div>
          {up!==null&&<div style={{fontSize:"10px",color:"#059669",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{up.toFixed(2)}€/{o.unitShort||"kg"}</div>}
        </div>
        <button onClick={()=>addItem(o)} disabled={on} style={{padding:"5px 10px",borderRadius:"7px",border:"none",background:on?"#e8e8e3":"#1a1a1a",color:on?"#aaa":"#fff",fontSize:"11px",fontWeight:700,cursor:on?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px"}}>
          {on?<><CheckIc/> Drin</>:<><PlusIc/> Liste</>}
        </button>
      </div>
    </div>
  );
}
