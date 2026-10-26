import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {metricRows,correctionEvidence,primaryEvidence} from '../site/conformal-evidence-engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url)));
const D=read('tsfm-conformal.json'),CV=read('tsfm-cv-sensitivity.json'),filters={phase:'test',lead_h:24,level:90,shape:'ellipse',calibrator:'Causal rolling',regime:'all'};
test('coverage, area and MAE remain separate on exactly matched mature cohorts',()=>{
 const rows=metricRows(D,filters);assert.equal(rows.length,7);assert(rows.every(r=>r.n===169&&r.storms===27));
 const e=correctionEvidence(rows);assert(e.gapReduction<0);assert.equal(e.baseShortfall,0);assert.equal(e.c1Shortfall,0);assert(e.matchedAreaRatio<1);assert(e.issuedAreaRatio>1);
 assert.equal(metricRows(D,{...filters,phase:'champi',regime:'motion_change'}).length,0);
 assert.equal(primaryEvidence(D,{...filters,regime:'motion_change'}).length,0);assert.equal(primaryEvidence(D,filters).length,5);
 const changed=correctionEvidence(metricRows(D,{...filters,regime:'motion_change'}));assert.equal(changed.baseShortfall,2.5);assert.equal(changed.c1Shortfall,0);
});
test('new benchmark preserves the complete original24h shape summaries',()=>{
 for(const old of read('endpoint24-shapes.json').summary){const rows=metricRows(D,{phase:old.phase,lead_h:24,level:old.level,shape:old.shape,calibrator:'Causal rolling',regime:'all'}),n=rows.find(r=>r.model_id===old.model_id);assert.equal(n.n,old.n);assert.equal(n.coverage,old.coverage);assert(Math.abs(n.mean_area_km2-old.mean_area_km2)<1e-7);}
 assert(D.model_status.filter(m=>m.status==='completed').every(m=>m.n===802&&m.prediction_sha256.length===64));assert.equal(D.model_status.find(m=>m.name==='TimeGPT').status,'pending_credentials');
});
for(const [page,view] of [['conformal-benchmark.html','full'],['algorithm-live.html','compact']])test(page+' renders uncertainty metrics and changes cohort/level/shape/regime without fabricated scores',async()=>{
 const html=fs.readFileSync(new URL('../site/'+page,import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 const values={'#cp-phase':'test','#cp-lead':'24','#cp-level':'90','#cp-shape':'ellipse','#cp-calibrator':'Causal rolling','#cp-regime':'all','#cp-curve-method':'TabPFN CV-F2 + C1','#cp-preprocessing':'shared_cv','#cp-ratio-reference':'f0'};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:values[s],dataset:{cpView:view},innerHTML:'',textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>url.endsWith('tsfm-cv-sensitivity.json')?CV:D});
 try{await import('../site/conformal-evidence.mjs?'+view);await new Promise(r=>setImmediate(r));assert(nodes.get('#cp-table').innerHTML.includes('94.7%'));assert(nodes.get('#cp-cards').innerHTML.includes('shortfall'));assert(nodes.get('#cp-intervals').textContent.includes('whole-storm 95% interval'));
  if(view==='full'){assert(nodes.get('#cp-frontier').innerHTML.includes('Target 90%'));assert(nodes.get('#cp-model-status').innerHTML.includes('Pending'));assert(nodes.get('#cp-curve').innerHTML.includes('Frozen 2019'));assert(nodes.get('#cp-table').innerHTML.includes('1.460×'));
   nodes.get('#cp-preprocessing').value='direct';nodes.get('#cp-preprocessing').listeners.change();assert(nodes.get('#cp-table').innerHTML.includes('2.006×'));assert(nodes.get('#cp-status').textContent.includes('direct ENU'));
   nodes.get('#cp-ratio-reference').value='f2';nodes.get('#cp-ratio-reference').listeners.change();assert(nodes.get('#cp-table').innerHTML.includes('1.683×'));
  }
  nodes.get('#cp-level').value='80';nodes.get('#cp-level').listeners.change();assert(nodes.get('#cp-table').innerHTML.includes('/ 80%'));
  nodes.get('#cp-shape').value='circle';nodes.get('#cp-shape').listeners.change();assert(nodes.get('#cp-status').textContent.includes('circle'));
  nodes.get('#cp-phase').value='champi';nodes.get('#cp-regime').value='motion_change';nodes.get('#cp-regime').listeners.change();assert(nodes.get('#cp-table').innerHTML.includes('No common mature endpoints'));assert.equal(nodes.get('#cp-cards').innerHTML,'');
 }finally{Object.assign(globalThis,saved);}
});
