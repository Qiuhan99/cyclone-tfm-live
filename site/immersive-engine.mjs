import {BASE,FEEDBACK} from './results-engine.mjs';
import {issuedBoundary} from './atlas-engine.mjs';
import {distance} from './engine.mjs';
export const CHAPTERS=['opening','formulation','residual','demonstration','uncertainty','evidence','protocol'];
export function storyFrame(evidence,caseId,chapter=0){
 if(!Number.isInteger(chapter)||chapter<0||chapter>=CHAPTERS.length)throw Error('Unknown research chapter');
 const c=evidence.cases.find(c=>c.storm_id===caseId);if(!c)throw Error('Unknown archived case');
 const o=c.origin,past=c.storm.track.filter(p=>Date.parse(p.time)<=Date.parse(o.issue)).slice(-9).map(p=>[p.lat,p.lon]);
 if(!past.length||o.paths[BASE].length!==4||o.paths[FEEDBACK].length!==4||o.truth.length!==4)throw Error('Incomplete 24h research case');
 const base=o.paths[BASE],feedback=o.paths[FEEDBACK],truth=o.truth;
 const baseRegion=issuedBoundary(o,BASE,24,90),feedbackRegion=issuedBoundary(o,FEEDBACK,24,90);
 return {c,o,past,base,feedback,truth,baseRegion,feedbackRegion,
  extent:[...past,...base,...feedback,...truth,...baseRegion,...feedbackRegion],
  layers:{base:chapter>=1,truth:chapter>=2,residual:chapter===2,feedback:chapter>=3,correction:chapter>=3,regions:chapter>=4},
  baseError:o.errors[BASE][3],feedbackError:o.errors[FEEDBACK][3],
  correction:distance(base[3],feedback[3]),chapter,
  scope:'SELECTED_RETROSPECTIVE_ILLUSTRATION',regionScope:'ORIGINAL_JOINT_PATH_REGION_PROJECTION'};
}
export function chapterIndex(value){return Math.max(0,Math.min(CHAPTERS.length-1,Number.isFinite(value)?Math.round(value):0));}
