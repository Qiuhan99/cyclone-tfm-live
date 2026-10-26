import {guidanceEvidence,guidanceCycles,guidanceCase,guidanceRegion,GUIDANCE_MODELS} from './guidance-benchmark-engine.mjs?v=names1';
import {wrap,mercator} from './engine.mjs';
const $=s=>document.querySelector(s),ll=p=>[p.lat_deg,p.lon_deg],fmt=x=>x.toFixed(1);
const time=t=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' UTC';
let data,bundle,coast,active=new Set(GUIDANCE_MODELS.map(m=>m.id));
function mapSVG(e,detail=false){
 const W=detail?360:1040,H=detail?230:550,rows=e.rows.filter(r=>active.has(r.id)),regions=$('#guidance-regions').checked&&!detail?rows.map(r=>({row:r,points:guidanceRegion(r.endpoint)})).filter(r=>r.points.length):[];
 const truth=e.cycle.truth.filter(p=>Date.parse(p.valid_time_utc)<=e.valid).map(ll),past=e.cycle.history.map(ll),coords=detail?[ll(e.truth),...rows.map(r=>ll(r.endpoint))]:[...past,...truth,...rows.flatMap(r=>r.points.map(ll)),...regions.flatMap(r=>r.points)];
 const lo0=e.cycle.anchor[1],xx=p=>lo0+wrap(p[1]-lo0),xs=coords.map(xx),ys=coords.map(p=>mercator(p[0])),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const top=detail?45:0,plotH=H-top;
 let sx=Math.max(detail?1.5:5,(Math.max(...xs)-Math.min(...xs))*1.25),sy=Math.max(detail?1:3,(Math.max(...ys)-Math.min(...ys))*1.25);if(sx/sy<W/plotH)sx=sy*W/plotH;else sy=sx*plotH/W;
 const P=p=>[W/2+(xx(p)-cx)*W/sx,(H+top)/2-(mercator(p[0])-cy)*plotH/sy],line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(v=>v.toFixed(2)).join(',')}`).join(' '),clip=detail?'guidance-detail-clip':'guidance-map-clip';
 let svg=`<defs><clipPath id="${clip}"><rect width="${W}" height="${H}"/></clipPath><marker id="${clip}-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#cce8e1"/></marker></defs><g clip-path="url(#${clip})"><rect width="${W}" height="${H}" fill="#102b38"/>`;
 for(const ring of coast.rings){if(ring.some(([lo,la])=>Math.abs(xx([la,lo])-cx)<sx&&Math.abs(mercator(la)-cy)<sy))svg+=`<path d="${line(ring.map(([lo,la])=>[la,lo]))}Z" fill="#25434b" stroke="#607d83" stroke-width=".6"/>`;}
 for(let la=0;la<70;la+=5)svg+=`<path d="${line([[la,lo0-80],[la,lo0+80]])}" stroke="#a0bdc2" opacity=".16" stroke-dasharray="3 7"/>`;
 for(let lo=80;lo<220;lo+=10)svg+=`<path d="${line([[-5,lo],[70,lo]])}" stroke="#a0bdc2" opacity=".16" stroke-dasharray="3 7"/>`;
 if(!detail)for(const [name,p] of [['Taiwan',[23.7,121]],['Japan',[36,137]],['Korea',[37,127]],['Philippines',[13,122]],['China',[30,115]]]){const [x,y]=P(p);svg+=`<text x="${x}" y="${y}" fill="#b4c7c9" font-size="13">${name}</text>`;}
 for(const r of regions)svg+=`<path data-guidance-region="${r.row.id}" d="${line(r.points)}Z" fill="${r.row.color}" fill-opacity=".07" stroke="${r.row.color}" stroke-width="1.4" ${r.row.id===GUIDANCE_MODELS[0].id?'stroke-dasharray="6 4"':''}><title>${r.row.label}: archived 90% marginal position region, radius ${fmt(r.row.endpoint.radius_90_km)} km</title></path>`;
 if(!detail){svg+=`<path d="${line(past)}" fill="none" stroke="#a9bbbf" stroke-width="2.6"/><path d="${line([e.cycle.anchor,...truth])}" fill="none" stroke="#f1eee1" stroke-width="2" stroke-dasharray="4 5"/>`;const [x,y]=P(e.cycle.anchor);svg+=`<circle cx="${x}" cy="${y}" r="5" fill="#fff9dd" stroke="#102b38" stroke-width="2"><title>Observed issue position</title></circle>`;}
 for(const r of rows){const point=ll(r.endpoint),[x,y]=P(point),dash=r.id===GUIDANCE_MODELS[0].id?'stroke-dasharray="6 4"':'';if(detail)svg+=`<path d="${line([point,ll(e.truth)])}" fill="none" stroke="${r.color}" opacity=".5" stroke-dasharray="2 4"/>`;else{const ps=r.points[0]?.lead_h===0?r.points.map(ll):[e.cycle.anchor,...r.points.map(ll)];svg+=`<path data-guidance-path="${r.id}" d="${line(ps)}" fill="none" stroke="${r.color}" stroke-width="${r.id.endsWith('C1')?3.4:2.3}" ${dash}/>`;}svg+=`<circle cx="${x}" cy="${y}" r="${detail?5:4.5}" fill="${r.color}" stroke="#102b38" stroke-width="1"><title>${r.label} +${e.lead}h · ${fmt(r.error)} km endpoint error</title></circle>`;}
 if(detail&&active.has(GUIDANCE_MODELS[0].id)&&active.has(GUIDANCE_MODELS[1].id))svg+=`<path d="${line(e.rows.slice(0,2).map(r=>ll(r.endpoint)))}" fill="none" stroke="#cce8e1" stroke-width="1.4" marker-end="url(#${clip}-arrow)"><title>Base-to-feedback correction vector · unchanged coordinates</title></path>`;
 const [tx,ty]=P(ll(e.truth));svg+=`<path d="M${tx-6},${ty-6}l12,12m-12,0l12,-12" stroke="#fff8dc" stroke-width="2.5"><title>Observed +${e.lead}h truth</title></path><rect x="12" y="12" width="${detail?248:340}" height="29" rx="3" fill="#09212be6"/><text x="23" y="31" fill="#d3e5e4" font-family="ui-monospace,monospace" font-size="${detail?10:12}">${detail?'ENDPOINT DETAIL · independent extent':'ISSUED '+time(e.cycle.issue_time_utc)+' · +'+e.lead+'h'}</text></g>`;
 return svg;
}
function renderCase(){
 const e=guidanceCase(bundle,data,+$('#guidance-lead').value,$('#guidance-issue').value);
 $('#guidance-map').innerHTML=mapSVG(e);$('#guidance-detail').innerHTML=mapSVG(e,true);
 $('#guidance-case-time').textContent='Valid '+time(e.valid);
 $('#guidance-case-metrics').innerHTML=`<span>Baseline → residual feedback</span><strong>${fmt(e.rows[0].error)} → ${fmt(e.rows[1].error)} km</strong><p>Endpoint error · this cycle only</p><span>Correction magnitude</span><strong>${fmt(e.shift)} km</strong><p>Distance between the two predicted centres</p>`;
 $('#guidance-case-table').innerHTML=e.rows.map((r,i)=>`<tr><td><span class="guidance-dot guidance-color-${i}"></span>${r.label}</td><td>${fmt(r.error)}</td></tr>`).join('');
 $('#guidance-map-note').textContent=`Retrospective replay · issue ${time(e.cycle.issue_time_utc)} · target ${time(e.valid)}. Only cycles in the +${e.lead}h scored intersection are selectable. Dashed ivory: subsequent observed track; ×: endpoint truth. Lines join original forecast points; intermediate curves are not additional model outputs. ${$('#guidance-regions').checked?'Contours are the original research-model 90% marginal circles, not coverage-matched ellipses.':''}`;
 const cycles=guidanceCycles(bundle,e.lead),i=cycles.findIndex(c=>c.issue_time_utc===e.cycle.issue_time_utc);$('#guidance-prev').disabled=i===0;$('#guidance-next').disabled=i===cycles.length-1;
}
function render(){
 const e=guidanceEvidence(data,+$('#guidance-lead').value),cycles=guidanceCycles(bundle,e.lead),old=$('#guidance-issue').value;
 $('#guidance-scope').textContent=`CHAMPI locked retrospective snapshot · +${e.lead}h · ${e.n} common issue / valid-time pairs · one storm. Map and aggregate table use the same intersection; the detail panel describes one cycle.`;
 $('#guidance-table').innerHTML=e.rows.map(r=>`<tr class="${r.id.endsWith('C1')?'feedback-row':''}"><td>${r.label}<small>${r.kind}</small></td><td>${r.n}</td><td>${r.mae.toFixed(2)}</td></tr>`).join('');
 $('#guidance-issue').innerHTML=cycles.map(c=>`<option value="${c.issue_time_utc}">${time(c.issue_time_utc)}</option>`).join('');$('#guidance-issue').value=cycles.some(c=>c.issue_time_utc===old)?old:cycles.at(-1).issue_time_utc;renderCase();
}
async function init(){
 [data,bundle,coast]=await Promise.all(['motion-residual.json','guidance-paths.json','coastline.json'].map(async n=>{const r=await fetch('assets/'+n);if(!r.ok)throw Error(n+' '+r.status);return r.json();}));
 $('#guidance-models').innerHTML=GUIDANCE_MODELS.map((m,i)=>`<label><input type="checkbox" data-guidance-model="${m.id}" checked><span class="guidance-line guidance-color-${i}"></span>${m.label}</label>`).join('');
 for(const c of $('#guidance-models').querySelectorAll('input'))c.addEventListener('change',()=>{c.checked?active.add(c.dataset.guidanceModel):active.delete(c.dataset.guidanceModel);renderCase();});
 render();$('#guidance-lead').addEventListener('change',render);$('#guidance-issue').addEventListener('change',renderCase);$('#guidance-regions').addEventListener('change',renderCase);
 for(const [id,delta] of [['guidance-prev',-1],['guidance-next',1]])$('#'+id).addEventListener('click',()=>{const cycles=guidanceCycles(bundle,+$('#guidance-lead').value),i=cycles.findIndex(c=>c.issue_time_utc===$('#guidance-issue').value),next=cycles[i+delta];if(next){$('#guidance-issue').value=next.issue_time_utc;renderCase();}});
}
init().catch(e=>{$('#guidance-scope').textContent='Archived guidance comparison unavailable: '+e.message;});
