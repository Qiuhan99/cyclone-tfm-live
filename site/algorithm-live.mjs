import {distance,wrap,mercator} from './engine.mjs';
import {OWN,PUBLIC_OWN,LABELS,point,boundary,area,comparators,pairedScore,verified,verificationState,defaultVerificationLead} from './algorithm-engine.mjs?v=vector1';
import {operationalState} from './operations-engine.mjs?v=terminal1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
const time=t=>Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' UTC':'Not reported';
const colors=['#f2ac63','#c2a5f0','#62ddc0'],otherColors=['#f4ce7b','#91b9df','#d990a3','#a7a5eb'];
let D,G,B,busy=false,error='',view={zoom:1,dx:0,dy:0};
const ll=q=>[q.lat_deg,q.lon_deg],method=()=>$('#algo-method').value,hours=()=>+$('#algo-lead').value,level=()=>+$('#algo-level').value;
const route=p=>[...(p.anchor?[ll(p.anchor)]:[]),...p.points.filter(q=>q.lead_h<=hours()).map(ll)];
function maps(own,external,selected){
 const target=point(selected,hours()),ring=boundary(target,level()),past=D.observations.slice(-13).map(ll),all=[...past,...own.flatMap(route),...external.flatMap(route),...ring];if(!all.length)return;
 const lon0=all[0][1],xs=all.map(p=>lon0+wrap(p[1]-lon0)),ys=all.map(p=>mercator(p[0])),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 let sx=Math.max(5,(Math.max(...xs)-Math.min(...xs))*1.25),sy=Math.max(4,(Math.max(...ys)-Math.min(...ys))*1.3);if(sx/sy<700/530)sx=sy*700/530;else sy=sx*530/700;
 const P=p=>[350+(lon0+wrap(p[1]-lon0)-cx)*700/sx*view.zoom+view.dx,265-(mercator(p[0])-cy)*530/sy*view.zoom+view.dy],line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(2)).join(',')}`).join(' ');
 function draw(id,paths,region){
  let svg=`<defs><clipPath id="${id}-clip"><rect width="700" height="530"/></clipPath><marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#e7efe7"/></marker></defs><g clip-path="url(#${id}-clip)"><rect width="700" height="530" fill="#0d2632"/>`;
  for(const r of G.rings){if(!r.some(([lo,la])=>Math.abs(lon0+wrap(lo-lon0)-cx)<sx&&Math.abs(mercator(la)-cy)<sy))continue;svg+=`<path d="${line(r.map(([lo,la])=>[la,lo]))}Z" fill="#1c3b44" stroke="#527079" stroke-width=".75"/>`;}
  for(let la=0;la<=60;la+=5)svg+=`<path d="${line([[la,70],[la,210]])}" stroke="#527079" opacity=".2" stroke-dasharray="3 7"/>`;
  for(let lo=70;lo<=200;lo+=5)svg+=`<path d="${line([[-5,lo],[65,lo]])}" stroke="#527079" opacity=".2" stroke-dasharray="3 7"/>`;
  for(const [name,p] of [['Taiwan',[23.7,121]],['Zhejiang',[29,120.3]],['Kyushu',[32.5,130.7]],['Shikoku',[33.7,133.5]],['Honshu',[35.5,137.5]],['Korea',[36,127.8]]]){const [x,y]=P(p);svg+=`<text x="${x}" y="${y}" font-size="13" fill="#99afb3">${name}</text>`;}
  if(region&&ring.length)svg+=`<path d="${line(ring)}Z" fill="#8bdec4" fill-opacity=".12" stroke="#8bdec4" stroke-width="1.5"><title>${level()}% marginal conformal position region · +${hours()}h</title></path>`;
  svg+=`<path d="${line(past)}" fill="none" stroke="#c4d1d0" stroke-width="2" opacity=".7"/>`;
  for(const [pathIndex,{p,color,dashed}] of paths.entries()){const coords=route(p);if(!coords.length)continue;svg+=`<path d="${line(coords)}" fill="none" stroke="${color}" stroke-width="${p.model_id===method()?3.3:2.1}" ${dashed?'stroke-dasharray="6 5"':''}><title>${esc(LABELS[p.model_id]??p.model_id)} · ${esc(time(p.issue_time_utc))}</title></path>`;
   for(const q of p.points.filter(q=>q.lead_h<=hours())){const [x,y]=P(ll(q)),elapsed=Date.parse(q.valid_time_utc)<=Date.now();svg+=`<circle cx="${x}" cy="${y}" r="${q.lead_h===hours()?5:3}" fill="${color}" opacity="${elapsed?0.45:1}"><title>${esc(LABELS[p.model_id]??p.model_id)} +${q.lead_h}h · ${esc(time(q.valid_time_utc))} · ${elapsed?'Target reached':'Forecast'}</title></circle>`;if(q.lead_h===hours()){const dy=-25+pathIndex*21,label=OWN.includes(p.model_id)?["Baseline","Ablation","Feedback"][OWN.indexOf(p.model_id)]:(p.model_raw_aid??"CMA");svg+=`<path d="M${x},${y}L${x+12},${y+dy}" fill="none" stroke="${color}" stroke-width=".8" opacity=".7"/><text x="${x+16}" y="${y+dy+4}" fill="${color}" font-size="11">${label} +${hours()}h</text>`;}}
  }
  const base=point(own.find(p=>p.model_id===OWN[0]),hours());if(region&&base&&target&&selected.model_id!==OWN[0])svg+=`<path d="${line([ll(base),ll(target)])}" fill="none" stroke="#e7efe7" stroke-width="2" marker-end="url(#${id}-arrow)"><title>Base → selected correction</title></path>`;
  if(past.length){const [x,y]=P(past.at(-1));svg+=`<circle cx="${x}" cy="${y}" r="6" fill="#eff2dc" stroke="#193f48" stroke-width="2"><title>Latest observed UCAR centre</title></circle>`;}
  const truth=verified(D.verification,hours()).find(r=>r.model_id===selected.model_id&&r.issue_time_utc===selected.issue_time_utc);if(truth){const t=truth.truth;if(t){const [x,y]=P([t.lat_deg,t.lon_deg]);svg+=`<path d="M${x-6},${y-6}l12,12m-12,0l12,-12" stroke="#fff" stroke-width="2"><title>Verified UCAR truth</title></path>`;}}
  svg+='<rect x="15" y="492" width="340" height="24" rx="4" fill="#07151dcc"/><text x="25" y="509" fill="#9bb0b7" font-size="11">Matched extent / Natural Earth</text></g>';
  $('#'+id).innerHTML=svg;
 }
 draw('algo-own-map',own.map((p,i)=>({p,color:colors[OWN.indexOf(p.model_id)]??colors[i]})),true);
 draw('algo-other-map',[{p:selected,color:'#8bdec4',dashed:true},...external.map((p,i)=>({p,color:otherColors[i%4]}))],false);
}
const average=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function verification(){
 const ledger=D.verification,selectedLead=$('#algo-verify-lead').value,h=selectedLead==='auto'?defaultVerificationLead(ledger,method()):+selectedLead;
 const ownState=verificationState(ledger,method(),h),models=new Set(['CMA / BABJ',...D.model.paths.map(p=>p.model_id),...(ledger?.records??[]).map(r=>r.model_id)]);models.delete(method());models.delete(OWN[1]);
 $('#algo-ledger-note').textContent=ledger?`Protocol started ${time(ledger.started_at_utc)} · ${ledger.records.length} forecast versions retained · ${ledger.records.filter(r=>r.eligible).length} confirmed before target. Verification lead +${h}h is independent of the map lead.`:'Waiting for the first public forecast ledger. Historical forecasts cannot be backfilled as prospective.';
 $('#algo-verification-status').textContent=`+${h}h · ${ownState.scored} verified · ${ownState.awaitingTarget} awaiting target · ${ownState.awaitingTruth} awaiting a source fix${ownState.nextValid?' · next target '+time(ownState.nextValid):''}.`;
 $('#algo-forward').innerHTML=[...models].map(id=>{const v=pairedScore(ledger,method(),id,h,level()),status=v.n?`${v.wins} / ${v.n}`:ownState.scored?'No eligible common cycle':ownState.awaitingTruth?'Awaiting source fix':ownState.awaitingTarget?'Target not reached':'No eligible forecast';return `<tr><td>${esc(LABELS[id]??id)}</td><td>${v.n}</td><td>${fmt(v.own)} / ${fmt(v.other)}</td><td>${status}</td><td>${v.regionN?fmt(v.coverage*100)+'% (n='+v.regionN+')':'—'} / ${level()}%</td><td>${fmt(v.area,0)}</td></tr>`;}).join('');
 $('#algo-all-leads').innerHTML=[6,12,24,48,72].map(lead=>{const values=verified(ledger,lead),rows=PUBLIC_OWN.map(id=>values.filter(r=>r.model_id===id)),state=verificationState(ledger,method(),lead);return `<tr><td>+${lead}h</td><td>${rows[PUBLIC_OWN.indexOf(method())].length}</td>${rows.map(a=>`<td>${fmt(average(a.map(r=>r.error)),2)}</td>`).join('')}<td>${state.nextValid?time(state.nextValid):state.awaitingTruth?'Awaiting source fix':state.scored?'Verified':'No eligible forecast'}</td></tr>`;}).join('');
 const ids=new Set(['ATCF:CMC','ATCF:UKM','ATCF:NGX',...PUBLIC_OWN]);
 $('#algo-retro').innerHTML=(B.external_common??[]).filter(r=>r.lead_h===hours()&&ids.has(r.model_id)).map(r=>`<tr class="${OWN.includes(r.model_id)?'our-row':''}"><td>${esc(LABELS[r.model_id]??r.model_id)}</td><td>${r.n}</td><td>${fmt(r.mean_error_km,2)}</td></tr>`).join('')||'<tr><td colspan="3">No original common cohort at this lead.</td></tr>';
}
function render(){
 if(!D||!G||!B)return;
 const own=D.model.paths.filter(p=>PUBLIC_OWN.includes(p.model_id)),selected=own.find(p=>p.model_id===method());if(!selected)throw Error('Selected research path is unavailable');
 const target=point(selected,hours()),base=point(own.find(p=>p.model_id===OWN[0]),hours()),external=comparators(D,selected.issue_time_utc,$('#algo-pairing').value),state=operationalState(D),expired=target&&Date.parse(target.valid_time_utc)<=Date.now();
 $('#algo-state').textContent=expired?'Target reached':state.forecastStale?'Input delayed':'Latest model cycle';
 $('#algo-status').classList.toggle('warn',!!error||state.forecastStale||expired);
 $('#algo-status').textContent=[error,`Model issue ${time(selected.issue_time_utc)} · Generated ${time(selected.generated_at_utc)} · Feed checked ${time(D.last_checked_at_utc)}`,state.forecastStale?'Input is delayed; the original model version is retained.':'',expired?'The selected target has passed; this forecast is retained for verification.':'',D.agency_forecasts?.ok===false?'CMA retrieval failed; its previous version is retained.':'',state.watcherStale?'Feed check overdue.':'',state.failedSources.length?'Source checks failed: '+state.failedSources.join(', ')+'.':''].filter(Boolean).join(' ');
 $('#algo-own-clock').textContent=`${LABELS[method()]} · Issue ${time(selected.issue_time_utc)} · Actual local inference`;
 $('#algo-target').textContent=target?`${fmt(target.lat_deg,2)}°N / ${fmt(target.lon_deg,2)}°E`:'Not available';$('#algo-target-time').textContent=target?`+${hours()}h · Valid ${time(target.valid_time_utc)}`:'No interpolation or invented forecast';
 $('#algo-correction').textContent=base&&target?fmt(distance(ll(base),ll(target)))+' km':'—';
 const radius=target?.[`radius_${level()}_km`];$('#algo-radius').textContent=Number.isFinite(radius)?fmt(radius)+' km radius':'No calibrated threshold';$('#algo-area').textContent=`${level()}% target · +${hours()}h marginal position · ${fmt(area(radius),0)} km² · Calibration n=${target?.calibration_n??'—'}`;
 const coast=(selected.landfall_candidates??[]).find(p=>Date.parse(p.valid_time_utc)>Date.now()&&Date.parse(p.valid_time_utc)<=Date.parse(selected.issue_time_utc)+hours()*3600000),regions={'台湾附近':'Taiwan','浙江沿海附近':'Zhejiang coast','福建沿海附近':'Fujian coast','上海/江苏沿海附近':'Shanghai / Jiangsu coast','日本九州附近':'Kyushu','日本四国附近':'Shikoku','日本本州附近':'Honshu','日本北海道附近':'Hokkaido','朝鲜半岛南部附近':'Southern Korea','琉球群岛附近':'Ryukyu Islands'};
 $('#algo-coast').textContent=coast?(regions[coast.region]??'Coastal crossing')+' · '+time(coast.valid_time_utc):'No crossing in selected window';
 $('#algo-other-legend').innerHTML='<span class="c1">┄ Selected research forecast</span>'+external.map((p,i)=>`<span class="other-${i%4}">${esc(LABELS[p.model_id]??p.model_id)} · ${esc(time(p.issue_time_utc))}</span>`).join('');
 const missing=external.filter(p=>!point(p,hours())).map(p=>p.model_id);$('#algo-other-note').textContent=`${$('#algo-pairing').value==='matched'?'Only paths from the same issue time are shown.':'Latest source cycles; display only, not a matched skill ranking.'}${external.length?'':' No external path at the selected issue.'}${missing.length?' No original +'+hours()+'h point: '+missing.join(', ')+'.':''}`;
 maps(own,external,selected);verification();
}
async function load(){if(busy)return;busy=true;$('#algo-refresh').disabled=true;try{
 const fetchJSON=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' '+r.status);return r.json();};
 const [d,g,b]=await Promise.all([fetchJSON('assets/champi-operations.json'),G??fetchJSON('assets/coastline.json'),B??fetchJSON('assets/motion-residual.json')]);
 if(!PUBLIC_OWN.every(id=>d.model?.paths.some(p=>p.model_id===id)))throw Error('Research forecast unavailable');D=d;G=g;B=b;error='';render();
 }catch(e){error='Feed unavailable: '+e.message+'. Last successful version retained.';$('#algo-status').textContent=error;$('#algo-status').classList.add('warn');}finally{busy=false;$('#algo-refresh').disabled=false;}}
