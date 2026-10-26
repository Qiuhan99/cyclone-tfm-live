import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {tangentLog,issuedBoundary,currentMetrics,observations,cohortRows} from '../site/atlas-engine.mjs';
import {sphereExp,distance} from '../site/engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url))),A=read('research-atlas.json'),R=read('rolling-v2.json');
test('atlas retains all114 storms and1245 paired origins including unsuccessful corrections',()=>{
 assert.equal(A.storms.length,114);assert.equal(A.storms.reduce((n,s)=>n+s.origins.length,0),1245);let losses=0;
 for(let i=0;i<A.storms.length;i++){const s=A.storms[i],old=R.storms[i];assert.equal(s.id,old.id);
  for(let j=0;j<s.origins.length;j++){const o=s.origins[j],source=old.origins[j];for(const m of ['tabpfn','rolling_c0','rolling_c1']){assert.deepEqual(o.paths[m],source.paths[m]);assert.deepEqual(o.errors[m],source.errors[m]);}
   assert(o.truth.length===4);if(currentMetrics(o,24,true).delta<0)losses++;
  }
 }assert(losses>100);assert.equal(cohortRows(A,24)[2].n_origins,1245);
});
test('issued ellipse projections use the original issue anchor and frozen q, including dateline roundtrips',()=>{
 for(const [a,b] of [[[20,140],[23,143]],[[10,179],[11,-178]]]){const u=tangentLog(a,b);assert(distance(sphereExp(a,...u),b)<1e-7);}
 const o=A.storms[0].origins[0],method='rolling_c1',r=o.regions[method]['4'],q=r.q['0.1'],cov=r.covariances[3],offset=tangentLog(o.anchor,o.paths[method][3]);
 const det=cov[0][0]*cov[1][1]-cov[0][1]**2;
 for(const p of issuedBoundary(o,method,24,90,16)){const u=tangentLog(o.anchor,p).map((v,j)=>v-offset[j]),score=(cov[1][1]*u[0]**2-2*cov[0][1]*u[0]*u[1]+cov[0][0]*u[1]**2)/det;assert(Math.abs(score-q*q)<1e-7);}
 assert.deepEqual(issuedBoundary({...o,regions:{}},method,24),[]);
});
test('future truth and metrics stay hidden outside retrospective mode',()=>{
 const s=A.storms[0],o=s.origins[0];assert.equal(currentMetrics(o,24,false),null);
 const past=observations(s,o.issue);assert.equal(past.length,o.index+1);assert.deepEqual(past.at(-1),o.anchor);
});
test('actual map module switches114-storm replay, paired split maps, future truth and live paths',async()=>{
 const html=fs.readFileSync(new URL('../site/research-atlas.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch,setInterval:globalThis.setInterval};
 const values={'#atlas-layout':'overlay','#atlas-lead':'24','#atlas-level':'90'};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:values[s]??'',checked:s!=='#layer-c0',hidden:false,innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>read(url.replace('assets/',''))});globalThis.setInterval=()=>0;
 try{await import('../site/atlas.mjs?integration');await new Promise(r=>setImmediate(r));
  assert.equal((nodes.get('#atlas-storm').innerHTML.match(/<option/g)||[]).length,114);assert(nodes.get('#atlas-map').innerHTML.includes('Retrospective truth'));assert(nodes.get('#atlas-cohort').innerHTML.includes('1,245'));assert(nodes.get('#atlas-cohort').innerHTML.includes('Ablation control'));assert(nodes.get('#atlas-cohort').innerHTML.includes('1117/1245'));assert(nodes.get('#atlas-cohort').innerHTML.includes('6/12/18/24h'));
  nodes.get('#atlas-layout').value='split';nodes.get('#atlas-layout').listeners.change();assert(nodes.get('#atlas-map').innerHTML.includes('BASE / original forecast'));assert(nodes.get('#atlas-map').innerHTML.includes('C1 / residual feedback'));
  nodes.get('#atlas-retro').checked=false;nodes.get('#atlas-retro').listeners.change();assert(!nodes.get('#atlas-map').innerHTML.includes('Retrospective truth'));assert(nodes.get('#atlas-metrics').innerHTML.includes('Hidden'));
  nodes.get('#atlas-lead').onchange({target:{value:'6'}});assert(nodes.get('#atlas-cohort').innerHTML.includes('+6h MAE'));nodes.get('#mode-live').onclick();assert(nodes.get('#atlas-cohort').innerHTML.includes('+24h MAE'));assert(nodes.get('#atlas-cohort').innerHTML.includes('6/12/18/24h'));assert.equal(nodes.get('#history-controls').hidden,true);assert(nodes.get('#atlas-verdict').textContent.includes('Generated'));assert(nodes.get('#atlas-metrics').innerHTML.includes('Not yet known'));assert(nodes.get('#atlas-map').innerHTML.includes('Last CMA analysis'));
 }finally{Object.assign(globalThis,saved);}
});

test('archived cohort summaries reproduce per-origin MAE and joint coverage at every supported lead',async()=>{
 const {cohortSummary}=await import('../site/atlas-engine.mjs');
 assert.equal(A.source_sha256,(await import('node:crypto')).createHash('sha256').update(fs.readFileSync(new URL('../site/assets/rolling-v2.json',import.meta.url))).digest('hex'));
 const origins=A.storms.flatMap(s=>s.origins);
 for(const h of [6,12,24]){const s=cohortSummary(A,h);assert.deepEqual(s.leads,Array.from({length:h/6},(_,i)=>(i+1)*6));assert.equal(s.storms,114);
  for(const row of s.rows){const mae=origins.reduce((n,o)=>n+o.errors[row.method][h/6-1],0)/origins.length,covered=origins.filter(o=>{const r=o.regions[row.method][h/6];return r.score<=r.q['0.1'];}).length;
   assert(Math.abs(mae-row.mae_km)<1e-6);assert.equal(row.covered,covered);assert.equal(row.n_origins,1245);assert(Math.abs(row.coverage-covered/1245)<1e-7);
  }
 }
 const s=cohortSummary(A,24);assert.equal(s.rows[0].covered,1117);assert.equal(s.rows[1].covered,1118);assert.equal(s.rows[2].covered,1109);assert(s.rows[2].delta_vs_base_km>13);
 assert.throws(()=>cohortSummary(A,18),RangeError);
 const html=fs.readFileSync(new URL('../site/research-atlas.html',import.meta.url),'utf8');assert(!html.match(/id="atlas-lead"[^>]*>.*?<option>18<\/option>/s));
});
