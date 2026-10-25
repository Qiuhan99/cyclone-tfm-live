import {alignmentRows,areaRatioCI} from './tfm-alignment-engine.mjs';
const $=s=>document.querySelector(s),fmt=(x,n=1)=>x==null?'N/A':Number(x).toFixed(n);
const names={base:'官方 TabPFN-TS',c0:'加近期观测校正',c1:'加近期观测＋残差反馈'};
let data;
function render(){
  const phase=$('#alignment-phase').value,k=Number($('#alignment-k').value),rows=alignmentRows(data,phase,k);
  $('#alignment-results').innerHTML=rows.map(r=>{const ci=areaRatioCI(r);return `<tr><td>${names[r.method]}</td><td>${r.calibrator==='Original PI+'?'原 PI+':'固定阈值'}</td><td>${r.n} / ${r.storms}</td><td>${fmt(r.mean_error_km)}</td><td>${fmt(r.coverage*100)}%</td><td>${fmt(r.matched_area_ratio,3)}${ci?` [${ci.map(x=>fmt(x,3)).join(', ')}]`:' [单场，无区间]'}</td><td>${fmt(r.matched_candidate_coverage*100)}%</td></tr>`;}).join('');
  const residual=rows.find(r=>r.method==='c1'&&r.calibrator==='Original PI+');
  $('#alignment-residual-note').textContent=`同一 PI+ 下，残差反馈相对“近期观测但无残差历史”的后验同覆盖面积比：${fmt(residual?.residual_increment_vs_c0?.matched_area_ratio,3)}。这项比较隔离历史残差通道，不能把全部 Base→C1 变化都归给残差历史。`;
  const native=phase==='champi'?data.native_summary.find(r=>r.k===k):null;
  $('#alignment-native').textContent=native?`CHAMPI 原生分坐标95%矩形（二维目标90%，未经Conformal）：${native.n}点实际覆盖 ${fmt(native.coverage*100)}%。`:'历史原生分位数未保存在旧缓存中，本轮未重建；不以CHAMPI数据填补。';
  $('#alignment-scope').textContent=`${k===1?'主要设置：每6h新鲜起报。':`陈旧性敏感性：Base每${k*6}h刷新，二层每6h接收新观测。`} 覆盖事件为6h后中心的两个坐标同时覆盖。后验匹配不改变地图或已发布区域；面积为原纬经坐标平面的椭圆面积，置信区间按整风暴重采样。`;
}
fetch('assets/tfm-alignment.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(d=>{
  data=d;$('#alignment-status').textContent=`已运行本地 TabPFN-3.5 · 官方TS ${d.provenance.tabpfn_time_series} · 保留原 ${d.provenance.protected_artifacts} 个产物`;
  for(const id of ['#alignment-phase','#alignment-k'])$(id).addEventListener('change',render);render();
}).catch(e=>$('#alignment-status').textContent='本轮对照数据尚未载入：'+e.message);
