import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {comparisonEvidence} from '../site/model-comparison-engine.mjs';
import {forecastRegions,OWN,modelScores,pairedScore} from '../site/algorithm-engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url)));
test('completed model comparison preserves actual full-cohort gains and losses across both input representations',()=>{
 for(const name of ['tsfm-cv-sensitivity.json','tsfm-conformal.json'])for(const phase of ['test','champi'])for(const h of [6,12,24]){
  const d=read(name),e=comparisonEvidence(d,phase,h);assert.equal(e.rows.length,5);assert(e.rows.every(r=>d.summary.includes(r)));assert(!e.rows.some(r=>r.model_id.endsWith('C0')));
  if(phase==='test'&&h===24){assert.equal(e.n,169);assert.equal(e.storms,27);assert.equal(e.pointWins,3);assert.equal(e.areaWins,3);assert(e.feedback.mae_km>e.base.mae_km);assert(e.feedback.mean_area_km2>e.base.mean_area_km2);}
 }
 const broken=read('tsfm-cv-sensitivity.json');broken.summary.find(r=>r.model_id==='Chronos-2'&&r.phase==='test'&&r.lead_h===24&&r.level===90&&r.shape==='ellipse'&&r.calibrator==='Causal rolling'&&r.regime==='all').n--;assert.throws(()=>comparisonEvidence(broken));
});
test('both live conformal outlines use their own unchanged marginal radius, with no region fabricated for NWP',()=>{
 const d=read('champi-operations.json'),r=forecastRegions(d.model.paths,24,90);assert.deepEqual(r.map(x=>x.model_id),[OWN[0],OWN[1]]);assert.notEqual(r[0].area,r[1].area);assert.equal(r[0].points.length,97);assert.equal(forecastRegions(d.model.paths,24,90,'none').length,0);assert.equal(forecastRegions(d.model.paths,24,90,OWN[1]).length,1);assert.equal(forecastRegions(d.model.paths,18,90).length,0);
});
test('per-model verification and paired rows expose feedback explicitly without mixing sample cohorts',()=>{
 const d=read('champi-operations.json'),now=Date.parse('2026-10-26T05:00:00Z'),s=modelScores(d.verification,[OWN[0],OWN[1]],12,90,now),p=pairedScore(d.verification,OWN[1],OWN[0],12,90,now);
 assert.equal(s[0].n,0);assert.equal(s[1].n,0);assert.equal(p.n,0);assert.equal(s[1].mae,null);assert.equal(s[1].regionN,0);assert.equal(s[1].coverage,null);assert(d.verification.records.some(r=>r.model_id==='TabPFN CV-F2 + C1'));
});
for(const file of ['algorithm-live.html','results.html'])test(file+' exposes complete local TSFM experiments with working input/cohort/lead controls',async()=>{
 const html=fs.readFileSync(new URL('../site/'+file,import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch},values={'#comparison-cohort':'test','#comparison-lead':'24','#comparison-input':'shared'};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:values[s]??'',innerHTML:'',textContent:'',href:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>read(url.replace('assets/',''))});
 try{await import('../site/model-comparison.mjs?'+file);await new Promise(r=>setImmediate(r));const table=()=>nodes.get('#comparison-table').innerHTML;assert(table().includes('Vector residual feedback'));for(const m of ['Chronos-Bolt-small','Chronos-2','Moirai-1.1-R-small'])assert(table().includes(m));assert(nodes.get('#comparison-area-bars').innerHTML.includes('0.874×'));assert(table().includes('224.2'));assert(table().includes('219.9'));assert(nodes.get('#comparison-finding').textContent.includes('3/3'));assert(nodes.get('#comparison-scope').textContent.includes('169 endpoints / 27 storms'));
  nodes.get('#comparison-input').value='direct';nodes.get('#comparison-input').listeners.change();assert(table().includes('454.9'));assert(nodes.get('#comparison-source').href.endsWith('tsfm-conformal.json'));
  nodes.get('#comparison-cohort').value='champi';nodes.get('#comparison-lead').value='6';nodes.get('#comparison-lead').listeners.change();assert(nodes.get('#comparison-scope').textContent.includes('locked historical snapshot'));assert(nodes.get('#comparison-scope').textContent.includes('+6h'));
 }finally{Object.assign(globalThis,saved);}
});
test('briefing checkboxes keep raw model IDs and control both conformal regions independently of official wind radii',async()=>{
 const html=fs.readFileSync(new URL('../site/champi.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch,setInterval:globalThis.setInterval};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:s==='#operations-lead'?'24':s==='#motion-phase'?'test':'24',checked:s==='#operations-regions',innerHTML:'',textContent:'',listeners:{},classList:{toggle(){}},addEventListener(k,f){this.listeners[k]=f;},querySelectorAll(){this.controls=[...this.innerHTML.matchAll(/data-live-model="([^"]+)"/g)].map(m=>({dataset:{liveModel:m[1]},checked:true,listeners:{},addEventListener(k,f){this.listeners[k]=f;}}));return this.controls;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>read(url.replace('assets/',''))});globalThis.setInterval=()=>0;
 try{await import('../site/operations.mjs?region-test');await new Promise(r=>setImmediate(r));const svg=()=>nodes.get('#operations-map').innerHTML;assert.equal((svg().match(/data-region=/g)||[]).length,2);assert(!svg().includes('Official force-'));assert(nodes.get('#operations-models').innerHTML.includes(`data-live-model="${OWN[1]}"`));assert(!nodes.get('#operations-models').innerHTML.includes('data-live-model="Vector'));
  const feedback=nodes.get('#operations-models').controls.find(x=>x.dataset.liveModel===OWN[1]);feedback.checked=false;feedback.listeners.change();assert.equal((svg().match(/data-region=/g)||[]).length,1);const restored=nodes.get('#operations-models').controls.find(x=>x.dataset.liveModel===OWN[1]);restored.checked=true;restored.listeners.change();assert.equal((svg().match(/data-region=/g)||[]).length,2);
  nodes.get('#operations-regions').checked=false;nodes.get('#operations-regions').listeners.change();assert(!svg().includes('data-region='));
  nodes.get('#operations-regions').checked=true;nodes.get('#operations-lead').value='12';nodes.get('#operations-lead').listeners.change();assert(svg().includes('+12h'));const live=read('champi-operations.json'),radii=[OWN[0],OWN[1]].map(id=>live.model.paths.find(p=>p.model_id===id).points.find(q=>q.lead_h===12).radius_90_km.toFixed(1));assert(nodes.get('#operations-region-note').textContent.includes(radii.join(' / ')));
  nodes.get('#operations-wind-rings').checked=true;nodes.get('#operations-wind-rings').listeners.change();assert(svg().includes('Official force-'));assert.equal((svg().match(/data-region=/g)||[]).length,2);
 }finally{Object.assign(globalThis,saved);}
});
