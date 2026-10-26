import {operationalState,hoursSince} from './operations-engine.mjs?v=terminal1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=t=>Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' UTC':'Not reported';
const fmt=(x,n=1)=>Number.isFinite(x)?x.toFixed(n):'—';
export function monitorFacts(d,now=Date.now()){
 const obs=d.observations.filter(o=>Date.parse(o.valid_time_utc)<=now).at(-1),warning=d.official?.warning,state=operationalState(d,now);
 return {obs,warning,state,alert:warning?.status==='cancelled'?'National warning lifted':warning&& !state.warningStale?'CMA national warning': 'Warning status unverified'};
}
async function load(){try{
 const r=await fetch('assets/champi-operations.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);const d=await r.json(),{obs,warning,state,alert}=monitorFacts(d);
 $('#monitor-clock').textContent='Feed checked '+time(d.last_checked_at_utc);
 $('#monitor-alert').textContent=alert;$('#monitor-alert').classList.toggle('lifted',warning?.status==='cancelled');
 $('#monitor-facts').innerHTML=[['Latest tracking fix',obs?`${fmt(obs.lat_deg)}°N / ${fmt(obs.lon_deg)}°E`:'—',time(obs?.valid_time_utc)],['Maximum wind',`${fmt(obs?.vmax_kt,0)} <small>kt</small>`,'UCAR B-deck · source averaging period unverified'],['Central pressure',`${fmt(obs?.mslp_hpa,0)} <small>hPa</small>`,'UCAR B-deck · current observed fix'],['National advisory',warning?.status==='cancelled'?'Lifted':warning&&!state.warningStale?'Issued':'Unverified',warning?time(warning.issued_at_utc):'Check the official source']].map(([a,b,c])=>`<article><span>${a}</span><strong>${b}</strong><small>${esc(c)}</small></article>`).join('');
 const feed=state.watcherStale?'Feed check overdue':'Feed checks running',lag=hoursSince(obs?.valid_time_utc);
 $('#monitor-freshness').innerHTML=`<span class="source-dot ${state.watcherStale?'late':''}"></span><b>${feed}</b><span>Observed fix ${fmt(lag)} h ago</span><span>Model issue ${time(d.model.input_last_valid_utc)}</span><span>${warning?.status==='cancelled'?'CMA cancellation confirmed · latest general bulletin may concern another storm':'Official advisories keep their original issue times'}</span>`;
 }catch(e){$('#monitor-clock').textContent='Feed unavailable';$('#monitor-freshness').textContent='Public feed could not be read. Check the official advisory.';}}
load();setInterval(load,60000);
