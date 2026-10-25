import {operationalState,futurePoints,futureCrossings,matchingRows,groupedCoverage,hoursSince} from './operations-engine.mjs';
import {sphereExp} from './engine.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=x=>x?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(x))+' 北京时间':'未知';
const fmt=(x,n=1)=>x==null?'未提供':Number(x).toFixed(n);
const colors=['#007c91','#b06420','#aa3163','#398457','#5663bb','#9262a4'];
let data,coast,study,selection=new Set(),busy=false,initialized=false;
function render(){
 if(!data)return;const now=Date.now(),state=operationalState(data,now),c=data.official?.center,w=data.official?.warning,paths=data.model.paths;
 $('#operations-status').textContent=`${state.watcherStale?'后台更新心跳已过期，当前展示旧缓存':'更新缓存可用'} · 最近联网核验 ${time(data.last_checked_at_utc)} · 后台按计划检查，页面每分钟读取；任务可能延迟。${state.failedSources.length?' 来源刷新失败：'+state.failedSources.join('、')+'，保留旧值并显示原时刻。':''}`;
 $('#operations-status').classList.toggle('operations-stale',state.watcherStale||state.failedSources.length>0);
 $('#operations-center').innerHTML=c?`<span class="eyebrow">官方最新中心 ${state.centerStale?' / 资料过期':''}</span><h3>${esc(c.intensity)}</h3><strong>${fmt(c.vmax_ms)} <small>m/s</small> · ${c.wind_force}级</strong><p>${fmt(c.lat_deg)}°N / ${fmt(c.lon_deg)}°E · ${fmt(c.mslp_hpa,0)} hPa</p><p>中心时刻 ${time(c.valid_time_utc)}<br>发布 ${time(c.issued_at_utc)} · 获取 ${time(c.retrieved_at_utc)}</p><a target="_blank" rel="noreferrer" href="${esc(c.source_url)}">中央气象台快讯 ↗</a>`:'官方中心未能核实';
 $('#operations-warning').innerHTML=w?`<span class="eyebrow">官方预警 / 国家级</span><h3 class="warning-color-${esc(w.color)}">台风${esc(w.color)}预警${state.warningStale?'（资料过期）':''}</h3><p>发布 ${time(w.issued_at_utc)}<br>核验 ${time(w.retrieved_at_utc)}</p><p>${esc(w.jurisdiction)}</p><a target="_blank" rel="noreferrer" href="${esc(w.source_url)}">查看官方更新与解除状态 ↗</a>`:'官方预警状态未核实；不等于没有预警。';
 $('#operations-outlook').textContent=w?.trajectory??c?.movement??'官方未来路径判断暂缺。';
 $('#operations-hazards').innerHTML=`<p><b>沿海大风：</b>${esc(w?.wind_forecast??'未解析到原公报，点击官方预警查看。')}</p><p><b>降雨：</b>${esc(w?.rain_forecast??'未解析到原公报，点击官方预警查看。')}</p>`;
 $('#operations-origin').textContent=`研究模型资料截止 ${time(data.model.input_last_valid_utc)} · 实际生成 ${time(data.generated_at_utc)}${state.forecastStale?' · 预测资料已过期':''}。+h以资料时刻为起点；只显示当前尚未到达的有效时刻。`;
 const selected=paths.filter(p=>selection.has(p.model_id));
 $('#operations-models').innerHTML=paths.map((p,i)=>`<label class="check"><input type="checkbox" data-live-model="${esc(p.model_id)}" ${selection.has(p.model_id)?'checked':''}><span style="color:${colors[i%colors.length]}">━</span>${esc(p.model_id)} · 起报 ${time(p.issue_time_utc)}${hoursSince(p.issue_time_utc,now)>12?'（较早起报）':''}</label>`).join('');
 $('#operations-models').querySelectorAll('input').forEach(e=>e.addEventListener('change',()=>{e.checked?selection.add(e.dataset.liveModel):selection.delete(e.dataset.liveModel);render();}));
 $('#operations-landfall').innerHTML=selected.map(p=>{const hits=futureCrossings(p,now),color=colors[paths.indexOf(p)%colors.length];return `<article><b style="color:${color}">${esc(p.model_id)}</b><p>${hits.length?hits.slice(0,3).map(x=>`${esc(x.region)} · ${time(x.valid_time_utc)} · ${fmt(x.lat_deg,2)}°N, ${fmt(x.lon_deg,2)}°E`).join('<br>'):'剩余预报窗口内未检测到中心线海→陆交点；不代表沿海没有风雨影响。'}</p></article>`;}).join('')||'请选择至少一条路径。';
 $('#operations-points').innerHTML=selected.flatMap(p=>futurePoints(p,now).map(x=>`<tr><td>${esc(p.model_id)}</td><td>${time(p.issue_time_utc)}</td><td>${time(x.valid_time_utc)} / +${x.lead_h}h</td><td>${fmt(x.lat_deg,2)} / ${fmt(x.lon_deg,2)}</td><td>${x.vmax_kt==null?'该模型未预测强度':fmt(x.vmax_kt,0)+' kt（平均时段未核实）'}</td><td>${x.joint_radius_90_km==null?'未提供':fmt(x.joint_radius_90_km,0)+' km'}</td></tr>`)).join('')||'<tr><td colspan="6">当前没有未到期预测；等待下一次来源更新。</td></tr>';
 renderMap(selected,c,now);
}
function renderMap(paths,c,now){
 const observations=data.observations.slice(-13),pts=[...observations,...paths.flatMap(p=>futurePoints(p,now)),...(c?[c]:[])];if(!pts.length)return;
 let minx=Math.min(...pts.map(p=>p.lon_deg))-3,maxx=Math.max(...pts.map(p=>p.lon_deg))+3,miny=Math.min(...pts.map(p=>p.lat_deg))-3,maxy=Math.max(...pts.map(p=>p.lat_deg))+3;
 const cx=(minx+maxx)/2,cy=(miny+maxy)/2;let width=Math.max(16,maxx-minx),height=Math.max(10,maxy-miny);
 if(width/height<1000/560)width=height*1000/560;else height=width*560/1000;
 const P=p=>[500+(p.lon_deg-cx)*1000/width,280-(p.lat_deg-cy)*560/height];
 const line=a=>a.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(1)).join(',')}`).join(' ');
 let svg='<defs><clipPath id="operations-clip"><rect width="1000" height="560"/></clipPath></defs><rect width="1000" height="560" fill="#e8eff0"/><g clip-path="url(#operations-clip)">';
 for(const ring of coast.rings)svg+=`<path d="${line(ring.map(([lon_deg,lat_deg])=>({lon_deg,lat_deg})))}Z" fill="#d4dfd3" stroke="#96aaa0" stroke-width=".6"/>`;
 for(let lat=10;lat<=60;lat+=5)svg+=`<path d="${line([{lat_deg:lat,lon_deg:80},{lat_deg:lat,lon_deg:180}])}" stroke="#b7cbd0" stroke-dasharray="3 5"/>`;
 const labels=[['台湾',23.7,121],['浙江',29,120.4],['上海',31.2,121.5],['九州',32.6,130.6],['本州',36,137],['朝鲜半岛',36.5,127.5]];
 for(const [name,lat_deg,lon_deg] of labels){const [x,y]=P({lat_deg,lon_deg});svg+=`<text x="${x}" y="${y}" fill="#3c595d" font-size="13">${name}</text>`;}
 if(c&&$('#operations-wind-rings').checked){for(const [name,radii] of Object.entries(c.wind_radii_km_NE_SE_SW_NW??{})){const ring=[];for(let angle=0;angle<=360;angle+=3){const quadrant=Math.min(3,Math.floor((angle%360)/90)),r=radii[quadrant],a=angle*Math.PI/180;const [lat_deg,lon_deg]=sphereExp([c.lat_deg,c.lon_deg],r*Math.sin(a),r*Math.cos(a));ring.push({lat_deg,lon_deg});}svg+=`<path d="${line(ring)}Z" fill="#db9a36" fill-opacity=".08" stroke="#bb862e" stroke-dasharray="5 4"><title>官方${name}级风圈；${esc(time(c.valid_time_utc))}；东北/东南/西南/西北 ${radii.join('/')}km</title></path>`;}}
 svg+=`<path d="${line(observations)}" fill="none" stroke="#556876" stroke-width="2.5"/>`;
 for(const p of paths){const color=colors[data.model.paths.indexOf(p)%colors.length],future=futurePoints(p,now);svg+=`<path d="${line([p.anchor,...future].filter(Boolean))}" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="6 3"/>`;for(const x of future){const [a,b]=P(x);svg+=`<circle cx="${a}" cy="${b}" r="3" fill="${color}"><title>${esc(p.model_id)} / ${esc(time(x.valid_time_utc))}</title></circle>`;}for(const x of futureCrossings(p,now)){const [a,b]=P(x);svg+=`<rect x="${a-4}" y="${b-4}" width="8" height="8" fill="${color}"><title>几何交点 ${esc(x.region)} / ${esc(time(x.valid_time_utc))}</title></rect>`;}}
 if(c){const [x,y]=P(c);svg+=`<circle cx="${x}" cy="${y}" r="7" fill="#243f55" stroke="#fff" stroke-width="2"/><text x="${x+12}" y="${y-9}" fill="#243f55" font-size="13">官方最新中心 ${time(c.valid_time_utc)}</text>`;}
 $('#operations-map').innerHTML=svg+'</g>';
}
function renderStudy(){if(!study)return;const phase=$('#motion-phase').value,lead=Number($('#motion-lead').value),rows=matchingRows(study.summary,phase,lead);
 $('#motion-results').innerHTML=rows.map(r=>{const coverage=groupedCoverage(study.conformal,phase,r.model_id,'Causal rolling rank');return `<tr><td>${esc(r.model_id)}</td><td>${r.n} / ${r.storms}</td><td>${fmt(r.mean_error_km)}</td><td>${coverage.n?fmt(coverage.coverage*100)+'% ('+coverage.covered+'/'+coverage.n+')':'旧配置，见原校准表'}</td></tr>`;}).join('');
 $('#motion-note').textContent=`所有新旧F0/F1/F2保持相同1020条基础上下文与起报队列；新CV偏差目标与二层C0/C1分别记录。2017验证选定 ${study.selection}。联合覆盖事件是固定起报6/12/24/48/72h五点全部覆盖，不随本表单个lead改变。历史季节与CHAMPI已经查看，全部为探索性。`;
 const efficiency=study.efficiency.find(r=>r.phase===phase&&r.base===study.selection);
 $('#motion-efficiency').textContent=efficiency?`效率仍未达标：同实际覆盖下C1/Base面积比 ${fmt(efficiency.matched_area_ratio,3)}${efficiency.ratio_ci95?'，95%区间 ['+efficiency.ratio_ci95.map(x=>fmt(x,3)).join(', ')+']':'（单场无区间）'}。C1已发布72h平均半径约 ${fmt(efficiency.candidate_72h_radius_mean,0)} km；高覆盖伴随宽区域，不能仅据覆盖率宣布成功。`:'验证队列只用于点预测选择，2019校准资料不得倒流到2017，因此不显示伪覆盖或效率。';
}
async function load(){if(busy)return;busy=true;try{const r=await fetch('assets/champi-operations.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);data=await r.json();if(!coast){const g=await fetch('assets/coastline.json');coast=await g.json();}if(!initialized){data.model.paths.filter(p=>!p.model_id.endsWith(' + C0')).forEach(p=>selection.add(p.model_id));initialized=true;}render();}catch(e){$('#operations-status').textContent='实时缓存读取失败：'+e.message+'；请查看官方来源。';}finally{busy=false;}}
$('#operations-refresh').addEventListener('click',load);$('#operations-wind-rings').addEventListener('change',()=>render());
for(const id of ['#motion-phase','#motion-lead'])$(id).addEventListener('change',renderStudy);
fetch('assets/motion-residual.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(d=>{study=d;renderStudy();}).catch(e=>$('#motion-note').textContent='研究数据读取失败：'+e.message);
load();setInterval(load,60000);
