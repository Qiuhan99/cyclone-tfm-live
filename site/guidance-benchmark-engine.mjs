export const GUIDANCE_LEADS=[6,12,24,48,72];
export const GUIDANCE_MODELS=[
 {id:'TabPFN CV-F2',label:'TabPFN baseline',kind:'Research model · CV-F2'},
 {id:'TabPFN CV-F2 + C1',label:'Vector residual feedback',kind:'Research model · CV-F2 + C1'},
 {id:'ATCF:CMC',label:'ATCF:CMC',kind:'Archived track guidance'},
 {id:'ATCF:UKM',label:'ATCF:UKM',kind:'Archived track guidance'},
 {id:'ATCF:NGX',label:'ATCF:NGX',kind:'Archived track guidance'},
];
export function guidanceEvidence(data,lead=24){
 if(!GUIDANCE_LEADS.includes(lead)||data.config?.protocol!=='motion_residual_v1')throw Error('Unsupported guidance benchmark protocol or lead');
 const rows=GUIDANCE_MODELS.map(model=>{
  const found=(data.external_common??[]).filter(r=>r.model_id===model.id&&r.lead_h===lead);
  if(found.length!==1)throw Error('Incomplete or duplicate archived guidance comparison');
  const row=found[0];
  if(!Number.isInteger(row.n)||row.n<1||!Number.isFinite(row.mean_error_km)||row.mean_error_km<0)throw Error('Invalid archived guidance score');
  return {...model,n:row.n,mae:row.mean_error_km};
 });
 if(!rows.every(r=>r.n===rows[0].n))throw Error('Guidance rows must use the archived common cohort');
 return {rows,n:rows[0].n,lead};
}
