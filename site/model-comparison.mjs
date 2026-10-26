import {comparisonEvidence} from './model-comparison-engine.mjs?v=direct1';
import {NAMES,REFERENCES} from './conformal-evidence-engine.mjs?v=direct1';
const $=s=>document.querySelector(s),fmt=(x,n=1)=>Number.isFinite(x)?x.toFixed(n):'—';
let sets;
function render(){
 const phase=$('#comparison-cohort').value,h=+$('#comparison-lead').value,key=$('#comparison-input').value,D=sets[key],e=comparisonEvidence(D,phase,h),name=m=>NAMES[m]??m,max=Math.max(...e.rows.map(r=>r.mae_km));
 $('#comparison-scope').textContent=`${phase==='test'?'2024 historical common cohort':'CHAMPI locked historical snapshot'} · ${e.n} endpoints / ${e.storms} storms · +${h}h · 90% endpoint ellipses · causal rolling calibration · ${key==='core'?'direct TabPFN + vector residual feedback; direct ENU TSFM inputs':key==='shared'?'archived CV-assisted models':'archived CV-assisted TabPFN, direct ENU time-series models'}. These are completed retrospective experiments, separate from the public live ledger and the four selected storm illustrations.`;
 $('#comparison-bars').innerHTML=e.rows.map(r=>`<div class="model-error-row ${r.model_id===e.feedback.model_id?'feedback-row':''}"><span>${name(r.model_id)}</span><div><i style="width:${(r.mae_km/max*100).toFixed(3)}%"></i></div><b>${fmt(r.mae_km)} km</b></div>`).join('');
 const areaMax=Math.max(...e.rows.map(r=>r.matched_area_ratio_vs_f2));
 $('#comparison-area-bars').innerHTML=e.rows.map(r=>`<div class="model-error-row ${r.model_id===e.feedback.model_id?'feedback-row':''}"><span>${name(r.model_id)}</span><div><i style="width:${(r.matched_area_ratio_vs_f2/areaMax*100).toFixed(3)}%"></i></div><b>${fmt(r.matched_area_ratio_vs_f2,3)}×</b></div>`).join('');
 $('#comparison-table').innerHTML=e.rows.map(r=>`<tr class="${r.model_id===e.feedback.model_id?'feedback-row':''}"><td>${name(r.model_id)}</td><td>${r.n} / ${r.storms}</td><td>${fmt(r.mae_km)}</td><td>${fmt(r.coverage*100)}% / 90%</td><td>${fmt(r.mean_area_km2,0)}</td><td>${fmt(r.matched_area_ratio_vs_f2,3)}×</td></tr>`).join('');
 $('#comparison-finding').textContent=`Residual feedback has lower endpoint MAE than ${e.pointWins}/${e.tsfm.length} tested time-series models and a smaller coverage-matched area than ${e.areaWins}/${e.tsfm.length}. Against TabPFN baseline, its mean error is ${fmt(e.feedback.mae_km)} vs ${fmt(e.base.mae_km)} km; its original issued area ratio is ${fmt(e.feedback.mean_area_km2/e.base.mean_area_km2,3)}×. Lower matched area is a retrospective diagnostic, not a smaller issued forecast in every case.`;
 $('#comparison-source').href='assets/'+(key==='core'?'direct-vector-feedback.json':key==='shared'?'tsfm-cv-sensitivity.json':'tsfm-conformal.json');
}
async function init(){const names=['tsfm-cv-sensitivity.json','tsfm-conformal.json','direct-vector-feedback.json'],[shared,direct,core]=await Promise.all(names.map(async n=>{const r=await fetch('assets/'+n);if(!r.ok)throw Error(n+' '+r.status);return r.json();}));sets={shared,direct,core};render();for(const id of ['comparison-cohort','comparison-lead','comparison-input'])$('#'+id).addEventListener('change',render);}
init().catch(e=>$('#comparison-scope').textContent='Model evidence unavailable: '+e.message);
