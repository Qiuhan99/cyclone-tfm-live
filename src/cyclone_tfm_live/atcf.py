"""Strict, source-preserving ATCF import for the CHAMPI research branch."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
import csv
import hashlib
import re
from pathlib import Path
import pandas as pd

STORM = 'CHAMPI_2026'
UCAR = 'https://hurricanes.ral.ucar.edu/realtime/plots/northwestpacific/2026/wp292026/'
IBTRACS = 'https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.last3years.list.v04r01.csv'

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def assert_identity(source_id):
    if source_id not in {'WP292026', '2630', '2026288N10161', STORM}:
        raise ValueError('CHAMPI identity mismatch: '+source_id)

def coord(value, axis):
    m = re.fullmatch(r'(\d{1,4})([NSEW])', value.strip().upper())
    if not m or m[2] not in ('NS' if axis == 'lat' else 'EW'):
        raise ValueError('invalid ATCF coordinate '+value)
    x = int(m[1])/10 * (-1 if m[2] in 'SW' else 1)
    if abs(x) > (90 if axis == 'lat' else 180):
        raise ValueError('coordinate out of range')
    return ((x+180)%360-180) if axis == 'lon' else x

def number(value, low, high):
    try: x = float(value)
    except (ValueError, TypeError): return None
    return x if low <= x <= high else None

def parse_atcf(path, kind, url):
    """Collapse wind-radius repeats only; quarantine ALL conflicting centers.

    TECHNUM is retained, not assumed to be an ensemble member. Distinct aid
    strings are never renamed as IFS/AIFS. Source rows and radii remain linked.
    """
    path = Path(path); digest = sha(path); groups = {}; errors = []; rejected = 0
    for lineno, line in enumerate(path.read_text().splitlines(), 1):
        f = [s.strip() for s in line.split(',')]
        try:
            if len(f)<10: raise ValueError('short record')
            if f[0] != 'WP' or f[1] != '29':
                raise ValueError('storm basin/number mismatch')
            t = datetime.strptime(f[2], '%Y%m%d%H').replace(tzinfo=timezone.utc)
            if t.year != 2026: raise ValueError('storm year mismatch')
            aid=f[4]; lead=int(f[5])
            if kind=='bdeck' and (aid!='BEST' or lead!=0): continue
            if not aid or not 0<=lead<=480: raise ValueError('invalid aid/lead')
            lat,lon=coord(f[6],'lat'),coord(f[7],'lon')
            key=(t,aid,f[3],lead)
            record=dict(storm_id=STORM,source_storm_id='WP292026',
                record_kind='observation' if kind=='bdeck' else 'forecast',
                source_provider='UCAR',model_id='ATCF:'+aid,model_raw_aid=aid,
                member_id=None,tech_num=f[3],issue_time_utc=t if kind=='adeck' else None,
                native_issue_time_utc=t if kind=='adeck' else None,available_at_utc=None,
                valid_time_utc=t+timedelta(hours=lead),lead_h=lead if kind=='adeck' else None,
                lat_deg=lat,lon_deg=lon,vmax_kt=number(f[8],1,250),mslp_hpa=number(f[9],800,1100),
                source_url=url,raw_file_sha256=digest,version=path.parent.name,
                quality_flag='working_best_track/provisional_or_revised' if kind=='bdeck' else 'raw_aid_unmapped',
                is_revised_best_track=kind=='bdeck',source_rows=[],radii_records=[])
            bucket=groups.setdefault(key,[])
            same=next((r for r in bucket if (r['lat_deg'],r['lon_deg'],r['vmax_kt'],r['mslp_hpa'])==(lat,lon,record['vmax_kt'],record['mslp_hpa'])),None)
            if same is None: same=record;bucket.append(same)
            same['source_rows'].append(lineno)
            if len(f)>=17:
                same['radii_records'].append(dict(source_row=lineno,threshold_kt=f[11],quadrant_code=f[12],radii_nm=f[13:17]))
        except (ValueError,IndexError) as e:
            rejected+=1
            if len(errors)<40:errors.append(dict(source_row=lineno,error=str(e)))
    rows=[];conflicts=[]
    for key,bucket in groups.items():
        if len(bucket)>1:
            conflicts.extend(bucket)
            if len({(r['lat_deg'],r['lon_deg']) for r in bucket})==1:
                # Identical center but contradictory intensity/radii: retain
                # the unambiguous center, mask conflicting attributes.
                merged=bucket[0].copy()
                for field in ['vmax_kt','mslp_hpa']:
                    if len({r[field] for r in bucket})>1:merged[field]=None
                merged['source_rows']=sum([r['source_rows'] for r in bucket],[])
                merged['radii_records']=[]
                merged['quality_flag']+=';conflicting_intensity_masked_radii_withheld'
                rows.append(merged)
        else: rows.extend(bucket)
    frame=pd.DataFrame(rows)
    if not frame.empty:
        for c in ['issue_time_utc','native_issue_time_utc','available_at_utc','valid_time_utc']:
            frame[c]=pd.to_datetime(frame[c],utc=True)
        frame=frame.sort_values(['valid_time_utc','model_raw_aid','tech_num']).reset_index(drop=True)
    return frame,dict(raw_lines=len(path.read_text().splitlines()),accepted=len(rows),conflicting_records=conflicts,rejected_lines=rejected,parse_errors=errors)

def import_ibtracs(path):
    raw=pd.read_csv(path,skiprows=[1],low_memory=False)
    raw=raw[raw.SID.eq('2026288N10161')].copy()
    if raw.empty: raise ValueError('CHAMPI SID absent')
    if not raw.NAME.str.strip().eq('CHAMPI').all() or not raw.SEASON.eq(2026).all() or not raw.BASIN.eq('WP').all():
        raise ValueError('IBTrACS identity mismatch')
    out=[]
    for _,r in raw.iterrows():
        out.append(dict(storm_id=STORM,source_storm_id=r.SID,source_provider='NOAA_IBTrACS',
            record_kind='observation',model_id='IBTrACS:LAT/LON',model_raw_aid=None,member_id=None,
            issue_time_utc=None,available_at_utc=None,valid_time_utc=pd.Timestamp(r.ISO_TIME,tz='UTC'),
            lead_h=None,lat_deg=float(r.LAT),lon_deg=(float(r.LON)+180)%360-180,
            vmax_kt=number(r.WMO_WIND,1,250),mslp_hpa=number(r.WMO_PRES,800,1100),
            source_url=IBTRACS,raw_file_sha256=sha(path),version='user_uploaded_snapshot',
            quality_flag='retrospective_IBTrACS_LAT/LON_WMO_intensity',is_revised_best_track=True))
    return pd.DataFrame(out).sort_values('valid_time_utc')

def exact_score_join(forecasts,truth):
    """One fixed truth definition and exact valid time; never nearest-cycle match."""
    if truth.duplicated(['storm_id','valid_time_utc']).any():raise ValueError('ambiguous truth')
    f=forecasts.copy()
    if not ((f.valid_time_utc-f.issue_time_utc).dt.total_seconds()/3600).eq(f.lead_h).all():
        raise ValueError('issue/lead mismatch')
    return f.merge(truth[['storm_id','valid_time_utc','lat_deg','lon_deg']],on=['storm_id','valid_time_utc'],suffixes=('','_truth'),validate='many_to_one')
