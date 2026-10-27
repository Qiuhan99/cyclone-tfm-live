import './release-watch.mjs?v=verify4';
import {selectedEvidence} from './results-engine.mjs';
import {storyFrame,chapterIndex,CHAPTERS} from './immersive-engine.mjs?v=folio1';
import {wrap,mercator} from './engine.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=(v,n=1)=>v.toFixed(n);
const time=t=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' UTC';
const titles=['The research question','Base displacement','Error direction','Vector residual feedback','Original position regions','Selected historical evidence','The next public test'];
let E,G,chapter=0,presenting=false,ready=false,scheduled=false;
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches,mobile=()=>window.matchMedia('(max-width: 850px)').matches;
function map(frame){
 const W=1080,H=880,{o,layers:L}=frame,lo0=o.anchor[1],xx=p=>lo0+wrap(p[1]-lo0),xs=frame.extent.map(xx),ys=frame.extent.map(p=>mercator(p[0])),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 let sx=Math.max(6,(Math.max(...xs)-Math.min(...xs))*1.3),sy=Math.max(4,(Math.max(...ys)-Math.min(...ys))*1.3);if(sx/sy<W/H)sx=sy*W/H;else sy=sx*H/W;
 const P=p=>[W/2+(xx(p)-cx)*W/sx,H/2-(mercator(p[0])-cy)*H/sy],line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(v=>v.toFixed(2)).join(',')}`).join(' '),base='#efb779',feedback='#72d8c2',truth='#eee9d7';
 let svg='<defs><clipPath id="notebook-map-clip"><rect width="1080" height="880"/></clipPath><marker id="notebook-correction" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#b6e6d1"/></marker><marker id="notebook-residual" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#e5dac2"/></marker></defs><g clip-path="url(#notebook-map-clip)">';
 for(let la=0;la<=65;la+=5){const [x,y]=P([la,cx]);svg+=`<path d="${line([[la,lo0-80],[la,lo0+80]])}" stroke="#698986" opacity=".12" stroke-dasharray="2 8"/><text x="1050" y="${y-6}" fill="#53706e" text-anchor="end" font-family="ui-monospace,monospace" font-size="9">${la}°N</text>`;}
 for(let lo=70;lo<220;lo+=5)svg+=`<path d="${line([[-5,lo],[70,lo]])}" stroke="#698986" opacity=".1" stroke-dasharray="2 8"/>`;
 for(const ring of G.rings){if(ring.some(([lo,la])=>Math.abs(xx([la,lo])-cx)<sx&&Math.abs(mercator(la)-cy)<sy))svg+=`<path d="${line(ring.map(([lo,la])=>[la,lo]))}Z" fill="#1c3438" fill-opacity=".8" stroke="#55706e" stroke-width=".65"/>`;}
 for(const [name,p] of [['TAIWAN',[23.8,121]],['HAINAN',[19.1,109.7]],['VIETNAM',[21,105.8]],['JAPAN',[36,137]],['PHILIPPINES',[13.1,122]],['KOREA',[36.5,128]],['HONG KONG',[22.3,114.2]]]){const [x,y]=P(p);svg+=`<text x="${x}" y="${y}" fill="#698a84" font-family="ui-monospace,monospace" font-size="10" letter-spacing="1.6">${name}</text>`;}
 if(L.regions)for(const [id,ps,color] of [['base',frame.baseRegion,base],['feedback',frame.feedbackRegion,feedback]])svg+=`<path data-story-region="${id}" class="forecast-appear" d="${line(ps)}Z" fill="${color}" fill-opacity=".05" stroke="${color}" stroke-width="1.35" ${id==='base'?'stroke-dasharray="6 5"':''}><title>${id==='base'?'Base':'Feedback'}: original frozen 90% joint-path region projection</title></path>`;
 svg+=`<path d="${line(frame.past)}" stroke="#8daba6" stroke-width="2.4" fill="none"/>`;
 if(L.truth)svg+=`<path data-story-path="truth" d="${line([o.anchor,...frame.truth])}" stroke="${truth}" stroke-width="1.7" stroke-dasharray="3 6" fill="none" class="forecast-appear"/>`;
 for(const [id,enabled,points,color] of [['base',L.base,frame.base,base],['feedback',L.feedback,frame.feedback,feedback]])if(enabled){const [x,y]=P(points[3]);svg+=`<path data-story-path="${id}" d="${line([o.anchor,...points])}" stroke="${color}" stroke-width="${id==='feedback'?3.3:2.1}" ${id==='base'?'stroke-dasharray="7 4"':''} fill="none" class="forecast-appear"/>`;for(const p of points){const [px,py]=P(p);svg+=`<circle cx="${px}" cy="${py}" r="${p===points[3]?5:2.8}" fill="${color}"/>`;}svg+=`<text x="${x+13}" y="${y+(id==='base'?-15:24)}" fill="${color}" font-family="ui-monospace,monospace" font-size="12">${id==='base'?'BASE':'FEEDBACK'} +24h</text>`;}
 if(L.residual)svg+=`<path data-story-vector="residual" d="${line([frame.base[3],frame.truth[3]])}" fill="none" stroke="#e5dac2" stroke-width="1.7" stroke-dasharray="3 5" marker-end="url(#notebook-residual)"><title>Observed error vector; hindsight illustration</title></path>`;
 if(L.correction)svg+=`<path data-story-vector="correction" d="${line([frame.base[3],frame.feedback[3]])}" fill="none" stroke="#b6e6d1" stroke-width="1.8" marker-end="url(#notebook-correction)"><title>Actual Base-to-feedback correction: ${fmt(frame.correction)} km</title></path>`;
 if(L.truth){const [x,y]=P(frame.truth[3]);svg+=`<path d="M${x-7},${y-7}l14,14m-14,0l14,-14" stroke="${truth}" stroke-width="2.2"/><text x="${x+13}" y="${y-13}" fill="${truth}" font-family="ui-monospace,monospace" font-size="10">OBSERVED +24h</text>`;}
 const [ax,ay]=P(o.anchor);svg+=`<circle class="origin-pulse" cx="${ax}" cy="${ay}" r="12" fill="#93d0b8" opacity=".15"/><circle cx="${ax}" cy="${ay}" r="5" fill="#e7e6cf" stroke="#0a1b22" stroke-width="2"/><text x="${ax+12}" y="${ay+24}" fill="#91b1a6" font-family="ui-monospace,monospace" font-size="9">ISSUE POSITION</text></g>`;
 return svg;
}
function render(){
 const f=storyFrame(E,$('#story-case').value,chapter),L=f.layers;
 $('#story-map').innerHTML=map(f);$('#story-map').setAttribute('aria-label',`${f.c.name} ${f.c.year}, selected historical +24h replay. Chapter ${chapter}: ${titles[chapter]}. ${L.truth?'Subsequent observed truth is visible.':'Subsequent truth is not displayed.'}`);
 $('#story-issue').textContent=time(f.o.issue);$('#scene-caption').textContent=L.regions?'Original joint-path region projections · Natural Earth':'Archived coordinates · Natural Earth coastline';
 $('#story-status').textContent=chapter===0?'OBSERVED PREFIX / FIXED HISTORICAL ORIGIN':chapter===1?'BASE FORECAST / +24H':chapter===2?'OBSERVED ERROR / RETROSPECTIVE':chapter===4?'ORIGINAL 90% REGIONS / +24H PROJECTIONS':chapter===5?'THIS MAP: ONE SELECTED ORIGIN':'BASE → VECTOR RESIDUAL FEEDBACK';
 $('#story-readout').innerHTML=chapter===0?`<div><span>Issue position</span><strong>${fmt(f.o.anchor[0])}°N <small>/</small> ${fmt(f.o.anchor[1])}°E</strong></div>`:chapter===1?`<div class="readout-base"><span>Base endpoint</span><strong>${fmt(f.base[3][0])}°N <small>/</small> ${fmt(f.base[3][1])}°E</strong></div>`:chapter===2?`<div class="readout-base"><span>Base endpoint error</span><strong>${fmt(f.baseError)} <small>km</small></strong></div><div><span>Target</span><strong>+24 <small>hours</small></strong></div>`:`<div class="readout-base"><span>Base error</span><strong>${fmt(f.baseError)} <small>km</small></strong></div><div class="readout-feedback"><span>Feedback error</span><strong>${fmt(f.feedbackError)} <small>km</small></strong></div>`;
 $('#story-key').innerHTML=[L.base?'<span class="key-base">┄ Base</span>':'',L.feedback?'<span class="key-feedback">━ Residual feedback</span>':'',L.truth?'<span>× Observed truth</span>':'<span>━ Observed prefix</span>'].join('');
 for(const a of $('#chapter-rail').querySelectorAll('[data-chapter]')){if(+a.dataset.chapter===chapter)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');}
 $('#present-position').textContent=String(chapter).padStart(2,'0')+' / 06';$('#present-prev').disabled=chapter===0;$('#present-next').disabled=chapter===6;
}
function chooseChapter(index){const next=chapterIndex(index);if(next===chapter)return;chapter=next;if(ready)render();}
function updateByScroll(){
 scheduled=false;if(!ready)return;
 const target=window.innerHeight*(mobile()?.77:.52),sections=CHAPTERS.map(id=>document.getElementById(id));let next=0,best=Infinity;
 sections.forEach((el,i)=>{const r=el.getBoundingClientRect(),distance=r.top<=target&&r.bottom>=target?0:Math.min(Math.abs(r.top-target),Math.abs(r.bottom-target));if(distance<best){best=distance;next=i;}});chooseChapter(next);
}
function scheduleScroll(){if(!scheduled){scheduled=true;window.requestAnimationFrame(updateByScroll);}}
function jump(index){
 const next=chapterIndex(index),el=document.getElementById(CHAPTERS[next]),offset=mobile()?60+document.querySelector('.research-scene').getBoundingClientRect().height:0;
 chooseChapter(next);window.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+window.scrollY-offset),behavior:reduced()||presenting?'auto':'smooth'});
}
function presentation(enabled){
 presenting=enabled;document.body.classList.toggle('is-presenting',enabled);$('#present-dock').hidden=!enabled;$('#present-toggle').setAttribute('aria-pressed',String(enabled));$('#present-toggle').textContent=enabled?'Reading view ↙':'Present ↗';jump(chapter);
}
function bind(){
 $('#story-case').addEventListener('change',render);
 for(const a of $('#chapter-rail').querySelectorAll('[data-chapter]'))a.addEventListener('click',event=>{event.preventDefault();jump(+a.dataset.chapter);});
 for(const a of document.querySelectorAll('a[href="#formulation"]'))a.addEventListener('click',event=>{event.preventDefault();jump(1);});
 $('#present-toggle').addEventListener('click',()=>presentation(!presenting));$('#present-exit').addEventListener('click',()=>presentation(false));$('#present-prev').addEventListener('click',()=>jump(chapter-1));$('#present-next').addEventListener('click',()=>jump(chapter+1));
 window.addEventListener('scroll',scheduleScroll,{passive:true});window.addEventListener('resize',scheduleScroll);
 document.addEventListener('keydown',event=>{if(!presenting||event.target?.closest?.('input,select,textarea,[contenteditable="true"]'))return;const step={ArrowRight:1,PageDown:1,ArrowLeft:-1,PageUp:-1}[event.key];if(step){event.preventDefault();jump(chapter+step);}else if(event.key==='Escape'){event.preventDefault();presentation(false);}});
}
async function init(){
 const [bundle,coast]=await Promise.all(['feedback-showcase.json','coastline.json'].map(async n=>{const r=await fetch('assets/'+n);if(!r.ok)throw Error(n+' '+r.status);return r.json();}));
 if(bundle.purpose!=='PREVIOUSLY_OUTCOME_SELECTED_ILLUSTRATIONS_NOT_INDEPENDENT_VALIDATION')throw Error('Unverified research scope');
 E=selectedEvidence(bundle.selection,bundle.endpoint,bundle.atlas);G=coast;
 $('#story-case').innerHTML=E.cases.map(c=>`<option value="${esc(c.storm_id)}">${esc(c.name)} · ${c.year}</option>`).join('');$('#story-case').value=(E.cases.find(c=>c.name==='TALIM')??E.cases[0]).storm_id;
 const ellipse=E.areas.find(a=>a.family==='rolling_ellipse'),spci=E.areas.find(a=>a.family==='spci');
 $('#story-evidence').innerHTML=`<div><strong>${fmt(E.reduction)}%</strong><span>lower mean position error<small>${fmt(E.base)} → ${fmt(E.feedback)} km</small></span></div><div><strong>${fmt(ellipse.reduction)}%</strong><span>smaller coverage-matched ellipse area</span></div><div><strong>${fmt(spci.reduction)}%</strong><span>smaller SPCI-adapted matched area</span></div>`;
 ready=true;$('#story-case').disabled=false;$('#present-toggle').disabled=false;bind();render();updateByScroll();
}
init().catch(e=>{$('#story-status').textContent='Archived map unavailable: '+e.message;$('#story-issue').textContent='Research text and original results remain accessible.';});
