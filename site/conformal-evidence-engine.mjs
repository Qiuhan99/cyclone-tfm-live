export const REFERENCES=['TabPFN CV-F0','TabPFN CV-F2','TabPFN CV-F2 + C0','TabPFN CV-F2 + C1'];
export {METHOD_LABELS as NAMES} from './method-labels.mjs?v=direct1';
export const ORDER=['TabPFN Direct-F0','TabPFN Direct-F2','TabPFN Direct-F2 + RF',...REFERENCES,'Chronos-Bolt-small','Chronos-2','Moirai-1.1-R-small'];
export function referencesFor(data){return data.protocol.references??{position:REFERENCES[0],base:REFERENCES[1],ablation:REFERENCES[2],feedback:REFERENCES[3]};}
export function metricRows(data,filters,compact=false){
 const refs=Object.values(referencesFor(data));return data.summary.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v)&&(!compact||refs.includes(r.model_id))).sort((a,b)=>ORDER.indexOf(a.model_id)-ORDER.indexOf(b.model_id));
}
export function correctionEvidence(rows){
 const direct=rows.some(r=>r.model_id==='TabPFN Direct-F2'),base=rows.find(r=>r.model_id===(direct?'TabPFN Direct-F2':REFERENCES[1])),c0=rows.find(r=>r.model_id===REFERENCES[2]),c1=rows.find(r=>r.model_id===(direct?'TabPFN Direct-F2 + RF':REFERENCES[3]));
 if(!base||!c1)return null;
 return {n:c1.n,storms:c1.storms,base:base.coverage,c1:c1.coverage,baseHits:Math.round(base.coverage*base.n),feedbackHits:Math.round(c1.coverage*c1.n),baseGap:base.absolute_gap_pp,feedbackGap:c1.absolute_gap_pp,baseArea:base.mean_area_km2,feedbackArea:c1.mean_area_km2,matchedAttained:c1.matched_attained,baseMatchedAttained:base.matched_attained,gapReduction:base.absolute_gap_pp-c1.absolute_gap_pp,
  baseShortfall:Math.max(0,base.level-base.coverage*100),c1Shortfall:Math.max(0,c1.level-c1.coverage*100),
  issuedAreaRatio:c1.mean_area_km2/base.mean_area_km2,matchedAreaRatio:c1.matched_area_ratio_vs_f2,feedbackGapReduction:c0?c0.absolute_gap_pp-c1.absolute_gap_pp:null};
}
export function primaryEvidence(data,filters){return filters.phase==='test'&&filters.lead_h===24&&filters.shape==='ellipse'&&filters.level===90&&filters.calibrator==='Causal rolling'&&filters.regime==='all'?data.primary_comparisons:[];}
