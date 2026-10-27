export function datasetEvidence(data,id='electricity'){
 const r=data.datasets.find(r=>r.dataset===id);if(!r)throw Error('Unknown evidence dataset');
 if(r.per_origin.length!==r.origins)throw Error('Incomplete evaluation window');
 const average=key=>r.per_origin.reduce((s,p)=>s+p[key],0)/r.origins;
 for(const [key,value] of [['base_mae',r.base.mae],['feedback_mae',r.feedback.mae]])if(Math.abs(average(key)-value)>1e-9*Math.max(1,value))throw Error('Aggregate and origin errors disagree');
 return r;
}
export const reduction=(base,feedback)=>100*(1-feedback/base);
export const gainClass=change=>change>=0?'gain':'neutral';
