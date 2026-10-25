import {distance,wrap,mercator} from './engine.mjs';
import {OWN,LABELS,point,boundary,area,comparators,pairedScore} from './algorithm-engine.mjs';
import {operationalState} from './operations-engine.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
const time=t=>Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Hong_Kong',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t))+' HKT':'未提供';
const colors=['#e1ae78','#b69ee0','#8bdec4'],otherColors=['#f4ce7b','#91b9df','#d990a3','#a7a5eb'];
let D,G,B,busy=false,error='';
const ll=q=>[q.lat_deg,q.lon_deg],method=()=>$('#algo-method').value,hours=()=>+$('#algo-lead').value,level=()=>+$('#algo-level').value;
const route=p=>[...(p.anchor?[ll(p.anchor)]:[]),...p.points.filter(q=>q.lead_h<=hours()).map(ll)];
function maps(own,external,selected){
 const target=point(selected,hours()),ring=boundary(target,level()),past=D.observations.slice(-13).map(ll),all=[...past,...own.flatMap(route),...external.flatMap(route),...ring];if(!all.length)return;
 const lon0=all[0][1],xs=all.map(p=>lon0+wrap(p[1]-lon0)),ys=all.map(p=>mercator(p[0])),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 let sx=Math.max(5,(Math.max(...xs)-Math.min(...xs))*1.25),sy=Math.max(4,(Math.max(...ys)-Math.min(...ys))*1.3);if(sx/sy<700/530)sx=sy*700/530;else sy=sx*530/700;
 const P=p=>[350+(lon0+wrap(p[1]-lon0)-cx)*700/sx,265-(mercator(p[0])-cy)*530/sy],line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(2)).join(',')}`).join(' ');
 function draw(id,paths,region){
  let svg=`<defs><clipPath id="${id}-clip"><rect width="700" height="530"/></clipPath><marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#e7efe7"/></marker></defs><g clip-path="url(#${id}-clip)"><rect width="700" height="530" fill="#0d2632"/>`;
  for(const r of G.rings){if(!r.some(([lo,la])=>Math.abs(lon0+wrap(lo-lon0)-cx)<sx&&Math.abs(mercator(la)-cy)<sy))continue;svg+=`<path d="${line(r.map(([lo,la])=>[la,lo]))}Z" fill="#1c3b44" stroke="#527079" stroke-width=".75"/>`;}
  for(let la=0;la<=60;la+=5)svg+=`<path d="${line([[la,70],[la,210]])}" stroke="#527079" opacity=".2" stroke-dasharray="3 7"/>`;
  for(let lo=70;lo<=200;lo+=5)svg+=`<path d="${line([[-5,lo],[65,lo]])}" stroke="#527079" opacity=".2" stroke-dasharray="3 7"/>`;
  for(const [name,p] of [['台湾',[23.7,121]],['浙江',[29,120.3]],['九州',[32.5,130.7]],['四国',[33.7,133.5]],['本州',[35.5,137.5]],['朝鲜半岛',[36,127.8]]]){const [x,y]=P(p);svg+=`<text x="${x}" y="${y}" font-size="13" fill="#99afb3">${name}</text>`;}
  if(region&&ring.length)svg+=`<path d="${line(ring)}Z" fill="#8bdec4" fill-opacity=".12" stroke="#8bdec4" stroke-width="1.5"><title>本研究${level()}%边际Conformal位置区域 · +${hours()}h</title></path>`;
  svg+=`<path d="${line(past)}" fill="none" stroke="#c4d1d0" stroke-width="2" opacity=".7"/>`;
  for(const {p,color,dashed} of paths){const coords=route(p);if(!coords.length)continue;svg+=`<path d="${line(coords)}" fill="none" stroke="${color}" stroke-width="${p.model_id===method()?3.3:2.1}" ${dashed?'stroke-dasharray="6 5"':''}><title>${esc(p.model_id)} · ${esc(time(p.issue_time_utc))}</title></path>`;
   for(const q of p.points.filter(q=>q.lead_h<=hours())){const [x,y]=P(ll(q)),elapsed=Date.parse(q.valid_time_utc)<=Date.now();svg+=`<circle cx="${x}" cy="${y}" r="${q.lead_h===hours()?5:3}" fill="${color}" opacity="${elapsed?0.45:1}"><title>${esc(p.model_id)} +${q.lead_h}h · ${esc(time(q.valid_time_utc))} · ${elapsed?'目标时刻已到达':'未来预测'}</title></circle>`;if(q.lead_h===hours())svg+=`<text x="${x+9}" y="${y-9}" fill="${color}" font-size="12">+${hours()}h</text>`;}
  }
  const base=point(own.find(p=>p.model_id===OWN[0]),hours());if(region&&base&&target&&selected.model_id!==OWN[0])svg+=`<path d="${line([ll(base),ll(target)])}" fill="none" stroke="#e7efe7" stroke-width="2" marker-end="url(#${id}-arrow)"><title>Base → 所选研究模型的实际校正向量</title></path>`;
  if(past.length){const [x,y]=P(past.at(-1));svg+=`<circle cx="${x}" cy="${y}" r="6" fill="#eff2dc" stroke="#193f48" stroke-width="2"><title>UCAR最新已观测中心</title></circle>`;}
  svg+='<rect x="15" y="492" width="340" height="24" rx="4" fill="#07151dcc"/><text x="25" y="509" fill="#9bb0b7" font-size="11">两图同一范围 / Natural Earth 本地底图</text></g>';
  $('#'+id).innerHTML=svg;
 }
 draw('algo-own-map',own.map((p,i)=>({p,color:colors[OWN.indexOf(p.model_id)]??colors[i]})),true);
 draw('algo-other-map',[{p:selected,color:'#8bdec4',dashed:true},...external.map((p,i)=>({p,color:otherColors[i%4]}))],false);
}
function verification(){
 const ledger=D.verification,models=new Set(['CMA / BABJ',...D.model.paths.map(p=>p.model_id),...(ledger?.records??[]).map(r=>r.model_id)]);models.delete(method());
 $('#algo-ledger-note').textContent=ledger?`前瞻协议启用 ${time(ledger.started_at_utc)}；当前保留 ${ledger.records.length} 条逐时效预测版本、${ledger.records.filter(r=>r.eligible).length} 条事前确认记录。公开Git确认采取保守时间戳；尚未确认或确认太晚的版本不计分。`:'前瞻封存尚未返回首个公开记录。原历史路径不会补记为提前发布。';
 $('#algo-forward').innerHTML=[...models].map(id=>{const v=pairedScore(ledger,method(),id,hours(),level());return `<tr><td>${esc(LABELS[id]??id)}</td><td>${v.n}</td><td>${fmt(v.own)} / ${fmt(v.other)}</td><td>${v.n?v.wins+' / '+v.n:'待实况'}</td><td>${v.regionN?fmt(v.coverage*100)+'%（n='+v.regionN+'）':'—'} / ${level()}%</td><td>${fmt(v.area,0)}</td></tr>`;}).join('');
 const ids=new Set(['ATCF:CMC','ATCF:UKM','ATCF:NGX',...OWN]);
 $('#algo-retro').innerHTML=(B.external_common??[]).filter(r=>r.lead_h===hours()&&ids.has(r.model_id)).map(r=>`<tr class="${OWN.includes(r.model_id)?'our-row':''}"><td>${esc(LABELS[r.model_id]??r.model_id)}</td><td>${r.n}</td><td>${fmt(r.mean_error_km,2)}</td></tr>`).join('')||'<tr><td colspan="3">该时效没有原实验共同样本。</td></tr>';
}
function render(){
 if(!D||!G||!B)return;
 const own=D.model.paths.filter(p=>OWN.includes(p.model_id)),selected=own.find(p=>p.model_id===method());if(!selected)throw Error('所选真实研究模型不存在');
 const target=point(selected,hours()),base=point(own.find(p=>p.model_id===OWN[0]),hours()),external=comparators(D,selected.issue_time_utc,$('#algo-pairing').value),state=operationalState(D),expired=target&&Date.parse(target.valid_time_utc)<=Date.now();
 $('#algo-state').textContent=expired?'该目标时刻已到达':state.forecastStale?'模型输入已滞后':'最新可用真实起报';
 $('#algo-status').classList.toggle('warn',!!error||state.forecastStale||expired);
 $('#algo-status').textContent=[error,`模型资料截止 ${time(selected.issue_time_utc)}；实际生成 ${time(selected.generated_at_utc)}；来源核验 ${time(D.last_checked_at_utc)}。`,state.forecastStale?'模型资料滞后，保留原版本，不能视作最新气象状态。':'',expired?'所选目标时刻已到达；原预测保留，不改写为新预测。':'',D.agency_forecasts?.ok===false?'CMA接口本次失败，保留旧版本与原时间。':'',state.watcherStale?'公开源核验心跳已过期。':'',state.failedSources.length?'公开源核验失败：'+state.failedSources.join('、')+'；未核实的预警不能解释为无预警。':''].filter(Boolean).join(' ');
 $('#algo-own-clock').textContent=`${LABELS[method()]} · 起报 ${time(selected.issue_time_utc)} · 固定模型真实输出；没有从官方路径复制预测中心。`;
 $('#algo-target').textContent=target?`${fmt(target.lat_deg,2)}°N / ${fmt(target.lon_deg,2)}°E`:'该时效缺失';$('#algo-target-time').textContent=target?`+${hours()}h · 有效时刻 ${time(target.valid_time_utc)}`:'未插值或外推补齐';
 $('#algo-correction').textContent=base&&target?fmt(distance(ll(base),ll(target)))+' km':'—';
 const radius=target?.[`radius_${level()}_km`];$('#algo-radius').textContent=Number.isFinite(radius)?`半径 ${fmt(radius)} km`:'无已发校准阈值';$('#algo-area').textContent=`目标${level()}% · +${hours()}h边际位置区域 · 球面面积 ${fmt(area(radius),0)} km² · 校准n=${target?.calibration_n??'—'}。不是整条路径同时覆盖的概率。`;
 const coast=(selected.landfall_candidates??[]).find(p=>Date.parse(p.valid_time_utc)>Date.now()&&Date.parse(p.valid_time_utc)<=Date.parse(selected.issue_time_utc)+hours()*3600000);$('#algo-coast').textContent=coast?coast.region+' · '+time(coast.valid_time_utc):'所选未来时段无已算交点';
 $('#algo-other-legend').innerHTML='<span class="c1">┄ 所选研究模型</span>'+external.map((p,i)=>`<span class="other-${i%4}">${esc(p.model_id)} · ${esc(time(p.issue_time_utc))}</span>`).join('');
 const missing=external.filter(p=>!point(p,hours())).map(p=>p.model_id);$('#algo-other-note').textContent=`${$('#algo-pairing').value==='matched'?'仅绘制严格同一起报的可用对照；不同来源的定位和可用信息仍有差异。':'各来源最新起报，仅作态势对照，不用于公平技能排名。'}${external.length?'':'暂无同起报外部路径。'}${missing.length?' '+missing.join('、')+' 无+'+hours()+'h原报点，地图只保留已有较短时效。':''}CMA是机构预报；ATCF标签是数值模式。`;
 maps(own,external,selected);verification();
}
async function load(){if(busy)return;busy=true;$('#algo-refresh').disabled=true;try{
 const fetchJSON=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' '+r.status);return r.json();};
 const [d,g,b]=await Promise.all([fetchJSON('assets/champi-operations.json'),G??fetchJSON('assets/coastline.json'),B??fetchJSON('assets/motion-residual.json')]);
 if(!OWN.every(id=>d.model?.paths.some(p=>p.model_id===id)))throw Error('缺少真实Base/C0/C1路径');D=d;G=g;B=b;error='';render();
 }catch(e){error='读取失败：'+e.message+'；保留上次版本，不生成替代预测。';$('#algo-status').textContent=error;$('#algo-status').classList.add('warn');}finally{busy=false;$('#algo-refresh').disabled=false;}}
for(const id of ['algo-method','algo-lead','algo-level','algo-pairing'])$('#'+id).addEventListener('change',()=>{try{render();}catch(e){$('#algo-status').textContent='显示失败：'+e.message;}});
$('#algo-refresh').onclick=load;load();setInterval(load,60000);
