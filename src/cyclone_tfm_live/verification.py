"""Append-only forecast snapshots confirmed on the public Git data branch.

No historical backfill is scored as prospective. Confirmation is conservative:
only a forecast fetched from an existing public commit *before* its target time
is eligible. The first subsequently observed UCAR fix is frozen for verification.
"""
import copy, hashlib, json
from datetime import datetime, timezone
from .publication import stamp


def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False)


def advance(previous, payload, checked=None):
    checked=checked or datetime.now(timezone.utc).isoformat()
    now=stamp(checked)
    ledger=copy.deepcopy(previous.get('verification') or dict(schema=1,started_at_utc=checked,records=[],truths={}))
    ledger['protocol']='Public Git snapshot confirmed before valid; exact storm/issue/lead/valid pairing; first subsequently retrieved UCAR truth; no backfill'
    known={r['id'] for r in ledger['records']}
    # These records came from a remote public commit, rather than this candidate.
    for r in ledger['records']:
        if 'confirmed_at_utc' not in r:
            r['confirmed_at_utc']=checked
            r['eligible']=now < stamp(r['valid_time_utc'])
            r['exclusion']=None if r['eligible'] else 'target reached before public confirmation'
    paths=payload['model']['paths']+payload.get('agency_forecasts',{}).get('paths',[])
    for p in paths:
        issue=stamp(p['issue_time_utc'])
        if issue>now:
            continue
        # Old/stale forecasts remain drawable, but are never registered as new
        # forward predictions once their target time has passed.
        for q in p['points']:
            valid=stamp(q['valid_time_utc'])
            if valid<=now:
                continue
            if (valid-issue).total_seconds()!=q['lead_h']*3600:
                raise ValueError('verification issue/lead/valid mismatch')
            snapshot=dict(storm_id=payload['storm_id'],model_id=p['model_id'],
                kind='agency' if p.get('forecast_kind')=='agency' else 'nwp' if p.get('model_raw_aid') else 'research',
                issue_time_utc=issue.isoformat(),valid_time_utc=valid.isoformat(),lead_h=q['lead_h'],
                lat_deg=q['lat_deg'],lon_deg=q['lon_deg'])
            for level in (80,90,95):
                key=f'radius_{level}_km'
                if key in q:
                    snapshot[key]=q[key]
            oid=hashlib.sha256(canonical(snapshot).encode()).hexdigest()
            if oid not in known:
                ledger['records'].append(dict(id=oid,recorded_at_utc=checked,
                    source_url=p.get('source_url'),source_sha256=p.get('raw_file_sha256'),
                    model_generated_at_utc=p.get('generated_at_utc') if snapshot['kind']=='research' else None,
                    calibration_n=q.get('calibration_n'),**snapshot));known.add(oid)
    # Never overwrite a truth with later best-track revisions.
    for q in payload.get('observations',[]):
        valid=stamp(q['valid_time_utc']);key=valid.isoformat()
        if stamp(ledger['started_at_utc'])<=valid<=now and key not in ledger['truths']:
            ledger['truths'][key]=dict(lat_deg=q['lat_deg'],lon_deg=q['lon_deg'],first_seen_at_utc=checked,
                source_sha256=payload.get('track_source',{}).get('sha256'),source='UCAR working B-deck; first observed version')
    prior=previous.get('verification')
    before={k:v for k,v in (prior or {}).items() if k!='updated_at_utc'}
    after={k:v for k,v in ledger.items() if k!='updated_at_utc'}
    ledger['updated_at_utc']=checked if before!=after else prior['updated_at_utc']
    return ledger
