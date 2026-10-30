export const stamp=t=>Date.parse(String(t).replace(' ','T'));
export const iso=t=>new Date(stamp(t)).toISOString();
export const point=p=>({lat:p.lat??p.lat_deg,lon:p.lon??p.lon_deg,lead:p.lead_h,time:p.valid_at_utc??p.valid_time_utc,radius:p.radius_90_km,n:p.calibration_n});
export const COLORS=['#efb779','#72d8c2','#92bdf1','#c3a0eb','#ed9eaf','#d4ce86','#86bdc4','#c8aa85'];
export function distance(a,b){const rad=Math.PI/180,p=a.lat*rad,q=b.lat*rad;return 12742.0176*Math.asin(Math.min(1,Math.sqrt(Math.sin((q-p)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin((b.lon-a.lon)*rad/2)**2)));}
export function circle(p,r){const rad=Math.PI/180,a=p.lat*rad,b=p.lon*rad,d=r/6371.0088;return Array.from({length:73},(_,i)=>{const bearing=i*5*rad,lat=Math.asin(Math.sin(a)*Math.cos(d)+Math.cos(a)*Math.sin(d)*Math.cos(bearing)),lon=b+Math.atan2(Math.sin(bearing)*Math.sin(d)*Math.cos(a),Math.cos(d)-Math.sin(a)*Math.sin(lat));return {lat:lat/rad,lon:((lon/rad+540)%360)-180};});}
export function datasets(core,verified,guidance,operations,infaTruth=null){
 const result={};
 for(const [sid,s]of Object.entries(core.storms))result[sid]={label:`${sid==='INFA_2026'?'IN-FA':'CHAMPI'} / Two-stage v1`,protocol:'Two-stage TabPFN · frozen v1',scope:sid==='INFA_2026'?'Prospective case study':'Historical replay',cycles:s.cycles.map(c=>({issue:c.issue_time_utc,anchor:point(c.observed_center),history:s.observed_track.filter(p=>stamp(p.valid_at_utc)<=stamp(c.issue_time_utc)).map(point),truth:(sid==='INFA_2026'&&infaTruth?infaTruth.observations:s.observed_track).filter(p=>stamp(p.valid_at_utc)>stamp(c.issue_time_utc)).map(point),base:'T0',corrected:'T1',paths:c.paths.map(p=>({id:p.model,name:p.model==='T0'?'TabPFN base':p.model==='T1'?'Two-stage corrected':p.model,points:p.points.map(point)})),verified:verified.all_verified.filter(r=>r.version==='v1'&&stamp(r.issue)===stamp(c.issue_time_utc))}))};
 result.CHAMPI_CP={label:'CHAMPI / Calibrated feedback',protocol:'Direct vector residual feedback · separate experiment',scope:'Locked historical replay · nominal 90% endpoint regions',cycles:guidance.cycles.map(c=>({issue:c.issue_time_utc,anchor:{lat:c.anchor[0],lon:c.anchor[1]},history:c.history.map(point),truth:c.truth.map(point),base:'TabPFN Direct-F2',corrected:'TabPFN Direct-F2 + RF',paths:c.paths.map(p=>({id:p.model_id,name:p.model_id==='TabPFN Direct-F2'?'TabPFN direct base':p.model_id==='TabPFN Direct-F2 + RF'?'Vector residual feedback':p.model_id,points:p.points.map(point)}))}))};
 const issue=operations.model.model_origin_time_utc;
 result.CHAMPI_MODELS={label:'CHAMPI / Time-series & weather models',protocol:operations.model.protocol_id,scope:'Published model snapshot · individual model provenance retained',cycles:[{issue,anchor:point(operations.observations.filter(p=>stamp(p.valid_time_utc)<=stamp(issue)).at(-1)),history:operations.observations.filter(p=>stamp(p.valid_time_utc)<=stamp(issue)).map(point),truth:operations.observations.filter(p=>stamp(p.valid_time_utc)>stamp(issue)).map(point),base:'TabPFN Direct-F2',corrected:'TabPFN Direct-F2 + RF',paths:operations.model.paths.filter(p=>stamp(p.issue_time_utc??p.model_origin_time_utc??issue)===stamp(issue)).map(p=>({id:p.model_id,name:p.model_id==='TabPFN Direct-F2'?'TabPFN direct base':p.model_id==='TabPFN Direct-F2 + RF'?'Vector residual feedback':p.model_id,points:p.points.map(point)}))}]};
 return result;
}
export function frame(cycle,lead){
 const at=id=>cycle.paths.find(p=>p.id===id)?.points.find(p=>p.lead===lead);
 const base=at(cycle.base),corrected=at(cycle.corrected),time=base?.time??corrected?.time??new Date(stamp(cycle.issue)+lead*3600000).toISOString(),truth=cycle.truth.find(p=>stamp(p.time)===stamp(time));
 const ledger=cycle.verified?.find(r=>r.lead_h===lead&&stamp(r.valid)===stamp(time));
 const baseError=ledger?.base_err_km??(base&&truth?distance(base,truth):null),correctedError=ledger?.corrected_err_km??(corrected&&truth?distance(corrected,truth):null);
 return {base,corrected,time,truth,baseError,correctedError,gain:baseError!=null&&correctedError!=null?baseError-correctedError:null,shift:base&&corrected?distance(base,corrected):null};
}
export function region(p){return p&&Number.isFinite(p.radius)&&p.radius>0?{points:circle(p,p.radius),area:2*Math.PI*6371.0088**2*(1-Math.cos(p.radius/6371.0088)),n:p.n}:null;}
// Keep native aid identities in the archive; curate only their presentation.
export function modelGroups(cycle){const primary=[],archive=[];for(const p of cycle.paths){if(p.id===cycle.base||p.id===cycle.corrected||/Chronos|Moirai/.test(p.id)||/^ATCF:(CMC|UKM|NGX|AEMN)(?:$|[ /])/.test(p.id))primary.push(p);else archive.push(p);}return {primary,archive};}
export function nextPoint(cycle,lead){return cycle.paths.find(p=>p.id===cycle.corrected)?.points.filter(p=>p.lead>lead).sort((a,b)=>a.lead-b.lead)[0]??null;}
