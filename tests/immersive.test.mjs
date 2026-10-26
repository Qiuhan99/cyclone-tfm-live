import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {selectedEvidence} from '../site/results-engine.mjs';
import {storyFrame,chapterIndex,CHAPTERS} from '../site/immersive-engine.mjs';
import {issuedBoundary} from '../site/atlas-engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../site/assets/'+n,import.meta.url)));
const bundle=read('feedback-showcase.json'),evidence=selectedEvidence(bundle.selection,bundle.endpoint,bundle.atlas);
test('story reveals original archived paths and region projections in order without changing their numbers',()=>{
 const before=JSON.stringify(bundle);
 for(const c of evidence.cases)for(let chapter=0;chapter<CHAPTERS.length;chapter++){
  const f=storyFrame(evidence,c.storm_id,chapter);assert.equal(f.base,c.origin.paths.tabpfn);assert.equal(f.feedback,c.origin.paths.rolling_c1);assert.equal(f.baseError,c.origin.errors.tabpfn[3]);assert.equal(f.feedbackError,c.origin.errors.rolling_c1[3]);
  assert.deepEqual(f.baseRegion,issuedBoundary(c.origin,'tabpfn',24,90));assert.deepEqual(f.feedbackRegion,issuedBoundary(c.origin,'rolling_c1',24,90));assert.equal(f.scope,'SELECTED_RETROSPECTIVE_ILLUSTRATION');assert.equal(f.regionScope,'ORIGINAL_JOINT_PATH_REGION_PROJECTION');assert.equal(f.layers.truth,chapter>=2);assert.equal(f.layers.feedback,chapter>=3);assert.equal(f.layers.regions,chapter>=4);assert.equal(f.layers.residual,chapter===2);assert(f.c.storm.track.filter(p=>Date.parse(p.time)<=Date.parse(f.o.issue)).length>=f.past.length);
 }
 assert.equal(JSON.stringify(bundle),before);assert.throws(()=>storyFrame(evidence,'not-a-case'));assert.throws(()=>storyFrame(evidence,evidence.cases[0].storm_id,7));assert.equal(chapterIndex(-1),0);assert.equal(chapterIndex(9),6);
});
for(const file of ['index.html','research-briefing.html'])test(file+' renders the staged map, preserves evidence scope and supports presentation navigation',async()=>{
 const html=fs.readFileSync(new URL('../site/'+file,import.meta.url),'utf8'),nodes=new Map(),bodyClasses=new Set(),saved={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch};let reduced=false;
 const win={innerHeight:900,scrollY:0,listeners:{},matchMedia:q=>({matches:q.includes('reduced-motion')&&reduced}),requestAnimationFrame:f=>f(),addEventListener(k,f){this.listeners[k]=f;},scrollTo(options){this.lastScroll=options;this.scrollY=options.top;}};
 const make=s=>{if(!nodes.has(s)){const id=s.slice(1);assert(s==='.research-scene'?html.includes('class="research-scene"'):html.includes(`id="${id}"`),s);nodes.set(s,{value:'',innerHTML:'',textContent:'',disabled:true,hidden:true,attrs:{},listeners:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,f){this.listeners[k]=f;},getBoundingClientRect(){const i=CHAPTERS.indexOf(id),top=(i<0?0:i*900)-win.scrollY;return {top,bottom:top+900,height:900};},querySelectorAll(){return rail;}});}return nodes.get(s);};
 const rail=CHAPTERS.map((_,i)=>({dataset:{chapter:String(i)},attrs:{},listeners:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,f){this.listeners[k]=f;}}));
 const documentListeners={};globalThis.window=win;globalThis.document={body:{classList:{toggle(k,on){on?bodyClasses.add(k):bodyClasses.delete(k);}}},querySelector:make,getElementById:id=>make('#'+id),querySelectorAll:()=>[],addEventListener(k,f){documentListeners[k]=f;}};globalThis.fetch=async url=>({ok:true,json:async()=>read(url.replace('assets/',''))});
 try{await import('../site/immersive.mjs?'+file);await new Promise(r=>setImmediate(r));const svg=()=>make('#story-map').innerHTML;
  assert(!make('#present-toggle').disabled);assert(!svg().includes('data-story-path="truth"'));assert(!svg().includes('data-story-path="base"'));assert(make('#story-evidence').innerHTML.includes('19.0%'));assert(make('#story-evidence').innerHTML.includes('13.2%'));assert(html.includes('outcome-selected storms'));assert(html.includes('original frozen 90% joint-path region projections'));
  const go=i=>rail[i].listeners.click({preventDefault(){}});go(1);assert(svg().includes('data-story-path="base"'));assert(!svg().includes('data-story-path="truth"'));assert(!make('#story-readout').innerHTML.includes('endpoint error'));
  go(2);assert(svg().includes('data-story-vector="residual"'));assert(!svg().includes('data-story-path="feedback"'));go(3);assert(svg().includes('data-story-vector="correction"'));assert(make('#story-readout').innerHTML.includes('108.7'));assert(make('#story-readout').innerHTML.includes('47.5'));
  go(4);assert.equal((svg().match(/data-story-region=/g)||[]).length,2);assert(!svg().includes('NaN'));make('#present-toggle').listeners.click();assert(bodyClasses.has('is-presenting'));assert.equal(make('#present-dock').hidden,false);
  documentListeners.keydown({key:'ArrowRight',target:{},preventDefault(){}});assert.equal(make('#present-position').textContent,'05 / 06');documentListeners.keydown({key:'ArrowRight',target:{closest:()=>true},preventDefault(){}});assert.equal(make('#present-position').textContent,'05 / 06');
  documentListeners.keydown({key:'Escape',target:{},preventDefault(){}});assert(!bodyClasses.has('is-presenting'));assert(make('#present-dock').hidden);
  reduced=true;go(0);assert.equal(win.lastScroll.behavior,'auto');win.scrollY=900*6;win.listeners.scroll();assert.equal(make('#present-position').textContent,'06 / 06');
  make('#story-case').value=evidence.cases.find(c=>c.name==='GAEMI').storm_id;make('#story-case').listeners.change();assert(make('#story-map').attrs['aria-label'].includes('GAEMI'));
  assert(html.includes('results.html'));assert(html.includes('conformal-benchmark.html#guidance-benchmark'));assert(html.includes('algorithm-live.html#verification'));
 }finally{Object.assign(globalThis,saved);}
});
