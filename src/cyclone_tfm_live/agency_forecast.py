"""CMA's public map feed; forecast centres are separate from official warnings."""
from datetime import datetime, timezone, timedelta
import hashlib, json, re, subprocess

BASE = 'https://typhoon.nmc.cn/weatherservice/typhoon/jsons/'


def decode(text):
    # The public map uses JSONP. Never evaluate the callback as JavaScript.
    match = re.fullmatch(r'\s*[A-Za-z_][\w]*\((.*)\)\s*;?\s*', text, re.S)
    if not match:
        raise ValueError('unexpected CMA JSONP envelope')
    return json.loads(match.group(1))


def parse_forecasts(text, checked, own_issue, url):
    t = decode(text)['typhoon']
    if t[1].upper() != 'CHAMPI' or str(t[4]) != '2630':
        raise ValueError('CMA storm identity mismatch')
    cycles = []
    for row in t[8]:
        if not row[11].get('BABJ'):
            continue
        issue = datetime.strptime(row[1], '%Y%m%d%H%M').replace(tzinfo=timezone.utc)
        if abs(issue.timestamp() * 1000 - row[2]) > 1000:
            raise ValueError('CMA UTC timestamp conflict')
        points = []
        for q in row[11]['BABJ']:
            if q[1] != row[1] or q[6] != 'BABJ':
                raise ValueError('CMA forecast issue/agency conflict')
            lead = int(q[0])
            if lead <= 0 or not -90 <= q[3] <= 90 or not -180 <= q[2] <= 180:
                raise ValueError('invalid CMA forecast point')
            points.append(dict(lead_h=lead, valid_time_utc=(issue+timedelta(hours=lead)).isoformat(),
                               lat_deg=q[3], lon_deg=q[2], vmax_ms=q[5], mslp_hpa=q[4]))
        if len({p['lead_h'] for p in points}) != len(points):
            raise ValueError('duplicate CMA forecast lead')
        cycles.append(dict(model_id='CMA / BABJ', forecast_kind='agency', agency_code='BABJ',
            issue_time_utc=issue.isoformat(), points=sorted(points,key=lambda p:p['lead_h']),
            anchor=dict(lat_deg=row[5],lon_deg=row[4]), source_url=url,
            raw_file_sha256=hashlib.sha256(text.encode()).hexdigest(),
            publication_time_known=False))
    if not cycles:
        raise ValueError('no CMA CHAMPI forecast cycles')
    latest = max(cycles,key=lambda p:p['issue_time_utc'])
    own = datetime.fromisoformat(own_issue.replace('Z','+00:00'))
    selected = [p for p in cycles if datetime.fromisoformat(p['issue_time_utc'])==own]
    if latest not in selected:
        selected.append(latest)
    return dict(checked_at_utc=checked,ok=True,source_url=url,paths=selected,
        note='CMA公开地图原始BABJ位置预报；逐行首次业务发布时间未知。仅保留原报时效，不外推缺失24h路径。')


def fetch_forecasts(own_issue, checked):
    def get(url):
        result = subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','30',url],
                                capture_output=True,text=True,check=True,timeout=35)
        return result.stdout
    rows = decode(get(BASE+'list_2026'))['typhoonList']
    hits = [r for r in rows if r[1].upper()=='CHAMPI' and str(r[4])=='2630']
    if len(hits)!=1:
        raise ValueError('ambiguous CMA CHAMPI identity')
    url=BASE+'view_'+str(hits[0][0])
    return parse_forecasts(get(url),checked,own_issue,url)


def attach(payload, checked):
    try:
        payload['agency_forecasts']=fetch_forecasts(payload['model']['input_last_valid_utc'],checked)
    except Exception:
        # Preserve the original version clock; a failed check cannot refresh it.
        previous=payload.get('agency_forecasts',{})
        payload['agency_forecasts']={**previous,'ok':False,'last_attempt_at_utc':checked,
            'error':'CMA forecast fetch/validation failed; previous timestamped paths retained'}
    return payload
