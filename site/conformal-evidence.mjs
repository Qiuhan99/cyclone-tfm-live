import {REFERENCES,NAMES,ORDER,metricRows,correctionEvidence,primaryEvidence} from './conformal-evidence-engine.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
const COLORS=['#e1ae78','#d6bc95','#b69ee0','#8bdec4','#83b6df','#e09fac','#bac37f'];
let D;const SETS={};const full=$('#cp-evidence').dataset.cpView==='full';
const filters=()=>({phase:$('#cp-phase').value,lead_h:+$('#cp-lead').value,level:+$('#cp-level').value,shape:$('#cp-shape').value,calibrator:$('#cp-calibrator').value,regime:$('#cp-regime').value});
const name=m=>NAMES[m]??(m+(D?.protocol.preprocessing==='shared_6h_CV_offset'?' + CV':' · 直接ENU'));
function frontier(rows,f){
 const W=700,H=390,margin={l:80,r:35,t:25,b:90},valid=rows.filter(r=>r.mean_area_km2>0);
 if(!valid.length){$('#cp-frontier').innerHTML='';return;}
 const low=Math.floor(Math.log10(Math.min(...valid.map(r=>r.mean_area_km2)))),high=Math.max(low+1,Math.ceil(Math.log10(Math.max(...valid.map(r=>r.mean_area_km2)))));
 const X=c=>margin.l+c*(W-margin.l-margin.r),Y=a=>H-margin.b-(Math.log10(a)-low)/(high-low)*(H-margin.t-margin.b);
 let svg=`<rect width="700" height="390" fill="#102630"/><path d="M80,25V300H665" fill="none" stroke="#607d86"/>`;
 for(let i=0;i<=10;i+=2){const x=X(i/10);svg+=`<text x="${x}" y="323" text-anchor="middle" fill="#a7bec2" font-size="12">${i*10}%</text>`;}
 for(let i=low;i<=high;i++){const y=Y(10**i);svg+=`<path d="M80,${y}H665" stroke="#53717a" opacity=".25"/><text x="70" y="${y+4}" text-anchor="end" fill="#a7bec2" font-size="12">10^${i}</text>`;}
 svg+=`<path d="M${X(f.level/100)},25V300" stroke="#e9dcb7" stroke-dasharray="5 5"/><text x="${X(f.level/100)-5}" y="20" text-anchor="end" fill="#dfd4b4" font-size="12">目标${f.level}%</text>`;
 for(const [i,r] of rows.entries()){const x=X(r.coverage),y=Y(r.mean_area_km2),color=COLORS[ORDER.indexOf(r.model_id)%7];svg+=`<circle cx="${x}" cy="${y}" r="${r.model_id===REFERENCES[3]?8:5}" fill="${color}" stroke="#0b202b" stroke-width="2"><title>${esc(name(r.model_id))} · 覆盖${fmt(r.coverage*100)}% · 面积${fmt(r.mean_area_km2,0)}km² · n=${r.n}</title></circle><text x="${95+(i%3)*200}" y="${350+Math.floor(i/3)*17}" fill="${color}" font-size="11">● ${esc(name(r.model_id))}</text>`;}
 svg+='<text x="370" y="338" text-anchor="middle" fill="#b4ced0" font-size="12">实际覆盖率 →</text><text x="14" y="18" fill="#b4ced0" font-size="11">平均面积 km²（log10）</text>';
 $('#cp-frontier').innerHTML=svg;
}
function curve(f){
 const selected=$('#cp-curve-method').value,models=new Set([REFERENCES[1],selected]),curves=D.coverage_curves.filter(r=>r.phase===f.phase&&models.has(r.model_id));
 const max=Math.max(1,...curves.flatMap(c=>c.points.map(p=>p.index))),X=i=>65+(i-1)/Math.max(1,max-1)*600,Y=c=>290-c*245;
 let svg='<rect width="700" height="390" fill="#102630"/><path d="M65,30V290H665" fill="none" stroke="#607d86"/>';
 for(const c of [0,.5,.9,1])svg+=`<path d="M65,${Y(c)}H665" stroke="${c===.9?'#dfd4b4':'#597983'}" opacity="${c===.9?1:.25}" stroke-dasharray="5 5"/><text x="55" y="${Y(c)+4}" fill="#9fb9c0" text-anchor="end" font-size="12">${c*100}%</text>`;
 for(const [i,c] of curves.entries()){const color=c.model_id===REFERENCES[1]?'#e1ae78':'#8bdec4',dashed=c.calibrator==='Frozen 2019',path=c.points.map((p,j)=>`${j?'L':'M'}${X(p.index).toFixed(2)},${Y(p.coverage).toFixed(2)}`).join(' ');svg+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="2" ${dashed?'stroke-dasharray="6 5"':''}><title>${esc(name(c.model_id))} / ${esc(c.calibrator)}</title></path>`;
  for(const p of c.points){svg+=`<circle cx="${X(p.index)}" cy="${Y(p.coverage)}" r="2" fill="${color}"><title>${esc(p.valid_time_utc)} · 最近n=${p.n}覆盖${fmt(p.coverage*100)}%</title></circle>`;}
  svg+=`<text x="${70+(i%2)*300}" y="${336+Math.floor(i/2)*20}" fill="${color}" font-size="11">${dashed?'┄':'━'} ${esc(name(c.model_id))} / ${dashed?'固定2019':'因果滚动'}</text>`;
 }
 svg+=`<text x="65" y="314" fill="#a7bec2" font-size="12">1</text><text x="665" y="314" text-anchor="end" fill="#a7bec2" font-size="12">${max}个成熟终点 →</text>`;$('#cp-curve').innerHTML=svg;
}
function render(){
 if(!D)return;const f=filters(),rows=metricRows(D,f,!full),e=correctionEvidence(rows),reference=full?$('#cp-ratio-reference').value:'f2';if(full)$('#cp-ratio-heading').textContent='同覆盖面积比 / CV-'+(reference==='f0'?'F0 · 位置':'F2 · Base');
 $('#cp-status').textContent=rows.length?`${f.phase==='test'?'2024历史队列':'CHAMPI锁定研究快照'} · +${f.lead_h}h单终点${f.level}%边际区域 · ${f.shape==='ellipse'?'椭圆':'圆'} · ${f.calibrator==='Causal rolling'?'仅成熟标签因果滚动':'固定2019几何和秩阈值'} · 共同${rows[0].n}终点 / ${rows[0].storms}场。时序模型${D.protocol.preprocessing==='shared_6h_CV_offset'?'已对齐6h匀速残差变换':'直接ENU外推，原始对照'}。${f.regime!=='all'?'当前为过去运动状态代理分层，不是经证实的概念漂移标签。':''}`:'当前筛选没有共同成熟终点；不补零或生成成绩。';
 $('#cp-table').innerHTML=rows.length?rows.map(r=>`<tr class="${r.model_id===REFERENCES[3]?'cp-primary':''}"><td>${esc(name(r.model_id))}</td><td>${r.n} / ${r.storms}</td><td>${fmt(r.coverage*100)}% / ${f.level}%</td><td>${fmt(Math.max(0,f.level-r.coverage*100),2)} / ${fmt(Math.max(0,r.coverage*100-f.level),2)}</td><td>${fmt(r.absolute_gap_pp,2)}</td><td>${fmt(r.mean_area_km2,0)}</td><td>${fmt(r[reference==='f0'?'matched_area_ratio_vs_f0':'matched_area_ratio_vs_f2'],3)}×</td></tr>`).join(''):'<tr><td colspan="7">无共同成熟终点</td></tr>';
 $('#cp-cards').innerHTML=e?[
  ['Base → C1 实际覆盖',`${fmt(e.base*100)}% → ${fmt(e.c1*100)}%`,`名义${f.level}%；偏离目标的方向也需核对。`],
  ['Base → C1 样本欠覆盖缺口',`${fmt(Math.max(0,f.level-e.base*100),2)} → ${fmt(Math.max(0,f.level-e.c1*100),2)} pp`,'高于目标不自动违反效度；仍需核对面积及覆盖率估计区间。'],
  ['C1 / Base 同覆盖面积',`${fmt(e.matchedAreaRatio,3)}×`,'事后统一覆盖诊断；小于1表示更紧致。'],
  ['C1 / Base 已发平均面积',`${fmt(e.issuedAreaRatio,3)}×`,'实际起报规则的面积代价，未用后验尺度替换。']
 ].map(([a,b,c])=>`<div><span>${a}</span><strong>${b}</strong><small>${c}</small></div>`).join(''):'';
 const comparisons=primaryEvidence(D,f);$('#cp-intervals').textContent=comparisons.length?(full?comparisons:comparisons.filter(r=>r.candidate===REFERENCES[3])).map(r=>`${name(r.candidate)} / ${name(r.base)} 同覆盖面积比 ${fmt(r.matched_area_ratio,3)}，整台风95%区间 [${r.ratio_ci95.map(v=>fmt(v,3)).join(', ')}]。`).join('\n')+'\n500次整台风配对bootstrap，每次重做匹配；包含1的区间不支持稳定差异。其余结果也受短上下文、标签预算与探索性多重比较限制。':'该筛选未计算配对区间；不借用其他时效、队列或运动子集的区间。CHAMPI单场不按重叠起报构造伪独立区间。';
 if(full){$('#cp-point-errors').innerHTML=rows.map(r=>`${esc(name(r.model_id))}：${fmt(r.mae_km,2)} km（n=${r.n}）`).join('<br>');frontier(rows,f);curve(f);}
}
function models(){
 $('#cp-model-status').innerHTML=D.model_status.map(m=>{const complete=m.status==='completed',version=D.protocol.models[m.name];return `<article class="cp-model-card"><strong>${esc(m.name)}</strong><span>${complete?'真实推理完成 · '+m.n+'起报':'待接入 · 未调用、未评分'}<br>${complete?fmt(m.parameters/1e6,2)+'M参数 · CPU':''}</span><div>${complete?`<small>${esc(version.repo)}</small><br><code>revision ${esc(version.revision)}</code><br><small>${m.name.startsWith('Chronos')?'chronos-forecasting '+esc(m.versions['chronos-forecasting']):'uni2ts '+esc(m.versions.uni2ts)}；同一48h位置历史，无微调</small>`:'待配置Nixtla API；本轮按用户选择不调用、不生成分数。'}</div></article>`;}).join('');
 $('#cp-native').innerHTML='<details><summary>查看原生二维矩形的经验覆盖（每坐标80%，不是同定义90% Conformal）</summary>'+D.native_summary.filter(r=>r.phase==='test'&&r.lead_h===24).map(r=>`<div class="cp-native-row">${esc(r.model_id)}：${fmt(r.coverage*100)}%（n=${r.n}，2024 / +24h）</div>`).join('')+'</details>';
}
async function init(){await Promise.all((full?[['direct','tsfm-conformal.json'],['shared_cv','tsfm-cv-sensitivity.json']]:[['shared_cv','tsfm-cv-sensitivity.json']]).map(async([key,file])=>{const r=await fetch('assets/'+file);if(!r.ok)throw Error('真实实验缓存 '+r.status);SETS[key]=await r.json();}));D=SETS.shared_cv;render();if(full)models();
 for(const id of ['cp-phase','cp-lead','cp-level','cp-shape','cp-calibrator','cp-regime'])$('#'+id).addEventListener('change',render);if(full){$('#cp-curve-method').addEventListener('change',()=>curve(filters()));$('#cp-preprocessing').addEventListener('change',()=>{D=SETS[$('#cp-preprocessing').value];render();models();});$('#cp-ratio-reference').addEventListener('change',render);}}
init().catch(e=>{$('#cp-status').textContent='实验数据读取失败：'+e.message+'；没有生成演示结果。';});
