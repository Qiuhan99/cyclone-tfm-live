import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OWN,comparators,boundary,area,verified,pairedScore} from '../site/algorithm-engine.mjs';
import {distance} from '../site/engine.mjs';
test('live Conformal boundary reads the actual selected lead/level and spherical area',()=>{
 const q={lat_deg:30,lon_deg:125,radius_80_km:50,radius_90_km:100,radius_95_km:200};
 for(const level of [80,90,95])for(const p of boundary(q,level))assert(Math.abs(distance([30,125],p)-q[`radius_${level}_km`])<1e-7);
 assert(area(200)>area(100)*3.99);assert.equal(area(undefined),null);assert.deepEqual(boundary({},90),[]);
});
test('agency and numerical models require exact issue matching without extrapolating a missing lead',()=>{
 const data={model:{paths:[{model_id:'ATCF:CMC',model_raw_aid:'CMC',issue_time_utc:'2026-10-25T00:00:00Z'}]},agency_forecasts:{paths:[{model_id:'CMA / BABJ',issue_time_utc:'2026-10-25T12:00:00+00:00',points:[{lead_h:12}]}]}};
 assert.equal(comparators(data,'2026-10-25T12:00:00Z').length,1);assert.equal(comparators(data,'2026-10-25T12:00:00Z','latest').length,2);
});
test('prospective scoring excludes future truth, late confirmation and unmatched origins; revisions cannot replace first forecast',()=>{
 const r={storm_id:'CHAMPI_2026',issue_time_utc:'2026-10-25T12:00:00+00:00',valid_time_utc:'2026-10-25T18:00:00+00:00',lead_h:6,lat_deg:31,lon_deg:128,eligible:true,recorded_at_utc:'2026-10-25T14:00:00Z',confirmed_at_utc:'2026-10-25T14:15:00Z',radius_90_km:50};
 const ledger={records:[{...r,model_id:OWN[2]},{...r,model_id:'CMA / BABJ',lat_deg:32},{...r,model_id:OWN[2],lat_deg:40,recorded_at_utc:'2026-10-25T15:00:00Z'}],truths:{[r.valid_time_utc]:{lat_deg:31,lon_deg:128,first_seen_at_utc:'2026-10-25T18:15:00Z'}}};
 assert.equal(verified(ledger,6,Date.parse('2026-10-25T18:01:00Z')).length,0);
 const score=pairedScore(ledger,OWN[2],'CMA / BABJ',6,90,Date.parse('2026-10-25T19:00:00Z'));assert.equal(score.n,1);assert.equal(score.own,0);assert.equal(score.coverage,1);assert.equal(score.wins,1);
 const unmatched=structuredClone(ledger);unmatched.records[1].issue_time_utc='2026-10-25T06:00:00+00:00';assert.equal(pairedScore(unmatched,OWN[2],'CMA / BABJ',6,90,Date.parse('2026-10-25T19:00:00Z')).n,0);
 ledger.records[0].confirmed_at_utc=r.valid_time_utc;ledger.records[2].eligible=false;assert.equal(pairedScore(ledger,OWN[2],'CMA / BABJ',6,90,Date.parse('2026-10-25T19:00:00Z')).n,0);
});
test('algorithm window renders real paths and changes lead, level, model and latest-source mode',async()=>{
 const html=fs.readFileSync(new URL('../site/algorithm-live.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch,setInterval:globalThis.setInterval};
 const values={'#algo-method':OWN[2],'#algo-lead':'24','#algo-level':'90','#algo-pairing':'matched','#algo-verify-lead':'auto','#algo-region-mode':'both'};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:values[s]??'',innerHTML:'',textContent:'',classList:{toggle(){},add(){}},listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>{const d=JSON.parse(fs.readFileSync(new URL('../site/'+url,import.meta.url)));if(url.endsWith('champi-operations.json'))d.verification={records:[],truths:{}};return d;}});globalThis.setInterval=()=>0;
 try{await import('../site/algorithm-live.mjs?integration');await new Promise(r=>setImmediate(r));
  assert.equal((nodes.get('#algo-own-map').innerHTML.match(/data-region=/g)||[]).length,2);assert(nodes.get('#algo-own-map').innerHTML.includes('ENDPOINT DETAIL'));assert(nodes.get('#algo-region-comparison').innerHTML.includes('Vector residual feedback'));assert(nodes.get('#algo-verification-methods').innerHTML.includes('Vector residual feedback'));assert(nodes.get('#algo-forward').innerHTML.includes('Vector residual feedback'));nodes.get('#algo-region-mode').value='none';nodes.get('#algo-region-mode').listeners.change();assert(!nodes.get('#algo-own-map').innerHTML.includes('data-region='));nodes.get('#algo-region-mode').value='both';nodes.get('#algo-region-mode').listeners.change();assert(nodes.get('#algo-retro').innerHTML.includes('131.94'));assert(!nodes.get('#algo-retro').innerHTML.includes('119.82'));assert(nodes.get('#algo-forward').innerHTML.includes('No eligible forecast'));assert(!nodes.get('#algo-forward').innerHTML.includes('Correction-only ablation'));assert(!nodes.get('#algo-own-map').innerHTML.includes('C0'));assert(!html.match(/<option value="TabPFN CV-F2 \+ C0"/));
  const old=nodes.get('#algo-radius').textContent;nodes.get('#algo-level').value='80';nodes.get('#algo-level').listeners.change();assert.notEqual(nodes.get('#algo-radius').textContent,old);
  nodes.get('#algo-lead').value='6';nodes.get('#algo-lead').listeners.change();assert(nodes.get('#algo-target-time').textContent.includes('+6h'));
  nodes.get('#algo-method').value=OWN[0];nodes.get('#algo-method').listeners.change();assert(nodes.get('#algo-own-clock').textContent.includes('baseline'));
  nodes.get('#algo-verify-lead').value='6';nodes.get('#algo-verify-lead').listeners.change();assert(nodes.get('#algo-verification-status').textContent.includes('+6h'));
  nodes.get('#algo-pairing').value='latest';nodes.get('#algo-pairing').listeners.change();assert(nodes.get('#algo-other-note').textContent.includes('not a matched skill ranking'));
 }finally{Object.assign(globalThis,saved);}
});
