import {OWN,point,area,pairedScore,sameTime} from './algorithm-engine.mjs?v=direct1';
import {distance} from './engine.mjs';
export function correctionImpact(data,lead){
 const [base,feedback]=[OWN[0],OWN[1]].map(m=>data.model.paths.find(p=>p.model_id===m));
 if(!base||!feedback||!sameTime(base.issue_time_utc,feedback.issue_time_utc))return null;
 const b=point(base,lead),f=point(feedback,lead);if(!b||!f||!sameTime(b.valid_time_utc,f.valid_time_utc))return null;
 const ba=area(b.radius_90_km),fa=area(f.radius_90_km);
 return {base:b,feedback:f,shift:distance([b.lat_deg,b.lon_deg],[f.lat_deg,f.lon_deg]),ratio:ba>0&&fa!==null?fa/ba:null,
   verified:pairedScore(data.verification,OWN[1],OWN[0],lead,90)};
}
export function deskCycle(data,lead,now=Date.now()){
 const paths=OWN.map(m=>data.model.paths.find(p=>p.model_id===m));
 if(paths.some(p=>!p)||!sameTime(paths[0].issue_time_utc,paths[1].issue_time_utc))return null;
 const points=paths.map(p=>point(p,lead));
 if(points.some(p=>!p)||!sameTime(points[0].valid_time_utc,points[1].valid_time_utc))return null;
 const target=points[1].valid_time_utc,elapsed=Date.parse(target)<=now;
 const observed=(data.observations??[]).some(p=>sameTime(p.valid_time_utc,target));
 return {issue:paths[1].issue_time_utc,target,elapsed,observed,
  state:!elapsed?'future':observed?'elapsed_with_fix':'elapsed_awaiting_fix',
  protocol:data.model.protocol_id??'unreported',
  calibration:points.map(p=>({n:p.calibration_n??null,rank:Number.isInteger(p.calibration_n)?Math.ceil((p.calibration_n+1)*.9):null})),
  geometry:'issued marginal rank circles',usesSPCI:false};
}
export function analysisRows(data,model,lead){
 const path=data.model.paths.find(p=>p.model_id===model),a=data.forecast_analysis?.paths.find(p=>p.model_id===model&&sameTime(p.issue_time_utc,path?.issue_time_utc));
 if(!path||!a)return [];
 return a.points.filter(q=>q.lead_h<=lead&&path.points.some(p=>p.lead_h===q.lead_h&&sameTime(p.valid_time_utc,q.valid_time_utc)&&Math.abs(p.lat_deg-q.lat_deg)<1e-7&&Math.abs(p.lon_deg-q.lon_deg)<1e-7));
}
