"""Build a small, score-verified map export from existing public archives only."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math

ASSETS = Path(__file__).resolve().parents[1] / 'site' / 'assets'
MODELS = ['TabPFN CV-F2', 'TabPFN CV-F2 + C1', 'ATCF:CMC', 'ATCF:UKM', 'ATCF:NGX']
LEADS = [6, 12, 24, 48, 72]


def stamp(t):
    return datetime.fromisoformat(t.replace('Z', '+00:00')).timestamp()


def iso(t):
    return datetime.fromtimestamp(t, timezone.utc).isoformat().replace('+00:00', 'Z')


def distance(a, b):
    la, lb = math.radians(a['lat_deg']), math.radians(b['lat_deg'])
    dlat = lb - la
    dlon = math.radians(b['lon_deg'] - a['lon_deg'])
    return 2 * 6371.0088 * math.asin(min(1, math.sqrt(math.sin(dlat / 2)**2 + math.cos(la) * math.cos(lb) * math.sin(dlon / 2)**2)))


def build():
    names = ['champi-2026.json', 'motion-residual.json']
    raw = {n: (ASSETS / n).read_bytes() for n in names}
    archive, summary = [json.loads(raw[n]) for n in names]
    obs = {stamp(p['valid_time_utc']): p for p in archive['observations']}
    paths = {}
    for p in archive['paths']:
        model = 'ATCF:' + p['model_raw_aid'] if p.get('model_raw_aid') else p['model_id']
        paths.setdefault(model, []).append(p)
    cohorts = {}
    for h in LEADS:
        refs = [r for r in summary['external_common'] if r['lead_h'] == h]
        # Rebuild the ORIGINAL intersection across every archived candidate,
        # including arms that are not displayed as primary methods.
        candidates = {}
        for ref in refs:
            rows = {}
            for p in paths[ref['model_id']]:
                for q in p['points']:
                    key = (stamp(p['issue_time_utc']), stamp(q['valid_time_utc']))
                    if q['lead_h'] == h and key[1] in obs:
                        if key in rows:
                            raise ValueError('Ambiguous archived aid or forecast point')
                        rows[key] = q
            candidates[ref['model_id']] = rows
        common = set.intersection(*(set(r) for r in candidates.values()))
        for ref in refs:
            errors = [distance(candidates[ref['model_id']][k], obs[k[1]]) for k in common]
            assert len(errors) == ref['n']
            assert abs(sum(errors) / len(errors) - ref['mean_error_km']) < 1e-6
        cohorts[str(h)] = dict(n=len(common), issues=[iso(k[0]) for k in sorted(common)])
    cycles = []
    for issue in sorted({stamp(t) for c in cohorts.values() for t in c['issues']}):
        assert issue in obs
        selected = []
        for model in MODELS:
            source = [p for p in paths[model] if stamp(p['issue_time_utc']) == issue]
            assert len(source) == 1
            p = source[0]
            points = []
            for q in p['points']:
                point = {k: q[k] for k in ['lead_h', 'lat_deg', 'lon_deg']}
                point['valid_time_utc'] = iso(stamp(q['valid_time_utc']))
                if model.startswith('TabPFN'):
                    point.update({k: q[k] for k in ['radius_90_km', 'calibration_n'] if q.get(k) is not None})
                points.append(point)
            selected.append(dict(model_id=model, source_model_id=p['model_id'], points=points))
        history = [dict(valid_time_utc=iso(t), lat_deg=p['lat_deg'], lon_deg=p['lon_deg']) for t, p in sorted(obs.items()) if issue - 48 * 3600 <= t <= issue]
        truth = [dict(valid_time_utc=iso(t), lat_deg=p['lat_deg'], lon_deg=p['lon_deg']) for t, p in sorted(obs.items()) if issue < t <= issue + 72 * 3600]
        cycles.append(dict(issue_time_utc=iso(issue), anchor=[obs[issue]['lat_deg'], obs[issue]['lon_deg']], history=history, truth=truth, paths=selected))
    result = dict(version='guidance_paths_v1', scope='LOCKED_RETROSPECTIVE_COMMON_COHORT_NOT_LIVE', source_sha256={n: hashlib.sha256(raw[n]).hexdigest() for n in names}, cohorts=cohorts, cycles=cycles)
    dest = ASSETS / 'guidance-paths.json'
    dest.write_text(json.dumps(result, separators=(',', ':'), allow_nan=False) + '\n')
    print(f'Exported {len(cycles)} cycles; all 65 original aggregate scores reconstructed; {dest.stat().st_size} bytes')


if __name__ == '__main__':
    build()
