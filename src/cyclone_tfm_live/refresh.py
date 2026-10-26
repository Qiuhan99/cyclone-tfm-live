"""Public-source updates without changing the timestamps of cached TFM output."""
from pathlib import Path
from datetime import datetime,timezone
import copy,hashlib,json,subprocess
import pandas as pd
from .atcf import UCAR,parse_atcf
from .official import nmc_center,nmc_warning,Coast,OtherStormBulletin
from .agency_forecast import attach
from .forecast_analysis import build_analysis

TSFM={'Chronos-Bolt-small','Chronos-2','Moirai-1.1-R-small'}

URLS={'bdeck':UCAR+'bwp292026.dat','adeck':UCAR+'awp292026.dat',
      'center':'https://www.nmc.cn/publish/typhoon/typhoon_new.html','warning':'https://m.nmc.cn/publish/typhoon/warning_index.html'}


def now():return datetime.now(timezone.utc).isoformat()
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def atomic(path,value):
    path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False,default=str));tmp.replace(path)


def validate_tfm(payload):
    model=payload.get('model',payload)
    if not model.get('input_last_valid_utc') or not model.get('paths'):raise ValueError('missing actual model provenance')
    for p in model['paths']:
        if p.get('model_raw_aid'):continue
        tsfm=p.get('model_family')=='tsfm' and p['model_id'] in TSFM
        if not (p['model_id'].startswith('TabPFN') or tsfm) or not p.get('raw_file_sha256') or not p.get('generated_at_utc'):
            raise ValueError('unverified TFM path')
        if len(p['raw_file_sha256'])!=64:raise ValueError('invalid TFM source digest')
        if tsfm and (p.get('protocol_id')!='champi_tsfm_operations_v1' or len(p.get('checkpoint_sha256',''))!=64 or len(p.get('model_revision',''))!=40):raise ValueError('unverified TSFM provenance')
        issue=pd.Timestamp(p['issue_time_utc'])
        for point in p['points']:
            if pd.Timestamp(point['valid_time_utc'])!=issue+pd.Timedelta(hours=point['lead_h']):raise ValueError('TFM issue/lead mismatch')
    return copy.deepcopy(model)


def assemble(previous,b,a,official,status,coast,checked,tfm=None):
    """Do not promote old model origin/generated_at when only sources refresh."""
    out=copy.deepcopy(previous);model=validate_tfm(tfm) if tfm else copy.deepcopy(previous['model'])
    paths=[p for p in model['paths'] if not p.get('model_raw_aid')]
    origin=b.valid_time_utc.max() if b is not None and len(b) else pd.Timestamp(previous['observations'][-1]['valid_time_utc'])
    if a is not None and len(a):
        selected=a[a.issue_time_utc.le(origin)&a.model_raw_aid.isin(['CMC','UKM','NGX'])&a.lead_h.between(6,72)].copy()
        selected=selected[selected.issue_time_utc.eq(selected.groupby('model_raw_aid').issue_time_utc.transform('max'))]
        for (aid,tech),g in selected.groupby(['model_raw_aid','tech_num'],dropna=False):
            if g.duplicated('lead_h').any():raise ValueError('ambiguous external path')
            issue=pd.Timestamp(g.issue_time_utc.iloc[0]).isoformat()
            path=dict(model_id='ATCF:'+aid+' / TECHNUM '+str(tech),model_raw_aid=aid,issue_time_utc=issue,source_url=g.source_url.iloc[0],
                raw_file_sha256=g.raw_file_sha256.iloc[0],wind_averaging_period='该aid平均时段未核实；保留kt，不转为CMA强度等级',
                generated_at_utc=checked,input_downloaded_at_utc=checked,
                points=json.loads(g.sort_values('lead_h')[['valid_time_utc','lead_h','lat_deg','lon_deg','vmax_kt','mslp_hpa']].to_json(orient='records',date_format='iso')))
            anchor=b[b.valid_time_utc.eq(pd.Timestamp(issue))] if b is not None else []
            if len(anchor):
                path['anchor']=dict(valid_time_utc=issue,lat_deg=float(anchor.lat_deg.iloc[0]),lon_deg=float(anchor.lon_deg.iloc[0]))
                path['landfall_candidates']=coast.crossings(path['anchor'],path['points'])
            else:
                # No invented anchor from a later observation.
                path['anchor']=None;path['landfall_candidates']=[];path['landfall_note']='原起报中心缺失，未计算海岸交点'
            paths.append(path)
    else:
        paths.extend(copy.deepcopy([p for p in previous['model']['paths'] if p.get('model_raw_aid')]))
    model['paths']=paths;out['model']=model
    out['official']={**previous.get('official',{}),**official};out['fetch_status']=status
    out['last_checked_at_utc']=checked;out['public_data_generated_at_utc']=checked
    # Keep generated_at_utc as the original TFM run time, separate from fetch.
    if tfm:out['generated_at_utc']=tfm.get('generated_at_utc') or max(p['generated_at_utc'] for p in paths if not p.get('model_raw_aid'))
    out['refresh_interval_seconds']=1800
    out['site_status']='Public-data refresh; TFM remains the actual timestamped output of the separate private inference service'
    if b is not None and len(b):
        out['observations']=json.loads(b[['valid_time_utc','lat_deg','lon_deg','vmax_kt','mslp_hpa']].to_json(orient='records',date_format='iso'))
        out['track_source']=dict(url=URLS['bdeck'],sha256=b.raw_file_sha256.iloc[0],downloaded_at_utc=checked,definition='UCAR working/revised B-deck; row publication times unknown')
        prior=previous.get('track_source',{}).get('sha256');current=out['track_source']['sha256']
        out['source_progress']=dict(checked_at_utc=checked,state='unchanged' if prior==current else 'advanced' if pd.Timestamp(out['observations'][-1]['valid_time_utc'])>pd.Timestamp(previous['observations'][-1]['valid_time_utc']) else 'revised',latest_fix_utc=out['observations'][-1]['valid_time_utc'],source_sha256=current)
    out['forecast_analysis']=build_analysis(out,coast)
    return out


