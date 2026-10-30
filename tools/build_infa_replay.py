"""Export observed positions from the exact public B-deck used in verification."""
import argparse,csv,hashlib,json,math
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def distance(a,b):
    p,q=map(math.radians,[a['lat'],b['lat']]);return 12742.0176*math.asin(min(1,math.sqrt(math.sin((q-p)/2)**2+math.cos(p)*math.cos(q)*math.sin(math.radians(b['lon']-a['lon'])/2)**2)))
def main():
    parser=argparse.ArgumentParser();parser.add_argument('bdeck',type=Path);args=parser.parse_args();assets=ROOT/'site/assets'
    src=json.loads((assets/'two-stage-0a-v2.json').read_text())['infa_live_update']['sources']['bdeck']
    raw=args.bdeck.read_bytes();assert hashlib.sha256(raw).hexdigest()==src['sha256'],'Wrong truth version'
    points={}
    for row in csv.reader(raw.decode().splitlines()):
        row=[x.strip() for x in row]
        if len(row)<8 or row[4]!='BEST':continue
        t=datetime.strptime(row[2],'%Y%m%d%H').replace(tzinfo=timezone.utc).isoformat()
        coord=lambda x:float(x[:-1])/10*(-1 if x[-1] in 'SW' else 1)
        p=dict(valid_at_utc=t,lat=coord(row[6]),lon=coord(row[7]))
        assert t not in points or points[t]==p,'Conflicting observed position';points[t]=p
    core=json.loads((assets/'two-stage-0a.json').read_text());ledger=json.loads((assets/'infa-prospective-results.json').read_text())
    c=core['storms']['INFA_2026']['cycles'][0]
    for r in ledger['all_verified']:
        if r['version']!='v1':continue
        target=datetime.fromisoformat(r['valid'].replace('Z','+00:00')).isoformat();truth=points[target]
        for model,col in [('T0','base_err_km'),('T1','corrected_err_km')]:
            p=next(q for path in c['paths'] if path['model']==model for q in path['points'] if q['lead_h']==r['lead_h'])
            assert abs(distance(p,truth)-r[col])<.02,'Ledger mismatch'
    out=dict(storm_id='INFA_2026',purpose='Retrospective verification overlay; never an input to frozen predictions',source_url=src['url'],source_sha256=src['sha256'],downloaded_at_utc=src['downloaded_at_utc'],observations=[points[k] for k in sorted(points)])
    (assets/'infa-replay-observations.json').write_text(json.dumps(out,indent=2)+'\n');print('Exported',len(points),'public observed positions; v1 ledger errors verified.')
if __name__=='__main__':main()
