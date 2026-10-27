import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {frontierLayout,modelColor,coverageCurves} from '../site/conformal-chart-engine.mjs';
import {metricRows,referencesFor,correctionEvidence} from '../site/conformal-evidence-engine.mjs';
const read=file=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+file,import.meta.url)));
const core=read('direct-vector-feedback.json'),archive=read('tsfm-cv-sensitivity.json');
const filters={phase:'test',lead_h:24,level:90,shape:'ellipse',calibrator:'Causal rolling',regime:'all'};
test('published audit belongs to the unchanged experiment and distinguishes ETTh1 protocols',()=>{
 const a=read('conformal-transfer-audit.json'),key=Object.keys(a.source_sha256).find(k=>k.endsWith('/site/assets/direct-vector-feedback.json'));
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../site/assets/direct-vector-feedback.json',import.meta.url))).digest('hex'),a.source_sha256[key]);
 for(const row of metricRows(core,filters)){const q=a.primary[row.model_id];assert.equal(q.coverage,row.coverage);assert(Math.abs(q.mean_area_km2/row.mean_area_km2-1)<1e-12);}
 assert.equal(a.audit.original_artifacts_unchanged,true);assert(a.audit.max_area_relative_error<1e-8);
 assert(a.score_pool_diagnostics['TabPFN Direct-F2'].mean_warmup_fraction>.98);
 const fresh=a.etth1_staleness_L2.find(r=>r.k===0),stale=a.etth1_staleness_L2.find(r=>r.k===32);
 assert.equal(fresh.base_coverage,fresh.feedback_coverage);assert(stale.feedback_coverage<stale.base_coverage);assert.equal(stale.corrector,'rolling SCALAR-C');
});
test('fitted axes reveal exact values, include the target, and retain an explicit full-axis view',()=>{
 const refs=referencesFor(core),rows=metricRows(core,filters),l=frontierLayout(rows,90,refs);
 assert(l.xDomain[1]-l.xDomain[0]<10);assert(l.xDomain[0]<90&&l.xDomain[1]>90);
 for(const r of rows){assert(l.x(r.coverage*100)>=80&&l.x(r.coverage*100)<=650);assert(l.y(r.mean_area_km2)>=40&&l.y(r.mean_area_km2)<=275);}
 assert.equal(new Set(rows.map(r=>modelColor(r.model_id,refs))).size,rows.length);
 assert.equal(frontierLayout(rows,90,refs,'pair').rows.length,2);
 const all=frontierLayout(rows,90,refs,'full');assert.deepEqual(all.xDomain,[0,100]);assert.equal(all.x(90),593);
 assert.equal(frontierLayout([],90,refs),null);
 const ar=metricRows(archive,filters);assert.equal(new Set(ar.map(r=>modelColor(r.model_id,referencesFor(archive)))).size,ar.length);
});
test('coverage counts and area statistics use the actual full-feature baseline',()=>{
 const e=correctionEvidence(metricRows(core,filters));assert.equal(e.baseHits,156);assert.equal(e.feedbackHits,154);
 assert.equal(Math.round(e.matchedAttained*e.n),153);assert(Math.abs(e.issuedAreaRatio-608138.1935311864/634555.3580252854)<1e-8);
 assert(Math.abs(e.matchedAreaRatio-.9412913183467)<1e-8);
});

// Model native <select> semantics: assigning a value absent from its options
// yields an empty value, and setting innerHTML replaces the option collection.
// The previous generic object mock silently accepted impossible selections.
function selectNode(values,initial){
 let options=values,value=options.includes(initial)?initial:(options[0]??''),markup='';
 return {listeners:{},dataset:{cpView:'full'},textContent:'',
  get value(){return value;},set value(v){value=options.includes(v)?v:'';},
  get innerHTML(){return markup;},set innerHTML(v){markup=v;options=[...v.matchAll(/<option value="([^"]*)"/g)].map(m=>m[1]);value=options[0]??'';},
  addEventListener(k,fn){this.listeners[k]=fn;}};
}
test('initial core render and protocol switches plot the selected feedback stream, under actual select-value rules',async()=>{
 const html=fs.readFileSync(new URL('../site/conformal-benchmark.html',import.meta.url),'utf8'),nodes=new Map(),old={document:globalThis.document,fetch:globalThis.fetch};
 const values={'cp-phase':'test','cp-lead':'24','cp-level':'90','cp-shape':'ellipse','cp-calibrator':'Causal rolling','cp-regime':'all','cp-preprocessing':'core','cp-ratio-reference':'f2','cp-frontier-mode':'detail'};
 for(const [id,initial] of Object.entries(values)){
  const options={ 'cp-preprocessing':['core','direct','shared_cv'],'cp-phase':['test','champi'],'cp-ratio-reference':['f0','f2'],'cp-frontier-mode':['detail','pair','full']}[id]??[initial];
  nodes.set('#'+id,selectNode(options,initial));
 }
 // Deliberately begin with archived options, reproducing the stale initial HTML.
 nodes.set('#cp-curve-method',selectNode(['TabPFN CV-F2 + C1'],'TabPFN CV-F2 + C1'));
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{dataset:{cpView:'full'},innerHTML:'',textContent:'',listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>url.endsWith('direct-vector-feedback.json')?core:archive});
 try{
  await import('../site/conformal-evidence.mjs?select-regression');await new Promise(resolve=>setImmediate(resolve));
  const selector=nodes.get('#cp-curve-method'),svg=()=>nodes.get('#cp-curve').innerHTML;
  assert.equal(selector.value,'TabPFN Direct-F2 + RF');assert.equal((svg().match(/<path data-model=/g)??[]).length,4);
  assert(svg().includes('data-model="TabPFN Direct-F2 + RF"'));assert(svg().includes('data-model="TabPFN Direct-F2"'));
  assert.equal(coverageCurves(core,'test',selector.value,referencesFor(core)).length,4);
  selector.value='Chronos-2';selector.listeners.change();assert(svg().includes('data-model="Chronos-2"'));assert(!svg().includes('data-model="TabPFN Direct-F2 + RF"'));
  const protocol=nodes.get('#cp-preprocessing');protocol.value='shared_cv';protocol.listeners.change();assert.equal(selector.value,'Chronos-2');
  selector.value='TabPFN CV-F2 + C1';selector.listeners.change();assert(svg().includes('data-model="TabPFN CV-F2 + C1"'));
  protocol.value='core';protocol.listeners.change();assert.equal(selector.value,'TabPFN Direct-F2 + RF');assert.equal((svg().match(/<path data-model=/g)??[]).length,4);
  assert(nodes.get('#cp-cards').innerHTML.includes('156/169 → 154/169'));assert(nodes.get('#cp-cards').innerHTML.includes('153/169'));assert(nodes.get('#cp-cards').innerHTML.includes('2.31 → 1.12'));
  assert(nodes.get('#cp-frontier-note').textContent.includes('exact coordinates'));
 }finally{Object.assign(globalThis,old);}
});
