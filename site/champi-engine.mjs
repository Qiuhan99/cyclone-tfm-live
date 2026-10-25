import {wrap,distance} from './engine.mjs';
export const sameTime=(a,b)=>Date.parse(a)===Date.parse(b);
export function issuePaths(paths,issue){return paths.filter(p=>sameTime(p.issue_time_utc,issue));}
export const preferredAid=aid=>['CMC','UKM','NGX','AEMN'].includes(aid);
export function defaultIssue(data){
  for(let i=data.issues.length-1;i>=0;i--){const ps=issuePaths(data.paths,data.issues[i]);if(ps.some(p=>p.model_id==='TabPFN F2')&&new Set(ps.filter(p=>preferredAid(p.model_raw_aid)).map(p=>p.model_raw_aid)).size>=2)return i;}
  return data.issues.length-1;
}
export function truthAt(observations,time){return observations.find(p=>sameTime(p.valid_time_utc,time))??null;}
export function visibleObservations(observations,issue,hindsight=false){return observations.filter(p=>hindsight||Date.parse(p.valid_time_utc)<=Date.parse(issue));}
export function scorePoint(point,observations,hindsight){if(!hindsight)return null;const t=truthAt(observations,point.valid_time_utc);return t?distance([point.lat_deg,point.lon_deg],[t.lat_deg,t.lon_deg]):null;}
export function splitDateline(points){const segments=[];let part=[];for(const p of points){if(part.length&&Math.abs(p.lon_deg-part.at(-1).lon_deg)>180){segments.push(part);part=[];}part.push(p);}if(part.length)segments.push(part);return segments;}
export function normalizedPath(path,lead){const points=path.points.filter(p=>p.lead_h<=lead).sort((a,b)=>a.lead_h-b.lead_h);if(new Set(points.map(p=>p.lead_h)).size!==points.length)throw Error('ambiguous forecast lead');return points;}
