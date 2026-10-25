export const REFERENCES=['TabPFN CV-F0','TabPFN CV-F2','TabPFN CV-F2 + C0','TabPFN CV-F2 + C1'];
export const NAMES={'TabPFN CV-F0':'TabPFN CV-F0 · 位置','TabPFN CV-F2':'TabPFN CV-F2 · Base','TabPFN CV-F2 + C0':'TabPFN CV-F2 + C0','TabPFN CV-F2 + C1':'TabPFN CV-F2 + C1'};
export const ORDER=[...REFERENCES,'Chronos-Bolt-small','Chronos-2','Moirai-1.1-R-small'];
export function metricRows(data,filters,compact=false){
 return data.summary.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v)&&(!compact||REFERENCES.includes(r.model_id))).sort((a,b)=>ORDER.indexOf(a.model_id)-ORDER.indexOf(b.model_id));
}
export function correctionEvidence(rows){
 const base=rows.find(r=>r.model_id===REFERENCES[1]),c0=rows.find(r=>r.model_id===REFERENCES[2]),c1=rows.find(r=>r.model_id===REFERENCES[3]);
 if(!base||!c0||!c1)return null;
 return {n:c1.n,storms:c1.storms,base:base.coverage,c1:c1.coverage,gapReduction:base.absolute_gap_pp-c1.absolute_gap_pp,
  issuedAreaRatio:c1.mean_area_km2/base.mean_area_km2,matchedAreaRatio:c1.matched_area_ratio_vs_f2,feedbackGapReduction:c0.absolute_gap_pp-c1.absolute_gap_pp};
}
export function primaryEvidence(data,filters){return filters.phase==='test'&&filters.lead_h===24&&filters.shape==='ellipse'&&filters.level===90&&filters.calibrator==='Causal rolling'&&filters.regime==='all'?data.primary_comparisons:[];}
