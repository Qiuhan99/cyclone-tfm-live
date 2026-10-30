import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('real two-stage bundle uses exact addition, actual source hashes and unscored live targets',()=>{
 const d=JSON.parse(fs.readFileSync(new URL('../site/assets/two-stage-0a.json',import.meta.url)));
 assert.equal(d.storms.CHAMPI_2026.cycles.length,9);assert.equal(d.storms.INFA_2026.cycles.length,1);
 for(const storm of Object.values(d.storms))for(const c of storm.cycles)for(const r of c.residual_explorer){assert(Math.abs(r.mu_base_lat+r.r_hat_lat-r.corrected_lat)<1e-12);assert(Math.abs(r.mu_base_lon+r.r_hat_lon-r.corrected_lon)<1e-12);assert.equal(r.conformal_status,'not_calibrated');}
 assert(!d.endpoint_scores.some(r=>r.storm_id==='INFA_2026'));
 assert(d.paired_summary.some(r=>r.mean_improvement_km<0));
 assert(d.factorial_summary.some(r=>r.method==='T3'&&r.storms>1));
 for(const s of Object.values(d.storms))for(const v of Object.values(s.sources)){assert.equal(v.http_status,'200');assert.match(v.sha256,/^[a-f0-9]{64}$/);assert(v.bytes>0);}
});
test('actual UI changes storms, issues, leads, layers and hides future truth by default',async()=>{
 const html=fs.readFileSync(new URL('../site/two-stage-archive.html',import.meta.url),'utf8'),nodes=new Map();
 const keys=['document','window','location','fetch','setInterval','clearInterval'];const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const values={'ts-storm':'INFA_2026','ts-lead':'72','ts-zone':'Asia/Shanghai','ts-event':'both','ts-external':'none','ts-issue':'0','ts-factorial':'2024_multi_storm'};
 globalThis.document={querySelector(id){const key=id.slice(1);assert(html.includes(`id="${key}"`),id);if(!nodes.has(id))nodes.set(id,{value:values[key]??'',checked:['ts-base','ts-corr'].includes(key),innerHTML:'',textContent:'',disabled:false});return nodes.get(id);}};
 globalThis.window={};globalThis.location={search:''};globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../site/'+url,import.meta.url)))});globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 try{await import('../site/two-stage.mjs?contract-integration');
  const get=k=>nodes.get('#'+k);assert(get('ts-map').innerHTML.includes('data-model="T0"'));assert(get('ts-map').innerHTML.includes('data-model="T1"'));assert(!get('ts-map').innerHTML.includes('data-realized-future'));assert(get('ts-truth').disabled);assert(get('ts-residuals').innerHTML.includes('pending'));
  get('ts-storm').value='CHAMPI_2026';get('ts-storm').onchange();assert.equal(get('ts-mode').value,'replay');assert.equal(get('ts-truth').checked,false);assert(!get('ts-truth').disabled);
  get('ts-issue').value='5';get('ts-issue').onchange();assert(get('ts-status').textContent.includes('10/22'));assert(!get('ts-map').innerHTML.includes('data-realized-future'));
  get('ts-truth').checked=true;get('ts-truth').onchange();assert(get('ts-map').innerHTML.includes('data-realized-future'));
  get('ts-base').checked=false;get('ts-base').onchange();assert(!get('ts-map').innerHTML.includes('data-model="T0"'));
  get('ts-lead').value='24';get('ts-lead').onchange();assert(get('ts-map-title').textContent.includes('+24h'));
  get('ts-factorial').value='CHAMPI_2026';get('ts-factorial').onchange();assert(get('ts-factorial-table').innerHTML.includes('T3'));
 }finally{for(const k of keys){if(saved[k]===undefined)delete globalThis[k];else globalThis[k]=saved[k];}}
});