for(const id of ['algo-method','algo-lead','algo-level','algo-pairing','algo-verify-lead'])$('#'+id).addEventListener('change',()=>{try{view={zoom:1,dx:0,dy:0};render();}catch(e){$('#algo-status').textContent='Display error: '+e.message;}});
for(const [id,factor] of [['algo-zoom-in',1.3],['algo-zoom-out',1/1.3],['algo-map-reset',0]])$('#'+id).addEventListener('click',()=>{view=factor?{...view,zoom:Math.min(8,Math.max(.5,view.zoom*factor))}:{zoom:1,dx:0,dy:0};render();});
for(const id of ['algo-own-map','algo-other-map']){const el=$('#'+id);if(!el.setPointerCapture)continue;let drag=null;el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,dx:view.dx,dy:view.dy};el.setPointerCapture(e.pointerId);});el.addEventListener('pointermove',e=>{if(!drag)return;const scale=700/el.getBoundingClientRect().width;view.dx=drag.dx+(e.clientX-drag.x)*scale;view.dy=drag.dy+(e.clientY-drag.y)*scale;render();});el.addEventListener('pointerup',()=>drag=null);el.addEventListener('pointercancel',()=>drag=null);el.addEventListener('wheel',e=>{e.preventDefault();view.zoom=Math.min(8,Math.max(.5,view.zoom*(e.deltaY<0?1.12:1/1.12)));render();},{passive:false});}
$('#algo-refresh').onclick=load;load();setInterval(load,60000);
