import {guidanceEvidence} from './guidance-benchmark-engine.mjs?v=guidance1';
const $=s=>document.querySelector(s);
let data;
function render(){
 const e=guidanceEvidence(data,+$('#guidance-lead').value);
 $('#guidance-scope').textContent=`CHAMPI locked retrospective snapshot · +${e.lead}h · ${e.n} common issue / valid-time pairs · one storm. All rows use the archived intersection; sample counts can change with lead.`;
 $('#guidance-table').innerHTML=e.rows.map(r=>`<tr class="${r.id.endsWith('C1')?'feedback-row':''}"><td>${r.label}<small>${r.kind}</small></td><td>${r.n}</td><td>${r.mae.toFixed(2)}</td></tr>`).join('');
}
async function init(){
 const r=await fetch('assets/motion-residual.json');if(!r.ok)throw Error('Archived guidance source '+r.status);
 data=await r.json();render();$('#guidance-lead').addEventListener('change',render);
}
init().catch(e=>{$('#guidance-scope').textContent='Archived guidance comparison unavailable: '+e.message;});
