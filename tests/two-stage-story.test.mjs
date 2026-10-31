import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('English story renders published evidence and keeps storm, horizon and layer controls aligned', async()=>{
 const html=fs.readFileSync(new URL('../site/two-stage.html',import.meta.url),'utf8');
 assert.match(html,/<html lang="en">/);assert(!/[\u4e00-\u9fff]/.test(html));
 const saved={document:globalThis.document,fetch:globalThis.fetch};
 const nodes=new Map();
 const node=id=>{assert(html.includes(`id="${id}"`),id);if(!nodes.has(id))nodes.set(id,{value:id==='lead'?'72':'',checked:['base','corrected'].includes(id),disabled:false,innerHTML:'',textContent:'',events:{},addEventListener(k,fn){this.events[k]=fn;}});return nodes.get(id);};
 const buttons=['INFA_2026','CHAMPI_2026'].map(storm=>({dataset:{storm},events:{},setAttribute(k,v){this[k]=v;},addEventListener(k,f){this.events[k]=f;}}));
 globalThis.document={getElementById:node,querySelectorAll:()=>buttons};
 globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../site/'+path,import.meta.url)))});
 try{
  await import('../site/two-stage-story.mjs?interaction-test');
  assert.equal(node('hero-gain').textContent,'18.5%');assert.equal((node('ledger-rows').innerHTML.match(/<tr>/g)||[]).length,7);
  assert.equal(node('load-status').textContent,'');assert.equal(node('truth').disabled,true);assert.match(node('map-name').textContent,/IN-FA/);
  assert(node('track-map').innerHTML.includes('stroke="#efb779"'));assert(node('track-map').innerHTML.includes('stroke="#72d8c2"'));
  buttons[1].events.click();assert.equal(buttons[1]['aria-pressed'],'true');assert.equal(node('truth').checked,false);assert.equal(node('truth').disabled,false);
  assert.match(node('map-name').textContent,/CHAMPI · 22 Oct, 00:00 UTC/);
  const oldMap=node('track-map').innerHTML;node('truth').checked=true;node('truth').events.change();assert.notEqual(node('track-map').innerHTML,oldMap);assert(node('track-map').innerHTML.includes('stroke="#d9c6dc"'));
  node('base').checked=false;node('base').events.change();assert(!node('track-map').innerHTML.includes('stroke="#efb779"'));
  node('lead').value='24';node('lead').events.change();assert.match(node('map-name').textContent,/\+24h/);
  node('issue').value='0';node('issue').events.change();assert(!node('map-name').textContent.includes('22 Oct, 00:00'));
  buttons[0].events.click();assert.equal(node('truth').checked,false);assert.equal(node('truth').disabled,true);
 }finally{Object.assign(globalThis,saved);}
});
test('electricity distribution metric card traces to the shared manifest asset',async()=>{
 const el=JSON.parse(fs.readFileSync(new URL('../site/assets/electricity-distribution-results.json',import.meta.url),'utf8'));
 assert.equal(el.dataset,'electricity');assert.equal(el.n_series,321);
 assert.equal(el.native_distribution.crps_mean.base,86.3231);
 assert.equal(el.native_distribution.crps_mean.corrected,61.5875);
 assert.equal(el.native_distribution.crps_mean.rel_reduction_pct,28.65);
 assert.equal(el.native_distribution.paired_diff,-24.7356);
 assert.deepEqual(el.native_distribution.paired_diff_ci||el.native_distribution.ci95,[-40.9276,-13.5429]);
 assert.equal(el.native_distribution.per_variable.strictly_better,314);
 assert.equal(el.native_distribution.per_variable.tied,1);
 assert.equal(el.native_distribution.per_variable.worse,6);
 assert.equal(el.conformal.point_cp_90.halfwidth_reduction_pct,21.34);
 assert.ok(!('coverage_claim' in el.conformal),'no coverage non-inferiority claim');
 const html=fs.readFileSync(new URL('../site/two-stage.html',import.meta.url),'utf8');
 assert(html.includes('metric-electricity'),'metric card container present');
});
