import {shapeSummary,shapeComparisons,issuedShapes,shapeBoundary,shapeObservations,shapeTruth} from './endpoint-shapes-engine.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=3)=>n==null?'N/A':Number(n).toFixed(d),time=t=>t.replace('T',' ').replace('+00:00',' UTC');
let data,coast;
function render(){
 const phase=$('#shape-phase').value,level=+$('#shape-level').value;
 $('#shape-results').innerHTML=shapeSummary(data,phase,level).map(r=>`<tr><td>${esc(r.model_id)}</td><td>${r.shape==='ellipse'?'椭圆':'圆'}</td><td>${r.n} / ${r.storms}</td><td>${r.covered}/${r.n} · ${fmt(100*r.coverage,1)}%</td><td>${fmt(r.geomean_area_km2,0)}</td><td>${fmt(r.mean_error_km,1)}</td></tr>`).join('');
 $('#shape-comparisons').innerHTML=shapeComparisons(data,phase).map(r=>`<tr><td>${r.kind==='shape'?'区域形状':'二层校正'}</td><td>${esc(r.candidate)}<br>÷ ${esc(r.base)}</td><td>${fmt(r.matched_area_ratio)}${r.ratio_ci95?'<br>['+r.ratio_ci95.map(x=>fmt(x)).join(', ')+']':'（单场无区间）'}</td><td>${fmt(100*r.base_attained,2)}% / ${fmt(100*r.candidate_attained,2)}%</td></tr>`).join('');
 const c1=shapeComparisons(data,phase).find(r=>r.kind==='residual'&&r.base==='TabPFN CV-F2 / ellipse'&&r.candidate==='TabPFN CV-F2 + C1 / ellipse');
 const feedback=shapeComparisons(data,phase).find(r=>r.base==='TabPFN CV-F2 + C0 / ellipse'&&r.candidate==='TabPFN CV-F2 + C1 / ellipse');
 $('#shape-conclusion').textContent=`同覆盖诊断：C1/Base椭圆面积比 ${fmt(c1.matched_area_ratio)}，C1/C0椭圆面积比 ${fmt(feedback.matched_area_ratio)}。${phase==='test'?'27场、169个成熟24h终点；所有主要配对区间跨1，尚不能确认稳定改善。':'CHAMPI为单场27个成熟终点；不能据单场正信号推断总体效果。'} 表上半部为原始冻结阈值，下半部为后验统一缩放至相同90%目标覆盖的效率诊断；地图只显示原始阈值。`;
 renderMap();
}
function renderMap(){
 const issue=$('#shape-issue').value,method=$('#shape-method').value,level=+$('#shape-level').value,mode=$('#shape-mode').value;
 const rows=issuedShapes(data,issue,method,level),shown=rows.filter(r=>mode==='both'||r.shape===mode),obs=shapeObservations(data,issue),last=obs.at(-1),truth=shapeTruth(data,rows[0]?.valid_time_utc,$('#shape-hindsight').checked);
 const rings=shown.map(r=>({r,points:shapeBoundary(r).map(([lat_deg,lon_deg])=>({lat_deg,lon_deg}))}));
 const points=[...rings.flatMap(x=>x.points),...obs.slice(-9),...rows,...(truth?[truth]:[])];
 const cx=(Math.min(...points.map(p=>p.lon_deg))+Math.max(...points.map(p=>p.lon_deg)))/2,cy=(Math.min(...points.map(p=>p.lat_deg))+Math.max(...points.map(p=>p.lat_deg)))/2;
 let w=Math.max(12,2+Math.max(...points.map(p=>p.lon_deg))-Math.min(...points.map(p=>p.lon_deg))),h=Math.max(8,2+Math.max(...points.map(p=>p.lat_deg))-Math.min(...points.map(p=>p.lat_deg)));
 if(w/h<1000/480)w=h*1000/480;else h=w*480/1000;
 const P=p=>[500+(p.lon_deg-cx)*1000/w,240-(p.lat_deg-cy)*480/h],line=ps=>ps.map((p,i)=>`${i?'L':'M'}${P(p).map(x=>x.toFixed(2)).join(',')}`).join(' ');
 let svg='<defs><clipPath id="shape-clip"><rect width="1000" height="480"/></clipPath></defs><rect width="1000" height="480" fill="#e8eff0"/><g clip-path="url(#shape-clip)">';
 for(const ring of coast.rings)svg+=`<path d="${line(ring.map(([lon_deg,lat_deg])=>({lon_deg,lat_deg})))}Z" fill="#d4dfd3" stroke="#96aaa0" stroke-width=".6"/>`;
 for(const x of rings)svg+=`<path d="${line(x.points)}Z" fill="${x.r.shape==='ellipse'?'#007c91':'#755a9e'}" fill-opacity=".10" stroke="${x.r.shape==='ellipse'?'#007c91':'#755a9e'}" stroke-width="2" ${x.r.shape==='circle'?'stroke-dasharray="7 4"':''}><title>${x.r.shape} · ${level}% · ${fmt(x.r.area_km2,0)} km² · 起报冻结q=${fmt(x.r.q)}</title></path>`;
 svg+=`<path d="${line(obs.slice(-9))}" fill="none" stroke="#3e5666" stroke-width="2.5"/>`;
 if(last&&rows.length){svg+=`<path d="${line([last,rows[0]])}" fill="none" stroke="#007c91" stroke-width="2" stroke-dasharray="6 4"/>`;const [x,y]=P(rows[0]);svg+=`<circle cx="${x}" cy="${y}" r="6" fill="#007c91"/><text x="${x+12}" y="${y-12}" fill="#234851" font-size="15">+24h预测中心</text>`;}
 if(truth){const [x,y]=P(truth);svg+=`<path d="M${x-6},${y-6}l12,12m-12,0l12,-12" stroke="#bb304f" stroke-width="3"><title>事后24h真值</title></path>`;}
 $('#shape-map').innerHTML=svg+'</g>';
 $('#shape-map-note').textContent=`研究回放起报 ${time(issue)} → 有效 ${time(rows[0]?.valid_time_utc??'')} · ${method}。青色实线=椭圆，紫色虚线=圆；同一预测中心。${rows.map(r=>`${r.shape==='ellipse'?'椭圆':'圆'}几何${r.n_geometry}条/秩分数${r.n_scores}条`).join('；')}。真值${truth?'已叠加':$('#shape-hindsight').checked?'尚无':'已隐藏'}；本图独立于页面顶部实时起报。`;
}
async function init(){[data,coast]=await Promise.all(['assets/endpoint24-shapes.json','assets/coastline.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);return r.json();}));
 const issues=[...new Set(data.regions.map(r=>r.issue_time_utc))].sort();
 $('#shape-issue').innerHTML=issues.map(t=>`<option value="${esc(t)}">${time(t)}</option>`).join('');$('#shape-issue').value=issues.at(-1);
 $('#shape-method').innerHTML=data.config.methods.map(m=>`<option>${esc(m)}</option>`).join('');$('#shape-method').value='TabPFN CV-F2 + C1';
 for(const id of ['#shape-phase','#shape-level','#shape-issue','#shape-method','#shape-mode','#shape-hindsight'])$(id).addEventListener('change',render);
 $('#shape-status').textContent='真实缓存六格实验 · 固定+24h · 2019预热 / 同场成熟残差更新 · 原始80/90/95%区域全部保留';render();
}
init().catch(e=>$('#shape-status').textContent='24h形状实验读取失败：'+e.message);
