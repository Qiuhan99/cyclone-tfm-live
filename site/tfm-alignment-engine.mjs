export function alignmentRows(data,phase,k){
  if(!['test','validation','champi'].includes(phase)||!data.provenance.k_grid.includes(Number(k)))throw Error('unknown aligned cohort or refresh');
  return data.summary.filter(r=>r.phase===phase&&r.k===Number(k));
}
export function areaRatioCI(row){return row.matched_delta_log_area_ci95?.map(Math.exp)??null;}
