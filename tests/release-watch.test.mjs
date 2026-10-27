import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {releaseDecision,watchRelease} from '../site/release-watch.mjs';
test('stale HTML redirects with a fresh release key, preserving chapter and limiting reload attempts',()=>{
 const href='https://qiuhan99.github.io/cyclone-tfm-live/index.html?v=c37bc59#formulation',v={version:'20261027-verify2'};
 const d=releaseDecision('old',v,href,null);assert.equal(d.action,'reload');assert(d.url.includes('v=20261027-verify2'));assert(d.url.endsWith('#formulation'));
 assert.equal(releaseDecision('old',v,href,v.version).action,'notice');assert.equal(releaseDecision(v.version,v,href,null).action,'current');
 assert.equal(releaseDecision('old',{version:'<script>'},href,null).action,'current');
 assert.equal(releaseDecision('20261027-verify3',v,href,null).action,'current');
 assert.equal(releaseDecision('old',v,d.url,null).action,'notice');
});
test('uncached release check runs again on a back-forward-cache restore',async()=>{
 const handlers={},store=new Map(),calls=[];let replaced;
 const win={location:{pathname:'/index.html',href:'https://example.test/index.html#formulation',replace:u=>replaced=u},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},addEventListener:(k,f)=>handlers[k]=f,setInterval(){}};
 const doc={documentElement:{dataset:{siteVersion:'old'}},getElementById:()=>null};
 await watchRelease(win,doc,async(url,opts)=>{calls.push(opts);return {ok:true,json:async()=>({version:'current'})};});assert(replaced.includes('v=current'));assert.equal(calls[0].cache,'no-store');
 await handlers.pageshow();assert.equal(calls.length,2);
});
test('published entry templates declare the current version and direct first-stage formula',()=>{
 const version=fs.readFileSync(new URL('../SITE_VERSION',import.meta.url),'utf8').trim();
 for(const file of ['index.html','research-briefing.html','algorithm-live.html','conformal-benchmark.html']){
  const s=fs.readFileSync(new URL('../site/'+file,import.meta.url),'utf8');assert(s.includes(`data-site-version="${version}"`));assert(s.includes('release-watch.mjs'));assert(s.includes('site-update-notice'));assert(!s.includes('In the CV branch'));
 }
});
test('new chart and evaluation entry points version their changed dependencies',()=>{
 const model=fs.readFileSync(new URL('../site/model-comparison.mjs',import.meta.url),'utf8');
 const live=fs.readFileSync(new URL('../site/algorithm-live.mjs',import.meta.url),'utf8');
 assert(model.includes('model-comparison-engine.mjs?v=verify5'));
 assert(live.includes('verification-view-engine.mjs?v=verify5'));
});
