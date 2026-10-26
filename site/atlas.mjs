import {distance,sphereExp,wrap,mercator} from './engine.mjs';
import {issuedBoundary,currentMetrics,observations,cohortSummary} from './atlas-engine.mjs?v=vector1';
import {operationalState,futurePoints} from './operations-engine.mjs?v=terminal1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=(v,n=1)=>Number.isFinite(v)?v.toFixed(n):'—';
const time=t=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' UTC';
const colors={tabpfn:'#e1ae78',rolling_c0:'#b69ee0',rolling_c1:'#8bdec4',truth:'#f3eee2'},labels={tabpfn:'TabPFN baseline',rolling_c0:'Correction-only ablation',rolling_c1:'Vector residual feedback'};
let A,G,L,liveError='',S={mode:'history',storm:null,origin:0,hours:24,level:90,zoom:1,dx:0,dy:0},drag=null;
const storm=()=>A.storms.find(s=>s.id===S.storm),origin=()=>storm().origins[S.origin],retro=()=>S.mode==='history'&&$('#atlas-retro').checked;
const layer=m=>$('#layer-'+({tabpfn:'base',rolling_c0:'c0',rolling_c1:'c1'}[m])).checked;
function selectStorm(){
 const s=storm();$('#atlas-issue').innerHTML=s.origins.map((o,i)=>`<option value="${i}">${time(o.issue)}</option>`).join('');
 S.origin=Math.min(S.origin,s.origins.length-1);$('#atlas-issue').value=S.origin;$('#atlas-slider').max=s.origins.length-1;$('#atlas-slider').value=S.origin;
 reset();
}
function reset(){S.zoom=1;S.dx=S.dy=0;render();}
function setMode(mode){S.mode=mode;$('#mode-history').classList.toggle('selected',mode==='history');$('#mode-live').classList.toggle('selected',mode==='live');$('#history-controls').hidden=mode==='live';$('#history-timeline').hidden=mode==='live';$('#live-extra').hidden=mode!=='live';reset();}
function historical(){
 const s=storm(),o=origin(),i=S.hours/6-1,paths=['tabpfn','rolling_c0','rolling_c1'].filter(layer).map(method=>({method,label:labels[method],points:[o.anchor,...o.paths[method].slice(0,i+1)],color:colors[method]}));
 const rings=$('#layer-region').checked?paths.map(p=>({method:p.method,points:issuedBoundary(o,p.method,S.hours,S.level),color:p.color})):[];
 return {paths,rings,past:observations(s,o.issue),truth:retro()?o.truth.slice(0,i+1):[],base:o.paths.tabpfn[i],c1:o.paths.rolling_c1[i],target:retro()?o.truth[i]:null,title:s.name+' / '+s.year+' · +'+S.hours+'h',issue:o.issue};
}
function live(){
 if(!L)return null;
 const paths=[],rings=[];const ownNames={'TabPFN CV-F2':'tabpfn','TabPFN CV-F2 + C0':'rolling_c0','TabPFN CV-F2 + C1':'rolling_c1'};
 for(const p of L.model.paths){const method=ownNames[p.model_id]??'external';if(method==='external'?!$('#layer-external').checked:!layer(method))continue;
  const pts=futurePoints(p);if(!pts.length)continue;const color=colors[method]??['#8db3d1','#dd929d','#9ea8e4'][paths.filter(x=>x.method==='external').length%3];
  paths.push({method,label:(labels[method]??p.model_id)+' / '+time(p.issue_time_utc),points:[...(p.anchor?[[p.anchor.lat_deg,p.anchor.lon_deg]]:[]),...pts.map(x=>[x.lat_deg,x.lon_deg])],color,raw:p});
  const target=pts.find(x=>x.lead_h===24),q=target?.radius_90_km;
  if($('#layer-region').checked&&method!=='external'&&Number.isFinite(q))rings.push({method,color,points:Array.from({length:97},(_,i)=>sphereExp([target.lat_deg,target.lon_deg],q*Math.cos(i*2*Math.PI/96),q*Math.sin(i*2*Math.PI/96)))});
 }
 const b=paths.find(p=>p.method==='tabpfn'),c=paths.find(p=>p.method==='rolling_c1');
 const comparable=b&&c&&b.raw.issue_time_utc===c.raw.issue_time_utc,b24=b?.raw.points.find(p=>p.lead_h===24),c24=c?.raw.points.find(p=>p.lead_h===24);
 return {paths,rings,past:L.observations.slice(-15).map(p=>[p.lat_deg,p.lon_deg]),truth:[],target:null,
  base:comparable&&b24?[b24.lat_deg,b24.lon_deg]:null,c1:comparable&&c24?[c24.lat_deg,c24.lon_deg]:null,
  center:L.official.center,title:'CHAMPI · latest available tracks',issue:L.model.input_last_valid_utc};
}
function renderMap(v){
 if(!v){$('#atlas-map').innerHTML='';$('#atlas-map-error').textContent=liveError||'Live feed not yet available.';return;}
 $('#atlas-map-error').textContent=liveError&&S.mode==='live'?liveError:'';
 const pts=[...v.past.slice(-12),...v.paths.flatMap(p=>p.points),...v.rings.flatMap(r=>r.points),...v.truth];if(v.center)pts.push([v.center.lat_deg,v.center.lon_deg]);if(!pts.length)return;
 const lon0=pts[0][1],xs=pts.map(p=>lon0+wrap(p[1]-lon0)),ys=pts.map(p=>mercator(p[0]));const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const split=$('#atlas-layout').value==='split',panes=split?[{x:0,w:542,method:'tabpfn',name:'TABPFN BASELINE'},{x:558,w:542,method:'rolling_c1',name:'VECTOR RESIDUAL FEEDBACK'}]:[{x:0,w:1100,method:null,name:''}];
 let spanx=Math.max(6,(Math.max(...xs)-Math.min(...xs))*1.35),spany=Math.max(5,(Math.max(...ys)-Math.min(...ys))*1.35);const aspect=panes[0].w/650;if(spanx/spany<aspect)spanx=spany*aspect;else spany=spanx/aspect;
 let svg='<defs><marker id="correction-tip" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#d2f0e4"/></marker>';
 for(let j=0;j<panes.length;j++)svg+=`<clipPath id="atlas-clip-${j}"><rect width="${panes[j].w}" height="650" rx="5"/></clipPath>`;svg+='</defs>';
 for(const [j,pane] of panes.entries()){
  const P=p=>[pane.w/2+(lon0+wrap(p[1]-lon0)-cx)*pane.w/spanx*S.zoom+S.dx,325-(mercator(p[0])-cy)*650/spany*S.zoom+S.dy];
  const line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(2)).join(',')}`).join(' ');
  svg+=`<g transform="translate(${pane.x},0)" clip-path="url(#atlas-clip-${j})"><rect width="${pane.w}" height="650" fill="#0d2632"/>`;
  for(const ring of G.rings){if(!ring.some(([lo,la])=>Math.abs(lon0+wrap(lo-lon0)-cx)<spanx&&Math.abs(mercator(la)-cy)<spany))continue;svg+=`<path d="${line(ring.map(([lo,la])=>[la,lo]))}Z" fill="#1c3b44" stroke="#4c6970" stroke-width=".65"/>`;}
  for(let lo=60;lo<210;lo+=10)svg+=`<path d="${line([[-5,lo],[65,lo]])}" stroke="#3a5e6a" stroke-width=".6" stroke-dasharray="3 7" opacity=".5"/>`;
  for(let la=0;la<=60;la+=10)svg+=`<path d="${line([[la,70],[la,210]])}" stroke="#3a5e6a" stroke-width=".6" stroke-dasharray="3 7" opacity=".5"/>`;
  for(const [name,ll] of [['Taiwan',[23.7,121]],['Zhejiang',[29,120.4]],['Kyushu',[32.6,130.6]],['Honshu',[36.2,137.2]],['Korea',[36,127.6]],['Philippines',[13,122]],['Guangdong',[23,113.5]]]){const [x,y]=P(ll);svg+=`<text x="${x}" y="${y}" fill="#829da4" font-size="12">${name}</text>`;}
  for(const r of v.rings.filter(r=>!pane.method||r.method===pane.method))if(r.points.length)svg+=`<path d="${line(r.points)}Z" fill="${r.color}" fill-opacity=".10" stroke="${r.color}" stroke-opacity=".65" stroke-width="1.5"><title>${esc(labels[r.method])} · Original issue-time region projection</title></path>`;
  svg+=`<path d="${line(v.past)}" fill="none" stroke="#a2bac1" stroke-width="2" opacity=".8"/>`;
  if(v.truth.length)svg+=`<path d="${line([v.past.at(-1),...v.truth])}" fill="none" stroke="${colors.truth}" stroke-width="1.4" stroke-dasharray="3 5"/>`;
  for(const p of v.paths.filter(p=>!pane.method||p.method===pane.method||p.method==='external')){
   svg+=`<path d="${line(p.points)}" fill="none" stroke="${p.color}" stroke-width="${p.method==='rolling_c1'?3.2:2.2}" ${p.method==='tabpfn'?'stroke-dasharray="7 5"':''}><title>${esc(p.label)}</title></path>`;
   for(const ll of p.points.slice(1)){const [x,y]=P(ll);svg+=`<circle cx="${x}" cy="${y}" r="3.7" fill="${p.color}" stroke="#0d2632"><title>${esc(p.label)} · ${fmt(ll[0],2)}°N / ${fmt(ll[1],2)}°E</title></circle>`;}
   if(v.target&&$('#layer-errors').checked)svg+=`<path d="${line([p.points.at(-1),v.target])}" fill="none" stroke="${p.color}" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>`;
  }
  if(v.base&&v.c1&&$('#layer-residual').checked)svg+=`<path d="${line([v.base,v.c1])}" stroke="#d2f0e4" fill="none" stroke-width="2.2" marker-end="url(#correction-tip)"><title>Baseline → residual feedback</title></path>`;
  if(v.target){const [x,y]=P(v.target);svg+=`<path d="M${x-7},${y-7}l14,14m-14,0l14,-14" stroke="${colors.truth}" stroke-width="2.5"><title>Retrospective truth</title></path>`;}
  if(v.center){const [x,y]=P([v.center.lat_deg,v.center.lon_deg]);svg+=`<circle cx="${x}" cy="${y}" r="7" fill="#eef1df" stroke="#183b45" stroke-width="2"><title>Last CMA analysis ${esc(time(v.center.valid_time_utc))}</title></circle>`;}
  if(pane.name)svg+=`<rect x="12" y="12" width="235" height="30" rx="5" fill="#07151ddd"/><text x="23" y="32" fill="${colors[pane.method]}" font-size="13">${pane.name}</text>`;
  svg+='</g>';
 }
 $('#atlas-map').innerHTML=svg;
}
function renderHistory(){
 const s=storm(),o=origin(),m=currentMetrics(o,S.hours,retro()),r=o.regions.rolling_c1[S.hours/6],lags=o.residuals[S.hours/6-1]??[];
 const preset=A.selected_cases.find(c=>c.storm_id===s.id&&c.origin_index===S.origin);
 $('#atlas-badge').textContent=retro()?(preset?'POSTHOC CASE / selected example':'HISTORICAL / truth visible'):'HINDCAST / truth hidden';$('#atlas-badge').classList.remove('live');
 $('#atlas-map-title').textContent=s.name+' · '+s.year+' / +'+S.hours+'h';$('#atlas-time-label').textContent=time(o.issue);$('#atlas-issue').value=S.origin;$('#atlas-slider').value=S.origin;
 $('#atlas-prev').disabled=S.origin===0;$('#atlas-next').disabled=S.origin===s.origins.length-1;
 $('#atlas-metrics').innerHTML=m?[['Baseline endpoint error',m.base],['Feedback endpoint error',m.c1],['Error reduction',m.delta],...($('#layer-c0').checked?[['Ablation endpoint error',m.c0]]:[])].map(([name,v])=>`<div><span>${name}</span><strong>${fmt(v)} <small>km</small></strong></div>`).join(''):'<div><span>Target error</span><strong>Hidden</strong></div><p>Enable retrospective truth to inspect errors.</p>';
 const verdict=$('#atlas-verdict');verdict.classList.toggle('loss',!!m&&m.delta<0);verdict.textContent=m?`Residual feedback ${m.delta>=0?'reduces':'increases'} endpoint error by ${fmt(Math.abs(m.delta))} km (${fmt(Math.abs(m.gain))}%) at this origin. This is a retrospective illustration.`:'The correction vector shows how the forecast centre moves. Enable retrospective truth to inspect the observed error.';
 $('#atlas-region-note').textContent=`${S.hours/6}-lead MaxScore joint-event projection · ${S.level}% target · Geometry n=${r.n_geometry} / rank scores n=${r.n_scores}. ${lags.length}/4 mature same-lead residuals. Mapped from the original issue tangent plane; projected area is distinct from joint volume.`;
 $('#atlas-contract').textContent='Revised historical-data replay. Baseline and residual feedback share issue times and fixed 6–24h paths. This is a hindcast, separate from prospective publication.';
 $('#atlas-runtime').textContent='Locked historical model output. Map controls read the retained results.';
 const summary=cohortSummary(A,S.mode==='live'?24:S.hours),roles={tabpfn:'Baseline',rolling_c0:'Ablation control',rolling_c1:'Feedback variant'},delta=n=>(n>0?'+':'')+fmt(n);
 $('#atlas-cohort').innerHTML=`<p class="cohort-contract">Archived rolling-v2 / X10 · 2020–2024 · ${summary.storms} storms · ${summary.rows[0].n_origins.toLocaleString('en-GB')} paired origins · +${summary.hours}h endpoint. Joint event: all ${summary.leads.join('/')}h positions covered; nominal target 90%.</p><div class="cohort-table-scroll"><table><thead><tr><th>Configuration</th><th>Research role</th><th>+${summary.hours}h MAE · km</th><th>Δ MAE vs Base · km</th><th>Joint coverage · observed</th></tr></thead><tbody>${summary.rows.map(r=>`<tr><td>${labels[r.method]}</td><td>${roles[r.method]}</td><td>${fmt(r.mae_km)}</td><td>${delta(r.delta_vs_base_km)}</td><td>${fmt(r.coverage*100,2)}% · ${r.covered}/${r.n_origins}</td></tr>`).join('')}</tbody></table></div><p>Positive Δ MAE means higher error. C0 and C1 use the same correction family; only C1 adds explicit mature residual-history inputs. C0 still learns from residual-labelled contexts. This archived protocol differs from live CV-F2 and original TS + PI+; its joint coverage is distinct from a single endpoint's coverage.</p><p><a href="assets/docs/COHORT_TABLE_AND_RESIDUAL_ARMS.md">Definitions, numerical audit & comparison design ↗</a></p>`;
}
function renderLive(){
 $('#atlas-badge').textContent='LATEST AVAILABLE / actual version';$('#atlas-badge').classList.add('live');$('#atlas-map-title').textContent='CHAMPI · current input & forecasts';
 if(!L){$('#atlas-runtime').textContent=liveError||'Live feed not yet available';return;}
 const state=operationalState(L),c=L.official.center;
 const obs=L.observations.at(-1),w=L.official.warning;
 $('#atlas-metrics').innerHTML=`<div><span>UCAR maximum wind</span><strong>${fmt(obs?.vmax_kt)} <small>kt</small></strong></div><div><span>UCAR pressure</span><strong>${fmt(obs?.mslp_hpa,0)} <small>hPa</small></strong></div><div><span>National advisory</span><strong>${w?.status==='cancelled'?'Lifted':state.warningStale?'Unverified':'Issued'}</strong></div><div><span>Future error</span><strong>Not yet known</strong></div>`;
 $('#atlas-verdict').classList.toggle('loss',state.forecastStale);$('#atlas-verdict').textContent=`Model issue ${time(L.model.input_last_valid_utc)}; Generated ${time(L.generated_at_utc)}. ${state.forecastStale?'Model input is delayed.':'Actual recorded model version.'}Source and model clocks are independent.`;
 $('#atlas-region-note').textContent='The live map shows actual +24h marginal 90% position circles. Retrospective ellipse experiments are independent.';
 $('#atlas-contract').textContent='Base and C1 share an input cutoff. External guidance keeps its original cycle; use the prospective ledger for matched scoring.';
 $('#atlas-runtime').textContent=`Feed checked ${time(L.last_checked_at_utc)}. ${state.watcherStale?'Feed check overdue.':''}${state.failedSources.length?'Failed sources: '+state.failedSources.join(', ')+'. ':''}${L.publication?.mode==='mac_auto'?'Published automatically by the Mac.':'No Mac publication marker on this version.'}Refer to the recorded version times.`;
}
function render(){if(!A)return;renderHistory();if(S.mode==='live')renderLive();renderMap(S.mode==='history'?historical():live());}
async function loadLive(){try{const r=await fetch('assets/champi-operations.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);const value=await r.json();if(!value.model?.paths)throw Error('missing real model paths');L=value;liveError='';}catch(e){liveError='Live feed unavailable: '+e.message+'.';}if(S.mode==='live')render();}
async function init(){[A,G]=await Promise.all(['assets/research-atlas.json','assets/coastline.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);return r.json();}));
 const requested=typeof location==='undefined'?null:new URLSearchParams(location.search).get('case');S.storm=A.storms.find(s=>s.id===requested)?.id??A.storms.find(s=>s.name==='TALIM')?.id??A.storms[0].id;S.origin=A.selected_cases.find(c=>c.storm_id===S.storm)?.origin_index??0;
 $('#atlas-storm').innerHTML=A.storms.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} · ${s.year}</option>`).join('');$('#atlas-storm').value=S.storm;
 $('#atlas-scope').textContent=`${A.cohort.storms} storms / ${A.cohort.origins} paired origins`;
 $('#atlas-selection-note').textContent='The initial TALIM origin is a previously selected retrospective case. All 114 storms and 1,245 origins remain selectable, including improvements and failures.';
 $('#atlas-storm').onchange=e=>{S.storm=e.target.value;S.origin=0;selectStorm();};$('#atlas-issue').onchange=e=>{S.origin=+e.target.value;reset();};$('#atlas-slider').oninput=e=>{S.origin=+e.target.value;render();};
 $('#atlas-prev').onclick=()=>{S.origin=Math.max(0,S.origin-1);render();};$('#atlas-next').onclick=()=>{S.origin=Math.min(storm().origins.length-1,S.origin+1);render();};
 $('#atlas-lead').onchange=e=>{S.hours=+e.target.value;reset();};$('#atlas-level').onchange=e=>{S.level=+e.target.value;render();};$('#mode-history').onclick=()=>setMode('history');$('#mode-live').onclick=()=>setMode('live');$('#atlas-reset').onclick=reset;
 for(const id of ['atlas-layout','atlas-retro','layer-base','layer-c0','layer-c1','layer-region','layer-residual','layer-errors','layer-external'])$('#'+id).addEventListener('change',render);
 $('#atlas-export').onclick=()=>{const svg=$('#atlas-map').outerHTML.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download='cyclone-'+S.mode+'-'+S.hours+'h.svg';a.click();URL.revokeObjectURL(url);};
 const map=$('#atlas-map');map.addEventListener('wheel',e=>{e.preventDefault();S.zoom=Math.max(.5,Math.min(6,S.zoom*(e.deltaY<0?1.12:1/1.12)));renderMap(S.mode==='history'?historical():live());},{passive:false});
 map.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY,S.dx,S.dy];map.setPointerCapture(e.pointerId);});map.addEventListener('pointermove',e=>{if(!drag)return;const k=1100/map.getBoundingClientRect().width;S.dx=drag[2]+(e.clientX-drag[0])*k;S.dy=drag[3]+(e.clientY-drag[1])*k;renderMap(S.mode==='history'?historical():live());});map.addEventListener('pointerup',()=>drag=null);map.addEventListener('pointercancel',()=>drag=null);
 selectStorm();loadLive();setInterval(loadLive,60000);
}
init().catch(e=>{$('#atlas-map-error').textContent='Research data unavailable: '+e.message;$('#atlas-scope').textContent='Data unavailable';});
