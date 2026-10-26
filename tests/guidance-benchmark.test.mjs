import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {guidanceEvidence,GUIDANCE_LEADS,GUIDANCE_MODELS} from '../site/guidance-benchmark-engine.mjs';
const read=()=>JSON.parse(fs.readFileSync(new URL('../site/assets/motion-residual.json',import.meta.url)));
test('guidance benchmark preserves the original exact-intersection scores at all five leads',()=>{
 const data=read();
 for(const h of GUIDANCE_LEADS){const e=guidanceEvidence(data,h);assert.equal(e.rows.length,5);assert.equal(e.n,h<=12?10:h===24?9:8);for(const r of e.rows){const source=data.external_common.find(x=>x.model_id===r.id&&x.lead_h===h);assert.equal(r.mae,source.mean_error_km);assert.equal(r.n,source.n);}}
 const e=guidanceEvidence(data,24);assert.equal(e.rows.find(r=>r.id==='ATCF:NGX').mae.toFixed(2),'44.88');assert.equal(e.rows.find(r=>r.id.endsWith('C1')).mae.toFixed(2),'136.59');assert(!GUIDANCE_MODELS.some(m=>m.id.endsWith('C0')));
 const broken=read();broken.external_common.find(r=>r.model_id==='ATCF:CMC'&&r.lead_h===24).n--;assert.throws(()=>guidanceEvidence(broken));assert.throws(()=>guidanceEvidence(data,18));
});
for(const file of ['conformal-benchmark.html','results.html','index.html'])test(file+' exposes cyclone guidance with a working independent horizon selector',async()=>{
 const html=fs.readFileSync(new URL('../site/'+file,import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:'24',innerHTML:'',textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>{assert.equal(url,'assets/motion-residual.json');return {ok:true,json:async()=>read()};};
 try{await import('../site/guidance-benchmark.mjs?'+file);await new Promise(r=>setImmediate(r));const table=()=>nodes.get('#guidance-table').innerHTML;for(const m of GUIDANCE_MODELS)assert(table().includes(m.label));assert(table().includes('136.59'));assert(nodes.get('#guidance-scope').textContent.includes('9 common issue / valid-time pairs'));
  nodes.get('#guidance-lead').value='72';nodes.get('#guidance-lead').listeners.change();assert(table().includes('245.59'));assert(table().includes('62.85'));assert(nodes.get('#guidance-scope').textContent.includes('+72h · 8 common'));assert(html.includes('archive does not contain comparable conformal position regions'));assert(html.includes('algorithm-live.html#verification'));
 }finally{Object.assign(globalThis,saved);}
});
