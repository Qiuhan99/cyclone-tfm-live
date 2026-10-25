import {wrap,mercator,distance} from './engine.mjs';
import {coordinateEllipse,issuedView} from './original-engine.mjs';
const $=s=>document.querySelector(s),C={base:'#e5b47a',c0:'#ad9ad4',c1:'#9de4c5',truth:'#e7ece8'},names={base:'原 TabPFN Base',c0:'原 C0 · 观测输入',c1:'原 C1 · 观测＋残差'};
const S={split:'test',k:32,cal:'PI+',storm:null,block:0,step:0,retro:true,focus:true};let D,G,playTimer=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,n=2)=>Number(v).toLocaleString('en-US',{minimumFractionDigits:n,maximumFractionDigits:n});
const utc=t=>t.slice(0,16).replace('T',' ')+' UTC';
const pool=()=>D.storms.filter(s=>S.split==='all'||s.phase===S.split);
const current=()=>D.storms.find(s=>s.id===S.storm),run=()=>current().runs[S.k],block=()=>run().blocks[S.block];
function lineChart(target,series,{percent=false,reference=null,label=''}){
 const W=540,H=230,M={l:46,r:18,t:25,b:32},xs=[1,2,4,8,16,32],values=series.flatMap(s=>s.values);const top=percent?1:Math.max(...values)*1.15;
 const X=k=>M.l+Math.log2(k)/5*(W-M.l-M.r),Y=y=>H-M.b-y/top*(H-M.t-M.b);
 let out=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}"><text x="${M.l}" y="11" fill="#8ca7b2" font-size="9">${label}</text>`;
 for(let i=0;i<4;i++){let v=top*i/3;out+=`<path d="M${M.l} ${Y(v)}H${W-M.r}" stroke="#29404e"/><text x="${M.l-8}" y="${Y(v)+3}" text-anchor="end" fill="#819da8" font-size="9">${percent?Math.round(v*100)+'%':fmt(v,1)}</text>`;}
 if(reference!=null)out+=`<path d="M${M.l} ${Y(reference)}H${W-M.r}" stroke="#789e98" stroke-dasharray="4 5"/><text x="${W-M.r}" y="${Y(reference)-6}" fill="#94b8af" text-anchor="end" font-size="9">90% nominal</text>`;
 for(const k of xs)out+=`<text x="${X(k)}" y="${H-9}" text-anchor="middle" fill="#8ca7b2" font-size="9">k=${k}</text>`;
 series.forEach(s=>{out+=`<path d="${s.values.map((v,i)=>`${i?'L':'M'}${X(xs[i])} ${Y(v)}`).join(' ')}" stroke="${C[s.method]}" stroke-width="2" fill="none"/>`;s.values.forEach((v,i)=>out+=`<circle cx="${X(xs[i])}" cy="${Y(v)}" r="${xs[i]===S.k?4:2.5}" fill="${C[s.method]}"><title>${names[s.method]} / k=${xs[i]}: ${percent?fmt(v*100)+'%':fmt(v,3)}</title></circle>`);});
 $(target).innerHTML=out+'</svg><div class="replay-plot-legend">'+series.map(s=>`<span style="color:${C[s.method]};margin-right:18px;font-size:10px">━ ${names[s.method]}</span>`).join('')+'</div>';
}
function summary(){
 const a=D.summaries[S.split][S.k],rows=a.cp[S.cal],b=rows.find(x=>x.method==='base'),c=rows.find(x=>x.method==='c1'),gain=a.c1_gain_vs_base_pct,extra=a.c1_gain_vs_c0_pct;
 const cards=[['C1 / BASE · RMSE',`${gain>=0?'−':'+'}${fmt(Math.abs(gain),1)}%`,'相对同 k Base 的原坐标 RMSE',gain<0],['C1 / C0 · RMSE',`${extra>=0?'−':'+'}${fmt(Math.abs(extra),1)}%`,'加入残差后的额外增量',extra<0],['ACTUAL JOINT COVERAGE',`${fmt(b.coverage*100,1)} → ${fmt(c.coverage*100,1)}%`,'Base → C1 · 相同校准器',false],['MATCHED AREA / BASE',fmt(c.primary_match.area_ratio,3)+'×','后验经验覆盖匹配 · 几何平均面积比',c.primary_match.area_ratio>1]];
 $('#replay-metrics').innerHTML=cards.map(([k,v,t,bad])=>`<div><span>${k}</span><strong class="${bad?'bad':''}">${v}</strong><small>${t}</small></div>`).join('');
 $('#replay-scope').textContent=`${a.n_storms} 个风暴 / ${a.n_targets} 个相同目标 / k=${S.k}（${S.k*6}h 刷新间隔）/ ${S.cal} / 名义90%。总体指标不随下面的风暴或预报块选择改变。`;
 const ci=c.primary_match.delta_ci95,pointCi=a.point.c1.gain_vs_base_ci95;
 $('#replay-verdict').textContent=`C1 相对同 k Base 的 RMSE ${gain>=0?'降低':'增加'} ${fmt(Math.abs(gain),1)}%，探索性95%降幅区间 [${fmt(pointCi[0],1)}%, ${fmt(pointCi[1],1)}%]；${extra>=0?'相对 C0 进一步降低':'相对 C0 增加'} ${fmt(Math.abs(extra),1)}%。等经验覆盖下 Δlog-size=${fmt(c.primary_match.delta_log_size,3)}，95%区间 [${fmt(ci[0],3)}, ${fmt(ci[1],3)}]。${ci[1]<0?'本队列支持更小区域，仍需独立验证。':ci[0]>0?'本队列支持区域增大。':'区域差异区间跨零，不作确定的效率改善结论。'}`;
 $('#replay-table').innerHTML=rows.map(r=>`<tr><td><i class="legend-line" style="border-color:${C[r.method]}"></i> ${names[r.method]}</td><td>${fmt(a.point[r.method].rmse,3)}</td><td>${fmt(a.point[r.method].geodesic_mae_km,1)}</td><td>${fmt(r.coverage*100,2)}%</td><td>${fmt(r.mean_log_size,3)}</td><td>${fmt(r.primary_match.coverage*100,2)}%</td><td class="${r.primary_match.area_ratio<=1?'mint':'coral'}">${fmt(r.primary_match.area_ratio,3)}×</td><td>[${fmt(r.primary_match.delta_ci95[0],3)}, ${fmt(r.primary_match.delta_ci95[1],3)}]</td></tr>`).join('');
 const ks=D.protocol.k_grid;
 lineChart('#replay-risk-chart',['base','c0','c1'].map(method=>({method,values:ks.map(k=>D.summaries[S.split][k].point[method].rmse)})),{label:'原经纬坐标 RMSE / °'});
 lineChart('#replay-coverage-chart',['base','c0','c1'].map(method=>({method,values:ks.map(k=>D.summaries[S.split][k].cp[S.cal].find(r=>r.method===method).coverage)})),{label:'经纬两坐标实际联合覆盖',percent:true,reference:.9});
 const identical=D.base_16_32_identity.every(x=>x.max_abs_base_k16_k32_evaluation_difference<1e-10);
 $('#replay-alignment-note').textContent=`每个风暴只评价最后12个目标，未覆盖k=32全部块内位置。${identical?'本窗口对齐下，k=16与k=32的Base评价预测相同；不能把两者视作两个独立的Base陈旧度效应。':''}模型按风暴终点作回顾性窗口对齐；这不是实时运行时已知风暴终止时刻的假设。`;
 $('#replay-all-k').innerHTML=ks.map(k=>{const z=D.summaries[S.split][k],rows=z.cp[S.cal],b=rows.find(r=>r.method==='base'),c=rows.find(r=>r.method==='c1'),g=z.c1_gain_vs_base_pct;return `<tr class="${k===S.k?'selected-row':''}"><td>k=${k} / ${k*6}h</td><td>${fmt(z.point.base.rmse,3)}</td><td>${fmt(z.point.c1.rmse,3)}</td><td class="${g>=0?'mint':'coral'}">${g>=0?'降低':'增加'} ${fmt(Math.abs(g),1)}%</td><td>${fmt(b.coverage*100)}%</td><td>${fmt(c.coverage*100)}%</td><td>${fmt(c.primary_match.area_ratio,3)}×</td></tr>`;}).join('');
 renderStormTable();
}
function renderStormTable(){
 $('#replay-storm-table').innerHTML=pool().map(s=>{const a={base:[],c1:[]};for(const b of s.runs[S.k].blocks)b.evaluation.forEach((yes,i)=>{if(yes)for(const m of ['base','c1'])a[m].push({sq:b.truth[i].reduce((z,v,j)=>z+(v-b.paths[m][i][j])**2,0)/2,km:distance(b.truth[i],b.paths[m][i])});});const stat=m=>({rmse:Math.sqrt(a[m].reduce((z,v)=>z+v.sq,0)/a[m].length),km:a[m].reduce((z,v)=>z+v.km,0)/a[m].length}),b=stat('base'),c=stat('c1'),g=100*(1-c.rmse/b.rmse);return `<tr class="${s.id===S.storm?'selected-row':''}"><td><button class="storm-select-link" data-storm="${esc(s.id)}">${esc(s.name)} · ${s.year} ↗</button></td><td>${fmt(b.rmse,3)}</td><td>${fmt(c.rmse,3)}</td><td class="${g>=0?'mint':'coral'}">${g>=0?'降低':'增加'} ${fmt(Math.abs(g),1)}%</td><td>${fmt(b.km,1)}</td><td>${fmt(c.km,1)}</td></tr>`;}).join('');
}
function renderCrossEvidence(e){
 const get=s=>e.ecl_aligned.find(r=>r.stream===s&&r.window==='aligned_final_128'),b=get('R(base)'),c=get('e(C1_OBS_LR)'),t=e.prior_tables.toy_stage14,tb=t.find(r=>r.stream==='R'),tc=t.find(r=>r.stream==='DP');
 $('#replay-cross-evidence').innerHTML=[['ECL / v3.5 · PI+ · 最后128点',b.coverage,c.coverage,`Δlog-size ${fmt(c.mean_log_size-b.mean_log_size,3)}`,'原代码重放；覆盖近似对齐，非严格等覆盖'],['合成 Stage14 / v3 · 3 seeds',tb.joint_coverage,tc.joint_coverage,`Δlog-volume ${fmt(tc.mean_log_volume-tb.mean_log_volume,3)}`,'潜因子机制实验；v3.5 版本对齐仍待验证']].map(r=>`<tr><td>${r[0]}</td><td>${fmt(r[1]*100)}%</td><td>${fmt(r[2]*100)}%</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('');
}
function renderSelectedCases(data,status){
 $('#selected-case-cards').innerHTML=data.cases.map(c=>`<a class="selected-case-card" href="cases.html?storm=${encodeURIComponent(c.storm_id)}#lab"><span>${esc(c.name)} / ${c.year}</span><h3>24h 路径校正</h3><strong>−${fmt(c.gain_pct,1)}%<small>平均大圆误差</small></strong><p>${fmt(c.base_mae_km,1)} → ${fmt(c.c1_mae_km,1)} km · ${c.n_origins}个起报点</p><b>回放案例 ↗</b></a>`).join('');
 $('#strong-study-status').textContent=status.public_summary;
}
function renderCase(v){
 $('#replay-case-status').textContent=S.retro?'HISTORICAL / 真值回顾':'FORECAST / 真值隐藏';
 $('#replay-view-label').textContent=S.retro?'HISTORICAL REPLAY · 未来真值可见':'ISSUED FORECAST · 未来真值隐藏';
 const b=block(),errs=Object.fromEntries(['base','c0','c1'].map(m=>[m,S.retro?distance(b.truth[S.step],b.paths[m][S.step]):null]));
 $('#replay-case-metrics').innerHTML=['base','c0','c1'].map(m=>`<div class="${m==='c1'?'case-corrected':''}"><span style="color:${C[m]}">${names[m]}</span><strong>${S.retro?fmt(errs[m],1):'—'}<small> km</small></strong><p>同一目标时刻 · ${utc(v.target)}</p></div>`).join('');
 const delta=errs.base-errs.c1;
 $('#replay-case-comparison').textContent=S.retro?`当前案例 C1 比 Base ${delta>=0?'减少':'增加'} ${fmt(Math.abs(delta),1)} km 大圆误差（${fmt(Math.abs(delta)/Math.max(errs.base,1e-12)*100,1)}%）。Base 提前 ${(S.step+1)*6}h 发出；C1 在目标前6h获得新观测后更新。此差异包含信息更新收益；残差额外贡献须结合 C0 消融及总体结果。`:'关闭回顾时不显示当前目标的真实位置、误差或改善幅度。顶部和全景表为已完成历史回测的汇总。';
 $('#replay-prev').disabled=S.step===0;$('#replay-next').disabled=S.step===b.paths.base.length-1;
}
function setStormOptions(){const p=pool();if(!p.some(s=>s.id===S.storm))S.storm=p[0].id;$('#replay-storm').innerHTML=p.map(s=>`<option value="${s.id}">${esc(s.name)} · ${s.year}</option>`).join('');$('#replay-storm').value=S.storm;setBlockOptions();}
function setBlockOptions(){pause();S.block=Math.max(0,Math.min(S.block,run().blocks.length-1));$('#replay-block').innerHTML=run().blocks.map((b,i)=>`<option value="${i}">${utc(b.base_issue)} · ${b.paths.base.length}步${b.paths.base.length<S.k?' / 尾块':''}</option>`).join('');$('#replay-block').value=S.block;S.step=Math.max(0,block().evaluation.indexOf(true));renderStormTable();renderMap();}
function renderMap(){
 const rr=run(),bb=block(),v=issuedView(bb,S.step,S.retro),now=bb.start+S.step-1,past=rr.track.slice(0,now+1),all=S.focus?[...past.slice(-8),...v.base.slice(0,S.step+1),...v.c0,...v.c1,...v.truth.slice(0,S.step+1)]:[...past,...v.base,...v.c0,...v.c1,...v.truth];
 const reg={base:v.region('base',S.cal),c1:v.region('c1',S.cal)},rings={};
 for(const m of ['base','c1'])if(reg[m]&&reg[m].upper>0){rings[m]=coordinateEllipse(bb.paths[m][S.step],reg[m].covariance,reg[m].upper);if(!S.focus)all.push(...rings[m]);}
 const lon0=all[0][1],xx=all.map(p=>lon0+wrap(p[1]-lon0)),yy=all.map(p=>mercator(p[0]));let x0=Math.min(...xx),x1=Math.max(...xx),y0=Math.min(...yy),y1=Math.max(...yy),w=Math.max((x1-x0)*1.35,7),h=Math.max((y1-y0)*1.5,5);if(w/h<1000/570)w=h*1000/570;else h=w*570/1000;
 const cx=(x0+x1)/2,cy=(y0+y1)/2,sc=1000/w,P=p=>[500+(lon0+wrap(p[1]-lon0)-cx)*sc,285-(mercator(p[0])-cy)*sc];
 const line=(pts,color,width=2,dash='')=>pts.length?`<path d="${pts.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(2)).join(',')}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`:'';
 let svg='<defs><clipPath id="replay-clip"><rect width="1000" height="570"/></clipPath><radialGradient id="replay-ocean"><stop stop-color="#163847"/><stop offset="1" stop-color="#0c202d"/></radialGradient></defs><rect width="1000" height="570" fill="url(#replay-ocean)"/><g clip-path="url(#replay-clip)">';
 for(const ring of G.rings){const pts=ring.map(([lon,lat])=>P([lat,lon]));if(Math.max(...pts.map(p=>p[0]))<0||Math.min(...pts.map(p=>p[0]))>1000||Math.max(...pts.map(p=>p[1]))<0||Math.min(...pts.map(p=>p[1]))>570)continue;svg+=`<path d="${pts.map((p,i)=>`${i?'L':'M'}${p.map(x=>x.toFixed(1)).join(',')}`).join(' ')}Z" fill="#233c41" stroke="#506c6e" stroke-width=".7"/>`;}
 for(let lat=-20;lat<=65;lat+=5)svg+=line([[lat,lon0-170],[lat,lon0+170]],'#365463',.5,'3 5');
 for(let lon=60;lon<=210;lon+=5)svg+=line([[-60,lon],[80,lon]],'#365463',.5,'3 5');
 for(const m of ['base','c1'])if(rings[m]){const path=pts=>pts.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(1)).join(',')}`).join(' ')+'Z',inner=reg[m].lower>0?coordinateEllipse(bb.paths[m][S.step],reg[m].covariance,reg[m].lower):[];svg+=`<path d="${path(rings[m])}${inner.length?path(inner):''}" fill-rule="evenodd" fill="${C[m]}" fill-opacity=".06" stroke="${C[m]}" stroke-opacity=".6" stroke-width="1.3"/>`;if(inner.length)svg+=line(inner,C[m],1,'3 3');}
 svg+=line(past,'#95b6c0',1.6)+line([rr.track[bb.start-1],...v.base],C.base,2,'6 4')+line([rr.track[bb.start-1],...v.c0],C.c0,1.5)+line([rr.track[bb.start-1],...v.c1],C.c1,2.8);
 if(S.retro)svg+=line([rr.track[bb.start-1],...v.truth],C.truth,1.8,'3 4');
 if(S.retro){const t=bb.truth[S.step],[tx,ty]=P(t);for(const m of ['base','c1'])svg+=line([bb.paths[m][S.step],t],C[m],1.4,'2 4');svg+=`<circle cx="${tx}" cy="${ty}" r="5" fill="${C.truth}" stroke="#17343c" stroke-width="2"/><text x="${tx+11}" y="${ty-10}" fill="${C.truth}" font-size="10">当前目标真值</text>`;}
 for(const [m,path] of [['base',v.base],['c1',v.c1]])path.forEach((p,i)=>{let [x,y]=P(p);svg+=`<circle cx="${x}" cy="${y}" r="${i===S.step?4:2}" fill="#132c37" stroke="${C[m]}" stroke-width="1.5"/>`;});
 const currentPoint=P(past.at(-1));svg+=`<circle cx="${currentPoint[0]}" cy="${currentPoint[1]}" r="7" fill="#b1d6da" stroke="#0d2530" stroke-width="2"/><text x="22" y="29" fill="#b5cccf" font-family="monospace" font-size="10" letter-spacing="2">${esc(current().name)} / ${current().year} · k=${S.k} · ${S.cal}</text><text x="22" y="51" fill="#90abae" font-size="10">已接收块内 ${S.step} 次新观测 · C1 仅显示已发布点</text></g>`;
 $('#replay-map').innerHTML=svg;$('#replay-map-legend').innerHTML=`<span style="color:#95b6c0">━ 已观测路径</span><span style="color:${C.base}">┄ Base 整块预测</span><span style="color:${C.c0}">━ 已发布 C0</span><span style="color:${C.c1}">━ 已发布 C1</span>${S.retro?'<span>┄ 未来真值</span>':''}`;
 $('#replay-base-time').textContent=utc(v.baseIssue);$('#replay-c1-time').textContent=utc(v.correctedIssue);$('#replay-target-time').textContent=utc(v.target);
 $('#replay-step').max=bb.paths.base.length-1;$('#replay-step').value=S.step;$('#replay-step-label').textContent=`${S.step+1} / ${bb.paths.base.length}`;
 const r=reg.c1;$('#replay-event').textContent=!S.retro?'当前目标的未来真值与命中事件隐藏。':r?`${S.cal} / C1 当前经纬联合事件：${r.covered?'COVERED':'MISSED'}`:'该时刻尚无校准区域。';
 $('#replay-case-note').textContent=`Base 当前目标提前量 ${(S.step+1)*6}h；C1 为收到最新观测后的6h更新预测。${r?'原起报分数区间 ['+fmt(r.lower,3)+', '+fmt(r.upper,3)+']。':''}${bb.evaluation[S.step]?'当前目标计入尾窗评价。':'当前目标属于预热，不计入总体指标。'}两臂CP区域也按时间逐步更新；不是块开始时已知的整条联合区域。${S.focus?'当前聚焦路径，区域边界和Base后续点可能超出画幅；切换全景可查看完整区域。':''}`;
 renderCase(v);
}
function pause(){if(playTimer)clearInterval(playTimer);playTimer=null;$('#replay-play').textContent='▶ 顺序回放';}
function bind(){
 $('#replay-split').addEventListener('change',()=>{S.split=$('#replay-split').value;S.block=0;summary();setStormOptions();});
 $('#replay-k').addEventListener('change',()=>{S.k=+$('#replay-k').value;S.block=0;summary();setBlockOptions();});
 $('#replay-calibrator').addEventListener('change',()=>{S.cal=$('#replay-calibrator').value;summary();renderMap();});
 $('#replay-storm').addEventListener('change',()=>{S.storm=$('#replay-storm').value;S.block=0;setBlockOptions();});
 $('#replay-block').addEventListener('change',()=>{pause();S.block=+$('#replay-block').value;S.step=Math.max(0,block().evaluation.indexOf(true));renderMap();});
 $('#replay-step').addEventListener('input',()=>{pause();S.step=+$('#replay-step').value;renderMap();});
 $('#replay-retro').addEventListener('change',()=>{S.retro=$('#replay-retro').checked;renderMap();});
 $('#replay-focus').addEventListener('click',()=>{S.focus=!S.focus;$('#replay-focus').textContent=S.focus?'◎ 聚焦已发布路径':'◎ 整块路径与区域';$('#replay-focus').setAttribute('aria-pressed',String(S.focus));renderMap();});
 for(const [id,d] of [['#replay-prev',-1],['#replay-next',1]])$(id).addEventListener('click',()=>{pause();S.step=Math.max(0,Math.min(block().paths.base.length-1,S.step+d));renderMap();});
 $('#replay-play').addEventListener('click',()=>{if(playTimer){pause();return;}if(S.step===block().paths.base.length-1)S.step=0;$('#replay-play').textContent='Ⅱ 暂停回放';playTimer=setInterval(()=>{if(S.step>=block().paths.base.length-1){pause();return;}S.step++;renderMap();},1300);});
 $('#replay-storm-table').addEventListener('click',e=>{const id=e.target.closest('[data-storm]')?.dataset.storm;if(!id)return;S.storm=id;S.block=0;setStormOptions();$('#trajectory-workspace').scrollIntoView({behavior:'smooth',block:'start'});});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
}
async function init(){try{const data=await Promise.all(['assets/original-replay.json','assets/coastline.json','assets/reconciliation.json','assets/selected-cases.json','assets/strong-study-status.json'].map(async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw Error(p+': '+r.status);return r.json();}));[D,G]=data;bind();summary();setStormOptions();renderCrossEvidence(data[2]);renderSelectedCases(data[3],data[4]);if(location.hash)document.querySelector(location.hash)?.scrollIntoView({block:'start'});}catch(e){$('#replay-verdict').textContent='本地实验数据加载失败：'+e.message;$('#replay-verdict').classList.add('replay-error');console.error(e);}}
init();
