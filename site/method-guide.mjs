import {filterMethods,horizonRows} from './method-guide-engine.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,n=1)=>x==null?'—':Number(x).toFixed(n);let data;
function renderCatalog(){
 const rows=filterMethods(data.catalog,$('#method-kind').value,$('#method-query').value);
 $('#method-count').textContent=`${rows.length}条匹配 · 共${data.local_count}个本地方法、${data.aid_count}个外部原码；不是同等数量的独立模型家族。`;
 $('#method-rows').innerHTML=rows.map(r=>`<tr><td><b>${esc(r.id)}</b><br><small>${esc(r.group)}</small></td><td>${esc(r.idea)}</td><td>${esc(r.difference)}</td></tr>`).join('')||'<tr><td colspan="3">未找到匹配方法。</td></tr>';
}
function renderHorizon(){
 const phase=$('#guide-phase').value,lead=Number($('#guide-lead').value),paired=$('#guide-paired').checked;
 const rows=horizonRows(data.diagnostics,phase,lead,paired);
 $('#guide-horizon-rows').innerHTML=rows.map(r=>`<tr><td>${esc(r.method)}</td><td>${r.n}</td><td>${fmt(r.mean_error_km)}</td><td>${r.marginal_coverage90==null?'未在该配对子集重算':fmt(r.marginal_coverage90*100)+'%'}</td><td>${fmt(r.mean_marginal_radius90_km,0)}</td></tr>`).join('');
 $('#guide-horizon-note').textContent=`${paired?'固定到五时距均有真值的同一批起报，控制不同lead的样本构成；此处只重排点误差，不重算子集校准。':'各lead保留所有有真值起报，因此不同lead样本数可能不同。'} 本表的覆盖和半径若有值，都是单个终点的边际位置圆，不是五时距联合覆盖；选择24h不会修改已有72h联合实验。`;
 const e=lead===24?data.diagnostics.marginal24_efficiency.find(r=>r.phase===phase&&r.candidate.endsWith(' + C1')):null;
 $('#guide-efficiency').textContent=e?`另列24h全可评分队列的后验同覆盖面积诊断：C1/Base=${fmt(e.matched_area_ratio,3)}${e.ratio_ci95?'，整风暴95%区间 ['+e.ratio_ci95.map(x=>fmt(x,3)).join(', ')+']':'；单场不报伪区间'}。不是已发布集合，也不是当前勾选子集的新校准结果。`:'同覆盖面积的本轮诊断仅针对24h终点；其他lead仍见原始完整报告。';
}
fetch('assets/prediction-method-guide.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(d=>{
 data=d;renderCatalog();renderHorizon();
 for(const id of ['#method-kind','#method-query'])$(id).addEventListener(id==='#method-query'?'input':'change',renderCatalog);
 for(const id of ['#guide-phase','#guide-lead','#guide-paired'])$(id).addEventListener('change',renderHorizon);
 $('#method-references').innerHTML=d.references.map(r=>`<a target="_blank" rel="noreferrer" href="${esc(r.url)}">${esc(r.title)} ↗</a>`).join(' · ');
}).catch(e=>$('#method-count').textContent='说明索引读取失败：'+e.message+'；完整Markdown说明仍可下载。');
