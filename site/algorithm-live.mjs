import './release-watch.mjs?v=verify5';
import {distance,wrap,mercator} from './engine.mjs';
import {OWN,PUBLIC_OWN,LABELS,point,area,comparators,pairedScore,verified,verificationState,defaultVerificationLead,forecastRegions,modelScores} from './algorithm-engine.mjs?v=direct1';
import {operationalState} from './operations-engine.mjs?v=terminal1';
import {historicalRows,historicalScores,historicalPair,evaluationMode} from './verification-view-engine.mjs?v=verify5';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
const time=t=>Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' UTC':'Not reported';
const colors=['#f2ac63','#62ddc0'],otherColors=['#f4ce7b','#91b9df','#d990a3','#a7a5eb','#83c7ef','#d98fd7','#b7c779'];
let D,G,B,H,busy=false,error='',view={zoom:1,dx:0,dy:0};
const ll=q=>[q.lat_deg,q.lon_deg],method=()=>$('#algo-method').value,hours=()=>+$('#algo-lead').value,level=()=>+$('#algo-level').value;
const route=p=>[...(p.anchor?[ll(p.anchor)]:[]),...p.points.filter(q=>q.lead_h<=hours()).map(ll)];
function maps(own,external,selected){
 const base=point(own.find(p=>p.model_id===OWN[0]),hours()),feedback=point(own.find(p=>p.model_id===OWN[1]),hours()),regions=forecastRegions(own,hours(),level(),$('#algo-region-mode').value),past=D.observations.slice(-5).map(ll);
 function draw(id,paths,rings,ownMap){
  const coords=[...past.slice(-3),...paths.flatMap(x=>route(x.p)),...rings.flatMap(r=>r.points)];if(!coords.length)return;
  const lon0=coords[0][1],xs=coords.map(p=>lon0+wrap(p[1]-lon0)),ys=coords.map(p=>mercator(p[0])),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  let sx=Math.max(3,(Math.max(...xs)-Math.min(...xs))*1.2),sy=Math.max(2,(Math.max(...ys)-Math.min(...ys))*1.25);if(sx/sy<700/530)sx=sy*700/530;else sy=sx*530/700;
  const P=p=>[350+(lon0+wrap(p[1]-lon0)-cx)*700/sx*view.zoom+view.dx,265-(mercator(p[0])-cy)*530/sy*view.zoom+view.dy],line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(2)).join(',')}`).join(' ');
  let svg=`<defs><clipPath id="${id}-clip"><rect width="700" height="530"/></clipPath><marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#e7efe7"/></marker></defs><g clip-path="url(#${id}-clip)"><rect width="700" height="530" fill="#0d2632"/>`;
  for(const r of G.rings){if(!r.some(([lo,la])=>Math.abs(lon0+wrap(lo-lon0)-cx)<sx&&Math.abs(mercator(la)-cy)<sy))continue;svg+=`<path d="${line(r.map(([lo,la])=>[la,lo]))}Z" fill="#1c3b44" stroke="#527079" stroke-width=".75"/>`;}
  for(let la=0;la<=60;la+=5)svg+=`<path d="${line([[la,70],[la,210]])}" stroke="#527079" opacity=".2" stroke-dasharray="3 7"/>`;
  for(let lo=70;lo<=200;lo+=5)svg+=`<path d="${line([[-5,lo],[65,lo]])}" stroke="#527079" opacity=".2" stroke-dasharray="3 7"/>`;
  for(const [name,p] of [['Taiwan',[23.7,121]],['Zhejiang',[29,120.3]],['Kyushu',[32.5,130.7]],['Shikoku',[33.7,133.5]],['Honshu',[35.5,137.5]],['Korea',[36,127.8]]]){const [x,y]=P(p);svg+=`<text x="${x}" y="${y}" font-size="13" fill="#99afb3">${name}</text>`;}
  for(const r of rings){const color=colors[OWN.indexOf(r.model_id)];svg+=`<path data-region="${esc(r.model_id)}" d="${line(r.points)}Z" fill="${color}" fill-opacity=".10" stroke="${color}" stroke-width="1.8" ${r.model_id===OWN[0]?'stroke-dasharray="7 4"':''}><title>${esc(LABELS[r.model_id])} · ${level()}% marginal conformal position region · +${hours()}h · ${fmt(r.area,0)} km²</title></path>`;}
  svg+=`<path d="${line(past)}" fill="none" stroke="#c4d1d0" stroke-width="2" opacity=".7"/>`;
  for(const [pathIndex,{p,color,dashed}] of paths.entries()){const coords=route(p);if(!coords.length)continue;svg+=`<path d="${line(coords)}" fill="none" stroke="${color}" stroke-width="${p.model_id===OWN[1]?3.5:2.5}" ${dashed||p.model_id===OWN[0]?'stroke-dasharray="7 4"':''}><title>${esc(LABELS[p.model_id]??p.model_id)} · ${esc(time(p.issue_time_utc))}</title></path>`;
   for(const q of p.points.filter(q=>q.lead_h<=hours())){const [x,y]=P(ll(q)),elapsed=Date.parse(q.valid_time_utc)<=Date.now();svg+=`<circle cx="${x}" cy="${y}" r="${q.lead_h===hours()?5:3}" fill="${color}" opacity="${elapsed?0.55:1}"><title>${esc(LABELS[p.model_id]??p.model_id)} +${q.lead_h}h · ${esc(time(q.valid_time_utc))} · ${elapsed?'Target reached':'Forecast'}</title></circle>`;if(q.lead_h===hours()){const dy=Math.max(20,Math.min(470,y-25+pathIndex*21))-y,label=OWN.includes(p.model_id)?['Baseline','Feedback'][OWN.indexOf(p.model_id)]:(p.model_family==='tsfm'?({'Chronos-Bolt-small':'Chronos-Bolt','Moirai-1.1-R-small':'Moirai'}[p.model_id]??p.model_id):p.model_raw_aid??'CMA');svg+=`<path d="M${x},${y}L${Math.min(555,x+12)},${y+dy}" fill="none" stroke="${color}" stroke-width=".8" opacity=".7"/><text x="${Math.min(559,x+16)}" y="${y+dy+4}" fill="${color}" font-size="11">${label} +${hours()}h</text>`;}}
  }
  if(ownMap&&base&&feedback)svg+=`<path d="${line([ll(base),ll(feedback)])}" fill="none" stroke="#e7efe7" stroke-width="2" marker-end="url(#${id}-arrow)"><title>Baseline → residual feedback correction: ${fmt(distance(ll(base),ll(feedback)))} km</title></path>`;
  if(past.length){const [x,y]=P(past.at(-1));svg+=`<circle cx="${x}" cy="${y}" r="6" fill="#eff2dc" stroke="#193f48" stroke-width="2"><title>Latest observed UCAR centre</title></circle>`;}
  const truth=verified(D.verification,hours()).find(r=>r.model_id===selected.model_id&&r.issue_time_utc===selected.issue_time_utc);if(truth?.truth){const [x,y]=P(ll(truth.truth));svg+=`<path d="M${x-6},${y-6}l12,12m-12,0l12,-12" stroke="#fff" stroke-width="2"><title>Verified UCAR truth</title></path>`;}
  svg+=`<rect x="15" y="492" width="${ownMap?375:330}" height="24" rx="4" fill="#07151dcc"/><text x="25" y="509" fill="#9bb0b7" font-size="11">${ownMap?'Forecast extent · both original calibrated regions':'Model comparison · check source cycles'}</text>`;
  if(ownMap&&base&&feedback){const a=ll(base),b=ll(feedback),delta=distance(a,b),lo=a[1]+wrap(b[1]-a[1])/2,la=(mercator(a[0])+mercator(b[0]))/2,span=Math.max(.4,Math.abs(wrap(b[1]-a[1]))*2,Math.abs(mercator(b[0])-mercator(a[0]))*3),Q=p=>[563+wrap(p[1]-lo)*205/span,407-(mercator(p[0])-la)*205/span],A=Q(a),F=Q(b),scaleKm=Math.min(50,Math.max(1,Math.round(delta/2))),scalePx=scaleKm/(111.195*Math.cos(a[0]*Math.PI/180))*205/span;
   svg+=`<g aria-label="Endpoint detail at a separate scale"><rect x="438" y="345" width="247" height="132" rx="4" fill="#071b27" stroke="#597b84"/><text x="450" y="363" fill="#cbdedc" font-size="10">ENDPOINT DETAIL · separate scale</text><path d="M${A.join(',')}L${F.join(',')}" stroke="#e7efe7" stroke-width="1.5" marker-end="url(#${id}-arrow)"/><circle cx="${A[0]}" cy="${A[1]}" r="5" fill="${colors[0]}"/><circle cx="${F[0]}" cy="${F[1]}" r="5" fill="${colors[1]}"/><text x="450" y="448" fill="#f2ac63" font-size="10">● Base</text><text x="505" y="448" fill="#62ddc0" font-size="10">● Feedback</text><text x="450" y="465" fill="#b9cecf" font-size="10">Correction ${fmt(delta)} km</text><path d="M${665-scalePx},460H665" stroke="#b9cecf"/><text x="665" y="450" text-anchor="end" fill="#b9cecf" font-size="9">≈${scaleKm} km</text></g>`;
  }
  $('#'+id).innerHTML=svg+'</g>';
 }
 draw('algo-own-map',own.map(p=>({p,color:colors[OWN.indexOf(p.model_id)]})),regions,true);
 draw('algo-other-map',[{p:selected,color:'#8bdec4',dashed:true},...external.map((p,i)=>({p,color:otherColors[i%otherColors.length]}))],[],false);
 const pair=forecastRegions(own,hours(),level()),b=pair.find(r=>r.model_id===OWN[0]),f=pair.find(r=>r.model_id===OWN[1]);
 $('#algo-region-comparison').innerHTML=pair.map(r=>`<tr><td>${esc(LABELS[r.model_id])}</td><td>${fmt(r.point[`radius_${level()}_km`])} km</td><td>${fmt(r.area,0)}</td><td>${r.point.calibration_n??'—'}</td><td>${level()}%</td></tr>`).join('');
 $('#algo-region-note').textContent=base&&feedback?`+${hours()}h correction ${fmt(distance(ll(base),ll(feedback)))} km. ${b&&f?'Feedback / baseline issued area '+fmt(f.area/b.area,3)+'×. ':''}Both outlines use the actual published circular thresholds; no retrospective area rescaling. ${truthState(selected,hours())} Closer paths alone do not establish equal uncertainty or forecast skill.`:'No paired region at this lead.';
}
function truthState(selected,h){const truth=verified(D.verification,h).find(r=>r.model_id===selected.model_id&&r.issue_time_utc===selected.issue_time_utc);return truth?'This issue has verified truth; consult the score table.':'This issue is not yet verified; a better forecast cannot be identified before truth arrives.';}
const average=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function lockedComparison(){
 const ids=new Set(['ATCF:CMC','ATCF:UKM','ATCF:NGX',...PUBLIC_OWN]);
 $('#algo-retro').innerHTML=(B.external_common??[]).filter(r=>r.lead_h===hours()&&ids.has(r.model_id)).map(r=>`<tr class="${OWN.includes(r.model_id)?'our-row':''}"><td>${esc(LABELS[r.model_id]??r.model_id)}</td><td>${r.n}</td><td>${fmt(r.mean_error_km,2)}</td></tr>`).join('')||'<tr><td colspan="3">No original common cohort at this lead.</td></tr>';
}
function historicalVerification(h){
 const rows=historicalRows(H,h),models=[...new Set(rows.map(r=>r.model_id))],pair=historicalPair(H,OWN[1],OWN[0],h);
 const pending=verificationState(D.verification,OWN[1],h),kind=h<=24?'endpoint ellipses · geometry128 / score256':'endpoint circles · last100 mature errors';
 $('#verification-title').textContent='Forecast verification · completed hindcast';
 $('#algo-ledger-note').textContent=`Historical CHAMPI replay with revised truth. All forecasts use issue-time features and mature residuals. These scored samples are separate from forecasts published before their targets.`;
 $('#algo-verification-status').textContent=`Completed hindcast · +${h}h · ${pair.n} paired baseline / feedback cases. Public ledger: ${pending.scored} scored${pending.awaitingTarget?' · '+pending.awaitingTarget+' awaiting target':''}${pending.awaitingTruth?' · '+pending.awaitingTruth+' awaiting source truth':''}${pending.nextValid?' · next target '+time(pending.nextValid):''}.`;
 $('#algo-verify-method').textContent=`Reference: Vector residual feedback · ${level()}% ${kind}. Historical evaluation; not a prospective score.`;
 $('#algo-verification-methods').innerHTML=historicalScores(H,models,h,level()).map(r=>`<tr class="${r.model_id===OWN[1]?'feedback-row':''}"><td>${esc(LABELS[r.model_id]??r.model_id)}</td><td>${r.n}</td><td>${fmt(r.mae)}</td><td>${r.regionN?fmt(r.coverage*100)+'% ('+r.regionN+') / '+level()+'%':'Not supplied'}</td><td>${fmt(r.area,0)}</td></tr>`).join('');
 $('#algo-score-note').textContent='Historical scores have method-specific sample counts. The paired table below uses the exact same storm, issue, lead, valid time and truth for both forecasts. CMA / BABJ has no exact-origin archive in this snapshot.';
 $('#algo-pair-title').textContent='Residual feedback versus each comparator · historical matched cycles';
 $('#algo-forward').innerHTML=models.filter(id=>id!==OWN[1]).map(id=>{const v=historicalPair(H,OWN[1],id,h);return v.n?`<tr><td>Vector residual feedback<br><small>vs ${esc(LABELS[id]??id)}</small></td><td>${v.n}</td><td>${fmt(v.own)} / ${fmt(v.other)}</td><td>${v.wins} / ${v.n}</td></tr>`:'';}).join('');
 $('#algo-all-leads').innerHTML=[6,12,24,48,72].map(lead=>{const v=historicalPair(H,OWN[1],OWN[0],lead);return `<tr><td>+${lead}h</td><td>${v.n}</td><td>${fmt(v.other,2)}</td><td>${fmt(v.own,2)}</td><td>Completed hindcast · revised truth</td></tr>`;}).join('');
}
function verification(){
 const ledger=D.verification,selectedLead=$('#algo-verify-lead').value,h=selectedLead==='auto'?defaultVerificationLead(ledger,OWN[1]):+selectedLead;
 lockedComparison();
 if(H&&evaluationMode($('#algo-evaluation-mode').value,ledger,h)==='hindcast'){historicalVerification(h);return;}
 $('#verification-title').textContent='Forecast verification · public ledger';
 $('#algo-score-note').textContent='Prospective scores require public confirmation before the target and a subsequently retrieved truth. Missing cases are not zero-error forecasts. Completed historical results are available in the evaluation selector.';
 $('#algo-pair-title').textContent='Residual feedback versus each comparator · public matched cycles';
 const ownState=verificationState(ledger,OWN[1],h),models=new Set(['CMA / BABJ',...D.model.paths.map(p=>p.model_id),...(ledger?.records??[]).map(r=>r.model_id)]);models.delete(OWN[1]);for(const id of [...models])if(id.startsWith('TabPFN')&&!PUBLIC_OWN.includes(id))models.delete(id);
 $('#algo-ledger-note').textContent=ledger?`Protocol started ${time(ledger.started_at_utc)} · ${ledger.records.length} forecast versions retained · ${ledger.records.filter(r=>r.eligible).length} confirmed before target. Verification lead +${h}h is independent of the map lead.`:'Waiting for the first public forecast ledger. Historical forecasts cannot be backfilled as prospective.';
 $('#algo-verification-status').textContent=`+${h}h · ${ownState.scored} verified · ${ownState.awaitingTarget} awaiting target · ${ownState.awaitingTruth} awaiting a source fix${ownState.nextValid?' · next target '+time(ownState.nextValid):''}.`;
 $('#algo-verify-method').textContent=`Reference: Vector residual feedback · +${h}h · ${level()}% conformal target`;
 const modelIds=[...PUBLIC_OWN,...[...models].filter(id=>!PUBLIC_OWN.includes(id))];
 $('#algo-verification-methods').innerHTML=modelScores(ledger,modelIds,h,level()).map(r=>`<tr class="${r.model_id===OWN[1]?'feedback-row':''}"><td>${esc(LABELS[r.model_id]??r.model_id)}</td><td>${r.n}</td><td>${fmt(r.mae)}</td><td>${r.regionN?fmt(r.coverage*100)+'% ('+r.regionN+') / '+level()+'%':PUBLIC_OWN.includes(r.model_id)?'— (no verified region)':'Not supplied'}</td><td>${fmt(r.area,0)}</td></tr>`).join('');
 const paired=[...models].map(id=>({id,v:pairedScore(ledger,OWN[1],id,h,level())})).filter(r=>r.v.n);
 const wait=ownState.awaitingTruth?'Awaiting the source observation for the reached target.':ownState.awaitingTarget?`Target not reached. Next target ${time(ownState.nextValid)}.`:'No eligible forecast was published before this target.';
 $('#algo-forward').innerHTML=paired.length?paired.map(({id,v})=>`<tr><td>Vector residual feedback<br><small>vs ${esc(LABELS[id]??id)}</small></td><td>${v.n}</td><td>${fmt(v.own)} / ${fmt(v.other)}</td><td>${v.wins} / ${v.n}</td></tr>`).join(''):`<tr><td colspan="4" class="verification-empty">No scored public pair at +${h}h. ${esc(wait)} Choose “Completed CHAMPI hindcast” to inspect existing scored comparisons.</td></tr>`;
 $('#algo-all-leads').innerHTML=[6,12,24,48,72].map(lead=>{const values=verified(ledger,lead),rows=PUBLIC_OWN.map(id=>values.filter(r=>r.model_id===id)),state=verificationState(ledger,method(),lead);return `<tr><td>+${lead}h</td><td>${rows[PUBLIC_OWN.indexOf(method())].length}</td>${rows.map(a=>`<td>${fmt(average(a.map(r=>r.error)),2)}</td>`).join('')}<td>${state.nextValid?time(state.nextValid):state.awaitingTruth?'Awaiting source fix':state.scored?'Verified':'No eligible forecast'}</td></tr>`;}).join('');
}
function render(){
 if(!D||!G||!B)return;
 const own=D.model.paths.filter(p=>PUBLIC_OWN.includes(p.model_id)),selected=own.find(p=>p.model_id===method());if(!selected)throw Error('Selected research path is unavailable');
 const target=point(selected,hours()),base=point(own.find(p=>p.model_id===OWN[0]),hours()),external=comparators(D,selected.issue_time_utc,$('#algo-pairing').value),state=operationalState(D),expired=target&&Date.parse(target.valid_time_utc)<=Date.now();
 $('#algo-state').textContent=expired?'Target reached':state.forecastStale?'Input delayed':'Latest model cycle';
 $('#algo-status').classList.toggle('warn',!!error||state.forecastStale||expired);
 $('#algo-status').textContent=[error,`Model issue ${time(selected.issue_time_utc)} · Generated ${time(selected.generated_at_utc)} · Feed checked ${time(D.last_checked_at_utc)}`,state.forecastStale?'Input is delayed; the original model version is retained.':'',expired?'The selected target has passed; this forecast is retained for verification.':'',D.agency_forecasts?.ok===false?'CMA retrieval failed; its previous version is retained.':'',state.watcherStale?'Feed check overdue.':'',state.failedSources.length?'Source checks failed: '+state.failedSources.join(', ')+'.':''].filter(Boolean).join(' ');
 $('#algo-own-clock').textContent=`${LABELS[method()]} · Issue ${time(selected.issue_time_utc)} · Actual local inference · Baseline and feedback paths & regions`;
 $('#algo-target').textContent=target?`${fmt(target.lat_deg,2)}°N / ${fmt(target.lon_deg,2)}°E`:'Not available';$('#algo-target-time').textContent=target?`+${hours()}h · Valid ${time(target.valid_time_utc)}`:'No interpolation or invented forecast';
 $('#algo-correction').textContent=base&&target?fmt(distance(ll(base),ll(target)))+' km':'—';
 const radius=target?.[`radius_${level()}_km`];$('#algo-radius').textContent=Number.isFinite(radius)?fmt(radius)+' km radius':'No calibrated threshold';$('#algo-area').textContent=`${level()}% target · +${hours()}h marginal position · ${fmt(area(radius),0)} km² · Calibration n=${target?.calibration_n??'—'}`;
 const coast=(selected.landfall_candidates??[]).find(p=>Date.parse(p.valid_time_utc)>Date.now()&&Date.parse(p.valid_time_utc)<=Date.parse(selected.issue_time_utc)+hours()*3600000),regions={'台湾附近':'Taiwan','浙江沿海附近':'Zhejiang coast','福建沿海附近':'Fujian coast','上海/江苏沿海附近':'Shanghai / Jiangsu coast','日本九州附近':'Kyushu','日本四国附近':'Shikoku','日本本州附近':'Honshu','日本北海道附近':'Hokkaido','朝鲜半岛南部附近':'Southern Korea','琉球群岛附近':'Ryukyu Islands'};
 $('#algo-coast').textContent=coast?(regions[coast.region]??'Coastal crossing')+' · '+time(coast.valid_time_utc):'No crossing in selected window';
 $('#algo-other-legend').innerHTML='<span class="c1">┄ Selected research forecast</span>'+external.map((p,i)=>`<span class="other-${i%otherColors.length}">${esc(LABELS[p.model_id]??p.model_id)} · ${esc(time(p.issue_time_utc))}</span>`).join('');
 const missing=external.filter(p=>!point(p,hours())).map(p=>p.model_id);$('#algo-other-note').textContent=`${$('#algo-pairing').value==='matched'?'Only paths from the same data cutoff are shown. Models retain their actual computation times.':'Latest source cycles; display only, not a matched skill ranking.'}${external.length?'':' No external path at the selected issue.'}${missing.length?' No original +'+hours()+'h point: '+missing.join(', ')+'.':''}`;
 maps(own,external,selected);verification();
}
async function load(){if(busy)return;busy=true;$('#algo-refresh').disabled=true;try{
 const fetchJSON=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' '+r.status);return r.json();};
 const [d,g,b,h]=await Promise.all([fetchJSON('assets/champi-operations.json'),G??fetchJSON('assets/coastline.json'),B??fetchJSON('assets/direct-guidance.json'),H??fetchJSON('assets/direct-hindcast-verification.json').catch(()=>null)]);
 if(!PUBLIC_OWN.every(id=>d.model?.paths.some(p=>p.model_id===id)))throw Error('Research forecast unavailable');D=d;G=g;B=b;H=h;error='';render();
 }catch(e){error='Feed unavailable: '+e.message+'. Last successful version retained.';$('#algo-status').textContent=error;$('#algo-status').classList.add('warn');}finally{busy=false;$('#algo-refresh').disabled=false;}}
