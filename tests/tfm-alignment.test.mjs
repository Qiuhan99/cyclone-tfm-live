import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {alignmentRows,areaRatioCI} from '../site/tfm-alignment-engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../site/assets/tfm-alignment.json',import.meta.url)));
test('factorial exposes both calibrators and all paired arms for every phase and k',()=>{for(const phase of ['test','validation','champi'])for(const k of [1,2,4,8,16,32]){const rows=alignmentRows(data,phase,k);assert.equal(rows.length,6);assert.equal(new Set(rows.map(r=>r.n)).size,1);assert.equal(new Set(rows.map(r=>r.calibrator)).size,2);assert.equal(new Set(rows.map(r=>r.method)).size,3);}});
test('single-storm uncertainty is missing and malformed task controls are rejected',()=>{assert(alignmentRows(data,'champi',1).every(r=>areaRatioCI(r)===null));assert.throws(()=>alignmentRows(data,'test',999));assert.throws(()=>alignmentRows(data,'fixed',1));});
test('reported intervals transform log ratios monotonically and raw coverage remains separate',()=>{const r=alignmentRows(data,'test',1).find(r=>r.method==='c1'&&r.calibrator==='Original PI+');const ci=areaRatioCI(r);assert(ci[0]<1&&ci[1]>1);assert(r.coverage<.9);assert.equal(r.matched_candidate_coverage,.9);});
test('official TS fixed-issue paths are real and online corrections are not merged into them',()=>{const d=JSON.parse(fs.readFileSync(new URL('../site/assets/champi-2026.json',import.meta.url)));const paths=d.paths.filter(p=>p.model_id==='TabPFN-TS official');assert.equal(paths.length,31);assert(!d.paths.some(p=>/online|aligned c1/i.test(p.model_id)));for(const p of paths)for(const q of p.points)assert.equal((Date.parse(q.valid_time_utc)-Date.parse(p.issue_time_utc))/3600000,q.lead_h);});
test('page module binds real HTML controls and renders both historical and CHAMPI results',async()=>{
  const html=fs.readFileSync(new URL('../site/champi.html',import.meta.url),'utf8'),nodes=new Map();
  const previousDocument=globalThis.document,previousFetch=globalThis.fetch;
  globalThis.document={querySelector(selector){
    assert(html.includes(`id="${selector.slice(1)}"`),`missing actual HTML control ${selector}`);
    if(!nodes.has(selector))nodes.set(selector,{value:selector==='#alignment-phase'?'test':selector==='#alignment-k'?'1':'',innerHTML:'',textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}});
    return nodes.get(selector);
  }};
  globalThis.fetch=async url=>{assert.equal(url,'assets/tfm-alignment.json');return {ok:true,json:async()=>data};};
  try{
    await import('../site/tfm-alignment.mjs?integration');await new Promise(resolve=>setImmediate(resolve));
    assert.equal((nodes.get('#alignment-results').innerHTML.match(/<tr>/g)||[]).length,6);
    assert(nodes.get('#alignment-results').innerHTML.includes('88.3%'));
    assert(nodes.get('#alignment-results').innerHTML.includes('0.794 [0.627, 1.138]'));
    nodes.get('#alignment-phase').value='champi';nodes.get('#alignment-phase').listeners.change();
    assert(nodes.get('#alignment-native').textContent.includes('66.7%'));
    assert(nodes.get('#alignment-results').innerHTML.includes('55.6%'));
    assert(nodes.get('#alignment-results').innerHTML.includes('单场，无区间'));
    nodes.get('#alignment-k').value='8';nodes.get('#alignment-k').listeners.change();
    assert(nodes.get('#alignment-scope').textContent.includes('Base每48h刷新'));
  }finally{globalThis.document=previousDocument;globalThis.fetch=previousFetch;}
});
