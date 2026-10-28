const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'—';
let D,G;
const clock=t=>new Intl.DateTimeFormat('zh-CN',{timeZone:$('#ts-zone').value||'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t));
function render(){if(!D||!G)return;const storm=$('#ts-storm').value||'INFA_2026',all=D.rolling_forecasts.filter(r=>r.storm_id===storm),issues=[...new Set(all.map(r=>r.issue_time_utc))].sort((a,b)=>Date.parse(a)-Date.parse(b)),issue=issues[+$('#ts-issue').value||0],lead=+$('#ts-lead').value||72;
 const selected=all.filter(r=>r.issue_time_utc===issue),observed=D.observed_tracks[storm]??[],past=observed.filter(r=>Date.parse(r.valid_at_utc)<=Date.parse(issue));
 const showTruth=storm==='CHAMPI_2026'&&$('#ts-truth').checked,future=showTruth?observed.filter(r=>Date.parse(r.valid_at_utc)>Date.parse(issue)&&Date.parse(r.valid_at_utc)<=Date.parse(issue)+lead*3600000):[];
 $('#v2-truth-note').textContent=showTruth?'粉红虚线：事后UCAR实况，仅用于验证，不进入模型输入。':'事后实况隐藏；CHAMPI可用上方事后验证开关查看。';
 const live=D.infa_live_update;$('#v2-infa-live').hidden=!live||storm!=='INFA_2026';
 if(live){const m=live.forecast_manifest;
  $('#v2-live-status').textContent=`真实源周期 ${clock(m.forecast_init_utc)}；实际封存 ${clock(m.created_at_utc)}。沿用v2的同一F0与历史OOS上下文，4次经纬度边际原生调用。此处为新周期，上方06Z档案保留；未部署自动调度。`;
  $('#v2-live-points').innerHTML=live.forecasts.filter(r=>[6,12,24,36,48,72].includes(r.lead_h)).map(r=>`<tr><td>+${r.lead_h}h · ${clock(r.valid_at_utc)}</td><td>${fmt(r.mu_base_lat,4)} / ${fmt(r.mu_base_lon,4)}</td><td>${fmt(r.r_hat_lat,4)} / ${fmt(r.r_hat_lon,4)}</td><td>${fmt(r.corrected_lat,4)} / ${fmt(r.corrected_lon,4)}</td><td>pending · ${r.prospective_at_creation?'封存时目标未到':'不计前瞻'}</td></tr>`).join('');
  const v=live.verification_06z.find(r=>r.version==='v1'&&r.status==='verified'&&r.prospective_at_creation);
  $('#v2-live-verified').textContent=v?`此前06Z冻结预测的首条前瞻验证：+${v.lead_h}h，UCAR主真值下T0 ${fmt(v.base_error_km)} → T1 ${fmt(v.corrected_error_km)} km。N=1，仅为单点结果；其余时距仍待真值。旧v2的+6h生成于目标之后，不列入前瞻成绩。`:'此前冻结预测尚无成熟的前瞻验证点。';
  $('#v2-live-sources').innerHTML=Object.entries(live.sources).map(([kind,s])=>`<p><a href="${esc(s.url)}">UCAR ${esc(kind)}</a> · ${s.bytes.toLocaleString()} bytes · 最新源周期 ${esc(clock(s.latest_issue_utc==='NaT'?s.latest_valid_utc:s.latest_issue_utc))}<br>SHA256 <code>${esc(s.sha256)}</code></p>`).join('')+`<p>本周期外部A-deck：原始aid ${esc(live.external_availability.raw_aids.join(', '))}，原生时距 ${esc(live.external_availability.leads.join(', '))}h。要求的未来时距${live.external_availability.required_future_leads_available.length?'已有部分可用':'尚无可用外部路径'}；不回填其他周期作同周期对比。</p>`;
 }
 $('#v2-status').textContent=`已完成 ${D.rolling_oos_origins} 个逐起点OOS基础预测 → ${D.rolling_oos_rows} 条真实残差上下文 → 第二次TabPFN。当前 ${storm} / ${clock(issue)}。历史资料仍为 retrospective_prefix。`;
 $('#v2-residuals').innerHTML=selected.filter(r=>[6,12,24,36,48,72].includes(r.lead_h)).map(r=>`<tr><td>+${r.lead_h}h</td><td>${fmt(r.mu_base_lat,4)} / ${fmt(r.mu_base_lon,4)}</td><td>${fmt(r.r_hat_lat,4)} / ${fmt(r.r_hat_lon,4)}</td><td>${fmt(r.corrected_lat,4)} / ${fmt(r.corrected_lon,4)}</td><td>${esc(clock(r.created_at_utc))} · ${storm==='INFA_2026'?(r.prospective_at_creation?'冻结时目标未到':'冻结时目标已到，不计前瞻'):'retrospective'}</td></tr>`).join('');
 $('#v2-paired').innerHTML=D.rolling_paired_summary.map(r=>`<tr><td>+${r.lead_h}h</td><td>${r.n}</td><td>${fmt(r.T0_MAE_km)}</td><td>${fmt(r.T1_MAE_km)}</td><td class="${r.mean_improvement_km>=0?'gain':'loss'}">${fmt(r.mean_improvement_km)}</td><td>${fmt(100*r.win_rate,1)}%</td></tr>`).join('');
 const state=D.full_reproduction;$('#v2-full-status').textContent=`快照 ${clock(D.captured_at_utc)} · ${state.state} · ${state.dataset??'datasets'} / ${state.phase} · ${state.completed_target_rows??state.completed_fit_blocks??'—'} / ${state.total_target_rows??state.total_fit_blocks??'—'} · ${state.all_series??'—'} 个变量 · 本进程实际调用 ${state.actual_calls_this_process??'—'}。${D.full_reproduction_complete?'本轮全量运行已完成。':'尚未完成；没有新全量指标。'}`;
 const rule=D.turn_rule;$('#v2-rule').textContent=`训练年份 ${rule.training_years.join('–')}，速度门槛 ${fmt(rule.speed_floor_kmh)} km/h；6h角度阈值 A=${fmt(rule.windows['6'].A_angle_deg)}° / B=${fmt(rule.windows['6'].B_angle_deg)}°。原算法点预测不依赖这些后置规则。`;
 const rate=(r,key)=>r[key]===null?'无可评估事件':fmt(100*r[key],1)+'%'+(r[key+'_ci95']?' ['+r[key+'_ci95'].map(v=>fmt(100*v,1)).join(', ')+']':'（区间不可估计）');
 $('#v2-turns').innerHTML=(D.multistorm_turn_summary??[]).map(r=>`<tr><td>${r.model}</td><td>${r.event} / ${r.window_h}h</td><td>${r.storms} / ${r.issuances}</td><td>${r.true_positive} / ${r.false_positive} / ${r.false_negative}</td><td>${rate(r,'precision')}</td><td>${rate(r,'recall')}</td></tr>`).join('');
 const analyses=D.cma_observations[storm]??[],eligible=storm==='INFA_2026'?analyses:analyses.filter(r=>Date.parse(r.valid_at_utc)<=Date.parse(issue)),official=eligible.at(-1);
 $('#v2-cma').textContent=official?`独立CMA分析 ${clock(official.valid_at_utc)}：${fmt(official.lat)}°N / ${fmt(official.lon)}°E；${fmt(official.vmax_ms,0)} m/s，${fmt(official.mslp_hpa>=800&&official.mslp_hpa<=1100?official.mslp_hpa:null,0)} hPa。未用这条分析改写旧模型输入、起报或UCAR主真值。`:'该时次没有独立CMA分析；不插值补观测。';
 const paths=['T0','T1'].map((model,j)=>({model,color:j?'#008e7c':'#b47528',points:selected.filter(r=>r.lead_h<=lead).map(r=>({lat:r[j?'corrected_lat':'mu_base_lat'],lon:r[j?'corrected_lon':'mu_base_lon'],lead_h:r.lead_h}))}));
 const coords=[...past.slice(-4),...paths.flatMap(p=>p.points),...future];if(!coords.length)return;
 let x0=Math.min(...coords.map(p=>p.lon))-2,x1=Math.max(...coords.map(p=>p.lon))+2,y0=Math.min(...coords.map(p=>p.lat))-1.5,y1=Math.max(...coords.map(p=>p.lat))+1.5;
 const aspect=900/350,w=x1-x0,h=y1-y0,cx=(x0+x1)/2,cy=(y0+y1)/2,W=Math.max(w,h*aspect),H=Math.max(h,w/aspect);x0=cx-W/2;x1=cx+W/2;y0=cy-H/2;y1=cy+H/2;
 const P=p=>[(p.lon-x0)/(x1-x0)*900,350-(p.lat-y0)/(y1-y0)*350],line=a=>a.map((p,i)=>(i?'L':'M')+P(p).map(v=>v.toFixed(2)).join(',')).join(' ');
 let svg='<defs><clipPath id="v2clip"><rect width="900" height="350"/></clipPath></defs><g clip-path="url(#v2clip)"><rect width="900" height="350" fill="#eaf2f7"/>';
 for(const ring of G.rings){if(!ring.some(([lo,la])=>lo>=x0-3&&lo<=x1+3&&la>=y0-3&&la<=y1+3))continue;svg+=`<path d="${line(ring.map(([lon,lat])=>({lat,lon})))}Z" fill="#f8faf5" stroke="#b6c7be"/>`;}
 svg+=`<path d="${line(past)}" fill="none" stroke="#334d66" stroke-width="2"/>`;
 if(future.length)svg+=`<path data-v2-layer="realized-future" d="${line([...past.slice(-1),...future])}" fill="none" stroke="#b65e83" stroke-width="2.5" stroke-dasharray="3 3"><title>事后UCAR实况：仅用于验证，不是模型输入</title></path>`;
 for(const p of paths){const pts=[...past.slice(-1),...p.points];svg+=`<path data-v2-model="${p.model}" d="${line(pts)}" fill="none" stroke="${p.color}" stroke-width="3" ${p.model==='T0'?'stroke-dasharray="7 4"':''}/>`;for(const q of p.points){const [x,y]=P(q);svg+=`<circle cx="${x}" cy="${y}" r="3" fill="${p.color}"><title>v2 ${p.model} +${q.lead_h}h ${fmt(q.lat)} / ${fmt(q.lon)}</title></circle>`;}}
 $('#v2-map').innerHTML=svg+'</g>';
}
window.renderTwoStageV2=render;
try{[D,G]=await Promise.all([window.TWO_STAGE_V2_DATA??fetch('assets/two-stage-0a-v2.json').then(r=>{if(!r.ok)throw Error('v2 bundle unavailable');return r.json();}),window.TWO_STAGE_COAST??fetch('assets/coastline.json').then(r=>r.json())]);render();}catch(e){$('#v2-status').textContent='v2数据未能加载：'+e.message+'。v1档案保持可用。';}
