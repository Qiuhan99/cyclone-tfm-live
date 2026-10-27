import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OWN,comparators} from '../site/algorithm-engine.mjs';
import {pipelinePulse} from '../site/operations-engine.mjs';
import {correctionImpact,analysisRows,deskCycle} from '../site/briefing-engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url)));
function fixture(){const data=read('champi-operations.json'),tsfm=read('tsfm-live-reference.json');data.model.paths=data.model.paths.filter(p=>p.model_family!=='tsfm').concat(tsfm.paths);data.model.tsfm={status:'completed',generated_at_utc:tsfm.generated_at_utc};data.forecast_analysis={paths:data.model.paths.map(p=>({model_id:p.model_id,issue_time_utc:p.issue_time_utc,points:p.points.map(q=>({...q,nearest_coast:{sector:'Test coastal sector',distance_km:25},centre_on_land:false,position_region_coastal_sectors:q.radius_90_km?[{sector:'Test coastal sector'}]:[]}))}))};return data;}
test('source heartbeat, available observation and separate model computations cannot masquerade as a new fix',()=>{
 const data=fixture(),now=Date.parse('2026-10-26T07:00:00Z');data.observations=[{valid_time_utc:'2026-10-26T00:00:00Z',lat_deg:31.4,lon_deg:129}];data.model.input_last_valid_utc='2026-10-26T00:00:00Z';data.last_checked_at_utc='2026-10-26T06:59:00Z';data.inference_refresh={reused_identical_bdeck:true};
 let p=pipelinePulse(data,now);assert.equal(p.state,'awaiting_source');assert.equal(p.latest,data.observations.at(-1).valid_time_utc);assert.equal(p.unchanged,true);assert.equal(p.next,'2026-10-26T06:00:00.000Z');
 data.observations.push({...data.observations.at(-1),valid_time_utc:'2026-10-26T06:00:00Z'});assert.equal(pipelinePulse(data,now).state,'inference_pending');data.last_checked_at_utc='2026-10-25T00:00:00Z';assert.equal(pipelinePulse(data,now).state,'delivery_overdue');
});
test('live impacts preserve larger regions as well as smaller ones and analysis cannot bind to stale coordinates',()=>{
 const data=fixture(),impact=correctionImpact(data,24);assert(impact.shift>0);assert.equal(impact.base.radius_90_km,data.model.paths.find(p=>p.model_id===OWN[0]).points.find(p=>p.lead_h===24).radius_90_km);
 const f72=data.model.paths.find(p=>p.model_id===OWN[1]).points.find(p=>p.lead_h===72);f72.radius_90_km=data.model.paths.find(p=>p.model_id===OWN[0]).points.find(p=>p.lead_h===72).radius_90_km*1.2;const long=correctionImpact(data,72);assert(long.ratio>1);assert.equal(analysisRows(data,OWN[1],24).length,3);
 data.forecast_analysis.paths.find(p=>p.model_id===OWN[1]).issue_time_utc='2026-10-25T00:00:00Z';assert.equal(analysisRows(data,OWN[1],24).length,0);
 const matched=comparators(data,read('tsfm-live-reference.json').issue_time_utc,'matched');assert.equal(matched.filter(p=>p.model_family==='tsfm').length,3);assert(matched.filter(p=>p.model_family==='tsfm').every(p=>p.points.length===12));
});
test('current circle ranks, source clocks and archived SPCI have distinct numerical provenance',()=>{
 const a=read('forecast-desk-audit.json'),issue=a.source_check.public_model_cutoff,stamp=Date.parse(issue),now=stamp+26.5*3600000;
 const d={model:{protocol_id:'direct_vector_feedback_v1',paths:OWN.map(model_id=>({model_id,issue_time_utc:issue,points:a.live_circle_ranks.filter(r=>r.model_id===model_id).map(r=>({lead_h:r.lead_h,valid_time_utc:new Date(stamp+r.lead_h*3600000).toISOString(),lat_deg:30,lon_deg:130,radius_90_km:r.thresholds['90'].q_km,calibration_n:r.n}))}))},observations:[{valid_time_utc:issue}]};const c=deskCycle(d,24,now);
 assert.equal(c.state,'elapsed_awaiting_fix');assert.equal(c.usesSPCI,false);assert.equal(c.protocol,'direct_vector_feedback_v1');assert(c.calibration.every(x=>x.n===100&&x.rank===91));
 assert.equal(deskCycle(d,72,now).state,'future');
 const records=a.live_circle_ranks.filter(r=>r.lead_h===24);assert.equal(records.length,2);
 assert(records.every(r=>r.current_storm_scores===35&&r.historical_scores===65));
 for(const row of records){const q=d.model.paths.find(p=>p.model_id===row.model_id).points.find(p=>p.lead_h===24);assert.equal(q.radius_90_km,row.thresholds['90'].q_km);assert.equal(row.latest_residual_origin,'2026-10-25T00:00:00+00:00');}
 assert(Math.abs(correctionImpact(d,24).ratio-1.2262333562536942)<1e-12);
 assert.equal(a.spci.live_circle_uses_spci,false);assert.equal(a.spci.active_direct_core_uses_spci,false);assert(a.spci.full.rolling_c1.matched_area_ratio_vs_same_family_base>1);
 assert(a.source_check.public_matches_current_source);assert.equal(a.source_check.latest_source_fix,'2026102600');
 d.observations.push({valid_time_utc:c.target});assert.equal(deskCycle(d,24,now).state,'elapsed_with_fix');
});
test('actual briefing renders true TSFM paths, independent clocks, selected historical benefits and model-specific geographic rows',async()=>{
 const data=fixture(),html=fs.readFileSync(new URL('../site/champi.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch,setInterval:globalThis.setInterval},savedNow=Date.now;Date.now=()=>Date.parse(data.model.input_last_valid_utc)+26.5*3600000;
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:s==='#operations-lead'?'24':s==='#motion-phase'?'test':s==='#briefing-model'?OWN[1]:'24',checked:s==='#operations-regions',innerHTML:'',textContent:'',listeners:{},classList:{toggle(){}},addEventListener(k,f){this.listeners[k]=f;},querySelectorAll(){return [...this.innerHTML.matchAll(/data-live-model="([^"]+)"/g)].map(m=>({dataset:{liveModel:m[1]},checked:true,addEventListener(){}}));}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>url.endsWith('champi-operations.json')?data:read(url.replace('assets/',''))});globalThis.setInterval=()=>0;
 try{await import('../site/operations.mjs?forecast-desk');await new Promise(r=>setImmediate(r));assert(nodes.get('#operations-center').innerHTML.includes('LATEST TRACKING FIX / UCAR'));assert(nodes.get('#briefing-clocks').innerHTML.includes('Chronos / Moirai computed'));assert(nodes.get('#briefing-tsfm-state').textContent.includes('3 genuine TSFM'));assert(nodes.get('#operations-models').innerHTML.includes('Chronos-2'));assert(nodes.get('#operations-map').innerHTML.includes('TARGET ELAPSED'));assert(nodes.get('#briefing-evidence').innerHTML.includes('19.0% lower'));assert(nodes.get('#briefing-evidence').innerHTML.includes('selected 4 storms'));assert(nodes.get('#briefing-evidence').innerHTML.includes('SPCI-adapted rectangle'));assert(nodes.get('#briefing-live-impact').innerHTML.includes('not SPCI rectangles'));assert(nodes.get('#briefing-timeline').innerHTML.includes('Test coastal sector'));
  data.model.paths.find(p=>p.model_id===OWN[1]).points.find(p=>p.lead_h===72).radius_90_km=data.model.paths.find(p=>p.model_id===OWN[0]).points.find(p=>p.lead_h===72).radius_90_km*1.2;nodes.get('#operations-lead').value='72';nodes.get('#operations-lead').listeners.change();
  const current=nodes.get('#briefing-live-impact').innerHTML,selected=nodes.get('#briefing-evidence').innerHTML;
  assert(current.includes('Baseline issued 90% area'));assert(current.includes('Feedback issued 90% area'));assert(current.includes('RF / Base issued-area ratio'));assert.equal(nodes.get('#briefing-live-summary').textContent,'Latest available CHAMPI cycle · +72h');assert(nodes.get('#operations-map').innerHTML.includes('FEEDBACK VALID'));assert(selected.includes('· +24h'));assert(selected.includes('Historical results · independent of map lead'));assert(selected.includes('40/44 endpoints'));assert(selected.includes('Full cohort & model comparison'));
  assert(html.includes('<details id="briefing-live-details" class="briefing-cycle-details" open>'));assert(html.indexOf('id="briefing-evidence"')>html.indexOf('id="briefing-live-details"'));assert(html.includes('Archived illustrative gains'));
  nodes.get('#briefing-model').value='Chronos-2';nodes.get('#briefing-model').listeners.change();assert(nodes.get('#briefing-analysis-title').textContent.includes('Chronos-2'));assert(nodes.get('#briefing-timeline').innerHTML.includes('No live calibration'));
  data.forecast_analysis.paths.find(p=>p.model_id==='Chronos-2').issue_time_utc='2025-01-01T00:00:00Z';nodes.get('#briefing-model').listeners.change();assert(nodes.get('#briefing-analysis-summary').textContent.includes('awaiting the latest model snapshot'));
 }finally{Object.assign(globalThis,saved);Date.now=savedNow;}
});
