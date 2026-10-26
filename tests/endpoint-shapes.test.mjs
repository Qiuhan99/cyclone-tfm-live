import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {shapeSummary,shapeComparisons,issuedShapes,shapeBoundary,shapeObservations,shapeTruth} from '../site/endpoint-shapes-engine.mjs';
import {distance} from '../site/engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url))),data=read('endpoint24-shapes.json');
test('six paired cells preserve actual 24h counts, point centers and matched cohorts',()=>{
 for(const phase of ['test','champi']){const rows=shapeSummary(data,phase);assert.equal(rows.length,6);assert(rows.every(r=>r.n===(phase==='test'?169:27)));
  for(const m of data.config.methods){const a=rows.filter(r=>r.model_id===m);assert.equal(a[0].mean_error_km,a[1].mean_error_km);}
  const c=shapeComparisons(data,phase);assert.equal(c.length,9);assert(c.every(r=>r.base_attained===r.candidate_attained));
  if(phase==='champi')assert(c.every(r=>r.ratio_ci95===null));else assert(c.every(r=>r.ratio_ci95[0]<1&&r.ratio_ci95[1]>1));
 }
 const r=data.regions[0],pair=issuedShapes(data,r.issue_time_utc,r.model_id,r.level);assert.equal(pair.length,2);assert.equal(pair[0].lat_deg,pair[1].lat_deg);assert.equal(pair[0].lon_deg,pair[1].lon_deg);
});
test('map uses genuine spherical issued ellipse, not matched scales or enclosing circle',()=>{
 const r=data.regions.find(r=>r.shape==='ellipse'&&r.level===90),boundary=shapeBoundary(r);assert.equal(boundary.length,145);assert(boundary.flat().every(Number.isFinite));
 const radii=boundary.map(p=>distance([r.lat_deg,r.lon_deg],p));assert(Math.max(...radii)>1.1*Math.min(...radii));
 const circle=data.regions.find(x=>x.id===r.id&&x.model_id===r.model_id&&x.level===90&&x.shape==='circle');
 for(const p of shapeBoundary(circle))assert(Math.abs(distance([circle.lat_deg,circle.lon_deg],p)-circle.q)<1e-7);
 assert.deepEqual(shapeBoundary({...r,q:null}),[]);
 assert(shapeObservations(data,r.issue_time_utc).every(p=>Date.parse(p.valid_time_utc)<=Date.parse(r.issue_time_utc)));
 assert.equal(shapeTruth(data,r.valid_time_utc),undefined);
 assert(shapeTruth(data,r.valid_time_utc,true));
});
test('actual page module switches cohorts, levels, shapes and truth without altering issued data',async()=>{
 const html=fs.readFileSync(new URL('../site/champi-research.html',import.meta.url),'utf8'),nodes=new Map(),saved={document:globalThis.document,fetch:globalThis.fetch};
 const values={'#shape-phase':'test','#shape-level':'90','#shape-mode':'both'};
 globalThis.document={querySelector(s){assert(html.includes(`id="${s.slice(1)}"`),s);if(!nodes.has(s))nodes.set(s,{value:values[s]??'',checked:false,innerHTML:'',textContent:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;}});return nodes.get(s);}};
 globalThis.fetch=async url=>({ok:true,json:async()=>url==='assets/endpoint24-shapes.json'?data:read('coastline.json')});
 try{await import('../site/endpoint-shapes.mjs?integration');await new Promise(r=>setImmediate(r));
  assert.equal((nodes.get('#shape-results').innerHTML.match(/<tr>/g)||[]).length,6);assert.equal((nodes.get('#shape-comparisons').innerHTML.match(/<tr>/g)||[]).length,9);
  assert(nodes.get('#shape-map').innerHTML.includes('椭圆')===false);assert(nodes.get('#shape-map').innerHTML.includes('ellipse · 90%'));
  assert(nodes.get('#shape-map-note').textContent.includes('真值已隐藏'));
  nodes.get('#shape-phase').value='champi';nodes.get('#shape-phase').listeners.change();assert(nodes.get('#shape-results').innerHTML.includes('27/27'));assert(nodes.get('#shape-conclusion').textContent.includes('单场27'));
  nodes.get('#shape-level').value='80';nodes.get('#shape-level').listeners.change();assert(nodes.get('#shape-map').innerHTML.includes('ellipse · 80%'));
  nodes.get('#shape-mode').value='ellipse';nodes.get('#shape-mode').listeners.change();assert(!nodes.get('#shape-map').innerHTML.includes('circle · 80%'));
  nodes.get('#shape-issue').value=data.regions[0].issue_time_utc;nodes.get('#shape-hindsight').checked=true;nodes.get('#shape-hindsight').listeners.change();assert(nodes.get('#shape-map').innerHTML.includes('事后24h真值'));
  assert(html.includes('endpoint-shapes.mjs'));assert(html.includes('官方当前风圈'));
 }finally{Object.assign(globalThis,saved);}
});
