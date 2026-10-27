import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {datasetEvidence,reduction,gainClass} from '../site/realdata-evidence-engine.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+name,import.meta.url),'utf8'));
test('real-data evidence reconstructs original whole-window MAE without selecting wins',()=>{
 const data=read('realdata-feedback-evidence.json');
 for(const [id,n,p] of [['electricity',128,321],['etth1',256,7]]){
  const r=datasetEvidence(data,id);assert.equal(r.origins,n);assert.equal(r.channels,p);assert.equal(r.scalar_forecasts,n*p);
  assert(Math.abs(reduction(r.base.mae,r.feedback.mae)-r.mae_reduction_pct)<1e-10);
  assert.equal(r.per_origin.filter(x=>x.feedback_mae<x.base_mae).length,r.mae_win_origins);
  assert.equal(r.per_origin.length,n);assert(r.source_sha256);assert(r.all_saved_methods.some(x=>x.method==='C1_OBS_LR'));
 }
 assert(Math.abs(datasetEvidence(data).mae_reduction_pct-27.934390163178612)<1e-9);
 assert(datasetEvidence(data).mae_change_ci95[1]<0);
 assert(datasetEvidence(data,'etth1').mae_change_ci95[1]>0);
 assert.match(data.study_boundary,/not the52\+16/);assert.match(data.information_boundary,/after the Base block was issued/);
});
test('evidence engine rejects inconsistent aggregate errors and never labels a regression as a gain',()=>{
 const data=read('realdata-feedback-evidence.json');data.datasets[0].base.mae=0;
 assert.throws(()=>datasetEvidence(data),/disagree/);assert.equal(gainClass(-1),'neutral');
 const html=fs.readFileSync(new URL('../site/results.html',import.meta.url),'utf8');
 assert(html.includes('id="realdata-dataset"'));assert(html.includes('direct-vector cyclone protocol'));
 assert(!html.includes('rolling-feedback-evidence.json'));
});
test('actual evidence module switches complete datasets and keeps cyclone validation separate',async()=>{
 const html=fs.readFileSync(new URL('../site/results.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 globalThis.document={querySelector(s){if(!html.includes(`id="${s.slice(1)}"`))return null;if(!nodes.has(s))nodes.set(s,{value:s==='#realdata-dataset'?'electricity':'',innerHTML:'',textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>read(url.replace('assets/',''))});
 try{
  await import('../site/realdata-evidence.mjs?render-test');await new Promise(r=>setImmediate(r));
  assert(nodes.get('#realdata-metrics').innerHTML.includes('27.9%'));assert(nodes.get('#realdata-chart-note').textContent.includes('All 128 hourly targets'));
  const chart=nodes.get('#realdata-chart').innerHTML;assert(chart.includes('raw dataset units'));
  const validation=read('feedback-validation.json');assert.equal(validation.candidates.length,5);assert.equal(validation.adopted,false);assert.equal(validation.audited_contexts,1400);
  assert.equal((nodes.get('#feedback-validation').innerHTML.match(/Not passed/g)||[]).length,5);
  nodes.get('#realdata-dataset').value='etth1';nodes.get('#realdata-dataset').listeners.change();
  assert(nodes.get('#realdata-metrics').innerHTML.includes('0.7%'));assert(nodes.get('#realdata-chart-note').textContent.includes('All 256 hourly targets'));assert.notEqual(nodes.get('#realdata-chart').innerHTML,chart);
 }finally{Object.assign(globalThis,saved);}
});
test('immersive entries retain the original seven-chapter cyclone narrative and visible case evidence',()=>{
 for(const name of ['index.html','research-briefing.html']){
  const html=fs.readFileSync(new URL('../site/'+name,import.meta.url),'utf8');
  assert.equal((html.match(/data-step="[0-6]"/g)||[]).length,7);
  assert(html.includes('id="story-map"'));assert(html.includes('id="present-toggle"'));
  assert(html.indexOf('id="story-evidence"')<html.indexOf('<details class="realdata-archived">'));
 }
});
