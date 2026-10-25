// Pure numerical functions shared by the browser and offline invariant tests.
export const RADIUS_KM=6371.0088;
export const rad=x=>x*Math.PI/180,deg=x=>x*180/Math.PI;
export function wrap(lon){return ((lon+180)%360+360)%360-180;}
export function quantile(sorted,alpha){const k=Math.ceil((sorted.length+1)*(1-alpha));return k>sorted.length?Infinity:sorted[k-1];}
export function distance(a,b){const p=rad(b[0]-a[0]),l=rad(wrap(b[1]-a[1]));return 2*RADIUS_KM*Math.asin(Math.min(1,Math.sqrt(Math.sin(p/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(l/2)**2)));}
export function sphereExp(ll,east,north){const lat=rad(ll[0]),lon=rad(ll[1]),d=Math.hypot(east,north)/RADIUS_KM;if(d<1e-12)return [...ll];const b=Math.atan2(east,north),p=Math.asin(Math.max(-1,Math.min(1,Math.sin(lat)*Math.cos(d)+Math.cos(lat)*Math.sin(d)*Math.cos(b))));return [deg(p),wrap(deg(lon+Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(lat),Math.cos(d)-Math.sin(lat)*Math.sin(p))))];}
export function ellipse(center,cov,q,n=72){const a=Math.sqrt(Math.max(cov[0][0],1e-12)),b=cov[1][0]/a,c=Math.sqrt(Math.max(cov[1][1]-b*b,1e-12));return Array.from({length:n+1},(_,i)=>{const t=i*2*Math.PI/n;return sphereExp(center,q*a*Math.cos(t),q*(b*Math.cos(t)+c*Math.sin(t)));});}
export function eigenMax(c){return .5*(c[0][0]+c[1][1]+Math.sqrt((c[0][0]-c[1][1])**2+4*c[0][1]**2));}
export function coverageResult(origin,method,hours,mode,calibration,alpha){if(mode==='none'||!origin.scores)return null;const c=calibration[method][hours/6][mode],q=quantile(c.scores,alpha),score=origin.scores[method][hours/6][mode];return {q,score,covered:score<=q,n:c.scores.length,covariances:c.covariances};}
// V2: use the threshold and geometry frozen at THIS issue, never an oracle match.
export function issuedCoverageResult(origin,method,hours,mode,alpha){
 if(mode==='none')return null;const c=origin.regions?.[method]?.[hours/6]?.[mode],q=c?.q?.[alpha];
 if(!c||!Number.isFinite(q))return null;
 return {q,score:c.score,covered:c.score<=q,n:c.n_scores,covariances:c.covariances,nGeometry:c.n_geometry,geometryAt:c.geometry_available_at,scoreAt:c.score_available_at};
}
export function visibleTruth(origin,retrospective,hours){if(!retrospective)return [];const leads=origin.leads||origin.truth.map((_,i)=>(i+1)*6);return origin.truth.filter((_,i)=>leads[i]<=hours);}
export function pathToH(origin,method,hours){const leads=origin.leads||origin.paths[method].map((_,i)=>(i+1)*6);return origin.paths[method].filter((_,i)=>leads[i]<=hours);}
// Common-origin endpoint risk: do not mix path-average and terminal error.
export function endpointBenchmark(storms,protocol,hours,options={}){
 const ss=storms.filter(s=>s.protocol===protocol),origins=ss.flatMap(s=>s.origins);
 const methods=options.methods||(protocol==='test'?['persistence','velocity','tabpfn','corrected']:['tabpfn','c2']);
 const rows=origins.map(o=>{const i=(o.leads||o.truth.map((_,j)=>(j+1)*6)).indexOf(hours);return {o,i};}).filter(({o,i})=>i>=0&&methods.every(m=>Number.isFinite(o.errors[m]?.[i])));
 const values=Object.fromEntries(methods.map(m=>[m,{mae:rows.reduce((a,{o,i})=>a+o.errors[m][i],0)/rows.length}]));
 const corr=options.corrector||(protocol==='test'?'corrected':'c2');
 const changed=rows.filter(({o,i})=>distance(o.paths.tabpfn[i],o.paths[corr][i])>1e-5).length;
 return {hours,nStorms:ss.filter(s=>s.origins.length).length,nOrigins:rows.length,values,changed,
  gainVsBase:100*(1-values[corr].mae/values.tabpfn.mae),
  gainVsVelocity:methods.includes('velocity')?100*(1-values[corr].mae/values.velocity.mae):null,
  winsVsBase:rows.filter(({o,i})=>o.errors[corr][i]<o.errors.tabpfn[i]-1e-7).length/rows.length};
}
export function mercator(lat){return deg(Math.log(Math.tan(Math.PI/4+rad(Math.max(-80,Math.min(80,lat)))/2)));}
