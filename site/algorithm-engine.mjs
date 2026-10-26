import {distance,sphereExp,RADIUS_KM} from './engine.mjs';
export const OWN=['TabPFN CV-F2','TabPFN CV-F2 + C0','TabPFN CV-F2 + C1'];
export const PUBLIC_OWN=[OWN[0],OWN[2]];
export const LABELS={'TabPFN CV-F2':'TabPFN baseline','TabPFN CV-F2 + C0':'Correction-only ablation','TabPFN CV-F2 + C1':'Vector residual feedback','Chronos-Bolt-small':'Chronos-Bolt-small','Chronos-2':'Chronos-2','Moirai-1.1-R-small':'Moirai-1.1-R-small'};
export const point=(p,h)=>p?.points.find(q=>q.lead_h===h);
export const sameTime=(a,b)=>Number.isFinite(Date.parse(a))&&Date.parse(a)===Date.parse(b);
export function comparators(data,issue,mode='matched'){
 const paths=[...(data.agency_forecasts?.paths??[]),...data.model.paths.filter(p=>p.model_raw_aid||p.model_family==='tsfm')];
 const selected=mode==='matched'?paths.filter(p=>sameTime(p.issue_time_utc,issue)):paths;
 const out=new Map();for(const p of selected){const old=out.get(p.model_id);if(!old||Date.parse(p.issue_time_utc)>Date.parse(old.issue_time_utc))out.set(p.model_id,p);}return [...out.values()];
}
export function boundary(q,level){const r=q?.[`radius_${level}_km`];return Number.isFinite(r)&&r>=0?Array.from({length:97},(_,i)=>sphereExp([q.lat_deg,q.lon_deg],r*Math.cos(i*Math.PI/48),r*Math.sin(i*Math.PI/48))):[];}
export function area(radius){return Number.isFinite(radius)&&radius>=0?4*Math.PI*RADIUS_KM**2*Math.sin(Math.min(Math.PI,radius/RADIUS_KM)/2)**2:null;}
export function forecastRegions(paths,hours,level,mode='both'){
 return paths.filter(p=>PUBLIC_OWN.includes(p.model_id)&&(mode==='both'||mode===p.model_id)).flatMap(p=>{
  const q=point(p,hours),points=boundary(q,level);return points.length?[{model_id:p.model_id,point:q,points,area:area(q[`radius_${level}_km`])}]:[];
 });
}
// Keep the earliest eligible published version for each model/issue/lead. Later
// revisions stay in the downloadable ledger but cannot replace its first score.
export function verified(ledger,hours,now=Date.now()){
 const records=new Map();for(const r of ledger?.records??[]){if(r.lead_h!==hours||!r.eligible||!r.confirmed_at_utc||Date.parse(r.confirmed_at_utc)>=Date.parse(r.valid_time_utc)||Date.parse(r.valid_time_utc)>now)continue;
  const key=[r.storm_id,r.model_id,r.issue_time_utc,r.lead_h,r.valid_time_utc].join('|'),old=records.get(key);
  if(!old||Date.parse(r.recorded_at_utc)<Date.parse(old.recorded_at_utc))records.set(key,r);
 }
 return [...records.values()].flatMap(r=>{const t=ledger.truths?.[new Date(r.valid_time_utc).toISOString().replace('.000Z','+00:00')]??ledger.truths?.[r.valid_time_utc];if(!t||Date.parse(t.first_seen_at_utc)>now||Date.parse(t.first_seen_at_utc)<Date.parse(r.valid_time_utc))return [];
  return [{...r,truth:t,error:distance([r.lat_deg,r.lon_deg],[t.lat_deg,t.lon_deg])}];});
}
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
export function modelScores(ledger,models,hours,level,now=Date.now()){
 const values=verified(ledger,hours,now);
 return models.map(model_id=>{const rows=values.filter(r=>r.model_id===model_id),regions=rows.filter(r=>Number.isFinite(r[`radius_${level}_km`]));return {model_id,n:rows.length,mae:mean(rows.map(r=>r.error)),regionN:regions.length,coverage:mean(regions.map(r=>+(r.error<=r[`radius_${level}_km`]))),area:mean(regions.map(r=>area(r[`radius_${level}_km`])))};});
}
export function pairedScore(ledger,method,other,hours,level,now=Date.now()){
 const values=verified(ledger,hours,now),key=r=>[r.storm_id,r.issue_time_utc,r.lead_h,r.valid_time_utc].join('|'),b=new Map(values.filter(r=>r.model_id===other).map(r=>[key(r),r]));
 const pairs=values.filter(r=>r.model_id===method&&b.has(key(r))).map(r=>[r,b.get(key(r))]);
 const regions=pairs.map(([a])=>a).filter(a=>Number.isFinite(a[`radius_${level}_km`]));
 return {n:pairs.length,own:mean(pairs.map(([a])=>a.error)),other:mean(pairs.map(([,b])=>b.error)),
  wins:pairs.filter(([a,b])=>a.error<b.error).length,regionN:regions.length,
  coverage:mean(regions.map(a=>+(a.error<=a[`radius_${level}_km`]))),area:mean(regions.map(a=>area(a[`radius_${level}_km`])))};
}

export function verificationState(ledger,model,hours,now=Date.now()){
 const rows=(ledger?.records??[]).filter(r=>r.model_id===model&&r.lead_h===hours),first=new Map();
 for(const r of rows){const key=[r.storm_id,r.issue_time_utc,r.lead_h,r.valid_time_utc].join('|'),old=first.get(key);if(!old||Date.parse(r.recorded_at_utc)<Date.parse(old.recorded_at_utc))first.set(key,r);}
 const eligible=[...first.values()].filter(r=>r.eligible&&Date.parse(r.confirmed_at_utc)<Date.parse(r.valid_time_utc));
 const scored=verified(ledger,hours,now).filter(r=>r.model_id===model),waiting=eligible.filter(r=>Date.parse(r.valid_time_utc)>now);
 return {registered:first.size,eligible:eligible.length,scored:scored.length,awaitingTarget:waiting.length,
   awaitingTruth:eligible.filter(r=>Date.parse(r.valid_time_utc)<=now).length-scored.length,
   nextValid:waiting.length?new Date(Math.min(...waiting.map(r=>Date.parse(r.valid_time_utc)))).toISOString():null};
}
export function defaultVerificationLead(ledger,model,now=Date.now()){
 return [24,12,6,48,72].find(h=>verified(ledger,h,now).some(r=>r.model_id===model))??24;
}
