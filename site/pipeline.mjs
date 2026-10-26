const target=document.querySelector('#pipeline-live');
const time=x=>x?new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'}).format(new Date(x)):'Not recorded';
function render(v){
 const p=v.data_profile??{},obs=v.observations??[],rows=[['Model issue · UTC',time(v.model.input_last_valid_utc)],['Model generated · UTC',time(v.generated_at_utc)],['Feed checked · UTC',time(v.last_checked_at_utc)],['Input fixes',(p.observation_count??obs.length)+' / 6h grid'],['Observation range · UTC',time(p.first_valid_utc??obs[0]?.valid_time_utc)+' → '+time(p.last_valid_utc??obs.at(-1)?.valid_time_utc)],['Publication mode',v.publication?.mode==='mac_auto'?'Mac · automatic model publication':'Historical cache'],['Missing wind / pressure',(p.missing_wind_count??obs.filter(x=>x.vmax_kt==null).length)+' / '+(p.missing_pressure_count??obs.filter(x=>x.mslp_hpa==null).length)],['Input features','Baseline 52 / vector-feedback input 70'],['Observation file SHA256',v.track_source?.sha256??'Not recorded']];
 const dl=document.createElement('dl');for(const [label,value]of rows){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);dl.append(div);}target.replaceChildren(dl);
 const stale=Date.now()-Date.parse(v.last_checked_at_utc)>90*60e3||Date.now()-Date.parse(v.model.input_last_valid_utc)>24*3600e3;
 if(stale){const note=document.createElement('p');note.className='warning';note.textContent='The source check or model input is delayed. Refer to its original version time.';target.append(note);}
}
async function load(){try{const r=await fetch('assets/champi-operations.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);render(await r.json());}catch{target.textContent='Public version unavailable.';}}
load();setInterval(load,60000);
