export const BASE='tabpfn',FEEDBACK='rolling_c1';
export function selectedEvidence(selection,endpoint,atlas){
 const ids=new Set(selection.cases.map(c=>c.storm_id)),storms=atlas.storms.filter(s=>ids.has(s.id));
 if(storms.length!==ids.size||storms.length!==4)throw Error('Selected storm cohort mismatch');
 const origins=storms.flatMap(s=>s.origins),n=origins.length,mean=m=>origins.reduce((v,o)=>v+o.errors[m][3],0)/n;
 if(n!==selection.summary.n_origins||n!==endpoint.n||endpoint.hours!==24||endpoint.dimension!==2)throw Error('Selected endpoint scope mismatch');
 const base=mean(BASE),feedback=mean(FEEDBACK);
 if(Math.abs(base-selection.summary.base_mae_km)>1e-6||Math.abs(feedback-selection.summary.c1_mae_km)>1e-6)throw Error('Selected scores differ from frozen evidence');
 const cases=selection.cases.map(c=>{const s=storms.find(s=>s.id===c.storm_id),origin=s.origins[c.origin_index];if(!origin||origin.issue!==c.issue)throw Error('Selected origin mismatch');return {...c,origin,storm:s,base:s.origins.reduce((v,o)=>v+o.errors[BASE][3],0)/s.origins.length,feedback:s.origins.reduce((v,o)=>v+o.errors[FEEDBACK][3],0)/s.origins.length};});
 const areas=['rolling_ellipse','spci'].map(family=>{const a=endpoint.rows.find(r=>r.family===family&&r.arm===BASE),b=endpoint.rows.find(r=>r.family===family&&r.arm===FEEDBACK);
  if(!a||!b||a.n!==n||b.n!==n||a.matched_coverage!==b.matched_coverage)throw Error('Area comparison is not coverage-matched');
  const ratio=b.matched_geometric_mean_area_km2/a.matched_geometric_mean_area_km2;
  if(Math.abs(ratio-b.matched_area_ratio_vs_same_family_base)>1e-10)throw Error('Area ratio mismatch');
  return {family,n,base:a,feedback:b,ratio,reduction:100*(1-ratio)};
 });
 return {n,storms:storms.length,hours:24,base,feedback,reduction:100*(1-feedback/base),cases,areas,
  predictionProtocol:'rolling_repair_v2',regionProtocol:'endpoint24_2d_v1',spciGeometry:'2D coordinate rectangles',
  scope:'Archived outcome-selected illustrations; separate from direct_vector_feedback_v1 and the live rank circles'};
}
