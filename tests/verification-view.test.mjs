import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {OWN,verified} from '../site/algorithm-engine.mjs';
import {historicalRows,historicalPair,historicalScores,evaluationMode} from '../site/verification-view-engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url)));
test('hindcast produces actual scored pairs at all leads without converting them into prospective records',()=>{
 const d=read('direct-hindcast-verification.json'),live=read('champi-operations.json'),before=JSON.stringify(live.verification);
 for(const [h,n] of [[6,30],[12,29],[24,27],[48,23],[72,19]]){
  const pair=historicalPair(d,OWN[1],OWN[0],h);assert.equal(pair.n,n);assert(Number.isFinite(pair.own)&&Number.isFinite(pair.other));
  for(const row of historicalScores(d,OWN,h,90)){assert.equal(row.n,n);assert.equal(row.regionN,n);assert(row.area>0);}
 }
 assert.equal(historicalPair(d,OWN[1],'ATCF:CMC',24).n,9);
 assert.equal(historicalPair(d,OWN[1],'Chronos-2',24).n,27);
 assert.equal(historicalPair(d,OWN[1],'CMA / BABJ',24).n,0);
 assert.equal(JSON.stringify(live.verification),before);
 assert.equal(verified({records:[],truths:{}},24).length,0);
 const bad=structuredClone(d);bad.rows.push(bad.rows[0]);assert.throws(()=>historicalRows(bad,bad.rows[0].lead_h));
});
test('auto mode uses completed hindcast while a public pair is pending and switches when both genuine forecasts score',()=>{
 const r={storm_id:'CHAMPI_2026',issue_time_utc:'2026-10-26T00:00:00Z',valid_time_utc:'2026-10-27T00:00:00Z',lead_h:24,lat_deg:30,lon_deg:130,
  eligible:true,recorded_at_utc:'2026-10-26T17:00:00Z',confirmed_at_utc:'2026-10-26T18:00:00Z'};
 const l={records:OWN.map(model_id=>({...r,model_id})),truths:{}};
 assert.equal(evaluationMode('auto',l,24,Date.parse('2026-10-26T20:00:00Z')),'hindcast');
 assert.equal(evaluationMode('prospective',l,24),'prospective');
 l.truths['2026-10-27T00:00:00+00:00']={lat_deg:30,lon_deg:130,first_seen_at_utc:'2026-10-27T01:00:00Z'};
 assert.equal(evaluationMode('auto',l,24,Date.parse('2026-10-27T02:00:00Z')),'prospective');
});
test('full-cohort evidence distinguishes position loss, issued area and matched geometric-mean area',async()=>{
 const {comparisonEvidence}=await import('../site/model-comparison-engine.mjs');const d=read('direct-vector-feedback.json');
 const a=comparisonEvidence(d,'test',24).assessment;assert(a.maeDeltaKm>10);assert(a.coverageGapDeltaPp<0);assert(a.issuedAreaRatio<1);assert(a.matchedAreaRatio<1);assert(a.matchedAreaCI[0]<1&&a.matchedAreaCI[1]>1);
 const b=comparisonEvidence(d,'champi',24).assessment;assert(b.maeDeltaKm<0);assert(b.issuedAreaRatio<1);assert(b.matchedAreaRatio>1);assert.equal(b.matchedAreaCI,null);
});
