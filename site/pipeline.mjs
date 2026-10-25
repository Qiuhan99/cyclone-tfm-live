const target=document.querySelector('#pipeline-live');
const time=x=>x?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Hong_Kong',dateStyle:'medium',timeStyle:'short'}).format(new Date(x)):'未记录';
function render(v){
 const p=v.data_profile??{},obs=v.observations??[],rows=[['模型资料截止',time(v.model.input_last_valid_utc)],['模型实际生成',time(v.generated_at_utc)],['公开资料核验',time(v.last_checked_at_utc)],['当前定位记录',(p.observation_count??obs.length)+'个 / 6h网格'],['记录范围',time(p.first_valid_utc??obs[0]?.valid_time_utc)+' → '+time(p.last_valid_utc??obs.at(-1)?.valid_time_utc)],['真实发布来源',v.publication?.mode==='mac_auto'?'Mac自动发布的模型版本':'历史缓存；未见Mac自动发布记录'],['风速／气压缺失',(p.missing_wind_count??obs.filter(x=>x.vmax_kt==null).length)+' / '+(p.missing_pressure_count??obs.filter(x=>x.mslp_hpa==null).length)],['模型输入维数','F2 52 / C0 54 / C1 70'],['观测原文件SHA256',v.track_source?.sha256??'未记录']];
 const dl=document.createElement('dl');for(const [label,value]of rows){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);dl.append(div);}target.replaceChildren(dl);
 const stale=Date.now()-Date.parse(v.last_checked_at_utc)>90*60e3||Date.now()-Date.parse(v.model.input_last_valid_utc)>24*3600e3;
 if(stale){const note=document.createElement('p');note.className='warning';note.textContent='核验或模型资料时间已过期，请查看版本时间；本页没有生成替代预测。';target.append(note);}
}
async function load(){try{const r=await fetch('assets/champi-operations.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);render(await r.json());}catch{target.textContent='当前公开版本读取失败，未生成演示数据。';}}
load();setInterval(load,60000);
