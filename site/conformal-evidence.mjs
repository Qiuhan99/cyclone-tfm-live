import './release-watch.mjs?v=verify5';
import {NAMES,referencesFor,metricRows,correctionEvidence,primaryEvidence} from './conformal-evidence-engine.mjs?v=verify5';
import {modelColor,frontierLayout,coverageCurves} from './conformal-chart-engine.mjs?v=verify5';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
let D;let refs;const SETS={};const full=$('#cp-evidence').dataset.cpView==='full';
const filters=()=>({phase:$('#cp-phase').value,lead_h:+$('#cp-lead').value,level:+$('#cp-level').value,shape:$('#cp-shape').value,calibrator:$('#cp-calibrator').value,regime:$('#cp-regime').value});
const name=m=>NAMES[m]??m;
function frontier(rows,f){
 const mode=$('#cp-frontier-mode').value||'detail',layout=frontierLayout(rows,f.level,refs,mode);
 if(!layout){$('#cp-frontier').innerHTML='';$('#cp-frontier-note').textContent='No scored regions for this selection.';return;}
 const {x:X,y:Y,xDomain,yDomain}=layout,visible=layout.rows;
 let svg='<rect width="700" height="480" fill="#102630"/><path d="M80,40V275H650" fill="none" stroke="#607d86"/>';
 for(let i=0;i<=4;i++){
  const c=xDomain[0]+(xDomain[1]-xDomain[0])*i/4,x=X(c),log=yDomain[0]+(yDomain[1]-yDomain[0])*i/4,area=10**log,y=Y(area);
  svg+=`<path d="M${x},40V275M80,${y}H650" stroke="#53717a" opacity=".25"/><text x="${x}" y="298" text-anchor="middle" fill="#aec7cf" font-size="12">${fmt(c,xDomain[1]-xDomain[0]>20?0:1)}%</text><text x="70" y="${y+4}" text-anchor="end" fill="#aec7cf" font-size="12">${fmt(area/1e3,0)}k</text>`;
 }
 svg+=`<path d="M${X(f.level)},40V275" stroke="#e9dcb7" stroke-dasharray="5 5"/><text x="${X(f.level)}" y="29" text-anchor="middle" fill="#dfd4b4" font-size="12">Target ${f.level}%</text>`;
 const base=visible.find(r=>r.model_id===refs.base),rf=visible.find(r=>r.model_id===refs.feedback);
 if(base&&rf)svg+=`<path d="M${X(base.coverage*100)},${Y(base.mean_area_km2)}L${X(rf.coverage*100)},${Y(rf.mean_area_km2)}" fill="none" stroke="#79dec4" opacity=".6" stroke-width="2"/>`;
 for(const [i,r] of visible.entries()){
  const x=X(r.coverage*100),y=Y(r.mean_area_km2),color=modelColor(r.model_id,refs),primary=r.model_id===refs.feedback;
  svg+=`<circle data-model="${esc(r.model_id)}" cx="${x}" cy="${y}" r="${primary?7:5}" fill="${color}" stroke="#102630" stroke-width="2"><title>${esc(name(r.model_id))} · ${Math.round(r.coverage*r.n)}/${r.n} covered (${fmt(r.coverage*100,2)}%) · issued mean ${fmt(r.mean_area_km2,0)} km²</title></circle>`;
  const lx=24+(i%2)*342,ly=354+Math.floor(i/2)*31;
  svg+=`<circle cx="${lx}" cy="${ly-4}" r="4" fill="${color}"/><text x="${lx+12}" y="${ly}" fill="${color}" font-size="11">${esc(name(r.model_id))}</text><text x="${lx+12}" y="${ly+13}" fill="#a7bec2" font-size="10">${fmt(r.coverage*100,2)}% · ${fmt(r.mean_area_km2/1e3,1)}k km²</text>`;
 }
 svg+=`<text x="365" y="322" text-anchor="middle" fill="#c1d3d9" font-size="12">Empirical coverage · ${layout.zoomed?'zoomed axis':'full 0–100% axis'}</text><text x="15" y="18" fill="#c1d3d9" font-size="11">Mean issued area · km² (log scale)</text>`;
 $('#cp-frontier').innerHTML=svg;
 $('#cp-frontier-note').textContent=`${mode==='pair'?'Baseline and feedback detail.':'All scored methods.'} ${layout.zoomed?'Axes fit the displayed values; points retain their exact coordinates.':'Full coverage axis and decade area bounds.'} This chart shows issued areas, not retrospective coverage-matched areas. Coincident points represent similar measured results.`;
}
function curve(f){
 const control=$('#cp-curve-method'),selected=control.value,curves=coverageCurves(D,f.phase,selected,refs);
 const max=Math.max(1,...curves.flatMap(c=>c.points.map(p=>p.index))),X=i=>65+(i-1)/Math.max(1,max-1)*600,Y=c=>290-c*245;
 let svg='<rect width="700" height="390" fill="#102630"/><path d="M65,30V290H665" fill="none" stroke="#607d86"/>';
 for(const c of [0,.5,.9,1])svg+=`<path d="M65,${Y(c)}H665" stroke="${c===.9?'#dfd4b4':'#597983'}" opacity="${c===.9?1:.25}" stroke-dasharray="5 5"/><text x="55" y="${Y(c)+4}" fill="#9fb9c0" text-anchor="end" font-size="12">${c*100}%</text>`;
 for(const [i,c] of curves.entries()){
  const color=modelColor(c.model_id,refs),dashed=c.calibrator==='Frozen 2019',path=c.points.map((p,j)=>`${j?'L':'M'}${X(p.index).toFixed(2)},${Y(p.coverage).toFixed(2)}`).join(' ');
  svg+=`<path data-model="${esc(c.model_id)}" data-calibrator="${esc(c.calibrator)}" d="${path}" fill="none" stroke="${color}" stroke-width="${dashed?1.6:2.3}" ${dashed?'stroke-dasharray="6 5"':''}><title>${esc(name(c.model_id))} / ${esc(c.calibrator)}</title></path>`;
  svg+=`<text x="${70+(i%2)*300}" y="${336+Math.floor(i/2)*20}" fill="${color}" font-size="11">${dashed?'┄':'━'} ${esc(name(c.model_id))} / ${dashed?'Frozen 2019':'Causal rolling'}</text>`;
 }
 svg+=`<text x="65" y="314" fill="#a7bec2" font-size="12">1</text><text x="665" y="314" text-anchor="end" fill="#a7bec2" font-size="12">${max} mature endpoints →</text>`;
 $('#cp-curve').innerHTML=svg;
 $('#cp-curve-note').textContent=`${name(refs.base)} and ${name(selected)} · ${curves.length} curves · solid: causal rolling; dashed: frozen 2019. Window ≤20, ordered by valid time. This diagnostic is fixed at +24h / 90% / ellipse / all origins; only cohort and diagnostic-model controls apply.`;
}
function render(){
 if(!D)return;refs=referencesFor(D);const f=filters(),rows=metricRows(D,f,!full),e=correctionEvidence(rows),reference=full?$('#cp-ratio-reference').value:'f2';if(full)$('#cp-ratio-heading').textContent='Matched-area ratio / '+(reference==='f0'?'TabPFN position-only':'TabPFN baseline');
 $('#cp-status').textContent=rows.length?`${f.phase==='test'?'2024 historical cohort':'CHAMPI locked snapshot'} · +${f.lead_h}h endpoint · ${f.level}% marginal region · ${f.shape==='ellipse'?'ellipse':'circle'} · ${f.calibrator==='Causal rolling'?'causal rolling · mature labels only':'frozen 2019 geometry and threshold'} · ${rows[0].n} common endpoints / ${rows[0].storms} storms. Research protocol: ${D.protocol.preprocessing==='direct_enu_core'?'direct TabPFN → vector residual feedback; no CV offset':'archived CV-assisted TabPFN'}. TSFM: ${D.protocol.preprocessing==='shared_6h_CV_offset'?'shared 6h constant-velocity residual target':'direct ENU, original baseline'}. ${f.regime!=='all'?' Motion proxy stratum; not a confirmed concept-drift label.':''}`:'No common mature endpoint for this selection.';
 $('#cp-table').innerHTML=rows.length?rows.map(r=>`<tr class="${r.model_id===refs.feedback?'cp-primary':''}"><td>${esc(name(r.model_id))}</td><td>${r.n} / ${r.storms}</td><td>${fmt(r.coverage*100)}% / ${f.level}%</td><td>${fmt(Math.max(0,f.level-r.coverage*100),2)} / ${fmt(Math.max(0,r.coverage*100-f.level),2)}</td><td>${fmt(r.absolute_gap_pp,2)}</td><td>${fmt(r.mean_area_km2,0)}</td><td>${fmt(r[reference==='f0'?'matched_area_ratio_vs_f0':'matched_area_ratio_vs_f2'],3)}×</td></tr>`).join(''):'<tr><td colspan="7">No common mature endpoints</td></tr>';
 $('#cp-cards').innerHTML=e?[
  ['Baseline → feedback coverage',`${fmt(e.base*100)}% → ${fmt(e.c1*100)}%`,`${e.baseHits}/${e.n} → ${e.feedbackHits}/${e.n} covered. ${f.level}% nominal target.`],
  ['Absolute gap to target',`${fmt(e.baseGap,2)} → ${fmt(e.feedbackGap,2)} pp`,'Distance to the nominal target; read with coverage counts and sampling uncertainty.'],
  ['Feedback / baseline matched area',`${fmt(e.matchedAreaRatio,3)}×`,`${fmt(Math.abs(1-e.matchedAreaRatio)*100)}% ${e.matchedAreaRatio<1?'smaller':'larger'} geometric mean area after retrospective rescaling. Matched hits: Base ${Math.round(e.baseMatchedAttained*e.n)}/${e.n}, feedback ${Math.round(e.matchedAttained*e.n)}/${e.n}; not an issue-time rule.`],
  ['Feedback / baseline issued area',`${fmt(e.issuedAreaRatio,3)}×`,`${fmt(e.baseArea,0)} → ${fmt(e.feedbackArea,0)} km² arithmetic mean. ${fmt(Math.abs(1-e.issuedAreaRatio)*100)}% ${e.issuedAreaRatio<1?'smaller':'larger'} under the original issue-time rule.`]
 ].map(([a,b,c])=>`<div><span>${a}</span><strong>${b}</strong><small>${c}</small></div>`).join(''):'';
 const comparisons=primaryEvidence(D,f);$('#cp-intervals').textContent=comparisons.length?(full?comparisons:comparisons.filter(r=>r.candidate===refs.feedback)).map(r=>`${name(r.candidate)} / ${name(r.base)} matched-area ratio ${fmt(r.matched_area_ratio,3)}; whole-storm 95% interval [${r.ratio_ci95.map(v=>fmt(v,3)).join(', ')}]. `).join('\n')+'\n500 paired whole-storm bootstrap replicates, rematching each time. An interval crossing 1 leaves the direction unresolved. Short contexts, label budgets and exploratory comparisons limit inference.':'No paired interval was computed for this selection. Overlapping origins from the single CHAMPI storm do not supply independent storm replicates.';
 if(full){$('#cp-point-errors').innerHTML=rows.map(r=>`${esc(name(r.model_id))}: ${fmt(r.mae_km,2)} km (n=${r.n})`).join('<br>');frontier(rows,f);curve(f);}
}
function models(){
 const control=$('#cp-curve-method'),selected=control.value,ids=[...new Set(D.summary.map(r=>r.model_id))].filter(m=>m!==refs.position&&m!==refs.base);control.innerHTML=ids.map(m=>`<option value="${esc(m)}">${esc(name(m))}</option>`).join('');control.value=ids.includes(selected)?selected:refs.feedback;
 $('#cp-model-status').innerHTML=D.model_status.map(m=>{const complete=m.status==='completed',version=D.protocol.models[m.name];return `<article class="cp-model-card"><strong>${esc(m.name)}</strong><span>${complete?'Inference complete · '+m.n+' origins':'Pending · no calls or scores'}<br>${complete?fmt(m.parameters/1e6,2)+'M parameters · CPU':''}</span><div>${complete?`<small>${esc(version.repo)}</small><br><code>revision ${esc(version.revision)}</code><br><small>${m.name.startsWith('Chronos')?'chronos-forecasting '+esc(m.versions['chronos-forecasting']):'uni2ts '+esc(m.versions.uni2ts)}; shared 48h position history, no fine-tuning</small>`:'Nixtla API access pending; TimeGPT was not called.'}</div></article>`;}).join('');
 $('#cp-native').innerHTML=!(D.native_summary??[]).length?'<p>Native-coordinate intervals are retained in the archived direct-ENU experiment. The active table evaluates calibrated conformal regions.</p>':'<details><summary>Native rectangle coverage · 80% per coordinate; separate from 90% conformal</summary>'+(D.native_summary??[]).filter(r=>r.phase==='test'&&r.lead_h===24).map(r=>`<div class="cp-native-row">${esc(r.model_id)}: ${fmt(r.coverage*100)}% (n=${r.n}，2024 / +24h)</div>`).join('')+'</details>';
}
async function init(){await Promise.all((full?[['core','direct-vector-feedback.json'],['direct','tsfm-conformal.json'],['shared_cv','tsfm-cv-sensitivity.json']]:[['core','direct-vector-feedback.json']]).map(async([key,file])=>{const r=await fetch('assets/'+file);if(!r.ok)throw Error('Experiment cache '+r.status);SETS[key]=await r.json();}));D=SETS[full?$('#cp-preprocessing').value:'core']??SETS.core;refs=referencesFor(D);if(full)models();render();
 for(const id of ['cp-phase','cp-lead','cp-level','cp-shape','cp-calibrator','cp-regime'])$('#'+id).addEventListener('change',render);if(full){$('#cp-frontier-mode').addEventListener('change',render);$('#cp-curve-method').addEventListener('change',()=>curve(filters()));$('#cp-preprocessing').addEventListener('change',()=>{D=SETS[$('#cp-preprocessing').value];refs=referencesFor(D);models();render();});$('#cp-ratio-reference').addEventListener('change',render);}}
init().catch(e=>{$('#cp-status').textContent='Experiment feed unavailable: '+e.message+'.';});
