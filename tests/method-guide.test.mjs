import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {canonicalMethod,methodInfo,filterMethods,horizonRows} from '../site/method-guide-engine.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+name,import.meta.url))),data=read('prediction-method-guide.json'),site=read('champi-2026.json');
test('every actual local and raw-aid product has a unique explanation, preserving TECHNUM',()=>{
 assert.equal(data.local_count,21);assert.equal(data.aid_count,86);assert.equal(new Set(data.catalog.map(r=>r.id)).size,data.catalog.length);
 for(const path of site.paths){const id=canonicalMethod(path.model_id),info=methodInfo(data.catalog,path.model_id);assert.equal(info.id,id);assert(!info.idea.includes('暂未加入'));assert(info.difference);}
 assert.equal(canonicalMethod('ATCF:AP03 / TECHNUM 03'),'ATCF:AP03');
 assert(methodInfo(data.catalog,'TabPFN CV-F0').difference.includes('不是Cross Validation'));
 assert(methodInfo(data.catalog,'TabPFN F2 + AlongCross fixed shrink').difference.includes('λ=0'));
});
test('unresolved and intensity-purpose aids retain uncertainty and shared-family roles',()=>{
 for(const id of ['NC00','NEMN','NP01','NP20'])assert.equal(methodInfo(data.catalog,'ATCF:'+id).identity_status,'unresolved');
 assert(methodInfo(data.catalog,'ATCF:CHP2').difference.includes('语义冲突'));
 assert.equal(methodInfo(data.catalog,'ATCF:CHIP').independent_track,false);
 assert.equal(filterMethods(data.catalog,'local').length,21);assert.equal(filterMethods(data.catalog,'external').length,86);
 assert.equal(filterMethods(data.catalog,'external','AP01').length,1);assert.throws(()=>filterMethods(data.catalog,'fake'));
});
test('horizon diagnostics distinguish available from paired origins and marginal from joint coverage',()=>{
 const all=horizonRows(data.diagnostics,'champi',24),paired=horizonRows(data.diagnostics,'champi',24,true);
 assert(all.every(r=>r.n===27));assert(paired.every(r=>r.n===19));assert(paired.every(r=>r.marginal_coverage90==null));
 const b=all.find(r=>r.method==='TabPFN CV-F2'),c0=all.find(r=>r.method.endsWith('+ C0')),c1=all.find(r=>r.method.endsWith('+ C1'));
 assert(c0.mean_error_km<c1.mean_error_km&&c1.mean_error_km<b.mean_error_km);assert.equal(c1.marginal_coverage90,1);
 assert(data.diagnostics.marginal24_efficiency.find(r=>r.phase==='test'&&r.candidate.endsWith(' + C1')).ratio_ci95[1]>1);
 assert.throws(()=>horizonRows(data.diagnostics,'validation',24));
});
test('actual guide module renders catalog search, paired horizons and explicit geometry limitations',async()=>{
 const html=fs.readFileSync(new URL('../site/champi.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:s==='#method-kind'?'local':s==='#method-query'?'':s==='#guide-phase'?'champi':'24',checked:false,innerHTML:'',textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>{assert.equal(url,'assets/prediction-method-guide.json');return {ok:true,json:async()=>data};};
 try{await import('../site/method-guide.mjs?integration');await new Promise(resolve=>setImmediate(resolve));
  assert.equal((nodes.get('#method-rows').innerHTML.match(/<tr>/g)||[]).length,21);
  nodes.get('#method-kind').value='external';nodes.get('#method-query').value='ATCF:CHP2';nodes.get('#method-query').listeners.input();
  assert.equal((nodes.get('#method-rows').innerHTML.match(/<tr>/g)||[]).length,1);assert(nodes.get('#method-rows').innerHTML.includes('语义冲突'));
  assert(nodes.get('#guide-horizon-rows').innerHTML.includes('118.9'));
  nodes.get('#guide-paired').checked=true;nodes.get('#guide-paired').listeners.change();assert(nodes.get('#guide-horizon-rows').innerHTML.includes('108.0'));assert(nodes.get('#guide-horizon-rows').innerHTML.includes('未在该配对子集重算'));
  nodes.get('#guide-lead').value='72';nodes.get('#guide-lead').listeners.change();assert(nodes.get('#guide-efficiency').textContent.includes('仅针对24h终点'));
  assert(html.includes('固定24h真实椭圆实验'));assert(html.includes('不是真实预测区域'));
 }finally{Object.assign(globalThis,saved);}
});
