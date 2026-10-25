const $=s=>document.querySelector(s),fmt=(n,k=1)=>Number.isFinite(n)?n.toFixed(k):'—';
function render(data){
 const rows=data.coverage_intervals.filter(r=>r.variant==='shared_cv'&&r.phase==='test'&&r.model_id==='TabPFN CV-F2 + C1');
 const all=rows.find(r=>r.regime==='all'),change=rows.find(r=>r.regime==='motion_change');
 const base=data.coverage_intervals.find(r=>r.variant==='shared_cv'&&r.phase==='test'&&r.regime==='motion_change'&&r.model_id==='TabPFN CV-F2');
 const interval=r=>r?.coverage_ci95?`[${r.coverage_ci95.map(x=>fmt(x*100)).join('%, ')}%]`:'未计算';
 $('#c1-audit-finding').textContent=`已完成C0/C1冷启动、输入哈希、坐标还原和标签成熟审计；未发现本轮所查的残差方向或坐标错误。当前分支冻结2016残差上下文，采用滚动秩校准；原算法会刷新残差上下文，并使用PI+。两套流程和预测任务不同，不能用当前分支代替原算法的直接检验。`;
 $('#c1-audit-coverage').textContent=`运动变化子集：Base${base.covered}/${base.n} → C1${change.covered}/${change.n}次覆盖（${fmt(change.coverage*100,2)}%，${change.storms}场），整台风95%经验区间约${interval(change)}，包含90%，本样本欠覆盖缺口从${fmt(Math.max(0,90-base.coverage*100))}pp降至${fmt(Math.max(0,90-change.coverage*100))}；不能仅凭该子集确认系统性过覆盖或长期抗漂移保证。全队列：${all.covered}/${all.n}（${fmt(all.coverage*100,2)}%，${all.storms}场），区间约${interval(all)}；提示当前规则可能偏保守，仍受探索性、共享校准历史及有限台风数限制。`;
 const original=data.original_reference.filter(r=>r.phase==='test'&&r.calibrator==='Original PI+');
 $('#c1-original-evidence').innerHTML='<table><thead><tr><th>原流程 · 下一6h / PI+</th><th>终点 / 台风数</th><th>覆盖 / 90%</th><th>同覆盖面积比 / 原Base</th></tr></thead><tbody>'+original.map(r=>`<tr><td>${r.method==='base'?'原Base':r.method.toUpperCase()}</td><td>${r.n} / ${r.storms}</td><td>${fmt(r.coverage*100,2)}% / 90%</td><td>${fmt(r.matched_area_ratio,3)}×</td></tr>`).join('')+'</tbody></table>';
}
fetch('assets/c1-pipeline-audit.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(render).catch(e=>{$('#c1-audit-finding').textContent='审计记录读取失败：'+e.message+'。不补造审计结果。';});
