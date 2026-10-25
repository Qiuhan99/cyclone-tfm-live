// Original experiment uses raw (latitude, longitude) residual coordinates.
export function coordinateEllipse(center,cov,q,n=72){
 const a=Math.sqrt(cov[0][0]),b=cov[1][0]/a,c=Math.sqrt(Math.max(0,cov[1][1]-b*b));
 return Array.from({length:n+1},(_,i)=>{const t=2*Math.PI*i/n;return [center[0]+q*a*Math.cos(t),center[1]+q*(b*Math.cos(t)+c*Math.sin(t))];});
}
export function issuedView(block,step,retrospective=false){
 if(!Number.isInteger(step)||step<0||step>=block.paths.base.length)throw Error('Invalid issue step');
 return {base:block.paths.base,c0:block.paths.c0.slice(0,step+1),c1:block.paths.c1.slice(0,step+1),
  truth:retrospective?block.truth:block.truth.slice(0,step),baseIssue:block.base_issue,correctedIssue:block.issues[step],target:block.targets[step],
  region:(method,calibrator)=>block.regions[method][calibrator][step]};
}
