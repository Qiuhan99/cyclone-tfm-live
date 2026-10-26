export const hoursSince=(value,now=Date.now())=>value?(now-Date.parse(value))/3600000:Infinity;
export function operationalState(data,now=Date.now()){
  const c=data.official?.center,w=data.official?.warning;
  return {watcherStale:hoursSince(data.last_checked_at_utc,now)>data.refresh_interval_seconds*2/3600+1/60,
    centerStale:!c||hoursSince(c.valid_time_utc,now)>c.stale_after_hours,
    warningStale:!w||(w.status!=='cancelled'&&hoursSince(w.issued_at_utc,now)>w.stale_after_hours),
    forecastStale:hoursSince(data.model?.input_last_valid_utc,now)>9,
    failedSources:Object.entries(data.fetch_status??{}).filter(([,v])=>!v.ok).map(([k])=>k)};
}
export const futurePoints=(path,now=Date.now())=>path.points.filter(p=>Date.parse(p.valid_time_utc)>now).sort((a,b)=>Date.parse(a.valid_time_utc)-Date.parse(b.valid_time_utc));
export const futureCrossings=(path,now=Date.now())=>(path.landfall_candidates??[]).filter(p=>Date.parse(p.valid_time_utc)>now);
export function matchingRows(rows,phase,lead){return rows.filter(r=>r.phase===phase&&r.lead_h===lead);}
export function groupedCoverage(rows,phase,method,calibrator,alpha=.1){
  const z=rows.filter(r=>r.phase===phase&&r.model_id===method&&r.calibrator===calibrator&&Math.abs(r.alpha-alpha)<1e-8);
  const n=z.reduce((s,r)=>s+r.n,0),covered=z.reduce((s,r)=>s+r.covered,0);
  return {n,covered,coverage:n?covered/n:null};
}
