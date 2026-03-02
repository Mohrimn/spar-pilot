export const chipRowStyle={
  display:"flex",
  gap:"5px",
  overflowX:"auto",
  overflowY:"hidden",
  padding:"2px 2px 8px",
  margin:"0 -2px",
  WebkitOverflowScrolling:"touch",
  touchAction:"pan-x",
  overscrollBehaviorX:"contain",
  overscrollBehaviorY:"none",
  scrollPaddingLeft:"2px",
  scrollPaddingRight:"2px",
  scrollbarWidth:"none",
  msOverflowStyle:"none",
};

export function ErrBox({msg,onRetry}) {
  return (
    <div style={{margin:"10px 18px",padding:"12px 14px",background:"#fef2f2",borderRadius:"10px",border:"1px solid #fecaca"}}>
      <div style={{fontSize:"13px",color:"#dc2626",marginBottom:onRetry?"8px":0,lineHeight:1.4}}>{msg}</div>
      {onRetry&&<button onClick={onRetry} style={{fontSize:"12px",fontWeight:700,color:"#dc2626",background:"#fff",border:"1px solid #fecaca",borderRadius:"6px",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>Erneut versuchen</button>}
    </div>
  );
}

export function Spinner({text}) {
  return (
    <div style={{textAlign:"center",padding:"48px 0",color:"#bbb"}}>
      <div style={{width:"26px",height:"26px",border:"3px solid #eee",borderTopColor:"#1a1a1a",borderRadius:"50%",margin:"0 auto 10px",animation:"spin 0.7s linear infinite"}}/>
      <div style={{fontSize:"13px"}}>{text}</div>
    </div>
  );
}

export function Tog({label,desc,val,set}) {
  return<div style={{marginBottom:"16px"}}><label style={{fontSize:"10px",fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"4px"}}>{label}</label><button onClick={set} style={{width:"100%",padding:"10px 12px",borderRadius:"9px",border:"2px solid #e5e5e0",background:"#fff",fontSize:"12px",fontFamily:"inherit",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontWeight:500}}>{desc}</span><div style={{width:"38px",height:"20px",borderRadius:"10px",background:val?"#10b981":"#ddd",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{width:"16px",height:"16px",borderRadius:"8px",background:"#fff",position:"absolute",top:"2px",left:val?"20px":"2px",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/></div></button></div>;
}
