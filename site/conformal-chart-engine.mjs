// Display transforms only. No scientific values are moved, jittered or rescaled.
const PALETTE={position:'#e1ae78',base:'#8daebf',feedback:'#79dec4',ablation:'#d4c784',bolt:'#e69ab2',chronos:'#92bdf1',moirai:'#c3a0eb'};
export function modelColor(id,refs){
 if(id===refs.position)return PALETTE.position;
 if(id===refs.base)return PALETTE.base;
 if(id===refs.feedback)return PALETTE.feedback;
 if(id===refs.ablation)return PALETTE.ablation;
 return {'Chronos-Bolt-small':PALETTE.bolt,'Chronos-2':PALETTE.chronos,'Moirai-1.1-R-small':PALETTE.moirai}[id]??'#c3cbd1';
}
export function frontierLayout(rows,level,refs,mode='detail'){
 const valid=rows.filter(r=>Number.isFinite(r.coverage)&&r.mean_area_km2>0);
 const visible=mode==='pair'?valid.filter(r=>[refs.base,refs.feedback].includes(r.model_id)):valid;
 if(!visible.length)return null;
 const values=visible.map(r=>r.coverage*100),low=Math.min(level,...values),high=Math.max(level,...values);
 const pad=Math.max(.6,(high-low)*.18),xDomain=mode==='full'?[0,100]:[Math.max(0,Math.floor(low-pad)),Math.min(100,Math.ceil(high+pad))];
 const logs=visible.map(r=>Math.log10(r.mean_area_km2)),lo=Math.min(...logs),hi=Math.max(...logs),yp=Math.max(.012,(hi-lo)*.18);
 const yDomain=mode==='full'?[Math.floor(lo),Math.max(Math.floor(lo)+1,Math.ceil(hi))]:[lo-yp,hi+yp];
 const x=v=>80+(v-xDomain[0])/(xDomain[1]-xDomain[0])*570;
 const y=v=>275-(Math.log10(v)-yDomain[0])/(yDomain[1]-yDomain[0])*235;
 return {rows:visible,xDomain,yDomain,x,y,zoomed:mode!=='full'};
}
export function coverageCurves(data,phase,selected,refs){
 const ids=new Set([refs.base,selected]);
 return data.coverage_curves.filter(r=>r.phase===phase&&ids.has(r.model_id));
}
