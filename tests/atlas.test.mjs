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
  assert.equal((nodes.get('#atlas-storm').innerHTML.match(/<option/g)||[]).length,114);assert(nodes.get('#atlas-map').innerHTML.includes('Retrospective truth'));assert(nodes.get('#atlas-cohort').innerHTML.includes('1,245'));
  nodes.get('#atlas-layout').value='split';nodes.get('#atlas-layout').listeners.change();assert(nodes.get('#atlas-map').innerHTML.includes('BASE / original forecast'));assert(nodes.get('#atlas-map').innerHTML.includes('C1 / residual feedback'));
  nodes.get('#atlas-retro').checked=false;nodes.get('#atlas-retro').listeners.change();assert(!nodes.get('#atlas-map').innerHTML.includes('Retrospective truth'));assert(nodes.get('#atlas-metrics').innerHTML.includes('Hidden'));
  nodes.get('#mode-live').onclick();assert.equal(nodes.get('#history-controls').hidden,true);assert(nodes.get('#atlas-verdict').textContent.includes('Generated'));assert(nodes.get('#atlas-metrics').innerHTML.includes('Not yet known'));assert(nodes.get('#atlas-map').innerHTML.includes('Last CMA analysis'));
 }finally{Object.assign(globalThis,saved);}
});
