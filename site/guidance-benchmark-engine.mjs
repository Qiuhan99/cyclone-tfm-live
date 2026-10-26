import {distance,sphereExp} from './engine.mjs';
import {METHOD_LABELS} from './method-labels.mjs?v=names1';
export const GUIDANCE_LEADS=[6,12,24,48,72];
export const GUIDANCE_MODELS=[
 {id:'TabPFN CV-F2',label:METHOD_LABELS['TabPFN CV-F2'],kind:'Base predictor'},
 {id:'TabPFN CV-F2 + C1',label:METHOD_LABELS['TabPFN CV-F2 + C1'],kind:'Mature vector residuals'},
 {id:'ATCF:CMC',label:'ATCF:CMC',kind:'Archived track guidance'},
 {id:'ATCF:UKM',label:'ATCF:UKM',kind:'Archived track guidance'},
 {id:'ATCF:NGX',label:'ATCF:NGX',kind:'Archived track guidance'},
];
export function guidanceEvidence(data,lead=24){
 if(!GUIDANCE_LEADS.includes(lead)||data.config?.protocol!=='motion_residual_v1')throw Error('Unsupported guidance benchmark protocol or lead');
 const rows=GUIDANCE_MODELS.map(model=>{
  const found=(data.external_common??[]).filter(r=>r.model_id===model.id&&r.lead_h===lead);
  if(found.length!==1)throw Error('Incomplete or duplicate archived guidance comparison');
  const row=found[0];
  if(!Number.isInteger(row.n)||row.n<1||!Number.isFinite(row.mean_error_km)||row.mean_error_km<0)throw Error('Invalid archived guidance score');
  return {...model,n:row.n,mae:row.mean_error_km};
 });
 if(!rows.every(r=>r.n===rows[0].n))throw Error('Guidance rows must use the archived common cohort');
 return {rows,n:rows[0].n,lead};
}
export const GUIDANCE_COLORS=['#ba792f','#008b7e','#4774b9','#8b65b3','#c74e7f'];
export function guidanceCycles(bundle,lead){
 if(bundle.version!=='guidance_paths_v1'||bundle.scope!=='LOCKED_RETROSPECTIVE_COMMON_COHORT_NOT_LIVE')throw Error('Unverified map export');
 const c=bundle.cohorts[String(lead)];
 if(!c||c.issues.length!==c.n||new Set(c.issues).size!==c.n)throw Error('Invalid map cohort');
 return c.issues.map(t=>{const matches=bundle.cycles.filter(o=>o.issue_time_utc===t);if(matches.length!==1)throw Error('Ambiguous map cycle');return matches[0];});
}
export function guidanceCase(bundle,summary,lead,issue){
 const cohort=guidanceCycles(bundle,lead),expected=guidanceEvidence(summary,lead);
 if(cohort.length!==expected.n)throw Error('Map and aggregate cohorts differ');
 const cycle=cohort.find(c=>c.issue_time_utc===issue);if(!cycle)throw Error('Cycle is outside the scored intersection');
 const valid=Date.parse(issue)+lead*3600000,truth=cycle.truth.find(p=>Date.parse(p.valid_time_utc)===valid);
 if(!truth)throw Error('Missing archived endpoint truth');
 const rows=GUIDANCE_MODELS.map((m,i)=>{
  const matches=cycle.paths.filter(p=>p.model_id===m.id);if(matches.length!==1)throw Error('Missing or duplicate map method');
  const path=matches[0],points=path.points.filter(p=>p.lead_h<=lead).sort((a,b)=>a.lead_h-b.lead_h),end=points.filter(p=>p.lead_h===lead);
  if(end.length!==1||new Set(points.map(p=>p.lead_h)).size!==points.length||points.some(p=>Date.parse(p.valid_time_utc)!==Date.parse(issue)+p.lead_h*3600000||!Number.isFinite(p.lat_deg)||!Number.isFinite(p.lon_deg)))throw Error('Invalid map path time or coordinate');
  const endpoint=end[0];return {...m,color:GUIDANCE_COLORS[i],points,endpoint,error:distance([endpoint.lat_deg,endpoint.lon_deg],[truth.lat_deg,truth.lon_deg])};
 });
 return {cycle,rows,truth,lead,valid,shift:distance([rows[0].endpoint.lat_deg,rows[0].endpoint.lon_deg],[rows[1].endpoint.lat_deg,rows[1].endpoint.lon_deg])};
}
export function guidanceRegion(point,n=96){
 if(!Number.isFinite(point.radius_90_km)||point.radius_90_km<0)return [];
 return Array.from({length:n+1},(_,i)=>sphereExp([point.lat_deg,point.lon_deg],point.radius_90_km*Math.cos(i*2*Math.PI/n),point.radius_90_km*Math.sin(i*2*Math.PI/n)));
}
