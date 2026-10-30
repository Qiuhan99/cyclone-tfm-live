import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=()=>JSON.parse(fs.readFileSync(new URL('../site/assets/two-stage-0a-v2.json',import.meta.url)));
test('v2 reports only completed rolling inference and preserves negative results and pending full-run status',()=>{
 const d=read();assert.equal(d.rolling_complete,true);assert.equal(d.rolling_oos_origins,320);assert.equal(d.rolling_oos_rows,320);
 assert(d.rolling_paired_summary.some(r=>r.mean_improvement_km<0));
 assert.equal(d.full_reproduction_complete,false);assert.equal(d.full_reproduction.legacy_prediction_arrays_used,false);
 assert(!('fresh_full_rmse' in d));assert.equal(d.independent_identities.INFA_2026.SID,'2026297N11166');
 for(const r of d.rolling_forecasts){assert(Math.abs(r.mu_base_lat+r.r_hat_lat-r.corrected_lat)<1e-12);assert(Math.abs(r.mu_base_lon+r.r_hat_lon-r.corrected_lon)<1e-12);}
 assert(d.multistorm_turn_summary.every(r=>r.storms===26&&r.issuances===78));
 assert(d.multistorm_turn_summary.some(r=>r.false_positive>r.true_positive));
 for(const r of d.multistorm_turn_summary)for(const k of ['precision','recall'])if(r[k+'_raw_degenerate_bootstrap'])assert.equal(r[k+'_ci95'],null);
 assert(!JSON.stringify(d).includes('/Users/'));
 const live=d.infa_live_update;assert.equal(live.native_marginal_calls,4);assert.equal(live.forecast_hash_verified,true);
 assert(live.forecasts.every(r=>r.prospective_at_creation&&r.verification_status==='pending'));
 const verified=live.verification_06z.filter(r=>r.status==='verified'&&r.prospective_at_creation);assert(verified.length>=1);assert(verified.every(r=>['v1','v2'].includes(r.version)));
});
test('actual v2 panel follows selected issue and keeps independent CMA analyses separate from model forecasts',async()=>{
 const html=fs.readFileSync(new URL('../site/two-stage-archive.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch};
 const defaults={'ts-storm':'CHAMPI_2026','ts-issue':'5','ts-lead':'72','ts-zone':'Asia/Shanghai'};
 globalThis.window={};globalThis.document={querySelector(s){const key=s.slice(1);assert(html.includes(`id="${key}"`),key);if(!nodes.has(s))nodes.set(s,{value:defaults[key]??'',textContent:'',innerHTML:''});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../site/'+url,import.meta.url)))});
 try{await import('../site/two-stage-v2.mjs?actual-integration');const get=k=>nodes.get('#'+k);
  assert(get('v2-map').innerHTML.includes('data-v2-model="T0"'));assert(get('v2-map').innerHTML.includes('data-v2-model="T1"'));
  assert(!get('v2-map').innerHTML.includes('realized-future'));assert(get('v2-paired').innerHTML.includes('class="loss"'));
  assert(get('v2-full-status').textContent.includes('尚未完成'));assert(get('v2-cma').textContent.includes('未用这条分析改写'));
  const old=get('v2-map').innerHTML;get('ts-lead').value='6';globalThis.window.renderTwoStageV2();assert.notEqual(get('v2-map').innerHTML,old);
  const predictions=get('v2-residuals').innerHTML;get('ts-truth').checked=true;globalThis.window.renderTwoStageV2();
  assert(get('v2-map').innerHTML.includes('data-v2-layer="realized-future"'));assert(get('v2-truth-note').textContent.includes('不进入模型输入'));assert.equal(get('v2-residuals').innerHTML,predictions);
  get('ts-truth').checked=false;globalThis.window.renderTwoStageV2();assert(!get('v2-map').innerHTML.includes('realized-future'));
  get('ts-truth').checked=true;
  get('ts-storm').value='INFA_2026';get('ts-issue').value='0';globalThis.window.renderTwoStageV2();assert(get('v2-residuals').innerHTML.includes('不计前瞻'));
  assert(!get('v2-map').innerHTML.includes('realized-future'));
  assert.equal(get('v2-infa-live').hidden,false);assert(get('v2-live-verified').textContent.includes('N=1'));assert(get('v2-live-points').innerHTML.includes('pending'));
  assert(get('v2-turns').innerHTML.includes('26 / 78'));
 }finally{Object.assign(globalThis,saved);}
});
