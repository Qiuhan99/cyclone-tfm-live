import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {guidanceEvidence,guidanceCycles,guidanceCase,guidanceRegion,GUIDANCE_LEADS,GUIDANCE_MODELS} from '../site/guidance-benchmark-engine.mjs';
const read=()=>JSON.parse(fs.readFileSync(new URL('../site/assets/motion-residual.json',import.meta.url)));
const asset=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url)));
test('map cycles reproduce aggregate MAE from coordinates, preserve provenance and keep future truth separate',()=>{
 const bundle=asset('guidance-paths.json'),summary=read();
 for(const [n,h] of Object.entries(bundle.source_sha256))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url))).digest('hex'),h);
 for(const lead of GUIDANCE_LEADS){const cycles=guidanceCycles(bundle,lead),cases=cycles.map(c=>guidanceCase(bundle,summary,lead,c.issue_time_utc));
  for(const ref of guidanceEvidence(summary,lead).rows){const mean=cases.reduce((s,c)=>s+c.rows.find(r=>r.id===ref.id).error,0)/cases.length;assert(Math.abs(mean-ref.mae)<1e-6);}
  for(const c of cases){assert(c.cycle.history.every(p=>Date.parse(p.valid_time_utc)<=Date.parse(c.cycle.issue_time_utc)));assert(c.cycle.truth.every(p=>Date.parse(p.valid_time_utc)>Date.parse(c.cycle.issue_time_utc)));assert.equal(c.rows.filter(r=>guidanceRegion(r.endpoint).length===97).length,2);assert(c.rows.every(r=>r.points.at(-1).lead_h===lead));}
 }
 assert.throws(()=>guidanceCase(bundle,summary,24,'2026-10-14T12:00:00Z'));
 const bad=structuredClone(bundle);bad.cycles[0].paths[0].points[0].valid_time_utc='2030-01-01T00:00:00Z';assert.throws(()=>guidanceCase(bad,summary,6,bad.cycles[0].issue_time_utc));
});
test('guidance benchmark preserves the original exact-intersection scores at all five leads',()=>{
 const data=read();
 for(const h of GUIDANCE_LEADS){const e=guidanceEvidence(data,h);assert.equal(e.rows.length,5);assert.equal(e.n,h<=12?10:h===24?9:8);for(const r of e.rows){const source=data.external_common.find(x=>x.model_id===r.id&&x.lead_h===h);assert.equal(r.mae,source.mean_error_km);assert.equal(r.n,source.n);}}
 const e=guidanceEvidence(data,24);assert.equal(e.rows.find(r=>r.id==='ATCF:NGX').mae.toFixed(2),'44.88');assert.equal(e.rows.find(r=>r.id.endsWith('C1')).mae.toFixed(2),'136.59');assert(!GUIDANCE_MODELS.some(m=>m.id.endsWith('C0')));
 const broken=read();broken.external_common.find(r=>r.model_id==='ATCF:CMC'&&r.lead_h===24).n--;assert.throws(()=>guidanceEvidence(broken));assert.throws(()=>guidanceEvidence(data,18));
});
for(const file of ['conformal-benchmark.html','results.html'])test(file+' exposes cyclone guidance with a working independent horizon selector',async()=>{
 const html=fs.readFileSync(new URL('../site/'+file,import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:s==='#guidance-lead'?'24':'',checked:s==='#guidance-regions',innerHTML:'',textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;},querySelectorAll(){this.controls=[...this.innerHTML.matchAll(/data-guidance-model="([^"]+)"/g)].map(m=>({dataset:{guidanceModel:m[1]},checked:true,listeners:{},addEventListener(k,f){this.listeners[k]=f;}}));return this.controls;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>asset(url.replace('assets/',''))});
 try{await import('../site/guidance-benchmark.mjs?'+file);await new Promise(r=>setImmediate(r));const table=()=>nodes.get('#guidance-table').innerHTML;for(const m of GUIDANCE_MODELS)assert(table().includes(m.label));assert(table().includes('136.59'));assert(nodes.get('#guidance-scope').textContent.includes('9 common issue / valid-time pairs'));
  assert(!table().includes('CV-F'));assert.equal((nodes.get('#guidance-map').innerHTML.match(/data-guidance-path=/g)||[]).length,5);assert.equal((nodes.get('#guidance-map').innerHTML.match(/data-guidance-region=/g)||[]).length,2);assert(nodes.get('#guidance-detail').innerHTML.includes('ENDPOINT DETAIL'));assert(!nodes.get('#guidance-map').innerHTML.includes('NaN'));
  const initial=nodes.get('#guidance-issue').value;nodes.get('#guidance-prev').listeners.click();assert.notEqual(nodes.get('#guidance-issue').value,initial);nodes.get('#guidance-next').listeners.click();assert.equal(nodes.get('#guidance-issue').value,initial);
  const input=nodes.get('#guidance-models').controls[2];input.checked=false;input.listeners.change();assert.equal((nodes.get('#guidance-map').innerHTML.match(/data-guidance-path=/g)||[]).length,4);input.checked=true;input.listeners.change();
  nodes.get('#guidance-regions').checked=false;nodes.get('#guidance-regions').listeners.change();assert(!nodes.get('#guidance-map').innerHTML.includes('data-guidance-region='));
  nodes.get('#guidance-lead').value='72';nodes.get('#guidance-lead').listeners.change();assert(table().includes('245.59'));assert(table().includes('62.85'));assert(nodes.get('#guidance-scope').textContent.includes('+72h · 8 common'));assert(html.includes('archive does not contain comparable conformal position regions'));assert(html.includes('algorithm-live.html#verification'));assert(nodes.get('#guidance-map-note').textContent.includes('Retrospective replay'));
 }finally{Object.assign(globalThis,saved);}
});
