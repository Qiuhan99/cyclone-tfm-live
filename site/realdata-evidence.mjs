import './release-watch.mjs?v=verify6';
import {datasetEvidence,reduction,gainClass} from './realdata-evidence-engine.mjs?v=verify6';
const $=s=>document.querySelector(s),fmt=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'—';
let evidence;
function cards(r){
 const items=[['MAE reduction',r.mae_reduction_pct,`${fmt(r.base.mae)} → ${fmt(r.feedback.mae)} · raw dataset units`],['RMSE reduction',r.rmse_reduction_pct,`${fmt(r.base.rmse)} → ${fmt(r.feedback.rmse)}`]];
 return items.map(([title,v,note])=>`<article class="${gainClass(v)}"><span>${title}</span><strong>${fmt(Math.abs(v),1)}% <small>${v>=0?'lower':'higher'}</small></strong><p>${note}</p></article>`).join('')+`<article><span>Complete evaluation window</span><strong>${r.origins} <small>hours</small></strong><p>${r.channels} channels · ${r.scalar_forecasts.toLocaleString('en-US')} scalar forecasts</p></article><article><span>Paired MAE change</span><strong class="interval">${fmt(r.mae_change_ci95[0])} to ${fmt(r.mae_change_ci95[1])}</strong><p>Exploratory 95% interval · 24-hour moving blocks</p></article>`;
}
function highlight(){
 const node=$('#realdata-highlight');if(!node)return;const r=datasetEvidence(evidence);
 node.innerHTML=`<span class="chapter-label">EARLIER REAL-DATA STUDY / ELECTRICITY</span><div class="realdata-highlight-number">${fmt(r.mae_reduction_pct,1)}%<small>lower mean absolute error</small></div><p class="realdata-highlight-values">${fmt(r.base.mae)} → ${fmt(r.feedback.mae)} · ${r.origins} hours × ${r.channels} channels</p><p class="margin-note">Independently replayed from saved predictions. The earlier online C1 workflow uses newer observations between scheduled Base updates. Its feature inputs differ from the cyclone implementation.</p><a class="chapter-source" href="results.html#realdata-lab">Inspect the complete window, ETTh1 and transfer validation ↗</a>`;
}
function render(){
 const r=datasetEvidence(evidence,$('#realdata-dataset').value);
 $('#realdata-metrics').innerHTML=cards(r);
 $('#realdata-scope').textContent=`${r.label} · ${r.base_mode} · ${r.evaluation_start} to ${r.evaluation_end} · original evaluation window. Base and feedback losses independently reproduce the saved results.`;
 draw(r);$('#realdata-chart-note').textContent=`All ${r.origins} hourly targets; each point averages absolute errors across all ${r.channels} channels. ${r.mae_win_origins}/${r.origins} hours favour feedback. Dataset units are not comparable across datasets. The vertical extent follows the selected dataset and is labelled explicitly.`;
}
function draw(r){
 const W=1000,H=330,L=74,R=24,T=24,B=62,points=r.per_origin,maximum=Math.max(...points.flatMap(p=>[p.base_mae,p.feedback_mae]))*1.08;
 const P=(i,v)=>[L+i/(points.length-1)*(W-L-R),H-B-v/maximum*(H-T-B)];
 const path=key=>points.map((p,i)=>`${i?'L':'M'}${P(i,p[key]).map(v=>v.toFixed(2)).join(',')}`).join(' ');
 let svg='<title>Paired hourly absolute errors across the complete evaluation window</title><rect width="1000" height="330" fill="#102b38"/>';
 for(let i=0;i<=4;i++){const v=maximum*i/4,y=P(0,v)[1];svg+=`<path d="M${L},${y}H${W-R}" stroke="#41606c" opacity=".5"/><text x="${L-12}" y="${y+4}" text-anchor="end" fill="#a8c0c7" font-size="11">${fmt(v,v<10?2:0)}</text>`;}
 for(const [key,color,dash] of [['base_mae','#d7b18b','6 4'],['feedback_mae','#74dac1','']])svg+=`<path d="${path(key)}" stroke="${color}" stroke-width="2" fill="none" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 const first=points[0].time,last=points.at(-1).time;
 svg+=`<text x="${L}" y="${H-25}" fill="#a8c0c7" font-size="11">${first} · first evaluated target</text><text x="${W-R}" y="${H-25}" text-anchor="end" fill="#a8c0c7" font-size="11">${last}</text><text x="${L}" y="15" fill="#a8c0c7" font-size="11">Mean absolute error · raw dataset units</text>`;
 $('#realdata-chart').innerHTML=svg;
}
async function start(){
 if(!$('#realdata-lab')&&!$('#realdata-highlight'))return;
 const response=await fetch('assets/realdata-feedback-evidence.json');if(!response.ok)throw Error('Evidence source '+response.status);evidence=await response.json();highlight();
 if($('#realdata-lab')){
  render();$('#realdata-dataset').addEventListener('change',render);
  try{
   const r=await fetch('assets/feedback-validation.json');if(!r.ok)throw Error('Validation record '+r.status);const validation=await r.json();
   $('#feedback-validation').innerHTML='<table><thead><tr><th>Validation candidate</th><th>Origins</th><th>Base / feedback MAE · km</th><th>Adoption gate</th></tr></thead><tbody>'+validation.candidates.map(c=>`<tr><td>${c.label}</td><td>${c.n}</td><td>${fmt(c.base_mae_km)} / ${fmt(c.feedback_mae_km)}</td><td>${c.passed?'Passed validation; test evaluation required':'Not passed · not adopted'}</td></tr>`).join('')+'</tbody></table>';
  }catch(error){$('#feedback-validation').textContent='Validation record unavailable: '+error.message;}
 }
}
start().catch(error=>{const n=$('#realdata-scope')??$('#realdata-highlight');if(n)n.textContent='Evidence could not be loaded: '+error.message;});
