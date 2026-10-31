const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v.replace(' ','T')))+' UTC';
const colors={T0:'#efb779',T1:'#72d8c2',truth:'#d9c6dc',past:'#809eaa'};
async function json(path){const response=await fetch(path);if(!response.ok)throw new Error(`${path}: ${response.status}`);return response.json();}
async function verification(){try{const data=await json('assets/infa-prospective-results.json'),main=data.all_verified.find(r=>r.version==='v1'&&r.lead_h===36),short=data.all_verified.find(r=>r.version==='v2'&&r.lead_h===12);if(!main||!short)throw new Error('Featured records unavailable');
$('hero-gain').textContent=`${main.improvement_pct.toFixed(1)}%`;
$('metric-distance').textContent=`${main.base_err_km.toFixed(1)} → ${main.corrected_err_km.toFixed(1)} km`;
$('metric-short').textContent=`${short.improvement_pct.toFixed(1)}% less error`;
try{const el=await json('assets/electricity-distribution-results.json');$('metric-electricity').textContent=`${el.native_distribution.crps_mean.rel_reduction_pct.toFixed(1)}% lower CRPS`;}catch(e){$('metric-electricity').textContent='28.7% lower CRPS';}
$('ledger-summary').textContent=`${data.all_verified.length} verified forecasts from one IN-FA issue. Each version and horizon is shown below, with its observed position error.`;
$('ledger-date').textContent=`Published snapshot · ${date(data.metadata.generated)}`;
$('ledger-rows').innerHTML=data.all_verified.map(r=>`<tr><td>${esc(r.version.toUpperCase())}</td><td>+${r.lead_h}h</td><td>${esc(date(r.valid))}</td><td>${r.base_err_km.toFixed(1)}</td><td>${r.corrected_err_km.toFixed(1)}</td><td>${r.improvement_km.toFixed(1)} km · ${r.improvement_pct.toFixed(1)}%</td></tr>`).join('');
const rows=data.all_verified.filter(r=>r.version==='v1').sort((a,b)=>a.lead_h-b.lead_h),max=Math.ceil(Math.max(...rows.map(r=>r.base_err_km))/100)*100;
const X=h=>65+(h-6)/30*510,Y=e=>330-e/max*260;let s='<text x="65" y="32" fill="#b0c5bc" font-size="11" font-family="monospace">POSITION ERROR / KM</text>';
for(let y=0;y<=max;y+=100)s+=`<path d="M65 ${Y(y)}H600" stroke="#2c474a"/><text x="25" y="${Y(y)+4}" fill="#8aa9a1" font-size="10">${y}</text>`;
for(const [key,color,label]of[['base_err_km',colors.T0,'Base forecast'],['corrected_err_km',colors.T1,'Residual corrected']]){s+=`<path d="${rows.map((r,i)=>`${i?'L':'M'}${X(r.lead_h)},${Y(r[key])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>`;for(const r of rows)s+=`<circle cx="${X(r.lead_h)}" cy="${Y(r[key])}" r="4" fill="${color}"><title>${label}, +${r.lead_h}h: ${r[key].toFixed(1)} km</title></circle>`;}
for(const r of rows)s+=`<text x="${X(r.lead_h)}" y="355" fill="#9eb9af" font-size="11" text-anchor="middle">+${r.lead_h}h</text>`;
s+='<path d="M65 390h22" stroke="#efb779" stroke-width="3"/><text x="97" y="394" fill="#b8c7bc" font-size="11">Base forecast</text><path d="M270 390h22" stroke="#72d8c2" stroke-width="3"/><text x="302" y="394" fill="#b8c7bc" font-size="11">Residual corrected</text>';$('hero-chart').innerHTML=s;
}catch(error){$('ledger-summary').textContent='The verification data could not be loaded. Please reload this page.';$('load-status').textContent='Some published data are currently unavailable.';console.error(error);}}
async function explorer(){try{const [data,coast]=await Promise.all([json('assets/two-stage-0a.json'),json('assets/coastline.json')]);let stormId='INFA_2026';
function setup(){const storm=data.storms[stormId];$('issue').innerHTML=storm.cycles.map((c,i)=>`<option value="${i}">${esc(date(c.issue_time_utc))}</option>`).join('');const preferred=storm.cycles.findIndex(c=>c.issue_time_utc.startsWith('2026-10-22 00:00'));$('issue').value=String(preferred>=0?preferred:0);$('truth').checked=false;render();}
function render(){const storm=data.storms[stormId],cycle=storm.cycles[+$('issue').value],lead=+$('lead').value,cutoff=Date.parse(cycle.issue_time_utc.replace(' ','T')),past=storm.observed_track.filter(p=>Date.parse(p.valid_at_utc.replace(' ','T'))<=cutoff).slice(-8),available=storm.observed_track.filter(p=>Date.parse(p.valid_at_utc.replace(' ','T'))>cutoff&&Date.parse(p.valid_at_utc.replace(' ','T'))<=cutoff+lead*3600000),truth=$('truth').checked?available:[];
$('truth').disabled=!available.length;
const paths=cycle.paths.filter(p=>(p.model==='T0'&&$('base').checked)||(p.model==='T1'&&$('corrected').checked)).map(p=>({...p,points:p.points.filter(q=>q.lead_h<=lead)}));
// Bounds stay fixed when layers toggle, so comparisons retain their spatial frame.
const allForecasts=cycle.paths.filter(p=>['T0','T1'].includes(p.model)).flatMap(p=>p.points.filter(q=>q.lead_h<=lead));
const coords=[...past,...allForecasts,...available,cycle.observed_center],lo=coords.map(p=>p.lon),la=coords.map(p=>p.lat),cx=(Math.min(...lo)+Math.max(...lo))/2,cy=(Math.min(...la)+Math.max(...la))/2,cos=Math.cos(cy*Math.PI/180),aspect=900/550;
let w=Math.max(5,Math.max(...lo)-Math.min(...lo)+3),h=Math.max(4,Math.max(...la)-Math.min(...la)+3);w=Math.max(w,h*aspect/cos);h=w*cos/aspect;
const x0=cx-w/2,y0=cy-h/2,P=p=>[(p.lon-x0)/w*900,550-(p.lat-y0)/h*550],line=pts=>pts.map((p,i)=>`${i?'L':'M'}${P(p).map(n=>n.toFixed(2)).join(',')}`).join(' ');
let s='<defs><clipPath id="map-clip"><rect width="900" height="550"/></clipPath></defs><g clip-path="url(#map-clip)"><rect width="900" height="550" fill="#0c232b"/>';
const step=w>25?10:5;
for(let x=Math.ceil(x0/step)*step;x<x0+w;x+=step){const [px]=P({lon:x,lat:y0});s+=`<path d="M${px},0V550" stroke="#24414a" stroke-dasharray="2 7"/><text x="${px+6}" y="535" fill="#78969c" font-size="11">${x}°E</text>`;}
for(let y=Math.ceil(y0/5)*5;y<y0+h;y+=5){const [,py]=P({lat:y,lon:x0});s+=`<path d="M0,${py}H900" stroke="#24414a" stroke-dasharray="2 7"/><text x="10" y="${py-7}" fill="#78969c" font-size="11">${y}°N</text>`;}
for(const ring of coast.rings){s+=`<path d="${line(ring.map(([lon,lat])=>({lon,lat})))}Z" fill="#1c383d" stroke="#4a6968" stroke-width=".8"/>`;}
for(const [name,lat,lon]of[['TAIWAN',23.7,120.5],['RYUKYU ISLANDS',26.5,128],['JAPAN',33,133],['PHILIPPINES',13,122]]){const [x,y]=P({lat,lon});s+=`<text x="${x}" y="${y}" text-anchor="middle" fill="#98ada4" font-size="10" letter-spacing="1.5">${name}</text>`;}
s+=`<path d="${line(past)}" fill="none" stroke="${colors.past}" stroke-width="2"/>`;
if(truth.length)s+=`<path d="${line([cycle.observed_center,...truth])}" fill="none" stroke="${colors.truth}" stroke-width="2.5" stroke-dasharray="4 6"/>`;
for(const path of paths){s+=`<path d="${line([cycle.observed_center,...path.points])}" fill="none" stroke="${colors[path.model]}" stroke-width="3" ${path.model==='T0'?'stroke-dasharray="8 5"':''}/>`;for(const q of path.points){const [x,y]=P(q);s+=`<circle cx="${x}" cy="${y}" r="4" fill="${colors[path.model]}"><title>${path.model==='T0'?'Base':'Corrected'} +${q.lead_h}h · ${q.lat.toFixed(2)}°N, ${q.lon.toFixed(2)}°E</title></circle>`;}}
const [x,y]=P(cycle.observed_center);s+=`<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#c2d6cc" opacity=".3"/><circle cx="${x}" cy="${y}" r="5" fill="#e3eadc"/><text x="${x+16}" y="${y+4}" fill="#d2dfd3" font-size="11">Issue position</text></g>`;$('track-map').innerHTML=s;
$('map-name').textContent=`${stormId==='INFA_2026'?'IN-FA':'CHAMPI'} · ${date(cycle.issue_time_utc)} · +${lead}h`;
$('position').textContent=`${cycle.observed_center.lat.toFixed(2)}°N / ${cycle.observed_center.lon.toFixed(2)}°E`;$('generated').textContent=date(cycle.generated_at_utc);
$('case-title').textContent=stormId==='INFA_2026'?'A forecast, then a correction.':'Where the track changes.';
$('case-description').textContent=stormId==='INFA_2026'?'Amber traces the base forecast. Teal shows the position after adding the learned residual. Compare the verified outcomes in the ledger below.':'Compare frozen forecasts around the turn near Taiwan. Reveal the realized track to inspect where the forecast followed the motion—and where it diverged.';
$('map-note').textContent=available.length?'Realized track is an optional retrospective comparison. Lines connect native forecast points.':'This frozen map bundle contains observations through the issue time. Later verification is recorded separately below.';
}
for(const button of document.querySelectorAll('[data-storm]'))button.addEventListener('click',()=>{stormId=button.dataset.storm;document.querySelectorAll('[data-storm]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));setup();});for(const id of ['issue','lead','base','corrected','truth'])$(id).addEventListener('change',render);setup();
}catch(error){$('load-status').textContent='The forecast map could not be loaded. Reload the page or download the frozen data from the research notebook.';console.error(error);}}
await Promise.all([verification(),explorer()]);
