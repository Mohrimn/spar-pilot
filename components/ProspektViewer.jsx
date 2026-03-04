import { useState, useEffect, useRef, useCallback } from "react";
import { getRetColor } from "../lib/constants.js";
import { fmtDate, disc, uPrice } from "../lib/utils.js";
import { leafletPageUrl, fetchLeafletDetail, fetchLeafletPageOffers } from "../lib/api.js";
import { ArrowLIc, ArrowRIc, XIc, PlusIc, CheckIc } from "./Icons.jsx";

export function ProspektViewer({ prospektOpen, onClose, onSwitchFlight, cfg, added, addItem }) {
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const [pageOffers, setPageOffers] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [manualAddText, setManualAddText] = useState("");
  const [manualAddPrice, setManualAddPrice] = useState("");
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [jumpMode, setJumpMode] = useState(false);
  const [jumpVal, setJumpVal] = useState("");
  const [thumbsOpen, setThumbsOpen] = useState(false);
  const pageRef = useRef(page);
  pageRef.current = page;
  const imageAreaRef = useRef(null);
  const touchRef = useRef(null);
  const activeThumbRef = useRef(null);

  const goPageStable = useCallback((idx) => {
    if (!prospektOpen || idx < 0 || idx >= prospektOpen.pageCount) return;
    setPage(idx);
    setSelectedOffer(null);
    setImgLoaded(false);
  }, [prospektOpen]);

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goPageStable(pageRef.current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goPageStable(pageRef.current + 1); }
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPageStable, onClose]);

  // Touch swipe navigation
  useEffect(() => {
    const el = imageAreaRef.current;
    if (!el) return;
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    };
    const onTouchEnd = (e) => {
      if (!touchRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchRef.current.x;
      const dy = touch.clientY - touchRef.current.y;
      const dt = Date.now() - touchRef.current.t;
      touchRef.current = null;
      if (dt > 500 || Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) goPageStable(pageRef.current + 1);
      else goPageStable(pageRef.current - 1);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchend", onTouchEnd); };
  }, [goPageStable]);

  // Auto-scroll thumbnail strip to active page
  useEffect(() => {
    if (thumbsOpen && activeThumbRef.current) activeThumbRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [page, thumbsOpen]);

  // Called when opening — loads detail + first page
  const initLoad = async (info) => {
    setPage(0);
    setDetail(null);
    setPageOffers({});
    setSelectedOffer(null);
    setManualAddText("");setManualAddPrice("");setManualAddOpen(false);
    setImgLoaded(false);
    if(info.offerCount>0){
      setDetailLoading(true);
      try{
        const d=await fetchLeafletDetail(info.leafletId,cfg.zip);
        setDetail(d);
        setPageLoading(true);
        try{
          const offers=await fetchLeafletPageOffers(info.leafletId,0);
          setPageOffers({0:offers});
        }catch(e){console.error("[SP] page offers err:",e);}
        finally{setPageLoading(false);}
      }catch(e){console.error("[SP] leaflet detail err:",e);}
      finally{setDetailLoading(false);}
    }
  };

  // Expose initLoad to parent via ref-like pattern — but simpler: parent calls open, we detect change
  // Actually, we use a key-based remount from parent, so useState defaults are fine.
  // But we still need initLoad on mount:
  useState(() => { initLoad(prospektOpen); });

  // Load offers when page changes
  useEffect(() => {
    if (!prospektOpen || prospektOpen.offerCount <= 0 || pageOffers[page]) return;
    let cancelled = false;
    setPageLoading(true);
    fetchLeafletPageOffers(prospektOpen.leafletId, page)
      .then(offers => { if (!cancelled) setPageOffers(p => ({ ...p, [page]: offers })); })
      .catch(e => console.error("[SP] page offers err:", e))
      .finally(() => { if (!cancelled) setPageLoading(false); });
    return () => { cancelled = true; };
  }, [page, prospektOpen]);

  const goPage = (idx) => goPageStable(idx);

  const addManualItem = () => {
    const name=manualAddText.trim();
    if(!name||!prospektOpen)return;
    const price=parseFloat(manualAddPrice)||0;
    const syntheticOffer={
      id:`manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      productName:name,
      brandName:null,
      retailerName:prospektOpen.name,
      retailerSlug:prospektOpen.slug,
      price,oldPrice:null,referencePrice:null,referencePriceLabel:null,
      volume:null,unitShort:null,unitName:null,
      requiresLoyalty:false,
      validityDates:prospektOpen.flight.validFrom?[{from:prospektOpen.flight.validFrom,to:prospektOpen.flight.validTo}]:[],
      description:"",categoryNames:[],derivedCategory:"Sonstiges",industryIds:[],
    };
    addItem(syntheticOffer);
    setManualAddText("");setManualAddPrice("");setManualAddOpen(false);
  };

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,background:"#f5f4f0",display:"flex",flexDirection:"column",maxWidth:"480px",margin:"0 auto"}}>
      {/* Header */}
      <div style={{background:"#1a1a1a",color:"#f5f4f0",flexShrink:0}}>
        <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",padding:"2px",display:"flex"}}><ArrowLIc/></button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:"14px",fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{prospektOpen.name}</div>
            <div style={{fontSize:"10px",color:"#888",fontFamily:"'JetBrains Mono',monospace"}}>
              Seite {page+1}/{prospektOpen.pageCount}
              {prospektOpen.flight.validFrom&&` · ${fmtDate(prospektOpen.flight.validFrom)}–${fmtDate(prospektOpen.flight.validTo)}`}
            </div>
          </div>
          {prospektOpen.pageCount>1&&<button type="button" onClick={()=>setThumbsOpen(v=>!v)} style={{background:thumbsOpen?"#fff":"none",border:"none",color:thumbsOpen?"#1a1a1a":"#888",cursor:"pointer",padding:"4px 8px",borderRadius:"5px",fontSize:"10px",fontWeight:700,fontFamily:"inherit",flexShrink:0}}>Vorschau</button>}
          {prospektOpen.offerCount>0&&<span style={{fontSize:"9px",padding:"3px 7px",borderRadius:"5px",background:"#10b98130",color:"#10b981",fontWeight:700,flexShrink:0}}>{prospektOpen.offerCount} Artikel</span>}
        </div>
        {prospektOpen.allFlights?.length>1&&<div style={{display:"flex",gap:"6px",padding:"0 12px 8px",overflowX:"auto",scrollbarWidth:"none"}}>
          {prospektOpen.allFlights.map((f,i)=>{
            const isActive=f.id===prospektOpen.flight.id;
            const now=new Date();
            const isCurrent=new Date(f.validFrom)<=now&&now<=new Date(f.validTo);
            return<button key={f.id||i} onClick={()=>{if(!isActive&&onSwitchFlight)onSwitchFlight(f);}} style={{padding:"3px 10px",borderRadius:"12px",fontSize:"10px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",border:isActive?"1.5px solid #10b981":"1.5px solid #444",background:isActive?"#10b98125":"transparent",color:isActive?"#10b981":"#888",cursor:isActive?"default":"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {fmtDate(f.validFrom)}–{fmtDate(f.validTo)}{isCurrent?" ●":""}
            </button>;
          })}
        </div>}
      </div>

      {/* Page image with hotspots */}
      <div ref={imageAreaRef} style={{flex:1,overflow:"auto",position:"relative",WebkitOverflowScrolling:"touch"}}>
        <div style={{position:"relative",width:"100%",minHeight:"300px"}}>
          {!imgLoaded&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:"26px",height:"26px",border:"3px solid #eee",borderTopColor:"#1a1a1a",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>}
          <img
            src={leafletPageUrl(prospektOpen.leafletId,page)}
            alt={`Seite ${page+1}`}
            style={{width:"100%",display:"block",opacity:imgLoaded?1:0,transition:"opacity 0.2s"}}
            onLoad={()=>setImgLoaded(true)}
            loading="lazy"
          />
          {/* Clickable offer hotspots */}
          {imgLoaded&&prospektOpen.offerCount>0&&detail?.children&&detail.children
            .filter(c=>c.pageIndex===page&&c.coordinates)
            .map((c,i)=>{
              const co=c.coordinates;
              const left=co.fromX*100,top=co.fromY*100,w=(co.tox-co.fromX)*100,h=(co.toy-co.fromY)*100;
              const offerId=c.id?.replace("offers/","");
              const curPageOffers=pageOffers[page]||[];
              const match=curPageOffers.find(o=>String(o.id)===offerId);
              return<div key={c.id||i}
                onClick={()=>{if(match)setSelectedOffer(match);}}
                style={{position:"absolute",left:`${left}%`,top:`${top}%`,width:`${w}%`,height:`${h}%`,cursor:match?"pointer":"default",border:"1.5px solid rgba(16,185,129,0.35)",borderRadius:"4px",transition:"all 0.15s",background:"rgba(16,185,129,0.04)"}}
                onPointerDown={e=>{if(match){e.currentTarget.style.background="rgba(16,185,129,0.18)";e.currentTarget.style.borderColor="#10b981";}}}
                onPointerUp={e=>{e.currentTarget.style.background="rgba(16,185,129,0.04)";e.currentTarget.style.borderColor="rgba(16,185,129,0.35)";}}
                onPointerLeave={e=>{e.currentTarget.style.background="rgba(16,185,129,0.04)";e.currentTarget.style.borderColor="rgba(16,185,129,0.35)";}}
              >
                {match&&<div style={{position:"absolute",top:"-1px",right:"-1px",width:"14px",height:"14px",background:"#10b981",borderRadius:"0 3px 0 5px",display:"flex",alignItems:"center",justifyContent:"center"}}><PlusIc/></div>}
              </div>;
            })}
          {pageLoading&&imgLoaded&&<div style={{position:"absolute",top:"8px",right:"8px",background:"#1a1a1acc",borderRadius:"6px",padding:"4px 8px",display:"flex",alignItems:"center",gap:"4px"}}>
            <div style={{width:"12px",height:"12px",border:"2px solid #555",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
            <span style={{fontSize:"9px",color:"#fff",fontWeight:600}}>Lade Angebote…</span>
          </div>}
        </div>
      </div>

      {/* Thumbnail strip */}
      {thumbsOpen&&prospektOpen.pageCount>1&&<div style={{display:"flex",gap:"4px",overflowX:"auto",overflowY:"hidden",padding:"6px 10px",background:"#1a1a1a",flexShrink:0,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
        {Array.from({length:prospektOpen.pageCount},(_,i)=><button key={i} ref={i===page?activeThumbRef:null} type="button" onClick={()=>goPage(i)} style={{flexShrink:0,width:"52px",height:"72px",padding:0,border:i===page?"2px solid #10b981":"2px solid transparent",borderRadius:"4px",overflow:"hidden",cursor:"pointer",background:"#333",position:"relative"}}>
          <img src={leafletPageUrl(prospektOpen.leafletId,i)} alt={`S.${i+1}`} loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.55)",fontSize:"8px",fontWeight:700,color:"#fff",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",padding:"1px 0"}}>{i+1}</div>
        </button>)}
      </div>}

      {/* Page navigation */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#fff",borderTop:"1px solid #eee",flexShrink:0}}>
        <button onClick={()=>goPage(page-1)} disabled={page<=0} style={{background:"none",border:"1px solid #ddd",borderRadius:"8px",padding:"6px 10px",cursor:page>0?"pointer":"default",opacity:page>0?1:0.3,display:"flex",alignItems:"center",fontFamily:"inherit"}}><ArrowLIc/></button>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          {jumpMode?<form onSubmit={e=>{e.preventDefault();const n=parseInt(jumpVal,10);if(!isNaN(n)&&n>=1&&n<=prospektOpen.pageCount)goPage(n-1);setJumpMode(false);setJumpVal("");}} style={{display:"flex",alignItems:"center",gap:"4px"}}>
            <input autoFocus type="number" min={1} max={prospektOpen.pageCount} value={jumpVal} onChange={e=>setJumpVal(e.target.value)} onBlur={()=>{setJumpMode(false);setJumpVal("");}} style={{width:"52px",padding:"4px 6px",borderRadius:"6px",border:"2px solid #1a1a1a",fontSize:"13px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,textAlign:"center",outline:"none"}}/>
            <span style={{fontSize:"13px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#aaa"}}>/ {prospektOpen.pageCount}</span>
          </form>:<button type="button" onClick={()=>{setJumpMode(true);setJumpVal(String(page+1));}} style={{fontSize:"13px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:"none",border:"1px solid #ddd",borderRadius:"6px",padding:"4px 10px",cursor:"pointer"}}>
            {page+1} / {prospektOpen.pageCount}
          </button>}
        </div>
        <button onClick={()=>goPage(page+1)} disabled={page>=prospektOpen.pageCount-1} style={{background:"none",border:"1px solid #ddd",borderRadius:"8px",padding:"6px 10px",cursor:page<prospektOpen.pageCount-1?"pointer":"default",opacity:page<prospektOpen.pageCount-1?1:0.3,display:"flex",alignItems:"center",fontFamily:"inherit"}}><ArrowRIc/></button>
      </div>

      {/* Manual add button */}
      {!manualAddOpen&&!selectedOffer&&<button onClick={()=>setManualAddOpen(true)} style={{position:"absolute",bottom:"70px",right:"16px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:"24px",padding:"10px 16px",fontSize:"12px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"5px",boxShadow:"0 4px 12px rgba(0,0,0,0.25)",zIndex:205}}><PlusIc/> Artikel hinzufügen</button>}

      {/* Manual add input sheet */}
      {manualAddOpen&&<div style={{position:"absolute",bottom:"62px",left:0,right:0,background:"#fff",borderTop:"1px solid #eee",padding:"12px 16px",boxShadow:"0 -4px 12px rgba(0,0,0,0.1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
          <span style={{fontSize:"12px",fontWeight:700}}>Artikel hinzufügen</span>
          <button onClick={()=>setManualAddOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#999"}}><XIc/></button>
        </div>
        <input value={manualAddText} onChange={e=>setManualAddText(e.target.value)} placeholder="Produktname" style={{width:"100%",padding:"8px 10px",borderRadius:"8px",border:"2px solid #e5e5e0",fontSize:"14px",fontFamily:"inherit",marginBottom:"6px",outline:"none",boxSizing:"border-box"}} autoFocus/>
        <div style={{display:"flex",gap:"6px"}}>
          <input value={manualAddPrice} onChange={e=>setManualAddPrice(e.target.value.replace(/[^0-9.,]/g,""))} placeholder="Preis (optional)" style={{flex:1,padding:"8px 10px",borderRadius:"8px",border:"2px solid #e5e5e0",fontSize:"14px",fontFamily:"'JetBrains Mono',monospace",outline:"none"}}/>
          <button onClick={addManualItem} disabled={!manualAddText.trim()} style={{padding:"8px 16px",borderRadius:"8px",background:manualAddText.trim()?"#1a1a1a":"#ddd",color:"#fff",border:"none",fontSize:"12px",fontWeight:700,cursor:manualAddText.trim()?"pointer":"default",fontFamily:"inherit"}}>Hinzufügen</button>
        </div>
      </div>}

      {/* Offer detail bottom sheet */}
      {selectedOffer&&<div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:210}}>
        <div onClick={()=>setSelectedOffer(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)"}}/>
        <div style={{position:"relative",background:"#fff",borderRadius:"16px 16px 0 0",padding:"16px",boxShadow:"0 -4px 20px rgba(0,0,0,0.15)",maxHeight:"60vh",overflow:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"10px",fontWeight:800,color:getRetColor(selectedOffer.retailerSlug,selectedOffer.retailerName),textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:"2px"}}>{selectedOffer.retailerName}</div>
              <div style={{fontSize:"16px",fontWeight:700,lineHeight:1.3}}>{selectedOffer.productName}</div>
              {selectedOffer.brandName&&<div style={{fontSize:"12px",color:"#999",marginTop:"2px"}}>{selectedOffer.brandName}</div>}
            </div>
            <button onClick={()=>setSelectedOffer(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#999",padding:"2px",flexShrink:0}}><XIc/></button>
          </div>
          {selectedOffer.description&&selectedOffer.description!=="Details im Prospekt"&&<div style={{fontSize:"11px",color:"#a08200",background:"#fffbeb",padding:"6px 8px",borderRadius:"6px",marginBottom:"10px",lineHeight:1.3}}>{selectedOffer.description}</div>}
          <div style={{display:"flex",alignItems:"baseline",gap:"6px",marginBottom:"4px"}}>
            {selectedOffer.oldPrice&&<span style={{fontSize:"14px",color:"#ccc",textDecoration:"line-through"}}>{selectedOffer.oldPrice.toFixed(2)}€</span>}
            <span style={{fontSize:"24px",fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>{selectedOffer.price.toFixed(2)}</span>
            <span style={{fontSize:"14px",color:"#999"}}>€</span>
            {disc(selectedOffer)>0&&<span style={{fontSize:"11px",fontWeight:800,color:"#ef4444",background:"#fef2f2",padding:"2px 6px",borderRadius:"4px"}}>−{disc(selectedOffer)}%</span>}
          </div>
          {uPrice(selectedOffer)&&<div style={{fontSize:"11px",color:"#059669",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginBottom:"10px"}}>{uPrice(selectedOffer).toFixed(2)}€/{selectedOffer.unitShort||"kg"}</div>}
          {selectedOffer.volume!=null&&selectedOffer.unitShort&&<div style={{fontSize:"11px",color:"#999",marginBottom:"10px"}}>{selectedOffer.volume} {selectedOffer.unitShort}</div>}
          <button onClick={()=>{addItem(selectedOffer);setSelectedOffer(null);}} disabled={added.has(selectedOffer.id)} style={{width:"100%",padding:"12px",borderRadius:"10px",background:added.has(selectedOffer.id)?"#e8e8e3":"#1a1a1a",color:added.has(selectedOffer.id)?"#aaa":"#fff",border:"none",fontSize:"14px",fontWeight:700,cursor:added.has(selectedOffer.id)?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
            {added.has(selectedOffer.id)?<><CheckIc/> Bereits auf der Liste</>:<><PlusIc/> Auf die Liste</>}
          </button>
        </div>
      </div>}
    </div>
  );
}
