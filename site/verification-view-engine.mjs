import {OWN,pairedScore,modelScores} from './algorithm-engine.mjs?v=verify2';
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const stamp=t=>new Date(t).toISOString();
const key=r=>[r.storm_id,stamp(r.issue_time_utc),r.lead_h,stamp(r.valid_time_utc)].join('|');
export function historicalRows(data,hours){
 if(data?.scope!=='RETROSPECTIVE_HINDCAST_NOT_PROSPECTIVE'||data.protocol_id!=='direct_vector_feedback_v1')throw Error('Unverified hindcast source');
 const rows=data.rows.filter(r=>r.lead_h===hours),seen=new Set();
 for(const r of rows){const id=r.model_id+'|'+key(r);if(seen.has(id)||!Number.isFinite(r.error_km)||r.error_km<0)throw Error('Duplicate or invalid historical sample');seen.add(id);}
 return rows;
}
export function historicalScores(data,models,hours,level){
 const rows=historicalRows(data,hours);
 return models.map(model_id=>{const z=rows.filter(r=>r.model_id===model_id),regions=z.map(r=>r.regions?.[level]).filter(Boolean);
  return {model_id,n:z.length,mae:mean(z.map(r=>r.error_km)),regionN:regions.length,coverage:mean(regions.map(r=>+r.covered)),area:mean(regions.map(r=>r.area_km2))};});
}
export function historicalPair(data,method,other,hours){
 const rows=historicalRows(data,hours),b=new Map(rows.filter(r=>r.model_id===other).map(r=>[key(r),r])),pairs=rows.filter(r=>r.model_id===method&&b.has(key(r))).map(r=>[r,b.get(key(r))]);
 for(const [a,b] of pairs)if(Math.abs(a.truth_lat_deg-b.truth_lat_deg)>1e-6||Math.abs(a.truth_lon_deg-b.truth_lon_deg)>1e-6)throw Error('Paired historical truth differs');
 return {n:pairs.length,own:mean(pairs.map(([a])=>a.error_km)),other:mean(pairs.map(([,b])=>b.error_km)),wins:pairs.filter(([a,b])=>a.error_km<b.error_km).length};
}
export function evaluationMode(requested,ledger,hours,now=Date.now()){
 if(requested==='prospective'||requested==='hindcast')return requested;
 return pairedScore(ledger,OWN[1],OWN[0],hours,90,now).n?'prospective':'hindcast';
}
