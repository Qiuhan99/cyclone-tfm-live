import {ellipse} from './engine.mjs';
export function shapeSummary(data,phase,level=90){return data.summary.filter(r=>r.phase===phase&&r.level===Number(level));}
export function shapeComparisons(data,phase){return data.comparisons.filter(r=>r.phase===phase);}
export function issuedShapes(data,issue,method,level=90){return data.regions.filter(r=>r.issue_time_utc===issue&&r.model_id===method&&r.level===Number(level));}
export function shapeBoundary(r){return r&&Number.isFinite(r.q)?ellipse([r.lat_deg,r.lon_deg],r.covariance_km2,r.q,144):[];}
export function shapeObservations(data,issue){return data.observations.filter(r=>Date.parse(r.valid_time_utc)<=Date.parse(issue));}
export function shapeTruth(data,valid,hindsight=false){return hindsight?data.observations.find(r=>Date.parse(r.valid_time_utc)===Date.parse(valid)):undefined;}
