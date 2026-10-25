import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {operationalState,futurePoints} from '../site/operations-engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../site/assets/champi-operations.json',import.meta.url)));
test('public checks and model generation are independent clocks',()=>{
 const now=Date.parse(data.last_checked_at_utc)+86400000,checked=new Date(now).toISOString();
 const refreshed={...data,last_checked_at_utc:checked,public_data_generated_at_utc:checked};
 const state=operationalState(refreshed,now);assert.equal(state.watcherStale,false);assert.equal(state.forecastStale,true);
 assert.equal(refreshed.model.input_last_valid_utc,data.model.input_last_valid_utc);
 for(const p of data.model.paths)assert(futurePoints(p,now).every(q=>Date.parse(q.valid_time_utc)>now));
});
test('public entry reuses existing live and research modules without unpublished archive links',()=>{
 const html=fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert(html.includes('operations.mjs')&&html.includes('endpoint-shapes.mjs')&&html.includes('method-guide.mjs'));
 assert(html.includes('PUBLIC / RESEARCH'));assert(!html.includes('cases.html'));assert(!html.includes('00_REPOSITORY_AUDIT'));
 assert(html.includes('Qiuhan99/cyclone-tfm-live'));
 assert(fs.readFileSync(new URL('../site/champi.html',import.meta.url),'utf8')===html);
});