for(const id of ['algo-method','algo-lead','algo-level','algo-pairing','algo-verify-lead','algo-evaluation-mode','algo-region-mode'])$('#'+id).addEventListener('change',()=>{try{view={zoom:1,dx:0,dy:0};render();}catch(e){$('#algo-status').textContent='Display error: '+e.message;}});
for(const [id,factor] of [['algo-zoom-in',1.3],['algo-zoom-out',1/1.3],['algo-map-reset',0]])$('#'+id).addEventListener('click',()=>{view=factor?{...view,zoom:Math.min(8,Math.max(.5,view.zoom*factor))}:{zoom:1,dx:0,dy:0};render();});
for(const id of ['algo-own-map','algo-other-map']){const el=$('#'+id);if(!el.setPointerCapture)continue;let drag=null;el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,dx:view.dx,dy:view.dy};el.setPointerCapture(e.pointerId);});el.addEventListener('pointermove',e=>{if(!drag)return;const scale=700/el.getBoundingClientRect().width;view.dx=drag.dx+(e.clientX-drag.x)*scale;view.dy=drag.dy+(e.clientY-drag.y)*scale;render();});el.addEventListener('pointerup',()=>drag=null);el.addEventListener('pointercancel',()=>drag=null);el.addEventListener('wheel',e=>{e.preventDefault();view.zoom=Math.min(8,Math.max(.5,view.zoom*(e.deltaY<0?1.12:1/1.12)));render();},{passive:false});}
$('#algo-refresh').onclick=load;load();setInterval(load,60000);
