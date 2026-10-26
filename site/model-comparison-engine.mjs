import {metricRows,REFERENCES,referencesFor} from './conformal-evidence-engine.mjs?v=direct1';
export const COMPARISON_MODELS=[REFERENCES[1],REFERENCES[3],'Chronos-Bolt-small','Chronos-2','Moirai-1.1-R-small'];
export function comparisonEvidence(data,phase='test',lead_h=24){
 const refs=referencesFor(data),models=[refs.base,refs.feedback,...COMPARISON_MODELS.slice(2)];
 const rows=metricRows(data,{phase,lead_h,level:90,shape:'ellipse',calibrator:'Causal rolling',regime:'all'}).filter(r=>models.includes(r.model_id));
 if(rows.length!==COMPARISON_MODELS.length||!rows.every(r=>r.n===rows[0].n&&r.storms===rows[0].storms))throw Error('Model comparison requires a complete common cohort');
 const base=rows.find(r=>r.model_id===refs.base),feedback=rows.find(r=>r.model_id===refs.feedback),tsfm=rows.filter(r=>!Object.values(refs).includes(r.model_id));
 const interval=data.primary_comparisons?.find(r=>r.base===refs.base&&r.candidate===refs.feedback);
 return {rows,base,feedback,tsfm,n:base.n,storms:base.storms,pointWins:tsfm.filter(r=>feedback.mae_km<r.mae_km).length,areaWins:tsfm.filter(r=>feedback.matched_area_ratio_vs_f2<r.matched_area_ratio_vs_f2).length,
  assessment:{maeDeltaKm:feedback.mae_km-base.mae_km,coverageGapDeltaPp:feedback.absolute_gap_pp-base.absolute_gap_pp,
   issuedAreaRatio:feedback.mean_area_km2/base.mean_area_km2,matchedAreaRatio:feedback.matched_area_ratio_vs_f2,
   matchedAreaCI:phase==='test'&&lead_h===24?interval?.ratio_ci95??null:null}};
}
