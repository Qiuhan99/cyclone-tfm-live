import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {metricRows,correctionEvidence} from '../site/conformal-evidence-engine.mjs';
import {comparisonEvidence} from '../site/model-comparison-engine.mjs';
import {guidanceEvidence,guidanceCycles,guidanceCase} from '../site/guidance-benchmark-engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url)));

test('core benchmark has no CV or C0 arm and retains six models on common labels',()=>{
 const d=read('direct-vector-feedback.json');assert.equal(d.protocol.constant_velocity_offset,false);assert.equal(d.protocol.base_prediction_as_correction_input,false);assert.equal(d.protocol.correction_features,68);
 for(const phase of ['test','champi'])for(const h of [6,12,24]){
  const rows=metricRows(d,{phase,lead_h:h,level:90,shape:'ellipse',calibrator:'Causal rolling',regime:'all'});
  assert.equal(rows.length,6);assert(rows.every(r=>r.n===rows[0].n));assert(!rows.some(r=>r.model_id.includes('CV-')||r.model_id.includes('C0')));
  const e=comparisonEvidence(d,phase,h);assert.equal(e.rows.length,5);assert.equal(e.feedback.model_id,'TabPFN Direct-F2 + RF');assert(correctionEvidence(rows));
 }
});
test('new guidance map reconstructs each new aggregate from the original common cycles',()=>{
 const d=read('direct-guidance.json'),b=read('direct-guidance-paths.json');
 for(const h of [6,12,24,48,72]){
  const cases=guidanceCycles(b,h).map(c=>guidanceCase(b,d,h,c.issue_time_utc));
  for(const row of guidanceEvidence(d,h).rows){const mean=cases.reduce((s,c)=>s+c.rows.find(r=>r.id===row.id).error,0)/cases.length;assert(Math.abs(mean-row.mae)<1e-6);}
 }
});
test('core formulas in both immersive entries exclude the CV offset and Base input augmentation',()=>{
 for(const file of ['index.html','research-briefing.html']){
  const s=fs.readFileSync(new URL('../site/'+file,import.meta.url),'utf8');
  assert(s.includes('v(t,h) = f(X(t,h))'));assert(s.includes('g(X(t,h), H(t,h))'));assert(!s.includes('b̂(t,h) = CV(t,h)'));
  assert(!s.includes('conditions on issue-time features, the Base displacement'));assert(s.includes('DIRECT_VECTOR_FEEDBACK.md'));
 }
});
for(const [page,view] of [['conformal-benchmark.html','full'],['algorithm-live.html','compact']])test(page+' renders the genuine direct-core conformal dataset',async()=>{
 const html=fs.readFileSync(new URL('../site/'+page,import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 const values={'#cp-phase':'test','#cp-lead':'24','#cp-level':'90','#cp-shape':'ellipse','#cp-calibrator':'Causal rolling','#cp-regime':'all','#cp-preprocessing':'core','#cp-curve-method':'TabPFN Direct-F2 + RF','#cp-ratio-reference':'f2'};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`));if(!nodes.has(s))nodes.set(s,{value:values[s],dataset:{cpView:view},innerHTML:'',textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>read(url.replace('assets/',''))});
 try{await import('../site/conformal-evidence.mjs?direct-'+view);await new Promise(r=>setImmediate(r));const table=nodes.get('#cp-table').innerHTML;assert(table.includes('Vector residual feedback'));assert(table.includes('608138'));assert(!table.includes('CV archive'));assert(!table.includes('Correction-only ablation'));assert(nodes.get('#cp-status').textContent.includes('no CV offset'));if(view==='full')assert(nodes.get('#cp-curve').innerHTML.includes('Vector residual feedback'));
 }finally{Object.assign(globalThis,saved);}
});
