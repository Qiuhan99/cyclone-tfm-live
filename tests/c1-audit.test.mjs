import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url))),A=read('c1-pipeline-audit.json');
test('cold C0/C1 audit preserves hashes and reconstruction, rather than editing negative results',()=>{
 assert.equal(A.numerical_checks.length,4);assert(A.numerical_checks.every(r=>r.input_hash_parity&&r.max_cold_cache_km===0&&r.max_other_query_perturbation_km===0&&r.max_single_batch_km<.001));assert(A.geometry_checks.every(r=>r.rows===4010&&r.max_reconstruction_error_km<1e-6));assert(A.lag_maturity_passed);
 const r=A.coverage_intervals.find(r=>r.variant==='shared_cv'&&r.phase==='test'&&r.regime==='motion_change'&&r.model_id==='TabPFN CV-F2 + C1');assert.equal(r.covered,45);assert.equal(r.n,48);assert.equal(r.storms,21);assert(r.coverage_ci95[0]<.9&&r.coverage_ci95[1]>=.9);
 assert(A.coverage_intervals.filter(r=>r.phase==='champi').every(r=>r.coverage_ci95===null));
});
test('actual audit module distinguishes current frozen-rank pilot from original PI+ reference',async()=>{
 const html=fs.readFileSync(new URL('../site/conformal-benchmark.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{textContent:'',innerHTML:''});return nodes.get(s);}};globalThis.fetch=async()=>({ok:true,json:async()=>A});
 try{await import('../site/c1-audit.mjs?test');await new Promise(r=>setImmediate(r));assert(nodes.get('#c1-audit-finding').textContent.includes('冻结2016'));assert(nodes.get('#c1-audit-finding').textContent.includes('PI+'));assert(nodes.get('#c1-audit-coverage').textContent.includes('45/48'));assert(nodes.get('#c1-audit-coverage').textContent.includes('不能仅凭该子集'));assert(nodes.get('#c1-original-evidence').innerHTML.includes('0.794×'));assert(nodes.get('#c1-original-evidence').innerHTML.includes('60 / 5'));}
 finally{Object.assign(globalThis,saved);}
});
