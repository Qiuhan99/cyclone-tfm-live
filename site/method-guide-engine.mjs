export const canonicalMethod=id=>String(id).split(' / TECHNUM ')[0].trim();
export function methodInfo(catalog,id){return catalog.find(r=>r.id===canonicalMethod(id))??{id:canonicalMethod(id),group:'身份待核验',idea:'这个原始方法名称暂未加入说明索引。',difference:'保留原始标签，不猜测算法身份。'};}
export function filterMethods(catalog,kind='all',query=''){
 if(!['all','local','external'].includes(kind))throw Error('unknown method filter');
 const needle=query.trim().toLowerCase();
 return catalog.filter(r=>(kind==='all'||(r.id.startsWith('ATCF:')?kind==='external':kind==='local'))&&(!needle||[r.id,r.group,r.idea,r.difference].join(' ').toLowerCase().includes(needle)));
}
export function horizonRows(diagnostics,phase,lead,paired=false){
 if(!['test','champi'].includes(phase)||![6,12,24,48,72].includes(lead))throw Error('unknown diagnostic control');
 return diagnostics[paired?'same_complete72h_origins':'summary'].filter(r=>r.phase===phase&&r.lead_h===lead);
}