def refresh(site,cache,tfm_path=None):
    assets=Path(site)/'assets';previous=json.loads((assets/'champi-operations.json').read_text());checked=now()
    raw=Path(cache)/datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ');raw.mkdir(parents=True,exist_ok=True)
    status={};parsed={}
    for kind,url in URLS.items():
        target=raw/(kind+('.dat' if kind.endswith('deck') else '.html'))
        try:
            run=subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','60','--retry','1','--output',str(target),url],capture_output=True,text=True,timeout=135)
            if run.returncode:raise RuntimeError(run.stderr.strip())
            if kind.endswith('deck'):
                data,qc=parse_atcf(target,kind,url)
                if data.empty:raise ValueError('no verified CHAMPI records')
                atomic(raw/(kind+'-qc.json'),qc);parsed[kind]=data
            else:
                data=(nmc_center if kind=='center' else nmc_warning)(target.read_text(),checked)
                data.update(source_url=url,retrieved_at_utc=checked,raw_file_sha256=digest(target));parsed[kind]=data
            status[kind]=dict(ok=True,checked_at_utc=checked,url=url,sha256=digest(target))
        except OtherStormBulletin as exc:
            status[kind]=dict(ok=True,state='other_storm',checked_at_utc=checked,url=url,note=str(exc))
        except Exception as exc:status[kind]=dict(ok=False,checked_at_utc=checked,url=url,error=str(exc))
    b=parsed.get('bdeck');a=parsed.get('adeck')
    # A-deck cannot advance on a failed B-deck fetch: retain the matched prior
    # context instead of silently binding a new path to an unknown anchor.
    if b is None:a=None
    coast=Coast(json.loads((assets/'coastline.json').read_text())['rings'])
    tfm=json.loads(Path(tfm_path).read_text()) if tfm_path else None
    output=assemble(previous,b,a,{k:parsed[k] for k in ['center','warning'] if k in parsed},status,coast,checked,tfm)
    attach(output,checked)
    atomic(raw/'manifest.json',dict(checked_at_utc=checked,sources=status))
    atomic(assets/'champi-operations.json',output)
    atomic(assets/'champi-operations-health.json',dict(checked_at_utc=checked,ok=all(r['ok'] for r in status.values()),sources=status))
    print('Public data refreshed;',len(output['model']['paths']),'paths; model origin retained:',output['model']['input_last_valid_utc'])
    if not any(s['ok'] for s in status.values()):raise RuntimeError('all sources failed; preserved last valid data and recorded failures')
