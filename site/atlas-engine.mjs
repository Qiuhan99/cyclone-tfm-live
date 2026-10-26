import {sphereExp,distance,rad,wrap} from './engine.mjs';
export const METHODS=['tabpfn','rolling_c0','rolling_c1'];
export function tangentLog(anchor,target){const p=rad(anchor[0]),q=rad(target[0]),dl=rad(wrap(target[1]-anchor[1])),bearing=Math.atan2(Math.sin(dl)*Math.cos(q),Math.cos(p)*Math.sin(q)-Math.sin(p)*Math.cos(q)*Math.cos(dl)),r=distance(anchor,target);return [r*Math.sin(bearing),r*Math.cos(bearing)];}
export function issuedBoundary(origin,method,hours,level=90,n=96){
 const r=origin.regions?.[method]?.[hours/6],q=r?.q?.[(1-level/100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')],cov=r?.covariances?.at(-1);
 if(!cov||!Number.isFinite(q))return [];
 const a=Math.sqrt(cov[0][0]),b=cov[1][0]/a,c=Math.sqrt(Math.max(0,cov[1][1]-b*b)),offset=tangentLog(origin.anchor,origin.paths[method][hours/6-1]);
 return Array.from({length:n+1},(_,i)=>{const t=2*Math.PI*i/n;return sphereExp(origin.anchor,offset[0]+q*a*Math.cos(t),offset[1]+q*(b*Math.cos(t)+c*Math.sin(t)));});
}
export function currentMetrics(origin,hours,retro){if(!retro)return null;const i=hours/6-1,b=origin.errors.tabpfn[i],c0=origin.errors.rolling_c0[i],c=origin.errors.rolling_c1[i];return {base:b,c0,c1:c,delta:b-c,gain:100*(b-c)/Math.max(b,1e-12),feedbackDelta:c0-c};}
export function observations(storm,issue){return storm.track.filter(p=>Date.parse(p.time)<=Date.parse(issue)).map(p=>[p.lat,p.lon]);}
export function cohortRows(atlas,hours){return METHODS.map(method=>atlas.point_metrics.find(r=>r.method===method&&r.hours===hours));}
export function cohortSummary(atlas,hours){
 const rows=cohortRows(atlas,hours),regions=atlas.efficiency?.[hours/6]?.maxscore?.['0.1'];
 if(rows.some(r=>!r)||!regions)throw new RangeError('No archived cohort at this lead');
 const base=rows.find(r=>r.method==='tabpfn');
 return {hours,leads:Array.from({length:hours/6},(_,i)=>(i+1)*6),storms:atlas.cohort.storms,
  rows:rows.map(r=>{const c=regions.find(x=>x.method===r.method);if(!c||c.n!==r.n_origins)throw Error('Point and region cohorts differ');
   return {...r,coverage:c.coverage,covered:Math.round(c.coverage*c.n),delta_vs_base_km:r.mae_km-base.mae_km};})};
}
export function liveRows(data,method,now=Date.now()){return data.model.paths.filter(p=>method==='external'?!!p.model_raw_aid:p.model_id===method).map(p=>({...p,points:p.points.filter(q=>Date.parse(q.valid_time_utc)>now)}));}
