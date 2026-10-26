import {selectedEvidence,BASE,FEEDBACK} from './results-engine.mjs?v=vector1';
import {issuedBoundary} from './atlas-engine.mjs?v=vector1';
import {wrap,mercator} from './engine.mjs';
const $=s=>document.querySelector(s),fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=t=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' UTC';
let E,G;
function map(){
 const c=E.cases.find(c=>c.storm_id===$('#results-case').value)??E.cases[0],o=c.origin,past=c.storm.track.filter(p=>Date.parse(p.time)<=Date.parse(o.issue)).slice(-9).map(p=>[p.lat,p.lon]),region=$('#results-regions').checked;
 const rings=region?[BASE,FEEDBACK].map(m=>({m,points:issuedBoundary(o,m,24,90)})):[],coords=[...past,...o.paths[BASE],...o.paths[FEEDBACK],...o.truth,...rings.flatMap(r=>r.points)],lo0=o.anchor[1],xs=coords.map(p=>lo0+wrap(p[1]-lo0)),ys=coords.map(p=>mercator(p[0])),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 let sx=Math.max(6,(Math.max(...xs)-Math.min(...xs))*1.2),sy=Math.max(3,(Math.max(...ys)-Math.min(...ys))*1.2);if(sx/sy<1100/540)sx=sy*1100/540;else sy=sx*540/1100;
 const P=p=>[550+(lo0+wrap(p[1]-lo0)-cx)*1100/sx,270-(mercator(p[0])-cy)*540/sy],line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(v=>v.toFixed(2)).join(',')}`).join(' '),colors={[BASE]:'#f2ac63',[FEEDBACK]:'#62ddc0'};
 let svg='<defs><clipPath id="result-clip"><rect width="1100" height="540"/></clipPath><marker id="result-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#e6f4ed"/></marker></defs><g clip-path="url(#result-clip)"><rect width="1100" height="540" fill="#0d2632"/>';
 for(const r of G.rings){if(!r.some(([lo,la])=>Math.abs(lo0+wrap(lo-lo0)-cx)<sx&&Math.abs(mercator(la)-cy)<sy))continue;svg+=`<path d="${line(r.map(([lo,la])=>[la,lo]))}Z" fill="#1c3b44" stroke="#527079" stroke-width=".6"/>`;}
 for(let la=0;la<=60;la+=5)svg+=`<path d="${line([[la,70],[la,220]])}" stroke="#9eb2b8" opacity=".12" stroke-dasharray="3 7"/>`;
 for(let lo=70;lo<230;lo+=10)svg+=`<path d="${line([[-5,lo],[65,lo]])}" stroke="#9eb2b8" opacity=".12" stroke-dasharray="3 7"/>`;
 for(const [name,p] of [['Taiwan',[23.7,121]],['Japan',[35.5,137]],['Korea',[36.5,128]],['Philippines',[13,122]]]){const [x,y]=P(p);svg+=`<text x="${x}" y="${y}" fill="#9bb4bc" font-size="13">${name}</text>`;}
 for(const r of rings)svg+=`<path d="${line(r.points)}Z" fill="${colors[r.m]}" fill-opacity=".09" stroke="${colors[r.m]}" stroke-width="1.2"><title>Original frozen 90% joint-path region projection</title></path>`;
 svg+=`<path d="${line(past)}" fill="none" stroke="#9aacb1" stroke-width="2"/><path d="${line([o.anchor,...o.truth])}" fill="none" stroke="#f3eee2" stroke-width="2" stroke-dasharray="4 6"/>`;
 for(const [i,m] of [BASE,FEEDBACK].entries()){const path=[o.anchor,...o.paths[m]],last=path.at(-1),[x,y]=P(last);svg+=`<path d="${line(path)}" fill="none" stroke="${colors[m]}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="6" fill="${colors[m]}"/><text x="${x+12}" y="${y+(i?23:-16)}" font-size="13" fill="${colors[m]}">${m===BASE?'Baseline':'Residual feedback'} · ${fmt(o.errors[m][3])} km</text>`;}
 const [x,y]=P(o.truth[3]);svg+=`<path d="M${x-7},${y-7}l14,14m-14,0l14,-14" stroke="#fff" stroke-width="2.5"/><text x="${x+12}" y="${y-12}" fill="#fff" font-size="12">Observed +24h</text><path d="${line([o.paths[BASE][3],o.paths[FEEDBACK][3]])}" fill="none" stroke="#e6f4ed" stroke-width="2" marker-end="url(#result-arrow)"/>`;
 $('#results-map').innerHTML=svg+'</g>';
 const b=o.errors[BASE][3],f=o.errors[FEEDBACK][3];$('#results-case-note').textContent=`${c.name} ${c.year} · Selected origin ${time(o.issue)} · +24h error ${fmt(b)} → ${fmt(f)} km (${fmt(100*(1-f/b))}% reduction). ${region?'Ellipses are the original frozen projections of a 90% joint-path region.':''} The endpoint area diagnostics below are separately calibrated and retrospectively coverage-matched.`;
 $('#results-map-link').href='research-atlas.html?case='+encodeURIComponent(c.storm_id);
}
function render(){
 const ellipse=E.areas.find(r=>r.family==='rolling_ellipse'),spci=E.areas.find(r=>r.family==='spci');
 $('#results-metrics').innerHTML=[['24h mean position error',fmt(E.reduction)+'% lower',`${fmt(E.base)} → ${fmt(E.feedback)} km · all ${E.n} origins in the selected storms`],['Ellipse matched area',fmt(ellipse.reduction)+'% smaller','Endpoint ellipse · same empirical coverage after matching'],['SPCI-adapted matched area',fmt(spci.reduction)+'% smaller','Same forecast centres · same empirical coverage after matching']].map(([a,b,c])=>`<article><span>${a}</span><strong>${b}</strong><p>${c}</p></article>`).join('');
 $('#results-case').innerHTML=E.cases.map(c=>`<option value="${esc(c.storm_id)}" ${c.name==='TALIM'?'selected':''}>${esc(c.name)} · ${c.year}</option>`).join('');
 $('#results-storms').innerHTML=E.cases.map(c=>`<tr><td><a href="research-atlas.html?case=${encodeURIComponent(c.storm_id)}">${esc(c.name)} · ${c.year}</a></td><td>${c.storm.origins.length}</td><td>${fmt(c.base,2)}</td><td>${fmt(c.feedback,2)}</td><td>${fmt(100*(1-c.feedback/c.base))}%</td></tr>`).join('');
 $('#results-area').innerHTML=E.areas.map(r=>`<tr><td>${r.family==='rolling_ellipse'?'Rolling endpoint ellipse':'SPCI-adapted endpoint region'}</td><td>${fmt(r.base.matched_geometric_mean_area_km2,0)} / ${fmt(r.feedback.matched_geometric_mean_area_km2,0)}</td><td>${fmt(r.ratio,3)}×</td><td>${Math.round(r.base.matched_coverage*r.n)}/${r.n} · ${fmt(r.base.matched_coverage*100)}%</td><td>${r.base.covered}/${r.n} → ${r.feedback.covered}/${r.n}</td></tr>`).join('');
 $('#results-status').textContent=`Selected retrospective illustrations · ${E.storms} storms / ${E.n} origins · Archived rolling-v2 forecasts · +24h endpoint`;
 map();$('#results-case').addEventListener('change',map);$('#results-regions').addEventListener('change',map);
}
async function init(){const [bundle,coast]=await Promise.all(['feedback-showcase.json','coastline.json'].map(async n=>{const r=await fetch('assets/'+n);if(!r.ok)throw Error(n+' '+r.status);return r.json();}));if(bundle.purpose!=='PREVIOUSLY_OUTCOME_SELECTED_ILLUSTRATIONS_NOT_INDEPENDENT_VALIDATION')throw Error('Unverified showcase scope');E=selectedEvidence(bundle.selection,bundle.endpoint,bundle.atlas);G=coast;render();}
init().catch(e=>$('#results-status').textContent='Research evidence unavailable: '+e.message);
